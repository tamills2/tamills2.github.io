"use strict";

(() => {
  const NS = "http://www.w3.org/2000/svg";
  const PIECE = 92;
  const TAB_DEPTH = PIECE * 0.20;
  const SNAP_SCREEN_PX = 4;
  const MAX_PIECES = 600;

  const setup = document.querySelector("#puzzle-setup");
  const game = document.querySelector("#puzzle-game");
  const workspace = document.querySelector("#puzzle-workspace");
  const svg = document.querySelector("#puzzle-svg");
  const options = document.querySelector("#puzzle-options");
  const countSlider = document.querySelector("#piece-count");
  const countValue = document.querySelector("#piece-count-value");
  const gridValue = document.querySelector("#piece-grid-value");
  const pieceMin = document.querySelector("#piece-min");
  const pieceMax = document.querySelector("#piece-max");
  const imageInfo = document.querySelector("#image-info");
  const rangeInfo = document.querySelector("#piece-range");
  const timerEl = document.querySelector("#puzzle-timer");
  const miniClock = document.querySelector("#puzzle-mini-clock");
  const settings = document.querySelector("#puzzle-settings");
  const menuButton = document.querySelector("#menu-button");
  const pauseButton = document.querySelector("#pause-button");
  const pauseOverlay = document.querySelector("#puzzle-paused");
  const completeOverlay = document.querySelector("#puzzle-complete-overlay");
  const completeTime = document.querySelector("#puzzle-complete-time");
  const completeName = document.querySelector("#puzzle-complete-name");
  const completePreview = document.querySelector("#puzzle-complete-preview");
  const showMiniClock = document.querySelector("#show-mini-clock");
  const changePanel = document.querySelector("#change-pieces-panel");
  const changeSlider = document.querySelector("#change-piece-count");
  const changeValue = document.querySelector("#change-piece-count-value");
  const changeGrid = document.querySelector("#change-piece-grid");
  const changeMin = document.querySelector("#change-piece-min");
  const changeMax = document.querySelector("#change-piece-max");

  let source = null;
  let sourceTitle = "";
  let imgW = 0;
  let imgH = 0;
  let grids = [];
  let pieces = [];
  let groups = new Map();
  let edges = null;
  let layer = null;
  let drag = null;
  let pan = null;
  let zoom = 1;
  let viewX = 0;
  let viewY = 0;
  let elapsed = 0;
  let timerId = 0;
  let timerStarted = false;
  let paused = false;
  let complete = false;
  let currentCols = 0;
  let currentRows = 0;
  let uploadedObjectUrl = null;

  const svgEl = (tag, attrs = {}) => {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, value);
    }
    return element;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  function updateClock() {
    const value = formatTime(elapsed);
    timerEl.textContent = value;
    miniClock.textContent = value;
  }

  function setMenuOpen(open) {
    settings.classList.toggle("is-open", open);
    settings.setAttribute("aria-hidden", String(!open));
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close puzzle menu" : "Open puzzle menu");
    menuButton.querySelector(".menu-dots-icon").hidden = open;
    menuButton.querySelector(".menu-close-icon").hidden = !open;
  }

  function syncMiniClock() {
    miniClock.hidden = !showMiniClock.checked;
    localStorage.setItem("repo-puzzle-mini-clock", String(showMiniClock.checked));
  }

  showMiniClock.checked = localStorage.getItem("repo-puzzle-mini-clock") === "true";
  syncMiniClock();

  fetch("./images/manifest.json", { cache: "no-store" })
    .then(response => response.json())
    .then(items => {
      const select = document.querySelector("#default-image");
      for (const item of items) {
        const option = document.createElement("option");
        option.value = item.file;
        option.textContent = item.title || item.file;
        select.append(option);
      }
    })
    .catch(() => {});

  document.querySelector("#default-image").addEventListener("change", event => {
    if (!event.target.value) return;
    loadSource(`./images/${event.target.value}`, event.target.selectedOptions[0].textContent);
  });

  const uploadInput = document.querySelector("#image-upload");
  const uploadZone = document.querySelector("#upload-dropzone");

  function acceptUpload(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      alert("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (uploadedObjectUrl) URL.revokeObjectURL(uploadedObjectUrl);
    uploadedObjectUrl = URL.createObjectURL(file);
    document.querySelector("#default-image").value = "";
    loadSource(uploadedObjectUrl, file.name);
  }

  uploadInput.addEventListener("change", event => acceptUpload(event.target.files?.[0]));
  uploadZone.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      uploadInput.click();
    }
  });

  ["dragenter", "dragover"].forEach(type => {
    uploadZone.addEventListener(type, event => {
      event.preventDefault();
      event.stopPropagation();
      uploadZone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach(type => {
    uploadZone.addEventListener(type, event => {
      event.preventDefault();
      event.stopPropagation();
      uploadZone.classList.remove("is-dragover");
    });
  });

  uploadZone.addEventListener("drop", event => acceptUpload(event.dataTransfer?.files?.[0]));

  function loadSource(url, title) {
    const image = new Image();
    image.onload = () => {
      source = url;
      sourceTitle = title;
      imgW = image.naturalWidth;
      imgH = image.naturalHeight;
      prepareOptions();
    };
    image.onerror = () => alert("The image could not be loaded.");
    image.src = url;
  }

  function bestGrid(target, aspect) {
    let best = null;
    const maxRows = Math.ceil(Math.sqrt(target / aspect) * 2.3) + 4;
    const maxCols = Math.ceil(Math.sqrt(target * aspect) * 2.3) + 4;

    for (let rows = 2; rows <= maxRows; rows++) {
      for (let cols = 2; cols <= maxCols; cols++) {
        const count = rows * cols;
        if (count < 4) continue;
        const score = Math.abs(count - target) / Math.max(1, target) + Math.abs((cols / rows) - aspect) * .32;
        if (!best || score < best.score) best = { rows, cols, count, score };
      }
    }
    return best;
  }

  function buildGridOptions(aspect, min, max) {
    const targets = [9, 12, 16, 20, 25, 30, 36, 42, 48, 56, 64, 72, 80, 90, 100, 120, 140, 150, 180, 200, 240, 250, 300, 350, 400, 450, 500, 550, 600, max]
      .filter(value => value >= min && value <= max);
    const map = new Map();

    for (const target of targets) {
      const grid = bestGrid(target, aspect);
      if (grid.count >= min && grid.count <= max) map.set(grid.count, grid);
    }

    if (!map.size) {
      const grid = bestGrid(max, aspect);
      map.set(grid.count, grid);
    }

    return [...map.values()].sort((a, b) => a.count - b.count);
  }

  function updateSliderDisplay(slider, valueEl, gridEl) {
    const index = clamp(Number(slider.value), 0, grids.length - 1);
    const grid = grids[index];
    if (!grid) return;
    valueEl.textContent = `${grid.count} pieces`;
    gridEl.textContent = `${grid.cols} × ${grid.rows}`;
  }

  function prepareOptions() {
    const min = 9;
    const max = clamp(Math.floor((imgW * imgH) / 6400), min, MAX_PIECES);
    grids = buildGridOptions(imgW / imgH, min, max);

    const preferredIndex = Math.max(0, grids.findIndex(grid => grid.count >= Math.min(100, max)));
    countSlider.min = "0";
    countSlider.max = String(Math.max(0, grids.length - 1));
    countSlider.value = String(preferredIndex);

    imageInfo.textContent = `${sourceTitle} • ${imgW} × ${imgH}`;
    pieceMin.textContent = String(grids[0]?.count || min);
    pieceMax.textContent = String(grids.at(-1)?.count || max);
    rangeInfo.textContent = `Available range: ${pieceMin.textContent}–${pieceMax.textContent} pieces`;
    updateSliderDisplay(countSlider, countValue, gridValue);
    options.hidden = false;
  }

  countSlider.addEventListener("input", () => updateSliderDisplay(countSlider, countValue, gridValue));

  document.querySelector("#create-puzzle").addEventListener("click", () => {
    const grid = grids[Number(countSlider.value)];
    if (grid) createPuzzle(grid.cols, grid.rows);
  });

  function seededRandom(seedText) {
    let seed = 2166136261;
    for (let i = 0; i < seedText.length; i++) {
      seed ^= seedText.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }
    return () => {
      seed += 0x6D2B79F5;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  const EDGE_PROFILES = [
    { center: .50, neck: .105, bulb: .175, depth: 1.00 },
    { center: .50, neck: .095, bulb: .160, depth: .88 },
    { center: .50, neck: .115, bulb: .190, depth: 1.05 },
    { center: .46, neck: .100, bulb: .170, depth: .94 },
    { center: .54, neck: .100, bulb: .170, depth: .94 },
    { center: .50, neck: .085, bulb: .145, depth: 1.08 },
  ];

  function makeEdge(random) {
    return {
      direction: random() < .5 ? -1 : 1,
      profile: Math.floor(random() * EDGE_PROFILES.length),
    };
  }

  function makeEdges(cols, rows) {
    const random = seededRandom(`${sourceTitle}|${imgW}x${imgH}|${cols}x${rows}`);
    return {
      horizontal: Array.from({ length: (rows - 1) * cols }, () => makeEdge(random)),
      vertical: Array.from({ length: rows * (cols - 1) }, () => makeEdge(random)),
    };
  }

  function oppositeEdge(edge) {
    return edge ? { direction: -edge.direction, profile: edge.profile } : null;
  }

  function pointOnEdge(startX, startY, dx, dy, normalX, normalY, t, normalAmount) {
    return {
      x: startX + dx * t + normalX * normalAmount,
      y: startY + dy * t + normalY * normalAmount,
    };
  }

  function appendClassicEdge(path, startX, startY, endX, endY, normalX, normalY, edge) {
    const dx = endX - startX;
    const dy = endY - startY;
    const profile = EDGE_PROFILES[edge.profile] || EDGE_PROFILES[0];
    const depth = TAB_DEPTH * profile.depth * edge.direction;
    const center = profile.center;
    const neckLeft = center - profile.neck;
    const neckRight = center + profile.neck;
    const bulbLeft = center - profile.bulb;
    const bulbRight = center + profile.bulb;
    const point = (t, normalAmount = 0) => pointOnEdge(startX, startY, dx, dy, normalX, normalY, t, normalAmount);

    // A conventional jigsaw connection: straight run, narrow neck, rounded bulb,
    // matching narrow neck, then straight run. The slight horizontal reversal
    // around the neck gives tabs and sockets the familiar puzzle-piece silhouette.
    const shoulderIn = point(bulbLeft);
    const neckIn = point(neckLeft, depth * .18);
    const crown = point(center, depth);
    const neckOut = point(neckRight, depth * .18);
    const shoulderOut = point(bulbRight);

    const c1 = point(bulbLeft + .025, 0);
    const c2 = point(neckLeft + .018, depth * .02);
    const c3 = point(neckLeft - .025, depth * .38);
    const c4 = point(center - profile.bulb * .72, depth * .96);
    const c5 = point(center - profile.bulb * .38, depth);
    const c6 = point(center + profile.bulb * .38, depth);
    const c7 = point(center + profile.bulb * .72, depth * .96);
    const c8 = point(neckRight + .025, depth * .38);
    const c9 = point(neckRight - .018, depth * .02);
    const c10 = point(bulbRight - .025, 0);

    path.push(`L ${shoulderIn.x} ${shoulderIn.y}`);
    path.push(`C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${neckIn.x} ${neckIn.y}`);
    path.push(`C ${c3.x} ${c3.y} ${c4.x} ${c4.y} ${crown.x} ${crown.y}`);
    path.push(`C ${c6.x} ${c6.y} ${c7.x} ${c7.y} ${neckOut.x} ${neckOut.y}`);
    path.push(`C ${c8.x} ${c8.y} ${c9.x} ${c9.y} ${shoulderOut.x} ${shoulderOut.y}`);
    path.push(`L ${endX} ${endY}`);
  }

  function piecePath(edge) {
    const path = ["M 0 0"];

    if (edge.top) appendClassicEdge(path, 0, 0, PIECE, 0, 0, -1, edge.top);
    else path.push(`L ${PIECE} 0`);

    if (edge.right) appendClassicEdge(path, PIECE, 0, PIECE, PIECE, 1, 0, edge.right);
    else path.push(`L ${PIECE} ${PIECE}`);

    if (edge.bottom) appendClassicEdge(path, PIECE, PIECE, 0, PIECE, 0, 1, edge.bottom);
    else path.push(`L 0 ${PIECE}`);

    if (edge.left) appendClassicEdge(path, 0, PIECE, 0, 0, -1, 0, edge.left);
    else path.push("L 0 0");

    path.push("Z");
    return path.join(" ");
  }

  function createPuzzle(cols, rows, reuseEdges = null) {
    if (!source) return;

    setup.hidden = true;
    game.hidden = false;
    setMenuOpen(false);
    changePanel.hidden = true;
    currentCols = cols;
    currentRows = rows;
    complete = false;
    elapsed = 0;
    timerStarted = false;
    paused = false;
    pauseOverlay.hidden = true;
    completeOverlay.hidden = true;
    syncPauseIcons();
    stopTimer();
    updateClock();
    zoom = 1;
    viewX = 0;
    viewY = 0;
    pieces = [];
    groups.clear();
    svg.replaceChildren();

    const defs = svgEl("defs");
    const masterImage = svgEl("image", {
      id: "puzzle-source-image",
      href: source,
      x: 0,
      y: 0,
      width: cols * PIECE,
      height: rows * PIECE,
      preserveAspectRatio: "none",
    });
    defs.append(masterImage);

    layer = svgEl("g", { id: "pieces-layer" });
    svg.append(defs, layer);
    edges = reuseEdges || makeEdges(cols, rows);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = row * cols + col;
        const solvedX = col * PIECE;
        const solvedY = row * PIECE;
        const edge = {
          top: row === 0 ? null : oppositeEdge(edges.horizontal[(row - 1) * cols + col]),
          bottom: row === rows - 1 ? null : edges.horizontal[row * cols + col],
          left: col === 0 ? null : oppositeEdge(edges.vertical[row * (cols - 1) + (col - 1)]),
          right: col === cols - 1 ? null : edges.vertical[row * (cols - 1) + col],
        };

        const pathData = piecePath(edge);
        const clip = svgEl("clipPath", { id: `clip-${id}`, clipPathUnits: "userSpaceOnUse" });
        clip.append(svgEl("path", { d: pathData }));
        defs.append(clip);

        const pieceGroup = svgEl("g", { class: "puzzle-piece", "data-id": id });
        const clipped = svgEl("g", { "clip-path": `url(#clip-${id})` });
        const use = svgEl("use", {
          href: "#puzzle-source-image",
          x: -solvedX,
          y: -solvedY,
        });
        clipped.append(use);
        pieceGroup.append(clipped, svgEl("path", { d: pathData, class: "puzzle-piece-outline" }));
        layer.append(pieceGroup);

        const piece = {
          id,
          row,
          col,
          solvedX,
          solvedY,
          x: 0,
          y: 0,
          group: id,
          el: pieceGroup,
        };
        pieces.push(piece);
        groups.set(id, new Set([id]));
        pieceGroup.addEventListener("pointerdown", event => startPieceDrag(event, piece));
      }
    }

    document.querySelector("#settings-preview").src = source;
    document.querySelector("#settings-title").textContent = sourceTitle;
    document.querySelector("#settings-piece-info").textContent = `${pieces.length} pieces (${cols} × ${rows})`;

    configureChangeSlider(cols, rows);
    requestAnimationFrame(() => {
      resizeView();
      scatterAllPieces();
    });
  }

  function configureChangeSlider(cols, rows) {
    const currentIndex = Math.max(0, grids.findIndex(grid => grid.cols === cols && grid.rows === rows));
    changeSlider.min = "0";
    changeSlider.max = String(Math.max(0, grids.length - 1));
    changeSlider.value = String(currentIndex);
    changeMin.textContent = String(grids[0]?.count || "");
    changeMax.textContent = String(grids.at(-1)?.count || "");
    updateSliderDisplay(changeSlider, changeValue, changeGrid);
  }

  changeSlider.addEventListener("input", () => updateSliderDisplay(changeSlider, changeValue, changeGrid));

  function resizeView() {
    if (game.hidden) return;
    const rect = workspace.getBoundingClientRect();
    const width = Math.max(1, rect.width) / zoom;
    const height = Math.max(1, rect.height) / zoom;
    svg.setAttribute("viewBox", `${viewX} ${viewY} ${width} ${height}`);
  }

  new ResizeObserver(resizeView).observe(workspace);

  function position(piece) {
    piece.el.setAttribute("transform", `translate(${piece.x} ${piece.y})`);
  }

  function groupPieces(groupId) {
    return [...(groups.get(groupId) || [])].map(id => pieces[id]);
  }

  function raiseGroup(groupId) {
    for (const piece of groupPieces(groupId)) layer.append(piece.el);
  }

  function scatterAllPieces() {
    const rect = workspace.getBoundingClientRect();
    const visibleWidth = rect.width / zoom;
    const visibleHeight = rect.height / zoom;
    const margin = TAB_DEPTH + 5;
    const safeWidth = Math.max(1, visibleWidth - PIECE - margin * 2);
    const safeHeight = Math.max(1, visibleHeight - PIECE - margin * 2);

    for (const piece of pieces) {
      piece.x = viewX + margin + Math.random() * safeWidth;
      piece.y = viewY + margin + Math.random() * safeHeight;
      position(piece);
      layer.append(piece.el);
    }
  }

  function svgPoint(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : { x: event.clientX, y: event.clientY };
  }

  function startPieceDrag(event, piece) {
    if (paused || complete) return;
    beginTimerOnInteraction();
    event.preventDefault();
    event.stopPropagation();

    const groupId = piece.group;
    raiseGroup(groupId);
    const members = groupPieces(groupId);
    const start = svgPoint(event);
    const wrapper = svgEl("g", { class: "puzzle-drag-group" });
    layer.append(wrapper);

    for (const member of members) {
      wrapper.append(member.el);
      member.el.classList.add("dragging");
    }

    drag = {
      pointerId: event.pointerId,
      groupId,
      members,
      start,
      dx: 0,
      dy: 0,
      wrapper,
    };

    piece.el.setPointerCapture?.(event.pointerId);
    svg.classList.add("dragging");
  }

  svg.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const point = svgPoint(event);
    drag.dx = point.x - drag.start.x;
    drag.dy = point.y - drag.start.y;
    drag.wrapper.setAttribute("transform", `translate(${drag.dx} ${drag.dy})`);
  });

  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const { groupId, members, wrapper, dx, dy } = drag;
    drag = null;

    for (const member of members) {
      member.x += dx;
      member.y += dy;
      position(member);
      member.el.classList.remove("dragging");
      layer.append(member.el);
    }

    wrapper.remove();
    svg.classList.remove("dragging");
    trySnaps(groupId);
  }

  svg.addEventListener("pointerup", finishDrag);
  svg.addEventListener("pointercancel", finishDrag);

  function areNeighbors(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  function trySnaps(startGroupId) {
    let groupId = startGroupId;
    let changed = true;

    while (changed) {
      changed = false;
      const moving = groupPieces(groupId);

      outer:
      for (const movingPiece of moving) {
        for (const other of pieces) {
          if (other.group === groupId || !areNeighbors(movingPiece, other)) continue;

          const expectedX = other.solvedX - movingPiece.solvedX;
          const expectedY = other.solvedY - movingPiece.solvedY;
          const errorX = (other.x - movingPiece.x) - expectedX;
          const errorY = (other.y - movingPiece.y) - expectedY;
          const tolerance = SNAP_SCREEN_PX / zoom;

          if (Math.abs(errorX) <= tolerance && Math.abs(errorY) <= tolerance) {
            for (const member of moving) {
              member.x += errorX;
              member.y += errorY;
              position(member);
            }
            groupId = mergeGroups(groupId, other.group);
            changed = true;
            break outer;
          }
        }
      }
    }

    updateCompletion();
  }

  function mergeGroups(a, b) {
    if (a === b) return a;
    const first = groups.get(a);
    const second = groups.get(b);

    for (const id of second) {
      first.add(id);
      pieces[id].group = a;
    }
    groups.delete(b);
    raiseGroup(a);
    return a;
  }

  function updateCompletion() {
    if (groups.size !== 1 || !pieces.length || complete) return;
    complete = true;
    stopTimer();
    fitCompletedPuzzle();
    workspace.classList.add("puzzle-complete-flash");
    setTimeout(() => workspace.classList.remove("puzzle-complete-flash"), 900);
    window.setTimeout(showCompletionOverlay, 520);
  }

  function fitCompletedPuzzle() {
    const anchor = pieces[0];
    if (!anchor) return;

    const puzzleX = anchor.x - anchor.solvedX;
    const puzzleY = anchor.y - anchor.solvedY;
    const puzzleWidth = currentCols * PIECE;
    const puzzleHeight = currentRows * PIECE;
    const padding = Math.max(28, Math.min(workspace.clientWidth, workspace.clientHeight) * .06);
    const fitZoom = clamp(Math.min(
      (workspace.clientWidth - padding * 2) / puzzleWidth,
      (workspace.clientHeight - padding * 2) / puzzleHeight
    ), .35, 3);
    const targetZoom = Math.min(zoom, fitZoom);
    const targetWidth = workspace.clientWidth / targetZoom;
    const targetHeight = workspace.clientHeight / targetZoom;
    const targetX = puzzleX + puzzleWidth / 2 - targetWidth / 2;
    const targetY = puzzleY + puzzleHeight / 2 - targetHeight / 2;

    const startZoom = zoom;
    const startX = viewX;
    const startY = viewY;
    const startedAt = performance.now();
    const duration = 460;

    const animate = now => {
      const raw = clamp((now - startedAt) / duration, 0, 1);
      const t = 1 - Math.pow(1 - raw, 3);
      zoom = startZoom + (targetZoom - startZoom) * t;
      viewX = startX + (targetX - startX) * t;
      viewY = startY + (targetY - startY) * t;
      resizeView();
      if (raw < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  function showCompletionOverlay() {
    if (!complete) return;
    setMenuOpen(false);
    completeTime.textContent = formatTime(elapsed);
    completeName.textContent = sourceTitle || "Puzzle";
    completePreview.src = source;
    completeOverlay.hidden = false;
  }

  function beginTimerOnInteraction() {
    if (timerStarted || paused || complete) return;
    timerStarted = true;
    startTimer();
  }

  function startTimer() {
    stopTimer();
    updateClock();
    if (!timerStarted || paused || complete) return;
    timerId = window.setInterval(() => {
      if (!paused && !complete) {
        elapsed += 1;
        updateClock();
      }
    }, 1000);
  }

  function stopTimer() {
    window.clearInterval(timerId);
    timerId = 0;
  }

  function syncPauseIcons() {
    pauseButton.querySelector(".pause-icon").hidden = paused;
    pauseButton.querySelector(".resume-icon").hidden = !paused;
    pauseButton.setAttribute("aria-label", paused ? "Resume puzzle" : "Pause puzzle");
    pauseButton.title = paused ? "Resume" : "Pause";
  }

  function setPaused(next) {
    if (complete) return;
    paused = next;
    pauseOverlay.hidden = !paused;
    if (paused) stopTimer();
    else if (timerStarted) startTimer();
    syncPauseIcons();
  }

  pauseButton.addEventListener("click", () => setPaused(!paused));
  pauseOverlay.addEventListener("pointerdown", event => {
    event.preventDefault();
    setPaused(false);
  });
  showMiniClock.addEventListener("change", syncMiniClock);

  function setZoom(next, centerX, centerY) {
    const oldWidth = workspace.clientWidth / zoom;
    const oldHeight = workspace.clientHeight / zoom;
    const cx = centerX ?? viewX + oldWidth / 2;
    const cy = centerY ?? viewY + oldHeight / 2;

    zoom = clamp(next, .35, 3);
    const newWidth = workspace.clientWidth / zoom;
    const newHeight = workspace.clientHeight / zoom;
    viewX = cx - newWidth / 2;
    viewY = cy - newHeight / 2;
    resizeView();
  }

  document.querySelector("#zoom-in").addEventListener("click", () => {
    beginTimerOnInteraction();
    setZoom(zoom * 1.2);
  });
  document.querySelector("#zoom-out").addEventListener("click", () => {
    beginTimerOnInteraction();
    setZoom(zoom / 1.2);
  });

  document.querySelector("#fullscreen-button").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === workspace) await document.exitFullscreen();
      else await workspace.requestFullscreen?.();
    } catch (_) {}
  });

  menuButton.addEventListener("click", () => setMenuOpen(!settings.classList.contains("is-open")));

  workspace.addEventListener("pointerdown", event => {
    if (paused || complete || event.button !== 0 || event.target.closest?.(".puzzle-piece") || event.target.closest?.(".puzzle-canvas-toolbar") || event.target.closest?.(".puzzle-settings") || event.target.closest?.(".puzzle-complete-overlay")) return;
    pan = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      viewX,
      viewY,
      moved: false,
    };
    workspace.setPointerCapture?.(event.pointerId);
  });

  workspace.addEventListener("pointermove", event => {
    if (!pan || drag || event.pointerId !== pan.pointerId) return;
    const dx = event.clientX - pan.clientX;
    const dy = event.clientY - pan.clientY;

    if (!pan.moved && Math.hypot(dx, dy) >= 2) {
      pan.moved = true;
      beginTimerOnInteraction();
    }

    if (!pan.moved) return;
    viewX = pan.viewX - dx / zoom;
    viewY = pan.viewY - dy / zoom;
    resizeView();
  });

  function finishPan(event) {
    if (!pan || event.pointerId !== pan.pointerId) return;
    try { workspace.releasePointerCapture?.(event.pointerId); } catch (_) {}
    pan = null;
  }

  workspace.addEventListener("pointerup", finishPan);
  workspace.addEventListener("pointercancel", finishPan);

  workspace.addEventListener("wheel", event => {
    if (paused || complete || event.target.closest?.(".puzzle-settings") || event.target.closest?.(".puzzle-complete-overlay")) return;
    event.preventDefault();
    beginTimerOnInteraction();
    const point = svgPoint(event);
    setZoom(zoom * (event.deltaY < 0 ? 1.1 : .9), point.x, point.y);
  }, { passive: false });

  function restartCurrentPuzzle() {
    const currentEdges = edges;
    createPuzzle(currentCols, currentRows, currentEdges);
  }

  document.querySelector("#restart-button").addEventListener("click", restartCurrentPuzzle);
  document.querySelector("#complete-restart-button").addEventListener("click", restartCurrentPuzzle);

  document.querySelector("#change-pieces-button").addEventListener("click", () => {
    changePanel.hidden = !changePanel.hidden;
  });

  document.querySelector("#apply-piece-count").addEventListener("click", () => {
    const grid = grids[Number(changeSlider.value)];
    if (!grid) return;
    createPuzzle(grid.cols, grid.rows);
    setMenuOpen(true);
  });

  function resetToSetup() {
    stopTimer();
    timerStarted = false;
    complete = false;
    completeOverlay.hidden = true;
    setPaused(false);
    setMenuOpen(false);
    game.hidden = true;
    setup.hidden = false;
    svg.replaceChildren();
    pieces = [];
    groups.clear();
    edges = null;
    source = null;
    sourceTitle = "";
    imgW = 0;
    imgH = 0;
    grids = [];
    options.hidden = true;
    uploadInput.value = "";
    document.querySelector("#default-image").value = "";
    if (uploadedObjectUrl) {
      URL.revokeObjectURL(uploadedObjectUrl);
      uploadedObjectUrl = null;
    }
  }

  document.querySelector("#new-button").addEventListener("click", resetToSetup);
  document.querySelector("#complete-new-button").addEventListener("click", resetToSetup);
})();
