export const htmlToPlainText = (html: string): string => {
  if (!html) return '';

  if (typeof document !== 'undefined') {
    const element = document.createElement('div');
    element.innerHTML = html;
    return element.textContent?.trim() ?? '';
  }

  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};
