export const htmlToPlainText = (html: string): string => {
  if (!html) return '';

  if (typeof DOMParser !== 'undefined') {
    // DOMParser documents are inert: no script execution, no resource loads
    // (unlike innerHTML on a live-document node).
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent?.trim() ?? '';
  }

  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};
