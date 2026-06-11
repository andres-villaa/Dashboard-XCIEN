// Shared chart components for XCIEN dashboard

const X = window.XCIEN;

function classifyUtil(u) {
  if (u >= 80) return "crit";
  if (u >= 60) return "warn";
  return "ok";
}

function UtilBar({ value, width = 100 }) {
  const cls = classifyUtil(value);
  return (
    <div className="util-cell" style={{ width }}>
      <div className={`util-bar ${cls}`}>
        <div style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="util-num">{value}%</span>
    </div>
  );
}

function Pill({ children, kind = "up" }) {
  return <span className={`pill ${kind}`}>{children}</span>;
}

function Semaforo({ value, threshold = { ok: 99.9, warn: 99 } }) {
  const cls = value >= threshold.ok ? "ok" : value >= threshold.warn ? "warn" : "crit";
  return <span className="semaforo"><span className={`led ${cls}`}></span>{value.toFixed(2)}%</span>;
}

// Simple line/area chart
function LineChart({ series, height = 180, yLabel = "Mbps", showLegend = true, fill = false, padTop = 16 }) {
  const W = 800, H = height;
  const padL = 50, padR = 12, padB = 26, padT = padTop;
  const samples = series[0].data.length;
  const maxY = Math.max(...series.flatMap(s => s.data)) * 1.15 || 100;

  const xAt = (i) => padL + (i / (samples - 1)) * (W - padL - padR);
  const yAt = (v) => padT + (1 - v / maxY) * (H - padT - padB);

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => (maxY / yTicks) * i);

  const xTicks = 6;
  const xTickIdx = Array.from({ length: xTicks + 1 }, (_, i) => Math.round((samples - 1) * (i / xTicks)));

  const fmtY = (v) => {
    if (v >= 1000) return (v/1000).toFixed(1) + "G";
    return Math.round(v) + "";
  };
  const hourFor = (i) => {
    const h = Math.floor(i / 12);
    return `${String(h).padStart(2, "0")}:00`;
  };

  return (
    <div className="chart-wrap">
      {showLegend && (
        <div className="legend">
          {series.map((s) => (
            <span key={s.name}><span className="swatch" style={{ background: s.color }}></span>{s.name}</span>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none" style={{ height }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line className="gridline" x1={padL} x2={W - padR} y1={yAt(t)} y2={yAt(t)} />
            <text className="axis-text" x={padL - 6} y={yAt(t) + 3} textAnchor="end">{fmtY(t)}</text>
          </g>
        ))}
        {xTickIdx.map((i, k) => (
          <text key={k} className="axis-text" x={xAt(i)} y={H - 8} textAnchor="middle">{hourFor(i)}</text>
        ))}
        <text className="axis-text" x={6} y={padT - 4}>{yLabel}</text>
        {series.map((s, k) => {
          const points = s.data.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
          const areaPath = `M ${xAt(0)},${yAt(0)} L ` + s.data.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" L ") + ` L ${xAt(samples-1)},${yAt(0)} Z`;
          return (
            <g key={k}>
              {fill && <path d={areaPath} fill={s.color} fillOpacity="0.18" />}
              <polyline points={points} fill="none" stroke={s.color} strokeWidth="1.8" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Sparkline
function Sparkline({ data, color = "#00C853", height = 36, width = 120 }) {
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width, height, display: "block" }} preserveAspectRatio="none">
      <polygon points={areaPoints} fill={color} fillOpacity="0.18" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// Stacked bar chart (horizontal) — for inventory
function HBar({ value, max, kind = "auto" }) {
  const pct = Math.round((value / max) * 100);
  let cls = "ok";
  if (kind === "auto") {
    if (pct >= 85) cls = "crit";
    else if (pct >= 60) cls = "warn";
  } else cls = kind;
  return (
    <div className={`bar-h ${cls === "crit" ? "crit" : cls === "warn" ? "warn" : ""}`}>
      <div style={{ width: `${pct}%` }} />
      <span>{value}/{max} · {pct}%</span>
    </div>
  );
}

// Donut chart
function Donut({ data, size = 180, label = "", sublabel = "" }) {
  const total = data.reduce((a, x) => a + x.value, 0);
  const r = size / 2 - 18;
  const cx = size / 2, cy = size / 2;
  const stroke = 22;
  let acc = 0;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a3520" strokeWidth={stroke} />
      {data.map((d, i) => {
        const len = (d.value / total) * circ;
        const dash = `${len} ${circ - len}`;
        const off = -acc;
        acc += len;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color} strokeWidth={stroke}
            strokeDasharray={dash} strokeDashoffset={off}
            transform={`rotate(-90 ${cx} ${cy})`} />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#E6F4EA" fontFamily="var(--mono)" fontSize="20" fontWeight="700">{label}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#6B8E76" fontSize="10" letterSpacing="0.1em">{sublabel}</text>
    </svg>
  );
}

// Stacked bar
function StackedBars({ rows, keys, colors, height = 180 }) {
  const W = 800, H = height;
  const padL = 50, padR = 12, padB = 28, padT = 12;
  const totals = rows.map((r) => keys.reduce((a, k) => a + r[k], 0));
  const maxY = Math.max(...totals) * 1.15 || 1;
  const bw = (W - padL - padR) / rows.length * 0.6;
  const step = (W - padL - padR) / rows.length;

  const yAt = (v) => padT + (1 - v / maxY) * (H - padT - padB);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" style={{ height }}>
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <g key={i}>
          <line className="gridline" x1={padL} x2={W - padR} y1={yAt(maxY * p)} y2={yAt(maxY * p)} />
          <text className="axis-text" x={padL - 6} y={yAt(maxY * p) + 3} textAnchor="end">{(maxY * p).toFixed(1)}</text>
        </g>
      ))}
      {rows.map((r, i) => {
        const cx = padL + step * i + step / 2;
        let stackBase = 0;
        return (
          <g key={i}>
            {keys.map((k, ki) => {
              const v = r[k];
              const y0 = yAt(stackBase);
              const y1 = yAt(stackBase + v);
              stackBase += v;
              return <rect key={ki} x={cx - bw/2} y={y1} width={bw} height={y0 - y1} fill={colors[ki]} />;
            })}
            <text x={cx} y={H - 10} textAnchor="middle" className="axis-text">{r.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { UtilBar, Pill, Semaforo, LineChart, Sparkline, HBar, Donut, StackedBars, classifyUtil });
