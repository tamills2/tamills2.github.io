"use strict";

const state = {
  manifest: [],
  searchIndex: [],
  toolsManifest: [],
  selectedPath: null,
  currentNoteContent: "",
  noteMatches: [],
  currentNoteMatchIndex: -1,
  activeSiteSearchIndex: -1,
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  initialiseSidebar();
  initialiseToolsMenu();
  initialiseHomeButton();
  initialiseSiteSearch();
  initialiseNoteSearch();
  loadNotesManifest();
  loadSearchIndex();
  loadToolsManifest();
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
  elements.searchPageView = document.querySelector("#search-page-view");
  elements.searchPageTitle = document.querySelector("#search-page-title");
  elements.searchPageSummary = document.querySelector("#search-page-summary");
  elements.searchPageResults = document.querySelector("#search-page-results");
  elements.closeSearchPage = document.querySelector("#close-search-page");
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

function initialiseSidebar() {
  const params = new URLSearchParams(window.location.search);
  const isNoteRoute = params.has("note");
  const saved = localStorage.getItem("repo-sidebar-collapsed");

  // The plain homepage should always begin with Notes collapsed.
  // Note-to-note navigation keeps the user's current sidebar state.
  const startCollapsed = isNoteRoute
    ? saved === "true" || (saved === null && window.innerWidth <= 760)
    : true;

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
  elements.closeSearchPage.addEventListener("click", showHome);
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

    if (event.key === "Enter") {
      event.preventDefault();

      if (state.activeSiteSearchIndex >= 0 && results.length) {
        results[state.activeSiteSearchIndex].click();
      } else if (elements.siteSearchInput.value.trim()) {
        showSearchPage(elements.siteSearchInput.value);
      }
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


async function loadToolsManifest() {
  try {
    const response = await fetch("./data/tools-manifest.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Tools manifest request failed with ${response.status}.`);
    }

    state.toolsManifest = await response.json();
    renderToolsMenu();
    renderHomepageTools();
  } catch (error) {
    console.error(error);
    state.toolsManifest = [];
  }
}

function renderToolsMenu() {
  if (!elements.toolsMenu) {
    return;
  }

  elements.toolsMenu.replaceChildren();

  if (!state.toolsManifest.length) {
    const empty = document.createElement("span");
    empty.className = "dropdown-empty";
    empty.textContent = "No tools available";
    elements.toolsMenu.append(empty);
    return;
  }

  let previousCategory = null;

  for (const tool of state.toolsManifest) {
    if (tool.category !== previousCategory) {
      const heading = document.createElement("span");
      heading.className = "dropdown-category";
      heading.textContent = tool.category;
      elements.toolsMenu.append(heading);
      previousCategory = tool.category;
    }

    const link = document.createElement("a");
    link.href = tool.url;
    link.role = "menuitem";
    link.textContent = tool.title;
    elements.toolsMenu.append(link);
  }
}

function renderHomepageTools() {
  if (!elements.quickLinks) {
    return;
  }

  const homepageTools = state.toolsManifest.filter((tool) => tool.homepage);
  if (!homepageTools.length) {
    return;
  }

  const existingGenerated = elements.quickLinks.querySelectorAll("[data-generated-tool]");
  existingGenerated.forEach((element) => element.remove());

  for (const tool of homepageTools) {
    const link = document.createElement("a");
    link.className = "quick-link-card";
    link.href = tool.url;
    link.dataset.generatedTool = "true";

    const title = document.createElement("strong");
    title.textContent = tool.title;

    const description = document.createElement("span");
    description.textContent = tool.description || tool.category;

    link.append(title, description);
    elements.quickLinks.append(link);
  }
}

async function loadSearchIndex() {
  try {
    const response = await fetch("./data/site-search-index.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Search index request failed with ${response.status}.`);
    }

    state.searchIndex = await response.json();

    const initialSearch = new URLSearchParams(window.location.search).get("search");
    if (initialSearch) {
      elements.siteSearchInput.value = initialSearch;
      showSearchPage(initialSearch);
      history.replaceState(null, "", window.location.pathname);
    }
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

  const matches = getSiteSearchMatches(query, 30);

  elements.siteSearchResults.replaceChildren();
  elements.siteSearchResults.hidden = false;

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "No matching notes, tools, pages, or actions.";
    elements.siteSearchResults.append(empty);
    return;
  }

  let previousType = null;

  for (const match of matches) {
    if (match.type !== previousType) {
      const heading = document.createElement("p");
      heading.className = "search-group-heading";
      heading.textContent = formatSearchType(match.type);
      elements.siteSearchResults.append(heading);
      previousType = match.type;
    }

    const button = document.createElement("button");
    button.className = "site-search-result";
    button.type = "button";

    const titleRow = document.createElement("span");
    titleRow.className = "search-result-title-row";

    const badge = document.createElement("span");
    badge.className = `search-type-badge search-type-${match.type}`;
    badge.textContent = getSearchTypeIcon(match.type);
    badge.setAttribute("aria-hidden", "true");

    const title = document.createElement("strong");
    title.textContent = match.title;
    titleRow.append(badge, title);
    button.append(titleRow);

    if (match.path) {
      const path = document.createElement("small");
      path.textContent = match.path;
      button.append(path);
    }

    if (match.snippet) {
      const snippet = document.createElement("span");
      snippet.className = "search-result-snippet";
      snippet.textContent = match.snippet;
      button.append(snippet);
    }

    button.addEventListener("click", async () => {
      await activateSearchEntry(match);
      closeSiteSearch();
    });

    elements.siteSearchResults.append(button);
  }
}

function getSiteSearchMatches(rawQuery, limit = Infinity) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return [];
  }

  const entries = [
    ...state.searchIndex,
    ...collectStaticSearchEntries(),
    ...createActionSearchEntries(),
  ];

  const uniqueEntries = [];
  const seen = new Set();

  for (const entry of entries) {
    const key = `${entry.type}:${entry.url || entry.path}:${entry.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEntries.push(entry);
    }
  }

  return uniqueEntries
    .map((entry) => scoreSearchEntry(entry, query))
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

function showSearchPage(rawQuery) {
  const query = rawQuery.trim();
  if (!query) {
    return;
  }

  const matches = getSiteSearchMatches(query);
  state.selectedPath = null;

  elements.homeView.hidden = true;
  elements.fileView.hidden = true;
  elements.searchPageView.hidden = false;
  elements.searchPageTitle.textContent = `Results for “${query}”`;
  elements.searchPageSummary.textContent = matches.length === 1
    ? "1 result found"
    : `${matches.length} results found`;

  renderSearchPageResults(matches);
  closeSiteSearchResults();
  elements.siteSearchInput.value = query;
  elements.mainContent.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderSearchPageResults(matches) {
  elements.searchPageResults.replaceChildren();

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "search-page-empty";
    empty.innerHTML = "<h2>No results found</h2><p>Try a shorter term or a different spelling.</p>";
    elements.searchPageResults.append(empty);
    return;
  }

  const groups = new Map();
  for (const match of matches) {
    if (!groups.has(match.type)) {
      groups.set(match.type, []);
    }
    groups.get(match.type).push(match);
  }

  for (const type of ["note", "tool", "page", "action"]) {
    const groupMatches = groups.get(type);
    if (!groupMatches?.length) {
      continue;
    }

    const section = document.createElement("section");
    section.className = "search-page-group";

    const heading = document.createElement("h2");
    heading.textContent = `${formatSearchType(type)} (${groupMatches.length})`;
    section.append(heading);

    const list = document.createElement("div");
    list.className = "search-page-list";

    for (const match of groupMatches) {
      const button = document.createElement("button");
      button.className = "search-page-result";
      button.type = "button";

      const badge = document.createElement("span");
      badge.className = `search-type-badge search-type-${match.type}`;
      badge.textContent = getSearchTypeIcon(match.type);
      badge.setAttribute("aria-hidden", "true");

      const content = document.createElement("span");
      content.className = "search-page-result-content";

      const title = document.createElement("strong");
      title.textContent = match.title;
      content.append(title);

      if (match.path) {
        const path = document.createElement("small");
        path.textContent = match.path;
        content.append(path);
      }

      if (match.snippet) {
        const snippet = document.createElement("span");
        snippet.className = "search-page-snippet";
        snippet.textContent = match.snippet;
        content.append(snippet);
      }

      button.append(badge, content);
      button.addEventListener("click", () => activateSearchEntry(match));
      list.append(button);
    }

    section.append(list);
    elements.searchPageResults.append(section);
  }
}

function collectStaticSearchEntries() {
  const seen = new Set();

  return [...document.querySelectorAll("[data-search-type]")]
    .map((element) => {
      const title = element.dataset.searchTitle?.trim();
      const url = element.getAttribute("href");
      if (!title || !url) return null;

      const key = `${element.dataset.searchType}:${title}:${url}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        type: element.dataset.searchType || "page",
        title,
        path: url === "./" ? "Home" : url,
        url,
        keywords: (element.dataset.searchKeywords || "").split(/\s+/),
        content: element.textContent.trim(),
      };
    })
    .filter(Boolean);
}

