import React, { useState, useEffect } from 'react';
import { useCyberAudio } from '../hooks/useCyberAudio';

interface GlobalWipeSequenceProps {
  culprit: string | null;
  onComplete: () => void;
}

export const GlobalWipeSequence: React.FC<GlobalWipeSequenceProps> = ({ culprit, onComplete }) => {
  const [countdown, setCountdown] = useState(10);
  const { playPurge, playKeystroke, initAudio } = useCyberAudio();

  useEffect(() => {
    initAudio();
  }, [initAudio]);

  useEffect(() => {
    if (countdown <= 0) {
      playPurge();
      onComplete();
      return;
    }
    const t = setInterval(() => {
      setCountdown(prev => prev - 1);
      playKeystroke();
    }, 1000);
    return () => clearInterval(t);
  }, [countdown, playPurge, playKeystroke, onComplete]);

  return (
    <div className="fixed inset-0 bg-red-950 flex flex-col items-center justify-center z-[100] p-6 text-center shadow-[inset_0_0_150px_rgba(255,0,0,0.8)] font-mono overflow-hidden">
      
      {/* Background static */}
      <div className="absolute inset-0 z-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmYwMDMzIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] mix-blend-overlay"></div>
      
      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center">
        <h2 className="text-white text-3xl md:text-6xl font-black mb-8 md:mb-16 tracking-tighter uppercase animate-glitch drop-shadow-[0_0_20px_#ff0033]">
          ☢️ MUTUALLY ASSURED DESTRUCTION ☢️
        </h2>
        
        <div className="bg-black/80 border border-brand p-6 md:p-10 mb-12 md:mb-20 w-full shadow-[0_0_50px_rgba(255,0,51,0.3)]">
          <p className="text-brand text-lg md:text-3xl font-bold uppercase leading-relaxed tracking-widest animate-pulse">
            [{culprit || 'UNKNOWN'}] ALLOWED A DIRECTIVE TO SUFFER THERMAL DECAY.<br/><br/>
            SQUAD INTEGRITY REACHED ABSOLUTE ZERO.<br/>
            GLOBAL PURGE INITIATED.
          </p>
        </div>
        
        <div className="text-9xl md:text-[15rem] text-white font-black animate-ping drop-shadow-[0_0_30px_#ff0033] leading-none">
          {countdown}
        </div>
        
        <p className="text-gray-500 uppercase tracking-widest mt-12 md:mt-24 text-xs md:text-sm font-bold">
          (SEQUENCE CANNOT BE ABORTED)
        </p>
      </div>
    </div>
  );
};
