"use strict";

(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const STORAGE_KEY = "repo-network-map-autosave-v1";
  const FORMAT_VERSION = 1;
  const MAX_HISTORY = 80;

  const DEVICE_CATALOG = [
    ["Endpoints", [
      ["computer", "Desktop"], ["laptop", "Laptop"], ["mobile", "Mobile"], ["tablet", "Tablet"],
      ["printer", "Printer"], ["phone", "VoIP Phone"], ["camera", "Camera"], ["iot", "IoT Device"]
    ]],
    ["Infrastructure", [
      ["router", "Router"], ["switch", "Switch"], ["switch-l3", "Layer 3 Switch"], ["firewall", "Firewall"],
      ["access-point", "Access Point"], ["controller", "Wireless Controller"], ["load-balancer", "Load Balancer"],
      ["vpn", "VPN Gateway"], ["modem", "Modem"]
    ]],
    ["Servers & services", [
      ["server", "Server"], ["vm", "Virtual Machine"], ["hypervisor", "Hypervisor"], ["database", "Database"],
      ["web", "Web Server"], ["dns", "DNS"], ["dhcp", "DHCP"], ["mail", "Mail Server"],
      ["storage", "File Storage"], ["proxy", "Proxy"], ["auth", "Authentication"], ["siem", "SIEM / Logs"]
    ]],
    ["Logical", [
      ["cloud", "Cloud"], ["internet", "Internet"], ["subnet", "Subnet"], ["vlan", "VLAN"],
      ["zone", "Security Zone"], ["site", "Site / Building"], ["rack", "Rack"], ["unknown", "Unknown"]
    ]]
  ];

  const ICONS = {
    computer: '<rect x="5" y="5" width="22" height="15" rx="1"/><path d="M12 25h8M16 20v5"/>',
    laptop: '<path d="M7 7h18v13H7zM4 24h24l-2 3H6z"/>',
    mobile: '<rect x="10" y="4" width="12" height="24" rx="2"/><path d="M14 7h4M15 25h2"/>',
    tablet: '<rect x="7" y="4" width="18" height="24" rx="2"/><circle cx="16" cy="25" r="1"/>',
    printer: '<path d="M9 6h14v7H9zM7 13h18l2 3v8H5v-8zM9 20h14v8H9z"/>',
    phone: '<path d="M10 5h12v8H10zM8 14h16l2 4v9H6v-9zM10 19h12"/>',
    camera: '<rect x="5" y="9" width="22" height="16" rx="2"/><circle cx="16" cy="17" r="5"/><path d="M10 9l2-4h8l2 4"/>',
    iot: '<circle cx="16" cy="16" r="10"/><path d="M12 16h8M16 12v8"/>',
    router: '<rect x="4" y="8" width="24" height="16" rx="3"/><path d="M9 16h14M12 12l-3 4 3 4M20 12l3 4-3 4"/>',
    switch: '<rect x="3" y="8" width="26" height="16" rx="2"/><path d="M7 13h4v3H7zM14 13h4v3h-4zM21 13h4v3h-4zM7 19h4v2H7zM14 19h4v2h-4zM21 19h4v2h-4z"/>',
    "switch-l3": '<rect x="3" y="8" width="26" height="16" rx="2"/><path d="M8 13h16M8 19h16M12 10l-4 3 4 3M20 16l4 3-4 3"/>',
    firewall: '<path d="M5 6h22v20H5zM5 12h22M5 19h22M12 6v6M20 12v7M12 19v7"/>',
    "access-point": '<path d="M16 20v7M10 27h12"/><circle cx="16" cy="16" r="2"/><path d="M11 11a7 7 0 0 1 10 0M7 7a13 13 0 0 1 18 0"/>',
    controller: '<rect x="5" y="6" width="22" height="20" rx="3"/><path d="M10 12h12M10 17h12M10 22h7"/>',
    "load-balancer": '<circle cx="16" cy="7" r="3"/><circle cx="8" cy="24" r="3"/><circle cx="24" cy="24" r="3"/><path d="M16 10v6M16 16H8v5M16 16h8v5"/>',
    vpn: '<path d="M16 4l10 4v7c0 7-4 11-10 14C10 26 6 22 6 15V8z"/><path d="M12 16l3 3 6-7"/>',
    modem: '<rect x="5" y="9" width="22" height="15" rx="2"/><path d="M10 14h2M15 14h2M20 14h2M9 20h14"/>',
    server: '<rect x="6" y="4" width="20" height="24" rx="2"/><path d="M9 10h14M9 16h14M9 22h14"/><circle cx="11" cy="7" r="1"/>',
    vm: '<rect x="5" y="5" width="22" height="22" rx="2"/><rect x="10" y="10" width="12" height="12" rx="1"/>',
    hypervisor: '<rect x="4" y="5" width="24" height="22" rx="2"/><path d="M4 12h24M12 12v15M20 12v15"/>',
    database: '<ellipse cx="16" cy="7" rx="10" ry="4"/><path d="M6 7v18c0 2 4 4 10 4s10-2 10-4V7M6 16c0 2 4 4 10 4s10-2 10-4"/>',
    web: '<circle cx="16" cy="16" r="12"/><path d="M4 16h24M16 4c4 4 4 20 0 24M16 4c-4 4-4 20 0 24"/>',
    dns: '<circle cx="16" cy="16" r="11"/><path d="M8 16h16M16 5v22M9 9l14 14M23 9L9 23"/>',
    dhcp: '<rect x="5" y="6" width="22" height="20" rx="2"/><path d="M10 11h12M10 16h12M10 21h7"/>',
    mail: '<rect x="4" y="7" width="24" height="18" rx="2"/><path d="M5 9l11 9 11-9"/>',
    storage: '<path d="M6 7h8l2 3h10v15H6z"/>',
    proxy: '<path d="M6 10h9l3 3h8M26 22h-9l-3-3H6"/><path d="M22 9l4 4-4 4M10 15l-4 4 4 4"/>',
    auth: '<circle cx="12" cy="12" r="5"/><path d="M4 28c1-7 5-10 8-10s7 3 8 10M22 13h7M26 10v6"/>',
    siem: '<path d="M5 26V8h22v18zM9 21l4-5 4 3 6-8"/>',
    cloud: '<path d="M9 25h15a6 6 0 0 0 0-12 9 9 0 0 0-17-2A7 7 0 0 0 9 25z"/>',
    internet: '<circle cx="16" cy="16" r="12"/><path d="M4 16h24M16 4v24M8 7c6 5 10 5 16 0M8 25c6-5 10-5 16 0"/>',
    subnet: '<rect x="4" y="5" width="24" height="22" rx="2"/><path d="M10 11h4v4h-4zM18 11h4v4h-4zM10 19h4v4h-4zM18 19h4v4h-4z"/>',
    vlan: '<path d="M5 8h22v16H5zM11 8v16M21 8v16"/>',
    zone: '<path d="M16 4l11 6v12l-11 6-11-6V10z"/>',
    site: '<path d="M5 28V12l11-7 11 7v16M10 28V17h12v11"/>',
    rack: '<rect x="7" y="3" width="18" height="26" rx="1"/><path d="M10 8h12M10 14h12M10 20h12M10 26h12"/>',
    unknown: '<circle cx="16" cy="16" r="12"/><path d="M12 12a4 4 0 1 1 5 4v3M16 24h.01"/>'
  };

  const els = {};
  const state = {
    map: createBlankMap(), selection: [], mode: "select", zoom: 1, panX: 0, panY: 0,
    history: [], future: [], dragging: null, connectingFrom: null, activeLayerId: "layer-physical",
    inspectorTab: "details", clipboard: null, dirty: false
  };

  document.addEventListener("DOMContentLoaded", initialise);

  function initialise() {
    cacheElements();
    renderDeviceLibrary();
    bindUI();
    loadAutosave();
    renderAll();
  }

  function cacheElements() {
    ["network-map-canvas","viewport","container-layer","connection-layer","node-layer","attachment-layer","annotation-layer","interaction-layer","canvas-shell","drop-hint","device-library","palette-search","layer-list","inspector-content","zoom-display","save-status","minimap","map-file-input","confirm-dialog"].forEach(id => els[toCamel(id)] = document.getElementById(id));
    els.app = document.querySelector(".network-map-app");
  }

  function bindUI() {
    document.querySelectorAll(".nm-tool[data-mode]").forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode)));
    document.querySelectorAll("[data-inspector-tab]").forEach(button => button.addEventListener("click", () => { state.inspectorTab = button.dataset.inspectorTab; document.querySelectorAll("[data-inspector-tab]").forEach(b => b.classList.toggle("is-active", b === button)); renderInspector(); }));
    byId("toggle-palette").addEventListener("click", () => els.app.classList.toggle("palette-collapsed"));
    byId("toggle-inspector").addEventListener("click", () => els.app.classList.toggle("inspector-collapsed"));
    byId("palette-search").addEventListener("input", renderDeviceLibrary);
    byId("add-layer").addEventListener("click", addLayer);
    byId("undo").addEventListener("click", undo);
    byId("redo").addEventListener("click", redo);
    byId("duplicate").addEventListener("click", duplicateSelection);
    byId("delete-selection").addEventListener("click", deleteSelection);
    byId("zoom-in").addEventListener("click", () => setZoom(state.zoom * 1.15));
    byId("zoom-out").addEventListener("click", () => setZoom(state.zoom / 1.15));
    byId("fit-map").addEventListener("click", fitMap);
    byId("show-minimap").addEventListener("change", e => { els.minimap.hidden = !e.target.checked; });
    byId("new-map").addEventListener("click", () => confirmAction("New map", "Clear the current map and start over?", () => { commit(); state.map = createBlankMap(); state.selection = []; state.activeLayerId = state.map.layers[0].id; resetView(); renderAll(); markDirty(); }));
    byId("import-map").addEventListener("click", () => els.mapFileInput.click());
    els.mapFileInput.addEventListener("change", importMapFile);
    byId("export-json").addEventListener("click", exportJSON);
    byId("export-png").addEventListener("click", exportPNG);
    byId("export-pdf").addEventListener("click", exportPDF);
    byId("export-drawio").addEventListener("click", exportDrawio);
    byId("snap-grid").addEventListener("change", e => { state.map.canvas.snap = e.target.checked; markDirty(); });
    byId("grid-size").addEventListener("change", e => { state.map.canvas.gridSize = Number(e.target.value); updateGridPattern(); markDirty(); });

    els.canvasShell.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
    els.canvasShell.addEventListener("drop", handleDrop);
    els.networkMapCanvas.addEventListener("pointerdown", canvasPointerDown);
    els.networkMapCanvas.addEventListener("pointermove", canvasPointerMove);
    els.networkMapCanvas.addEventListener("pointerup", canvasPointerUp);
    els.networkMapCanvas.addEventListener("pointercancel", canvasPointerUp);
    els.networkMapCanvas.addEventListener("dblclick", canvasDoubleClick);
    els.networkMapCanvas.addEventListener("wheel", canvasWheel, { passive: false });
    els.networkMapCanvas.addEventListener("contextmenu", showContextMenu);
    document.addEventListener("keydown", handleKeyboard);
    window.addEventListener("beforeunload", () => saveAutosave());
    window.addEventListener("resize", drawMinimap);
  }

  function createBlankMap() {
    const now = new Date().toISOString();
    return { format: "repo-network-map", version: FORMAT_VERSION, metadata: { name: "Untitled network", created: now, modified: now }, canvas: { width: 2400, height: 1600, gridSize: 20, snap: true, background: "grid" }, layers: [{ id: "layer-physical", name: "Physical", visible: true, locked: false, opacity: 1 }], nodes: [], connections: [], attachments: [], containers: [], annotations: [] };
  }

  function renderDeviceLibrary() {
    const query = (els.paletteSearch?.value || "").trim().toLowerCase();
    els.deviceLibrary.replaceChildren();
    for (const [group, devices] of DEVICE_CATALOG) {
      const matches = devices.filter(([, label]) => !query || label.toLowerCase().includes(query));
      if (!matches.length) continue;
      const heading = document.createElement("div"); heading.className = "nm-device-group-title"; heading.textContent = group; els.deviceLibrary.append(heading);
      for (const [type, label] of matches) {
        const item = document.createElement("div"); item.className = "nm-device-item"; item.draggable = true; item.dataset.deviceType = type; item.title = `Drag ${label} onto the map`;
        item.innerHTML = `<svg viewBox="0 0 32 32" aria-hidden="true">${ICONS[type] || ICONS.unknown}</svg><span>${escapeHTML(label)}</span>`;
        item.addEventListener("dragstart", e => { e.dataTransfer.setData("application/x-repo-device", type); e.dataTransfer.setData("text/plain", type); });
        els.deviceLibrary.append(item);
      }
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/x-repo-device") || event.dataTransfer.getData("text/plain");
    if (!type || !ICONS[type]) return;
    const p = clientToWorld(event.clientX, event.clientY);
    commit(); addNode(type, p.x, p.y); markDirty(); renderAll();
  }

  function addNode(type, x, y) {
    const label = DEVICE_CATALOG.flatMap(([, d]) => d).find(([id]) => id === type)?.[1] || "Device";
    const node = { id: uid("node"), layerId: state.activeLayerId, type, x: snap(x), y: snap(y), width: 116, height: 88, displayName: uniqueName(label), hostname: "", ipv4: "", ipv6: "", mac: "", subnet: "", gateway: "", vlan: "", dnsNames: "", domain: "", zone: "", manufacturer: "", model: "", serial: "", os: "", osVersion: "", firmware: "", asset: "", location: "", owner: "", status: "unknown", criticality: "", classification: "", managementUrl: "", monitoring: "", lastVerified: "", description: "", notes: "", tags: [], interfaces: [], customFields: {}, style: { accent: "", labelMode: "standard" } };
    state.map.nodes.push(node); state.selection = [node.id]; return node;
  }

  function uniqueName(base) { let n = 1, name = base; const names = new Set(state.map.nodes.map(x => x.displayName)); while (names.has(name)) name = `${base} ${++n}`; return name; }
  function activeLayer() { return state.map.layers.find(l => l.id === state.activeLayerId) || state.map.layers[0]; }

  function renderAll() {
    applyViewport(); renderLayers(); renderContainers(); renderConnections(); renderNodes(); renderAttachments(); renderAnnotations(); renderInteraction(); renderInspector(); els.dropHint.hidden = state.map.nodes.length > 0; updateGridPattern(); drawMinimap(); updateHistoryButtons();
  }

  function renderLayers() {
    els.layerList.replaceChildren();
    state.map.layers.forEach(layer => {
      const row = document.createElement("div"); row.className = `nm-layer-row${layer.id === state.activeLayerId ? " is-active" : ""}`;
      row.innerHTML = `<input type="radio" name="active-layer" ${layer.id === state.activeLayerId ? "checked" : ""} aria-label="Make layer active"><input type="checkbox" ${layer.visible ? "checked" : ""} aria-label="Show layer"><input type="text" value="${escapeAttr(layer.name)}" aria-label="Layer name"><button class="nm-icon-button" type="button" aria-label="Delete layer">×</button>`;
      const [active, visible, name, del] = row.children;
      active.addEventListener("change", () => { state.activeLayerId = layer.id; renderLayers(); });
      visible.addEventListener("change", () => { commit(); layer.visible = visible.checked; markDirty(); renderAll(); });
      name.addEventListener("change", () => { commit(); layer.name = name.value.trim() || "Layer"; markDirty(); renderLayers(); });
      del.addEventListener("click", () => deleteLayer(layer.id));
      els.layerList.append(row);
    });
  }

  function addLayer() { commit(); const layer = { id: uid("layer"), name: `Layer ${state.map.layers.length + 1}`, visible: true, locked: false, opacity: 1 }; state.map.layers.push(layer); state.activeLayerId = layer.id; markDirty(); renderAll(); }
  function deleteLayer(id) { if (state.map.layers.length === 1) return; confirmAction("Delete layer", "Delete this layer and everything on it?", () => { commit(); state.map.layers = state.map.layers.filter(l => l.id !== id); ["nodes","connections","attachments","containers","annotations"].forEach(k => state.map[k] = state.map[k].filter(x => x.layerId !== id)); state.activeLayerId = state.map.layers[0].id; state.selection = []; markDirty(); renderAll(); }); }
  function layerVisible(id) { return state.map.layers.find(l => l.id === id)?.visible !== false; }

  function renderNodes() {
    els.nodeLayer.replaceChildren();
    for (const node of state.map.nodes.filter(n => layerVisible(n.layerId))) {
      const g = svg("g", { class: `nm-node${state.selection.includes(node.id) ? " is-selected" : ""}`, transform: `translate(${node.x} ${node.y})`, "data-id": node.id, "data-kind": "node" });
      g.append(svg("rect", { class: "node-hit", x: -node.width/2, y: -node.height/2, width: node.width, height: node.height, rx: 9 }));
      g.append(svg("rect", { class: "node-card", x: -node.width/2, y: -node.height/2, width: node.width, height: node.height, rx: 9 }));
      const icon = svg("g", { class: "node-icon", transform: "translate(-16 -32)" }); icon.innerHTML = ICONS[node.type] || ICONS.unknown; g.append(icon);
      g.append(svgText(node.displayName || "Unnamed", 0, 23, "node-name"));
      g.append(svgText(node.ipv4 || node.ipv6 || "", 0, 40, "node-ip"));
      const statusColor = { online: "#2da44e", warning: "#bf8700", offline: "#cf222e", unknown: "#8c959f" }[node.status] || "#8c959f";
      g.append(svg("circle", { class: "nm-status-dot", cx: node.width/2 - 9, cy: -node.height/2 + 9, r: 5, fill: statusColor }));
      els.nodeLayer.append(g);
    }
  }

  function renderConnections() {
    els.connectionLayer.replaceChildren();
    for (const c of state.map.connections.filter(x => layerVisible(x.layerId))) {
      const pathData = connectionPath(c); if (!pathData) continue;
      const path = svg("path", { d: pathData, class: `nm-connection${state.selection.includes(c.id) ? " is-selected" : ""}`, "data-id": c.id, "data-kind": "connection" });
      if (c.arrowStart) path.setAttribute("marker-start", "url(#arrow-start)");
      if (c.arrowEnd) path.setAttribute("marker-end", "url(#arrow-end)");
      path.style.strokeDasharray = c.lineStyle === "dashed" ? "8 5" : c.lineStyle === "dotted" ? "2 5" : "";
      path.style.strokeWidth = c.width || 2;
      els.connectionLayer.append(path);
      if (c.label) { const mid = connectionMidpoint(c); els.connectionLayer.append(svgText(c.label, mid.x, mid.y - 7, "nm-connection-label", { "data-id": c.id, "data-kind": "connection" })); }
    }
  }

  function connectionPath(c) {
    const a = findNode(c.sourceId), b = findNode(c.targetId); if (!a || !b) return "";
    const points = [anchorPoint(a, c.sourceAnchor, b), ...(c.joints || []), anchorPoint(b, c.targetAnchor, a)];
    return points.map((p,i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
  }
  function connectionMidpoint(c) { const a = findNode(c.sourceId), b = findNode(c.targetId); const pts = [anchorPoint(a,c.sourceAnchor,b),...(c.joints||[]),anchorPoint(b,c.targetAnchor,a)]; const i = Math.floor((pts.length-1)/2), p=pts[i], q=pts[i+1]; return {x:(p.x+q.x)/2,y:(p.y+q.y)/2}; }
  function anchorPoint(node, anchor, other) { if (!node) return {x:0,y:0}; if (anchor === "top") return {x:node.x,y:node.y-node.height/2}; if (anchor === "bottom") return {x:node.x,y:node.y+node.height/2}; if (anchor === "left") return {x:node.x-node.width/2,y:node.y}; if (anchor === "right") return {x:node.x+node.width/2,y:node.y}; const dx=(other?.x||0)-node.x,dy=(other?.y||0)-node.y; return Math.abs(dx)>Math.abs(dy)?{x:node.x+Math.sign(dx)*node.width/2,y:node.y}:{x:node.x,y:node.y+Math.sign(dy)*node.height/2}; }

  function renderAttachments() {
    els.attachmentLayer.replaceChildren();
    for (const a of state.map.attachments.filter(x => layerVisible(x.layerId))) {
      const parent=findNode(a.parentId); if (!parent) continue;
      els.attachmentLayer.append(svg("path",{class:"nm-attachment-line",d:`M${parent.x} ${parent.y} L${a.x} ${a.y}`}));
      const g=svg("g",{transform:`translate(${a.x} ${a.y})`,"data-id":a.id,"data-kind":"attachment"});
      const h=42+Math.max(1,a.fields.length)*17; g.append(svg("rect",{class:"nm-attachment-card",x:-75,y:-18,width:150,height:h,rx:6}));
      g.append(svgText(a.title||"Information",-66,0,"nm-attachment-title"));
      a.fields.slice(0,6).forEach((f,i)=>g.append(svgText(`${f.name}: ${f.value}`,-66,19+i*16,"nm-attachment-text")));
      els.attachmentLayer.append(g);
    }
  }
  function renderContainers() { els.containerLayer.replaceChildren(); for (const c of state.map.containers.filter(x=>layerVisible(x.layerId))) { const g=svg("g",{"data-id":c.id,"data-kind":"container"}); g.append(svg("rect",{class:"nm-container-shape",x:c.x,y:c.y,width:c.width,height:c.height,rx:8})); g.append(svgText(c.name||"Container",c.x+10,c.y+20,"nm-container-label")); els.containerLayer.append(g); } }
  function renderAnnotations(){ els.annotationLayer.replaceChildren(); for(const a of state.map.annotations.filter(x=>layerVisible(x.layerId))){ const t=svgText(a.text||"Text",a.x,a.y,"nm-annotation-text",{"data-id":a.id,"data-kind":"annotation"}); els.annotationLayer.append(t); } }
  function renderInteraction(){ els.interactionLayer.replaceChildren(); const selectedConnection=state.selection.length===1&&state.map.connections.find(c=>c.id===state.selection[0]); if(selectedConnection){ (selectedConnection.joints||[]).forEach((p,i)=>els.interactionLayer.append(svg("circle",{class:"nm-joint",cx:p.x,cy:p.y,r:6,"data-kind":"joint","data-id":selectedConnection.id,"data-index":i}))); } }

  function canvasPointerDown(event) {
    closeContextMenu(); const target=event.target.closest("[data-id]"); const world=clientToWorld(event.clientX,event.clientY);
    if (state.mode === "pan" || event.button === 1 || event.spaceKey) { state.dragging={kind:"pan",startX:event.clientX,startY:event.clientY,panX:state.panX,panY:state.panY}; els.networkMapCanvas.setPointerCapture(event.pointerId); return; }
    if (target?.dataset.kind === "joint") { const c=state.map.connections.find(x=>x.id===target.dataset.id); if(!c)return; commit(); state.dragging={kind:"joint",connection:c,index:Number(target.dataset.index)}; els.networkMapCanvas.setPointerCapture(event.pointerId); return; }
    if (target) {
      const id=target.dataset.id,kind=target.dataset.kind;
      if(state.mode==="connect"&&kind==="node"){ handleConnectClick(id); return; }
      if(!event.shiftKey&&!state.selection.includes(id)) state.selection=[id]; else if(event.shiftKey) state.selection=state.selection.includes(id)?state.selection.filter(x=>x!==id):[...state.selection,id];
      if(["node","attachment","container","annotation"].includes(kind)){ commit(); const originals=state.selection.map(sel=>{const item=findItem(sel);return item?{id:sel,x:item.x,y:item.y}:null}).filter(Boolean); state.dragging={kind:"items",start:world,originals}; els.networkMapCanvas.setPointerCapture(event.pointerId); }
      renderAll(); return;
    }
    if(state.mode==="attachment"){ const parent=nearestNode(world.x,world.y); if(parent){commit();state.map.attachments.push({id:uid("attachment"),layerId:parent.layerId,parentId:parent.id,x:snap(world.x+170),y:snap(world.y),title:"Information",fields:[{name:"Field",value:"Value"}],notes:""});state.selection=[state.map.attachments.at(-1).id];markDirty();renderAll();}return;}
    if(state.mode==="container"){commit();const c={id:uid("container"),layerId:state.activeLayerId,x:snap(world.x),y:snap(world.y),width:300,height:180,name:"Container",type:"subnet",locked:false};state.map.containers.push(c);state.selection=[c.id];markDirty();renderAll();return;}
    if(state.mode==="text"){const text=prompt("Annotation text:","Note");if(text){commit();const a={id:uid("annotation"),layerId:state.activeLayerId,x:snap(world.x),y:snap(world.y),text};state.map.annotations.push(a);state.selection=[a.id];markDirty();renderAll();}return;}
    state.selection=[]; state.dragging={kind:"selection",start:world,current:world}; els.networkMapCanvas.setPointerCapture(event.pointerId); renderAll();
  }

  function canvasPointerMove(event) {
    if(!state.dragging)return; const w=clientToWorld(event.clientX,event.clientY);
    if(state.dragging.kind==="pan"){state.panX=state.dragging.panX+(event.clientX-state.dragging.startX);state.panY=state.dragging.panY+(event.clientY-state.dragging.startY);applyViewport();drawMinimap();return;}
    if(state.dragging.kind==="joint"){state.dragging.connection.joints[state.dragging.index]={x:snap(w.x),y:snap(w.y)};renderConnections();renderInteraction();markDirty();return;}
    if(state.dragging.kind==="items"){const dx=w.x-state.dragging.start.x,dy=w.y-state.dragging.start.y;state.dragging.originals.forEach(o=>{const item=findItem(o.id);if(item){item.x=snap(o.x+dx);item.y=snap(o.y+dy);}});renderContainers();renderConnections();renderNodes();renderAttachments();renderAnnotations();renderInteraction();markDirty();return;}
    if(state.dragging.kind==="selection"){state.dragging.current=w;renderInteraction();const x=Math.min(state.dragging.start.x,w.x),y=Math.min(state.dragging.start.y,w.y),width=Math.abs(w.x-state.dragging.start.x),height=Math.abs(w.y-state.dragging.start.y);els.interactionLayer.append(svg("rect",{class:"nm-selection-box",x,y,width,height}));}
  }
  function canvasPointerUp(event){if(!state.dragging)return;if(state.dragging.kind==="selection"){const a=state.dragging.start,b=state.dragging.current;const x1=Math.min(a.x,b.x),x2=Math.max(a.x,b.x),y1=Math.min(a.y,b.y),y2=Math.max(a.y,b.y);state.selection=state.map.nodes.filter(n=>n.x>=x1&&n.x<=x2&&n.y>=y1&&n.y<=y2).map(n=>n.id);}state.dragging=null;try{els.networkMapCanvas.releasePointerCapture(event.pointerId)}catch{}renderAll();saveAutosave();}
  function canvasDoubleClick(event){const t=event.target.closest('[data-kind="connection"]');if(!t)return;const c=state.map.connections.find(x=>x.id===t.dataset.id);if(!c)return;const p=clientToWorld(event.clientX,event.clientY);commit();c.joints.push({x:snap(p.x),y:snap(p.y)});state.selection=[c.id];markDirty();renderAll();}
  function canvasWheel(event){event.preventDefault();if(event.ctrlKey||event.metaKey){const before=clientToWorld(event.clientX,event.clientY);setZoom(state.zoom*(event.deltaY<0?1.12:.89),false);const after=worldToClient(before.x,before.y);state.panX+=event.clientX-after.x;state.panY+=event.clientY-after.y;applyViewport();}else{state.panX-=event.deltaX;state.panY-=event.deltaY;applyViewport();}drawMinimap();}

  function handleConnectClick(nodeId){if(!state.connectingFrom){state.connectingFrom=nodeId;state.selection=[nodeId];renderAll();return;}if(state.connectingFrom===nodeId){state.connectingFrom=null;renderAll();return;}commit();state.map.connections.push({id:uid("connection"),layerId:state.activeLayerId,sourceId:state.connectingFrom,targetId:nodeId,sourceAnchor:"auto",targetAnchor:"auto",sourceInterfaceId:"",targetInterfaceId:"",arrowStart:false,arrowEnd:false,label:"",lineStyle:"solid",width:2,color:"",type:"ethernet",protocol:"",vlan:"",bandwidth:"",port:"",cable:"",status:"unknown",description:"",customFields:{},joints:[]});state.selection=[state.map.connections.at(-1).id];state.connectingFrom=null;setMode("select");markDirty();renderAll();}

  function renderInspector(){
    const item=state.selection.length===1?findItem(state.selection[0]):null; els.inspectorContent.replaceChildren(); if(!item){els.inspectorContent.innerHTML='<p class="nm-empty-state">Select an item to edit its details.</p>';return;}
    const kind=itemKind(item);
    if(state.inspectorTab==="details") renderDetailsInspector(item,kind);
    else if(state.inspectorTab==="interfaces") renderInterfacesInspector(item,kind);
    else if(state.inspectorTab==="custom") renderCustomInspector(item,kind);
    else if(state.inspectorTab==="style") renderStyleInspector(item,kind);
    else renderConnectionsInspector(item,kind);
  }

  function section(title){const s=document.createElement("section");s.className="nm-form-section";s.innerHTML=`<h3>${escapeHTML(title)}</h3>`;els.inspectorContent.append(s);return s;}
  function field(parent,label,key,item,type="text",options=[]){const wrap=document.createElement("div");wrap.className="nm-field";const lab=document.createElement("label");lab.textContent=label;let input;if(type==="textarea"){input=document.createElement("textarea");}else if(type==="select"){input=document.createElement("select");options.forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;input.append(o);});}else{input=document.createElement("input");input.type=type;}input.value=item[key]??"";input.addEventListener("change",()=>{commit();item[key]=input.value;markDirty();renderAll();});wrap.append(lab,input);parent.append(wrap);return input;}
  function renderDetailsInspector(item,kind){
    if(kind==="node"){let s=section("Identity");field(s,"Display name","displayName",item);field(s,"Hostname","hostname",item);field(s,"Device type","type",item,"select",DEVICE_CATALOG.flatMap(([,d])=>d).map(([v,t])=>[v,t]));field(s,"Status","status",item,"select",[["unknown","Unknown"],["online","Online"],["warning","Warning"],["offline","Offline"]]);field(s,"Description","description",item,"textarea");
      s=section("Network");field(s,"IPv4 address","ipv4",item);field(s,"IPv6 address","ipv6",item);field(s,"MAC address","mac",item);field(s,"Subnet / prefix","subnet",item);field(s,"Default gateway","gateway",item);field(s,"VLAN","vlan",item);field(s,"DNS names","dnsNames",item);field(s,"Domain","domain",item);field(s,"Security zone","zone",item);
      s=section("System");field(s,"Manufacturer","manufacturer",item);field(s,"Model","model",item);field(s,"Serial number","serial",item);field(s,"Operating system","os",item);field(s,"OS version","osVersion",item);field(s,"Firmware","firmware",item);field(s,"Asset number","asset",item);
      s=section("Administration");field(s,"Location","location",item);field(s,"Owner / POC","owner",item);field(s,"Criticality","criticality",item);field(s,"Classification","classification",item);field(s,"Management URL","managementUrl",item,"url");field(s,"Monitoring","monitoring",item);field(s,"Last verified","lastVerified",item,"date");field(s,"Notes","notes",item,"textarea");
    } else if(kind==="connection"){let s=section("Connection");field(s,"Label","label",item);field(s,"Type","type",item,"select",[["ethernet","Ethernet"],["fiber","Fiber"],["wireless","Wireless"],["vpn","VPN tunnel"],["logical","Logical"],["management","Management"],["replication","Replication"],["traffic","Traffic flow"],["dependency","Dependency"]]);field(s,"Protocol","protocol",item);field(s,"VLAN","vlan",item);field(s,"Bandwidth","bandwidth",item);field(s,"Port","port",item);field(s,"Cable type","cable",item);field(s,"Status","status",item,"select",[["unknown","Unknown"],["online","Online"],["warning","Warning"],["offline","Offline"]]);field(s,"Description","description",item,"textarea");
    } else if(kind==="attachment"){let s=section("Information block");field(s,"Title","title",item);field(s,"Notes","notes",item,"textarea");}
    else if(kind==="container"){let s=section("Container");field(s,"Name","name",item);field(s,"Type","type",item,"select",[["subnet","Subnet"],["vlan","VLAN"],["zone","Security zone"],["site","Site"],["rack","Rack"],["cloud","Cloud"],["group","Group"]]);}
    else {const s=section("Annotation");field(s,"Text","text",item,"textarea");}
  }

  function renderInterfacesInspector(item,kind){if(kind!=="node"){els.inspectorContent.innerHTML='<p class="nm-empty-state">Interfaces are available for devices.</p>';return;}const s=section("Interfaces");const list=document.createElement("div");list.className="nm-repeat-list";s.append(list);const render=()=>{list.replaceChildren();item.interfaces.forEach((intf,i)=>{const row=document.createElement("div");row.className="nm-repeat-row";row.innerHTML=`<input value="${escapeAttr(intf.name||"")}" aria-label="Interface name"><input value="${escapeAttr(intf.ip||"")}" aria-label="Interface IP"><button class="nm-icon-button" type="button">×</button>`;row.children[0].addEventListener("change",e=>{commit();intf.name=e.target.value;markDirty();});row.children[1].addEventListener("change",e=>{commit();intf.ip=e.target.value;markDirty();});row.children[2].addEventListener("click",()=>{commit();item.interfaces.splice(i,1);markDirty();render();});list.append(row);});};render();const add=document.createElement("button");add.className="nm-button";add.type="button";add.textContent="Add interface";add.addEventListener("click",()=>{commit();item.interfaces.push({id:uid("interface"),name:`eth${item.interfaces.length}`,ip:"",mac:"",vlan:"",description:""});markDirty();render();});s.append(add);}

  function renderCustomInspector(item,kind){if(kind==="attachment"){renderNameValueEditor(item.fields,"Fields");return;}if(!item.customFields)item.customFields={};const arr=Object.entries(item.customFields).map(([name,value])=>({name,value}));renderNameValueEditor(arr,"Custom fields",updated=>{item.customFields=Object.fromEntries(updated.filter(f=>f.name).map(f=>[f.name,f.value]));});}
  function renderNameValueEditor(arr,title,onUpdate){const s=section(title);const list=document.createElement("div");list.className="nm-repeat-list";s.append(list);const sync=()=>{if(onUpdate)onUpdate(arr);markDirty();};const render=()=>{list.replaceChildren();arr.forEach((f,i)=>{const row=document.createElement("div");row.className="nm-repeat-row";row.innerHTML=`<input value="${escapeAttr(f.name||"")}" placeholder="Field name"><input value="${escapeAttr(f.value||"")}" placeholder="Value"><button class="nm-icon-button" type="button">×</button>`;row.children[0].addEventListener("change",e=>{commit();f.name=e.target.value;sync();});row.children[1].addEventListener("change",e=>{commit();f.value=e.target.value;sync();});row.children[2].addEventListener("click",()=>{commit();arr.splice(i,1);sync();render();renderAll();});list.append(row);});};render();const add=document.createElement("button");add.className="nm-button";add.type="button";add.textContent="Add field";add.addEventListener("click",()=>{commit();arr.push({name:"",value:""});sync();render();});s.append(add);}
  function renderStyleInspector(item,kind){let s=section("Appearance");if(kind==="connection"){field(s,"Line style","lineStyle",item,"select",[["solid","Solid"],["dashed","Dashed"],["dotted","Dotted"]]);field(s,"Line width","width",item,"number");const a=document.createElement("label");a.className="nm-toolbar-check";a.innerHTML=`<input type="checkbox" ${item.arrowStart?"checked":""}> Arrow at source`;a.querySelector("input").addEventListener("change",e=>{commit();item.arrowStart=e.target.checked;markDirty();renderAll();});s.append(a);const b=a.cloneNode(true);b.lastChild.textContent=" Arrow at destination";b.querySelector("input").checked=item.arrowEnd;b.querySelector("input").addEventListener("change",e=>{commit();item.arrowEnd=e.target.checked;markDirty();renderAll();});s.append(b);}else if(kind==="node"){const p=document.createElement("p");p.className="nm-empty-state";p.textContent="The map shows the display name and primary IP. Additional label modes can be added later.";s.append(p);}else{field(s,"Layer","layerId",item,"select",state.map.layers.map(l=>[l.id,l.name]));}}
  function renderConnectionsInspector(item,kind){const s=section(kind==="node"?"Connected links":"Endpoints");if(kind==="node"){const links=state.map.connections.filter(c=>c.sourceId===item.id||c.targetId===item.id);if(!links.length){s.innerHTML+='<p class="nm-empty-state">No connections.</p>';return;}links.forEach(c=>{const other=findNode(c.sourceId===item.id?c.targetId:c.sourceId);const b=document.createElement("button");b.className="nm-button";b.textContent=`${c.label||c.type} → ${other?.displayName||"Missing device"}`;b.addEventListener("click",()=>{state.selection=[c.id];renderAll();});s.append(b);});}else if(kind==="connection"){const a=findNode(item.sourceId),b=findNode(item.targetId);s.innerHTML+=`<p>${escapeHTML(a?.displayName||"Missing")} → ${escapeHTML(b?.displayName||"Missing")}</p>`;field(s,"Source interface","sourceInterfaceId",item,"select",[["","Automatic"],...(a?.interfaces||[]).map(i=>[i.id,i.name])]);field(s,"Destination interface","targetInterfaceId",item,"select",[["","Automatic"],...(b?.interfaces||[]).map(i=>[i.id,i.name])]);}else{s.innerHTML+='<p class="nm-empty-state">No connection data for this item.</p>';}}

  function setMode(mode){state.mode=mode;state.connectingFrom=null;document.querySelectorAll(".nm-tool[data-mode]").forEach(b=>b.classList.toggle("is-active",b.dataset.mode===mode));els.canvasShell.dataset.mode=mode;}
  function handleKeyboard(e){if(e.target.matches("input,textarea,select")||e.target.isContentEditable)return;const mod=e.ctrlKey||e.metaKey;if(mod&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo();return;}if(mod&&e.key.toLowerCase()==="y"){e.preventDefault();redo();return;}if(mod&&e.key.toLowerCase()==="c"){copySelection();return;}if(mod&&e.key.toLowerCase()==="v"){pasteSelection();return;}if(mod&&e.key.toLowerCase()==="d"){e.preventDefault();duplicateSelection();return;}if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();deleteSelection();return;}if(e.key==="Escape"){setMode("select");state.selection=[];renderAll();return;}if(e.key==="v")setMode("select");else if(e.key==="h")setMode("pan");else if(e.key==="c")setMode("connect");else if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)&&state.selection.length){e.preventDefault();commit();const d=e.shiftKey?10:1;state.selection.forEach(id=>{const item=findItem(id);if(!item)return;if(e.key==="ArrowLeft")item.x-=d;if(e.key==="ArrowRight")item.x+=d;if(e.key==="ArrowUp")item.y-=d;if(e.key==="ArrowDown")item.y+=d;});markDirty();renderAll();}}

  function copySelection(){state.clipboard=state.selection.map(id=>deepClone(findItem(id))).filter(Boolean);}
  function pasteSelection(){if(!state.clipboard?.length)return;commit();state.selection=[];for(const raw of state.clipboard){const item=deepClone(raw);item.id=uid(itemKind(item));item.x=(item.x||0)+30;item.y=(item.y||0)+30;if(item.sourceId||item.targetId)continue;collectionFor(item).push(item);state.selection.push(item.id);}markDirty();renderAll();}
  function duplicateSelection(){copySelection();pasteSelection();}
  function deleteSelection(){if(!state.selection.length)return;commit();const ids=new Set(state.selection);state.map.nodes=state.map.nodes.filter(n=>!ids.has(n.id));state.map.connections=state.map.connections.filter(c=>!ids.has(c.id)&&!ids.has(c.sourceId)&&!ids.has(c.targetId));state.map.attachments=state.map.attachments.filter(a=>!ids.has(a.id)&&!ids.has(a.parentId));state.map.containers=state.map.containers.filter(x=>!ids.has(x.id));state.map.annotations=state.map.annotations.filter(x=>!ids.has(x.id));state.selection=[];markDirty();renderAll();}

  function commit(){state.history.push(JSON.stringify(state.map));if(state.history.length>MAX_HISTORY)state.history.shift();state.future=[];updateHistoryButtons();}
  function undo(){if(!state.history.length)return;state.future.push(JSON.stringify(state.map));state.map=JSON.parse(state.history.pop());state.selection=[];markDirty();renderAll();}
  function redo(){if(!state.future.length)return;state.history.push(JSON.stringify(state.map));state.map=JSON.parse(state.future.pop());state.selection=[];markDirty();renderAll();}
  function updateHistoryButtons(){byId("undo").disabled=!state.history.length;byId("redo").disabled=!state.future.length;}

  function markDirty(){state.map.metadata.modified=new Date().toISOString();state.dirty=true;els.saveStatus.textContent="Saving…";clearTimeout(markDirty.timer);markDirty.timer=setTimeout(()=>{saveAutosave();els.saveStatus.textContent="Saved locally";state.dirty=false;},350);}
  function saveAutosave(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.map));}catch(e){console.warn("Autosave failed",e);els.saveStatus.textContent="Autosave unavailable";}}
  function loadAutosave(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);if(parsed?.format==="repo-network-map")state.map=migrateMap(parsed);}}catch(e){console.warn("Could not load autosave",e);}state.activeLayerId=state.map.layers[0]?.id||"layer-physical";}

  function exportJSON(){downloadBlob(JSON.stringify(state.map,null,2),safeFilename(state.map.metadata.name||"network-map")+".json","application/json");}
  async function importMapFile(e){const file=e.target.files?.[0];e.target.value="";if(!file)return;const text=await file.text();try{commit();if(file.name.match(/\.(drawio|xml|io)$/i)||text.includes("<mxGraphModel"))state.map=importDrawioXML(text);else state.map=migrateMap(JSON.parse(text));state.selection=[];state.activeLayerId=state.map.layers[0]?.id;resetView();markDirty();renderAll();}catch(err){alert(`Could not import map: ${err.message}`);}}

  function exportPNG(){const bounds=mapBounds(60);const clone=els.networkMapCanvas.cloneNode(true);clone.setAttribute("viewBox",`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);clone.setAttribute("width",bounds.width*2);clone.setAttribute("height",bounds.height*2);const style=document.createElementNS(SVG_NS,"style");style.textContent=`.nm-canvas-background{fill:#0d1117}.node-card,.nm-attachment-card{fill:#161b22;stroke:#8b949e}.node-name,.nm-connection-label,.nm-attachment-title,.nm-attachment-text,.nm-annotation-text{fill:#f0f6fc}.node-ip{fill:#8b949e}.node-icon{color:#2dd4bf}.nm-connection,.nm-attachment-line{stroke:#8b949e}.nm-arrow-fill{fill:#8b949e}.nm-container-shape{fill:rgba(45,212,191,.06);stroke:#2dd4bf}.nm-container-label{fill:#2dd4bf}`;clone.prepend(style);const data=new XMLSerializer().serializeToString(clone);const img=new Image();const blob=new Blob([data],{type:"image/svg+xml;charset=utf-8"});const url=URL.createObjectURL(blob);img.onload=()=>{const canvas=document.createElement("canvas");canvas.width=Math.ceil(bounds.width*2);canvas.height=Math.ceil(bounds.height*2);const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);canvas.toBlob(p=>downloadBlob(p,safeFilename(state.map.metadata.name)+".png","image/png"));};img.src=url;}
  function exportPDF(){const bounds=mapBounds(50);const svgTextData=exportStandaloneSVG(bounds);const win=window.open("","_blank");if(!win)return alert("Allow pop-ups to export PDF.");win.document.write(`<title>${escapeHTML(state.map.metadata.name)}</title><style>@page{size:landscape;margin:10mm}html,body{margin:0;background:#fff}svg{width:100%;height:auto}</style>${svgTextData}<script>onload=()=>setTimeout(()=>print(),300)<\/script>`);win.document.close();}
  function exportStandaloneSVG(bounds){const clone=els.networkMapCanvas.cloneNode(true);clone.setAttribute("viewBox",`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);clone.setAttribute("width",bounds.width);clone.setAttribute("height",bounds.height);return new XMLSerializer().serializeToString(clone);}
  function exportDrawio(){const cells=[];state.map.nodes.forEach(n=>cells.push(`<mxCell id="${xml(n.id)}" value="${xml(n.displayName)}&#xa;${xml(n.ipv4||n.ipv6||"")}" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="${n.x-n.width/2}" y="${n.y-n.height/2}" width="${n.width}" height="${n.height}" as="geometry"/></mxCell>`));state.map.connections.forEach(c=>{const points=(c.joints||[]).map(p=>`<mxPoint x="${p.x}" y="${p.y}"/>`).join("");cells.push(`<mxCell id="${xml(c.id)}" value="${xml(c.label||"")}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=${c.arrowEnd?"classic":"none"};startArrow=${c.arrowStart?"classic":"none"};" edge="1" parent="1" source="${xml(c.sourceId)}" target="${xml(c.targetId)}"><mxGeometry relative="1" as="geometry">${points?`<Array as="points">${points}</Array>`:""}</mxGeometry></mxCell>`)});const native=btoa(unescape(encodeURIComponent(JSON.stringify(state.map))));const content=`<mxfile host="repo" modified="${new Date().toISOString()}" agent="Repo Network Map" version="1"><diagram id="page-1" name="Page-1"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="${state.map.canvas.gridSize}" page="0" background="#ffffff"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join("")}<mxCell id="repo-network-map-data" value="${native}" style="text;html=1;opacity=0;" vertex="1" parent="1"><mxGeometry x="-10000" y="-10000" width="1" height="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;downloadBlob(content,safeFilename(state.map.metadata.name)+".drawio","application/xml");}
  function importDrawioXML(text){const doc=new DOMParser().parseFromString(text,"application/xml");const embedded=[...doc.querySelectorAll("mxCell")].find(c=>c.id==="repo-network-map-data");if(embedded?.getAttribute("value")){try{return migrateMap(JSON.parse(decodeURIComponent(escape(atob(embedded.getAttribute("value"))))));}catch{}}
    const map=createBlankMap();const cells=[...doc.querySelectorAll("mxCell")];for(const cell of cells){const geo=cell.querySelector(":scope > mxGeometry");if(!geo)continue;if(cell.getAttribute("vertex")==="1"&&cell.id!=="repo-network-map-data"&&Number(geo.getAttribute("x"))>-9000){const w=Number(geo.getAttribute("width"))||116,h=Number(geo.getAttribute("height"))||88;const parts=(cell.getAttribute("value")||"Imported device").replace(/<[^>]+>/g,"").split(/\n|&#xa;/);map.nodes.push({...addNodeData("unknown"),id:cell.id||uid("node"),x:Number(geo.getAttribute("x"))+w/2,y:Number(geo.getAttribute("y"))+h/2,width:w,height:h,displayName:parts[0]||"Imported device",ipv4:parts[1]||""});}}
    for(const cell of cells){if(cell.getAttribute("edge")!=="1")continue;const geo=cell.querySelector(":scope > mxGeometry");const joints=[...(geo?.querySelectorAll("Array[as='points'] > mxPoint")||[])].map(p=>({x:Number(p.getAttribute("x")),y:Number(p.getAttribute("y"))}));map.connections.push({id:cell.id||uid("connection"),layerId:map.layers[0].id,sourceId:cell.getAttribute("source"),targetId:cell.getAttribute("target"),sourceAnchor:"auto",targetAnchor:"auto",arrowStart:(cell.getAttribute("style")||"").includes("startArrow=classic"),arrowEnd:!(cell.getAttribute("style")||"").includes("endArrow=none"),label:cell.getAttribute("value")||"",lineStyle:"solid",width:2,type:"logical",joints});}return map;}

  function addNodeData(type){return {id:uid("node"),layerId:"layer-physical",type,x:0,y:0,width:116,height:88,displayName:"Device",hostname:"",ipv4:"",ipv6:"",mac:"",subnet:"",gateway:"",vlan:"",dnsNames:"",domain:"",zone:"",manufacturer:"",model:"",serial:"",os:"",osVersion:"",firmware:"",asset:"",location:"",owner:"",status:"unknown",criticality:"",classification:"",managementUrl:"",monitoring:"",lastVerified:"",description:"",notes:"",tags:[],interfaces:[],customFields:{},style:{}};}
  function migrateMap(input){const base=createBlankMap();const m={...base,...input,metadata:{...base.metadata,...input.metadata},canvas:{...base.canvas,...input.canvas}};["layers","nodes","connections","attachments","containers","annotations"].forEach(k=>{if(!Array.isArray(m[k]))m[k]=[];});if(!m.layers.length)m.layers=base.layers;return m;}

  function showContextMenu(e){e.preventDefault();closeContextMenu();const target=e.target.closest("[data-id]");if(target&&!state.selection.includes(target.dataset.id)){state.selection=[target.dataset.id];renderAll();}const menu=document.createElement("div");menu.className="nm-context-menu";menu.innerHTML=`<button data-action="duplicate">Duplicate</button><button data-action="front">Bring forward</button><button data-action="back">Send backward</button><button data-action="delete">Delete</button>`;menu.style.left=`${e.clientX}px`;menu.style.top=`${e.clientY}px`;menu.addEventListener("click",ev=>{const action=ev.target.dataset.action;if(action==="duplicate")duplicateSelection();if(action==="delete")deleteSelection();closeContextMenu();});document.body.append(menu);showContextMenu.menu=menu;}
  function closeContextMenu(){showContextMenu.menu?.remove();showContextMenu.menu=null;}
  function confirmAction(title,message,fn){const dialog=els.confirmDialog;byId("confirm-title").textContent=title;byId("confirm-message").textContent=message;dialog.returnValue="";dialog.addEventListener("close",function handler(){dialog.removeEventListener("close",handler);if(dialog.returnValue==="confirm")fn();});dialog.showModal();}

  function fitMap(){const b=mapBounds(80);const rect=els.canvasShell.getBoundingClientRect();state.zoom=Math.min(1.5,Math.max(.15,Math.min(rect.width/b.width,rect.height/b.height)));state.panX=rect.width/2-(b.x+b.width/2)*state.zoom;state.panY=rect.height/2-(b.y+b.height/2)*state.zoom;applyViewport();drawMinimap();}
  function resetView(){state.zoom=1;state.panX=0;state.panY=0;applyViewport();}
  function setZoom(z,center=true){state.zoom=Math.min(3,Math.max(.15,z));if(center){const r=els.canvasShell.getBoundingClientRect();const world=clientToWorld(r.left+r.width/2,r.top+r.height/2);state.panX=r.width/2-world.x*state.zoom;state.panY=r.height/2-world.y*state.zoom;}applyViewport();drawMinimap();}
  function applyViewport(){els.viewport.setAttribute("transform",`translate(${state.panX} ${state.panY}) scale(${state.zoom})`);els.zoomDisplay.value=`${Math.round(state.zoom*100)}%`;els.zoomDisplay.textContent=els.zoomDisplay.value;}
  function clientToWorld(x,y){const r=els.networkMapCanvas.getBoundingClientRect();return {x:(x-r.left-state.panX)/state.zoom,y:(y-r.top-state.panY)/state.zoom};}
  function worldToClient(x,y){const r=els.networkMapCanvas.getBoundingClientRect();return{x:r.left+state.panX+x*state.zoom,y:r.top+state.panY+y*state.zoom};}
  function updateGridPattern(){const s=state.map.canvas.gridSize||20;const small=document.getElementById("small-grid"),large=document.getElementById("large-grid");small.setAttribute("width",s);small.setAttribute("height",s);small.querySelector("path").setAttribute("d",`M ${s} 0 L 0 0 0 ${s}`);large.setAttribute("width",s*5);large.setAttribute("height",s*5);large.querySelector("rect").setAttribute("width",s*5);large.querySelector("rect").setAttribute("height",s*5);large.querySelector("path").setAttribute("d",`M ${s*5} 0 L 0 0 0 ${s*5}`);}
  function drawMinimap(){if(els.minimap.hidden)return;const ctx=els.minimap.getContext("2d"),w=els.minimap.width,h=els.minimap.height;ctx.clearRect(0,0,w,h);const b=mapBounds(100),scale=Math.min(w/b.width,h/b.height);ctx.fillStyle="#0d1117";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#2dd4bf";ctx.lineWidth=1;state.map.connections.forEach(c=>{const a=findNode(c.sourceId),d=findNode(c.targetId);if(!a||!d)return;ctx.beginPath();ctx.moveTo((a.x-b.x)*scale,(a.y-b.y)*scale);ctx.lineTo((d.x-b.x)*scale,(d.y-b.y)*scale);ctx.stroke();});ctx.fillStyle="#8b949e";state.map.nodes.forEach(n=>ctx.fillRect((n.x-b.x)*scale-2,(n.y-b.y)*scale-2,4,4));const r=els.canvasShell.getBoundingClientRect();ctx.strokeStyle="#f0f6fc";ctx.strokeRect((-state.panX/state.zoom-b.x)*scale,(-state.panY/state.zoom-b.y)*scale,(r.width/state.zoom)*scale,(r.height/state.zoom)*scale);}
  function mapBounds(pad=20){const xs=[],ys=[];state.map.nodes.forEach(n=>{xs.push(n.x-n.width/2,n.x+n.width/2);ys.push(n.y-n.height/2,n.y+n.height/2)});state.map.attachments.forEach(a=>{xs.push(a.x-80,a.x+80);ys.push(a.y-30,a.y+120)});state.map.containers.forEach(c=>{xs.push(c.x,c.x+c.width);ys.push(c.y,c.y+c.height)});state.map.annotations.forEach(a=>{xs.push(a.x,a.x+100);ys.push(a.y-20,a.y+20)});if(!xs.length)return{x:0,y:0,width:800,height:600};const minX=Math.min(...xs)-pad,maxX=Math.max(...xs)+pad,minY=Math.min(...ys)-pad,maxY=Math.max(...ys)+pad;return{x:minX,y:minY,width:Math.max(100,maxX-minX),height:Math.max(100,maxY-minY)};}

  function nearestNode(x,y){return [...state.map.nodes].sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;}
  function findNode(id){return state.map.nodes.find(n=>n.id===id);}
  function findItem(id){for(const k of ["nodes","connections","attachments","containers","annotations"]){const v=state.map[k].find(x=>x.id===id);if(v)return v;}return null;}
  function itemKind(item){if(!item)return"";if("sourceId"in item)return"connection";if("parentId"in item)return"attachment";if("interfaces"in item)return"node";if("width"in item&&"height"in item&&"type"in item)return"container";return"annotation";}
  function collectionFor(item){return state.map[{node:"nodes",connection:"connections",attachment:"attachments",container:"containers",annotation:"annotations"}[itemKind(item)]];}
  function snap(v){return state.map.canvas.snap?Math.round(v/(state.map.canvas.gridSize||20))*(state.map.canvas.gridSize||20):Math.round(v);}
  function uid(prefix){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;}
  function svg(tag,attrs={}){const el=document.createElementNS(SVG_NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));return el;}
  function svgText(text,x,y,className,attrs={}){const el=svg("text",{x,y,class:className,...attrs});el.textContent=text;return el;}
  function byId(id){return document.getElementById(id);}
  function toCamel(s){return s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());}
  function deepClone(v){return JSON.parse(JSON.stringify(v));}
  function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function escapeAttr(s){return escapeHTML(s);}
  function xml(s){return escapeHTML(s);}
  function safeFilename(s){return String(s||"network-map").trim().replace(/[^a-z0-9._-]+/gi,"-").replace(/^-+|-+$/g,"")||"network-map";}
  function downloadBlob(data,name,type){const blob=data instanceof Blob?data:new Blob([data],{type});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);}
})();
