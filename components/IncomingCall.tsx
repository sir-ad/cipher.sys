import React, { useEffect } from 'react';
import { useCyberAudio } from '../hooks/useCyberAudio';

interface IncomingCallProps {
  taskText: string;
  onAcknowledge: () => void;
}

export const IncomingCall: React.FC<IncomingCallProps> = ({ taskText, onAcknowledge }) => {
  const { playRingtone, initAudio } = useCyberAudio();

  useEffect(() => {
    initAudio();
    const { stop } = playRingtone();
    return () => stop();
  }, [playRingtone, initAudio]);

  return (
    <div className="fixed inset-0 bg-[#1a0000] flex flex-col items-center justify-center z-50 animate-pulse-fast">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(255,0,51,0.05)_20px,rgba(255,0,51,0.05)_40px)] pointer-events-none"></div>
      
      <div className="w-20 h-20 md:w-24 md:h-24 border-4 border-brand rounded-full flex items-center justify-center mb-8 animate-ping">
         <div className="w-10 h-10 md:w-12 md:h-12 bg-brand rounded-full"></div>
      </div>

      <div className="text-brand text-2xl sm:text-3xl md:text-5xl font-black tracking-wider sm:tracking-tighter uppercase mb-6 text-center px-4 drop-shadow-[0_0_15px_#ff0033] w-full break-words">
        INCOMING SECURE TRANSMISSION
      </div>
      
      <p className="text-red-300 font-mono text-center max-w-lg mb-12 px-6 uppercase tracking-wider md:tracking-widest text-[10px] sm:text-xs md:text-sm leading-relaxed border-t border-b border-brand/30 py-6">
        <span className="text-gray-400 mb-2 block">OVERWATCH COMMAND // URGENT DIRECTIVE</span>
        Asset approaching critical thermal inversion:<br/>
        <span className="text-white font-bold text-sm sm:text-base md:text-xl mt-4 inline-block drop-shadow-md break-words w-full">"{taskText}"</span>
      </p>
      
      <button 
        onClick={onAcknowledge}
        className="px-8 sm:px-12 py-4 sm:py-5 bg-brand text-white font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-white hover:text-brand hover:shadow-[0_0_30px_#ff0033] focus:outline-none transition-all duration-300 z-10 border border-transparent hover:border-brand text-xs sm:text-sm"
      >
        ACKNOWLEDGE
      </button>
    </div>
  );
};
