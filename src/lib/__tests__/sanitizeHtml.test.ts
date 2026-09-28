import { describe, it, expect } from 'vitest';
import { sanitizeHtml, escapeHtml, RICH_TEXT_ALLOWED_TAGS } from '../sanitizeHtml';

describe('sanitizeHtml', () => {
  it('strips event-handler payloads', () => {
    const out1 = sanitizeHtml('<img src=x onerror=alert(1)>');
    expect(out1).not.toMatch(/onerror/i);
    expect(out1).not.toMatch(/<img/i);

    const out2 = sanitizeHtml('<svg onload=alert(1)></svg>');
    expect(out2).not.toMatch(/onload/i);
    expect(out2).not.toMatch(/<svg/i);

    const out3 = sanitizeHtml('<details open ontoggle=alert(1)>x</details>');
    expect(out3).not.toMatch(/ontoggle/i);
  });

  it('removes script and style elements with their content', () => {
    const out = sanitizeHtml('<script>alert(1)</script><p>ok</p>');
    expect(out).toBe('<p>ok</p>');
  });

  it('drops javascript:, data: and vbscript: hrefs (case/whitespace variants)', () => {
    const payloads = [
      '<a href="javascript:alert(1)">x</a>',
      '<a href="JaVaScRiPt:alert(1)">x</a>',
      '<a href=" javascript:alert(1)">x</a>',
      '<a href="java&#x09;script:alert(1)">x</a>',
      '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
      '<a href="vbscript:msgbox(1)">x</a>',
    ];
    for (const p of payloads) {
      const out = sanitizeHtml(p);
      expect(out).not.toMatch(/javascript:/i);
      expect(out).not.toMatch(/data:/i);
      expect(out).not.toMatch(/vbscript:/i);
    }
  });

  it('keeps http(s), mailto, tel and relative hrefs', () => {
    expect(sanitizeHtml('<a href="https://example.pl">x</a>')).toContain(
      'href="https://example.pl"',
    );
    expect(sanitizeHtml('<a href="http://example.pl">x</a>')).toContain('href="http://example.pl"');
    expect(sanitizeHtml('<a href="mailto:a@example.pl">x</a>')).toContain(
      'href="mailto:a@example.pl"',
    );
    expect(sanitizeHtml('<a href="tel:+48123456789">x</a>')).toContain('href="tel:+48123456789"');
    expect(sanitizeHtml('<a href="/regulaminy/x.pdf">x</a>')).toContain('href="/regulaminy/x.pdf"');
  });

  it('enforces rel noopener noreferrer on target=_blank', () => {
    const out = sanitizeHtml('<a href="https://x.pl" target="_blank">x</a>');
    expect(out).toContain('target="_blank"');
    expect(out).toMatch(/rel="[^"]*noopener[^"]*"/);
    expect(out).toMatch(/rel="[^"]*noreferrer[^"]*"/);
  });

  it('removes non-_blank targets', () => {
    const outSelf = sanitizeHtml('<a href="https://x.pl" target="_self">x</a>');
    expect(outSelf).not.toMatch(/target=/);
    const outFoo = sanitizeHtml('<a href="https://x.pl" target="foo">x</a>');
    expect(outFoo).not.toMatch(/target=/);
  });

  it('filters unknown rel tokens', () => {
    const out = sanitizeHtml('<a href="https://x.pl" rel="opener">x</a>');
    expect(out).not.toMatch(/rel="[^"]*opener[^"]*"/);
  });

  it('drops class, style, id, data-* attributes', () => {
    const out = sanitizeHtml(
      '<p style="color:red" class="fixed inset-0" id="x" data-foo="bar">a</p>',
    );
    expect(out).not.toMatch(/style=/);
    expect(out).not.toMatch(/class=/);
    expect(out).not.toMatch(/id=/);
    expect(out).not.toMatch(/data-foo/);
  });

  it('preserves legit TipTap output', () => {
    const fixture =
      '<h2>Tytuł</h2><p><strong>B</strong> <em>I</em> <u>U</u> <s>S</s><br><a target="_blank" rel="noopener noreferrer nofollow" class="text-primary underline hover:no-underline" href="https://example.pl">link</a></p><ul><li><p>a</p></li></ul><ol start="3"><li><p>b</p></li></ol><blockquote><p>q</p></blockquote><pre><code>c</code></pre><hr>';
    const out = sanitizeHtml(fixture);
    expect(out).toContain('<h2>Tytuł</h2>');
    expect(out).toContain('<strong>B</strong>');
    expect(out).toContain('<em>I</em>');
    expect(out).toContain('<u>U</u>');
    expect(out).toContain('<s>S</s>');
    expect(out).toContain('<br>');
    expect(out).toContain('href="https://example.pl"');
    expect(out).toContain('target="_blank"');
    expect(out).not.toMatch(/class=/);
    expect(out).toContain('<ul>');
    expect(out).toContain('<ol start="3">');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('<pre>');
    expect(out).toContain('<code>c</code>');
    expect(out).toContain('<hr>');
  });

  it('is idempotent', () => {
    const fixture =
      '<h2>Tytuł</h2><p><strong>B</strong> <a target="_blank" rel="noopener noreferrer nofollow" href="https://example.pl">link</a></p>';
    const once = sanitizeHtml(fixture);
    const twice = sanitizeHtml(once);
    expect(twice).toBe(once);
  });
});

describe('escapeHtml', () => {
  it('escapes & < > " \'', () => {
    expect(escapeHtml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &#39;');
  });

  it('handles null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('allowlist parity', () => {
  it('matches server HtmlSanitizer::ALLOWED tag list', () => {
    // Literal copy of server ALLOWED tag list order (zmierzymy_czas_server src/Support/HtmlSanitizer.php).
    // A change on one side forces a conscious edit of this test + the other repo.
    expect(RICH_TEXT_ALLOWED_TAGS).toEqual([
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'a',
      'h2',
      'h3',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'hr',
    ]);
  });
});
