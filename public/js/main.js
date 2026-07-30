"use strict";

const state = {
  manifest: [],
  searchIndex: [],
  selectedPath: null,
  currentNoteContent: "",
  noteMatches: [],
  currentNoteMatchIndex: -1,
  activeSiteSearchIndex: -1,
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  initialiseTheme();
  initialiseSidebar();
  initialiseToolsMenu();
  initialiseHomeButton();
  initialiseSiteSearch();
  initialiseNoteSearch();
  loadNotesManifest();
  loadSearchIndex();
});

function cacheElements() {
  elements.body = document.body;
  elements.sidebarToggle = document.querySelector("#sidebar-toggle");
  elements.sidebar = document.querySelector("#notes-sidebar");
  elements.notesTree = document.querySelector("#notes-tree");
  elements.themeSwitch = document.querySelector("#theme-switch");
  elements.highlightLightTheme = document.querySelector("#highlight-light-theme");
  elements.highlightDarkTheme = document.querySelector("#highlight-dark-theme");
  elements.toolsButton = document.querySelector("#tools-button");
  elements.toolsMenu = document.querySelector("#tools-menu");
  elements.homeView = document.querySelector("#home-view");
  elements.fileView = document.querySelector("#file-view");
  elements.fileLocation = document.querySelector("#file-location");
  elements.fileTitle = document.querySelector("#file-title");
  elements.codeFileName = document.querySelector("#code-file-name");
  elements.codeTableWrapper = document.querySelector("#code-table-wrapper");
  elements.closeFile = document.querySelector("#close-file");
  elements.mainContent = document.querySelector("#main-content");
  elements.siteSearch = document.querySelector(".site-search");
  elements.siteSearchInput = document.querySelector("#site-search-input");
  elements.siteSearchResults = document.querySelector("#site-search-results");
  elements.noteSearchInput = document.querySelector("#note-search-input");
  elements.noteSearchCount = document.querySelector("#note-search-count");
  elements.noteSearchPrevious = document.querySelector("#note-search-previous");
  elements.noteSearchNext = document.querySelector("#note-search-next");
}

function initialiseTheme() {
  applyTheme(document.documentElement.dataset.theme || "light");

  elements.themeSwitch.addEventListener("click", () => {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);
    localStorage.setItem("repo-theme", nextTheme);
  });
}

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  elements.themeSwitch.setAttribute("aria-checked", String(isDark));
  elements.themeSwitch.setAttribute(
    "aria-label",
    isDark ? "Use light mode" : "Use dark mode"
  );

  elements.highlightLightTheme.disabled = isDark;
  elements.highlightDarkTheme.disabled = !isDark;
}

function initialiseSidebar() {
  const saved = localStorage.getItem("repo-sidebar-collapsed");
  const startCollapsed =
    saved === "true" || (saved === null && window.innerWidth <= 760);

  setSidebarCollapsed(startCollapsed);

  elements.sidebarToggle.addEventListener("click", () => {
    setSidebarCollapsed(!elements.body.classList.contains("sidebar-collapsed"));
  });
}

function setSidebarCollapsed(collapsed) {
  elements.body.classList.toggle("sidebar-collapsed", collapsed);
  elements.sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  localStorage.setItem("repo-sidebar-collapsed", String(collapsed));
}

function initialiseToolsMenu() {
  elements.toolsButton.addEventListener("click", () => {
    const willOpen = elements.toolsMenu.hidden;
    elements.toolsMenu.hidden = !willOpen;
    elements.toolsButton.setAttribute("aria-expanded", String(willOpen));
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown")) {
      closeToolsMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeToolsMenu();
    }
  });

  elements.toolsMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeToolsMenu();
    }
  });
}

function closeToolsMenu() {
  elements.toolsMenu.hidden = true;
  elements.toolsButton.setAttribute("aria-expanded", "false");
}

function initialiseHomeButton() {
  elements.closeFile.addEventListener("click", showHome);
}


