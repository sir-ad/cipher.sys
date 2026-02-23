import React from 'react';
import { Task } from '../types';

interface IncomingDirectiveModalProps {
  task: Task;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingDirectiveModal: React.FC<IncomingDirectiveModalProps> = ({ task, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 bg-red-950/90 flex flex-col items-center justify-center z-[100] p-6 animate-pulse-fast backdrop-blur-sm">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(255,0,51,0.05)_20px,rgba(255,0,51,0.05)_40px)] pointer-events-none"></div>
      
      <div className="border border-brand p-8 md:p-12 bg-black text-center max-w-2xl w-full shadow-[0_0_50px_rgba(255,0,51,0.6)] relative z-10 font-mono">
        <h2 className="text-brand text-2xl md:text-4xl font-black tracking-widest uppercase mb-8 md:mb-12 animate-flicker">
          ⚠️ INCOMING DIRECTIVE ⚠️
        </h2>
        
        <div className="text-gray-300 mb-12 text-left border-l-2 border-brand/50 pl-6 space-y-4">
          <div className="tracking-widest uppercase text-xs md:text-sm text-gray-500">
            HANDLER: <strong className="text-white">{task.handler}</strong>
          </div>
          <div className="tracking-widest uppercase text-xs md:text-sm text-gray-500">
            PAYLOAD:
          </div>
          <div className="text-xl md:text-3xl text-brand font-bold uppercase drop-shadow-[0_0_8px_rgba(255,0,51,0.8)]">
            "{task.text}"
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full mt-12">
          <button 
            onClick={onReject} 
            className="flex-1 border border-gray-700 text-gray-500 hover:border-brand hover:text-brand hover:bg-brand/10 focus:outline-none transition-colors font-bold py-5 md:py-6 uppercase tracking-[0.2em] text-xs md:text-sm"
          >
            [ REJECT & BOUNCE ]
          </button>
          <button 
            onClick={onAccept} 
            className="flex-1 bg-brand text-white border border-brand hover:bg-white hover:text-brand hover:shadow-[0_0_30px_#ff0033] focus:outline-none transition-all duration-300 font-bold py-5 md:py-6 uppercase tracking-[0.2em] text-xs md:text-sm"
          >
            [ ACCEPT BURDEN ]
          </button>
        </div>
      </div>
    </div>
  );
};
