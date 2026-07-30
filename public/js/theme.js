"use strict";

(() => {
  const STORAGE_KEY = "repo-theme";

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function apply(theme, { persist = false } = {}) {
    const normalized = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = normalized;

    if (persist) localStorage.setItem(STORAGE_KEY, normalized);

    document.querySelectorAll("[data-theme-switch]").forEach((button) => {
      const isDark = normalized === "dark";
      button.setAttribute("aria-checked", String(isDark));
      button.setAttribute("aria-label", isDark ? "Use light mode" : "Use dark mode");
    });

    const lightHighlight = document.querySelector("#highlight-light-theme");
    const darkHighlight = document.querySelector("#highlight-dark-theme");
    if (lightHighlight) lightHighlight.disabled = normalized === "dark";
    if (darkHighlight) darkHighlight.disabled = normalized !== "dark";

    window.dispatchEvent(new CustomEvent("repo-theme-change", {
      detail: { theme: normalized },
    }));
  }

  function toggle() {
    apply(document.documentElement.dataset.theme === "dark" ? "light" : "dark", {
      persist: true,
    });
  }

  function initialise() {
    apply(document.documentElement.dataset.theme || getPreferredTheme());
    document.querySelectorAll("[data-theme-switch]").forEach((button) => {
      if (button.dataset.themeBound === "true") return;
      button.dataset.themeBound = "true";
      button.addEventListener("click", toggle);
    });
  }

  window.RepoTheme = { apply, toggle, initialise, getPreferredTheme };

  // This script is loaded with defer, so DOM is available when it runs.
  initialise();
})();
