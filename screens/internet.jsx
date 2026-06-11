// Screen 3: Internet Exits / ISP View
const { useState: useStateInternet, useMemo: useMemoInternet } = React;

function InternetExits() {
  const X = window.XCIEN;
  const [bgpBalanced, setBgpBalanced] = useStateInternet(false);
  const [simulatingFailover, setSimulatingFailover] = useStateInternet(null);

  const peakIsp = (id) => {
    const isp = X.ISPS.find((i) => i.id === id);
    const ts = X.ISP_TS[id];
    
    // If BGP balanced simulation is ON, distribute the peaks evenly
    let peak = isp.utilPeak;
    let tsIn = [...ts.in];
    let tsOut = [...ts.out];

    if (simulatingFailover === id) {
      // ISP is down
      peak = 0;
      tsIn = tsIn.map(() => 0);
      tsOut = tsOut.map(() => 0);
    } else if (simulatingFailover && simulatingFailover !== id) {
      // ISP absorbs all traffic
      peak = Math.min(100, Math.round(peak * 1.6));
      tsIn = tsIn.map(v => Math.min(isp.capacity * 1000, v * 1.6));
      tsOut = tsOut.map(v => Math.min(isp.capacity * 1000, v * 1.6));
    } else if (bgpBalanced) {
      // Redistribute to 50/50 approx
      const avgPeak = 53;
      peak = avgPeak;
      tsIn = tsIn.map(v => v * (avgPeak / isp.utilPeak));
      tsOut = tsOut.map(v => v * (avgPeak / isp.utilPeak));
    }

    return { isp, ts: { in: tsIn, out: tsOut }, peak };
  };

  const i0 = peakIsp("ISP0");
  const i1 = peakIsp("ISP1");

  // Combined chart
  const combined = [
    { name: "ISP0 (Telmex) - Descarga", data: i0.ts.in, color: "#00C853" },
    { name: "ISP1 (Cogent) - Descarga", data: i1.ts.in, color: "#FFB300" },
  ];

  // Projection: 6 months back + 6 months forward (linear)
  const monthly = [];
  const baseTraffic = bgpBalanced ? 53 : (i0.peak + i1.peak) / 2;
  for (let m = -6; m <= 6; m++) {
    monthly.push(Math.max(20, baseTraffic + m * 5.5 + (m * m) * 0.25));
  }
  const monthsLabels = ["Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov"];
  const targetMonth = monthsLabels[monthly.findIndex((v) => v >= 80)] || "Nov (2026)";

  const imbalance = Math.abs(i0.peak - i1.peak) > 20 && simulatingFailover === null;

  const triggerFailover = (ispId) => {
    if (simulatingFailover === ispId) {
      setSimulatingFailover(null);
    } else {
      setSimulatingFailover(ispId);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Edge BGP · Salidas de Tránsito IP</div>
          <div className="page-title">Vista de Proveedores (ISPs)</div>
          <div className="page-sub">Monitoreo de balanceo de carga BGP, latencia y disponibilidad de enlaces redundantes de 50 Gbps en RB6</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className={`btn ${bgpBalanced ? "primary" : ""}`} onClick={() => setBgpBalanced(!bgpBalanced)}>
            {bgpBalanced ? "BGP Balanceado: ON" : "Optimizar BGP Balance"}
          </button>
        </div>
      </div>

      {/* ISPs status boxes */}
      <div className="row r-2">
        {[i0, i1].map(({ isp, ts, peak }, idx) => {
          const isDown = simulatingFailover === isp.id;
          return (
            <div className="panel" key={isp.id} style={{ borderTop: isDown ? "3px solid var(--red)" : `3px solid ${idx === 0 ? "#00C853" : "#FFB300"}` }}>
              <div className="panel-title">
                <span className="accent" style={{ background: isDown ? "var(--red)" : idx === 0 ? "#00C853" : "#FFB300" }}></span>
                {isp.id} · {isp.name}
                <span className="right" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="btn" style={{ padding: "2px 8px", fontSize: 10, borderColor: isDown ? "var(--red)" : "" }} onClick={() => triggerFailover(isp.id)}>
                    {isDown ? "Restaurar" : "Simular Caída"}
                  </button>
                  <Pill kind={isDown ? "down" : "up"}>{isDown ? "DOWN" : "UP"}</Pill>
                </span>
              </div>
              <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
                <Stat label="IP Pública WAN" value={isp.ip} />
                <Stat label="Capacidad Física" value={`${isp.capacity} Gbps`} />
                <Stat label="Utilización Pico" value={`${isDown ? 0 : peak}%`} tone={isDown ? "crit" : peak >= 80 ? "crit" : peak >= 60 ? "warn" : "ok"} />
                <Stat label="Latencia (ICMP)" value={`${isDown ? "—" : isp.latency + " ms"}`} tone={isDown ? "crit" : isp.latency >= 15 ? "warn" : "ok"} />
              </div>
              <LineChart
                series={[
                  { name: "Download (Tráfico Entrante)", data: ts.in, color: idx === 0 ? "#00C853" : "#FFB300" },
                  { name: "Upload (Tráfico Saliente)", data: ts.out, color: idx === 0 ? "#5BE584" : "#FFD54F" },
                ]}
                height={200} yLabel="Mbps" fill
              />
            </div>
          );
        })}
      </div>

      <div style={{ height: 12 }}></div>
      <div className="row r-2">
        {/* Load balancing comparison */}
        <div className="panel">
          <div className="panel-title">
            <span className="accent"></span>Balanceo de Carga y Asignación de Tráfico BGP
            {imbalance && <span className="right" style={{ color: "var(--amber)" }}>⚠ TRÁFICO DESBALANCEADO</span>}
          </div>
          <LineChart series={combined} height={220} yLabel="Mbps" />
          {imbalance && (
            <div style={{ marginTop: 8, padding: 10, background: "rgba(255,179,0,0.08)", border: "1px solid rgba(255,179,0,0.3)", borderRadius: 4, fontSize: 12 }}>
              <strong>Advertencia de Balance BGP:</strong> ISP1 (Cogent) está recibiendo el {i1.peak}% del tráfico, mientras ISP0 (Telmex) tiene sólo {i0.peak}%. Esto puede generar saturación. Haz clic en "Optimizar BGP Balance" en la parte superior para redistribuir el tráfico equitativamente.
            </div>
          )}
          {simulatingFailover && (
            <div style={{ marginTop: 8, padding: 10, background: "rgba(255,82,82,0.08)", border: "1px solid rgba(255,82,82,0.3)", borderRadius: 4, fontSize: 12 }}>
              <strong>Escenario de Conmutación por Falla (BGP Failover):</strong> Uno de los ISP se encuentra caído. Todo el tráfico metropolitano ha sido redirigido dinámicamente al ISP activo mediante políticas BGP Local-Preference.
            </div>
          )}
        </div>

        {/* Capacity planning projection */}
        <div className="panel">
          <div className="panel-title">
            <span className="accent"></span>Planificación de Capacidad · Proyección de Saturación
            <span className="right">Límite 80%: <strong style={{ color: "var(--amber)" }}>{targetMonth}</strong></span>
          </div>
          <ProjectionChart data={monthly} labels={monthsLabels} />
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-2)" }}>
            Tendencia de crecimiento estimada según históricos mensuales. Recomendación NOC: Aumentar la velocidad contratada del IP Transit a 75 Gbps antes del mes de <strong style={{ color: "var(--amber)" }}>{targetMonth}</strong> para evitar cuellos de botella en horas pico.
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const colors = { ok: "var(--green-2)", crit: "var(--red)", warn: "var(--amber)" };
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: colors[tone] || "var(--ink)" }}>{value}</div>
    </div>
  );
}

