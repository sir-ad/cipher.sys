import { useRef, useCallback, useEffect } from 'react';

export const useCyberAudio = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  // Listen for first interaction to unlock audio
  useEffect(() => {
    const unlock = () => { initAudio(); window.removeEventListener('click', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => { window.removeEventListener('click', unlock); window.removeEventListener('keydown', unlock); };
  }, [initAudio]);

  const playKeystroke = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  const playSuccess = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, []);

  const playAlarm = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, []);

  const playPing = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, []);

  const playWarning = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const triggerBeep = (timeOffset: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, ctx.currentTime + timeOffset);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + timeOffset);
      gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.1);
    };

    triggerBeep(0);
    triggerBeep(0.15);
  }, []);

  const playPurge = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Aggressive static/explosion sound for data purge
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);
    
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2000, ctx.currentTime);
    noiseFilter.frequency.linearRampToValueAtTime(100, ctx.currentTime + 3);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.5, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 3);
    noise.start();
    noise.stop(ctx.currentTime + 3);
  }, []);

  const playRingtone = useCallback(() => {
    if (!audioCtxRef.current) return { stop: () => {} };
    const ctx = audioCtxRef.current;
    
    // Aggressive discordant ringing
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const masterGain = ctx.createGain();
    
    osc1.type = 'square';
    osc2.type = 'sawtooth';
    osc1.frequency.value = 850;
    osc2.frequency.value = 890;

    // LFO to make it warble like an old scrambled phone line
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 20;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 50;
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    // Amplitude modulation for ringing effect (on/off rhythm)
    const amOsc = ctx.createOscillator();
    amOsc.type = 'square';
    amOsc.frequency.value = 2; // 2 rings per second
    const amGain = ctx.createGain();
    amGain.gain.value = 0.5;
    
    amOsc.connect(masterGain.gain);

    osc1.connect(masterGain);
    osc2.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    lfo.start();
    amOsc.start();
    
    return {
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
          lfo.stop();
          amOsc.stop();
          masterGain.disconnect();
        } catch (e) {}
      }
    };
  }, []);

  return { playKeystroke, playSuccess, playAlarm, playPing, playWarning, playPurge, playRingtone, initAudio };
};
