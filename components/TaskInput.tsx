import React, { useState, useEffect, useRef } from 'react';
import { useCyberAudio } from '../hooks/useCyberAudio';

interface TaskInputProps {
  onAdd: (text: string) => void;
  disabled: boolean;
  hasTasks?: boolean;
  syndicateMode?: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd, disabled, hasTasks = false, syndicateMode = false }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playKeystroke, playPing } = useCyberAudio();

  // Detect network delegation payload
  const isNetworkPayload = syndicateMode && text.trim().startsWith('@');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    playKeystroke();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onAdd(text);
      setText('');
    }
  };

  const toggleVoice = () => {
    if (disabled) return;
    
    if (!window.isSecureContext) {
      alert('[!] AUDIO INTERFACE BLOCKED.\n\nHTTPS ENCRYPTION REQUIRED. Mobile operatives must use a secure tunnel (e.g., Tailscale, ngrok, or HTTPS proxy) to establish a voice comm-link over the network.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('[!] CRYPTOGRAPHIC AUDIO MODULE MISSING.\n\nYour browser does not support the Web Speech API. Use Chrome or Safari.');
      return;
    }
    
    if (isListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        playPing();
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setText(prev => (prev ? prev + ' ' : '') + transcript);
        setIsListening(false);
        inputRef.current?.focus();
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        if (e.error === 'not-allowed') {
          alert('[!] MICROPHONE ACCESS DENIED. Adjust OS/Browser permissions.');
        }
      };
      
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      alert('[!] AUDIO SUBSYSTEM FAILURE. Check permissions and secure context.');
      setIsListening(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group/form w-full flex items-end">
      <div className={`flex-grow flex items-center border-gray-900 focus-within:border-brand transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${hasTasks ? 'border-b-2 md:border-b-[3px] pb-3 md:pb-4' : 'border-b-4 md:border-b-8 pb-6 md:pb-10'} ${isNetworkPayload ? 'border-amber-500 focus-within:border-amber-500' : ''}`}>
        <span className={`select-none font-bold leading-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${disabled ? 'text-gray-800' : (isNetworkPayload ? 'text-amber-500 animate-pulse' : 'text-brand animate-pulse')} ${hasTasks ? 'mr-3 md:mr-5 text-3xl sm:text-4xl md:text-5xl' : 'mr-4 md:mr-8 text-6xl sm:text-7xl md:text-8xl lg:text-9xl'}`}>
          &gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          disabled={disabled || isListening}
          placeholder={disabled ? "CAPACITY REACHED [5/5]" : isListening ? "LISTENING FOR DIRECTIVE..." : "INPUT DIRECTIVE..."}
          className={`flex-grow bg-transparent text-white placeholder-gray-800 focus:outline-none disabled:opacity-50 font-mono tracking-widest uppercase transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] w-full min-w-0 ${hasTasks ? 'text-base sm:text-lg md:text-xl lg:text-2xl mt-1' : 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl mt-2 md:mt-4'} ${isListening ? 'animate-pulse text-brand' : ''} ${isNetworkPayload ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''}`}
          autoFocus={!hasTasks}
        />
        <div className={`absolute bottom-0 left-0 w-full scale-x-0 group-focus-within/form:scale-x-100 transition-transform duration-500 origin-left ${isNetworkPayload ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.9)]' : 'bg-brand shadow-[0_0_15px_rgba(255,26,26,0.9)]'} ${hasTasks ? 'h-[2px] md:h-[3px]' : 'h-[4px] md:h-[8px]'}`}></div>
      </div>
      
      {/* Covert Mic Button */}
      <button 
        type="button"
        onClick={toggleVoice}
        disabled={disabled}
        className={`ml-4 shrink-0 transition-all focus:outline-none ${hasTasks ? 'w-10 h-10 md:w-12 md:h-12 border border-gray-800' : 'w-16 h-16 md:w-20 md:h-20 border-2 border-gray-800'} rounded-full flex items-center justify-center ${isListening ? 'border-brand bg-brand/20 shadow-[0_0_15px_#ff0033] animate-pulse' : 'hover:border-brand hover:bg-brand/10 bg-transparent disabled:opacity-30'}`}
        title="Voice Surveillance Link"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isListening ? 'text-brand w-1/2 h-1/2' : 'text-gray-500 w-1/2 h-1/2'}>
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
        </svg>
      </button>
    </form>
  );
};
