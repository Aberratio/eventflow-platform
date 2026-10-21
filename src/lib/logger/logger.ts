import type { LogLevel, LogCategory, LogEntry, LogTransport, LoggerUserContext } from './types';
import { MockTransport } from './transports';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateSessionId(): string {
  const stored = sessionStorage.getItem('__app_session_id');
  if (stored) return stored;
  const id = `s-${generateId()}`;
  sessionStorage.setItem('__app_session_id', id);
  return id;
}

const BUFFER_SIZE = 50;
const FLUSH_INTERVAL_MS = 10_000;

class AppLogger {
  private buffer: LogEntry[] = [];
  private transport: LogTransport;
  private sessionId: string;
  private currentUser: LoggerUserContext | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(transport?: LogTransport) {
    this.transport = transport ?? new MockTransport();
    this.sessionId = generateSessionId();
    this.startAutoFlush();
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  // ─── User context ────────────────────────────────────

  setCurrentUser(user: LoggerUserContext | null): void {
    this.currentUser = user;
  }

  getCurrentUser(): LoggerUserContext | null {
    return this.currentUser;
  }

  // ─── Main logging method ─────────────────────────────

  log(
    level: LogLevel,
    category: LogCategory,
    action: string,
    description: string,
    options?: {
      targetType?: LogEntry['targetType'];
      targetId?: string;
      targetName?: string;
      metadata?: Record<string, unknown>;
      userId?: string;
      userRole?: string;
      userName?: string;
    },
  ): void {
    const entry: LogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      action,
      description,
      userId: options?.userId ?? this.currentUser?.id,
      userRole: options?.userRole ?? this.currentUser?.role,
      userName: options?.userName ?? this.currentUser?.name,
      targetType: options?.targetType,
      targetId: options?.targetId,
      targetName: options?.targetName,
      metadata: options?.metadata,
      sessionId: this.sessionId,
    };

    this.buffer.push(entry);

    if (this.buffer.length >= BUFFER_SIZE) {
      this.flush();
    }
  }

  // ─── Shortcut methods per category ───────────────────

  auth(action: string, description: string, options?: Parameters<AppLogger['log']>[4]): void {
    this.log('audit', 'auth', action, description, options);
  }

  event(action: string, description: string, options?: Parameters<AppLogger['log']>[4]): void {
    this.log('audit', 'event', action, description, options);
  }

  shop(action: string, description: string, options?: Parameters<AppLogger['log']>[4]): void {
    this.log('info', 'shop', action, description, options);
  }

  user(action: string, description: string, options?: Parameters<AppLogger['log']>[4]): void {
    this.log('audit', 'user', action, description, options);
  }

  moderation(action: string, description: string, options?: Parameters<AppLogger['log']>[4]): void {
    this.log('audit', 'moderation', action, description, options);
  }

  cms(action: string, description: string, options?: Parameters<AppLogger['log']>[4]): void {
    this.log('audit', 'cms', action, description, options);
  }

  settings(action: string, description: string, options?: Parameters<AppLogger['log']>[4]): void {
    this.log('audit', 'settings', action, description, options);
  }

  registration(
    action: string,
    description: string,
    options?: Parameters<AppLogger['log']>[4],
  ): void {
    this.log('info', 'registration', action, description, options);
  }

  system(action: string, description: string, options?: Parameters<AppLogger['log']>[4]): void {
    this.log('info', 'system', action, description, options);
  }

  navigation(action: string, description: string, options?: Parameters<AppLogger['log']>[4]): void {
    this.log('info', 'navigation', action, description, options);
  }

  // ─── Flush ────────────────────────────────────────────

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = [...this.buffer];
    this.buffer = [];
    try {
      await this.transport.send(batch);
    } catch (err) {
      console.error('[AppLogger] Błąd wysyłki logów:', err);
      // Put the logs back into the buffer on error
      this.buffer.unshift(...batch);
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  destroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flush();
  }
}

// The activity log (audit log) is written by the server only —
// there is no transport left that would send these entries to the API (POST
// /admin/client-logs was removed because it allowed forging the author of an entry).
// MockTransport stays as local logging to the console / browser memory.
function createDefaultTransport(): LogTransport {
  return new MockTransport();
}

/** Global logger singleton (local logging — nothing from here reaches the server) */
export const appLogger = new AppLogger(createDefaultTransport());
