import {
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

export type ChartDatum = {
  label: string;
  value: number;
  secondary?: number;
  display?: string;
};
export type InteractiveChartProps = {
  selectedIndex?: number | null;
  onSelect?: (datum: ChartDatum, index: number) => void;
};

type ChartFrameProps = {
  children: ReactNode;
  height?: number;
  label: string;
};

function Frame({children, height = 176, label}: ChartFrameProps) {
  return (
    <div
      className="catalog-chart"
      role="group"
      aria-label={label}
      style={{'--chart-height': `${height}px`} as CSSProperties}
    >
      {children}
    </div>
  );
}

function Grid({width = 400, height = 132}: {width?: number; height?: number}) {
  return (
    <g className="catalog-chart__grid">
      {[0.12, 0.38, 0.64, 0.9].map(ratio => (
        <line
          key={ratio}
          x1="0"
          x2={width}
          y1={height * ratio}
          y2={height * ratio}
        />
      ))}
    </g>
  );
}

function activateKey(event: KeyboardEvent<SVGGElement>, activate: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    activate();
  }
}

function Tooltip({x, y, text}: {x: number; y: number; text: string}) {
  const width = Math.max(76, Math.min(150, text.length * 6.2 + 16));
  const safeX = Math.max(2, Math.min(398 - width, x - width / 2));
  return (
    <g
      className="catalog-chart__tooltip"
      transform={`translate(${safeX} ${Math.max(2, y - 29)})`}
      aria-hidden="true"
    >
      <rect width={width} height="24" rx="2" />
      <text x="8" y="16">
        {text}
      </text>
    </g>
  );
}

/** Local SVG implementation of the reference's interactive mono bar chart. */
export function BarChart({
  data,
  height,
  label = 'Verification volume',
  selectedIndex,
  onSelect,
}: {
  data: ChartDatum[];
  height?: number;
  label?: string;
} & InteractiveChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const active = hovered ?? selectedIndex ?? internalSelected;
  const width = 400;
  const plotHeight = 126;
  const max = Math.max(
    1,
    ...data.flatMap(item => [item.value, item.secondary ?? 0]),
  );
  const gap = 9;
  const barWidth = Math.max(5, (width - gap * (data.length - 1)) / data.length);
  return (
    <Frame height={height} label={label}>
      <svg viewBox={`0 0 ${width} 158`} preserveAspectRatio="none">
        <Grid height={plotHeight} />
        {data.map((item, index) => {
          const x = index * (barWidth + gap);
          const h = (item.value / max) * plotHeight;
          const secondary = ((item.secondary ?? 0) / max) * plotHeight;
          const activate = () => {
            setInternalSelected(index);
            onSelect?.(item, index);
          };
          return (
            <g
              key={item.label}
              className="catalog-chart__series"
              data-active={active === index || undefined}
              tabIndex={0}
              role="button"
              aria-label={`${item.label}: ${item.display ?? item.value}`}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              onClick={activate}
              onKeyDown={event => activateKey(event, activate)}
            >
              {secondary > 0 && (
                <rect
                  className="catalog-chart__bar catalog-chart__bar--muted"
                  x={x}
                  y={plotHeight - secondary}
                  width={barWidth}
                  height={secondary}
                  rx="2"
                />
              )}
              <rect
                className="catalog-chart__bar"
                x={x}
                y={plotHeight - h}
                width={barWidth}
                height={h}
                rx="2"
              />
              {(index === 0 ||
                index === data.length - 1 ||
                index === Math.floor(data.length / 2)) && (
                <text x={x + barWidth / 2} y="151" textAnchor="middle">
                  {item.label}
                </text>
              )}
              {active === index && (
                <Tooltip
                  x={x + barWidth / 2}
                  y={plotHeight - h}
                  text={`${item.label} · ${item.display ?? item.value}`}
                />
              )}
            </g>
          );
        })}
      </svg>
    </Frame>
  );
}

