/**
 * Custom elements are intentionally limited to composites that need a small
 * state machine. Basic controls stay native HTML plus @reclaimprotocol/design/css.
 */
export class ReclaimCombobox extends HTMLElement {
  #abort: AbortController | null = null;

  connectedCallback() {
    if (this.#abort) {
      return;
    }
    this.classList.add('rc-combobox');
    this.setAttribute('data-combobox', '');
    this.setAttribute('role', 'group');
    const input = this.input;
    const list = this.listbox;
    if (!input || !list) {
      return;
    }
    const id = list.id || `${this.id || 'rc-combobox'}-listbox`;
    list.id = id;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-controls', id);
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', String(!list.hidden));
    this.#abort = new AbortController();
    const {signal} = this.#abort;
    input.addEventListener('input', () => this.filter(), {signal});
    input.addEventListener('focus', () => this.open(), {signal});
    input.addEventListener('keydown', event => this.onKeydown(event), {signal});
    list.addEventListener(
      'click',
      event => {
        const option =
          event.target instanceof Element
            ? event.target.closest<HTMLElement>('[role=option]')
            : null;
        if (option && this.contains(option)) {
          this.select(option);
        }
      },
      {signal},
    );
    this.addEventListener(
      'focusout',
      () =>
        queueMicrotask(() => {
          if (!this.contains(document.activeElement)) {
            this.close();
          }
        }),
      {signal},
    );
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#abort = null;
  }
  get input(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('input');
  }
  get listbox(): HTMLElement | null {
    return this.querySelector<HTMLElement>('[role=listbox]');
  }
  get options(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('[role=option]')];
  }

  open() {
    if (this.listbox) {
      this.listbox.hidden = false;
    }
    this.input?.setAttribute('aria-expanded', 'true');
  }
  close() {
    if (this.listbox) {
      this.listbox.hidden = true;
    }
    this.input?.setAttribute('aria-expanded', 'false');
  }
  filter() {
    const needle = (this.input?.value || '').trim().toLocaleLowerCase();
    this.options.forEach(option => {
      option.hidden = !option.textContent.toLocaleLowerCase().includes(needle);
    });
    this.open();
  }
  select(option: HTMLElement) {
    if (!this.input) {
      return;
    }
    this.options.forEach(item =>
      item.setAttribute('aria-selected', String(item === option)),
    );
    this.input.value = option.dataset.value ?? option.textContent?.trim() ?? '';
    this.close();
    this.input.dispatchEvent(new Event('change', {bubbles: true}));
    this.dispatchEvent(
      new CustomEvent('reclaim:comboboxchange', {
        bubbles: true,
        detail: {value: this.input.value},
      }),
    );
  }
  onKeydown(event: KeyboardEvent) {
    const visible = this.options.filter(option => !option.hidden);
    if (event.key === 'Escape') {
      this.close();
      return;
    }
    if (event.key !== 'ArrowDown' || !visible.length) {
      return;
    }
    event.preventDefault();
    this.open();
    visible[0].focus();
  }
}

export function defineReclaimElements(
  registry: CustomElementRegistry = customElements,
): void {
  if (!registry.get('rc-combobox')) {
    registry.define('rc-combobox', ReclaimCombobox);
  }
}