function createActionSearchEntries() {
  return [
    { type: "action", title: "Toggle dark or light mode", path: "Site action", url: "action:toggle-theme", keywords: ["dark", "light", "theme", "mode", "sun", "moon"], content: "Switch between light and dark mode." },
    { type: "action", title: "Open home", path: "Site action", url: "action:home", keywords: ["home", "repo", "homepage", "dashboard"], content: "Return to the Repo homepage." },
    { type: "action", title: "Toggle Notes sidebar", path: "Site action", url: "action:toggle-sidebar", keywords: ["notes", "sidebar", "menu", "navigation", "hamburger"], content: "Open or close the Notes directory sidebar." },
  ];
}

function scoreSearchEntry(entry, query) {
  const title = String(entry.title || "").toLowerCase();
  const path = String(entry.path || "").toLowerCase();
  const keywords = Array.isArray(entry.keywords) ? entry.keywords.join(" ").toLowerCase() : String(entry.keywords || "").toLowerCase();
  const content = String(entry.content || "").toLowerCase();

  const titleIndex = title.indexOf(query);
  const pathIndex = path.indexOf(query);
  const keywordIndex = keywords.indexOf(query);
  const contentIndex = content.indexOf(query);

  if (titleIndex === -1 && pathIndex === -1 && keywordIndex === -1 && contentIndex === -1) return null;

  let score = 100;
  if (title === query) score = 0;
  else if (titleIndex === 0) score = 5;
  else if (titleIndex > -1) score = 12;
  else if (pathIndex === 0) score = 20;
  else if (pathIndex > -1) score = 26;
  else if (keywordIndex > -1) score = 34;
  else if (contentIndex > -1) score = 50;

  score += ({ note: 0, tool: 1, page: 2, action: 3 }[entry.type] ?? 4);

  return {
    ...entry,
    score,
    snippet: createSearchSnippet(String(entry.content || ""), contentIndex, query.length),
  };
}

