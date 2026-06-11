// Screen: Link Monitoring
const { useState: useStateLinks, useMemo: useMemoLinks } = React;

function LinksMonitoring() {
  const X = window.XCIEN;
  const [selectedLink, setSelectedLink] = useStateLinks(null);

  const ringLinks = X.RING_LINKS;

  // Selected link data
  const activeLink = useMemoLinks(() => {
    if (!selectedLink) return ringLinks[0];
    return ringLinks.find(l => `${l.a}-${l.b}` === selectedLink) || ringLinks[0];
  }, [selectedLink, ringLinks]);

  const activeTs = X.RING_TS[`${activeLink.a}-${activeLink.b}`] || X.RING_TS[`${activeLink.b}-${activeLink.a}`];

  const series = [
    { name: "Tráfico Entrada (In)", data: activeTs?.in || [], color: "#00C853" },
    { name: "Tráfico Salida (Out)", data: activeTs?.out || [], color: "#5BE584" },
  ];

  // Helper to determine traffic load classification color
  const getUtilColor = (u) => {
    if (u > 85) return "var(--red)";
    if (u > 70) return "var(--amber)";
    if (u > 50) return "#FF8F00"; // Orange
    return "var(--green-2)";
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Transporte · Capacidad Física</div>
          <div className="page-title">Monitoreo de Enlaces</div>
          <div className="page-sub">Salud y saturación de enlaces troncales de 10 Gbps en topología de anillo</div>
        </div>
        <div className="g8032-status-card">
          <div style={{ fontSize: 9, color: "var(--ink-3)", textTransform: "uppercase" }}>Estado G.8032</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: X.RING_STATUS.state === "NORMAL" ? "var(--green-2)" : "var(--amber)" }}>
            <span className={`pulse ${X.RING_STATUS.state === "NORMAL" ? "" : "amber"}`}></span>
            {X.RING_STATUS.state}
          </div>
        </div>
      </div>

      <div className="row r-3-2">
        {/* Links list */}
        <div className="panel">
          <div className="panel-title">
            <span className="accent"></span>Enlaces Troncales del Anillo
            <span className="right">{ringLinks.length} enlaces activos</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Enlace</th>
                <th>Distancia</th>
                <th>Capacidad</th>
                <th>Latencia</th>
                <th>Pérdida</th>
                <th>Errores</th>
                <th style={{ width: 140 }}>Utilización</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ringLinks.map((l) => {
                const linkId = `${l.a}-${l.b}`;
                const isSelected = activeLink.a === l.a && activeLink.b === l.b;
                return (
                  <tr key={linkId} 
                      onClick={() => setSelectedLink(linkId)} 
                      style={{ cursor: "pointer", background: isSelected ? "rgba(0, 200, 83, 0.08)" : "" }}
                      className={l.util > 85 ? "hot" : ""}>
                    <td><strong>{l.a} ↔ {l.b}</strong></td>
                    <td className="num muted">{l.km} km</td>
                    <td className="num">10 Gbps</td>
                    <td className="num">{l.latency} ms</td>
                    <td className="num">{l.loss > 0 ? `${(l.loss * 100).toFixed(2)}%` : "0%"}</td>
                    <td className="num">{l.errors}</td>
                    <td>
                      <div className="util-cell">
                        <div className="util-bar">
                          <div style={{ 
                            width: `${Math.min(100, l.util)}%`, 
                            backgroundColor: getUtilColor(l.util)
                          }} />
                        </div>
                        <span className="util-num" style={{ color: getUtilColor(l.util) }}>{l.util}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="semaforo">
                        <span className={`led ${l.util > 85 ? "crit" : l.util > 70 ? "warn" : "ok"}`}></span>
                        {l.util > 85 ? "ROJO" : l.util > 70 ? "NARANJA" : l.util > 50 ? "AMARILLO" : "VERDE"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Link detail & real time graph */}
        <div className="panel">
          <div className="panel-title">
            <span className="accent" style={{ background: getUtilColor(activeLink.util) }}></span>
            Detalle: {activeLink.a} ↔ {activeLink.b}
            <span className="right" style={{ fontFamily: "var(--sans)", color: getUtilColor(activeLink.util), fontWeight: "bold" }}>
              {activeLink.util}% saturación
            </span>
          </div>

          <div className="link-metrics-grid">
            <div className="metric-box">
              <span className="lbl">Tráfico IN promedio</span>
              <span className="val">{(activeLink.trafficIn / 1000).toFixed(2)} <small>Gbps</small></span>
              <span className="oid-label">OID: 1.3.6.1.2.1.2.2.1.10</span>
            </div>
            <div className="metric-box">
              <span className="lbl">Tráfico OUT promedio</span>
              <span className="val">{(activeLink.trafficOut / 1000).toFixed(2)} <small>Gbps</small></span>
              <span className="oid-label">OID: 1.3.6.1.2.1.2.2.1.16</span>
            </div>
            <div className="metric-box">
              <span className="lbl">Latencia de Enlace</span>
              <span className="val">{activeLink.latency} <small>ms</small></span>
            </div>
            <div className="metric-box">
              <span className="lbl">Pérdida de Paquetes</span>
              <span className="val">{activeLink.loss > 0 ? `${(activeLink.loss * 100).toFixed(2)}%` : "0.00%"}</span>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Gráfico de Tráfico IN/OUT (24 Horas)
            </div>
            <LineChart series={series} height={180} yLabel="Mbps" fill={true} />
          </div>
        </div>
      </div>

      <div style={{ height: 12 }}></div>
      <div className="panel">
        <div className="panel-title"><span className="accent"></span>Conformidad SLA de Capacidad y Redundancia</div>
        <div className="redundancy-sla-container">
          <div className="sla-card">
            <h4>Anillo G.8032 Convergence</h4>
            <p>La topología de anillo ofrece tolerancia a fallas de un solo enlace mediante el bloqueo lógico del enlace RPL ({X.RING_STATUS.rplLink}) gestionado desde {X.RING_STATUS.rplOwner}.</p>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: "var(--mono)" }}>
              <span>Convergencia sub-50ms: <strong style={{ color: "var(--green-2)" }}>Cumplido ({X.RING_STATUS.convergenceTime || "34ms"})</strong></span>
              <span>RPL Link: <strong>{X.RING_STATUS.rplLink} ({X.RING_STATUS.rplBlocked ? "Bloqueado / Anti-Lazo" : "Desbloqueado / Falla"})</strong></span>
            </div>
          </div>
          <div className="sla-card">
            <h4>Reglas de Semáforos y Alertas</h4>
            <div className="semaforo-rules-grid">
              <div className="rule-badge ok"><span className="led ok"></span> Verde: 0-50% (Uso normal)</div>
              <div className="rule-badge warn"><span className="led warn"></span> Amarillo: 51-70% (Prevención)</div>
              <div className="rule-badge orange"><span className="led orange"></span> Naranja: 71-85% (Planificar Expansión)</div>
              <div className="rule-badge crit"><span className="led crit"></span> Rojo: &gt;85% (Saturación Crítica)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.LinksMonitoring = LinksMonitoring;
