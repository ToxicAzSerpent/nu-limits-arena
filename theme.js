/* ==========================================================
   NU LIMITS — THEME (round 14)
   Light · Dark · Auto, remembered between sessions.
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsTheme_v1";
  const MODES = ["light", "dark", "blush", "noir", "auto"];
  const DEFAULT_MODE = "light";
  const MIGRATED_KEY = "nuLimitsThemeDefault_v37";
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function read() {
    try {
      const v = localStorage.getItem(KEY);
      /* round 37 — Light is the default look again. Existing saves that were
         sitting on the blush default move across once; choosing blush in
         Settings after that sticks. */
      const migrated = localStorage.getItem(MIGRATED_KEY) === "1";
      if (!migrated) {
        localStorage.setItem(MIGRATED_KEY, "1");
        if (!v || v === "blush") { localStorage.setItem(KEY, DEFAULT_MODE); return DEFAULT_MODE; }
      }
      return MODES.indexOf(v) >= 0 ? v : DEFAULT_MODE;
    } catch (err) { return DEFAULT_MODE; }
  }

  const resolve = mode => (mode === "auto" ? (media.matches ? "dark" : "light") : mode);

  function paint(mode) {
    const wanted = MODES.indexOf(mode) >= 0 ? mode : DEFAULT_MODE;
    const look = resolve(wanted);

    document.documentElement.dataset.theme = look;
    document.documentElement.style.colorScheme = look;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content",
      look === "dark" ? "#12100e" : look === "noir" ? "#0e0e13" : look === "blush" ? "#f4eae4" : "#f5f0e9");

    document.querySelectorAll("[data-theme-set]").forEach(btn => {
      const on = btn.dataset.themeSet === wanted;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    const hint = document.getElementById("theme-hint");
    if (hint) {
      hint.textContent = wanted === "auto"
        ? `Following your device — currently ${look}.`
        : wanted === "noir"
          ? "Noir — the NU Limits Store look: void black, frosted glass, magenta."
          : wanted === "dark"
          ? "Dark mode is on. Everything stays readable, night or day."
          : wanted === "blush"
            ? "Blush — the default look: cream paper, dusty rose, charcoal cards."
            : "Light mode — the original warm paper look.";
    }
  }

  function set(mode) {
    const wanted = MODES.indexOf(mode) >= 0 ? mode : DEFAULT_MODE;
    try { localStorage.setItem(KEY, wanted); } catch (err) { /* ignore */ }

    const root = document.documentElement;
    root.classList.add("theme-anim");
    window.setTimeout(() => root.classList.remove("theme-anim"), 400);

    paint(wanted);
    document.dispatchEvent(new CustomEvent("nuLimitsThemeChange", {
      detail: { mode: wanted, resolved: resolve(wanted) }
    }));
  }

  function boot() {
    paint(read());

    document.querySelectorAll("[data-theme-set]").forEach(btn => {
      btn.addEventListener("click", () => set(btn.dataset.themeSet));
    });

    const onChange = () => { if (read() === "auto") paint("auto"); };
    if (media.addEventListener) media.addEventListener("change", onChange);
    else if (media.addListener) media.addListener(onChange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.nuLimitsTheme = {
    get: read,
    set,
    apply: paint,
    resolve,
    isDark: () => document.documentElement.dataset.theme === "dark",
    isBlush: () => document.documentElement.dataset.theme === "blush",
    isNoir: () => document.documentElement.dataset.theme === "noir"
  };
})();
