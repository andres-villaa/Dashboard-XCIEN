// App shell — sidebar nav + screen routing + global filters
const { useState: useStateApp } = React;

function Sidebar({ screen, setScreen }) {
  const items = [
    {
      group: "OPERACIONES", entries: [
        { id: "overview", label: "Vista General", icon: "dashboard" },
        { id: "links", label: "Monitoreo de Enlaces", icon: "lan" },
        { id: "fiber", label: "Monitoreo de Fibra", icon: "cable" },
        { id: "alerts", label: "Alertas", icon: "warning", badge: 8 },
      ]
    },
    {
      group: "SERVICIOS Y CAPACIDAD", entries: [
        { id: "vrfs", label: "Vista VRF L3VPN", icon: "hub" },
        { id: "clients", label: "Vista de Clientes", icon: "people" },
        { id: "internet", label: "Vista ISP (Salidas)", icon: "public" },
      ]
    },
    {
      group: "PoPs (NODOS METRO)", entries: window.XCIEN.NODES.map((n) => ({
        id: `node:${n.id}`, label: `${n.id} · ${n.location}`, icon: "router",
      }))
    },
  ];

  return (
    <div className="sidebar">
      {items.map((g) => (
        <div className="nav-group" key={g.group}>
          <div className="nav-label">{g.group}</div>
          {g.entries.map((e) => (
            <div key={e.id}
              className={`nav-item ${screen === e.id ? "active" : ""}`}
              onClick={() => setScreen(e.id)}>
              <span className="material-icons ico">{e.icon}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.label}</span>
              {e.badge && <span className="badge">{e.badge}</span>}
            </div>
          ))}
        </div>
      ))}
      <div style={{ padding: "12px", borderTop: "1px solid var(--line)", marginTop: 12, fontSize: 10, color: "var(--ink-3)", fontFamily: "var(--mono)", letterSpacing: "0.1em" }}>
        v2.0 · Saltillo<br />
        Build #2026.05.28
      </div>
    </div>
  );
}