function initialiseSiteSearch() {
  elements.siteSearchInput.addEventListener("input", () => {
    renderSiteSearchResults(elements.siteSearchInput.value);
  });

  elements.siteSearchInput.addEventListener("keydown", (event) => {
    const results = [...elements.siteSearchResults.querySelectorAll(".site-search-result")];

    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      state.activeSiteSearchIndex =
        (state.activeSiteSearchIndex + 1) % results.length;
      updateActiveSiteSearchResult(results);
    }

    if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      state.activeSiteSearchIndex =
        (state.activeSiteSearchIndex - 1 + results.length) % results.length;
      updateActiveSiteSearchResult(results);
    }

    if (event.key === "Enter" && results.length) {
      event.preventDefault();
      const target =
        results[state.activeSiteSearchIndex >= 0 ? state.activeSiteSearchIndex : 0];
      target.click();
    }

    if (event.key === "Escape") {
      closeSiteSearch();
    }
  });

  document.addEventListener("keydown", (event) => {
    const shortcut =
      (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

    if (shortcut) {
      event.preventDefault();
      document.body.classList.add("search-open");
      elements.siteSearchInput.focus();
      elements.siteSearchInput.select();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-search")) {
      closeSiteSearchResults();
    }
  });
}

async function loadSearchIndex() {
  try {
    const response = await fetch("./data/notes-search-index.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Search index request failed with ${response.status}.`);
    }

    state.searchIndex = await response.json();
  } catch (error) {
    console.error(error);
    state.searchIndex = [];
  }
}

function renderSiteSearchResults(rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  state.activeSiteSearchIndex = -1;

  if (!query) {
    closeSiteSearchResults();
    return;
  }

  const matches = state.searchIndex
    .map((entry) => {
      const name = entry.name.toLowerCase();
      const path = entry.path.toLowerCase();
      const content = entry.content.toLowerCase();
      const nameIndex = name.indexOf(query);
      const pathIndex = path.indexOf(query);
      const contentIndex = content.indexOf(query);

      if (nameIndex === -1 && pathIndex === -1 && contentIndex === -1) {
        return null;
      }

      const score =
        nameIndex === 0 ? 0 :
        nameIndex > -1 ? 1 :
        pathIndex > -1 ? 2 : 3;

      return {
        ...entry,
        score,
        snippet: createSearchSnippet(entry.content, contentIndex, query.length),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.path.localeCompare(b.path))
    .slice(0, 20);

  elements.siteSearchResults.replaceChildren();
  elements.siteSearchResults.hidden = false;

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "No matching notes found.";
    elements.siteSearchResults.append(empty);
    return;
  }

  for (const match of matches) {
    const button = document.createElement("button");
    button.className = "site-search-result";
    button.type = "button";

    const title = document.createElement("strong");
    title.textContent = match.name;

    const path = document.createElement("small");
    path.textContent = match.path;

    button.append(title, path);

    if (match.snippet) {
      const snippet = document.createElement("span");
      snippet.textContent = match.snippet;
      button.append(snippet);
    }

    button.addEventListener("click", async () => {
      const treeButton = document.querySelector(
        `.file-button[data-path="${CSS.escape(match.path)}"]`
      );

      await openNote(
        { name: match.name, path: match.path },
        treeButton || null
      );

      closeSiteSearch();
    });

    elements.siteSearchResults.append(button);
  }
}

function createSearchSnippet(content, index, queryLength) {
  if (index < 0) {
    return "";
  }

  const flattened = content.replace(/\s+/g, " ").trim();
  const flatIndex = flattened.toLowerCase().indexOf(
    content.slice(index, index + queryLength).toLowerCase()
  );
  const start = Math.max(0, flatIndex - 45);
  const end = Math.min(flattened.length, flatIndex + queryLength + 65);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < flattened.length ? "…" : "";
  return `${prefix}${flattened.slice(start, end)}${suffix}`;
}

function updateActiveSiteSearchResult(results) {
  results.forEach((result, index) => {
    result.classList.toggle("is-active", index === state.activeSiteSearchIndex);
  });

  results[state.activeSiteSearchIndex]?.scrollIntoView({
    block: "nearest",
  });
}

function closeSiteSearchResults() {
  elements.siteSearchResults.hidden = true;
  state.activeSiteSearchIndex = -1;
}

function closeSiteSearch() {
  closeSiteSearchResults();
  document.body.classList.remove("search-open");
  elements.siteSearchInput.value = "";
}

function initialiseNoteSearch() {
  elements.noteSearchInput.addEventListener("input", updateNoteSearch);

  elements.noteSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      navigateNoteMatch(event.shiftKey ? -1 : 1);
    }

    if (event.key === "Escape") {
      clearNoteSearch();
      elements.noteSearchInput.blur();
    }
  });

  elements.noteSearchPrevious.addEventListener("click", () => navigateNoteMatch(-1));
  elements.noteSearchNext.addEventListener("click", () => navigateNoteMatch(1));

  document.addEventListener("keydown", (event) => {
    const isFindShortcut =
      (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f";

    if (isFindShortcut && !elements.fileView.hidden) {
      event.preventDefault();
      elements.noteSearchInput.focus();
      elements.noteSearchInput.select();
    }
  });

  updateNoteSearchControls();
}

