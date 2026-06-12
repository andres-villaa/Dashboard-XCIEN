// Screen: Fiber Monitoring
const { useState: useStateFiber, useMemo: useMemoFiber } = React;

function FiberMonitoring() {
  const X = window.XCIEN;
  const [selectedNode, setSelectedNode] = useStateFiber("RB6");
  const [techFilter, setTechFilter] = useStateFiber("all");
  const [statusFilter, setStatusFilter] = useStateFiber("all");
  const [selectedStrand, setSelectedStrand] = useStateFiber(null);

  const getNomenclature = (s, node) => {
    const swNum = Math.floor((s.strand - 1) / 4) + 1;
    return `${node}_SW${swNum}_Hilo${s.strand}`;
  };

  const getPortsValue = (s) => {
    if (s.strand >= 9 && s.strand <= 24) return "—";
    const localStrandIndex = (s.strand - 1) % 4;
    const startPort = localStrandIndex * 9 + 1;
    const endPort = (localStrandIndex + 1) * 9;
    return `[${startPort}-${endPort}]`;
  };

  const getTechnology = (s) => {
    if (s.strand <= 8) return "Conexión Interna";
    if (s.strand <= 24) return "Expansión Futura (Reservado)";
    return "Conexión Clientes";
  };

  const nodeFiber = useMemoFiber(() => {
    return X.FIBER[selectedNode] || [];
  }, [selectedNode]);

  // Filter strands
  const filteredStrands = useMemoFiber(() => {
    return nodeFiber.filter((s) => {
      if (techFilter !== "all" && s.tech.toLowerCase().indexOf(techFilter) === -1) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "critical" && s.status !== "critical") return false;
        if (statusFilter === "warning" && s.status !== "warning") return false;
        if (statusFilter === "ok" && s.status !== "ok" && s.status !== "standby") return false;
        if (statusFilter === "inactive" && s.status !== "inactive") return false;
      }
      return true;
    });
  }, [nodeFiber, techFilter, statusFilter]);

  const activeStrand = useMemoFiber(() => {
    if (!selectedStrand) return nodeFiber[0];
    return nodeFiber.find(s => s.strand === selectedStrand) || nodeFiber[0];
  }, [selectedStrand, nodeFiber]);

  // Compute stats for current node
  const stats = useMemoFiber(() => {
    const total = nodeFiber.length;
    const ok = nodeFiber.filter(s => s.status === "ok" || s.status === "standby").length;
    const warning = nodeFiber.filter(s => s.status === "warning").length;
    const critical = nodeFiber.filter(s => s.status === "critical").length;
    const inactive = nodeFiber.filter(s => s.status === "inactive").length;
    return { total, ok, warning, critical, inactive };
  }, [nodeFiber]);

  const getStrandClass = (s) => {
    if (s.status === "critical") return "crit";
    if (s.status === "warning") return "warn";
    if (s.status === "inactive") return "empty";
    if (s.status === "standby") return "standby";
    return "ok";
  };

  const getSignalStatusText = (s) => {
    if (s.status === "inactive") return "Inactivo / Apagado";
    if (s.status === "critical") return "Falla Crítica (Alta Atenuación)";
    if (s.status === "warning") return "Señal Degradada";
    if (s.status === "standby") return "Reserva / Standby";
    return "Señal Óptima";
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">Transporte Físico · Capa Óptica</div>
          <div className="page-title">Monitoreo de Fibra Óptica</div>
          <div className="page-sub">Monitoreo de potencia y atenuación de fibra metropolitana de 48 hilos (Saltillo)</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="filter-label" style={{ alignSelf: "center" }}>PoP:</span>
          <select className="filter-select" value={selectedNode} onChange={(e) => { setSelectedNode(e.target.value); setSelectedStrand(null); }}>
            {X.NODES.map((n) => (
              <option key={n.id} value={n.id}>{n.id} — {n.location}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="alert-counts" style={{ marginBottom: 16 }}>
        <div className="alert-count" style={{ borderLeft: "3px solid var(--ink-3)" }}>
          <div className="num">{stats.total}</div>
          <div className="lbl">Hilos<br />Totales</div>
        </div>
        <div className="alert-count ok">
          <div className="num">{stats.ok}</div>
          <div className="lbl">Hilos<br />Óptimos</div>
        </div>
        <div className="alert-count warn">
          <div className="num">{stats.warning}</div>
          <div className="lbl">Degradados<br />(Alerta)</div>
        </div>
        <div className="alert-count crit">
          <div className="num">{stats.critical}</div>
          <div className="lbl">Críticos<br />(&gt;3.0dB Loss)</div>
        </div>
        <div className="alert-count" style={{ borderLeft: "3px solid #333" }}>
          <div className="num">{stats.inactive}</div>
          <div className="lbl">Sin Usar<br />(Expansión)</div>
        </div>
      </div>

      <div className="row r-3-2">
        <div className="panel">
          <div className="filterbar" style={{ marginBottom: 16 }}>
            <span className="filter-label">Grupo de Fibra:</span>
            <select className="filter-select" value={techFilter} onChange={(e) => setTechFilter(e.target.value)}>
              <option value="all">Todos los hilos</option>
              <option value="transporte">Transporte (1-4)</option>
              <option value="cwdm">CWDM Empresarial (5-12)</option>
              <option value="expansión">Expansión Reserva (13-24)</option>
              <option value="gpon">GPON Acceso (25-48)</option>
            </select>
            <span className="filter-label" style={{ marginLeft: 12 }}>Estado Óptico:</span>
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Todos</option>
              <option value="ok">Óptimo</option>
              <option value="warning">Degradado</option>
              <option value="critical">Crítico</option>
              <option value="inactive">Apagado</option>
            </select>
            <div style={{ marginLeft: "auto", fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-3)" }}>
              {filteredStrands.length} de {nodeFiber.length} hilos
            </div>
          </div>

          <div className="panel-title">
            <span className="accent"></span>Distribución de Hilos de Fibra
            <span className="right">{selectedNode} · 48 hilos</span>
          </div>

          <div className="fiber-visual-grid">
            {filteredStrands.map((s) => {
              const isSelected = activeStrand.strand === s.strand;
              const cls = getStrandClass(s);
              return (
                <div key={s.strand}
                  className={`strand-box ${cls} ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedStrand(s.strand)}>
                  <div className="strand-header">
                    <span>H{String(s.strand).padStart(2, "0")}</span>
                  </div>
                  <div className="strand-type">{s.tech.split(" ")[0]}</div>
                  <div className="strand-metrics">
                    {s.status === "inactive" ? "OFF" : `${s.loss} dB`}
                  </div>
                  {s.status !== "inactive" && (
                    <div className="strand-power">{s.rxPower} dBm</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="fiber-color-legend">
            <span>Leyenda:</span>
            <span className="leg-item"><span className="sw ok"></span> Óptimo</span>
            <span className="leg-item"><span className="sw standby"></span> Reserva/Standby</span>
            <span className="leg-item"><span className="sw warn"></span> Degradado (&gt;3dB Pérdida)</span>
            <span className="leg-item"><span className="sw crit"></span> Crítico (&gt;5dB Pérdida)</span>
            <span className="leg-item"><span className="sw empty"></span> Reservado/Apagado</span>
          </div>
        </div>

        {/* Strand detailed panel */}
        <div className="panel">
          <div className="panel-title">
            <span className="accent" style={{ background: activeStrand.status === "critical" ? "var(--red)" : activeStrand.status === "warning" ? "var(--amber)" : "var(--green)" }}></span>
            Detalle de Hilo · {getNomenclature(activeStrand, selectedNode)}
          </div>

          <div className="strand-detail-card">
            <div className="detail-row"><span>Nomenclatura</span><strong>{getNomenclature(activeStrand, selectedNode)}</strong></div>
            <div className="detail-row"><span>Propósito/Tecnología</span><span>{getTechnology(activeStrand)}</span></div>
            <div className="detail-row"><span>Ports</span><span>{getPortsValue(activeStrand)}</span></div>
            <div className="detail-row"><span>Ancho de Banda</span><span>{activeStrand.strand <= 4 ? "10 Gbps" : activeStrand.strand <= 12 ? "1 Gbps" : activeStrand.strand <= 24 ? "—" : "2.5 Gbps"}</span></div>
            <div className="detail-row"><span>Estado Óptico</span><span style={{ color: activeStrand.status === "critical" ? "var(--red)" : activeStrand.status === "warning" ? "var(--amber)" : "var(--green-2)", fontWeight: "bold" }}>{getSignalStatusText(activeStrand)}</span></div>

            <div className="section-title" style={{ marginTop: 14 }}>Monitoreo de Potencia Óptica</div>

            <div className="optical-meters">
              <div className="meter-box">
                <span className="lbl">Potencia TX</span>
                <span className="val" style={{ color: activeStrand.status === "inactive" ? "var(--ink-3)" : "#FFF" }}>
                  {activeStrand.status === "inactive" ? "—" : `${activeStrand.txPower} dBm`}
                </span>
                <span className="sub">Valor óptimo: +1.0 a +4.0 dBm</span>
              </div>
              <div className="meter-box">
                <span className="lbl">Potencia RX</span>
                <span className="val" style={{ color: activeStrand.status === "inactive" ? "var(--ink-3)" : activeStrand.rxPower < -22 ? "var(--red)" : "var(--green-2)" }}>
                  {activeStrand.status === "inactive" ? "—" : `${activeStrand.rxPower} dBm`}
                </span>
                <span className="sub">Límite crítico: &lt; -22.0 dBm</span>
              </div>
              <div className="meter-box">
                <span className="lbl">Atenuación (Pérdida)</span>
                <span className="val" style={{ color: activeStrand.status === "inactive" ? "var(--ink-3)" : activeStrand.loss > 3.0 ? "var(--red)" : "var(--green-2)" }}>
                  {activeStrand.status === "inactive" ? "—" : `${activeStrand.loss} dB`}
                </span>
                <span className="sub">Pérdida máx: 3.0 dB CWDM</span>
              </div>
            </div>

            {activeStrand.max > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="section-title">OADM</div>
                <div className="detail-row"><span>Clientes Conectados</span><span>{activeStrand.clients} / {activeStrand.max}</span></div>
                <div className="detail-row" style={{ border: 0, paddingBottom: 0 }}>
                  <span>Tasa de Ocupación</span>
                  <strong>{activeStrand.occ}%</strong>
                </div>
                <div className={`progress ${activeStrand.occ >= 85 ? "red" : activeStrand.occ >= 60 ? "amber" : ""}`} style={{ marginTop: 6 }}>
                  <div style={{ width: `${activeStrand.occ}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 12 }}></div>
      <div className="panel">
        <div className="panel-title"><span className="accent"></span>Inventario de Fibra Óptica - Nomenclatura del Anillo</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, fontSize: 12, lineHeight: 1.6, color: "var(--ink-2)" }}>
          <div>
            <p><strong>Nomenclatura Carrier:</strong> La fibra se identifica en el formato <code>[Origen]_[Hilo]_[Destino]</code>. Por ejemplo, <code>RB6_H1_RB5</code> representa el Hilo 1 que conecta el Nodo Central RB6 al Nodo de Ramos Arizpe RB5.</p>
            <p><strong>Hilos de Transporte Principal (1-2)</strong> y <strong>Hilos de Protección (3-4)</strong> forman la base del anillo de fibra redundante y están conectados en los OADMs de cada nodo para crear la ruta física del anillo Saltillo.</p>
          </div>
          <div>
            <p><strong>CWDM Empresarial (5-12):</strong> Hilos dedicados a multiplexación por división de longitud de onda pasiva. Cada hilo puede albergar hasta 9 lambdas (clientes corporativos de alta prioridad).</p>
            <p><strong>GPON de Acceso (25-48):</strong> Hilos que bajan al splitter óptico pasivo (split 1:64) y se conectan al Switch de acceso Iscom5600 para dar servicio a clientes residenciales y PyME.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

window.FiberMonitoring = FiberMonitoring;
