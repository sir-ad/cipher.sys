import React, { useState } from 'react';
import { useCyberAudio } from '../hooks/useCyberAudio';

interface OnboardingProps {
  onComplete: (codename: string, joinSyndicate: boolean) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'identify' | 'briefing'>('identify');
  const [inputVal, setInputVal] = useState('');
  const [joinSyndicate, setJoinSyndicate] = useState(false);
  const { playKeystroke, playSuccess, initAudio } = useCyberAudio();

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      initAudio(); 
      playSuccess();
      setPhase('briefing');
    }
  };

  if (phase === 'identify') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center font-mono z-50 px-4">
        <form onSubmit={handleIdentify} className="w-full max-w-md relative animate-fade-in">
          <div className="flex flex-col mb-8 text-center text-gray-500 uppercase tracking-widest text-xs">
            <span>Authentication Required</span>
            <span className="text-brand animate-pulse">Enter OP-ID to proceed</span>
          </div>
          <div className="flex items-center border-b-2 border-gray-800 pb-4 focus-within:border-brand transition-colors duration-500">
            <span className="text-brand mr-4 animate-pulse text-xl md:text-2xl">&gt;</span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => { setInputVal(e.target.value); playKeystroke(); }}
              placeholder="STATE YOUR DESIGNATION..."
              className="flex-grow bg-transparent text-white placeholder-gray-800 focus:outline-none text-base md:text-lg tracking-widest uppercase"
              autoFocus
            />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center font-mono z-50 px-6 text-center animate-fade-in">
       <h1 className="text-brand text-2xl md:text-4xl font-bold uppercase tracking-[0.4em] mb-12 drop-shadow-[0_0_10px_#ff0033]">Handshake Secured</h1>
       
       <div className="max-w-xl text-gray-400 text-xs md:text-sm space-y-6 md:space-y-8 leading-relaxed uppercase tracking-widest text-left border-l border-brand/50 pl-6 md:pl-8 mb-12">
         <p className="animate-fade-in" style={{animationDelay: '0.2s'}}>&gt; You are permitted exactly 5 active directives at any time.</p>
         <p className="animate-fade-in" style={{animationDelay: '0.8s'}}>&gt; Directives undergo thermal decay and are purged after 168 hours (7 days).</p>
         <p className="animate-fade-in" style={{animationDelay: '1.4s'}}>&gt; Failed directives will be permanently erased from the ledger.</p>
         <p className="animate-fade-in text-white" style={{animationDelay: '2.0s'}}>&gt; Upon completion of all targets, this node will self-destruct.</p>
       </div>

       <div className="w-full max-w-xl animate-fade-in border border-gray-900 bg-[#050505] p-6 text-left mb-12" style={{animationDelay: '2.5s'}}>
         <h3 className="text-white text-xs md:text-sm tracking-[0.3em] font-bold uppercase mb-4 border-b border-gray-800 pb-2">
           Select Deployment Profile
         </h3>
         <div className="flex flex-col gap-4">
           <label className="flex items-start gap-4 cursor-pointer group">
             <div className={`w-5 h-5 shrink-0 border flex items-center justify-center mt-0.5 transition-colors ${!joinSyndicate ? 'border-brand bg-brand/10' : 'border-gray-700'}`}>
                {!joinSyndicate && <div className="w-2.5 h-2.5 bg-brand"></div>}
             </div>
             <div>
               <div className={`tracking-[0.2em] font-bold text-xs md:text-sm ${!joinSyndicate ? 'text-white' : 'text-gray-500'}`}>LONE WOLF</div>
               <div className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">Local isolated node. Standard protocol.</div>
             </div>
             <input type="radio" className="hidden" checked={!joinSyndicate} onChange={() => { setJoinSyndicate(false); playKeystroke(); }} />
           </label>

           <label className="flex items-start gap-4 cursor-pointer group">
             <div className={`w-5 h-5 shrink-0 border flex items-center justify-center mt-0.5 transition-colors ${joinSyndicate ? 'border-brand bg-brand/10 shadow-[0_0_10px_#ff0033]' : 'border-gray-700'}`}>
                {joinSyndicate && <div className="w-2.5 h-2.5 bg-brand animate-pulse"></div>}
             </div>
             <div>
               <div className={`tracking-[0.2em] font-bold text-xs md:text-sm ${joinSyndicate ? 'text-brand drop-shadow-[0_0_5px_#ff0033]' : 'text-gray-500'}`}>SYNDICATE (MULTIPLAYER)</div>
               <div className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">Connect to local network. Cross-node task delegation and Mutually Assured Destruction (M.A.D.) enabled.</div>
             </div>
             <input type="radio" className="hidden" checked={joinSyndicate} onChange={() => { setJoinSyndicate(true); playKeystroke(); }} />
           </label>
         </div>
       </div>

       <div className="animate-fade-in" style={{animationDelay: '3.0s'}}>
         <button 
           onClick={() => { initAudio(); onComplete(inputVal.trim().toUpperCase(), joinSyndicate); }}
           className="px-8 md:px-12 py-4 md:py-5 border border-brand text-brand hover:bg-brand hover:text-white hover:shadow-[0_0_20px_#ff0033] transition-all focus:outline-none tracking-[0.3em] font-bold text-xs md:text-sm"
         >
           [ ACCEPT & DEPLOY ]
         </button>
       </div>
    </div>
  );
};
