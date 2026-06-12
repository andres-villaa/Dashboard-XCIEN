// Screen 1: Overview
const { useState: useStateOverview, useMemo: useMemoOverview } = React;

function Overview({ goToNode }) {
  const X = window.XCIEN;
  const [hover, setHover] = useStateOverview(null);
  const [hoverNode, setHoverNode] = useStateOverview(null);
  const [sortKey, setSortKey] = useStateOverview("util");
  const [sortDir, setSortDir] = useStateOverview("desc");

  // Links list with sorting
  const links = useMemoOverview(() => {
    const arr = [...X.RING_LINKS];
    arr.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [sortKey, sortDir, X.RING_LINKS]);

  const setSort = (k) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const nodeMap = useMemoOverview(() => {
    return Object.fromEntries(X.NODES.map((n) => [n.id, n]));
  }, [X.NODES]);

  // Total traffic sparkline (sum of all ring TS in)
  const totalTs = useMemoOverview(() => {
    return Array(X.SAMPLES).fill(0).map((_, i) =>
      Object.values(X.RING_TS).reduce((a, t) => a + t.in[i], 0)
    );
  }, [X.SAMPLES, X.RING_TS]);

  // Helper to color statuses
  const getUtilColor = (u) => {
    if (u > 85) return "var(--red)";
    if (u > 70) return "var(--amber)";
    if (u > 50) return "#FF8F00"; // Orange
    return "var(--green-2)";
  };

  const getNodeColor = (n) => {
    // If CPU temp or CPU usage is high, return amber/red
    if (n.devices.rax.temp > 50 || n.devices.rax.cpu > 80) return "var(--red)";
    if (n.devices.rax.temp > 45 || n.devices.rax.cpu > 65) return "var(--amber)";
    return "var(--green)";
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Saltillo Metro · Centro de Operaciones de Red</div>
          <div className="page-title">Vista General</div>
          <div className="page-sub">Monitoreo de topología en anillo de Saltillo · G.8032 ERP · BGP Edge breakouts</div>
        </div>
        <div className="g8032-status-card">
          <div style={{ fontSize: 9, color: "var(--ink-3)", textTransform: "uppercase" }}>Salud del Anillo (SLA)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--green-2)" }}>
            <span className="pulse"></span>
            99.96% Disponibilidad
          </div>
        </div>
      </div>

      {/* KPIs Row */}
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">Clientes Activos</div>
          <div className="kpi-value">{X.KPIS.totalClients.toLocaleString()}</div>
          <div className="kpi-delta">▲ 4.2% este mes</div>
          <div className="kpi-foot">
            <span><span className="dot" style={{ background: "var(--vrf-red)" }}></span>RED {X.KPIS.clientsByVrf.RED}</span>
            <span><span className="dot" style={{ background: "var(--vrf-green)" }}></span>GREEN {X.KPIS.clientsByVrf.GREEN}</span>
            <span><span className="dot" style={{ background: "var(--vrf-blue)" }}></span>BLUE {X.KPIS.clientsByVrf.BLUE}</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Tráfico Total (Actual)</div>
          <div className="kpi-value">{X.KPIS.totalTraffic}<small>Gbps</small></div>
          <div className="kpi-delta">▲ 1.4 Gbps últimas 24h</div>
          <div style={{ marginTop: 8 }}>
            <Sparkline data={totalTs} color="#00C853" width={240} height={32} />
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Salud del Anillo (SLA)</div>
          <div className="kpi-value">{X.KPIS.ringAvailability}<small>%</small></div>
          <div className="kpi-delta" style={{ color: X.RING_STATUS.state === "NORMAL" ? "var(--green-2)" : "var(--amber)" }}>
            ● Estado G.8032: {X.RING_STATUS.state}
          </div>
          <div className="kpi-foot" style={{ marginTop: 6 }}>
            <span>RPL: {X.RING_STATUS.rplBlocked ? "Blocked" : "Unblocked"}</span>
            <span>Target: 99.95%</span>
          </div>
        </div>
        <div className={`kpi ${X.KPIS.inetAvgUtil >= 80 ? "red" : X.KPIS.inetAvgUtil >= 60 ? "amber" : ""}`}>
          <div className="kpi-label">Util. Salidas Internet (Breakouts)</div>
          <div className="kpi-value">{X.KPIS.inetAvgUtil}<small>%</small></div>
          <div className={`progress ${X.KPIS.inetAvgUtil >= 80 ? "red" : X.KPIS.inetAvgUtil >= 60 ? "amber" : ""}`}>
            <div style={{ width: `${X.KPIS.inetAvgUtil}%` }} />
          </div>
          <div className="kpi-foot" style={{ marginTop: 10 }}>
            <span>ISP0: {X.ISPS[0].utilPeak}%</span>
            <span>ISP1: {X.ISPS[1].utilPeak}%</span>
          </div>
        </div>
      </div>

      {/* Ring Topology Map & Sidebar */}
      <div className="row r-3-2">
        <div className="panel" style={{ position: "relative" }}>
          <div className="panel-title">
            <span className="accent"></span>Mapa Interactivo de Topología — Saltillo & Ramos Arizpe
            <span className="right">Paso de Flores (RB6) Central PoP</span>
          </div>

          <svg className="ring-svg" viewBox={`0 0 ${X.MAP.W} ${X.MAP.H}`}>
            {/* Grid background */}
            <g className="ring-bg-grid">
              {Array.from({ length: 9 }).map((_, i) => <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2={X.MAP.H} />)}
              {Array.from({ length: 6 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 100} x2={X.MAP.W} y2={i * 100} />)}
            </g>

            {/* Region labels */}
            <text x="60" y="40" fill="var(--ink-3)" fontSize="10" fontFamily="var(--mono)" letterSpacing="0.15em">RAMOS ARIZPE</text>
            <text x="60" y={X.MAP.H - 20} fill="var(--ink-3)" fontSize="10" fontFamily="var(--mono)" letterSpacing="0.15em">SALTILLO SUR</text>
            <text x={X.MAP.W - 140} y="40" fill="var(--ink-3)" fontSize="10" fontFamily="var(--mono)" letterSpacing="0.15em">SALTILLO ORIENTE / ARTEAGA</text>

            {/* Links of the ring */}
            {X.RING_LINKS.map((l, i) => {
              const a = nodeMap[l.a], b = nodeMap[l.b];
              if (!a || !b) return null;

              // Semáforo color based on link utilization
              const color = getUtilColor(l.util);
              const isCritical = l.util > 85;

              return (
                <g key={i}>
                  <line
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    className={`ring-link`}
                    style={{ stroke: color, strokeWidth: isCritical ? 5 : 3.5 }}
                    onMouseEnter={(e) => setHover({ kind: "link", data: l, x: e.clientX, y: e.clientY })}
                    onMouseMove={(e) => setHover({ kind: "link", data: l, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHover(null)}
                  />
                  {/* Small link utilization badge in the middle */}
                  <circle cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} r="9" fill="#0a1a0c" stroke={color} strokeWidth="1" />
                  <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 + 3} textAnchor="middle" fill={color} fontSize="8" fontFamily="var(--mono)" fontWeight="bold">{l.util}</text>
                </g>
              );
            })}

            {/* Internet Breakout connections from RB6 */}
            {X.ISPS.map((isp, i) => {
              const att = nodeMap[isp.attachedTo];
              if (!att) return null;
              // Desplazar a la izquierda de RB6 de forma apilada verticalmente para evitar empalmes
              const ix = att.x - 120;
              const iy = att.y - 25 + i * 50;
              return (
                <g key={isp.id}>
                  <line x1={att.x} y1={att.y} x2={ix} y2={iy} className="ring-link isp" />
                  <rect x={ix - 35} y={iy - 11} width="70" height="22" fill="#0D1B0E" stroke="var(--blue)" strokeWidth="1.5" rx="3" />
                  <text x={ix} y={iy + 4} textAnchor="middle" fill="var(--blue)" fontSize="10" fontFamily="var(--mono)" fontWeight="700">{isp.id}</text>
                </g>
              );
            })}

            {/* Node circles */}
            {X.NODES.map((n) => {
              const nodeColor = getNodeColor(n);
              return (
                <g key={n.id} style={{ cursor: "pointer" }}
                  onClick={() => goToNode(n.id)}
                  onMouseEnter={(e) => setHoverNode({ data: n, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) => setHoverNode({ data: n, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHoverNode(null)}>
                  <circle cx={n.x} cy={n.y} r="22" className="node-circle" style={{ stroke: nodeColor }} />
                  <text x={n.x} y={n.y + 4} className="node-label">{n.id}</text>
                  <text x={n.x} y={n.y + 36} className="node-sublabel">{n.location}</text>
                </g>
              );
            })}
          </svg>

          {/* Hover Link Tooltip */}
          {hover && hover.kind === "link" && (
            <div className="tooltip" style={{ left: 16, top: 56 }}>
              <h4>Enlace {hover.data.a} ↔ {hover.data.b}</h4>
              <div className="tooltip-row"><span>Distancia</span><span>{hover.data.km} km</span></div>
              <div className="tooltip-row"><span>Capacidad</span><span>10 Gbps</span></div>
              <div className="tooltip-row"><span>Tráfico IN</span><span>{hover.data.trafficIn.toLocaleString()} Mbps</span></div>
              <div className="tooltip-row"><span>Tráfico OUT</span><span>{hover.data.trafficOut.toLocaleString()} Mbps</span></div>
              <div className="tooltip-row"><span>Utilización</span><span style={{ color: getUtilColor(hover.data.util) }}>{hover.data.util}%</span></div>
              <div className="tooltip-row"><span>Latencia</span><span>{hover.data.latency} ms</span></div>
              <div className="tooltip-row"><span>Errores CRC</span><span style={{ color: hover.data.errors > 0 ? "var(--red)" : "" }}>{hover.data.errors}</span></div>
            </div>
          )}

          {/* Hover Node Tooltip */}
          {hoverNode && (
            <div className="tooltip" style={{ right: 16, top: 56 }}>
              <h4>{hoverNode.data.id} · {hoverNode.data.location}</h4>
              <div className="tooltip-row"><span>Router RAX</span><span>{hoverNode.data.devices.rax.name}</span></div>
              <div className="tooltip-row"><span>Switch Iscom</span><span>{hoverNode.data.devices.sw.name}</span></div>
              <div className="tooltip-row"><span>IP Mgmt (RAX)</span><span>{hoverNode.data.devices.rax.mgmtIp}</span></div>
              <div className="tooltip-row"><span>CPU Usage (RAX)</span><span>{hoverNode.data.devices.rax.cpu}%</span></div>
              <div className="tooltip-row"><span>Temperatura (RAX)</span><span>{hoverNode.data.devices.rax.temp}°C</span></div>
              <div className="tooltip-row"><span>Clientes PoP</span><span>{hoverNode.data.clients}</span></div>
              <div style={{ marginTop: 6, color: "var(--green-2)", fontSize: 11, fontFamily: "var(--mono)" }}>Click para ver interfaces y fibra →</div>
            </div>
          )}
        </div>

        {/* NOC Status Sidebar */}
        <div className="panel">
          <div className="panel-title"><span className="accent"></span>Resumen Operativo del NOC</div>
          <div style={{ display: "grid", gap: 10 }}>
            <SummaryRow label="Nodos Activos" value="7 / 7" tone="ok" />
            <SummaryRow label="Enlaces Ring (Principal)" value="7 / 7" tone="ok" />
            <SummaryRow label="Enlaces G.8032 RPL Status" value={X.RING_STATUS.rplBlocked ? "BLOCKED (Normal)" : "UNBLOCKED (Protected)"} tone={X.RING_STATUS.rplBlocked ? "ok" : "warn"} />
            <SummaryRow label="Alertas Activas" value={X.ALERTS.filter(a => a.state === "active").length.toString()} tone={X.ALERTS.filter(a => a.state === "active").length > 0 ? "crit" : "ok"} />
            <SummaryRow label="Clientes Corporativos (RED)" value={X.KPIS.clientsByVrf.RED.toString()} tone="ok" />
            <SummaryRow label="Clientes PyME (GREEN)" value={X.KPIS.clientsByVrf.GREEN.toString()} tone="ok" />
            <SummaryRow label="Clientes Micro (BLUE)" value={X.KPIS.clientsByVrf.BLUE.toString()} tone="ok" />
            <SummaryRow label="Salidas Internet Up" value="2 / 2" tone="ok" />
            <SummaryRow label="Tráfico Total Consumido" value={`${X.KPIS.totalTraffic} Gbps`} tone="ok" />
          </div>

          <div className="section-title" style={{ marginTop: 16, paddingBottom: 4 }}>Tráfico de Red Acumulado (24h)</div>
          <div style={{ height: 110 }}>
            <Sparkline data={totalTs} color="#00C853" width={320} height={110} />
          </div>
        </div>
      </div>

      {/* Ring Links summary table */}
      <div style={{ height: 12 }}></div>
      <div className="panel">
        <div className="panel-title">
          <span className="accent"></span>Tabla de Enlaces de Transporte
          <span className="right">{X.RING_LINKS.length} enlaces</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th onClick={() => setSort("a")}>Enlace<span className="sort">↕</span></th>
              <th onClick={() => setSort("km")}>Distancia</th>
              <th onClick={() => setSort("capacity")}>Capacidad</th>
              <th onClick={() => setSort("trafficIn")}>Tráfico In</th>
              <th onClick={() => setSort("trafficOut")}>Tráfico Out</th>
              <th onClick={() => setSort("latency")}>Latencia</th>
              <th onClick={() => setSort("loss")}>Pérdida</th>
              <th onClick={() => setSort("errors")}>Errores</th>
              <th onClick={() => setSort("util")}>Utilización</th>
              <th>Semaforización</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l, i) => (
              <tr key={i} className={l.util >= 85 ? "hot" : ""}>
                <td><strong>{l.a} ↔ {l.b}</strong></td>
                <td className="num muted">{l.km} km</td>
                <td className="num">10 Gbps</td>
                <td className="num">{(l.trafficIn / 1000).toFixed(2)} Gbps</td>
                <td className="num">{(l.trafficOut / 1000).toFixed(2)} Gbps</td>
                <td className="num">{l.latency} ms</td>
                <td className="num">{l.loss > 0 ? `${(l.loss * 100).toFixed(2)}%` : "0%"}</td>
                <td className="num">{l.errors}</td>
                <td>
                  <div className="util-cell">
                    <div className="util-bar">
                      <div style={{ width: `${Math.min(100, l.util)}%`, backgroundColor: getUtilColor(l.util) }} />
                    </div>
                    <span className="util-num" style={{ color: getUtilColor(l.util) }}>{l.util}%</span>
                  </div>
                </td>
                <td>
                  <span className="semaforo">
                    <span className={`led ${l.util > 85 ? "crit" : l.util > 70 ? "warn" : "ok"}`}></span>
                    {l.util > 85 ? "CRÍTICO (ROJO)" : l.util > 70 ? "WARN (NARANJA)" : l.util > 50 ? "WARN (AMARILLO)" : "OK (VERDE)"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, tone = "ok" }) {
  const colors = { ok: "var(--green-2)", crit: "var(--red)", warn: "var(--amber)", muted: "var(--ink-3)" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #16301c", fontSize: 12 }}>
      <span style={{ color: "var(--ink-2)" }}>{label}</span>
      <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: colors[tone] }}>{value}</span>
    </div>
  );
}

window.Overview = Overview;
