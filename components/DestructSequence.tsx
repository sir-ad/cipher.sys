import React, { useState, useEffect } from 'react';
import { DestructReason } from '../types';
import { useCyberAudio } from '../hooks/useCyberAudio';

interface DestructSequenceProps {
  completedCount: number;
  reason: DestructReason;
  onKeep: () => void;
  onDestruct: () => void;
}

export const DestructSequence: React.FC<DestructSequenceProps> = ({
  completedCount,
  reason,
  onKeep,
  onDestruct,
}) => {
  const [countdown, setCountdown] = useState(10);
  const [codename, setCodename] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [bgHexData, setBgHexData] = useState('');
  
  // Bring in the audio hooks
  const { playKeystroke, playPurge, initAudio } = useCyberAudio();

  useEffect(() => {
    setCodename(localStorage.getItem('agent_codename') || 'GHOST');
    initAudio(); // Ensure audio context is ready
  }, [initAudio]);

  useEffect(() => {
    if (countdown <= 0) {
      playPurge(); // Massive static burst on death
      onDestruct();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev - 1 > 0) playKeystroke(); // Tick sound every second
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onDestruct, playKeystroke, playPurge]);

  // Dynamic terminal lines populating one by one
  useEffect(() => {
    const lines = [];
    if (countdown <= 10) lines.push('> SYSTEM_AUTH_OVERRIDE_ACCEPTED');
    if (countdown <= 9) lines.push('> BYPASSING_LOCAL_FAILSAFES...');
    if (countdown <= 8) lines.push('> UNMOUNTING_SECURE_VOLUMES...');
    if (countdown <= 7) lines.push('> SHREDDING_DIRECTIVE_INDEX...');
    if (countdown <= 6) lines.push('> CORRUPTING_BOOT_SEQUENCE...');
    if (countdown <= 5) lines.push(`> OVERWRITING_SECTORS [${(10 - countdown) * 10}%]`);
    if (countdown <= 4) lines.push('> NULLIFYING_ASSET_REGISTRY...');
    if (countdown <= 3) lines.push('> ERASING_OPERATIVE_FOOTPRINT...');
    if (countdown <= 2) lines.push('> SEVERING_UPLINK_CONNECTIONS...');
    if (countdown <= 1) lines.push('> PURGING_MEMORY_BANKS...');
    if (countdown <= 0) lines.push('> WARNING: CRITICAL MEMORY LOSS IMMINENT');
    setTerminalLines(lines);
  }, [countdown]);

  // Background intense data wipe visualization when critical
  useEffect(() => {
    if (countdown <= 5) {
      const interval = setInterval(() => {
        setBgHexData(Array.from({length: 300}, () => Math.floor(Math.random() * 16).toString(16)).join(' '));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [countdown]);

  const isCritical = countdown <= 3;
  const isManualBurn = reason === DestructReason.MANUAL_BURN;
  
  // Context-aware text elements
  const headerIcon = isCritical ? '⚠️' : (isManualBurn ? '🧨' : '☢️');
  const headerText = isManualBurn ? 'SCORCHED EARTH OVERRIDE' : 'Terminal Purge Authorized';
  
  let contextText = '';
  let themeColor = 'amber';
  
  if (isManualBurn) {
    contextText = 'Manual override authorized. Immediate thermal inversion of local sectors required.';
    themeColor = 'red';
  } else if (reason === DestructReason.OPTIMAL_CLEAR) {
    contextText = 'Mission accomplished flawlessly. Covering tracks to ensure zero residual footprint.';
    themeColor = isCritical ? 'red' : 'blue';
  } else {
    contextText = 'Mission accomplished. Temporal decay was imminent. Purging memory sectors to prevent extraction.';
    themeColor = isCritical ? 'red' : 'amber';
  }

  // Dynamic CSS variables based on theme
  const getThemeVars = () => {
    if (themeColor === 'red') return { text: 'text-red-500', bg: 'bg-red-600', shadow: 'shadow-[0_0_150px_rgba(220,38,38,0.2)]', border: 'border-red-600', pulse: 'shadow-[0_0_50px_rgba(220,38,38,0.4)] bg-red-950/40' };
    if (themeColor === 'blue') return { text: 'text-blue-500', bg: 'bg-blue-600', shadow: 'shadow-[inset_0_0_100px_rgba(59,130,246,0.1)]', border: 'border-blue-600', pulse: 'shadow-[0_0_40px_rgba(59,130,246,0.3)] bg-blue-950/30' };
    return { text: 'text-amber-500', bg: 'bg-amber-500', shadow: '', border: 'border-gray-800', pulse: '' };
  };

  const theme = getThemeVars();

  return (
    <div className={`flex flex-col items-center justify-center h-full min-h-[70vh] text-center px-4 w-full max-w-5xl mx-auto transition-all duration-500 relative overflow-hidden ${isCritical ? 'bg-red-950/20 shadow-[inset_0_0_150px_rgba(220,38,38,0.2)]' : theme.shadow}`}>
      
      {/* Intense Background Hex Stream */}
      {countdown <= 5 && (
        <div className="absolute inset-0 z-0 overflow-hidden opacity-10 font-mono text-[8px] leading-none text-red-500 break-all select-none">
          {bgHexData}
        </div>
      )}

      {/* Sci-Fi Danger Striping */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${(isCritical || isManualBurn) ? 'opacity-30' : 'opacity-0'} z-0`} 
           style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, #ff0033 20px, #ff0033 40px)' }}>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full mt-4">
        <div className={`text-5xl md:text-7xl mb-6 md:mb-10 transition-transform duration-300 ${isCritical ? `animate-glitch ${theme.text} scale-125` : `animate-pulse ${theme.text}`}`}>
          {headerIcon}
        </div>
        
        <h2 className={`text-2xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 uppercase tracking-widest transition-colors ${theme.text}`}>
          {headerText}
        </h2>

        <div className="space-y-4 md:space-y-6 text-gray-400 mb-6 md:mb-8 max-w-sm md:max-w-2xl text-fluid-sm md:text-fluid-base">
          {!isManualBurn && (
            <p>Excellent work, <strong className={`${theme.text} uppercase`}>{codename}</strong>. You successfully neutralized <strong className="text-white">{completedCount}</strong> {completedCount === 1 ? 'target' : 'targets'}.</p>
          )}
          <p className="text-gray-500 italic border-l-2 border-gray-800 pl-4 py-2 bg-gray-900/30">
            {contextText}
          </p>
        </div>

        {/* Live Terminal Output Console */}
        <div className="w-full max-w-sm md:max-w-xl lg:max-w-2xl bg-[#030303] border border-gray-800 p-4 md:p-6 text-left font-mono text-xs md:text-sm text-gray-500 mb-8 h-40 md:h-48 overflow-hidden flex flex-col justify-end shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] rounded-sm">
          <div className="flex flex-col space-y-1">
            {terminalLines.map((line, idx) => (
              <p key={idx} className={`animate-fade-in ${line.includes('WARNING') || line.includes('OVERWRITING') ? theme.text : ''}`}>
                {line}
              </p>
            ))}
            <div className="w-2 h-4 bg-gray-500 animate-flicker mt-1 inline-block"></div>
          </div>
        </div>

        {/* Visual Depletion Bar */}
        <div className="w-full max-w-sm md:max-w-xl lg:max-w-2xl h-1 md:h-2 bg-gray-900 mb-6 md:mb-8 overflow-hidden relative">
          <div 
            className={`absolute top-0 left-0 bottom-0 transition-all duration-1000 ease-linear ${isCritical ? 'bg-red-600 shadow-[0_0_10px_#dc2626]' : theme.bg}`}
            style={{ width: `${(countdown / 10) * 100}%` }}
          ></div>
        </div>

        <div className={`mb-12 md:mb-16 border p-6 md:p-12 lg:p-16 rounded bg-surface w-full max-w-sm md:max-w-xl lg:max-w-2xl transition-all duration-300 ${isCritical ? `scale-105 ${theme.pulse} ${theme.border}` : theme.border}`}>
          <div className={`text-7xl md:text-9xl font-mono font-bold tracking-tighter flex justify-center gap-4 ${isCritical ? 'text-red-500 animate-pulse' : theme.text}`}>
            <span>00</span>
            <span className={isCritical ? 'animate-flicker' : ''}>:</span>
            <span>{countdown.toString().padStart(2, '0')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-8 w-full max-w-sm md:max-w-2xl z-20 pb-10">
          <button
            onClick={onKeep}
            className="flex-1 px-6 py-4 md:py-6 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors uppercase tracking-wider text-xs md:text-sm font-bold focus:outline-none backdrop-blur-sm bg-black/50"
          >
            Abort Sequence
          </button>
          <button
            onClick={onDestruct}
            className={`flex-1 px-6 py-4 md:py-6 text-white transition-all uppercase tracking-wider text-xs md:text-sm font-bold focus:outline-none ${isCritical ? 'bg-red-700 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.6)]' : 'bg-red-900 hover:bg-red-600'}`}
          >
            Force Detonation &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
