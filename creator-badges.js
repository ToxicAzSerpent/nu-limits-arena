/* =========================================================
   NU LIMITS — EDIT BADGES  (Round 36)

   Creator Edit Mode, but for everything you can see.

   With edit mode on, a small floating layer puts real buttons
   on top of the page content — never inside it, so taps and
   the game's own buttons keep working:

     ⇄  every photo / cover / art block   → upload or paste a new one
     ✕  every photo, card, row, tile, slot → remove it for good
     ＋ every section                      → add your own text or photo
     ↺  in the toolbar                     → undo everything on this page

   Removals, replacements and added blocks are stored per page in
   nuLimitsEditTargets_v1 and re-applied after reloads, after the
   game re-renders, and with edit mode off.

   Nothing here runs unless Creator Edit Mode is on.
   ========================================================= */

(function () {
  "use strict";

  const KEY = "nuLimitsEditTargets_v1";
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function toast(msg) {
    let el = document.querySelector(".mn-toast");
    if (!el) { el = document.createElement("div"); el.className = "mn-toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el.__t);
    el.__t = window.setTimeout(() => el.classList.remove("show"), 2400);
  }

  /* ---------------------------------------------------------
     Store
     --------------------------------------------------------- */
  const blank = () => ({ hidden: [], images: {}, blocks: [] });

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "{}");
      return v && v.pages ? v : { pages: {} };
    } catch (err) { return { pages: {} }; }
  }

  function write(v) {
    try { localStorage.setItem(KEY, JSON.stringify(v)); return true; }
    catch (err) { toast("Out of storage — remove a photo first."); return false; }
  }

  function pageRec(key, create) {
    const all = read();
    if (!all.pages[key] && create) { all.pages[key] = blank(); write(all); }
    if (!all.pages[key]) all.pages[key] = blank();
    if (!Array.isArray(all.pages[key].hidden)) all.pages[key].hidden = [];
    if (!all.pages[key].images) all.pages[key].images = {};
    if (!Array.isArray(all.pages[key].blocks)) all.pages[key].blocks = [];
    return all.pages[key];
  }

  function patch(key, fn) {
    const all = read();
    if (!all.pages[key]) all.pages[key] = blank();
    const rec = all.pages[key];
    rec.hidden = rec.hidden || []; rec.images = rec.images || {}; rec.blocks = rec.blocks || [];
    fn(rec);
    write(all);
    return rec;
  }

  /* ---------------------------------------------------------
     Page identity + element paths
     --------------------------------------------------------- */
  function liveRoot() {
    const dp = document.getElementById("dynamic-page");
    if (dp && !dp.hidden && dp.firstElementChild) return dp;
    const main = document.getElementById("main-content");
    if (main && !main.hidden) return main;
    return dp && !dp.hidden ? dp : main;
  }

  function scopeOf(root) {
    if (!root) return "main";
    if (root.id === "main-content") return "main";
    const first = root.firstElementChild || root;
    const cls = (typeof first.className === "string" ? first.className : "").split(" ").filter(Boolean)[0] || root.id || "page";
    const head = root.querySelector("h1, h2");
    return cls + "|" + (head ? head.textContent.trim().slice(0, 30) : "");
  }

  function pathOf(el, root) {
    const parts = [];
    let node = el;
    while (node && node !== root && node.parentElement) {
      const parent = node.parentElement;
      const tag = node.tagName.toLowerCase();
      let i = 0;
      for (const sib of parent.children) { if (sib === node) break; if (sib.tagName === node.tagName) i++; }
      parts.unshift(tag + ":" + i);
      node = parent;
    }
    return parts.join(">");
  }

  function nodeAt(root, path) {
    let node = root;
    if (!root || !path) return null;
    for (const seg of path.split(">")) {
      const [tag, idx] = seg.split(":");
      if (!node) return null;
      node = [...node.children].filter(k => k.tagName.toLowerCase() === tag)[Number(idx)] || null;
    }
    return node;
  }

  /* ---------------------------------------------------------
     Repaint saved changes (runs with edit mode on or off)
     --------------------------------------------------------- */
  let painting = false;

  function paint() {
    const root = liveRoot();
    if (!root || painting) return;
    painting = true;
    try {
      const key = scopeOf(root);
      const rec = pageRec(key, false);
      rec.hidden.forEach(p => { const n = nodeAt(root, p); if (n) n.style.display = "none"; });
      Object.keys(rec.images).forEach(p => {
        const n = nodeAt(root, p);
        if (!n) return;
        if (n.tagName === "IMG") n.setAttribute("src", rec.images[p]);
        else {
          n.style.backgroundImage = `url("${rec.images[p]}")`;
          n.style.backgroundSize = "cover";
          n.style.backgroundPosition = "center";
        }
      });
      paintBlocks(root, key, rec);
    } catch (err) { /* keep the game alive */ }
    painting = false;
  }

  function paintBlocks(root, key, rec) {
    root.querySelectorAll(":scope .cb-blocks").forEach(n => n.remove());
    (rec.blocks || []).forEach(b => {
      const host = b.after ? nodeAt(root, b.after) : null;
      const card = document.createElement("article");
      card.className = "cb-card";
      card.innerHTML =
        (b.src ? `<div class="cb-art" style="background-image:url('${esc(b.src)}')"></div>` : "") +
        (b.text ? `<p>${esc(b.text)}</p>` : "");
      if (host && host.parentElement) {
        const wrap = document.createElement("div");
        wrap.className = "cb-blocks";
        wrap.appendChild(card);
        host.parentElement.insertBefore(wrap, host.nextSibling);
      } else {
        const wrap = document.createElement("div");
        wrap.className = "cb-blocks";
        wrap.appendChild(card);
        root.appendChild(wrap);
      }
    });
  }

  /* ---------------------------------------------------------
     What counts as a target?
     --------------------------------------------------------- */
  const CARD_RE = /(mn-card|mn-brand|action-card|bk-card|fm-card|cr-card|rs-card|gr-card|mn-row|mn-tile|slot|item|panel|stat|room|shot|qualbadge|nl-card|job-card|uv-card|upgrade|dish|menu-row|tx-row|list-row)/i;
  const SKIP_RE = /(ceb-|mt-lightbox|mn-toast|chip|pill|btn|badge|dot|icon|avatar|scroll|nav|tab|eyebrow|label-kicker)/i;

  function boxOf(el) {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height, top: r.top, left: r.left, r };
  }

  function visible(el) {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) < 0.05) return false;
    const b = el.getBoundingClientRect();
    if (b.width < 26 || b.height < 20) return false;
    if (b.bottom < -80 || b.top > window.innerHeight + 80) return false;
    return true;
  }

  function isPhoto(el) {
    if (el.tagName === "IMG") return true;
    if (el.tagName === "svg" || el.closest("svg")) return false;
    const bg = getComputedStyle(el).backgroundImage;
    return !!bg && bg !== "none" && bg.indexOf("url(") === 0;
  }

  function collect(root) {
    const photos = [];
    const cards = [];
    const sections = [];

    const all = root.querySelectorAll("*");
    for (const el of all) {
      if (!el.closest || el.closest("#ceb-layer, .cb-blocks, .mn-toast")) continue;
      const cls = typeof el.className === "string" ? el.className : "";
      if (SKIP_RE.test(cls) && !isPhoto(el)) continue;
      if (!visible(el)) continue;

      if (isPhoto(el)) { photos.push(el); continue; }

      const isCard = el.tagName === "LI" || el.tagName === "TR" || CARD_RE.test(cls);
      if (isCard) {
        /* keep the outermost card, not its text children */
        if (!el.querySelector("img") || cls.match(CARD_RE)) cards.push(el);
        continue;
      }

      if (el.tagName === "SECTION" || (el.tagName === "ARTICLE" && cls)) sections.push(el);
    }

    /* a card should not sit inside another card that is already listed */
    const dedupe = list => list.filter((el, i) =>
      list.indexOf(list.find(other => other !== el && other.contains(el))) < 0 || i === 0);

    return { photos: dedupe(photos).slice(0, 40), cards: dedupe(cards).slice(0, 40), sections: sections.slice(0, 20) };
  }

  /* ---------------------------------------------------------
     The floating badge layer
     --------------------------------------------------------- */
  let layer = null;
  let raf = 0;

  function ensureLayer() {
    if (!layer || !document.body.contains(layer)) {
      layer = document.createElement("div");
      layer.id = "ceb-layer";
      document.body.appendChild(layer);
    }
    return layer;
  }

  function clearLayer() {
    if (layer) layer.innerHTML = "";
  }

  function place(btn, rect, dx, dy) {
    btn.style.top = Math.round(rect.top + dy) + "px";
    btn.style.left = Math.round(rect.left + dx) + "px";
  }

  function addBtn(cls, label, title, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ceb-btn " + cls;
    b.innerHTML = label;
    b.title = title;
    b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); onClick(); });
    ensureLayer().appendChild(b);
    return b;
  }

  function draw() {
    raf = 0;
    if (!editOn()) { clearLayer(); return; }
    const root = liveRoot();
    if (!root) return;
    /* round 44 — the NU Limits Store runs its own edit badges */
    if (root.querySelector(".sh-page.nsa")) { clearLayer(); return; }
    clearLayer();

    const key = scopeOf(root);
    const rec = pageRec(key, false);

    /* delete + replace on photos */
    collect(root).photos.forEach(el => {
      if (getComputedStyle(el).display === "none") return;
      const r = el.getBoundingClientRect();
      const del = addBtn("is-del", "✕", "Remove this photo", () => removeEl(el, root, key));
      place(del, r, r.width - 26, 6);
      const sw = addBtn("is-swap", "⇄", "Replace this photo", () => replacePhoto(el, root, key));
      place(sw, r, r.width - 52, 6);
    });

    /* delete on cards, rows, tiles, slots */
    collect(root).cards.forEach(el => {
      if (getComputedStyle(el).display === "none") return;
      const r = el.getBoundingClientRect();
      const del = addBtn("is-del", "✕", "Remove this block", () => removeEl(el, root, key));
      place(del, r, r.width - 26, 6);
    });

    /* add on sections */
    collect(root).sections.forEach(el => {
      const r = el.getBoundingClientRect();
      const add = addBtn("is-add", "＋", "Add text or photo here", () => addBlock(el, root, key));
      place(add, r, r.width - 26, 6);
    });

    paint();
  }

  function redraw() {
    if (raf) return;
    raf = requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------
     Actions
     --------------------------------------------------------- */
  function removeEl(el, root, key) {
    const path = pathOf(el, root);
    if (!path) { toast("Can't remove that one."); return; }
    patch(key, rec => { if (!rec.hidden.includes(path)) rec.hidden.push(path); });
    el.style.display = "none";
    toast("Removed. ↺ in the toolbar undoes it.");
    redraw();
  }

  function pickImage(cb) {
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
          const s = Math.min(1, 1400 / img.width);
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * s);
          c.height = Math.round(img.height * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          cb(c.toDataURL("image/jpeg", 0.78));
        } catch (err) { cb(null); }
        URL.revokeObjectURL(url);
        input.remove();
      };
      img.onerror = () => { cb(null); URL.revokeObjectURL(url); input.remove(); };
      img.src = url;
    });
    input.click();
  }

  function replacePhoto(el, root, key) {
    const path = pathOf(el, root);
    const clue = window.prompt("Paste an image URL, or leave empty to upload a photo from this device", "");
    const save = src => {
      if (!src) return;
      patch(key, rec => { rec.images[path] = src; });
      if (el.tagName === "IMG") el.setAttribute("src", src);
      else {
        el.style.backgroundImage = `url("${src}")`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
      }
      toast("Photo replaced.");
      redraw();
    };
    if (clue && clue.trim()) return save(clue.trim());
    pickImage(src => { if (src) save(src); });
  }

  function addBlock(section, root, key) {
    const after = pathOf(section, root);
    const text = window.prompt("Text to add — leave it empty to pick a photo instead", "");
    if (text == null) return;

    if (text.trim()) {
      patch(key, rec => { rec.blocks.push({ id: "b" + Date.now().toString(36), text: text.trim(), after }); });
      paint(); redraw(); toast("Text block added.");
      return;
    }

    pickImage(src => {
      if (!src) return;
      patch(key, rec => { rec.blocks.push({ id: "b" + Date.now().toString(36), src, after }); });
      paint(); redraw(); toast("Photo block added.");
    });
  }

  function resetPage() {
    const root = liveRoot();
    if (!root) return;
    const key = scopeOf(root);
    if (!window.confirm("Undo every removal, photo swap and added block on this page?")) return;
    patch(key, rec => { rec.hidden = []; rec.images = {}; rec.blocks = []; });
    paint();
    redraw();
    toast("Page restored.");
  }

  /* ---------------------------------------------------------
     Toolbar
     --------------------------------------------------------- */
  let bar = null;

  function editsOnPage() {
    const root = liveRoot();
    if (!root) return 0;
    const rec = pageRec(scopeOf(root), false);
    return rec.hidden.length + Object.keys(rec.images).length + rec.blocks.length;
  }

  function ensureBar() {
    if (!editOn()) { if (bar) { bar.remove(); bar = null; } return; }
    /* the store paints its own edit chrome — no floating undo bar there */
    const host = document.querySelector(".sh-page.nsa");
    if (host) { if (bar) { bar.remove(); bar = null; } return; }
    if (bar && document.body.contains(bar)) {
      const c = bar.querySelector(".ceb-count");
      if (c) c.textContent = editsOnPage() + " here";
      return;
    }
    bar = document.createElement("div");
    bar.id = "ceb-bar";
    bar.innerHTML = `
      <span class="ceb-count">${editsOnPage()} here</span>
      <button type="button" data-ceb="reset">↺ Undo page</button>`;
    bar.querySelector("[data-ceb=reset]").addEventListener("click", resetPage);
    document.body.appendChild(bar);
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  let wasOn = null;

  function tick() {
    const on = editOn();
    if (on !== wasOn) {
      wasOn = on;
      ensureBar();
      if (!on) clearLayer();
      else paint();
      redraw();
    }
    if (on) ensureBar();
  }

  function boot() {
    paint();
    setInterval(tick, 400);
    window.addEventListener("scroll", redraw, { passive: true, capture: true });
    window.addEventListener("resize", redraw);
    new MutationObserver(() => { if (!painting) redraw(); })
      .observe(document.body, { childList: true, subtree: true });
    tick();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.nuLimitsEditBadges = {
    repaint: () => { paint(); redraw(); },
    resetPage
  };
})();
