import { Task, Stats } from '../types';
import { STORAGE_KEY_TASKS, STORAGE_KEY_STATS, INITIAL_STATS } from '../constants';

export const loadTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_TASKS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load tasks', e);
    return [];
  }
};

export const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
};

export const loadStats = (): Stats => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_STATS);
    return data ? JSON.parse(data) : INITIAL_STATS;
  } catch (e) {
    console.error('Failed to load stats', e);
    return INITIAL_STATS;
  }
};

export const saveStats = (stats: Stats): void => {
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
};
