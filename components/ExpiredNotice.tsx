import React from 'react';

interface ExpiredNoticeProps {
  count: number;
  onAcknowledge: () => void;
}

export const ExpiredNotice: React.FC<ExpiredNoticeProps> = ({ count, onAcknowledge }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in px-4">
      <div className="text-4xl mb-6 opacity-80">💨</div>
      <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest">Directives Purged</h2>
      
      <div className="space-y-6 text-gray-400 max-w-sm">
        <p>
          <span className="text-white font-bold">{count}</span> {count === 1 ? 'directive' : 'directives'} vanished because they remained unexecuted for 168 hours.
        </p>
        <p>
          That's okay. They weren't critical enough to survive.
        </p>
        <p className="text-sm text-gray-600 italic">
          If they were, they will resurface.
        </p>
      </div>

      <button
        onClick={onAcknowledge}
        className="mt-12 px-8 py-3 bg-white text-black font-bold uppercase tracking-wider text-sm hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
      >
        Acknowledge
      </button>
    </div>
  );
};
