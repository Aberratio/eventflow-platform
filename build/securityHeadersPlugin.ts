import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { buildHtaccess, type HtaccessOptions } from './securityHeaders';

/**
 * PP.9: writes the generated `dist/.htaccess` and a byte-identical
 * `dist/embed.html` copy of `index.html` after Vite has finished writing the
 * bundle. Build-only: this plugin does nothing in dev server mode.
 */
export function securityHeadersPlugin(options: HtaccessOptions): Plugin {
  return {
    name: 'pp9-security-headers',
    apply: 'build',
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir ?? 'dist';

      const htaccess = buildHtaccess(options);
      fs.writeFileSync(path.join(outDir, '.htaccess'), htaccess, 'utf-8');

      const indexHtmlPath = path.join(outDir, 'index.html');
      const embedHtmlPath = path.join(outDir, 'embed.html');
      fs.copyFileSync(indexHtmlPath, embedHtmlPath);
    },
  };
}
