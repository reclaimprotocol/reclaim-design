import {getCopyValue, nextTheme, normalizeTheme} from './core.js';

export type ReclaimRoot = Document | HTMLElement;
export interface ReclaimController {
  destroy(): void;
}
export interface ThemeController extends ReclaimController {
  apply(theme: unknown, persist?: boolean): 'light' | 'dark';
}
export interface LoadingOperation {
  complete(): void;
}
export interface LoadingController extends ReclaimController {
  begin(target: string | HTMLElement): LoadingOperation;
}
export interface ThemeControllerOptions {
  storage?: Storage | null;
  storageKey?: string;
}
export interface CopyControllerOptions {
  clipboard?: Pick<Clipboard, 'writeText'>;
}
export type OverlayDismissReason = 'escape' | 'outside';
export interface DismissibleOverlayControllerOptions {
  roots: readonly HTMLElement[];
  onDismiss: (reason: OverlayDismissReason) => void;
}

const eventElement = (event: Event): HTMLElement | null =>
  event.target instanceof HTMLElement ? event.target : null;

const selectorEscape = (value: string): string =>
  typeof globalThis.CSS?.escape === 'function'
    ? CSS.escape(value)
    : String(value).replace(/["\\]/g, '\\$&');

/** Close a portalled overlay when a pointer lands outside it or Escape is pressed. */
export function createDismissibleOverlayController({
  roots,
  onDismiss,
}: DismissibleOverlayControllerOptions): ReclaimController {
  const documentRoot = roots[0]?.ownerDocument;
  if (!documentRoot) {
    return {destroy() {}};
  }
  const onPointerDown = (event: PointerEvent) => {
    const target = event.target;
    if (target instanceof Node && roots.some(root => root.contains(target))) {
      return;
    }
    onDismiss('outside');
  };
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onDismiss('escape');
  };
  documentRoot.addEventListener(
    'pointerdown',
    onPointerDown as EventListener,
    true,
  );
  documentRoot.addEventListener('keydown', onKeydown as EventListener);
  return {
    destroy() {
      documentRoot.removeEventListener(
        'pointerdown',
        onPointerDown as EventListener,
        true,
      );
      documentRoot.removeEventListener('keydown', onKeydown as EventListener);
    },
  };
}

function targetFrom(
  trigger: HTMLElement,
  root: ReclaimRoot,
): HTMLElement | null {
  const id =
    trigger.dataset.dialogOpen ||
    trigger.dataset.dialogClose ||
    trigger.getAttribute('aria-controls');
  return id ? root.querySelector(`#${selectorEscape(id)}`) : null;
}

export function createThemeController(
  root: ReclaimRoot,
  {
    storage = globalThis.localStorage,
    storageKey = 'reclaim-theme',
  }: ThemeControllerOptions = {},
): ThemeController {
  const target =
    root.querySelector<HTMLElement>('[data-theme-root]') ||
    (root instanceof Document ? root.documentElement : root);
  const apply = (theme: unknown, persist = true) => {
    const value = normalizeTheme(
      theme,
      normalizeTheme(target.dataset.theme, 'light'),
    );
    target.dataset.theme = value;
    root
      .querySelectorAll('[data-theme-toggle]')
      .forEach(button =>
        button.setAttribute('aria-pressed', String(value === 'dark')),
      );
    if (persist) {
      storage?.setItem?.(storageKey, value);
    }
    return value;
  };
  const saved = storage?.getItem?.(storageKey);
  if (saved) {
    apply(saved, false);
  }
  const onClick = (event: Event) => {
    const button = eventElement(event)?.closest<HTMLElement>(
      '[data-theme-toggle]',
    );
    if (!button) {
      return;
    }
    apply(nextTheme(target.dataset.theme));
  };
  root.addEventListener('click', onClick);
  return {apply, destroy: () => root.removeEventListener('click', onClick)};
}

export function createDialogController(root: ReclaimRoot): ReclaimController {
  const documentRoot = root instanceof Document ? root : root.ownerDocument;
  const openers = new WeakMap<HTMLElement, HTMLElement>();
  const focusable = (dialog: HTMLElement) =>
    [
      ...dialog.querySelectorAll<HTMLElement>(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter(
      item => !item.hidden && item.getAttribute('aria-hidden') !== 'true',
    );
  const focusFirst = (dialog: HTMLElement) => focusable(dialog)[0]?.focus();
  const close = (dialog: HTMLElement | null) => {
    if (!dialog?.hasAttribute('open')) {
      return;
    }
    if (dialog instanceof HTMLDialogElement) {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    openers.get(dialog)?.focus?.();
  };
  const onClick = (event: Event) => {
    const opener =
      eventElement(event)?.closest<HTMLElement>('[data-dialog-open]');
    if (opener) {
      const dialog = targetFrom(opener, root);
      if (!dialog) {
        return;
      }
      openers.set(dialog, opener);
      if (dialog instanceof HTMLDialogElement) {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      queueMicrotask(() => focusFirst(dialog));
      return;
    }
    const closer = eventElement(event)?.closest<HTMLElement>(
      '[data-dialog-close]',
    );
    if (!closer) {
      return;
    }
    const dialog =
      targetFrom(closer, root) || closer.closest('dialog, [role=dialog]');
    if (!dialog) {
      return;
    }
    close(dialog);
  };
  const onKeydown = (event: KeyboardEvent) => {
    const dialog = eventElement(event)?.closest<HTMLElement>(
      'dialog[open], [role="dialog"][open]',
    );
    if (!dialog) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close(dialog);
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const items = focusable(dialog);
    if (!items.length) {
      return;
    }
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && documentRoot.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && documentRoot.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const onPointerDown = (event: PointerEvent) => {
    const dialog = eventElement(event)?.closest<HTMLElement>(
      'dialog[open], [role="dialog"][open]',
    );
    if (dialog) {
      return;
    }
    const openDialog = root.querySelector<HTMLElement>(
      'dialog[open], [role="dialog"][open]',
    );
    if (openDialog) {
      close(openDialog);
    }
  };
  const onNativeBackdropClick = (event: Event) => {
    const dialog = eventElement(event);
    if (dialog?.matches?.('dialog[open]') && event.target === dialog) {
      close(dialog);
    }
  };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown as EventListener);
  documentRoot.addEventListener(
    'pointerdown',
    onPointerDown as EventListener,
    true,
  );
  root.addEventListener('click', onNativeBackdropClick);
  return {
    destroy: () => {
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeydown as EventListener);
      documentRoot.removeEventListener(
        'pointerdown',
        onPointerDown as EventListener,
        true,
      );
      root.removeEventListener('click', onNativeBackdropClick);
    },
  };
}

export function createCopyController(
  root: ReclaimRoot,
  {clipboard = globalThis.navigator?.clipboard}: CopyControllerOptions = {},
): ReclaimController {
  const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
  const onClick = async (event: Event) => {
    const button = eventElement(event)?.closest<HTMLElement>('[data-copy]');
    if (!button) {
      return;
    }
    const source = button.dataset.copySource
      ? root.querySelector(button.dataset.copySource)
      : null;
    const value = getCopyValue({
      text: button.dataset.copyText,
      sourceText: source?.textContent,
    });
    if (!value) {
      return;
    }
    try {
      await clipboard?.writeText?.(value);
      button.dataset.copyState = 'copied';
      button.dispatchEvent(
        new CustomEvent('reclaim:copy', {bubbles: true, detail: {value}}),
      );
      clearTimeout(timers.get(button));
      timers.set(
        button,
        setTimeout(() => {
          delete button.dataset.copyState;
        }, 1600),
      );
    } catch {
      button.dataset.copyState = 'failed';
      button.dispatchEvent(
        new CustomEvent('reclaim:copyerror', {bubbles: true, detail: {value}}),
      );
    }
  };
  root.addEventListener('click', onClick);
  return {destroy: () => root.removeEventListener('click', onClick)};
}

export function createSegmentController(root: ReclaimRoot): ReclaimController {
  const setActive = (button: HTMLButtonElement) => {
    const group =
      button.closest<HTMLElement>('[data-segment-group]') ||
      button.parentElement;
    const multi = group?.dataset.segmentGroup === 'multiple';
    const willSelect = multi
      ? button.getAttribute('aria-pressed') !== 'true'
      : true;
    group?.querySelectorAll<HTMLElement>('[data-segment]').forEach(item => {
      const selected =
        item === button
          ? willSelect
          : multi
            ? item.getAttribute('aria-pressed') === 'true'
            : false;
      item.setAttribute('aria-pressed', String(selected));
      item.setAttribute('aria-selected', String(selected));
      const panelId = item.getAttribute('aria-controls');
      if (panelId) {
        const panel = root.querySelector<HTMLElement>(
          `#${selectorEscape(panelId)}`,
        );
        if (panel) {
          panel.hidden = !selected;
        }
      }
    });
    button.dispatchEvent(
      new CustomEvent('reclaim:segmentchange', {
        bubbles: true,
        detail: {value: button.dataset.value, selected: willSelect},
      }),
    );
  };
  const onClick = (event: Event) => {
    const button =
      eventElement(event)?.closest<HTMLButtonElement>('[data-segment]');
    if (button && !button.disabled) {
      setActive(button);
    }
  };
  const onKeydown = (event: KeyboardEvent) => {
    const button =
      eventElement(event)?.closest<HTMLButtonElement>('[data-segment]');
    if (
      !button ||
      !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)
    ) {
      return;
    }
    const group =
      button.closest<HTMLElement>('[data-segment-group]') ||
      button.parentElement;
    if (!group) {
      return;
    }
    const buttons = [
      ...group.querySelectorAll<HTMLButtonElement>(
        '[data-segment]:not(:disabled)',
      ),
    ];
    const current = buttons.indexOf(button);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) %
            buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
    setActive(buttons[next]);
  };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown as EventListener);
  return {
    destroy: () => {
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeydown as EventListener);
    },
  };
}

