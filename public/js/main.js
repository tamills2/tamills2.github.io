"use strict";

const state = {
  manifest: [],
  selectedPath: null,
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  initialiseTheme();
  initialiseSidebar();
  initialiseToolsMenu();
  initialiseHomeButton();
  loadNotesManifest();
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
    renderCode(content);
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

function renderCode(content) {
  const normalised = content.replace(/\r\n?/g, "\n");
  const lines = normalised.split("\n");
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

    codeCell.append(code);
    row.append(numberCell, codeCell);
    body.append(row);
  });

  table.append(body);
  elements.codeTableWrapper.replaceChildren(table);
}

function setActiveFileButton(activeButton) {
  document.querySelectorAll(".file-button[aria-current]").forEach((button) => {
    button.removeAttribute("aria-current");
  });

  activeButton.setAttribute("aria-current", "page");
}

function showHome() {
  state.selectedPath = null;
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
