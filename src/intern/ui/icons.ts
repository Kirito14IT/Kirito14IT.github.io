import { raw } from "./html.ts";

// Small stroke icons drawn on a 24-unit grid. Decorative: labels always come from text.
const stroke = (paths: string) =>
  raw(
    `<svg class="it-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  );

const STAR_PATH = '<path d="M12 3.6l2.6 5.2 5.8.9-4.2 4.1 1 5.7L12 16.8l-5.2 2.7 1-5.7-4.2-4.1 5.8-.9z"/>';

export const icons = {
  star: stroke(STAR_PATH),
  starFilled: raw(
    `<svg class="it-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">${STAR_PATH}</svg>`
  ),
  close: stroke('<path d="M6 6l12 12M18 6L6 18"/>'),
  plus: stroke('<path d="M12 5v14M5 12h14"/>'),
  external: stroke('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  mail: stroke('<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.6 6.6L12 12.5l8.4-5.9"/>'),
  copy: stroke('<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  upload: stroke('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'),
  download: stroke('<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>'),
  sliders: stroke('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  sun: stroke('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>'),
  moon: stroke('<path d="M20 14.6A8 8 0 1 1 9.4 4a6.4 6.4 0 0 0 10.6 10.6z"/>'),
  lock: stroke('<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  search: stroke('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
  chevron: stroke('<path d="M9 6l6 6-6 6"/>'),
  trash: stroke('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  alert: stroke('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.4v.2"/>'),
  refresh: stroke('<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>')
};
