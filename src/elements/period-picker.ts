/** An inclusive pair of ISO 8601 timestamps. */
export interface PeriodRange {
  from: string;
  through: string;
}

export type PeriodOption =
  | {label: string; days: number; hours?: never; getRange?: never}
  | {label: string; hours: number; days?: never; getRange?: never}
  | {
      label: string;
      getRange: (now: Date) => PeriodRange;
      days?: never;
      hours?: never;
    };

export interface PeriodChangeDetail extends PeriodRange {
  label: string;
  days: number | null;
  hours: number | null;
  custom: boolean;
}

export const DEFAULT_PERIOD_OPTIONS: readonly PeriodOption[] = [
  {label: 'Last 7 days', days: 7},
  {label: 'Last 30 days', days: 30},
  {label: 'Last 90 days', days: 90},
];

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseRangeDate(value: string, through = false): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (localDate(date) !== value) {
      return null;
    }
    if (through) {
      date.setDate(date.getDate() + 1);
      date.setMilliseconds(date.getMilliseconds() - 1);
    }
    return date;
  }
  if (!/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function normalizeRange(range: PeriodRange): PeriodRange {
  const from = parseRangeDate(range.from);
  const through = parseRangeDate(range.through, true);
  if (!from || !through) {
    throw new RangeError('Provide valid ISO dates or timestamps.');
  }
  return periodBetween(from, through);
}

/** Uses the current instant as the default end of an arbitrary range. */
export function periodBetween(from: Date, through = new Date()): PeriodRange {
  if (
    Number.isNaN(from.valueOf()) ||
    Number.isNaN(through.valueOf()) ||
    from > through
  ) {
    throw new RangeError(
      'Provide valid instants with from on or before through.',
    );
  }
  return {from: from.toISOString(), through: through.toISOString()};
}

/** Includes today and the preceding local calendar days in the preset. */
export function periodForDays(days: number, today = new Date()): PeriodRange {
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError('Period duration must be a positive whole number.');
  }
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  from.setDate(from.getDate() - days + 1);
  const through = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
  );
  through.setMilliseconds(through.getMilliseconds() - 1);
  return periodBetween(from, through);
}

/** Ends at the supplied instant and includes the preceding hours. */
export function periodForHours(hours: number, now = new Date()): PeriodRange {
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new RangeError('Period duration must be a positive number of hours.');
  }
  return periodBetween(new Date(now.getTime() - hours * 3_600_000), now);
}

