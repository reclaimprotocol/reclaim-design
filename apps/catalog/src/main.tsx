import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {createRoot} from 'react-dom/client';
import {
  AreaChart,
  BarChart,
  DonutChart,
  FunnelChart,
  LineChart,
  ScatterChart,
  type ChartDatum,
} from './charts';
import {
  createCopyController,
  createGlowController,
  createGuillocheController,
} from '@reclaimprotocol/design/behaviors';
import {
  defineReclaimElements,
  periodBetween,
  type PeriodOption,
  type LocalAssetChangeDetail,
  type ReclaimImageEditor,
  type ReclaimLocalAssetField,
  type ReclaimPeriodPicker,
  type PeriodChangeDetail,
} from '@reclaimprotocol/design/elements';
import {
  Alert,
  AppBar,
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  ChoiceRow,
  CircularProgress,
  ColorField,
  Combobox,
  Dialog,
  Dropdown,
  ExpansionTile,
  Field,
  FilterRow,
  FilterToolbar,
  FlowShell,
  InputGroup,
  HoverNavigation,
  Icon,
  Kpi,
  LinearProgress,
  MenuSheet,
  MetadataList,
  Meter,
  NavigationPane,
  PageHeader,
  PickerField,
  ProfileMenu,
  RangeField,
  ReclaimThemeProvider,
  SearchableDropdown,
  SegmentedControl,
  SelectionDialog,
  StatusPill,
  Switch,
  SwitcherDropdown,
  TagInput,
  ToastRegion,
  Tooltip,
  UploadField,
  Wordmark,
  UploadResult,
  useReclaimTheme,
  type ToastMessage,
} from './design-components';
import '@reclaimprotocol/design/tokens.css';
import '@reclaimprotocol/design/css';
import '@reclaimprotocol/design/oat';
import './catalog.css';
import {PanelTitle, Section, sectionId} from './catalog-section';
import {ConsolePatterns} from './console-patterns';
import {SitePatterns} from './site-patterns';

const rMark = new URL('../../../assets/brand/r-mark-tile.png', import.meta.url)
  .href;
const wordmark = new URL(
  '../../../assets/brand/wordmark-reclaim-text.svg',
  import.meta.url,
).href;
const noise = new URL('../../../assets/brand/noise.svg', import.meta.url).href;
const catalogNavigation = [
  {
    label: 'Foundations',
    items: ['Surface', 'Card types', 'Interactive cards'],
  },
  {
    label: 'Components',
    items: [
      'Buttons and status',
      'Fields and validation',
      'Selection',
      'Foundation primitives',
      'Selections in dialogs',
      'Searchable dropdown',
      'Menus, search and dates',
      'Navigation overlays',
      'Switcher dropdown',
      'Navigation pane',
      'App bar and page header',
      'Settings and metadata',
      'Guided flow',
    ],
  },
  {
    label: 'Patterns',
    items: [
      'Data display',
      'Loading and feedback',
      'Expansion',
      'Product shell',
      'Page layout',
      'Tables and cards',
      'Usage and plans',
      'Activity and people',
      'Popovers and copy',
      'Site pages',
      'Website cards',
      'Server rendered charts',
      'Dialog forms and toasts',
      'Icons',
    ],
  },
  {label: 'Charts', items: ['Chart fixtures']},
] as const;
const catalogSections = catalogNavigation.flatMap(group => group.items);
type CatalogSection = (typeof catalogSections)[number];
const volume: ChartDatum[] = [
  ['05 Sep', 42, 10],
  ['06 Sep', 63, 12],
  ['07 Sep', 51, 9],
  ['08 Sep', 77, 11],
  ['09 Sep', 68, 7],
  ['10 Sep', 88, 13],
  ['11 Sep', 74, 8],
].map(([label, value, secondary]) => ({
  label: String(label),
  value: Number(value),
  secondary: Number(secondary),
}));
const completion: ChartDatum[] = [
  ['05 Sep', 73],
  ['06 Sep', 76],
  ['07 Sep', 75],
  ['08 Sep', 82],
  ['09 Sep', 81],
  ['10 Sep', 88],
  ['11 Sep', 91],
].map(([label, value]) => ({label: String(label), value: Number(value)}));
const funnel: ChartDatum[] = [
  ['Session created', 132180, '132,180'],
  ['Signed in', 107594, '107,594'],
  ['Provider loaded', 96520, '96,520'],
  ['Proof produced', 96388, '96,388'],
].map(([label, value, display]) => ({
  label: String(label),
  value: Number(value),
  display: String(display),
}));
const distribution: ChartDatum[] = [
  {label: 'Completed', value: 72, display: '72%'},
  {label: 'In progress', value: 18, display: '18%'},
  {label: 'Failed', value: 7, display: '7%'},
  {label: 'Expired', value: 3, display: '3%'},
];
const correlation: ChartDatum[] = [
  {label: 'Alpha', secondary: 12, value: 42},
  {label: 'Bravo', secondary: 28, value: 68},
  {label: 'Charlie', secondary: 38, value: 54},
  {label: 'Delta', secondary: 51, value: 88},
  {label: 'Echo', secondary: 68, value: 74},
  {label: 'Foxtrot', secondary: 82, value: 96},
];
const flow = [
  {label: 'Input', description: 'Choose the source'},
  {label: 'Configure', description: 'Set the options'},
  {label: 'Review', description: 'Check the result'},
  {label: 'Test', description: 'Run validation'},
  {label: 'Finish', description: 'Complete the workflow'},
] as const;
const organizations = [
  {value: 'acme', label: 'Acme Identity', leading: 'A', meta: 'owner'},
  {value: 'northwind', label: 'Northwind Labs', leading: 'N', meta: 'member'},
  {value: 'personal', label: 'Syed (personal)', leading: 'S', meta: 'owner'},
] as const;
const workspaces = [
  {value: 'product', label: 'Product workspace', leading: 'P', meta: 'active'},
  {value: 'sandbox', label: 'Client sandbox', leading: 'S', meta: 'test'},
  {value: 'personal', label: 'Personal workspace', leading: 'Y'},
] as const;
const assetOptions = [
  {
    value: 'mark',
    label: 'Square mark',
    description: 'Compact product and application treatment.',
    preview: <img src={rMark} alt="" />,
  },
  {
    value: 'wordmark',
    label: 'Wordmark',
    description: 'Full-width editorial treatment.',
    preview: <img src={wordmark} alt="" />,
  },
  {
    value: 'monogram',
    label: 'Text monogram',
    description: 'A neutral fallback when imagery is unavailable.',
    preview: <strong aria-hidden="true">R</strong>,
  },
] as const;
const hourlyPeriodOptions: readonly PeriodOption[] = [
  {label: 'Last 1 hour', hours: 1},
  {label: 'Last 3 hours', hours: 3},
  {
    label: 'Last 12 hours',
    getRange: now =>
      periodBetween(new Date(now.getTime() - 12 * 3_600_000), now),
  },
];

