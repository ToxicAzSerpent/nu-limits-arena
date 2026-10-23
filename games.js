/* =========================================================
   NU LIMITS — LEVEL UP GAMES  (Round 40)

   A real storefront: featured banner, platform tabs
   (PlayStation · Xbox · PC · Nintendo), a wall of game cards
   with covers, prices and discounts — and every piece of it is
   editable in Creator Edit Mode (add / replace / delete cards,
   rename, re-price, change discounts, add or remove platforms).

   State lives inside the ventures save (items.games).
   ========================================================= */

(function () {
  "use strict";

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const V = () => window.nuLimitsVentures || null;
  const money = n => "R " + Math.round(Number(n) || 0).toLocaleString("en-ZA");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const freePlay = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());
  const day = () => (window.nuLimitsWorld ? window.nuLimitsWorld.day : 1);

  function toast(msg, bad) {
    let el = document.querySelector(".mn-toast");
    if (!el) { el = document.createElement("div"); el.className = "mn-toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.toggle("is-bad", !!bad);
    el.classList.add("show");
    clearTimeout(el.__t);
    el.__t = window.setTimeout(() => el.classList.remove("show"), 2800);
  }

  const uid = () => "gm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  /* ---------------------------------------------------------
     Seed catalogue — all English names
     --------------------------------------------------------- */
  const SEED_PLATFORMS = ["PlayStation", "Xbox", "PC", "Nintendo"];

  const SEED = [
    { title: "League of Legends: Wild Rift", platform: "PC", tag: "Free to play", price: 0, discount: 0, img: "images/creator/esports.jpg", featured: true, blurb: "Become a legend. Choose a champion, learn the skill, beat opponents in 5v5." },
    { title: "God of War Ragnarök", platform: "PlayStation", tag: "Basic game", price: 1199, discount: 25, img: "images/creator/gaming.jpg" },
    { title: "Cyberpunk 2077", platform: "PC", tag: "Basic game", price: 899, discount: 50, img: "images/creator/tech.jpg" },
    { title: "Control Ultimate Edition", platform: "Xbox", tag: "Basic game", price: 749, discount: 25, img: "images/creator/studio.jpg" },
    { title: "Hogwarts Legacy", platform: "PC", tag: "Basic game", price: 1099, discount: 25, img: "images/shop/m-01.jpg" },
    { title: "Spider-Man 2", platform: "PlayStation", tag: "Basic game", price: 1299, discount: 15, img: "images/shop/m-02.jpg" },
    { title: "Forza Horizon 5", platform: "Xbox", tag: "Basic game", price: 999, discount: 30, img: "images/shop/m-03.jpg" },
    { title: "Elden Ring", platform: "PC", tag: "Basic game", price: 1149, discount: 20, img: "images/shop/m-04.jpg" },
    { title: "Mario Kart 8 Deluxe", platform: "Nintendo", tag: "Basic game", price: 899, discount: 0, img: "images/shop/w-01.jpg" },
    { title: "FIFA 26", platform: "PlayStation", tag: "New release", price: 1349, discount: 0, img: "images/creator/irl.jpg" },
    { title: "Halo Infinite", platform: "Xbox", tag: "Basic game", price: 799, discount: 35, img: "images/creator/gaming.jpg" },
    { title: "Baldur's Gate 3", platform: "PC", tag: "Basic game", price: 1249, discount: 10, img: "images/shop/w-02.jpg" }
  ];

  function rec() {
    const v = V();
    if (!v) return null;
    const s = v.state("games");
    if (!Array.isArray(s.platforms) || !s.platforms.length) s.platforms = SEED_PLATFORMS.slice();
    if (!Array.isArray(s.games)) {
      s.games = SEED.map(g => Object.assign({ id: uid(), owned: false }, g));
    }
    if (!s.featuredId) {
      const f = s.games.find(g => g.featured) || s.games[0];
      s.featuredId = f ? f.id : null;
    }
    if (!s.tab) s.tab = "all";
    return s;
  }

  const finalPrice = g => Math.max(0, Math.round(g.price * (1 - (Number(g.discount) || 0) / 100)));
  const byId = (s, id) => s.games.find(g => g.id === id);

  /* ---------------------------------------------------------
     Page
     --------------------------------------------------------- */
  function heroCard(s) {
    const g = byId(s, s.featuredId) || s.games[0];
    if (!g) return "";
    const price = finalPrice(g);
    return `<section class="gx-hero" style="background-image:url('${esc(g.img || "")}')">
      <span class="gx-hero-veil"></span>
      ${editOn() ? `<button class="gx-hero-edit" type="button" data-gx="feature-photo">Change banner</button>` : ""}
      <button class="gx-hero-like${g.liked ? " is-on" : ""}" type="button" data-gx="like" data-id="${g.id}" aria-label="Save">
        <svg viewBox="0 0 24 24" fill="${g.liked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z"/></svg>
      </button>
      <div class="gx-hero-body">
        <h2>${esc(g.title)}</h2>
        <p>${esc(g.blurb || "Become a champion: learn the skill, beat your opponents.")}</p>
        <div class="gx-hero-row">
          <button class="gx-hero-cta" type="button" data-gx="buy" data-id="${g.id}">
            ${g.price === 0 ? "Play free" : `Buy · ${money(price)}`}
          </button>
          ${editOn() ? `<button class="gx-hero-side" type="button" data-gx="feature" data-id="${g.id}">Make banner</button>` : ""}
        </div>
      </div>
    </section>`;
  }

  function chips(s) {
    const tabs = ["all"].concat(s.platforms);
    return `<div class="gx-tabs">
      ${tabs.map(p => `<span class="gx-tab-wrap">
        <button class="gx-tab${s.tab === p ? " is-on" : ""}" type="button" data-gx="tab" data-p="${esc(p)}">
          ${p === "all" ? "All games" : esc(p)}
        </button>
        ${editOn() && p !== "all" ? `<button class="gx-tab-x" type="button" data-gx="del-platform" data-p="${esc(p)}" aria-label="Remove platform">✕</button>` : ""}
      </span>`).join("")}
      ${editOn() ? `<button class="gx-tab gx-tab-add" type="button" data-gx="add-platform">+ Platform</button>` : ""}
    </div>`;
  }

  function gameCard(s, g) {
    const price = finalPrice(g);
    const off = Number(g.discount) || 0;
    return `<article class="gx-card" data-gx-open="${g.id}">
      <div class="gx-cover" style="background-image:url('${esc(g.img || "")}')">
        <span class="gx-cover-veil"></span>
        ${off > 0 ? `<span class="gx-off">−${off}%</span>` : ""}
        ${g.owned ? `<span class="gx-owned">OWNED</span>` : ""}
        ${editOn() ? `<div class="gx-card-tools">
          <button type="button" data-gx="swap" data-id="${g.id}" aria-label="Replace cover">⇄</button>
          <button type="button" data-gx="del" data-id="${g.id}" aria-label="Delete game">✕</button>
        </div>` : ""}
      </div>
      <div class="gx-card-body">
        <small>${esc(g.tag || "Basic game")} · ${esc(g.platform || "—")}</small>
        <b>${esc(g.title)}</b>
        <div class="gx-price-row">
          ${off > 0 ? `<span class="gx-was">${money(g.price)}</span>` : ""}
          <span class="gx-now">${price === 0 ? "Free" : money(price)}</span>
          ${off > 0 ? `<span class="gx-badge">−${off}%</span>` : ""}
        </div>
        ${editOn() ? `<div class="gx-card-edit">
          <button type="button" data-gx="edit-title" data-id="${g.id}">Title</button>
          <button type="button" data-gx="edit-price" data-id="${g.id}">Price</button>
          <button type="button" data-gx="edit-off" data-id="${g.id}">Discount</button>
          <button type="button" data-gx="edit-tag" data-id="${g.id}">Label</button>
        </div>` : ""}
      </div>
    </article>`;
  }

  function page(id) {
    const s = rec();
    if (!s) return "";
    const c = V().catalog(id);
    const list = s.tab === "all" ? s.games : s.games.filter(g => g.platform === s.tab);
    const deals = s.games.filter(g => Number(g.discount) > 0).length;

    return `<section class="dynamic-page-content vt-page gx-page">
      ${editOn() ? editStrip(s, id) : ""}

      ${heroCard(s)}

      <div class="gx-head">
        <div>
          <h1>${esc(V().name(id))}</h1>
          <p>${s.games.length} titles · ${s.platforms.length} platforms · ${deals} on discount</p>
        </div>
        <span class="gx-till">${money(s.cash)}</span>
      </div>

      ${chips(s)}

      <div class="gx-section-head">
        <h3>${s.tab === "all" ? "Games with discounts" : esc(s.tab)}</h3>
        <span>${list.length} title${list.length === 1 ? "" : "s"}</span>
      </div>

      <div class="gx-grid">
        ${list.map(g => gameCard(s, g)).join("")}
        ${editOn() ? `<button class="gx-add" type="button" data-gx="add-game">
          <span>+</span><b>Add game</b><small>cover · title · price</small>
        </button>` : ""}
      </div>

      <div class="vt-metrics" style="margin-top:14px">
        <div class="vt-bar is-rep">
          <div class="vt-bar-top"><span>Reputation</span><b>${Math.round(s.reputation)}%</b></div>
          <div class="vt-track"><i style="width:${clamp(s.reputation, 0, 100)}%"></i></div>
          <small>${Math.round(s.reputation)} / 100 · drives walk-ins</small>
        </div>
        <div class="vt-bar is-stock">
          <div class="vt-bar-top"><span>Stock room</span><b>${s.stock}</b></div>
          <div class="vt-track"><i style="width:${clamp((s.stock / 260) * 100, 0, 100)}%"></i></div>
          <small>of 260 units</small>
        </div>
      </div>

      <button class="secondary-button" type="button" data-page="home" style="margin-top:18px">← Back to businesses</button>
    </section>`;
  }

  function editStrip(s, id) {
    const row = (lab, small, btn) => `<div class="ve-row">
      <div class="ve-lab"><b>${lab}</b><small>${small}</small></div>${btn}</div>`;
    return `<div class="ve-panel" style="margin-bottom:12px">
      <div class="ve-head"><span class="ve-dot"></span><b>Edit Mode</b><small>storefront, prices and slots</small></div>
      ${row("Business name", "list and page", `<button type="button" class="ve-val" data-gx="e-name">${esc(V().name(id))}</button>`)}
      ${row("Cover photo", "file or URL", `<button type="button" class="ve-val" data-gx="e-photo">Change photo</button>`)}
      ${row("Money in the till", "store cash", `<button type="button" class="ve-val" data-gx="e-cash">${money(s.cash)}</button>`)}
      ${row("Reputation", "0–100", `<button type="button" class="ve-val" data-gx="e-rep">${Math.round(s.reputation)} / 100</button>`)}
      ${row("Purchase price", "business buy-in", `<button type="button" class="ve-val" data-gx="e-buy">${money(V().buyOf(id))}</button>`)}
    </div>`;
  }

  /* ---------------------------------------------------------
     Actions
     --------------------------------------------------------- */
  function buy(gid) {
    const s = rec();
    const g = byId(s, gid);
    if (!g) return;
    if (g.owned) return toast("You already own that one.");
    const price = finalPrice(g);
    if (price > 0) {
      if (!freePlay()) {
        if (s.cash >= price) s.cash -= price;
        else if (!window.nuLimitsMoney || !window.nuLimitsMoney.transact("expense", price, `Level Up Games: ${g.title}`)) {
          return toast("Not enough cash for that title.", true);
        }
      }
    }
    g.owned = true;
    s.todayUnits = (s.todayUnits || 0) + 1;
    s.todayRevenue = (s.todayRevenue || 0) + price;
    s.reputation = clamp(s.reputation + 0.4, 0, 100);
    V().save();
    render();
    toast(`${g.title} sold and added to the library.`);
  }

  function editAction(act, id, el) {
    const s = rec();
    const ask = (label, current) => {
      const raw = window.prompt(label, current);
      return raw == null ? null : raw;
    };
    const numOf = raw => {
      const n = Math.round(Number(String(raw).replace(/[^\d.-]/g, "")));
      return Number.isFinite(n) ? n : null;
    };
    const g = byId(s, id);

    if (act === "e-name") {
      const v = ask("Business name", V().name("games"));
      if (v == null) return;
      s.editName = String(v).slice(0, 48) || "Level Up Games";
    } else if (act === "e-photo") {
      const url = ask("Image URL (leave empty to upload)", "");
      if (url == null) return;
      if (url.trim()) s.editPhoto = url.trim();
      else return V().pickImage(src => { if (src) { s.editPhoto = src; V().save(); render(); } });
    } else if (act === "e-cash") {
      const n = numOf(ask("Money in the till", Math.round(s.cash)));
      if (n == null) return;
      s.cash = n;
    } else if (act === "e-rep") {
      const n = numOf(ask("Reputation (0–100)", Math.round(s.reputation)));
      if (n == null) return;
      s.reputation = clamp(n, 0, 100);
    } else if (act === "e-buy") {
      const n = numOf(ask("Business purchase price", V().buyOf("games")));
      if (n == null) return;
      s.editBuy = Math.max(0, n);
    } else if (act === "tab") {
      s.tab = el.dataset.p;
    } else if (act === "add-platform") {
      const name = ask("New platform slot", "PlayStation 5");
      if (!name || !name.trim()) return;
      s.platforms.push(name.trim());
      s.tab = name.trim();
    } else if (act === "del-platform") {
      const p = el.dataset.p;
      if (!window.confirm(`Remove the ${p} slot? Games in it stay in the store, just unfiltered.`)) return;
      s.platforms = s.platforms.filter(x => x !== p);
      if (s.tab === p) s.tab = "all";
    } else if (act === "add-game") {
      const title = ask("Game title", "New release");
      if (!title || !title.trim()) return;
      const price = numOf(ask("Price (rand)", 999)) || 0;
      const platform = ask("Platform", s.platforms[0] || "PlayStation") || "PlayStation";
      const id2 = uid();
      const item = { id: id2, title: title.trim(), price, discount: 0, platform: platform.trim(), tag: "Basic game", img: "", owned: false };
      s.games.unshift(item);
      V().save();
      V().pickImage(src => {
        if (src) { item.img = src; V().save(); render(); }
      });
      render();
      toast("Game added — cover image next.");
      return;
    } else if (act === "del") {
      if (!window.confirm(`Delete "${g ? g.title : "this game"}"?`)) return;
      s.games = s.games.filter(x => x.id !== id);
      if (s.featuredId === id) s.featuredId = s.games[0] ? s.games[0].id : null;
    } else if (act === "swap") {
      const url = ask("Cover image URL (leave empty to upload a file)", "");
      if (url == null) return;
      if (url.trim()) { g.img = url.trim(); }
      else return V().pickImage(src => { if (src) { g.img = src; V().save(); render(); } });
    } else if (act === "edit-title") {
      const t = ask("Game title", g.title);
      if (t == null) return;
      g.title = t.trim() || g.title;
    } else if (act === "edit-price") {
      const n = numOf(ask("Price (rand)", g.price));
      if (n == null) return;
      g.price = Math.max(0, n);
    } else if (act === "edit-off") {
      const n = numOf(ask("Discount % (0 = none)", g.discount || 0));
      if (n == null) return;
      g.discount = clamp(n, 0, 95);
    } else if (act === "edit-tag") {
      const t = ask("Label (e.g. Basic game, New release, Deluxe)", g.tag || "Basic game");
      if (t == null) return;
      g.tag = t.trim() || "Basic game";
    } else if (act === "feature") {
      s.featuredId = id;
    } else if (act === "feature-photo") {
      const url = ask("Banner image URL (leave empty to upload)", "");
      const feat = byId(s, s.featuredId);
      if (!feat) return;
      if (url == null) return;
      if (url.trim()) feat.img = url.trim();
      else return V().pickImage(src => { if (src) { feat.img = src; V().save(); render(); } });
    } else if (act === "like") {
      if (g) g.liked = !g.liked;
    }

    V().save();
    render();
    if (window.nuLimitsBusinessesRefresh) window.nuLimitsBusinessesRefresh();
  }

  function render() {
    const dp = document.getElementById("dynamic-page");
    if (!dp || !dp.querySelector(".gx-page")) return;
    const y = window.scrollY;
    dp.innerHTML = page("games");
    window.scrollTo({ top: y });
  }

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-gx]");
    if (!el) return;
    const act = el.dataset.gx;
    if (act === "buy") { e.preventDefault(); e.stopPropagation(); return buy(el.dataset.id); }
    if (!editOn() && ["swap", "del", "edit-title", "edit-price", "edit-off", "edit-tag", "add-game",
      "add-platform", "del-platform", "feature", "feature-photo", "e-name", "e-photo", "e-cash",
      "e-rep", "e-buy"].includes(act)) return;
    e.preventDefault();
    e.stopPropagation();
    return editAction(act, el.dataset.id, el);
  }, true);


  /* keep the storefront in sync when Creator Edit Mode is toggled */
  if (window.nuLimitsEditMode && window.nuLimitsEditMode.onChange) {
    window.nuLimitsEditMode.onChange(() => {
      if (document.querySelector(".gx-page")) render();
    });
  }

  window.nuLimitsGames = { page, render, catalog: () => rec() };
})();
