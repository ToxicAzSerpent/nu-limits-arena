/* ==========================================================
   NU LIMITS — ASSET LOGOS  (round 17)

   A logo per listed asset. Defaults are generated marks (one
   per symbol, deterministic colour). Edit Mode can replace any
   of them with an uploaded image.

   Save: nuLimitsAssetLogos_v1
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsAssetLogos_v1";

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "{}");
      return v && typeof v === "object" ? v : {};
    } catch (err) { return {}; }
  }

  function write(v) {
    try { localStorage.setItem(KEY, JSON.stringify(v)); return true; }
    catch (err) { return false; }
  }

  /* deterministic hue from the symbol */
  function hueOf(sym) {
    let h = 0;
    for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) % 360;
    return h;
  }

  function generated(symbol, type) {
    const a = hueOf(symbol);
    const b = (a + 42) % 360;
    const txt = symbol.slice(0, 3);
    const size = txt.length > 2 ? 9.4 : 12.6;
    const crypto = type === "Crypto";
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="hsl(${a} 72% 54%)"/>` +
      `<stop offset="1" stop-color="hsl(${b} 68% 38%)"/></linearGradient></defs>` +
      `<rect width="40" height="40" rx="${crypto ? 20 : 11}" fill="url(#g)"/>` +
      (crypto
        ? `<circle cx="20" cy="20" r="13" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1.4"/>`
        : `<rect x="5.5" y="5.5" width="29" height="29" rx="7" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.2"/>`) +
      `<text x="20" y="20" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="Inter,system-ui,sans-serif" font-size="${size}" font-weight="800" ` +
      `fill="#fff" fill-opacity=".96">${txt}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function logo(symbol, type) {
    const saved = read()[symbol];
    return saved || generated(symbol, type || "Stock");
  }

  function set(symbol, dataUrl) {
    const all = read();
    if (!dataUrl) delete all[symbol];
    else all[symbol] = dataUrl;
    return write(all);
  }

  function pick(symbol, cb) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) { input.remove(); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const S = 96;
          const c = document.createElement("canvas");
          c.width = c.height = S;
          const g = c.getContext("2d");
          const scale = Math.max(S / img.width, S / img.height);
          g.drawImage(img, (S - img.width * scale) / 2, (S - img.height * scale) / 2,
            img.width * scale, img.height * scale);
          cb(c.toDataURL("image/png"));
        } catch (err) { cb(null); }
        URL.revokeObjectURL(url);
        input.remove();
      };
      img.onerror = () => { cb(null); URL.revokeObjectURL(url); input.remove(); };
      img.src = url;
    });
    input.click();
  }

  window.nuLimitsAssetLogos = { logo, set, pick, KEY, generated };
})();

/* ==========================================================
   Edit Mode — replace any asset logo
   ========================================================== */
(function () {
  "use strict";

  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());

  function symbols() {
    const seen = [];
    document.querySelectorAll("#dynamic-page [data-asset]").forEach(el => {
      const s = el.dataset.asset;
      if (s && seen.indexOf(s) < 0) seen.push(s);
    });
    return seen;
  }

  function sheet() {
    const M = window.nuLimitsMarket;
    const list = M ? M.assets.map(a => a.symbol) : symbols();
    const typeOf = sym => (M ? M.typeOf(sym) : "Stock");
    if (!list.length) return;

    const modal = document.createElement("div");
    modal.className = "mn-modal";
    modal.innerHTML = `<div class="mn-sheet">
      <header><strong>Asset logos</strong><button type="button" data-close>✕</button></header>
      <div class="mn-form">
        <p class="rs-hint">Tap a logo to upload a new one. Everything is stored on this device.</p>
        <div class="al-grid">
          ${list.map(sym => `<button type="button" class="al-cell" data-logo="${sym}">
            <img alt="" src="${window.nuLimitsAssetLogos.logo(sym, typeOf(sym))}">
            <b>${sym}</b>
          </button>`).join("")}
        </div>
      </div>
    </div>`;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));

    const close = () => { modal.classList.remove("show"); setTimeout(() => modal.remove(), 240); };
    modal.addEventListener("click", e => {
      if (e.target === modal || e.target.closest("[data-close]")) close();
    });

    modal.addEventListener("click", e => {
      const cell = e.target.closest("[data-logo]");
      if (!cell) return;
      const sym = cell.dataset.logo;
      window.nuLimitsAssetLogos.pick(sym, dataUrl => {
        if (!dataUrl) return;
        window.nuLimitsAssetLogos.set(sym, dataUrl);
        const img = cell.querySelector("img");
        if (img) img.src = dataUrl;
        if (window.renderInvestments) window.renderInvestments();
        close();
      });
    });
  }

  function inject() {
    const page = document.querySelector("#dynamic-page .nl-invest-page");
    if (!page || !editOn()) return;
    if (page.querySelector(".al-tools")) return;
    const bar = document.createElement("div");
    bar.className = "al-tools";
    bar.innerHTML = `<button type="button">Edit asset logos</button>`;
    bar.querySelector("button").addEventListener("click", sheet);
    page.insertBefore(bar, page.firstElementChild.nextSibling);
  }

  const start = () => {
    const dp = document.getElementById("dynamic-page");
    if (!dp) return;
    new MutationObserver(() => requestAnimationFrame(inject))
      .observe(dp, { childList: true, subtree: false });
    if (window.nuLimitsEditMode && window.nuLimitsEditMode.onChange) {
      window.nuLimitsEditMode.onChange(() => requestAnimationFrame(inject));
    }
    requestAnimationFrame(inject);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
