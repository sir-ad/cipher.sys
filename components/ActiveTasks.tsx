import React, { useState, useRef } from 'react';
import { Task, CoprocessorStatus, HandlerMessage, NetworkNode } from '../types';
import { MAX_TASKS } from '../constants';
import { TaskItem } from './TaskItem';
import { TaskInput } from './TaskInput';
import { EmptyState } from './EmptyState';
import { useNotifications } from '../hooks/useNotifications';
import { useCyberAudio } from '../hooks/useCyberAudio';

interface ActiveTasksProps {
  tasks: Task[];
  isConnected: boolean;
  activeNodes: number;
  networkIp: string;
  coprocessor: CoprocessorStatus;
  handlerMessage: HandlerMessage | null;
  isDeployed: boolean;
  syndicateMode?: boolean;
  squadIntegrity?: number;
  squadNodes?: NetworkNode[];
  onAddTask: (text: string) => void;
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeploy: () => void;
  onEngage: (id: string) => void;
  onPanic: () => void;
  onSetManualIp: (ip: string) => void;
  verifyKill?: (id: string) => void;
  denyKill?: (id: string) => void;
}

export const ActiveTasks: React.FC<ActiveTasksProps> = ({
  tasks,
  isConnected,
  activeNodes,
  networkIp,
  coprocessor,
  handlerMessage,
  isDeployed,
  syndicateMode = false,
  squadIntegrity = 3,
  squadNodes = [],
  onAddTask,
  onCompleteTask,
  onDeleteTask,
  onDeploy,
  onEngage,
  onPanic,
  onSetManualIp,
  verifyKill,
  denyKill
}) => {
  const [codename, setCodename] = useState(() => localStorage.getItem('agent_codename') || 'GHOST');
  
  // Tactical Filters
  const myActiveTasks = tasks.filter((t) => t.completedAt === null && (!t.owner || t.owner === codename));
  const delegatedTasks = tasks.filter((t) => t.completedAt === null && t.owner !== codename && t.handler === codename);
  const myCompletedTasks = tasks.filter((t) => t.completedAt !== null && (!t.owner || t.owner === codename));
  
  const slotsRemaining = MAX_TASKS - myActiveTasks.length;
  const hasTasks = myActiveTasks.length > 0 || delegatedTasks.length > 0;

  const [isEditingCodename, setIsEditingCodename] = useState(false);
  const [codenameInput, setCodenameInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { permission, requestPermission, sendTransmission } = useNotifications();
  const { playKeystroke } = useCyberAudio();

  const handleStartEdit = () => {
    setCodenameInput(codename);
    setIsEditingCodename(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSaveEdit = () => {
    const newName = codenameInput.trim().toUpperCase() || 'GHOST';
    setCodename(newName);
    localStorage.setItem('agent_codename', newName);
    setIsEditingCodename(false);
  };

  const handleRequestCommLink = async () => {
    playKeystroke();
    const granted = await requestPermission();
    if (granted) {
      sendTransmission("COMM-LINK SECURED", `Uplink established for OP-ID: ${codename}.`, "comm-link");
    }
  };

  return (
    <div className="w-full flex flex-col h-full mt-2 md:mt-6 space-y-6 md:space-y-8 animate-fade-in">
      
      {/* Offline Sync Override Banner */}
      {!isConnected && (
        <div className="w-full bg-red-950/20 border border-red-900/50 p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono shadow-[inset_0_0_20px_rgba(255,0,51,0.05)] relative overflow-hidden rounded-sm">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,51,0.02)_10px,rgba(255,0,51,0.02)_20px)] pointer-events-none"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping shrink-0"></div>
            <div className="flex flex-col">
              <span className="text-red-500 font-bold uppercase tracking-widest text-xs md:text-sm drop-shadow-[0_0_5px_#ff0033]">SYNC SEVERED [LOCAL MODE]</span>
              <span className="text-red-800 text-[9px] md:text-[10px] tracking-[0.2em] uppercase">COMMAND NODE OFFLINE OR UNREACHABLE</span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto relative z-10">
            <input 
              type="text" 
              placeholder="IP OVERRIDE (e.g. 192.168.1.5)"
              className="bg-black border border-red-900/80 px-3 py-1.5 text-red-400 placeholder-red-900 focus:outline-none focus:border-red-500 flex-grow md:w-56 tracking-widest text-[10px] md:text-xs uppercase shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSetManualIp(e.currentTarget.value);
                }
              }}
              id="manual_ip_input"
            />
            <button 
              onClick={() => {
                const el = document.getElementById('manual_ip_input') as HTMLInputElement;
                if (el) onSetManualIp(el.value);
              }}
              className="text-red-500 hover:text-white border border-red-900/80 hover:border-red-500 px-3 py-1.5 transition-colors focus:outline-none tracking-widest font-bold text-[10px] md:text-xs bg-black whitespace-nowrap"
            >
              CONNECT
            </button>
          </div>
        </div>
      )}

      {/* HEADER: Sleek Tactical Dashboard */}
      <header className="flex flex-col border-b border-gray-900 pb-0 relative gap-0">
        {/* Top Row: Title & OP-ID */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full pb-4">
          <div className="flex items-baseline gap-4 md:gap-6">
            <h1 className="font-sans font-black tracking-tighter text-white uppercase text-4xl md:text-6xl lg:text-7xl leading-none drop-shadow-md">
              CIPHER
            </h1>
            
            {isEditingCodename ? (
              <input
                ref={inputRef}
                value={codenameInput}
                onChange={(e) => setCodenameInput(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                className="bg-transparent border-b border-brand text-white tracking-[0.4em] uppercase text-xs md:text-sm font-mono focus:outline-none w-[200px]"
                maxLength={20}
                placeholder="NEW DESIGNATION..."
              />
            ) : (
              <div 
                onClick={handleStartEdit}
                className="text-brand/70 hover:text-brand tracking-[0.2em] md:tracking-[0.3em] uppercase text-[10px] md:text-xs font-mono cursor-pointer transition-colors group flex items-center gap-2 pb-1 md:pb-2"
                title="Click to reconfigure OP-ID"
              >
                <span>OP-ID</span> 
                <span className="text-gray-700 text-[10px]">///</span>
                <span className="text-white group-hover:drop-shadow-[0_0_8px_#ff0033] transition-all font-bold truncate max-w-[150px] md:max-w-none">
                  {codename}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-4 border-t border-gray-900 md:border-none pt-3 md:pt-0 mt-2 md:mt-0">
            <div className="hidden lg:block text-[9px] text-gray-700 font-mono tracking-widest uppercase">
              Boss Key: Double-Tap [ESC]
            </div>
            <a 
              href="https://sir-ad.github.io/CIPHER_TERMINAL/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[9px] md:text-[10px] text-brand/80 hover:text-white font-mono tracking-[0.2em] uppercase border border-brand/40 hover:border-brand px-3 py-1.5 transition-all duration-300 focus:outline-none hover:shadow-[0_0_15px_rgba(255,0,51,0.6)] bg-black hover:bg-brand/10"
              title="Access Declassified Field Manual"
            >
              [ FIELD MANUAL ]
            </a>
          </div>
        </div>

        {/* Bottom Row: Horizontal Diagnostics Ribbon */}
        <div className="w-full bg-[#0a0a0a] border-t border-b border-gray-900 py-2 px-3 md:px-4 font-mono text-[9px] md:text-[10px] tracking-[0.2em] uppercase flex flex-wrap items-center gap-x-6 md:gap-x-10 gap-y-3">
          
          <div className="flex items-center gap-2">
            <span className="text-gray-600">SYS:</span>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse-fast'}`}></div>
            <span className={isConnected ? 'text-gray-300' : 'text-red-400'}>
              {isConnected ? `UP [${activeNodes}]` : 'LOCAL'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600">LINK:</span>
            <span className="text-gray-400 select-all cursor-text">{networkIp ? `${networkIp}:4040` : 'N/A'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600">PHASE:</span>
            <span className={isDeployed ? 'text-brand font-bold shadow-brand animate-pulse' : 'text-blue-400 font-bold'}>
              {isDeployed ? 'DEPLOYED' : 'PLANNING'}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-gray-600">COMM:</span>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${permission === 'granted' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-gray-800'}`}></div>
            {permission === 'default' && (
              <button onClick={handleRequestCommLink} className="text-amber-500/80 hover:text-amber-400 transition-all animate-pulse focus:outline-none">
                [ ENABLE ]
              </button>
            )}
            {permission === 'denied' && <span className="text-gray-600 line-through">BLOCKED</span>}
            {permission === 'granted' && <span className="text-amber-500/80">SECURED</span>}
          </div>
        </div>

        {/* Syndicate Squad Radar - Redesigned as Telemetry Cards */}
        {syndicateMode && (
          <div className="w-full bg-[#050300] border-b border-amber-900/30 py-3 md:py-4 px-4 md:px-6 font-mono text-[9px] md:text-[10px] tracking-[0.2em] uppercase flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(245,158,11,0.02)_10px,rgba(245,158,11,0.02)_20px)] pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-amber-500 font-bold drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">SQUAD TELEMETRY</span>
                <div className="w-px h-3 bg-amber-900/50"></div>
                <span className="text-gray-400 flex items-center gap-1">
                  INTEGRITY: 
                  {Array.from({length: 3}).map((_, i) => (
                    <span key={i} className={`ml-1 text-xs ${i < squadIntegrity ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-gray-800'}`}>
                      ◈
                    </span>
                  ))}
                </span>
              </div>
            </div>

            {squadNodes.length === 0 ? (
              <span className="text-gray-600 animate-pulse relative z-10 mt-1">Scanning frequencies...</span>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-2 relative z-10">
                {squadNodes.map(node => (
                  <div key={node.socketId} className={`flex flex-col border ${node.activeTaskCount >= 5 ? 'border-brand bg-brand/10 shadow-[0_0_10px_rgba(255,0,51,0.3)]' : (node.opId === codename ? 'border-amber-500/50 bg-amber-900/10' : 'border-gray-800 bg-[#020202]')} p-2 md:p-3 transition-all relative`}>
                    {/* Capacity full visual lock */}
                    {node.activeTaskCount >= 5 && <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmYwMDMzIiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8L3N2Zz4=')] mix-blend-overlay pointer-events-none"></div>}
                    
                    <div className="flex items-center justify-between mb-2 z-10">
                      <span className={`font-bold truncate ${node.activeTaskCount >= 5 ? 'text-brand animate-pulse' : (node.opId === codename ? 'text-amber-500 drop-shadow-[0_0_3px_#f59e0b]' : 'text-gray-400')}`}>
                        {node.opId}
                      </span>
                      <span className={`text-[8px] md:text-[9px] ${node.activeTaskCount >= 5 ? 'text-brand font-bold' : 'text-gray-600'}`}>
                        {node.activeTaskCount}/5
                      </span>
                    </div>
                    {/* Mini capacity bar */}
                    <div className="w-full h-1 bg-gray-900 flex z-10">
                       <div className={`h-full transition-all duration-500 ${node.activeTaskCount >= 5 ? 'bg-brand' : 'bg-amber-500/50'}`} style={{ width: `${(node.activeTaskCount / 5) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </header>

      {/* Capacity Readout */}
      <div className="flex justify-between items-end font-mono px-1">
        <span className={`text-xs md:text-sm lg:text-base tracking-[0.3em] uppercase font-bold ${slotsRemaining === 0 ? 'text-brand drop-shadow-[0_0_5px_#ff0033]' : 'text-gray-400'}`}>
          ASSETS: {myActiveTasks.length} / {MAX_TASKS}
        </span>
        <span className="text-gray-600 text-[9px] md:text-[10px] tracking-widest hidden sm:block">
          TEMPORAL DECAY TRACING: ACTIVE
        </span>
      </div>

      {/* MAIN CONTENT: Task Lists */}
      <div className="flex-grow w-full relative transition-all duration-500 ease-out z-10">
        {!hasTasks ? (
          <EmptyState syndicateMode={syndicateMode} />
        ) : (
          <div className="space-y-10 md:space-y-16 w-full mt-4">
            
            {/* Active Directives (My Tasks) */}
            {myActiveTasks.length > 0 && (
              <div className="relative border border-brand/20 bg-[#030101] p-3 md:p-6 shadow-[inset_0_0_30px_rgba(255,0,51,0.02)]">
                 <div className="absolute -top-3 left-4 md:left-6 bg-[#050505] px-3 flex items-center gap-2 border border-brand/30">
                    <div className="w-2 h-2 bg-brand animate-pulse shadow-[0_0_8px_#ff0033]"></div>
                    <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-mono font-bold text-brand drop-shadow-[0_0_5px_#ff0033]">
                      Primary Directives [LOCAL]
                    </span>
                 </div>
                 
                 <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brand/30"></div>
                 <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand/30"></div>
                 
                 {/* Decorative background grid */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,51,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,51,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                <div className="flex flex-col relative gap-1 md:gap-2 mt-4 z-10">
                  {myActiveTasks.map((task, index) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      currentOpId={codename}
                      onComplete={onCompleteTask}
                      onDelete={onDeleteTask}
                      onEngage={onEngage}
                      onVerifyKill={verifyKill}
                      onDenyKill={denyKill}
                      isDeployed={isDeployed}
                      isZenith={index === 0}
                      isDimmed={index > 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Delegated Directives (Tasks I assigned to others) */}
            {delegatedTasks.length > 0 && (
              <div className="relative border border-amber-900/40 bg-[#050401] p-3 md:p-6 shadow-[inset_0_0_20px_rgba(245,158,11,0.02)] mt-8">
                 <div className="absolute -top-3 left-4 md:left-6 bg-[#050505] px-3 flex items-center gap-2 border border-amber-900/50">
                    <div className="w-2 h-2 bg-amber-500 animate-ping shadow-[0_0_8px_#f59e0b]"></div>
                    <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-mono font-bold text-amber-500 drop-shadow-[0_0_5px_#f59e0b]">
                      Delegated Payloads [OUTBOUND]
                    </span>
                 </div>
                 
                 <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-500/30"></div>
                 <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-500/30"></div>

                 <div className="flex flex-col relative gap-1 md:gap-2 mt-4 z-10">
                   {delegatedTasks.map((task) => (
                     <TaskItem
                        key={task.id}
                        task={task}
                        currentOpId={codename}
                        onComplete={onCompleteTask}
                        onDelete={onDeleteTask}
                        onEngage={onEngage}
                        onVerifyKill={verifyKill}
                        onDenyKill={denyKill}
                        isDeployed={isDeployed}
                     />
                   ))}
                 </div>
              </div>
            )}
            
            {/* Encrypted Ledger (Completed) Group */}
            {myCompletedTasks.length > 0 && (
              <div className="relative border border-gray-800/50 bg-[#020202] p-3 md:p-6 opacity-60 hover:opacity-100 transition-opacity duration-500 mt-8">
                 <div className="absolute -top-3 left-4 md:left-6 bg-[#050505] px-3 flex items-center gap-2 border border-gray-800">
                    <div className="w-2 h-2 bg-gray-500"></div>
                    <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-mono font-bold text-gray-500">
                      Encrypted Ledger [ARCHIVE]
                    </span>
                 </div>

                 <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gray-700"></div>
                 <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gray-700"></div>

                 <div className="flex flex-col relative gap-1 mt-4 z-10 pt-2">
                   {myCompletedTasks.map((task) => (
                     <TaskItem
                        key={task.id}
                        task={task}
                        currentOpId={codename}
                        onComplete={onCompleteTask}
                        onDelete={onDeleteTask}
                        onEngage={onEngage}
                        isDeployed={isDeployed}
                     />
                   ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER: Sticky Action Bar */}
      <div className={`sticky bottom-0 bg-gradient-to-t from-[#000000] via-[#050505] to-transparent z-30 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${hasTasks ? 'pt-6 md:pt-10 pb-4 md:pb-6' : 'pt-12 md:pt-16 pb-8 md:pb-12'}`}>
        
        {isDeployed && <div className="absolute inset-x-0 bottom-0 h-1 bg-brand shadow-[0_0_20px_#ff0033] z-50"></div>}

        <div className={`bg-[#050505]/95 border-t border-l border-r ${isDeployed ? 'border-brand/50' : 'border-gray-900'} shadow-[0_-20px_40px_rgba(0,0,0,0.95)] rounded-t-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${hasTasks ? 'p-4 md:p-6' : 'p-6 md:p-10 lg:p-14'}`}>
          
          {!isDeployed ? (
             <TaskInput onAdd={onAddTask} disabled={slotsRemaining <= 0} hasTasks={hasTasks} syndicateMode={syndicateMode} />
          ) : (
            <div className="w-full text-center py-4 md:py-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,51,0.05)_10px,rgba(255,0,51,0.05)_20px)] pointer-events-none"></div>
              <span className="relative z-10 text-brand text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-[0.3em] md:tracking-[0.4em] drop-shadow-[0_0_8px_#ff0033] animate-pulse">
                &gt; OPERATION DEPLOYED &lt;
              </span>
              <p className="relative z-10 text-gray-400 font-mono text-[9px] md:text-xs mt-3 uppercase tracking-widest px-4">
                Input locked. Tactical priority: Neutralize active targets.
              </p>
            </div>
          )}
          
          <div className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${hasTasks ? 'max-h-40 opacity-100 mt-4 md:mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-6 justify-between items-center font-mono border-t border-gray-900 pt-4 md:pt-5">
              
              {!isDeployed ? (
                <button 
                  onClick={onDeploy}
                  className="w-full sm:w-auto flex-grow text-black bg-white hover:bg-gray-200 tracking-[0.2em] md:tracking-[0.3em] font-bold uppercase px-4 md:px-8 py-3 transition-all focus:outline-none text-center text-[10px] md:text-xs shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  [ INITIATE OPERATION ]
                </button>
              ) : (
                 <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start py-2">
                  <span className={`w-2 h-2 rounded-full bg-brand animate-pulse shadow-[0_0_10px_#ff0033]`}></span>
                  <span className={`uppercase tracking-widest text-brand font-bold drop-shadow-[0_0_8px_#ef4444] text-[10px] md:text-xs`}>
                    SYSTEM LOCKED // EXECUTE
                  </span>
                </div>
              )}

              <button 
                onClick={onPanic}
                className="text-brand/60 hover:text-white hover:bg-brand hover:shadow-[0_0_20px_#ff0033] tracking-[0.2em] md:tracking-[0.3em] font-bold uppercase border border-brand/20 hover:border-brand px-4 md:px-8 py-3 transition-all focus:outline-none w-full sm:w-auto text-center shrink-0 text-[10px] md:text-xs"
              >
                [ TOTAL BURN ]
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
