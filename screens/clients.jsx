// Screen: Clients View
const { useState: useStateClientsView, useMemo: useMemoClientsView } = React;

function ClientsView() {
  const X = window.XCIEN;
  const [selectedRegion, setSelectedRegion] = useStateClientsView("all");

  const nodes = X.NODES;
  const vrfs = X.VRFS;

  // Aggregate clients by VRF
  const vrfAggregates = useMemoClientsView(() => {
    let red = 0, green = 0, blue = 0;
    nodes.forEach(n => {
      const v = X.VRF_BY_NODE[n.id];
      red += v.RED.clients;
      green += v.GREEN.clients;
      blue += v.BLUE.clients;
    });
    return { RED: red, GREEN: green, BLUE: blue, total: red + green + blue };
  }, [nodes]);

  // Aggregate clients by Region
  const regionalAggregates = useMemoClientsView(() => {
    const map = {};
    nodes.forEach(n => {
      if (!map[n.region]) {
        map[n.region] = { name: n.region, clients: 0, RED: 0, GREEN: 0, BLUE: 0 };
      }
      const v = X.VRF_BY_NODE[n.id];
      map[n.region].clients += n.clients;
      map[n.region].RED += v.RED.clients;
      map[n.region].GREEN += v.GREEN.clients;
      map[n.region].BLUE += v.BLUE.clients;
    });
    return Object.values(map);
  }, [nodes]);

  // Filtered nodes breakdown
  const filteredNodes = useMemoClientsView(() => {
    return nodes.filter(n => selectedRegion === "all" || n.region === selectedRegion);
  }, [nodes, selectedRegion]);

  // Client growth trends simulation (6 months)
  const growthData = [
    { label: "Dic", RED: 98, GREEN: 820, BLUE: 290 },
    { label: "Ene", RED: 104, GREEN: 860, BLUE: 310 },
    { label: "Feb", RED: 112, GREEN: 910, BLUE: 335 },
    { label: "Mar", RED: 122, GREEN: 940, BLUE: 360 },
    { label: "Abr", RED: 135, GREEN: 980, BLUE: 382 },
    { label: "May", RED: 142, GREEN: 1023, BLUE: 400 }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Clientes · Análisis Comercial y Operativo</div>
          <div className="page-title">Vista de Clientes</div>
          <div className="page-sub">Distribución, segmentación por VRF y crecimiento por región en Saltillo y Ramos Arizpe</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="filter-label" style={{ alignSelf: "center" }}>Región:</span>
          <select className="filter-select" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
            <option value="all">Todas las regiones</option>
            <option value="Saltillo Centro">Saltillo Centro</option>
            <option value="Saltillo Oriente">Saltillo Oriente</option>
            <option value="Saltillo Sur">Saltillo Sur</option>
            <option value="Ramos Arizpe">Ramos Arizpe</option>
          </select>
        </div>
      </div>

      <div className="kpi-row" style={{ marginBottom: 12 }}>
        <div className="kpi" style={{ borderLeft: "3px solid #FFF" }}>
          <div className="kpi-label">Clientes Totales (Metropolitana)</div>
          <div className="kpi-value">{vrfAggregates.total.toLocaleString()}</div>
          <div className="kpi-delta">▲ 5.4% crecimiento mensual</div>
        </div>
        {vrfs.map((vrf) => (
          <div key={vrf.id} className="kpi" style={{ borderLeft: `3px solid ${vrf.color}` }}>
            <div className="kpi-label">Clientes VRF {vrf.id} ({vrf.name})</div>
            <div className="kpi-value" style={{ color: vrf.color }}>{vrfAggregates[vrf.id].toLocaleString()}</div>
            <div className="kpi-foot" style={{ marginTop: 6 }}>
              <span>Tráfico total: {vrf.traffic} Gbps</span>
            </div>
          </div>
        ))}
      </div>

      <div className="row r-2-3">
        {/* Regional aggregates cards */}
        <div className="panel">
          <div className="panel-title">
            <span className="accent"></span>Distribución por Región Geográfica
          </div>
          <div className="regional-list" style={{ display: "grid", gap: 10 }}>
            {regionalAggregates.map((reg) => (
              <div key={reg.name} className="regional-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong>{reg.name}</strong>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--green-2)", fontWeight: "bold" }}>{reg.clients} cli.</span>
                </div>
                <div className="regional-shares">
                  <span style={{ color: "var(--vrf-red)" }}>RED: {reg.RED}</span>
                  <span style={{ color: "var(--vrf-green)" }}>GREEN: {reg.GREEN}</span>
                  <span style={{ color: "var(--vrf-blue)" }}>BLUE: {reg.BLUE}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="section-title" style={{ marginTop: 16 }}>Tendencia de Crecimiento (6 Meses)</div>
          <StackedBars
            rows={growthData}
            keys={["RED", "GREEN", "BLUE"]}
            colors={["#FF5252", "#00C853", "#448AFF"]}
            height={160}
          />
          <div className="legend" style={{ justifyContent: "center", marginTop: 6 }}>
            {vrfs.map((v) => (
              <span key={v.id}><span className="swatch" style={{ background: v.color }}></span>{v.id}</span>
            ))}
          </div>
        </div>

        {/* Nodes detail list */}
        <div className="panel">
          <div className="panel-title">
            <span className="accent"></span>Detalle de Clientes y Direccionamiento por Nodo
            <span className="right">{filteredNodes.length} nodos</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>PoP</th>
                <th>Región</th>
                <th>Clientes RED (Empresarial)</th>
                <th>Clientes GREEN (PyME)</th>
                <th>Clientes BLUE (Micro)</th>
                <th>Clientes Totales</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map((n) => {
                const vNode = X.VRF_BY_NODE[n.id];
                return (
                  <tr key={n.id}>
                    <td><strong>{n.id} — {n.location}</strong></td>
                    <td className="muted">{n.region}</td>
                    <td className="num" style={{ color: "var(--vrf-red)" }}>{vNode.RED.clients} <small className="muted">({vNode.RED.range})</small></td>
                    <td className="num" style={{ color: "var(--vrf-green)" }}>{vNode.GREEN.clients} <small className="muted">({vNode.GREEN.range})</small></td>
                    <td className="num" style={{ color: "var(--vrf-blue)" }}>{vNode.BLUE.clients} <small className="muted">({vNode.BLUE.range})</small></td>
                    <td className="num" style={{ fontWeight: "bold" }}>{n.clients}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ height: 12 }}></div>
      <div className="panel">
        <div className="panel-title"><span className="accent"></span>QoS Carrier por Segmento de Cliente (VRF)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, fontSize: 12, lineHeight: 1.5 }}>
          <div className="qos-policy-card red">
            <h4 style={{ color: "var(--vrf-red)", margin: "0 0 6px" }}>VRF RED (Corporativo)</h4>
            <p><strong>Clasificación:</strong> Tráfico Crítico / Expedited Forwarding (EF).</p>
            <p><strong>Direccionamiento IP:</strong> 10.10.0.0/16 (Segmento por nodo 10.10.[Node_ID].0/24).</p>
            <p><strong>Garantía:</strong> CIR 100%, baja latencia (SLA &lt;5ms metropolitano), tolerancia cero a pérdida de paquetes.</p>
          </div>
          <div className="qos-policy-card green">
            <h4 style={{ color: "var(--vrf-green)", margin: "0 0 6px" }}>VRF GREEN (PyME / Operaciones)</h4>
            <p><strong>Clasificación:</strong> Asegurado / Assured Forwarding (AF21).</p>
            <p><strong>Direccionamiento IP:</strong> 10.20.0.0/16 (Segmento por nodo 10.20.[Node_ID].0/24).</p>
            <p><strong>Garantía:</strong> CIR 50%, PIR 100%, latencia estándar, prioridad para VoIP y VPNs de negocio.</p>
          </div>
          <div className="qos-policy-card blue">
            <h4 style={{ color: "var(--vrf-blue)", margin: "0 0 6px" }}>VRF BLUE (Micro / Residencial-negocio)</h4>
            <p><strong>Clasificación:</strong> Best Effort (BE).</p>
            <p><strong>Direccionamiento IP:</strong> 10.30.0.0/16 (Segmento por nodo 10.30.[Node_ID].0/24).</p>
            <p><strong>Garantía:</strong> CIR 0%, PIR 100%, mejor esfuerzo, prioridad baja ante congestión en anillo de transporte.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ClientsView = ClientsView;
