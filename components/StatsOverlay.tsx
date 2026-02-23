import React from 'react';
import { Stats } from '../types';

interface StatsOverlayProps {
  stats: Stats;
}

const formatDuration = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined) return '-';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours < 1) {
    if (minutes < 1) return '< 1m';
    return `${minutes}m`;
  }
  
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

export const StatsOverlay: React.FC<StatsOverlayProps> = ({ stats }) => {
  if (stats.totalCompleted === 0 && stats.totalExpired === 0 && stats.totalSessions === 0) {
    return null;
  }

  return (
    <div className="mt-8 md:mt-16 pt-6 md:pt-8 border-t border-gray-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] md:text-xs uppercase tracking-widest text-gray-700 w-full max-w-5xl mx-auto pb-4">
      <div className="md:tracking-[0.3em]">Lifetime</div>
      <div className="flex flex-wrap gap-4 md:gap-8">
        <span title="Total Tasks Completed">C: <strong className="text-gray-500">{stats.totalCompleted}</strong></span>
        <span title="Total Tasks Expired">E: <strong className="text-gray-500">{stats.totalExpired}</strong></span>
        <span title="Total Sessions Conquered">S: <strong className="text-gray-500">{stats.totalSessions}</strong></span>
        <span title="Fastest Session" className="text-brand/60 font-bold ml-auto sm:ml-0">
          ⚡ {formatDuration(stats.fastestSessionMs)}
        </span>
      </div>
    </div>
  );
};
