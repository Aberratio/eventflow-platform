/**
 * PP.9: pure generator for the build-time `dist/.htaccess`.
 *
 * No Node or Vite imports here — only the global `URL` — so this module can
 * be unit-tested with plain vitest and reasoned about without a build
 * context. `build/securityHeadersPlugin.ts` is the thin Vite adapter that
 * calls into this file and writes the result to disk.
 */

export interface HtaccessOptions {
  /** Vite mode: 'development' | 'staging' | 'production' | other. */
  mode: string;
  /** Absolute URL of the API, e.g. 'https://api.example.test/api/v1'. */
  apiUrl: string;
  googleCalendarApiUrl?: string;
  /** Exact origins (no path, no wildcard) to add to connect-src. */
  extraConnectSrc?: string[];
  reportOnly?: boolean;
}

const ORIGIN_PATTERN = /^https?:\/\/[^/\s?#*]+$/;

function isStagingOrProduction(mode: string): boolean {
  return mode === 'staging' || mode === 'production';
}

/** `new URL(url).origin`; throws an Error on a relative or invalid URL. */
export function originOf(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid absolute URL: '${url}'.`);
  }
  return parsed.origin;
}

/** Splits on whitespace or commas and drops empty entries. */
export function splitList(raw: string | undefined): string[] {
  if (raw === undefined) {
    return [];
  }
  return raw
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
}

function validateExtraConnectSrc(entries: string[], mode: string): void {
  for (const entry of entries) {
    if (!ORIGIN_PATTERN.test(entry)) {
      throw new Error(
        `CSP_CONNECT_SRC_EXTRA entry '${entry}' is not a valid exact origin ` +
          '(expected scheme://host[:port], no path, no query, no wildcard).',
      );
    }
    if (isStagingOrProduction(mode) && !entry.startsWith('https://')) {
      throw new Error(
        `CSP_CONNECT_SRC_EXTRA entry '${entry}' must use https when mode is staging or production.`,
      );
    }
  }
}

function validateApiUrl(apiUrl: string, mode: string): string {
  let origin: string;
  try {
    origin = originOf(apiUrl);
  } catch {
    throw new Error(`VITE_API_URL must be an absolute URL (got '${apiUrl}').`);
  }
  if (isStagingOrProduction(mode) && !apiUrl.startsWith('https://')) {
    throw new Error(
      `VITE_API_URL must use https when mode is staging or production (got '${apiUrl}').`,
    );
  }
  return origin;
}

/**
 * Builds the CSP directive string (no header name), joined with '; '.
 *
 * @param frameAncestors the frame-ancestors value, e.g. "'self'" or '*'. Ignored (omitted
 *   entirely) when includeFrameAncestors is false — used for the report-only variant, where
 *   frame-ancestors must never be report-only (it is emitted separately, always enforced).
 */
export function buildCsp(
  o: HtaccessOptions,
  frameAncestors: string,
  includeFrameAncestors = true,
): string {
  const apiOrigin = validateApiUrl(o.apiUrl, o.mode);

  const connectSrc = new Set<string>(["'self'", apiOrigin]);
  if (o.googleCalendarApiUrl) {
    connectSrc.add(originOf(o.googleCalendarApiUrl));
  }
  const extras = o.extraConnectSrc ?? [];
  validateExtraConnectSrc(extras, o.mode);
  for (const extra of extras) {
    connectSrc.add(extra);
  }

  const directives: string[] = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https: ${apiOrigin}`,
    `connect-src ${Array.from(connectSrc).join(' ')}`,
    "frame-src 'self' https:",
  ];

  if (includeFrameAncestors) {
    directives.push(`frame-ancestors ${frameAncestors}`);
  }

  directives.push(
    // If a payment gateway ever needs a form POST, add its origin here.
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
  );

  const csp = directives.join('; ');
  if (csp.includes('"')) {
    throw new Error('Generated CSP must not contain a double quote character.');
  }
  return csp;
}

/** Builds the full `.htaccess` file content. */
export function buildHtaccess(o: HtaccessOptions): string {
  // Validate early so an invalid apiUrl/extras fail the build before any string work.
  validateApiUrl(o.apiUrl, o.mode);
  validateExtraConnectSrc(o.extraConnectSrc ?? [], o.mode);

  const hsts = isStagingOrProduction(o.mode);
  const reportOnly = o.reportOnly === true;

  const cspHeaderLines: string[] = [];
  if (reportOnly) {
    const reportCsp = buildCsp(o, '', false);
    cspHeaderLines.push(
      `  Header always set Content-Security-Policy-Report-Only "${reportCsp}"`,
      // frame-ancestors is never report-only: clickjacking protection is enforced from day one.
      `  Header always set Content-Security-Policy "frame-ancestors 'self'"`,
    );
  } else {
    const csp = buildCsp(o, "'self'");
    cspHeaderLines.push(`  Header always set Content-Security-Policy "${csp}"`);
  }

  const embedCspLines: string[] = [];
  if (reportOnly) {
    const reportCsp = buildCsp(o, '', false);
    embedCspLines.push(
      `    Header always set Content-Security-Policy-Report-Only "${reportCsp}"`,
      `    Header always set Content-Security-Policy "frame-ancestors *"`,
    );
  } else {
    const embedCsp = buildCsp(o, '*');
    embedCspLines.push(`    Header always set Content-Security-Policy "${embedCsp}"`);
  }

  const hstsLine = hsts
    ? '  Header always set Strict-Transport-Security "max-age=31536000"      # staging/production only\n'
    : '';

  const apiOrigin = originOf(o.apiUrl);

  return `# GENERATED at build time by build/securityHeadersPlugin.ts (PP.9) -- do not edit on the server.
# mode=${o.mode} api=${apiOrigin}
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  # Same-host deployments: never hand API or upload paths to the SPA.
  RewriteRule ^(api|uploads)(/|$) - [L]
  # A missing hashed asset must 404, not return index.html (nosniff would reject HTML as JS anyway).
  RewriteRule ^assets/ - [L]
  RewriteRule ^(index|embed)\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  # E8.11 embed routes: same app shell, but frameable by third-party sites.
  RewriteRule ^embed/ embed.html [L]
  RewriteRule ^events/[^/]+/embed/?$ embed.html [L]
  RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_headers.c>
${cspHeaderLines.join('\n')}
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
${hstsLine}
  <Files "index.html">
    Header always set Cache-Control "no-cache"
  </Files>
  <Files "embed.html">
    Header always set Cache-Control "no-cache"
${embedCspLines.join('\n')}
    Header always unset X-Frame-Options
  </Files>
  <FilesMatch "-[A-Za-z0-9_-]{8}\\.(js|css)$">
    Header always set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
`;
}