/** Local SVG implementation of the reference's interactive monotone area chart. */
export function AreaChart({
  data,
  height,
  label = 'Completion rate',
  selectedIndex,
  onSelect,
}: {
  data: ChartDatum[];
  height?: number;
  label?: string;
} & InteractiveChartProps) {
  const gradientId = `catalog-area-fill-${useId().replaceAll(':', '')}`;
  const [hovered, setHovered] = useState<number | null>(null);
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const active = hovered ?? selectedIndex ?? internalSelected;
  const width = 400;
  const plotHeight = 126;
  const max = Math.max(1, ...data.map(item => item.value));
  const points = data.map((item, index) => {
    const x =
      data.length === 1 ? width / 2 : index * (width / (data.length - 1));
    return [x, plotHeight - (item.value / max) * plotHeight] as const;
  });
  const line = points
    .map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`)
    .join(' ');
  const area = `${line} L${width} ${plotHeight} L0 ${plotHeight} Z`;
  return (
    <Frame height={height} label={label}>
      <svg viewBox={`0 0 ${width} 158`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0"
              className="catalog-chart__stop"
              stopOpacity=".24"
            />
            <stop offset="1" className="catalog-chart__stop" stopOpacity="0" />
          </linearGradient>
        </defs>
        <Grid height={plotHeight} />
        <path
          className="catalog-chart__area"
          d={area}
          style={{fill: `url(#${gradientId})`}}
        />
        <path className="catalog-chart__line" d={line} />
        {data.map((item, index) => {
          const activate = () => {
            setInternalSelected(index);
            onSelect?.(item, index);
          };
          return (
            <g
              key={`${item.label}-point`}
              className="catalog-chart__series catalog-chart__point"
              data-active={active === index || undefined}
              tabIndex={0}
              role="button"
              aria-label={`${item.label}: ${item.display ?? item.value}`}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              onClick={activate}
              onKeyDown={event => activateKey(event, activate)}
            >
              <circle
                className="catalog-chart__point-hit"
                cx={points[index][0]}
                cy={points[index][1]}
                r="12"
              />
              <circle
                className="catalog-chart__point-mark"
                cx={points[index][0]}
                cy={points[index][1]}
                r="4"
              />
              {active === index && (
                <Tooltip
                  x={points[index][0]}
                  y={points[index][1]}
                  text={`${item.label} · ${item.display ?? item.value}`}
                />
              )}
            </g>
          );
        })}
        {data.map(
          (item, index) =>
            (index === 0 ||
              index === data.length - 1 ||
              index === Math.floor(data.length / 2)) && (
              <text
                key={item.label}
                x={points[index][0]}
                y="151"
                textAnchor="middle"
              >
                {item.label}
              </text>
            ),
        )}
      </svg>
    </Frame>
  );
}

