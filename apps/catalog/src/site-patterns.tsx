import {useEffect, useState, type CSSProperties} from 'react';
import {
  createComboboxController,
  showToast,
} from '@reclaimprotocol/design/behaviors';
import {Section} from './catalog-section';
import {
  Button,
  Card,
  ChartFrame,
  Icon,
  PersonRow,
  SectionCard,
  StatusIndicator,
  StatusPill,
  Wordmark,
} from './design-components';

const rMark = new URL('../../../assets/brand/r-mark-tile.png', import.meta.url)
  .href;

const closedBy: Record<string, string> = {closedby: 'any'};
const outcomes = [
  {name: 'succeeded', tone: 'primary'},
  {name: 'failed', tone: 'danger'},
  {name: 'pending', tone: 'muted'},
] as const;
const days = [
  ['05 Sep', 38, 4, 2],
  ['06 Sep', 52, 8, 3],
  ['07 Sep', 45, 3, 3],
  ['08 Sep', 70, 5, 2],
  ['09 Sep', 60, 6, 2],
  ['10 Sep', 81, 4, 3],
] as const;
const top = 100;
const trend = [73, 76, 75, 82, 81, 88];
const reasons = [
  ['Signed out', 46, 46],
  ['Page changed', 31, 31],
  ['Timed out', 14, 14],
] as const;

function BarChartExample() {
  return (
    <div className="rc-chart-plot">
      <ol className="rc-chart-plot__ticks">
        {[100, 75, 50, 25, 0].map(tick => (
          <li key={tick}>{tick}</li>
        ))}
      </ol>
      <div className="rc-chart-plot__area">
        <ol className="rc-bar-chart" aria-label="Verifications per day">
          {days.map(([label, ...values]) => {
            const title = `${label}: ${values
              .map((value, index) => `${value} ${outcomes[index].name}`)
              .join(', ')}`;
            return (
              <li key={label} tabIndex={0} title={title}>
                <span className="rc-visually-hidden">{title}</span>
                {values.map((value, index) => (
                  <span
                    key={outcomes[index].name}
                    data-tone={outcomes[index].tone}
                    style={{blockSize: `${(value / top) * 100}%`}}
                  />
                ))}
              </li>
            );
          })}
        </ol>
      </div>
      <ol className="rc-chart-plot__labels">
        {days.map(([label]) => (
          <li key={label}>{label}</li>
        ))}
      </ol>
    </div>
  );
}

