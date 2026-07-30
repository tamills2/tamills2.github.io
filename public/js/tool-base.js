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
  const menus = document.querySelectorAll(".dropdown-menu");
  if (!menus.length) {
    return;
  }

  try {
    const response = await fetch("../../data/tools-manifest.json", {
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
        if (tool.category !== previousCategory) {
          const heading = document.createElement("span");
          heading.className = "dropdown-category";
          heading.textContent = tool.category;
          menu.append(heading);
          previousCategory = tool.category;
        }

        const link = document.createElement("a");
        link.href = `../../tools/${tool.slug}/`;
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
