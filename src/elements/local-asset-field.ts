export type LocalAssetState =
  'idle' | 'preparing' | 'ready' | 'warning' | 'error';

export interface ImageDimensions {
  height: number;
  width: number;
}

export interface LocalAssetValidationOptions {
  accept?: string;
  maxImageHeight?: number;
  maxImageWidth?: number;
  maxSize?: number;
  minImageHeight?: number;
  minImageWidth?: number;
  readDimensions?: (file: File) => Promise<ImageDimensions>;
}

export interface PreparedLocalAsset {
  description?: string;
  source?: Blob | string;
  warning?: string;
}

export type LocalAssetPrepare = (
  file: File,
  signal: AbortSignal,
) => Promise<PreparedLocalAsset | void>;

export interface LocalAssetChangeDetail {
  description: string;
  file: File;
  state: 'ready' | 'warning';
  url: string;
  warning?: string;
}

export interface LocalAssetStateDetail {
  message: string;
  state: LocalAssetState;
}

function positiveNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function fileExtension(name: string): string {
  const match = /(?:^|\/)([^/]+)$/.exec(name);
  const filename = match?.[1] ?? name;
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLocaleLowerCase() : '';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1_000_000) {
    return `${Math.ceil(bytes / 1_000)} KB`;
  }
  return `${Math.ceil(bytes / 1_000_000)} MB`;
}

/** Returns whether a file matches a native file input accept expression. */
export function acceptsFile(file: File, accept = ''): boolean {
  const rules = accept
    .split(',')
    .map(rule => rule.trim().toLocaleLowerCase())
    .filter(Boolean);
  if (!rules.length) {
    return true;
  }

  const type = file.type.toLocaleLowerCase();
  const extension = fileExtension(file.name);
  return rules.some(rule => {
    if (rule.startsWith('.')) {
      return extension === rule;
    }
    if (rule.endsWith('/*')) {
      return type.startsWith(rule.slice(0, -1));
    }
    return type === rule;
  });
}

