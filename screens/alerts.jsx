// Screen 6: Alerts & Events History
const { useState: useStateAlerts, useMemo: useMemoAlerts } = React;

function Alerts() {
  const X = window.XCIEN;
  const [sev, setSev] = useStateAlerts("all");
  const [node, setNode] = useStateAlerts("all");
  const [state, setState] = useStateAlerts("all");

  const filtered = useMemoAlerts(() => {
    return X.ALERTS.filter((a) => {
      if (sev !== "all" && a.severity !== sev) return false;
      if (node !== "all" && a.node !== node) return false;
      if (state !== "all" && a.state !== state) return false;
      return true;
    });
  }, [sev, node, state, X.ALERTS]);

  const counts = useMemoAlerts(() => {
    const active = X.ALERTS.filter((a) => a.state === "active");
    return {
      crit: active.filter((a) => a.severity === "critical").length,
      warn: active.filter((a) => a.severity === "warning").length,
      info: active.filter((a) => a.severity === "info").length,
      resolved24h: X.ALERTS.filter((a) => a.state === "resolved").length,
    };
  }, [X.ALERTS]);

  const active = useMemoAlerts(() => {
    return X.ALERTS.filter((a) => a.state === "active");
  }, [X.ALERTS]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Monitoreo · Syslog & SNMP Traps</div>
          <div className="page-title">Alertas e Historial de Eventos</div>
          <div className="page-sub">Alertas automáticas por violación de SLA, saturación de fibra, temperatura y caída de enlaces</div>
        </div>
      </div>

      {/* Alarm Counters Widget */}
      <div className="alert-counts">
        <div className="alert-count crit">
          <div className="num">{counts.crit}</div>
          <div className="lbl">Críticas<br/>Activas</div>
        </div>
        <div className="alert-count warn">
          <div className="num">{counts.warn}</div>
          <div className="lbl">Warnings<br/>Activas</div>
        </div>
        <div className="alert-count info">
          <div className="num">{counts.info}</div>
          <div className="lbl">Información<br/>Activas</div>
        </div>
        <div className="alert-count ok">
          <div className="num">{counts.resolved24h}</div>
          <div className="lbl">Resueltas<br/>Últimas 24h</div>
        </div>
        <div className="alert-count" style={{ borderLeft: "3px solid var(--green)" }}>
          <div className="num">{X.KPIS.ringAvailability}%</div>
          <div className="lbl">Disponibilidad<br/>del Anillo</div>
        </div>
      </div>

      <div className="row r-2-3">
        {/* Real-time alarm feed */}
        <div className="panel alert-feed-panel">
          <div className="panel-title">
            <span className="accent" style={{ background: counts.crit > 0 ? "var(--red)" : "var(--green)" }}></span>
            Feed de Eventos en Tiempo Real
            <span className="right"><span className="pulse"></span> LIVE TRAPS</span>
          </div>
          <div className="alert-feed">
            {active.map((a, i) => (
              <div key={i} className={`alert-item ${a.severity === "critical" ? "crit" : a.severity}`}>
                <div className="bar"></div>
                <div>
                  <div className="desc" style={{ fontWeight: 600 }}>{a.desc}</div>
                  <div className="meta">
                    <span>PoP: <strong>{a.node}</strong></span> · 
                    <span> Obj: {a.iface}</span> · 
                    <span> Tipo: {a.type}</span> · 
                    <span> Activo: {a.duration}</span>
                  </div>
                  {a.oid && a.oid !== "—" && (
                    <div className="alert-oid" style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--ink-3)", marginTop: 2 }}>
                      SNMP Trap OID: {a.oid}
                    </div>
                  )}
                </div>
                <div className="ts">{a.ts.split(" ")[1]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Historic logs database */}
        <div className="panel">
          <div className="filterbar" style={{ marginBottom: 12 }}>
            <span className="filter-label">Severidad:</span>
            <select className="filter-select" value={sev} onChange={(e) => setSev(e.target.value)}>
              <option value="all">Todas</option>
              <option value="critical">Crítica</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <span className="filter-label" style={{ marginLeft: 10 }}>Nodo:</span>
            <select className="filter-select" value={node} onChange={(e) => setNode(e.target.value)}>
              <option value="all">Todos</option>
              {[...new Set(X.ALERTS.map((a) => a.node))].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="filter-label" style={{ marginLeft: 10 }}>Estado:</span>
            <select className="filter-select" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="all">Todos</option>
              <option value="active">Activas</option>
              <option value="resolved">Resueltas</option>
            </select>
            <div style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>
              {filtered.length} eventos registrados
            </div>
          </div>

          <div className="panel-title"><span className="accent"></span>Historial Completo de Traps y Syslog</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severidad</th>
                <th>Nodo</th>
                <th>Origen</th>
                <th>Evento</th>
                <th>Descripción</th>
                <th>Duración</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i} className={a.state === "active" && a.severity === "critical" ? "hot" : ""}>
                  <td className="muted" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{a.ts}</td>
                  <td>
                    <Pill kind={a.severity === "critical" ? "down" : a.severity === "warning" ? "warn" : "info"}>
                      {a.severity.toUpperCase()}
                    </Pill>
                  </td>
                  <td><strong>{a.node}</strong></td>
                  <td className="muted">{a.iface}</td>
                  <td className="muted">{a.type}</td>
                  <td style={{ fontFamily: "var(--sans)", whiteSpace: "normal", fontSize: 12 }}>{a.desc}</td>
                  <td className="num">{a.duration}</td>
                  <td>
                    <span className="semaforo">
                      <span className={`led ${a.state === "active" ? (a.severity === "critical" ? "crit" : "warn") : "ok"}`}></span>
                      {a.state.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

window.Alerts = Alerts;
