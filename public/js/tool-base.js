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
