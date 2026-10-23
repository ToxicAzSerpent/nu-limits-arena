/* ==========================================================
   NU LIMITS — FAMILY  (round 13)

   Partners, marriage, children and the household.

     · find a partner (name, age, job or college)
     · her savings and salary land in your balance
     · switch or quit her job
     · buy a wedding ring in the shop, then marry
     · a real-time mating clock decides the child's sex
     · pregnancy runs on game days, keeps going after divorce
     · hospital bill on the birth
     · Buy for Her — gifts belong to her, not to you
     · divorce costs money and freezes her possessions

   Save: nuLimitsFamily_v1
   Reads: nuLimitsAssets_v1 · nuLimitsShop_v1
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsFamily_v1";
  const GIFT_KEY = "nuLimitsGiftMode_v1";
  const PLAYER = "Obey S.";

  const CYCLE = 30;            /* salary + family cycle, game days */
  const MATING_WINDOW = 45;    /* minutes on the clock */
  const GESTATION = 30;        /* game days from conception to birth */
  const DIVORCE_FEE = 45000;
  const HOSPITAL_ONE = 28000;
  const HOSPITAL_TWINS = 46000;

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  const money = n => (Number(n) < 0 ? "−R " : "R ") +
    Math.round(Math.abs(Number(n) || 0)).toLocaleString("en-ZA");
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const uid = p => (p || "fm") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const day = () => (window.nuLimitsWorld ? window.nuLimitsWorld.day : 1);
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const moneyApi = () => window.nuLimitsMoney;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  const ICONS = {
    shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9.4V8a2.1 2.1 0 1 1 2.1-2.1"/><path d="m12 9.4 8.1 5.5a1.4 1.4 0 0 1-.8 2.6H4.7a1.4 1.4 0 0 1-.8-2.6L12 9.4Z"/></svg>',
    ring: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="5.1"/><path d="M12 3.4 9.2 7h5.6L12 3.4Z"/><path d="M9.2 7 12 9.9 14.8 7"/></svg>',
    house: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="m3.2 10.4 8.8-6.8 8.8 6.8"/><path d="M5.4 9.6V20h13.2V9.6"/><path d="M9.8 20v-5.2h4.4V20"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="M3.4 16.4v-3.1l1.9-4.2h13.4l1.9 4.2v3.1"/><path d="M3.4 16.4h17.2"/><circle cx="7.6" cy="17.9" r="1.5"/><circle cx="16.4" cy="17.9" r="1.5"/><path d="M5.3 13.3h13.4"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3.6 6.4 5.2L12 20.4 5.6 8.8 12 3.6Z"/><path d="M5.6 8.8h12.8"/></svg>'
  };

  const icoOf = cat => cat === "shop" ? "shop"
    : (cat === "car" || cat === "bike") ? "car"
      : cat === "mansion" ? "house" : "gem";

  function draw(name, cls) {
    return `<span class="fm-draw${cls ? " " + cls : ""}" aria-hidden="true">${ICONS[name] || ICONS.gem}</span>`;
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (err) { return fallback; }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (err) { return false; }
  }

  function toast(msg, bad) {
    let el = document.querySelector(".mn-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "mn-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.toggle("is-bad", !!bad);
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(el.__t);
    el.__t = window.setTimeout(() => el.classList.remove("show"), 3600);
  }

  function dateFor(dayNum) {
    const base = (window.nuLimitsWorld && window.nuLimitsWorld.date) || new Date();
    const now = day();
    const d = new Date(base.getTime() + (dayNum - now) * 86400000);
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  }

  const mmss = ms => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return m + ":" + s;
  };

  /* ---------------------------------------------------------
     Names, jobs, colleges
     --------------------------------------------------------- */
  const FIRST = ["Emily", "Sophie", "Charlotte", "Olivia", "Amelia", "Isla", "Grace",
    "Hannah", "Ella", "Lucy", "Alice", "Rose", "Claire", "Rachel", "Kate", "Laura"];
  const LAST = ["Smith", "Taylor", "Brown", "Wilson", "Davies", "Evans", "Walker",
    "Hughes", "Bennett", "Foster", "Gray", "Harris", "Baker", "Turner"];

  const JOBS = [
    { title: "Marketing coordinator", place: "Hollard", income: 18500 },
    { title: "Junior attorney", place: "Cliffe Dekker Hofmeyr", income: 32000 },
    { title: "Graphic designer", place: "Ogilvy", income: 24000 },
    { title: "Pharmacist", place: "Dis-Chem", income: 28500 },
    { title: "Primary school teacher", place: "Roedean", income: 21000 },
    { title: "Software developer", place: "Takealot", income: 41000 },
    { title: "Property agent", place: "Pam Golding", income: 27000 },
    { title: "Brand manager", place: "Nando's", income: 36500 },
    { title: "Radiographer", place: "Netcare", income: 31000 },
    { title: "Chef de partie", place: "The Test Kitchen", income: 19500 }
  ];

  const COLLEGES = [
    { title: "BCom Law", place: "Wits University", income: 0 },
    { title: "BSc Computer Science", place: "University of Pretoria", income: 0 },
    { title: "BCom Accounting", place: "UJ", income: 0 },
    { title: "Fashion design", place: "Durban University of Technology", income: 0 },
    { title: "Medicine (MBChB)", place: "University of Cape Town", income: 0 }
  ];

  const BOY_NAMES = ["Jack", "Oliver", "Harry", "George", "Henry", "William", "Thomas", "Charlie", "Edward", "Sam"];
  const GIRL_NAMES = ["Amelia", "Isla", "Ava", "Zoe", "Mia", "Isabella", "Ella", "Ruby", "Freya", "Ivy"];

  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

  function newCandidate() {
    const female = true;   /* the game models a female partner */
    const name = rand(FIRST) + " " + rand(LAST);
    const age = randInt(21, 33);
    const college = Math.random() < 0.28;
    const base = college ? rand(COLLEGES) : rand(JOBS);
    const income = college ? 0 : Math.round(base.income * (0.9 + Math.random() * 0.35) / 500) * 500;

    return {
      id: uid("pt"),
      name,
      age,
      kind: college ? "college" : "job",
      title: base.title,
      place: base.place,
      income,
      savings: Math.round(randInt(4000, 160000) / 1000) * 1000,
      status: "dating",
      since: day(),
      marriedOn: null,
      ring: null,
      ringName: null,
      lastPaid: day()
    };
  }

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  function defaults() {
    return {
      version: 1,
      player: PLAYER,
      partner: null,
      ex: [],
      children: [],
      pregnancy: null,
      mating: null,
      events: [],
      hospitalDue: 0,
      lastDay: 0
    };
  }

  function load() {
    const saved = readJSON(KEY, null) || {};
    const s = Object.assign(defaults(), saved);
    s.ex = Array.isArray(saved.ex) ? saved.ex : [];
    s.children = Array.isArray(saved.children) ? saved.children : [];
    s.events = Array.isArray(saved.events) ? saved.events.slice(0, 60) : [];
    s.partner = saved.partner && typeof saved.partner === "object" ? saved.partner : null;
    s.pregnancy = saved.pregnancy && typeof saved.pregnancy === "object" ? saved.pregnancy : null;
    s.mating = saved.mating && typeof saved.mating === "object" ? saved.mating : null;
    s.hospitalDue = Math.max(0, Math.round(Number(saved.hospitalDue) || 0));
    return s;
  }

  let state = load();
  let tab = "home";
  let candidateDraft = null;
  const persist = () => writeJSON(KEY, state);

  function event(label, amount, kind) {
    state.events.unshift({ day: day(), label, amount: Math.round(amount || 0), kind: kind || "family" });
    state.events = state.events.slice(0, 60);
  }

  const partner = () => state.partner;
  const partnerLabel = () => {
    if (state.partner) return state.partner.status === "married" ? "Wife" : "Girlfriend";
    const last = state.ex && state.ex[0];
    if (last) return last.status === "married" ? "Ex-wife" : "Ex-girlfriend";
    return "Partner";
  };
  const statusLabel = () => {
    if (!state.partner) return "Single";
    return state.partner.status === "married" ? "Married" : "Dating";
  };

  /* ---------------------------------------------------------
     Household money
     --------------------------------------------------------- */
  function credit(amount, label) {
    if (!moneyApi() || !(amount > 0)) return false;
    const ok = moneyApi().transact("income", Math.round(amount), label);
    if (ok) state.lastIncome = { label, amount: Math.round(amount), day: day() };
    return ok;
  }

  function debit(amount, label) {
    if (!moneyApi() || !(amount > 0)) return false;
    if (moneyApi().transact("expense", Math.round(amount), label)) return true;
    /* a legal bill can push the account into the overdraft */
    if (typeof moneyApi().charge === "function") return moneyApi().charge(amount, label);
    return false;
  }

  /* ---------------------------------------------------------
     Possessions — everything she owns
     --------------------------------------------------------- */
  function herAssets() {
    const data = readJSON("nuLimitsAssets_v1", null);
    if (!data || !Array.isArray(data.items)) return [];
    return data.items.filter(i => i && i.owned && i.owner === "partner");
  }

  function herShopPieces() {
    const data = readJSON("nuLimitsShop_v1", null);
    if (!data || !Array.isArray(data.stores)) return [];
    const out = [];
    data.stores.forEach(store => {
      (Array.isArray(store.products) ? store.products : []).forEach(p => {
        if (p && p.owned && p.owner === "partner") out.push({ store, p });
      });
    });
    return out;
  }

  function possessions() {
    const items = [];
    herAssets().forEach(a => items.push({
      id: a.id, kind: "asset", category: a.category || "asset",
      name: a.name || "Asset", price: Number(a.price) || 0
    }));
    herShopPieces().forEach(x => items.push({
      id: x.p.id, kind: "piece", category: "shop",
      name: x.p.name || "Piece", price: Number(x.p.price) || 0
    }));
    return items;
  }

  const possessionsValue = () => possessions().reduce((t, i) => t + i.price, 0);

  function sellAsset(id, kind) {
    if (!state.partner) {
      toast("You cannot resell her belongings when you are divorced.", true);
      return;
    }
    if (kind === "piece") {
      const data = readJSON("nuLimitsShop_v1", null);
      if (!data) return;
      let found = null;
      data.stores.forEach(s => (s.products || []).forEach(p => {
        if (p.id === id && p.owner === "partner" && p.owned) found = p;
      }));
      if (!found) return;
      const value = Math.round((Number(found.price) || 0) * 0.5);
      found.owned = false;
      found.owner = null;
      found.purchasedAt = null;
      writeJSON("nuLimitsShop_v1", data);
      credit(value, `Resold ${found.name} (hers)`);
      event(`Resold ${found.name} · ${money(value)}`, value, "resale");
      persist(); render();
      toast(`Sold ${found.name} for ${money(value)}.`);
      return;
    }

    const data = readJSON("nuLimitsAssets_v1", null);
    if (!data || !Array.isArray(data.items)) return;
    const item = data.items.find(i => i.id === id && i.owner === "partner" && i.owned);
    if (!item) return;
    const value = Math.round((Number(item.price) || 0) * 0.6);
    item.owned = false;
    item.leased = false;
    item.owner = null;
    item.acquiredAt = null;
    writeJSON("nuLimitsAssets_v1", data);
    credit(value, `Resold ${item.name} (hers)`);
    event(`Resold ${item.name} · ${money(value)}`, value, "resale");
    persist(); render();
    toast(`Sold ${item.name} for ${money(value)}.`);
  }

  /* ---------------------------------------------------------
     Gift mode — Buy for Her
     --------------------------------------------------------- */
  function giftMode() {
    try { return sessionStorage.getItem(GIFT_KEY) || null; } catch (err) { return null; }
  }

  function setGift(on) {
    try {
      if (on) sessionStorage.setItem(GIFT_KEY, state.partner ? state.partner.id : "1");
      else sessionStorage.removeItem(GIFT_KEY);
    } catch (err) { /* ignore */ }
    paintGiftBanner();
  }

  /* the bar belongs to the pages you can actually buy on */
  function onBuyPage() {
    const dp = document.getElementById("dynamic-page");
    const mc = document.getElementById("main-content");
    if (!dp || dp.hidden || (mc && !mc.hidden)) return false;
    return !!dp.querySelector(".sh-page, .mn-page, .pa-page, .gr-page, .cr-page, .cr-shell, .nl-shop");
  }

  function paintGiftBanner() {
    const existing = document.getElementById("fm-gift-bar");
    const active = !!giftMode() && !!state.partner && onBuyPage();

    if (!active) {
      if (existing) existing.remove();
      document.body.classList.remove("fm-gifting");
      return;
    }

    if (existing) {
      const label = existing.querySelector("b");
      if (label) label.textContent = state.partner.name;
      return;
    }

    const bar = document.createElement("div");
    bar.id = "fm-gift-bar";
    bar.className = "fm-gift-bar";
    bar.innerHTML = `<span class="fm-gift-dot"></span>
      Buying for <b>${esc(state.partner.name)}</b> · it belongs to her
      <button type="button" id="fm-gift-off">Cancel</button>`;
    document.body.appendChild(bar);
    document.body.classList.add("fm-gifting");

    bar.querySelector("#fm-gift-off").addEventListener("click", () => {
      setGift(false);
      toast("Gift mode off — purchases are yours again.");
    });
  }

  /* ---------------------------------------------------------
     Partner actions
     --------------------------------------------------------- */
  function offers(age) {
    const pool = JOBS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    return pool.map(j => ({
      title: j.title,
      place: j.place,
      income: Math.round(j.income * (0.85 + Math.random() * 0.4) / 500) * 500
    }));
  }

  function takePartner(c) {
    const p = Object.assign({}, c, { status: "dating", since: day(), lastPaid: day() });
    state.partner = p;
    candidateDraft = null;

    if (p.savings > 0) credit(p.savings, `Partner savings · ${p.name}`);
    event(`${p.name} moved in · brought ${money(p.savings)}`, p.savings, "partner");

    persist();
    render();
    toast(`${p.name} is your girlfriend now.`);
  }

  function quitJob() {
    const p = partner();
    if (!p) return;
    if (p.kind === "none") return toast(`${p.name} is already unemployed.`, true);
    p.kind = "none";
    p.title = "Unemployed";
    p.place = "—";
    p.income = 0;
    event(`${p.name} quit her job`, 0, "job");
    persist(); render();
    toast(`${p.name} quit her job. No more salary coming in.`);
  }

  function enrolCollege() {
    const p = partner();
    if (!p) return;
    const c = rand(COLLEGES);
    p.kind = "college";
    p.title = c.title;
    p.place = c.place;
    p.income = 0;
    event(`${p.name} enrolled at ${c.place}`, 0, "job");
    persist(); render();
    toast(`${p.name} enrolled for ${c.title}.`);
  }

  function takeJob(offer) {
    const p = partner();
    if (!p) return;
    p.kind = "job";
    p.title = offer.title;
    p.place = offer.place;
    p.income = offer.income;
    event(`${p.name} started at ${offer.place}`, offer.income, "job");
    persist(); render();
    toast(`${p.name} now earns ${money(offer.income)} a month.`);
  }

  function ownedRing() {
    const data = readJSON("nuLimitsShop_v1", null);
    if (!data || !Array.isArray(data.stores)) return null;
    for (const store of data.stores) {
      for (const p of (store.products || [])) {
        if (p.ring && p.owned && !p.owner) return { store, p };
      }
    }
    return null;
  }

  function marry() {
    const p = partner();
    if (!p) return;
    if (p.status === "married") return;

    const ring = ownedRing();
    if (!ring) {
      toast("You need a wedding ring from the shop before you can marry.", true);
      return;
    }

    const data = readJSON("nuLimitsShop_v1", null);
    data.stores.forEach(s => (s.products || []).forEach(x => {
      if (x.id === ring.p.id) { x.owned = false; x.ringGiven = true; x.purchasedAt = null; }
    }));
    writeJSON("nuLimitsShop_v1", data);

    p.status = "married";
    p.marriedOn = day();
    p.ring = ring.p.id;
    p.ringName = ring.p.name;
    event(`${p.name} said yes · married with ${ring.p.name}`, 0, "marriage");
    persist(); render();
    toast(`You married ${p.name}.`);
  }

  function endRelationship(reason, fee) {
    const p = partner();
    if (!p) return;

    if (fee > 0 && !debit(fee, `Divorce · ${p.name}`)) {
      toast(`The divorce costs ${money(fee)} — you cannot cover it yet.`, true);
      return;
    }

    state.ex.unshift({
      id: p.id,
      name: p.name,
      age: p.age,
      title: p.jobLine || p.title,
      place: p.place,
      status: p.status,
      since: p.since,
      endedOn: day(),
      reason,
      children: state.children.filter(c => c.motherId === p.id).length,
      possessions: possessions().length
    });

    state.ex = state.ex.slice(0, 20);
    event(reason === "divorce"
      ? `Divorced ${p.name} · ${money(fee)} in fees`
      : `Broke up with ${p.name}`, -fee, "breakup");

    state.partner = null;
    setGift(false);
    persist(); render();
    toast(reason === "divorce" ? `Divorced. It cost you ${money(fee)}.` : `You and ${p.name} separated.`);
  }

  function divorce() {
    if (!state.partner) return;
    if (state.partner.status !== "married") return separate();
    if (!window.confirm(`Divorce ${state.partner.name}? The settlement fee is ${money(DIVORCE_FEE)}.`)) return;
    endRelationship("divorce", DIVORCE_FEE);
  }

  function separate() {
    if (!state.partner) return;
    if (!window.confirm(`Break up with ${state.partner.name}?`)) return;
    endRelationship("separated", 0);
  }

  /* ---------------------------------------------------------
     Mating clock
     --------------------------------------------------------- */
  function startMating() {
    const p = partner();
    if (!p) return toast("You need a partner first.", true);
    if (state.pregnancy) return toast("She is already pregnant.", true);
    if (state.mating) return;

    state.mating = { startedAt: Date.now(), partnerId: p.id };
    persist(); render();
    toast("The clock is running. Stop it when you are ready.");
  }

  function stopMating() {
    const m = state.mating;
    if (!m) return;

    const partnerNow = state.partner && state.partner.id === m.partnerId ? state.partner : null;
    if (!partnerNow) {
      state.mating = null;
      persist(); render();
      return toast("She left before you stopped the clock.", true);
    }

    const elapsedMs = Date.now() - m.startedAt;
    const minutes = elapsedMs / 60000;

    /* the longer the clock runs, the more girls — and twins after 45 minutes */
    let gender = "boy";
    let twins = false;
    const roll = Math.random();

    if (minutes < 30) {
      gender = roll < 0.85 ? "boy" : "girl";
    } else if (minutes < MATING_WINDOW) {
      gender = roll < 0.80 ? "girl" : "boy";
    } else {
      if (roll < 0.65) { gender = "girl"; twins = true; }
      else gender = "girl";
    }

    state.pregnancy = {
      id: uid("pg"),
      motherId: partnerNow.id,
      motherName: partnerNow.name,
      father: state.player,
      startedDay: day(),
      dueDay: day() + GESTATION,
      gender,
      twins,
      elapsedMs,
      conceived: new Date().toISOString()
    };

    state.mating = null;
    event(`Mating clock stopped at ${mmss(elapsedMs)}`, 0, "mating");
    persist(); render();
    toast(minutes < 30
      ? "The clock stopped early — the odds favour a boy."
      : minutes < MATING_WINDOW
        ? "Almost the full window — the odds favour a girl."
        : "The full window — the odds favour twin girls.");
  }

  function deliver() {
    const pg = state.pregnancy;
    if (!pg) return;

    const surnames = String(pg.motherName || "").split(" ").slice(1).join(" ");
    const babies = [];

    const makeChild = (gender, index) => {
      const first = rand(gender === "boy" ? BOY_NAMES : GIRL_NAMES);
      return {
        id: uid("ch"),
        name: `${first} ${state.player.split(" ").slice(-1)[0] || "S."}`,
        gender,
        bornDay: day(),
        motherId: pg.motherId,
        motherName: pg.motherName,
        father: pg.father || state.player,
        twins: !!pg.twins,
        twinIndex: index,
        hospital: pg.twins ? HOSPITAL_TWINS : HOSPITAL_ONE,
        billPaid: false
      };
    };

    babies.push(makeChild(pg.gender, 0));
    if (pg.twins) babies.push(makeChild("girl", 1));

    babies.forEach(b => state.children.unshift(b));

    const bill = pg.twins ? HOSPITAL_TWINS : HOSPITAL_ONE;
    const paid = debit(bill, `Hospital · maternity${pg.twins ? " (twins)" : ""}`);
    if (!paid) state.hospitalDue += bill;
    babies.forEach(b => { b.billPaid = !!paid; });

    event(pg.twins
      ? `Twin girls born · ${babies.map(b => b.name).join(" & ")}`
      : `${babies[0].gender === "boy" ? "A boy" : "A girl"} born · ${babies[0].name}`,
      -bill, "birth");

    state.pregnancy = null;
    persist(); render();
    toast(`${babies.map(b => b.name).join(" & ")} ${babies.length > 1 ? "were" : "was"} born. Hospital bill ${money(bill)}.`);
  }

  function payHospital() {
    if (state.hospitalDue <= 0) return;
    if (!debit(state.hospitalDue, "Hospital bill · arrears")) return toast("You cannot cover the hospital bill.", true);
    state.hospitalDue = 0;
    persist(); render();
    toast("Hospital bill settled.");
  }

  /* ---------------------------------------------------------
     Day tick — salary, birth, hospital arrears
     --------------------------------------------------------- */
  let bootDay = null;

  function runDay(atDay) {
    const p = state.partner;

    if (p && p.kind === "job" && p.income > 0) {
      const last = Number(p.lastPaid) || atDay;
      if (atDay - last >= CYCLE) {
        credit(p.income, `Partner salary · ${p.name}`);
        p.lastPaid = atDay;
        event(`${p.name}'s salary · ${money(p.income)}`, p.income, "salary");
      }
    }

    if (state.pregnancy && atDay >= state.pregnancy.dueDay) deliver();

    if (state.hospitalDue > 0 && atDay % CYCLE === 0) {
      if (debit(state.hospitalDue, "Hospital bill · arrears")) state.hospitalDue = 0;
    }
  }

  function tick() {
    const d = day();
    if (bootDay === null) { bootDay = d; return; }
    if (d === bootDay) return;

    const from = bootDay;
    bootDay = d;
    for (let x = from + 1; x <= d && x - from <= 90; x++) runDay(x);
    state.lastDay = d;
    persist();
    if (isOnPage()) render();
  }

  /* ---------------------------------------------------------
     Render — shared bits
     --------------------------------------------------------- */
  const root = () => document.getElementById("dynamic-page");
  const isOnPage = () => {
    const dp = root();
    return dp && !dp.hidden && !!dp.querySelector(".fm-page");
  };

  function avatar(p) {
    const initials = String(p.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return `<span class="fm-avatar">${esc(initials)}</span>`;
  }

  function partnerCard() {
    const p = state.partner;
    if (!p) {
      return `<section class="fm-card fm-empty-card">
        <div class="fm-empty-ico">♡</div>
        <strong>No partner yet</strong>
        <p>Find someone — a name, an age, a job or a college. Her savings move into your balance the day she moves in.</p>
        <button class="fm-btn is-wide" type="button" data-fm="find">Find a partner</button>
      </section>`;
    }

    const together = day() - (p.since || day());
    const jobLine = p.kind === "job"
      ? `${esc(p.title)} · ${esc(p.place)}`
      : p.kind === "college"
        ? `${esc(p.title)} · ${esc(p.place)}`
        : "Not working";

    return `<section class="fm-card fm-partner">
      <div class="fm-partner-head">
        ${avatar(p)}
        <div class="fm-partner-id">
          <div class="fm-name-row">
            <h2>${esc(p.name)}</h2>
            <span class="fm-chip ${p.status === "married" ? "is-married" : "is-dating"}">${p.status === "married" ? "WIFE" : "GIRLFRIEND"}</span>
          </div>
          <p class="fm-sub">${p.age} years old · ${together} day${together === 1 ? "" : "s"} together</p>
        </div>
      </div>

      <div class="fm-facts">
        <span><small>${p.kind === "college" ? "STUDYING" : p.kind === "job" ? "JOB" : "STATUS"}</small><b>${jobLine}</b></span>
        <span><small>MONTHLY INCOME</small><b>${p.income > 0 ? money(p.income) : "—"}</b></span>
        <span><small>BROUGHT IN</small><b>${money(p.savings || 0)}</b></span>
        ${p.status === "married" ? `<span><small>MARRIED</small><b>Day ${p.marriedOn} · ${esc(p.ringName || "ring")}</b></span>` : ""}
      </div>

      <div class="fm-actions">
        <button class="fm-btn is-small" type="button" data-fm="switch-job">Switch job</button>
        <button class="fm-btn is-small is-ghost" type="button" data-fm="quit-job">Quit job</button>
        <button class="fm-btn is-small is-ghost" type="button" data-fm="college">College</button>
        ${p.status === "dating"
          ? `<button class="fm-btn is-small is-gold" type="button" data-fm="marry">${ownedRing() ? "Propose · ring ready" : "Marry"}</button>`
          : `<button class="fm-btn is-small is-danger" type="button" data-fm="divorce">Divorce · ${money(DIVORCE_FEE)}</button>`}
        ${p.status === "dating" ? `<button class="fm-btn is-small is-danger" type="button" data-fm="separate">Separate</button>` : ""}
      </div>

      <button class="fm-link" type="button" data-fm="find">Choose someone else →</button>
    </section>`;
  }

  function ringBlock() {
    const p = state.partner;
    if (!p || p.status === "married") return "";
    const ring = ownedRing();

    if (ring) {
      return `<section class="fm-card fm-ring">
        <div class="fm-row">
          <span class="fm-ico is-gold">💍</span>
          <span class="fm-row-main"><b>${esc(ring.p.name)}</b><small>In your wardrobe · ${money(ring.p.price)}</small></span>
          <span class="fm-chip is-good">RING READY</span>
        </div>
        <button class="fm-btn is-wide is-gold" type="button" data-fm="marry">Propose to ${esc(p.name)}</button>
        <p class="fm-fine">She says yes. The ring leaves your wardrobe and goes on her finger.</p>
      </section>`;
    }

    return `<section class="fm-card fm-ring">
      <div class="fm-row">
        <span class="fm-ico">💍</span>
        <span class="fm-row-main"><b>You need a wedding ring</b><small>A ring from the jeweller is required before a proposal.</small></span>
      </div>
      <button class="fm-btn is-wide" type="button" data-fm="rings">Buy a ring · open the jeweller</button>
    </section>`;
  }

  function pregnancyBlock() {
    const pg = state.pregnancy;
    if (!pg) return "";

    const total = Math.max(1, pg.dueDay - pg.startedDay);
    const done = clamp(day() - pg.startedDay, 0, total);
    const pct = (done / total) * 100;
    const weeks = Math.max(1, Math.round((done / total) * 40));
    const left = Math.max(0, pg.dueDay - day());

    return `<section class="fm-card fm-pregnant">
      <div class="fm-card-head">
        <div><p class="eyebrow">PREGNANCY</p><strong>${esc(pg.motherName)} is expecting</strong></div>
        <span class="fm-chip is-good">${pg.twins ? "TWINS" : "SINGLE"}</span>
      </div>

      <div class="fm-preg-wrap">
        <div class="fm-preg-figure">
        <div class="fm-preg-ring" style="--p:${pct.toFixed(1)}">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" class="fm-preg-track"/>
            <circle cx="50" cy="50" r="42" class="fm-preg-fill" style="stroke-dasharray:${(pct * 2.639).toFixed(1)} 264"/>
          </svg>
          <span class="fm-preg-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6"
                 stroke-linecap="round" stroke-linejoin="round">
              <circle cx="24" cy="16" r="8.4"/>
              <path d="M12.5 41c0-7.4 5.1-12.6 11.5-12.6S35.5 33.6 35.5 41"/>
              <path d="M25.6 6.6c1.2-2.4 3.9-3.2 5.6-2.1"/>
              <circle cx="21" cy="15.4" r=".9" fill="currentColor" stroke="none"/>
              <circle cx="27" cy="15.4" r=".9" fill="currentColor" stroke="none"/>
              <path d="M21.4 19.6c1.6 1.3 3.6 1.3 5.2 0"/>
            </svg>
            ${pg.twins ? '<i class="fm-preg-x2">×2</i>' : ""}
          </span>
        </div>
        <b class="fm-preg-week">${weeks}<small>of 40 wks</small></b>
        </div>

        <div class="fm-preg-info">
          <div class="fm-kv"><span>Mother</span><b>${esc(pg.motherName)}</b></div>
          <div class="fm-kv"><span>Father</span><b>${esc(pg.father || state.player)}</b></div>
          <div class="fm-kv"><span>Due</span><b>${dateFor(pg.dueDay)} · in ${left} day${left === 1 ? "" : "s"}</b></div>
          <div class="fm-kv"><span>Time on the clock</span><b>${mmss(pg.elapsedMs || 0)}</b></div>
        </div>
      </div>

      <div class="fm-meter"><span style="width:${pct.toFixed(1)}%"></span></div>
      <p class="fm-fine">${done} of ${total} days · ${pg.twins ? "two heartbeats" : "one heartbeat"} on the scan. The pregnancy carries on even if the relationship does not.</p>
    </section>`;
  }

  function matingBlock() {
    if (state.pregnancy) return "";
    const p = partner();

    if (!p) {
      return `<section class="fm-card fm-mating is-off">
        <div class="fm-card-head">
          <div><p class="eyebrow">MATING CLOCK</p><strong>Find a partner first</strong></div>
          <span class="fm-chip">LOCKED</span>
        </div>
        <p class="fm-copy">The clock only runs with someone in your life.</p>
      </section>`;
    }

    if (state.mating) {
      return `<section class="fm-card fm-mating is-running" data-start="${state.mating.startedAt}">
        <div class="fm-card-head">
          <div><p class="eyebrow">MATING CLOCK</p><strong>Running — ${esc(p.name)}</strong></div>
          <span class="fm-chip is-live">● LIVE</span>
        </div>

        <div class="fm-clock" id="fm-clock">00:00</div>
        <div class="fm-bar" id="fm-bar">
          <span id="fm-bar-fill" style="width:0%"></span>
          <i style="left:66.6%"></i><em style="left:66.6%">30 min</em>
          <i style="left:100%"></i><em style="left:100%">45</em>
        </div>
        <div class="fm-bar-scale"><span>0</span><span>boy window</span><span>girl window</span><span>twins</span></div>

        <div class="fm-live-facts" id="fm-live">
          <span><small>ELAPSED</small><b id="fm-elapsed">00:00</b></span>
          <span><small>MOST LIKELY</small><b id="fm-odds">A boy · 85%</b></span>
          <span><small>STOP NOW</small><b id="fm-next">before 30:00</b></span>
        </div>

        <button class="fm-btn is-wide is-danger" type="button" data-fm="stop">Stop the clock</button>
        <p class="fm-fine">Real time. Under 30 minutes it is most likely a boy. From 30 minutes it swings to a girl, and past 45 minutes twin girls are on the table.</p>
      </section>`;
    }

    return `<section class="fm-card fm-mating">
      <div class="fm-card-head">
        <div><p class="eyebrow">MATING CLOCK</p><strong>Start a family with ${esc(p.name)}</strong></div>
        <span class="fm-chip">45 MIN WINDOW</span>
      </div>

      <p class="fm-copy">Start the clock and stop it when you are ready. The time you stop decides the odds — this runs on real minutes, not game days.</p>

      <div class="fm-odds-row">
        <span class="fm-odds"><b>&lt; 30 min</b><small>Boy · 85%</small></span>
        <span class="fm-odds"><b>30 – 45 min</b><small>Girl · 80%</small></span>
        <span class="fm-odds"><b>45 min +</b><small>Twin girls · 65%</small></span>
      </div>

      <button class="fm-btn is-wide" type="button" data-fm="start">Start the clock</button>
    </section>`;
  }

  function childrenBlock() {
    const list = state.children;
    return `<section class="fm-card">
      <div class="fm-card-head">
        <div><p class="eyebrow">CHILDREN</p><strong>${list.length ? `${list.length} child${list.length === 1 ? "" : "ren"}` : "No children yet"}</strong></div>
        <span class="fm-chip">${list.length}</span>
      </div>

      ${list.length ? `<div class="fm-list">
        ${list.map(c => `<div class="fm-row">
          <span class="fm-ico ${c.gender === "boy" ? "is-blue" : "is-pink"}">${c.gender === "boy" ? "♂" : "♀"}</span>
          <span class="fm-row-main">
            <b>${esc(c.name)}${c.twins ? ` <i class="fm-twin">twin ${c.twinIndex === 0 ? "1" : "2"}</i>` : ""}</b>
            <small>${esc(c.motherName)} &amp; ${esc(c.father)} · born day ${c.bornDay}</small>
          </span>
          <span class="fm-bill ${c.billPaid ? "is-paid" : "is-due"}">${c.billPaid ? "PAID" : "DUE"}</span>
        </div>`).join("")}
      </div>` : `<p class="fm-fine">Children appear here with their name, both parents and the hospital bill.</p>`}

    </section>`;
  }

  function hospitalAlert() {
    if (!(state.hospitalDue > 0)) return "";
    return `<div class="fm-alert">
      <span class="fm-alert-ico" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round"><path d="M12 8.5v7M8.5 12h7"/>
             <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="3.4"/></svg>
      </span>
      <div>
        <strong>Hospital account outstanding: ${money(state.hospitalDue)}</strong>
        <span>Maternity bills are collected after the birth.</span>
      </div>
      <button class="fm-btn is-small" type="button" data-fm="pay-hospital">Pay</button>
    </div>`;
  }

  function giftBlock() {
    const p = partner();
    if (!p) return "";

    const items = possessions();
    const value = items.reduce((t, i) => t + i.price, 0);

    return `<section class="fm-card">
      <div class="fm-card-head">
        <div><p class="eyebrow">BUY FOR HER</p><strong>${esc(p.name)}'s things</strong></div>
        <span class="fm-chip">${money(value)}</span>
      </div>

      <p class="fm-copy">Shop under her name. Anything bought in gift mode belongs to her — it shows up in Properties under <b>${partnerLabel()}</b>, not in your collection.</p>

      <div class="fm-tiles">
        <button type="button" data-fm="gift-shop">${draw("shop")}<b>Shop</b><small>Dresses &amp; bags</small></button>
        <button type="button" data-fm="gift-rings">${draw("ring")}<b>Jeweller</b><small>Rings &amp; gold</small></button>
        <button type="button" data-fm="gift-property">${draw("house")}<b>Property</b><small>Houses</small></button>
        <button type="button" data-fm="gift-garage">${draw("car")}<b>Cars</b><small>Garage</small></button>
      </div>

      <div class="fm-list">
        ${items.length ? items.map(i => `<div class="fm-row">
          <span class="fm-ico">${draw(icoOf(i.category))}</span>
          <span class="fm-row-main"><b>${esc(i.name)}</b><small>${esc(i.category)} · ${money(i.price)}</small></span>
          <button class="fm-mini" type="button" data-fm="resell" data-id="${esc(i.id)}" data-kind="${i.kind}">Resell</button>
        </div>`).join("") : `<p class="fm-fine">Nothing yet — buy her something.</p>`}
      </div>

      ${p.status !== "married" ? `<p class="fm-fine">A girlfriend keeps what you buy her if you split, and you cannot resell it afterwards.</p>` : ""}
    </section>`;
  }

  function historyBlock() {
    const ex = state.ex;
    if (!ex.length) return "";
    return `<section class="fm-card">
      <div class="fm-card-head">
        <div><p class="eyebrow">PREVIOUS PARTNERS</p><strong>${ex.length}</strong></div>
      </div>
      <div class="fm-list">
        ${ex.map(x => `<div class="fm-row">
          <span class="fm-ico is-muted">${esc(String(x.name).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase())}</span>
          <span class="fm-row-main"><b>${esc(x.name)}</b>
            <small>${[
              x.title ? esc(x.title) : "",
              x.place ? esc(x.place) : "",
              x.status === "married" ? "Married" : "Dating",
              (x.since && x.endedOn) ? `day ${x.since}–${x.endedOn}` : "",
              `${x.children} child${x.children === 1 ? "" : "ren"}`
            ].filter(Boolean).join(" · ")}</small>
          </span>
          <span class="fm-chip ${x.reason === "divorce" ? "is-bad" : ""}">${x.reason === "divorce" ? "DIVORCED" : "SEPARATED"}</span>
        </div>`).join("")}
      </div>
      <p class="fm-fine">Her possessions stay with her after the split and cannot be resold.</p>
    </section>`;
  }

  function eventsBlock() {
    if (!state.events.length) return "";
    return `<section class="fm-card">
      <p class="eyebrow">FAMILY RECORD</p>
      <div class="fm-list">
        ${state.events.slice(0, 8).map(e => `<div class="fm-row">
          <span class="fm-ico ${e.amount < 0 ? "is-pink" : e.amount > 0 ? "is-good" : "is-muted"}">${e.amount < 0 ? "−" : e.amount > 0 ? "+" : "•"}</span>
          <span class="fm-row-main"><b>${esc(e.label)}</b><small>Day ${e.day}</small></span>
          ${e.amount ? `<strong class="fm-amt ${e.amount < 0 ? "is-neg" : ""}">${money(Math.abs(e.amount))}</strong>` : ""}
        </div>`).join("")}
      </div>
    </section>`;
  }

  function editBlock() {
    if (!editOn()) return "";
    const p = partner();
    return `<section class="fm-card fm-edit">
      <div class="fm-card-head">
        <div><p class="eyebrow">CREATOR EDIT MODE</p><strong>Family tools</strong></div>
        <span class="fm-chip">TESTING</span>
      </div>

      ${p ? `<div class="fm-edit-row">
        <label>Name</label>
        <input id="fm-edit-name" type="text" value="${esc(p.name)}" maxlength="28">
      </div>
      <div class="fm-edit-row">
        <label>Age</label>
        <input id="fm-edit-age" type="number" min="18" max="80" value="${p.age}">
      </div>
      <div class="fm-edit-row">
        <label>Monthly income</label>
        <input id="fm-edit-income" type="number" min="0" step="500" value="${p.income}">
      </div>
      <button class="fm-btn is-small" type="button" data-fm="edit-save">Save partner</button>` : `<p class="fm-fine">Add a partner to edit her details.</p>`}

      <div class="fm-actions">
        ${state.mating ? `<button class="fm-btn is-small is-ghost" type="button" data-fm="edit-32">Wind clock to 32 min</button>
        <button class="fm-btn is-small is-ghost" type="button" data-fm="edit-46">Wind to 46 min</button>` : ""}
        ${state.pregnancy ? `<button class="fm-btn is-small is-gold" type="button" data-fm="birth-now">Birth now</button>` : ""}
        <button class="fm-btn is-small is-danger" type="button" data-fm="reset">Reset family</button>
      </div>
    </section>`;
  }

  function render() {
    const dp = root();
    if (!dp) return;

    const p = state.partner;
    const kids = state.children.length;
    const label = partnerLabel();

    dp.innerHTML = `<section class="dynamic-page-content fm-page">
      <header class="fm-hero">
        <div class="fm-hero-main">
          <span class="fm-hero-ico" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="10" r="4.2"/><circle cx="23" cy="12" r="3.4"/>
              <path d="M3.8 26c0-4 3.2-7 7.2-7s7.2 3 7.2 7"/><path d="M19.4 26c0-3.4 2-6 4.6-6s4.2 2.2 4.2 5"/>
            </svg>
          </span>
          <div>
            <p class="eyebrow">NU LIMITS / HOUSEHOLD</p>
            <h1>Family</h1>
            <p class="muted">${p ? `${esc(p.name)} · ${statusLabel()} · ${kids} child${kids === 1 ? "" : "ren"}` : "Single · no children yet"}</p>
          </div>
        </div>
      </header>

      <div class="fm-stats">
        <span><small>STATUS</small><strong>${statusLabel()}</strong></span>
        <span><small>CHILDREN</small><strong>${kids}</strong></span>
        <span><small>${p ? "HER THINGS" : "PAST PARTNERS"}</small><strong>${p ? money(possessionsValue()) : state.ex.length}</strong></span>
      </div>

      ${hospitalAlert()}
      ${partnerCard()}
      ${p ? ringBlock() : ""}
      ${pregnancyBlock()}
      ${p ? matingBlock() : ""}
      ${childrenBlock()}
      ${p ? giftBlock() : ""}
      ${historyBlock()}
      ${eventsBlock()}
      ${editBlock()}

      <p class="fm-disclaimer">Simulated household. Names, jobs and pregnancies are part of the game.</p>
    </section>`;

    paintGiftBanner();
    startClock();
  }

  /* ---------------------------------------------------------
     Mating clock — live paint
     --------------------------------------------------------- */
  let clockTimer = null;
  let clockEls = null;

  function startClock() {
    stopClock();
    const wrap = document.querySelector(".fm-mating.is-running");
    if (!wrap) return;

    const startedAt = Number(wrap.dataset.start) || Date.now();
    clockEls = {
      clock: document.getElementById("fm-clock"),
      fill: document.getElementById("fm-bar-fill"),
      elapsed: document.getElementById("fm-elapsed"),
      odds: document.getElementById("fm-odds"),
      next: document.getElementById("fm-next")
    };

    const paint = () => {
      const ms = Date.now() - startedAt;
      const minutes = ms / 60000;
      const pct = clamp((minutes / MATING_WINDOW) * 100, 0, 100);

      if (clockEls.clock) clockEls.clock.textContent = mmss(ms);
      if (clockEls.fill) clockEls.fill.style.width = pct.toFixed(2) + "%";
      if (clockEls.elapsed) clockEls.elapsed.textContent = mmss(ms);

      if (clockEls.odds) {
        clockEls.odds.textContent = minutes < 30
          ? "A boy · 85%"
          : minutes < MATING_WINDOW
            ? "A girl · 80%"
            : "Twin girls · 65%";
      }

      if (clockEls.next) {
        clockEls.next.textContent = minutes < 30
          ? `${mmss((30 * 60000) - ms)} to the girl window`
          : minutes < MATING_WINDOW
            ? `${mmss((MATING_WINDOW * 60000) - ms)} to twins`
            : "twins are most likely";
      }
    };

    paint();
    clockTimer = window.setInterval(paint, 500);
  }

  function stopClock() {
    if (clockTimer) window.clearInterval(clockTimer);
    clockTimer = null;
    clockEls = null;
  }

  /* ---------------------------------------------------------
     Candidate sheet
     --------------------------------------------------------- */
  function openCandidateSheet() {
    candidateDraft = [newCandidate(), newCandidate(), newCandidate()];

    const sheet = document.createElement("div");
    sheet.className = "fm-sheet";
    sheet.innerHTML = `<div class="fm-sheet-card">
      <div class="fm-sheet-head">
        <p class="eyebrow">WHO CATCHES YOUR EYE?</p>
        <button type="button" class="fm-sheet-x" data-x>✕</button>
      </div>
      <div class="fm-cands">
        ${candidateDraft.map((c, i) => `<article class="fm-cand" data-pick="${i}">
          <span class="fm-avatar">${esc(c.name.split(" ").map(w => w[0]).join("").slice(0, 2))}</span>
          <div class="fm-cand-main">
            <b>${esc(c.name)}</b>
            <small>${c.age} · ${esc(c.title)} · ${esc(c.place)}</small>
            <em>${c.income > 0 ? money(c.income) + " / month" : "Student · no income"}</em>
          </div>
          <span class="fm-cand-pick">Choose</span>
        </article>`).join("")}
      </div>
      <p class="fm-fine">Her savings (${money(candidateDraft[0].savings)}–${money(candidateDraft[2].savings)}) move into your balance when she moves in.</p>
    </div>`;

    document.body.appendChild(sheet);
    requestAnimationFrame(() => sheet.classList.add("show"));

    const close = () => {
      sheet.classList.remove("show");
      window.setTimeout(() => sheet.remove(), 220);
    };

    sheet.addEventListener("click", e => {
      if (e.target === sheet || e.target.closest("[data-x]")) return close();
      const pick = e.target.closest("[data-pick]");
      if (!pick) return;
      const c = candidateDraft[Number(pick.dataset.pick)];
      close();

      if (state.partner) {
        if (state.partner.status === "married") {
          if (!window.confirm(`You are married to ${state.partner.name}. Divorce her for ${money(DIVORCE_FEE)} and start with ${c.name}?`)) return;
          if (!debit(DIVORCE_FEE, `Divorce · ${state.partner.name}`)) {
            return toast(`The divorce costs ${money(DIVORCE_FEE)} — you cannot cover it yet.`, true);
          }
          endRelationship("divorce", 0);
        } else {
          if (!window.confirm(`Leave ${state.partner.name} and start with ${c.name}?`)) return;
          endRelationship("separated", 0);
        }
      }
      takePartner(c);
    });
  }

  function openJobSheet() {
    const p = partner();
    if (!p) return;
    const list = offers(p.age);

    const sheet = document.createElement("div");
    sheet.className = "fm-sheet";
    sheet.innerHTML = `<div class="fm-sheet-card">
      <div class="fm-sheet-head">
        <p class="eyebrow">OFFERS FOR ${esc(p.name.toUpperCase())}</p>
        <button type="button" class="fm-sheet-x" data-x>✕</button>
      </div>
      <div class="fm-cands">
        ${list.map((o, i) => `<article class="fm-cand" data-offer="${i}">
          <span class="fm-ico">🏢</span>
          <div class="fm-cand-main">
            <b>${esc(o.title)}</b>
            <small>${esc(o.place)}</small>
            <em>${money(o.income)} / month</em>
          </div>
          <span class="fm-cand-pick">Take</span>
        </article>`).join("")}
      </div>
      <p class="fm-fine">Switching is instant in this game. Her new salary is paid into your balance every 30 days.</p>
    </div>`;

    document.body.appendChild(sheet);
    requestAnimationFrame(() => sheet.classList.add("show"));

    const close = () => {
      sheet.classList.remove("show");
      window.setTimeout(() => sheet.remove(), 220);
    };

    sheet.addEventListener("click", e => {
      if (e.target === sheet || e.target.closest("[data-x]")) return close();
      const pick = e.target.closest("[data-offer]");
      if (!pick) return;
      close();
      takeJob(list[Number(pick.dataset.offer)]);
    });
  }

  /* ---------------------------------------------------------
     Events
     --------------------------------------------------------- */
  document.addEventListener("click", e => {
    const scope = e.target.closest("#dynamic-page .fm-page");
    if (!scope) return;

    const btn = e.target.closest("[data-fm]");
    if (!btn) return;
    const act = btn.dataset.fm;

    if (act === "find") return openCandidateSheet();
    if (act === "switch-job") return openJobSheet();
    if (act === "quit-job") return quitJob();
    if (act === "college") return enrolCollege();
    if (act === "marry") return marry();
    if (act === "divorce") return divorce();
    if (act === "separate") return separate();
    if (act === "start") return startMating();
    if (act === "stop") return stopMating();
    if (act === "pay-hospital") return payHospital();

    if (act === "rings" || act === "gift-rings") {
      setGift(act === "gift-rings");
      window.navigateTo("shop");
      window.setTimeout(() => {
        const tiles = Array.from(document.querySelectorAll("#dynamic-page [data-store]"));
        const tile = tiles.find(t => t.dataset.store === "jewellery") ||
                     tiles.find(t => /cartier|jewel/i.test(t.textContent || ""));
        if (tile) tile.click();
      }, 400);
      return;
    }

    if (act === "gift-shop") { setGift(true); return window.navigateTo("shop"); }
    if (act === "gift-property") { setGift(true); return window.navigateTo("property"); }
    if (act === "gift-garage") { setGift(true); return window.navigateTo("garage"); }

    if (act === "resell") return sellAsset(btn.dataset.id, btn.dataset.kind);

    if (act === "edit-save" && editOn()) {
      const p = partner();
      if (!p) return;
      const name = scope.querySelector("#fm-edit-name");
      const age = scope.querySelector("#fm-edit-age");
      const income = scope.querySelector("#fm-edit-income");
      if (name) p.name = String(name.value || p.name).slice(0, 28);
      if (age) p.age = clamp(Math.round(Number(age.value) || p.age), 18, 80);
      if (income) p.income = Math.max(0, Math.round(Number(income.value) || 0));
      p.kind = p.income > 0 ? "job" : p.kind;
      persist(); render();
      return toast("Partner details saved.");
    }

    if (act === "edit-32" && editOn()) {
      if (!state.mating) return;
      state.mating.startedAt = Date.now() - 32 * 60000;
      persist(); render();
      return toast("Clock wound to 32 minutes.");
    }

    if (act === "edit-46" && editOn()) {
      if (!state.mating) return;
      state.mating.startedAt = Date.now() - 46 * 60000;
      persist(); render();
      return toast("Clock wound to 46 minutes.");
    }

    if (act === "birth-now" && editOn()) {
      if (!state.pregnancy) return;
      state.pregnancy.dueDay = day();
      deliver();
      return;
    }

    if (act === "reset" && editOn()) {
      if (!window.confirm("Reset the whole family? Partners, children and pregnancies are cleared.")) return;
      state = defaults();
      bootDay = day();
      persist(); render();
      return toast("Family reset.");
    }
  });

  /* ---------------------------------------------------------
     Routing
     --------------------------------------------------------- */
  const prevNavigate = window.navigateTo;

  window.navigateTo = function (page) {
    if (page === "family") {
      document.querySelectorAll(".nav-item").forEach(b =>
        b.classList.toggle("active", b.dataset.page === "family"));
      if (typeof window.nuLimitsInvestLeave === "function") window.nuLimitsInvestLeave();

      const main = document.getElementById("main-content");
      const dp = root();
      if (!main || !dp) return;
      main.hidden = true;
      dp.hidden = false;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const out = prevNavigate.apply(this, arguments);
    window.setTimeout(paintGiftBanner, 60);
    return out;
  };

  document.querySelectorAll('[data-page="family"]').forEach(el => {
    el.addEventListener("click", () => window.navigateTo("family"));
  });

  if (window.nuLimitsEditMode && typeof window.nuLimitsEditMode.onChange === "function") {
    window.nuLimitsEditMode.onChange(() => { if (isOnPage()) render(); });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  bootDay = day();
  paintGiftBanner();
  window.setInterval(tick, 900);

  window.nuLimitsFamily = {
    get state() { return state; },
    partner,
    partnerLabel,
    statusLabel,
    giftMode,
    setGift,
    possessions,
    sellAsset,
    render
  };
})();
