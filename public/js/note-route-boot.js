"use strict";

/*
  Opens a requested note directly in the note viewer without briefly showing
  the homepage. The site's existing main.js remains solely responsible for
  loading and rendering the note.
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
    const wrapper = document.querySelector("#code-table-wrapper");

    if (homeView) homeView.hidden = true;
    if (searchView) searchView.hidden = true;
    if (fileView) fileView.hidden = false;

    // Do not write into the viewer here. main.js may already have rendered it.
    // Merely stop forcing the initial state once content appears.
    if (!wrapper) {
      document.documentElement.classList.remove("repo-opening-note");
      return;
    }

    const releaseInitialState = () => {
      if (wrapper.childElementCount > 0 || wrapper.textContent.trim()) {
        document.documentElement.classList.remove("repo-opening-note");
        observer.disconnect();
      }
    };

    const observer = new MutationObserver(releaseInitialState);
    observer.observe(wrapper, {
      childList: true,
      subtree: true,
      characterData: true
    });

    releaseInitialState();

    // Safety release only; this never changes or replaces viewer content.
    window.setTimeout(() => {
      document.documentElement.classList.remove("repo-opening-note");
      observer.disconnect();
    }, 5000);
  }, { once: true });
})();