function updateNoteSearch() {
  const query = elements.noteSearchInput.value.trim();

  renderCode(state.currentNoteContent, query);

  if (!query) {
    state.noteMatches = [];
    state.currentNoteMatchIndex = -1;
    updateNoteSearchControls();
    return;
  }

  state.noteMatches = [
    ...elements.codeTableWrapper.querySelectorAll(".code-search-hit"),
  ];
  state.currentNoteMatchIndex = state.noteMatches.length ? 0 : -1;
  applyCurrentNoteMatch();
}

function navigateNoteMatch(direction) {
  if (!state.noteMatches.length) {
    return;
  }

  state.currentNoteMatchIndex =
    (state.currentNoteMatchIndex + direction + state.noteMatches.length) %
    state.noteMatches.length;

  applyCurrentNoteMatch();
}

function applyCurrentNoteMatch() {
  state.noteMatches.forEach((match, index) => {
    match.classList.toggle("is-current", index === state.currentNoteMatchIndex);
  });

  const current = state.noteMatches[state.currentNoteMatchIndex];
  current?.scrollIntoView({ block: "center", behavior: "smooth" });
  updateNoteSearchControls();
}

function clearNoteSearch() {
  elements.noteSearchInput.value = "";
  state.noteMatches = [];
  state.currentNoteMatchIndex = -1;
  renderCode(state.currentNoteContent);
  updateNoteSearchControls();
}

function updateNoteSearchControls() {
  const total = state.noteMatches.length;
  const current = state.currentNoteMatchIndex >= 0
    ? state.currentNoteMatchIndex + 1
    : 0;

  elements.noteSearchCount.textContent = `${current}/${total}`;
  elements.noteSearchPrevious.disabled = total === 0;
  elements.noteSearchNext.disabled = total === 0;
}

async function loadNotesManifest() {
  try {
    const response = await fetch("./data/notes-manifest.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Manifest request failed with ${response.status}.`);
    }

    state.manifest = await response.json();
    renderNotesTree(state.manifest);
  } catch (error) {
    console.error(error);
    elements.notesTree.innerHTML = `
      <p class="sidebar-status">
        Notes could not be loaded. Run the site through a local web server and
        confirm that <code>public/data/notes-manifest.json</code> exists.
      </p>
    `;
  }
}

function renderNotesTree(nodes) {
  elements.notesTree.replaceChildren();

  if (!Array.isArray(nodes) || nodes.length === 0) {
    const message = document.createElement("p");
    message.className = "sidebar-status";
    message.textContent = "No notes have been added yet.";
    elements.notesTree.append(message);
    return;
  }

  elements.notesTree.append(createTreeList(nodes));
}

function createTreeList(nodes) {
  const list = document.createElement("ul");
  list.className = "tree-list";

  for (const node of nodes) {
    const item = document.createElement("li");

    if (node.type === "directory") {
      item.append(createDirectoryNode(node));
    } else {
      item.append(createFileNode(node));
    }

    list.append(item);
  }

  return list;
}

function createDirectoryNode(node) {
  const fragment = document.createDocumentFragment();
  const row = document.createElement("div");
  const button = document.createElement("button");
  const childList = createTreeList(node.children || []);

  row.className = "tree-row";
  button.className = "folder-button";
  button.type = "button";
  button.setAttribute("aria-expanded", "false");

  button.innerHTML = `
    ${iconChevron()}
    ${iconFolder()}
    <span class="tree-label"></span>
  `;
  button.querySelector(".tree-label").textContent = node.name;

  childList.hidden = true;

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    childList.hidden = expanded;
  });

  row.append(button);
  fragment.append(row, childList);
  return fragment;
}

function createFileNode(node) {
  const row = document.createElement("div");
  const button = document.createElement("button");

  row.className = "tree-row";
  button.className = "file-button";
  button.type = "button";
  button.dataset.path = node.path;

  button.innerHTML = `
    <span class="tree-spacer" aria-hidden="true"></span>
    ${iconFile()}
    <span class="tree-label"></span>
  `;
  button.querySelector(".tree-label").textContent = node.name;

  button.addEventListener("click", () => openNote(node, button));

  row.append(button);
  return row;
}

