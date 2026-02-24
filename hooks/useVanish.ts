import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Task, Stats, AppView, CoprocessorStatus, DestructReason, HandlerMessage, NetworkNode, TaskStatus } from '../types';
import { EXPIRY_MS, MAX_TASKS, MS_PER_DAY, MAX_INTEGRITY } from '../constants';
import { loadTasks, saveTasks, loadStats, saveStats } from '../utils/storage';
import { useNotifications } from './useNotifications';
import { useCyberAudio } from './useCyberAudio';

interface UseVanishReturn {
  view: AppView;
  tasks: Task[];
  stats: Stats;
  expiredCount: number;
  completedSessionCount: number;
  isConnected: boolean;
  activeNodes: number;
  networkIp: string;
  authoritativeHostUrl: string;
  joinIpUrl: string;
  manualIpError: string | null;
  mutationsLocked: boolean;
  coprocessor: CoprocessorStatus;
  destructReason: DestructReason;
  handlerMessage: HandlerMessage | null;
  incomingCallText: string;
  isDeployed: boolean;
  activeTargetId: string | null;
  
  // Syndicate Additions
  syndicateMode: boolean;
  squadIntegrity: number;
  squadNodes: NetworkNode[];
  incomingDirective: Task | null;
  globalWipeCulprit: string | null;
  
  addTask: (text: string) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  deployOperation: () => void;
  engageTarget: (id: string) => void;
  disengageTarget: () => void;
  acknowledgeExpiry: () => void;
  keepApp: () => void;
  letItGo: () => void;
  finishGlobalWipe: () => void;
  manualPanic: () => void;
  terminateServer: () => void;
  enterOnboarding: () => void;
  finishOnboarding: (codename: string, joinSyndicate?: boolean) => void;
  acknowledgeCall: () => void;
  setManualIp: (ip: string) => void;
  
  // Syndicate Actions
  acceptDirective: (task: Task) => void;
  rejectDirective: (task: Task) => void;
  requestVerification: (taskId: string) => void;
  verifyKill: (taskId: string) => void;
  denyKill: (taskId: string) => void;
}