function ProjectionChart({ data, labels }) {
  const W = 800, H = 220;
  const padL = 50, padR = 12, padB = 30, padT = 16;
  const maxY = Math.max(...data) * 1.15;
  const xAt = (i) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const yAt = (v) => padT + (1 - v / maxY) * (H - padT - padB);
  const splitIdx = 6;
  const histPts = data.slice(0, splitIdx + 1).map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
  const projPts = data.slice(splitIdx).map((v, i) => `${xAt(i + splitIdx)},${yAt(v)}`).join(" ");
  const threshold80 = yAt(80);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <g key={i}>
          <line className="gridline" x1={padL} x2={W - padR} y1={yAt(maxY * p)} y2={yAt(maxY * p)} />
          <text className="axis-text" x={padL - 6} y={yAt(maxY * p) + 3} textAnchor="end">{Math.round(maxY * p)}%</text>
        </g>
      ))}
      <line x1={padL} x2={W - padR} y1={threshold80} y2={threshold80} stroke="#FFB300" strokeWidth="1" strokeDasharray="4 4" />
      <text x={W - padR - 8} y={threshold80 - 4} textAnchor="end" className="axis-text" fill="#FFB300">80% Saturación</text>
      <line x1={xAt(splitIdx)} x2={xAt(splitIdx)} y1={padT} y2={H - padB} stroke="#2a5836" strokeDasharray="2 4" />
      <text x={xAt(splitIdx)} y={padT - 4} textAnchor="middle" className="axis-text">HOY</text>
      <polyline points={histPts} fill="none" stroke="#00C853" strokeWidth="2" />
      <polyline points={projPts} fill="none" stroke="#FFB300" strokeWidth="2" strokeDasharray="6 4" />
      {labels.map((l, i) => (
        <text key={i} className="axis-text" x={xAt(i)} y={H - 10} textAnchor="middle">{l}</text>
      ))}
    </svg>
  );
}

window.InternetExits = InternetExits;
