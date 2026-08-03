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
    fallout: "Fallout terminal",
    dracula: "Dracula castle",
  });

  let commandBuffer = "";
  let commandTimer = 0;

  const MATRIX_RAIN_ID = "matrix-rain-canvas";
  const MATRIX_RAIN_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
  let matrixRainAnimation = 0;
  let matrixRainResizeTimer = 0;

  const DRACULA_FOG_ID = "dracula-fog-layer";
  const DRACULA_FOG_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

  const FALLOUT_EFFECT_ID = "fallout-crt-layer";
  const FALLOUT_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
  let falloutFlickerTimer = 0;
  let falloutPulseTimer = 0;

  const EFFECT_TEST_DURATION_MS = 2400;
  const EFFECT_TEST_THEMES = new Set(["matrix", "dracula", "fallout"]);
  let effectTestFrame = 0;
  let effectTestTimer = 0;
  let effectTestGeneration = 0;

  function effectModeKey(siteTheme) {
    return `repo-theme-effects-mode:${siteTheme}`;
  }

  function cancelEffectPerformanceTest() {
    effectTestGeneration += 1;
    if (effectTestFrame) window.cancelAnimationFrame(effectTestFrame);
    window.clearTimeout(effectTestTimer);
    effectTestFrame = 0;
    effectTestTimer = 0;
  }

  function setEffectsLite(enabled, siteTheme, { remember = true, restart = false } = {}) {
    document.documentElement.classList.toggle("theme-effects-lite", enabled);
    if (remember && EFFECT_TEST_THEMES.has(siteTheme)) {
      try {
        sessionStorage.setItem(effectModeKey(siteTheme), enabled ? "lite" : "full");
      } catch (_) {
        // Storage can be unavailable in locked-down/offline browser modes.
      }
    }

    if (restart && document.documentElement.dataset.siteTheme === siteTheme) {
      syncThemeEffects(siteTheme);
    }
  }

  function restoreEffectsMode(siteTheme) {
    cancelEffectPerformanceTest();
    let saved = null;
    try {
      saved = sessionStorage.getItem(effectModeKey(siteTheme));
    } catch (_) {
      saved = null;
    }
    setEffectsLite(saved === "lite", siteTheme, { remember: false });
    return saved;
  }

  function scheduleEffectPerformanceTest(siteTheme) {
    cancelEffectPerformanceTest();
    if (!EFFECT_TEST_THEMES.has(siteTheme) || document.hidden) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let saved = null;
    try {
      saved = sessionStorage.getItem(effectModeKey(siteTheme));
    } catch (_) {
      saved = null;
    }
    if (saved === "lite" || saved === "full") return;

    const generation = effectTestGeneration;
    const frameTimes = [];
    let startedAt = 0;
    let lastFrameAt = 0;
    let longTaskMs = 0;
    let observer = null;

    if ("PerformanceObserver" in window) {
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) longTaskMs += entry.duration;
        });
        observer.observe({ type: "longtask", buffered: false });
      } catch (_) {
        observer = null;
      }
    }

    function finish(now) {
      observer?.disconnect();
      effectTestFrame = 0;
      effectTestTimer = 0;
      if (generation !== effectTestGeneration) return;
      if (document.documentElement.dataset.siteTheme !== siteTheme || document.hidden) return;

      const elapsed = Math.max(1, now - startedAt);
      const fps = frameTimes.length / (elapsed / 1000);
      const delayedFrames = frameTimes.filter((gap) => gap > 34).length;
      const delayedRatio = frameTimes.length ? delayedFrames / frameTimes.length : 0;
      const struggling = fps < 43 || delayedRatio > 0.24 || longTaskMs > 300;

      setEffectsLite(struggling, siteTheme, { remember: true, restart: struggling });
    }

    function sample(now) {
      if (!startedAt) {
        startedAt = now;
        lastFrameAt = now;
      } else {
        frameTimes.push(now - lastFrameAt);
        lastFrameAt = now;
      }

      if (now - startedAt >= EFFECT_TEST_DURATION_MS) {
        finish(now);
        return;
      }
      effectTestFrame = window.requestAnimationFrame(sample);
    }

    // Let the selected theme settle before measuring it.
    effectTestTimer = window.setTimeout(() => {
      if (generation !== effectTestGeneration || document.hidden) return;
      effectTestFrame = window.requestAnimationFrame(sample);
    }, 450);
  }

  function clearFalloutTimers() {
    window.clearTimeout(falloutFlickerTimer);
    window.clearTimeout(falloutPulseTimer);
    falloutFlickerTimer = 0;
    falloutPulseTimer = 0;
  }

  function stopFalloutEffects({ remove = false } = {}) {
    clearFalloutTimers();
    const layer = document.getElementById(FALLOUT_EFFECT_ID);
    if (!layer) return;
    layer.classList.remove("is-active", "screen-pulse");
    layer.querySelectorAll(".fallout-static-flash").forEach((flash) => flash.remove());
    if (remove) layer.remove();
  }

  function scheduleFalloutFlicker(layer) {
    if (FALLOUT_REDUCED_MOTION.matches || document.hidden
        || document.documentElement.classList.contains("theme-effects-lite")) return;
    const delay = 2400 + Math.random() * 5200;
    falloutFlickerTimer = window.setTimeout(() => {
      if (document.documentElement.dataset.siteTheme !== "fallout" || !layer.isConnected) return;

      const flash = document.createElement("span");
      flash.className = "fallout-static-flash";
      flash.style.setProperty("--flash-top", `${Math.random() * 92}%`);
      flash.style.setProperty("--flash-left", `${Math.random() * 62 - 8}%`);
      flash.style.setProperty("--flash-width", `${28 + Math.random() * 82}%`);
      flash.style.setProperty("--flash-height", `${2 + Math.random() * 14}px`);
      flash.style.setProperty("--flash-opacity", `${0.18 + Math.random() * 0.38}`);
      flash.style.setProperty("--flash-duration", `${260 + Math.random() * 760}ms`);
      layer.appendChild(flash);
      flash.addEventListener("animationend", () => flash.remove(), { once: true });
      scheduleFalloutFlicker(layer);
    }, delay);
  }

  function scheduleFalloutPulse(layer) {
    if (FALLOUT_REDUCED_MOTION.matches || document.hidden
        || document.documentElement.classList.contains("theme-effects-lite")) return;
    const delay = 18000 + Math.random() * 30000;
    falloutPulseTimer = window.setTimeout(() => {
      if (document.documentElement.dataset.siteTheme !== "fallout" || !layer.isConnected) return;
      layer.classList.remove("screen-pulse");
      void layer.offsetWidth;
      layer.classList.add("screen-pulse");
      window.setTimeout(() => layer.classList.remove("screen-pulse"), 900);
      scheduleFalloutPulse(layer);
    }, delay);
  }

  function startFalloutEffects() {
    stopFalloutEffects();
    if (document.hidden) return;

    let layer = document.getElementById(FALLOUT_EFFECT_ID);
    if (!layer) {
      layer = document.createElement("div");
      layer.id = FALLOUT_EFFECT_ID;
      layer.className = "theme-effect-layer fallout-crt-layer";
      layer.setAttribute("aria-hidden", "true");
      layer.innerHTML = `
        <span class="fallout-phosphor-hotspot fallout-phosphor-hotspot-a"></span>
        <span class="fallout-phosphor-hotspot fallout-phosphor-hotspot-b"></span>
        <span class="fallout-rolling-band"></span>
        <span class="fallout-scan-distortion"></span>
      `;
      document.body.prepend(layer);
    }

    layer.classList.toggle("reduce-motion", FALLOUT_REDUCED_MOTION.matches);
    requestAnimationFrame(() => layer.classList.add("is-active"));
    if (!FALLOUT_REDUCED_MOTION.matches) {
      scheduleFalloutFlicker(layer);
      scheduleFalloutPulse(layer);
    }
  }

  function stopDraculaFog({ remove = false } = {}) {
    const layer = document.getElementById(DRACULA_FOG_ID);
    if (!layer) return;

    layer.classList.remove("is-active");
    if (remove) layer.remove();
  }

  function startDraculaFog() {
    stopDraculaFog();

    if (document.hidden) return;

    let layer = document.getElementById(DRACULA_FOG_ID);
    if (!layer) {
      layer = document.createElement("div");
      layer.id = DRACULA_FOG_ID;
      layer.className = "theme-effect-layer dracula-fog-layer";
      layer.setAttribute("aria-hidden", "true");

      for (let index = 1; index <= 3; index += 1) {
        const bank = document.createElement("span");
        bank.className = `dracula-fog-bank dracula-fog-bank-${index}`;
        layer.appendChild(bank);
      }

      document.body.prepend(layer);
    }

    layer.classList.toggle("reduce-motion", DRACULA_FOG_REDUCED_MOTION.matches);
    requestAnimationFrame(() => layer.classList.add("is-active"));
  }

  function stopMatrixRain({ remove = false } = {}) {
    if (matrixRainAnimation) {
      window.cancelAnimationFrame(matrixRainAnimation);
      matrixRainAnimation = 0;
    }
    window.clearTimeout(matrixRainResizeTimer);
    matrixRainResizeTimer = 0;

    const canvas = document.getElementById(MATRIX_RAIN_ID);
    if (canvas) {
      canvas.classList.remove("is-active");
      if (remove) canvas.remove();
    }
  }

  function startMatrixRain() {
    stopMatrixRain();

    if (MATRIX_RAIN_REDUCED_MOTION.matches || document.hidden) return;

    let canvas = document.getElementById(MATRIX_RAIN_ID);
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = MATRIX_RAIN_ID;
      canvas.setAttribute("aria-hidden", "true");
      document.body.prepend(canvas);
    }

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let fontSize = 18;
    let columns = 0;
    let drops = [];
    let lastFrame = 0;

    function resize() {
      const lite = document.documentElement.classList.contains("theme-effects-lite");
      fontSize = lite ? 22 : 18;
      const ratio = Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.25);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = Math.ceil(width / fontSize);
      drops = Array.from({ length: columns }, (_, index) =>
        drops[index] ?? Math.floor(Math.random() * -45),
      );
      context.clearRect(0, 0, width, height);
    }

    function draw(timestamp) {
      if (document.documentElement.dataset.siteTheme !== "matrix" || document.hidden) {
        stopMatrixRain();
        return;
      }

      const lite = document.documentElement.classList.contains("theme-effects-lite");
      const frameInterval = lite ? 125 : 82;
      if (timestamp - lastFrame >= frameInterval) {
        lastFrame = timestamp;
        const width = window.innerWidth;
        const height = window.innerHeight;

        context.fillStyle = "rgba(2, 7, 4, 0.115)";
        context.fillRect(0, 0, width, height);
        context.font = `${fontSize}px "Matrix MZ4P", Consolas, monospace`;
        context.textAlign = "center";

        for (let index = 0; index < columns; index += 1) {
          const x = index * fontSize + fontSize / 2;
          const y = drops[index] * fontSize;
          const digit = Math.random() > 0.5 ? "1" : "0";

          context.fillStyle = Math.random() > 0.965
            ? "rgba(220, 255, 225, 0.88)"
            : "rgba(56, 255, 98, 0.58)";
          context.fillText(digit, x, y);

          if (y > height && Math.random() > 0.973) {
            drops[index] = Math.floor(Math.random() * -24);
          } else {
            drops[index] += 1;
          }
        }
      }

      matrixRainAnimation = window.requestAnimationFrame(draw);
    }

    resize();
    canvas.classList.add("is-active");
    matrixRainAnimation = window.requestAnimationFrame(draw);

    if (canvas.dataset.resizeBound !== "true") {
      canvas.dataset.resizeBound = "true";
      window.addEventListener("resize", () => {
        if (document.documentElement.dataset.siteTheme !== "matrix") return;
        window.clearTimeout(matrixRainResizeTimer);
        matrixRainResizeTimer = window.setTimeout(() => {
          stopMatrixRain();
          startMatrixRain();
        }, 120);
      });
    }
  }

  function syncThemeEffects(siteTheme) {
    if (siteTheme === "matrix") {
      startMatrixRain();
    } else {
      stopMatrixRain({ remove: true });
    }

    if (siteTheme === "dracula") {
      startDraculaFog();
    } else {
      stopDraculaFog({ remove: true });
    }

    if (siteTheme === "fallout") {
      startFalloutEffects();
    } else {
      stopFalloutEffects({ remove: true });
    }
  }

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
    restoreEffectsMode(normalized);
    syncThemeEffects(normalized);
    scheduleEffectPerformanceTest(normalized);

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
      document.addEventListener("visibilitychange", () => {
        const siteTheme = document.documentElement.dataset.siteTheme;
        if (document.hidden) {
          cancelEffectPerformanceTest();
          stopMatrixRain();
          stopDraculaFog();
          stopFalloutEffects();
        } else if (siteTheme === "matrix") {
          startMatrixRain();
          scheduleEffectPerformanceTest(siteTheme);
        } else if (siteTheme === "dracula") {
          startDraculaFog();
          scheduleEffectPerformanceTest(siteTheme);
        } else if (siteTheme === "fallout") {
          startFalloutEffects();
          scheduleEffectPerformanceTest(siteTheme);
        }
      });
      MATRIX_RAIN_REDUCED_MOTION.addEventListener?.("change", () => {
        if (document.documentElement.dataset.siteTheme === "matrix") {
          if (MATRIX_RAIN_REDUCED_MOTION.matches) stopMatrixRain({ remove: true });
          else startMatrixRain();
        }
      });
      DRACULA_FOG_REDUCED_MOTION.addEventListener?.("change", () => {
        if (document.documentElement.dataset.siteTheme === "dracula") {
          if (DRACULA_FOG_REDUCED_MOTION.matches) stopDraculaFog({ remove: true });
          else startDraculaFog();
        }
      });
      FALLOUT_REDUCED_MOTION.addEventListener?.("change", () => {
        if (document.documentElement.dataset.siteTheme === "fallout") {
          startFalloutEffects();
        }
      });
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
