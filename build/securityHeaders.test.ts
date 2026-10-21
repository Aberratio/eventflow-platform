import { describe, it, expect } from 'vitest';
import {
  buildCsp,
  buildHtaccess,
  originOf,
  splitList,
  type HtaccessOptions,
} from './securityHeaders';

function baseOptions(overrides: Partial<HtaccessOptions> = {}): HtaccessOptions {
  return {
    mode: 'staging',
    apiUrl: 'https://api.example.test/api/v1',
    ...overrides,
  };
}

function directive(csp: string, name: string): string | undefined {
  const match = csp.split('; ').find((d) => d === name || d.startsWith(`${name} `));
  return match;
}

describe('buildCsp', () => {
  it('staging build: CSP connect-src contains exactly self and the API origin', () => {
    const csp = buildCsp(baseOptions(), "'self'");
    expect(directive(csp, 'connect-src')).toBe("connect-src 'self' https://api.example.test");
  });

  it('script-src has no unsafe-inline or unsafe-eval', () => {
    const csp = buildCsp(baseOptions(), "'self'");
    const scriptSrc = directive(csp, 'script-src');
    expect(scriptSrc).toBe("script-src 'self'");
    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  it('fonts are self-hosted: style-src and font-src do not allow Google hosts (R-15)', () => {
    const csp = buildCsp(baseOptions(), "'self'");
    expect(directive(csp, 'style-src')).toBe("style-src 'self' 'unsafe-inline'");
    expect(directive(csp, 'font-src')).toBe("font-src 'self'");
  });

  it('normal pages get frame-ancestors self', () => {
    const csp = buildCsp(baseOptions(), "'self'");
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'self'");
  });

  it('embed pages get frame-ancestors *', () => {
    const csp = buildCsp(baseOptions(), '*');
    expect(directive(csp, 'frame-ancestors')).toBe('frame-ancestors *');
  });

  it('adds the Google Calendar origin only when configured', () => {
    const withoutGCal = buildCsp(baseOptions(), "'self'");
    expect(directive(withoutGCal, 'connect-src')).not.toContain('googleapis');

    const withGCal = buildCsp(
      baseOptions({ googleCalendarApiUrl: 'https://www.googleapis.com/calendar/v3' }),
      "'self'",
    );
    expect(directive(withGCal, 'connect-src')).toBe(
      "connect-src 'self' https://api.example.test https://www.googleapis.com",
    );
  });

  it('validates and appends CSP_CONNECT_SRC_EXTRA origins', () => {
    const csp = buildCsp(
      baseOptions({ extraConnectSrc: ['https://extra.example.test'] }),
      "'self'",
    );
    expect(directive(csp, 'connect-src')).toBe(
      "connect-src 'self' https://api.example.test https://extra.example.test",
    );
  });

  it('rejects CSP_CONNECT_SRC_EXTRA entries with a path or a wildcard', () => {
    expect(() =>
      buildCsp(baseOptions({ extraConnectSrc: ['https://extra.example.test/path'] }), "'self'"),
    ).toThrow(/CSP_CONNECT_SRC_EXTRA/);
    expect(() =>
      buildCsp(baseOptions({ extraConnectSrc: ['https://*.example.test'] }), "'self'"),
    ).toThrow(/CSP_CONNECT_SRC_EXTRA/);
  });

  it('rejects http CSP_CONNECT_SRC_EXTRA entries in staging/production', () => {
    expect(() =>
      buildCsp(
        baseOptions({ mode: 'staging', extraConnectSrc: ['http://extra.example.test'] }),
        "'self'",
      ),
    ).toThrow(/https/);
  });

  it('accepts http CSP_CONNECT_SRC_EXTRA entries in development', () => {
    const csp = buildCsp(
      baseOptions({
        mode: 'development',
        apiUrl: 'http://localhost:8104/api/v1',
        extraConnectSrc: ['http://extra.example.test'],
      }),
      "'self'",
    );
    expect(directive(csp, 'connect-src')).toContain('http://extra.example.test');
  });

  it('CSP never contains a double quote', () => {
    const csp = buildCsp(baseOptions(), "'self'");
    expect(csp).not.toContain('"');
  });

  it('rejects relative or http apiUrl in dev, staging and production', () => {
    expect(() => buildCsp(baseOptions({ apiUrl: '/api/v1' }), "'self'")).toThrow();
    expect(() =>
      buildCsp(baseOptions({ mode: 'dev', apiUrl: 'http://api.example.test/api/v1' }), "'self'"),
    ).toThrow(/https/);
    expect(() =>
      buildCsp(
        baseOptions({ mode: 'staging', apiUrl: 'http://api.example.test/api/v1' }),
        "'self'",
      ),
    ).toThrow(/https/);
    expect(() =>
      buildCsp(
        baseOptions({ mode: 'production', apiUrl: 'http://api.example.test/api/v1' }),
        "'self'",
      ),
    ).toThrow(/https/);
  });

  it('accepts http apiUrl in development', () => {
    expect(() =>
      buildCsp(
        baseOptions({ mode: 'development', apiUrl: 'http://localhost:8104/api/v1' }),
        "'self'",
      ),
    ).not.toThrow();
  });
});

describe('buildHtaccess', () => {
  it('embed.html block re-sets CSP with frame-ancestors * and unsets X-Frame-Options', () => {
    const out = buildHtaccess(baseOptions());
    const embedBlockMatch = out.match(/<Files "embed\.html">([\s\S]*?)<\/Files>/);
    expect(embedBlockMatch).not.toBeNull();
    const embedBlock = embedBlockMatch![1];
    expect(embedBlock).toContain('frame-ancestors *');
    expect(embedBlock).toContain('Header always unset X-Frame-Options');
  });

  it('normal pages get X-Frame-Options SAMEORIGIN at the top level', () => {
    const out = buildHtaccess(baseOptions());
    const topLevel = out.split('<Files "index.html">')[0];
    expect(topLevel).toContain('Header always set X-Frame-Options "SAMEORIGIN"');
  });

  it('emits SPA fallback plus both embed rewrites, and excludes api/uploads/assets', () => {
    const out = buildHtaccess(baseOptions());
    expect(out).toContain('RewriteRule ^(api|uploads)(/|$) - [L]');
    expect(out).toContain('RewriteRule ^assets/ - [L]');
    expect(out).toContain('RewriteRule ^embed/ embed.html [L]');
    expect(out).toContain('RewriteRule ^events/[^/]+/embed/?$ embed.html [L]');
    expect(out).toContain('RewriteRule ^ index.html [L]');
  });

  it('HSTS only for dev, staging and production modes', () => {
    const dev = buildHtaccess(
      baseOptions({ mode: 'development', apiUrl: 'http://localhost:8104/api/v1' }),
    );
    expect(dev).not.toContain('Strict-Transport-Security');

    const hostedDev = buildHtaccess(baseOptions({ mode: 'dev' }));
    expect(hostedDev).toContain('Strict-Transport-Security "max-age=31536000"');

    const staging = buildHtaccess(baseOptions({ mode: 'staging' }));
    expect(staging).toContain('Strict-Transport-Security "max-age=31536000"');

    const production = buildHtaccess(baseOptions({ mode: 'production' }));
    expect(production).toContain('Strict-Transport-Security "max-age=31536000"');
  });

  it('never emits a directive line with a trailing comment (Apache has no trailing-comment syntax)', () => {
    // Regression for the HSTS line shipping as
    // `Header always set Strict-Transport-Security "max-age=31536000"      # staging/production only`:
    // Apache's mod_headers parses `#...` as extra arguments to `Header`, not a comment, and
    // answers "Header has too many arguments" -- a 500 on every path -- on any staging/production
    // build. A directive line must never carry a trailing ` #comment`; a note about a directive
    // belongs on its own line that starts with '#'.
    for (const mode of ['development', 'staging', 'production']) {
      for (const reportOnly of [false, true]) {
        const out = buildHtaccess(baseOptions({ mode, reportOnly }));
        for (const line of out.split('\n')) {
          const trimmed = line.trim();
          if (trimmed === '' || trimmed.startsWith('#')) {
            continue; // blank lines and whole-line comments are fine
          }
          expect(line, `line has a trailing comment: ${JSON.stringify(line)}`).not.toMatch(/\s#/);
        }
      }
    }

    const staging = buildHtaccess(baseOptions({ mode: 'staging' }));
    expect(staging).toContain('  Header always set Strict-Transport-Security "max-age=31536000"\n');
  });

  it('report-only mode keeps frame-ancestors enforced', () => {
    const out = buildHtaccess(baseOptions({ reportOnly: true }));
    expect(out).toContain('Content-Security-Policy-Report-Only');
    expect(out).toContain('Header always set Content-Security-Policy "frame-ancestors \'self\'"');

    const embedBlockMatch = out.match(/<Files "embed\.html">([\s\S]*?)<\/Files>/);
    const embedBlock = embedBlockMatch![1];
    expect(embedBlock).toContain('Content-Security-Policy-Report-Only');
    expect(embedBlock).toContain('Header always set Content-Security-Policy "frame-ancestors *"');
  });

  it('rejects relative or http apiUrl in staging and production', () => {
    expect(() => buildHtaccess(baseOptions({ apiUrl: '/api/v1' }))).toThrow(/VITE_API_URL/);
    expect(() =>
      buildHtaccess(baseOptions({ mode: 'staging', apiUrl: 'http://api.example.test/api/v1' })),
    ).toThrow(/VITE_API_URL/);
  });

  it('accepts http apiUrl in development and succeeds', () => {
    expect(() =>
      buildHtaccess(baseOptions({ mode: 'development', apiUrl: 'http://localhost:8104/api/v1' })),
    ).not.toThrow();
  });
});

describe('originOf', () => {
  it('returns the origin of an absolute URL', () => {
    expect(originOf('https://api.example.test/api/v1')).toBe('https://api.example.test');
  });

  it('throws on a relative or invalid URL', () => {
    expect(() => originOf('/api/v1')).toThrow();
    expect(() => originOf('not a url')).toThrow();
  });
});

describe('splitList', () => {
  it('handles commas, whitespace, and empty input', () => {
    expect(splitList('a,b,c')).toEqual(['a', 'b', 'c']);
    expect(splitList('a b c')).toEqual(['a', 'b', 'c']);
    expect(splitList('a, b ,, c')).toEqual(['a', 'b', 'c']);
    expect(splitList('')).toEqual([]);
    expect(splitList(undefined)).toEqual([]);
    expect(splitList('   ')).toEqual([]);
  });
});