async function openNote(node, button) {
  setActiveFileButton(button);
  showFileLoadingState(node);

  try {
    const response = await fetch(encodeURI(`./Notes/${node.path}`), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Note request failed with ${response.status}.`);
    }

    const content = await response.text();
    state.currentNoteContent = content;
    clearNoteSearch();
  } catch (error) {
    console.error(error);
    elements.codeTableWrapper.innerHTML = `
      <p class="viewer-status">
        This note could not be loaded. Confirm that its filename and path match
        the generated manifest exactly.
      </p>
    `;
  }
}

function showFileLoadingState(node) {
  state.selectedPath = node.path;

  elements.homeView.hidden = true;
  elements.fileView.hidden = false;
  elements.fileTitle.textContent = node.name;
  elements.codeFileName.textContent = node.name;
  elements.fileLocation.textContent = getParentLocation(node.path);
  elements.codeTableWrapper.innerHTML =
    '<p class="viewer-status">Loading file…</p>';

  elements.mainContent.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderCode(content, searchQuery = "") {
  const normalised = content.replace(/\r\n?/g, "\n");
  const lines = normalised.split("\n");
  const query = searchQuery.toLowerCase();
  const table = document.createElement("table");
  const body = document.createElement("tbody");

  table.className = "code-table";
  table.setAttribute("aria-label", "File contents");

  lines.forEach((line, index) => {
    const row = document.createElement("tr");
    const numberCell = document.createElement("td");
    const codeCell = document.createElement("td");
    const code = document.createElement("code");

    numberCell.className = "line-number";
    numberCell.textContent = String(index + 1);
    numberCell.setAttribute("aria-hidden", "true");

    codeCell.className = "code-line";
    code.textContent = line || " ";

    if (window.hljs) {
      window.hljs.highlightElement(code);
    }

    if (query) {
      highlightSearchMatches(code, query);
    }

    codeCell.append(code);
    row.append(numberCell, codeCell);
    body.append(row);
  });

  table.append(body);
  elements.codeTableWrapper.replaceChildren(table);
}


function highlightSearchMatches(codeElement, query) {
  const walker = document.createTreeWalker(
    codeElement,
    NodeFilter.SHOW_TEXT
  );

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue;
    const lower = text.toLowerCase();
    let start = 0;
    let index = lower.indexOf(query, start);

    if (index === -1) {
      continue;
    }

    const fragment = document.createDocumentFragment();

    while (index !== -1) {
      fragment.append(document.createTextNode(text.slice(start, index)));

      const mark = document.createElement("mark");
      mark.className = "code-search-hit";
      mark.textContent = text.slice(index, index + query.length);
      fragment.append(mark);

      start = index + query.length;
      index = lower.indexOf(query, start);
    }

    fragment.append(document.createTextNode(text.slice(start)));
    textNode.replaceWith(fragment);
  }
}

function setActiveFileButton(activeButton) {
  document.querySelectorAll(".file-button[aria-current]").forEach((button) => {
    button.removeAttribute("aria-current");
  });

  if (activeButton) {
    activeButton.setAttribute("aria-current", "page");
  }
}

function showHome() {
  state.selectedPath = null;
  state.currentNoteContent = "";
  clearNoteSearch();
  elements.fileView.hidden = true;
  elements.homeView.hidden = false;

  document.querySelectorAll(".file-button[aria-current]").forEach((button) => {
    button.removeAttribute("aria-current");
  });

  elements.mainContent.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function getParentLocation(path) {
  const parts = path.split("/");
  parts.pop();
  return parts.length ? `Notes / ${parts.join(" / ")}` : "Notes";
}

function iconChevron() {
  return `
    <svg class="tree-chevron" aria-hidden="true" viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6"></path>
    </svg>
  `;
}

function iconFolder() {
  return `
    <svg class="tree-icon" aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 6.5h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11Z"></path>
    </svg>
  `;
}

function iconFile() {
  return `
    <svg class="tree-icon" aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 2.5h8l4 4v15H6z"></path>
      <path d="M14 2.5v4h4M9 12h6M9 16h6"></path>
    </svg>
  `;
}