function App() {
  const X = window.XCIEN;
  const [screen, setScreen] = useStateApp("overview");
  const [range, setRange] = useStateApp("24h");

  // Global filters state
  const [showFilters, setShowFilters] = useStateApp(false);
  const [filters, setFilters] = useStateApp({
    node: "all",
    region: "all",
    vrf: "all",
    state: "all",
    saturation: "all",
    isp: "all",
    clientType: "all",
    equipment: "all",
    date: "2026-05-28",
  });

  const goToNode = (id) => setScreen(`node:${id}`);
  const goBack = () => setScreen("overview");

  const resetFilters = () => {
    setFilters({
      node: "all",
      region: "all",
      vrf: "all",
      state: "all",
      saturation: "all",
      isp: "all",
      clientType: "all",
      equipment: "all",
      date: "2026-05-28",
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };

      // Auto-trigger screen changes if node/ISP filter is selected globally
      if (key === "node" && value !== "all") {
        setScreen(`node:${value}`);
      } else if (key === "isp" && value !== "all") {
        setScreen("internet");
      }
      return next;
    });
  };

  // Content routing based on screen state
  let content;
  if (screen === "overview") {
    content = <Overview goToNode={goToNode} globalFilters={filters} />;
  } else if (screen === "links") {
    content = <LinksMonitoring globalFilters={filters} />;
  } else if (screen === "fiber") {
    content = <FiberMonitoring globalFilters={filters} />;
  } else if (screen === "vrfs") {
    content = <VRFs globalFilters={filters} />;
  } else if (screen === "clients") {
    content = <ClientsView globalFilters={filters} />;
  } else if (screen === "internet") {
    content = <InternetExits globalFilters={filters} />;
  } else if (screen === "alerts") {
    content = <Alerts globalFilters={filters} />;
  } else if (screen.startsWith("node:")) {
    content = <NodeDetail nodeId={screen.split(":")[1]} goBack={goBack} globalFilters={filters} />;
  }

  // Count active filters (ignoring "all" and default date)
  const activeFiltersCount = Object.entries(filters).filter(([k, v]) => k !== "date" && v !== "all").length;

  return (
    <div>
      {/* Topbar */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">X</div>
          <div className="brand-text">
            <small>XCIEN</small>
            DASHBOARD SALTILLO
          </div>
        </div>

        <div className="topbar-spacer"></div>

        <button className={`btn filter-toggle-btn ${activeFiltersCount > 0 ? "active" : ""}`} onClick={() => setShowFilters(!showFilters)}>
          🔍 Filtros {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
        </button>

        <div className="range-picker">
          {["1h", "6h", "24h", "7d", "30d"].map((r) => (
            <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
        <div className="last-update">
          <span className="pulse"></span>
          Polled: 21:56:09
        </div>
      </div>

      {/* Global Collapsible Filter Panel */}
      {showFilters && (
        <div className="global-filter-panel">
          <div className="filter-grid">
            <div className="filter-group">
              <label>PoP / Nodo</label>
              <select className="filter-select" value={filters.node} onChange={(e) => handleFilterChange("node", e.target.value)}>
                <option value="all">Todos los Nodos</option>
                {X.NODES.map(n => <option key={n.id} value={n.id}>{n.id} · {n.location}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Región Geográfica</label>
              <select className="filter-select" value={filters.region} onChange={(e) => handleFilterChange("region", e.target.value)}>
                <option value="all">Todas las Regiones</option>
                <option value="Saltillo Centro">Saltillo Centro</option>
                <option value="Saltillo Oriente">Saltillo Oriente</option>
                <option value="Saltillo Sur">Saltillo Sur</option>
                <option value="Ramos Arizpe">Ramos Arizpe</option>
              </select>
            </div>

            <div className="filter-group">
              <label>VPN / VRF</label>
              <select className="filter-select" value={filters.vrf} onChange={(e) => handleFilterChange("vrf", e.target.value)}>
                <option value="all">Todas las VRFs</option>
                <option value="RED">RED (Corporativo)</option>
                <option value="GREEN">GREEN (PyME)</option>
                <option value="BLUE">BLUE (Residencial)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Estado Alarma</label>
              <select className="filter-select" value={filters.state} onChange={(e) => handleFilterChange("state", e.target.value)}>
                <option value="all">Todos</option>
                <option value="active">Activas</option>
                <option value="resolved">Resueltas</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Saturación</label>
              <select className="filter-select" value={filters.saturation} onChange={(e) => handleFilterChange("saturation", e.target.value)}>
                <option value="all">Cualquiera</option>
                <option value="low">Baja (0-50%)</option>
                <option value="normal">Media (51-70%)</option>
                <option value="warn">Alerta (71-85%)</option>
                <option value="crit">Crítica (&gt;85%)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Proveedor ISP</label>
              <select className="filter-select" value={filters.isp} onChange={(e) => handleFilterChange("isp", e.target.value)}>
                <option value="all">Ambos ISPs</option>
                <option value="ISP0">ISP0 (Telmex)</option>
                <option value="ISP1">ISP1 (Cogent)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Tipo de Cliente</label>
              <select className="filter-select" value={filters.clientType} onChange={(e) => handleFilterChange("clientType", e.target.value)}>
                <option value="all">Todos</option>
                <option value="RED">Corporativos</option>
                <option value="GREEN">PyMEs</option>
                <option value="BLUE">Micro/Residencial</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Fabricante/Equipo</label>
              <select className="filter-select" value={filters.equipment} onChange={(e) => handleFilterChange("equipment", e.target.value)}>
                <option value="all">Todos</option>
                <option value="rax">Raisecom RAX7xx</option>
                <option value="sw">Switch Iscom5600</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Fecha de Monitoreo</label>
              <input type="date" className="filter-input" value={filters.date} onChange={(e) => handleFilterChange("date", e.target.value)} />
            </div>
          </div>

          <div className="filter-actions-bar">
            <span>Filtros activos: <strong>{activeFiltersCount}</strong></span>
            <button className="btn" onClick={resetFilters}>Limpiar Filtros</button>
          </div>
        </div>
      )}

      {/* Main shell layout */}
      <div className="shell">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="main">{content}</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
