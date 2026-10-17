import {
  createContext,
  createElement,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PropsWithChildren,
  type Ref,
  type RefObject,
  type ReactNode,
} from 'react';
import {createPortal} from 'react-dom';
import {createDismissibleOverlayController} from '@reclaimprotocol/design/behaviors';
import {icon, type ReclaimIconName} from '@reclaimprotocol/design/icons';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'inline';
export type StatusTone =
  'verified' | 'pending' | 'failed' | 'neutral' | 'optional';
export type PillTone = Exclude<StatusTone, 'optional'> | 'sandbox';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type SemanticTone = 'neutral' | 'success' | 'warning' | 'danger';

const classes = (...items: Array<string | undefined | false>) =>
  items.filter(Boolean).join(' ');

/** Renders a package icon as JSX so it can be a direct child of a component. */
export function Icon({
  name,
  className,
}: {
  name: ReclaimIconName;
  className?: string;
}) {
  const markup = icon(name);
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      dangerouslySetInnerHTML={{
        __html: markup.slice(
          markup.indexOf('>') + 1,
          markup.lastIndexOf('</svg>'),
        ),
      }}
    />
  );
}

type AnchoredOverlaySide = 'above' | 'below';

function AnchoredOverlay({
  anchor,
  overlayRef,
  align = 'start',
  matchAnchorWidth = false,
  className,
  children,
  ...props
}: PropsWithChildren<
  {
    anchor: RefObject<HTMLElement | null>;
    overlayRef: Ref<HTMLDivElement>;
    align?: 'start' | 'end';
    matchAnchorWidth?: boolean;
    className?: string;
  } & HTMLAttributes<HTMLDivElement>
>) {
  const [style, setStyle] = useState<CSSProperties>();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const update = () => {
      const target = anchor.current;
      if (!target) {
        return;
      }
      const sizingTarget = matchAnchorWidth
        ? (target.querySelector<HTMLElement>('[aria-haspopup]') ?? target)
        : target;
      const bounds = sizingTarget.getBoundingClientRect();
      const viewportGap = 12;
      const overlayGap = 4;
      const roomBelow = window.innerHeight - bounds.bottom - viewportGap;
      const roomAbove = bounds.top - viewportGap;
      const side: AnchoredOverlaySide =
        roomBelow < 220 && roomAbove > roomBelow ? 'above' : 'below';
      const next: CSSProperties = {
        maxHeight: Math.max(120, side === 'below' ? roomBelow : roomAbove),
        maxWidth: `calc(100vw - ${viewportGap * 2}px)`,
        minWidth: Math.min(bounds.width, window.innerWidth - viewportGap * 2),
      };
      if (matchAnchorWidth) {
        next.width = Math.min(
          bounds.width,
          window.innerWidth - viewportGap * 2,
        );
      }
      if (side === 'below') {
        next.top = bounds.bottom + overlayGap;
      } else {
        next.bottom = window.innerHeight - bounds.top + overlayGap;
      }
      if (align === 'end') {
        next.right = Math.max(viewportGap, window.innerWidth - bounds.right);
      } else {
        next.left = Math.min(
          Math.max(viewportGap, bounds.left),
          Math.max(viewportGap, window.innerWidth - viewportGap - bounds.width),
        );
      }
      setStyle(next);
      setTheme(
        target.closest<HTMLElement>('.rc-theme')?.dataset.theme ?? 'light',
      );
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [align, anchor, matchAnchorWidth]);

  if (!style || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      {...props}
      ref={overlayRef}
      className={classes('rc-anchored-overlay', className)}
      data-theme={theme}
      style={style}
    >
      {children}
    </div>,
    document.body,
  );
}

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: Exclude<ThemeMode, 'system'>;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ReclaimThemeProvider({
  theme: controlledTheme,
  defaultTheme = 'system',
  onThemeChange,
  children,
}: PropsWithChildren<{
  theme?: ThemeMode;
  defaultTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}>) {
  const [internalTheme, setInternalTheme] = useState(defaultTheme);
  const [systemDark, setSystemDark] = useState(false);
  const theme = controlledTheme ?? internalTheme;

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const resolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme(next) {
        setInternalTheme(next);
        onThemeChange?.(next);
      },
    }),
    [theme, resolvedTheme, onThemeChange],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className="rc-theme" data-theme={resolvedTheme} data-theme-root>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useReclaimTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useReclaimTheme must be used inside ReclaimThemeProvider');
  }
  return value;
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    busy?: boolean;
  }
>(function Button(
  {
    className,
    variant = 'primary',
    size,
    fullWidth = false,
    busy = false,
    children,
    disabled,
    onClick,
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      className={classes('rc-button', `rc-button--${variant}`, className)}
      data-variant={variant === 'destructive' ? 'danger' : variant}
      data-size={size}
      data-width={fullWidth ? 'full' : undefined}
      data-busy={busy || undefined}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={
        busy
          ? event => {
              event.preventDefault();
              event.stopPropagation();
            }
          : onClick
      }
    >
      {children}
    </button>
  );
});

export type FieldVariant =
  'text' | 'password' | 'search' | 'date' | 'textarea' | 'select' | 'read-only';

export const Field = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    variant?: FieldVariant;
    options?: ReadonlyArray<{
      value: string;
      label: ReactNode;
      disabled?: boolean;
    }>;
  }
