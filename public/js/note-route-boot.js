"use strict";

/*
  Prevents the repository homepage from flashing when a note link is opened
  from a tool page. The existing main.js still performs the actual note load.
*/
(() => {
  const requestedNote = new URLSearchParams(window.location.search).get("note");
  if (!requestedNote) return;

  document.documentElement.classList.add("repo-opening-note");

  const style = document.createElement("style");
  style.textContent = `
    html.repo-opening-note #home-view,
    html.repo-opening-note #search-page-view {
      display: none !important;
    }

    html.repo-opening-note #file-view {
      display: block !important;
    }
  `;
  document.head.append(style);

  document.addEventListener("DOMContentLoaded", () => {
    const homeView = document.querySelector("#home-view");
    const searchView = document.querySelector("#search-page-view");
    const fileView = document.querySelector("#file-view");
    const fileTitle = document.querySelector("#file-title");
    const codeFileName = document.querySelector("#code-file-name");
    const wrapper = document.querySelector("#code-table-wrapper");

    if (homeView) homeView.hidden = true;
    if (searchView) searchView.hidden = true;
    if (fileView) fileView.hidden = false;

    const fallbackName =
      decodeURIComponent(requestedNote).split("/").filter(Boolean).pop() ||
      "Note";

    if (fileTitle) fileTitle.textContent = fallbackName;
    if (codeFileName) codeFileName.textContent = fallbackName;
    if (wrapper) {
      wrapper.innerHTML = '<p class="viewer-status">Loading note…</p>';
    }

    window.setTimeout(() => {
      document.documentElement.classList.remove("repo-opening-note");
    }, 3000);
  }, { once: true });
})();
