import type { LogEntry, LogTransport } from './types';

const LEVEL_ICONS: Record<string, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  audit: '📋',
};

const storedLogs: LogEntry[] = [];

/**
 * MockTransport — logs to the console and keeps entries in memory (per browser).
 *
 * No transport sends these entries to the server. The activity log
 * (audit log) is written by the server only, based on the identity
 * from the verified JWT — POST /admin/client-logs was removed because
 * it let any client forge an entry attributed to someone else.
 * This transport is for local debugging in the browser only.
 */
export class MockTransport implements LogTransport {
  async send(entries: LogEntry[]): Promise<void> {
    for (const entry of entries) {
      storedLogs.push(entry);

      const icon = LEVEL_ICONS[entry.level] ?? '📝';
      const tag = `[${entry.level.toUpperCase()}:${entry.category}]`;
      const user = entry.userName
        ? ` | ${entry.userName} (${entry.userRole ?? '?'})`
        : entry.userId
          ? ` | uid:${entry.userId}`
          : '';
      const target = entry.targetName
        ? ` → «${entry.targetName}»`
        : entry.targetId
          ? ` → #${entry.targetId}`
          : '';

      const header = `${icon} ${tag} ${entry.timestamp}${user}${target}`;

      // eslint-disable-next-line no-console
      console.groupCollapsed(header);
      // eslint-disable-next-line no-console
      console.log('Opis:', entry.description);
      if (entry.metadata && Object.keys(entry.metadata).length > 0) {
        // eslint-disable-next-line no-console
        console.log('Metadane:', entry.metadata);
      }
      // eslint-disable-next-line no-console
      console.log('ID logu:', entry.id, '| Sesja:', entry.sessionId);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }
}

/** Returns all logs kept in memory (useful for debugging). */
export function getStoredLogs(): ReadonlyArray<LogEntry> {
  return storedLogs;
}

/** Clears the in-memory logs. */
export function clearStoredLogs(): void {
  storedLogs.length = 0;
}
