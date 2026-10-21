import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Guards against dead internal links : every static
 * link target in src (`to=`, `href=`, `navigate(`) must match a <Route> in App.tsx.
 */
const SRC = join(process.cwd(), 'src');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name) ? [full] : [];
  });

const routePatterns = [...readFileSync(join(SRC, 'App.tsx'), 'utf8').matchAll(/path="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((p) => p.startsWith('/'));

const matchesRoute = (target: string): boolean => {
  const segs = target.split('/').filter(Boolean);
  return routePatterns.some((pattern) => {
    const pSegs = pattern.split('/').filter(Boolean);
    for (let i = 0; i < pSegs.length; i++) {
      if (pSegs[i] === '*') return true;
      if (i >= segs.length) return false;
      if (!pSegs[i].startsWith(':') && pSegs[i] !== segs[i]) return false;
    }
    return pSegs.length === segs.length;
  });
};

const TARGET_RES = [
  /\bto=(?:"([^"]+)"|\{'([^']+)'\}|\{`([^`]+)`\})/g,
  /\bhref=(?:"([^"]+)"|\{'([^']+)'\}|\{`([^`]+)`\})/g,
  /\bnavigate\(\s*(?:'([^']+)'|"([^"]+)"|`([^`]+)`)/g,
];

const collect = () => {
  const found: { file: string; target: string }[] = [];
  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const re of TARGET_RES) {
      for (const m of text.matchAll(re)) {
        const raw = m[1] ?? m[2] ?? m[3];
        if (!raw || !raw.startsWith('/') || raw.startsWith('//')) continue;
        // `${...}` right after a segment boundary is a dynamic segment; elsewhere it is a suffix.
        const base = raw.replace(/([^/])\$\{[\s\S]*$/, '$1');
        const target = base
          .replace(/\$\{[^}]*\}/g, 'x')
          .split(/[?#]/)[0]
          .replace(/\/+$/, '');
        if (target === '') continue;
        found.push({ file: relative(SRC, file).split('\\').join('/'), target });
      }
    }
  }
  return found;
};

describe('internal link targets', () => {
  it('every static link target matches a route in App.tsx', () => {
    const dead = collect()
      .filter(({ target }) => !matchesRoute(target))
      .map(({ file, target }) => `${file} -> ${target}`);
    expect([...new Set(dead)]).toEqual([]);
  });
});
