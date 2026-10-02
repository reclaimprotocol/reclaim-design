import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import {
  Button,
  ColorField,
  Dialog,
  Field,
  RangeField,
  Switch,
  UploadField,
  UploadResult,
} from '../react/index.js';

export type ImageFit = 'contain' | 'cover';

export type ImageSource = {
  name: string;
  url: string;
};

export type EditedImage = ImageSource;

export type ImageEditorLabels = {
  apply: string;
  background: string;
  cancel: string;
  description: string;
  dragHint: string;
  fit: string;
  fitContain: string;
  fitCover: string;
  padding: string;
  reset: string;
  title: string;
  transparent: string;
  zoom: string;
};

const defaultLabels: ImageEditorLabels = {
  apply: 'Use edited image',
  background: 'Background color',
  cancel: 'Cancel',
  description: 'Adjust the crop, scale, and background.',
  dragHint: 'Drag the image to reposition it.',
  fit: 'Fit',
  fitContain: 'Fit whole image',
  fitCover: 'Fill and crop',
  padding: 'Image padding',
  reset: 'Reset position',
  title: 'Crop and frame image',
  transparent: 'Transparent background',
  zoom: 'Zoom',
};

type DrawOptions = {
  background: string;
  fit: ImageFit;
  offsetX: number;
  offsetY: number;
  padding: number;
  transparent: boolean;
  zoom: number;
};

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('The selected image could not load.'));
    image.src = source;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement) {
  const dataUrl = canvas.toDataURL('image/png');
  if (!dataUrl.startsWith('data:image/png')) {
    throw new Error('The edited image could not be created.');
  }
  return dataUrl;
}

function drawImage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: DrawOptions,
) {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const {background, fit, offsetX, offsetY, padding, transparent, zoom} =
    options;
  const inset = (Math.min(canvas.width, canvas.height) * padding) / 100;
  const availableWidth = Math.max(1, canvas.width - inset * 2);
  const availableHeight = Math.max(1, canvas.height - inset * 2);
  const baseScale =
    fit === 'cover'
      ? Math.max(availableWidth / image.width, availableHeight / image.height)
      : Math.min(availableWidth / image.width, availableHeight / image.height);
  const scale = baseScale * zoom;
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const maxOffsetX = Math.abs(drawWidth - availableWidth) / 2;
  const maxOffsetY = Math.abs(drawHeight - availableHeight) / 2;
  const clampedOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
  const clampedOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!transparent) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(
    image,
    (canvas.width - drawWidth) / 2 + clampedOffsetX,
    (canvas.height - drawHeight) / 2 + clampedOffsetY,
    drawWidth,
    drawHeight,
  );
}

export type ImageEditorDialogProps = {
  aspectRatio: number;
  background?: string;
  initialFit?: ImageFit;
  labels?: Partial<ImageEditorLabels>;
  maxZoom?: number;
  onApply: (dataUrl: string) => void;
  onCancel: () => void;
  outputWidth?: number;
  source: ImageSource;
};

