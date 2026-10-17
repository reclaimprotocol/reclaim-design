import {useState, type CSSProperties} from 'react';
import {icons, type ReclaimIconName} from '@reclaimprotocol/design/icons';
import {PanelTitle, Section} from './catalog-section';
import {AreaChart, BarChart, FunnelChart, type ChartDatum} from './charts';
import {
  AppBar,
  AppShell,
  AppShellMain,
  Avatar,
  BlockingWarning,
  BottomTabs,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  ChoiceRow,
  ChartFrame,
  CircularProgress,
  CodeBlock,
  DataTable,
  Dialog,
  EmptyState,
  EventTimeline,
  ExpansionTile,
  Field,
  FieldGrid,
  FilterRow,
  FilterToolbar,
  Hint,
  Icon,
  InputGroup,
  KindTag,
  Kpi,
  LinearProgress,
  MetadataList,
  NavigationPane,
  Page,
  PageHeader,
  PersonRow,
  PlanCard,
  PoolCard,
  ProfileMenu,
  SearchBar,
  SectionCard,
  SegmentedControl,
  StatusPill,
  SwitcherDropdown,
  Wordmark,
  type TimelineEvent,
} from './design-components';

const rMark = new URL('../../../assets/brand/r-mark-tile.png', import.meta.url)
  .href;

const volume: ChartDatum[] = [
  ['05 Sep', 42, 10],
  ['06 Sep', 63, 12],
  ['07 Sep', 51, 9],
  ['08 Sep', 77, 11],
  ['09 Sep', 68, 7],
  ['10 Sep', 88, 13],
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
].map(([label, value]) => ({label: String(label), value: Number(value)}));
const dropOff: ChartDatum[] = [
  {label: 'Signed out', value: 46, display: '46%'},
  {label: 'Page changed', value: 31, display: '31%'},
  {label: 'Timed out', value: 14, display: '14%'},
];

const organizations = [
  {value: 'acme', label: 'Acme Identity', leading: 'A', meta: 'owner'},
  {value: 'northwind', label: 'Northwind Labs', leading: 'N', meta: 'admin'},
] as const;

const sessions = [
  {id: '9f4c2b71-a12e', provider: 'uber-earnings', proofs: 2, state: 'ok'},
  {id: '2b717c04-ff03', provider: 'acme-chase-balance', proofs: 1, state: 'ok'},
  {id: '77de3f90-21aa', provider: 'coursera-certs', proofs: 0, state: 'fail'},
] as const;

const events: TimelineEvent[] = [
  {
    id: 'created',
    at: '00.00s',
    title: 'session.created',
    phase: 'setup',
    ordinal: '#1',
    description: 'Session opened for uber-earnings v14.',
    tone: 'success',
  },
  {
    id: 'navigate',
    at: '01.82s',
    title: 'page.navigated',
    phase: 'browser',
    ordinal: '#2',
    description: 'Reached the earnings page.',
    tone: 'muted',
    details:
      '{\n  "url": "https://drivers.uber.com/earnings",\n  "status": 200\n}',
  },
  {
    id: 'failed',
    at: '06.40s',
    title: 'selector.missing',
    phase: 'extract',
    ordinal: '#3',
    description: 'The page no longer matches the provider.',
    tone: 'error',
    details:
      '{\n  "selector": "[data-testid=weekly-total]",\n  "matches": 0\n}',
  },
];

const people = [
  {id: 'rohan', initials: 'RS', name: 'Rohan Sharma', detail: 'rohan@acme.com'},
  {id: 'priya', initials: 'PN', name: 'Priya Nair', detail: 'priya@acme.com'},
  {
    id: 'sam',
    initials: 'SO',
    name: 'sam@northwind.io',
    detail: 'invited 2 days ago',
  },
] as const;

const iconNames = Object.keys(icons) as ReclaimIconName[];

