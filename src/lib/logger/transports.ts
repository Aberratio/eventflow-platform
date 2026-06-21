import type { LogEntry, LogTransport } from './types';

const LEVEL_ICONS: Record<string, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  audit: '📋',
};

const storedLogs: LogEntry[] = [];

/**
 * MockTransport — loguje do konsoli i przechowuje w pamięci.
 * Docelowo zostanie zastąpiony przez ApiTransport.
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

/** Zwraca wszystkie logi przechowywane w pamięci (przydatne do debugowania). */
export function getStoredLogs(): ReadonlyArray<LogEntry> {
  return storedLogs;
}

/** Czyści logi w pamięci. */
export function clearStoredLogs(): void {
  storedLogs.length = 0;
}

export class ApiTransport implements LogTransport {
  constructor(
    private endpoint: string,
    private getToken: () => string | null,
  ) {}

  async send(entries: LogEntry[]): Promise<void> {
    const token = this.getToken();
    await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ logs: entries }),
    }).catch(() => {});
  }
}