function AreaChartExample() {
  const points = trend.map((value, index) => ({
    x: (index / (trend.length - 1)) * 100,
    y: 100 - value,
    value,
  }));
  const line = points
    .map(({x, y}, index) => `${index ? 'L' : 'M'}${x} ${y}`)
    .join(' ');
  return (
    <div className="rc-chart-plot">
      <ol className="rc-chart-plot__ticks">
        {['100%', '75%', '50%', '25%', '0%'].map(tick => (
          <li key={tick}>{tick}</li>
        ))}
      </ol>
      <div className="rc-chart-plot__area">
        <svg
          className="rc-area-chart"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label="Completion rate"
        >
          <path
            className="rc-area-chart__fill"
            d={`${line} L100 100 L0 100 Z`}
          />
          <path className="rc-area-chart__line" d={line} />
        </svg>
        <ol className="rc-area-chart__points">
          {points.map(({x, y, value}, index) => (
            <li
              key={index}
              tabIndex={0}
              style={{insetInlineStart: `${x}%`, insetBlockStart: `${y}%`}}
              title={`${days[index][0]}: ${value}%`}
            >
              <span className="rc-visually-hidden">
                {`${days[index][0]}: ${value}%`}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <ol className="rc-chart-plot__labels">
        {days.map(([label]) => (
          <li key={label}>{label}</li>
        ))}
      </ol>
    </div>
  );
}

function SplitBars() {
  const longest = Math.max(...reasons.map(([, , total]) => total));
  return (
    <ol className="rc-bar-list" aria-label="Top drop-off reasons">
      {reasons.map(([label, failed, total]) => (
        <li key={label} title={`${label}: ${total}`}>
          <span className="rc-bar-list__label">{label}</span>
          <span className="rc-bar-list__track">
            <span
              className="rc-bar-list__bar"
              style={{'--share': total / longest} as CSSProperties}
            >
              <span data-tone="danger" style={{flexGrow: failed}} />
              <span data-tone="muted" style={{flexGrow: total - failed}} />
            </span>
            <span className="rc-bar-list__value">{total}%</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function SitePatterns() {
  const [saved, setSaved] = useState('');
  useEffect(() => {
    const controller = createComboboxController(document);
    return () => controller.destroy();
  }, []);
  const openDialog = (id: string) =>
    document.querySelector<HTMLDialogElement>(`#${id}`)?.showModal();
  return (
    <>
      <Section eyebrow="11" title="Site pages">
        <div className="rc-stack" data-gap="sm">
          <div className="catalog-site-specimen">
            <header className="rc-app-bar" data-sticky>
              <a
                className="rc-app-bar__brand"
                href="#section-site-pages"
                aria-label="Reclaim home"
              >
                <img src={rMark} alt="" />
                <Wordmark />
              </a>
              <nav className="rc-app-bar__nav" aria-label="Site">
                <a className="rc-nav-link" href="#section-site-pages">
                  <span>Providers</span>
                </a>
                <a
                  className="rc-nav-link"
                  href="#section-site-pages"
                  aria-current="page"
                >
                  <span>Websites</span>
                </a>
              </nav>
              <div className="rc-app-bar__actions">
                <Button size="sm" data-hide-compact>
                  Docs
                </Button>
                <a
                  className="rc-button"
                  data-variant="primary"
                  data-size="sm"
                  href="#section-site-pages"
                >
                  Sign in
                </a>
              </div>
            </header>
          </div>
          <div className="rc-notice catalog-notice">
            <section className="rc-card">
              <span className="rc-eyebrow">Link expired</span>
              <h1>This link is no longer valid</h1>
              <p>Ask the sender for a new link, or sign in to continue.</p>
              <div className="rc-notice__actions">
                <a
                  className="rc-button"
                  data-variant="primary"
                  href="#section-site-pages"
                >
                  Sign in
                </a>
                <a className="rc-button" href="#section-site-pages">
                  Go home
                </a>
              </div>
            </section>
          </div>
          <div className="rc-flow-shell catalog-flow-header">
            <header className="rc-flow-shell__header">
              <img className="rc-flow-shell__mark" src={rMark} alt="" />
              <strong className="rc-flow-shell__title">Contribute</strong>
              <span className="rc-flow-shell__subject">
                Uber trip history for a verification with a very long subject
                that gets clipped
              </span>
              <a
                className="rc-button"
                data-size="sm"
                href="#section-site-pages"
              >
                Help
              </a>
            </header>
          </div>
        </div>
      </Section>

      <Section eyebrow="12" title="Website cards">
        <div className="rc-stack" data-gap="sm">
          <form
            className="rc-selection-bar"
            data-testid="catalog-selection-bar"
            onSubmit={event => event.preventDefault()}
          >
            <p>
              <strong>2 websites selected</strong>
              <small>
                Build one provider from the data points you pick.{' '}
                <a href="#section-website-cards">Clear selection</a>
              </small>
            </p>
            <Button variant="primary" type="submit">
              Build provider
            </Button>
          </form>
          <ul className="rc-grid">
            <li>
              <a
                className="rc-card rc-link-card"
                data-glass
                href="#section-website-cards"
              >
                <span className="rc-link-card__head">
                  <strong>uber.com</strong>
                  <small>6 points</small>
                </span>
                <span className="rc-link-card__sub">
                  Ride history and receipts
                </span>
                <ul className="rc-link-card__points">
                  <li>Trip count</li>
                  <li>Total spend</li>
                </ul>
                <span className="rc-link-card__foot" data-tone="danger">
                  <span>Failing</span>
                  <span>3 providers</span>
                </span>
              </a>
            </li>
            <li>
              <a
                className="rc-card rc-link-card"
                data-glass
                data-variant="add"
                href="#section-website-cards"
              >
                <strong>Add a website</strong>
                <small>Describe it and let the agent build providers.</small>
              </a>
            </li>
          </ul>
          <p className="rc-source-note">
            <Icon name="shieldCheck" />
            <strong>Verified source</strong>
            <small>Data points come from the site&apos;s own pages.</small>
          </p>
          <div className="rc-table-scroll" data-bordered>
            <table className="rc-table">
              <caption className="rc-visually-hidden">Recent sessions</caption>
              <thead>
                <tr>
                  <th scope="col">Session</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <PersonRow
                      initials="AI"
                      name="Acme Identity"
                      detail="acme.example"
                      href="#section-website-cards"
                    />
                  </td>
                  <td>
                    <StatusPill tone="verified" dot>
                      Verified
                    </StatusPill>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <SectionCard title="Billing" plainHeader count="2">
            <div className="rc-card__body">
              <div className="rc-cluster" data-testid="catalog-readiness">
                <StatusIndicator tone="verified" chip>
                  Token issued
                </StatusIndicator>
                <StatusIndicator tone="pending" chip>
                  Callback needed
                </StatusIndicator>
                <StatusIndicator tone="optional" chip>
                  Encryption
                </StatusIndicator>
              </div>
            </div>
          </SectionCard>
          <Card>
            <div
              className="rc-combobox"
              data-combobox
              data-testid="catalog-vanilla-combobox"
            >
              <label
                className="rc-field__label"
                htmlFor="catalog-vanilla-input"
              >
                Provider
              </label>
              <div className="rc-combobox__control">
                <input
                  id="catalog-vanilla-input"
                  className="rc-input"
                  role="combobox"
                  aria-expanded="false"
                  aria-controls="catalog-vanilla-list"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="rc-combobox__trigger"
                  aria-label="Toggle providers"
                >
                  <Icon name="chevronDown" />
                </button>
              </div>
              <div
                className="rc-combobox__listbox"
                id="catalog-vanilla-list"
                role="listbox"
                aria-label="Provider"
                hidden
              >
                <button type="button" role="option">
                  uber-trips
                </button>
                <button type="button" role="option">
                  github-profile
                </button>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section eyebrow="13" title="Server rendered charts">
        <div className="rc-stack" data-gap="sm">
          <div
            className="rc-grid"
            style={{'--rc-grid-min': '340px'} as CSSProperties}
          >
            <ChartFrame
              title="Verifications per day"
              meta={
                <span className="rc-chart-legend">
                  {outcomes.map(({name, tone}) => (
                    <span key={name} data-tone={tone}>
                      {name}
                    </span>
                  ))}
                </span>
              }
            >
              <BarChartExample />
            </ChartFrame>
            <ChartFrame title="Completion rate" kind="area">
              <AreaChartExample />
            </ChartFrame>
          </div>
          <ChartFrame title="Top drop-off reasons" kind="funnel">
            <SplitBars />
          </ChartFrame>
        </div>
      </Section>

      <Section eyebrow="14" title="Dialog forms and toasts">
        <Card>
          <div className="rc-cluster">
            <Button onClick={() => openDialog('catalog-method-dialog')}>
              Method dialog form
            </Button>
            <Button onClick={() => openDialog('catalog-linked-dialog')}>
              Footer linked form
            </Button>
            <Button
              onClick={() =>
                showToast('The callback endpoint did not answer.', {
                  tone: 'danger',
                  title: 'Callback failed',
                  placement: 'bottom-right',
                })
              }
            >
              Show package toast
            </Button>
            <span className="rc-muted" data-testid="catalog-dialog-output">
              {saved}
            </span>
          </div>
        </Card>
        <dialog
          id="catalog-method-dialog"
          className="rc-dialog"
          data-size="sm"
          aria-labelledby="catalog-method-title"
          {...closedBy}
        >
          <form method="dialog">
            <div className="rc-dialog__header">
              <div>
                <h2 id="catalog-method-title">Rename provider</h2>
              </div>
            </div>
            <div className="rc-dialog__body">
              <label className="rc-field">
                <span className="rc-field__label">Name</span>
                <input className="rc-input" defaultValue="uber-trips" />
              </label>
            </div>
            <div className="rc-dialog__footer">
              <button className="rc-button" value="cancel" formNoValidate>
                Cancel
              </button>
              <button
                className="rc-button"
                data-variant="primary"
                value="save"
                onClick={() => setSaved('Saved by method dialog')}
              >
                Save
              </button>
            </div>
          </form>
        </dialog>
        <dialog
          id="catalog-linked-dialog"
          className="rc-dialog"
          data-size="sm"
          aria-labelledby="catalog-linked-title"
          {...closedBy}
        >
          <div className="rc-dialog__header">
            <div>
              <h2 id="catalog-linked-title">Callback URL</h2>
            </div>
          </div>
          <div className="rc-dialog__body">
            <form
              id="catalog-linked-form"
              onSubmit={event => {
                event.preventDefault();
                setSaved('Saved by linked form');
                document
                  .querySelector<HTMLDialogElement>('#catalog-linked-dialog')
                  ?.close();
              }}
            >
              <label className="rc-field">
                <span className="rc-field__label">URL</span>
                <input
                  className="rc-input"
                  type="url"
                  required
                  defaultValue="https://example.com/hook"
                />
              </label>
            </form>
          </div>
          <div className="rc-dialog__footer">
            <button
              className="rc-button"
              type="button"
              onClick={() =>
                document
                  .querySelector<HTMLDialogElement>('#catalog-linked-dialog')
                  ?.close()
              }
            >
              Cancel
            </button>
            <button
              className="rc-button"
              data-variant="primary"
              type="submit"
              form="catalog-linked-form"
            >
              Save
            </button>
          </div>
        </dialog>
      </Section>
    </>
  );
}