/** Interactive monotone line chart for trends where an area fill would imply volume. */
export function LineChart({
  data,
  height,
  label = 'Trend',
  selectedIndex,
  onSelect,
}: {
  data: ChartDatum[];
  height?: number;
  label?: string;
} & InteractiveChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const active = hovered ?? selectedIndex ?? internalSelected;
  const width = 400;
  const plotHeight = 126;
  const max = Math.max(1, ...data.map(item => item.value));
  const points = data.map(
    (item, index) =>
      [
        data.length === 1 ? width / 2 : index * (width / (data.length - 1)),
        plotHeight - (item.value / max) * plotHeight,
      ] as const,
  );
  const line = points
    .map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`)
    .join(' ');
  return (
    <Frame height={height} label={label}>
      <svg viewBox={`0 0 ${width} 158`} preserveAspectRatio="none">
        <Grid height={plotHeight} />
        <path className="catalog-chart__line" d={line} />
        {data.map((item, index) => {
          const activate = () => {
            setInternalSelected(index);
            onSelect?.(item, index);
          };
          return (
            <g
              key={item.label}
              className="catalog-chart__series catalog-chart__point"
              data-chart-type="line"
              data-active={active === index || undefined}
              tabIndex={0}
              role="button"
              aria-label={`${item.label}: ${item.display ?? item.value}`}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              onClick={activate}
              onKeyDown={event => activateKey(event, activate)}
            >
              <circle
                className="catalog-chart__point-hit"
                cx={points[index][0]}
                cy={points[index][1]}
                r="12"
              />
              <circle
                className="catalog-chart__point-mark"
                cx={points[index][0]}
                cy={points[index][1]}
                r="4"
              />
              {active === index && (
                <Tooltip
                  x={points[index][0]}
                  y={points[index][1]}
                  text={`${item.label} · ${item.display ?? item.value}`}
                />
              )}
            </g>
          );
        })}
        {data.map(
          (item, index) =>
            (index === 0 ||
              index === data.length - 1 ||
              index === Math.floor(data.length / 2)) && (
              <text
                key={item.label}
                x={points[index][0]}
                y="151"
                textAnchor="middle"
              >
                {item.label}
              </text>
            ),
        )}
      </svg>
    </Frame>
  );
}

const polar = (cx: number, cy: number, radius: number, angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [
    cx + radius * Math.cos(radians),
    cy + radius * Math.sin(radians),
  ] as const;
};

const ringPath = (
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number,
) => {
  const outerStart = polar(cx, cy, outer, start),
    outerEnd = polar(cx, cy, outer, end);
  const innerEnd = polar(cx, cy, inner, end),
    innerStart = polar(cx, cy, inner, start);
  const large = end - start > 180 ? 1 : 0;
  return `M${outerStart[0]} ${outerStart[1]} A${outer} ${outer} 0 ${large} 1 ${outerEnd[0]} ${outerEnd[1]} L${innerEnd[0]} ${innerEnd[1]} A${inner} ${inner} 0 ${large} 0 ${innerStart[0]} ${innerStart[1]} Z`;
};

/** Interactive donut chart for compact part-to-whole comparisons. */
export function DonutChart({
  data,
  height = 194,
  label = 'Distribution',
  selectedIndex,
  onSelect,
}: {
  data: ChartDatum[];
  height?: number;
  label?: string;
} & InteractiveChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const active = hovered ?? selectedIndex ?? internalSelected;
  const total = Math.max(
    1,
    data.reduce((sum, item) => sum + Math.max(0, item.value), 0),
  );
  let cursor = 0;
  const segments = data.map(item => {
    const start = (cursor / total) * 360;
    cursor += Math.max(0, item.value);
    const end = (cursor / total) * 360;
    const gap = Math.min(1.5, Math.max(0, (end - start) / 5));
    return {start: start + gap, end: end - gap};
  });
  return (
    <Frame height={height} label={label}>
      <svg viewBox="0 0 400 176" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(112 0)">
          {data.map((item, index) => {
            const segment = segments[index];
            const middle = (segment.start + segment.end) / 2;
            const [tx, ty] = polar(88, 88, 73, middle);
            const activate = () => {
              setInternalSelected(index);
              onSelect?.(item, index);
            };
            return (
              <g
                key={item.label}
                className="catalog-chart__series catalog-chart__donut-segment"
                data-active={active === index || undefined}
                tabIndex={0}
                role="button"
                aria-label={`${item.label}: ${item.display ?? item.value}`}
                onPointerEnter={() => setHovered(index)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                onClick={activate}
                onKeyDown={event => activateKey(event, activate)}
              >
                <path
                  className="catalog-chart__segment"
                  d={ringPath(
                    88,
                    88,
                    76,
                    48,
                    segment.start,
                    Math.max(segment.start + 0.1, segment.end),
                  )}
                />
                {active === index && (
                  <Tooltip
                    x={tx}
                    y={ty}
                    text={`${item.label} · ${item.display ?? item.value}`}
                  />
                )}
              </g>
            );
          })}
          <text
            className="catalog-chart__donut-total"
            x="88"
            y="84"
            textAnchor="middle"
          >
            {active === null ? 'Total' : data[active]?.label}
          </text>
          <text
            className="catalog-chart__donut-value"
            x="88"
            y="101"
            textAnchor="middle"
          >
            {active === null
              ? total
              : (data[active]?.display ?? data[active]?.value)}
          </text>
        </g>
      </svg>
    </Frame>
  );
}

/** Interactive scatter chart. `secondary` is the horizontal measure and `value` the vertical measure. */
export function ScatterChart({
  data,
  height,
  label = 'Correlation',
  selectedIndex,
  onSelect,
}: {
  data: ChartDatum[];
  height?: number;
  label?: string;
} & InteractiveChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const active = hovered ?? selectedIndex ?? internalSelected;
  const width = 400,
    plotHeight = 126;
  const maxX = Math.max(
    1,
    ...data.map((item, index) => item.secondary ?? index + 1),
  );
  const maxY = Math.max(1, ...data.map(item => item.value));
  const points = data.map(
    (item, index) =>
      [
        ((item.secondary ?? index + 1) / maxX) * (width - 12) + 6,
        plotHeight - (item.value / maxY) * (plotHeight - 12) + 6,
      ] as const,
  );
  return (
    <Frame height={height} label={label}>
      <svg viewBox={`0 0 ${width} 158`} preserveAspectRatio="none">
        <Grid height={plotHeight} />
        {data.map((item, index) => {
          const activate = () => {
            setInternalSelected(index);
            onSelect?.(item, index);
          };
          return (
            <g
              key={item.label}
              className="catalog-chart__series catalog-chart__scatter-point"
              data-active={active === index || undefined}
              tabIndex={0}
              role="button"
              aria-label={`${item.label}: ${item.display ?? item.value}`}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              onClick={activate}
              onKeyDown={event => activateKey(event, activate)}
            >
              <circle
                className="catalog-chart__point-hit"
                cx={points[index][0]}
                cy={points[index][1]}
                r="13"
              />
              <circle
                className="catalog-chart__scatter-mark"
                cx={points[index][0]}
                cy={points[index][1]}
                r="5"
              />
              {active === index && (
                <Tooltip
                  x={points[index][0]}
                  y={points[index][1]}
                  text={`${item.label} · ${item.display ?? item.value}`}
                />
              )}
            </g>
          );
        })}
      </svg>
    </Frame>
  );
}

/** Local SVG implementation of the reference's interactive horizontal funnel chart. */
export function FunnelChart({
  data,
  height,
  label = 'Session funnel',
  selectedIndex,
  onSelect,
}: {
  data: ChartDatum[];
  height?: number;
  label?: string;
} & InteractiveChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const active = hovered ?? selectedIndex ?? internalSelected;
  const width = 400;
  const row = 24;
  const max = Math.max(1, ...data.map(item => item.value));
  const viewHeight = Math.max(80, data.length * row + 8);
  return (
    <Frame height={height ?? viewHeight + 18} label={label}>
      <svg viewBox={`0 0 ${width} ${viewHeight}`} preserveAspectRatio="none">
        {data.map((item, index) => {
          const y = index * row + 4;
          const w = (item.value / max) * 218;
          const activate = () => {
            setInternalSelected(index);
            onSelect?.(item, index);
          };
          return (
            <g
              key={item.label}
              className="catalog-chart__series catalog-chart__funnel-row"
              data-active={active === index || undefined}
              tabIndex={0}
              role="button"
              aria-label={`${item.label}: ${item.display ?? item.value}`}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              onClick={activate}
              onKeyDown={event => activateKey(event, activate)}
            >
              <rect
                className="catalog-chart__row-hit"
                x="0"
                y={y - 3}
                width={width}
                height="20"
                rx="2"
              />
              <text x="0" y={y + 13}>
                {item.label}
              </text>
              <rect
                className="catalog-chart__bar"
                x="144"
                y={y}
                width={w}
                height="12"
                rx="2"
              />
              <text
                className="catalog-chart__value"
                x={Math.min(394, 152 + w)}
                y={y + 10}
              >
                {item.display ?? item.value}
              </text>
            </g>
          );
        })}
      </svg>
    </Frame>
  );
}
