// Synthetic SNMP-style data for XCIEN Saltillo NOC dashboard
// 7 RB nodes + 2 ISPs, ring topology, 3 VRFs, 48-strand fiber inventory

window.XCIEN = (function () {
  // Pseudo-random with seed for stable mock data
  let seed = 12345;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Nodos de la Red Metropolitana
  const RAW_NODES = [
    { id: "RB3", lat: 25.4413, lon: -100.9447, location: "Saltillo Oriente", clients: 312, region: "Saltillo Oriente" },
    { id: "RB4", lat: 25.4140, lon: -101.0152, location: "Zona Centro", clients: 198, region: "Saltillo Centro" },
    { id: "RB5", lat: 25.5516, lon: -100.9335, location: "Ramos Arizpe Norte", clients: 145, region: "Ramos Arizpe" },
    { id: "RB6", lat: 25.4559, lon: -100.9923, location: "Paso de Flores", clients: 421, region: "Saltillo Centro" }, // Central
    { id: "RB7", lat: 25.4072, lon: -100.9867, location: "Saltillo Sur", clients: 268, region: "Saltillo Sur" },
    { id: "RB8", lat: 25.5161, lon: -100.9205, location: "El Cortijo", clients: 134, region: "Ramos Arizpe" },
    { id: "RB9", lat: 25.4612, lon: -100.8976, location: "Arteaga", clients: 87, region: "Saltillo Oriente" },
  ];

  // Project lat/lon to SVG (800x520 viewbox roughly centered on Saltillo)
  const minLat = 25.39, maxLat = 25.57;
  const minLon = -101.04, maxLon = -100.87;
  const W = 800, H = 520;
  const project = (lat, lon) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * (W - 120) + 60;
    const y = H - (((lat - minLat) / (maxLat - minLat)) * (H - 120) + 60);
    return { x, y };
  };

  // Ring order: RB6 → RB5 → RB8 → RB9 → RB3 → RB7 → RB4 → RB6
  const RING_ORDER = ["RB6", "RB5", "RB8", "RB9", "RB3", "RB7", "RB4"];

  // Ring links metrics
  const RING_LINKS = [
    { a: "RB6", b: "RB5", km: 6.0, capacity: 10000, util: 49, latency: 2.1, loss: 0.00 },
    { a: "RB5", b: "RB8", km: 4.2, capacity: 10000, util: 38, latency: 1.8, loss: 0.00 },
    { a: "RB8", b: "RB9", km: 6.5, capacity: 10000, util: 52, latency: 2.3, loss: 0.00 },
    { a: "RB9", b: "RB3", km: 5.2, capacity: 10000, util: 41, latency: 2.0, loss: 0.00 },
    { a: "RB3", b: "RB7", km: 5.7, capacity: 10000, util: 67, latency: 2.2, loss: 0.00 },
    { a: "RB7", b: "RB4", km: 3.0, capacity: 10000, util: 84, latency: 1.5, loss: 0.04 }, // Hot link
    { a: "RB4", b: "RB6", km: 5.2, capacity: 10000, util: 73, latency: 2.1, loss: 0.00 },
  ].map((l) => {
    const trafficIn = Math.round((l.util / 100) * l.capacity * (0.85 + rnd() * 0.15));
    const trafficOut = Math.round((l.util / 100) * l.capacity * (0.8 + rnd() * 0.2));
    return {
      ...l,
      trafficIn,
      trafficOut,
      errors: l.util > 80 ? Math.floor(rnd() * 15 + 5) : Math.floor(rnd() * 2),
      status: l.util > 85 ? "critical" : l.util > 70 ? "warn" : "ok",
    };
  });

  // OIDs standard dictionary
  const OIDS = {
    sysUptime: "1.3.6.1.2.1.1.3.0",
    ifOperStatus: "1.3.6.1.2.1.2.2.1.8",
    ifInOctets: "1.3.6.1.2.1.2.2.1.10",
    ifOutOctets: "1.3.6.1.2.1.2.2.1.16",
    ifInErrors: "1.3.6.1.2.1.2.2.1.14",
    ifOutErrors: "1.3.6.1.2.1.2.2.1.20",
    raxCpuUsage: "1.3.6.1.4.1.28282.1.1.1.0",
    raxRamUsage: "1.3.6.1.4.1.28282.1.1.2.0",
    raxTemperature: "1.3.6.1.4.1.28282.1.1.3.0",
    iscomCpuUsage: "1.3.6.1.4.1.19318.1.1.1.0",
    iscomRamUsage: "1.3.6.1.4.1.19318.1.1.2.0",
    iscomTemperature: "1.3.6.1.4.1.19318.1.1.3.0",
  };

  // Generate Equipment stack per node
  const NODES = RAW_NODES.map((n) => {
    const p = project(n.lat, n.lon);
    
    // SNMP simulated values for Raisecom Router RAX7xx
    const raxCpu = Math.floor(25 + rnd() * 40);
    const raxRam = Math.floor(45 + rnd() * 20);
    const raxTemp = Math.floor(42 + rnd() * 15);
    const raxUptimeRaw = 45 + Math.floor(rnd() * 200);
    const raxUptime = `${raxUptimeRaw}d ${Math.floor(rnd() * 24)}h`;
    
    // SNMP simulated values for Access Switch Iscom5600
    const swCpu = Math.floor(15 + rnd() * 30);
    const swRam = Math.floor(30 + rnd() * 15);
    const swTemp = Math.floor(35 + rnd() * 12);
    const swUptimeRaw = raxUptimeRaw - Math.floor(rnd() * 5); // switch rebooted slightly later
    const swUptime = `${swUptimeRaw}d ${Math.floor(rnd() * 24)}h`;

    return {
      ...n,
      x: p.x,
      y: p.y,
      status: "up",
      devices: {
        rax: {
          name: `RAX-${n.id}`,
          model: "Raisecom RAX711-E",
          mgmtIp: `10.0.0.${parseInt(n.id.replace("RB", "")) * 2 + 10}`,
          cpu: raxCpu,
          ram: raxRam,
          temp: raxTemp,
          uptime: raxUptime,
          uptimeTicks: raxUptimeRaw * 8640000,
          status: "up",
          oidCpu: OIDS.raxCpuUsage,
          oidRam: OIDS.raxRamUsage,
          oidTemp: OIDS.raxTemperature,
          oidUptime: OIDS.sysUptime,
        },
        sw: {
          name: `SW-${n.id}`,
          model: "Iscom5600-28C-EI",
          mgmtIp: `10.0.0.${parseInt(n.id.replace("RB", "")) * 2 + 11}`,
          cpu: swCpu,
          ram: swRam,
          temp: swTemp,
          uptime: swUptime,
          uptimeTicks: swUptimeRaw * 8640000,
          status: swTemp > 45 ? "warn" : "up",
          oidCpu: OIDS.iscomCpuUsage,
          oidRam: OIDS.iscomRamUsage,
          oidTemp: OIDS.iscomTemperature,
          oidUptime: OIDS.sysUptime,
        },
        oadm: {
          name: `OADM-${n.id}`,
          model: "Raisecom Passive OADM",
          status: "up"
        }
      }
    };
  });

  // Internet Service Providers (ISP)
  const ISPS = [
    {
      id: "ISP0",
      name: "Telmex Carrier Transit",
      ip: "200.0.0.1/30",
      capacity: 50, // Gbps
      utilPeak: 42,
      latency: 7.8,
      packetLoss: 0.0,
      attachedTo: "RB6",
      status: "up",
    },
    {
      id: "ISP1",
      name: "Cogent Communications",
      ip: "200.0.0.5/30",
      capacity: 50, // Gbps
      utilPeak: 68,
      latency: 11.4,
      packetLoss: 0.05,
      attachedTo: "RB6",
      status: "up",
    },
  ];

  // 24h Time Series traffic simulation (288 points)
  const SAMPLES = 24 * 12;
  const tsTraffic = (peak, baseFloor = 0.3) => {
    const out = [];
    for (let i = 0; i < SAMPLES; i++) {
      const hr = (i / 12);
      const diurnal = baseFloor + (1 - baseFloor) * (0.5 - 0.5 * Math.cos(((hr - 4) / 24) * Math.PI * 2));
      const noise = 0.9 + rnd() * 0.2;
      out.push(Math.max(0, peak * diurnal * noise));
    }
    return out;
  };

  const RING_TS = {};
  RING_LINKS.forEach((l) => {
    const peak = (l.util / 100) * l.capacity;
    RING_TS[`${l.a}-${l.b}`] = {
      in: tsTraffic(peak * 0.55),
      out: tsTraffic(peak * 0.45),
    };
  });

  const ISP_TS = {};
  ISPS.forEach((isp) => {
    const peakGbps = (isp.utilPeak / 100) * isp.capacity;
    ISP_TS[isp.id] = {
      in: tsTraffic(peakGbps * 1000), // Convert to Mbps
      out: tsTraffic(peakGbps * 1000 * 0.35),
    };
  });

  // VRF Segmentation Configurations
  const VRFS = [
    { id: "RED", name: "Corporativo / Empresarial", color: "#FF5252", rd: "65000:10", rt: "65000:10", vlanRange: "100-199", clients: 142, traffic: 22.4, range: "10.10.0.0/16", priority: "Alta (QoS Class 1)" },
    { id: "GREEN", name: "PyME / Operaciones", color: "#00C853", rd: "65000:20", rt: "65000:20", vlanRange: "200-299", clients: 1023, traffic: 41.8, range: "10.20.0.0/16", priority: "Media (QoS Class 2)" },
    { id: "BLUE", name: "Micro / Residencial-negocio", color: "#448AFF", rd: "65000:30", rt: "65000:30", vlanRange: "300-399", clients: 400, traffic: 11.2, range: "10.30.0.0/16", priority: "Baja (QoS Best Effort)" },
  ];

  // VRF Traffic and Client breakdown per Node
  const VRF_BY_NODE = {};
  NODES.forEach((n) => {
    const w = n.clients / 1565;
    VRF_BY_NODE[n.id] = {
      RED: { traffic: +(VRFS[0].traffic * w * (0.8 + rnd() * 0.4)).toFixed(2), clients: Math.round(VRFS[0].clients * w * (0.9 + rnd() * 0.2)), range: `10.10.${parseInt(n.id.replace("RB", ""))}.0/24` },
      GREEN: { traffic: +(VRFS[1].traffic * w * (0.8 + rnd() * 0.4)).toFixed(2), clients: Math.round(VRFS[1].clients * w * (0.9 + rnd() * 0.2)), range: `10.20.${parseInt(n.id.replace("RB", ""))}.0/24` },
      BLUE: { traffic: +(VRFS[2].traffic * w * (0.8 + rnd() * 0.4)).toFixed(2), clients: Math.round(VRFS[2].clients * w * (0.9 + rnd() * 0.2)), range: `10.30.${parseInt(n.id.replace("RB", ""))}.0/24` },
    };
  });

  // Interfaces SNMP variables per Node (Raisecom RAX7xx & SW Iscom5600 combined)
  const INTERFACES = {};
  NODES.forEach((n) => {
    const ringIdx = RING_ORDER.indexOf(n.id);
    const prev = RING_ORDER[(ringIdx - 1 + RING_ORDER.length) % RING_ORDER.length];
    const next = RING_ORDER[(ringIdx + 1) % RING_ORDER.length];
    const linkPrev = RING_LINKS.find((l) => (l.a === n.id && l.b === prev) || (l.a === prev && l.b === n.id));
    const linkNext = RING_LINKS.find((l) => (l.a === n.id && l.b === next) || (l.a === next && l.b === n.id));
    
    INTERFACES[n.id] = [
      {
        name: "TenGig0/0",
        equipment: "RAX711-E",
        desc: `RING → ${prev}`,
        status: "up",
        speed: "10G",
        in: linkPrev ? linkPrev.trafficIn : 1200,
        out: linkPrev ? linkPrev.trafficOut : 1100,
        util: linkPrev ? linkPrev.util : 35,
        errIn: linkPrev ? linkPrev.errors : 0,
        errOut: 0,
        latency: linkPrev ? linkPrev.latency : 1.8,
        packetLoss: linkPrev ? linkPrev.loss : 0.0,
        oidStatus: `${OIDS.ifOperStatus}.1`,
        oidIn: `${OIDS.ifInOctets}.1`,
        oidOut: `${OIDS.ifOutOctets}.1`,
      },
      {
        name: "TenGig0/1",
        equipment: "RAX711-E",
        desc: `RING → ${next}`,
        status: "up",
        speed: "10G",
        in: linkNext ? linkNext.trafficIn : 1100,
        out: linkNext ? linkNext.trafficOut : 1000,
        util: linkNext ? linkNext.util : 33,
        errIn: linkNext ? linkNext.errors : 0,
        errOut: 0,
        latency: linkNext ? linkNext.latency : 1.9,
        packetLoss: linkNext ? linkNext.loss : 0.0,
        oidStatus: `${OIDS.ifOperStatus}.2`,
        oidIn: `${OIDS.ifInOctets}.2`,
        oidOut: `${OIDS.ifOutOctets}.2`,
      },
      {
        name: "Gig1/0",
        equipment: "RAX711-E",
        desc: "CWDM-A Empresarial",
        status: "up",
        speed: "1G",
        in: 410,
        out: 180,
        util: 41,
        errIn: 0,
        errOut: 0,
        latency: 2.5,
        packetLoss: 0.0,
        oidStatus: `${OIDS.ifOperStatus}.3`,
        oidIn: `${OIDS.ifInOctets}.3`,
        oidOut: `${OIDS.ifOutOctets}.3`,
      },
      {
        name: "Gig1/1",
        equipment: "RAX711-E",
        desc: "CWDM-B Empresarial",
        status: "up",
        speed: "1G",
        in: 320,
        out: 140,
        util: 32,
        errIn: 0,
        errOut: 0,
        latency: 2.7,
        packetLoss: 0.0,
        oidStatus: `${OIDS.ifOperStatus}.4`,
        oidIn: `${OIDS.ifInOctets}.4`,
        oidOut: `${OIDS.ifOutOctets}.4`,
      },
      {
        name: "Gig1/2",
        equipment: "SW-Iscom5600",
        desc: "GPON Uplink (Iscom5600)",
        status: "up",
        speed: "1G",
        in: 680,
        out: 220,
        util: 68,
        errIn: 1,
        errOut: 0,
        latency: 3.1,
        packetLoss: 0.0,
        oidStatus: `${OIDS.ifOperStatus}.10`,
        oidIn: `${OIDS.ifInOctets}.10`,
        oidOut: `${OIDS.ifOutOctets}.10`,
      },
      {
        name: "Gig1/3",
        equipment: "SW-Iscom5600",
        desc: "GPON Backup (Iscom5600)",
        status: n.id === "RB3" ? "down" : "up", // Simulated warning
        speed: "1G",
        in: n.id === "RB3" ? 0 : 210,
        out: n.id === "RB3" ? 0 : 90,
        util: n.id === "RB3" ? 0 : 21,
        errIn: 0,
        errOut: 0,
        latency: n.id === "RB3" ? 0 : 3.3,
        packetLoss: n.id === "RB3" ? 100 : 0.0,
        oidStatus: `${OIDS.ifOperStatus}.11`,
        oidIn: `${OIDS.ifInOctets}.11`,
        oidOut: `${OIDS.ifOutOctets}.11`,
      },
      {
        name: "MgmtEth0",
        equipment: "RAX711-E",
        desc: "OOB Management",
        status: "up",
        speed: "1G",
        in: 12,
        out: 8,
        util: 1,
        errIn: 0,
        errOut: 0,
        latency: 1.2,
        packetLoss: 0.0,
        oidStatus: `${OIDS.ifOperStatus}.99`,
        oidIn: `${OIDS.ifInOctets}.99`,
        oidOut: `${OIDS.ifOutOctets}.99`,
      },
    ];
  });

  // Fiber Strands generator (48 hilos per Node)
  // Distribution:
  // Hilos 1-2 → Transporte principal
  // Hilos 3-4 → Protección del anillo
  // Hilos 5-12 → CWDM empresarial
  // Hilos 13-24 → Expansión futura
  // Hilos 25-48 → GPON acceso
  const FIBER = {};
  NODES.forEach((n) => {
    const strands = [];
    const ringIdx = RING_ORDER.indexOf(n.id);
    const nextNode = RING_ORDER[(ringIdx + 1) % RING_ORDER.length];
    const prevNode = RING_ORDER[(ringIdx - 1 + RING_ORDER.length) % RING_ORDER.length];

    for (let s = 1; s <= 48; s++) {
      let tech = "";
      let label = "";
      let status = "ok";
      let rxPower = 0.0;
      let txPower = 0.0;
      let loss = 0.0;
      let clients = 0;
      let maxClients = 0;

      if (s >= 1 && s <= 2) {
        tech = "Transporte Principal";
        label = `${n.id}_H${s}_${nextNode}`;
        status = "ok";
        txPower = +(2.0 + rnd() * 0.8).toFixed(2);
        loss = +(1.1 + rnd() * 0.4).toFixed(2);
        rxPower = +(txPower - loss).toFixed(2);
      } else if (s >= 3 && s <= 4) {
        tech = "Protección Anillo";
        label = `${n.id}_H${s}_${prevNode}`;
        status = "standby"; // standby protection
        txPower = +(2.0 + rnd() * 0.5).toFixed(2);
        loss = +(1.2 + rnd() * 0.5).toFixed(2);
        rxPower = +(txPower - loss).toFixed(2);
      } else if (s >= 5 && s <= 12) {
        tech = "CWDM Empresarial";
        label = `${n.id}_H${s}_CWDM`;
        maxClients = 9;
        clients = Math.floor(rnd() * 8) + 1; // 1 to 8 clients
        txPower = +(1.5 + rnd() * 0.5).toFixed(2);
        loss = +(1.8 + rnd() * 0.8).toFixed(2);
        
        // Simular degradación óptica en hilos específicos
        if ((n.id === "RB7" && s === 5) || (n.id === "RB9" && s === 7)) {
          status = "warning";
          loss = +(3.8 + rnd() * 0.5).toFixed(2); // alta atenuacion
        } else if (n.id === "RB5" && s === 8) {
          status = "critical";
          loss = +(5.4 + rnd() * 0.8).toFixed(2); // pérdida crítica
        }
        rxPower = +(txPower - loss).toFixed(2);
      } else if (s >= 13 && s <= 24) {
        tech = "Expansión Futura";
        label = `${n.id}_H${s}_Reservado`;
        status = "inactive";
        txPower = 0.0;
        loss = 0.0;
        rxPower = -40.0; // sin señal
      } else {
        tech = "GPON Acceso";
        label = `${n.id}_H${s}_GPON`;
        maxClients = 64;
        clients = Math.floor(rnd() * 45) + 5; // 5 to 50 clients
        txPower = +(3.2 + rnd() * 0.5).toFixed(2);
        loss = +(15.2 + rnd() * 1.5).toFixed(2); // splitter 1:64 introduce ~15dB a 18dB de pérdida
        
        if (n.id === "RB3" && s === 25) {
          status = "warning";
          loss = +(18.8 + rnd() * 0.5).toFixed(2);
        }
        rxPower = +(txPower - loss).toFixed(2);
      }

      strands.push({
        strand: s,
        tech,
        label,
        device: s <= 4 ? `OADM-${n.id}` : s <= 12 ? `OADM-${n.id} (Port ${s-4})` : s <= 24 ? "—" : `Splitter-${n.id}-S${s-24}`,
        clients,
        max: maxClients,
        occ: maxClients > 0 ? Math.round((clients / maxClients) * 100) : 0,
        txPower,
        rxPower,
        loss,
        status,
      });
    }
    FIBER[n.id] = strands;
  });

  // Fiber Inventory Summary per Node
  const INVENTORY = NODES.map((n) => {
    const fib = FIBER[n.id];
    const cwdmStrands = fib.filter((s) => s.tech === "CWDM Empresarial");
    const gponStrands = fib.filter((s) => s.tech === "GPON Acceso");
    
    const cwdmUsed = cwdmStrands.filter((s) => s.clients > 0).length;
    const gponUsed = gponStrands.filter((s) => s.clients > 0).length;
    const cwdmClients = cwdmStrands.reduce((a, s) => a + s.clients, 0);
    const gponClients = gponStrands.reduce((a, s) => a + s.clients, 0);
    const totalClients = cwdmClients + gponClients;
    
    // Switch ports occupied by clients + uplink
    const portsUsed = Math.min(48, Math.ceil(totalClients / 12) + 2);
    
    return {
      node: n.id,
      region: n.region,
      strandsTotal: 48,
      cwdmUsed,
      cwdmFree: 8 - cwdmUsed,
      gponUsed,
      gponFree: 24 - gponUsed,
      cwdmClients,
      gponClients,
      totalClients,
      occ: Math.round(((cwdmUsed + gponUsed) / 32) * 100), // 32 active strands
      portsUsed,
      portsFree: 48 - portsUsed,
    };
  });

  // Multiprotocol Label Switching (MPLS) Pseudowires / Virtual Circuits
  const VC_IDS = [];
  let vcid = 1001;
  VRFS.forEach((vrf, vrfIdx) => {
    for (let i = 0; i < 4; i++) {
      const orig = NODES[Math.floor(rnd() * NODES.length)].id;
      let dest = NODES[Math.floor(rnd() * NODES.length)].id;
      while (dest === orig) dest = NODES[Math.floor(rnd() * NODES.length)].id;
      
      const vrfNodeData = VRF_BY_NODE[orig][vrf.id];
      
      VC_IDS.push({
        vcid: vcid++,
        vlan: 100 * (vrfIdx + 1) + i + 10,
        vrf: vrf.id,
        origin: orig,
        dest,
        status: (orig === "RB3" && vrf.id === "BLUE" && i === 0) ? "down" : "up", // Simulated warning PW
        traffic: +((0.2 + rnd() * 0.8) * vrfNodeData.traffic * 80).toFixed(1), // Mbps
      });
    }
  });

  // Simulated alarms list
  const NOW = new Date();
  const fmt = (d) => d.toISOString().replace("T", " ").substring(0, 19);
  const ALERTS = [
    { ts: fmt(new Date(NOW - 4 * 60000)), severity: "critical", node: "RB7", iface: "TenGig0/1", type: "Saturación", desc: "Enlace RB7→RB4 superó umbral crítico de utilización: 84% (>85%)", duration: "4m", state: "active", oid: `${OIDS.ifOutOctets}.2` },
    { ts: fmt(new Date(NOW - 12 * 60000)), severity: "warning", node: "RB4", iface: "TenGig0/0", type: "Saturación", desc: "Enlace RB4→RB6 en alerta de utilización: 73% (>70%)", duration: "12m", state: "active", oid: `${OIDS.ifInOctets}.1` },
    { ts: fmt(new Date(NOW - 25 * 60000)), severity: "critical", node: "RB5", iface: "FO-08", type: "Fibra Degradada", desc: "Atenuación óptica severa en hilo FO-08 (CWDM): 5.4 dB (>3.0 dB)", duration: "25m", state: "active", oid: OIDS.raxTemperature },
    { ts: fmt(new Date(NOW - 38 * 60000)), severity: "warning", node: "ISP1", iface: "—", type: "Latencia", desc: "ISP1 (Cogent) latencia pico 11.4ms (>10ms)", duration: "38m", state: "active", oid: "1.3.6.1.2.1.2.2.1.8.2" },
    { ts: fmt(new Date(NOW - 52 * 60000)), severity: "warning", node: "RB7", iface: "FO-05", type: "Fibra Degradada", desc: "Atenuación óptica en hilo FO-05 (CWDM): 3.8 dB (>3.0 dB)", duration: "52m", state: "active", oid: "—" },
    { ts: fmt(new Date(NOW - 120 * 60000)), severity: "critical", node: "RB3", iface: "SW-RB3", type: "Temperatura Crítica", desc: "Switch SW-RB3 temperatura alcanzó 48°C (Umbral 45°C)", duration: "2h", state: "active", oid: OIDS.iscomTemperature },
    { ts: fmt(new Date(NOW - 130 * 60000)), severity: "warning", node: "RB3", iface: "Gig1/3", type: "Enlace Caído", desc: "Interfaz Gig1/3 (GPON Backup) en estado DOWN", duration: "2h 10m", state: "active", oid: `${OIDS.ifOperStatus}.11` },
    { ts: fmt(new Date(NOW - 4 * 3600000)), severity: "info", node: "RB6", iface: "—", type: "Redundancia", desc: "Anillo G.8032 en estado PROTECTED debido a re-ruteo", duration: "4h", state: "active", oid: "1.3.6.1.4.1.28282.1.2.1" },
    
    // Resolved alarms
    { ts: fmt(new Date(NOW - 6 * 3600000)), severity: "warning", node: "RB8", iface: "TenGig0/1", type: "Errores CRC", desc: "Errores CRC entrantes detectados (12 errores en 5m)", duration: "1h 22m", state: "resolved", oid: `${OIDS.ifInErrors}.2` },
    { ts: fmt(new Date(NOW - 8 * 3600000)), severity: "critical", node: "RB5", iface: "TenGig0/0", type: "Flap", desc: "Interface flapping (3 eventos down/up en 2 min)", duration: "—", state: "resolved", oid: `${OIDS.ifOperStatus}.1` },
    { ts: fmt(new Date(NOW - 18 * 3600000)), severity: "info", node: "RB6", iface: "—", type: "Config", desc: "Configuración guardada en RAX-RB6 por admin@xcien", duration: "—", state: "resolved", oid: "1.3.6.1.4.1.28282.1.3.0" },
  ];

  // Core KPIs aggregation
  const TOTAL_CLIENTS = INVENTORY.reduce((a, x) => a + x.totalClients, 0);
  const TOTAL_TRAFFIC = (VRFS[0].traffic + VRFS[1].traffic + VRFS[2].traffic).toFixed(1);
  const RING_AVAILABILITY = 99.96;
  const INET_AVG_UTIL = Math.round((ISPS[0].utilPeak + ISPS[1].utilPeak) / 2);

  // G.8032 Ring Protection Status (Normal / Protected)
  // Normal = Ring is closed, all nodes connected both ways.
  // Protected = Ring has a link failure, RPL (Ring Protection Link) is unblocked to restore traffic.
  const ringHasFailure = RING_LINKS.some(l => l.errors > 10 || l.util > 80);
  const RING_STATUS = {
    state: ringHasFailure ? "PROTECTED" : "NORMAL",
    rplOwner: "RB6",
    rplLink: "RB6 ↔ RB5",
    rplBlocked: !ringHasFailure, // Blocked in normal state to avoid loops, unblocked in failure.
    convergenceTime: ringHasFailure ? "42 ms" : "—",
  };

  return {
    NODES,
    RING_ORDER,
    RING_LINKS,
    RING_TS,
    ISPS,
    ISP_TS,
    VRFS,
    VRF_BY_NODE,
    INTERFACES,
    FIBER,
    INVENTORY,
    VC_IDS,
    ALERTS,
    OIDS,
    SAMPLES,
    RING_STATUS,
    KPIS: {
      totalClients: TOTAL_CLIENTS,
      clientsByVrf: { RED: VRFS[0].clients, GREEN: VRFS[1].clients, BLUE: VRFS[2].clients },
      totalTraffic: TOTAL_TRAFFIC,
      ringAvailability: RING_AVAILABILITY,
      inetAvgUtil: INET_AVG_UTIL,
    },
    MAP: { W, H },
  };
})();
