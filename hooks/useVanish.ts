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

const mergeTasks = (local: Task[], remote: Task[]): Task[] => {
  const taskMap = new Map<string, Task>();
  [...(local || []), ...(remote || [])].forEach(t => {
    const existing = taskMap.get(t.id);
    const tUpdated = t.updatedAt || t.createdAt || 0;
    const existingUpdated = existing ? (existing.updatedAt || existing.createdAt || 0) : -1;
    if (!existing || tUpdated > existingUpdated) {
      taskMap.set(t.id, t);
    }
  });
  return Array.from(taskMap.values());
};

const mergeStats = (local: Stats, remote: Stats): Stats => ({
  totalCompleted: Math.max(local.totalCompleted || 0, remote.totalCompleted || 0),
  totalExpired: Math.max(local.totalExpired || 0, remote.totalExpired || 0),
  totalSessions: Math.max(local.totalSessions || 0, remote.totalSessions || 0),
  fastestSessionMs: (local.fastestSessionMs && remote.fastestSessionMs) 
      ? Math.min(local.fastestSessionMs, remote.fastestSessionMs) 
      : (local.fastestSessionMs || remote.fastestSessionMs || null)
});

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
  const [manualSocketUrl, setManualSocketUrl] = useState<string>(() => localStorage.getItem('cipher_manual_ip') || '');
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
      return;
    }
    let url = trimmed;
    if (!url.startsWith('http')) url = `http://${url}`;
    if (!url.split('//')[1].includes(':')) url = `${url}:4040`;
    localStorage.setItem('cipher_manual_ip', url);
    setManualSocketUrl(url);
  }, []);

  const stateRef = useRef({ tasks, stats, lastBurnTime });
  useEffect(() => {
    stateRef.current = { tasks, stats, lastBurnTime };
  }, [tasks, stats, lastBurnTime]);

  // SOCKET INITIATION
  useEffect(() => {
    let socketUrl: string | undefined = manualSocketUrl || undefined;
    
    // Fallback to exactly match the host domain when spawned locally
    if (!manualSocketUrl && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'cipher.local')) {
      socketUrl = `http://${window.location.hostname}:4040`;
    }

    const socket = io(socketUrl, { reconnectionAttempts: 10, timeout: 5000 });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      
      if (syndicateMode) {
        const opId = localStorage.getItem('agent_codename') || 'GHOST';
        const activeCount = stateRef.current.tasks.filter(t => t.completedAt === null && !t.deletedAt && (!t.owner || t.owner === opId)).length;
        socket.emit('join_syndicate', { opId, activeTaskCount: activeCount });
      }

      socket.emit('update_state', { 
        tasks: stateRef.current.tasks, 
        stats: stateRef.current.stats,
        lastBurnTime: stateRef.current.lastBurnTime,
        syndicateMode
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setActiveNodes(1);
      setCoprocessor({ active: false, type: null, modelCount: 0 });
      setSquadNodes([]);
    });

    socket.on('node_status', (data: { online: boolean, activeNodes: number, networkIp?: string }) => {
      if (data.activeNodes) setActiveNodes(data.activeNodes);
      if (data.networkIp) setNetworkIp(data.networkIp);
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

    socket.on('sync_state', (serverState: any) => {
      if (!serverState) return;

      if (serverState.mode === 'SYNDICATE' && serverState.squadIntegrity !== undefined) {
        setSquadIntegrity(serverState.squadIntegrity);
      }

      if (serverState.lastBurnTime && serverState.lastBurnTime > stateRef.current.lastBurnTime) {
        setLastBurnTime(serverState.lastBurnTime);
        setTasksState([]);
        saveTasks([]);
        setDeployedState(false);
        if (localStorage.getItem('agent_codename')) {
           setView(AppView.TASKS);
        }
      } else if (serverState.tasks) {
        setTasksState(prev => {
          const validPrev = prev.filter(t => t.createdAt >= (serverState.lastBurnTime || stateRef.current.lastBurnTime));
          
          const codename = localStorage.getItem('agent_codename');
          // Filter incoming tasks securely based on mode to protect the local memory footprint
          const incomingTasks = syndicateMode 
            ? serverState.tasks.filter((t: Task) => t.syndicate)
            : serverState.tasks.filter((t: Task) => !t.owner || t.owner === codename);

          const merged = mergeTasks(validPrev, incomingTasks);
          if (JSON.stringify(merged) === JSON.stringify(prev)) return prev;
          saveTasks(merged);
          return merged;
        });
      }

      if (serverState.stats) {
        setStatsState(prev => {
          const merged = mergeStats(prev, serverState.stats);
          if (JSON.stringify(merged) === JSON.stringify(prev)) return prev;
          saveStats(merged);
          return merged;
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

    return () => { socket.disconnect(); };
  }, [playPing, setLastBurnTime, manualSocketUrl, setDeployedState, syndicateMode, playAlarm, playWarning, playSuccess, sendTransmission]);

  const setTasks = useCallback((newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    setTasksState((prev) => {
      const updated = typeof newTasks === 'function' ? newTasks(prev) : newTasks;
      saveTasks(updated);
      socketRef.current?.emit('update_state', { 
        tasks: updated, 
        stats: stateRef.current.stats,
        lastBurnTime: stateRef.current.lastBurnTime,
        syndicateMode
      });
      return updated;
    });
  }, [syndicateMode]);

  const setStats = useCallback((newStats: Stats | ((prev: Stats) => Stats)) => {
    setStatsState((prev) => {
      const updated = typeof newStats === 'function' ? newStats(prev) : newStats;
      saveStats(updated);
      socketRef.current?.emit('update_state', { 
        tasks: stateRef.current.tasks, 
        stats: updated,
        lastBurnTime: stateRef.current.lastBurnTime,
        syndicateMode
      });
      return updated;
    });
  }, [syndicateMode]);

  const checkExpiry = useCallback(() => {
    // If in Syndicate mode, let the Host Server execute M.A.D rules instead of local deletes
    if (syndicateMode) return; 

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
  }, [setTasks, setStats, sendTransmission, playWarning, playAlarm, syndicateMode]);

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
        owner: codename,
        status: 'ACTIVE',
        syndicate: syndicateMode
      };
      return [...prev, newTask];
    });
  }, [setTasks, manualPanic, syndicateMode]);

  // SYNDICATE ACTIONS
  const acceptDirective = useCallback((task: Task) => {
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
  }, []);

  const rejectDirective = useCallback((task: Task) => {
    socketRef.current?.emit('reject_directive', { handler: task.handler, taskId: task.id, text: task.text });
    setIncomingDirective(null);
    setView(AppView.TASKS);
  }, []);

  const requestVerification = useCallback((taskId: string) => {
    socketRef.current?.emit('request_verification', taskId);
  }, []);

  const verifyKill = useCallback((taskId: string) => {
    socketRef.current?.emit('confirm_kill', taskId);
  }, []);

  const denyKill = useCallback((taskId: string) => {
    socketRef.current?.emit('deny_kill', taskId);
  }, []);

  // Standard Actions modified for Two-Key turn
  const completeTask = useCallback((id: string) => {
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
  }, [setTasks, setStats, activeTargetId, tasks, syndicateMode, requestVerification]);

  const deleteTask = useCallback((id: string) => {
    const now = Date.now();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, deletedAt: now, updatedAt: now } : t)));
    if (activeTargetId === id) { setView(AppView.TASKS); setActiveTargetId(null); }
  }, [setTasks, activeTargetId]);

  const deployOperation = useCallback(() => { playKeystroke(); setDeployedState(true); }, [playKeystroke, setDeployedState]);
  const engageTarget = useCallback((id: string) => { playKeystroke(); setActiveTargetId(id); setView(AppView.ENGAGED); }, [playKeystroke]);
  const disengageTarget = useCallback(() => { playKeystroke(); setActiveTargetId(null); setView(AppView.TASKS); }, [playKeystroke]);
  
  const acknowledgeExpiry = useCallback(() => { setView(AppView.TASKS); setExpiredCount(0); }, []);
  const keepApp = useCallback(() => { setTasks([]); setView(AppView.TASKS); setDeployedState(false); }, [setTasks, setDeployedState]);
  
  const letItGo = useCallback(() => {
    exportMissionReport(stateRef.current.tasks, stateRef.current.stats, destructReason);
    const now = Date.now();
    setLastBurnTime(now);
    setTasks([]); 
    setDeployedState(false);
    setView(AppView.DESTRUCTED); 
    const codename = localStorage.getItem('agent_codename') || 'GHOST';
    socketRef.current?.emit('initiate_burn', { reason: destructReason, syndicateMode, opId: codename });
  }, [setTasks, destructReason, setLastBurnTime, setDeployedState, syndicateMode]);

  // Handle M.A.D wipe cleanly without echoing an initiate_burn storm
  const finishGlobalWipe = useCallback(() => {
    setDeployedState(false);
    setView(AppView.DESTRUCTED);
    setDestructReason(DestructReason.MARGINAL_CLEAR);
  }, [setDeployedState]);

  const terminateServer = useCallback(() => { socketRef.current?.emit('terminate_host_process'); }, []);

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
    stats, expiredCount, completedSessionCount, isConnected, activeNodes, networkIp, coprocessor,
    destructReason, handlerMessage, incomingCallText, isDeployed, activeTargetId,
    syndicateMode, squadIntegrity, squadNodes, incomingDirective, globalWipeCulprit,
    addTask, completeTask, deleteTask, deployOperation, engageTarget, disengageTarget,
    acknowledgeExpiry, keepApp, letItGo, finishGlobalWipe, manualPanic, terminateServer, enterOnboarding, finishOnboarding, acknowledgeCall, setManualIp,
    acceptDirective, rejectDirective, requestVerification, verifyKill, denyKill
  };
};
