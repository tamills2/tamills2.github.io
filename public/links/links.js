"use strict";

(() => {
  const list = document.querySelector("#links-list");
  if (!list) return;

  function renderStatus(message) {
    const status = document.createElement("p");
    status.className = "links-status";
    status.textContent = message;
    list.replaceChildren(status);
  }

  function createLinkCard(entry) {
    const card = document.createElement("a");
    card.className = "link-card";
    card.href = entry.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const title = document.createElement("strong");
    title.className = "link-card-title";
    title.textContent = entry.title;

    const url = document.createElement("span");
    url.className = "link-card-url";
    url.textContent = entry.url;

    const description = document.createElement("span");
    description.className = "link-card-description";
    description.textContent = entry.description;

    card.append(title, url, description);
    return card;
  }

  async function loadLinks() {
    try {
      const response = await fetch("../data/links.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Links request failed with ${response.status}.`);

      const entries = await response.json();
      if (!Array.isArray(entries)) throw new TypeError("links.json must contain an array.");

      const validEntries = entries.filter((entry) =>
        entry &&
        typeof entry.title === "string" && entry.title.trim() &&
        typeof entry.url === "string" && entry.url.trim() &&
        typeof entry.description === "string"
      );

      if (!validEntries.length) {
        renderStatus("No links have been added yet.");
        return;
      }

      list.replaceChildren(...validEntries.map(createLinkCard));
    } catch (error) {
      console.error(error);
      renderStatus("Links could not be loaded. Check public/data/links.json.");
    }
  }

  loadLinks();
})();
