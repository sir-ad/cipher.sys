import React, { useEffect, useRef, useState } from 'react';
import { DestructReason } from '../types';
import { useCyberAudio } from '../hooks/useCyberAudio';
import { wipeCipherLocalState } from '../utils/session';

interface DestructedTerminalProps {
  reason?: DestructReason;
  terminateServer: () => void;
}

const NOLAN_QUOTES = [
  "Don't try to understand it. Feel it.",
  "Some men just want to watch the world burn.",
  "It's not who I am underneath, but what I do that defines me.",
  "Do not go gentle into that good night.",
  "Mankind was born on Earth. It was never meant to die here.",
  "What happened, happened.",
  "You mustn't be afraid to dream a little bigger, darling."
];

export const DestructedTerminal: React.FC<DestructedTerminalProps> = ({ reason, terminateServer }) => {
  const [phase, setPhase] = useState(0);
  const [hexGrid, setHexGrid] = useState<string[][]>([]);
  const [codename, setCodename] = useState('');
  const [corruptionTick, setCorruptionTick] = useState(0);
  const [quote, setQuote] = useState('');
  const didExitRef = useRef(false);
  const { playPurge, initAudio } = useCyberAudio();

  useEffect(() => {
    setCodename(localStorage.getItem('agent_codename') || 'GHOST');
    setQuote(NOLAN_QUOTES[Math.floor(Math.random() * NOLAN_QUOTES.length)]);
  }, []);

  // Initialize dense random hex memory grid
  useEffect(() => {
    const rows = Math.floor(window.innerHeight / 20); 
    const cols = Math.floor(window.innerWidth / 30);  
    
    const initialGrid = Array.from({ length: Math.min(rows, 40) }, () => 
      Array.from({ length: Math.min(cols, 20) }, () => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
      )
    );
    setHexGrid(initialGrid);
  }, []);

  // Phase orchestration & Sound Trigger
  useEffect(() => {
    initAudio();
    
    const sequence = [
      setTimeout(() => setPhase(1), 500),   // Init & Wipe Complete
      setTimeout(() => {
        setPhase(2);
        playPurge(); // Trigger aggressive data purge static sound
      }, 1500),  // Start Hex Corruption Melt
      setTimeout(() => setPhase(3), 3500),  // Kill Signal
      setTimeout(() => setPhase(4), 5000),  // Ignite Flash
      setTimeout(() => setPhase(5), 5300),  // Void Burn (NULL)
      setTimeout(() => setPhase(6), 6500),  // Blackout / Severed SVG
      setTimeout(() => {
        handleExit(); // Force-kill if user doesn't click after 12s
      }, 18000)
    ];
    return () => sequence.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initAudio, playPurge]);

  // Hex Corruption Engine - "Melting" from top to bottom
  useEffect(() => {
    if (phase >= 2 && phase < 4) {
      const interval = setInterval(() => setCorruptionTick(t => t + 1), 60);
      return () => clearInterval(interval);
    }
  }, [phase]);

  useEffect(() => {
    if (corruptionTick > 0) {
      setHexGrid(prevGrid => prevGrid.map((row, i) => 
        row.map(hex => {
          // Calculate the descending wave front
          if (i <= corruptionTick / 1.2) {
            // High chance to wipe to 00, small chance to scramble
            if (hex !== '00' && Math.random() < 0.6) return '00';
            if (hex !== '00' && Math.random() < 0.1) return Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
          }
          return hex;
        })
      ));
    }
  }, [corruptionTick]);

  const handleExit = () => {
    if (didExitRef.current) return;
    didExitRef.current = true;
    wipeCipherLocalState();
    terminateServer(); // Execute physical node.js assassination
    window.location.replace('about:blank');
    setTimeout(() => window.close(), 100);
  };

  if (phase >= 4) {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center font-mono overflow-hidden z-50
        ${phase === 4 ? 'bg-white transition-colors duration-75' : ''}
        ${phase === 5 ? 'bg-brand transition-colors duration-300' : ''}
        ${phase >= 6 ? 'bg-black transition-colors duration-1000' : ''}
      `}>
        {phase === 5 && (
          <div className="absolute inset-0 flex items-center justify-center mix-blend-difference">
            <h1 className="text-[20vw] font-bold text-black opacity-50 tracking-tighter">NULL</h1>
          </div>
        )}
        
        {phase >= 6 && (
          <div className="text-center animate-fade-in text-gray-800 flex flex-col items-center w-full max-w-2xl px-4 relative z-10">
            
            {/* Massive Aggressive SVG Graphic */}
            <div className="relative w-40 h-40 md:w-56 md:h-56 mb-8 md:mb-12 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full text-brand opacity-80 drop-shadow-[0_0_15px_#ff0033]" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 5 L95 50 L50 95 L5 50 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" className="animate-[spin_15s_linear_infinite]" />
                <path d="M50 15 L85 50 L50 85 L15 50 Z" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="45" y="30" width="10" height="40" fill="black" transform="rotate(45 50 50)" />
                <rect x="45" y="30" width="10" height="40" fill="black" transform="rotate(-45 50 50)" />
                <rect x="48" y="25" width="4" height="50" fill="currentColor" transform="rotate(45 50 50)" />
                <rect x="48" y="25" width="4" height="50" fill="currentColor" transform="rotate(-45 50 50)" />
                <circle cx="50" cy="50" r="10" fill="black" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            <div className="w-full h-[1px] md:h-[2px] bg-gradient-to-r from-transparent via-brand/50 to-transparent mb-6 md:mb-8"></div>
            
            <h2 className="text-3xl md:text-5xl lg:text-6xl tracking-tighter uppercase text-brand font-black mb-3 drop-shadow-[0_0_15px_rgba(255,0,51,0.6)]">
              CONNECTION SEVERED
            </h2>
            <p className="tracking-[0.4em] md:tracking-[0.6em] uppercase text-[10px] md:text-xs text-brand/70 mb-8 md:mb-12 font-bold animate-pulse">
              OP-ID {codename} DISCONNECTED • HOST NODE TERMINATED
            </p>
            
            <div className="w-full h-[1px] md:h-[2px] bg-gradient-to-r from-transparent via-brand/50 to-transparent mb-12 md:mb-16"></div>
            
            <button 
              onClick={handleExit}
              className="px-8 md:px-12 py-4 md:py-5 border border-brand/40 bg-[#050505] text-brand hover:text-white hover:border-brand hover:bg-brand hover:shadow-[0_0_20px_rgba(255,0,51,0.5)] transition-all duration-300 uppercase tracking-[0.3em] text-[10px] md:text-xs focus:outline-none font-bold group"
            >
              <span className="group-hover:animate-pulse">EXIT TERMINAL</span>
            </button>

            {/* Nolan Quote */}
            <div className="mt-12 opacity-50 italic text-[10px] md:text-xs text-brand/60 tracking-widest text-center max-w-lg px-4 animate-fade-in" style={{ animationDelay: '1s' }}>
              "{quote}"
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020202] flex flex-col font-mono text-fluid-base p-4 md:p-8 overflow-hidden z-50">
      
      {/* Visual Hex Wipe Grid Background */}
      <div className="absolute inset-0 p-4 md:p-8 opacity-40 pointer-events-none select-none flex flex-col gap-1 md:gap-2">
        {hexGrid.map((row, i) => (
          <div key={i} className="flex justify-between w-full text-[8px] md:text-[10px] lg:text-xs tracking-widest overflow-hidden">
            {row.map((hex, j) => (
              <span key={`${i}-${j}`} className={`
                transition-colors duration-150
                ${hex === '00' ? 'text-gray-900 opacity-20' : ''}
                ${hex !== '00' && phase >= 2 ? 'text-brand drop-shadow-[0_0_3px_#ff0033]' : ''}
                ${hex !== '00' && phase < 2 ? 'text-gray-600' : ''}
              `}>
                {hex}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Terminal Overlay Console */}
      <div className="relative z-10 max-w-3xl w-full mt-auto mb-8 bg-black/90 backdrop-blur-md p-6 md:p-8 border-l-4 border-brand shadow-[0_0_30px_rgba(0,0,0,0.9)]">
        <h3 className="text-white font-bold mb-6 tracking-[0.2em] md:tracking-[0.3em] text-sm md:text-base animate-pulse shadow-black drop-shadow-md">
          [!] EXECUTING SCORCHED EARTH PROTOCOL [!]
        </h3>
        <div className="space-y-3 text-xs md:text-sm text-gray-400 font-bold">
          {phase >= 0 && <p className="type-text">&gt; root_access: granted. locking interface...</p>}
          {phase >= 1 && <p className="type-text text-amber-500">&gt; WIPE_COMPLETE: MEMORY SECTORS SECURED.</p>}
          {phase >= 2 && <p className="type-text text-orange-500">&gt; DISCONNECTING_SOCKETS: SEVERING NETWORK TIES...</p>}
          {phase >= 3 && <p className="type-text text-brand animate-glitch drop-shadow-[0_0_8px_#ff0033]">&gt; SENDING_KILL_SIGNAL_TO_HOST_PROCESS...</p>}
        </div>
      </div>
      
      <style>{`
        .type-text {
          overflow: hidden;
          white-space: nowrap;
          animation: typing 0.5s steps(40, end);
        }
        @keyframes typing { from { width: 0 } to { width: 100% } }
      `}</style>
    </div>
  );
};
