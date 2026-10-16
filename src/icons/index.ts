const svg = (body: string, viewBox = '0 0 24 24'): string =>
  `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">${body}</svg>`;

export const icons = Object.freeze({
  activity: svg('<path d="M3 12h4l3 7 4-14 3 7h4"/>'),
  apps: svg(
    '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  ),
  arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  barChart: svg('<path d="M5 20V11M12 20V4M19 20v-6"/>'),
  book: svg('<path d="M4 5h7v14H4z"/><path d="M13 5h7v14h-7z"/>'),
  card: svg(
    '<rect x="3" y="6" width="18" height="12"/><path d="M3 10h18M7 14h4"/>',
  ),
  check: svg('<path d="M4 12l5 5L20 6"/>'),
  chevronDown: svg('<path d="M6 9l6 6 6-6"/>'),
  chevronRight: svg('<path d="M9 6l6 6-6 6"/>'),
  chevronUp: svg('<path d="M6 15l6-6 6 6"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  copy: svg('<rect x="9" y="9" width="11" height="11"/><path d="M15 5H5v10"/>'),
  cube: svg(
    '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  ),
  externalLink: svg('<path d="M7 17L17 7M9 7h8v8"/>'),
  flag: svg('<path d="M5 21V4h12l-2 4 2 4H5"/>'),
  globe: svg(
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18"/>',
  ),
  grid: svg(
    '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  ),
  inbox: svg(
    '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  ),
  link: svg('<path d="M9 7H6a4 4 0 000 8h3M15 7h3a4 4 0 010 8h-3M8 11h8"/>'),
  logout: svg(
    '<path d="M10 5H6a2 2 0 00-2 2v10a2 2 0 002 2h4M15 8l4 4-4 4M11 12h8"/>',
  ),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
  more: svg('<path d="M12 5h.01M12 12h.01M12 19h.01"/>'),
  pencil: svg('<path d="M4 20h4l10-10-4-4L4 16z"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/>'),
  shieldCheck: svg(
    '<path d="M12 3 5 6v5c0 4.5 2.8 7.8 7 10 4.2-2.2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>',
  ),
  sliders: svg(
    '<path d="M4 7h16M4 17h16"/><circle cx="10" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  ),
  sparkle: svg('<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>'),
  sun: svg(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  ),
  terminal: svg(
    '<rect x="3" y="5" width="18" height="14"/><path d="M7 10l3 2-3 2M13 14h4"/>',
  ),
  upDown: svg('<path d="M8 9l4-4 4 4M16 15l-4 4-4-4"/>'),
  users: svg(
    '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.5a3 3 0 010 5.6M18 14.5c1.8.9 3 2.7 3 5.5"/>',
  ),
  warning: svg('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>'),
});

export type ReclaimIconName = keyof typeof icons;

export function icon(name: ReclaimIconName, label?: string): string {
  const value = icons[name];
  if (!value) {
    throw new TypeError(`Unknown Reclaim icon: ${name}`);
  }
  if (!label) {
    return value;
  }
  return value.replace(
    'aria-hidden="true"',
    `role="img" aria-label="${escapeHtml(label)}"`,
  );
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
