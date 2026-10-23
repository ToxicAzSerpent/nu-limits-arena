/* =========================================================
   NU LIMITS — NU ROAST COFFEE  (Round 41)

   A real coffee house:
     · storefront with categories, promo banner, popular items
     · menu cards with covers, prices, discounts, stock states
     · delivery tracking with Los Angeles routes, drivers and
       progress bars that actually fill as the day passes
     · staff, books (rent, VAT, electricity, water, wages),
       rewards, reviews and upgrades

   Everything is editable in Creator Edit Mode.
   State lives in the ventures save (items.coffee).
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
  const uid = p => (p || "cf") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);

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
     Seeds — English names only
     --------------------------------------------------------- */
  const CATS = ["Hot coffee", "Iced coffee", "Frappe", "Desserts", "More"];

  const MENU = [
    { name: "Cappuccino", cat: "Hot coffee", price: 45, discount: 0, desc: "Perfect balance of espresso, steamed milk and foam.", img: "images/coffee/cappuccino.jpg", stock: true, popular: true },
    { name: "Latte", cat: "Hot coffee", price: 48, discount: 10, desc: "Smooth espresso with steamed milk.", img: "images/coffee/latte2.jpg", stock: true, popular: true },
    { name: "Mocha", cat: "Hot coffee", price: 55, discount: 0, desc: "Chocolate espresso and steamed milk.", img: "images/coffee/mocha.jpg", stock: true, popular: true },
    { name: "Americano", cat: "Hot coffee", price: 38, discount: 0, desc: "Rich espresso with hot water.", img: "images/coffee/americano.jpg", stock: true, popular: true },
    { name: "Flat White", cat: "Hot coffee", price: 50, discount: 0, desc: "Ristretto shots with silky microfoam.", img: "images/coffee/flat-white.jpg", stock: true },
    { name: "Iced Americano", cat: "Iced coffee", price: 42, discount: 15, desc: "Double shot over ice, clean and cold.", img: "images/coffee/iced-americano.jpg", stock: true },
    { name: "Iced Latte", cat: "Iced coffee", price: 52, discount: 0, desc: "Cold milk, espresso, plenty of ice.", img: "images/coffee/iced-latte.jpg", stock: true },
    { name: "Cold Brew", cat: "Iced coffee", price: 58, discount: 0, desc: "Steeped 18 hours, smooth and strong.", img: "images/coffee/cold-brew.jpg", stock: true },
    { name: "Caramel Frappe", cat: "Frappe", price: 62, discount: 20, desc: "Blended caramel, milk and whipped cream.", img: "images/coffee/frappe-caramel.jpg", stock: true },
    { name: "Mocha Frappe", cat: "Frappe", price: 64, discount: 0, desc: "Chocolate blended with espresso and ice.", img: "images/coffee/frappe-mocha.jpg", stock: false },
    { name: "Butter Croissant", cat: "Desserts", price: 35, discount: 0, desc: "Baked this morning, flaky and warm.", img: "images/coffee/croissant.jpg", stock: true },
    { name: "Chocolate Brownie", cat: "Desserts", price: 42, discount: 10, desc: "Dense dark chocolate, sea salt on top.", img: "images/coffee/brownie.jpg", stock: true },
    { name: "Cheesecake Slice", cat: "Desserts", price: 48, discount: 0, desc: "Baked vanilla cheesecake, berry coulis.", img: "images/coffee/cheesecake.jpg", stock: true },
    { name: "Cinnamon Roll", cat: "Desserts", price: 38, discount: 0, desc: "Soft dough, cinnamon sugar glaze.", img: "images/coffee/cinnamon-roll.jpg", stock: false },
    { name: "Hot Chocolate", cat: "More", price: 45, discount: 0, desc: "Steamed milk with 70% cocoa.", img: "images/coffee/hot-chocolate.jpg", stock: true },
    { name: "Chai Latte", cat: "More", price: 47, discount: 0, desc: "Spiced black tea and steamed milk.", img: "images/coffee/chai-latte.jpg", stock: true }
  ];

  /* Los Angeles / California delivery routes */
  const ROUTES = {
    hollywood:   { place: "Hollywood, Los Angeles", km: 8 },
    downtown:    { place: "Downtown Los Angeles", km: 5 },
    beverly:     { place: "Beverly Hills", km: 11 },
    santamonica: { place: "Santa Monica", km: 19 },
    venice:      { place: "Venice Beach", km: 22 },
    pasadena:    { place: "Pasadena", km: 17 },
    longbeach:   { place: "Long Beach", km: 34 },
    anaheim:     { place: "Anaheim", km: 43 },
    huntington:  { place: "Huntington Beach", km: 52 }
  };

  const DRIVER_SEED = ["Michael Johnson", "Sarah Williams", "David Brown", "Emily Davis"];

  const REVIEW_SEED = [
    { name: "Michael Johnson", stars: 5, text: "Best flat white in Los Angeles. The queue moves fast.", item: "Flat White" },
    { name: "Sarah Williams", stars: 4, text: "Caramel frappe is unreal — a little sweet for me.", item: "Caramel Frappe" },
    { name: "David Brown", stars: 5, text: "Ordered delivery to Santa Monica, arrived hot and on time.", item: "Latte" },
    { name: "Emily Davis", stars: 3, text: "Croissant was sold out by 11am. Coffee was great though.", item: "Butter Croissant" }
  ];

  const STAGES = ["Confirmed", "Preparing", "On the way", "Delivered"];

  /* ---------------------------------------------------------
     Record
     --------------------------------------------------------- */
  function rec() {
    const v = V();
    if (!v) return null;
    const s = v.state("coffee");
    if (!Array.isArray(s.cats) || !s.cats.length) s.cats = CATS.slice();
    if (!Array.isArray(s.menu)) s.menu = MENU.map(m => Object.assign({ id: uid("it") }, m));
    if (!Array.isArray(s.staffList)) s.staffList = [{ name: DRIVER_SEED[0], role: "Barista", skill: 4, wage: 1150 }];
    if (!Array.isArray(s.orders)) s.orders = [];
    if (!Array.isArray(s.reviews) || !s.reviews.length) s.reviews = REVIEW_SEED.map(r => Object.assign({ id: uid("rv"), day: 1 }, r));
    if (!s.expenses) s.expenses = { rent: 2400, electricity: 620, water: 180, vat: 15, beans: 340 };
    if (!Number.isFinite(s.points)) s.points = 120;
    if (!s.promo) s.promo = { title: "Flat 20% Off", sub: "On all orders above R 120", img: "images/coffee/cafe-promo.jpg" };
    if (!s.tab) s.tab = "store";
    if (typeof s.cat !== "string") s.cat = "";
    if (!s.greeting) s.greeting = "Good morning, boss";
    if (!Number.isFinite(s.deliveries)) s.deliveries = 0;
    if (!Number.isFinite(s.ratingTotal)) s.ratingTotal = s.reviews.reduce((n, r) => n + r.stars, 0);
    if (!Number.isFinite(s.ratingCount)) s.ratingCount = s.reviews.length;
    return s;
  }

  const priceOf = (it, st) => {
    const s2 = st || rec();
    const promo = s2 && s2.promoActive ? 0.8 : 1;
    return Math.max(0, Math.round(it.price * (1 - (Number(it.discount) || 0) / 100) * promo));
  };
  const itemsOf = (s, cat) => s.menu.filter(m => m.cat === cat);

  /* ---------------------------------------------------------
     Bars + route strip
     --------------------------------------------------------- */
  function bar(label, pct, note, cls) {
    const p = clamp(Math.round(pct), 0, 100);
    return `<div class="vt-bar ${cls || ""}">
      <div class="vt-bar-top"><span>${esc(label)}</span><b>${p}%</b></div>
      <div class="vt-track"><i style="width:${p}%"></i></div>
      ${note ? `<small>${esc(note)}</small>` : ""}
    </div>`;
  }

  function routeStrip(o) {
    const pct = o.progress || 0;
    return `<div class="cf-route">
      <div class="cf-route-line"><i style="width:${clamp(pct, 2, 100)}%"></i>
        <span class="cf-route-scooter" style="left:${clamp(pct, 2, 98)}%"></span>
      </div>
      <div class="cf-route-dots">
        ${STAGES.map((st, i) => `<span class="${pct >= (i / 3) * 100 ? "on" : ""}">
          <i></i><b>${st}</b></span>`).join("")}
      </div>
      <p class="cf-route-eta">${o.stage >= 3 ? "Delivered" : `Arriving in ${o.eta}–${o.eta + 6} minutes · ${o.km} km`}</p>
    </div>`;
  }

  /* ---------------------------------------------------------
     Tabs
     --------------------------------------------------------- */
  function tabsHTML(s) {
    const t = [
      ["store", "Store"], ["orders", "Delivery"], ["staff", "Staff"],
      ["books", "Books"], ["reviews", "Reviews"], ["upgrades", "Upgrades"]
    ];
    return `<div class="cf-tabs">
      ${t.map(([k, label]) => `<button type="button" class="cf-tab${s.tab === k ? " is-on" : ""}" data-cf="tab" data-t="${k}">${label}</button>`).join("")}
    </div>`;
  }

  /* ---------------- store ---------------- */
  function storeView(s) {
    const cat = s.cat || "";
    const pop = s.menu.filter(m => m.popular).slice(0, 4);
    const list = cat ? itemsOf(s, cat) : s.menu;
    const rating = s.ratingCount ? (s.ratingTotal / s.ratingCount).toFixed(1) : "—";

    return `
      <div class="cf-top">
        <div>
          <p class="cf-hello">${esc(s.greeting)}</p>
          <h1>What would you like<br>to drink today?</h1>
        </div>
        <span class="cf-rating">★ ${rating}</span>
      </div>

      <div class="cf-search">
        <span aria-hidden="true">⌕</span>
        <input type="search" placeholder="Search coffee, drinks, desserts" data-cf-search>
      </div>

      <section class="cf-promo" style="background-image:url('${esc(s.promo.img || "")}')">
        <span class="cf-promo-veil"></span>
        ${editOn() ? `<button class="cf-promo-edit" type="button" data-cf="e-promo">Edit promo</button>` : ""}
        <div class="cf-promo-body">
          <small>${esc(s.promo.sub)}</small>
          <h2>${esc(s.promo.title)}</h2>
          <button type="button" class="cf-promo-cta" data-cf="order-now">${s.promoActive ? "20% off applied · remove" : "Order now →"}</button>
        </div>
      </section>

      <div class="cf-section-head">
        <h3>Popular now</h3><span>${pop.length} items</span>
      </div>
      <div class="cf-rail">
        ${pop.map(m => `<button class="cf-pop" type="button" data-cf="open-item" data-id="${m.id}">
          <span class="cf-pop-art" style="background-image:url('${esc(m.img || "")}')">
            ${Number(m.discount) > 0 ? `<i>−${m.discount}%</i>` : ""}
            ${!m.stock ? `<em>Sold out</em>` : ""}
          </span>
          <b>${esc(m.name)}</b>
          <small>${money(priceOf(m, s))}</small>
        </button>`).join("")}
      </div>

      <div class="cf-rewards">
        <span class="cf-rewards-ico">NU</span>
        <div><b>${s.points} points</b><small>Brew 10 to earn 120 points</small></div>
        <button type="button" data-cf="redeem">Redeem</button>
      </div>

      <div class="cf-section-head"><h3>Categories</h3><span>${s.cats.length}</span></div>
      <div class="cf-cats">
        <button class="cf-cat${!cat ? " is-on" : ""}" type="button" data-cf="cat" data-c=""><span>A</span><b>All</b></button>
        ${s.cats.map(c => `<button class="cf-cat${c === cat ? " is-on" : ""}" type="button" data-cf="cat" data-c="${esc(c)}">
          <span>${esc(c.split(" ")[0][0])}</span><b>${esc(c)}</b>
          ${editOn() ? `<i class="cf-cat-x" data-cf="del-cat" data-c="${esc(c)}">✕</i>` : ""}
        </button>`).join("")}
        ${editOn() ? `<button class="cf-cat cf-cat-add" type="button" data-cf="add-cat"><span>+</span><b>Slot</b></button>` : ""}
      </div>

      <div class="cf-section-head"><h3>${esc(cat || "All items")}</h3><span>${list.length} item${list.length === 1 ? "" : "s"}</span></div>
      <div class="cf-items">
        ${list.map(m => itemRow(s, m)).join("")}
        ${editOn() ? `<button class="cf-item-add" type="button" data-cf="add-item"><span>+</span><b>Add item</b><small>photo · name · price</small></button>` : ""}
      </div>`;
  }

  function itemRow(s, m) {
    return `<article class="cf-item${m.stock ? "" : " is-out"}">
      <span class="cf-item-art" style="background-image:url('${esc(m.img || "")}')">
        ${editOn() ? `<i class="cf-item-swap" data-cf="swap-item" data-id="${m.id}">⇄</i>` : ""}
      </span>
      <div class="cf-item-txt">
        <b>${esc(m.name)}</b>
        <small>${esc(m.desc || "")}</small>
        <div class="cf-item-price">
          <span class="cf-now">${money(priceOf(m, s))}</span>
          ${Number(m.discount) > 0 ? `<span class="cf-was">${money(m.price)}</span><span class="cf-off">−${m.discount}%</span>` : ""}
          <span class="cf-stock ${m.stock ? "in" : "out"}">${m.stock ? "In stock" : "Out of stock"}</span>
        </div>
        ${editOn() ? `<div class="cf-item-edit">
          <button type="button" data-cf="e-item" data-id="${m.id}">Edit</button>
          <button type="button" data-cf="e-price" data-id="${m.id}">Price</button>
          <button type="button" data-cf="e-off" data-id="${m.id}">Discount</button>
          <button type="button" data-cf="e-stock" data-id="${m.id}">${m.stock ? "Mark out" : "Mark in"}</button>
          <button type="button" data-cf="del-item" data-id="${m.id}">✕</button>
        </div>` : ""}
      </div>
      <button class="cf-item-add-btn" type="button" data-cf="order-item" data-id="${m.id}" ${m.stock ? "" : "disabled"}>+</button>
    </article>`;
  }

  /* ---------------- delivery ---------------- */
  function ordersView(s) {
    const live = s.orders.filter(o => o.stage < 3);
    const done = s.orders.filter(o => o.stage >= 3).slice(-4).reverse();
    const drivers = s.staffList.filter(p => p.role === "Driver" || p.role === "Barista");

    return `
      <div class="cf-section-head" style="margin-top:4px"><h3>Deliveries</h3><span>${live.length} active</span></div>
      <div class="vt-panel" style="margin-top:0">
        <div class="vt-panel-head"><h3>Send an order</h3><span>Los Angeles routes</span></div>
        <div class="lg-form">
          <label>Destination
            <select data-cf-dest>
              ${Object.keys(ROUTES).map(k => `<option value="${k}">${ROUTES[k].place} · ${ROUTES[k].km} km</option>`).join("")}
            </select>
          </label>
          <label>Driver
            <select data-cf-driver>
              ${drivers.length ? drivers.map((d, i) => `<option value="${i}">${esc(d.name)}</option>`).join("") : `<option value="">hire staff first</option>`}
            </select>
          </label>
          <button class="lg-dispatch" type="button" data-cf="dispatch">Dispatch delivery</button>
        </div>
      </div>

      ${live.length ? live.map(o => `
        <div class="cf-order">
          <header><code>${esc(o.id)}</code><span class="cf-order-state">${STAGES[o.stage]}</span></header>
          <div class="cf-order-route"><b>${esc(o.from)}</b><span>→</span><b>${esc(o.place)}</b></div>
          <div class="cf-order-meta"><span>${esc(o.driver)}</span><span>${o.km} km</span><span>${money(o.total)}</span></div>
          ${routeStrip(o)}
          ${bar("Progress", o.progress, `${STAGES[o.stage]} · ${Math.round(o.progress)}% of the route`, "is-day")}
        </div>`).join("") : `<p class="vt-fine">No deliveries running. Dispatch one above.</p>`}

      ${done.length ? `<div class="cf-section-head"><h3>Delivered today</h3><span>${done.length}</span></div>
        ${done.map(o => `<div class="cf-order is-done">
          <header><code>${esc(o.id)}</code><span class="cf-order-state done">Delivered</span></header>
          <div class="cf-order-route"><b>${esc(o.from)}</b><span>→</span><b>${esc(o.place)}</b></div>
          <div class="cf-order-meta"><span>${esc(o.driver)}</span><span>${o.km} km</span><span class="good">${money(o.total)}</span></div>
        </div>`).join("")}` : ""}

      <div class="vt-metrics" style="margin-top:12px">
        ${bar("Deliveries completed", clamp((s.deliveries / 20) * 100, 0, 100), `${s.deliveries} today`, "is-stock")}
        ${bar("On-time rate", s.deliveries ? clamp(78 + (s.reputation - 50) * 0.4, 0, 100) : 0, "based on reputation", "is-rep")}
      </div>
      <button class="secondary-button" type="button" data-page="home" style="margin-top:18px">← Back to businesses</button>`;
  }

  /* ---------------- staff ---------------- */
  function staffView(s) {
    const payroll = s.staffList.reduce((n, p) => n + p.wage, 0);
    return `
      <div class="cf-section-head" style="margin-top:4px"><h3>Staff</h3><span>${s.staffList.length} on the books</span></div>
      ${s.staffList.map((p, i) => `<div class="lg-driver">
        <span class="lg-avatar">${esc((p.name || "?").split(" ").map(x => x[0]).join("").slice(0, 2))}</span>
        <div class="lg-driver-txt"><b>${esc(p.name)}</b><small>${esc(p.role)} · skill ${p.skill}/5 · ${money(p.wage)}/day</small></div>
        ${editOn() ? `<button type="button" class="cf-mini" data-cf="e-wage" data-i="${i}">Wage</button>
          <button type="button" class="cf-mini x" data-cf="fire" data-i="${i}">✕</button>` : `<span class="lg-driver-state">On shift</span>`}
      </div>`).join("")}
      <div class="vt-panel" style="margin-top:10px">
        <div class="vt-panel-head"><h3>Payroll</h3><span>per game day</span></div>
        <ul class="vt-ledger">
          <li><span>Daily wages</span><b class="bad">−${money(payroll)}</b></li>
          <li><span>Hiring fee</span><b>${money(2800)}</b></li>
        </ul>
        <button class="vt-btn" type="button" data-cf="hire" style="width:100%;margin-top:10px">Hire a barista · ${money(2800)}</button>
      </div>`;
  }

  /* ---------------- books ---------------- */
  function booksView(s) {
    const e = s.expenses;
    const wages = s.staffList.reduce((n, p) => n + p.wage, 0);
    const vat = Math.round((s.todayRevenue || 0) * ((Number(e.vat) || 0) / 100));
    const total = (Number(e.rent) || 0) + (Number(e.electricity) || 0) + (Number(e.water) || 0) + wages + vat;
    const net = (s.todayRevenue || 0) - total;
    const rows = [
      ["Rent", "rent", e.rent], ["Electricity", "electricity", e.electricity],
      ["Water", "water", e.water], ["VAT %", "vat", e.vat], ["Beans per kg", "beans", e.beans]
    ];
    return `
      <div class="cf-section-head" style="margin-top:4px"><h3>Books</h3><span>today</span></div>
      <div class="vt-panel" style="margin-top:0">
        <div class="vt-panel-head"><h3>Running costs</h3><span>${editOn() ? "tap to edit" : "per day"}</span></div>
        ${rows.map(([label, key, val]) => `<div class="ve-row">
          <div class="ve-lab"><b>${label}</b><small>${key === "vat" ? "percentage of revenue" : key === "beans" ? "stock cost" : "every day"}</small></div>
          <button type="button" class="ve-val" data-cf="e-expense" data-k="${key}" ${editOn() ? "" : "disabled"}>
            ${key === "vat" ? val + " %" : money(val)}
          </button>
        </div>`).join("")}
      </div>
      <div class="vt-panel">
        <div class="vt-panel-head"><h3>Today</h3><span>net</span></div>
        <ul class="vt-ledger">
          <li><span>Revenue</span><b class="good">${money(s.todayRevenue || 0)}</b></li>
          <li><span>Rent</span><b class="bad">−${money(e.rent)}</b></li>
          <li><span>Electricity</span><b class="bad">−${money(e.electricity)}</b></li>
          <li><span>Water</span><b class="bad">−${money(e.water)}</b></li>
          <li><span>Wages</span><b class="bad">−${money(wages)}</b></li>
          <li><span>VAT (${e.vat}%)</span><b class="bad">−${money(vat)}</b></li>
          <li class="is-total"><span>Net</span><b class="${net >= 0 ? "good" : "bad"}">${money(net)}</b></li>
        </ul>
        ${bar("Cost ratio", total && s.todayRevenue ? (total / Math.max(1, s.todayRevenue)) * 100 : 0,
          `${money(total)} of costs against ${money(s.todayRevenue || 0)} revenue`, "is-day")}
      </div>
      <div class="vt-panel">
        <div class="vt-panel-head"><h3>Stock room</h3><span>${s.stock} kg beans</span></div>
        ${bar("Beans & milk", (s.stock / 420) * 100, `${s.stock} of 420 kg`, "is-stock")}
        <button class="vt-btn soft" type="button" data-cf="restock" style="width:100%;margin-top:10px">Restock · ${money(Math.round((420 - Math.min(420, s.stock)) * (e.beans || 340)))}</button>
      </div>`;
  }

  /* ---------------- reviews ---------------- */
  function reviewsView(s) {
    const avg = s.ratingCount ? (s.ratingTotal / s.ratingCount) : 0;
    return `
      <div class="cf-section-head" style="margin-top:4px"><h3>Reviews</h3><span>${s.reviews.length}</span></div>
      <div class="cf-rating-box">
        <b>${avg.toFixed(1)}</b>
        <div><span class="cf-stars">${"★".repeat(Math.round(avg))}${"☆".repeat(5 - Math.round(avg))}</span>
        <small>${s.ratingCount} ratings · Los Angeles</small></div>
      </div>
      ${s.reviews.map(r => `<article class="cf-review">
        <header><span class="lg-avatar">${esc((r.name || "?").split(" ").map(x => x[0]).join("").slice(0, 2))}</span>
          <div><b>${esc(r.name)}</b><small>${esc(r.item || "Order")} · day ${r.day || 1}</small></div>
          <span class="cf-stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</span>
        </header>
        <p>${esc(r.text)}</p>
        ${editOn() ? `<button type="button" class="cf-mini x" data-cf="del-review" data-id="${r.id}">✕ remove</button>` : ""}
      </article>`).join("")}
      ${editOn() ? `<button class="vt-btn" type="button" data-cf="add-review" style="width:100%">Add a review</button>` : ""}`;
  }

  /* ---------------- upgrades ---------------- */
  function upgradesView(s, id) {
    const c = V().catalog(id);
    return `
      <div class="cf-section-head" style="margin-top:4px"><h3>Upgrades</h3><span>whole shop</span></div>
      <div class="vt-ups">
        ${(c.upgrades || []).map(u => {
          const lvl = Number(s.upgrades[u.k]) || 0;
          const cost = Math.round(u.cost * Math.pow(1.55, lvl));
          return `<article class="vt-up">
            <div class="vt-up-top"><b>${esc(u.name)}</b><span class="vt-up-lvl">${lvl}/5</span></div>
            <small>${esc(u.blurb)}</small>
            <div class="vt-up-track"><i style="width:${(lvl / 5) * 100}%"></i></div>
            <button type="button" class="vt-up-btn" data-cf="upgrade" data-k="${u.k}" ${lvl >= 5 ? "disabled" : ""}>
              ${lvl >= 5 ? "Maxed out" : `Upgrade · ${money(cost)}`}
            </button>
          </article>`;
        }).join("")}
      </div>`;
  }

  /* ---------------------------------------------------------
     Page
     --------------------------------------------------------- */
  function page(id) {
    const s = rec();
    if (!s) return "";
    const c = V().catalog(id);
    const body = s.tab === "orders" ? ordersView(s)
      : s.tab === "staff" ? staffView(s)
        : s.tab === "books" ? booksView(s)
          : s.tab === "reviews" ? reviewsView(s)
            : s.tab === "upgrades" ? upgradesView(s, id)
              : storeView(s);

    return `<section class="dynamic-page-content vt-page cf-page">
      ${editOn() ? editStrip(s, id) : ""}
      <div class="vt-hero" style="background-image:url('${esc(V().photo(id))}')">
        <span class="vt-hero-veil"></span>
        <div class="vt-hero-body">
          <p class="vt-hero-kicker">${esc(c.kicker)} · TRADING</p>
          <h1>${esc(V().name(id))}</h1>
          <p>${s.staffList.length} staff · ${s.menu.length} menu items · Los Angeles</p>
        </div>
        <div class="vt-hero-stats">
          <span><small>TILL</small><b>${money(s.cash)}</b></span>
          <span><small>TODAY</small><b class="${(s.todayRevenue || 0) - (s.todayCosts || 0) >= 0 ? "good" : "bad"}">${money((s.todayRevenue || 0) - (s.todayCosts || 0))}</b></span>
        </div>
      </div>

      ${s.tab === "store" ? tabsHTML(s) : tabsHTML(s)}
      ${body}
      ${s.tab !== "orders" ? `<button class="secondary-button" type="button" data-page="home" style="margin-top:18px">← Back to businesses</button>` : ""}
    </section>`;
  }

  function editStrip(s, id) {
    const row = (lab, small, btn) => `<div class="ve-row"><div class="ve-lab"><b>${lab}</b><small>${small}</small></div>${btn}</div>`;
    return `<div class="ve-panel" style="margin-bottom:12px">
      <div class="ve-head"><span class="ve-dot"></span><b>Edit Mode</b><small>shop, menu, staff, books</small></div>
      ${row("Business name", "list and page", `<button type="button" class="ve-val" data-cf="e-name">${esc(V().name(id))}</button>`)}
      ${row("Cover photo", "file or URL", `<button type="button" class="ve-val" data-cf="e-photo">Change photo</button>`)}
      ${row("Money in the till", "shop cash", `<button type="button" class="ve-val" data-cf="e-cash">${money(s.cash)}</button>`)}
      ${row("Reputation", "0–100", `<button type="button" class="ve-val" data-cf="e-rep">${Math.round(s.reputation)} / 100</button>`)}
      ${row("Purchase price", "buy-in", `<button type="button" class="ve-val" data-cf="e-buy">${money(V().buyOf(id))}</button>`)}
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

  function orderItem(itemId) {
    const s = rec();
    const it = s.menu.find(m => m.id === itemId);
    if (!it) return;
    if (!it.stock) return toast("That one is out of stock.", true);
    const price = priceOf(it, s);
    s.cash += price;
    s.todayRevenue = (s.todayRevenue || 0) + price;
    s.todayUnits = (s.todayUnits || 0) + 1;
    s.points += 12;
    s.reputation = clamp(s.reputation + 0.05, 0, 100);
    V().save();
    render();
    toast(`${it.name} sold · ${money(price)} into the till.`);
  }

  function dispatch() {
    const s = rec();
    const dSel = document.querySelector("[data-cf-dest]");
    const pSel = document.querySelector("[data-cf-driver]");
    const key = dSel ? dSel.value : "hollywood";
    const route = ROUTES[key];
    const staff = pSel && s.staffList[Number(pSel.value)] ? s.staffList[Number(pSel.value)] : null;
    const total = Math.round(90 + route.km * 9);
    s.orders.unshift({
      id: "CF-" + Math.floor(100000 + Math.random() * 899999),
      from: "NU Roast · Sunset Blvd",
      place: route.place,
      km: route.km,
      driver: staff ? staff.name : "Unassigned",
      total,
      stage: 0,
      progress: 0,
      eta: Math.max(8, Math.round(route.km * 2.2)),
      day: day()
    });
    V().save();
    render();
    toast(`Delivery to ${route.place} dispatched.`);
  }

  function editAction(act, id, el) {
    const s = rec();
    const ask = (label, cur) => { const r = window.prompt(label, cur); return r == null ? null : r; };
    const num = raw => { const n = Math.round(Number(String(raw).replace(/[^\d.-]/g, ""))); return Number.isFinite(n) ? n : null; };
    const item = id ? s.menu.find(m => m.id === id) : null;

    switch (act) {
      case "tab": s.tab = el.dataset.t; break;
      case "cat": s.cat = el.dataset.c; break;
      case "open-item": item && orderItem(item.id); break;
      case "order-item": orderItem(id); break;
      case "order-now":
        s.promoActive = !s.promoActive;
        toast(s.promoActive ? "20% off applied to the whole menu today." : "Promo removed — full prices back.");
        break;
      case "redeem": {
        if (s.points < 120) return toast("You need 120 points to redeem a free coffee.", true);
        s.points -= 120;
        s.redeemed = (s.redeemed || 0) + 1;
        s.reputation = clamp(s.reputation + 1, 0, 100);
        toast("Free coffee redeemed — points spent.");
        break;
      }
      case "e-name": {
        const v = ask("Business name", V().name("coffee"));
        if (v == null) return; s.editName = String(v).slice(0, 48) || "NU Roast Coffee"; break;
      }
      case "e-photo": {
        const url = ask("Image URL (leave empty to upload)", "");
        if (url == null) return;
        if (url.trim()) s.editPhoto = url.trim();
        else return V().pickImage(src => { if (src) { s.editPhoto = src; V().save(); render(); } });
        break;
      }
      case "e-cash": { const n = num(ask("Money in the till", Math.round(s.cash))); if (n == null) return; s.cash = n; break; }
      case "e-rep": { const n = num(ask("Reputation (0–100)", Math.round(s.reputation))); if (n == null) return; s.reputation = clamp(n, 0, 100); break; }
      case "e-buy": { const n = num(ask("Business purchase price", V().buyOf("coffee"))); if (n == null) return; s.editBuy = Math.max(0, n); break; }
      case "e-promo": {
        const t = ask("Promo headline", s.promo.title);
        if (t == null) return;
        const sub = ask("Promo sub-line", s.promo.sub);
        const img = ask("Promo image URL (leave empty to keep)", "");
        s.promo.title = t.trim() || s.promo.title;
        if (sub != null) s.promo.sub = sub.trim();
        if (img && img.trim()) s.promo.img = img.trim();
        break;
      }
      case "add-cat": {
        const c = ask("New category slot", "Teas");
        if (!c || !c.trim()) return;
        s.cats.push(c.trim()); s.cat = c.trim(); break;
      }
      case "del-cat": {
        const c = el.dataset.c;
        if (!window.confirm(`Remove the ${c} category? Items stay in the menu.`)) return;
        s.cats = s.cats.filter(x => x !== c);
        if (s.cat === c) s.cat = s.cats[0] || "More";
        break;
      }
      case "add-item": {
        const name = ask("Item name", "New drink");
        if (!name || !name.trim()) return;
        const price = num(ask("Price (rand)", 45)) || 0;
        const catq = ask("Category", s.cat) || s.cat;
        const id2 = uid("it");
        const fresh = { id: id2, name: name.trim(), cat: catq.trim(), price, discount: 0, desc: "Freshly added to the menu.", img: "", stock: true };
        s.menu.unshift(fresh);
        V().save();
        V().pickImage(src => { if (src) { fresh.img = src; V().save(); render(); } });
        render();
        toast("Item added — pick a photo next.");
        return;
      }
      case "del-item": {
        if (!window.confirm(`Remove ${item ? item.name : "this item"} from the menu?`)) return;
        s.menu = s.menu.filter(m => m.id !== id); break;
      }
      case "swap-item": {
        const url = ask("Image URL (leave empty to upload)", "");
        if (url == null) return;
        if (url.trim()) item.img = url.trim();
        else return V().pickImage(src => { if (src) { item.img = src; V().save(); render(); } });
        break;
      }
      case "e-item": {
        const n = ask("Item name", item.name); if (n == null) return;
        const d = ask("Description", item.desc || ""); if (d == null) return;
        const c = ask("Category", item.cat); if (c == null) return;
        item.name = n.trim() || item.name; item.desc = d.trim(); item.cat = c.trim() || item.cat;
        break;
      }
      case "e-price": { const n = num(ask("Price (rand)", item.price)); if (n == null) return; item.price = Math.max(0, n); break; }
      case "e-off": { const n = num(ask("Discount %", item.discount || 0)); if (n == null) return; item.discount = clamp(n, 0, 90); break; }
      case "e-stock": item.stock = !item.stock; break;
      case "e-expense": {
        const k = el.dataset.k;
        const n = num(ask(`Value for ${k}`, s.expenses[k]));
        if (n == null) return;
        s.expenses[k] = clamp(n, 0, 100000); break;
      }
      case "hire": {
        if (!spend(s, 2800, "NU Roast: hiring fee")) return toast("Can't cover the hiring fee.", true);
        const names = ["Michael Johnson", "Sarah Williams", "David Brown", "Emily Davis", "James Wilson", "Olivia Martinez", "Daniel Taylor", "Sophia Anderson"];
        const used = s.staffList.map(p => p.name);
        const nm = names.filter(n => !used.includes(n))[0] || "Barista " + (s.staffList.length + 1);
        s.staffList.push({ name: nm, role: "Barista", skill: clamp(Math.round(2 + Math.random() * 4), 1, 5), wage: 900 + Math.round(Math.random() * 400) });
        break;
      }
      case "fire": {
        const i = Number(el.dataset.i);
        const p = s.staffList[i];
        if (!p || !window.confirm(`Let ${p.name} go?`)) return;
        s.staffList.splice(i, 1); break;
      }
      case "e-wage": {
        const i = Number(el.dataset.i);
        const n = num(ask("Daily wage", s.staffList[i].wage));
        if (n == null) return;
        s.staffList[i].wage = clamp(n, 0, 20000); break;
      }
      case "restock": {
        const need = 420 - Math.min(420, s.stock);
        const cost = Math.round(need * (s.expenses.beans || 340));
        if (!spend(s, cost, "NU Roast: restock beans")) return toast("Can't afford that restock.", true);
        s.stock = 420; break;
      }
      case "dispatch": dispatch(); return;
      case "add-review": {
        const nm = ask("Reviewer name", "Michael Johnson"); if (!nm || !nm.trim()) return;
        const st = num(ask("Stars (1–5)", 5)) || 5;
        const tx = ask("Review text", "Lovely coffee and quick service."); if (tx == null) return;
        s.reviews.unshift({ id: uid("rv"), name: nm.trim(), stars: clamp(st, 1, 5), text: tx.trim(), item: "Latte", day: day() });
        s.ratingTotal += clamp(st, 1, 5); s.ratingCount += 1;
        break;
      }
      case "del-review": {
        const r = s.reviews.find(x => x.id === id);
        if (!r) return;
        s.reviews = s.reviews.filter(x => x.id !== id);
        s.ratingTotal -= r.stars; s.ratingCount = Math.max(1, s.ratingCount - 1);
        break;
      }
      case "upgrade": {
        const k = el.dataset.k;
        const c = V().catalog("coffee");
        const u = (c.upgrades || []).find(x => x.k === k);
        const lvl = Number(s.upgrades[k]) || 0;
        if (!u || lvl >= 5) return;
        const cost = Math.round(u.cost * Math.pow(1.55, lvl));
        if (!spend(s, cost, `NU Roast: ${u.name} level ${lvl + 1}`)) return toast("Not enough cash.", true);
        s.upgrades[k] = lvl + 1;
        break;
      }
      default: return;
    }
    V().save();
    render();
    if (window.nuLimitsBusinessesRefresh) window.nuLimitsBusinessesRefresh();
  }

  /* ---------------------------------------------------------
     Clock — deliveries advance, takings settle
     --------------------------------------------------------- */
  function tick() {
    const s = rec();
    if (!s) return;
    const d = day();
    if (s.lastCfDay === d) return;
    s.lastCfDay = d;
    let changed = false;

    /* walk-in trade */
    const quality = clamp(s.reputation / 100 + s.staffList.length * 0.04 + (s.upgrades ? 0 : 0), 0, 1.4);
    const walkins = Math.round(18 + quality * 26 + Math.random() * 14);
    const avgTicket = 44 * (1 + (Number(s.upgrades.app) || 0) * 0.03);
    const revenue = Math.round(walkins * avgTicket);
    const wages = s.staffList.reduce((n, p) => n + p.wage, 0);
    const e = s.expenses;
    const vat = Math.round(revenue * ((Number(e.vat) || 0) / 100));
    const costs = wages + (Number(e.rent) || 0) + (Number(e.electricity) || 0) + (Number(e.water) || 0) + vat;
    s.todayRevenue = revenue;
    s.todayCosts = costs;
    s.todayUnits = walkins;
    s.cash += revenue - costs;
    s.stock = Math.max(0, s.stock - Math.round(walkins * 0.06));
    s.reputation = clamp(s.reputation + (Math.random() - 0.42) * 0.8, 0, 100);
    changed = true;

    /* deliveries advance */
    s.orders.forEach(o => {
      if (o.stage >= 3) return;
      o.progress = clamp((o.progress || 0) + 36 + Math.random() * 16, 0, 100);
      o.stage = o.progress >= 100 ? 3 : o.progress > 66 ? 2 : o.progress > 33 ? 1 : 0;
      if (o.stage >= 3 && !o.paid) {
        o.paid = true;
        s.deliveries += 1;
        s.cash += o.total;
        changed = true;
      }
    });

    if (changed) {
      V().save();
      if (document.querySelector(".cf-page")) render();
      if (window.nuLimitsBusinessesRefresh) window.nuLimitsBusinessesRefresh();
    }
  }

  function render() {
    const dp = document.getElementById("dynamic-page");
    if (!dp || !dp.querySelector(".cf-page")) return;
    const y = window.scrollY;
    dp.innerHTML = page("coffee");
    window.scrollTo({ top: y });
  }

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-cf]");
    if (!el) return;
    const act = el.dataset.cf;
    const editOnly = ["e-name", "e-photo", "e-cash", "e-rep", "e-buy", "e-promo", "add-cat",
      "del-cat", "add-item", "del-item", "swap-item", "e-item", "e-price", "e-off", "e-stock",
      "e-expense", "fire", "e-wage", "add-review", "del-review", "upgrade"];
    if (editOnly.includes(act) && !editOn()) return;
    e.preventDefault();
    e.stopPropagation();
    editAction(act, el.dataset.id, el);
  }, true);

  document.addEventListener("input", e => {
    const box = e.target.closest("[data-cf-search]");
    if (!box) return;
    const q = box.value.trim().toLowerCase();
    const st = rec();
    if (st && st.cat && q) {
      st.cat = "";
      V().save();
      render();
      const nb = document.querySelector("[data-cf-search]");
      if (nb) { nb.value = box.value; nb.focus(); }
    }
    document.querySelectorAll(".cf-item").forEach(row => {
      row.style.display = !q || row.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

  if (window.nuLimitsEditMode && window.nuLimitsEditMode.onChange) {
    window.nuLimitsEditMode.onChange(() => { if (document.querySelector(".cf-page")) render(); });
  }

  window.setInterval(tick, 1400);

  const boot = () => { const s = rec(); if (s) { if (!s.lastCfDay) s.lastCfDay = day(); V().save(); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.nuLimitsCoffee = { page, render, state: () => rec(), tick };
})();