>(function Field(
  {label, hint, error, className, id, variant = 'text', options, ...props},
  ref,
) {
  const generatedId = useId();
  const inputId =
    id ?? `rc-field-${String(props.name ?? generatedId).replaceAll(':', '')}`;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;
  return (
    <label className={classes('rc-field', className)} data-field data-reserve>
      <span className="rc-field__label">{label}</span>
      {variant === 'textarea' ? (
        <textarea
          {...(props as ComponentPropsWithoutRef<'textarea'>)}
          id={inputId}
          className="rc-textarea"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={message ? messageId : undefined}
        />
      ) : variant === 'select' ? (
        <select
          {...(props as ComponentPropsWithoutRef<'select'>)}
          id={inputId}
          className="rc-select"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={message ? messageId : undefined}
        >
          {options?.map(option => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={variant === 'read-only' ? 'text' : variant}
          readOnly={variant === 'read-only' || props.readOnly}
          className="rc-input"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={message ? messageId : undefined}
        />
      )}
      <span
        id={message ? messageId : undefined}
        className={classes(
          'rc-field__message',
          error ? 'rc-field__message--error' : undefined,
        )}
        data-empty={!message || undefined}
        aria-hidden={!message || undefined}
      >
        {message ?? '\u00a0'}
      </span>
    </label>
  );
});

export type RangeFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'children' | 'defaultValue' | 'onChange' | 'type' | 'value'
> & {
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

export function RangeField({
  label,
  value,
  onChange,
  formatValue = current => current,
  hint,
  error,
  className,
  id,
  ...props
}: RangeFieldProps) {
  const generatedId = useId().replaceAll(':', '');
  const inputId = id ?? `rc-range-field-${generatedId}`;
  const labelId = `${inputId}-label`;
  const message = error ?? hint;
  const messageId = `${inputId}-message`;
  return (
    <div className={classes('rc-field', 'rc-range-field', className)}>
      <span className="rc-range-field__heading">
        <span id={labelId} className="rc-field__label">
          {label}
        </span>
        <output htmlFor={inputId}>{formatValue(value)}</output>
      </span>
      <input
        {...props}
        id={inputId}
        type="range"
        value={value}
        aria-labelledby={props['aria-label'] ? undefined : labelId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={message ? messageId : undefined}
        onChange={event => onChange(event.currentTarget.valueAsNumber)}
      />
      <span
        id={message ? messageId : undefined}
        className={classes(
          'rc-field__message',
          error ? 'rc-field__message--error' : undefined,
        )}
        data-empty={!message || undefined}
        aria-hidden={!message || undefined}
      >
        {message ?? '\u00a0'}
      </span>
    </div>
  );
}

export type ColorFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'children' | 'defaultValue' | 'onChange' | 'type' | 'value'
> & {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  error?: ReactNode;
};

export function ColorField({
  label,
  value,
  onChange,
  hint,
  error,
  className,
  id,
  ...props
}: ColorFieldProps) {
  const generatedId = useId().replaceAll(':', '');
  const inputId = id ?? `rc-color-field-${generatedId}`;
  const message = error ?? hint;
  const messageId = `${inputId}-message`;
  return (
    <label className={classes('rc-field', 'rc-color-field', className)}>
      <span className="rc-field__label">{label}</span>
      <span className="rc-color-field__control">
        <input
          {...props}
          id={inputId}
          type="color"
          value={value}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={message ? messageId : undefined}
          onChange={event => onChange(event.currentTarget.value)}
        />
        <output htmlFor={inputId}>{value.toUpperCase()}</output>
      </span>
      <span
        id={message ? messageId : undefined}
        className={classes(
          'rc-field__message',
          error ? 'rc-field__message--error' : undefined,
        )}
        data-empty={!message || undefined}
        aria-hidden={!message || undefined}
      >
        {message ?? '\u00a0'}
      </span>
    </label>
  );
}

export function StatusPill({
  tone = 'neutral',
  dot = false,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {tone?: PillTone; dot?: boolean}) {
  return (
    <span
      {...props}
      className={classes('rc-pill', className)}
      data-tone={tone === 'neutral' ? undefined : tone}
      data-dot={dot || undefined}
    >
      {children}
    </span>
  );
}

export function Card({
  interactive = false,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {interactive?: boolean}) {
  return (
    <article
      {...props}
      className={classes('card', 'rc-card', className)}
      data-glass={interactive || undefined}
    />
  );
}

export function Alert({
  tone = 'neutral',
  title,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: SemanticTone;
  title?: ReactNode;
}) {
  return (
    <div
      {...props}
      className={classes('rc-alert', className)}
      role="alert"
      data-variant={tone === 'neutral' ? undefined : tone}
    >
      <div>
        {title && <strong className="rc-alert__title">{title}</strong>}
        {children && <div className="rc-alert__body">{children}</div>}
      </div>
    </div>
  );
}

export function Avatar({
  src,
  alt = '',
  initials,
  size,
  shape,
  tone,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  src?: string;
  alt?: string;
  initials?: ReactNode;
  size?: 'sm' | 'lg';
  shape?: 'square';
  tone?: 'outline' | 'pending';
}) {
  return (
    <figure
      {...props}
      className={classes('rc-avatar', className)}
      data-size={size}
      data-shape={shape}
      data-tone={tone}
    >
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <span aria-label={alt || undefined}>{initials}</span>
      )}
    </figure>
  );
}

export function Meter({
  value,
  min = 0,
  max = 100,
  low,
  high,
  optimum,
  label,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  low?: number;
  high?: number;
  optimum?: number;
  label?: ReactNode;
  className?: string;
}) {
  return (
    <label className={classes('rc-meter', className)}>
      {label && <span>{label}</span>}
      <meter
        value={value}
        min={min}
        max={max}
        low={low}
        high={high}
        optimum={optimum}
      >
        {value}
      </meter>
    </label>
  );
}

export type TabItem = {
  value: string;
  label: ReactNode;
  panel: ReactNode;
  disabled?: boolean;
};
export function Tabs({
  items,
  value,
  onChange,
  label = 'Sections',
  className,
}: {
  items: ReadonlyArray<TabItem>;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const uid = useId().replaceAll(':', '');
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectAt = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) {
      return;
    }
    onChange(item.value);
    refs.current[index]?.focus();
  };
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    let next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (index + step + items.length) % items.length;
    while (items[next]?.disabled && next !== index) {
      next = (next + step + items.length) % items.length;
    }
    selectAt(next);
  };
  const activeIndex = Math.max(
    0,
    items.findIndex(item => item.value === value),
  );
  return (
    <div className={classes('rc-tabs', className)}>
      <div role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.value}
            id={`${uid}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-controls={`${uid}-panel-${index}`}
            tabIndex={index === activeIndex ? 0 : -1}
            disabled={item.disabled}
            ref={node => {
              refs.current[index] = node;
            }}
            onClick={() => selectAt(index)}
            onKeyDown={event => move(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          key={item.value}
          id={`${uid}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${index}`}
          hidden={index !== activeIndex}
        >
          {item.panel}
        </div>
      ))}
    </div>
  );
}

export function TagInput({
  label,
  value,
  onChange,
  placeholder = 'Add a tag',
  disabled,
  className,
}: {
  label: ReactNode;
  value: ReadonlyArray<string>;
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const add = () => {
    const tag = draft.trim().replace(/,$/, '');
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft('');
  };
  return (
    <div className={classes('rc-tag-field', className)}>
      <label className="rc-field__label" htmlFor={id}>
        {label}
      </label>
      <div
        className="rc-tag-input"
        aria-disabled={disabled || undefined}
        onClick={event => event.currentTarget.querySelector('input')?.focus()}
      >
        {value.map(tag => (
          <span key={tag} className="badge" data-variant="secondary">
            {tag}
            <button
              type="button"
              data-close
              disabled={disabled}
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter(item => item !== tag))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          disabled={disabled}
          value={draft}
          placeholder={placeholder}
          onChange={event => setDraft(event.target.value)}
          onBlur={add}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              add();
            } else if (event.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
        />
      </div>
    </div>
  );
}

export function UploadField({
  label,
  hint,
  accept,
  multiple,
  disabled,
  onFilesChange,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFilesChange?: (files: FileList | null) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <label className={classes('rc-upload', className)} htmlFor={id}>
      <strong>{label}</strong>
      {hint && <span>{hint}</span>}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={event => onFilesChange?.(event.target.files)}
      />
    </label>
  );
}

export function UploadResult({
  name,
  description,
  preview,
  actions,
  className,
}: {
  name: ReactNode;
  description?: ReactNode;
  preview?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={classes('rc-upload-result', className)}>
      {preview && <span className="rc-upload-result__preview">{preview}</span>}
      <span className="rc-upload-result__content">
        <strong>{name}</strong>
        {description && <small>{description}</small>}
      </span>
      {actions && <span className="rc-upload-result__actions">{actions}</span>}
    </div>
  );
}

export function PickerField({
  label,
  title,
  description,
  preview,
  actionLabel = 'Choose',
  onOpen,
  disabled,
  hint,
  className,
}: {
  label: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  preview?: ReactNode;
  actionLabel?: ReactNode;
  onOpen: () => void;
  disabled?: boolean;
  hint?: ReactNode;
  className?: string;
}) {
  const labelId = `rc-picker-field-${useId().replaceAll(':', '')}`;
  return (
    <div
      className={classes('rc-picker-field', className)}
      role="group"
      aria-labelledby={labelId}
    >
      <span id={labelId} className="rc-field__label">
        {label}
      </span>
      <div className="rc-picker-field__selection">
        {preview && <span className="rc-picker-field__preview">{preview}</span>}
        <span className="rc-picker-field__content">
          <strong>{title}</strong>
          {description && <small>{description}</small>}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={onOpen}
        >
          {actionLabel}
        </Button>
      </div>
      <span
        className="rc-field__message"
        data-empty={!hint || undefined}
        aria-hidden={!hint || undefined}
      >
        {hint ?? '\u00a0'}
      </span>
    </div>
  );
}

export type SelectionDialogItem<Value extends string = string> = {
  value: Value;
  label: ReactNode;
  description?: ReactNode;
  preview?: ReactNode;
  disabled?: boolean;
};

export function SelectionDialog<Value extends string = string>({
  open,
  onClose,
  title,
  description,
  items,
  value,
  onChange,
  label = 'Options',
  closeOnSelect = true,
  columns = 'auto',
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  items: ReadonlyArray<SelectionDialogItem<Value>>;
  value: Value;
  onChange: (value: Value) => void;
  label?: string;
  closeOnSelect?: boolean;
  columns?: 1 | 2 | 3 | 'auto';
  className?: string;
}) {
  const name = `rc-selection-dialog-${useId().replaceAll(':', '')}`;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      width="min(760px, calc(100vw - 32px))"
      className={classes('rc-selection-dialog', className)}
    >
      <fieldset
        className="rc-selection-dialog__options"
        style={
          {
            '--_selection-dialog-columns':
              columns === 'auto'
                ? 'repeat(auto-fit, minmax(min(16rem, 100%), 1fr))'
                : `repeat(${columns}, minmax(0, 1fr))`,
          } as CSSProperties
        }
      >
        <legend className="rc-visually-hidden">{label}</legend>
        {items.map(item => (
          <ChoiceRow
            key={item.value}
            type="radio"
            name={name}
            value={item.value}
            checked={item.value === value}
            disabled={item.disabled}
            title={item.label}
            description={item.description}
            onChange={checked => {
              if (!checked) {
                return;
              }
              onChange(item.value);
              if (closeOnSelect) {
                onClose();
              }
            }}
          >
            {item.preview && (
              <span className="rc-selection-dialog__preview">
                {item.preview}
              </span>
            )}
          </ChoiceRow>
        ))}
      </fieldset>
    </Dialog>
  );
}

export type ToastMessage = {
  id: string;
  title?: ReactNode;
  message: ReactNode;
  tone?: SemanticTone;
};
export function ToastRegion({
  messages,
  onDismiss,
  placement = 'top-right',
  label = 'Notifications',
}: {
  messages: ReadonlyArray<ToastMessage>;
  onDismiss?: (id: string) => void;
  placement?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  label?: string;
}) {
  return (
    <div
      className="toast-container"
      data-placement={placement}
      role="region"
      aria-label={label}
      aria-live="polite"
    >
      {messages.map(message => (
        <div
          key={message.id}
          className="toast"
          role="status"
          data-variant={message.tone === 'neutral' ? undefined : message.tone}
        >
          <div>
            {message.title && (
              <div className="toast-title">{message.title}</div>
            )}
            <div className="toast-message">{message.message}</div>
          </div>
          {onDismiss && (
            <button
              type="button"
              data-close
              aria-label="Dismiss notification"
              onClick={() => onDismiss(message.id)}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function Kpi({
  label,
  value,
  delta,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  className?: string;
}) {
  return (
    <article className={classes('rc-kpi', className)} data-tile>
      <span className="rc-kpi__label">{label}</span>
      <strong className="rc-kpi__value">{value}</strong>
      {delta && <span className="rc-kpi__delta">{delta}</span>}
    </article>
  );
}

export type SegmentedControlOption<Value extends string = string> = {
  value: Value;
  label: ReactNode;
};

export type SegmentedControlProps<Value extends string = string> = {
  label: string;
  value: Value;
  options: ReadonlyArray<SegmentedControlOption<Value>>;
  onChange: (value: Value) => void;
  className?: string;
};

export function SegmentedControl<Value extends string = string>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<Value>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) {
      return;
    }
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + options.length) %
            options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <fieldset className={classes('rc-segments', className)} aria-label={label}>
      {options.map(option => (
        <button
          type="button"
          key={option.value}
          data-segment
          aria-pressed={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={event => move(event, options.indexOf(option))}
          ref={node => {
            refs.current[options.indexOf(option)] = node;
          }}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}

export function FlowStepper({
  current,
  steps,
  onStepChange,
}: {
  current: number;
  steps: ReadonlyArray<{label: string; description?: string}>;
  onStepChange?: (index: number) => void;
}) {
  return (
    <ol className="rc-stepper" aria-label="Progress">
      {steps.map((step, index) => (
        <li
          key={step.label}
          data-state={
            index < current
              ? 'complete'
              : index === current
                ? 'current'
                : 'upcoming'
          }
        >
          <button
            type="button"
            disabled={!onStepChange}
            onClick={() => onStepChange?.(index)}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className="rc-stepper__index">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>
              <strong>{step.label}</strong>
              {step.description && <small>{step.description}</small>}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function AppShell({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={classes('rc-app-shell', className)}>
      {children}
    </div>
  );
}

export function AppShellMain({
  bar,
  children,
  className,
}: {
  bar: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={classes('rc-app-shell__main', className)}>
      {bar}
      <div className="rc-app-shell__content">{children}</div>
    </main>
  );
}

export function Sidebar({
  label = 'Primary navigation',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {label?: string}) {
  return (
    <aside
      {...props}
      className={classes('rc-sidebar', className)}
      aria-label={label}
    >
      {children}
    </aside>
  );
}

export type NavItem<Value extends string = string> = {
  value: Value;
  label: ReactNode;
  icon?: ReactNode;
  href?: string;
  disabled?: boolean;
};

export type NavigationGroup<Value extends string = string> = {
  label: ReactNode;
  items: ReadonlyArray<NavItem<Value> & {badge?: ReactNode}>;
};

export type NavigationPaneProps<Value extends string = string> = {
  brand?: ReactNode;
  switcher?: ReactNode;
  groups: ReadonlyArray<NavigationGroup<Value>>;
  value?: Value;
  onNavigate?: (value: Value) => void;
  footer?: ReactNode;
  label?: string;
  id?: string;
  popover?: boolean;
  className?: string;
};

export function NavigationPane<Value extends string = string>({
  brand,
  switcher,
  groups,
  value,
  onNavigate,
  footer,
  label = 'Primary navigation',
  id,
  popover,
  className,
}: NavigationPaneProps<Value>) {
  return (
    <Sidebar
      className={classes('rc-navigation-pane', className)}
      label={label}
      id={id}
      popover={popover ? 'auto' : undefined}
    >
      {brand && <div className="rc-navigation-pane__brand">{brand}</div>}
      {switcher && (
        <div className="rc-navigation-pane__switcher">{switcher}</div>
      )}
      <div className="rc-navigation-pane__groups">
        {groups.map((group, groupIndex) => (
          <section className="rc-navigation-group" key={groupIndex}>
            <h2>{group.label}</h2>
            <div>
              {group.items.map(item =>
                item.href ? (
                  <a
                    key={item.value}
                    className="rc-nav-link"
                    data-nav
                    href={item.href}
                    aria-current={item.value === value ? 'page' : undefined}
                    aria-disabled={item.disabled || undefined}
                    onClick={() => onNavigate?.(item.value)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && <small>{item.badge}</small>}
                  </a>
                ) : (
                  <button
                    key={item.value}
                    type="button"
                    className="rc-nav-link"
                    data-nav
                    disabled={item.disabled}
                    aria-current={item.value === value ? 'page' : undefined}
                    onClick={() => onNavigate?.(item.value)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && <small>{item.badge}</small>}
                  </button>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
      {footer && <div className="rc-navigation-pane__footer">{footer}</div>}
    </Sidebar>
  );
}

export function AppBar({
  breadcrumbs,
  actions,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header {...props} className={classes('rc-app-bar', className)}>
      <div className="rc-app-bar__breadcrumbs">{breadcrumbs}</div>
      {actions && <div className="rc-app-bar__actions">{actions}</div>}
    </header>
  );
}

export function Page({
  width,
  children,
  className,
}: {
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={classes('rc-page', className)} data-width={width}>
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={classes('rc-page-header', className)}>
      <div>
        {eyebrow && <span className="rc-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {meta && <div className="rc-page-header__meta">{meta}</div>}
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="rc-page-header__actions">{actions}</div>}
    </header>
  );
}

export function KindTag({children}: {children: ReactNode}) {
  return <span className="rc-kind-tag">{children}</span>;
}

export function FilterToolbar({
  label = 'Filters',
  results,
  children,
  actions,
  className,
}: {
  label?: string;
  results?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={classes('rc-filter-toolbar', className)}
      aria-label={label}
    >
      <div className="rc-filter-toolbar__controls">
        {children}
        {results && (
          <span className="rc-filter-toolbar__results">{results}</span>
        )}
        {actions && <div className="rc-filter-toolbar__actions">{actions}</div>}
      </div>
    </section>
  );
}

export function FilterRow({children}: {children: ReactNode}) {
  return <div className="rc-filter-toolbar__controls">{children}</div>;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={classes('rc-switch', className)}
      data-disabled={disabled || undefined}
    >
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={event => onChange(event.target.checked)}
      />
      <span className="rc-switch__track" aria-hidden="true">
        <i />
      </span>
    </label>
  );
}

export function MetadataList({
  items,
  keyWidth,
  className,
}: {
  items: ReadonlyArray<{label: ReactNode; value: ReactNode}>;
  keyWidth?: string;
  className?: string;
}) {
  return (
    <dl
      className={classes('rc-metadata-list', className)}
      style={
        keyWidth
          ? ({'--rc-metadata-key-width': keyWidth} as CSSProperties)
          : undefined
      }
    >
      {items.map((item, index) => (
        <div key={index}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type BreadcrumbItem = {label: ReactNode; href?: string};
export function Breadcrumbs({
  items,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {items: ReadonlyArray<BreadcrumbItem>}) {
  return (
    <nav
      {...props}
      className={classes('rc-breadcrumbs-nav', className)}
      aria-label="Breadcrumb"
    >
      <ol className="rc-breadcrumbs">
        {items.map((item, index) => (
          <li key={index}>
            {index === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function BottomTabs({
  items,
  value,
  onChange,
  menuTarget,
  className,
}: {
  items: ReadonlyArray<NavItem>;
  value: string;
  onChange: (value: string) => void;
  menuTarget?: string;
  className?: string;
}) {
  return (
    <nav
      className={classes('rc-bottom-tabs', className)}
      aria-label="Primary navigation"
    >
      {items.map(item => (
        <button
          key={item.value}
          type="button"
          className="rc-nav-link"
          disabled={item.disabled}
          aria-current={item.value === value ? 'page' : undefined}
          onClick={() => onChange(item.value)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
      {menuTarget && (
        <button
          type="button"
          className="rc-nav-link"
          popoverTarget={menuTarget}
        >
          <Icon name="menu" />
          <span>Menu</span>
        </button>
      )}
    </nav>
  );
}

export function MenuSheet({
  open,
  onClose,
  label = 'Menu',
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open, onClose]);
  if (!open) {
    return null;
  }
  return (
    <div
      className="rc-menu-sheet-layer"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside className={classes('rc-menu-sheet', className)} aria-label={label}>
        {children}
      </aside>
    </div>
  );
}

export function Popover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  className,
  align = 'start',
  matchAnchorWidth = false,
}: {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  align?: 'start' | 'end';
  matchAnchorWidth?: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const root = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  useEffect(() => {
    const rootElement = root.current;
    if (!open || !rootElement || !overlay) {
      return;
    }
    const controller = createDismissibleOverlayController({
      roots: [rootElement, overlay],
      onDismiss(reason) {
        setOpen(false);
        if (reason === 'escape') {
          rootElement.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
        }
      },
    });
    return () => controller.destroy();
  }, [open, overlay]);
  return (
    <div
      ref={root}
      className={classes('rc-popover', className)}
      data-open={open || undefined}
      data-align={align}
    >
      <span className="rc-popover__trigger" onClick={() => setOpen(!open)}>
        {trigger}
      </span>
      {open && (
        <AnchoredOverlay
          anchor={root}
          overlayRef={setOverlay}
          align={align}
          matchAnchorWidth={matchAnchorWidth}
          className={classes('rc-popover__content', className)}
        >
          {children}
        </AnchoredOverlay>
      )}
    </div>
  );
}

export type DropdownProps<Value extends string = string> = {
  label: ReactNode;
  options: ReadonlyArray<NavItem<Value>>;
  value?: Value;
  onChange: (value: Value) => void;
  className?: string;
  align?: 'start' | 'end';
};

export function Dropdown<Value extends string = string>({
  label,
  options,
  value,
  onChange,
  className,
  align = 'start',
}: DropdownProps<Value>) {
  const menuId = `rc-dropdown-${useId().replaceAll(':', '')}`;
  const rootRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    const menu = menuRef.current;
    if (!root || !menu) {
      return;
    }
    let dismissal: ReturnType<
      typeof createDismissibleOverlayController
    > | null = null;
    const update = (event: Event) => {
      const open = (event as Event & {newState?: string}).newState === 'open';
      dismissal?.destroy();
      dismissal = null;
      if (open) {
        menu.setAttribute('role', 'menu');
        dismissal = createDismissibleOverlayController({
          roots: [root, menu],
          onDismiss: () => menu.hidePopover(),
        });
      } else {
        menu.removeAttribute('role');
      }
    };
    menu.addEventListener('toggle', update);
    return () => {
      dismissal?.destroy();
      menu.removeEventListener('toggle', update);
    };
  }, []);
  return createElement(
    'ot-dropdown',
    {
      class: classes('rc-dropdown', className),
      'data-align': align,
      ref: (element: HTMLElement | null) => {
        rootRef.current = element;
      },
    },
    <>
      <button
        type="button"
        className="rc-dropdown__trigger"
        aria-haspopup="menu"
        aria-expanded="false"
        popoverTarget={menuId}
      >
        <span>{label}</span>
        <span className="rc-dropdown__chevron" aria-hidden="true">
          ⌄
        </span>
      </button>
      {createElement(
        'menu',
        {
          className: 'rc-popover__content rc-dropdown__menu',
          id: menuId,
          popover: 'auto',
          ref: (element: HTMLElement | null) => {
            menuRef.current = element;
          },
        },
        options.map(option => (
          <button
            key={option.value}
            type="button"
            role="menuitem"
            className="rc-dropdown__item"
            aria-current={value === option.value || undefined}
            disabled={option.disabled}
            onClick={event => {
              onChange(option.value);
              event.currentTarget
                .closest<HTMLElement>('[popover]')
                ?.hidePopover();
            }}
          >
            {option.icon}
            {option.label}
          </button>
        )),
      )}
    </>,
  );
}

export type SwitcherItem<Value extends string = string> = {
  value: Value;
  label: ReactNode;
  leading?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
};
export type SwitcherDropdownProps<Value extends string = string> = {
  items: ReadonlyArray<SwitcherItem<Value>>;
  value: Value;
  onChange: (value: Value) => void;
  onAction?: () => void;
  actionLabel?: ReactNode;
  groupLabel?: ReactNode;
  label?: string;
  className?: string;
};

export function SwitcherDropdown<Value extends string = string>({
  items,
  value,
  onChange,
  onAction,
  actionLabel,
  groupLabel = 'Options',
  label = 'Switcher',
  className,
}: SwitcherDropdownProps<Value>) {
  const [open, setOpen] = useState(false);
  const selected = items.find(item => item.value === value) ?? items[0];
  return (
    <Popover
      className={classes('rc-switcher-dropdown', className)}
      open={open}
      onOpenChange={setOpen}
      matchAnchorWidth
      trigger={
        <button
          type="button"
          className="rc-switcher-dropdown__trigger"
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {selected?.leading && (
            <span className="rc-switcher-dropdown__mark">
              {selected.leading}
            </span>
          )}
          <strong>{selected?.label}</strong>
          <span className="rc-switcher-dropdown__chevron" aria-hidden="true">
            ↕
          </span>
        </button>
      }
    >
      <div className="rc-switcher-dropdown__menu">
        <span className="rc-switcher-dropdown__label">{groupLabel}</span>
        <div role="listbox" aria-label={label}>
          {items.map(item => (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={item.value === value}
              disabled={item.disabled}
              onClick={() => {
                onChange(item.value);
                setOpen(false);
              }}
            >
              {item.leading && (
                <span className="rc-switcher-dropdown__mark">
                  {item.leading}
                </span>
              )}
              <strong>{item.label}</strong>
              {item.meta && <small>{item.meta}</small>}
            </button>
          ))}
        </div>
        {onAction && actionLabel && (
          <>
            <hr />
            <button
              type="button"
              className="rc-switcher-dropdown__action"
              onClick={() => {
                onAction();
                setOpen(false);
              }}
            >
              ＋ <span>{actionLabel}</span>
            </button>
          </>
        )}
      </div>
    </Popover>
  );
}

export type ComboboxOption = {
  value: string;
  label: ReactNode;
  text?: string;
  disabled?: boolean;
};
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled,
  emptyMessage = 'No options match.',
  className,
}: {
  label: string;
  options: ReadonlyArray<ComboboxOption>;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const inputId = `rc-combobox-${useId().replaceAll(':', '')}`;
  const listId = `${inputId}-listbox`;
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [active, setActive] = useState(0);
  const selected = options.find(option => option.value === value);
  const filtered = options.filter(option =>
    String(option.text ?? option.label)
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );
  useEffect(() => {
    if (!open) {
      return;
    }
    const outside = (event: MouseEvent) => {
      if (
        root.current &&
        !root.current.contains(event.target as Node) &&
        !overlay.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);
  const choose = (option: ComboboxOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setQuery('');
      setOpen(false);
    }
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const amount = event.key === 'ArrowDown' ? 1 : -1;
      setActive(current =>
        Math.max(0, Math.min(filtered.length - 1, current + amount)),
      );
    }
    if (event.key === 'Enter' && open && filtered[active]) {
      event.preventDefault();
      choose(filtered[active]);
    }
  };
  return (
    <div
      ref={root}
      className={classes('rc-combobox', className)}
      data-open={open || undefined}
    >
      <label className="rc-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="rc-combobox__control">
        <input
          id={inputId}
          className="rc-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            open && filtered[active]
              ? `${inputId}-${filtered[active].value}`
              : undefined
          }
          disabled={disabled}
          value={
            open ? query : selected ? (selected.text ?? selected.value) : query
          }
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={event => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={keyDown}
        />
        <button
          type="button"
          className="rc-combobox__trigger"
          aria-label="Toggle options"
          disabled={disabled}
          onClick={() => setOpen(next => !next)}
        >
          ⌄
        </button>
      </div>
      {open && (
        <AnchoredOverlay
          anchor={root}
          overlayRef={overlay}
          id={listId}
          role="listbox"
          aria-label={label}
          className="rc-combobox__listbox"
        >
          {filtered.length ? (
            filtered.map((option, index) => (
              <button
                key={option.value}
                id={`${inputId}-${option.value}`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                data-active={index === active || undefined}
                disabled={option.disabled}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                {option.label}
              </button>
            ))
          ) : (
            <p className="rc-combobox__empty">{emptyMessage}</p>
          )}
        </AnchoredOverlay>
      )}
    </div>
  );
}

export type SearchableDropdownOption<Value extends string = string> = {
  value: Value;
  label: ReactNode;
  text?: string;
  meta?: ReactNode;
  disabled?: boolean;
  prominent?: boolean;
};

export type SearchableDropdownProps<Value extends string = string> = {
  label: string;
  options: ReadonlyArray<SearchableDropdownOption<Value>>;
  value?: Value | null;
  onChange: (value: Value) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;
  supportingText?: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function SearchableDropdown<Value extends string = string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search options',
  emptyMessage = 'No options match.',
  supportingText,
  disabled,
  className,
}: SearchableDropdownProps<Value>) {
  const root = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const inputId = `rc-searchable-dropdown-${useId().replaceAll(':', '')}`;
  const listId = `${inputId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const selected = options.find(option => option.value === value);
  const optionText = (option: SearchableDropdownOption<Value>) =>
    option.text ?? String(option.label);
  const filtered = options.filter(option => {
    const searchable = `${optionText(option)} ${String(option.meta ?? '')}`;
    return searchable.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  });
  const close = () => {
    setOpen(false);
    setQuery('');
    setActive(0);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const outside = (event: MouseEvent) => {
      if (
        root.current &&
        !root.current.contains(event.target as Node) &&
        !overlay.current?.contains(event.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);

  const choose = (option: SearchableDropdownOption<Value>) => {
    if (!option.disabled) {
      onChange(option.value);
      close();
    }
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const amount = event.key === 'ArrowDown' ? 1 : -1;
      setActive(current =>
        Math.max(0, Math.min(filtered.length - 1, current + amount)),
      );
    }
    if (event.key === 'Enter' && open && filtered[active]) {
      event.preventDefault();
      choose(filtered[active]);
    }
  };

  return (
    <div
      ref={root}
      className={classes('rc-searchable-dropdown', className)}
      data-open={open || undefined}
    >
      <label className="rc-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="rc-searchable-dropdown__control">
        <input
          id={inputId}
          className="rc-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            open && filtered[active] ? `${inputId}-option-${active}` : undefined
          }
          disabled={disabled}
          value={open ? query : ''}
          placeholder={
            open
              ? searchPlaceholder
              : selected
                ? optionText(selected)
                : placeholder
          }
          onFocus={() => setOpen(true)}
          onChange={event => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={keyDown}
        />
        <button
          type="button"
          className="rc-searchable-dropdown__trigger"
          aria-label={`Toggle ${label} options`}
          aria-expanded={open}
          disabled={disabled}
          onClick={() => {
            if (open) {
              close();
            } else {
              setOpen(true);
              requestAnimationFrame(() =>
                root.current?.querySelector<HTMLInputElement>('input')?.focus(),
              );
            }
          }}
        >
          <span aria-hidden="true">⌄</span>
        </button>
      </div>
      {supportingText && (
        <small className="rc-searchable-dropdown__supporting-text">
          {supportingText}
        </small>
      )}
      {open && (
        <AnchoredOverlay
          anchor={root}
          overlayRef={overlay}
          id={listId}
          role="listbox"
          aria-label={label}
          className="rc-searchable-dropdown__listbox"
        >
          {filtered.length ? (
            filtered.map((option, index) => (
              <button
                key={option.value}
                id={`${inputId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                data-active={index === active || undefined}
                data-prominent={option.prominent || undefined}
                disabled={option.disabled}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.meta && <small>{option.meta}</small>}
              </button>
            ))
          ) : (
            <p className="rc-searchable-dropdown__empty">{emptyMessage}</p>
          )}
        </AnchoredOverlay>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  count,
  context,
  action,
  footer,
  plainHeader = false,
  children,
  className,
}: {
  title: ReactNode;
  count?: ReactNode;
  context?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  plainHeader?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={classes('rc-card', className)}>
      <header
        className="rc-card__header"
        data-variant={plainHeader ? 'plain' : undefined}
      >
        <h2>{title}</h2>
        {count && <span className="rc-count">{count}</span>}
        {context && <p>{context}</p>}
        {action && <span className="rc-card__meta">{action}</span>}
      </header>
      {children}
      {footer && <footer className="rc-card__footer">{footer}</footer>}
    </section>
  );
}

export function NumberedStep({
  number,
  title,
  description,
  action,
  children,
  className,
}: {
  number: number | string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={classes('rc-numbered-step', className)}>
      <span className="rc-numbered-step__number" aria-hidden="true">
        {number}
      </span>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {children}
        {action && <div className="rc-numbered-step__action">{action}</div>}
      </div>
    </section>
  );
}

export type HoverNavigationItem = NavItem & {description?: ReactNode};
export function HoverNavigation({
  label,
  items,
  className,
}: {
  label: ReactNode;
  items: ReadonlyArray<HoverNavigationItem>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) {
      return;
    }
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  return (
    <div
      className={classes('rc-hover-navigation', className)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(next => !next)}
      >
        {label}
      </button>
      {open && (
        <div role="menu" className="rc-hover-navigation__panel">
          {items.map(item =>
            item.href ? (
              <a
                key={item.value}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <strong>{item.label}</strong>
                {item.description && <small>{item.description}</small>}
              </a>
            ) : (
              <button
                key={item.value}
                type="button"
                role="menuitem"
                disabled={item.disabled}
              >
                <strong>{item.label}</strong>
                {item.description && <small>{item.description}</small>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function ProfileMenu({
  initials,
  name,
  detail,
  children,
  className,
}: {
  initials: ReactNode;
  name: ReactNode;
  detail?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Popover
      className={classes('rc-profile-menu', className)}
      align="end"
      trigger={
        <button
          type="button"
          className="rc-profile-menu__trigger"
          aria-label="Open profile menu"
        >
          <span>{initials}</span>
          <strong>{name}</strong>
          <span className="rc-profile-menu__chevron" aria-hidden="true">
            <Icon name="chevronDown" />
          </span>
        </button>
      }
    >
      <div className="rc-profile-menu__identity">
        <strong>{name}</strong>
        {detail && <small>{detail}</small>}
      </div>
      <div className="rc-profile-menu__actions">{children}</div>
    </Popover>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  width,
  size,
  minBodyHeight,
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  width?: CSSProperties['inlineSize'];
  size?: 'sm' | 'md';
  minBodyHeight?: CSSProperties['minHeight'];
  bodyClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = `rc-dialog-${useId().replaceAll(':', '')}`;
  const close = () => {
    onClose();
    requestAnimationFrame(() => previousFocus.current?.focus());
  };
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      previousFocus.current = document.activeElement as HTMLElement;
      dialog.showModal();
      const focusable = dialog.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }
    if (!open && dialog.open) {
      dialog.close();
      previousFocus.current?.focus();
    }
    if (!open) {
      return;
    }
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [open]);
  const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') {
      return;
    }
    const nodes = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ];
    if (!nodes.length) {
      return;
    }
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return (
    <dialog
      ref={ref}
      className={classes('rc-dialog', className)}
      data-size={size}
      style={
        {
          '--_dialog-inline-size': width,
          '--_dialog-body-min-block-size': minBodyHeight,
        } as CSSProperties
      }
      aria-labelledby={titleId}
      onKeyDown={trapFocus}
      onClick={event => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
      onCancel={event => {
        event.preventDefault();
        close();
      }}
    >
      <header className="rc-dialog__header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button
          type="button"
          className="rc-dialog__close"
          onClick={close}
          aria-label="Close dialog"
        >
          ×
        </button>
      </header>
      <div className={classes('rc-dialog__body', bodyClassName)}>
        {children}
      </div>
      {footer && <footer className="rc-dialog__footer">{footer}</footer>}
    </dialog>
  );
}

export function Tooltip({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <span className="rc-tooltip">
      <span aria-describedby={id}>{children}</span>
      <span id={id} role="tooltip" className="rc-tooltip__content">
        {label}
      </span>
    </span>
  );
}

export function Chip({
  selected,
  variant = 'default',
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  variant?: 'default' | 'add';
}) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      className={classes(
        'rc-chip',
        variant === 'add' && 'rc-chip--add',
        className,
      )}
      data-chip
      data-active={selected || undefined}
      aria-pressed={selected}
    >
      {children}
    </button>
  );
}

export function ChoiceRow({
  type = 'radio',
  checked,
  onChange,
  name,
  value,
  disabled,
  title,
  description,
  code,
  trailing,
  children,
  className,
}: {
  type?: 'radio' | 'checkbox';
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  value?: string;
  disabled?: boolean;
  title: ReactNode;
  description?: ReactNode;
  code?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={classes('rc-choice-row', className)}
      data-opt
      data-active={checked || undefined}
      data-disabled={disabled || undefined}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={event => onChange(event.target.checked)}
      />
      {code ? (
        <span className="rc-choice-row__code">{code}</span>
      ) : (
        <span className="rc-choice-row__box" data-box aria-hidden="true" />
      )}
      <span className="rc-choice-row__content">
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      {children}
      {trailing && <span className="rc-choice-row__trailing">{trailing}</span>}
    </label>
  );
}

export function StatusIndicator({
  tone = 'neutral',
  chip = false,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone;
  chip?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      {...props}
      className={classes('rc-status', `rc-status--${tone}`, className)}
      data-variant={chip ? 'chip' : undefined}
    >
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

export function ListPanel({
  title,
  count,
  action,
  children,
  className,
}: {
  title: ReactNode;
  count?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SectionCard
      title={title}
      count={count}
      action={action}
      className={className}
    >
      {children}
    </SectionCard>
  );
}

export type DataGridColumn<T> = {
  key: string;
  label: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'start' | 'end';
};
export function DataGrid<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  empty,
  className,
  minInlineSize = '42rem',
}: {
  columns: ReadonlyArray<DataGridColumn<T>>;
  rows: ReadonlyArray<T>;
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  className?: string;
  minInlineSize?: string;
}) {
  const style = {
    '--rc-table-columns': `repeat(${columns.length}, minmax(0, 1fr))`,
    '--rc-table-min-inline-size': minInlineSize,
  } as CSSProperties;
  return (
    <div className={classes('rc-table', className)} role="table" style={style}>
      <div className="rc-table__header" role="row">
        {columns.map(column => (
          <span key={column.key} role="columnheader" data-align={column.align}>
            {column.label}
          </span>
        ))}
      </div>
      {rows.length ? (
        rows.map((row, index) => (
          <div
            key={getRowKey(row, index)}
            className="rc-table__row"
            role="row"
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() => onRowClick?.(row)}
            onKeyDown={event => {
              if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onRowClick(row);
              }
            }}
          >
            {columns.map(column => (
              <span key={column.key} role="cell" data-align={column.align}>
                {column.render(row)}
              </span>
            ))}
          </div>
        ))
      ) : (
        <div className="rc-table__empty">{empty ?? 'No results.'}</div>
      )}
    </div>
  );
}

export function Pagination({
  range,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
}: {
  range: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <nav className="rc-pagination" aria-label="Pagination">
      <span>{range}</span>
      <Button
        variant="secondary"
        onClick={onPrevious}
        disabled={previousDisabled}
      >
        Previous
      </Button>
      <Button variant="secondary" onClick={onNext} disabled={nextDisabled}>
        Next
      </Button>
    </nav>
  );
}

export function useCopy({clearAfter = 4000} = {}) {
  const [, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );
  return async (text: string) => {
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setCopied(false), clearAfter);
    return true;
  };
}

export function CodeBlock({
  code,
  label,
  language,
  onCopy,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
  copied = false,
  className,
}: {
  code: string;
  label?: ReactNode;
  language?: string;
  onCopy?: () => void;
  copyLabel?: string;
  copiedLabel?: string;
  copied?: boolean;
  className?: string;
}) {
  return (
    <div className={classes('rc-code-block', className)}>
      {label && <span className="rc-label">{label}</span>}
      <pre className="rc-code">
        <code data-language={language}>{code}</code>
      </pre>
      {onCopy && (
        <Button
          variant="secondary"
          className="rc-code-block__copy"
          onClick={onCopy}
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
      )}
    </div>
  );
}

export function LinearProgress({
  value,
  label,
  valueLabel,
  note,
  tone,
  className,
}: {
  value: number;
  label?: ReactNode;
  valueLabel?: ReactNode;
  note?: ReactNode;
  tone?: 'warning' | 'danger';
  className?: string;
}) {
  const percent = Math.max(0, Math.min(100, value));
  const labelId = `rc-progress-${useId().replaceAll(':', '')}`;
  return (
    <div className={classes('rc-progress-wrap', className)}>
      {label && (
        <span id={labelId}>
          <span>{label}</span>
          {valueLabel && <span>{valueLabel}</span>}
        </span>
      )}
      <div
        className="rc-progress"
        role="progressbar"
        aria-label={label ? undefined : 'Progress'}
        aria-labelledby={label ? labelId : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        data-tone={tone}
        style={{'--rc-progress-value': `${percent}%`} as CSSProperties}
      >
        <span />
      </div>
      {note && <small>{note}</small>}
    </div>
  );
}

export function Progress(props: Parameters<typeof LinearProgress>[0]) {
  return <LinearProgress {...props} />;
}

export function CircularProgress({
  value,
  label,
  sublabel,
  size,
  tone,
  className,
}: {
  value: number;
  label?: ReactNode;
  sublabel?: ReactNode;
  size?: number;
  tone?: 'warning' | 'danger';
  className?: string;
}) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div
      className={classes('rc-circular-progress', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={typeof label === 'string' ? label : undefined}
      data-tone={tone}
      style={
        {
          '--_progress-value-number': percent,
          '--_circular-progress-size': size ? `${size}px` : undefined,
        } as CSSProperties
      }
    >
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle
          className="rc-circular-progress__track"
          cx="22"
          cy="22"
          r="19"
        />
        <circle
          className="rc-circular-progress__value"
          cx="22"
          cy="22"
          r="19"
          pathLength="100"
        />
      </svg>
      <span>
        {label ?? `${percent}%`}
        {sublabel && <small>{sublabel}</small>}
      </span>
    </div>
  );
}

export function Skeleton({
  variant = 'line',
  lines = 1,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: 'line' | 'title' | 'tile' | 'table-row';
  lines?: number;
}) {
  return (
    <div
      {...props}
      className={classes('rc-skeleton', `rc-skeleton--${variant}`, className)}
      aria-hidden="true"
    >
      {Array.from({length: lines}, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

export function ExpansionTile({
  title,
  summary,
  trail,
  children,
  open,
  onOpenChange,
  className,
}: {
  title: ReactNode;
  summary?: ReactNode;
  trail?: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  return (
    <details
      className={classes('rc-expansion', className)}
      open={open}
      onToggle={event =>
        onOpenChange?.((event.currentTarget as HTMLDetailsElement).open)
      }
    >
      <summary>
        <span>
          <strong>{title}</strong>
          {summary && <small>{summary}</small>}
        </span>
        {trail && <span className="rc-expansion__trail">{trail}</span>}
      </summary>
      <div className="rc-expansion__body">{children}</div>
    </details>
  );
}

export function EmptyState({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={classes('rc-empty-state', className)}>
      <p>{children}</p>
      {action}
    </section>
  );
}

export function BlockingWarning({
  title,
  children,
  action,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <aside className={classes('rc-blocking-warning', className)} role="alert">
      <Icon name="warning" className="rc-blocking-warning__icon" />
      <div className="rc-blocking-warning__body">
        <strong>{title}</strong>
        <span>{children}</span>
      </div>
      {action && <div className="rc-blocking-warning__action">{action}</div>}
    </aside>
  );
}

export function Hint({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <aside className={classes('rc-hint', className)}>
      <Icon name="sparkle" />
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
    </aside>
  );
}

export function InlineFeedback({
  tone,
  children,
  onDismiss,
  action,
  className,
}: {
  tone: 'success' | 'error';
  children: ReactNode;
  onDismiss?: () => void;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classes('rc-feedback', `rc-feedback--${tone}`, className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span>{children}</span>
      {action}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss feedback">
          ×
        </button>
      )}
    </div>
  );
}

export type TimelineEvent = {
  id: string;
  at: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  tone?: 'success' | 'error' | 'neutral' | 'muted';
  phase?: ReactNode;
  ordinal?: ReactNode;
  details?: ReactNode;
};
export function EventTimeline({
  events,
  openId,
  onOpenChange,
  className,
}: {
  events: ReadonlyArray<TimelineEvent>;
  openId?: string | null;
  onOpenChange?: (id: string | null) => void;
  className?: string;
}) {
  return (
    <ol className={classes('rc-event-timeline', className)}>
      {events.map(event => {
        const row = (
          <>
            <time>{event.at}</time>
            <span className="rc-event-timeline__body">
              <span className="rc-event-timeline__head">
                <strong>{event.title}</strong>
                {event.phase && <span>{event.phase}</span>}
                {event.ordinal && <span>{event.ordinal}</span>}
              </span>
              {event.description && <small>{event.description}</small>}
            </span>
          </>
        );
        return (
          <li key={event.id} data-tone={event.tone ?? 'neutral'}>
            {event.details ? (
              <details
                open={openId === event.id}
                onToggle={toggle => {
                  const open = toggle.currentTarget.open;
                  if (open !== (openId === event.id)) {
                    onOpenChange?.(open ? event.id : null);
                  }
                }}
              >
                <summary className="rc-event-timeline__row">{row}</summary>
                <pre className="rc-event-timeline__details" tabIndex={0}>
                  {event.details}
                </pre>
              </details>
            ) : (
              <div className="rc-event-timeline__row">{row}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressTicks({
  steps,
  current,
  onStepChange,
  className,
}: {
  steps: ReadonlyArray<{label: string}>;
  current: number;
  onStepChange?: (index: number) => void;
  className?: string;
}) {
  return (
    <ol
      className={classes('rc-progress-ticks', className)}
      aria-label="Progress"
    >
      {steps.map((step, index) => (
        <li
          key={step.label}
          data-active={index === current || undefined}
          data-done={index < current || undefined}
        >
          <button
            type="button"
            onClick={() => onStepChange?.(index)}
            disabled={!onStepChange}
            aria-current={index === current ? 'step' : undefined}
            aria-label={`${step.label}, step ${index + 1} of ${steps.length}`}
          />
        </li>
      ))}
    </ol>
  );
}

export type FlowShellProps = {
  steps: ReadonlyArray<{label: string}>;
  current: number;
  onStepChange?: (index: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: ReactNode;
  nextLabel?: ReactNode;
  hint?: ReactNode;
  headerStart?: ReactNode;
  headerEnd?: ReactNode;
  footerStart?: ReactNode;
  footerEnd?: ReactNode;
  children: ReactNode;
  className?: string;
};
export function FlowShell({
  steps,
  current,
  onStepChange,
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel = 'Continue',
  hint,
  headerStart,
  headerEnd,
  footerStart,
  footerEnd,
  children,
  className,
}: FlowShellProps) {
  return (
    <div className={classes('rc-flow-shell', 'rc-contributor-flow', className)}>
      <header className="rc-flow-shell__header rc-contributor-flow__header">
        {headerStart}
        <ProgressTicks
          steps={steps}
          current={current}
          onStepChange={onStepChange}
        />
        {headerEnd ?? (
          <span>
            {String(current + 1).padStart(2, '0')} /{' '}
            {String(steps.length).padStart(2, '0')}
          </span>
        )}
      </header>
      <main className="rc-flow-shell__main rc-contributor-flow__main">
        {children}
      </main>
      <footer className="rc-flow-shell__footer rc-contributor-flow__footer">
        {footerStart}
        <Button variant="secondary" onClick={onBack} disabled={!onBack}>
          {backLabel}
        </Button>
        {hint && <span>{hint}</span>}
        <Button onClick={onNext} disabled={!onNext}>
          {nextLabel}
        </Button>
        {footerEnd}
      </footer>
    </div>
  );
}

/** @deprecated Use the domain-neutral FlowShell name. */
export const ContributorFlowShell = FlowShell;

export function Wordmark({className}: {className?: string}) {
  return (
    <span
      className={classes('rc-wordmark', className)}
      role="img"
      aria-label="Reclaim"
    />
  );
}

export function SearchBar({
  count,
  size,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  count?: ReactNode;
  size?: 'lg';
}) {
  return (
    <label className={classes('rc-search', className)} data-size={size}>
      <Icon name="search" />
      <input {...props} type={props.type ?? 'search'} />
      {count && <span className="rc-search__count">{count}</span>}
    </label>
  );
}

export function InputGroup({
  caption,
  accent = false,
  children,
  className,
}: {
  caption?: ReactNode;
  accent?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classes('rc-input-group', className)}
      data-tone={accent ? 'accent' : undefined}
    >
      {caption && <span className="rc-input-group__caption">{caption}</span>}
      {children}
    </div>
  );
}

export function FieldGrid({
  rows,
  className,
}: {
  rows: ReadonlyArray<{
    id: string;
    label: ReactNode;
    control: ReactNode;
    hint?: ReactNode;
  }>;
  className?: string;
}) {
  return (
    <div className={classes('rc-field-grid', className)}>
      {rows.flatMap(row => [
        <label
          key={`${row.id}-label`}
          className="rc-field__label"
          htmlFor={row.id}
        >
          {row.label}
        </label>,
        <div key={row.id}>
          {row.control}
          {row.hint && <span className="rc-field__hint">{row.hint}</span>}
        </div>,
      ])}
    </div>
  );
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  activeKey,
  caption,
  className,
}: {
  columns: ReadonlyArray<DataGridColumn<T>>;
  rows: ReadonlyArray<T>;
  getRowKey: (row: T, index: number) => string;
  activeKey?: string;
  caption?: string;
  className?: string;
}) {
  return (
    <div className="rc-table-scroll">
      <table className={classes('rc-table', className)}>
        {caption && <caption className="rc-visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} scope="col" data-align={column.align}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const key = getRowKey(row, index);
            return (
              <tr key={key} aria-selected={key === activeKey || undefined}>
                {columns.map(column => (
                  <td key={column.key} data-align={column.align}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PoolCard({
  label,
  overage,
  used,
  limit,
  value,
  tone,
  note,
}: {
  label: ReactNode;
  overage?: ReactNode;
  used: ReactNode;
  limit: ReactNode;
  value: number;
  tone?: 'warning' | 'danger';
  note?: ReactNode;
}) {
  return (
    <article className="rc-pool">
      <header className="rc-pool__header">
        <span>{label}</span>
        {overage && <small>{overage}</small>}
      </header>
      <p className="rc-pool__figure">
        {used} <small>of {limit}</small>
      </p>
      <LinearProgress value={value} tone={tone} />
      {note && <p className="rc-pool__note">{note}</p>}
    </article>
  );
}

export function PlanCard({
  badge,
  name,
  amount,
  period,
  tagline,
  features,
  current = false,
  featured = false,
  action,
}: {
  badge?: ReactNode;
  name: ReactNode;
  amount: ReactNode;
  period?: ReactNode;
  tagline?: ReactNode;
  features: ReadonlyArray<ReactNode>;
  current?: boolean;
  featured?: boolean;
  action: ReactNode;
}) {
  return (
    <article
      className="rc-plan"
      data-tile
      data-current={current || undefined}
      data-featured={featured || undefined}
    >
      {badge && <span className="rc-plan__badge">{badge}</span>}
      <div>
        <h3 className="rc-plan__name">{name}</h3>
        <p className="rc-plan__price">
          <strong>{amount}</strong>
          {period && <small>{period}</small>}
        </p>
        {tagline && <p className="rc-plan__tagline">{tagline}</p>}
      </div>
      <ul className="rc-plan__features">
        {features.map((feature, index) => (
          <li key={index}>
            <Icon name="check" />
            {feature}
          </li>
        ))}
      </ul>
      <div className="rc-plan__cta">{action}</div>
    </article>
  );
}

export function ChartFrame({
  title,
  meta,
  kind,
  children,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  kind?: 'area' | 'funnel';
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={classes('rc-chart-frame', className)} data-tile>
      <header className="rc-chart-frame__header">
        <h3>{title}</h3>
        {meta && <span>{meta}</span>}
      </header>
      <div className="rc-chart-frame__body" data-kind={kind}>
        {children}
      </div>
    </section>
  );
}

export function PersonRow({
  initials,
  name,
  detail,
  tone,
  href,
}: {
  initials: ReactNode;
  name: ReactNode;
  detail?: ReactNode;
  tone?: 'outline' | 'pending';
  href?: string;
}) {
  const content = (
    <>
      <Avatar initials={initials} tone={tone} />
      <span>
        {name}
        {detail && <small>{detail}</small>}
      </span>
    </>
  );
  return href ? (
    <a className="rc-person" href={href}>
      {content}
    </a>
  ) : (
    <div className="rc-person">{content}</div>
  );
}