/** A framework-neutral picker for preset or custom calendar date ranges. */
export class ReclaimPeriodPicker extends HTMLElement {
  #options: PeriodOption[] = DEFAULT_PERIOD_OPTIONS.map(option => ({
    ...option,
  }));
  #selectedIndex = 0;
  #custom = false;
  #range: PeriodRange = periodForDays(7);

  static get observedAttributes(): string[] {
    return ['disable-custom'];
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.hasAttribute('disable-custom') && this.#custom) {
      this.select(0);
    } else if (this.isConnected) {
      this.render();
    }
  }

  get options(): PeriodOption[] {
    return this.#options.map(option => ({...option}));
  }

  set options(options: readonly PeriodOption[]) {
    if (
      !options.length ||
      options.some(option => {
        if (!option.label.trim()) {
          return true;
        }
        if (option.getRange) {
          return (
            typeof option.getRange !== 'function' ||
            option.days !== undefined ||
            option.hours !== undefined
          );
        }
        if (option.days !== undefined) {
          return (
            !Number.isInteger(option.days) ||
            option.days < 1 ||
            option.hours !== undefined
          );
        }
        return !Number.isFinite(option.hours) || (option.hours ?? 0) <= 0;
      })
    ) {
      throw new TypeError(
        'Provide labeled options with days, hours, or getRange.',
      );
    }
    this.#options = options.map(option => ({...option}));
    this.#selectedIndex = Math.min(this.#selectedIndex, options.length - 1);
    if (!this.#custom) {
      this.#range = this.#resolveOption(this.#options[this.#selectedIndex]);
    }
    if (this.isConnected) {
      this.render();
      if (!this.#custom) {
        this.#emit();
      }
    }
  }

  get disableCustom(): boolean {
    return this.hasAttribute('disable-custom');
  }

  set disableCustom(disabled: boolean) {
    this.toggleAttribute('disable-custom', disabled);
  }

  get selectedIndex(): number | null {
    return this.#custom ? null : this.#selectedIndex;
  }

  set selectedIndex(index: number | null) {
    if (index === null) {
      this.selectCustom();
    } else {
      this.select(index);
    }
  }

  get range(): PeriodRange {
    return {...this.#range};
  }

  /** Set a custom inclusive range, with both dates supplied together. */
  set range(range: PeriodRange) {
    if (this.disableCustom) {
      throw new Error('Custom ranges are disabled.');
    }
    const normalized = normalizeRange(range);
    this.#custom = true;
    this.#range = normalized;
    this.render();
    this.#emit();
  }

  select(index: number): void {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.#options.length
    ) {
      throw new RangeError('Period option index is out of range.');
    }
    this.#custom = false;
    this.#selectedIndex = index;
    this.#range = this.#resolveOption(this.#options[index]);
    this.render();
    this.#emit();
  }

  selectCustom(): void {
    if (this.disableCustom) {
      throw new Error('Custom ranges are disabled.');
    }
    if (!this.#custom) {
      this.#range = normalizeRange({
        from: localDate(new Date(this.#range.from)),
        through: localDate(new Date(this.#range.through)),
      });
    }
    this.#custom = true;
    this.render();
    this.#emit();
  }

  #resolveOption(option: PeriodOption): PeriodRange {
    const now = new Date();
    if (option.getRange) {
      return normalizeRange(option.getRange(now));
    }
    if (option.days !== undefined) {
      return periodForDays(option.days, now);
    }
    return periodForHours(option.hours, now);
  }

  #emit(): void {
    const option = this.#custom ? null : this.#options[this.#selectedIndex];
    this.dispatchEvent(
      new CustomEvent<PeriodChangeDetail>('reclaim:periodchange', {
        bubbles: true,
        detail: {
          ...this.#range,
          label: option?.label ?? 'Custom range',
          days: option?.days ?? null,
          hours: option?.hours ?? null,
          custom: this.#custom,
        },
      }),
    );
  }

  render(): void {
    this.classList.add('rc-period-picker');
    this.replaceChildren();
    const segments = document.createElement('div');
    segments.className = 'rc-segments';
    segments.setAttribute('role', 'group');
    segments.setAttribute(
      'aria-label',
      this.getAttribute('aria-label') || 'Period',
    );
    this.#options.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.segment = '';
      button.textContent = option.label;
      button.setAttribute(
        'aria-pressed',
        String(!this.#custom && index === this.#selectedIndex),
      );
      button.addEventListener('click', () => this.select(index));
      segments.append(button);
    });
    if (!this.disableCustom) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.segment = '';
      button.textContent = 'Custom range';
      button.setAttribute('aria-pressed', String(this.#custom));
      button.addEventListener('click', () => this.selectCustom());
      segments.append(button);
    }
    this.append(segments);
    if (!this.#custom) {
      return;
    }
    const fields = document.createElement('div');
    fields.className = 'rc-period-picker__dates';
    const from = this.#dateInput('From', localDate(new Date(this.#range.from)));
    const through = this.#dateInput(
      'Through',
      localDate(new Date(this.#range.through)),
    );
    const update = () => {
      const next = {from: from.value, through: through.value};
      let normalized: PeriodRange | null = null;
      try {
        normalized = normalizeRange(next);
      } catch {
        // Keep the last complete pair until both date fields are valid.
      }
      const valid = normalized !== null;
      from.setAttribute('aria-invalid', String(!valid));
      through.setAttribute('aria-invalid', String(!valid));
      if (normalized) {
        this.#range = normalized;
        this.#emit();
      }
    };
    from.addEventListener('change', update);
    through.addEventListener('change', update);
    fields.append(this.#dateField('From', from));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    fields.append(arrow, this.#dateField('Through', through));
    this.append(fields);
  }

  #dateInput(label: string, value: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'date';
    input.value = value;
    input.setAttribute('aria-label', label);
    return input;
  }

  #dateField(label: string, input: HTMLInputElement): HTMLLabelElement {
    const field = document.createElement('label');
    const text = document.createElement('span');
    text.textContent = label;
    field.append(text, input);
    return field;
  }
}
