"use strict";

(() => {
  const root = document.documentElement.dataset.repoRoot || "../../";

  function initialiseToolsMenu() {
    const button = document.querySelector("#tools-button");
    const menu = document.querySelector("#tools-menu");
    if (!button || !menu) return;

    button.addEventListener("click", () => {
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

  initialiseToolsMenu();
  initialiseSearch();
})();


async function loadSharedToolsMenu() {
  const menus = document.querySelectorAll(".tools-menu");
  if (!menus.length) {
    return;
  }

  try {
    const response = await fetch(`${document.documentElement.dataset.repoRoot || "../../"}data/tools-manifest.json`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Tools manifest request failed with ${response.status}.`);
    }

    const tools = await response.json();

    menus.forEach((menu) => {
      menu.replaceChildren();
      let previousCategory = null;

      tools.forEach((tool) => {
        if (tool.slug === "note-builder") {
          return;
        }

        if (tool.category !== previousCategory) {
          const heading = document.createElement("span");
          heading.className = "dropdown-category";
          heading.textContent = tool.category;
          menu.append(heading);
          previousCategory = tool.category;
        }

        const link = document.createElement("a");
        link.href = `${document.documentElement.dataset.repoRoot || "../../"}tools/${tool.slug}/`;
        link.role = "menuitem";
        link.textContent = tool.title;
        menu.append(link);
      });
    });
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", loadSharedToolsMenu);


function initialiseToolNotesDrawer() {
  const trigger = document.querySelector(".tool-header-home");
  if (!trigger) return;

  trigger.setAttribute("role", "button");
  trigger.setAttribute("aria-controls", "tool-notes-drawer");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", "Open notes navigation");

  const backdrop = document.createElement("button");
  backdrop.className = "tool-notes-backdrop";
  backdrop.type = "button";
  backdrop.hidden = true;
  backdrop.setAttribute("aria-label", "Close notes navigation");

  const drawer = document.createElement("aside");
  drawer.className = "tool-notes-drawer";
  drawer.id = "tool-notes-drawer";
  drawer.hidden = true;
  drawer.setAttribute("aria-label", "Notes");
  drawer.innerHTML = `
    <div class="tool-notes-drawer-heading">
      <button class="icon-button tool-notes-close" type="button" aria-label="Close notes navigation">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"></path></svg>
      </button>
      <h2>Notes</h2>
      <a class="note-builder-link" href="${root}tools/note-builder/">Builder</a>
    </div>
    <nav class="notes-tree tool-notes-tree" aria-label="Notes directory">
      <p class="sidebar-status">Loading notes…</p>
    </nav>
  `;

  document.body.append(backdrop, drawer);

  const closeButton = drawer.querySelector(".tool-notes-close");
  const tree = drawer.querySelector(".tool-notes-tree");

  function setOpen(open) {
    drawer.hidden = !open;
    backdrop.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("tool-notes-open", open);
    if (open) closeButton.focus();
  }

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    setOpen(drawer.hidden);
  });
  closeButton.addEventListener("click", () => setOpen(false));
  backdrop.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !drawer.hidden) setOpen(false);
  });

  loadToolNotesTree(tree);
}

async function loadToolNotesTree(container) {
  const root = document.documentElement.dataset.repoRoot || "../../";
  try {
    const response = await fetch(`${root}data/notes-manifest.json`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Notes manifest request failed with ${response.status}.`);
    const nodes = await response.json();
    container.replaceChildren(createToolNotesList(nodes, root));
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="sidebar-status">Notes could not be loaded.</p>';
  }
}

function createToolNotesList(nodes, root) {
  const list = document.createElement("ul");
  list.className = "tree-list";

  for (const node of Array.isArray(nodes) ? nodes : []) {
    const item = document.createElement("li");
    const isFolder = node.type === "folder" || node.type === "directory";

    if (isFolder) {
      const button = document.createElement("button");
      const childList = createToolNotesList(node.children || [], root);
      button.className = "folder-button";
      button.type = "button";
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = `
        <svg class="tree-chevron" aria-hidden="true" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"></path></svg>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h6l2 2h10v10H3z"></path></svg>
        <span class="tree-label"></span>
      `;
      button.querySelector(".tree-label").textContent = node.name;
      childList.hidden = true;
      button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
        childList.hidden = expanded;
      });
      item.append(button, childList);
    } else if (node.type === "file") {
      const link = document.createElement("a");
      link.className = "file-button tool-note-link";
      link.href = `${root}?note=${encodeURIComponent(node.path)}`;
      link.innerHTML = `
        <span class="tree-spacer" aria-hidden="true"></span>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6zM14 3v5h5"></path></svg>
        <span class="tree-label"></span>
      `;
      link.querySelector(".tree-label").textContent = node.name;
      item.append(link);
    }

    list.append(item);
  }
  return list;
}

document.addEventListener("DOMContentLoaded", initialiseToolNotesDrawer);
