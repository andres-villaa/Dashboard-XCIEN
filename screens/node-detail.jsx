// Screen 2: Node Detail
const { useState: useStateND, useMemo: useMemoND } = React;

function NodeDetail({ nodeId, goBack }) {
  const X = window.XCIEN;
  const node = X.NODES.find((n) => n.id === nodeId);
  const ifs = X.INTERFACES[nodeId] || [];
  const fiber = X.FIBER[nodeId] || [];
  const inv = X.INVENTORY.find((i) => i.node === nodeId) || {};
  const vrfTraffic = X.VRF_BY_NODE[nodeId] || { RED: { traffic: 0, clients: 0 }, GREEN: { traffic: 0, clients: 0 }, BLUE: { traffic: 0, clients: 0 } };

  // WAN traffic chart series
  const ringIdx = X.RING_ORDER.indexOf(nodeId);
  const prev = X.RING_ORDER[(ringIdx - 1 + X.RING_ORDER.length) % X.RING_ORDER.length];
  const next = X.RING_ORDER[(ringIdx + 1) % X.RING_ORDER.length];
  const tsKey1 = X.RING_TS[`${nodeId}-${prev}`] || X.RING_TS[`${prev}-${nodeId}`];
  const tsKey2 = X.RING_TS[`${nodeId}-${next}`] || X.RING_TS[`${next}-${nodeId}`];

  const wanSeries = [
    { name: `TenGig0/0 → ${prev} (In)`, data: tsKey1?.in || [], color: "#00C853" },
    { name: `TenGig0/0 → ${prev} (Out)`, data: tsKey1?.out || [], color: "#5BE584" },
    { name: `TenGig0/1 → ${next} (In)`, data: tsKey2?.in || [], color: "#FFB300" },
    { name: `TenGig0/1 → ${next} (Out)`, data: tsKey2?.out || [], color: "#FFD54F" },
  ];

  // VRF traffic series (synthetic per-VRF over 24h)
  const seedFor = (s) => {
    const r = [];
    for (let i = 0; i < X.SAMPLES; i++) {
      const hr = i / 12;
      const dn = 0.4 + 0.6 * (0.5 - 0.5 * Math.cos(((hr - 4) / 24) * Math.PI * 2));
      r.push(s * dn * (0.85 + ((i * 17 + s * 31) % 30) / 100));
    }
    return r;
  };

  const vrfSeries = [
    { name: "RED · Corporativo", data: seedFor(vrfTraffic.RED.traffic * 1000), color: "#FF5252" },
    { name: "GREEN · PyME", data: seedFor(vrfTraffic.GREEN.traffic * 1000), color: "#00C853" },
    { name: "BLUE · Micro", data: seedFor(vrfTraffic.BLUE.traffic * 1000), color: "#448AFF" },
  ];

  // Selected device for SNMP/OIDs focus
  const [activeRackDevice, setActiveRackDevice] = useStateND("rax");

  const getTempColor = (t) => {
    if (t > 48) return "var(--red)";
    if (t > 42) return "var(--amber)";
    return "var(--green-2)";
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span style={{ cursor: "pointer", color: "var(--green-2)" }} onClick={goBack}>← Vista General</span>
            {" / "} Detalle de PoP
          </div>
          <div className="page-title">{node.id} · PoP {node.location}</div>
          <div className="page-sub">Región: {node.region} · Dirección: Centro de Nodos Saltillo Metro</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontFamily: "var(--mono)", fontSize: 12 }}>
          <Semaforo value={99.98} />
          <span>Clientes Totales: <strong>{node.clients}</strong></span>
        </div>
      </div>

      {/* Logical Device Stack (Rack representation) */}
      <div className="row r-3-2">
        <div className="panel">
          <div className="panel-title"><span className="accent"></span>Vista de Bastidor (Equipamiento PoP)</div>
          <div className="pop-rack-cabinet">
            
            {/* OADM passive shelf */}
            <div className={`rack-unit oadm ${activeRackDevice === "oadm" ? "active" : ""}`} onClick={() => setActiveRackDevice("oadm")}>
              <div className="rack-unit-ear"></div>
              <div className="rack-unit-face">
                <span className="rack-unit-model">{node.devices.oadm.model}</span>
                <span className="rack-unit-name">{node.devices.oadm.name}</span>
                <span className="rack-unit-status"><span className="led ok"></span> PASSIVE OADM</span>
              </div>
              <div className="rack-unit-ear right"></div>
            </div>

            {/* Raisecom RAX Router */}
            <div className={`rack-unit router ${activeRackDevice === "rax" ? "active" : ""}`} onClick={() => setActiveRackDevice("rax")}>
              <div className="rack-unit-ear"></div>
              <div className="rack-unit-face">
                <span className="rack-unit-model">{node.devices.rax.model}</span>
                <span className="rack-unit-name">{node.devices.rax.name}</span>
                <span className="rack-unit-status">
                  <span className="led ok"></span> SNMP UP · CPU {node.devices.rax.cpu}% · Temp {node.devices.rax.temp}°C
                </span>
              </div>
              <div className="rack-unit-ear right"></div>
            </div>

            {/* Iscom Switch */}
            <div className={`rack-unit switch ${activeRackDevice === "sw" ? "active" : ""}`} onClick={() => setActiveRackDevice("sw")}>
              <div className="rack-unit-ear"></div>
              <div className="rack-unit-face">
                <span className="rack-unit-model">{node.devices.sw.model}</span>
                <span className="rack-unit-name">{node.devices.sw.name}</span>
                <span className="rack-unit-status">
                  <span className={`led ${node.devices.sw.temp > 45 ? "warn" : "ok"}`}></span> 
                  SNMP UP · CPU {node.devices.sw.cpu}% · Temp {node.devices.sw.temp}°C
                </span>
              </div>
              <div className="rack-unit-ear right"></div>
            </div>

          </div>
        </div>

        {/* Selected device details card */}
        <div className="panel">
          <div className="panel-title">
            <span className="accent"></span>Propiedades del Equipo
            <span className="right">{activeRackDevice.toUpperCase()} Agent</span>
          </div>
          {activeRackDevice === "rax" && (
            <div className="device-spec-card">
              <div className="spec-row"><span>Nombre del Elemento</span><strong>{node.devices.rax.name}</strong></div>
              <div className="spec-row"><span>Modelo del Hardware</span><span>{node.devices.rax.model}</span></div>
              <div className="spec-row"><span>IP de Gestión SNMP</span><span>{node.devices.rax.mgmtIp}</span></div>
              <div className="spec-row"><span>Uptime del Router</span><span>{node.devices.rax.uptime}</span></div>
              <div className="spec-row"><span>Temperatura del CPU</span><span style={{ color: getTempColor(node.devices.rax.temp), fontWeight: "bold" }}>{node.devices.rax.temp}°C</span></div>
              <div className="spec-row"><span>OID sysUptime</span><code>{node.devices.rax.oidUptime}</code></div>
              <div className="spec-row"><span>OID CPU Usage</span><code>{node.devices.rax.oidCpu}</code></div>
            </div>
          )}
          {activeRackDevice === "sw" && (
            <div className="device-spec-card">
              <div className="spec-row"><span>Nombre del Elemento</span><strong>{node.devices.sw.name}</strong></div>
              <div className="spec-row"><span>Modelo del Hardware</span><span>{node.devices.sw.model}</span></div>
              <div className="spec-row"><span>IP de Gestión SNMP</span><span>{node.devices.sw.mgmtIp}</span></div>
              <div className="spec-row"><span>Uptime del Switch</span><span>{node.devices.sw.uptime}</span></div>
              <div className="spec-row"><span>Temperatura del CPU</span><span style={{ color: getTempColor(node.devices.sw.temp), fontWeight: "bold" }}>{node.devices.sw.temp}°C</span></div>
              <div className="spec-row"><span>OID sysUptime</span><code>{node.devices.sw.oidUptime}</code></div>
              <div className="spec-row"><span>OID CPU Usage</span><code>{node.devices.sw.oidCpu}</code></div>
            </div>
          )}
          {activeRackDevice === "oadm" && (
            <div className="device-spec-card">
              <div className="spec-row"><span>Nombre del Elemento</span><strong>{node.devices.oadm.name}</strong></div>
              <div className="spec-row"><span>Modelo del Hardware</span><span>{node.devices.oadm.model}</span></div>
              <div className="spec-row"><span>Tipo de Dispositivo</span><span>Multiplexor Óptico Pasivo</span></div>
              <div className="spec-row"><span>Capacidad del Chasis</span><span>Hasta 12 canales CWDM lambdas</span></div>
              <div className="spec-row"><span>Pérdida por Inserción</span><span>~0.8 dB a 1.2 dB por puerto</span></div>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 12 }}></div>

      {/* Interfaces Table with OIDs */}
      <div className="panel">
        <div className="panel-title"><span className="accent"></span>Interfaces de Red & OIDs de Monitoreo</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Interfaz</th>
              <th>Equipo</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Velocidad</th>
              <th>Tráfico IN</th>
              <th>Tráfico OUT</th>
              <th>Utilización</th>
              <th>Errores IN</th>
              <th>OID ifOperStatus / ifInOctets</th>
            </tr>
          </thead>
          <tbody>
            {ifs.map((i) => (
              <tr key={i.name} className={i.status === "down" ? "hot" : ""}>
                <td><strong>{i.name}</strong></td>
                <td className="muted">{i.equipment}</td>
                <td className="muted">{i.desc}</td>
                <td><Pill kind={i.status === "up" ? "up" : "down"}>{i.status.toUpperCase()}</Pill></td>
                <td>{i.speed}</td>
                <td className="num">{i.in.toLocaleString()} Mbps</td>
                <td className="num">{i.out.toLocaleString()} Mbps</td>
                <td><UtilBar value={i.util} /></td>
                <td className="num" style={{ color: i.errIn > 0 ? "var(--red)" : "" }}>{i.errIn}</td>
                <td className="muted" style={{ fontSize: 9 }}>
                  <code>{i.oidStatus}</code><br/>
                  <code>{i.oidIn}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ height: 12 }}></div>
      {/* Time series charts */}
      <div className="row r-2">
        <div className="panel">
          <div className="panel-title"><span className="accent"></span>Tráfico WAN (Ring Links) · 24h</div>
          <LineChart series={wanSeries} height={240} yLabel="Mbps" />
        </div>
        <div className="panel">
          <div className="panel-title"><span className="accent"></span>Tráfico por VRF · 24h</div>
          <LineChart series={vrfSeries} height={240} yLabel="Mbps" fill />
        </div>
      </div>

      <div style={{ height: 12 }}></div>
      {/* Fiber Strands for this PoP */}
      <div className="panel">
        <div className="panel-title">
          <span className="accent"></span>Acceso Óptico · Asignación de Hilos de Fibra
          <span className="right">CWDM {inv.cwdmUsed}/8 · GPON {inv.gponUsed}/24 · Total Clientes {inv.totalClients}</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Hilo</th>
              <th>Nomenclatura</th>
              <th>Tecnología</th>
              <th>Dispositivo Mux/Splitter</th>
              <th>Clientes Conectados</th>
              <th>Capacidad Hilo</th>
              <th>Potencia RX/TX</th>
              <th>Atenuación</th>
              <th>Ocupación</th>
            </tr>
          </thead>
          <tbody>
            {fiber.filter(f => f.status !== "inactive").map((f) => (
              <tr key={f.strand} className={f.status === "critical" ? "hot" : ""}>
                <td><strong>FO-{String(f.strand).padStart(2, "0")}</strong></td>
                <td><code>{f.label}</code></td>
                <td><Pill kind={f.tech.startsWith("CWDM") ? "info" : "vrf-green"}>{f.tech}</Pill></td>
                <td className="muted">{f.device}</td>
                <td className="num">{f.clients}</td>
                <td className="num">{f.max}</td>
                <td className="num">{f.rxPower} / {f.txPower} dBm</td>
                <td className="num" style={{ color: f.loss > 3.0 ? "var(--red)" : "" }}>{f.loss} dB</td>
                <td><UtilBar value={f.occ} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.NodeDetail = NodeDetail;
