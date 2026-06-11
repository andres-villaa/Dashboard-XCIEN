// Screen 4: Inventory & Access Capacity
const { useState: useStateInv, useMemo: useMemoInv } = React;

function Inventory({ goToNode }) {
  const X = window.XCIEN;
  const [techFilter, setTechFilter] = useStateInv("all");
  const [occFilter, setOccFilter] = useStateInv("all");
  const [expanded, setExpanded] = useStateInv(null);

  const rows = useMemoInv(() => {
    return X.INVENTORY.filter((r) => {
      if (occFilter === "high" && r.occ < 60) return false;
      if (occFilter === "low" && r.occ >= 60) return false;
      return true;
    });
  }, [occFilter]);

  const totals = X.INVENTORY.reduce((a, r) => ({
    cwdmUsed: a.cwdmUsed + r.cwdmUsed,
    gponUsed: a.gponUsed + r.gponUsed,
    cwdmClients: a.cwdmClients + r.cwdmClients,
    gponClients: a.gponClients + r.gponClients,
    totalClients: a.totalClients + r.totalClients,
    portsUsed: a.portsUsed + r.portsUsed,
  }), { cwdmUsed: 0, gponUsed: 0, cwdmClients: 0, gponClients: 0, totalClients: 0, portsUsed: 0 });

  const sortedByOcc = [...X.INVENTORY].sort((a, b) => b.occ - a.occ);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Capacidad · Acceso</div>
          <div className="page-title">Inventario y Capacidad de Acceso</div>
          <div className="page-sub">7 nodos · 48 hilos FO/nodo · 9 CWDM + 15 GPON · Iscom5600 (48 puertos)</div>
        </div>
      </div>

      <div className="filterbar">
        <span className="filter-label">Tecnología:</span>
        <select className="filter-select" value={techFilter} onChange={(e) => setTechFilter(e.target.value)}>
          <option value="all">Todas</option>
          <option value="cwdm">CWDM</option>
          <option value="gpon">GPON</option>
        </select>
        <span className="filter-label" style={{ marginLeft: 12 }}>Ocupación:</span>
        <select className="filter-select" value={occFilter} onChange={(e) => setOccFilter(e.target.value)}>
          <option value="all">Todas</option>
          <option value="high">Alta (≥60%)</option>
          <option value="low">Baja (&lt;60%)</option>
        </select>
        <div style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>
          {rows.length} de {X.INVENTORY.length} nodos
        </div>
      </div>

      <div className="row r-3-2">
        <div className="panel">
          <div className="panel-title"><span className="accent"></span>Inventario por Nodo</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Nodo</th><th>Hilos</th>
                <th>CWDM (U/L)</th><th>GPON (U/L)</th>
                <th>Cli. CWDM</th><th>Cli. GPON</th><th>Total</th>
                <th>Puertos 5600</th><th>Ocupación</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <React.Fragment key={r.node}>
                  <tr onClick={() => setExpanded(expanded === r.node ? null : r.node)} style={{ cursor: "pointer" }} className={r.occ >= 85 ? "hot" : ""}>
                    <td><strong style={{ color: "var(--green-2)" }}>{expanded === r.node ? "▼" : "▶"} {r.node}</strong></td>
                    <td className="num">{r.strandsTotal}</td>
                    <td className="num">{r.cwdmUsed} / {r.cwdmFree}</td>
                    <td className="num">{r.gponUsed} / {r.gponFree}</td>
                    <td className="num">{r.cwdmClients}</td>
                    <td className="num">{r.gponClients}</td>
                    <td className="num"><strong>{r.totalClients}</strong></td>
                    <td className="num">{r.portsUsed} / 48</td>
                    <td><UtilBar value={r.occ} /></td>
                  </tr>
                  {expanded === r.node && (
                    <tr>
                      <td colSpan="9" style={{ background: "#0a1a0c", padding: 14 }}>
                        <FiberExpand nodeId={r.node} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              <tr style={{ borderTop: "2px solid var(--green-dim)", background: "rgba(0,200,83,0.05)" }}>
                <td><strong>TOTAL</strong></td>
                <td className="num"><strong>{X.INVENTORY.length * 48}</strong></td>
                <td className="num"><strong>{totals.cwdmUsed} / {X.INVENTORY.length * 9 - totals.cwdmUsed}</strong></td>
                <td className="num"><strong>{totals.gponUsed} / {X.INVENTORY.length * 15 - totals.gponUsed}</strong></td>
                <td className="num"><strong>{totals.cwdmClients}</strong></td>
                <td className="num"><strong>{totals.gponClients}</strong></td>
                <td className="num"><strong>{totals.totalClients}</strong></td>
                <td className="num"><strong>{totals.portsUsed} / {X.INVENTORY.length * 48}</strong></td>
                <td className="num"><strong>{Math.round(totals.totalClients / (X.INVENTORY.length * (9*9 + 15*64)) * 100)}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-title"><span className="accent"></span>Ocupación por Nodo</div>
          <div style={{ display: "grid", gap: 10 }}>
            {sortedByOcc.map((r) => (
              <div key={r.node}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "var(--mono)", marginBottom: 4 }}>
                  <span style={{ color: "var(--ink-2)", cursor: "pointer" }} onClick={() => goToNode(r.node)}>{r.node} · {r.totalClients} cli.</span>
                  <span style={{ color: r.occ >= 80 ? "var(--red)" : r.occ >= 60 ? "var(--amber)" : "var(--green-2)" }}>{r.occ}%</span>
                </div>
                <HBar value={r.cwdmUsed + r.gponUsed} max={24} />
              </div>
            ))}
          </div>
          <div className="section-title" style={{ marginTop: 16 }}>Reglas</div>
          <div style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.6, fontFamily: "var(--mono)" }}>
            <div>· Objetivo: 60% ocupación máx. OADM/Splitter</div>
            <div>· CWDM: hasta 9 clientes/hilo</div>
            <div>· GPON: hasta 64 clientes/hilo (1:64 split)</div>
            <div>· 24 hilos para acceso por nodo</div>
            <div style={{ color: "var(--amber)", marginTop: 6 }}>· Alerta: ocupación ≥ 60%</div>
            <div style={{ color: "var(--red)" }}>· Crítico: ocupación ≥ 85%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FiberExpand({ nodeId }) {
  const fiber = window.XCIEN.FIBER[nodeId];
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 8, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Hilos de fibra · {nodeId}
      </div>
      <div className="strand-grid">
        {fiber.map((f) => {
          const cls = f.occ >= 85 ? "crit" : f.occ >= 60 ? "warn" : f.clients === 0 ? "empty" : "";
          return (
            <div key={f.strand} className={`strand ${cls}`}>
              <div className="num">FO-{String(f.strand).padStart(2, "0")}</div>
              <div className="tech">{f.tech}</div>
              <div className="occ">{f.occ}%</div>
              <div className="tech">{f.clients}/{f.max}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.Inventory = Inventory;
