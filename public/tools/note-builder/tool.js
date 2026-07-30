"use strict";

(() => {
  const MANIFEST_CANDIDATES = [
    "../../data/notes-manifest.json",
    "../../data/notes.json",
    "../../notes-manifest.json",
    "../../notes.json",
    "../../assets/notes-manifest.json",
    "../../assets/notes.json"
  ];

  const searchInput = document.querySelector("#note-search");
  const filenameInput = document.querySelector("#filename-input");
  const downloadButton = document.querySelector("#download-button");
  const copyButton = document.querySelector("#copy-button");
  const clearButton = document.querySelector("#clear-selection");
  const statusMessage = document.querySelector("#status-message");
  const availableContainer = document.querySelector("#available-notes");
  const availableCount = document.querySelector("#available-count");
  const selectedList = document.querySelector("#selected-notes");
  const selectedCount = document.querySelector("#selected-count");
  const selectedEmpty = document.querySelector("#selected-empty");
  const preview = document.querySelector("#combined-preview");

  let notes = [];
  let selected = [];
  let instanceCounter = 0;

  function setStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("is-error", isError);
  }

  function titleFromPath(path) {
    const file = String(path).split("/").filter(Boolean).pop() || "Untitled note";
    return decodeURIComponent(file)
      .replace(/\.(md|markdown|txt|html?)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  function cleanPath(path) {
    return String(path || "")
      .trim()
      .replace(/^\.\//, "")
      .replace(/^\/+/, "");
  }

  function resolveNoteUrl(path) {
    if (/^(https?:)?\/\//i.test(path)) return path;
    if (path.startsWith("public/")) return "../../" + path.slice("public/".length);
    if (path.startsWith("notes/")) return "../../" + path;
    if (path.startsWith("../")) return path;
    return "../../" + path;
  }

  function normalizeManifest(input) {
    const output = [];
    const seen = new Set();

    function addNote(item, inheritedCategory = "") {
      if (!item || typeof item !== "object") return;

      const type = String(item.type || "").toLowerCase();
      if (type === "folder" || type === "directory") {
        const category = item.title || item.name || item.label || inheritedCategory;
        const children = item.children || item.items || item.notes || item.entries || [];
        walk(children, category);
        return;
      }

      const rawPath =
        item.path ||
        item.href ||
        item.url ||
        item.file ||
        item.source ||
        item.contentPath ||
        item.content_path;

      if (!rawPath) {
        const children = item.children || item.items || item.notes || item.entries;
        if (children) walk(children, inheritedCategory);
        return;
      }

      const path = cleanPath(rawPath);
      if (!path || seen.has(path)) return;

      const extensionLooksReadable = /\.(md|markdown|txt|html?)($|\?)/i.test(path);
      const explicitNote = type === "note" || item.kind === "note";
      if (!extensionLooksReadable && !explicitNote) return;

      seen.add(path);
      output.push({
        id: item.id || path,
        title: item.title || item.name || item.label || titleFromPath(path),
        path,
        category:
          item.category ||
          item.section ||
          item.folder ||
          inheritedCategory ||
          "Notes"
      });
    }

    function walk(value, inheritedCategory = "") {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === "string") {
            addNote({ path: item }, inheritedCategory);
          } else {
            addNote(item, inheritedCategory);
          }
        });
        return;
      }

      if (!value || typeof value !== "object") return;

      const commonRoots = [
        value.notes,
        value.items,
        value.entries,
        value.children,
        value.files,
        value.data
      ].filter(Boolean);

      if (commonRoots.length) {
        commonRoots.forEach(root => walk(root, inheritedCategory));
        return;
      }

      Object.entries(value).forEach(([key, child]) => {
        if (Array.isArray(child) || (child && typeof child === "object")) {
          walk(child, inheritedCategory || key);
        }
      });
    }

    walk(input);
    return output.sort((a, b) =>
      a.category.localeCompare(b.category) ||
      a.title.localeCompare(b.title)
    );
  }

  async function loadManifest() {
    const failures = [];

    for (const candidate of MANIFEST_CANDIDATES) {
      try {
        const response = await fetch(candidate, { cache: "no-store" });
        if (!response.ok) {
          failures.push(`${candidate}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const normalized = normalizeManifest(data);

        if (normalized.length) {
          notes = normalized;
          renderAvailable();
          setStatus(`Loaded ${notes.length} notes from ${candidate}.`);
          return;
        }

        failures.push(`${candidate}: no readable notes found`);
      } catch (error) {
        failures.push(`${candidate}: ${error.message}`);
      }
    }

    throw new Error(
      "Could not find a usable notes manifest. Checked: " +
      MANIFEST_CANDIDATES.join(", ")
    );
  }

  function renderAvailable() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = notes.filter(note =>
      !query ||
      note.title.toLowerCase().includes(query) ||
      note.path.toLowerCase().includes(query) ||
      note.category.toLowerCase().includes(query)
    );

    availableCount.textContent =
      `${filtered.length} ${filtered.length === 1 ? "note" : "notes"}`;

    if (!filtered.length) {
      availableContainer.innerHTML =
        '<div class="no-results">No matching notes.</div>';
      return;
    }

    const groups = new Map();
    filtered.forEach(note => {
      const category = note.category || "Notes";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(note);
    });

    availableContainer.innerHTML = "";

    groups.forEach((groupNotes, category) => {
      const section = document.createElement("section");
      section.className = "note-group";

      const heading = document.createElement("h3");
      heading.className = "note-group-title";
      heading.textContent = category;
      section.appendChild(heading);

      groupNotes.forEach(note => {
        const row = document.createElement("div");
        row.className = "available-note";

        const details = document.createElement("div");
        details.className = "note-details";

        const title = document.createElement("span");
        title.className = "note-title";
        title.textContent = note.title;

        const path = document.createElement("span");
        path.className = "note-path";
        path.textContent = note.path;

        const addButton = document.createElement("button");
        addButton.className = "add-note-button";
        addButton.type = "button";
        addButton.textContent = "Add";
        addButton.setAttribute("aria-label", `Add ${note.title}`);
        addButton.addEventListener("click", () => addSelected(note));

        details.append(title, path);
        row.append(details, addButton);
        section.appendChild(row);
      });

      availableContainer.appendChild(section);
    });
  }

  function stripHtml(html) {
    const documentFragment = new DOMParser().parseFromString(html, "text/html");

    documentFragment.querySelectorAll(
      "script, style, nav, header, footer, button, .tool-header, #shared-tool-header"
    ).forEach(node => node.remove());

    const preferred =
      documentFragment.querySelector("article") ||
      documentFragment.querySelector("main") ||
      documentFragment.body;

    return preferred.innerText;
  }

  function normalizeLineEndings(text) {
    return String(text).replace(/\r\n?/g, "\n");
  }

  async function fetchNoteText(note) {
    const response = await fetch(resolveNoteUrl(note.path), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const raw = await response.text();
    const contentType = response.headers.get("content-type") || "";
    const looksHtml =
      contentType.includes("text/html") ||
      /\.html?($|\?)/i.test(note.path) ||
      /^\s*<!doctype html/i.test(raw);

    return normalizeLineEndings(looksHtml ? stripHtml(raw) : raw).trim();
  }

  async function addSelected(note) {
    const item = {
      instanceId: ++instanceCounter,
      note,
      text: "",
      state: "loading",
      error: ""
    };

    selected.push(item);
    renderSelected();
    updateCombined();

    try {
      item.text = await fetchNoteText(note);
      item.state = "ready";
    } catch (error) {
      item.state = "error";
      item.error = error.message;
    }

    renderSelected();
    updateCombined();
  }

  function moveSelected(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;

    [selected[index], selected[target]] = [selected[target], selected[index]];
    renderSelected();
    updateCombined();
  }

  function removeSelected(index) {
    selected.splice(index, 1);
    renderSelected();
    updateCombined();
  }

  function renderSelected() {
    selectedCount.textContent =
      `${selected.length} ${selected.length === 1 ? "item" : "items"}`;

    selectedEmpty.hidden = selected.length > 0;
    clearButton.disabled = selected.length === 0;
    selectedList.innerHTML = "";

    selected.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "selected-item";
      if (item.state === "loading") li.classList.add("is-loading");
      if (item.state === "error") li.classList.add("is-error");

      const details = document.createElement("div");
      details.className = "note-details";

      const title = document.createElement("span");
      title.className = "note-title";
      title.textContent =
        item.state === "loading"
          ? `${item.note.title} — loading…`
          : item.state === "error"
            ? `${item.note.title} — failed to load`
            : item.note.title;

      const path = document.createElement("span");
      path.className = "note-path";
      path.textContent =
        item.state === "error"
          ? `${item.note.path} (${item.error})`
          : item.note.path;

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const up = document.createElement("button");
      up.className = "item-button";
      up.type = "button";
      up.textContent = "↑";
      up.title = "Move up";
      up.disabled = index === 0;
      up.addEventListener("click", () => moveSelected(index, -1));

      const down = document.createElement("button");
      down.className = "item-button";
      down.type = "button";
      down.textContent = "↓";
      down.title = "Move down";
      down.disabled = index === selected.length - 1;
      down.addEventListener("click", () => moveSelected(index, 1));

      const remove = document.createElement("button");
      remove.className = "item-button remove-button";
      remove.type = "button";
      remove.textContent = "×";
      remove.title = "Remove";
      remove.addEventListener("click", () => removeSelected(index));

      details.append(title, path);
      actions.append(up, down, remove);
      li.append(details, actions);
      selectedList.appendChild(li);
    });
  }

  function combinedText() {
    return selected
      .filter(item => item.state === "ready")
      .map(item => normalizeLineEndings(item.text).trim())
      .filter(Boolean)
      .join("\n\n");
  }

  function updateCombined() {
    const text = combinedText();
    preview.value = text;

    const hasReadyText = Boolean(text);
    const hasLoading = selected.some(item => item.state === "loading");
    const hasErrors = selected.some(item => item.state === "error");

    downloadButton.disabled = !hasReadyText || hasLoading;
    copyButton.disabled = !hasReadyText;

    if (!selected.length) {
      setStatus(notes.length ? `Loaded ${notes.length} notes.` : "Loading notes…");
    } else if (hasLoading) {
      setStatus("Loading selected note content…");
    } else if (hasErrors) {
      setStatus("Some notes could not be loaded. Remove or retry those entries before downloading.", true);
    } else {
      setStatus(
        `${selected.length} selected ${selected.length === 1 ? "item" : "items"} ready.`
      );
    }
  }

  function safeFilename(value) {
    let name = value.trim() || "combined-notes.txt";
    name = name.replace(/[\\/:*?"<>|]+/g, "-");
    if (!name.toLowerCase().endsWith(".txt")) name += ".txt";
    return name;
  }

  function downloadText() {
    const text = normalizeLineEndings(combinedText());
    if (!text) return;

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = safeFilename(filenameInput.value);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  searchInput.addEventListener("input", renderAvailable);

  clearButton.addEventListener("click", () => {
    selected = [];
    renderSelected();
    updateCombined();
  });

  downloadButton.addEventListener("click", downloadText);

  copyButton.addEventListener("click", async () => {
    const text = combinedText();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      const original = copyButton.textContent;
      copyButton.textContent = "Copied";
      setTimeout(() => {
        copyButton.textContent = original;
      }, 900);
    } catch {
      preview.focus();
      preview.select();
      document.execCommand("copy");
    }
  });

  renderSelected();
  loadManifest().catch(error => {
    availableContainer.innerHTML =
      '<div class="no-results">The notes manifest could not be loaded.</div>';
    setStatus(error.message, true);
  });
})();