/** Edits one local or remote image and returns a PNG data URL. */
export function ImageEditorDialog({
  aspectRatio,
  background: initialBackground = '#ffffff',
  initialFit = 'cover',
  labels: customLabels,
  maxZoom = 4,
  onApply,
  onCancel,
  outputWidth = 1200,
  source,
}: ImageEditorDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{x: number; y: number} | null>(null);
  const labels = {...defaultLabels, ...customLabels};
  const safeAspectRatio =
    Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
  const safeOutputWidth = Math.max(1, Math.round(outputWidth));
  const safeMaxZoom = Math.max(1, maxZoom);
  const [background, setBackground] = useState(initialBackground);
  const [fit, setFit] = useState<ImageFit>(initialFit);
  const [offset, setOffset] = useState({x: 0, y: 0});
  const [padding, setPadding] = useState(initialFit === 'contain' ? 12 : 0);
  const [transparent, setTransparent] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    imageRef.current = null;
    loadImage(source.url)
      .then(image => {
        if (active) {
          imageRef.current = image;
          setError('');
          setOffset(current => ({...current}));
        }
      })
      .catch(cause => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : 'Image load failed.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [source.url]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) {
      return;
    }
    drawImage(canvas, image, {
      background,
      fit,
      offsetX: offset.x,
      offsetY: offset.y,
      padding,
      transparent,
      zoom,
    });
  }, [background, fit, offset, padding, transparent, zoom]);

  const beginDrag = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {x: event.clientX, y: event.clientY};
  };

  const continueDrag = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const scaleX = event.currentTarget.width / bounds.width;
    const scaleY = event.currentTarget.height / bounds.height;
    const movement = {
      x: (event.clientX - dragRef.current.x) * scaleX,
      y: (event.clientY - dragRef.current.y) * scaleY,
    };
    dragRef.current = {x: event.clientX, y: event.clientY};
    setOffset(current => ({
      x: current.x + movement.x,
      y: current.y + movement.y,
    }));
  };

  const finishDrag = () => {
    dragRef.current = null;
  };

  const apply = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    try {
      onApply(canvasToDataUrl(canvas));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Image export failed.');
    }
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      title={labels.title}
      description={labels.description}
      className="rc-image-editor"
      bodyClassName="rc-image-editor__dialog-body"
      width="min(960px, calc(100vw - 32px))"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {labels.cancel}
          </Button>
          <Button onClick={apply}>{labels.apply}</Button>
        </>
      }
    >
      <div className="rc-image-editor__layout">
        <div className="rc-image-editor__stage">
          <canvas
            ref={canvasRef}
            width={safeOutputWidth}
            height={Math.max(1, Math.round(safeOutputWidth / safeAspectRatio))}
            onPointerDown={beginDrag}
            onPointerMove={continueDrag}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            aria-label={`${labels.title}. ${labels.dragHint}`}
          />
          <p>{labels.dragHint}</p>
        </div>
        <div className="rc-image-editor__controls">
          <Field
            label={labels.fit}
            variant="select"
            value={fit}
            options={[
              {value: 'cover', label: labels.fitCover},
              {value: 'contain', label: labels.fitContain},
            ]}
            onChange={event => {
              setFit(event.target.value as ImageFit);
              setOffset({x: 0, y: 0});
            }}
          />
          <RangeField
            label={labels.zoom}
            min={1}
            max={safeMaxZoom}
            step={0.05}
            value={zoom}
            formatValue={value => `${Math.round(value * 100)}%`}
            onChange={setZoom}
          />
          <RangeField
            label={labels.padding}
            min={0}
            max={40}
            step={1}
            value={padding}
            formatValue={value => `${value}%`}
            onChange={setPadding}
          />
          <ColorField
            label={labels.background}
            value={background}
            disabled={transparent}
            onChange={setBackground}
          />
          <Switch
            label={labels.transparent}
            checked={transparent}
            onChange={setTransparent}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setOffset({x: 0, y: 0});
              setZoom(1);
            }}
          >
            {labels.reset}
          </Button>
        </div>
      </div>
      {error && (
        <p className="rc-image-editor__error" role="alert">
          {error}
        </p>
      )}
    </Dialog>
  );
}

export type EditableImageFieldProps = {
  accept?: string;
  aspectRatio?: number;
  defaultFit?: ImageFit;
  hint: string;
  label: string;
  onChange: (image: EditedImage | null) => void;
  outputWidth?: number;
};

/** Selects, locally edits, previews, and clears one image file. */
export function EditableImageField({
  accept = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp',
  aspectRatio = 1,
  defaultFit = 'cover',
  hint,
  label,
  onChange,
  outputWidth,
}: EditableImageFieldProps) {
  const sourceRef = useRef<ImageSource | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [source, setSource] = useState<ImageSource | null>(null);
  const [result, setResult] = useState<EditedImage | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  useEffect(
    () => () => {
      if (sourceRef.current) {
        URL.revokeObjectURL(sourceRef.current.url);
      }
    },
    [],
  );

  const select = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    if (sourceRef.current) {
      URL.revokeObjectURL(sourceRef.current.url);
    }
    const next = {name: file.name, url: URL.createObjectURL(file)};
    setSource(next);
    setEditorOpen(true);
  };

  const clear = () => {
    if (sourceRef.current) {
      URL.revokeObjectURL(sourceRef.current.url);
    }
    setSource(null);
    setResult(null);
    onChange(null);
    setInputKey(current => current + 1);
  };

  const apply = (url: string) => {
    if (!source) {
      return;
    }
    const edited = {name: source.name, url};
    setResult(edited);
    setEditorOpen(false);
    onChange(edited);
  };

  return (
    <div className="rc-editable-image-field">
      <UploadField
        key={inputKey}
        label={label}
        hint={`${hint} The file stays on this device.`}
        accept={accept}
        onFilesChange={select}
      />
      {result && (
        <UploadResult
          name={result.name}
          description="Edited locally"
          preview={<img src={result.url} alt="" />}
          actions={
            <>
              <Button variant="secondary" onClick={() => setEditorOpen(true)}>
                Edit
              </Button>
              <Button variant="secondary" onClick={clear}>
                Clear
              </Button>
            </>
          }
        />
      )}
      {source && editorOpen && (
        <ImageEditorDialog
          aspectRatio={aspectRatio}
          initialFit={defaultFit}
          outputWidth={outputWidth}
          source={source}
          onApply={apply}
          onCancel={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
