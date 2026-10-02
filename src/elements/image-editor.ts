export type ImageFit = 'contain' | 'cover';

export interface EditedImageDetail {
  dataUrl: string;
}

interface DrawOptions {
  background: string;
  fit: ImageFit;
  offsetX: number;
  offsetY: number;
  padding: number;
  transparent: boolean;
  zoom: number;
}

let editorId = 0;

function numberAttribute(
  element: Element,
  name: string,
  fallback: number,
): number {
  const parsed = Number(element.getAttribute(name));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function labeledControl(label: string, control: HTMLElement): HTMLLabelElement {
  const wrapper = document.createElement('label');
  wrapper.className = 'rc-field';
  const text = document.createElement('span');
  text.className = 'rc-field__label';
  text.textContent = label;
  wrapper.append(text, control);
  return wrapper;
}

function button(label: string, value: string): HTMLButtonElement {
  const control = document.createElement('button');
  control.className = 'rc-button';
  control.type = 'button';
  control.textContent = label;
  control.value = value;
  return control;
}

function drawImage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: DrawOptions,
): void {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }
  const inset = (Math.min(canvas.width, canvas.height) * options.padding) / 100;
  const width = Math.max(1, canvas.width - inset * 2);
  const height = Math.max(1, canvas.height - inset * 2);
  const baseScale =
    options.fit === 'cover'
      ? Math.max(width / image.width, height / image.height)
      : Math.min(width / image.width, height / image.height);
  const scale = baseScale * options.zoom;
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const maxX = Math.abs(drawWidth - width) / 2;
  const maxY = Math.abs(drawHeight - height) / 2;
  const offsetX = Math.max(-maxX, Math.min(maxX, options.offsetX));
  const offsetY = Math.max(-maxY, Math.min(maxY, options.offsetY));

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!options.transparent) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(
    image,
    (canvas.width - drawWidth) / 2 + offsetX,
    (canvas.height - drawHeight) / 2 + offsetY,
    drawWidth,
    drawHeight,
  );
}

/** Edits an image locally with a native modal dialog and canvas. */
export class ReclaimImageEditor extends HTMLElement {
  #abort: AbortController | null = null;
  #canvas: HTMLCanvasElement | null = null;
  #dialog: HTMLDialogElement | null = null;
  #drag: {x: number; y: number} | null = null;
  #image: HTMLImageElement | null = null;
  #offset = {x: 0, y: 0};
  #opener: HTMLElement | null = null;
  #source = '';

  connectedCallback(): void {
    if (this.#dialog) {
      return;
    }
    this.classList.add('rc-image-editor');
    this.hidden = true;
    this.#build();
  }

  disconnectedCallback(): void {
    this.#abort?.abort();
    this.#abort = null;
    this.#dialog = null;
    this.#canvas = null;
    this.replaceChildren();
  }

  get source(): string {
    return this.#source || this.getAttribute('src') || '';
  }

  set source(value: string) {
    this.#source = value;
  }

