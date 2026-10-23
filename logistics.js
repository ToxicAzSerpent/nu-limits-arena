/* =========================================================
   NU LIMITS — LOGISTICS DEPOT  (Round 39)

   The courier business, built like a real fleet operation:

     · five trucks with real prices, payload, fuel burn and
       daily maintenance — buy the ones you want
     · drivers you hire (wage + skill)
     · destinations with real distances from the JHB depot —
       the longer the haul, the more fuel it burns
     · shipments that step Packed → Shipped → In Transit →
       Delivered and only pay out on delivery
     · fuel is paid at dispatch, maintenance every day

   State lives inside the ventures save (items.logistics).
   ========================================================= */

(function () {
  "use strict";

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const V = () => window.nuLimitsVentures || null;
  const money = n => (Number(n) < 0 ? "−R " : "R ") + Math.round(Math.abs(Number(n) || 0)).toLocaleString("en-ZA");
  const km = n => Math.round(Number(n) || 0).toLocaleString("en-ZA") + " km";
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const day = () => (window.nuLimitsWorld ? window.nuLimitsWorld.day : 1);
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const freePlay = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());
  const balance = () => (window.nuLimitsMoney ? window.nuLimitsMoney.getBalance() : 0);

  function toast(msg, bad) {
    let el = document.querySelector(".mn-toast");
    if (!el) { el = document.createElement("div"); el.className = "mn-toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.toggle("is-bad", !!bad);
    el.classList.add("show");
    clearTimeout(el.__t);
    el.__t = window.setTimeout(() => el.classList.remove("show"), 2800);
  }

  /* ---------------------------------------------------------
     Trucks
     --------------------------------------------------------- */
  const TRUCKS = {
    isuzu: {
      name: "Isuzu FTR 8-ton", klass: "Rigid · local runs", price: 420000,
      cap: 8, burn: 26, maint: 900, photo: "images/ventures/truck-fleet.jpg", rate: 1
    },
    freightliner: {
      name: "Freightliner Cascadia", klass: "Long-haul · 18-ton", price: 1250000,
      cap: 18, burn: 32, maint: 1800, photo: "images/ventures/logistics-hero.jpg", rate: 1.05
    },
    volvo: {
      name: "Volvo FH16 34-ton", klass: "Heavy haul", price: 2100000,
      cap: 34, burn: 38, maint: 2600, photo: "images/ventures/truck-fleet.jpg", rate: 1.1
    },
    scania: {
      name: "Scania R500 Reefer", klass: "Cold chain · 28-ton", price: 2650000,
      cap: 28, burn: 41, maint: 3100, photo: "images/ventures/logistics-hero.jpg", rate: 1.32
    },
    man: {
      name: "MAN TGS 40-ton", klass: "Abnormal load", price: 2400000,
      cap: 40, burn: 44, maint: 2900, photo: "images/ventures/truck-fleet.jpg", rate: 1.14
    }
  };

  /* ---------------------------------------------------------
     Destinations — distance from the Johannesburg depot
     --------------------------------------------------------- */
  const PLACES = {
    pretoria:  { city: "Pretoria, ZA",        km: 58 },
    polokwane:{ city: "Polokwane, ZA",        km: 330 },
    gaborone: { city: "Gaborone, BW",         km: 400 },
    bloem:    { city: "Bloemfontein, ZA",     km: 400 },
    durban:   { city: "Durban, ZA",           km: 570 },
    maputo:   { city: "Maputo, MZ",           km: 550 },
    capetown: { city: "Cape Town, ZA",        km: 1400 },
    windhoek: { city: "Windhoek, NA",         km: 1500 },
    harare:   { city: "Harare, ZW",           km: 1100 },
    lusaka:   { city: "Lusaka, ZM",           km: 1600 },
    nairobi:  { city: "Nairobi, KE",          km: 3800 }
  };

  const DRIVER_NAMES = ["Michael Johnson", "Thabo Mokoena", "Sipho Ndlovu", "Andile Khumalo",
    "Pieter van Wyk", "Kagiso Molefe", "Tendai Moyo", "Elias Shikongo", "Farai Chuma", "Johan Botha"];

  const STAGES = ["Packed", "Shipped", "In Transit", "Delivered"];

  /* ---------------------------------------------------------
     State helpers (stored on the ventures logistics record)
     --------------------------------------------------------- */
  function rec() {
    const v = V();
    if (!v) return null;
    const s = v.state("logistics");
    if (!s.fleet) s.fleet = [];
    if (!Array.isArray(s.drivers)) s.drivers = [];
    if (!Array.isArray(s.orders)) s.orders = [];
    if (!Number.isFinite(s.fuelPrice)) s.fuelPrice = 22.5;
    if (!Number.isFinite(s.lastShipDay)) s.lastShipDay = day();
    return s;
  }

  const truckOf = k => TRUCKS[k] || null;
  const priceOf = (s, k) => Number(s.truckPrices && s.truckPrices[k]) || TRUCKS[k].price;
  const fuelPrice = s => Number(s.fuelPrice) || 22.5;

  function fuelCost(s, t, distance) {
    return Math.round((distance / 100) * t.burn * fuelPrice(s));
  }

  function revenueFor(s, t, distance) {
    const perTonKm = 0.95 * (t.rate || 1);
    const baseFee = 1900;                       /* every load carries a consignment fee */
    return Math.round(baseFee + distance * 8 + distance * t.cap * perTonKm * 0.11);
  }

  function daysFor(distance) { return clamp(Math.round(distance / 700), 1, 6); }

  function orderId() {
    return "ORD-" + String(Math.floor(100000000 + Math.random() * 899999999));
  }

  /* ---------------------------------------------------------
     Tick — shipments advance one stage per game day
     --------------------------------------------------------- */
  function tick() {
    const s = rec();
    if (!s) return;
    const d = day();
    if (s.lastShipDay === d) return;
    const steps = Math.min(4, Math.max(1, d - s.lastShipDay));
    s.lastShipDay = d;
    let changed = false;

    /* daily maintenance on every owned truck */
    const upkeep = s.fleet.reduce((n, f) => n + (truckOf(f.truck) ? truckOf(f.truck).maint : 0), 0);
    if (upkeep > 0 && s.owned) {
      if (s.cash >= upkeep) s.cash -= upkeep;
      else if (balance() >= upkeep && window.nuLimitsMoney) {
        window.nuLimitsMoney.transact("expense", upkeep, "Logistics: fleet maintenance");
      } else s.cash -= upkeep;
      changed = true;
    }

    s.orders.forEach(o => {
      if (o.stage >= 3) return;
      const elapsed = d - o.day;
      const stage = clamp(1 + Math.floor((elapsed / Math.max(1, o.days)) * 3), 1, 2);
      const next = elapsed >= o.days ? 3 : stage;
      if (next !== o.stage) {
        o.stage = next;
        changed = true;
        if (next === 3) {
          const profit = Math.round(o.revenue - o.fuel - o.maintShare);
          s.cash += profit;
          s.todayRevenue = (s.todayRevenue || 0) + o.revenue;
          s.todayUnits = (s.todayUnits || 0) + 1;
          o.profit = profit;
        }
      }
    });

    if (changed) {
      V().save ? V().save() : null;
      if (document.querySelector(".lg-page")) render();
      if (window.nuLimitsBusinessesRefresh) window.nuLimitsBusinessesRefresh();
    }
  }

  /* ---------------------------------------------------------
     Page
     --------------------------------------------------------- */
  function bar(label, pct, note, cls) {
    const p = clamp(Math.round(pct), 0, 100);
    return `<div class="vt-bar ${cls || ""}">
      <div class="vt-bar-top"><span>${esc(label)}</span><b>${p}%</b></div>
      <div class="vt-track"><i style="width:${p}%"></i></div>
      ${note ? `<small>${esc(note)}</small>` : ""}
    </div>`;
  }

  const village = v => v;  /* noop keeps template lines readable */

  function pipeline(stage) {
    return `<div class="lg-pipe">
      ${STAGES.map((s, i) => `<span class="lg-step ${i <= stage ? "on" : ""} ${i === stage ? "now" : ""}">
        <i></i><b>${s}</b></span>`).join("")}
    </div>`;
  }

  function orderCard(s, o) {
    const t = truckOf(o.truck);
    const stageName = STAGES[o.stage] || "Packed";
    const cls = o.stage >= 3 ? "is-done" : o.stage === 2 ? "is-transit" : "";
    return `<article class="lg-order ${cls}">
      <header class="lg-order-top">
        <code>${esc(o.id)}</code>
        <span class="lg-status s${o.stage}">${stageName}</span>
      </header>
      <div class="lg-route">
        <div><small>FROM</small><b>${esc(o.from)}</b></div>
        <span class="lg-arrow" aria-hidden="true">→</span>
        <div><small>TO</small><b>${esc(o.to)}</b></div>
      </div>
      <div class="lg-meta">
        <span><small>TRUCK</small>${esc(t ? t.name : o.truck)}</span>
        <span><small>DRIVER</small>${esc(o.driver || "—")}</span>
        <span><small>DISTANCE</small>${km(o.km)}</span>
      </div>
      <div class="lg-money">
        <span>Fuel <b class="bad">−${money(o.fuel)}</b></span>
        <span>Revenue <b class="good">${money(o.revenue)}</b></span>
        <span>Est. days <b>${o.days}</b></span>
      </div>
      ${pipeline(o.stage)}
      ${o.stage >= 3 && o.profit != null ? `<p class="lg-paid">Delivered — ${money(o.profit)} paid into the till</p>` : ""}
    </article>`;
  }

  function page(id) {
    const s = rec();
    if (!s) return "";
    const c = V().catalog(id);
    const fleetCards = Object.keys(TRUCKS).map(k => {
      const t = TRUCKS[k];
      const owned = s.fleet.filter(f => f.truck === k).length;
      const price = priceOf(s, k);
      return `<article class="lg-truck">
        <div class="lg-truck-art" style="background-image:url('${esc(t.photo)}')">
          <span class="lg-truck-veil"></span>
          <span class="lg-truck-class">${esc(t.klass)}</span>
          ${owned ? `<span class="lg-truck-owned">${owned} owned</span>` : ""}
        </div>
        <div class="lg-truck-body">
          <b>${esc(t.name)}</b>
          <div class="lg-specs">
            <span>${t.cap} t payload</span><span>${t.burn} L/100 km</span><span>${money(t.maint)}/day</span>
          </div>
          <button type="button" class="lg-buy" data-lg="buy-truck" data-k="${k}">
            ${owned ? "Buy another" : "Buy truck"} · ${money(price)}
          </button>
        </div>
      </article>`;
    }).join("");

    const drivers = s.drivers.length
      ? s.drivers.map((d, i) => `<div class="lg-driver">
          <span class="lg-avatar">${esc((d.name || "?").split(" ").map(x => x[0]).join("").slice(0, 2))}</span>
          <div class="lg-driver-txt"><b>${esc(d.name)}</b><small>Skill ${d.skill}/5 · ${money(d.wage)}/day</small></div>
          <span class="lg-driver-state ${d.busy ? "busy" : ""}">${d.busy ? "On route" : "Available"}</span>
        </div>`).join("")
      : `<p class="vt-fine">No drivers yet — hire one before you dispatch a truck.</p>`;

    const freeTrucks = s.fleet.filter(f => !f.busy);
    const freeDrivers = s.drivers.filter(d => !d.busy);
    const dests = Object.keys(PLACES).map(k =>
      `<option value="${k}">${PLACES[k].city} · ${km(PLACES[k].km)}</option>`).join("");

    const activeOrders = s.orders.filter(o => o.stage < 3);
    const doneOrders = s.orders.filter(o => o.stage >= 3).slice(-4).reverse();

    return `<section class="dynamic-page-content vt-page lg-page">
      ${editOn() ? editStrip(s) : ""}
      <div class="vt-hero" style="background-image:url('${esc(V().photo(id))}')">
        <span class="vt-hero-veil"></span>
        <div class="vt-hero-body">
          <p class="vt-hero-kicker">${esc(c.kicker)} · TRADING</p>
          <h1>${esc(V().name(id))}</h1>
          <p>${s.fleet.length} truck${s.fleet.length === 1 ? "" : "s"} · ${s.drivers.length} driver${s.drivers.length === 1 ? "" : "s"} · depot in Johannesburg</p>
        </div>
        <div class="vt-hero-stats">
          <span><small>TILL</small><b>${money(s.cash)}</b></span>
          <span><small>LOADS</small><b>${activeOrders.length}</b></span>
        </div>
      </div>

      <div class="vt-metrics">
        ${bar("Fleet utilisation", s.fleet.length ? (s.fleet.filter(f => f.busy).length / s.fleet.length) * 100 : 0,
          `${s.fleet.filter(f => f.busy).length} of ${s.fleet.length} trucks on the road`, "is-stock")}
        ${bar("Drivers available", s.drivers.length ? (freeDrivers.length / s.drivers.length) * 100 : 0,
          `${freeDrivers.length} of ${s.drivers.length} free`, "is-staff")}
        ${bar("Fuel price", ((fuelPrice(s) - 18) / 12) * 100, `${money(fuelPrice(s))} per litre`, "is-day")}
      </div>

      <div class="vt-panel">
        <div class="vt-panel-head"><h3>Dispatch a shipment</h3><span>${freeTrucks.length} truck(s) ready</span></div>
        ${s.fleet.length === 0 ? `<p class="vt-fine">Buy a truck first.</p>` : `
        <div class="lg-form">
          <label>Truck
            <select data-lg-truck>
              ${s.fleet.every(f => f.busy) ? `<option value="">every truck is on a route</option>` : ""}
              ${s.fleet.map((f, i) => {
                const t = truckOf(f.truck);
                return `<option value="${i}" ${f.busy ? "disabled" : ""}>${esc(t ? t.name : f.truck)} · ${t ? t.cap : 0} t ${f.busy ? "· on route" : ""}</option>`;
              }).join("")}
            </select>
          </label>
          <label>Driver
            <select data-lg-driver>
              ${s.drivers.length === 0 ? `<option value="">hire a driver first</option>`
                : s.drivers.every(d => d.busy) ? `<option value="">every driver is on a route</option>` : ""}
              ${s.drivers.map((d, i) => `<option value="${i}" ${d.busy ? "disabled" : ""}>${esc(d.name)} · skill ${d.skill} ${d.busy ? "· on route" : ""}</option>`).join("")}
            </select>
          </label>
          <label>Destination
            <select data-lg-dest>${dests}</select>
          </label>
          <div class="lg-quote" data-lg-quote></div>
          <button type="button" class="lg-dispatch" data-lg="dispatch"
            ${freeTrucks.length && freeDrivers.length ? "" : "disabled"}>
            ${freeTrucks.length && freeDrivers.length ? "Dispatch load" : "Nothing free to dispatch"}
          </button>
        </div>`}
      </div>

      <div class="vt-panel">
        <div class="vt-panel-head"><h3>On the road</h3><span>${activeOrders.length} load${activeOrders.length === 1 ? "" : "s"}</span></div>
        <div class="lg-orders">
          ${activeOrders.length ? activeOrders.map(o => orderCard(s, o)).join("") : `<p class="vt-fine">No loads out. Dispatch one above.</p>`}
        </div>
      </div>

      ${doneOrders.length ? `<div class="vt-panel">
        <div class="vt-panel-head"><h3>Delivered</h3><span>last ${doneOrders.length}</span></div>
        <div class="lg-orders">${doneOrders.map(o => orderCard(s, o)).join("")}</div>
      </div>` : ""}

      <div class="vt-panel">
        <div class="vt-panel-head"><h3>Fleet for sale</h3><span>${s.fleet.length} in the yard</span></div>
        <div class="lg-fleet">${fleetCards}</div>
      </div>

      <div class="vt-panel">
        <div class="vt-panel-head"><h3>Drivers</h3><span>${s.drivers.length} on the books</span></div>
        ${drivers}
        <button type="button" class="vt-btn" data-lg="hire-driver" style="margin-top:10px">
          Hire a driver · ${money(2800)} hiring fee
        </button>
      </div>

      <button class="secondary-button" type="button" data-page="home" style="margin-top:18px">← Back to businesses</button>
    </section>`;
  }

  function editStrip(s) {
    return `<div class="ve-panel" style="margin-bottom:12px">
      <div class="ve-head"><span class="ve-dot"></span><b>Edit Mode</b><small>logistics numbers</small></div>
      <div class="ve-row"><div class="ve-lab"><b>Business name</b><small>list and page</small></div>
        <button type="button" class="ve-val" data-lg="e-name">${esc(V().name("logistics"))}</button></div>
      <div class="ve-row"><div class="ve-lab"><b>Cover photo</b><small>file or URL</small></div>
        <button type="button" class="ve-val" data-lg="e-photo">Change photo</button></div>
      <div class="ve-row"><div class="ve-lab"><b>Diesel price</b><small>per litre</small></div>
        <button type="button" class="ve-val" data-lg="e-fuel">${money(fuelPrice(s))}</button></div>
      <div class="ve-row"><div class="ve-lab"><b>Money in the till</b><small>depot cash</small></div>
        <button type="button" class="ve-val" data-lg="e-cash">${money(s.cash)}</button></div>
      <div class="ve-row"><div class="ve-lab"><b>Reputation</b><small>drives demand</small></div>
        <button type="button" class="ve-val" data-lg="e-rep">${Math.round(s.reputation)} / 100</button></div>
      <div class="ve-row"><div class="ve-lab"><b>Purchase price</b><small>business buy-in</small></div>
        <button type="button" class="ve-val" data-lg="e-buy">${money(V().buyOf("logistics"))}</button></div>
    </div>`;
  }

  /* ---------------------------------------------------------
     Actions
     --------------------------------------------------------- */
  function spend(s, amount, label) {
    if (freePlay()) return true;
    if (s.cash >= amount) { s.cash -= amount; return true; }
    const rest = amount - Math.max(0, s.cash);
    s.cash = Math.min(0, s.cash);
    return window.nuLimitsMoney ? window.nuLimitsMoney.transact("expense", rest, label) : false;
  }

  function buyTruck(k) {
    const s = rec();
    const t = truckOf(k);
    if (!t) return;
    const price = priceOf(s, k);
    if (!spend(s, price, `Logistics: bought ${t.name}`)) return toast("Not enough cash for that truck.", true);
    s.fleet.push({ truck: k, busy: false, order: null });
    V().save();
    render();
    toast(`${t.name} added to the yard.`);
  }

  function hireDriver() {
    const s = rec();
    const fee = 2800;
    if (!spend(s, fee, "Logistics: driver hiring fee")) return toast("Can't cover the hiring fee.", true);
    const used = s.drivers.map(d => d.name);
    const name = DRIVER_NAMES.filter(n => !used.includes(n))[0] || "Driver " + (s.drivers.length + 1);
    const skill = clamp(Math.round(2 + Math.random() * 4), 1, 5);
    s.drivers.push({ name, skill, wage: 900 + skill * 240, busy: false });
    V().save();
    render();
    toast(`${name} hired — skill ${skill}/5.`);
  }

  function currentQuote() {
    const s = rec();
    const tSel = document.querySelector("[data-lg-truck]");
    const dSel = document.querySelector("[data-lg-dest]");
    if (!s || !tSel || !dSel) return null;
    const idx = Number(tSel.value);
    const f = s.fleet[idx];
    if (!f) return null;
    const t = truckOf(f.truck);
    const place = PLACES[dSel.value];
    if (!t || !place) return null;
    const fuel = fuelCost(s, t, place.km);
    const revenue = revenueFor(s, t, place.km);
    const days = daysFor(place.km);
    return { f, t, place, fuel, revenue, days, idx, destKey: dSel.value };
  }

  function paintQuote() {
    const box = document.querySelector("[data-lg-quote]");
    const q = currentQuote();
    if (!box || !q) return;
    const maintShare = Math.round(q.t.maint * q.days);
    const profit = q.revenue - q.fuel - maintShare;
    box.innerHTML = `
      <div class="lg-quote-row"><span>Distance</span><b>${km(q.place.km)}</b></div>
      <div class="lg-quote-row"><span>Fuel (${q.t.burn} L/100 km @ ${money(fuelPrice(rec()))})</span><b class="bad">−${money(q.fuel)}</b></div>
      <div class="lg-quote-row"><span>Maintenance (${q.days} day${q.days === 1 ? "" : "s"})</span><b class="bad">−${money(maintShare)}</b></div>
      <div class="lg-quote-row"><span>Freight revenue</span><b class="good">${money(q.revenue)}</b></div>
      <div class="lg-quote-row is-total"><span>Expected profit</span><b class="${profit >= 0 ? "good" : "bad"}">${money(profit)}</b></div>`;
  }

  function dispatch() {
    const s = rec();
    const q = currentQuote();
    if (!q) return toast("Pick a truck and a destination.", true);
    const dSel = document.querySelector("[data-lg-driver]");
    const dIdx = dSel ? Number(dSel.value) : NaN;
    const driver = s.drivers[dIdx];
    if (!driver) return toast("Hire a driver first.", true);
    if (q.f.busy) return toast("That truck is already on a route.", true);
    if (driver.busy) return toast("That driver is already on a route.", true);
    if (!spend(s, q.fuel, `Logistics: fuel to ${q.place.city}`)) return toast("Can't cover the diesel.", true);

    const order = {
      id: orderId(),
      truck: q.f.truck,
      driver: driver.name,
      from: "Johannesburg depot",
      to: q.place.city,
      km: q.place.km,
      fuel: q.fuel,
      revenue: q.revenue,
      maintShare: Math.round(q.t.maint * q.days),
      days: q.days,
      stage: 0,
      day: day()
    };
    s.orders.unshift(order);
    q.f.busy = true;
    driver.busy = true;
    order.fleetIndex = q.idx;
    order.driverIndex = dIdx;
    V().save();
    render();
    toast(`${order.id} loaded for ${q.place.city} — ${km(q.place.km)}.`);
  }

  /* free the truck + driver when an order lands */
  function releaseResources() {
    const s = rec();
    s.orders.forEach(o => {
      if (o.stage < 3 || o.released) return;
      o.released = true;
      if (s.fleet[o.fleetIndex]) s.fleet[o.fleetIndex].busy = false;
      if (s.drivers[o.driverIndex]) s.drivers[o.driverIndex].busy = false;
    });
  }

  function editAction(act) {
    const s = rec();
    const ask = (label, current) => {
      const raw = window.prompt(label, current);
      return raw == null ? null : raw;
    };
    const numOf = raw => {
      const n = Math.round(Number(String(raw).replace(/[^\d.-]/g, "")));
      return Number.isFinite(n) ? n : null;
    };
    if (act === "e-name") {
      const v = ask("Business name", V().name("logistics"));
      if (v == null) return;
      s.editName = String(v).slice(0, 48) || "NU Limits Logistics";
    } else if (act === "e-photo") {
      const url = ask("Image URL (leave empty to upload a file)", "");
      if (url == null) return;
      if (url.trim()) s.editPhoto = url.trim();
      else V().pickImage(src => { if (src) { s.editPhoto = src; V().save(); render(); } });
    } else if (act === "e-fuel") {
      const n = numOf(ask("Diesel price per litre (rand)", Math.round(fuelPrice(s))));
      if (n == null) return;
      s.fuelPrice = clamp(n, 5, 120);
    } else if (act === "e-cash") {
      const n = numOf(ask("Money in the till", Math.round(s.cash)));
      if (n == null) return;
      s.cash = n;
    } else if (act === "e-rep") {
      const n = numOf(ask("Reputation (0–100)", Math.round(s.reputation)));
      if (n == null) return;
      s.reputation = clamp(n, 0, 100);
    } else if (act === "e-buy") {
      const n = numOf(ask("Business purchase price", V().buyOf("logistics")));
      if (n == null) return;
      s.editBuy = Math.max(0, n);
    }
    V().save();
    render();
    if (window.nuLimitsBusinessesRefresh) window.nuLimitsBusinessesRefresh();
  }

  /* ---------------------------------------------------------
     Wiring
     --------------------------------------------------------- */
  function render() {
    const dp = document.getElementById("dynamic-page");
    if (!dp || !dp.querySelector(".lg-page")) return;
    const keep = window.scrollY;
    dp.innerHTML = page("logistics");
    window.scrollTo({ top: keep });
    paintQuote();
  }

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-lg]");
    if (!el) return;
    const act = el.dataset.lg;
    if (act === "buy-truck") { e.preventDefault(); return buyTruck(el.dataset.k); }
    if (act === "hire-driver") { e.preventDefault(); return hireDriver(); }
    if (act === "dispatch") { e.preventDefault(); releaseResources(); return dispatch(); }
    if (act.indexOf("e-") === 0) { e.preventDefault(); return editAction(act); }
  });

  document.addEventListener("change", e => {
    if (e.target.closest("[data-lg-truck], [data-lg-dest]")) paintQuote();
  });

  window.setInterval(tick, 1200);
  window.setInterval(() => { if (document.querySelector(".lg-page")) paintQuote(); }, 2500);

  const boot = () => {
    const s = rec();
    if (!s) return;
    if (!Array.isArray(s.fleet)) s.fleet = [];
    releaseResources();
    tick();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();


  /* keep the storefront in sync when Creator Edit Mode is toggled */
  if (window.nuLimitsEditMode && window.nuLimitsEditMode.onChange) {
    window.nuLimitsEditMode.onChange(() => {
      if (document.querySelector(".lg-page")) render();
    });
  }

  window.nuLimitsLogistics = { page, tick, trucks: TRUCKS, places: PLACES, fuelCost, revenueFor };
})();
