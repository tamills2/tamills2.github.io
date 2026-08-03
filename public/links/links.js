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

  function isValidLink(entry) {
    return Boolean(
      entry &&
      typeof entry.title === "string" && entry.title.trim() &&
      typeof entry.url === "string" && entry.url.trim() &&
      typeof entry.description === "string"
    );
  }

  function normaliseSections(data) {
    if (!Array.isArray(data)) {
      throw new TypeError("links.json must contain an array.");
    }

    // Preferred structure: [{ "section": "Name", "links": [...] }]
    const grouped = data
      .filter((group) => group && Array.isArray(group.links))
      .map((group) => ({
        title: typeof group.section === "string" && group.section.trim()
          ? group.section.trim()
          : "Other",
        links: group.links.filter(isValidLink),
      }))
      .filter((group) => group.links.length);

    if (grouped.length) return grouped;

    // Backward compatibility with the original flat list.
    const legacyLinks = data.filter(isValidLink);
    return legacyLinks.length ? [{ title: "Other", links: legacyLinks }] : [];
  }

  function createSection(group) {
    const section = document.createElement("section");
    section.className = "links-section";

    const heading = document.createElement("h2");
    heading.className = "links-section-heading";
    heading.textContent = group.title;

    const cards = document.createElement("div");
    cards.className = "links-section-cards";
    cards.append(...group.links.map(createLinkCard));

    section.append(heading, cards);
    return section;
  }

  async function loadLinks() {
    try {
      const response = await fetch("../data/links.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Links request failed with ${response.status}.`);

      const sections = normaliseSections(await response.json());
      if (!sections.length) {
        renderStatus("No links have been added yet.");
        return;
      }

      list.replaceChildren(...sections.map(createSection));
    } catch (error) {
      console.error(error);
      renderStatus("Links could not be loaded. Check public/data/links.json.");
    }
  }

  loadLinks();
})();
