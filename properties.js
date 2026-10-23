/* ==========================================================
   NU LIMITS — EMPIRE ASSETS  (round 5)

   One hub for every purchasable thing:
   mansions · cars · motorbikes · jets · yachts · islands · hangars
   plus "My collection" — everything owned or leased.

   Rules
   • jets need an owned private hangar
   • yachts need an owned private island
   • creator edit mode (Home > Settings) edits every category

   Saves: nuLimitsAssets_v1
   Migrates the round-4 nuLimitsMansions_v1 catalogue on first run.
   ========================================================== */

(function () {
  "use strict";

  const CARS = () => window.nuLimitsCars || null;

  const KEY = "nuLimitsAssets_v1";
  const LEGACY_KEY = "nuLimitsMansions_v1";
  const PHOTO_SIZE = 736;
  const SELL_BACK = 0.8;

  /* ---------------------------------------------------------
     Formatting helpers
     --------------------------------------------------------- */
  const money = n => "R " + Math.round(Number(n) || 0).toLocaleString("en-ZA");
  const perMonth = n => money(n) + "/mo";
  const uid = () => "as_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function toast(msg) {
    let el = document.querySelector(".mn-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "mn-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(el.__t);
    el.__t = setTimeout(() => el.classList.remove("show"), 2600);
  }

  const ICON_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6"/><path d="M10 11v6M14 11v6"/></svg>';
  const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>';

  /* ---------------------------------------------------------
     Categories
     --------------------------------------------------------- */
  const CATS = {
    mansion: {
      label: "Mansions",
      blurb: "Mansions, penthouses and estates. Every address is a statement.",
      noun: "mansion",
      shape: "square",
      lease: true,
      showTax: true,
      showInternet: true,
      specs: []
    },
    car: {
      label: "Cars",
      blurb: "Speed, presence, and a garage to match.",
      noun: "car",
      shape: "wide",
      lease: true,
      specs: [
        { k: "zero", label: "0–100 KM/H", unit: "s", def: 4.2, step: 0.1 },
        { k: "power", label: "POWER", unit: "hp", def: 450, step: 5 },
        { k: "top", label: "TOP SPEED", unit: "km/h", def: 260, step: 5 },
        { k: "year", label: "YEAR", unit: "", def: 2023 }
      ]
    },
    bike: {
      label: "Motorbikes",
      blurb: "Two wheels. No limits.",
      noun: "motorbike",
      shape: "wide",
      lease: true,
      specs: [
        { k: "zero", label: "0–100 KM/H", unit: "s", def: 3.4, step: 0.1 },
        { k: "power", label: "POWER", unit: "hp", def: 180, step: 5 },
        { k: "top", label: "TOP SPEED", unit: "km/h", def: 280, step: 5 },
        { k: "year", label: "YEAR", unit: "", def: 2023 }
      ]
    },
    jet: {
      label: "Private jets",
      blurb: "Cross continents on your own schedule.",
      noun: "jet",
      shape: "wide",
      lease: true,
      requires: { cat: "hangar", label: "a private hangar" },
      specs: [
        { k: "range", label: "RANGE", unit: "km", def: 3200, step: 50 },
        { k: "cruise", label: "CRUISE", unit: "km/h", def: 780, step: 10 },
        { k: "seats", label: "SEATS", unit: "", def: 8 },
        { k: "year", label: "YEAR", unit: "", def: 2022 }
      ]
    },
    yacht: {
      label: "Yachts",
      blurb: "The ocean, without the crowds.",
      noun: "yacht",
      shape: "wide",
      lease: true,
      requires: { cat: "island", label: "a private island" },
      specs: [
        { k: "length", label: "LENGTH", unit: "m", def: 27, step: 0.5 },
        { k: "guests", label: "GUESTS", unit: "", def: 10 },
        { k: "crew", label: "CREW", unit: "", def: 4 },
        { k: "range", label: "RANGE", unit: "nm", def: 1800, step: 50 }
      ]
    },
    island: {
      label: "Islands",
      blurb: "Your own piece of the map.",
      noun: "island",
      shape: "square",
      lease: false,
      showTax: true,
      showInternet: false,
      specs: [
        { k: "area", label: "AREA", unit: "km²", def: 0.4, step: 0.01 },
        { k: "beaches", label: "BEACHES", unit: "", def: 2 },
        { k: "distance", label: "TO MAINLAND", unit: "km", def: 12 },
        { k: "villas", label: "VILLAS", unit: "", def: 1 }
      ]
    },
    hangar: {
      label: "Hangars",
      blurb: "Keep the fleet close — owning one unlocks private jets.",
      noun: "hangar",
      shape: "wide",
      lease: true,
      showTax: true,
      showInternet: false,
      specs: [
        { k: "capacity", label: "JET CAPACITY", unit: "", def: 2 },
        { k: "area", label: "FLOOR AREA", unit: "m²", def: 1200, step: 10 },
        { k: "year", label: "BUILT", unit: "", def: 2019 }
      ]
    }
  };

  const CAT_ORDER = ["mansion", "car", "bike", "jet", "yacht", "island", "hangar"];

  /* ---------------------------------------------------------
     Starter catalogue
     --------------------------------------------------------- */
  const SEED = {
    mansion: [
      { name: "Palm Ridge Villa", photo: "images/mansions/mansion-02.jpg", price: 48000, lease: 900, tax: 480, prestige: 34, internet: 320,
        bills: [{ label: "Power", amount: 620 }, { label: "Water", amount: 180 }, { label: "Garden", amount: 240 }], specs: {} },
      { name: "Bel Air Estate", photo: "images/mansions/mansion-01.jpg", price: 120000, lease: 2200, tax: 1350, prestige: 62, internet: 650,
        bills: [{ label: "Power", amount: 1100 }, { label: "Water", amount: 340 }, { label: "Security", amount: 890 }], specs: {} },
      { name: "Skyline Penthouse", photo: "images/mansions/mansion-03.jpg", price: 250000, lease: 4800, tax: 2900, prestige: 88, internet: 1200,
        bills: [{ label: "Power", amount: 1900 }, { label: "Water", amount: 480 }, { label: "Concierge", amount: 2400 }], specs: {} }
    ],
    car: [
      { name: "S 500 4MATIC", photo: "images/cars/mb.jpg", price: 2150000, lease: 32500, prestige: 78,
        bills: [{ label: "Insurance", amount: 8600 }, { label: "Maintenance", amount: 2400 }, { label: "Fuel", amount: 2800 }],
        specs: { zero: 4.9, power: 435, top: 250, year: 2024 } },
      { name: "A6 45 TFSI", photo: "images/cars/audi.jpg", price: 1095000, lease: 16400, prestige: 60,
        bills: [{ label: "Insurance", amount: 4400 }, { label: "Maintenance", amount: 1600 }, { label: "Fuel", amount: 2200 }],
        specs: { zero: 6.2, power: 245, top: 250, year: 2023 } },
      { name: "X3 xDrive20d", photo: "images/cars/bmw.jpg", price: 985000, lease: 14800, prestige: 56,
        bills: [{ label: "Insurance", amount: 3900 }, { label: "Maintenance", amount: 1500 }, { label: "Fuel", amount: 2000 }],
        specs: { zero: 7.6, power: 197, top: 213, year: 2023 } }
    ],
    bike: [
      { name: "Crimson RR", photo: "images/assets/bike-01.jpg", price: 96000, lease: 1600, prestige: 33,
        bills: [{ label: "Insurance", amount: 780 }, { label: "Maintenance", amount: 320 }],
        specs: { zero: 2.9, power: 214, top: 299, year: 2024 } },
      { name: "Blackline Cafe", photo: "images/assets/bike-02.jpg", price: 42000, lease: 780, prestige: 21,
        bills: [{ label: "Insurance", amount: 420 }],
        specs: { zero: 4.6, power: 68, top: 180, year: 2021 } }
    ],
    jet: [
      { name: "Citation Venture", photo: "images/assets/jet-01.jpg", price: 1450000, lease: 12500, prestige: 78,
        bills: [{ label: "Crew", amount: 8400 }, { label: "Fuel", amount: 6200 }, { label: "Parking", amount: 2500 }],
        specs: { range: 3200, cruise: 780, seats: 8, year: 2022 } },
      { name: "Apex 650", photo: "images/assets/jet-02.jpg", price: 8900000, lease: 62000, prestige: 96,
        bills: [{ label: "Crew", amount: 24000 }, { label: "Fuel", amount: 18000 }, { label: "Parking", amount: 6500 }],
        specs: { range: 12500, cruise: 900, seats: 16, year: 2024 } }
    ],
    yacht: [
      { name: "Azure 88", photo: "images/assets/yacht-01.jpg", price: 980000, lease: 8500, prestige: 69,
        bills: [{ label: "Crew", amount: 12000 }, { label: "Marina", amount: 4500 }, { label: "Maintenance", amount: 3200 }],
        specs: { length: 27, guests: 10, crew: 4, range: 1800 } },
      { name: "Marina Grand", photo: "images/assets/yacht-02.jpg", price: 6400000, lease: 44000, prestige: 94,
        bills: [{ label: "Crew", amount: 38000 }, { label: "Marina", amount: 11000 }, { label: "Maintenance", amount: 9500 }],
        specs: { length: 52, guests: 18, crew: 11, range: 4500 } }
    ],
    island: [
      { name: "Palm Atoll", photo: "images/assets/island-01.jpg", price: 260000, prestige: 74, tax: 1800,
        bills: [{ label: "Maintenance", amount: 6400 }, { label: "Security", amount: 3500 }],
        specs: { area: 0.42, beaches: 3, distance: 12, villas: 1 } }
    ],
    hangar: [
      { name: "Apron One Hangar", photo: "images/assets/hangar-01.jpg", price: 180000, lease: 1900, tax: 900, prestige: 40,
        bills: [{ label: "Power", amount: 900 }, { label: "Security", amount: 600 }],
        specs: { capacity: 2, area: 1200, year: 2019 } }
    ]
  };

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  function normalize(m) {
    const out = Object.assign({
      id: uid(),
      category: "mansion",
      name: "New slot",
      photo: "",
      price: 0,
      lease: 0,
      tax: 0,
      internet: 0,
      prestige: 0,
      bills: [],
      specs: {},
      owned: false,
      leased: false,
      acquiredAt: null,
      lastBillsAt: null
    }, m || {});

    if (!CATS[out.category]) out.category = "mansion";
    out.brand = String(out.brand || "");
    out.price = Math.max(0, Number(out.price) || 0);
    out.lease = Math.max(0, Number(out.lease) || 0);
    out.tax = Math.max(0, Number(out.tax) || 0);
    out.internet = Math.max(0, Number(out.internet) || 0);
    out.prestige = Math.min(100, Math.max(0, Math.round(Number(out.prestige) || 0)));
    out.bills = (Array.isArray(out.bills) ? out.bills : []).map(b => ({
      label: String(b && b.label ? b.label : "Bill").slice(0, 18),
      amount: Math.max(0, Number(b && b.amount) || 0)
    }));
    out.specs = (out.specs && typeof out.specs === "object") ? out.specs : {};
    out.owned = !!out.owned;
    out.leased = !!out.leased;
    return out;
  }

  function seedCategory(cat) {
    return (SEED[cat] || []).map(x => normalize(Object.assign({}, x, { id: uid(), category: cat })));
  }

  function persist(next) {
    const data = next || state;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      toast("Couldn't save — a photo may be too large. Try a smaller image.");
      return false;
    }
  }

  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { saved = null; }

    if (saved && Array.isArray(saved.items)) {
      saved.version = 2;
      saved.editMode = !!saved.editMode;
      saved.items = saved.items.map(normalize);

      const LEGACY = {
        "Obsidian GT": "S 500 4MATIC",
        "Silverline Executive": "A6 45 TFSI",
        "Dune Rover": "X3 xDrive20d"
      };
      saved.items.forEach(i => {
        if (i.category === "car" && LEGACY[i.name]) i.name = LEGACY[i.name];
      });

      const C = CARS();
      if (C) {
        /* old saves: give every car a make, then make sure no make is empty */
        let assigned = false;
        const makes = C.brands();
        let n = 0;
        saved.items.forEach(i => {
          if (i.category !== "car" || i.brand) return;
          i.brand = makes[n++ % makes.length].id;
          assigned = true;
        });
        if (C.topUp(saved.items, normalize)) assigned = true;
        if (assigned) persist(saved);
      }

      return saved;
    }

    /* first run of r5 — import the round-4 mansion catalogue */
    let legacy = null;
    try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null"); } catch { legacy = null; }

    const items = [];

    if (legacy && Array.isArray(legacy.mansions) && legacy.mansions.length) {
      legacy.mansions.forEach(m => items.push(normalize(Object.assign({}, m, { category: "mansion" }))));
    } else {
      items.push(...seedCategory("mansion"));
    }

    CAT_ORDER.filter(c => c !== "mansion").forEach(c => items.push(...seedCategory(c)));

    const C0 = CARS();
    if (C0) {
      const makes = C0.brands();
      let n = 0;
      items.forEach(i => {
        if (i.category !== "car" || i.brand) return;
        i.brand = makes[n++ % makes.length].id;
      });
      C0.topUp(items, normalize);
    }

    const fresh = { version: 2, editMode: !!(legacy && legacy.editMode), items };
    persist(fresh);
    return fresh;
  }

  let state = load();
  let activeCat = "mansion";
  let carBrand = null;          /* which make is open, null = the showroom */
  let editingId = null;

  /* ---------------------------------------------------------
     Derived
     --------------------------------------------------------- */
  const catOf = item => CATS[item.category] || CATS.mansion;
  const upkeep = m => (m.tax || 0) + (m.internet || 0) + m.bills.reduce((t, b) => t + (b.amount || 0), 0);
  const balance = () => (window.nuLimitsMoney && window.nuLimitsMoney.getBalance)
    ? window.nuLimitsMoney.getBalance() : 0;
  const free = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());

  /* round 13 — anything bought for her is hers, not yours */
  const isHers = i => i && i.owner === "partner";
  const hasOwned = cat => state.items.some(i => i.category === cat && i.owned && !isHers(i));
  const ownedItems = () => state.items.filter(i => (i.owned || i.leased) && !isHers(i));
  const herItems = () => state.items.filter(i => i.owned && isHers(i));
  const herLabel = () => (window.nuLimitsFamily && window.nuLimitsFamily.partnerLabel)
    ? window.nuLimitsFamily.partnerLabel() : "Her";

  const isLocked = item => {
    const cat = catOf(item);
    return !!(cat.requires && !hasOwned(cat.requires.cat));
  };

  function fmtSpec(v, s) {
    if (v === "" || v == null || isNaN(Number(v))) return "—";
    const n = Number(v);
    const text = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
    return text + (s.unit ? " " + s.unit : "");
  }

  function factsHTML(m) {
    const cat = catOf(m);
    const rows = [];
    if (cat.showTax) rows.push(["TAX", perMonth(m.tax)]);
    if (cat.showInternet) rows.push(["INTERNET", perMonth(m.internet)]);
    (cat.specs || []).forEach(s => {
      if (rows.length < 4) rows.push([s.label, fmtSpec(m.specs[s.k], s)]);
    });
    m.bills.forEach(b => {
      if (rows.length < 4) rows.push([(b.label || "BILL").toUpperCase(), perMonth(b.amount)]);
    });
    return rows.slice(0, 4)
      .map(([k, v]) => `<span><b>${esc(k)}</b>${esc(v)}</span>`).join("");
  }

  /* ---------------------------------------------------------
     Cards
     --------------------------------------------------------- */
  function cardHTML(m, ctx) {
    const cat = catOf(m);
    const edit = state.editMode;
    const locked = !edit && isLocked(m);
    const inCollection = ctx === "collection";

    let stateLabel = m.owned ? "OWNED" : m.leased ? "LEASED" : "FOR SALE";
    let stateClass = m.owned ? "owned" : m.leased ? "leased" : "";
    if (locked) { stateLabel = "LOCKED"; stateClass = "locked"; }

    let actions;
    if (ctx === "partner") {
      const canSell = !!(window.nuLimitsFamily && window.nuLimitsFamily.partner && window.nuLimitsFamily.partner());
      actions = `<div class="mn-actions single">
        <button class="mn-btn soft" data-act="resell-her" data-id="${esc(m.id)}"
          ${canSell ? "" : "disabled"}>${canSell ? `Resell · ${esc(money(Math.round((m.price || 0) * 0.6)))}` : "Cannot resell after divorce"}</button>
      </div>`;
      stateLabel = "HERS";
      stateClass = "leased";
    } else if (edit) {
      /* edit mode still lets you operate the asset — free play is for testing */
      const row = [];
      if (m.owned) {
        row.push(`<button class="mn-btn soft" data-act="sell">Sell</button>`);
      } else if (m.leased) {
        row.push(`<button class="mn-btn" data-act="buy">Buy · ${esc(money(m.price))}</button>`);
        row.push(`<button class="mn-btn soft" data-act="unlease">End lease</button>`);
      } else {
        row.push(`<button class="mn-btn" data-act="buy">Buy · ${esc(money(m.price))}</button>`);
        if (cat.lease) row.push(`<button class="mn-btn" data-act="lease">Lease · ${esc(money(m.lease))}</button>`);
      }
      row.push(`<button class="mn-btn soft" data-act="edit">Edit details</button>`);
      actions = `<div class="mn-actions">${row.join("")}</div>`;
    } else if (locked) {
      actions = `<div class="mn-actions single">
        <button class="mn-btn soft" data-act="go" data-cat="${cat.requires.cat}">
          Unlock with ${esc(cat.requires.label)} →
        </button>
      </div>`;
    } else if (m.owned) {
      actions = `<div class="mn-actions single">
        <button class="mn-btn soft" data-act="sell">Sell</button>
      </div>`;
    } else if (m.leased) {
      actions = `<div class="mn-actions">
        <button class="mn-btn" data-act="buy">Buy · ${esc(money(m.price))}</button>
        <button class="mn-btn soft" data-act="unlease">End lease</button>
      </div>`;
    } else if (cat.lease) {
      actions = `<div class="mn-actions">
        <button class="mn-btn" data-act="buy">Buy · ${esc(money(m.price))}</button>
        <button class="mn-btn" data-act="lease">Lease · ${esc(money(m.lease))}</button>
      </div>`;
    } else {
      actions = `<div class="mn-actions single">
        <button class="mn-btn" data-act="buy">Buy · ${esc(money(m.price))}</button>
      </div>`;
    }

    const tools = edit ? `<div class="mn-tools">
        <button data-act="edit" aria-label="Edit ${esc(m.name)}" title="Edit">${ICON_EDIT}</button>
        <button data-act="delete" aria-label="Delete ${esc(m.name)}" title="Delete">${ICON_TRASH}</button>
      </div>` : "";

    const photoBtn = (edit && !m.photo)
      ? `<button class="mn-photo-btn" data-act="photo">+ ADD PHOTO</button>` : "";

    return `<article class="mn-card ${cat.shape === "wide" ? "wide" : ""} ${locked ? "locked" : ""} ${edit ? "editing" : ""}"
                     data-id="${esc(m.id)}">
      <div class="mn-photo${m.photo ? "" : " no-photo"}"
           ${m.photo ? `style="background-image:url('${esc(m.photo)}')"` : ""}>
        <div class="mn-top">
          <span class="mn-prestige">PRESTIGE <b>${m.prestige}</b></span>
          <span class="mn-state ${stateClass}">${stateLabel}</span>
        </div>
        ${photoBtn}
        ${tools}
        <div class="mn-body">
          ${inCollection ? `<span class="mn-cat-tag">${esc(cat.label.toUpperCase())}</span>` : ""}
          <h3>${esc(m.name || "Untitled")}</h3>
          <p class="mn-price">${esc(money(m.price))}</p>
          <div class="mn-facts">${factsHTML(m)}</div>
        </div>
      </div>
      ${actions}
    </article>`;
  }

  /* ---------------------------------------------------------
     Page
     --------------------------------------------------------- */
  const isCollection = () => activeCat === "collection";

  /* ---------------------------------------------------------
     Cars: the showroom, and one page per make
     --------------------------------------------------------- */
  const carsOfMake = id => state.items.filter(i => i.category === "car" && i.brand === id);

  function brandGridHTML() {
    const C = CARS();
    if (!C) return "";
    const edit = state.editMode;

    const tiles = C.brands().map(b => {
      const n = carsOfMake(b.id).length;
      return `<div class="mn-brand-wrap">
        <button class="mn-brand" type="button" data-brand="${esc(b.id)}">
          <img src="${esc(b.photo)}" alt="" loading="lazy">
          <span class="mn-brand-veil"></span>
          <b>${esc(b.name)}</b>
          <small>${n} model${n === 1 ? "" : "s"}</small>
          <i class="mn-brand-arrow" aria-hidden="true">→</i>
        </button>
        ${edit ? `<div class="mn-brand-tools">
          <button type="button" data-act="brand-photo" data-brand="${esc(b.id)}" aria-label="Change photo">PHOTO</button>
          <button type="button" data-act="brand-edit" data-brand="${esc(b.id)}" aria-label="Rename">${ICON_EDIT}</button>
          <button type="button" data-act="brand-del" data-brand="${esc(b.id)}" aria-label="Delete">${ICON_TRASH}</button>
        </div>` : ""}
      </div>`;
    }).join("");

    const add = edit ? `<button class="mn-brand mn-brand-add" type="button" data-act="brand-add">
      <span>+</span><b>Add make</b><small>square tile</small>
    </button>` : "";

    return `<div class="mn-brands">${tiles}${add}</div>`;
  }

  function brandHeroHTML(b) {
    const n = carsOfMake(b.id).length;
    return `<div class="mn-hero">
      <div class="mn-hero-art" style="background-image:url('${esc(b.photo)}')"></div>
      <div class="mn-hero-fade"></div>
      <div class="mn-hero-body">
        <p class="eyebrow">MARQUE · ${n} MODEL${n === 1 ? "" : "S"}</p>
        <h1>${esc(b.name)}</h1>
        <p>${esc(b.about || "Every model from this make, in one room.")}</p>
      </div>
      <button class="mn-hero-back" type="button" data-act="brands">← All makes</button>
    </div>`;
  }

  function pageHTML() {
    const collection = isCollection();
    const partnerView = activeCat === "partner";
    const isCars = activeCat === "car";
    const cat = (collection || partnerView) ? null : CATS[activeCat];

    const C = CARS();
    const brand = (isCars && !collection && !partnerView && carBrand && C) ? C.byId(carBrand) : null;
    const showroom = isCars && !collection && !partnerView && !brand;

    const list = partnerView
      ? herItems()
      : collection
        ? ownedItems()
        : brand
          ? carsOfMake(brand.id)
          : state.items.filter(i => i.category === activeCat);

    const owned = state.items.filter(i => i.owned && !isHers(i));
    const ownedValue = owned.reduce((t, i) => t + i.price, 0);
    const monthly = owned.reduce((t, i) => t + upkeep(i), 0);

    let gate = "";
    if (!collection && !partnerView && cat.requires) {
      const met = hasOwned(cat.requires.cat);
      gate = met
        ? `<div class="mn-gate ok">${ICON_LOCK}<span>Unlocked — you own ${esc(cat.requires.label)}.</span></div>`
        : `<div class="mn-gate">${ICON_LOCK}<span>${esc(cat.label)} require ${esc(cat.requires.label)}.</span>
             <button data-act="go" data-cat="${cat.requires.cat}">View ${esc(CATS[cat.requires.cat].label)}</button></div>`;
    }

    const chips = CAT_ORDER.map(c => {
      const n = state.items.filter(i => i.category === c && i.owned).length;
      return `<button data-cat="${c}" class="${activeCat === c ? "active" : ""}">
        ${esc(CATS[c].label)}${n ? `<b>${n}</b>` : ""}
      </button>`;
    }).join("") +
      `<button data-cat="collection" class="${collection ? "active" : ""}">
        My collection${ownedItems().length ? `<b>${ownedItems().length}</b>` : ""}
      </button>` +
      (herItems().length
        ? `<button data-cat="partner" class="${activeCat === "partner" ? "active" : ""}">
             ${herLabel()}'s${herItems().length ? `<b>${herItems().length}</b>` : ""}
           </button>`
        : "");

    const emptyCollection = collection && !list.length;

    const heading = partnerView
      ? `${esc(herLabel())}'s possessions`
      : collection
        ? "My collection"
        : brand
          ? brand.name
          : esc(cat.label);

    const sub = partnerView
      ? `Everything bought for ${esc((window.nuLimitsFamily && window.nuLimitsFamily.partner && window.nuLimitsFamily.partner()) ? window.nuLimitsFamily.partner().name : "her")} — under her name, not yours.`
      : collection
        ? "Everything you own or lease — houses, cars, jets, yachts, islands and hangars."
        : brand
          ? esc(brand.about || "Every model from this make, in one room.")
          : showroom
            ? `Pick a marque. ${state.items.filter(i => i.category === "car").length} models across ${(C ? C.brands().length : 0)} makes.`
            : esc(cat.blurb) + (list.length ? ` · ${list.length} listing${list.length === 1 ? "" : "s"}` : "");

    const grid = `<div class="mn-grid">
      ${list.map(m => cardHTML(m, partnerView ? "partner" : collection ? "collection" : "category")).join("")}
      ${state.editMode && !collection && !partnerView ? `<button class="mn-add" data-act="add">
          <span class="plus">+</span>
          <strong>Add ${esc(cat.noun)} slot</strong>
          <small>${cat.shape === "wide" ? "4 : 3" : "736 × 736"}</small>
        </button>` : ""}
    </div>`;

    return `<section class="dynamic-page-content mn-page">
      ${brand ? brandHeroHTML(brand) : ""}

      ${brand ? "" : `<div class="mn-head">
        <div>
          <p class="eyebrow">NU LIMITS / ${showroom ? "MOTOR SHOWROOM" : "EMPIRE ASSETS"}</p>
          <h1>${heading}</h1>
          <p class="muted">${sub}</p>
        </div>
      </div>`}

      ${state.editMode ? `<div class="mn-editbar"><i></i> EDIT MODE · ${collection ? "COLLECTION" : showroom ? "SHOWROOM" : esc(cat.label.toUpperCase())}
        <button data-act="exit-edit">Done</button></div>` : ""}

      <div class="mn-portfolio">
        ${partnerView ? `
          <span><small>HERS</small><strong>${herItems().length}</strong></span>
          <span><small>VALUE</small><strong>${esc(money(herItems().reduce((t, i) => t + i.price, 0)))}</strong></span>
          <span><small>MONTHLY UPKEEP</small><strong>${esc(money(herItems().reduce((t, i) => t + upkeep(i), 0)))}</strong></span>
        ` : `
          <span><small>OWNED</small><strong>${owned.length} / ${state.items.length}</strong></span>
          <span><small>PORTFOLIO VALUE</small><strong>${esc(money(ownedValue))}</strong></span>
          <span><small>MONTHLY UPKEEP</small><strong>${esc(money(monthly))}</strong></span>
        `}
      </div>

      <div class="mn-cats">${chips}</div>

      ${gate}

      ${emptyCollection ? `<div class="mn-collection-empty">
          <strong>Nothing here yet</strong>
          <p>Buy or lease something and it lands here automatically — mansions, cars, jets, yachts, islands and hangars.</p>
          <button data-act="go" data-cat="mansion">Browse mansions</button>
        </div>` : ""}

      ${showroom ? brandGridHTML() : grid}

      ${showroom ? `<p class="mn-brand-hint">Open a make to see its models — every card inside is the same size as the rest of your empire.</p>` : ""}

      ${!collection && !partnerView && !showroom && !list.length && !state.editMode
        ? `<p class="mn-empty">No ${esc(cat.noun)}s listed yet.</p>` : ""}

      <button class="secondary-button" type="button" data-page="home" style="margin-top:22px">← Back to Home</button>
    </section>`;
  }

  function render() {
    const root = document.getElementById("dynamic-page");
    if (!root) return;
    root.innerHTML = pageHTML();
    const back = root.querySelector("[data-page]");
    if (back) back.addEventListener("click", () => (window.nuLimitsBack ? window.nuLimitsBack() : navigateTo("home")));

    /* centre the active category chip in the horizontal rail */
    const rail = root.querySelector(".mn-cats");
    const chip = rail && rail.querySelector("button.active");
    if (rail && chip) {
      const target = chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2;
      rail.scrollLeft = Math.max(0, target);
    }
  }

  window.renderProperties = render;

  /* ---------------------------------------------------------
     Actions
     --------------------------------------------------------- */
  function find(id) { return state.items.find(x => x.id === id); }

  function blocked(item) {
    const cat = catOf(item);
    if (!cat.requires) return false;
    if (hasOwned(cat.requires.cat)) return false;
    toast(`${cat.label} require ${cat.requires.label}.`);
    return true;
  }

  function buy(id) {
    const m = find(id);
    if (!m || m.owned || blocked(m)) return;
    if (!free() && !window.nuLimitsCanPay(m.price)) {
      const have = window.nuLimitsSpendable ? window.nuLimitsSpendable() : balance();
      return toast(`Not enough funds — you're ${money(m.price - have)} short.`);
    }
    if (!window.nuLimitsMoney ||
        !window.nuLimitsMoney.transact("expense", m.price, `Purchase: ${m.name}`)) {
      return toast("Purchase failed — check your balance.");
    }
    m.owned = true;
    m.leased = false;

    const fam = window.nuLimitsFamily;
    if (fam && fam.giftMode && fam.giftMode() && fam.partner && fam.partner()) {
      m.owner = "partner";
      m.ownerName = fam.partner().name;
    } else {
      m.owner = null;
    }
    m.acquiredAt = new Date().toISOString();
    m.card = (window.nuLimitsCards && window.nuLimitsCards.label())
      ? window.nuLimitsCards.label() : "Debit •4821";
    m.gameDate = (window.nuLimitsWorld && window.nuLimitsWorld.date)
      ? window.nuLimitsWorld.date.toISOString() : null;
    persist();
    render();
    toast(`Bought ${m.name} for ${money(m.price)}`);
  }

  function sell(id) {
    const m = find(id);
    if (!m || !m.owned) return;
    const refund = Math.round(m.price * SELL_BACK);
    if (!window.nuLimitsMoney ||
        !window.nuLimitsMoney.transact("income", refund, `Sold: ${m.name}`)) {
      return toast("Sale failed.");
    }
    m.owned = false;
    m.acquiredAt = null;
    persist();
    render();
    toast(`Sold ${m.name} · ${money(refund)} back in your account`);
  }

  function lease(id) {
    const m = find(id);
    if (!m || m.owned || !catOf(m).lease || blocked(m)) return;
    if (!free() && !window.nuLimitsCanPay(m.lease)) {
      const have = window.nuLimitsSpendable ? window.nuLimitsSpendable() : balance();
      return toast(`Not enough funds for the first month — ${money(m.lease - have)} short.`);
    }
    if (!window.nuLimitsMoney ||
        !window.nuLimitsMoney.transact("expense", m.lease, `Lease: ${m.name}`)) {
      return toast("Lease failed — check your balance.");
    }
    m.leased = true;

    const famL = window.nuLimitsFamily;
    if (famL && famL.giftMode && famL.giftMode() && famL.partner && famL.partner()) {
      m.owner = "partner";
      m.ownerName = famL.partner().name;
    }
    m.acquiredAt = new Date().toISOString();
    m.card = (window.nuLimitsCards && window.nuLimitsCards.label())
      ? window.nuLimitsCards.label() : "Debit •4821";
    m.gameDate = (window.nuLimitsWorld && window.nuLimitsWorld.date)
      ? window.nuLimitsWorld.date.toISOString() : null;
    persist();
    render();
    toast(`Leased ${m.name} · first month ${money(m.lease)}`);
  }

  function unlease(id) {
    const m = find(id);
    if (!m) return;
    m.leased = false;
    persist();
    render();
    toast("Lease ended");
  }

  /* ---------------------------------------------------------
     Cars: makes and engines
     --------------------------------------------------------- */
  const carsApi = () => window.nuLimitsCars || null;

  function toggleEngine(id) {
    const C = carsApi();
    if (!C) return;
    const res = C.toggle(id);
    if (!res.ok) return toast(res.why || "Could not start the engine.");
    render();
    if (res.running) {
      toast(res.recorded ? "Engine running — recorded clip." : "Engine running — synthesised idle.");
    }
  }

  function uploadEngine(id) {
    const C = carsApi();
    if (!C) return;
    C.uploadSound(id, res => {
      if (!res.ok) return toast(res.why || "That sound could not be saved.");
      toast("Engine sound saved to this car.");
      render();
    });
  }

  function addMake() {
    const C = carsApi();
    if (!C) return;
    const name = window.prompt("Name the new make", "New make");
    if (!name || !name.trim()) return;
    const b = C.addBrand(name.trim());
    carBrand = b.id;
    render();
    toast(`${b.name} added. Add its first model below.`);
  }

  function editMake(id) {
    const C = carsApi();
    if (!C) return;
    const b = C.byId(id);
    if (!b) return;
    const name = window.prompt("Make name", b.name);
    if (name == null) return;
    const about = window.prompt("One line about this make (optional)", b.about || "");
    if (about == null) return;
    C.editBrand(id, { name: name.trim() || b.name, about });
    render();
    toast("Make updated.");
  }

  function photoMake(id) {
    const C = carsApi();
    if (!C) return;
    C.pickPhoto(dataUrl => {
      if (!dataUrl) return toast("That image could not be read.");
      C.editBrand(id, { photo: dataUrl });
      render();
      toast("Cover photo updated.");
    });
  }

  function deleteMake(id) {
    const C = carsApi();
    if (!C) return;
    const b = C.byId(id);
    if (!b) return;
    const models = carsOfMake(id);
    const msg = models.length
      ? `Delete ${b.name} and its ${models.length} model${models.length === 1 ? "" : "s"}? This cannot be undone.`
      : `Delete ${b.name}?`;
    if (!window.confirm(msg)) return;
    if (models.length) {
      state.items = state.items.filter(i => !(i.category === "car" && i.brand === id));
      persist();
    }
    C.removeBrand(id);
    if (carBrand === id) carBrand = null;
    render();
    toast(`${b.name} removed.`);
  }

  function addSlot() {
    const cat = CATS[activeCat];
    const specs = {};
    (cat.specs || []).forEach(s => { specs[s.k] = s.def; });
    const item = normalize({
      id: uid(),
      category: activeCat,
      brand: activeCat === "car" ? (carBrand || "") : "",
      name: "New " + cat.noun,
      price: 0,
      lease: 0,
      prestige: 50,
      specs
    });
    state.items.push(item);
    persist();
    render();
    openEditor(item.id);
  }

  function removeItem(id) {
    const m = find(id);
    if (!m) return;
    if (!window.confirm(`Delete "${m.name || "this slot"}"? This cannot be undone.`)) return;
    state.items = state.items.filter(x => x.id !== id);
    persist();
    render();
    toast("Deleted");
  }

  /* ---------------------------------------------------------
     Photo — always 736 x 736
     --------------------------------------------------------- */
  function processPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error("Not an image"));
      if (file.size > 24 * 1024 * 1024) return reject(new Error("Too large"));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const S = PHOTO_SIZE;
          const c = document.createElement("canvas");
          c.width = c.height = S;
          const ctx = c.getContext("2d");
          const scale = Math.max(S / img.width, S / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
          resolve(c.toDataURL("image/jpeg", 0.74));
        } catch (err) {
          reject(err);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unreadable image")); };
      img.src = url;
    });
  }

  /* ---------------------------------------------------------
     Editor
     --------------------------------------------------------- */
  function billRows(bills) {
    const list = (bills && bills.length) ? bills : [{ label: "Power", amount: 0 }, { label: "Water", amount: 0 }];
    return list.map(b => `<div class="mn-bill-row">
      <input type="text" data-bill-label maxlength="18" placeholder="Power" value="${esc(b.label || "")}">
      <input type="number" data-bill-amount min="0" step="10" placeholder="0" value="${Number(b.amount) || 0}">
      <button type="button" data-act="remove-bill" aria-label="Remove bill">×</button>
    </div>`).join("");
  }

  function openEditor(id) {
    editingId = id;
    const m = find(id);
    if (!m) return;
    const cat = catOf(m);

    document.querySelector(".mn-modal")?.remove();

    const specFields = (cat.specs || []).map(s => `
      <div class="mn-field">
        <label>${esc(s.label)}${s.unit ? " (" + esc(s.unit) + ")" : ""}</label>
        <input type="number" data-spec="${s.k}" min="0" step="${s.step || 1}"
               value="${Number(m.specs[s.k]) || 0}">
      </div>`).join("");

    const modal = document.createElement("div");
    modal.className = "mn-modal";
    modal.innerHTML = `
      <div class="mn-sheet" role="dialog" aria-modal="true" aria-label="Edit listing">
        <header><strong>Edit ${esc(cat.noun)}</strong>
          <button type="button" data-act="close" aria-label="Close">×</button>
        </header>
        <div class="mn-form">
          <div class="mn-field">
            <label>PHOTO — ${PHOTO_SIZE} × ${PHOTO_SIZE}</label>
            <div class="mn-photo-row">
              <div class="mn-photo-thumb" data-thumb
                   style="${m.photo ? `background-image:url('${esc(m.photo)}')` : ""}"></div>
              <div class="mn-photo-actions">
                <button type="button" class="mn-mini" data-act="pick">Upload photo</button>
                <button type="button" class="mn-mini danger" data-act="clear-photo">Remove photo</button>
              </div>
            </div>
            <input type="file" accept="image/*" data-file hidden>
          </div>

          <div class="mn-field">
            <label>NAME</label>
            <input type="text" data-f="name" maxlength="40" value="${esc(m.name)}">
          </div>

          ${(m.category === "car" && CARS()) ? `<div class="mn-field">
            <label>MAKE</label>
            <select data-f="brand">
              ${CARS().brands().map(b => `<option value="${esc(b.id)}" ${b.id === m.brand ? "selected" : ""}>${esc(b.name)}</option>`).join("")}
            </select>
          </div>` : ""}

          <div class="mn-two">
            <div class="mn-field"><label>PRICE (R)</label>
              <input type="number" data-f="price" min="0" step="100" value="${m.price}"></div>
            <div class="mn-field"><label>${cat.lease ? "LEASE (R / MONTH)" : "LEASE (OFF)"}</label>
              <input type="number" data-f="lease" min="0" step="50" value="${m.lease}"
                     ${cat.lease ? "" : "disabled"}></div>
          </div>

          ${(cat.showTax || cat.showInternet) ? `<div class="mn-two">
            <div class="mn-field"><label>TAX (R / MONTH)</label>
              <input type="number" data-f="tax" min="0" step="50" value="${m.tax}"></div>
            <div class="mn-field"><label>INTERNET (R / MONTH)</label>
              <input type="number" data-f="internet" min="0" step="10" value="${m.internet}"
                     ${cat.showInternet ? "" : "disabled"}></div>
          </div>` : ""}

          ${specFields ? `<div class="mn-two">${specFields}</div>` : ""}

          <div class="mn-field">
            <label>PRESTIGE</label>
            <div class="mn-range">
              <input type="range" data-f="prestige" min="0" max="100" step="1" value="${m.prestige}">
              <output data-prestige>${m.prestige}</output>
            </div>
          </div>

          <div class="mn-field">
            <label>BILLS — POWER, WATER, CREW, ETC.</label>
            <div class="mn-bills" data-bills>${billRows(m.bills)}</div>
            <button type="button" class="mn-bill-add" data-act="add-bill">+ Add bill</button>
          </div>
        </div>
        <footer>
          <button type="button" class="mn-btn soft" data-act="close">Cancel</button>
          <button type="button" class="mn-btn" data-act="save">Save</button>
        </footer>
      </div>`;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));

    const draft = { photo: m.photo || "" };

    modal.addEventListener("click", e => {
      if (e.target === modal) return close();
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;

      if (act === "close") return close();
      if (act === "save") return save();
      if (act === "pick") return modal.querySelector("[data-file]").click();
      if (act === "clear-photo") {
        draft.photo = "";
        modal.querySelector("[data-thumb]").style.backgroundImage = "";
        return;
      }
      if (act === "add-bill") {
        modal.querySelector("[data-bills]").insertAdjacentHTML("beforeend", billRows([{ label: "", amount: 0 }]));
        const inputs = modal.querySelectorAll("[data-bill-label]");
        return inputs[inputs.length - 1].focus();
      }
      if (act === "remove-bill") {
        btn.closest(".mn-bill-row").remove();
      }
    });

    modal.querySelector("[data-f='prestige']").addEventListener("input", e => {
      modal.querySelector("[data-prestige]").textContent = e.target.value;
    });

    modal.querySelector("[data-file]").addEventListener("change", async e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await processPhoto(file);
        draft.photo = dataUrl;
        modal.querySelector("[data-thumb]").style.backgroundImage = `url('${dataUrl}')`;
        toast("Photo cropped to 736 × 736");
      } catch (err) {
        toast(err.message === "Too large" ? "That image is too large." : "Couldn't read that image.");
      } finally {
        e.target.value = "";
      }
    });

    document.addEventListener("keydown", onKey);
    function onKey(e) { if (e.key === "Escape") close(); }

    function close() {
      document.removeEventListener("keydown", onKey);
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 260);
      editingId = null;
    }

    function save() {
      const val = f => {
        const el = modal.querySelector(`[data-f='${f}']`);
        return el ? el.value : "";
      };
      const target = find(id);
      if (!target) return close();

      const specs = {};
      modal.querySelectorAll("[data-spec]").forEach(el => {
        specs[el.dataset.spec] = Number(el.value) || 0;
      });

      const next = normalize({
        id: target.id,
        category: target.category,
        photo: draft.photo,
        name: val("name").trim() || ("New " + cat.noun),
        price: Number(val("price")) || 0,
        lease: Number(val("lease")) || 0,
        tax: Number(val("tax")) || 0,
        internet: Number(val("internet")) || 0,
        prestige: Number(val("prestige")) || 0,
        specs,
        bills: Array.from(modal.querySelectorAll(".mn-bill-row")).map(row => ({
          label: (row.querySelector("[data-bill-label]").value || "Bill").trim(),
          amount: Number(row.querySelector("[data-bill-amount]").value) || 0
        })).filter(b => b.amount > 0 || b.label),
        owned: target.owned,
        leased: target.leased,
        acquiredAt: target.acquiredAt,
        lastBillsAt: target.lastBillsAt,
        brand: target.category === "car" ? (val("brand") || target.brand) : target.brand,
        owner: target.owner,
        ownerName: target.ownerName
      });

      const idx = state.items.findIndex(x => x.id === id);
      const before = state.items[idx];
      state.items[idx] = next;
      if (!persist()) { state.items[idx] = before; return; }
      close();
      render();
      toast("Saved");
    }
  }

  /* ---------------------------------------------------------
     Edit mode (shared with future pages)
     --------------------------------------------------------- */
  const listeners = [];

  function syncSwitch() {
    const sw = document.getElementById("edit-mode-switch");
    const hint = document.getElementById("edit-mode-hint");
    if (!sw) return;
    sw.setAttribute("aria-checked", state.editMode ? "true" : "false");
    const lbl = sw.querySelector(".edit-toggle-label");
    if (lbl) lbl.textContent = state.editMode ? "Editing" : "Edit Mode";
    if (hint) {
      hint.textContent = state.editMode
        ? "On — open the Shop or Properties to swap photos, edit prices and add slots."
        : "Off — players see the buy & lease view.";
      hint.classList.toggle("on", state.editMode);
    }
  }

  const api = {
    isOn: () => !!state.editMode,
    set(on) {
      state.editMode = !!on;
      persist();
      syncSwitch();
      if (isOnPage()) render();
      listeners.forEach(fn => { try { fn(state.editMode); } catch {} });
      toast(state.editMode ? "Edit mode on — you can now edit every asset page" : "Edit mode off");
    },
    onChange(fn) { if (typeof fn === "function") listeners.push(fn); }
  };
  window.nuLimitsEditMode = api;

  function isOnPage() {
    const dyn = document.getElementById("dynamic-page");
    return dyn && !dyn.hidden && !!dyn.querySelector(".mn-page");
  }

  /* ---------------------------------------------------------
     Wiring
     --------------------------------------------------------- */
  const dyn = document.getElementById("dynamic-page");
  if (dyn) {
    dyn.addEventListener("click", e => {
      if (!e.target.closest(".mn-page")) return;

      const actBtn = e.target.closest("[data-act]");
      if (actBtn) {
        const act = actBtn.dataset.act;
        const card = actBtn.closest(".mn-card");
        const id = card && card.dataset.id;

        if (act === "brand-add") return addMake();
        if (act === "brand-edit") return editMake(actBtn.dataset.brand || "");
        if (act === "brand-photo") return photoMake(actBtn.dataset.brand || "");
        if (act === "brand-del") return deleteMake(actBtn.dataset.brand || "");
        if (act === "brands") {
          carBrand = null;
          render();
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        if (act === "add") return addSlot();
        if (act === "exit-edit") return api.set(false);
        if (act === "go") { activeCat = actBtn.dataset.cat; render(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
        if (!id) return;

        if (act === "buy") return buy(id);
        if (act === "sell") return sell(id);
        if (act === "lease") return lease(id);
        if (act === "unlease") return unlease(id);
        if (act === "resell-her") {
          if (window.nuLimitsFamily && window.nuLimitsFamily.sellAsset) {
            return window.nuLimitsFamily.sellAsset(id, "asset");
          }
          return;
        }
        if (act === "delete") return removeItem(id);
        if (act === "edit" || act === "photo") return openEditor(id);
        if (act === "engine") return;   /* ignition.js owns the start sequence */
        if (act === "sound") return uploadEngine(id);
        return;
      }

      /* ---- cars: open a make ---- */
      const brandBtn = e.target.closest("[data-brand]");
      if (brandBtn) {
        carBrand = brandBtn.dataset.brand;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const chip = e.target.closest("[data-cat]");
      if (chip) {
        activeCat = chip.dataset.cat;
        carBrand = null;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  const sw = document.getElementById("edit-mode-switch");
  if (sw) {
    syncSwitch();
    sw.addEventListener("click", () => api.set(!state.editMode));
  }

  /* ---------------------------------------------------------
     Route
     --------------------------------------------------------- */
  const prevNavigate = window.navigateTo;
  window.navigateTo = function (page) {
    if (page === "property") {
      document.querySelectorAll(".nav-item").forEach(b =>
        b.classList.toggle("active", b.dataset.page === page));
      if (typeof window.nuLimitsInvestLeave === "function") window.nuLimitsInvestLeave();
      const main = document.getElementById("main-content");
      const dp = document.getElementById("dynamic-page");
      if (!main || !dp) return;
      main.hidden = true;
      dp.hidden = false;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    return prevNavigate.apply(this, arguments);
  };
})();
