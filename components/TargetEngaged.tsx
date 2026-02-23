import React, { useState, useEffect } from 'react';
import { Task } from '../types';

interface TargetEngagedProps {
  task: Task;
  onComplete: (id: string) => void;
  onAbort: () => void;
}

export const TargetEngaged: React.FC<TargetEngagedProps> = ({ task, onComplete, onAbort }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 md:p-12">
      {/* Intense Target Lock Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(255,0,51,0.05)_100%)]"></div>
      <div className="absolute top-10 left-10 w-20 h-20 border-t-4 border-l-4 border-brand opacity-50"></div>
      <div className="absolute top-10 right-10 w-20 h-20 border-t-4 border-r-4 border-brand opacity-50"></div>
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b-4 border-l-4 border-brand opacity-50"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-4 border-r-4 border-brand opacity-50"></div>

      <div className="flex flex-col items-center w-full max-w-4xl animate-fade-in relative z-10 text-center">
        
        <div className="text-brand font-mono tracking-[0.5em] text-sm md:text-xl font-bold uppercase mb-4 md:mb-8 flex items-center gap-4 animate-pulse">
          <div className="w-3 h-3 bg-brand rounded-full"></div>
          TARGET LOCKED
          <div className="w-3 h-3 bg-brand rounded-full"></div>
        </div>

        {/* Live Stopwatch */}
        <div className="text-gray-400 font-mono tracking-widest text-3xl md:text-5xl mb-12 md:mb-16">
          T+ {formatTime(elapsedSeconds)}
        </div>

        {/* The Task */}
        <h1 className="text-white font-sans font-black text-4xl md:text-6xl lg:text-8xl leading-none uppercase tracking-tight break-words w-full mb-16 md:mb-24 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          {task.text}
        </h1>

        <div className="flex flex-col sm:flex-row gap-6 md:gap-10 w-full max-w-2xl">
          <button 
            onClick={onAbort}
            className="flex-1 py-5 md:py-6 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-all focus:outline-none uppercase tracking-[0.3em] font-bold text-xs md:text-sm font-mono"
          >
            [ FALLBACK ]
          </button>
          
          <button 
            onClick={() => onComplete(task.id)}
            className="flex-1 py-5 md:py-6 bg-brand text-white shadow-[0_0_30px_rgba(255,0,51,0.5)] hover:bg-white hover:text-brand hover:shadow-[0_0_50px_rgba(255,0,51,0.8)] transition-all focus:outline-none uppercase tracking-[0.3em] font-bold text-xs md:text-sm font-mono border border-brand"
          >
            NEUTRALIZE TARGET
          </button>
        </div>

      </div>
    </div>
  );
};
