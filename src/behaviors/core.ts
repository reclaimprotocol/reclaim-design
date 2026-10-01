/** Pure helpers: kept DOM-free so they can be tested in Node and reused by adapters. */
export type ThemeName = 'light' | 'dark';
export type FilterOption = string | {text?: unknown};

export function normalizeTheme(
  theme: unknown,
  fallback: ThemeName = 'light',
): ThemeName {
  return theme === 'dark' || theme === 'light' ? theme : fallback;
}

export function nextTheme(theme: unknown): ThemeName {
  return normalizeTheme(theme) === 'dark' ? 'light' : 'dark';
}

export function filterOptionText<T extends FilterOption>(
  options: readonly T[],
  query: unknown,
): T[] {
  const needle = String(query ?? '')
    .trim()
    .toLocaleLowerCase();
  return options.filter(option =>
    String(typeof option === 'string' ? option : (option.text ?? option))
      .toLocaleLowerCase()
      .includes(needle),
  );
}

export function getCopyValue({
  text,
  sourceText,
}: {text?: unknown; sourceText?: unknown} = {}): string {
  return String(text ?? sourceText ?? '').trim();
}

export function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}
