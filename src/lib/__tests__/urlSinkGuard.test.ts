import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * PP.50 static regression net: every href={...}, window.open(...) and <iframe src={...}> in a .tsx source file
 * must either go through safeUrl() or be a known fixed-prefix / developer-controlled value.
 */
const SRC = resolve(__dirname, '../..');

/** file suffix + expression start => reason it is not a user-supplied URL. */
const ALLOWLIST: Array<{ file: string; expr: string; reason: string }> = [
  {
    file: 'components/errors/StatusErrorPage.tsx',
    expr: 'action.href',
    reason: 'developer constants',
  },
  {
    file: 'components/event-details/EventSidebar.tsx',
    expr: 'opt.href',
    reason: 'https:// + encodeURIComponent share links',
  },
  {
    file: 'components/dev/SeedEventDialog.tsx',
    expr: 'createdEventUrl',
    reason: 'dev-only seeding dialog',
  },
  { file: 'pages/admin/components/PageEditorPage.tsx', expr: '`/info/', reason: 'internal path' },
];

const SAFE_PREFIXES = ['safeUrl(', '`/', '`mailto:', '`tel:', '`https://'];

const listSources = (dir: string): string[] =>
  (readdirSync(dir, { recursive: true, encoding: 'utf8' }) as string[])
    .map((p) => p.split('\\').join('/'))
    .filter((p) => p.endsWith('.tsx'))
    .filter((p) => !p.includes('__tests__/') && !/\.test\.tsx$/.test(p))
    .map((p) => join(dir, p));

/** Reads a balanced expression starting right after `open` (index of the char after `{` or `(`). */
const readExpression = (text: string, start: number, close: string): string => {
  const open = close === '}' ? '{' : '(';
  let depth = 1;
  let i = start;
  while (i < text.length && depth > 0) {
    const ch = text[i];
    if (ch === open) depth += 1;
    else if (ch === close) depth -= 1;
    i += 1;
  }
  return text.slice(start, i - 1).trim();
};

const collectExpressions = (text: string): string[] => {
  const found: string[] = [];
  for (const m of text.matchAll(/href=\{/g)) {
    found.push(readExpression(text, (m.index ?? 0) + m[0].length, '}'));
  }
  for (const m of text.matchAll(/window\.open\(/g)) {
    // first argument only (the URL); the URL expressions in this codebase contain no top-level comma
    found.push(
      readExpression(text, (m.index ?? 0) + m[0].length, ')')
        .split(',')[0]
        .trim(),
    );
  }
  for (const m of text.matchAll(/<iframe\b/g)) {
    const from = m.index ?? 0;
    const chunk = text.slice(from, from + 300);
    const src = /\bsrc=\{/.exec(chunk);
    if (src) found.push(readExpression(text, from + src.index + src[0].length, '}'));
  }
  return found;
};

const isSafe = (expr: string, text: string): boolean => {
  if (SAFE_PREFIXES.some((p) => expr.startsWith(p))) return true;
  if (/^[A-Za-z_$][\w$]*$/.test(expr)) {
    const assigned = new RegExp(`const ${expr.replace('$', '\\$')}\\s*=[^;]*?safeUrl\\(`, 's');
    return assigned.test(text);
  }
  return false;
};

describe('urlSinkGuard (PP.50)', () => {
  it('routes every user-supplied href / window.open / iframe src through safeUrl', () => {
    const offenders: string[] = [];
    let inspected = 0;
    for (const file of listSources(SRC)) {
      const text = readFileSync(file, 'utf8');
      const rel = relative(SRC, file).split('\\').join('/');
      for (const expr of collectExpressions(text)) {
        inspected += 1;
        if (isSafe(expr, text)) continue;
        const allowed = ALLOWLIST.some((a) => rel.endsWith(a.file) && expr.startsWith(a.expr));
        if (!allowed) offenders.push(`${rel}: ${expr}`);
      }
    }
    expect(inspected).toBeGreaterThan(30);
    expect(offenders).toEqual([]);
  });
});
