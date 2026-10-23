/* ==========================================================
   NU LIMITS — THE COPPER POT (restaurant)
   Round 10

   A full restaurant simulation: capital purchase, menu, staff,
   promotions, equipment, online orders, discounts, reviews and
   a daily P&L with rent, water, power, levies and provisional
   tax.

   Save: nuLimitsRestaurant_v1
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsRestaurant_v1";

  /* ---------------------------------------------------------
     Roles
     --------------------------------------------------------- */
  const ROLES = {
    waiter: {
      label: "Waiter", dept: "Floor", wage: 320, service: 16, hire: true, order: 1,
      ladder: "supervisor", blurb: "Carries the floor. Each one serves about 16 covers."
    },
    chef: {
      label: "Chef", dept: "Kitchen", wage: 520, chef: 1, hire: true, order: 2,
      ladder: "headchef", blurb: "Drives kitchen throughput and plate quality."
    },
    barman: {
      label: "Barman", dept: "Bar", wage: 340, service: 6, bar: 0.04, hire: true, order: 3,
      ladder: "barmanager", blurb: "Drinks service and a small ticket lift."
    },
    cleaner: {
      label: "Cleaner", dept: "House", wage: 240, hygiene: 1, hire: true, order: 4,
      ladder: null, blurb: "Keeps hygiene up. Dirty rooms drag on reviews."
    },
    supervisor: {
      label: "Supervisor", dept: "Floor", wage: 560, service: 8, quality: 0.6, promote: true, order: 5,
      ladder: "manager", blurb: "Floats the floor — extra service capacity."
    },
    headchef: {
      label: "Head chef", dept: "Kitchen", wage: 1150, chef: 1.6, quality: 2.2, promote: true, order: 6,
      ladder: null, blurb: "Runs the pass. Real quality and throughput."
    },
    barmanager: {
      label: "Bar manager", dept: "Bar", wage: 720, service: 12, bar: 0.07, quality: 0.3, promote: true, order: 7,
      ladder: null, blurb: "Bar runs itself and the drinks margin improves."
    },
    manager: {
      label: "Manager", dept: "Ops", wage: 980, service: 8, ops: 1, quality: 0.8, promote: true, order: 8,
      ladder: "director", blurb: "Cuts waste, lifts morale, handles complaints."
    },
    director: {
      label: "Director", dept: "Ops", wage: 1900, service: 14, ops: 2, quality: 1.4, promote: true, order: 9,
      ladder: null, blurb: "Runs the whole operation — best efficiency in the game."
    }
  };

  const HIREABLE = Object.keys(ROLES).filter(id => ROLES[id].hire);

  /* ---------------------------------------------------------
     Upgrade levels — every upgrade runs to level 35 (round 17)
     The authored tiers are levels 1..n; the rest are generated so
     each step costs more than the one before it.
     --------------------------------------------------------- */
  const MAX_LEVEL = 35;
  const GROWTH = 1.185;

  function roundPrice(v) {
    if (v < 1000) return Math.round(v / 50) * 50;
    return Math.round(v / 500) * 500;
  }

  function expandTiers(tiers) {
    const src = (Array.isArray(tiers) ? tiers : []).filter(Boolean);
    const out = src.map(t => ({
      label: String(t.label || ""),
      price: Math.max(0, Number(t.price) || 0),
      fx: Object.assign({}, t.fx || {})
    }));
    if (!out.length) out.push({ label: "Entry", price: 0, fx: {} });

    const last = out[out.length - 1];
    const keys = Object.keys(last.fx || {});

    while (out.length < MAX_LEVEL) {
      const n = out.length;                    /* 1-based level being created */
      const step = n - src.length + 1;
      const prev = out[out.length - 1];
      const price = prev.price > 0
        ? roundPrice(prev.price * GROWTH)
        : roundPrice(6000 * Math.pow(GROWTH, step));
      const fx = {};
      keys.forEach(k => {
        const base = Number(prev.fx[k]) || 0;
        if (k === "waste") fx[k] = Math.max(0, Math.round((base - 0.1) * 10) / 10);
        else if (k === "fast" || k === "seats" || k === "staff" || k === "online" || k === "turns" || k === "charm")
          fx[k] = Math.max(0, Math.round(base + Math.max(1, base * 0.055)));
        else fx[k] = Math.max(0, Math.round((base + Math.max(0.1, base * 0.05)) * 10) / 10);
      });
      out.push({ label: "Level " + (n + 1), price, fx: Object.keys(fx).length ? fx : Object.assign({}, prev.fx) });
    }
    return out;
  }

  const FIRST = ["James", "Emily", "Oliver", "Sophie", "Harry", "Grace", "Thomas", "Alice",
    "Jack", "Charlotte", "George", "Hannah", "William", "Lucy", "Daniel", "Ella",
    "Henry", "Megan", "Samuel", "Rachel", "Edward", "Laura", "Michael", "Claire"];
  const LAST = ["Smith", "Taylor", "Brown", "Wilson", "Davies", "Evans", "Walker", "Hughes",
    "Bennett", "Foster", "Gray", "Harris", "Baker", "Turner", "Collins", "Ward",
    "Reed", "Shaw", "Price", "Bailey"];

  /* ---------------------------------------------------------
     Menu
     --------------------------------------------------------- */
  const MENU_DEFAULT = {
    burger:    { name: "House cheeseburger", cat: "Food", emoji: "🍔", price: 135, cost: 45, prep: 6, appeal: 1.0, q: 1.0 },
    pasta:     { name: "Chicken & mushroom pasta", cat: "Food", emoji: "🍝", price: 150, cost: 48, prep: 7, appeal: 1.0, q: 1.05 },
    caesar:    { name: "Caesar salad", cat: "Food", emoji: "🥗", price: 115, cost: 34, prep: 4, appeal: 0.85, q: 0.95 },
    pizza:     { name: "Margherita pizza", cat: "Food", emoji: "🍕", price: 165, cost: 52, prep: 8, appeal: 1.15, q: 1.0 },
    ribs:      { name: "Sticky pork ribs", cat: "Food", emoji: "🍖", price: 245, cost: 95, prep: 11, appeal: 1.1, q: 1.2 },
    steak:     { name: "300 g rump & chips", cat: "Food", emoji: "🥩", price: 285, cost: 118, prep: 12, appeal: 1.2, q: 1.25 },
    curry:     { name: "Butter chicken curry", cat: "Food", emoji: "🍛", price: 175, cost: 58, prep: 9, appeal: 1.05, q: 1.1 },
    linefish:  { name: "Grilled linefish", cat: "Food", emoji: "🐟", price: 265, cost: 105, prep: 10, appeal: 0.95, q: 1.15 },
    fondant:   { name: "Chocolate fondant", cat: "Dessert", emoji: "🍫", price: 95, cost: 26, prep: 6, appeal: 0.9, q: 1.1 },
    cheesecake:{ name: "Baked cheesecake", cat: "Dessert", emoji: "🍰", price: 85, cost: 24, prep: 3, appeal: 0.85, q: 1.0 },
    wine:      { name: "House red (glass)", cat: "Drinks", emoji: "🍷", price: 75, cost: 22, prep: 1, appeal: 0.85, q: 1.0 },
    beer:      { name: "Draft lager (500 ml)", cat: "Drinks", emoji: "🍺", price: 55, cost: 20, prep: 1, appeal: 1.0, q: 1.0 },
    cocktail:  { name: "Signature cocktail", cat: "Drinks", emoji: "🍸", price: 95, cost: 30, prep: 3, appeal: 0.9, q: 1.1 },
    coffee:    { name: "Cappuccino", cat: "Drinks", emoji: "☕", price: 38, cost: 10, prep: 2, appeal: 0.9, q: 1.0 },
    soda:      { name: "Soft drink", cat: "Drinks", emoji: "🥤", price: 30, cost: 8, prep: 1, appeal: 1.0, q: 0.9 },
    shake:     { name: "Salted caramel shake", cat: "Drinks", emoji: "🥛", price: 55, cost: 18, prep: 2, appeal: 0.9, q: 1.0 }
  };

  const START_MENU = ["burger", "pasta", "caesar", "pizza", "ribs", "fondant", "wine", "beer", "coffee", "soda"];

  /* ---------------------------------------------------------
     Upgrades — each tier holds absolute values for that level
     --------------------------------------------------------- */
  const UPGRADES = [
    {
      id: "range", cat: "Kitchen", name: "Range cooker", emoji: "🔥",
      tiers: [
        { label: "2-burner gas", price: 0, fx: { fast: 8 } },
        { label: "4-burner gas", price: 12000, fx: { fast: 18, q: 1 } },
        { label: "6-burner + grill", price: 38000, fx: { fast: 30, q: 2 } },
        { label: "Professional range", price: 85000, fx: { fast: 46, q: 4 } }
      ]
    },
    {
      id: "oven", cat: "Kitchen", name: "Convection oven", emoji: "♨️",
      tiers: [
        { label: "Single deck", price: 0, fx: { fast: 6 } },
        { label: "Double deck", price: 9000, fx: { fast: 14, q: 1 } },
        { label: "Steam combi", price: 30000, fx: { fast: 22, q: 2 } },
        { label: "Combi + proofer", price: 60000, fx: { fast: 32, q: 3 } }
      ]
    },
    {
      id: "fryer", cat: "Kitchen", name: "Deep fryer", emoji: "🍟",
      tiers: [
        { label: "Single basket", price: 0, fx: { fast: 4 } },
        { label: "Twin basket", price: 7000, fx: { fast: 10, q: 1 } },
        { label: "Twin + filter", price: 22000, fx: { fast: 16, q: 2 } }
      ]
    },
    {
      id: "prep", cat: "Kitchen", name: "Prep station", emoji: "🔪",
      tiers: [
        { label: "One board", price: 0, fx: { fast: 3 } },
        { label: "Stainless line", price: 14000, fx: { fast: 11, q: 1 } },
        { label: "Cold line + sous-vide", price: 34000, fx: { fast: 18, q: 3 } }
      ]
    },
    {
      id: "fridge", cat: "Kitchen", name: "Cold room", emoji: "🧊",
      tiers: [
        { label: "Upright fridge", price: 0, fx: { waste: 6 } },
        { label: "Double upright", price: 18000, fx: { waste: 4, q: 1 } },
        { label: "Walk-in cold room", price: 45000, fx: { waste: 2, q: 2 } }
      ]
    },
    {
      id: "hood", cat: "Kitchen", name: "Extractor hood", emoji: "💨",
      tiers: [
        { label: "No hood", price: 0, fx: {} },
        { label: "Wall extractor", price: 10000, fx: { q: 1, charm: 2 } },
        { label: "Full canopy + make-up air", price: 26000, fx: { q: 2, charm: 3 } }
      ]
    },
    {
      id: "dish", cat: "Kitchen", name: "Dishwash station", emoji: "🫧",
      tiers: [
        { label: "Hand wash", price: 0, fx: {} },
        { label: "Pass-through machine", price: 12000, fx: { fast: 6, q: 1 } },
        { label: "Conveyor machine", price: 28000, fx: { fast: 11, q: 2 } }
      ]
    },
    {
      id: "coffee", cat: "Kitchen", name: "Coffee machine", emoji: "☕",
      tiers: [
        { label: "Filter pot", price: 0, fx: {} },
        { label: "Single-group espresso", price: 9000, fx: { charm: 3, q: 1 } },
        { label: "Two-group + grinder", price: 24000, fx: { charm: 5, q: 2 } }
      ]
    },
    {
      id: "tables", cat: "Dining", name: "Tables & chairs", emoji: "🪑",
      tiers: [
        { label: "24 seats", price: 0, fx: { seats: 24 } },
        { label: "36 seats", price: 15000, fx: { seats: 36, q: 1 } },
        { label: "54 seats", price: 36000, fx: { seats: 54, q: 1 } },
        { label: "78 seats", price: 70000, fx: { seats: 78, q: 2 } }
      ]
    },
    {
      id: "decor", cat: "Dining", name: "Interior & décor", emoji: "🕯️",
      tiers: [
        { label: "Plain room", price: 0, fx: {} },
        { label: "Warm fit-out", price: 12000, fx: { q: 2, charm: 4 } },
        { label: "Designer interior", price: 30000, fx: { q: 4, charm: 8 } },
        { label: "Award-winning room", price: 65000, fx: { q: 6, charm: 12 } }
      ]
    },
    {
      id: "aircon", cat: "Dining", name: "Air conditioning", emoji: "❄️",
      tiers: [
        { label: "Fans only", price: 0, fx: {} },
        { label: "Split units", price: 16000, fx: { charm: 4, q: 1 } },
        { label: "Full HVAC", price: 39000, fx: { charm: 7, q: 2 } }
      ]
    },
    {
      id: "sound", cat: "Dining", name: "Sound & lighting", emoji: "🎵",
      tiers: [
        { label: "House speakers", price: 0, fx: {} },
        { label: "Zoned sound + dimmers", price: 11000, fx: { charm: 5 } }
      ]
    },
    {
      id: "terrace", cat: "Dining", name: "Outdoor terrace", emoji: "🌿",
      tiers: [
        { label: "No terrace", price: 0, fx: {} },
        { label: "Pavement tables", price: 40000, fx: { seatsAdd: 14, charm: 6 } }
      ]
    },
    {
      id: "pos", cat: "Tech", name: "POS system", emoji: "🖥️",
      tiers: [
        { label: "Paper tickets", price: 0, fx: {} },
        { label: "Cloud POS", price: 14000, fx: { turns: 0.4, q: 1 } },
        { label: "POS + kitchen display", price: 32000, fx: { turns: 0.7, q: 1 } }
      ]
    },
    {
      id: "stock", cat: "Tech", name: "Stock control", emoji: "📦",
      tiers: [
        { label: "Clipboard", price: 0, fx: {} },
        { label: "Stock app + counts", price: 16000, fx: { waste: 5 } },
        { label: "Full inventory system", price: 38000, fx: { waste: 9 } }
      ]
    },
    {
      id: "booking", cat: "Tech", name: "Booking system", emoji: "📕",
      tiers: [
        { label: "Phone book", price: 0, fx: {} },
        { label: "Online reservations", price: 12000, fx: { host: 10, charm: 2 } }
      ]
    },
    {
      id: "cctv", cat: "Tech", name: "Security cameras", emoji: "📹",
      tiers: [
        { label: "Nothing", price: 0, fx: {} },
        { label: "Camera + till watch", price: 8000, fx: { waste: 2, q: 1 } }
      ]
    },
    {
      id: "platform", cat: "Delivery", name: "Delivery platform listing", emoji: "🛵",
      tiers: [
        { label: "Not listed", price: 0, fx: {} },
        { label: "Listed on the app", price: 6500, fx: { online: 1 } }
      ]
    },
    {
      id: "bikes", cat: "Delivery", name: "Delivery bikes", emoji: "🏍️",
      tiers: [
        { label: "No bikes", price: 0, fx: {} },
        { label: "1 bike", price: 7500, fx: { online: 10 } },
        { label: "2 bikes", price: 15000, fx: { online: 22 } },
        { label: "3 bikes", price: 22500, fx: { online: 34 } },
        { label: "4 bikes", price: 30000, fx: { online: 46 } }
      ]
    },
    {
      id: "packaging", cat: "Delivery", name: "Packaging station", emoji: "📦",
      tiers: [
        { label: "Buy-in boxes", price: 0, fx: {} },
        { label: "Branded packaging", price: 9000, fx: { online: 4, q: 1 } }
      ]
    },
    {
      id: "space", cat: "Space", name: "Floor space", emoji: "🏛️",
      tiers: [
        { label: "80 m² corner site", price: 0, fx: { space: 80, staff: 8, rent: 12000, seats: 0 } },
        { label: "140 m² with back kitchen", price: 55000, fx: { space: 140, staff: 14, rent: 20000 } },
        { label: "220 m² two-floor site", price: 120000, fx: { space: 220, staff: 20, rent: 30000 } }
      ]
    }
  ];

  /* ---------------------------------------------------------
     Promotions
     --------------------------------------------------------- */
  const PROMOS = [
    { id: "happy", label: "Happy hour", discount: 0.15, mult: 1.35, days: 3, cost: 2500, blurb: "15 % off the menu for three days." },
    { id: "student", label: "Student night", discount: 0.20, mult: 1.55, days: 2, cost: 3200, blurb: "20 % off midweek — a younger, louder room." },
    { id: "opening", label: "Grand opening", discount: 0.25, mult: 1.95, days: 5, cost: 6000, blurb: "25 % off for five days. Big crowd, thin margin." },
    { id: "loyalty", label: "Loyalty card", discount: 0.10, mult: 1.25, days: 7, cost: 4500, blurb: "10 % off all week for regulars." }
  ];

  const CUISINES = {
    bistro: { label: "Neighbourhood bistro", mod: 1.0 },
    grill: { label: "Steakhouse & grill", mod: 1.05 },
    italian: { label: "Italian kitchen", mod: 1.02 }
  };

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const money = n => "R " + Math.round(Number(n) || 0).toLocaleString("en-ZA").replace(/,/g, " ");
  const round10 = n => Math.round(n / 10) * 10;

  const DEFAULT_PURCHASE = 75000;

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  function defaultMenu() {
    const out = {};
    Object.keys(MENU_DEFAULT).forEach(id => { out[id] = Object.assign({}, MENU_DEFAULT[id]); });
    return out;
  }

  function defaultUpgrades() {
    return UPGRADES.map(u => ({
      id: u.id,
      cat: u.cat,
      name: u.name,
      emoji: u.emoji,
      tiers: expandTiers(u.tiers)
    }));
  }

  function startingStaff() {
    return [
      { id: uid("emp"), name: "James Fletcher", role: "chef", skill: 2.8, morale: 74, days: 0, wage: round10(ROLES.chef.wage * 1.0) },
      { id: uid("emp"), name: "Emily Carter", role: "waiter", skill: 2.2, morale: 76, days: 0, wage: round10(ROLES.waiter.wage * 0.98) },
      { id: uid("emp"), name: "Oliver Hayes", role: "waiter", skill: 2.0, morale: 72, days: 0, wage: round10(ROLES.waiter.wage * 0.96) },
      { id: uid("emp"), name: "Grace Palmer", role: "cleaner", skill: 1.8, morale: 80, days: 0, wage: round10(ROLES.cleaner.wage * 0.95) }
    ];
  }

  function blank() {
    return {
      owned: false,
      name: "Restaurant",
      cuisine: "bistro",
      purchasePrice: DEFAULT_PURCHASE,
      cash: 0,
      openedOn: null,
      businessDay: 0,
      menu: defaultMenu(),
      active: START_MENU.slice(),
      staff: [],
      upgrades: {},
      rep: 62,
      buzz: 0.8,
      reviews: [],
      reviewCount: 0,
      promo: null,
      promoCooldown: 0,
      stats: null,
      history: [],
      month: { revenue: 0, costs: 0, profit: 0, tax: 0, day: 0 },
      totals: { revenue: 0, costs: 0, profit: 0, covers: 0, tax: 0 },
      arrears: 0,
      unpaidDays: 0,
      lastDay: 0,
      catalog: null
    };
  }

  /* ---------------------------------------------------------
     Catalogue (edit mode)
     --------------------------------------------------------- */
  function defaultCatalog() {
    return { menu: defaultMenu(), upgrades: defaultUpgrades(), roles: JSON.parse(JSON.stringify(ROLES)), removed: { menu: [], upgrades: [] } };
  }

  function mergeCatalog(saved) {
    const def = defaultCatalog();
    if (!saved || typeof saved !== "object") return def;

    const removed = saved.removed || { menu: [], upgrades: [] };
    const cat = { menu: {}, upgrades: [], roles: {}, removed: { menu: [], upgrades: [] } };

    const savedMenu = saved.menu && typeof saved.menu === "object" ? saved.menu : {};
    Object.keys(savedMenu).forEach(id => {
      if (removed.menu.includes(id)) return;
      const m = savedMenu[id];
      if (!m) return;
      cat.menu[id] = Object.assign({}, m);
    });
    Object.keys(def.menu).forEach(id => {
      if (!cat.menu[id] && !removed.menu.includes(id)) cat.menu[id] = Object.assign({}, def.menu[id]);
    });
    cat.removed.menu = removed.menu.slice();

    const savedUp = Array.isArray(saved.upgrades) ? saved.upgrades : [];
    savedUp.forEach(u => {
      if (!u || !u.id || removed.upgrades.includes(u.id)) return;
      cat.upgrades.push({
        id: u.id, cat: u.cat || "Kitchen", name: u.name || "Upgrade", emoji: u.emoji || "🔧",
        tiers: (u.tiers || []).map(t => ({ label: t.label || "", price: Number(t.price) || 0, fx: Object.assign({}, t.fx || {}) }))
      });
    });
    def.upgrades.forEach(d => {
      if (!cat.upgrades.some(u => u.id === d.id) && !removed.upgrades.includes(d.id)) cat.upgrades.push(d);
    });
    cat.removed.upgrades = removed.upgrades.slice();

    cat.upgrades = cat.upgrades.map(u => Object.assign({}, u, { tiers: expandTiers(u.tiers) }));

    cat.roles = Object.assign({}, def.roles, saved.roles || {});
    return cat;
  }

  const ensureCatalog = () => {
    if (!state.catalog || !state.catalog.menu) state.catalog = mergeCatalog(state.catalog);
    return state.catalog;
  };

  const menuMap = () => ensureCatalog().menu;
  const upgradeList = () => ensureCatalog().upgrades;
  const roleDef = id => (ensureCatalog().roles[id] || ROLES[id] || null);

  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { saved = null; }
    if (!saved || typeof saved !== "object" || !saved.menu) return blank();

    const s = Object.assign(blank(), saved);
    s.menu = Object.assign({}, saved.menu);
    s.active = Array.isArray(saved.active) ? saved.active.filter(id => s.menu[id]) : [];
    s.staff = Array.isArray(saved.staff) ? saved.staff : [];
    s.upgrades = saved.upgrades && typeof saved.upgrades === "object" ? saved.upgrades : {};
    s.reviews = Array.isArray(saved.reviews) ? saved.reviews : [];
    s.history = Array.isArray(saved.history) ? saved.history : [];
    s.month = Object.assign({ revenue: 0, costs: 0, profit: 0, tax: 0, day: 0 }, saved.month || {});
    s.totals = Object.assign({ revenue: 0, costs: 0, profit: 0, covers: 0, tax: 0 }, saved.totals || {});
    s.catalog = mergeCatalog(saved.catalog);
    Object.keys(s.catalog.menu).forEach(id => {
      if (!s.menu[id]) s.menu[id] = Object.assign({}, s.catalog.menu[id]);
    });
    return s;
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }

  /* ---------------------------------------------------------
     Money bridges
     --------------------------------------------------------- */
  const personalBalance = () => (window.nuLimitsMoney ? window.nuLimitsMoney.getBalance() : 0);
  const isFree = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());

  function payPersonal(amount, label) {
    if (!window.nuLimitsMoney) return false;
    return window.nuLimitsMoney.transact("expense", Math.round(amount), label);
  }
  function receivePersonal(amount, label) {
    if (!window.nuLimitsMoney) return false;
    return window.nuLimitsMoney.transact("income", Math.round(amount), label);
  }

  /* ---------------------------------------------------------
     Effects
     --------------------------------------------------------- */
  function effects() {
    const e = { fast: 0, q: 0, seats: 0, seatsAdd: 0, charm: 0, waste: 6, turns: 0, staff: 8, online: 0, host: 0, rent: 12000, space: 80 };
    upgradeList().forEach(u => {
      const lvl = Number(state.upgrades[u.id]) || 0;
      const tier = u.tiers[lvl];
      if (!tier || !tier.fx) return;
      Object.keys(tier.fx).forEach(k => {
        const v = Number(tier.fx[k]);
        if (!Number.isFinite(v)) return;
        if (k === "waste" || k === "seats" || k === "staff" || k === "rent" || k === "space") e[k] = v;
        else if (k === "seatsAdd") e.seatsAdd += v;
        else e[k] += v;
      });
    });
    e.seats = (e.seats || 24) + e.seatsAdd;
    return e;
  }

  const staffIn = role => state.staff.filter(s => s.role === role);
  const effSkill = emp => {
    const base = Number(emp.skill) || 1;
    return base * (0.7 + clamp(Number(emp.morale) || 60, 0, 100) / 250);
  };

  const wageBill = () => state.staff.reduce((sum, s) => sum + Math.round(Number(s.wage) || 0), 0);

  function staffCap() {
    return effects().staff;
  }

  function kitchenPower() {
    const e = effects();
    const chefs = state.staff.filter(s => roleDef(s.role) && roleDef(s.role).chef);
    const skill = chefs.reduce((n, c) => n + effSkill(c) * (roleDef(c.role).chef || 1), 0);
    return (14 + e.fast) * clamp(0.4 + 0.09 * skill, 0.3, 1.6);
  }

  function servicePower() {
    let points = 0;
    state.staff.forEach(s => {
      const r = roleDef(s.role);
      if (!r) return;
      if (r.service) points += r.service * (0.45 + effSkill(s) * 0.14);
    });
    points += effects().host;
    const manager = staffIn("manager").length + staffIn("director").length * 1.6;
    return points * (1 + manager * 0.06);
  }

  function seatPower() {
    const e = effects();
    return e.seats * (2.0 + e.turns);
  }

  function capacity() {
    const kitchen = Math.round(kitchenPower());
    const service = Math.round(servicePower());
    const seats = Math.round(seatPower());
    return { kitchen, service, seats, total: Math.max(0, Math.min(kitchen, service, seats)) };
  }

  function avgDishQuality() {
    const list = state.active.map(id => state.menu[id]).filter(Boolean);
    if (!list.length) return 0.8;
    return list.reduce((n, m) => n + (Number(m.q) || 1), 0) / list.length;
  }

  function menuAppeal() {
    const list = state.active.map(id => state.menu[id]).filter(Boolean);
    if (!list.length) return 0.7;
    const avg = list.reduce((n, m) => n + (Number(m.appeal) || 1), 0) / list.length;
    return clamp(0.75 + avg * 0.28 + Math.min(0.12, list.length * 0.008), 0.7, 1.35);
  }

  function quality() {
    const e = effects();
    const chefs = state.staff.filter(s => roleDef(s.role) && roleDef(s.role).chef);
    const chefSkill = chefs.length
      ? chefs.reduce((n, c) => n + effSkill(c) * (roleDef(c.role).chef || 1), 0) / chefs.length
      : 0;
    const qStaff = state.staff.reduce((n, s) => n + (roleDef(s.role).quality || 0), 0);
    const hygiene = state.staff.filter(s => roleDef(s.role).hygiene).length;
    let q = 44 + avgDishQuality() * 10 + e.q * 1.5 + (chefSkill - 2.5) * 6 + qStaff * 1.2;
    if (!chefs.length) q -= 18;
    if (!hygiene) q -= 6;
    return Math.round(clamp(q, 12, 100));
  }

  function priceIndex() {
    const list = state.active
      .filter(id => state.menu[id])
      .map(id => ({ id, m: state.menu[id] }));
    if (!list.length) return 1;
    let weight = 0, sum = 0;
    list.forEach(({ id, m }) => {
      const ref = MENU_DEFAULT[id] ? Number(MENU_DEFAULT[id].price) : Number(m.price);
      const base = ref > 0 ? ref : (Number(m.price) || 1);
      const w = Number(m.appeal) || 1;
      sum += (Number(m.price) / base) * w;
      weight += w;
    });
    return weight ? sum / weight : 1;
  }

  function ticket() {
    const list = state.active.map(id => state.menu[id]).filter(Boolean);
    if (!list.length) return 0;
    let weight = 0, sum = 0;
    list.forEach(m => {
      const w = Number(m.appeal) || 1;
      sum += (Number(m.price) || 0) * w;
      weight += w;
    });
    return weight ? (sum / weight) * 1.6 : 0;
  }

  function foodCostRatio() {
    const list = state.active.map(id => state.menu[id]).filter(Boolean);
    if (!list.length) return 0.35;
    let weight = 0, c = 0;
    list.forEach(m => {
      const w = Number(m.appeal) || 1;
      c += (Number(m.cost) || 0) * w;
      weight += (Number(m.price) || 0) * w;
    });
    return weight ? clamp(c / weight, 0.05, 0.9) : 0.35;
  }

  const stars = () => Math.round((state.rep / 20) * 10) / 10;

  /* ---------------------------------------------------------
     Demand
     --------------------------------------------------------- */
  const BASE_DEMAND = 27;
  const WEEKDAY = [1.05, 0.85, 0.8, 0.9, 1.0, 1.2, 1.35]; /* Sun → Sat */

  function demandFor(dateObj) {
    const e = effects();
    const wd = WEEKDAY[dateObj.getUTCDay()];
    const q = quality();
    const idx = priceIndex();
    const promo = state.promo && state.promo.daysLeft > 0 ? state.promo : null;

    const repMult = 0.55 + state.rep / 100;
    const qualityMult = 0.68 + (q / 100) * 0.62;
    const priceMult = Math.pow(clamp(1.85 - 0.85 * idx, 0.25, 3), 1.6);
    const socialProof = 1 + Math.min(0.12, state.reviewCount / 6000);
    const charm = 1 + e.charm / 100;
    const cuisine = (CUISINES[state.cuisine] || CUISINES.bistro).mod;

    const raw = BASE_DEMAND * wd * repMult * qualityMult * priceMult *
      state.buzz * (promo ? promo.mult : 1) * charm * menuAppeal() * socialProof * cuisine;

    return Math.max(0, Math.round(raw));
  }

  /* ---------------------------------------------------------
     Reviews
     --------------------------------------------------------- */
  const REVIEW_TEXT = {
    5: ["Best {dish} we've had in years. Booked again for Friday.",
        "Service was sharp, the {dish} was perfect. This place deserves a queue.",
        "Came for the {dish}, stayed for the wine list. Faultless night.",
        "Honestly the {dish} alone is worth the drive. Ten out of ten."],
    4: ["Really good {dish}. Slightly slow on the drinks but no complaints.",
        "Solid menu, fair prices, {dish} was the highlight.",
        "Lovely room and friendly staff. The {dish} was excellent.",
        "Good value. Would come back for the {dish} alone."],
    3: ["Food was fine, the {dish} was a little under-seasoned.",
        "Decent {dish} but we waited a while for a table.",
        "Nothing wrong, nothing memorable. {dish} was okay.",
        "Service was stretched. The {dish} saved the evening."],
    2: ["Long wait and the {dish} arrived cold. Staff looked overwhelmed.",
        "Priced high for what you get. The {dish} was disappointing.",
        "Kitchen was clearly behind. Won't rush back.",
        "Booked a table, waited forty minutes. {dish} was average."],
    1: ["Walked out after an hour. The {dish} never arrived.",
        "Cold food, no apology. Not what the reviews promised.",
        "Completely understaffed. Avoid on a busy night."]
  };

  function reviewStar(q, service, idx, promo, noise) {
    const value = clamp((1 - idx) * 1.6, -0.9, 0.7);
    let score = 3.6
      + ((q - 55) / 100) * 2.4
      + service * 0.9
      + value
      + (promo ? 0.15 : 0)
      + noise;
    return clamp(Math.round(score * 2) / 2, 1, 5);
  }

  /* ---------------------------------------------------------
     Day settlement
     --------------------------------------------------------- */
  function settleDay(dateObj) {
    const e = effects();
    const cap = capacity();
    const q = quality();
    const idx = priceIndex();
    const promo = state.promo && state.promo.daysLeft > 0 ? state.promo : null;

    const demand = demandFor(dateObj);
    const covers = Math.min(demand, cap.total);
    const turnedAway = Math.max(0, demand - covers);
    const staffCount = state.staff.length;

    /* service pressure */
    const needWaiter = Math.max(1, covers / 14);
    const waiters = state.staff.filter(s => s.role === "waiter" || s.role === "supervisor").length;
    const serviceScore = staffCount === 0 ? -1 : clamp((waiters * 1.15) / needWaiter - 1, -1, 1);

    /* revenue */
    const discount = promo ? promo.discount : 0;
    const perCover = ticket() * (1 - discount);
    const dineIn = covers * perCover;

    const listed = Number(state.upgrades.platform) > 0;
    const bikeCap = Number(e.online) || 0;
    const onlineDemand = listed ? Math.round((demand * 0.34 * (0.7 + q / 140)) * (promo ? promo.mult : 1)) : 0;
    const onlineOrders = listed ? Math.min(onlineDemand, bikeCap) : 0;
    const onlineGross = onlineOrders * perCover * 1.1;
    const commission = Math.round(onlineGross * 0.28);
    const packaging = onlineOrders * (Number(state.upgrades.packaging) > 0 ? 5 : 7);
    const onlineNet = Math.max(0, onlineGross - commission - packaging);

    const revenue = Math.round(dineIn + onlineNet);
    const foodCost = Math.round(revenue * foodCostRatio() * (1 + Math.max(0, (promo ? promo.discount : 0)) * 0.6));

    /* running costs */
    const wages = wageBill();
    const power = Math.round(65 + (covers + onlineOrders) * 2.1 + e.fast * 0.8 + e.seats * 0.4);
    const water = Math.round(22 + (covers + onlineOrders * 0.5) * 0.95);
    const rent = Math.round(e.rent / 30);
    const levies = 40;
    const wasteRate = (Number(e.waste) || 6) / 100 + Math.max(0, state.active.length - 8) * 0.012;
    const spoilage = Math.round(foodCost * clamp(wasteRate, 0.02, 0.28));

    const kitValue = upgradeList().reduce((n, u) => {
      const lvl = Number(state.upgrades[u.id]) || 0;
      let v = 0;
      for (let i = 0; i <= lvl && i < u.tiers.length; i++) v += Number(u.tiers[i].price) || 0;
      return n + v;
    }, 0);
    const maintenance = Math.round(kitValue * 0.0007);

    const marketing = promo ? Math.round(promo.costPerDay) : 0;

    /* things break. it is a kitchen. */
    let repairs = 0;
    let repairNote = "";
    if (state.businessDay >= 3 && Math.random() < 0.055) {
      const kit = upgradeList().filter(u => Number(state.upgrades[u.id]) > 0);
      const victim = kit.length ? kit[Math.floor(Math.random() * kit.length)] : { name: "the old fridge" };
      repairs = Math.round(450 + kitValue * 0.0007 + Math.random() * 1100);
      repairNote = `${victim.name} broke down — ${money(repairs)} to fix.`;
    }

    const costs = Math.round(foodCost + wages + power + water + rent + levies + spoilage + maintenance + commission + packaging + marketing + repairs);
    const profit = revenue - costs;

    /* cash */
    state.cash += profit;
    if (isFree() && state.cash < 0) state.cash = 0;   /* free play — the business cannot fail */
    state.arrears = state.cash < 0 ? Math.abs(state.cash) : 0;

    if (state.cash < 0) {
      state.unpaidDays = (state.unpaidDays || 0) + 1;
      state.cash = Math.round(state.cash * 1.015); /* overdraft interest */
      if (state.unpaidDays >= 2 && state.staff.length) {
        const weakest = state.staff.slice().sort((a, b) => a.morale - b.morale)[0];
        state.staff = state.staff.filter(s => s.id !== weakest.id);
        state.reviews.unshift({
          day: state.businessDay, stars: 1,
          text: `${weakest.name} walked out — wages were not paid.`, name: "Staff", kind: "staff"
        });
        state.unpaidDays = 0;
      }
    } else {
      state.unpaidDays = 0;
    }

    /* morale */
    state.staff.forEach(s => {
      let delta = 0;
      if (covers > cap.total * 0.95) delta -= 1.2;
      if (state.cash > 5000) delta += 0.6;
      if (state.cash < 0) delta -= 2.2;
      const ops = staffIn("manager").length + staffIn("director").length;
      if (ops) delta += 0.8;
      s.morale = clamp((Number(s.morale) || 70) + delta, 20, 100);
      s.days = (Number(s.days) || 0) + 1;
    });

    /* reviews */
    const reviewCount = covers + onlineOrders > 0 ? clamp(Math.ceil((covers + onlineOrders) / 9), 1, 8) : 0;
    let dayStars = 0;
    const dishes = state.active.map(id => state.menu[id]).filter(Boolean);
    for (let i = 0; i < reviewCount; i++) {
      const noise = (Math.random() - 0.5) * 0.7;
      const st = reviewStar(q, serviceScore, idx, promo, noise);
      const dish = dishes.length ? dishes[Math.floor(Math.random() * dishes.length)] : null;
      const band = REVIEW_TEXT[Math.round(st)] || REVIEW_TEXT[3];
      const text = band[Math.floor(Math.random() * band.length)].replace("{dish}", dish ? dish.name.toLowerCase() : "meal");
      const names = ["A. Bennett", "J. Hartley", "K. Simmons", "M. Fletcher", "T. Parker",
        "R. Dawson", "L. Whitmore", "S. Reynolds", "E. Coleman", "C. Ashford"];
      state.reviews.unshift({
        day: state.businessDay + 1,
        stars: st,
        text,
        name: names[Math.floor(Math.random() * names.length)]
      });
      dayStars += st;
    }
    if (reviewCount) {
      const avg = dayStars / reviewCount;
      const targetRep = clamp(avg * 20, 0, 100);
      state.rep = clamp(state.rep + (targetRep - state.rep) * 0.12, 0, 100);
      const buzzTarget = clamp(0.35 + (state.rep / 100) * 1.15 + Math.min(0.22, state.reviewCount / 9000), 0.5, 2.0);
      state.buzz = clamp(state.buzz + (buzzTarget - state.buzz) * 0.09, 0.5, 2.1);
      if (turnedAway > covers * 0.3) state.buzz = clamp(state.buzz - 0.015, 0.5, 2.1);
      state.reviewCount += reviewCount;
      state.reviews = state.reviews.slice(0, 40);
    }

    /* promo countdown */
    if (promo) {
      promo.daysLeft -= 1;
      if (promo.daysLeft <= 0) {
        state.promo = null;
        state.promoCooldown = 2;
      }
    } else if (state.promoCooldown > 0) {
      state.promoCooldown -= 1;
    }

    /* month + tax */
    state.month.revenue += revenue;
    state.month.costs += costs;
    state.month.profit += profit;
    state.month.day += 1;
    let tax = 0;
    if (state.month.day >= 30) {
      tax = Math.max(0, Math.round(state.month.profit * 0.27));
      state.cash -= tax;
      state.totals.tax += tax;
      state.month = { revenue: 0, costs: 0, profit: 0, tax: 0, day: 0 };
    }

    state.totals.revenue += revenue;
    state.totals.costs += costs;
    state.totals.profit += profit;
    state.totals.covers += covers;

    const report = {
      day: state.businessDay + 1,
      date: dateObj.toISOString().slice(0, 10),
      weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dateObj.getUTCDay()],
      demand, covers, turnedAway, onlineOrders,
      revenue, foodCost, wages, power, water, rent, levies, spoilage, maintenance,
      commission, packaging, marketing, repairs, repairNote, tax,
      costs: costs + tax,
      profit: profit - tax,
      cash: Math.round(state.cash),
      stars: reviewCount ? Math.round((dayStars / reviewCount) * 10) / 10 : 0,
      quality: q,
      promo: promo ? promo.label : ""
    };

    state.businessDay += 1;
    state.stats = report;
    state.history.unshift(report);
    state.history = state.history.slice(0, 60);
    save();
    emit({ type: "day", report });
    return report;
  }

  /* ---------------------------------------------------------
     Buying the restaurant
     --------------------------------------------------------- */
  function purchasePrice() {
    return Math.max(0, Math.round(Number(state.purchasePrice) || DEFAULT_PURCHASE));
  }

  function purchase() {
    if (state.owned) return { ok: false, why: "You already own it." };
    const price = purchasePrice();
    if (!isFree() && !(window.nuLimitsCanPay ? window.nuLimitsCanPay(price) : personalBalance() >= price)) {
      return { ok: false, why: `You need ${money(price)} in capital — you have ${money(personalBalance())}.` };
    }
    if (!isFree() && !payPersonal(price, `Business purchase · ${state.name}`)) {
      return { ok: false, why: "The payment did not go through." };
    }
    state.owned = true;
    state.cash = 10000;
    state.staff = startingStaff();
    state.openedOn = window.nuLimitsWorld ? window.nuLimitsWorld.date.toISOString() : new Date().toISOString();
    state.lastDay = window.nuLimitsWorld ? window.nuLimitsWorld.day : 0;
    state.rep = 62;
    save();
    emit({ type: "purchase" });
    return { ok: true, message: `${state.name} is yours — the doors open tomorrow.` };
  }

  /* ---------------------------------------------------------
     Staff
     --------------------------------------------------------- */
  function makeCandidate(roleId) {
    const r = roleDef(roleId);
    const skill = Math.round((1.6 + Math.random() * 3.2) * 10) / 10;
    const first = FIRST[Math.floor(Math.random() * FIRST.length)];
    const last = LAST[Math.floor(Math.random() * LAST.length)];
    return {
      id: uid("cand"),
      name: `${first} ${last}`,
      role: roleId,
      skill,
      morale: 70 + Math.round(Math.random() * 15),
      days: 0,
      wage: round10(r.wage * (0.82 + skill * 0.075)),
      hireFee: round10(r.wage * 2)
    };
  }

  function candidates(roleId) {
    if (!roleDef(roleId) || !roleDef(roleId).hire) return [];
    const out = [];
    for (let i = 0; i < 3; i++) out.push(makeCandidate(roleId));
    return out.sort((a, b) => b.skill - a.skill);
  }

  function hire(candidate) {
    if (!state.owned) return { ok: false, why: "Buy the restaurant first." };
    if (!candidate || !roleDef(candidate.role)) return { ok: false, why: "Unknown role." };
    if (state.staff.length >= staffCap()) {
      return { ok: false, why: `Floor space caps you at ${staffCap()} staff — expand the site.` };
    }
    const fee = Math.round(candidate.hireFee || roleDef(candidate.role).wage * 2);
    if (!isFree() && state.cash < fee) return { ok: false, why: `Hiring costs ${money(fee)} — the till has ${money(state.cash)}.` };

    if (!isFree()) state.cash -= fee;
    state.staff.push({
      id: uid("emp"),
      name: candidate.name,
      role: candidate.role,
      skill: candidate.skill,
      morale: candidate.morale || 75,
      days: 0,
      wage: candidate.wage,
      hiredDay: state.businessDay
    });
    save();
    emit({ type: "staff" });
    return { ok: true, message: `${candidate.name} hired as ${roleDef(candidate.role).label}` };
  }

  function fire(id) {
    const emp = state.staff.find(s => s.id === id);
    if (!emp) return { ok: false, why: "Employee not found." };
    const severance = Math.round(emp.wage * 3);
    state.staff = state.staff.filter(s => s.id !== id);
    if (!isFree()) state.cash -= severance;
    state.staff.forEach(s => { s.morale = clamp(s.morale - 8, 20, 100); });
    save();
    emit({ type: "staff" });
    return { ok: true, message: `${emp.name} let go — ${money(severance)} severance paid.` };
  }

  function promotionFor(emp) {
    const r = roleDef(emp.role);
    if (!r || !r.ladder) return null;
    const next = roleDef(r.ladder);
    if (!next) return null;
    const needSkill = emp.role === "waiter" || emp.role === "chef" || emp.role === "barman" ? 3.6 : 4.4;
    const needDays = emp.role === "supervisor" ? 10 : 5;
    return {
      role: r.ladder,
      label: next.label,
      wage: round10(next.wage * (0.85 + emp.skill * 0.06)),
      bonus: Math.round(next.wage * 2),
      ready: emp.skill >= needSkill && (emp.days || 0) >= needDays,
      needSkill,
      needDays
    };
  }

  function promote(id) {
    const emp = state.staff.find(s => s.id === id);
    if (!emp) return { ok: false, why: "Employee not found." };
    const p = promotionFor(emp);
    if (!p) return { ok: false, why: "No promotion path for this role." };
    if (!p.ready) {
      return { ok: false, why: `Not ready — needs ${p.needSkill.toFixed(1)} skill and ${p.needDays} days on the floor.` };
    }
    if (!isFree() && state.cash < p.bonus) return { ok: false, why: `The promotion bonus is ${money(p.bonus)}.` };

    if (!isFree()) state.cash -= p.bonus;
    emp.role = p.role;
    emp.wage = p.wage;
    emp.morale = clamp(emp.morale + 10, 0, 100);
    save();
    emit({ type: "staff" });
    return { ok: true, message: `${emp.name} promoted to ${p.label}` };
  }

  /* ---------------------------------------------------------
     Upgrades
     --------------------------------------------------------- */
  function nextTier(id) {
    const item = upgradeList().find(u => u.id === id);
    if (!item) return null;
    const lvl = Number(state.upgrades[id]) || 0;
    return item.tiers[lvl + 1] ? { item, level: lvl + 1, tier: item.tiers[lvl + 1] } : null;
  }

  function buyUpgrade(id) {
    if (!state.owned) return { ok: false, why: "Buy the restaurant first." };
    const next = nextTier(id);
    if (!next) return { ok: false, why: "Already at the top tier." };

    const price = Math.round(Number(next.tier.price) || 0);
    if (!isFree() && state.cash < price) return { ok: false, why: `This costs ${money(price)} — the till has ${money(state.cash)}.` };

    if (id === "tables" || id === "terrace") {
      const e = effects();
      const newSeats = (id === "tables" ? Number(next.tier.fx.seats) : e.seats + Number(next.tier.fx.seatsAdd || 0));
      const maxSeats = e.space <= 80 ? 30 : e.space <= 140 ? 54 : 78;
      if (newSeats > maxSeats) {
        return { ok: false, why: `Only ${maxSeats} seats fit in ${e.space} m². Expand the floor first.` };
      }
    }

    if (!isFree()) state.cash -= price;
    state.upgrades[id] = next.level;
    save();
    emit({ type: "upgrade" });
    return { ok: true, message: `${next.item.name} upgraded to ${next.tier.label}` };
  }

  /* ---------------------------------------------------------
     Menu
     --------------------------------------------------------- */
  function setPrice(id, price) {
    const item = state.menu[id];
    if (!item) return { ok: false, why: "Dish not found." };
    const p = Math.round(Number(price));
    if (!Number.isFinite(p) || p < 10 || p > 2000) return { ok: false, why: "Price must be between R 10 and R 2 000." };
    item.price = p;
    save();
    return { ok: true };
  }

  function toggleDish(id) {
    const item = state.menu[id];
    if (!item) return { ok: false, why: "Dish not found." };
    if (state.active.includes(id)) {
      if (state.active.length <= 3) return { ok: false, why: "Keep at least three dishes on the menu." };
      state.active = state.active.filter(x => x !== id);
      save();
      return { ok: true, message: `${item.name} taken off the menu` };
    }
    state.active.push(id);
    save();
    return { ok: true, message: `${item.name} added to the menu` };
  }

  /* ---------------------------------------------------------
     Promotions / online
     --------------------------------------------------------- */
  function startPromo(id) {
    const p = PROMOS.find(x => x.id === id);
    if (!p) return { ok: false, why: "Unknown promotion." };
    if (state.promo) return { ok: false, why: "A promotion is already running." };
    if (state.promoCooldown > 0) return { ok: false, why: "Give the room a few days to breathe." };
    if (!isFree() && state.cash < p.cost) return { ok: false, why: `Marketing for this costs ${money(p.cost)}.` };

    if (!isFree()) state.cash -= p.cost;
    state.promo = {
      id: p.id, label: p.label, discount: p.discount, mult: p.mult,
      daysLeft: p.days, costPerDay: Math.round(p.cost / p.days)
    };
    save();
    emit({ type: "promo" });
    return { ok: true, message: `${p.label} is live for ${p.days} days` };
  }

  function stopPromo() {
    if (!state.promo) return { ok: false, why: "Nothing running." };
    state.promo = null;
    state.promoCooldown = 2;
    save();
    return { ok: true, message: "Promotion pulled early" };
  }

  /* ---------------------------------------------------------
     Cash transfers
     --------------------------------------------------------- */
  function deposit(amount) {
    const a = Math.round(Number(amount));
    if (!Number.isFinite(a) || a <= 0) return { ok: false, why: "Enter an amount." };
    if (!isFree() && !(window.nuLimitsCanPay ? window.nuLimitsCanPay(a) : personalBalance() >= a)) return { ok: false, why: "You don't have that in your personal balance." };
    if (!isFree() && !payPersonal(a, `Capital injection · ${state.name}`)) return { ok: false, why: "Payment failed." };
    state.cash += a;
    save();
    emit({ type: "cash" });
    return { ok: true, message: `${money(a)} moved into the business` };
  }

  function withdraw(amount) {
    const a = Math.round(Number(amount));
    if (!Number.isFinite(a) || a <= 0) return { ok: false, why: "Enter an amount." };
    const available = Math.max(0, Math.floor(state.cash - 2000));
    if (a > available) return { ok: false, why: `Keep ${money(2000)} in the till — you can draw ${money(available)}.` };
    if (!receivePersonal(a, `Profit draw · ${state.name}`)) return { ok: false, why: "Transfer failed." };
    state.cash -= a;
    save();
    emit({ type: "cash" });
    return { ok: true, message: `${money(a)} drawn to your account` };
  }

  /* ---------------------------------------------------------
     Tick
     --------------------------------------------------------- */
  let listeners = [];
  const onChange = fn => listeners.push(fn);
  const emit = evt => listeners.forEach(fn => { try { fn(evt); } catch (e) {} });

  function tick() {
    if (!state.owned || !window.nuLimitsWorld) return false;
    const day = window.nuLimitsWorld.day;
    if (!state.lastDay) { state.lastDay = day; return false; }
    if (day <= state.lastDay) return false;

    let steps = Math.min(3, day - state.lastDay);
    let moved = false;
    while (steps-- > 0) {
      state.lastDay += 1;
      const d = new Date(window.nuLimitsWorld.date.getTime());
      d.setUTCDate(d.getUTCDate() - (day - state.lastDay));
      settleDay(d);
      moved = true;
    }
    state.lastDay = day;
    save();
    return moved;
  }

  /* used by QA + the "next day" button */
  function simulate(days, baseDate) {
    if (!state.owned) return [];
    const out = [];
    let d = baseDate ? new Date(baseDate) : (window.nuLimitsWorld ? new Date(window.nuLimitsWorld.date) : new Date());
    for (let i = 0; i < (days || 1); i++) {
      out.push(settleDay(d));
      d = new Date(d.getTime() + 86400000);
    }
    return out;
  }

  window.setInterval(tick, 800);

  /* ---------------------------------------------------------
     Views helpers
     --------------------------------------------------------- */
  function lastDays(n) {
    return state.history.slice(0, n || 14).slice().reverse();
  }

  function alerts() {
    const out = [];
    if (!state.owned) return out;
    if (state.cash < 0) out.push({ level: "bad", text: `The till is overdrawn by ${money(Math.abs(state.cash))} — deposit cash or the staff will walk.` });
    else if (state.cash < 3000) out.push({ level: "warn", text: `Only ${money(state.cash)} left in the till. Wages come out tomorrow.` });
    if (state.staff.length >= staffCap()) out.push({ level: "warn", text: `You're at the ${staffCap()}-person staff cap — expand the site to hire more.` });
    if (!state.staff.some(s => roleDef(s.role) && roleDef(s.role).chef)) out.push({ level: "bad", text: "No chef on the line — the kitchen is dark." });
    if (state.active.length < 5) out.push({ level: "warn", text: "A thin menu — guests have little to choose from." });
    if (state.promo) out.push({ level: "good", text: `${state.promo.label} running · ${state.promo.daysLeft} day(s) left` });
    if (state.arrears > 0) out.push({ level: "bad", text: `Overdraft interest is running at 1.5 % a day.` });
    return out;
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */
  window.nuLimitsRestaurant = {
    get state() { return state; },
    ROLES, HIREABLE, PROMOS, CUISINES, MENU_DEFAULT, UPGRADES,

    purchase, purchasePrice, personalBalance,
    hire, fire, promote, promotionFor, candidates,
    buyUpgrade, nextTier, MAX_LEVEL,
    setTier(id, level, patch) {
      const item = upgradeList().find(u => u.id === id);
      if (!item || !item.tiers[level]) return { ok: false, why: "No such level." };
      const t = item.tiers[level];
      if (patch.label != null) t.label = String(patch.label).slice(0, 26);
      if (patch.price != null) t.price = Math.max(0, Math.round(Number(patch.price) || 0));
      save();
      onChange && onChange();
      return { ok: true };
    },
    setPrice, toggleDish,
    startPromo, stopPromo,
    deposit, withdraw,
    tick, simulate, onChange, save,

    effects, capacity, kitchenPower, servicePower, seatPower, quality, stars, priceIndex,
    ticket, foodCostRatio, wageBill, staffCap, demandFor, alerts, lastDays,
    menuMap, upgradeList, roleDef, roleDefAll: () => ensureCatalog().roles,
    money, esc, clamp, uid, round10, DEFAULT_PURCHASE,

    /* edit-mode hooks */
    editProfile(patch) {
      if (patch.name != null) {
        const n = String(patch.name).trim().slice(0, 32);
        if (n.length < 2) return { ok: false, why: "Give the restaurant a name." };
        state.name = n;
      }
      if (patch.cuisine && CUISINES[patch.cuisine]) state.cuisine = patch.cuisine;
      if (patch.purchasePrice != null) {
        const p = Math.round(Number(patch.purchasePrice));
        if (p < 0) return { ok: false, why: "Price cannot be negative." };
        state.purchasePrice = p;
      }
      save();
      return { ok: true, message: "Restaurant updated" };
    },
    editMenu(id, patch) {
      ensureCatalog();
      if (id && state.catalog.menu[id]) {
        Object.assign(state.catalog.menu[id], patch);
        if (state.menu[id]) Object.assign(state.menu[id], patch);
      } else {
        const newId = "dish_" + Date.now().toString(36);
        const item = Object.assign({ name: "New dish", cat: "Food", emoji: "🍽️", price: 120, cost: 40, prep: 6, appeal: 1, q: 1 }, patch);
        state.catalog.menu[newId] = item;
        state.menu[newId] = Object.assign({}, item);
      }
      save();
      return { ok: true };
    },
    deleteMenu(id) {
      if (state.active.includes(id)) return { ok: false, why: "Take it off the menu first." };
      ensureCatalog();
      delete state.catalog.menu[id];
      delete state.menu[id];
      state.active = state.active.filter(x => x !== id);
      state.catalog.removed.menu.push(id);
      save();
      return { ok: true };
    },
    editUpgrade(id, level, patch) {
      ensureCatalog();
      const item = state.catalog.upgrades.find(u => u.id === id);
      if (!item) return { ok: false, why: "Upgrade not found." };
      const tier = item.tiers[level];
      if (!tier) return { ok: false, why: "Tier not found." };
      if (patch.name) item.name = patch.name;
      if (patch.label) tier.label = patch.label;
      if (patch.price != null) tier.price = Math.max(0, Math.round(Number(patch.price)));
      if (patch.fx) Object.assign(tier.fx, patch.fx);
      save();
      return { ok: true };
    },
    editRole(id, patch) {
      ensureCatalog();
      const r = state.catalog.roles[id];
      if (!r) return { ok: false, why: "Role not found." };
      if (patch.wage != null) r.wage = Math.max(0, Math.round(Number(patch.wage)));
      if (patch.label) r.label = patch.label;
      save();
      return { ok: true };
    },
    editEmployee(id, patch) {
      const emp = state.staff.find(s => s.id === id);
      if (!emp) return { ok: false, why: "Employee not found." };
      if (patch.name) emp.name = String(patch.name).trim().slice(0, 28) || emp.name;
      if (patch.skill != null) emp.skill = clamp(Number(patch.skill) || 1, 1, 5);
      if (patch.wage != null) emp.wage = Math.max(0, Math.round(Number(patch.wage)));
      if (patch.morale != null) emp.morale = clamp(Number(patch.morale) || 50, 0, 100);
      save();
      return { ok: true };
    },
    reset() {
      state = blank();
      save();
      emit({ type: "reset" });
    }
  };
})();
