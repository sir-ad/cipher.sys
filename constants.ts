export const MAX_TASKS = 5;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const EXPIRY_DAYS = 7;
export const EXPIRY_MS = EXPIRY_DAYS * MS_PER_DAY;

// Syndicate Protocol Defaults
export const MAX_INTEGRITY = 3;

export const STORAGE_KEY_TASKS = 'vanish_tasks';
export const STORAGE_KEY_STATS = 'vanish_stats';

export const INITIAL_STATS = {
  totalCompleted: 0,
  totalExpired: 0,
  totalSessions: 0,
  fastestSessionMs: null,
};
