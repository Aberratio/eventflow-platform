import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { applyIndexingToHtml, resolveRobotsTxt } from './indexing';

/**
 * D-09: noindex meta + generated robots.txt for every build that is not explicitly
 * allowed to be indexed. Build-only.
 */
export function indexingPlugin(options: { allowIndexing: boolean }): Plugin {
  return {
    name: 'd09-indexing',
    apply: 'build',
    transformIndexHtml(html) {
      return applyIndexingToHtml(html, options.allowIndexing);
    },
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir ?? 'dist';
      const robotsPath = path.join(outDir, 'robots.txt');
      const existing = fs.existsSync(robotsPath) ? fs.readFileSync(robotsPath, 'utf-8') : '';
      fs.writeFileSync(robotsPath, resolveRobotsTxt(options.allowIndexing, existing), 'utf-8');
    },
  };
}
