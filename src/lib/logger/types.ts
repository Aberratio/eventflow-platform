export type LogLevel = 'info' | 'warn' | 'error' | 'audit';

export type LogCategory =
  | 'auth'
  | 'event'
  | 'registration'
  | 'result'
  | 'shop'
  | 'user'
  | 'moderation'
  | 'cms'
  | 'challenge'
  | 'email'
  | 'settings'
  | 'navigation'
  | 'system';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  action: string;
  description: string;
  userId?: string;
  userRole?: string;
  userName?: string;
  targetType?:
    | 'user'
    | 'event'
    | 'order'
    | 'product'
    | 'page'
    | 'challenge'
    | 'registration'
    | 'settings';
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
  sessionId: string;
}

export interface LogTransport {
  send(entries: LogEntry[]): Promise<void>;
}

export interface LoggerUserContext {
  id: string;
  role: string;
  name?: string;
  email?: string;
}
