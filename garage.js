/* ==========================================================
   NU LIMITS — GARAGE & WARDROBE
   Round 7

   Purchases get a home outside the store:
   · Garage   — cars, bikes, jets, yachts, islands, hangars
   · Wardrobe — every piece of clothing, grouped by house

   Both pages are read-only, like My collection: selling and
   paying bills still happens on the Property page.

   Reads: nuLimitsAssets_v1 · nuLimitsShop_v1
   ========================================================== */

(function () {
  "use strict";

  const ASSETS_KEY = "nuLimitsAssets_v1";
  const SHOP_KEY   = "nuLimitsShop_v1";

  const money = n => "R " + Math.round(Number(n) || 0).toLocaleString("en-ZA");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function when(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  }

  /* ---------------------------------------------------------
     Category map (Garage only — mansions stay in My collection)
     --------------------------------------------------------- */
  const CATS = {
    car:    { label: "Car",    plural: "Cars",    order: 1 },
    bike:   { label: "Bike",   plural: "Bikes",   order: 2 },
    jet:    { label: "Jet",    plural: "Jets",    order: 3 },
    yacht:  { label: "Yacht",  plural: "Yachts",  order: 4 },
    island: { label: "Island", plural: "Islands", order: 5 },
    hangar: { label: "Hangar", plural: "Hangars", order: 6 }
  };

  const TABS = [
    { id: "all", label: "All" },
    { id: "car", label: "Cars" },
    { id: "bike", label: "Bikes" },
    { id: "jet", label: "Jets" },
    { id: "yacht", label: "Yachts" },
    { id: "island", label: "Islands" },
    { id: "hangar", label: "Hangars" }
  ];

  let gTab = "all";
  let wHouse = "all";

  /* ---------------------------------------------------------
     Data
     --------------------------------------------------------- */
  function garageItems() {
    const data = readJSON(ASSETS_KEY, null);
    if (!data || !Array.isArray(data.items)) return [];
    return data.items
      .filter(i => i && (i.owned || i.leased) && CATS[i.category] && i.owner !== "partner")
      .sort((a, b) => (CATS[a.category].order - CATS[b.category].order) ||
                      (Number(b.price) || 0) - (Number(a.price) || 0));
  }

  function wardrobeItems() {
    const data = readJSON(SHOP_KEY, null);
    if (!data || !Array.isArray(data.stores)) return [];
    const out = [];
    data.stores.forEach(store => {
      (Array.isArray(store.products) ? store.products : []).forEach(p => {
        if (p && p.owned && p.owner !== "partner") out.push({ store, p });
      });
    });
    return out.sort((a, b) => (Number(b.p.price) || 0) - (Number(a.p.price) || 0));
  }

  const upkeepOf = item => {
    const bills = Array.isArray(item.bills)
      ? item.bills.reduce((t, b) => t + Math.max(0, Math.round(Number(b && b.amount) || 0)), 0)
      : 0;
    return Math.max(0, Math.round(Number(item.tax) || 0)) +
           Math.max(0, Math.round(Number(item.internet) || 0)) + bills;
  };

  /* ---------------------------------------------------------
     Garage markup
     --------------------------------------------------------- */
  function garageCard(item) {
    const cat = CATS[item.category];
    const state = item.owned ? "owned" : "leased";
    const stateLabel = item.owned ? "OWNED" : "LEASED";
    const upkeep = upkeepOf(item);
    const rent = Math.max(0, Math.round(Number(item.lease) || 0));
    const used = item.card ? String(item.card) : "";
    const date = when(item.gameDate || item.acquiredAt);
    const footer = [used, date].filter(Boolean).join(" · ") ||
                   (item.owned ? "In your collection" : "Leased");

    const facts = [
      ["VALUE", money(item.price)],
      item.owned ? ["UPKEEP", money(upkeep) + "/mo"] : ["LEASE", money(rent) + "/mo"],
      ["PRESTIGE", String(item.prestige || 0)],
      ["BILLS", String(Array.isArray(item.bills) ? item.bills.length : 0)]
    ].map(([k, v]) => `<span><b>${esc(k)}</b>${esc(v)}</span>`).join("");

    return `<article class="mn-card" data-id="${esc(item.id)}">
      <div class="mn-photo${item.photo ? "" : " no-photo"}"
           ${item.photo ? `style="background-image:url('${esc(item.photo)}')"` : ""}>
        <div class="mn-top">
          <span class="mn-prestige">PRESTIGE <b>${Number(item.prestige) || 0}</b></span>
          <span class="mn-state ${state}">${stateLabel}</span>
        </div>
        <div class="mn-body">
          <span class="mn-cat-tag">${esc(cat.label.toUpperCase())}</span>
          <h3>${esc(item.name || "Untitled")}</h3>
          <p class="mn-price">${esc(money(item.price))}</p>
          <div class="mn-facts">${facts}</div>
        </div>
      </div>
      <p class="gr-used">${esc(footer)}</p>
    </article>`;
  }

  function garageView() {
    const all = garageItems();
    const list = gTab === "all" ? all : all.filter(i => i.category === gTab);
    const value = all.reduce((t, i) => t + (Number(i.price) || 0), 0);
    const monthly = all.reduce((t, i) => t + (i.owned ? upkeepOf(i) : (Number(i.lease) || 0)), 0);

    return `<section class="dynamic-page-content mn-page gr-page">
      <div class="gr-head">
        <p class="eyebrow">NU LIMITS / GARAGE</p>
        <h1>My garage</h1>
        <p class="muted">Everything with an engine, a hull or a runway — parked in one place.</p>
      </div>

      <div class="gr-stats">
        <span><small>IN THE GARAGE</small><strong>${all.length} asset${all.length === 1 ? "" : "s"}</strong></span>
        <span><small>COLLECTION VALUE</small><strong>${esc(money(value))}</strong></span>
        <span><small>MONTHLY COST</small><strong>${esc(money(monthly))}</strong></span>
      </div>

      <div class="gr-tabs">
        ${TABS.map(t => `<button type="button" data-gtab="${t.id}" class="${gTab === t.id ? "active" : ""}">${t.label}</button>`).join("")}
      </div>

      ${list.length
        ? `<div class="mn-grid">${list.map(garageCard).join("")}</div>`
        : `<div class="gr-empty">
             <strong>${all.length ? "Nothing in this bay" : "The garage is empty"}</strong>
             <p>${all.length
                ? "No cars, bikes, jets, yachts, islands or hangars in this category yet."
                : "Buy a car, bike, jet, yacht, island or hangar and it will be parked here. Mansions live in My collection."}</p>
             <button type="button" data-goto="property">Open My collection →</button>
           </div>`}

      <p class="gr-note">Selling, leasing and paying bills happen in <b>My collection</b> — this page is a showcase.</p>

      <div class="gr-actions">
        <button type="button" class="secondary-button" data-goto="property">My collection</button>
        <button type="button" class="secondary-button" data-page="home">← Back to Home</button>
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------
     Wardrobe markup
     --------------------------------------------------------- */
  function pieceCard(store, p) {
    const used = p.card ? String(p.card) : "";
    const date = when(p.gameDate || p.purchasedAt);
    const footer = [used, date].filter(Boolean).join(" · ");

    return `<article class="sh-item">
      <div class="sh-photo" ${p.photo ? `style="background-image:url('${esc(p.photo)}')"` : ""}>
        <span class="sh-owned">OWNED</span>
        <span class="sh-store-tag">${esc(store.name)}</span>
      </div>
      <div class="sh-item-body">
        <h3 class="sh-name">${esc(p.name)}</h3>
        <p class="sh-price">${esc(money(p.price))}</p>
        <p class="sh-meta">${esc([p.material, p.sizes].filter(Boolean).join(" · ") || "—")}</p>
        ${footer ? `<p class="gr-used inline">${esc(footer)}</p>` : ""}
      </div>
    </article>`;
  }

  function wardrobeView() {
    const all = wardrobeItems();
    const houses = [];
    all.forEach(x => {
      if (!houses.some(h => h.id === x.store.id)) houses.push({ id: x.store.id, name: x.store.name });
    });

    const list = wHouse === "all" ? all : all.filter(x => x.store.id === wHouse);
    const value = all.reduce((t, x) => t + (Number(x.p.price) || 0), 0);

    const groups = [];
    list.forEach(x => {
      let g = groups.find(g => g.id === x.store.id);
      if (!g) { g = { id: x.store.id, name: x.store.name, items: [] }; groups.push(g); }
      g.items.push(x);
    });

    const body = groups.length
      ? groups.map(g => {
          const total = g.items.reduce((t, x) => t + (Number(x.p.price) || 0), 0);
          return `<div class="gr-house" data-house="${esc(g.id)}">
            <div class="gr-house-head">
              <h2>${esc(g.name)}</h2>
              <span>${g.items.length} piece${g.items.length === 1 ? "" : "s"} · ${esc(money(total))}</span>
            </div>
            <div class="sh-grid">${g.items.map(x => pieceCard(x.store, x.p)).join("")}</div>
          </div>`;
        }).join("")
      : `<div class="gr-empty">
           <strong>${all.length ? "Nothing from this house" : "Your wardrobe is empty"}</strong>
           <p>${all.length
              ? "You own pieces, just not from this house yet."
              : "Buy a piece in the Luxury Shop and it will hang here, grouped by house."}</p>
           <button type="button" data-goto="shop">Open the shop →</button>
         </div>`;

    return `<section class="dynamic-page-content sh-page gr-page">
      <div class="gr-head">
        <p class="eyebrow">NU LIMITS / WARDROBE</p>
        <h1>My wardrobe</h1>
        <p class="muted">Every piece you own, sorted by the house that made it.</p>
      </div>

      <div class="gr-stats">
        <span><small>PIECES</small><strong>${all.length}</strong></span>
        <span><small>HOUSES</small><strong>${houses.length}</strong></span>
        <span><small>WARDROBE VALUE</small><strong>${esc(money(value))}</strong></span>
      </div>

      <div class="gr-tabs">
        <button type="button" data-whouse="all" class="${wHouse === "all" ? "active" : ""}">All houses</button>
        ${houses.map(h => `<button type="button" data-whouse="${esc(h.id)}" class="${wHouse === h.id ? "active" : ""}">${esc(h.name)}</button>`).join("")}
      </div>

      ${body}

      <p class="gr-note">Bought with <b>${esc((window.nuLimitsCards && window.nuLimitsCards.label()) || "Debit •4821")}</b> · every purchase records the card that paid.</p>

      <div class="gr-actions">
        <button type="button" class="secondary-button" data-goto="shop">Luxury Shop</button>
        <button type="button" class="secondary-button" data-page="home">← Back to Home</button>
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------
     Render
     --------------------------------------------------------- */
  let current = null;

  function render() {
    const root = document.getElementById("dynamic-page");
    if (!root) return;

    if (current === "garage") root.innerHTML = garageView();
    else if (current === "wardrobe") root.innerHTML = wardrobeView();
    else return;

    const main = document.getElementById("main-content");
    if (main) main.hidden = true;
    root.hidden = false;

    root.querySelectorAll("[data-gtab]").forEach(btn => {
      btn.addEventListener("click", () => { gTab = btn.dataset.gtab; render(); });
    });

    root.querySelectorAll("[data-whouse]").forEach(btn => {
      btn.addEventListener("click", () => { wHouse = btn.dataset.whouse; render(); });
    });

    root.querySelectorAll("[data-goto]").forEach(btn => {
      btn.addEventListener("click", () => window.navigateTo(btn.dataset.goto));
    });

    root.querySelectorAll("[data-page]").forEach(btn => {
      btn.addEventListener("click", () => window.navigateTo(btn.dataset.page));
    });
  }

  /* ---------------------------------------------------------
     Routing — wrap whatever shop.js left behind
     --------------------------------------------------------- */
  const prevNavigate = window.navigateTo;

  window.navigateTo = function (page) {
    if (page === "garage" || page === "wardrobe") {
      current = page;
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));

      if (typeof window.nuLimitsInvestLeave === "function") window.nuLimitsInvestLeave();

      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (current) current = null;
    return prevNavigate.apply(this, arguments);
  };

  /* a purchase made while the page is open should show up */
  document.addEventListener("nuLimitsCardChange", () => {
    if (current === "wardrobe") render();
  });

  window.renderGarage = function (which) {
    current = which === "wardrobe" ? "wardrobe" : "garage";
    render();
  };
})();
