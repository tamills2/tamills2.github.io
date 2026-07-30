"use strict";

(() => {
  const root = document.documentElement.dataset.repoRoot || "../../";

  function renderSharedToolChrome() {
    const mount = document.querySelector("#shared-tool-header");
    if (!mount) {
      console.error('Tool page is missing <div id="shared-tool-header"></div>.');
      return false;
    }

    mount.innerHTML = `
      <header class="site-header">
        <div class="header-left">
          <button class="tool-header-home" id="tool-notes-button" type="button"
            aria-label="Open notes navigation" aria-controls="tool-notes-drawer" aria-expanded="false">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
            <span>Notes</span>
          </button>
        </div>

        <a class="site-title" id="repo-home-link" href="${root}">Repo</a>

        <div class="header-right">
          <div class="site-search">
            <label class="visually-hidden" for="site-search-input">Search the entire site</label>
            <div class="search-input-shell">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-3.5-3.5"></path>
              </svg>
              <input id="site-search-input" type="search" placeholder="Search site" autocomplete="off" spellcheck="false">
              <kbd>⌘K</kbd>
            </div>
          </div>

          <div class="dropdown">
            <button class="tools-button" id="tools-button" type="button" aria-haspopup="true"
              aria-expanded="false" aria-controls="tools-menu">
              Tools
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"></path></svg>
            </button>
            <div class="tools-menu" id="tools-menu" role="menu" hidden>
              <span class="dropdown-empty">Loading tools…</span>
            </div>
          </div>

          <div class="theme-switch-wrapper">
            <span class="theme-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path></svg>
            </span>
            <button class="theme-switch" id="theme-switch" data-theme-switch type="button" role="switch"
              aria-label="Use dark mode" aria-checked="false"><span class="theme-switch-thumb"></span></button>
            <span class="theme-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"></path></svg>
            </span>
          </div>
        </div>
      </header>

    `;

    // theme.js runs first; initialise again now that the shared switch exists.
    window.RepoTheme?.initialise();
    return true;
  }

  function initialiseToolsMenu() {
    const button = document.querySelector("#tools-button");
    const menu = document.querySelector("#tools-menu");
    if (!button || !menu) return;

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = menu.hidden;
      menu.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".dropdown")) {
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initialiseSearch() {
    const input = document.querySelector("#site-search-input");
    if (!input) return;

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && input.value.trim()) {
        event.preventDefault();
        const destination = new URL(root, window.location.href);
        destination.searchParams.set("search", input.value.trim());
        window.location.href = destination.href;
      }
    });

    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  async function loadSharedToolsMenu() {
    const menu = document.querySelector("#tools-menu");
    if (!menu) return;

    try {
      const response = await fetch(`${root}data/tools-manifest.json`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Tools manifest request failed with ${response.status}.`);

      const tools = await response.json();
      menu.replaceChildren();
      let previousCategory = null;

      for (const tool of tools) {
        if (tool.category !== previousCategory) {
          const heading = document.createElement("span");
          heading.className = "dropdown-category";
          heading.textContent = tool.category;
          menu.append(heading);
          previousCategory = tool.category;
        }

        const link = document.createElement("a");
        link.href = `${root}tools/${tool.slug}/`;
        link.role = "menuitem";
        link.textContent = tool.title;
        menu.append(link);
      }
    } catch (error) {
      console.error(error);
      menu.innerHTML = '<span class="dropdown-empty">Tools could not be loaded.</span>';
    }
  }

  function initialiseToolNotesSidebar() {
    const trigger = document.querySelector("#tool-notes-button");
    const main = document.querySelector(".tool-main");
    if (!trigger || !main) return;

    const shell = document.createElement("div");
    shell.className = "tool-app-shell";

    const sidebar = document.createElement("aside");
    sidebar.className = "notes-sidebar tool-notes-sidebar";
    sidebar.id = "tool-notes-sidebar";
    sidebar.setAttribute("aria-label", "Notes");
    sidebar.innerHTML = `
      <h2>Notes</h2>
      <nav class="notes-tree tool-notes-tree" aria-label="Notes directory">
        <p class="sidebar-status">Loading notes…</p>
      </nav>
    `;

    main.parentNode.insertBefore(shell, main);
    shell.append(sidebar, main);
    trigger.setAttribute("aria-controls", sidebar.id);

    // Tool pages always begin with Notes collapsed.
    const startCollapsed = true;

    function setCollapsed(collapsed) {
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      trigger.setAttribute("aria-expanded", String(!collapsed));
      localStorage.setItem("repo-sidebar-collapsed", String(collapsed));
    }

    setCollapsed(startCollapsed);
    trigger.addEventListener("click", () => {
      setCollapsed(!document.body.classList.contains("sidebar-collapsed"));
    });

    loadToolNotesTree(sidebar.querySelector(".tool-notes-tree"));
  }

  async function loadToolNotesTree(container) {
    try {
      const response = await fetch(`${root}data/notes-manifest.json`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Notes manifest request failed with ${response.status}.`);
      const nodes = await response.json();
      container.replaceChildren(createToolNotesList(nodes));
    } catch (error) {
      console.error(error);
      container.innerHTML = '<p class="sidebar-status">Notes could not be loaded.</p>';
    }
  }

  function createToolNotesList(nodes) {
    const list = document.createElement("ul");
    list.className = "tree-list";

    for (const node of Array.isArray(nodes) ? nodes : []) {
      const item = document.createElement("li");
      const isFolder = node.type === "folder" || node.type === "directory";

      if (isFolder) {
        const row = document.createElement("div");
        const button = document.createElement("button");
        const childList = createToolNotesList(node.children || []);
        row.className = "tree-row";
        button.className = "folder-button";
        button.type = "button";
        button.setAttribute("aria-expanded", "false");
        button.innerHTML = `
          <svg class="tree-chevron" aria-hidden="true" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>
          <svg class="tree-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h6l2 2h10v10H3z"></path></svg>
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
        item.append(row, childList);
      } else if (node.type === "file") {
        const row = document.createElement("div");
        const link = document.createElement("a");
        row.className = "tree-row";
        link.className = "file-button tool-note-link";
        link.href = `${root}?note=${encodeURIComponent(node.path)}`;
        link.innerHTML = `
          <span class="tree-spacer" aria-hidden="true"></span>
          <svg class="tree-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6zM14 3v5h5"></path></svg>
          <span class="tree-label"></span>
        `;
        link.querySelector(".tree-label").textContent = node.name;
        row.append(link);
        item.append(row);
      }

      list.append(item);
    }
    return list;
  }

  function initialiseNavigationCollapseState() {
    const homeLink = document.querySelector("#repo-home-link");

    homeLink?.addEventListener("click", () => {
      localStorage.setItem("repo-sidebar-collapsed", "true");
    });

    document.addEventListener("click", (event) => {
      const toolLink = event.target.closest('#tools-menu a[href*="/tools/"]');
      if (toolLink) {
        localStorage.setItem("repo-sidebar-collapsed", "true");
      }
    });
  }

  if (!renderSharedToolChrome()) return;
  initialiseNavigationCollapseState();
  initialiseToolsMenu();
  initialiseSearch();
  initialiseToolNotesSidebar();
  loadSharedToolsMenu();
})();
