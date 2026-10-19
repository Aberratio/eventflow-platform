import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export interface AxeIssue {
  id: string;
  impact: string;
  help: string;
  nodes: number;
  targets: string[];
}

/**
 * Runs axe (WCAG 2.2 AA) on the current page and returns violations as a compact, diffable list.
 * Assert on `blocking` (critical + serious) and attach the full list to the report.
 */
export async function scanA11y(
  page: Page,
  opts: { include?: string; exclude?: string[] } = {},
): Promise<{ all: AxeIssue[]; blocking: AxeIssue[] }> {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (opts.include) builder = builder.include(opts.include);
  for (const sel of opts.exclude ?? []) builder = builder.exclude(sel);
  const { violations } = await builder.analyze();
  const all = violations.map((v) => ({
    id: v.id,
    impact: v.impact ?? 'unknown',
    help: v.help,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
  }));
  return { all, blocking: all.filter((v) => v.impact === 'critical' || v.impact === 'serious') };
}