export function ConsolePatterns() {
  const [nav, setNav] = useState('dashboard');
  const [organization, setOrganization] = useState('acme');
  const [period, setPeriod] = useState('30');
  const [visibility, setVisibility] = useState('public');
  const [tag, setTag] = useState('all');
  const [openEvent, setOpenEvent] = useState<string | null>('navigate');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [options, setOptions] = useState({weekly: true, trips: false});
  const [policy, setPolicy] = useState('review');
  const [activeSession, setActiveSession] = useState<string>(sessions[0].id);
  return (
    <>
      <Section eyebrow="04" title="Product shell">
        <div className="catalog-shell-specimen">
          <AppShell>
            <NavigationPane
              id="catalog-shell-menu"
              popover
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
                  value={organization}
                  onChange={setOrganization}
                  onAction={() => undefined}
                  actionLabel="Create organization"
                  items={organizations}
                />
              }
              value={nav}
              onNavigate={setNav}
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
                  label: 'Organization',
                  items: [
                    {
                      value: 'members',
                      label: 'Members',
                      icon: <Icon name="users" />,
                      badge: '5',
                    },
                    {
                      value: 'billing',
                      label: 'Billing',
                      icon: <Icon name="card" />,
                      badge: 'scale',
                    },
                  ],
                },
              ]}
              footer={
                <Button size="lg" fullWidth>
                  <Icon name="terminal" />
                  Use an agent
                </Button>
              }
            />
            <AppShellMain
              bar={
                <AppBar
                  breadcrumbs={
                    <Breadcrumbs
                      items={[{label: 'Acme Identity'}, {label: 'Overview'}]}
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
                        initials="RS"
                        name="Rohan"
                        detail="rohan@acme.com · owner"
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
              }
            >
              <Page width="xs">
                <PageHeader
                  eyebrow="Monitor"
                  title="Overview"
                  description="Proof volume, provider health and recent verifications for this organization."
                />
                <div className="rc-kpi-grid">
                  <Kpi label="Verifications" value="128,441" delta="+12.4%" />
                  <Kpi label="Success rate" value="97.2%" delta="+0.6 pts" />
                </div>
              </Page>
            </AppShellMain>
            <BottomTabs
              items={[
                {
                  value: 'dashboard',
                  label: 'Overview',
                  icon: <Icon name="grid" />,
                },
                {
                  value: 'verifications',
                  label: 'Verifications',
                  icon: <Icon name="activity" />,
                },
                {
                  value: 'members',
                  label: 'Members',
                  icon: <Icon name="users" />,
                },
              ]}
              value={nav}
              onChange={setNav}
              menuTarget="catalog-shell-menu"
            />
          </AppShell>
        </div>
      </Section>

      <Section eyebrow="05" title="Page layout">
        <div className="catalog-component-frame">
          <Page width="md">
            <Breadcrumbs
              items={[
                {label: 'Catalog', href: '#'},
                {label: 'uber.com', href: '#'},
                {label: 'uber-earnings'},
              ]}
            />
            <PageHeader
              eyebrow="Build"
              title="uber-earnings"
              meta={
                <>
                  <KindTag>Provider</KindTag>
                  <span>v14 · live · owned by Reclaim</span>
                </>
              }
              actions={
                <>
                  <Button size="md">Test this provider</Button>
                  <Button size="md" variant="secondary">
                    Fork to Acme Identity
                  </Button>
                </>
              }
            />
            <div className="rc-stack" data-gap="sm">
              <SearchBar
                size="lg"
                placeholder="Search a site, or what you need to verify"
                aria-label="Search the catalog"
                count="1,284 providers"
              />
              <div className="rc-cluster">
                <span className="rc-label">Tags</span>
                {['all', 'banking', 'gig work', 'education'].map(name => (
                  <Chip
                    key={name}
                    selected={tag === name}
                    onClick={() => setTag(name)}
                  >
                    {name}
                  </Chip>
                ))}
                <Chip variant="add">More tags · 38</Chip>
              </div>
              <div className="rc-cluster">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra large</Button>
                <Button size="md" variant="destructive">
                  Unpublish
                </Button>
                <Button variant="inline">Open verifications</Button>
                <Button variant="inline" data-tone="danger">
                  Delete
                </Button>
                <Button
                  variant="inline"
                  size="sm"
                  data-icon-only=""
                  aria-label="More actions"
                  data-testid="catalog-icon-only"
                >
                  <Icon name="more" />
                </Button>
              </div>
              <Card className="rc-stack">
                <h3 className="rc-plan__name">Provider settings</h3>
                <FieldGrid
                  rows={[
                    {
                      id: 'catalog-title',
                      label: 'Title',
                      control: (
                        <input
                          id="catalog-title"
                          className="rc-input"
                          defaultValue="Uber driver earnings"
                        />
                      ),
                      hint: 'Shown in the catalog and in SEO.',
                    },
                    {
                      id: 'catalog-description',
                      label: 'Description',
                      control: (
                        <textarea
                          id="catalog-description"
                          className="rc-textarea"
                          defaultValue="Verifies weekly earnings and lifetime trips from a driver's own Uber account."
                        />
                      ),
                    },
                    {
                      id: 'catalog-visibility',
                      label: 'Visibility',
                      control: (
                        <SegmentedControl
                          label="Visibility"
                          value={visibility}
                          onChange={setVisibility}
                          options={[
                            {value: 'public', label: 'Public'},
                            {value: 'private', label: 'Private'},
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              </Card>
              <div className="rc-cluster">
                <InputGroup caption="provider">
                  <input placeholder="any" aria-label="Provider" />
                  <Icon name="chevronDown" />
                </InputGroup>
                <InputGroup accent>
                  <input
                    type="date"
                    defaultValue="2026-08-06"
                    aria-label="From"
                  />
                  <span className="rc-input-group__sep">→</span>
                  <input
                    type="date"
                    defaultValue="2026-09-03"
                    aria-label="Through"
                  />
                </InputGroup>
                <InputGroup accent caption="from">
                  <input
                    type="datetime-local"
                    defaultValue="2026-09-02T09:00"
                    aria-label="From time"
                  />
                </InputGroup>
                <span className="rc-filter-toolbar__results">
                  29h 30m · times are UTC
                </span>
              </div>
              <FilterToolbar>
                <FilterRow>
                  <span className="rc-label">Period</span>
                  <SegmentedControl
                    label="Period"
                    value={period}
                    onChange={setPeriod}
                    options={[
                      {value: '7', label: 'Last 7 days'},
                      {value: '30', label: 'Last 30 days'},
                      {value: '90', label: 'Last 90 days'},
                    ]}
                  />
                </FilterRow>
              </FilterToolbar>
              <div className="rc-cluster">
                <Button onClick={() => setDialogOpen(true)}>
                  Open a small dialog
                </Button>
              </div>
              <div className="rc-cluster">
                <StatusPill tone="verified">verified</StatusPill>
                <StatusPill tone="pending">pending</StatusPill>
                <StatusPill tone="failed">failed</StatusPill>
                <StatusPill tone="sandbox">sandbox</StatusPill>
                <StatusPill tone="verified" dot>
                  with dot
                </StatusPill>
                <StatusPill>neutral</StatusPill>
              </div>
            </div>
          </Page>
        </div>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          size="sm"
          title="Update your name"
          description="Shown on versions you publish and reviews you leave."
          footer={
            <>
              <Button
                size="md"
                variant="secondary"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button size="md" onClick={() => setDialogOpen(false)}>
                Save
              </Button>
            </>
          }
        >
          <Field label="Name" defaultValue="Rohan Sharma" />
        </Dialog>
      </Section>

      <Section eyebrow="06" title="Tables and cards">
        <div className="rc-stack" data-gap="sm">
          <div className="rc-kpi-grid">
            <Kpi
              label="Verifications"
              value="128,441"
              delta="+12.4% vs previous"
            />
            <Kpi label="Success rate" value="97.2%" delta="+0.6 pts" />
            <Kpi label="Active providers" value="42" delta="3 degraded" />
            <Kpi label="p50 proof time" value="4.8 s" delta="−0.4 s" />
          </div>
          <div
            className="rc-grid"
            style={{'--rc-grid-min': '340px'} as CSSProperties}
          >
            <ChartFrame
              title="Verification volume"
              meta="Last 30 days · hourly buckets"
            >
              <BarChart data={volume} height={150} />
            </ChartFrame>
            <ChartFrame title="Completion rate" meta="daily" kind="area">
              <AreaChart data={completion} height={140} />
            </ChartFrame>
          </div>
          <ChartFrame title="Top drop-off reasons" kind="funnel">
            <FunnelChart data={dropOff} />
          </ChartFrame>
          <SectionCard
            title="Verifications"
            count="3"
            action="last 30 days"
            footer={<Button variant="inline">Download invoices</Button>}
          >
            <DataTable
              caption="Verification sessions"
              activeKey={activeSession}
              columns={[
                {
                  key: 'id',
                  label: 'Session',
                  render: row => (
                    <button
                      type="button"
                      className="rc-button"
                      data-variant="inline"
                      onClick={() => setActiveSession(row.id)}
                    >
                      {row.id}
                    </button>
                  ),
                },
                {
                  key: 'provider',
                  label: 'Provider',
                  render: row => row.provider,
                },
                {
                  key: 'proofs',
                  label: 'Proofs',
                  align: 'end',
                  render: row => row.proofs,
                },
                {
                  key: 'state',
                  label: 'Status',
                  render: row => (
                    <StatusPill
                      tone={row.state === 'ok' ? 'verified' : 'failed'}
                    >
                      {row.state === 'ok' ? 'Verified' : 'Failed'}
                    </StatusPill>
                  ),
                },
              ]}
              rows={sessions}
              getRowKey={row => row.id}
            />
          </SectionCard>
          <div className="rc-grid" data-align="start">
            <Card data-density="compact">
              <MetadataList
                keyWidth="104px"
                items={[
                  {label: 'viewing', value: 'v15 · pending review'},
                  {
                    label: 'initial url',
                    value: 'https://drivers.uber.com/earnings',
                  },
                  {label: 'shadow tests', value: '3 passed'},
                ]}
              />
            </Card>
            <CodeBlock
              label="Request body template"
              code={'{\n  "range": "{{ range }}",\n  "currency": "AUD"\n}'}
              onCopy={() => undefined}
            />
          </div>
          <div className="rc-grid" data-align="start">
            <Card data-spec>
              <p className="rc-lede">
                Each thing you can verify belongs to the website. A provider
                extracts it and belongs to an organization.
              </p>
            </Card>
            <Hint title="Ask the assistant to propose a fix">
              It reads the transcript, asks what it cannot infer, and proposes a
              new provider version for review.
            </Hint>
            <EmptyState
              action={<Button variant="inline">Clear the filters</Button>}
            >
              Nothing matches that.
            </EmptyState>
          </div>
          <BlockingWarning
            title="No token issued for Acme Identity"
            action={<Button size="md">Open Connect your app</Button>}
          >
            Every call authenticates with a bearer token, so issue one first.
          </BlockingWarning>
          <ExpansionTile
            title="Weekly earnings"
            summary="Total paid out over the last 7 days"
            trail={
              <>
                <StatusPill tone="verified">public</StatusPill>
                <StatusPill tone="failed">needs a fix</StatusPill>
              </>
            }
          >
            <CodeBlock label="Request" code="GET /api/earnings/weekly" />
          </ExpansionTile>
          <div className="rc-stack" data-gap="sm">
            <ChoiceRow
              type="checkbox"
              checked={options.weekly}
              onChange={weekly => setOptions(current => ({...current, weekly}))}
              title="Weekly earnings"
              description="Total paid out over the last 7 days"
              trailing={<StatusPill tone="verified">public</StatusPill>}
            />
            <ChoiceRow
              type="checkbox"
              checked={options.trips}
              onChange={trips => setOptions(current => ({...current, trips}))}
              title="Lifetime trips"
              description="Completed trips on the account"
              trailing={
                <StatusPill tone="pending">not available yet</StatusPill>
              }
            />
            <ChoiceRow
              type="radio"
              name="catalog-policy"
              checked={policy === 'review'}
              onChange={() => setPolicy('review')}
              title="Owner reviews every version"
              description="Fixes queue until an admin merges them."
            />
            <ChoiceRow
              type="radio"
              name="catalog-policy"
              checked={policy === 'auto'}
              onChange={() => setPolicy('auto')}
              code="AU"
              title="Australia"
              trailing={<span className="rc-label">1,284 providers</span>}
            />
            <label className="rc-choice-row" data-variant="add">
              <Icon name="plus" />
              <span className="rc-choice-row__content">
                <strong>Something else on uber.com</strong>
              </span>
            </label>
          </div>
        </div>
      </Section>

      <Section eyebrow="07" title="Usage and plans">
        <div className="rc-stack" data-gap="sm">
          <div className="rc-grid" data-align="start">
            <PoolCard
              label="Verifications"
              overage="$0.50 overage"
              used="8,420"
              limit="10,000"
              value={84}
              note="Resets on 1 Oct"
            />
            <PoolCard
              label="zkFetches"
              overage="$0.02 overage"
              used="47,900"
              limit="50,000"
              value={96}
              tone="danger"
              note="Nearly exhausted"
            />
          </div>
          <Card>
            <div className="rc-cluster">
              <CircularProgress
                value={58}
                label="58"
                sublabel="/ 100"
                tone="warning"
              />
              <div className="rc-stack" data-gap="sm">
                <LinearProgress
                  label="Reliability"
                  valueLabel="12 / 40"
                  value={30}
                  tone="danger"
                  note="62.4% of runs produced a proof over the last 30 days."
                />
                <LinearProgress
                  label="Latency"
                  valueLabel="30 / 40"
                  value={75}
                  tone="warning"
                />
                <LinearProgress
                  label="Coverage"
                  valueLabel="20 / 20"
                  value={100}
                />
              </div>
            </div>
          </Card>
          <div className="rc-plan-grid">
            <PlanCard
              name="Free"
              amount="$0"
              period="/ month"
              tagline="For trying Reclaim."
              features={[
                '500 verifications',
                '1,000 zkFetches',
                'Community support',
              ]}
              action={
                <Button size="lg" fullWidth variant="secondary" disabled>
                  Current plan
                </Button>
              }
              current
              badge="Current"
            />
            <PlanCard
              name="Scale"
              amount="$1,200"
              period="/ month"
              tagline="For production traffic."
              features={[
                '10,000 verifications',
                '50,000 zkFetches',
                'Priority support',
              ]}
              action={
                <Button size="lg" fullWidth>
                  Upgrade
                </Button>
              }
              badge="Popular"
              featured
            />
            <PlanCard
              name="Enterprise"
              amount="Custom"
              tagline="Volume and on-prem terms."
              features={['Custom limits', 'Dedicated support']}
              action={
                <a
                  className="rc-button"
                  data-size="lg"
                  data-width="full"
                  href="mailto:support@reclaimprotocol.org"
                >
                  Contact us
                </a>
              }
            />
          </div>
        </div>
      </Section>

      <Section eyebrow="08" title="Activity and people">
        <div className="rc-split">
          <div className="rc-stack" data-gap="sm">
            <SectionCard title="Events" count="3">
              <EventTimeline
                events={events}
                openId={openEvent}
                onOpenChange={setOpenEvent}
              />
            </SectionCard>
            <SectionCard title="Callback deliveries" count="2">
              <div className="rc-list-row">
                <div className="rc-list-row__main">
                  <strong>
                    <StatusPill tone="verified">200</StatusPill> attempt 1
                  </strong>
                  <small data-mono>https://api.acme.com/reclaim/callback</small>
                </div>
                <div className="rc-list-row__trail">
                  <span className="rc-card__meta">14:02:11</span>
                </div>
              </div>
              <div className="rc-list-row">
                <div className="rc-list-row__main">
                  <strong>
                    <StatusPill tone="failed">500</StatusPill> attempt 2
                  </strong>
                  <small data-mono>https://api.acme.com/reclaim/callback</small>
                </div>
                <div className="rc-list-row__trail">
                  <span className="rc-card__meta">14:07:11</span>
                </div>
              </div>
            </SectionCard>
          </div>
          <Card data-density="compact" data-layout="column">
            <PanelTitle title="Roles" />
            <MetadataList
              items={[
                {
                  label: 'Owner',
                  value: 'Manages the organization and members.',
                },
                {label: 'Invited', value: 'Pending until they sign in.'},
              ]}
            />
          </Card>
        </div>
        <div className="rc-stack" data-gap="sm">
          <SectionCard title="Members" count="3">
            <DataTable
              caption="Members"
              columns={[
                {
                  key: 'member',
                  label: 'Member',
                  render: row => (
                    <PersonRow
                      initials={row.initials}
                      name={row.name}
                      detail={row.detail}
                      tone={
                        row.id === 'priya'
                          ? 'outline'
                          : row.id === 'sam'
                            ? 'pending'
                            : undefined
                      }
                    />
                  ),
                },
                {
                  key: 'role',
                  label: 'Role',
                  render: row => (row.id === 'rohan' ? 'Owner' : 'Member'),
                },
                {
                  key: 'status',
                  label: 'Status',
                  align: 'end',
                  render: row =>
                    row.id === 'sam' ? (
                      <StatusPill tone="pending">pending</StatusPill>
                    ) : (
                      <Button variant="inline">Manage</Button>
                    ),
                },
              ]}
              rows={people}
              getRowKey={row => row.id}
            />
          </SectionCard>
          <Card data-layout="row">
            <div>
              <h3 className="rc-plan__name">Theme</h3>
              <p className="rc-lede">Pass a theme id to create a session.</p>
            </div>
            <span className="rc-swatch" style={{background: '#0000EE'}} />
            <Avatar initials="A" size="lg" shape="square" />
            <Avatar initials="SK" size="sm" />
          </Card>
          <Card data-layout="row" data-tone="danger">
            <div>
              <h3>Delete organization</h3>
              <p className="rc-lede">
                Providers owned by Acme Identity are unpublished. This cannot be
                undone.
              </p>
            </div>
            <Button variant="destructive">Delete</Button>
          </Card>
        </div>
      </Section>

      <Section eyebrow="10" title="Popovers and copy">
        <Card>
          <div className="rc-cluster">
            <button
              type="button"
              className="rc-button"
              data-size="md"
              popoverTarget="catalog-native-menu"
            >
              Native menu
              <Icon name="chevronDown" className="rc-button__trailing" />
            </button>
            <div
              className="rc-dropdown__menu"
              id="catalog-native-menu"
              popover="auto"
            >
              <div className="rc-dropdown__label">Export as CSV</div>
              <button type="button" role="menuitem">
                Sessions<small>1,284</small>
              </button>
              <hr />
              <p className="rc-dropdown__help">Uses the current period.</p>
            </div>
            <span id="catalog-copy-source" className="rc-code">
              rorg_example_token
            </span>
            <button
              type="button"
              className="rc-button"
              data-size="sm"
              data-copy
              data-copy-source="#catalog-copy-source"
            >
              <span data-copy-idle>Copy</span>
              <span data-copy-done>Copied</span>
            </button>
          </div>
        </Card>
      </Section>

      <Section eyebrow="09" title="Icons">
        <Card>
          <div className="catalog-icon-grid">
            {iconNames.map(name => (
              <div className="catalog-icon-cell" key={name}>
                <Icon name={name} />
                <span>{name}</span>
              </div>
            ))}
          </div>
          <div className="rc-cluster">
            <Wordmark />
            <span className="rc-muted">
              rc-wordmark follows the text colour in both themes.
            </span>
          </div>
        </Card>
      </Section>
    </>
  );
}