async function readImageDimensions(file: File): Promise<ImageDimensions> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const dimensions = {height: bitmap.height, width: bitmap.width};
    bitmap.close();
    return dimensions;
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<ImageDimensions>((resolve, reject) => {
      const image = new Image();
      image.onload = () =>
        resolve({height: image.naturalHeight, width: image.naturalWidth});
      image.onerror = () => reject(new Error('The image could not be read.'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Validates a local file without uploading it. */
export async function validateLocalAsset(
  file: File,
  options: LocalAssetValidationOptions = {},
): Promise<void> {
  if (!acceptsFile(file, options.accept)) {
    throw new Error('Choose a supported file type.');
  }
  if (options.maxSize && file.size > options.maxSize) {
    throw new Error(
      `Choose a file smaller than ${formatFileSize(options.maxSize)}.`,
    );
  }

  const hasDimensionRule = [
    options.maxImageHeight,
    options.maxImageWidth,
    options.minImageHeight,
    options.minImageWidth,
  ].some(value => value !== undefined);
  if (!hasDimensionRule) {
    return;
  }
  if (!file.type.toLocaleLowerCase().startsWith('image/')) {
    throw new Error('Choose an image for image dimension validation.');
  }

  const getDimensions = options.readDimensions ?? readImageDimensions;
  const {height, width} = await getDimensions(file);
  if (options.minImageWidth && width < options.minImageWidth) {
    throw new Error(
      `Choose an image at least ${options.minImageWidth}px wide.`,
    );
  }
  if (options.minImageHeight && height < options.minImageHeight) {
    throw new Error(
      `Choose an image at least ${options.minImageHeight}px tall.`,
    );
  }
  if (options.maxImageWidth && width > options.maxImageWidth) {
    throw new Error(
      `Choose an image no wider than ${options.maxImageWidth}px.`,
    );
  }
  if (options.maxImageHeight && height > options.maxImageHeight) {
    throw new Error(
      `Choose an image no taller than ${options.maxImageHeight}px.`,
    );
  }
}

/** Enhances a native file input with local preparation and result states. */
export class ReclaimLocalAssetField extends HTMLElement {
  #abort: AbortController | null = null;
  #changeListener = () => void this.#select(this.input?.files?.[0]);
  #managedUrl: string | null = null;
  #run = 0;
  prepare: LocalAssetPrepare | undefined;

  static get observedAttributes(): string[] {
    return ['accept'];
  }

  connectedCallback(): void {
    this.classList.add('rc-local-asset-field');
    this.dataset.state ||= 'idle';
    if (this.input) {
      this.input.addEventListener('change', this.#changeListener);
      this.#syncInput();
    }
    this.#ensureResult();
  }

  disconnectedCallback(): void {
    this.input?.removeEventListener('change', this.#changeListener);
    this.#abort?.abort();
    this.#abort = null;
    this.#revokeManagedUrl();
  }

  attributeChangedCallback(): void {
    this.#syncInput();
  }

  get input(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('input[type=file]');
  }

  get result(): HTMLElement | null {
    return this.querySelector<HTMLElement>('[data-asset-result]');
  }

  get state(): LocalAssetState {
    return (this.dataset.state as LocalAssetState | undefined) ?? 'idle';
  }

  /** Clears the selected file, result, and any managed object URL. */
  clear(): void {
    this.#run += 1;
    this.#abort?.abort();
    this.#abort = null;
    this.#revokeManagedUrl();
    if (this.input) {
      this.input.value = '';
    }
    const result = this.result;
    if (result) {
      result.replaceChildren();
      result.hidden = true;
    }
    this.#setState('idle', '');
    this.dispatchEvent(new CustomEvent('reclaim:assetclear', {bubbles: true}));
  }

  #syncInput(): void {
    const accept = this.getAttribute('accept');
    if (this.input && accept !== null) {
      this.input.accept = accept;
    }
  }

  #validationOptions(): LocalAssetValidationOptions {
    return {
      accept: this.getAttribute('accept') ?? this.input?.accept,
      maxImageHeight: positiveNumber(this.getAttribute('max-image-height')),
      maxImageWidth: positiveNumber(this.getAttribute('max-image-width')),
      maxSize: positiveNumber(this.getAttribute('max-size')),
      minImageHeight: positiveNumber(this.getAttribute('min-image-height')),
      minImageWidth: positiveNumber(this.getAttribute('min-image-width')),
    };
  }

  async #select(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    const run = ++this.#run;
    this.#abort?.abort();
    const controller = new AbortController();
    this.#abort = controller;
    this.#revokeManagedUrl();
    try {
      await validateLocalAsset(file, this.#validationOptions());
      if (run !== this.#run) {
        return;
      }

      let prepared: PreparedLocalAsset | void = undefined;
      if (this.prepare) {
        this.#renderProgress('Preparing file.');
        this.#setState('preparing', 'Preparing file.');
        prepared = await this.prepare(file, controller.signal);
      }
      if (run !== this.#run || controller.signal.aborted) {
        return;
      }

      const source = prepared?.source ?? file;
      const url =
        typeof source === 'string' ? source : this.#createManagedUrl(source);
      const state = prepared?.warning ? 'warning' : 'ready';
      const description = prepared?.description ?? 'Ready to use';
      this.#renderResult(file, url, description, prepared?.warning);
      this.#setState(state, prepared?.warning ?? description);
      const detail: LocalAssetChangeDetail = {
        description,
        file,
        state,
        url,
        warning: prepared?.warning,
      };
      this.dispatchEvent(
        new CustomEvent<LocalAssetChangeDetail>('reclaim:assetchange', {
          bubbles: true,
          detail,
        }),
      );
    } catch (cause) {
      if (run !== this.#run || controller.signal.aborted) {
        return;
      }
      const message =
        cause instanceof Error ? cause.message : 'The file could not be used.';
      this.#renderError(message);
      this.#setState('error', message);
      if (this.input) {
        this.input.value = '';
      }
    }
  }

  #ensureResult(): HTMLElement {
    const existing = this.result;
    if (existing) {
      return existing;
    }
    const result = document.createElement('div');
    result.className = 'rc-upload-result';
    result.dataset.assetResult = '';
    result.hidden = true;
    this.append(result);
    return result;
  }

  #renderResult(
    file: File,
    url: string,
    description: string,
    warning?: string,
  ): void {
    const result = this.#ensureResult();
    const copy = document.createElement('div');
    copy.className = 'rc-upload-result__content';
    const name = document.createElement('strong');
    name.textContent = file.name;
    const status = document.createElement('span');
    status.textContent = warning ?? description;
    copy.append(name, status);
    const children: Node[] = [copy];
    if (file.type.startsWith('image/')) {
      const previewContainer = document.createElement('span');
      previewContainer.className = 'rc-upload-result__preview';
      const preview = document.createElement('img');
      preview.alt = '';
      preview.src = url;
      previewContainer.append(preview);
      children.unshift(previewContainer);
    }
    result.replaceChildren(...children);
    result.hidden = false;
    result.setAttribute('role', 'status');
  }

  #renderError(message: string): void {
    const result = this.#ensureResult();
    result.replaceChildren(message);
    result.hidden = false;
    result.setAttribute('role', 'alert');
  }

  #renderProgress(message: string): void {
    const result = this.#ensureResult();
    const copy = document.createElement('div');
    copy.className = 'rc-upload-result__content';
    copy.textContent = message;
    result.replaceChildren(copy);
    result.hidden = false;
    result.setAttribute('role', 'status');
  }

  #setState(state: LocalAssetState, message: string): void {
    this.dataset.state = state;
    this.setAttribute('aria-busy', String(state === 'preparing'));
    const result = this.result;
    if (result) {
      result.dataset.state = state === 'ready' ? 'success' : state;
      result.setAttribute('aria-busy', String(state === 'preparing'));
      result.setAttribute('aria-invalid', String(state === 'error'));
    }
    const detail: LocalAssetStateDetail = {message, state};
    this.dispatchEvent(
      new CustomEvent<LocalAssetStateDetail>('reclaim:assetstatechange', {
        bubbles: true,
        detail,
      }),
    );
  }

  #createManagedUrl(source: Blob): string {
    this.#revokeManagedUrl();
    this.#managedUrl = URL.createObjectURL(source);
    return this.#managedUrl;
  }

  #revokeManagedUrl(): void {
    if (!this.#managedUrl) {
      return;
    }
    URL.revokeObjectURL(this.#managedUrl);
    this.#managedUrl = null;
  }
}
