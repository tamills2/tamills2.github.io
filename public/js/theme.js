"use strict";

(() => {
  const MODE_STORAGE_KEY = "repo-theme";
  const SITE_THEME_STORAGE_KEY = "repo-site-theme";
  const DEFAULT_SITE_THEME = "default";
  const COMMAND_TIMEOUT_MS = 1600;

  const SITE_THEMES = Object.freeze({
    matrix: "Matrix",
    dos: "DOS",
    amber: "Amber terminal",
    blueprint: "Blueprint",
    crt: "Retro CRT",
  });

  let commandBuffer = "";
  let commandTimer = 0;

  function getPreferredTheme() {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function getSavedSiteTheme() {
    const saved = localStorage.getItem(SITE_THEME_STORAGE_KEY);
    return Object.hasOwn(SITE_THEMES, saved) ? saved : DEFAULT_SITE_THEME;
  }

  function isHiddenSiteTheme() {
    const siteTheme = document.documentElement.dataset.siteTheme;
    return Boolean(siteTheme && siteTheme !== DEFAULT_SITE_THEME);
  }

  function updateThemeSwitchAvailability() {
    const disabled = isHiddenSiteTheme();
    document.querySelectorAll("[data-theme-switch]").forEach((button) => {
      if ("disabled" in button) button.disabled = disabled;
      button.setAttribute("aria-disabled", String(disabled));
      button.title = disabled
        ? "Light and dark modes are unavailable in hidden themes"
        : "Toggle light and dark mode";
    });
  }

  function updateHighlightTheme(mode) {
    const forceDark = document.documentElement.dataset.siteTheme
      && document.documentElement.dataset.siteTheme !== DEFAULT_SITE_THEME;
    const dark = forceDark || mode === "dark";
    const lightHighlight = document.querySelector("#highlight-light-theme");
    const darkHighlight = document.querySelector("#highlight-dark-theme");
    if (lightHighlight) lightHighlight.disabled = dark;
    if (darkHighlight) darkHighlight.disabled = !dark;
  }

  function apply(theme, { persist = false } = {}) {
    const normalized = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = normalized;

    if (persist) localStorage.setItem(MODE_STORAGE_KEY, normalized);

    document.querySelectorAll("[data-theme-switch]").forEach((button) => {
      const isDark = normalized === "dark";
      button.setAttribute("aria-checked", String(isDark));
      button.setAttribute("aria-label", isDark ? "Use light mode" : "Use dark mode");
    });

    updateHighlightTheme(normalized);
    updateThemeSwitchAvailability();

    window.dispatchEvent(new CustomEvent("repo-theme-change", {
      detail: {
        theme: normalized,
        siteTheme: document.documentElement.dataset.siteTheme || DEFAULT_SITE_THEME,
      },
    }));
  }

  function applySiteTheme(theme, { persist = false, announce = false } = {}) {
    const normalized = Object.hasOwn(SITE_THEMES, theme)
      ? theme
      : DEFAULT_SITE_THEME;

    if (normalized === DEFAULT_SITE_THEME) {
      delete document.documentElement.dataset.siteTheme;
    } else {
      document.documentElement.dataset.siteTheme = normalized;
    }

    if (persist) {
      if (normalized === DEFAULT_SITE_THEME) {
        localStorage.removeItem(SITE_THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(SITE_THEME_STORAGE_KEY, normalized);
      }
    }

    if (normalized === DEFAULT_SITE_THEME) {
      apply(getPreferredTheme());
    } else {
      // Hidden themes are complete, single-mode themes. Do not alter the saved
      // default light/dark preference while forcing their fixed presentation.
      apply("dark");
    }
    updateThemeSwitchAvailability();

    if (announce) {
      showThemeNotice(
        normalized === DEFAULT_SITE_THEME
          ? "Default theme restored"
          : `${SITE_THEMES[normalized]} theme enabled`,
      );
    }

    window.dispatchEvent(new CustomEvent("repo-site-theme-change", {
      detail: { siteTheme: normalized },
    }));
  }

  function toggle() {
    if (isHiddenSiteTheme()) return;
    apply(document.documentElement.dataset.theme === "dark" ? "light" : "dark", {
      persist: true,
    });
  }

  function showThemeNotice(message) {
    let notice = document.querySelector("#repo-theme-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "repo-theme-notice";
      notice.className = "repo-theme-notice";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");
      document.body.appendChild(notice);
    }

    notice.textContent = message;
    notice.classList.remove("is-visible");
    // Restart the transition if commands are entered in quick succession.
    void notice.offsetWidth;
    notice.classList.add("is-visible");

    window.clearTimeout(Number(notice.dataset.hideTimer || 0));
    const hideTimer = window.setTimeout(() => {
      notice.classList.remove("is-visible");
    }, 1800);
    notice.dataset.hideTimer = String(hideTimer);
  }

  function isTypingTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest([
      "input",
      "textarea",
      "select",
      "[contenteditable='true']",
      "[contenteditable='']",
      "[role='textbox']",
      "[data-suppress-theme-commands]",
      ".CodeMirror",
      ".monaco-editor",
    ].join(",")));
  }

  function clearCommandBuffer() {
    commandBuffer = "";
    window.clearTimeout(commandTimer);
    commandTimer = 0;
  }

  function handleThemeCommandKeydown(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target)) {
      clearCommandBuffer();
      return;
    }

    if (event.key === "Escape") {
      clearCommandBuffer();
      return;
    }

    if (!/^[a-z]$/i.test(event.key)) return;

    commandBuffer = `${commandBuffer}${event.key.toLowerCase()}`.slice(-16);
    window.clearTimeout(commandTimer);
    commandTimer = window.setTimeout(clearCommandBuffer, COMMAND_TIMEOUT_MS);

    const command = commandBuffer;
    if (command.endsWith("reset")) {
      applySiteTheme(DEFAULT_SITE_THEME, { persist: true, announce: true });
      clearCommandBuffer();
      return;
    }

    const matchedTheme = Object.keys(SITE_THEMES).find((theme) => command.endsWith(theme));
    if (matchedTheme) {
      applySiteTheme(matchedTheme, { persist: true, announce: true });
      clearCommandBuffer();
    }
  }

  function bindThemeSwitches() {
    document.querySelectorAll("[data-theme-switch]").forEach((button) => {
      if (button.dataset.themeBound === "true") return;
      button.dataset.themeBound = "true";
      button.addEventListener("click", toggle);
    });
  }

  function initialise() {
    const siteTheme = document.documentElement.dataset.siteTheme || getSavedSiteTheme();
    applySiteTheme(siteTheme);
    if (siteTheme === DEFAULT_SITE_THEME) {
      apply(document.documentElement.dataset.theme || getPreferredTheme());
    }
    bindThemeSwitches();
    updateThemeSwitchAvailability();

    if (document.documentElement.dataset.themeCommandsBound !== "true") {
      document.documentElement.dataset.themeCommandsBound = "true";
      document.addEventListener("keydown", handleThemeCommandKeydown);
    }
  }

  window.RepoTheme = {
    apply,
    applySiteTheme,
    toggle,
    initialise,
    getPreferredTheme,
    getSavedSiteTheme,
    themes: SITE_THEMES,
  };

  initialise();
})();
