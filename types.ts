export type TaskStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'NEUTRALIZED';

export interface Task {
  id: string;
  text: string;
  createdAt: number;
  completedAt: number | null;
  updatedAt?: number;
  deletedAt?: number | null;
  
  // Syndicate Protocol Extensions
  owner?: string | null;       // OP-ID of the assignee carrying the burden
  handler?: string | null;     // OP-ID of the assigner who must verify the kill
  status?: TaskStatus;         // State machine for Two-Key authentication
  syndicate?: boolean;         // True if created under Syndicate Protocol
}

export interface Stats {
  totalCompleted: number;
  totalExpired: number;
  totalSessions: number;
  fastestSessionMs: number | null;
}

export interface CoprocessorStatus {
  active: boolean;
  type: string | null;
  modelCount: number;
}

export interface HandlerMessage {
  text: string;
  timestamp: number;
  isAI: boolean;
}

export interface NetworkNode {
  socketId: string;
  opId: string;
  ip: string;
  activeTaskCount: number;
}

export enum AppView {
  LANDING = 'LANDING',
  IDENTIFY = 'IDENTIFY',
  TASKS = 'TASKS',
  ENGAGED = 'ENGAGED',
  EXPIRED_NOTICE = 'EXPIRED_NOTICE',
  INCOMING_CALL = 'INCOMING_CALL',
  DESTRUCTING = 'DESTRUCTING',
  DESTRUCTED = 'DESTRUCTED',
  
  // Syndicate Protocol Extensions
  INCOMING_DIRECTIVE = 'INCOMING_DIRECTIVE',
  GLOBAL_WIPE = 'GLOBAL_WIPE'
}

export enum DestructReason {
  OPTIMAL_CLEAR = 'OPTIMAL_CLEAR',
  MARGINAL_CLEAR = 'MARGINAL_CLEAR',
  MANUAL_BURN = 'MANUAL_BURN'
}
