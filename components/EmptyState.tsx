import React from 'react';

interface EmptyStateProps {
  syndicateMode?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ syndicateMode }) => {
  return (
     <div className="flex flex-col items-center justify-center min-h-[40vh] animate-fade-in font-mono text-center w-full px-4">
        <div className="w-3 h-3 md:w-4 md:h-4 bg-brand rounded-full animate-pulse shadow-[0_0_15px_#ff0033] mb-6 md:mb-8"></div>
        <h2 className="text-xl md:text-3xl lg:text-4xl text-white font-bold uppercase tracking-widest mb-4">You have nothing to do.</h2>
        <p className="text-xs md:text-sm text-gray-500 max-w-md tracking-wider">
          That is a good place to be. Await further directives or input a new target below.
          {syndicateMode && (
             <span className="block mt-4 text-amber-600/70 border border-amber-900/30 bg-amber-900/10 p-2 text-[10px] uppercase">
               Squad Link Active: Delegate payloads via @OP-ID syntax.
             </span>
          )}
        </p>
     </div>
  )
};