function createSearchSnippet(content, index, queryLength) {
  if (index < 0 || !content) return "";
  const start = Math.max(0, index - 55);
  const end = Math.min(content.length, index + queryLength + 80);
  const snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${snippet}${end < content.length ? "…" : ""}`;
}

async function activateSearchEntry(entry) {
  if (entry.type === "note" || String(entry.url || "").startsWith("note:")) {
    const notePath = String(entry.url || "").replace(/^note:/, "") || entry.path;
    const treeButton = document.querySelector(`.file-button[data-path="${CSS.escape(notePath)}"]`);
    await openNote({ name: entry.title, path: notePath }, treeButton || null);
    return;
  }

  if (String(entry.url || "").startsWith("action:")) {
    performSearchAction(entry.url);
    return;
  }

  if (entry.url === "./") {
    showHome();
    return;
  }

  if (String(entry.url).startsWith("#")) {
    const target = document.querySelector(entry.url);
    if (target) target.scrollIntoView({ behavior: "smooth" });
    else window.location.hash = entry.url;
    return;
  }

  window.location.href = entry.url;
}

function performSearchAction(action) {
  if (action === "action:toggle-theme") elements.themeSwitch.click();
  else if (action === "action:home") showHome();
  else if (action === "action:toggle-sidebar") elements.sidebarToggle.click();
}

function formatSearchType(type) {
  return ({ note: "Notes", tool: "Tools", page: "Pages", action: "Actions" }[type] || "Other");
}

function getSearchTypeIcon(type) {
  return ({ note: "N", tool: "T", page: "P", action: "A" }[type] || "•");
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
  elements.searchPageView.hidden = true;
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
  setSidebarCollapsed(true);
  state.selectedPath = null;
  state.currentNoteContent = "";
  clearNoteSearch();
  elements.fileView.hidden = true;
  elements.searchPageView.hidden = true;
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
