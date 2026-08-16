"use strict";

(() => {
  const NS = "http://www.w3.org/2000/svg";
  const PIECE = 92;
  const TAB_DEPTH = PIECE * 0.22;
  const BITMAP_PAD = Math.ceil(PIECE * .40);
  const SNAP_SCREEN_PX = 4;
  const MAX_PIECES = 600;
  const PROGRESS_KEY = "repo-puzzle-progress-v1";
  const PUZZLE_DB = "repo-puzzle-local-v1";
  const PUZZLE_STORE = "assets";
  const ACTIVE_UPLOAD_KEY = "active-upload";

  const setup = document.querySelector("#puzzle-setup");
  const game = document.querySelector("#puzzle-game");
  const workspace = document.querySelector("#puzzle-workspace");
  const svg = document.querySelector("#puzzle-svg");
  const canvas = document.createElement("canvas");
  canvas.id = "puzzle-canvas";
  canvas.setAttribute("aria-label", "Puzzle workspace");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    zIndex: "1",
    cursor: "grab",
    touchAction: "none",
  });
  svg.style.display = "none";
  svg.insertAdjacentElement("afterend", canvas);
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  const hitCanvas = document.createElement("canvas");
  const hitCtx = hitCanvas.getContext("2d");
  const options = document.querySelector("#puzzle-options");
  const countSlider = document.querySelector("#piece-count");
  const countValue = document.querySelector("#piece-count-value");
  const gridValue = document.querySelector("#piece-grid-value");
  const pieceMin = document.querySelector("#piece-min");
  const pieceMax = document.querySelector("#piece-max");
  const imageInfo = document.querySelector("#image-info");
  const rangeInfo = document.querySelector("#piece-range");
  const selectionPreview = document.querySelector("#puzzle-selection-preview");
  const selectionPreviewImage = document.querySelector("#puzzle-selection-preview-image");
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
  const completeClose = document.querySelector("#puzzle-complete-close");
  const recenterButton = document.querySelector("#recenter-button");
  const showMiniClock = document.querySelector("#show-mini-clock");
  const changePanel = document.querySelector("#change-pieces-panel");
  const changeSlider = document.querySelector("#change-piece-count");
  const changeValue = document.querySelector("#change-piece-count-value");
  const changeGrid = document.querySelector("#change-piece-grid");
  const changeMin = document.querySelector("#change-piece-min");
  const changeMax = document.querySelector("#change-piece-max");

  let source = null;
  let sourceImage = null;
  let sourceTitle = "";
  let imgW = 0;
  let imgH = 0;
  let grids = [];
  let pieces = [];
  let groups = new Map();
  let groupRecency = new Map();
  let groupRecencyCounter = 0;
  let cachedGroupOrder = [];
  let groupOrderDirty = true;
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
  let renderFrame = 0;
  let canvasCssWidth = 1;
  let canvasCssHeight = 1;
  let canvasDpr = 1;
  let scaledSourceCanvas = null;
  let dragStaticCanvas = null;
  let dragStaticCtx = null;
  let lastWheelAt = 0;
  let sourceKind = null;
  let sourceRef = null;
  let saveTimer = 0;
  let restoringProgress = false;

  const svgEl = (tag, attrs = {}) => {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, value);
    }
    return element;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  function openPuzzleDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const request = indexedDB.open(PUZZLE_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PUZZLE_STORE)) db.createObjectStore(PUZZLE_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function writeLocalAsset(key, value) {
    const db = await openPuzzleDb();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(PUZZLE_STORE, "readwrite");
        tx.objectStore(PUZZLE_STORE).put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }

  async function readLocalAsset(key) {
    const db = await openPuzzleDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(PUZZLE_STORE, "readonly");
        const request = tx.objectStore(PUZZLE_STORE).get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }

  async function deleteLocalAsset(key) {
    try {
      const db = await openPuzzleDb();
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(PUZZLE_STORE, "readwrite");
          tx.objectStore(PUZZLE_STORE).delete(key);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    } catch (_) {}
  }

  function progressSnapshot() {
    if (!source || !pieces.length || complete || setup.hidden === false) return null;
    return {
      version: 1,
      sourceKind,
      sourceRef,
      sourceTitle,
      cols: currentCols,
      rows: currentRows,
      elapsed,
      timerStarted,
      paused,
      zoom,
      viewX,
      viewY,
      groupRecencyCounter,
      groupRecency: [...groupRecency.entries()],
      pieces: pieces.map(piece => ({
        id: piece.id,
        x: piece.x,
        y: piece.y,
        group: piece.group,
      })),
    };
  }

  function saveProgressNow() {
    window.clearTimeout(saveTimer);
    saveTimer = 0;
    if (restoringProgress) return;
    const snapshot = progressSnapshot();
    if (!snapshot) return;
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(snapshot));
    } catch (_) {}
  }

  function scheduleProgressSave(delay = 180) {
    if (restoringProgress || complete) return;
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveProgressNow, delay);
  }

  function clearSavedProgress({ clearUpload = false } = {}) {
    window.clearTimeout(saveTimer);
    saveTimer = 0;
    localStorage.removeItem(PROGRESS_KEY);
    if (clearUpload) deleteLocalAsset(ACTIVE_UPLOAD_KEY);
  }

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
    loadSource(`./images/${event.target.value}`, event.target.selectedOptions[0].textContent, { kind: "builtin", ref: event.target.value });
  });

  const uploadInput = document.querySelector("#image-upload");
  const uploadZone = document.querySelector("#upload-dropzone");

  async function acceptUpload(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      alert("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (uploadedObjectUrl) URL.revokeObjectURL(uploadedObjectUrl);
    uploadedObjectUrl = URL.createObjectURL(file);
    document.querySelector("#default-image").value = "";
    try { await writeLocalAsset(ACTIVE_UPLOAD_KEY, file); } catch (_) {}
    loadSource(uploadedObjectUrl, file.name, { kind: "upload", ref: ACTIVE_UPLOAD_KEY });
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

  function loadSource(url, title, meta = {}) {
    const image = new Image();
    image.onload = () => {
      source = url;
      sourceImage = image;
      sourceTitle = title;
      sourceKind = meta.kind || sourceKind;
      sourceRef = meta.ref || sourceRef;
      imgW = image.naturalWidth;
      imgH = image.naturalHeight;
      selectionPreviewImage.src = url;
      selectionPreviewImage.alt = `${title} preview`;
      selectionPreview.hidden = false;
      prepareOptions();
      if (meta.restoreState) restorePuzzleFromState(meta.restoreState);
    };
    image.onerror = () => alert("The image could not be loaded.");
    image.src = url;
  }

  function buildGridOptions(aspect, min, max, maxCols, maxRows) {
    const isSquareImage = imgW === imgH;
    const candidates = [];

    for (let rows = 2; rows <= maxRows; rows++) {
      for (let cols = 2; cols <= maxCols; cols++) {
        const count = rows * cols;
        if (count < min || count > max) continue;
        if (!isSquareImage && cols === rows) continue;

        // Favor grids whose cell layout follows the source image's aspect
        // ratio. Using log-ratio error treats portrait and landscape images
        // symmetrically and avoids generic square counts for non-square art.
        const ratioError = Math.abs(Math.log((cols / rows) / aspect));
        candidates.push({ rows, cols, count, ratioError });
      }
    }

    if (!candidates.length) return [];

    // Do not offer grids that noticeably reshape the source just to hit a
    // familiar piece count. About a 20% ratio deviation still gives useful
    // low-count choices while keeping the solved puzzle visually faithful.
    const aspectMatched = candidates.filter(candidate => candidate.ratioError <= .18);
    const usableCandidates = aspectMatched.length ? aspectMatched : candidates;

    const targets = [9, 12, 16, 20, 25, 30, 36, 42, 48, 56, 64, 72, 80, 90, 100, 120, 140, 150, 180, 200, 240, 250, 300, 350, 400, 450, 500, 550, 600, max]
      .filter(value => value >= min && value <= max);
    const map = new Map();
    const addGrid = grid => {
      const existing = map.get(grid.count);
      if (!existing || grid.ratioError < existing.ratioError) map.set(grid.count, grid);
    };

    for (const target of targets) {
      let best = null;
      for (const candidate of usableCandidates) {
        const countError = Math.abs(candidate.count - target) / Math.max(1, target);
        const score = countError + candidate.ratioError * .55;
        if (!best || score < best.score) best = { ...candidate, score };
      }
      if (best) addGrid(best);
    }

    // Ensure the slider exposes the true image-specific low/high choices, not
    // merely the closest choices to the generic target list.
    const byCountThenRatio = [...usableCandidates].sort((a, b) => a.count - b.count || a.ratioError - b.ratioError);
    const minCount = byCountThenRatio[0].count;
    const minGrid = byCountThenRatio.filter(grid => grid.count === minCount).sort((a, b) => a.ratioError - b.ratioError)[0];
    const maxCount = byCountThenRatio.at(-1).count;
    const maxGrid = byCountThenRatio.filter(grid => grid.count === maxCount).sort((a, b) => a.ratioError - b.ratioError)[0];
    addGrid(minGrid);
    addGrid(maxGrid);

    return [...map.values()].sort((a, b) => a.count - b.count || a.ratioError - b.ratioError);
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
    const minSourcePieceSide = 64;
    const maxGridDimension = Math.floor(MAX_PIECES / 2);
    const maxColsByResolution = clamp(Math.floor(imgW / minSourcePieceSide), 2, maxGridDimension);
    const maxRowsByResolution = clamp(Math.floor(imgH / minSourcePieceSide), 2, maxGridDimension);
    const resolutionMax = maxColsByResolution * maxRowsByResolution;
    const max = clamp(resolutionMax, min, MAX_PIECES);

    grids = buildGridOptions(
      imgW / imgH,
      min,
      max,
      maxColsByResolution,
      maxRowsByResolution
    );

    if (!grids.length) {
      // Very small/extreme images can have too few 64px cells to reach the
      // general 9-piece floor. Fall back to a slightly denser resolution-aware
      // search while still respecting the image aspect and non-square rule.
      const fallbackCols = Math.max(2, Math.ceil(Math.sqrt(min * imgW / imgH)) + 2);
      const fallbackRows = Math.max(2, Math.ceil(Math.sqrt(min * imgH / imgW)) + 2);
      grids = buildGridOptions(imgW / imgH, min, MAX_PIECES, fallbackCols, fallbackRows);
    }

    const actualMax = grids.at(-1)?.count || min;
    const preferredIndex = Math.max(0, grids.findIndex(grid => grid.count >= Math.min(100, actualMax)));
    countSlider.min = "0";
    countSlider.max = String(Math.max(0, grids.length - 1));
    countSlider.value = String(preferredIndex);

    imageInfo.textContent = `${sourceTitle} • ${imgW} × ${imgH}`;
    pieceMin.textContent = String(grids[0]?.count || min);
    pieceMax.textContent = String(grids.at(-1)?.count || actualMax);
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

  const JIGSAW_PROFILE = [
    [0, -75],
    [0, -20], [50, -45],
    [100, -75], [130, -50],
    [150, -35], [150, 0],
    [150, 35], [130, 50],
    [100, 75], [50, 45],
    [0, 20], [0, 75],
  ];

  function makeEdges(cols, rows) {
    const random = seededRandom(`${sourceTitle}|${imgW}x${imgH}|${cols}x${rows}`);
    const nodes = [];

    for (let gx = 0; gx <= 2 * cols; gx++) {
      const column = [];
      for (let gy = 0; gy <= 2 * rows; gy++) {
        const onBoundary = gx === 0 || gy === 0 || gx === 2 * cols || gy === 2 * rows;
        const corner = gx % 2 === 0 && gy % 2 === 0;
        const node = {
          x: gx * PIECE * .5,
          y: gy * PIECE * .5,
          mode: 0,
        };

        // Jigidi subtly distorts the otherwise regular grid. Corner points move
        // by up to 8% of a piece, while edge midpoints get another 10% shift
        // along their edge. That irregularity is a large part of why the pieces
        // look like real die-cut jigsaw pieces rather than repeated SVG stamps.
        if (!onBoundary) {
          node.x += (random() - .5) * PIECE * .08;
          node.y += (random() - .5) * PIECE * .08;
          if (!corner) {
            if (gx % 2 === 1) node.x += (random() - .5) * PIECE * .10;
            if (gy % 2 === 1) node.y += (random() - .5) * PIECE * .10;
            node.mode = random() < .5 ? 1 : 2;
          }
        }

        column.push(node);
      }
      nodes.push(column);
    }

    return { cols, rows, nodes };
  }

  function appendJigidiEdge(path, midpoint, orientation, flip, originX, originY) {
    if (!midpoint || midpoint.mode === 0) return;

    // This is the quadratic profile used by Jigidi's cutter, translated into
    // SVG path commands. The source profile is expressed in a 150x150-ish
    // normalized coordinate system and scaled by .22 * ((w + h) / 200).
    const scale = .22 * ((PIECE + PIECE) / 200);
    let alongSign = orientation === 1 || orientation === 2 ? -scale : scale;
    let normalSign = orientation === 2 || orientation === 3 ? -scale : scale;
    const horizontalSide = orientation % 2 === 0;

    if (flip && horizontalSide) alongSign *= -1;
    if (flip && !horizontalSide) normalSign *= -1;

    const profile = horizontalSide
      ? JIGSAW_PROFILE
      : JIGSAW_PROFILE.map(([x, y]) => [y, x]);

    const mx = midpoint.x - originX;
    const my = midpoint.y - originY;
    const point = ([x, y]) => [mx + x * alongSign, my + y * normalSign];

    const [sx, sy] = point(profile[0]);
    path.push(`L ${sx} ${sy}`);
    for (let i = 1; i < profile.length; i += 2) {
      const [cx, cy] = point(profile[i]);
      const [ex, ey] = point(profile[i + 1]);
      path.push(`Q ${cx} ${cy} ${ex} ${ey}`);
    }
  }

  function piecePath(row, col, cutGrid) {
    const nodes = cutGrid.nodes;
    const originX = col * PIECE;
    const originY = row * PIECE;
    const topLeft = nodes[2 * col][2 * row];
    const topRight = nodes[2 * col + 2][2 * row];
    const bottomRight = nodes[2 * col + 2][2 * row + 2];
    const bottomLeft = nodes[2 * col][2 * row + 2];
    const topMid = nodes[2 * col + 1][2 * row];
    const rightMid = nodes[2 * col + 2][2 * row + 1];
    const bottomMid = nodes[2 * col + 1][2 * row + 2];
    const leftMid = nodes[2 * col][2 * row + 1];
    const local = node => [node.x - originX, node.y - originY];

    const [tlx, tly] = local(topLeft);
    const [trx, try_] = local(topRight);
    const [brx, bry] = local(bottomRight);
    const [blx, bly] = local(bottomLeft);
    const path = [`M ${tlx} ${tly}`];

    if (topMid.mode) appendJigidiEdge(path, topMid, 3, topMid.mode === 1, originX, originY);
    path.push(`L ${trx} ${try_}`);

    if (rightMid.mode) appendJigidiEdge(path, rightMid, 0, rightMid.mode === 1, originX, originY);
    path.push(`L ${brx} ${bry}`);

    if (bottomMid.mode) appendJigidiEdge(path, bottomMid, 1, bottomMid.mode !== 1, originX, originY);
    path.push(`L ${blx} ${bly}`);

    if (leftMid.mode) appendJigidiEdge(path, leftMid, 2, leftMid.mode !== 1, originX, originY);
    path.push(`L ${tlx} ${tly}`, "Z");
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
    groupRecency.clear();
    groupRecencyCounter = 0;
    cachedGroupOrder = [];
    groupOrderDirty = true;
    svg.replaceChildren();
    edges = reuseEdges || makeEdges(cols, rows);
    scaledSourceCanvas = document.createElement("canvas");
    scaledSourceCanvas.width = cols * PIECE;
    scaledSourceCanvas.height = rows * PIECE;
    const scaledCtx = scaledSourceCanvas.getContext("2d", { alpha: false });
    scaledCtx.imageSmoothingEnabled = true;
    scaledCtx.imageSmoothingQuality = "high";
    scaledCtx.drawImage(sourceImage, 0, 0, scaledSourceCanvas.width, scaledSourceCanvas.height);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = row * cols + col;
        const solvedX = col * PIECE;
        const solvedY = row * PIECE;
        const pathData = piecePath(row, col, edges);
        const path = new Path2D(pathData);
        const bitmap = renderPieceBitmap(path, solvedX, solvedY, cols, rows);

        const piece = {
          id,
          row,
          col,
          solvedX,
          solvedY,
          x: 0,
          y: 0,
          group: id,
          path,
          bitmap,
        };
        pieces.push(piece);
        groups.set(id, new Set([id]));
        groupRecency.set(id, groupRecencyCounter++);
      }
    }

    groupOrderDirty = true;
    document.querySelector("#settings-preview").src = source;
    document.querySelector("#settings-title").textContent = sourceTitle;
    document.querySelector("#settings-piece-info").textContent = `${pieces.length} pieces (${cols} × ${rows})`;

    configureChangeSlider(cols, rows);
    requestAnimationFrame(() => {
      syncCanvasSize();
      scatterAllPieces();
      scheduleProgressSave(0);
    });
  }


  function renderPieceBitmap(path, solvedX, solvedY, cols, rows) {
    const size = PIECE + BITMAP_PAD * 2;
    const pieceCanvas = document.createElement("canvas");
    pieceCanvas.width = size;
    pieceCanvas.height = size;
    const pieceCtx = pieceCanvas.getContext("2d", { alpha: true });

    pieceCtx.save();
    pieceCtx.translate(BITMAP_PAD, BITMAP_PAD);
    pieceCtx.clip(path);
    pieceCtx.drawImage(scaledSourceCanvas, -solvedX, -solvedY);
    pieceCtx.restore();

    pieceCtx.save();
    pieceCtx.translate(BITMAP_PAD, BITMAP_PAD);
    pieceCtx.strokeStyle = "rgba(0, 0, 0, .58)";
    pieceCtx.lineWidth = .8;
    pieceCtx.stroke(path);
    pieceCtx.restore();
    return pieceCanvas;
  }

  function syncCanvasSize() {
    if (game.hidden) return;
    const rect = workspace.getBoundingClientRect();
    canvasCssWidth = Math.max(1, rect.width);
    canvasCssHeight = Math.max(1, rect.height);
    // Keep the prototype's backing surface bounded. The expensive piece shape
    // work is already cached; this avoids huge Retina backing stores while we
    // validate interaction/zoom performance.
    canvasDpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(canvasCssWidth * canvasDpr));
    const height = Math.max(1, Math.round(canvasCssHeight * canvasDpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    requestRender();
  }

  function requestRender() {
    if (renderFrame || game.hidden) return;
    renderFrame = requestAnimationFrame(() => {
      renderFrame = 0;
      renderPuzzle();
    });
  }

  function setCameraTransform(target) {
    target.setTransform(
      canvasDpr * zoom, 0,
      0, canvasDpr * zoom,
      -viewX * canvasDpr * zoom,
      -viewY * canvasDpr * zoom
    );
    target.imageSmoothingEnabled = true;
    target.imageSmoothingQuality = "medium";
  }

  function ensureDragStaticLayer() {
    if (!dragStaticCanvas) {
      dragStaticCanvas = document.createElement("canvas");
      dragStaticCtx = dragStaticCanvas.getContext("2d", { alpha: true, desynchronized: true });
    }
    if (dragStaticCanvas.width !== canvas.width || dragStaticCanvas.height !== canvas.height) {
      dragStaticCanvas.width = canvas.width;
      dragStaticCanvas.height = canvas.height;
    }
  }

  function visibleWorldBounds() {
    // Piece bitmaps include padding for tabs/outlines. Use their real bitmap
    // bounds for culling so high zoom only draws what can actually reach the
    // viewport instead of scaling hundreds of fully offscreen images.
    return {
      left: viewX,
      top: viewY,
      right: viewX + canvasCssWidth / zoom,
      bottom: viewY + canvasCssHeight / zoom,
    };
  }

  function pieceIsVisible(piece, bounds, dx = 0, dy = 0) {
    if (!piece?.bitmap) return false;
    const left = piece.x + dx - BITMAP_PAD;
    const top = piece.y + dy - BITMAP_PAD;
    const right = left + piece.bitmap.width;
    const bottom = top + piece.bitmap.height;
    return right >= bounds.left && left <= bounds.right
      && bottom >= bounds.top && top <= bounds.bottom;
  }

  function buildDragStaticLayer(activeGroupId) {
    ensureDragStaticLayer();
    dragStaticCtx.setTransform(1, 0, 0, 1, 0, 0);
    dragStaticCtx.clearRect(0, 0, dragStaticCanvas.width, dragStaticCanvas.height);
    setCameraTransform(dragStaticCtx);
    const bounds = visibleWorldBounds();
    for (const groupId of orderedGroupIds()) {
      if (groupId === activeGroupId) continue;
      for (const id of groups.get(groupId) || []) {
        const piece = pieces[id];
        if (!pieceIsVisible(piece, bounds)) continue;
        dragStaticCtx.drawImage(piece.bitmap, piece.x - BITMAP_PAD, piece.y - BITMAP_PAD);
      }
    }
  }

  function renderPuzzle() {
    if (game.hidden || !ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // During a drag the stationary puzzle does not change. Reuse one cached
    // frame and redraw only the active group, matching Jigidi's cached-piece
    // rendering model while avoiding hundreds of drawImage calls per move.
    const bounds = visibleWorldBounds();

    if (drag && dragStaticCanvas) {
      ctx.drawImage(dragStaticCanvas, 0, 0);
      setCameraTransform(ctx);
      for (const id of groups.get(drag.groupId) || []) {
        const piece = pieces[id];
        if (!pieceIsVisible(piece, bounds, drag.dx, drag.dy)) continue;
        ctx.drawImage(
          piece.bitmap,
          piece.x + drag.dx - BITMAP_PAD,
          piece.y + drag.dy - BITMAP_PAD
        );
      }
      return;
    }

    setCameraTransform(ctx);
    for (const groupId of orderedGroupIds()) {
      for (const id of groups.get(groupId) || []) {
        const piece = pieces[id];
        if (!pieceIsVisible(piece, bounds)) continue;
        ctx.drawImage(piece.bitmap, piece.x - BITMAP_PAD, piece.y - BITMAP_PAD);
      }
    }
  }

  function clientToWorld(clientX, clientY) {
    const rect = workspace.getBoundingClientRect();
    return {
      x: viewX + (clientX - rect.left) / zoom,
      y: viewY + (clientY - rect.top) / zoom,
    };
  }

  function pieceAt(clientX, clientY) {
    const point = clientToWorld(clientX, clientY);
    const ordered = orderedGroupIds();
    for (let g = ordered.length - 1; g >= 0; g--) {
      const ids = [...(groups.get(ordered[g]) || [])];
      for (let i = ids.length - 1; i >= 0; i--) {
        const piece = pieces[ids[i]];
        if (!piece?.path) continue;
        if (hitCtx.isPointInPath(piece.path, point.x - piece.x, point.y - piece.y)) return piece;
      }
    }
    return null;
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
    requestRender();
  }

  new ResizeObserver(syncCanvasSize).observe(workspace);

  function position(piece) {
    requestRender();
  }

  function groupPieces(groupId) {
    return [...(groups.get(groupId) || [])].map(id => pieces[id]);
  }

  function touchGroup(groupId) {
    groupRecency.set(groupId, groupRecencyCounter++);
    groupOrderDirty = true;
  }

  function orderedGroupIds() {
    if (!groupOrderDirty) return cachedGroupOrder;
    cachedGroupOrder = [...groups.keys()].sort((a, b) => {
      const sizeDiff = (groups.get(b)?.size || 0) - (groups.get(a)?.size || 0);
      if (sizeDiff) return sizeDiff;
      return (groupRecency.get(a) || 0) - (groupRecency.get(b) || 0);
    });
    groupOrderDirty = false;
    return cachedGroupOrder;
  }

  function placeGroup(groupId) {
    requestRender();
  }

  function reorderGroups() {
    requestRender();
  }

  function raiseGroup(groupId) {
    touchGroup(groupId);
    requestRender();
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
    }
    reorderGroups();
    scheduleProgressSave();
  }

  function startPieceDrag(event, piece) {
    if (paused || complete) return;
    beginTimerOnInteraction();
    event.preventDefault();
    event.stopPropagation();

    const groupId = piece.group;
    raiseGroup(groupId);
    const members = groupPieces(groupId);

    drag = {
      pointerId: event.pointerId,
      groupId,
      members,
      clientX: event.clientX,
      clientY: event.clientY,
      zoom,
      dx: 0,
      dy: 0,
    };

    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = "grabbing";
    buildDragStaticLayer(groupId);
    requestRender();
  }

  canvas.addEventListener("pointerdown", event => {
    if (paused || complete || event.button !== 0) return;
    if (event.target.closest?.(".puzzle-canvas-toolbar") || event.target.closest?.(".puzzle-settings") || event.target.closest?.(".puzzle-complete-overlay")) return;
    const piece = pieceAt(event.clientX, event.clientY);
    if (piece) startPieceDrag(event, piece);
  });

  canvas.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.dx = (event.clientX - drag.clientX) / drag.zoom;
    drag.dy = (event.clientY - drag.clientY) / drag.zoom;
    requestRender();
  });

  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const { groupId, members, dx, dy } = drag;
    drag = null;
    dragStaticCanvas = null;
    dragStaticCtx = null;

    for (const member of members) {
      member.x += dx;
      member.y += dy;
    }

    try { canvas.releasePointerCapture?.(event.pointerId); } catch (_) {}
    canvas.style.cursor = "grab";
    trySnaps(groupId);
    requestRender();
    scheduleProgressSave();
  }

  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);

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
    groupRecency.delete(b);
    touchGroup(a);
    // Only the newly merged group changed size/recency; all other groups are
    // already in the correct relative order. Move this group to its new tier
    // instead of rebuilding the entire SVG stack.
    placeGroup(a);
    return a;
  }

  function updateCompletion() {
    if (groups.size !== 1 || !pieces.length || complete) return;
    complete = true;
    stopTimer();
    clearSavedProgress({ clearUpload: sourceKind === "upload" });
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
    ), .1, 3);
    const targetZoom = fitZoom;
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
        scheduleProgressSave(0);
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
    scheduleProgressSave(0);
  }

  pauseButton.addEventListener("click", () => setPaused(!paused));
  pauseOverlay.addEventListener("pointerdown", event => {
    event.preventDefault();
    setPaused(false);
  });
  showMiniClock.addEventListener("change", syncMiniClock);

  function fitAllPieces() {
    if (!pieces.length) return;

    const extra = TAB_DEPTH + 6;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const piece of pieces) {
      minX = Math.min(minX, piece.x - extra);
      minY = Math.min(minY, piece.y - extra);
      maxX = Math.max(maxX, piece.x + PIECE + extra);
      maxY = Math.max(maxY, piece.y + PIECE + extra);
    }

    const contentWidth = Math.max(1, maxX - minX);
    const contentHeight = Math.max(1, maxY - minY);
    const padding = Math.max(24, Math.min(workspace.clientWidth, workspace.clientHeight) * .055);
    const targetZoom = clamp(Math.min(
      (workspace.clientWidth - padding * 2) / contentWidth,
      (workspace.clientHeight - padding * 2) / contentHeight
    ), .35, 3);

    zoom = targetZoom;
    viewX = minX + contentWidth / 2 - workspace.clientWidth / zoom / 2;
    viewY = minY + contentHeight / 2 - workspace.clientHeight / zoom / 2;
    resizeView();
    scheduleProgressSave();
  }

  function setZoom(next, centerX, centerY) {
    const oldWidth = workspace.clientWidth / zoom;
    const oldHeight = workspace.clientHeight / zoom;
    const cx = centerX ?? viewX + oldWidth / 2;
    const cy = centerY ?? viewY + oldHeight / 2;

    zoom = clamp(next, complete ? .1 : .35, 3);
    const newWidth = workspace.clientWidth / zoom;
    const newHeight = workspace.clientHeight / zoom;
    viewX = cx - newWidth / 2;
    viewY = cy - newHeight / 2;
    resizeView();
    scheduleProgressSave();
  }

  document.querySelector("#zoom-in").addEventListener("click", () => {
    beginTimerOnInteraction();
    setZoom(zoom * 1.2);
  });
  recenterButton.addEventListener("click", () => {
    beginTimerOnInteraction();
    fitAllPieces();
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

  menuButton.addEventListener("click", () => {
    if (complete) {
      showCompletionOverlay();
      return;
    }
    setMenuOpen(!settings.classList.contains("is-open"));
  });

  workspace.addEventListener("pointerdown", event => {
    if (paused || complete || event.button !== 0 || event.target.closest?.(".puzzle-canvas-toolbar") || event.target.closest?.(".puzzle-settings") || event.target.closest?.(".puzzle-complete-overlay")) return;
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
    scheduleProgressSave();
  }

  workspace.addEventListener("pointerup", finishPan);
  workspace.addEventListener("pointercancel", finishPan);

  workspace.addEventListener("wheel", event => {
    if (paused || event.target.closest?.(".puzzle-settings") || event.target.closest?.(".puzzle-complete-overlay")) return;
    event.preventDefault();
    if (!complete) beginTimerOnInteraction();

    // Normalize wheel/trackpad units, then keep the world point beneath the
    // pointer locked to the same screen pixel while zooming. The old approach
    // centered that point in the viewport on every wheel event, which caused
    // even tiny scrolls near an edge to fling the whole puzzle across the view.
    const rect = workspace.getBoundingClientRect();
    const pointerX = clamp(event.clientX - rect.left, 0, rect.width);
    const pointerY = clamp(event.clientY - rect.top, 0, rect.height);
    const anchorX = viewX + pointerX / zoom;
    const anchorY = viewY + pointerY / zoom;
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? rect.height
      : 1;
    const rawDelta = event.deltaY * unit;
    const now = performance.now();
    const elapsedMs = lastWheelAt ? clamp(now - lastWheelAt, 8, 80) : 16;
    lastWheelAt = now;

    // Wheel deltas already grow with gesture speed on modern mice/trackpads.
    // Add a modest velocity multiplier so deliberate slow scrolling stays fine
    // grained while a fast gesture covers more zoom range, like Jigidi.
    const velocity = Math.abs(rawDelta) / elapsedMs;
    const acceleration = 1 + Math.min(2.25, velocity * .85);
    const wheelDelta = clamp(rawDelta * acceleration, -220, 220);
    const nextZoom = clamp(zoom * Math.exp(-wheelDelta * .00095), complete ? .1 : .35, 3);

    if (nextZoom === zoom) return;
    zoom = nextZoom;
    viewX = anchorX - pointerX / zoom;
    viewY = anchorY - pointerY / zoom;
    resizeView();
    scheduleProgressSave();
  }, { passive: false });

  function restorePuzzleFromState(state) {
    if (!state || state.version !== 1 || !state.cols || !state.rows) return;
    restoringProgress = true;
    createPuzzle(state.cols, state.rows);

    requestAnimationFrame(() => {
      const savedById = new Map((state.pieces || []).map(item => [item.id, item]));
      groups.clear();

      for (const piece of pieces) {
        const saved = savedById.get(piece.id);
        if (saved) {
          piece.x = Number(saved.x) || 0;
          piece.y = Number(saved.y) || 0;
          piece.group = Number(saved.group);
        }
        if (!Number.isFinite(piece.group)) piece.group = piece.id;
        if (!groups.has(piece.group)) groups.set(piece.group, new Set());
        groups.get(piece.group).add(piece.id);
      }

      groupRecency = new Map(Array.isArray(state.groupRecency) ? state.groupRecency : []);
      for (const groupId of groups.keys()) {
        if (!groupRecency.has(groupId)) groupRecency.set(groupId, groupRecencyCounter++);
      }
      groupRecencyCounter = Math.max(Number(state.groupRecencyCounter) || 0, groupRecencyCounter);
      groupOrderDirty = true;

      elapsed = Math.max(0, Number(state.elapsed) || 0);
      timerStarted = Boolean(state.timerStarted);
      paused = Boolean(state.paused);
      zoom = clamp(Number(state.zoom) || 1, .35, 3);
      viewX = Number(state.viewX) || 0;
      viewY = Number(state.viewY) || 0;
      complete = false;
      pauseOverlay.hidden = !paused;
      completeOverlay.hidden = true;
      syncPauseIcons();
      updateClock();
      requestRender();

      restoringProgress = false;
      if (timerStarted && !paused) startTimer();
      saveProgressNow();
    });
  }

  async function restoreSavedProgress() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null"); } catch (_) {}
    if (!state || state.version !== 1 || !state.cols || !state.rows) return;

    try {
      if (state.sourceKind === "builtin" && state.sourceRef) {
        loadSource(`./images/${state.sourceRef}`, state.sourceTitle || state.sourceRef, {
          kind: "builtin",
          ref: state.sourceRef,
          restoreState: state,
        });
        return;
      }

      if (state.sourceKind === "upload") {
        const blob = await readLocalAsset(state.sourceRef || ACTIVE_UPLOAD_KEY);
        if (!blob) throw new Error("Saved upload missing");
        if (uploadedObjectUrl) URL.revokeObjectURL(uploadedObjectUrl);
        uploadedObjectUrl = URL.createObjectURL(blob);
        loadSource(uploadedObjectUrl, state.sourceTitle || "Saved puzzle", {
          kind: "upload",
          ref: state.sourceRef || ACTIVE_UPLOAD_KEY,
          restoreState: state,
        });
        return;
      }

      throw new Error("Unsupported saved puzzle source");
    } catch (_) {
      clearSavedProgress();
    }
  }

  window.addEventListener("pagehide", saveProgressNow);

  function restartCurrentPuzzle() {
    const currentEdges = edges;
    createPuzzle(currentCols, currentRows, currentEdges);
  }

  document.querySelector("#restart-button").addEventListener("click", restartCurrentPuzzle);
  document.querySelector("#complete-restart-button").addEventListener("click", restartCurrentPuzzle);
  completeClose.addEventListener("click", () => {
    completeOverlay.hidden = true;
    setMenuOpen(false);
  });

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
    clearSavedProgress({ clearUpload: sourceKind === "upload" });
    stopTimer();
    timerStarted = false;
    complete = false;
    completeOverlay.hidden = true;
    setPaused(false);
    setMenuOpen(false);
    game.hidden = true;
    setup.hidden = false;
    svg.replaceChildren();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces = [];
    groups.clear();
    groupRecency.clear();
    groupRecencyCounter = 0;
    cachedGroupOrder = [];
    groupOrderDirty = true;
    edges = null;
    source = null;
    sourceImage = null;
    scaledSourceCanvas = null;
    sourceTitle = "";
    sourceKind = null;
    sourceRef = null;
    imgW = 0;
    imgH = 0;
    grids = [];
    options.hidden = true;
    selectionPreview.hidden = true;
    selectionPreviewImage.removeAttribute("src");
    selectionPreviewImage.alt = "Selected puzzle image preview";
    uploadInput.value = "";
    document.querySelector("#default-image").value = "";
    if (uploadedObjectUrl) {
      URL.revokeObjectURL(uploadedObjectUrl);
      uploadedObjectUrl = null;
    }
  }

  async function newPuzzle() {
    try {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      if (fullscreenElement) {
        const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
        const result = exitFullscreen?.call(document);
        if (result && typeof result.then === "function") await result;
      }
    } catch (_) {
      // Still return to setup if the browser refuses or fails to exit fullscreen.
    }
    resetToSetup();
  }

  document.querySelector("#new-button").addEventListener("click", newPuzzle);
  document.querySelector("#complete-new-button").addEventListener("click", newPuzzle);

  restoreSavedProgress();
})();
