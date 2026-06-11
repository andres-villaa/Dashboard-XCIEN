// Screen: SNMP Monitoring
const { useState: useStateSnmp, useMemo: useMemoSnmp } = React;

function SnmpMonitoring() {
  const X = window.XCIEN;
  const [selectedNode, setSelectedNode] = useStateSnmp("RB6");
  const [selectedDevice, setSelectedDevice] = useStateSnmp("rax");
  const [selectedOidName, setSelectedOidName] = useStateSnmp("sysUptime");
  const [consoleLogs, setConsoleLogs] = useStateSnmp([
    { type: "info", text: "Iniciando SNMP Manager... Listo." },
    { type: "info", text: "Comunidad SNMP: 'public' (Solo Lectura) · Versión: SNMPv2c" }
  ]);

  const activeNode = useMemoSnmp(() => {
    return X.NODES.find(n => n.id === selectedNode) || X.NODES[0];
  }, [selectedNode]);

  const deviceData = useMemoSnmp(() => {
    return activeNode.devices[selectedDevice];
  }, [activeNode, selectedDevice]);

  const executeGet = () => {
    const ip = deviceData.mgmtIp;
    const devName = deviceData.name;
    const oid = X.OIDS[selectedOidName] || "1.3.6.1.2.1.1.3.0";
    
    let responseVal = "";
    if (selectedOidName === "sysUptime") {
      responseVal = `Timeticks: (${deviceData.uptimeTicks}) ${deviceData.uptime}`;
    } else if (selectedOidName.indexOf("Cpu") !== -1) {
      responseVal = `INTEGER: ${deviceData.cpu}%`;
    } else if (selectedOidName.indexOf("Ram") !== -1) {
      responseVal = `INTEGER: ${deviceData.ram}%`;
    } else if (selectedOidName.indexOf("Temp") !== -1) {
      responseVal = `INTEGER: ${deviceData.temp} Celsius`;
    } else if (selectedOidName.startsWith("if")) {
      responseVal = `OCTET STRING: Interfaz de transporte (Ver MIB-II Interfaces table)`;
    } else {
      responseVal = `INTEGER: 0`;
    }

    const command = `snmpget -v2c -c public ${ip} ${oid}`;
    const responseLine = `${oid} = ${responseVal}`;
    
    setConsoleLogs(prev => [
      ...prev,
      { type: "cmd", text: `$ ${command}` },
      { type: "res", text: responseLine }
    ]);
  };

  const executeWalk = () => {
    const ip = deviceData.mgmtIp;
    const devName = deviceData.name;
    const baseOid = "1.3.6.1.2.1.2.2.1"; // MIB-II Interfaces Table base OID
    
    const command = `snmpwalk -v2c -c public ${ip} ${baseOid}`;
    
    // Generate interfaces walk output
    const ifs = X.INTERFACES[selectedNode] || [];
    const walkResults = [];
    
    ifs.forEach((iface, idx) => {
      const idxStr = idx + 1;
      walkResults.push(`${baseOid}.2.${idxStr} = OCTET STRING: "${iface.name}"`);
      walkResults.push(`${baseOid}.8.${idxStr} = INTEGER: ${iface.status === "up" ? 1 : 2} (up/down)`);
      walkResults.push(`${baseOid}.10.${idxStr} = Counter32: ${Math.round(iface.in * 125000)} octets`);
      walkResults.push(`${baseOid}.16.${idxStr} = Counter32: ${Math.round(iface.out * 125000)} octets`);
      walkResults.push(`${baseOid}.14.${idxStr} = Counter32: ${iface.errIn} errors`);
    });

    setConsoleLogs(prev => [
      ...prev,
      { type: "cmd", text: `$ ${command}` },
      ...walkResults.map(r => ({ type: "res", text: r }))
    ]);
  };

  const clearConsole = () => {
    setConsoleLogs([
      { type: "info", text: "Consola de SNMP limpiada." }
    ]);
  };

  // Helper to color statuses
  const getTempColor = (t) => {
    if (t > 48) return "var(--red)";
    if (t > 42) return "var(--amber)";
    return "var(--green-2)";
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">NOC Operaciones · Monitoreo Base</div>
          <div className="page-title">Monitoreo SNMP (MIB / OIDs)</div>
          <div className="page-sub">Consulta de métricas mediante SNMP Agents para Raisecom e Iscom5600</div>
        </div>
      </div>

      {/* Agents Status Overview */}
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-title">
          <span className="accent"></span>Agentes SNMP Activos en Saltillo
          <span className="right">7 Routers RAX7xx + 7 Switches Iscom5600</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Nodo</th>
              <th>Equipo Router (RAX)</th>
              <th>IP RAX</th>
              <th>CPU Router</th>
              <th>Temp RAX</th>
              <th>Equipo Switch (SW)</th>
              <th>IP Switch</th>
              <th>CPU Switch</th>
              <th>Temp Switch</th>
              <th>Uptime</th>
              <th>SNMP Status</th>
            </tr>
          </thead>
          <tbody>
            {X.NODES.map((n) => {
              const rax = n.devices.rax;
              const sw = n.devices.sw;
              return (
                <tr key={n.id}>
                  <td><strong>{n.id}</strong></td>
                  <td className="muted">{rax.name}</td>
                  <td>{rax.mgmtIp}</td>
                  <td><UtilBar value={rax.cpu} width={70} /></td>
                  <td style={{ color: getTempColor(rax.temp), fontFamily: "var(--mono)", fontWeight: "bold" }}>{rax.temp}°C</td>
                  <td className="muted">{sw.name}</td>
                  <td>{sw.mgmtIp}</td>
                  <td><UtilBar value={sw.cpu} width={70} /></td>
                  <td style={{ color: getTempColor(sw.temp), fontFamily: "var(--mono)", fontWeight: "bold" }}>{sw.temp}°C</td>
                  <td className="muted" style={{ fontSize: 11 }}>{rax.uptime}</td>
                  <td><Pill kind="up">ACTIVE</Pill></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="row r-2-3">
        {/* Interactive SNMP Query Tool */}
        <div className="panel">
          <div className="panel-title"><span className="accent"></span>Consultas SNMP (SNMPGET)</div>
          <div className="snmp-form">
            <div className="form-group">
              <label>Seleccionar Nodo PoP</label>
              <select className="filter-select" style={{ width: "100%" }} value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)}>
                {X.NODES.map((n) => <option key={n.id} value={n.id}>{n.id} — {n.location}</option>)}
              </select>
            </div>
            
            <div className="form-group" style={{ marginTop: 10 }}>
              <label>Seleccionar Equipo / Agente</label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className={`btn ${selectedDevice === "rax" ? "primary" : ""}`} onClick={() => setSelectedDevice("rax")}>Router RAX711-E</button>
                <button className={`btn ${selectedDevice === "sw" ? "primary" : ""}`} onClick={() => setSelectedDevice("sw")}>Switch Iscom5600</button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Seleccionar Variable MIB / OID</label>
              <select className="filter-select" style={{ width: "100%" }} value={selectedOidName} onChange={(e) => setSelectedOidName(e.target.value)}>
                <option value="sysUptime">Uptime [1.3.6.1.2.1.1.3.0]</option>
                {selectedDevice === "rax" ? (
                  <>
                    <option value="raxCpuUsage">CPU Uso [1.3.6.1.4.1.28282.1.1.1.0]</option>
                    <option value="raxRamUsage">RAM Uso [1.3.6.1.4.1.28282.1.1.2.0]</option>
                    <option value="raxTemperature">Temperatura [1.3.6.1.4.1.28282.1.1.3.0]</option>
                  </>
                ) : (
                  <>
                    <option value="iscomCpuUsage">CPU Uso [1.3.6.1.4.1.19318.1.1.1.0]</option>
                    <option value="iscomRamUsage">RAM Uso [1.3.6.1.4.1.19318.1.1.2.0]</option>
                    <option value="iscomTemperature">Temperatura [1.3.6.1.4.1.19318.1.1.3.0]</option>
                  </>
                )}
                <option value="ifOperStatus">Estado Interfaz [1.3.6.1.2.1.2.2.1.8]</option>
                <option value="ifInOctets">Tráfico Entrada [1.3.6.1.2.1.2.2.1.10]</option>
                <option value="ifOutOctets">Tráfico Salida [1.3.6.1.2.1.2.2.1.16]</option>
              </select>
            </div>

            <div className="form-actions" style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button className="btn primary" style={{ flex: 1 }} onClick={executeGet}>Ejecutar SNMPGET</button>
              <button className="btn" style={{ flex: 1 }} onClick={executeWalk}>Walk Interfaces</button>
            </div>
          </div>

          <div className="section-title" style={{ marginTop: 14 }}>OIDs Registrados en XCIEN Saltillo</div>
          <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-2)", display: "grid", gap: 4 }}>
            <div>Uptime Global: <code>1.3.6.1.2.1.1.3</code></div>
            <div>Estado de Interfaz: <code>1.3.6.1.2.1.2.2.1.8.[index]</code></div>
            <div>Entrada de Tráfico (Octets): <code>1.3.6.1.2.1.2.2.1.10.[index]</code></div>
            <div>Salida de Tráfico (Octets): <code>1.3.6.1.2.1.2.2.1.16.[index]</code></div>
            <div>Errores de Entrada: <code>1.3.6.1.2.1.2.2.1.14.[index]</code></div>
            <div>Errores de Salida: <code>1.3.6.1.2.1.2.2.1.20.[index]</code></div>
          </div>
        </div>

        {/* SNMP Terminal Emulator Console */}
        <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <div className="panel-title">
            <span className="accent"></span>Consola Interactiva SNMP Manager
            <span className="right" style={{ cursor: "pointer", color: "var(--red)" }} onClick={clearConsole}>LIMPIAR</span>
          </div>
          
          <div className="snmp-console-log">
            {consoleLogs.map((log, index) => (
              <div key={index} className={`log-line ${log.type}`}>
                {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.SnmpMonitoring = SnmpMonitoring;