export function createComboboxController(root: ReclaimRoot): ReclaimController {
  const getBox = (node: HTMLElement) =>
    node.closest<HTMLElement>('[data-combobox]');
  const filter = (input: HTMLInputElement) => {
    const box = getBox(input);
    if (!box) {
      return;
    }
    const query = input.value.trim().toLocaleLowerCase();
    box.querySelectorAll<HTMLElement>('[role=option]').forEach(option => {
      option.hidden = !option.textContent.toLocaleLowerCase().includes(query);
    });
    const list = box.querySelector<HTMLElement>('[role=listbox]');
    if (list) {
      list.hidden = false;
    }
    input.setAttribute('aria-expanded', 'true');
  };
  const choose = (option: HTMLElement) => {
    const box = getBox(option);
    const input = box?.querySelector<HTMLInputElement>(
      'input[role=combobox], input[data-combobox-input]',
    );
    const list = box?.querySelector<HTMLElement>('[role=listbox]');
    if (!box || !input) {
      return;
    }
    box
      .querySelectorAll<HTMLElement>('[role=option]')
      .forEach(item =>
        item.setAttribute('aria-selected', String(item === option)),
      );
    input.value = option.dataset.value ?? option.textContent?.trim() ?? '';
    input.setAttribute('aria-expanded', 'false');
    if (list) {
      list.hidden = true;
    }
    input.dispatchEvent(new Event('change', {bubbles: true}));
    box.dispatchEvent(
      new CustomEvent('reclaim:comboboxchange', {
        bubbles: true,
        detail: {value: input.value},
      }),
    );
  };
  const onInput = (event: Event) => {
    const target = eventElement(event);
    if (
      target?.matches(
        '[data-combobox] input[role=combobox], [data-combobox] input[data-combobox-input]',
      )
    ) {
      filter(target as HTMLInputElement);
    }
  };
  const onClick = (event: Event) => {
    const option = eventElement(event)?.closest<HTMLElement>(
      '[data-combobox] [role=option]',
    );
    if (option) {
      choose(option);
    }
  };
  const onKeydown = (event: KeyboardEvent) => {
    const target = eventElement(event);
    const input = target?.matches(
      '[data-combobox] input[role=combobox], [data-combobox] input[data-combobox-input]',
    )
      ? (target as HTMLInputElement)
      : null;
    if (!input) {
      return;
    }
    const box = getBox(input);
    if (!box) {
      return;
    }
    const visible = [
      ...box.querySelectorAll<HTMLElement>('[role=option]:not([hidden])'),
    ];
    const selected = box.querySelector<HTMLElement>(
      '[role=option][aria-selected=true]',
    );
    if (event.key === 'Escape') {
      const list = box.querySelector<HTMLElement>('[role=listbox]');
      if (list) {
        list.hidden = true;
      }
      input.setAttribute('aria-expanded', 'false');
    }
    if (event.key === 'ArrowDown' && visible.length) {
      event.preventDefault();
      choose(
        visible[
          Math.min(
            visible.length - 1,
            Math.max(0, selected ? visible.indexOf(selected) + 1 : 0),
          )
        ],
      );
    }
    if (event.key === 'Enter' && selected) {
      event.preventDefault();
      choose(selected);
    }
  };
  root.addEventListener('input', onInput);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown as EventListener);
  return {
    destroy: () => {
      root.removeEventListener('input', onInput);
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeydown as EventListener);
    },
  };
}

