const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const inline = (text: string): string =>
  escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

/**
 * Converts a legacy CMS text block (plain lines, `- `/`•` bullets, `**bold**`; see TextSection) to
 * the HTML the rich-text editor stores. Deterministic: every non-empty line becomes a paragraph,
 * consecutive bullet lines one list. All other characters are escaped.
 */
export const legacyTextToHtml = (text: string): string => {
  const out: string[] = [];
  let items: string[] = [];
  const flush = () => {
    if (items.length > 0) {
      out.push(`<ul>${items.map((i) => `<li><p>${inline(i)}</p></li>`).join('')}</ul>`);
      items = [];
    }
  };
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      items.push(trimmed.replace(/^[•-]\s*/, ''));
    } else {
      flush();
      if (trimmed) out.push(`<p>${inline(trimmed)}</p>`);
    }
  }
  flush();
  return out.join('');
};