function Guilloche() {
  return (
    <div
      className="catalog-guilloche"
      data-reclaim-guilloche
      data-position="page"
      aria-hidden="true"
    />
  );
}

function BrandHeader({
  activeSection,
  onNavigate,
}: {
  activeSection: CatalogSection;
  onNavigate: (section: CatalogSection) => void;
}) {
  const {resolvedTheme, setTheme} = useReclaimTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <header className="catalog-topbar">
        <div className="catalog-brand">
          <img src={rMark} alt="Reclaim" />
          <Wordmark />
        </div>
        <div className="catalog-topbar__actions">
          <span className="catalog-env">SANDBOX</span>
          <button
            className="catalog-menu-trigger"
            data-testid="catalog-menu-trigger"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(value => !value)}
          >
            Menu
          </button>
          <Button
            data-testid="catalog-theme-toggle"
            variant="secondary"
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
          >
            {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
        </div>
      </header>
      <aside className="catalog-sidebar" aria-label="Catalog navigation">
        <p className="rc-eyebrow">Design reference</p>
        <nav className="catalog-sidebar__nav">
          {catalogNavigation.map(group => (
            <div className="catalog-nav-group" key={group.label}>
              <span className="catalog-nav-group__label">{group.label}</span>
              {group.items.map(item => (
                <a
                  key={item}
                  className="catalog-nav"
                  href={`#${sectionId(item)}`}
                  aria-current={activeSection === item ? 'location' : undefined}
                  onClick={() => onNavigate(item)}
                >
                  {item}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="catalog-sidebar__foot">
          <span className="rc-muted">Deterministic fixtures</span>
          <span>v0.1</span>
        </div>
      </aside>
      <nav className="catalog-tabs" aria-label="Catalog sections">
        {catalogSections.map(item => (
          <a
            key={item}
            href={`#${sectionId(item)}`}
            aria-current={activeSection === item ? 'location' : undefined}
            onClick={() => onNavigate(item)}
          >
            {item}
          </a>
        ))}
      </nav>
      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        label="Catalog menu"
        className="catalog-menu-sheet"
      >
        {catalogNavigation.map(group => (
          <div className="catalog-menu-group" key={group.label}>
            <span>{group.label}</span>
            {group.items.map(item => (
              <a
                key={item}
                href={`#${sectionId(item)}`}
                aria-current={activeSection === item ? 'location' : undefined}
                onClick={() => {
                  onNavigate(item);
                  setMenuOpen(false);
                }}
              >
                {item}
              </a>
            ))}
          </div>
        ))}
      </MenuSheet>
    </>
  );
}

function Overview() {
  return (
    <>
      <Section eyebrow="01" title="Surface">
        <div className="catalog-surface-demo">
          <div className="catalog-surface-demo__content">
            <p className="rc-eyebrow">Three layers</p>
            <h3>Colour, grain, and guilloche</h3>
            <p>
              Panels stay opaque. The viewport-centred pattern remains pinned
              behind the page.
            </p>
            <div className="catalog-row">
              <img src={rMark} alt="" className="catalog-mark" />
              <Wordmark />
            </div>
          </div>
        </div>
      </Section>
      <Section eyebrow="02" title="Card types">
        <div className="catalog-grid catalog-grid--four">
          <Kpi
            label="Proofs verified"
            value="128,441"
            delta="+12.4% vs previous"
          />
          <Kpi label="Completion rate" value="97.2%" delta="+0.6 pts" />
          <Kpi label="Active providers" value="42" delta="3 degraded" />
          <Kpi label="Median duration" value="4.8 s" delta="−0.4 s" />
        </div>
        <div className="catalog-console-grid">
          <Card interactive className="catalog-chart-card">
            <PanelTitle title="Verification volume" meta="Last 7 days" />
            <BarChart data={volume} />
          </Card>
          <Card interactive className="catalog-chart-card">
            <PanelTitle title="Session funnel" meta="All providers" />
            <FunnelChart data={funnel} />
          </Card>
        </div>
      </Section>
      <Section eyebrow="03" title="Interactive cards">
        <div className="catalog-grid catalog-grid--three">
          <Card interactive data-testid="catalog-glass-card">
            <PanelTitle
              title="Glass card"
              meta="Cursor-tracked glow and peeled backing"
            />
            <p className="rc-lede">Hover and press this card.</p>
          </Card>
          <article
            className="rc-kpi catalog-tile"
            data-tile
            data-testid="catalog-tile"
          >
            <span className="rc-kpi__label">Reporting tile</span>
            <strong className="rc-kpi__value">99.4%</strong>
            <span className="rc-kpi__delta">Glow only. No lift.</span>
          </article>
          <Card className="rc-card--spec">
            <PanelTitle title="Empty state" meta="Dashed spec boundary" />
            <p className="rc-lede">No callbacks are registered.</p>
            <Button variant="inline">Add callback</Button>
          </Card>
        </div>
      </Section>
    </>
  );
}

function OatTabsExample() {
  return createElement(
    'ot-tabs',
    {className: 'rc-tabs'},
    <div role="tablist" aria-label="Provider detail">
      <button role="tab" type="button" aria-selected="true">
        States
      </button>
      <button role="tab" type="button">
        Usage
      </button>
      <button role="tab" type="button">
        Tokens
      </button>
    </div>,
    <div role="tabpanel">
      <p>Default, hover, focus, pressed, busy, disabled, and error.</p>
    </div>,
    <div role="tabpanel">
      <p>Use semantic HTML first; enhance only the state machine.</p>
    </div>,
    <div role="tabpanel">
      <p>
        Reclaim tokens override the vendored foundation through cascade layers.
      </p>
    </div>,
  );
}

function AssetElementsExample() {
  const assetRef = useRef<ReclaimLocalAssetField | null>(null);
  const editorRef = useRef<ReclaimImageEditor | null>(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const asset = assetRef.current;
    if (!asset) {
      return;
    }
    asset.prepare = async (_file, signal) => {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(resolve, 250);
        signal.addEventListener('abort', () => {
          window.clearTimeout(timeout);
          reject(new DOMException('Preparation stopped.', 'AbortError'));
        });
      });
      return {description: 'Validated locally and ready to edit'};
    };
    const change = (event: Event) => {
      const detail = (event as CustomEvent<LocalAssetChangeDetail>).detail;
      setPreview(detail.url);
      if (editorRef.current) {
        editorRef.current.source = detail.url;
      }
    };
    asset.addEventListener('reclaim:assetchange', change);
    return () => asset.removeEventListener('reclaim:assetchange', change);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    const apply = (event: Event) => {
      setPreview((event as CustomEvent<{dataUrl: string}>).detail.dataUrl);
    };
    editor.addEventListener('reclaim:imageapply', apply);
    return () => editor.removeEventListener('reclaim:imageapply', apply);
  }, []);

  return (
    <div className="catalog-stack">
      {createElement(
        'rc-local-asset-field',
        {
          ref: assetRef,
          accept: 'image/png,image/jpeg,image/webp',
          'max-size': '5000000',
        },
        <label className="rc-upload">
          <strong>Local campaign image</strong>
          <span>PNG, JPG, or WebP up to 5 MB.</span>
          <input type="file" />
        </label>,
        <div className="rc-upload-result" data-asset-result hidden />,
      )}
      <div className="catalog-row">
        <Button
          variant="secondary"
          disabled={!preview}
          onClick={() => void editorRef.current?.open()}
        >
          Edit selected image
        </Button>
        <Button
          variant="secondary"
          disabled={!preview}
          onClick={() => {
            assetRef.current?.clear();
            setPreview('');
          }}
        >
          Clear
        </Button>
        {preview && (
          <img className="catalog-asset-preview" src={preview} alt="" />
        )}
      </div>
      {createElement('rc-image-editor', {
        ref: editorRef,
        'aspect-ratio': '1',
        'output-width': '800',
      })}
    </div>
  );
}

function Components() {
  const [segment, setSegment] = useState('week');
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState('review');
  const [showError, setShowError] = useState(false);
  const [dialog, setDialog] = useState<'tags' | 'region' | 'confirm' | null>(
    null,
  );
  const [tags, setTags] = useState(['gig work']);
  const [region, setRegion] = useState('Australia');
  const [provider, setProvider] = useState<string | null>('chase');
  const [scope, setScope] = useState('all');
  const [sort, setSort] = useState('recent');
  const periodPickerRef = useRef<ReclaimPeriodPicker>(null);
  const [periodRange, setPeriodRange] = useState<PeriodChangeDetail | null>(
    null,
  );
  const [disableCustomPeriod, setDisableCustomPeriod] = useState(false);
  const [hourlyPeriod, setHourlyPeriod] = useState(false);
  const [periodFontSize, setPeriodFontSize] = useState(12);
  const [periodPadding, setPeriodPadding] = useState(8);
  const [periodBorderGap, setPeriodBorderGap] = useState(0);
  useEffect(() => {
    const picker = periodPickerRef.current;
    if (!picker) {
      return;
    }
    const update = (event: CustomEvent<PeriodChangeDetail>) =>
      setPeriodRange(event.detail);
    picker.addEventListener('reclaim:periodchange', update);
    const initial = picker.range;
    setPeriodRange({
      ...initial,
      label: 'Last 7 days',
      days: 7,
      hours: null,
      custom: false,
    });
    return () => picker.removeEventListener('reclaim:periodchange', update);
  }, []);
  useEffect(() => {
    const picker = periodPickerRef.current;
    if (picker && hourlyPeriod) {
      picker.options = hourlyPeriodOptions;
    } else if (picker) {
      picker.options = [
        {label: 'Last 7 days', days: 7},
        {label: 'Last 30 days', days: 30},
        {label: 'Last 90 days', days: 90},
      ];
    }
  }, [hourlyPeriod]);
  const [query, setQuery] = useState('');
  const [encryption, setEncryption] = useState(true);
  const [componentNav, setComponentNav] = useState('dashboard');
  const [componentStep, setComponentStep] = useState(0);
  const [foundationTags, setFoundationTags] = useState([
    'verification',
    'production',
  ]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [componentOrganization, setComponentOrganization] = useState('acme');
  const [switcherValue, setSwitcherValue] = useState('product');
  const [flowName, setFlowName] = useState('');
  const [flowError, setFlowError] = useState<ReactNode>(null);
  const [rangeValue, setRangeValue] = useState(68);
  const [colorValue, setColorValue] = useState('#0017ee');
  const [dropdownValue, setDropdownValue] = useState('option-one');
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetValue, setAssetValue] =
    useState<(typeof assetOptions)[number]['value']>('mark');
  const selectedAsset =
    assetOptions.find(option => option.value === assetValue) ?? assetOptions[0];
  const choices = [
    'Australia',
    'India',
    'United Kingdom',
    'United States',
  ].filter(value => value.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <Section eyebrow="01" title="Buttons and status">
        <Card>
          <div className="catalog-row">
            <Button>Verify claim</Button>
            <Button variant="secondary">Save draft</Button>
            <Button variant="destructive">Revoke</Button>
            <Button variant="inline">View documentation</Button>
            <Button busy>Verifying</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="catalog-row catalog-row--spaced">
            <StatusPill tone="verified">● Verified</StatusPill>
            <StatusPill tone="pending">● In review</StatusPill>
            <StatusPill tone="failed">● Needs work</StatusPill>
            <StatusPill>● Sandbox</StatusPill>
          </div>
        </Card>
      </Section>
      <Section eyebrow="02" title="Fields and validation">
        <Card>
          <div className="catalog-form">
            <Field
              label="Provider identifier"
              defaultValue="chase-bank-balance"
              hint="Lowercase letters and hyphens."
            />
            <Field
              data-testid="catalog-error-field"
              label="Callback URL"
              placeholder="https://api.example.com/callback"
              error={showError ? 'Enter a complete HTTPS URL.' : undefined}
              onBlur={() => setShowError(true)}
            />
            <Field
              label="Read-only public key"
              defaultValue="pk_live_0x29…a1d"
              readOnly
            />
            <Field
              label="Disabled field"
              defaultValue="Not editable"
              disabled
            />
            <RangeField
              label="Preview scale"
              min={40}
              max={100}
              value={rangeValue}
              onChange={setRangeValue}
              formatValue={value => `${value}%`}
              hint="Adjust a numeric value without adding hover effects."
            />
            <ColorField
              label="Accent color"
              value={colorValue}
              onChange={setColorValue}
              hint="Use a native color input with a readable value."
            />
          </div>
          <p className="catalog-note">
            The callback URL demonstrates blur validation; focus it and leave it
            empty.
          </p>
        </Card>
      </Section>
      <Section eyebrow="03" title="Selection">
        <Card>
          <div className="catalog-stack">
            <div className="rc-field">
              <span className="rc-field__label">Dropdown</span>
              <Dropdown
                className="catalog-selection-dropdown"
                label={
                  {
                    'option-one': 'Option one',
                    'option-two': 'Option two',
                    'option-three': 'Option three',
                  }[dropdownValue]
                }
                value={dropdownValue}
                onChange={setDropdownValue}
                options={[
                  {value: 'option-one', label: 'Option one'},
                  {value: 'option-two', label: 'Option two'},
                  {value: 'option-three', label: 'Option three'},
                ]}
              />
              <span className="rc-field__message">
                Use for a short, generic list of options.
              </span>
            </div>
            <SegmentedControl
              label="Reporting period"
              value={segment}
              onChange={setSegment}
              options={[
                {value: 'day', label: '24 hours'},
                {value: 'week', label: '7 days'},
                {value: 'month', label: '30 days'},
              ]}
            />
            <div className="catalog-row">
              <button className="catalog-chip" data-chip aria-pressed="true">
                Gig work
              </button>
              <button className="catalog-chip" data-chip>
                Education
              </button>
              <button className="catalog-chip catalog-chip--add" data-chip>
                + Add filter
              </button>
            </div>
            <label className="catalog-choice">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => setChecked(!checked)}
              />
              <span>
                <strong>Result encryption</strong>
                <small>Encrypt result payloads at rest.</small>
              </span>
            </label>
            <fieldset className="rc-radio-cards">
              <legend>Publishing policy</legend>
              {['review', 'auto'].map(value => (
                <label className="rc-radio-card" key={value}>
                  <input
                    type="radio"
                    name="policy"
                    value={value}
                    checked={radio === value}
                    onChange={() => setRadio(value)}
                  />
                  <span className="rc-radio-card__content">
                    <strong>
                      {value === 'review'
                        ? 'Review before publish'
                        : 'Publish automatically'}
                    </strong>
                    <small>
                      {value === 'review'
                        ? 'A person approves every change.'
                        : 'Healthy revisions publish immediately.'}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
          </div>
        </Card>
      </Section>
      <Section eyebrow="03A" title="Foundation primitives">
        <div className="catalog-grid catalog-grid--two">
          <Card>
            <PanelTitle
              title="Identity and health"
              meta="Semantic Oat foundations"
            />
            <div className="catalog-row">
              <Avatar initials="SK" alt="Syed" />
              <Avatar src={rMark} alt="Reclaim" size="lg" />
              <StatusPill tone="verified">Healthy</StatusPill>
            </div>
            <div className="catalog-stack catalog-row--spaced">
              <Alert tone="success" title="Callback verified">
                The endpoint answered the signed challenge.
              </Alert>
              <Alert tone="warning" title="Coverage gap">
                Two days are missing from the current 30-day window.
              </Alert>
              <Meter
                label="Daily continuity · 26 / 30 days"
                value={26}
                min={0}
                max={30}
                low={20}
                high={27}
                optimum={30}
              />
              <LinearProgress label="Linear progress · 68%" value={68} />
              <div className="catalog-row">
                <CircularProgress label="68%" value={68} />
                <span className="rc-muted">Circular progress</span>
              </div>
            </div>
          </Card>
          <Card>
            <PanelTitle
              title="Tabs and structured input"
              meta="Keyboard and touch ready"
            />
            <OatTabsExample />
            <TagInput
              label="Verification tags"
              value={foundationTags}
              onChange={setFoundationTags}
            />
            <UploadField
              label="Upload organization photo"
              hint="PNG, JPG, or WebP up to the product limit."
              accept="image/png,image/jpeg,image/webp"
            />
            <UploadResult
              name="organization-photo.png"
              description="PNG · 128 KB"
              preview={<img src={rMark} alt="" />}
              actions={
                <>
                  <Button variant="secondary">Edit</Button>
                  <Button variant="secondary">Clear</Button>
                </>
              }
            />
            <AssetElementsExample />
          </Card>
        </div>
        <Card>
          <div className="catalog-row">
            <Button
              variant="secondary"
              onClick={() =>
                setToasts([
                  {
                    id: 'provider-saved',
                    tone: 'success',
                    title: 'Provider saved',
                    message: 'The new version is ready for review.',
                  },
                ])
              }
            >
              Success toast
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setToasts([
                  {
                    id: 'coverage-warning',
                    tone: 'warning',
                    title: 'Coverage warning',
                    message: 'Two days are missing from this period.',
                  },
                ])
              }
            >
              Warning toast
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                setToasts([
                  {
                    id: 'callback-error',
                    tone: 'danger',
                    title: 'Callback failed',
                    message: 'The endpoint did not answer in time.',
                  },
                ])
              }
            >
              Error toast
            </Button>
            <span className="rc-muted">
              Toasts appear at the top-right and are announced politely.
            </span>
          </div>
        </Card>
        <ToastRegion
          messages={toasts}
          onDismiss={id =>
            setToasts(current => current.filter(item => item.id !== id))
          }
        />
      </Section>
      <Section eyebrow="04" title="Selections in dialogs">
        <Card>
          <PickerField
            label="Approved asset"
            title={selectedAsset.label}
            description={selectedAsset.description}
            preview={selectedAsset.preview}
            actionLabel="Choose asset"
            onOpen={() => setAssetPickerOpen(true)}
            hint="The consumer supplies the options and preview content."
          />
          <div className="catalog-row">
            <Button
              data-testid="catalog-dialog-trigger"
              variant="secondary"
              onClick={() => setDialog('tags')}
            >
              Filter by tag · {tags.length}
            </Button>
            <Button variant="secondary" onClick={() => setDialog('region')}>
              Region · {region}
            </Button>
            <Button variant="destructive" onClick={() => setDialog('confirm')}>
              Delete organization
            </Button>
          </div>
        </Card>
      </Section>
      <Section eyebrow="05" title="Searchable dropdown">
        <Card>
          <PanelTitle
            title="Scope selector"
            meta="Searchable single selection with option metadata"
          />
          <div className="catalog-searchable-dropdown-specimen">
            <SearchableDropdown
              className="catalog-scope-dropdown"
              label="Scope"
              value={scope}
              onChange={setScope}
              searchPlaceholder="Search providers"
              supportingText={
                scope === 'all'
                  ? 'Across all providers'
                  : 'Filtered to one provider'
              }
              options={[
                {
                  value: 'all',
                  label: 'All providers',
                  meta: '42',
                  prominent: true,
                },
                {
                  value: 'uber-earnings',
                  label: 'uber-earnings',
                  meta: 'uber.com',
                },
                {
                  value: 'chase-balance',
                  label: 'chase-balance',
                  meta: 'chase.com',
                },
                {
                  value: 'coursera-certs',
                  label: 'coursera-certs',
                  meta: 'coursera.org',
                },
              ]}
            />
          </div>
        </Card>
      </Section>
      <Section eyebrow="05A" title="Menus, search and dates">
        <Card>
          <div className="catalog-form">
            <Combobox
              label="Provider"
              value={provider}
              onChange={setProvider}
              options={[
                {value: 'chase', label: 'Chase balance', text: 'Chase balance'},
                {value: 'uber', label: 'Uber earnings', text: 'Uber earnings'},
                {
                  value: 'coursera',
                  label: 'Coursera certificates',
                  text: 'Coursera certificates',
                },
              ]}
            />
            <div className="catalog-stack">
              <span className="rc-field__label">Sort sessions</span>
              <Dropdown
                label={sort === 'recent' ? 'Most recent' : 'Oldest first'}
                value={sort}
                onChange={setSort}
                options={[
                  {value: 'recent', label: 'Most recent'},
                  {value: 'oldest', label: 'Oldest first'},
                ]}
              />
            </div>
          </div>
          <div className="catalog-row catalog-row--spaced">
            <Chip selected>Production</Chip>
            <Chip>Sandbox</Chip>
            <Chip variant="add">Add tag</Chip>
            <Tooltip label="2026-09-28 14:32:18 UTC">
              <Button variant="secondary">Exact timestamp</Button>
            </Tooltip>
          </div>
          <div className="catalog-row catalog-row--spaced">
            <div className="catalog-stack">
              {createElement('rc-period-picker', {
                ref: periodPickerRef,
                'aria-label': 'Reporting period',
                'disable-custom': disableCustomPeriod || undefined,
                'data-testid': 'catalog-period-picker',
                style: {
                  '--rc-component-period-option-font-size': `${periodFontSize}px`,
                  '--rc-component-period-option-padding-block': `${periodPadding}px`,
                  '--rc-component-period-option-padding-inline': `${Math.round(periodPadding * 1.5)}px`,
                  '--rc-component-period-border-gap': `${periodBorderGap}px`,
                } as CSSProperties,
              })}
              <span
                data-testid="catalog-period-output"
                className="rc-field__hint"
              >
                {periodRange?.label}: {periodRange?.from} →{' '}
                {periodRange?.through}
              </span>
              <label className="catalog-row">
                <input
                  type="checkbox"
                  checked={hourlyPeriod}
                  onChange={event => setHourlyPeriod(event.target.checked)}
                />
                Show hourly options
              </label>
              <label className="catalog-period-setting">
                Option font size (px)
                <input
                  className="rc-input"
                  type="number"
                  min="9"
                  max="24"
                  value={periodFontSize}
                  onChange={event =>
                    setPeriodFontSize(Number(event.target.value))
                  }
                />
              </label>
              <label className="catalog-period-setting">
                Button padding (px)
                <input
                  className="rc-input"
                  type="number"
                  min="0"
                  max="24"
                  value={periodPadding}
                  onChange={event =>
                    setPeriodPadding(Number(event.target.value))
                  }
                />
              </label>
              <label className="catalog-period-setting">
                Border gap (px)
                <input
                  className="rc-input"
                  type="number"
                  min="0"
                  max="20"
                  value={periodBorderGap}
                  onChange={event =>
                    setPeriodBorderGap(Number(event.target.value))
                  }
                />
              </label>
              <label className="catalog-row">
                <input
                  type="checkbox"
                  checked={disableCustomPeriod}
                  onChange={event =>
                    setDisableCustomPeriod(event.target.checked)
                  }
                />
                Disable custom range
              </label>
            </div>
            <ChoiceRow
              type="checkbox"
              checked={checked}
              onChange={setChecked}
              title="Include degraded providers"
              description="Keep warning-state rows in the result."
            />
          </div>
        </Card>
      </Section>
      <Section eyebrow="06" title="Navigation overlays">
        <Card>
          <Breadcrumbs
            items={[
              {label: 'Catalog', href: '#'},
              {label: 'Providers', href: '#'},
              {label: 'chase-bank-balance'},
            ]}
          />
          <div className="catalog-row catalog-row--spaced">
            <HoverNavigation
              label="Resources"
              items={[
                {
                  value: 'docs',
                  label: 'Documentation',
                  href: '#',
                  description: 'Implementation guidance and API contracts.',
                },
                {
                  value: 'patterns',
                  label: 'Patterns',
                  href: '#',
                  description: 'Reference console compositions.',
                },
              ]}
            />
            <ProfileMenu initials="SK" name="Syed" detail="syed@example.com">
              <button type="button">Account settings</button>
              <button type="button" className="rc-profile-menu__action--danger">
                Sign out
              </button>
            </ProfileMenu>
          </div>
        </Card>
      </Section>
      <Section eyebrow="06A" title="Switcher dropdown">
        <Card>
          <PanelTitle
            title="Context switcher"
            meta="Generic entity-switching component"
          />
          <div className="catalog-switcher-specimen">
            <SwitcherDropdown
              label="Workspace switcher"
              groupLabel="Workspaces"
              value={switcherValue}
              onChange={setSwitcherValue}
              onAction={() =>
                setToasts([
                  {
                    id: 'create-workspace',
                    tone: 'neutral',
                    title: 'Create workspace',
                    message: 'The consumer controls this action.',
                  },
                ])
              }
              actionLabel="Create workspace"
              items={workspaces}
            />
          </div>
        </Card>
      </Section>
      <Section eyebrow="07" title="Navigation pane">
        <div className="catalog-component-frame catalog-navigation-specimen">
          <NavigationPane
            brand={
              <>
                <img src={rMark} alt="" />
                <Wordmark />
              </>
            }
            switcher={
              <SwitcherDropdown
                label="Organization"
                groupLabel="Organizations"
                value={componentOrganization}
                onChange={setComponentOrganization}
                onAction={() =>
                  setToasts([
                    {
                      id: 'create-organization',
                      tone: 'neutral',
                      title: 'Create organization',
                      message: 'The consumer controls this action.',
                    },
                  ])
                }
                actionLabel="Create organization"
                items={organizations}
              />
            }
            value={componentNav}
            onNavigate={setComponentNav}
            groups={[
              {
                label: 'Monitor',
                items: [
                  {
                    value: 'dashboard',
                    label: 'Dashboard',
                    icon: <Icon name="grid" />,
                  },
                  {
                    value: 'verifications',
                    label: 'Verifications',
                    icon: <Icon name="activity" />,
                    badge: '12k',
                  },
                ],
              },
              {
                label: 'Build',
                items: [
                  {
                    value: 'catalog',
                    label: 'Catalog',
                    icon: <Icon name="cube" />,
                    badge: '1.2k',
                  },
                  {
                    value: 'providers',
                    label: 'Providers',
                    icon: <Icon name="apps" />,
                    badge: '8',
                  },
                ],
              },
              {
                label: 'Organization',
                items: [
                  {
                    value: 'connect',
                    label: 'Connect your app',
                    icon: <Icon name="link" />,
                  },
                  {
                    value: 'members',
                    label: 'Members',
                    icon: <Icon name="users" />,
                    badge: '5',
                  },
                  {
                    value: 'settings',
                    label: 'Settings',
                    icon: <Icon name="sliders" />,
                  },
                ],
              },
            ]}
            footer={
              <>
                <Button size="sm" variant="secondary">
                  Dark mode
                </Button>
                <Button size="lg" fullWidth>
                  <Icon name="terminal" />
                  Use an agent
                </Button>
                <a
                  className="rc-button"
                  data-size="lg"
                  data-width="full"
                  href="https://build.reclaimprotocol.org/docs"
                >
                  <Icon name="book" />
                  OpenAPI reference
                  <Icon name="externalLink" className="rc-button__trailing" />
                </a>
              </>
            }
          />
        </div>
      </Section>
      <Section eyebrow="08" title="App bar and page header">
        <div className="catalog-component-frame">
          <AppBar
            breadcrumbs={
              <Breadcrumbs
                items={[{label: 'Acme Identity'}, {label: 'Dashboard'}]}
              />
            }
            actions={
              <>
                <Button variant="secondary">
                  <Icon name="link" />
                  Integrate
                </Button>
                <Button>New provider</Button>
                <ProfileMenu
                  initials="SK"
                  name="Syed"
                  detail="syed@example.com · owner"
                >
                  <button type="button">
                    <Icon name="pencil" />
                    Update your name
                  </button>
                  <button
                    type="button"
                    className="rc-profile-menu__action--danger"
                  >
                    <Icon name="logout" />
                    Log out
                  </button>
                </ProfileMenu>
              </>
            }
          />
          <div className="catalog-header-specimen">
            <PageHeader
              eyebrow="Monitor"
              title="Overview"
              description="Proof volume, provider health and recent verifications for this organization."
              actions={
                <Button variant="secondary" size="md">
                  Export
                  <Icon name="chevronDown" className="rc-button__trailing" />
                </Button>
              }
            />
            <FilterToolbar>
              <FilterRow>
                <span className="rc-label">Scope</span>
                <InputGroup caption="provider">
                  <input placeholder="any" aria-label="Provider" />
                  <Icon name="chevronDown" />
                </InputGroup>
                <span className="rc-filter-toolbar__results">
                  128,441 sessions
                </span>
                <Button variant="inline">Clear</Button>
              </FilterRow>
              <FilterRow>
                <span className="rc-label">Period</span>
                <SegmentedControl
                  label="Period"
                  value={segment}
                  onChange={setSegment}
                  options={[
                    {value: 'week', label: 'Last 7 days'},
                    {value: 'month', label: 'Last 30 days'},
                    {value: 'quarter', label: 'Last 90 days'},
                  ]}
                />
              </FilterRow>
            </FilterToolbar>
          </div>
        </div>
      </Section>
      <Section eyebrow="09" title="Settings and metadata">
        <div className="catalog-grid catalog-grid--two">
          <Card>
            <PanelTitle
              title="Runtime settings"
              meta="Reference switch state"
            />
            <div className="catalog-stack">
              <Switch
                checked={encryption}
                onChange={setEncryption}
                label="Result encryption"
                description="Encrypt verification results before callback delivery."
              />
              <Switch
                checked={false}
                onChange={() => undefined}
                disabled
                label="Automatic publishing"
                description="Requires organization owner access."
              />
            </div>
          </Card>
          <Card>
            <PanelTitle
              title="Provider metadata"
              meta="Label and value pairs"
            />
            <MetadataList
              items={[
                {label: 'Provider ID', value: <code>uber-earnings-alt</code>},
                {label: 'Owner', value: 'Northwind Labs'},
                {label: 'Version', value: 'v3 · serving'},
                {
                  label: 'Success rate',
                  value: <StatusPill tone="verified">98.1%</StatusPill>,
                },
              ]}
            />
          </Card>
        </div>
      </Section>
      <Section eyebrow="10" title="Guided flow">
        <FlowShell
          steps={flow}
          current={componentStep}
          onStepChange={index => {
            setComponentStep(index);
            setFlowError(null);
          }}
          onBack={
            componentStep > 0
              ? () => {
                  setComponentStep(value => value - 1);
                  setFlowError(null);
                }
              : undefined
          }
          onNext={() => {
            if (componentStep === 0 && !flowName.trim()) {
              setFlowError('Enter a workflow name before continuing.');
              return;
            }
            setFlowError(null);
            setComponentStep(value => Math.min(flow.length - 1, value + 1));
          }}
          nextLabel={componentStep === flow.length - 1 ? 'Finish' : 'Continue'}
          hint={flowError ?? `Step ${componentStep + 1} of ${flow.length}`}
        >
          <PanelTitle
            title={flow[componentStep].label}
            meta="Composable step content"
          />
          <h3 className="catalog-flow-title">
            {componentStep === 0
              ? 'Choose an input'
              : componentStep === 1
                ? 'Configure the options'
                : componentStep === 2
                  ? 'Review the settings'
                  : componentStep === 3
                    ? 'Test the workflow'
                    : 'Complete the workflow'}
          </h3>
          <p className="rc-lede">
            Consumers supply every step, label, action, header slot, footer
            slot, validation rule, and body.
          </p>
          {componentStep === 0 ? (
            <Field
              data-testid="guided-flow-name"
              label="Workflow name"
              value={flowName}
              onChange={event => {
                setFlowName(event.target.value);
                if (event.target.value.trim()) {
                  setFlowError(null);
                }
              }}
              error={flowError}
              placeholder="Monthly verification"
            />
          ) : componentStep === flow.length - 1 ? (
            <Alert tone="success" title="Validation complete">
              The supplied workflow is ready to finish.
            </Alert>
          ) : (
            <div className="catalog-code">
              workflow.configure(
              {`{ step: ${componentStep + 1}, name: "${flowName}" }`})
            </div>
          )}
        </FlowShell>
      </Section>
      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        className="catalog-dialog"
        width={dialog === 'region' ? '680px' : undefined}
        minBodyHeight={dialog === 'region' ? '360px' : undefined}
        title={
          dialog === 'tags'
            ? 'Filter by tag'
            : dialog === 'region'
              ? 'Region'
              : 'Delete organization'
        }
        description="Selection"
        footer={
          <>
            {
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Cancel
              </Button>
            }
            {dialog === 'tags' ? (
              <Button onClick={() => setDialog(null)}>Apply</Button>
            ) : dialog === 'region' ? null : (
              <Button variant="destructive" onClick={() => setDialog(null)}>
                Delete organization
              </Button>
            )}
          </>
        }
      >
        <div data-testid="catalog-dialog">
          {dialog === 'tags' &&
            ['banking', 'gig work', 'education', 'licensing'].map(tag => (
              <label className="catalog-choice" key={tag}>
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={() =>
                    setTags(current =>
                      current.includes(tag)
                        ? current.filter(item => item !== tag)
                        : [...current, tag],
                    )
                  }
                />
                <span>
                  <strong>{tag}</strong>
                </span>
              </label>
            ))}
          {dialog === 'region' && (
            <div className="rc-combobox" data-combobox>
              <Field
                label="Search region"
                value={query}
                onChange={event => setQuery(event.target.value)}
                role="combobox"
                aria-expanded="true"
                aria-controls="region-options"
              />
              <div
                id="region-options"
                role="listbox"
                className="catalog-options"
              >
                {choices.length ? (
                  choices.map(choice => (
                    <button
                      role="option"
                      aria-selected={region === choice}
                      key={choice}
                      onClick={() => {
                        setRegion(choice);
                        setDialog(null);
                      }}
                    >
                      {choice}
                    </button>
                  ))
                ) : (
                  <p>No regions match.</p>
                )}
              </div>
            </div>
          )}
          {dialog === 'confirm' && (
            <p className="rc-lede">
              This removes all providers, keys, and callback settings. This
              action cannot be undone.
            </p>
          )}
        </div>
      </Dialog>
      <SelectionDialog
        open={assetPickerOpen}
        onClose={() => setAssetPickerOpen(false)}
        title="Choose an approved asset"
        description="Select one treatment for this surface."
        label="Approved assets"
        items={assetOptions}
        value={assetValue}
        onChange={setAssetValue}
      />
    </>
  );
}

function Patterns() {
  const [expanded, setExpanded] = useState(true);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);
  const [callbackAdded, setCallbackAdded] = useState(false);
  return (
    <>
      <Section eyebrow="01" title="Data display">
        <div className="catalog-console-grid">
          <Card>
            <PanelTitle title="Provider health" meta="42 providers" />
            <div className="catalog-list">
              {[
                ['acme-chase-balance', '99.4%', 'Verified'],
                ['uber-earnings-alt', '81.0%', 'In review'],
                ['coursera-certs', '42.7%', 'Needs work'],
              ].map(([id, rate, state]) => (
                <div className="catalog-list-row" key={id}>
                  <span className="rc-identifier rc-truncate" title={id}>
                    {id}
                  </span>
                  <span className="rc-tabular">{rate}</span>
                  <StatusPill
                    tone={
                      state === 'Verified'
                        ? 'verified'
                        : state === 'In review'
                          ? 'pending'
                          : 'failed'
                    }
                  >
                    {state}
                  </StatusPill>
                </div>
              ))}
            </div>
            <Button variant="inline">View all providers</Button>
          </Card>
          <Card>
            <PanelTitle title="Provider evidence" meta="JSON payload" />
            <pre
              className="rc-code"
              id="catalog-code"
            >{`{\n  "balance_gt_10k": true,\n  "currency": "USD",\n  "as_of": "2026-09-03T14:02:11Z"\n}`}</pre>
            <Button
              variant="secondary"
              data-copy
              data-copy-source="#catalog-code"
              onClick={() =>
                navigator.clipboard?.writeText(
                  document.getElementById('catalog-code')?.textContent ?? '',
                )
              }
            >
              Copy JSON
            </Button>
          </Card>
        </div>
        <Card>
          <PanelTitle title="Verification sessions" meta="1–3 of 128,441" />
          <div
            className="rc-table"
            role="table"
            aria-label="Verification sessions"
            tabIndex={0}
            style={
              {
                '--rc-table-columns':
                  'minmax(180px, 2fr) minmax(120px, 1fr) 96px',
              } as CSSProperties
            }
          >
            <div className="rc-table__header" role="row">
              <span role="columnheader">Session ID</span>
              <span role="columnheader">Provider</span>
              <span role="columnheader">Status</span>
            </div>
            {[
              '9f4c2b71-a12e-4c9d-8b31',
              '2b717c04-ff03-4a17-9c62',
              '77de3f90-21aa-4e58-8f04',
            ].map((id, index) => (
              <div className="rc-table__row" role="row" key={id}>
                <span
                  role="cell"
                  className="rc-identifier rc-truncate"
                  title={id}
                >
                  {id}
                </span>
                <span role="cell">
                  {index === 1 ? 'uber-earnings' : 'acme-chase-balance'}
                </span>
                <span role="cell">
                  <StatusPill tone={index === 1 ? 'failed' : 'verified'}>
                    {index === 1 ? 'Failed' : 'Verified'}
                  </StatusPill>
                </span>
              </div>
            ))}
          </div>
          <div className="catalog-pagination">
            <span>1–3 of 128,441</span>
            <Button variant="secondary" disabled>
              Previous
            </Button>
            <Button variant="secondary">Next</Button>
          </div>
        </Card>
      </Section>
      <Section eyebrow="02" title="Loading and feedback">
        <div className="catalog-grid catalog-grid--three">
          <Card>
            <PanelTitle title="Skeleton" meta="Real-layout placeholder" />
            {loading ? (
              <>
                <div className="rc-skeleton catalog-skeleton-title" />
                <div className="rc-skeleton catalog-skeleton-line" />
                <div className="rc-skeleton catalog-skeleton-line catalog-skeleton-line--short" />
              </>
            ) : (
              <p className="rc-lede">Provider data loaded.</p>
            )}
            <Button
              variant="secondary"
              onClick={() => setLoading(value => !value)}
            >
              {loading ? 'Resolve data' : 'Show skeleton'}
            </Button>
          </Card>
          <Card className="rc-card--spec">
            {callbackAdded ? (
              <>
                <PanelTitle title="Callback configured" meta="Active" />
                <StatusPill tone="verified">Delivery enabled</StatusPill>
                <p className="rc-lede">
                  Events will be sent to the configured endpoint.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setCallbackAdded(false)}
                >
                  Remove callback
                </Button>
              </>
            ) : (
              <>
                <PanelTitle
                  title="Empty callbacks"
                  meta="One action fills this state"
                />
                <p className="rc-lede">Callback deliveries will appear here.</p>
                <Button
                  data-testid="add-callback"
                  onClick={() => setCallbackAdded(true)}
                >
                  Add callback
                </Button>
              </>
            )}
          </Card>
          <Card className="catalog-warning">
            <PanelTitle
              title="Not ready to create sessions"
              meta="Blocking warning"
            />
            <p className="rc-lede">Add a callback URL before publishing.</p>
            <a href="#">Open callback settings</a>
          </Card>
        </div>
        <div className="catalog-row catalog-row--spaced">
          <Button onClick={() => setFeedback('success')}>Save provider</Button>
          <Button variant="destructive" onClick={() => setFeedback('error')}>
            Simulate failure
          </Button>
          {feedback && (
            <div
              className={`catalog-feedback catalog-feedback--${feedback}`}
              role="status"
            >
              {feedback === 'success'
                ? 'Provider saved. Undo'
                : 'Could not save provider. The callback URL is unreachable.'}
              <button
                onClick={() => setFeedback(null)}
                aria-label="Dismiss feedback"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </Section>
      <Section eyebrow="03" title="Expansion">
        <ExpansionTile
          title="Weekly earnings"
          summary="uber-earnings-alt v3 · serving"
          open={expanded}
          onOpenChange={setExpanded}
        >
          <div className="catalog-stack">
            <StatusPill tone="verified">Serving</StatusPill>
            <code>GET drivers.uber.com/api/earnings/weekly</code>
            <code>jsonPath $.weekOverview.total</code>
          </div>
        </ExpansionTile>
      </Section>
    </>
  );
}

function Charts() {
  return (
    <>
      <Section eyebrow="01" title="Chart fixtures">
        <div className="catalog-grid catalog-grid--two">
          <Card className="catalog-chart-card">
            <PanelTitle title="Verification volume" meta="Bar · interactive" />
            <BarChart data={volume} />
          </Card>
          <Card className="catalog-chart-card">
            <PanelTitle title="Completion rate" meta="Area · interactive" />
            <AreaChart data={completion} />
          </Card>
          <Card className="catalog-chart-card">
            <PanelTitle title="Completion trend" meta="Line · interactive" />
            <LineChart data={completion} />
          </Card>
          <Card className="catalog-chart-card">
            <PanelTitle title="Session funnel" meta="Funnel · interactive" />
            <FunnelChart data={funnel} />
          </Card>
          <Card className="catalog-chart-card">
            <PanelTitle
              title="Outcome distribution"
              meta="Donut · interactive"
            />
            <DonutChart data={distribution} />
          </Card>
          <Card className="catalog-chart-card">
            <PanelTitle
              title="Volume and duration"
              meta="Scatter · interactive"
            />
            <ScatterChart data={correlation} />
          </Card>
        </div>
      </Section>
    </>
  );
}

function Catalog() {
  const [activeSection, setActiveSection] = useState<CatalogSection>('Surface');
  useEffect(() => {
    const controllers = [
      createCopyController(document),
      createGlowController(document),
      createGuillocheController(document),
    ];
    return () => controllers.forEach(controller => controller.destroy());
  }, []);
  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let next: CatalogSection = catalogSections[0];
        for (const title of catalogSections) {
          const section = document.getElementById(sectionId(title));
          if (section && section.getBoundingClientRect().top <= 112) {
            next = title;
          } else {
            break;
          }
        }
        if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2
        ) {
          next = catalogSections.at(-1) ?? next;
        }
        setActiveSection(next);
      });
    };
    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, {passive: true});
    window.addEventListener('resize', updateActiveSection);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, []);
  return (
    <div data-testid="catalog-root">
      <div
        className="rc-surface catalog-shell"
        data-testid="catalog-app-shell"
        data-app-shell
        style={{'--catalog-noise': `url(${noise})`} as CSSProperties}
      >
        <Guilloche />
        <BrandHeader
          activeSection={activeSection}
          onNavigate={setActiveSection}
        />
        <main className="catalog-main">
          <div className="catalog-page-heading">
            <div>
              <p className="rc-eyebrow">Reclaim protocol</p>
              <h1 className="rc-page-title">Component reference</h1>
              <p className="rc-lede">
                Every component, interaction state, product pattern, and chart
                in one navigable reference.
              </p>
            </div>
            <span className="catalog-code">RC/01</span>
          </div>
          <Overview />
          <Components />
          <Patterns />
          <ConsolePatterns />
          <SitePatterns />
          <Charts />
        </main>
      </div>
    </div>
  );
}

defineReclaimElements();

createRoot(document.getElementById('root')!).render(
  <ReclaimThemeProvider defaultTheme="light">
    <Catalog />
  </ReclaimThemeProvider>,
);