export function createExpansionController(
  root: ReclaimRoot,
): ReclaimController {
  const onClick = (event: Event) => {
    const trigger = eventElement(event)?.closest<HTMLElement>(
      '[data-expand-controls]',
    );
    if (!trigger) {
      return;
    }
    const controls = trigger.dataset.expandControls;
    if (!controls) {
      return;
    }
    const target = root.querySelector<HTMLElement>(
      `#${selectorEscape(controls)}`,
    );
    if (!target) {
      return;
    }
    const expanded = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(expanded));
    target.hidden = !expanded;
  };
  root.addEventListener('click', onClick);
  return {destroy: () => root.removeEventListener('click', onClick)};
}

export function createGlowController(root: ReclaimRoot): ReclaimController {
  const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
  const targetFor = (event: Event) =>
    eventElement(event)?.closest<HTMLElement>(
      '[data-glass], [data-tile], [data-chip], [data-seg], [data-segment], details.rc-expansion > summary, button',
    );
  const position = (event: PointerEvent, target?: HTMLElement | null) => {
    if (!target) {
      return null;
    }
    const bounds = target.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return target;
    }
    target.style.setProperty(
      '--rc-pointer-x',
      `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
    );
    target.style.setProperty(
      '--rc-pointer-y',
      `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
    );
    return target;
  };
  const onMove = (event: PointerEvent) => {
    position(event, targetFor(event));
  };
  const onDown = (event: PointerEvent) => {
    const target = position(event, targetFor(event));
    if (!target) {
      return;
    }
    clearTimeout(timers.get(target));
    target.dataset.pointerActive = 'true';
  };
  const onEnd = (event: PointerEvent) => {
    const target = targetFor(event);
    if (!target) {
      return;
    }
    clearTimeout(timers.get(target));
    timers.set(
      target,
      setTimeout(() => {
        delete target.dataset.pointerActive;
        timers.delete(target);
      }, 180),
    );
  };
  root.addEventListener('pointermove', onMove as EventListener, {
    passive: true,
  });
  root.addEventListener('pointerdown', onDown as EventListener, {
    passive: true,
  });
  root.addEventListener('pointerup', onEnd as EventListener, {passive: true});
  root.addEventListener('pointercancel', onEnd as EventListener, {
    passive: true,
  });
  return {
    destroy: () => {
      root.removeEventListener('pointermove', onMove as EventListener);
      root.removeEventListener('pointerdown', onDown as EventListener);
      root.removeEventListener('pointerup', onEnd as EventListener);
      root.removeEventListener('pointercancel', onEnd as EventListener);
    },
  };
}