  /** Opens the editor for the current source and remembers focus. */
  async open(): Promise<void> {
    if (!this.#dialog || !this.#canvas) {
      return;
    }
    this.#opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    this.hidden = false;
    this.#reset();
    if (!this.#dialog.open) {
      this.#dialog.showModal();
    }
    try {
      this.#image = await this.#load(this.source);
      this.#draw();
    } catch (cause) {
      this.#setError(
        cause instanceof Error ? cause.message : 'The image could not load.',
      );
    }
  }

  /** Closes the editor and restores focus to the opening control. */
  close(): void {
    this.#dialog?.close();
  }

  #build(): void {
    this.#abort = new AbortController();
    const {signal} = this.#abort;
    if (!this.id) {
      editorId += 1;
      this.id = `rc-image-editor-${editorId}`;
    }
    const dialog = document.createElement('dialog');
    dialog.className = 'rc-image-editor__dialog';
    const header = document.createElement('header');
    header.className = 'rc-image-editor__header';
    const title = document.createElement('h2');
    title.id = `${this.id}-title`;
    title.textContent =
      this.getAttribute('editor-title') ?? 'Crop and frame image';
    dialog.setAttribute('aria-labelledby', title.id);
    const close = button('Close', 'cancel');
    close.classList.add('rc-button--inline', 'rc-image-editor__close');
    close.setAttribute('aria-label', 'Close image editor');
    close.textContent = '×';
    header.append(title, close);

    const canvas = document.createElement('canvas');
    const width = Math.round(numberAttribute(this, 'output-width', 1200));
    const ratio = numberAttribute(this, 'aspect-ratio', 1);
    canvas.width = width;
    canvas.height = Math.max(1, Math.round(width / ratio));
    canvas.className = 'rc-image-editor__canvas';
    canvas.tabIndex = 0;
    canvas.setAttribute(
      'aria-label',
      'Image preview. Drag or use the arrow keys to reposition the image.',
    );

    const fit = document.createElement('select');
    fit.className = 'rc-select';
    for (const [value, label] of [
      ['cover', 'Fill and crop'],
      ['contain', 'Fit whole image'],
    ]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      fit.append(option);
    }
    fit.value = this.getAttribute('fit') === 'contain' ? 'contain' : 'cover';

    const zoom = document.createElement('input');
    zoom.className = 'rc-range';
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = String(numberAttribute(this, 'max-zoom', 4));
    zoom.step = '0.05';
    zoom.value = '1';
    const padding = document.createElement('input');
    padding.className = 'rc-range';
    padding.type = 'range';
    padding.min = '0';
    padding.max = '40';
    padding.step = '1';
    padding.value = fit.value === 'contain' ? '12' : '0';
    const background = document.createElement('input');
    background.className = 'rc-color-input';
    background.type = 'color';
    background.value = this.getAttribute('background') ?? '#ffffff';
    const transparent = document.createElement('input');
    transparent.type = 'checkbox';

    const controls = document.createElement('div');
    controls.className = 'rc-image-editor__controls';
    controls.append(
      labeledControl('Fit', fit),
      labeledControl('Zoom', zoom),
      labeledControl('Image padding', padding),
      labeledControl('Background color', background),
      labeledControl('Transparent background', transparent),
    );
    const reset = button('Reset position', 'reset');
    controls.append(reset);

    const stage = document.createElement('div');
    stage.className = 'rc-image-editor__stage';
    stage.append(canvas);
    const layout = document.createElement('div');
    layout.className = 'rc-image-editor__layout';
    layout.append(stage, controls);

    const error = document.createElement('p');
    error.className = 'rc-image-editor__error';
    error.hidden = true;
    error.setAttribute('role', 'alert');
    const footer = document.createElement('footer');
    footer.className = 'rc-image-editor__footer';
    const cancel = button('Cancel', 'cancel');
    const apply = button('Use edited image', 'apply');
    apply.classList.add('rc-button--primary');
    footer.append(cancel, apply);
    dialog.append(header, layout, error, footer);
    this.append(dialog);
    this.#canvas = canvas;
    this.#dialog = dialog;

    dialog.addEventListener(
      'close',
      () => {
        this.hidden = true;
        this.#opener?.focus();
      },
      {signal},
    );
    dialog.addEventListener(
      'click',
      event => {
        if (event.target !== dialog) {
          return;
        }
        const bounds = dialog.getBoundingClientRect();
        const inside =
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom;
        if (!inside) {
          this.close();
        }
      },
      {signal},
    );
    for (const control of [fit, zoom, padding, background, transparent]) {
      control.addEventListener('input', () => this.#draw(), {signal});
    }
    close.addEventListener('click', () => this.close(), {signal});
    cancel.addEventListener('click', () => this.close(), {signal});
    reset.addEventListener(
      'click',
      () => {
        this.#offset = {x: 0, y: 0};
        zoom.value = '1';
        this.#draw();
      },
      {signal},
    );
    apply.addEventListener('click', () => this.#apply(), {signal});
    canvas.addEventListener('pointerdown', event => this.#startDrag(event), {
      signal,
    });
    canvas.addEventListener('pointermove', event => this.#moveDrag(event), {
      signal,
    });
    canvas.addEventListener('pointerup', () => (this.#drag = null), {signal});
    canvas.addEventListener('pointercancel', () => (this.#drag = null), {
      signal,
    });
    canvas.addEventListener('keydown', event => this.#moveWithKeyboard(event), {
      signal,
    });
  }

  #controls(): {
    background: HTMLInputElement;
    fit: HTMLSelectElement;
    padding: HTMLInputElement;
    transparent: HTMLInputElement;
    zoom: HTMLInputElement;
  } {
    return {
      background: this.querySelector<HTMLInputElement>('input[type=color]')!,
      fit: this.querySelector<HTMLSelectElement>('select')!,
      padding: this.querySelectorAll<HTMLInputElement>('input[type=range]')[1]!,
      transparent: this.querySelector<HTMLInputElement>(
        'input[type=checkbox]',
      )!,
      zoom: this.querySelectorAll<HTMLInputElement>('input[type=range]')[0]!,
    };
  }

  #draw(): void {
    if (!this.#canvas || !this.#image) {
      return;
    }
    const controls = this.#controls();
    drawImage(this.#canvas, this.#image, {
      background: controls.background.value,
      fit: controls.fit.value as ImageFit,
      offsetX: this.#offset.x,
      offsetY: this.#offset.y,
      padding: Number(controls.padding.value),
      transparent: controls.transparent.checked,
      zoom: Number(controls.zoom.value),
    });
  }

  #startDrag(event: PointerEvent): void {
    this.#canvas?.setPointerCapture(event.pointerId);
    this.#drag = {x: event.clientX, y: event.clientY};
  }

  #moveDrag(event: PointerEvent): void {
    if (!this.#drag || !this.#canvas) {
      return;
    }
    const bounds = this.#canvas.getBoundingClientRect();
    this.#offset.x +=
      ((event.clientX - this.#drag.x) * this.#canvas.width) / bounds.width;
    this.#offset.y +=
      ((event.clientY - this.#drag.y) * this.#canvas.height) / bounds.height;
    this.#drag = {x: event.clientX, y: event.clientY};
    this.#draw();
  }

  #moveWithKeyboard(event: KeyboardEvent): void {
    const movement: Record<string, [number, number]> = {
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
    };
    const direction = movement[event.key];
    if (!direction) {
      return;
    }
    event.preventDefault();
    const step = event.shiftKey ? 20 : 4;
    this.#offset.x += direction[0] * step;
    this.#offset.y += direction[1] * step;
    this.#draw();
  }

  #apply(): void {
    if (!this.#canvas) {
      return;
    }
    try {
      const dataUrl = this.#canvas.toDataURL('image/png');
      this.dispatchEvent(
        new CustomEvent<EditedImageDetail>('reclaim:imageapply', {
          bubbles: true,
          detail: {dataUrl},
        }),
      );
      this.close();
    } catch (cause) {
      this.#setError(
        cause instanceof Error ? cause.message : 'The image could not export.',
      );
    }
  }

  #reset(): void {
    this.#image = null;
    this.#offset = {x: 0, y: 0};
    this.#setError('');
  }

  #setError(message: string): void {
    const error = this.querySelector<HTMLElement>('.rc-image-editor__error');
    if (!error) {
      return;
    }
    error.textContent = message;
    error.hidden = !message;
  }

  #load(source: string): Promise<HTMLImageElement> {
    if (!source) {
      return Promise.reject(new Error('Choose an image before editing it.'));
    }
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('The image could not load.'));
      image.src = source;
    });
  }
}
