/* =========================================================
   NU LIMITS — VENTURES  (Round 37)

   Four real businesses you must buy before you can trade:

     · NU Roast Coffee        — specialty coffee house
     · NU Limits Logistics    — courier & delivery depot
     · Level Up Games         — console & game store
     · NU Motors              — car dealership

   Each one runs on the game clock (1 day = 15 s):
   stock, staff, pricing, marketing, reputation, upgrades,
   daily costs, and random events so no two days match.

   Save: nuLimitsVentures_v1   (+ migration from r36 saves)
   ========================================================= */

(function () {
  "use strict";

  const KEY = "nuLimitsVentures_v1";
  const MAX_UPGRADE = 5;

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const money = n => (Number(n) < 0 ? "−R " : "R ") + Math.round(Math.abs(Number(n) || 0)).toLocaleString("en-ZA");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const day = () => (window.nuLimitsWorld ? window.nuLimitsWorld.day : 1);
  const dow = () => {
    const d = window.nuLimitsWorld ? window.nuLimitsWorld.date : new Date();
    return d ? d.getUTCDay() : 4;   /* 0 Sun … 6 Sat */
  };
  const balance = () => (window.nuLimitsMoney && window.nuLimitsMoney.getBalance) ? window.nuLimitsMoney.getBalance() : 0;
  const pay = (amount, label) => !!(window.nuLimitsMoney && window.nuLimitsMoney.transact("expense", Math.round(amount), label));
  const earn = (amount, label) => !!(window.nuLimitsMoney && window.nuLimitsMoney.transact("income", Math.round(amount), label));
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const freePlay = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());

  function toast(msg, bad) {
    let el = document.querySelector(".mn-toast");
    if (!el) { el = document.createElement("div"); el.className = "mn-toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.toggle("is-bad", !!bad);
    el.classList.add("show");
    clearTimeout(el.__t);
    el.__t = window.setTimeout(() => el.classList.remove("show"), 3000);
  }

  /* ---------------------------------------------------------
     The four businesses
     --------------------------------------------------------- */
  const CATALOG = {
    coffee: {
      brand: "NU Roast Coffee",
      kicker: "SPECIALTY COFFEE HOUSE",
      photo: "images/coffee/cafe-hero.jpg",
      tint: "#8A5A3B",
      blurb: "Morning rush, loyalty regulars, and a roastery that smells like money.",
      buy: 480000,
      unit: "cup",
      unitPlural: "cups",
      stockName: "beans & milk",
      stockUnit: "kg",
      stockPrice: 340,             /* cost per kg of stock */
      stockMax: 420,
      price: 52,                   /* price per cup */
      wage: 1150,                  /* per barista per day */
      rent: 2400,                  /* per day */
      baseDemand: 210,             /* cups/day at reputation 50 */
      target: 11000,               /* daily revenue target for the bar */
      variance: 0.22,
      events: [
        { t: "Office block opens across the road", d: 2, demand: 1.35, note: "A 400-seat office opened — the queue starts at 6:40." },
        { t: "Espresso machine down", d: 1, demand: 0.55, note: "One group head failed. Everything is takeaway today." },
        { t: "Bean price spike", d: 1, cost: 1.5, note: "Arabica jumped overnight — restocking costs more today." },
        { t: "Influencer latte", d: 1, demand: 1.5, note: "A food influencer posted the pink latte. Chaos." },
        { t: "Load-shedding", d: 1, demand: 0.7, note: "Stage 4 — the grinder is on the inverter only." },
        { t: "Rainy morning", d: 1, demand: 0.85, note: "Rain keeps the walk-in crowd at home." }
      ],
      upgrades: [
        { k: "machine", name: "Espresso machines", blurb: "Faster service → more cups per barista.", cost: 42000, kind: "demand", gain: 0.09 },
        { k: "seats", name: "Seating & décor", blurb: "More tables, longer stays, bigger tickets.", cost: 68000, kind: "demand", gain: 0.07 },
        { k: "drive", name: "Drive-thru lane", blurb: "Cars in the morning rush.", cost: 210000, kind: "demand", gain: 0.14 },
        { k: "app", name: "Loyalty app & mobile orders", blurb: "Regulars spend more, predictably.", cost: 96000, kind: "reputation", gain: 6 },
        { k: "roastery", name: "In-house roastery", blurb: "Cut bean costs and sell beans by the bag.", cost: 320000, kind: "margin", gain: 0.12 }
      ]
    },

    logistics: {
      brand: "NU Limits Logistics",
      kicker: "COURIER & DELIVERY DEPOT",
      photo: "images/ventures/logistics-hero.jpg",
      tint: "#2F5D57",
      blurb: "Vans, drivers and route density — paid per parcel, judged on the clock.",
      buy: 1250000,
      unit: "parcel",
      unitPlural: "parcels",
      stockName: "fuel & packaging",
      stockUnit: "L",
      stockPrice: 26,
      stockMax: 1500,
      price: 78,                   /* revenue per parcel */
      wage: 1450,                  /* per driver per day */
      rent: 5200,
      baseDemand: 340,
      target: 26000,
      variance: 0.26,
      events: [
        { t: "Marketplace sale weekend", d: 2, demand: 1.5, note: "A platform ran a sale — parcels are stacked to the roof." },
        { t: "Van in for repairs", d: 1, demand: 0.62, note: "Gearbox done on van 3; two routes cancelled." },
        { t: "Fuel price hike", d: 1, cost: 1.4, note: "Diesel up 14% — today's fuel costs bite." },
        { t: "Big retail contract", d: 2, demand: 1.32, note: "A national retailer signed a 2-day contract." },
        { t: "Wrong-address surge", d: 1, demand: 0.9, note: "Address errors meant redeliveries all afternoon." },
        { t: "Night-shift bonus", d: 1, demand: 1.18, note: "Couriers pushed the night routes hard." }
      ],
      upgrades: [
        { k: "vans", name: "Extra delivery vans", blurb: "More routes per day.", cost: 160000, kind: "capacity", gain: 1 },
        { k: "sorting", name: "Sorting conveyor", blurb: "Fewer missorts, faster turn-around.", cost: 240000, kind: "demand", gain: 0.11 },
        { k: "fridge", name: "Refrigerated fleet", blurb: "Cold-chain contracts pay more.", cost: 380000, kind: "margin", gain: 0.14 },
        { k: "tracking", name: "Tracking & routing app", blurb: "Happy customers, fewer complaints.", cost: 145000, kind: "reputation", gain: 7 },
        { k: "depot", name: "Bigger depot", blurb: "Store more stock, buy fuel in bulk.", cost: 520000, kind: "stock", gain: 120 }
      ]
    },

    games: {
      brand: "Level Up Games",
      kicker: "CONSOLE & GAME STORE",
      photo: "images/creator/gaming.jpg",
      tint: "#3B3F7A",
      blurb: "PlayStation and Xbox on the shelf, launch nights, and pre-order queues that pay.",
      buy: 640000,
      unit: "sale",
      unitPlural: "sales",
      stockName: "consoles & games",
      stockUnit: "units",
      stockPrice: 1180,
      stockMax: 260,
      price: 1499,                 /* average basket value */
      wage: 1300,
      rent: 3100,
      baseDemand: 46,
      target: 34000,
      variance: 0.34,
      events: [
        { t: "Console launch week", d: 2, demand: 2.1, note: "A new console launched — the queue wraps the block." },
        { t: "Title delayed", d: 1, demand: 0.6, note: "The year's biggest title slipped a quarter." },
        { t: "Trade-in rush", d: 1, demand: 1.2, margin: 1.1, note: "Trade-ins are flowing — margin is up." },
        { t: "Digital-only rumour", d: 1, demand: 0.82, note: "A digital-only rumour spooked disc buyers." },
        { t: "Tournament night", d: 1, demand: 1.35, note: "A FIFA tournament filled the store until 10pm." },
        { t: "Stock allocation cut", d: 1, demand: 0.9, cost: 1.25, note: "The distributor cut your allocation." }
      ],
      upgrades: [
        { k: "floor", name: "Bigger shop floor", blurb: "More consoles on display, more browsers.", cost: 120000, kind: "demand", gain: 0.1 },
        { k: "tradein", name: "Trade-in counter", blurb: "Used stock at better margins.", cost: 86000, kind: "margin", gain: 0.16 },
        { k: "arcade", name: "Gaming lounge", blurb: "Kids stay, parents spend.", cost: 195000, kind: "demand", gain: 0.13 },
        { k: "online", name: "Online store & delivery", blurb: "Sell nationally, not just walk-ins.", cost: 240000, kind: "capacity", gain: 1 },
        { k: "vip", name: "Rewards club", blurb: "Pre-orders and loyal regulars.", cost: 74000, kind: "reputation", gain: 8 }
      ]
    },

    motors: {
      brand: "NU Motors",
      kicker: "CAR DEALERSHIP",
      photo: "images/cars/bmw.jpg",
      tint: "#3A3A3A",
      blurb: "Buy the stock, prep it, sell it on — margin lives in the trade and the finance desk.",
      buy: 2400000,
      unit: "car",
      unitPlural: "cars",
      stockName: "vehicles in stock",
      stockUnit: "cars",
      stockPrice: 385000,          /* trade price per car */
      stockMax: 14,
      price: 468000,               /* average retail */
      wage: 2100,                  /* per salesperson */
      rent: 8600,
      baseDemand: 1.6,
      target: 420000,
      variance: 0.42,
      events: [
        { t: "Repo auction", d: 1, cost: 0.85, note: "Bank repo auction — you bought stock under trade." },
        { t: "Fuel hike", d: 1, demand: 0.7, note: "Fuel hike cooled SUV demand." },
        { t: "Corporate fleet order", d: 1, demand: 2.4, note: "A fleet buyer took three units at sticker." },
        { t: "Interest rate cut", d: 2, demand: 1.45, note: "Rate cut — finance approvals are flying through." },
        { t: "Showroom water leak", d: 1, demand: 0.6, note: "Half the showroom is closed for repairs." },
        { t: "Detail bay magic", d: 1, margin: 1.12, note: "The prep team turned two trades into retail cars." }
      ],
      upgrades: [
        { k: "showroom", name: "Glass showroom", blurb: "More feet through the door.", cost: 320000, kind: "demand", gain: 0.12 },
        { k: "service", name: "Service centre", blurb: "Recon in-house, higher margin.", cost: 280000, kind: "margin", gain: 0.15 },
        { k: "finance", name: "In-house finance desk", blurb: "Commission on every deal.", cost: 190000, kind: "margin", gain: 0.1 },
        { k: "online", name: "Online listings & delivery", blurb: "Sell nationally.", cost: 260000, kind: "demand", gain: 0.16 },
        { k: "premium", name: "Premium brand franchise", blurb: "Better cars, better tickets.", cost: 900000, kind: "price", gain: 0.18 }
      ]
    }
  };

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  function freshVenture(id) {
    const c = CATALOG[id];
    return {
      id,
      owned: false,
      cash: 0,
      stock: 0,
      staff: 0,
      marketing: 0,          /* days of campaign left */
      price: c.price,
      reputation: 50,
      upgrades: {},
      lastDay: day(),
      todayUnits: 0,
      todayRevenue: 0,
      todayCosts: 0,
      lastNote: "",
      history: [],
      boughtDay: 0,
      autoRestock: true
    };
  }

  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (err) { raw = null; }
    const out = { version: 1, items: {} };
    Object.keys(CATALOG).forEach(id => {
      const saved = raw && raw.items && raw.items[id];
      out.items[id] = Object.assign(freshVenture(id), saved || {});
      if (!out.items[id].upgrades) out.items[id].upgrades = {};
    });
    return out;
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (err) { toast("Couldn't save the business.", true); return false; }
  }

  const v = id => state.items[id];
  const cat = id => CATALOG[id];

  /* Creator Edit Mode overrides — name, cover, buy-in, rent, wage, unit price */
  const num = (x, fallback) => (Number.isFinite(Number(x)) && Number(x) >= 0 ? Number(x) : fallback);
  const nameOf = id => { const s = v(id), c = cat(id); return (s && s.editName) || c.brand; };
  const photoOf = id => { const s = v(id), c = cat(id); return (s && s.editPhoto) || c.photo; };
  const buyOf = id => { const s = v(id), c = cat(id); return num(s && s.editBuy, c.buy); };
  const rentOf = id => { const s = v(id), c = cat(id); return num(s && s.editRent, c.rent); };
  const wageOf = id => { const s = v(id), c = cat(id); return num(s && s.editWage, c.wage); };
  const basePriceOf = id => { const s = v(id), c = cat(id); return num(s && s.editBase, c.price); };

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
          const sc = Math.min(1, 1200 / img.width);
          const c2 = document.createElement("canvas");
          c2.width = Math.round(img.width * sc);
          c2.height = Math.round(img.height * sc);
          c2.getContext("2d").drawImage(img, 0, 0, c2.width, c2.height);
          cb(c2.toDataURL("image/jpeg", 0.8));
        } catch (err) { cb(null); }
        URL.revokeObjectURL(url);
        input.remove();
      };
      img.onerror = () => { cb(null); URL.revokeObjectURL(url); input.remove(); };
      img.src = url;
    });
    input.click();
  }

  /* ---------------------------------------------------------
     Derived numbers
     --------------------------------------------------------- */
  function upLevel(s, c, k) {
    return clamp(Math.round(Number(s.upgrades[k]) || 0), 0, MAX_UPGRADE);
  }

  function upgradeEffect(s, c, kind) {
    let n = 0;
    (c.upgrades || []).forEach(u => {
      if (u.kind !== kind) return;
      n += upLevel(s, c, u.k) * u.gain;
    });
    return n;
  }

  function stockCap(s, c) { return Math.round(c.stockMax + upgradeEffect(s, c, "stock")); }
  function staffCap(s, c) { return 2 + upLevel(s, c, "vans") * 1 + upLevel(s, c, "online") * 1 + Math.floor(upLevel(s, c, "showroom") / 2) + upgradeEffect(s, c, "capacity"); }

  function quality(s, c) {
    const staffRatio = s.staff <= 0 ? 0 : clamp(s.staff / Math.max(1, staffCap(s, c) * 0.6), 0, 1);
    const stockRatio = s.stock <= 0 ? 0 : clamp(s.stock / Math.max(1, stockCap(s, c) * 0.45), 0, 1);
    return clamp(0.42 * staffRatio + 0.33 * stockRatio + 0.25 * (s.reputation / 100), 0, 1);
  }

  function unitPrice(s, c) {
    const mult = 1 + upgradeEffect(s, c, "price");
    return Math.round(s.price * mult);
  }

  function demandOf(s, c, ev) {
    const q = quality(s, c);
    const rep = 0.55 + (s.reputation / 100) * 0.9;
    const mark = 1 + (s.marketing > 0 ? 0.22 : 0);
    const baseP = basePriceOf(s.id) || 1;
    const priceFactor = clamp(1 - ((s.price - baseP) / baseP) * 0.8, 0.35, 1.5);
    const weekend = (c === CATALOG.logistics ? (dow() === 1 || dow() === 6 ? 1.18 : 1) : (dow() === 0 || dow() === 6 ? 1.14 : 1));
    const noise = rand(1 - c.variance, 1 + c.variance);
    return Math.max(0, c.baseDemand * (0.35 + q * 1.15) * rep * mark * priceFactor * weekend * noise * (ev && ev.demand ? ev.demand : 1));
  }

  /* the business pays its own way first; the owner covers the shortfall */
  function spend(s, amount, label) {
    const need = Math.round(amount);
    if (freePlay()) return true;
    if (s.cash >= need) { s.cash -= need; return true; }
    const rest = need - Math.max(0, s.cash);
    s.cash = Math.min(0, s.cash);
    return pay(rest, label);
  }

  function dailyCosts(s, c) {
    const staffCost = s.staff * wageOf(s.id);
    const rent = rentOf(s.id);
    const marketing = s.marketing > 0 ? Math.round(rent * 0.35) : 0;
    return staffCost + rent + marketing;
  }

  /* ---------------------------------------------------------
     The clock — one tick per game day
     --------------------------------------------------------- */
  function tick() {
    const d = day();
    let changed = false;
    Object.keys(CATALOG).forEach(id => {
      const s = v(id), c = cat(id);
      if (!s.owned || s.lastDay === d) return;
      const days = Math.min(3, Math.max(1, d - s.lastDay));
      s.lastDay = d;
      changed = true;

      /* random event (40% of days) */
      let ev = null;
      if (Math.random() < 0.4) ev = pick(c.events);

      /* standing supplier order: top up before a day starts */
      if (s.autoRestock) {
        const cap0 = stockCap(s, c);
        if (s.stock < cap0 * 0.3) {
          const need = cap0 - s.stock;
          const unitCost = Math.round(c.stockPrice * (1 - upgradeEffect(s, c, "margin") * 0.35));
          const cost = Math.round(need * unitCost);
          if (s.cash >= cost) s.cash -= cost;
          else if (balance() >= cost && pay(cost, `${c.brand}: automatic restock`)) { /* paid by owner */ }
          else { s.stock += Math.round(need * 0.4); }   /* supplier extends partial credit */
          s.stock = Math.min(cap0, s.stock + need);
        }
      }

      for (let step = 0; step < days; step++) {
        const demand = demandOf(s, c, ev);
        const stockUnits = s.stock;                    /* stock is counted in sellable units for clarity */
        const sold = Math.min(stockUnits, demand);
        const price = unitPrice(s, c);
        const marginMult = 1 + upgradeEffect(s, c, "margin") + (ev && ev.margin ? ev.margin - 1 : 0);
        const revenue = Math.round(sold * price * marginMult);
        const costs = dailyCosts(s, c) + (ev && ev.cost ? Math.round(c.rent * 0.25 * (ev.cost - 1)) : 0);
        const wasted = Math.max(0, Math.round((stockUnits - sold) * 0.04));  /* small spoilage/aging */

        s.stock = Math.max(0, Math.round(stockUnits - sold - wasted));
        s.cash += revenue - costs;
        s.todayUnits = Math.round(sold);
        s.todayRevenue = revenue;
        s.todayCosts = costs;

        const missed = demand - sold;
        let repDelta = (quality(s, c) >= 0.66 ? 0.9 : -0.7);
        if (missed > demand * 0.25) repDelta -= 1.6;
        if (s.marketing > 0) repDelta += 0.3;
        s.reputation = clamp(s.reputation + repDelta + rand(-0.6, 0.6), 0, 100);
        if (s.marketing > 0) s.marketing -= 1;

        s.history = [{ day: d, revenue, costs, sold: Math.round(sold), note: ev ? ev.note : "" }]
          .concat(s.history || []).slice(0, 12);
        if (ev) s.lastNote = ev.note;
      }
    });
    if (changed) { save(); if (isPage()) render(); }
  }

  /* ---------------------------------------------------------
     Page helpers
     --------------------------------------------------------- */
  let active = null;

  const isPage = () => {
    const dp = document.getElementById("dynamic-page");
    return !!(dp && !dp.hidden && dp.querySelector(".vt-page"));
  };

  function bar(label, pct, note, cls) {
    const p = clamp(Math.round(pct), 0, 100);
    return `<div class="vt-bar ${cls || ""}">
      <div class="vt-bar-top"><span>${esc(label)}</span><b>${p}%</b></div>
      <div class="vt-track"><i style="width:${p}%"></i></div>
      ${note ? `<small>${esc(note)}</small>` : ""}
    </div>`;
  }


  /* ---------------------------------------------------------
     Creator Edit Mode panel — name, photo, money, stock, staff,
     reputation, prices and upgrade levels, all editable
     --------------------------------------------------------- */
  function editPanel(id) {
    const s = v(id), c = cat(id);
    const row = (label, act, value, hint) => `
      <div class="ve-row">
        <div class="ve-lab"><b>${esc(label)}</b>${hint ? `<small>${esc(hint)}</small>` : ""}</div>
        <button type="button" class="ve-val" data-ve="${act}" data-id="${id}">${esc(value)}</button>
      </div>`;

    return `<div class="ve-panel">
      <div class="ve-head">
        <span class="ve-dot"></span>
        <b>Edit Mode</b>
        <small>everything below is yours to change</small>
      </div>
      ${row("Business name", "name", nameOf(id), "shown on the list and here")}
      <div class="ve-row">
        <div class="ve-lab"><b>Cover photo</b><small>file or URL</small></div>
        <button type="button" class="ve-val" data-ve="photo" data-id="${id}">Change photo</button>
      </div>
      ${row("Purchase price", "buy", money(buyOf(id)), "what it costs to buy")}
      ${row("Unit price", "price", money(s.price), "per " + c.unit)}
      ${row("Base price", "base", money(basePriceOf(id)), "the price demand expects")}
      ${row("Daily rent", "rent", money(rentOf(id)), "overheads every day")}
      ${row("Staff wage", "wage", money(wageOf(id)), "per person per day")}
      ${s.owned ? row("Money in the till", "cash", money(s.cash), "business cash") : ""}
      ${s.owned ? row("Stock", "stock", s.stock + " " + c.stockUnit, "of " + stockCap(s, c)) : ""}
      ${s.owned ? row("Staff on shift", "staff", String(s.staff), "of " + staffCap(s, c)) : ""}
      ${s.owned ? row("Reputation", "rep", Math.round(s.reputation) + " / 100", "drives demand") : ""}

      <div class="ve-ups">
        <p class="ve-sub">Upgrade levels</p>
        ${(c.upgrades || []).map(u => {
          const lvl = upLevel(s, c, u.k);
          return `<div class="ve-up">
            <span>${esc(u.name)}</span>
            <div class="ve-stepper">
              <button type="button" data-ve="up-down" data-id="${id}" data-k="${u.k}" aria-label="Lower">−</button>
              <b>${lvl}</b>
              <button type="button" data-ve="up-up" data-id="${id}" data-k="${u.k}" aria-label="Raise">+</button>
            </div>
          </div>`;
        }).join("")}
      </div>

      <div class="ve-actions">
        ${s.owned ? `<button type="button" data-ve="fund" data-id="${id}">Add R 50 000 to the till</button>` : ""}
        <button type="button" class="soft" data-ve="reset" data-id="${id}">Reset this business</button>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------
     Listing page
     --------------------------------------------------------- */
  function listCard(id) {
    const s = v(id), c = cat(id);
    const price = buyOf(id);
    const owned = s.owned;
    const status = !owned ? `For sale · ${money(price)}` : (s.cash < 0 ? "Overdrawn" : "Trading");
    return `<article class="vt-card ${owned ? "is-owned" : ""}" data-vt-open="${id}">
      <div class="vt-card-art" style="background-image:url('${esc(photoOf(id))}');--tint:${c.tint}">
        <span class="vt-card-veil"></span>
        <span class="vt-card-kicker">${esc(c.kicker)}</span>
        <span class="vt-card-state ${owned ? "on" : ""}">${owned ? "OWNED" : "FOR SALE"}</span>
      </div>
      <div class="vt-card-body">
        <div class="vt-card-top"><h2>${esc(nameOf(id))}</h2><span class="vt-pill">${esc(status)}</span></div>
        <p class="vt-card-blurb">${esc(c.blurb)}</p>
        ${owned ? `<div class="vt-card-bars">
            ${bar("Stock", (s.stock / stockCap(s, c)) * 100, `${s.stock} of ${stockCap(s, c)} ${c.stockUnit}`, "is-stock")}
            ${bar("Reputation", s.reputation, `${Math.round(s.reputation)} / 100`, "is-rep")}
          </div>` : `<p class="vt-card-buy">Buy the business before you can trade it</p>`}
        <span class="vt-enter">${owned ? "Open" : "View & buy"} <i aria-hidden="true">→</i></span>
      </div>
    </article>`;
  }

  function listHTML() {
    const ids = Object.keys(CATALOG);
    const owned = ids.filter(id => v(id).owned).length;
    return `<section class="dynamic-page-content vt-page vt-list-page">
      <div class="vt-head">
        <p class="eyebrow">NU LIMITS / BUSINESS</p>
        <h1>Businesses</h1>
        <p class="muted">${owned} of ${ids.length} operating. Every venture is bought first — then stocked, staffed and run day by day.</p>
      </div>
      <div class="vt-cards">${ids.map(listCard).join("")}</div>
      <button class="secondary-button" type="button" data-page="home" style="margin-top:22px">← Back</button>
    </section>`;
  }

  /* ---------------------------------------------------------
     One business page
     --------------------------------------------------------- */
  function detailHTML(id) {
    const s = v(id), c = cat(id);
    if (id === "logistics" && s.owned && window.nuLimitsLogistics) {
      return window.nuLimitsLogistics.page(id);
    }
    if (id === "games" && s.owned && window.nuLimitsGames) {
      return window.nuLimitsGames.page(id);
    }
    if (id === "coffee" && s.owned && window.nuLimitsCoffee) {
      return window.nuLimitsCoffee.page(id);
    }

    if (!s.owned) {
      return `<section class="dynamic-page-content vt-page vt-one">
        ${editOn() ? editPanel(id) : ""}
        <div class="vt-hero" style="background-image:url('${esc(photoOf(id))}')">
          <span class="vt-hero-veil"></span>
          <div class="vt-hero-body">
            <p class="vt-hero-kicker">${esc(c.kicker)} · FOR SALE</p>
            <h1>${esc(nameOf(id))}</h1>
            <p>${esc(c.blurb)}</p>
          </div>
        </div>
        <div class="vt-buybox">
          <div class="vt-buyrow"><span>Purchase price</span><b>${money(buyOf(id))}</b></div>
          <div class="vt-buyrow"><span>Daily rent &amp; overheads</span><b>${money(rentOf(id))}</b></div>
          <div class="vt-buyrow"><span>Staff wage</span><b>${money(wageOf(id))} / person / day</b></div>
          <div class="vt-buyrow"><span>Your balance</span><b>${money(balance())}</b></div>
          <button class="vt-cta" type="button" data-vt="buy" data-id="${id}">Buy for ${money(buyOf(id))}</button>
          <p class="vt-fine">You must own the business before it can trade. Buying is a one-off capital payment.</p>
        </div>
        <button class="secondary-button" type="button" data-page="home" style="margin-top:18px">← Back to businesses</button>
      </section>`;
    }

    const cap = stockCap(s, c);
    const staffCeil = staffCap(s, c);
    const price = unitPrice(s, c);
    const targetPct = (s.todayRevenue / c.target) * 100;
    const net = s.todayRevenue - s.todayCosts;
    const q = quality(s, c);

    return `<section class="dynamic-page-content vt-page vt-one">
      ${editOn() ? editPanel(id) : ""}
      <div class="vt-hero" style="background-image:url('${esc(photoOf(id))}')">
        <span class="vt-hero-veil"></span>
        <div class="vt-hero-body">
          <p class="vt-hero-kicker">${esc(c.kicker)} · TRADING</p>
          <h1>${esc(nameOf(id))}</h1>
          <p>Day ${Math.max(1, day() - s.boughtDay)} under your name · ${esc(c.stockName)} in the back</p>
        </div>
        <div class="vt-hero-stats">
          <span><small>TILL</small><b>${money(s.cash)}</b></span>
          <span><small>TODAY</small><b class="${net >= 0 ? "good" : "bad"}">${net >= 0 ? "+" : ""}${money(net)}</b></span>
        </div>
      </div>

      <div class="vt-metrics">
        ${bar("Stock", (s.stock / cap) * 100, `${s.stock} / ${cap} ${c.stockUnit}`, "is-stock")}
        ${bar("Staffing", (s.staff / Math.max(1, staffCeil)) * 100, `${s.staff} / ${staffCeil} on shift`, "is-staff")}
        ${bar("Reputation", s.reputation, `${Math.round(s.reputation)} / 100 · ${s.reputation > 74 ? "the talk of the town" : s.reputation > 45 ? "steady" : "needs work"}`, "is-rep")}
        ${bar("Today vs target", targetPct, `${money(s.todayRevenue)} of ${money(c.target)}`, "is-day")}
      </div>

      <div class="vt-panel">
        <div class="vt-panel-head"><h3>Today's trading</h3><span>${s.todayUnits} ${esc(c.unitPlural)} · avg ${money(price)}</span></div>
        <ul class="vt-ledger">
          <li><span>Revenue</span><b class="good">${money(s.todayRevenue)}</b></li>
          <li><span>Wages, rent &amp; overheads</span><b class="bad">−${money(s.todayCosts)}</b></li>
          <li class="is-total"><span>Net</span><b class="${net >= 0 ? "good" : "bad"}">${net >= 0 ? "+" : ""}${money(net)}</b></li>
        </ul>
        ${s.lastNote ? `<p class="vt-note">“${esc(s.lastNote)}”</p>` : `<p class="vt-note">Quiet, predictable trading. The market decides the rest.</p>`}
        <div class="vt-actions">
          <button type="button" class="vt-btn" data-vt="restock" data-id="${id}">Restock ${esc(c.stockName)}</button>
          <button type="button" class="vt-btn" data-vt="hire" data-id="${id}">Hire staff</button>
          <button type="button" class="vt-btn" data-vt="marketing" data-id="${id}">Run a campaign</button>
          <button type="button" class="vt-btn soft" data-vt="price" data-id="${id}">Change price</button>
          <button type="button" class="vt-btn soft" data-vt="auto" data-id="${id}">
            Auto-restock: ${s.autoRestock ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div class="vt-panel">
        <div class="vt-panel-head"><h3>Upgrades</h3><span>${Object.keys(s.upgrades).filter(k => upLevel(s, c, k) > 0).length} started</span></div>
        <div class="vt-ups">
          ${(c.upgrades || []).map(u => {
            const lvl = upLevel(s, c, u.k);
            const cost = Math.round(u.cost * Math.pow(1.55, lvl));
            return `<article class="vt-up">
              <div class="vt-up-top">
                <b>${esc(u.name)}</b>
                <span class="vt-up-lvl">${lvl}/${MAX_UPGRADE}</span>
              </div>
              <small>${esc(u.blurb)}</small>
              <div class="vt-up-track"><i style="width:${(lvl / MAX_UPGRADE) * 100}%"></i></div>
              <button type="button" class="vt-up-btn" data-vt="upgrade" data-id="${id}" data-k="${u.k}"
                ${lvl >= MAX_UPGRADE ? "disabled" : ""}>
                ${lvl >= MAX_UPGRADE ? "Maxed out" : `Upgrade · ${money(cost)}`}
              </button>
            </article>`;
          }).join("")}
        </div>
      </div>

      <div class="vt-panel">
        <div class="vt-panel-head"><h3>Last days</h3><span>variance ${Math.round(c.variance * 100)}%</span></div>
        <div class="vt-days">
          ${(s.history || []).slice(0, 7).map(h => `
            <div class="vt-day">
              <span class="vt-day-n">D${h.day}</span>
              <span class="vt-day-bar"><i style="width:${clamp((h.revenue / Math.max(1, c.target)) * 100, 3, 100)}%"></i></span>
              <b class="${h.revenue - h.costs >= 0 ? "good" : "bad"}">${money(h.revenue - h.costs)}</b>
            </div>`).join("") || `<p class="vt-fine">No trading days yet — the first till counts at the next day change.</p>`}
        </div>
      </div>

      <button class="vt-cash" type="button" data-vt="bank" data-id="${id}" ${s.cash <= 0 ? "disabled" : ""}>
        Bank the takings · ${money(Math.max(0, s.cash))}
      </button>
      <button class="secondary-button" type="button" data-page="home" style="margin-top:18px">← Back to businesses</button>
    </section>`;
  }

  function render() {
    const dp = document.getElementById("dynamic-page");
    if (!dp) return;
    dp.innerHTML = active ? detailHTML(active) : listHTML();
    const main = document.getElementById("main-content");
    if (main) main.hidden = true;
    dp.hidden = false;
    if (typeof window.nuLimitsNoteNav === "function") window.nuLimitsNoteNav("venture");
  }

  /* ---------------------------------------------------------
     Actions
     --------------------------------------------------------- */
  function doBuy(id) {
    const s = v(id), c = cat(id);
    if (s.owned) return;
    if (!freePlay() && balance() < buyOf(id)) return toast("Not enough cash to buy this business.", true);
    if (!freePlay() && !pay(buyOf(id), `Bought ${nameOf(id)}`)) return toast("The bank declined the payment.", true);
    s.owned = true;
    s.boughtDay = day();
    s.lastDay = day();
    s.stock = Math.round(stockCap(s, c) * 0.5);
    s.staff = 1;
    s.cash = 0;
    save();
    toast(`${nameOf(id)} is yours. Stock it and open the doors.`);
    if (window.nuLimitsBusinessesRefresh) window.nuLimitsBusinessesRefresh();
    render();
  }

  function restock(id) {
    const s = v(id), c = cat(id);
    const cap = stockCap(s, c);
    const need = cap - s.stock;
    if (need <= 0) return toast("Stock room is already full.", true);
    const unitCost = Math.round(c.stockPrice * (1 - upgradeEffect(s, c, "margin") * 0.35));
    const cost = Math.round(need * unitCost);
    if (!spend(s, cost, `${c.brand}: restock ${need} ${c.stockUnit}`)) return toast("Can't afford that restock.", true);
    s.stock = cap;
    save(); render();
    toast(`Restocked ${need} ${c.stockUnit} for ${money(cost)}.`);
  }

  function hire(id) {
    const s = v(id), c = cat(id);
    const ceil = staffCap(s, c);
    if (s.staff >= ceil) return toast("Every station is covered — upgrade to hire more.", true);
    const fee = Math.round(wageOf(id) * 2);
    if (!spend(s, fee, `${c.brand}: hire staff`)) return toast("Can't cover the hiring fee.", true);
    s.staff += 1;
    save(); render();
    toast(`Hired. Daily wage is now ${money(s.staff * wageOf(id))}.`);
  }

  function marketing(id) {
    const s = v(id), c = cat(id);
    const cost = Math.round(rentOf(id) * 0.9);
    if (!spend(s, cost, `${c.brand}: ad campaign`)) return toast("Can't afford a campaign right now.", true);
    s.marketing = 4;
    s.reputation = clamp(s.reputation + 1.5, 0, 100);
    save(); render();
    toast("Campaign live for 4 days — expect more feet, and more stock burn.");
  }

  function changePrice(id) {
    const s = v(id), c = cat(id);
    const next = window.prompt(`Price per ${c.unit} (cost of goods is about ${money(c.stockPrice)})\nHigher price = fewer sales, more margin.`, Math.round(s.price));
    if (next == null) return;
    const n = Math.round(Number(String(next).replace(/[^\d.]/g, "")));
    if (!Number.isFinite(n) || n <= 0) return toast("Enter a real price.", true);
    s.price = n;
    save(); render();
    toast(`Price set to ${money(n)} per ${c.unit}.`);
  }

  function upgrade(id, k) {
    const s = v(id), c = cat(id);
    const u = (c.upgrades || []).find(x => x.k === k);
    if (!u) return;
    const lvl = upLevel(s, c, k);
    if (lvl >= MAX_UPGRADE) return;
    const cost = Math.round(u.cost * Math.pow(1.55, lvl));
    if (!spend(s, cost, `${c.brand}: ${u.name} level ${lvl + 1}`)) return toast("Not enough cash for that upgrade.", true);
    s.upgrades[k] = lvl + 1;
    save(); render();
    toast(`${u.name} → level ${lvl + 1}.`);
  }

  function bank(id) {
    const s = v(id), c = cat(id);
    if (s.cash <= 0) return;
    const amount = Math.round(s.cash);
    earn(amount, `${c.brand}: takings banked`);
    s.cash = 0;
    save(); render();
    toast(`${money(amount)} moved to your account.`);
  }

  /* ---------------------------------------------------------
     Routing + events
     --------------------------------------------------------- */
  function open(id) {
    active = id;
    window.navigateTo("venture");
  }

  const prevNavigate = window.navigateTo;
  window.navigateTo = function (page) {
    if (page !== "venture") {
      if (active && typeof window.nuLimitsNoteNav === "function") {
        /* leaving the venture — nothing to tear down, the shell handles it */
      }
      return prevNavigate.apply(this, arguments);
    }
    if (typeof window.nuLimitsNoteNav === "function") window.nuLimitsNoteNav("venture");
    document.querySelectorAll(".nav-item").forEach(b =>
      b.classList.toggle("active", b.dataset.page === "business"));
    if (!active) active = Object.keys(CATALOG)[0];
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  };

  function editAction(act, id, el) {
    const s = v(id), c = cat(id);
    const ask = (label, current, parse) => {
      const raw = window.prompt(label, current);
      if (raw == null) return null;
      const n = parse ? parse(raw) : raw;
      if (n == null) { toast("That value doesn't work.", true); return null; }
      return n;
    };
    const numOf = raw => {
      const n = Math.round(Number(String(raw).replace(/[^\d.-]/g, "")));
      return Number.isFinite(n) ? n : null;
    };

    if (act === "name") {
      const v2 = ask("Business name", nameOf(id));
      if (v2 == null) return;
      s.editName = String(v2).slice(0, 48) || c.brand;
    } else if (act === "photo") {
      const url = window.prompt("Paste an image URL, or leave empty to upload a file", "");
      if (url == null) return;
      if (url.trim()) s.editPhoto = url.trim();
      else pickImage(src => { if (src) { s.editPhoto = src; save(); render(); toast("Cover updated."); } });
    } else if (act === "buy") {
      const n = ask("Purchase price", buyOf(id), numOf); if (n == null) return; s.editBuy = Math.max(0, n);
    } else if (act === "price") {
      const n = ask(`Unit price per ${c.unit}`, s.price, numOf); if (n == null) return; s.price = Math.max(1, n);
    } else if (act === "base") {
      const n = ask("Base price (what demand expects)", basePriceOf(id), numOf); if (n == null) return; s.editBase = Math.max(1, n);
    } else if (act === "rent") {
      const n = ask("Daily rent & overheads", rentOf(id), numOf); if (n == null) return; s.editRent = Math.max(0, n);
    } else if (act === "wage") {
      const n = ask("Staff wage per person per day", wageOf(id), numOf); if (n == null) return; s.editWage = Math.max(0, n);
    } else if (act === "cash") {
      const n = ask("Money in the till", Math.round(s.cash), numOf); if (n == null) return; s.cash = n;
    } else if (act === "stock") {
      const n = ask(`Stock (${c.stockUnit})`, s.stock, numOf); if (n == null) return; s.stock = clamp(n, 0, stockCap(s, c) * 3);
    } else if (act === "staff") {
      const n = ask("Staff on shift", s.staff, numOf); if (n == null) return; s.staff = clamp(n, 0, 20);
    } else if (act === "rep") {
      const n = ask("Reputation (0–100)", Math.round(s.reputation), numOf); if (n == null) return; s.reputation = clamp(n, 0, 100);
    } else if (act === "up-up" || act === "up-down") {
      const k = el.dataset.k;
      const lvl = upLevel(s, c, k) + (act === "up-up" ? 1 : -1);
      s.upgrades[k] = clamp(lvl, 0, MAX_UPGRADE);
    } else if (act === "fund") {
      s.cash += 50000;
      toast("R 50 000 added to the till.");
    } else if (act === "reset") {
      if (!window.confirm("Reset this business to how it shipped? (photo, name, money, upgrades)")) return;
      state.items[id] = freshVenture(id);
      save();
      if (window.nuLimitsBusinessesRefresh) window.nuLimitsBusinessesRefresh();
      render();
      toast("Business reset.");
      return;
    }
    save();
    if (window.nuLimitsBusinessesRefresh) window.nuLimitsBusinessesRefresh();
    render();
  }

  document.addEventListener("click", e => {
    const ve = e.target.closest("[data-ve]");
    if (ve && editOn()) { e.preventDefault(); editAction(ve.dataset.ve, ve.dataset.id, ve); return; }

    const open_ = e.target.closest("[data-vt-open]");
    if (open_) { e.preventDefault(); open(open_.dataset.vtOpen); return; }

    const el = e.target.closest("[data-vt]");
    if (!el) return;
    const act = el.dataset.vt, id = el.dataset.id;
    if (act === "buy") return doBuy(id);
    if (act === "restock") return restock(id);
    if (act === "hire") return hire(id);
    if (act === "marketing") return marketing(id);
    if (act === "price") return changePrice(id);
    if (act === "upgrade") return upgrade(id, el.dataset.k);
    if (act === "bank") return bank(id);
    if (act === "ve") return;

    if (act === "auto") {
      const st = v(id);
      st.autoRestock = !st.autoRestock;
      save(); render();
      toast(st.autoRestock ? "Standing supplier order on." : "Standing supplier order off.");
      return;
    }
  }, true);

  /* clock */
  window.setInterval(tick, 1000);

  const boot = () => { tick(); save(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  if (location.hash === "#venture") window.setTimeout(() => window.navigateTo("venture"), 420);

  /* ---------------------------------------------------------
     Public API — the Businesses page calls these
     --------------------------------------------------------- */

  /* keep the storefront in sync when Creator Edit Mode is toggled */
  if (window.nuLimitsEditMode && window.nuLimitsEditMode.onChange) {
    window.nuLimitsEditMode.onChange(() => {
      if (document.querySelector(".vt-page")) render();
    });
  }

  window.nuLimitsVentures = {
    get ids() { return Object.keys(CATALOG); },
    catalog: id => cat(id),
    state: id => v(id),
    money,
    list: listHTML,
    open,
    name: id => nameOf(id),
    photo: id => photoOf(id),
    buyOf: id => buyOf(id),
    save: () => save(),
    pickImage: cb => pickImage(cb),
    summary(id) {
      const s = v(id), c = cat(id);
      if (!s.owned) return { status: "For sale", cls: "", sub: `${money(buyOf(id))} capital required` };
      return {
        status: s.cash < 0 ? "Overdrawn" : "Trading",
        cls: s.cash < 0 ? "bad" : "good",
        sub: `${money(s.todayRevenue)} today · ${Math.round(s.reputation)} rep · ${money(s.cash)} till`
      };
    },
    buy: doBuy
  };
})();
