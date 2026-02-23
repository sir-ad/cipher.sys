import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { MS_PER_DAY, EXPIRY_MS } from '../constants';
import { useNow } from '../hooks/useNow';
import { useCyberAudio } from '../hooks/useCyberAudio';

interface TaskItemProps {
  task: Task;
  currentOpId: string;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEngage: (id: string) => void;
  onVerifyKill?: (id: string) => void;
  onDenyKill?: (id: string) => void;
  isDeployed: boolean;
  isZenith?: boolean;
  isDimmed?: boolean;
}

const generateHex = (length: number) => {
  return Array.from({length}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
};

const TaskDecayVisuals: React.FC<{ task: Task, isZenith?: boolean, isDeployed: boolean, onDelete: () => void, onEngage: () => void, hideActions?: boolean }> = ({ task, isZenith, isDeployed, onDelete, onEngage, hideActions }) => {
  const now = useNow(10000);
  
  const ageInMs = now - task.createdAt;
  const ageInDays = Math.floor(ageInMs / MS_PER_DAY);
  const timeLeftMs = Math.max(0, EXPIRY_MS - ageInMs);
  const daysLeft = Math.ceil(timeLeftMs / MS_PER_DAY);
  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / EXPIRY_MS) * 100));

  let colorClass = 'text-gray-300';
  if (ageInDays >= 7) {
    colorClass = 'text-brand drop-shadow-[0_0_8px_rgba(255,0,51,0.6)] animate-pulse-fast font-bold';
  } else if (ageInDays >= 5) {
    colorClass = 'text-orange-500 font-semibold';
  }
  
  if (isZenith) {
    colorClass = 'text-white font-bold drop-shadow-md';
  }

  return (
    <div className="flex flex-col flex-grow min-w-0 font-mono gap-1.5 md:gap-3 w-full">
      
      {isZenith && (
        <div className="text-brand text-[9px] md:text-[10px] tracking-[0.3em] uppercase font-black mb-1 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(255,0,51,0.8)]">
          <span className="w-1.5 h-1.5 bg-brand animate-pulse rounded-full"></span>
          [ PRIMARY OBJECTIVE ]
        </div>
      )}

      <span className={`break-words leading-tight uppercase tracking-wide glitch-hover cursor-default transition-colors duration-1000 w-full ${colorClass} ${isZenith ? 'text-lg md:text-2xl lg:text-3xl mb-1' : 'text-sm md:text-base lg:text-lg'}`}>
        {task.text}
      </span>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-6 text-[9px] md:text-[10px] opacity-90 w-full pt-1">
        
        <div className={`shrink-0 tracking-widest uppercase font-bold transition-colors duration-1000 flex items-center gap-1.5 ${daysLeft <= 2 ? 'text-brand animate-pulse' : 'text-gray-500'}`}>
           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           T-MINUS {daysLeft}D
        </div>
        
        <div className={`flex-grow bg-gray-900 relative overflow-hidden border border-gray-800 w-full sm:max-w-[150px] md:max-w-[200px] lg:max-w-[300px] ${isZenith ? 'h-1.5 md:h-2' : 'h-1 md:h-1.5'}`}>
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(0,0,0,0.8)_4px,rgba(0,0,0,0.8)_6px)] z-10 pointer-events-none"></div>
          <div 
            className={`absolute top-0 bottom-0 right-0 transition-all duration-1000 ${daysLeft <= 2 ? 'bg-brand shadow-[0_0_10px_#ff0033]' : 'bg-gray-400'}`}
            style={{ width: `${100 - progressPercent}%` }}
          />
        </div>

        {!hideActions && (
          <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            {isDeployed && (
              <button
                onClick={onEngage}
                className="flex-1 sm:flex-none text-center text-white hover:text-black hover:bg-white border border-gray-600 hover:border-white transition-colors focus:outline-none uppercase tracking-[0.2em] font-bold px-3 py-1.5 md:py-1 bg-black shadow-[0_0_8px_rgba(255,255,255,0.05)] text-[9px] md:text-[10px]"
                title="Isolate target in tunnel-vision focus mode"
              >
                [ ENGAGE ]
              </button>
            )}
            <button
               onClick={onDelete}
               className="flex-1 sm:flex-none text-center text-gray-500 hover:text-brand transition-colors focus:outline-none uppercase tracking-[0.2em] font-bold px-3 py-1.5 md:py-1 bg-black sm:bg-transparent border border-gray-800 sm:border-transparent rounded-sm text-[9px] md:text-[10px]"
               title="Permanently Purge Asset"
             >
               [ DISAVOW ]
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, currentOpId, onComplete, onDelete, onEngage, onVerifyKill, onDenyKill, isDeployed, isZenith, isDimmed }) => {
  const { playSuccess, playAlarm } = useCyberAudio();
  const [hexDump, setHexDump] = useState('');
  
  const isCompleted = task.completedAt !== null;
  const isPendingVerification = task.status === 'PENDING_VERIFICATION';
  const isOwner = task.owner === currentOpId || !task.owner;
  const isHandler = task.handler === currentOpId && task.owner !== currentOpId;

  useEffect(() => {
    if (isCompleted && !hexDump) {
      setHexDump(`0x${generateHex(8)}...${generateHex(4)}`);
    }
  }, [isCompleted, hexDump]);

  const handleComplete = () => { playSuccess(); onComplete(task.id); };
  const handleDelete = () => { playAlarm(); onDelete(task.id); };
  const handleEngage = () => { onEngage(task.id); };

  if (isCompleted) {
    return (
      <div className="flex items-center gap-4 py-3 md:py-4 px-2 md:px-6 group transition-all font-mono border-b border-gray-900/50 my-1">
        <div className="w-8 h-8 md:w-10 md:h-10 border border-gray-800 flex items-center justify-center shrink-0 bg-[#020202]">
          <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
        </div>
        <div className="flex-grow flex flex-col min-w-0 justify-center">
          <span className="text-gray-600 text-[9px] md:text-[10px] tracking-[0.2em] uppercase mb-0.5 line-through decoration-gray-800 truncate">
            Encrypted Log Entry
          </span>
          <span className="text-brand/40 tracking-[0.2em] font-bold text-xs md:text-sm blur-[1px] group-hover:blur-none group-hover:text-brand/70 transition-all truncate">
            {hexDump} [PURGE PENDING]
          </span>
        </div>
      </div>
    );
  }

  // Visual Hierarchy styling
  const zenithClasses = isZenith 
    ? 'bg-[#0a0505] shadow-[0_0_30px_rgba(255,0,51,0.08)] border border-brand/30 py-5 md:py-6 my-2 rounded-sm transform scale-[1.01] md:scale-[1.02] z-10'
    : 'border-b border-gray-900/50 hover:bg-[#080808] py-4 md:py-5 my-1';
  
  const dimmedClasses = isDimmed 
    ? 'opacity-50 hover:opacity-100 transition-opacity duration-300'
    : '';

  // --------------------------------------------------------------------------
  // TWO-KEY AUTHENTICATION UI
  // --------------------------------------------------------------------------
  if (isPendingVerification) {
    if (isHandler) {
      // The person who assigned the task sees the Verification controls
      return (
        <div className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 px-3 md:px-6 transition-all duration-500 bg-[#0a0600] border border-amber-900/50 py-5 md:py-6 my-2`}>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"></div>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500"></div>

          <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 border border-amber-600 bg-black flex items-center justify-center text-amber-500 font-bold text-lg animate-pulse shadow-[inset_0_0_10px_rgba(245,158,11,0.3)]">
            ?
          </div>
          <div className="flex flex-col flex-grow font-mono w-full">
            <span className="text-amber-500 font-bold uppercase tracking-widest text-sm md:text-base break-words">
              {task.text}
            </span>
            <span className="text-gray-400 text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-2 border-l border-amber-900 pl-2">
              ASSIGNEE [{task.owner || 'UNKNOWN'}] CLAIMS NEUTRALIZATION.
            </span>
            <div className="flex items-center gap-3 mt-4 w-full sm:w-auto">
              <button onClick={() => { playSuccess(); onVerifyKill?.(task.id); }} className="flex-1 sm:flex-none border border-amber-500 bg-amber-500 text-black hover:bg-amber-400 uppercase tracking-widest font-bold text-[10px] md:text-xs py-2 px-6 focus:outline-none shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                [ VERIFY KILL ]
              </button>
              <button onClick={() => { playAlarm(); onDenyKill?.(task.id); }} className="flex-1 sm:flex-none border border-gray-700 text-gray-500 hover:border-brand hover:text-brand uppercase tracking-widest font-bold text-[10px] md:text-xs py-2 px-6 focus:outline-none transition-colors">
                [ REJECT WORK ]
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isOwner) {
      // The person who executed the task sees it locked until verified
      return (
        <div className={`group relative flex items-start sm:items-center gap-4 md:gap-6 px-3 md:px-6 transition-all duration-500 opacity-60 bg-[#020202] py-4 md:py-5 cursor-not-allowed border border-gray-800 border-dashed my-1`}>
          <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 border border-gray-700 bg-black flex items-center justify-center text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          </div>
          <div className="flex flex-col flex-grow font-mono w-full">
            <span className="text-gray-500 uppercase tracking-wide text-sm md:text-base break-words line-through decoration-gray-700">
              {task.text}
            </span>
            <span className="text-amber-600/70 text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-2 animate-pulse">
              STATUS: AWAITING HANDLER [{task.handler}] VERIFICATION
            </span>
          </div>
        </div>
      );
    }
  }

  // --------------------------------------------------------------------------
  // STANDARD ACTIVE UI
  // --------------------------------------------------------------------------
  return (
    <div className={`group relative flex items-start sm:items-center gap-4 md:gap-6 px-3 md:px-6 transition-all duration-500 ${zenithClasses} ${dimmedClasses}`}>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand scale-y-0 group-hover:scale-y-100 transition-transform origin-top z-10 shadow-[0_0_10px_#ff0033]"></div>
      
      {isZenith && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-brand"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-brand"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-brand"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-brand"></div>
        </>
      )}

      {/* If I assigned it to someone else, I shouldn't be able to check it off. I just monitor it. */}
      {isHandler && !isOwner ? (
        <div className={`shrink-0 border border-brand/50 flex items-center justify-center transition-all bg-brand/10 mt-1 sm:mt-0 ${isZenith ? 'w-10 h-10 md:w-14 md:h-14' : 'w-8 h-8 md:w-10 md:h-10'}`} title={`Assigned to ${task.owner}`}>
          <span className="text-brand font-bold text-[10px] md:text-xs">OUT</span>
        </div>
      ) : (
        <button
          onClick={handleComplete}
          className={`shrink-0 border border-gray-600 hover:border-brand flex items-center justify-center transition-all focus:outline-none group/btn bg-[#030303] shadow-[inset_0_0_8px_rgba(0,0,0,0.8)] mt-1 sm:mt-0 ${isZenith ? 'w-10 h-10 md:w-14 md:h-14' : 'w-8 h-8 md:w-10 md:h-10'}`}
        >
          <span className={`bg-brand scale-0 group-hover/btn:scale-100 transition-transform shadow-[0_0_10px_#ff0033] ${isZenith ? 'w-5 h-5 md:w-6 md:h-6' : 'w-3.5 h-3.5 md:w-4 md:h-4'}`}></span>
        </button>
      )}
      
      <div className="flex flex-col flex-grow w-full min-w-0">
        <TaskDecayVisuals task={task} isZenith={isZenith} isDeployed={isDeployed} onDelete={handleDelete} onEngage={handleEngage} hideActions={isHandler && !isOwner} />
        {isHandler && !isOwner && (
          <span className="text-[9px] md:text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-2 border-l border-gray-800 pl-2">
            ASSIGNED TO TARGET: <strong className="text-brand">{task.owner}</strong>
          </span>
        )}
      </div>
    </div>
  );
};
