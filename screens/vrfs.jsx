// Screen 5: VRFs & Services
const { useState: useStateVrfs } = React;

function VRFs() {
  const X = window.XCIEN;
  const [selectedVrf, setSelectedVrf] = useStateVrfs("all");

  const stackedRows = X.NODES.map((n) => {
    const t = X.VRF_BY_NODE[n.id];
    return { label: n.id, RED: t.RED.traffic, GREEN: t.GREEN.traffic, BLUE: t.BLUE.traffic };
  });

  const filteredVcIds = X.VC_IDS.filter(vc => selectedVrf === "all" || vc.vrf === selectedVrf);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Servicios L3VPN · Ruteo OSPF / MPLS</div>
          <div className="page-title">VRFs y Servicios de Red</div>
          <div className="page-sub">Segmentación lógica VRF RED, GREEN y BLUE · Pseudowires y circuitos virtuales L2VPN</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="filter-label" style={{ alignSelf: "center" }}>VRF Filtro:</span>
          <select className="filter-select" value={selectedVrf} onChange={(e) => setSelectedVrf(e.target.value)}>
            <option value="all">Todas las VRFs</option>
            <option value="RED">RED (Corporativo)</option>
            <option value="GREEN">GREEN (PyME)</option>
            <option value="BLUE">BLUE (Micro/Residencial)</option>
          </select>
        </div>
      </div>

      {/* VRFs definition cards */}
      <div className="row r-3">
        {X.VRFS.map((v) => {
          if (selectedVrf !== "all" && v.id !== selectedVrf) return null;
          return (
            <div key={v.id} className={`vrf-card ${v.id}`}>
              <div className="vrf-name" style={{ color: v.color }}>VRF · {v.id}</div>
              <div className="vrf-sub">{v.name}</div>
              <div className="vrf-stat"><span>RD (Route Distinguisher)</span><span>{v.rd}</span></div>
              <div className="vrf-stat"><span>RT (Route Target)</span><span>{v.rt}</span></div>
              <div className="vrf-stat"><span>VLANs Asignadas</span><span>{v.vlanRange}</span></div>
              <div className="vrf-stat"><span>Prioridad QoS</span><span>{v.priority}</span></div>
              <div className="vrf-stat"><span>Direccionamiento Global</span><strong>{v.range}</strong></div>
              <div className="vrf-stat"><span>Clientes Activos</span><span style={{ color: v.color, fontWeight: 700 }}>{v.clients.toLocaleString()}</span></div>
              <div className="vrf-stat"><span>Tráfico Consumido</span><span>{v.traffic} Gbps</span></div>
              
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Direccionamiento por PoP</div>
              <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
                {X.NODES.map((n) => {
                  const data = X.VRF_BY_NODE[n.id][v.id];
                  const maxTraffic = Math.max(...X.NODES.map((nn) => X.VRF_BY_NODE[nn.id][v.id].traffic));
                  return (
                    <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)", fontSize: 11 }}>
                      <span style={{ width: 32, color: "var(--ink-2)" }}>{n.id}</span>
                      <span style={{ width: 95, color: "var(--ink-3)", fontSize: 10 }}>{data.range}</span>
                      <div style={{ flex: 1, height: 6, background: "var(--bg-1)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${(data.traffic / maxTraffic) * 100}%`, height: "100%", background: v.color }} />
                      </div>
                      <span style={{ width: 45, textAlign: "right", color: "var(--ink-2)" }}>{data.traffic}G</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 12 }}></div>
      <div className="row r-2">
        {/* Traffic donut chart */}
        <div className="panel">
          <div className="panel-title"><span className="accent"></span>Distribución de Tráfico por Segmento</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "8px 0" }}>
            <Donut
              data={X.VRFS.map((v) => ({ value: v.traffic, color: v.color }))}
              size={180}
              label={X.VRFS.reduce((a, v) => a + v.traffic, 0).toFixed(1) + " G"}
              sublabel="TRÁFICO TOTAL"
            />
            <div style={{ flex: 1 }}>
              {X.VRFS.map((v) => (
                <div key={v.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #16301c" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 12, height: 12, background: v.color, borderRadius: 2 }}></span>
                    <strong>{v.id}</strong> <span style={{ color: "var(--ink-3)" }}>· {v.name}</span>
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{v.traffic} Gbps</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Stacked bars per node */}
        <div className="panel">
          <div className="panel-title"><span className="accent"></span>Tráfico por Nodo · Apilado por VRF</div>
          <StackedBars
            rows={stackedRows}
            keys={["RED", "GREEN", "BLUE"]}
            colors={["#FF5252", "#00C853", "#448AFF"]}
            height={220}
          />
          <div className="legend" style={{ justifyContent: "center", marginTop: 6 }}>
            {X.VRFS.map((v) => (
              <span key={v.id}><span className="swatch" style={{ background: v.color }}></span>{v.id} · {v.name}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 12 }}></div>
      {/* MPLS Virtual Circuits Table */}
      <div className="panel">
        <div className="panel-title">
          <span className="accent"></span>Circuitos Virtuales L2VPN / Pseudowires
          <span className="right">{filteredVcIds.length} circuitos virtuales</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>VC-ID</th>
              <th>VLAN Externa</th>
              <th>VRF VPN</th>
              <th>PoP Origen</th>
              <th>PoP Destino</th>
              <th>Tráfico Promedio</th>
              <th>Estado Operativo</th>
            </tr>
          </thead>
          <tbody>
            {filteredVcIds.map((vc) => (
              <tr key={vc.vcid} className={vc.status === "down" ? "hot" : ""}>
                <td><strong>{vc.vcid}</strong></td>
                <td>VLAN {vc.vlan}</td>
                <td><Pill kind={`vrf-${vc.vrf.toLowerCase()}`}>{vc.vrf}</Pill></td>
                <td>{vc.origin}</td>
                <td>{vc.dest}</td>
                <td className="num">{vc.traffic} Mbps</td>
                <td>
                  <span className="semaforo">
                    <span className={`led ${vc.status === "up" ? "ok" : "crit"}`}></span>
                    {vc.status.toUpperCase()}
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

window.VRFs = VRFs;