const exportMissionReport = (tasksToExport: Task[], statsToExport: Stats, reason: string) => {
  const codename = localStorage.getItem('agent_codename') || 'GHOST';
  const date = new Date().toISOString();
  const sessionTasks = tasksToExport.filter(t => !t.deletedAt);
  
  let report = `===================================================\n`;
  report += `CIPHER.SYS // POST-MISSION DEBRIEFING\n`;
  report += `===================================================\n`;
  report += `OP-ID: ${codename}\n`;
  report += `DATE: ${date}\n`;
  report += `OUTCOME: ${reason}\n\n`;
  
  report += `[ LIFETIME TELEMETRY ]\n`;
  report += `- Targets Neutralized: ${statsToExport.totalCompleted}\n`;
  report += `- Assets Purged: ${statsToExport.totalExpired}\n`;
  report += `- Sessions Conquered: ${statsToExport.totalSessions}\n\n`;
  
  report += `[ SESSION LOG ]\n`;
  if (sessionTasks.length === 0) {
    report += `No active assets recorded in this sector.\n`;
  } else {
    sessionTasks.forEach(t => {
      const status = t.completedAt ? `[X] COMPLETED (${new Date(t.completedAt).toLocaleTimeString()})` : `[ ] ABANDONED`;
      report += `${status} - ${t.text}\n`;
    });
  }
  report += `===================================================\n`;
  report += `END OF LINE.\n`;

  try {
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CIPHER_REPORT_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (e) {
    console.error("Failed to export mission report via synthetic click", e);
    try {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html style="background:#000;color:#0f0;font-family:monospace;padding:20px;line-height:1.5;">
            <head><title>CIPHER_REPORT</title><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
            <body><pre style="white-space:pre-wrap;word-wrap:break-word;">${report}</pre></body>
          </html>
        `);
      } else {
        alert("REPORT SECURED:\n\n" + report.substring(0, 300) + "...\n\n[POP-UP BLOCKED BY OS]");
      }
    } catch (fallbackError) {
      console.error("Fallback export failed", fallbackError);
    }
  }
};

const normalizeAuthorityUrl = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let target = trimmed;
  if (!/^https?:\/\//i.test(target)) {
    target = `http://${target}`;
  }
  try {
    const url = new URL(target);
    const protocol = url.protocol === 'https:' ? 'https:' : 'http:';
    const port = url.port || '4040';
    return `${protocol}//${url.hostname}:${port}`;
  } catch (_) {
    return null;
  }
};

const normalizeManualSocketTarget = (raw: string): string | null => normalizeAuthorityUrl(raw);

export const useVanish = (): UseVanishReturn => {
  const [tasks, setTasksState] = useState<Task[]>(loadTasks);
  const [stats, setStatsState] = useState<Stats>(loadStats);
  const [lastBurnTime, setLastBurnTimeState] = useState<number>(() => {
    const stored = localStorage.getItem('vanish_last_burn');
    return stored ? parseInt(stored) : 0;
  });

  const [isDeployed, setIsDeployed] = useState<boolean>(() => localStorage.getItem('vanish_is_deployed') === 'true');
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);

  const [view, setView] = useState<AppView>(() => localStorage.getItem('agent_codename') ? AppView.TASKS : AppView.LANDING);
  
  // Base Variables
  const [expiredCount, setExpiredCount] = useState<number>(0);
  const [completedSessionCount, setCompletedSessionCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeNodes, setActiveNodes] = useState<number>(1);
  const [networkIp, setNetworkIp] = useState<string>('');
  const [authoritativeHostUrl, setAuthoritativeHostUrl] = useState<string>(() => normalizeAuthorityUrl(window.location.origin) || 'http://localhost:4040');
  const [joinIpUrl, setJoinIpUrl] = useState<string>('');
  const [manualSocketUrl, setManualSocketUrl] = useState<string>(() => localStorage.getItem('cipher_manual_ip') || '');
  const [manualIpError, setManualIpError] = useState<string | null>(null);
  const [isAuthoritativeReady, setIsAuthoritativeReady] = useState<boolean>(false);
  const [coprocessor, setCoprocessor] = useState<CoprocessorStatus>({ active: false, type: null, modelCount: 0 });
  const [destructReason, setDestructReason] = useState<DestructReason>(DestructReason.MANUAL_BURN);
  const [handlerMessage, setHandlerMessage] = useState<HandlerMessage | null>(null);
  const [incomingCallText, setIncomingCallText] = useState<string>('');

  // Syndicate Protocol Variables
  const [syndicateMode, setSyndicateMode] = useState<boolean>(() => localStorage.getItem('cipher_syndicate_mode') === 'true');
  const [squadIntegrity, setSquadIntegrity] = useState<number>(MAX_INTEGRITY);
  const [squadNodes, setSquadNodes] = useState<NetworkNode[]>([]);
  const [incomingDirective, setIncomingDirective] = useState<Task | null>(null);
  const [globalWipeCulprit, setGlobalWipeCulprit] = useState<string | null>(null);
  
  const { sendTransmission } = useNotifications();
  const { playPing, playWarning, playAlarm, playKeystroke, playSuccess } = useCyberAudio();
  const lastStatusReportMs = useRef<number>(Date.now());
  const socketRef = useRef<Socket | null>(null);
  const hasAuthoritativeSyncRef = useRef<boolean>(false);
  
  const setLastBurnTime = useCallback((time: number) => {
    setLastBurnTimeState(time);
    localStorage.setItem('vanish_last_burn', time.toString());
  }, []);

  const setDeployedState = useCallback((state: boolean) => {
    setIsDeployed(state);
    localStorage.setItem('vanish_is_deployed', state.toString());
  }, []);

  useEffect(() => {
    const activeTasks = tasks.filter(t => t.completedAt === null && !t.deletedAt);
    if (activeTasks.length === 0 && isDeployed) {
      setDeployedState(false);
    }
  }, [tasks, isDeployed, setDeployedState]);

  const setManualIp = useCallback((ip: string) => {
    const trimmed = ip.trim();
    if (!trimmed) {
      localStorage.removeItem('cipher_manual_ip');
      setManualSocketUrl('');
      setManualIpError(null);
      return;
    }

    const normalized = normalizeManualSocketTarget(trimmed);
    if (!normalized) {
      setManualIpError('Invalid host/IP format. Example: 192.168.1.5');
      return;
    }

    localStorage.setItem('cipher_manual_ip', normalized);
    setManualSocketUrl(normalized);
    setManualIpError(null);
  }, []);

  const stateRef = useRef({ tasks, stats, lastBurnTime });
  useEffect(() => {
    stateRef.current = { tasks, stats, lastBurnTime };
  }, [tasks, stats, lastBurnTime]);

  const mutationsLocked = !isConnected || !isAuthoritativeReady;

  const requireAuthoritativeLink = useCallback((): boolean => {
    if (!mutationsLocked) return true;
    playWarning();
    sendTransmission(
      'SYNC LOCKED',
      'Reconnect to authoritative host. Use IP OVERRIDE if cipher.local is unavailable.',
      'decay-warning'
    );
    return false;
  }, [mutationsLocked, playWarning, sendTransmission]);

  // SOCKET INITIATION
  useEffect(() => {
    let socketUrl: string | undefined = manualSocketUrl || undefined;
    
    // Fallback to exactly match the host domain when spawned locally
    if (!manualSocketUrl && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'cipher.local')) {
      socketUrl = `http://${window.location.hostname}:4040`;
    }
    const initialAuthority = normalizeAuthorityUrl(socketUrl || window.location.origin) || 'http://localhost:4040';
    setAuthoritativeHostUrl(initialAuthority);
    hasAuthoritativeSyncRef.current = false;
    setIsAuthoritativeReady(false);

    const socket = io(socketUrl, { reconnectionAttempts: 10, timeout: 5000 });
    socketRef.current = socket;

    const loadDiscovery = async (baseUrl: string) => {
      try {
        const response = await fetch(`${baseUrl}/api/discovery`);
        if (!response.ok) return;
        const payload = await response.json();
        if (typeof payload.activeNodes === 'number') setActiveNodes(payload.activeNodes);
        if (payload.networkIp) {
          setNetworkIp(payload.networkIp);
          setJoinIpUrl(`http://${payload.networkIp}:4040`);
        }
        if (payload.join?.ip) {
          setJoinIpUrl(String(payload.join.ip));
        }
      } catch (_) {
        // no-op
      }
    };

    socket.on('connect', () => {
      setIsConnected(true);
      setManualIpError(null);
      const managerAny = socket.io as unknown as { uri?: string };
      const connectedAuthority = normalizeAuthorityUrl(managerAny.uri || initialAuthority) || initialAuthority;
      setAuthoritativeHostUrl(connectedAuthority);
      void loadDiscovery(connectedAuthority);
      
      if (syndicateMode) {
        const opId = localStorage.getItem('agent_codename') || 'GHOST';
        const activeCount = stateRef.current.tasks.filter(t => t.completedAt === null && !t.deletedAt && (!t.owner || t.owner === opId)).length;
        socket.emit('join_syndicate', { opId, activeTaskCount: activeCount });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsAuthoritativeReady(false);
      hasAuthoritativeSyncRef.current = false;
      setActiveNodes(1);
      setCoprocessor({ active: false, type: null, modelCount: 0 });
      setSquadNodes([]);
    });

    socket.on('node_status', (data: { online: boolean, activeNodes: number, networkIp?: string }) => {
      if (typeof data.activeNodes === 'number') setActiveNodes(data.activeNodes);
      if (data.networkIp) {
        setNetworkIp(data.networkIp);
        setJoinIpUrl(`http://${data.networkIp}:4040`);
      }
    });

    socket.on('coprocessor_status', (status: CoprocessorStatus) => setCoprocessor(status));
    
    socket.on('handler_message', (msg: HandlerMessage) => {
      setHandlerMessage(msg);
      playPing();
    });

    socket.on('incoming_call', (data: { taskId: string, text: string }) => {
      setIncomingCallText(data.text);
      setView(AppView.INCOMING_CALL);
    });

    // SYNDICATE PROTOCOL LISTENERS
    socket.on('squad_update', (nodes: NetworkNode[]) => setSquadNodes(nodes));
    
    socket.on('incoming_directive', (task: Task) => {
      playAlarm();
      setIncomingDirective(task);
      setView(AppView.INCOMING_DIRECTIVE);
    });

    socket.on('delegation_rejected', (msg: string) => {
      alert(msg);
      playWarning();
    });

    socket.on('verify_required', (task: Task) => {
      playPing();
      sendTransmission('VERIFICATION REQUIRED', `Assignee requires kill confirmation for: ${task.text}`, 'mission-log');
    });

    socket.on('kill_denied', (task: Task) => {
      playAlarm();
      sendTransmission('DIRECTIVE REJECTED', `Handler rejected neutralization of: ${task.text}`, 'decay-warning');
    });

    socket.on('kill_confirmed', (task: Task) => {
      playSuccess();
      sendTransmission('KILL CONFIRMED', `Handler verified neutralization. Asset purged.`, 'mission-log');
    });

    socket.on('integrity_strike', (data: { currentIntegrity: number }) => {
      setSquadIntegrity(data.currentIntegrity);
      playWarning();
      sendTransmission('SQUAD INTEGRITY COMPROMISED', `A directive suffered thermal decay. Shields remaining: ${data.currentIntegrity}`, 'decay-warning');
    });

    socket.on('global_scorched_earth', (data: { culprit: string }) => {
      if (!syndicateMode) return;
      setGlobalWipeCulprit(data.culprit);
      setView(AppView.GLOBAL_WIPE);
      setLastBurnTime(Date.now());
      setTasksState([]);
      saveTasks([]);
    });

    socket.on('host_terminating', (data: { reason?: DestructReason | string }) => {
      setTasksState([]);
      saveTasks([]);
      setDeployedState(false);
      const incomingReason = data?.reason;
      const normalizedReason =
        incomingReason === DestructReason.OPTIMAL_CLEAR ||
        incomingReason === DestructReason.MARGINAL_CLEAR ||
        incomingReason === DestructReason.MANUAL_BURN
          ? incomingReason
          : DestructReason.MANUAL_BURN;
      setDestructReason(normalizedReason);
      setView(AppView.DESTRUCTED);
    });

    socket.on('sync_state', (serverState: any) => {
      if (!serverState) return;
      hasAuthoritativeSyncRef.current = true;
      setIsAuthoritativeReady(true);

      if (serverState.mode === 'SYNDICATE' && serverState.squadIntegrity !== undefined) {
        setSquadIntegrity(serverState.squadIntegrity);
      }

      if (serverState.lastBurnTime && serverState.lastBurnTime > stateRef.current.lastBurnTime) {
        setLastBurnTime(serverState.lastBurnTime);
        setDeployedState(false);
        if (localStorage.getItem('agent_codename')) {
           setView(AppView.TASKS);
        }
      }

      const incomingTasks: Task[] = Array.isArray(serverState.tasks)
        ? serverState.tasks
        : [];
      const scopedTasks = syndicateMode
        ? incomingTasks.filter((task) => task.syndicate)
        : incomingTasks;

      setTasksState(() => {
        saveTasks(scopedTasks);
        return scopedTasks;
      });

      if (serverState.stats) {
        setStatsState(() => {
          saveStats(serverState.stats);
          return serverState.stats;
        });
      }
    });

    socket.on('execute_kill', (reason?: DestructReason) => {
      if (!syndicateMode) return; // Lone wolves do not die when the squad burns
      exportMissionReport(stateRef.current.tasks, stateRef.current.stats, reason || DestructReason.MANUAL_BURN);
      setLastBurnTime(Date.now());
      setTasksState([]);
      saveTasks([]);
      setDeployedState(false);
      setDestructReason(reason || DestructReason.MANUAL_BURN);
      setView(AppView.DESTRUCTED);
    });

    return () => {
      socket.disconnect();
      hasAuthoritativeSyncRef.current = false;
      setIsAuthoritativeReady(false);
    };
  }, [playPing, setLastBurnTime, manualSocketUrl, setDeployedState, syndicateMode, playAlarm, playWarning, playSuccess, sendTransmission]);

  const setTasks = useCallback((newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    setTasksState((prev) => {
      const updated = typeof newTasks === 'function' ? newTasks(prev) : newTasks;
      saveTasks(updated);
      if (socketRef.current?.connected && hasAuthoritativeSyncRef.current) {
        socketRef.current.emit('update_state', { 
          tasks: updated, 
          stats: stateRef.current.stats,
          lastBurnTime: stateRef.current.lastBurnTime,
          syndicateMode
        });
      }
      return updated;
    });
  }, [syndicateMode]);

  const setStats = useCallback((newStats: Stats | ((prev: Stats) => Stats)) => {
    setStatsState((prev) => {
      const updated = typeof newStats === 'function' ? newStats(prev) : newStats;
      saveStats(updated);
      if (socketRef.current?.connected && hasAuthoritativeSyncRef.current) {
        socketRef.current.emit('update_state', { 
          tasks: stateRef.current.tasks, 
          stats: updated,
          lastBurnTime: stateRef.current.lastBurnTime,
          syndicateMode
        });
      }
      return updated;
    });
  }, [syndicateMode]);

  const checkExpiry = useCallback(() => {
    // If in Syndicate mode, let the Host Server execute M.A.D rules instead of local deletes
    if (syndicateMode) return; 
    if (mutationsLocked) return;

    const now = Date.now();
    setTasks((prevTasks) => {
      let changed = false;
      const updatedTasks = prevTasks.map((t) => {
        if (t.completedAt === null && !t.deletedAt && (now - t.createdAt > EXPIRY_MS)) {
          changed = true;
          return { ...t, deletedAt: now, updatedAt: now };
        }
        return t;
      });

      if (changed) {
        const newlyExpired = updatedTasks.filter(t => t.deletedAt === now && t.updatedAt === now).length;
        setExpiredCount(newlyExpired);
        setView(AppView.EXPIRED_NOTICE);
        setStats((prev) => ({ ...prev, totalExpired: prev.totalExpired + newlyExpired }));
        playAlarm();
        sendTransmission('ASSET PURGED', `[CRITICAL] ${newlyExpired} asset(s) reached maximum thermal threshold.`, 'asset-purged');
      }

      const validTasks = updatedTasks.filter(t => !t.deletedAt);
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      if (now - lastStatusReportMs.current > TWO_HOURS && validTasks.length > 0) {
        lastStatusReportMs.current = now;
        const criticalTasks = validTasks.filter(t => t.completedAt === null && (EXPIRY_MS - (now - t.createdAt)) < TWO_HOURS);
        if (criticalTasks.length > 0) {
          playWarning();
          sendTransmission('CRITICAL DECAY', `[ACTION REQUIRED] ${criticalTasks.length} asset(s) facing imminent thermal wipe. Execute.`, 'decay-warning');
        }
      }
      return changed ? updatedTasks : prevTasks;
    });
  }, [setTasks, setStats, sendTransmission, playWarning, playAlarm, syndicateMode, mutationsLocked]);

  useEffect(() => { checkExpiry(); }, []);
  useEffect(() => {
    const interval = setInterval(() => { 
      if (view === AppView.TASKS || view === AppView.ENGAGED) checkExpiry(); 
    }, 60000);
    return () => clearInterval(interval);
  }, [checkExpiry, view]);

  const manualPanic = useCallback(() => {
    setDestructReason(DestructReason.MANUAL_BURN);
    setView(AppView.DESTRUCTING);
    sendTransmission('SCORCHED EARTH', 'Manual override authorized.', 'scorched-earth');
  }, [sendTransmission]);

  useEffect(() => {
    if (view !== AppView.TASKS && view !== AppView.ENGAGED) return;

    const codename = localStorage.getItem('agent_codename') || 'GHOST';
    
    // Squad wipe evaluates all squad tasks. Lone wolf wipe evaluates only their own tasks.
    const myTasks = syndicateMode 
      ? tasks.filter(t => !t.deletedAt && t.syndicate) 
      : tasks.filter(t => !t.deletedAt && (!t.owner || t.owner === codename));

    const hasTasks = myTasks.length > 0;
    const allCompleted = hasTasks && myTasks.every((t) => t.completedAt !== null && t.status !== 'PENDING_VERIFICATION');

    if (allCompleted) {
      const sessionStartMs = Math.min(...myTasks.map(t => t.createdAt));
      const durationMs = Date.now() - sessionStartMs;
      const maxTaskAge = Math.max(...myTasks.map(t => (t.completedAt || Date.now()) - t.createdAt));
      const optimalThreshold = 2 * MS_PER_DAY;
      
      const computedReason = maxTaskAge < optimalThreshold ? DestructReason.OPTIMAL_CLEAR : DestructReason.MARGINAL_CLEAR;

      setDestructReason(computedReason);
      setCompletedSessionCount(myTasks.length);
      setView(AppView.DESTRUCTING);
      sendTransmission('SCORCHED EARTH', 'All targets neutralized. Initiating wipe.', 'scorched-earth');
      
      setStats((prev) => {
        const prevFastest = prev.fastestSessionMs;
        const newFastest = prevFastest === null || prevFastest === undefined ? durationMs : Math.min(prevFastest, durationMs);
        return { ...prev, totalSessions: prev.totalSessions + 1, fastestSessionMs: newFastest };
      });
    }
  }, [tasks, view, setStats, sendTransmission, syndicateMode]);

  const addTask = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (trimmed.toUpperCase() === '/BURN' || trimmed.toUpperCase() === 'EXECUTE ORDER 66') {
      manualPanic(); return;
    }

    if (!requireAuthoritativeLink()) return;

    const codename = localStorage.getItem('agent_codename') || 'GHOST';

    // Syndicate: Cross-Node Delegation Detection
    if (syndicateMode && trimmed.startsWith('@')) {
      const match = trimmed.match(/^@([a-zA-Z0-9_-]+)\s+(.+)$/);
      if (match) {
        const targetOpId = match[1].toUpperCase();
        const payloadText = match[2];
        socketRef.current?.emit('delegate_directive', { targetOpId, text: payloadText, handler: codename });
        return; // Intercepted, do not add locally.
      }
    }

    setTasks((prev) => {
      // Limit check only applies to tasks OWNED by the local user.
      const activeCount = prev.filter(t => t.completedAt === null && !t.deletedAt && (!t.owner || t.owner === codename)).length;
      if (activeCount >= MAX_TASKS) return prev;
      
      const now = Date.now();
      const newTask: Task = { 
        id: crypto.randomUUID ? crypto.randomUUID() : now.toString(), 
        text: trimmed, 
        createdAt: now, 
        completedAt: null,
        updatedAt: now,
        deletedAt: null,
        owner: syndicateMode ? codename : null,
        status: 'ACTIVE',
        syndicate: syndicateMode
      };
      return [...prev, newTask];
    });
  }, [setTasks, manualPanic, syndicateMode, requireAuthoritativeLink]);

  // SYNDICATE ACTIONS
  const acceptDirective = useCallback((task: Task) => {
    if (!requireAuthoritativeLink()) return;

    // Just-in-Time Capacity Verification to prevent modal bypass
    const codename = localStorage.getItem('agent_codename') || 'GHOST';
    const activeCount = stateRef.current.tasks.filter(t => t.completedAt === null && !t.deletedAt && (!t.owner || t.owner === codename)).length;
    
    if (activeCount >= MAX_TASKS) {
      alert("[!] CAPACITY REACHED. Directive automatically bounced to sender.");
      socketRef.current?.emit('reject_directive', { handler: task.handler, taskId: task.id, text: task.text });
      setIncomingDirective(null);
      setView(AppView.TASKS);
      return;
    }

    socketRef.current?.emit('accept_directive', task);
    setIncomingDirective(null);
    setView(AppView.TASKS);
  }, [requireAuthoritativeLink]);

  const rejectDirective = useCallback((task: Task) => {
    if (!requireAuthoritativeLink()) return;
    socketRef.current?.emit('reject_directive', { handler: task.handler, taskId: task.id, text: task.text });
    setIncomingDirective(null);
    setView(AppView.TASKS);
  }, [requireAuthoritativeLink]);

  const requestVerification = useCallback((taskId: string) => {
    if (!requireAuthoritativeLink()) return;
    socketRef.current?.emit('request_verification', taskId);
  }, [requireAuthoritativeLink]);

  const verifyKill = useCallback((taskId: string) => {
    if (!requireAuthoritativeLink()) return;
    socketRef.current?.emit('confirm_kill', taskId);
  }, [requireAuthoritativeLink]);

  const denyKill = useCallback((taskId: string) => {
    if (!requireAuthoritativeLink()) return;
    socketRef.current?.emit('deny_kill', taskId);
  }, [requireAuthoritativeLink]);

  // Standard Actions modified for Two-Key turn
  const completeTask = useCallback((id: string) => {
    if (!requireAuthoritativeLink()) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Two-Key turn enforcement
    if (syndicateMode && task.handler && task.handler !== localStorage.getItem('agent_codename')) {
      requestVerification(id);
      if (activeTargetId === id) { setView(AppView.TASKS); setActiveTargetId(null); }
      return;
    }

    const now = Date.now();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completedAt: now, updatedAt: now, status: 'NEUTRALIZED' } : t)));
    setStats((prev) => ({ ...prev, totalCompleted: prev.totalCompleted + 1 }));
    setHandlerMessage(null);
    
    if (activeTargetId === id) { setView(AppView.TASKS); setActiveTargetId(null); }
  }, [setTasks, setStats, activeTargetId, tasks, syndicateMode, requestVerification, requireAuthoritativeLink]);

  const deleteTask = useCallback((id: string) => {
    if (!requireAuthoritativeLink()) return;
    const now = Date.now();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, deletedAt: now, updatedAt: now } : t)));
    if (activeTargetId === id) { setView(AppView.TASKS); setActiveTargetId(null); }
  }, [setTasks, activeTargetId, requireAuthoritativeLink]);

  const deployOperation = useCallback(() => { playKeystroke(); setDeployedState(true); }, [playKeystroke, setDeployedState]);
  const engageTarget = useCallback((id: string) => { playKeystroke(); setActiveTargetId(id); setView(AppView.ENGAGED); }, [playKeystroke]);
  const disengageTarget = useCallback(() => { playKeystroke(); setActiveTargetId(null); setView(AppView.TASKS); }, [playKeystroke]);
  
  const acknowledgeExpiry = useCallback(() => { setView(AppView.TASKS); setExpiredCount(0); }, []);
  const keepApp = useCallback(() => {
    if (!requireAuthoritativeLink()) return;
    setTasks([]);
    setView(AppView.TASKS);
    setDeployedState(false);
  }, [setTasks, setDeployedState, requireAuthoritativeLink]);
  
  const letItGo = useCallback(() => {
    if (!requireAuthoritativeLink()) return;
    exportMissionReport(stateRef.current.tasks, stateRef.current.stats, destructReason);
    const now = Date.now();
    setLastBurnTime(now);
    setTasks([]); 
    setDeployedState(false);
    setView(AppView.DESTRUCTED); 
    const codename = localStorage.getItem('agent_codename') || 'GHOST';
    socketRef.current?.emit('initiate_burn', { reason: destructReason, syndicateMode, opId: codename });
  }, [setTasks, destructReason, setLastBurnTime, setDeployedState, syndicateMode, requireAuthoritativeLink]);

  // Handle M.A.D wipe cleanly without echoing an initiate_burn storm
  const finishGlobalWipe = useCallback(() => {
    setDeployedState(false);
    setView(AppView.DESTRUCTED);
    setDestructReason(DestructReason.MARGINAL_CLEAR);
  }, [setDeployedState]);

  const terminateServer = useCallback(() => {
    if (!requireAuthoritativeLink()) return;
    socketRef.current?.emit('terminate_host_process');
  }, [requireAuthoritativeLink]);

  const enterOnboarding = useCallback(() => {
    setView(AppView.IDENTIFY);
  }, []);

  const finishOnboarding = useCallback((codename: string, joinSyndicate: boolean = false) => {
    localStorage.setItem('agent_codename', codename);
    localStorage.setItem('cipher_syndicate_mode', joinSyndicate.toString());
    setSyndicateMode(joinSyndicate);
    
    if (joinSyndicate && socketRef.current) {
      socketRef.current.emit('join_syndicate', { opId: codename, activeTaskCount: 0 }); // Local limit check naturally triggers after state syncs
    }
    
    setView(AppView.TASKS);
  }, []);

  const acknowledgeCall = useCallback(() => { setView(AppView.TASKS); }, []);

  return {
    view, tasks: tasks.filter(t => !t.deletedAt), 
    stats, expiredCount, completedSessionCount, isConnected, activeNodes, networkIp, authoritativeHostUrl, joinIpUrl, manualIpError, mutationsLocked, coprocessor,
    destructReason, handlerMessage, incomingCallText, isDeployed, activeTargetId,
    syndicateMode, squadIntegrity, squadNodes, incomingDirective, globalWipeCulprit,
    addTask, completeTask, deleteTask, deployOperation, engageTarget, disengageTarget,
    acknowledgeExpiry, keepApp, letItGo, finishGlobalWipe, manualPanic, terminateServer, enterOnboarding, finishOnboarding, acknowledgeCall, setManualIp,
    acceptDirective, rejectDirective, requestVerification, verifyKill, denyKill
  };
};
