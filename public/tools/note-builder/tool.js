"use strict";

(() => {
  const STORAGE_TEXT = "repo-note-builder-text";
  const STORAGE_FILENAME = "repo-note-builder-filename";

  const MANIFEST_CANDIDATES = [
    "../../data/notes-manifest.json",
    "../../data/notes.json",
    "../../notes-manifest.json",
    "../../notes.json"
  ];

  const noteSearch = document.querySelector("#note-search");
  const noteCount = document.querySelector("#note-count");
  const availableNotes = document.querySelector("#available-notes");
  const editor = document.querySelector("#document-editor");
  const filenameInput = document.querySelector("#filename-input");
  const statusMessage = document.querySelector("#status-message");
  const documentCounts = document.querySelector("#document-counts");
  const copyButton = document.querySelector("#copy-button");
  const downloadButton = document.querySelector("#download-button");
  const clearButton = document.querySelector("#clear-button");

  let notes = [];
  let selectedNoteId = "";
  let draggedNoteId = "";
  let saveTimer = 0;

  function normalizeLf(text) {
    return String(text ?? "").replace(/\r\n?/g, "\n");
  }

  function cleanPath(path) {
    return String(path || "")
      .trim()
      .replace(/^\.\//, "")
      .replace(/^\/+/, "");
  }

  function titleFromPath(path) {
    const file = String(path).split("/").filter(Boolean).pop() || "Untitled note";
    return decodeURIComponent(file)
      .replace(/\.(md|markdown|txt|html?|sh|bash|zsh|ps1|py|js|css|json|ya?ml|xml|ini|conf|cfg)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  function normalizeManifest(input) {
    const output = [];
    const seen = new Set();

    function walk(value, inheritedFolder = "") {
      if (Array.isArray(value)) {
        value.forEach(item => walk(item, inheritedFolder));
        return;
      }

      if (typeof value === "string") {
        addFile({ path: value }, inheritedFolder);
        return;
      }

      if (!value || typeof value !== "object") return;

      const type = String(value.type || "").toLowerCase();
      const children =
        value.children ||
        value.items ||
        value.notes ||
        value.entries ||
        value.files;

      if (type === "folder" || type === "directory" || (children && !value.path)) {
        const folder =
          value.title ||
          value.name ||
          value.label ||
          inheritedFolder ||
          "Notes";
        walk(children || [], folder);
        return;
      }

      if (value.path || value.href || value.url || value.file || value.source) {
        addFile(value, inheritedFolder);
        return;
      }

      Object.entries(value).forEach(([key, child]) => {
        if (child && (Array.isArray(child) || typeof child === "object")) {
          walk(child, inheritedFolder || key);
        }
      });
    }

    function addFile(item, inheritedFolder) {
      const rawPath =
        item.path ||
        item.href ||
        item.url ||
        item.file ||
        item.source;

      const path = cleanPath(rawPath);
      if (!path || seen.has(path)) return;

      const type = String(item.type || "").toLowerCase();
      if (type && !["file", "note"].includes(type)) return;

      seen.add(path);
      output.push({
        id: item.id || path,
        title: item.title || item.name || item.label || titleFromPath(path),
        path,
        folder:
          item.category ||
          item.section ||
          item.folder ||
          inheritedFolder ||
          "Notes"
      });
    }

    walk(input);

    return output.sort((a, b) =>
      a.folder.localeCompare(b.folder) ||
      a.title.localeCompare(b.title)
    );
  }

  function resolveNoteUrl(path) {
    if (/^(https?:)?\/\//i.test(path)) return path;
    if (path.startsWith("public/")) return "../../" + path.slice("public/".length);
    if (/^notes\//i.test(path)) return "../../" + path;
    return "../../Notes/" + path.replace(/^Notes\//i, "");
  }

  function stripHtml(html) {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    parsed.querySelectorAll(
      "script, style, nav, header, footer, button, #shared-tool-header, .tool-header"
    ).forEach(node => node.remove());

    const content =
      parsed.querySelector("article") ||
      parsed.querySelector("main") ||
      parsed.body;

    return content.innerText;
  }

  async function fetchNoteText(note) {
    const response = await fetch(encodeURI(resolveNoteUrl(note.path)), {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Could not load ${note.title} (HTTP ${response.status}).`);
    }

    const raw = await response.text();
    const contentType = response.headers.get("content-type") || "";
    const isHtml =
      contentType.includes("text/html") ||
      /\.html?($|\?)/i.test(note.path) ||
      /^\s*<!doctype html/i.test(raw);

    return normalizeLf(isHtml ? stripHtml(raw) : raw).trim();
  }

  function setStatus(message, error = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("is-error", error);
  }

  function renderNotes() {
    const query = noteSearch.value.trim().toLocaleLowerCase();
    const filtered = notes.filter(note =>
      !query || note.title.toLocaleLowerCase().includes(query)
    );

    noteCount.textContent =
      `${filtered.length} of ${notes.length} ${notes.length === 1 ? "note" : "notes"}`;

    if (!filtered.length) {
      availableNotes.innerHTML =
        '<p class="empty-message">No note names match that search.</p>';
      return;
    }

    availableNotes.replaceChildren();
    let currentFolder = "";

    filtered.forEach(note => {
      if (note.folder !== currentFolder) {
        currentFolder = note.folder;
        const heading = document.createElement("h3");
        heading.className = "note-group-heading";
        heading.textContent = currentFolder;
        availableNotes.append(heading);
      }

      const button = document.createElement("button");
      button.className = "note-option";
      button.type = "button";
      button.draggable = true;
      button.dataset.noteId = note.id;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(note.id === selectedNoteId));

      const title = document.createElement("span");
      title.className = "note-option-title";
      title.textContent = note.title;

      const path = document.createElement("span");
      path.className = "note-option-path";
      path.textContent = note.path;

      button.append(title, path);

      button.addEventListener("click", () => {
        selectedNoteId = note.id;
        renderNotes();
      });

      button.addEventListener("dblclick", () => insertNote(note));

      button.addEventListener("keydown", event => {
        if (event.key === "Enter") {
          event.preventDefault();
          insertNote(note);
        }
      });

      button.addEventListener("dragstart", event => {
        draggedNoteId = note.id;
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("text/plain", note.id);
      });

      button.addEventListener("dragend", () => {
        draggedNoteId = "";
      });

      availableNotes.append(button);
    });
  }

  function insertionText(noteText) {
    const current = normalizeLf(editor.value);
    const start = editor.selectionStart ?? current.length;
    const end = editor.selectionEnd ?? start;

    const before = current.slice(0, start);
    const after = current.slice(end);

    const leftSeparator =
      before.length && !before.endsWith("\n\n")
        ? before.endsWith("\n") ? "\n" : "\n\n"
        : "";

    const rightSeparator =
      after.length && !after.startsWith("\n\n")
        ? after.startsWith("\n") ? "\n" : "\n\n"
        : "";

    const inserted = leftSeparator + noteText + rightSeparator;

    return {
      value: before + inserted + after,
      cursor: before.length + inserted.length
    };
  }

  async function insertNote(note) {
    setStatus(`Loading ${note.title}…`);

    try {
      const text = await fetchNoteText(note);
      const insertion = insertionText(text);
      editor.value = insertion.value;
      editor.focus();
      editor.setSelectionRange(insertion.cursor, insertion.cursor);
      updateEditorState();
      persistNow();
      setStatus(`Inserted ${note.title}.`);
    } catch (error) {
      console.error(error);
      setStatus(error.message, true);
    }
  }

  function updateCounts() {
    const text = normalizeLf(editor.value);
    const characters = text.length;
    const lines = text.length ? text.split("\n").length : 0;

    documentCounts.textContent =
      `${characters.toLocaleString()} ${characters === 1 ? "character" : "characters"} · ` +
      `${lines.toLocaleString()} ${lines === 1 ? "line" : "lines"}`;
  }

  function updateEditorState() {
    const hasText = editor.value.length > 0;
    copyButton.disabled = !hasText;
    downloadButton.disabled = !hasText;
    clearButton.disabled = !hasText;
    updateCounts();
  }

  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(persistNow, 200);
  }

  function persistNow() {
    localStorage.setItem(STORAGE_TEXT, normalizeLf(editor.value));
    localStorage.setItem(STORAGE_FILENAME, filenameInput.value);
  }

  function safeFilename(value) {
    let name = value.trim() || "combined-notes.txt";
    name = name.replace(/[\\/:*?"<>|]+/g, "-");
    if (!name.toLowerCase().endsWith(".txt")) name += ".txt";
    return name;
  }

  function currentLfText() {
    return normalizeLf(editor.value);
  }

  async function copyText() {
    const text = currentLfText();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      editor.focus();
      editor.select();
      document.execCommand("copy");
    }

    const original = copyButton.textContent;
    copyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyButton.textContent = original;
    }, 900);
  }

  async function saveTextFile() {
    const text = currentLfText();
    if (!text) return;

    const filename = safeFilename(filenameInput.value);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });

    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: "Text file",
            accept: { "text/plain": [".txt"] }
          }]
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        setStatus(`Saved ${filename} with Linux LF line endings.`);
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          setStatus("Save cancelled.");
          return;
        }
        console.warn("Save picker failed; using browser download fallback.", error);
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`Downloaded ${filename} with Linux LF line endings.`);
  }

  async function loadManifest() {
    const failures = [];

    for (const candidate of MANIFEST_CANDIDATES) {
      try {
        const response = await fetch(candidate, { cache: "no-store" });
        if (!response.ok) {
          failures.push(`${candidate}: HTTP ${response.status}`);
          continue;
        }

        const normalized = normalizeManifest(await response.json());
        if (!normalized.length) {
          failures.push(`${candidate}: no notes found`);
          continue;
        }

        notes = normalized;
        renderNotes();
        setStatus(`Loaded ${notes.length} notes.`);
        return;
      } catch (error) {
        failures.push(`${candidate}: ${error.message}`);
      }
    }

    throw new Error(
      "The notes manifest could not be loaded. Checked: " +
      failures.join("; ")
    );
  }

  noteSearch.addEventListener("input", renderNotes);

  editor.addEventListener("input", () => {
    updateEditorState();
    scheduleSave();
  });

  editor.addEventListener("dragover", event => {
    if (!draggedNoteId && !event.dataTransfer.types.includes("text/plain")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    editor.classList.add("is-drop-target");
  });

  editor.addEventListener("dragleave", () => {
    editor.classList.remove("is-drop-target");
  });

  editor.addEventListener("drop", event => {
    event.preventDefault();
    editor.classList.remove("is-drop-target");

    const id = event.dataTransfer.getData("text/plain") || draggedNoteId;
    const note = notes.find(candidate => candidate.id === id);
    if (note) insertNote(note);
  });

  filenameInput.addEventListener("input", scheduleSave);
  copyButton.addEventListener("click", copyText);
  downloadButton.addEventListener("click", saveTextFile);

  clearButton.addEventListener("click", () => {
    if (!editor.value || window.confirm("Clear the current note builder document?")) {
      editor.value = "";
      updateEditorState();
      persistNow();
      setStatus("Document cleared.");
      editor.focus();
    }
  });

  const savedText = localStorage.getItem(STORAGE_TEXT);
  const savedFilename = localStorage.getItem(STORAGE_FILENAME);

  if (savedText !== null) editor.value = normalizeLf(savedText);
  if (savedFilename) filenameInput.value = savedFilename;

  updateEditorState();

  loadManifest().catch(error => {
    console.error(error);
    availableNotes.innerHTML =
      '<p class="empty-message">Notes could not be loaded.</p>';
    noteCount.textContent = "Unavailable";
    setStatus(error.message, true);
  });
})();
