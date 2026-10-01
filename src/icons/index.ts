const svg = (body: string, viewBox = '0 0 24 24'): string =>
  `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">${body}</svg>`;

export const icons = Object.freeze({
  arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  check: svg('<path d="m5 12 4 4L19 6"/>'),
  chevronRight: svg('<path d="m9 5 7 7-7 7"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  copy: svg(
    '<rect x="8" y="8" width="11" height="11"/><path d="M16 8V5H5v11h3"/>',
  ),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  search: svg('<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>'),
  shieldCheck: svg(
    '<path d="M12 3 5 6v5c0 4.5 2.8 7.8 7 10 4.2-2.2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>',
  ),
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
