export interface NamedViewport {
  name: string;
  width: number;
  height: number;
}

/** Widths from the QA plan (section 6 of docs/qa-plan.md). */
export const VIEWPORTS: NamedViewport[] = [
  { name: 'xs-320', width: 320, height: 640 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-414', width: 414, height: 896 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'wide-1920', width: 1920, height: 1080 },
];

export const LANDSCAPE: NamedViewport[] = [
  { name: 'mobile-landscape-812', width: 812, height: 375 },
  { name: 'tablet-landscape-1024', width: 1024, height: 768 },
];

/** WCAG 2.5.8 minimum target size (AA), in CSS pixels. */
export const MIN_TAP_TARGET = 24;