const tokenNumber = (root: Document, name: string): number =>
  Number.parseFloat(
    root.defaultView
      ?.getComputedStyle(root.documentElement)
      .getPropertyValue(name) ?? '',
  );
const tokenString = (root: Document, name: string): string =>
  root.defaultView
    ?.getComputedStyle(root.documentElement)
    .getPropertyValue(name)
    .trim() ?? '';

/** Build the reference 26-ring, scroll-linked guilloche behind a surface. */
export function createGuillocheController(
  root: ReclaimRoot,
  {host}: {host?: HTMLElement} = {},
): ReclaimController {
  const documentRoot = root instanceof Document ? root : root.ownerDocument;
  if (!documentRoot) {
    return {destroy() {}};
  }
  const target =
    host ||
    root.querySelector<HTMLElement>('[data-reclaim-guilloche]') ||
    root.querySelector<HTMLElement>('.rc-app-shell, .rc-surface');
  if (!target) {
    return {destroy() {}};
  }
  const ownsHost = !target.matches?.('[data-reclaim-guilloche]');
  const layer = ownsHost ? documentRoot.createElement('div') : target;
  if (ownsHost) {
    layer.dataset.reclaimGuilloche = '';
    layer.setAttribute('aria-hidden', 'true');
    target.prepend(layer);
  }
  const value = (name: string) =>
    tokenNumber(documentRoot, `--rc-guilloche-${name}`);
  const count = value('count');
  const samples = value('samples');
  const dashLength = value('dash-length');
  if (
    !Number.isFinite(count) ||
    !Number.isFinite(samples) ||
    !Number.isFinite(dashLength)
  ) {
    return {
      destroy() {
        if (ownsHost) {
          layer.remove();
        }
      },
    };
  }
  const svg = documentRoot.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute(
    'viewBox',
    tokenString(documentRoot, '--rc-guilloche-view-box'),
  );
  Object.assign(svg.style, {
    width: tokenString(documentRoot, '--rc-guilloche-size'),
    height: tokenString(documentRoot, '--rc-guilloche-size'),
    overflow: 'visible',
    transformOrigin: 'center center',
  });
  const group = documentRoot.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.append(group);
  const layers: Array<{path: SVGPathElement; drift: number}> = [];
  for (let ring = 0; ring < count; ring += 1) {
    const path = documentRoot.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );
    let data = '';
    for (let sample = 0; sample <= samples; sample += 1) {
      const theta = (sample / samples) * Math.PI * 2;
      const radius =
        value('radius-base') +
        ring * value('radius-step') +
        value('wave-large') * Math.cos(value('wave-large-frequency') * theta) +
        value('wave-small') * Math.cos(value('wave-small-frequency') * theta);
      const angle = theta + ring * value('angle-step');
      data += `${sample === 0 ? 'M' : 'L'} ${(radius * Math.cos(angle)).toFixed(2)} ${(radius * Math.sin(angle)).toFixed(2)} `;
    }
    path.setAttribute('d', `${data}Z`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', String(value('stroke-width')));
    path.style.strokeDasharray = String(dashLength);
    group.append(path);
    layers.push({path, drift: 1 + ring * value('ring-drift-step')});
  }
  layer.append(svg);
  let position = 0;
  let frame = 0;
  let lastY = documentRoot.defaultView?.scrollY || 0;
  const reduceMotion = documentRoot.defaultView?.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  );
  const paint = () => {
    frame = 0;
    if (reduceMotion?.matches) {
      return;
    }
    svg.style.transform = `rotate(${position * value('rotation-per-position')}deg)`;
    const ink = tokenString(documentRoot, '--rc-color-surface-guilloche');
    layers.forEach(({path, drift}) => {
      const offset =
        (((position * value('dash-multiplier') * drift) % dashLength) +
          dashLength) %
        dashLength;
      path.style.strokeDashoffset = String(offset);
      path.setAttribute('stroke', ink);
    });
  };
  const bump = (delta: number) => {
    if (reduceMotion?.matches) {
      return;
    }
    position += delta;
    if (!frame) {
      frame = documentRoot.defaultView?.requestAnimationFrame(paint) || 0;
    }
  };
  const onWheel = (event: WheelEvent) => bump(event.deltaY);
  const onScroll = () => {
    const y = documentRoot.defaultView?.scrollY || 0;
    bump((y - lastY) * value('scroll-multiplier'));
    lastY = y;
  };
  const onMotionChange = () => {
    if (!reduceMotion?.matches) {
      paint();
    }
  };
  documentRoot.addEventListener('wheel', onWheel, {passive: true});
  documentRoot.addEventListener('scroll', onScroll, {
    passive: true,
    capture: true,
  });
  reduceMotion?.addEventListener?.('change', onMotionChange);
  paint();
  return {
    destroy() {
      documentRoot.removeEventListener('wheel', onWheel);
      documentRoot.removeEventListener('scroll', onScroll, true);
      reduceMotion?.removeEventListener?.('change', onMotionChange);
      if (frame) {
        documentRoot.defaultView?.cancelAnimationFrame(frame);
      }
      if (ownsHost) {
        layer.remove();
      } else {
        svg.remove();
      }
    },
  };
}

