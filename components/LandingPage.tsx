import React, { useEffect, useState } from 'react';
import { useCyberAudio } from '../hooks/useCyberAudio';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const { playKeystroke, initAudio, playPing } = useCyberAudio();
  const [bootText, setBootText] = useState<string>('');
  const [isLocalNode, setIsLocalNode] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [manualJoinTarget, setManualJoinTarget] = useState('');
  const [joinHint, setJoinHint] = useState('If cipher.local fails, enter host IP (example: 192.168.1.5).');
  
  useEffect(() => {
    // Detect if the operative is accessing this page from the deployed local daemon vs the public recruitment website
    setIsLocalNode(
      window.location.hostname === 'cipher.local' || 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    );

    const sequence = [
      "> CIPHER.SYS // V4.0.0_PHOENIX",
      "> UPLINK ESTABLISHED.",
      "> SECURING LOCAL ENCLAVE..."
    ];
    let i = 0;
    const t = setInterval(() => {
      if (i < sequence.length) {
        setBootText(prev => prev + (prev ? '\n' : '') + sequence[i]);
        i++;
      } else {
        clearInterval(t);
      }
    }, 400);
    return () => clearInterval(t);
  }, []);

  const normalizeJoinTarget = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    let candidate = trimmed;
    if (!/^https?:\/\//i.test(candidate)) candidate = `http://${candidate}`;
    try {
      const url = new URL(candidate);
      const port = url.port || '4040';
      return `${url.protocol === 'https:' ? 'https:' : 'http:'}//${url.hostname}:${port}`;
    } catch (_) {
      return null;
    }
  };

  const openManualJoin = () => {
    const normalized = normalizeJoinTarget(manualJoinTarget);
    if (!normalized) {
      setJoinHint('Invalid join target. Use IP or host, e.g. 192.168.1.5');
      return;
    }
    window.location.href = normalized;
  };

  const handleConnect = async () => {
    if (isLocalNode) {
      initAudio();
      playPing();
      onEnter();
    } else {
      const target = 'http://cipher.local:4040';
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        await fetch(`${target}/healthz`, { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timer);
        window.location.href = target;
      } catch (_) {
        setShowFallback(true);
        setJoinHint('cipher.local did not resolve. Use host IP join instead.');
      }
    }
  };

  const scrollToDeploy = () => {
    playKeystroke();
    document.getElementById('deploy')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono overflow-x-hidden selection:bg-brand selection:text-black scroll-smooth">
      {/* Top Bar */}
      <nav className="fixed top-0 w-full border-b border-gray-900 bg-black/80 backdrop-blur-md z-50 p-4 px-6 md:px-12 flex justify-between items-center">
        <div className="text-brand font-black tracking-[0.3em] uppercase text-sm md:text-base animate-pulse">CIPHER.SYS</div>
        <div className="flex gap-6">
          <a href="https://sir-ad.github.io/cipher.sys/docs/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white uppercase tracking-widest text-[10px] md:text-xs transition-colors hidden sm:block">
            [ DOCS ]
          </a>
          <a href="https://github.com/sir-ad/cipher.sys" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white uppercase tracking-widest text-[10px] md:text-xs transition-colors">
            [ SOURCE ]
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center border-b border-gray-900 pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,51,0.03)_0%,transparent_100%)] pointer-events-none"></div>
        
        {/* Boot Terminal Output */}
        <div className="absolute top-24 left-6 md:left-12 text-gray-600 text-[10px] md:text-xs text-left whitespace-pre-wrap font-mono tracking-widest hidden sm:block">
          {bootText}
          <span className="animate-flicker inline-block w-2 h-3 bg-gray-600 ml-1"></span>
        </div>

        <div className="z-10 max-w-5xl w-full flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-black text-white uppercase tracking-tighter leading-[0.9] mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Productivity<br/>
            <span className="text-brand inline-block mt-2 animate-glitch drop-shadow-[0_0_20px_rgba(255,0,51,0.5)]">Is A Trap.</span>
          </h1>
          
          <h2 className="text-xl md:text-3xl text-gray-400 mt-6 tracking-[0.4em] uppercase font-bold border-t border-b border-gray-800 py-4 w-full max-w-2xl">
            We want you gone.
          </h2>
          
          <p className="text-xs md:text-sm text-gray-500 mt-10 max-w-xl leading-relaxed tracking-wider uppercase">
            The self-destructing terminal. Max 5 directives. 7-day thermal decay.<br/><br/>
            Execute your mission, or the system executes itself.
          </p>

          <button 
            onClick={scrollToDeploy}
            className="mt-16 px-8 md:px-12 py-5 md:py-6 bg-brand text-white border border-brand hover:bg-white hover:text-brand hover:shadow-[0_0_40px_rgba(255,0,51,0.8)] transition-all duration-300 uppercase tracking-[0.3em] font-bold text-xs md:text-sm focus:outline-none"
          >
            [ DEPLOY LOCAL NODE ]
          </button>
        </div>
      </section>

      {/* The Philosophy */}
      <section className="py-24 px-6 max-w-4xl mx-auto border-b border-gray-900">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-4 h-4 bg-brand animate-pulse"></div>
          <h2 className="text-2xl md:text-4xl text-white font-bold uppercase tracking-widest">
            The Philosophy
          </h2>
        </div>
        
        <div className="space-y-8 text-gray-400 text-sm md:text-base tracking-wider leading-relaxed border-l border-brand/50 pl-6 md:pl-10">
          <p>
            Most applications demand engagement. They weaponize dopamine, feeding you arbitrary points, infinite nested folders, and massive "someday" backlogs.
          </p>
          <p>
            They are a psychological cage where the act of planning replaces the act of <span className="text-white font-bold bg-white/10 px-2 py-1">executing</span>.
          </p>
          <p className="text-brand font-bold uppercase tracking-widest">
            CIPHER.SYS operates on absolute constraint and terminal consequences.
          </p>
          <p className="text-xs text-gray-600 uppercase pt-4 border-t border-gray-900">
            [ <span className="bg-gray-600 text-black px-1 mx-1 hover:bg-transparent hover:text-brand cursor-crosshair transition-colors duration-300">CLASSIFIED_PSYCH_PROFILE</span>: Endless lists induce executive dysfunction. Constraint forces prioritization. ]
          </p>
        </div>
      </section>

      {/* Tactical Capabilities */}
      <section className="py-24 px-6 max-w-6xl mx-auto border-b border-gray-900">
        <h2 className="text-xl md:text-2xl text-gray-500 font-bold uppercase tracking-[0.3em] mb-16 text-center">
          Tactical Capabilities
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Cap */}
          <div className="border border-gray-800 bg-[#050505] p-8 hover:border-brand/50 transition-colors group">
            <h3 className="text-brand text-xl font-bold uppercase tracking-widest mb-4 group-hover:animate-pulse">
              1. The Hard Cap [ 5/5 ]
            </h3>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed uppercase tracking-wider">
              The human brain cannot execute 20 tasks simultaneously. CIPHER physically restricts input to 5 active directives. You cannot overload the system. Finish a payload or delete it.
            </p>
          </div>

          {/* Decay */}
          <div className="border border-gray-800 bg-[#050505] p-8 hover:border-brand/50 transition-colors group">
            <h3 className="text-brand text-xl font-bold uppercase tracking-widest mb-4 group-hover:animate-pulse">
              2. Thermal Decay
            </h3>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed uppercase tracking-wider">
              There is no "Someday" list. Every directive decays. If 168 hours (7 days) pass without execution, the asset is permanently purged from the database. If it dies, it wasn't important.
            </p>
          </div>

          {/* Focus */}
          <div className="border border-gray-800 bg-[#050505] p-8 hover:border-brand/50 transition-colors group">
            <h3 className="text-white text-xl font-bold uppercase tracking-widest mb-4 group-hover:animate-pulse">
              3. Tunnel Vision [ ENGAGE ]
            </h3>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed uppercase tracking-wider">
              Clicking <span className="text-white font-bold border border-gray-600 px-1">[ ENGAGE ]</span> rips away the UI, leaving only one massive target and a live tactical stopwatch. Choice paralysis is neutralized.
            </p>
          </div>

          {/* M.A.D. */}
          <div className="border border-brand/30 bg-red-950/10 p-8 shadow-[inset_0_0_30px_rgba(255,0,51,0.05)] hover:border-brand transition-colors group">
            <h3 className="text-brand text-xl font-bold uppercase tracking-widest mb-4 group-hover:animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 bg-brand rounded-full"></span>
              4. Scorched Earth
            </h3>
            <p className="text-xs md:text-sm text-red-200/60 leading-relaxed uppercase tracking-wider">
              Upon completing all targets, the terminal concludes its usefulness. An unabortable 10-second self-destruct sequence begins, physically erasing the local footprint.
            </p>
          </div>
        </div>
      </section>

      {/* Deployment / Installation (The Gate) */}
      <section id="deploy" className="py-24 px-6 max-w-4xl mx-auto border-b border-gray-900">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-4 h-4 bg-brand animate-pulse"></div>
          <h2 className="text-2xl md:text-4xl text-white font-bold uppercase tracking-widest">
            Deployment & Access
          </h2>
        </div>
        
        <div className="border border-gray-800 bg-[#050505] p-6 md:p-10 shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
          <p className="text-gray-400 text-sm md:text-base leading-relaxed tracking-wider uppercase mb-8">
            CIPHER is not a cloud service. It is an autonomous background daemon. To interact with the terminal, you must first spawn the host process locally.
          </p>

          <div className="bg-black border border-gray-800 p-4 md:p-6 font-mono text-xs md:text-sm text-gray-300 relative overflow-hidden group mb-8 shadow-[inset_0_0_15px_rgba(255,0,51,0.05)]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,51,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,51,0.02)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"></div>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand shadow-[0_0_10px_#ff0033]"></div>
            
            <div className="flex flex-col gap-3 relative z-10">
              <div className="text-gray-600 mb-2 uppercase tracking-widest text-[10px]"># 1. Install the CLI Package via NPM</div>
              <div className="flex items-center gap-3">
                <span className="text-brand select-none">&gt;</span>
                <code className="text-gray-300 select-all">npm install -g @cipher.sys/terminal</code>
              </div>
              
              <div className="text-gray-600 mt-4 mb-2 uppercase tracking-widest text-[10px]"># 2. Spawn the Ghost Protocol Daemon</div>
              <div className="flex items-center gap-3">
                <span className="text-brand select-none">&gt;</span>
                <code className="text-gray-300 select-all">cipher</code>
              </div>
            </div>
          </div>

          <div className="text-amber-500/80 text-[10px] md:text-xs uppercase tracking-widest mb-10 border-l border-amber-900 pl-4 py-3 bg-amber-950/20">
            Daemon will detach and attempt mDNS broadcast at <strong className="text-white">http://cipher.local:4040</strong>.<br/>
            If mDNS is blocked on your network, use direct host IP join.
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <button 
              onClick={handleConnect}
              className="flex-1 py-5 md:py-6 bg-brand/10 border border-brand text-brand hover:bg-brand hover:text-white transition-all duration-300 uppercase tracking-[0.2em] font-bold text-xs md:text-sm shadow-[0_0_20px_rgba(255,0,51,0.1)] hover:shadow-[0_0_40px_rgba(255,0,51,0.6)] focus:outline-none text-center"
            >
              {isLocalNode ? '[ INITIALIZE TERMINAL ]' : '[ CONNECT TO LOCAL DAEMON ]'}
            </button>
            
            <a 
              href="https://sir-ad.github.io/cipher.sys/docs/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 py-5 md:py-6 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-all duration-300 uppercase tracking-[0.2em] font-bold text-xs md:text-sm text-center flex items-center justify-center gap-2 focus:outline-none bg-black"
            >
              [ DECLASSIFIED FIELD MANUAL ]
            </a>
          </div>

          {showFallback && (
            <div className="mt-6 border border-brand/30 bg-black p-4 md:p-5">
              <p className="text-brand text-[10px] md:text-xs uppercase tracking-[0.2em] mb-3">{joinHint}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={manualJoinTarget}
                  onChange={(e) => setManualJoinTarget(e.target.value)}
                  placeholder="HOST IP OR URL (e.g. 192.168.1.5)"
                  className="flex-1 bg-black border border-gray-700 px-3 py-2 text-xs md:text-sm text-gray-300 focus:outline-none focus:border-brand tracking-widest uppercase"
                />
                <button
                  onClick={openManualJoin}
                  className="px-4 py-2 border border-brand text-brand hover:bg-brand hover:text-white transition-colors text-xs uppercase tracking-[0.2em] font-bold focus:outline-none"
                >
                  [ OPEN HOST ]
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Syndicate Protocol */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center border-b border-gray-900">
        <div className="inline-block border border-amber-900/50 bg-[#0a0600] p-8 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(245,158,11,0.02)_10px,rgba(245,158,11,0.02)_20px)] pointer-events-none"></div>
          
          <h2 className="text-amber-500 text-3xl md:text-5xl font-black uppercase tracking-widest mb-8 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] relative z-10">
            SYNDICATE PROTOCOL
          </h2>
          
          <p className="text-amber-600/80 text-sm md:text-base uppercase tracking-widest leading-relaxed max-w-2xl mx-auto relative z-10 font-bold mb-8">
            Productivity is no longer a solo survival horror. It is a tactical squad shooter.
          </p>

          <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wider leading-relaxed max-w-2xl mx-auto relative z-10 border-t border-amber-900/50 pt-8 text-left">
            Join the Local Command Network. Delegate tasks cross-node using <strong className="text-amber-500">@OP-ID</strong> syntax. Assigned directives require <strong className="text-white">Two-Key Handler Authentication</strong> to close.<br/><br/>
            Survive together under <strong className="text-brand">Mutually Assured Destruction</strong>. If one squad member lets a task decay, the entire network takes an integrity strike. Three strikes triggers global network wipe.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center bg-black">
        <p className="text-gray-700 text-[10px] uppercase tracking-[0.4em] mb-4">
          END OF TRANSMISSION
        </p>
        <p className="text-brand/30 text-[8px] uppercase tracking-widest">
          CIPHER.SYS // 100% LOCAL // ZERO CLOUD // OPEN SOURCE
        </p>
      </footer>
    </div>
  );
};