export const milliseconds = (value: string | number): number =>
  Number.parseFloat(String(value)) *
  (String(value).trim().endsWith('s') && !String(value).trim().endsWith('ms')
    ? 1000
    : 1);

/** Delay skeletons by 300ms and keep a shown state visible for at least 500ms. */
export function createLoadingController(root: ReclaimRoot): LoadingController {
  const documentRoot = root instanceof Document ? root : root.ownerDocument;
  type LoadingRecord = {
    shownAt: number;
    showTimer: ReturnType<typeof setTimeout> | null;
    hideTimer: ReturnType<typeof setTimeout> | null;
    minVisible: number;
  };
  const pending = new WeakMap<HTMLElement, LoadingRecord>();
  const timing = () => ({
    delay: milliseconds(tokenString(documentRoot, '--rc-loading-delay')),
    minVisible: milliseconds(
      tokenString(documentRoot, '--rc-loading-min-visible'),
    ),
  });
  const begin = (target: string | HTMLElement) => {
    const element =
      typeof target === 'string'
        ? root.querySelector<HTMLElement>(target)
        : target;
    if (!element) {
      return {complete() {}};
    }
    const {delay, minVisible} = timing();
    const record: LoadingRecord = {
      shownAt: 0,
      showTimer: null,
      hideTimer: null,
      minVisible,
    };
    record.showTimer = setTimeout(() => {
      record.shownAt = Date.now();
      element.dataset.loading = 'true';
      element.dispatchEvent(
        new CustomEvent('reclaim:loadshown', {bubbles: true}),
      );
    }, delay);
    pending.set(element, record);
    return {
      complete: () => {
        if (record.showTimer) {
          clearTimeout(record.showTimer);
        }
        const hide = () => {
          delete element.dataset.loading;
          element.dispatchEvent(
            new CustomEvent('reclaim:loadcomplete', {bubbles: true}),
          );
        };
        const remaining = record.shownAt
          ? Math.max(0, record.minVisible - (Date.now() - record.shownAt))
          : 0;
        record.hideTimer = setTimeout(hide, remaining);
        pending.delete(element);
      },
    };
  };
  return {
    begin,
    destroy: () => {
      /* timers remain scoped to their completed operations */
    },
  };
}

/** Enhance semantic HTML. Calling this is optional; all controls remain usable without JavaScript. */
export function initReclaimBehaviors(
  root: ReclaimRoot = document,
  options: {
    theme?: ThemeControllerOptions;
    copy?: CopyControllerOptions;
  } = {},
): ReclaimController {
  const controllers = [
    createThemeController(root, options.theme),
    createDialogController(root),
    createCopyController(root, options.copy),
    createSegmentController(root),
    createComboboxController(root),
    createExpansionController(root),
    createGlowController(root),
    createGuillocheController(root),
    createLoadingController(root),
  ];
  return {
    destroy: () => controllers.forEach(controller => controller.destroy()),
  };
}
