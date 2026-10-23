/* ==========================================================
   NU LIMITS — CREATOR BUSINESS  ·  CORE SIMULATION
   Round 8 · YouTube Content Creator

   Owns all state and maths: channel, PCs and gear,
   compatibility, production, trends, publishing,
   livestreaming, revenue, expenses, skills, milestones.

   Save: nuLimitsCreator_v1
   Money: window.nuLimitsMoney (every rand goes through it)
   Time:  window.nuLimitsWorld (1 game day = 15 s)
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsCreator_v1";
  const DAY_MS = (window.nuLimitsWorld && window.nuLimitsWorld.DAY_MS) || 15000;
  const PLATFORM_SHARE = 0.45;      /* YouTube keeps this slice */
  const MONETISE_SUBS = 1000;
  const MONETISE_VIEWS = 15000;

  const clamp = (n, a, b) => Math.min(b, Math.max(a, Math.round(Number(n) || 0)));
  const money = n => "R " + Math.round(Number(n) || 0).toLocaleString("en-ZA");
  const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  /* ---------------------------------------------------------
     Niches
     --------------------------------------------------------- */
  const NICHES = {
    gaming: { label: "Gaming", blurb: "Gameplay, challenges, tutorials", photo: "images/creator/gaming.jpg", rpm: 44, conv: 1.0 },
    irl: { label: "IRL / Lifestyle", blurb: "Vlogs, daily life, travel", photo: "images/creator/irl.jpg", rpm: 30, conv: 1.2 },
    tech: { label: "Reviews & Tech", blurb: "Unboxings, hardware, comparisons", photo: "images/creator/tech.jpg", rpm: 58, conv: 0.9 },
    esports: { label: "Esports", blurb: "Ranked, tournaments, analysis", photo: "images/creator/esports.jpg", rpm: 40, conv: 1.05 }
  };

  /* ---------------------------------------------------------
     Equipment catalogue
     --------------------------------------------------------- */
  const SHOP = {
    cpu: [
      { id: "cpu1", name: "Ryzen 3 4100", price: 4500, tier: 1, socket: "AM4", watts: 65, note: "4-core · entry" },
      { id: "cpu2", name: "Ryzen 7 5800X", price: 14000, tier: 2, socket: "AM4", watts: 105, note: "8-core · strong" },
      { id: "cpu3", name: "Ryzen 7 7800X3D", price: 26500, tier: 3, socket: "AM5", watts: 120, note: "8-core · gaming king" },
      { id: "cpu4", name: "Ryzen 9 7950X", price: 38000, tier: 4, socket: "AM5", watts: 170, note: "16-core · workstation" }
    ],
    mobo: [
      { id: "mb1", name: "B450M DS3H", price: 3200, tier: 1, socket: "AM4", mem: "DDR4", note: "AM4 · DDR4" },
      { id: "mb2", name: "X570 Pro", price: 8500, tier: 2, socket: "AM4", mem: "DDR4", note: "AM4 · DDR4 · PCIe 4" },
      { id: "mb3", name: "B650 Tomahawk", price: 12500, tier: 3, socket: "AM5", mem: "DDR5", note: "AM5 · DDR5" },
      { id: "mb4", name: "X670E Hero", price: 21000, tier: 4, socket: "AM5", mem: "DDR5", note: "AM5 · DDR5 · flagship" }
    ],
    ram: [
      { id: "ram1", name: "16 GB DDR4-3200", price: 1800, tier: 1, gen: "DDR4", note: "2 × 8 GB" },
      { id: "ram2", name: "32 GB DDR4-3600", price: 3400, tier: 2, gen: "DDR4", note: "2 × 16 GB" },
      { id: "ram3", name: "32 GB DDR5-6000", price: 6900, tier: 3, gen: "DDR5", note: "2 × 16 GB" },
      { id: "ram4", name: "64 GB DDR5-6000", price: 12500, tier: 4, gen: "DDR5", note: "2 × 32 GB" }
    ],
    gpu: [
      { id: "gpu1", name: "GTX 1650", price: 5500, tier: 1, watts: 75, note: "1080p low · encode ok" },
      { id: "gpu2", name: "RTX 3060 12GB", price: 12000, tier: 2, watts: 170, note: "1080p60 · NVENC" },
      { id: "gpu3", name: "RTX 4070", price: 24000, tier: 3, watts: 200, note: "1440p · dual encoder" },
      { id: "gpu4", name: "RTX 4090", price: 48000, tier: 4, watts: 450, note: "4K · no compromise" }
    ],
    ssd: [
      { id: "ssd1", name: "500 GB SATA", price: 900, tier: 1, cap: 2, note: "Slow exports" },
      { id: "ssd2", name: "1 TB NVMe", price: 1900, tier: 2, cap: 4, note: "Faster renders" },
      { id: "ssd3", name: "2 TB NVMe Gen4", price: 4200, tier: 3, cap: 8, note: "Big project files" },
      { id: "ssd4", name: "4 TB NVMe Gen4", price: 7800, tier: 4, cap: 16, note: "Archive everything" }
    ],
    psu: [
      { id: "psu1", name: "450 W Bronze", price: 900, watts: 450, tier: 1, note: "Small builds" },
      { id: "psu2", name: "750 W Gold", price: 2200, watts: 750, tier: 2, note: "Mid-range builds" },
      { id: "psu3", name: "1000 W Platinum", price: 4600, watts: 1000, tier: 3, note: "Flagship builds" }
    ],
    cooling: [
      { id: "cool1", name: "Stock air cooler", price: 400, cool: 1, tier: 1, note: "Throttles under load" },
      { id: "cool2", name: "Tower air cooler", price: 1400, cool: 2, tier: 2, note: "Quiet and safe" },
      { id: "cool3", name: "240 mm AIO", price: 3200, cool: 3, tier: 3, note: "Sustained loads" },
      { id: "cool4", name: "360 mm AIO", price: 5600, cool: 4, tier: 4, note: "Silent at full tilt" }
    ],
    case: [
      { id: "case1", name: "Mesh mid-tower", price: 1200, tier: 1, note: "Two fans" },
      { id: "case2", name: "Airflow full tower", price: 3000, tier: 2, note: "Six fans" }
    ],
    monitor: [
      { id: "mon1", name: "24″ 60 Hz", price: 2500, tier: 1, note: "Basic display" },
      { id: "mon2", name: "27″ 144 Hz", price: 7500, tier: 2, note: "Smooth editing" },
      { id: "mon3", name: "32″ 240 Hz", price: 16000, tier: 3, note: "Competitive" },
      { id: "mon4", name: "34″ 4K 144 Hz", price: 24000, tier: 4, note: "Colour-accurate" }
    ],
    mic: [
      { id: "mic1", name: "USB headset mic", price: 900, tier: 1, note: "Thin, roomy audio" },
      { id: "mic2", name: "USB condenser", price: 3200, tier: 2, note: "Clean voice" },
      { id: "mic3", name: "XLR condenser + interface", price: 9500, tier: 3, note: "Broadcast quality" }
    ],
    camera: [
      { id: "cam0", name: "Phone camera", price: 0, tier: 1, note: "Good enough to start" },
      { id: "cam1", name: "Mirrorless 1080p", price: 12000, tier: 2, note: "Clean 1080p" },
      { id: "cam2", name: "Mirrorless 4K", price: 28000, tier: 3, note: "Sharp 4K30" },
      { id: "cam3", name: "Cinema 6K + lens", price: 62000, tier: 4, note: "Studio grade" }
    ],
    light: [
      { id: "lit1", name: "Desk lamp", price: 500, tier: 1, note: "Uneven light" },
      { id: "lit2", name: "Softbox pair", price: 3800, tier: 2, note: "Even key light" },
      { id: "lit3", name: "3-point studio lighting", price: 9500, tier: 3, note: "Cinematic" }
    ],
    capture: [
      { id: "cap1", name: "1080p60 capture card", price: 4200, tier: 1, note: "Console capture" },
      { id: "cap2", name: "4K60 capture card", price: 9800, tier: 2, note: "Console + camera" }
    ],
    internet: [
      { id: "net1", name: "Fibre 50/50", price: 0, up: 25, cost: 700, note: "25 Mbps up · 720p" },
      { id: "net2", name: "Fibre 200/200", price: 2500, up: 100, cost: 1200, note: "100 Mbps up · 1080p" },
      { id: "net3", name: "Fibre 1 Gbps", price: 6000, up: 400, cost: 2200, note: "400 Mbps up · 1440p" }
    ],
    room: [
      { id: "room1", name: "Bedroom corner", price: 0, bonus: 0, cost: 0, note: "No rent · thin walls" },
      { id: "room2", name: "Rented studio", price: 45000, bonus: 8, cost: 2500, note: "Treated · quiet" },
      { id: "room3", name: "Pro studio build-out", price: 180000, bonus: 16, cost: 6000, note: "Acoustic build · sets" }
    ]
  };

  const SLOT_LABEL = {
    cpu: "Processor", mobo: "Motherboard", ram: "Memory", gpu: "Graphics card",
    ssd: "Storage", psu: "Power supply", cooling: "Cooling", case: "Case",
    monitor: "Monitor", mic: "Microphone", camera: "Camera", light: "Lighting",
    capture: "Capture card", internet: "Internet", room: "Studio space"
  };

  const PC_SLOTS = ["cpu", "mobo", "ram", "gpu", "ssd", "psu", "cooling", "case"];
  const GEAR_SLOTS = ["monitor", "mic", "camera", "light", "capture"];

  /* ---------------------------------------------------------
     Content types
     --------------------------------------------------------- */
  const TYPES = {
    gameplay: { niche: "gaming", name: "Gameplay video", days: 1, appeal: 1.00, need: { perf: 20 }, cost: 120, skill: "production" },
    challenge: { niche: "gaming", name: "Challenge video", days: 2, appeal: 1.18, need: { perf: 40 }, cost: 240, skill: "editing" },
    gamedu: { niche: "gaming", name: "Tutorial / guide", days: 2, appeal: 0.96, need: { perf: 25, mic: 2 }, cost: 190, skill: "planning" },
    streamclip: { niche: "gaming", name: "Stream highlights", days: 1, appeal: 1.22, need: { perf: 45, capture: 1 }, cost: 170, skill: "editing" },

    vlog: { niche: "irl", name: "Vlog", days: 1, appeal: 1.05, need: { camera: 1 }, cost: 110, skill: "production" },
    daylife: { niche: "irl", name: "Day in the life", days: 1, appeal: 0.94, need: { camera: 1 }, cost: 110, skill: "engagement" },
    travel: { niche: "irl", name: "Travel film", days: 3, appeal: 1.30, need: { camera: 2 }, cost: 420, skill: "production" },
    irlchallenge: { niche: "irl", name: "Lifestyle challenge", days: 2, appeal: 1.15, need: { camera: 2 }, cost: 260, skill: "engagement" },

    unboxing: { niche: "tech", name: "Unboxing", days: 1, appeal: 1.10, need: { camera: 2 }, cost: 150, skill: "production" },
    review: { niche: "tech", name: "Hardware review", days: 2, appeal: 1.16, need: { camera: 2, mic: 2 }, cost: 280, skill: "editing" },
    compare: { niche: "tech", name: "Comparison test", days: 3, appeal: 1.24, need: { camera: 2, perf: 30 }, cost: 380, skill: "planning" },
    techtut: { niche: "tech", name: "Tech tutorial", days: 2, appeal: 0.98, need: { camera: 1, mic: 2 }, cost: 210, skill: "planning" },

    ranked: { niche: "esports", name: "Ranked highlights", days: 1, appeal: 1.08, need: { perf: 40 }, cost: 150, skill: "production" },
    tournament: { niche: "esports", name: "Tournament recap", days: 2, appeal: 1.22, need: { perf: 45 }, cost: 260, skill: "editing" },
    strategy: { niche: "esports", name: "Strategy guide", days: 2, appeal: 1.00, need: { perf: 30, mic: 2 }, cost: 220, skill: "planning" },
    analysis: { niche: "esports", name: "Match analysis", days: 3, appeal: 1.14, need: { perf: 55, mic: 2 }, cost: 330, skill: "editing" }
  };

  const TREND_LEVELS = ["low", "normal", "high", "viral"];
  const TREND_MULT = { low: 0.55, normal: 1, high: 1.7, viral: 2.8 };
  const TREND_LABEL = { low: "Low", normal: "Normal", high: "High", viral: "Viral" };

  const MILESTONES = [
    { id: "firstUpload", label: "Publish your first video", kind: "published", target: 1, reward: 500 },
    { id: "hundred", label: "Reach 100 subscribers", kind: "subs", target: 100, reward: 1000 },
    { id: "firstStream", label: "Finish your first livestream", kind: "streams", target: 1, reward: 750 },
    { id: "thousand", label: "Reach 1 000 subscribers", kind: "subs", target: 1000, reward: 2500 },
    { id: "monetised", label: "Monetise the channel", kind: "monetised", target: 1, reward: 5000 },
    { id: "viral", label: "Land a 100 000-view video", kind: "vidViews", target: 100000, reward: 12000 },
    { id: "tenk", label: "Reach 10 000 subscribers", kind: "subs", target: 10000, reward: 15000 },
    { id: "studio", label: "Own a pro studio build-out", kind: "room", target: "room3", reward: 20000 }
  ];

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  function starterPc(name) {
    return {
      id: uid("pc"),
      name: name || "Studio PC",
      condition: 100,
      parts: { cpu: "cpu1", mobo: "mb1", ram: "ram1", gpu: "gpu1", ssd: "ssd1", psu: "psu1", cooling: "cool1", case: "case1" }
    };
  }

  /* ---------------------------------------------------------
     Editable catalogue (creator edit mode writes here)
     --------------------------------------------------------- */
  function defaultCatalog() {
    const shop = {};
    Object.keys(SHOP).forEach(slot => {
      shop[slot] = SHOP[slot].map(x => Object.assign({}, x));
    });
    const types = {};
    Object.keys(TYPES).forEach(id => {
      types[id] = Object.assign({}, TYPES[id], { id, need: Object.assign({}, TYPES[id].need) });
    });
    return {
      shop,
      types,
      milestones: MILESTONES.map(m => Object.assign({}, m))
    };
  }

  function mergeCatalog(saved) {
    const def = defaultCatalog();
    if (!saved || typeof saved !== "object") return def;

    const removed = saved.removed || {};
    const cat = { shop: {}, types: {}, milestones: [], removed: { shop: {}, types: [], milestones: [] } };

    Object.keys(def.shop).forEach(slot => {
      const savedSlot = Array.isArray(saved.shop && saved.shop[slot]) ? saved.shop[slot] : [];
      const rem = (removed.shop && Array.isArray(removed.shop[slot])) ? removed.shop[slot] : [];
      const out = savedSlot
        .filter(x => x && x.id && !rem.includes(x.id))
        .map(x => Object.assign({}, x));
      def.shop[slot].forEach(d => {
        if (!out.some(x => x.id === d.id) && !rem.includes(d.id)) out.push(Object.assign({}, d));
      });
      cat.shop[slot] = out;
      if (rem.length) cat.removed.shop[slot] = rem.slice();
    });

    const savedTypes = saved.types || {};
    const remTypes = Array.isArray(removed.types) ? removed.types : [];
    Object.keys(savedTypes).forEach(id => {
      if (remTypes.includes(id) || !savedTypes[id]) return;
      cat.types[id] = Object.assign({}, savedTypes[id], { id, need: Object.assign({}, savedTypes[id].need || {}) });
    });
    Object.keys(def.types).forEach(id => {
      if (!cat.types[id] && !remTypes.includes(id)) cat.types[id] = Object.assign({}, def.types[id]);
    });
    cat.removed.types = remTypes.slice();

    const savedMs = Array.isArray(saved.milestones) ? saved.milestones : null;
    const remMs = Array.isArray(removed.milestones) ? removed.milestones : [];
    if (savedMs) {
      cat.milestones = savedMs.filter(m => m && m.id && !remMs.includes(m.id)).map(m => Object.assign({}, m));
      def.milestones.forEach(d => {
        if (!cat.milestones.some(m => m.id === d.id) && !remMs.includes(d.id)) cat.milestones.push(Object.assign({}, d));
      });
    } else {
      cat.milestones = def.milestones;
    }
    cat.removed.milestones = remMs.slice();

    return cat;
  }

  const shopOf = slot => {
    if (state.catalog && Array.isArray(state.catalog.shop[slot])) return state.catalog.shop[slot];
    return SHOP[slot] || [];
  };
  const typeOf = id => {
    if (state.catalog && state.catalog.types[id]) return state.catalog.types[id];
    return TYPES[id] || null;
  };
  const typeList = () => {
    const src = (state.catalog && state.catalog.types) ? state.catalog.types : TYPES;
    return Object.keys(src).map(id => Object.assign({ id }, src[id]));
  };
  const milestonesOf = () => {
    if (state.catalog && Array.isArray(state.catalog.milestones) && state.catalog.milestones.length) {
      return state.catalog.milestones;
    }
    return MILESTONES;
  };

  function blank() {
    return {
      version: 1,
      channel: null,
      subs: 0,
      totalViews: 0,
      reputation: 50,
      consistency: 70,
      pcs: [starterPc("First build")],
      activePc: 0,
      gear: { monitor: "mon1", mic: "mic1", camera: "cam0", light: "lit1", capture: null },
      internet: "net1",
      room: "room1",
      owned: {},
      videos: [],
      streams: [],
      live: null,
      trends: { gaming: "normal", irl: "normal", tech: "normal", esports: "normal", day: 0 },
      fin: { gross: 0, net: 0, expenses: 0, equipment: 0, donations: 0, sponsor: 0 },
      skills: { production: 0, editing: 0, streaming: 0, engagement: 0, planning: 0 },
      milestones: {},
      catalog: mergeCatalog(null),
      lastDay: 0
    };
  }

  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { saved = null; }
    if (!saved || typeof saved !== "object" || !Array.isArray(saved.pcs)) return blank();

    const s = Object.assign(blank(), saved);
    s.pcs = s.pcs.map(pc => Object.assign(starterPc(pc.name), pc, { parts: Object.assign({}, pc.parts) }));
    s.gear = Object.assign({ monitor: "mon1", mic: "mic1", camera: "cam0", light: "lit1", capture: null }, saved.gear || {});
    s.skills = Object.assign({ production: 0, editing: 0, streaming: 0, engagement: 0, planning: 0 }, saved.skills || {});
    s.fin = Object.assign({ gross: 0, net: 0, expenses: 0, equipment: 0, donations: 0, sponsor: 0 }, saved.fin || {});
    s.trends = Object.assign({ gaming: "normal", irl: "normal", tech: "normal", esports: "normal", day: 0 }, saved.trends || {});
    s.videos = Array.isArray(saved.videos) ? saved.videos : [];
    s.streams = Array.isArray(saved.streams) ? saved.streams : [];
    s.owned = saved.owned && typeof saved.owned === "object" ? saved.owned : {};
    s.catalog = mergeCatalog(saved.catalog);
    if (!s.activePc || !s.pcs[s.activePc]) s.activePc = 0;
    return s;
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  /* ---------------------------------------------------------
     Money
     --------------------------------------------------------- */
  const balance = () => (window.nuLimitsMoney ? window.nuLimitsMoney.getBalance() : 0);
  const free = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());

  function spend(amount, label) {
    if (!window.nuLimitsMoney) return false;
    return window.nuLimitsMoney.transact("expense", Math.round(amount), label);
  }
  function earn(amount, label) {
    if (!window.nuLimitsMoney || amount <= 0) return false;
    return window.nuLimitsMoney.transact("income", Math.round(amount), label);
  }

  /* ---------------------------------------------------------
     Equipment helpers
     --------------------------------------------------------- */
  const findItem = (slot, id) => (shopOf(slot) || []).find(x => x.id === id) || null;
  const pc = () => state.pcs[state.activePc] || state.pcs[0];

  const part = slot => {
    if (GEAR_SLOTS.includes(slot)) {
      const id = state.gear[slot];
      return id ? findItem(slot, id) : null;
    }
    if (slot === "internet") return findItem("internet", state.internet);
    if (slot === "room") return findItem("room", state.room);
    const id = pc().parts[slot];
    return id ? findItem(slot, id) : null;
  };

  function ownedIds(slot) {
    return (state.owned[slot] || []).slice();
  }
  function owns(slot, id) {
    if (id === "cam0" || id === "net1" || id === "room1") return true;
    return ownedIds(slot).includes(id);
  }
  function markOwned(slot, id) {
    state.owned[slot] = state.owned[slot] || [];
    if (!state.owned[slot].includes(id)) state.owned[slot].push(id);
  }

  /* compatibility --------------------------------------------------- */
  function compatibility(slot, item) {
    const m = pc().parts;
    const mobo = findItem("mobo", m.mobo);
    const cpu = findItem("cpu", m.cpu);
    const ramItem = findItem("ram", m.ram);
    const psuItem = findItem("psu", m.psu);

    if (slot === "cpu" && item.socket && mobo && item.socket !== mobo.socket) {
      return { ok: false, why: `Needs a ${item.socket} motherboard — yours is ${mobo.socket}.` };
    }
    if (slot === "mobo" && item.socket && cpu && item.socket !== cpu.socket) {
      return { ok: false, why: `Your ${cpu.name} is ${cpu.socket}; this board is ${item.socket}.` };
    }
    if (slot === "mobo" && item.mem && ramItem && item.mem !== ramItem.gen) {
      return { ok: false, why: `This board takes ${item.mem}; your memory is ${ramItem.gen}.` };
    }
    if (slot === "ram" && item.gen && mobo && item.gen !== mobo.mem) {
      return { ok: false, why: `Your ${mobo.name} takes ${mobo.mem}, not ${item.gen}.` };
    }
    if (slot === "psu" || slot === "gpu" || slot === "cpu") {
      const nextCpu = slot === "cpu" ? item : cpu;
      const nextGpu = slot === "gpu" ? item : findItem("gpu", m.gpu);
      const nextPsu = slot === "psu" ? item : psuItem;
      const draw = 150 + (nextCpu ? nextCpu.watts : 0) + (nextGpu ? nextGpu.watts : 0);
      if (nextPsu && draw > nextPsu.watts) {
        return { ok: false, why: `${nextPsu.name} can't carry this — the build would draw ${draw} W.` };
      }
    }
    return { ok: true };
  }

  /* performance ----------------------------------------------------- */
  function perfOf(machine) {
    const m = (machine || pc()).parts;
    const t = slot => { const it = findItem(slot, m[slot]); return it ? it.tier : 0; };
    const cool = (() => { const c = findItem("cooling", m.cooling); return c ? c.cool : 0; })();
    let score = t("cpu") * 1.0 + t("gpu") * 1.55 + t("ram") * 0.55 +
                t("ssd") * 0.30 + t("monitor") * 0.0 + t("case") * 0.10;
    const heat = (t("cpu") * 1.1 + t("gpu") * 1.3) / 2;
    const throttled = cool && cool + 0.8 < heat;
    if (throttled) score *= 0.86;
    const cond = machine ? machine.condition : pc().condition;
    score *= 0.55 + 0.45 * (cond / 100);
    return { value: clamp((score / 13.2) * 100, 0, 100), throttled };
  }

  function gearScore() {
    const g = s => { const it = part(s); return it ? it.tier : 0; };
    const raw = g("monitor") * 0.12 + g("mic") * 0.24 + g("camera") * 0.24 + g("light") * 0.14 + g("capture") * 0.06;
    return clamp((raw / 2.4) * 100, 0, 100);
  }

  function roomBonus() {
    const r = part("room");
    return r ? r.bonus : 0;
  }

  const skillValue = key => clamp(Math.sqrt(state.skills[key] || 0) * 3.4, 0, 100);
  const skillAvg = () => {
    const keys = Object.keys(state.skills);
    return keys.reduce((t, k) => t + skillValue(k), 0) / keys.length;
  };
  const skillLevel = key => Math.floor(skillValue(key) / 5) + 1;

  function addSkill(key, xp) {
    state.skills[key] = (state.skills[key] || 0) + Math.max(0, Math.round(xp));
  }

  /* ---------------------------------------------------------
     Trends
     --------------------------------------------------------- */
  function refreshTrends(force) {
    const day = window.nuLimitsWorld ? window.nuLimitsWorld.day : 1;
    if (!force && day - (state.trends.day || 0) < 3) return false;

    Object.keys(NICHES).forEach(n => {
      const cur = state.trends[n] || "normal";
      if (Math.random() < 0.55) return;                       /* mostly holds */
      const roll = Math.random();
      let next;
      if (roll < 0.06) next = "viral";
      else if (roll < 0.26) next = "high";
      else if (roll < 0.58) next = "normal";
      else next = "low";
      state.trends[n] = next === cur ? "normal" : next;
    });
    state.trends.day = day;
    save();
    return true;
  }

  const trendOf = n => state.trends[n] || "normal";

  /* ---------------------------------------------------------
     Studio purchases
     --------------------------------------------------------- */
  function buyItem(slot, id) {
    const item = findItem(slot, id);
    if (!item) return { ok: false, why: "Unknown item." };
    if (owns(slot, id) && slot !== "internet" && slot !== "room") {
      return install(slot, id);
    }

    if (["cpu", "mobo", "ram", "gpu", "psu", "cooling"].includes(slot)) {
      const check = compatibility(slot, item);
      if (!check.ok) return { ok: false, why: check.why };
    }

    if (!free() && !window.nuLimitsCanPay(item.price)) {
      return { ok: false, why: `Not enough cash — you're ${money(item.price - balance())} short.` };
    }
    if (item.price > 0 && !spend(item.price, `Creator gear: ${item.name}`)) {
      return { ok: false, why: "Payment failed." };
    }

    state.fin.equipment += item.price;
    markOwned(slot, id);

    if (slot === "internet") state.internet = id;
    else if (slot === "room") state.room = id;
    else if (GEAR_SLOTS.includes(slot)) state.gear[slot] = id;
    else pc().parts[slot] = id;

    save();
    return { ok: true, message: `${item.name} installed` };
  }

  function install(slot, id) {
    const item = findItem(slot, id);
    if (!item) return { ok: false, why: "Unknown item." };
    if (["cpu", "mobo", "ram", "gpu", "psu", "cooling"].includes(slot)) {
      const check = compatibility(slot, item);
      if (!check.ok) return { ok: false, why: check.why };
    }
    if (slot === "internet") state.internet = id;
    else if (slot === "room") state.room = id;
    else if (GEAR_SLOTS.includes(slot)) state.gear[slot] = id;
    else pc().parts[slot] = id;
    save();
    return { ok: true, message: `${item.name} installed` };
  }

  const STORAGE_CAP = { ssd1: 2, ssd2: 4, ssd3: 8, ssd4: 16 };

  function storage() {
    const ssd = part("ssd");
    const cap = ssd ? (Number(ssd.cap) || STORAGE_CAP[ssd.id] || 2) : 1;
    const used = state.videos.filter(v => v.status === "ready" || v.status === "producing").length;
    return { cap, used, free: Math.max(0, cap - used), ssd: ssd ? ssd.name : "No storage" };
  }

  function repairCost() {
    return Math.round((100 - pc().condition) * 42);
  }

  function repair() {
    const cost = repairCost();
    if (cost <= 0) return { ok: false, why: "This build is already clean." };
    if (!free() && !window.nuLimitsCanPay(cost)) return { ok: false, why: `Repairs cost ${money(cost)}.` };
    if (!spend(cost, `PC service: ${pc().name}`)) return { ok: false, why: "Payment failed." };
    state.fin.expenses += cost;
    pc().condition = 100;
    save();
    return { ok: true, message: "Serviced — back to 100 %" };
  }

  function addPc() {
    const cost = 6000;
    if (!free() && !window.nuLimitsCanPay(cost)) return { ok: false, why: `A second rig costs ${money(cost)} to assemble.` };
    if (!spend(cost, "Creator gear: second PC build")) return { ok: false, why: "Payment failed." };
    state.fin.equipment += cost;
    state.pcs.push(starterPc(`Build ${state.pcs.length + 1}`));
    state.activePc = state.pcs.length - 1;
    save();
    return { ok: true, message: "Second rig added" };
  }

  function renamePc(i, name) {
    const pc = state.pcs[i];
    if (!pc) return { ok: false, why: "Rig not found." };
    const next = clean(name, 24);
    if (next.length < 2) return { ok: false, why: "Give the rig a name." };
    pc.name = next;
    save();
    return { ok: true, message: "Rig renamed" };
  }

  function removePc(i) {
    if (state.pcs.length <= 1) return { ok: false, why: "You need at least one rig." };
    if (!state.pcs[i]) return { ok: false, why: "Rig not found." };
    if (state.videos.some(v => v.status === "producing")) {
      return { ok: false, why: "Something is rendering — finish it first." };
    }
    state.pcs.splice(i, 1);
    if (state.activePc >= state.pcs.length) state.activePc = state.pcs.length - 1;
    save();
    return { ok: true, message: "Rig removed" };
  }

  function setActivePc(i) {
    if (!state.pcs[i]) return;
    state.activePc = i;
    save();
  }

  /* ---------------------------------------------------------
     Requirements & production
     --------------------------------------------------------- */
  function missingFor(typeId) {
    const t = typeOf(typeId);
    if (!t) return ["Unknown content type"];
    const out = [];
    const p = perfOf().value;
    if (t.need.perf && p < t.need.perf) out.push(`Needs a PC at ${t.need.perf}+ performance (yours is ${p}).`);
    if (t.need.mic) {
      const mic = part("mic");
      if (!mic || mic.tier < t.need.mic) out.push(`Needs a tier ${t.need.mic} microphone.`);
    }
    if (t.need.camera) {
      const cam = part("camera");
      if (!cam || cam.tier < t.need.camera) out.push(`Needs a tier ${t.need.camera} camera.`);
    }
    if (t.need.capture) {
      const cap = part("capture");
      if (!cap || cap.tier < t.need.capture) out.push("Needs a capture card.");
    }
    return out;
  }

  function queueEnd() {
    const pending = state.videos.filter(v => v.status === "producing");
    return pending.reduce((latest, v) => Math.max(latest, v.readyAt), Date.now());
  }

  function produce(typeId) {
    if (!state.channel) return { ok: false, why: "Create your channel first." };
    const t = typeOf(typeId);
    if (!t) return { ok: false, why: "Unknown content type." };

    const missing = missingFor(typeId);
    if (missing.length) return { ok: false, why: missing[0] };

    const disk = storage();
    if (disk.free <= 0) {
      return { ok: false, why: `Your ${disk.ssd} is full (${disk.used}/${disk.cap}). Publish or clear a video first.` };
    }

    if (!free() && !window.nuLimitsCanPay(t.cost)) return { ok: false, why: `Production costs ${money(t.cost)} in power and consumables.` };
    if (!spend(t.cost, `Production: ${t.name}`)) return { ok: false, why: "Payment failed." };
    state.fin.expenses += t.cost;

    const start = Math.max(Date.now(), queueEnd());
    const video = {
      id: uid("vid"),
      type: typeId,
      niche: t.niche,
      title: defaultTitle(typeId),
      status: "producing",
      createdAt: new Date().toISOString(),
      startedAt: start,
      readyAt: start + t.days * DAY_MS,
      publishedAt: null,
      deadline: null,
      quality: null,
      views: 0,
      subsGained: 0,
      revenue: 0,
      gross: 0
    };
    state.videos.unshift(video);
    save();
    return { ok: true, message: `${t.name} is in production`, id: video.id };
  }

  function defaultTitle(typeId) {
    const pool = {
      gameplay: ["Ranked grind — road to the top", "This run went insane", "Playing with viewers"],
      challenge: ["I tried the hardest challenge", "24 hours, one rule", "Can I actually finish this?"],
      gamedu: ["The settings nobody uses", "How to actually get better", "A beginner's real guide"],
      streamclip: ["Best moments from last night", "Chat went wild", "Highlights you missed"],
      vlog: ["A normal week, honestly", "Come spend the day", "I moved again"],
      daylife: ["My 5am routine", "What I actually eat", "Slow morning at home"],
      travel: ["48 hours in Cape Town", "The trip that changed everything", "I booked this last minute"],
      irlchallenge: ["Seven days, no phone", "I said yes for a week", "Trying it so you don't have to"],
      unboxing: ["Unboxing the one everyone asked for", "It finally arrived", "First look, no edits"],
      review: ["Is it actually worth it?", "Six months later", "The honest review"],
      compare: ["Cheap vs expensive", "I tested all of them", "The results surprised me"],
      techtut: ["Set it up properly", "The fix nobody tells you", "Make it faster in 10 minutes"],
      ranked: ["Climbing with zero comms", "This rank is cursed", "One more game"],
      tournament: ["The final, frame by frame", "How they lost that round", "Every clutch in one video"],
      strategy: ["The playbook that works", "Stop doing this", "Read the map like a pro"],
      analysis: ["Breaking down the meta", "Why this comp wins", "The pro habit you're missing"]
    };
    const list = pool[typeId] || ["New video"];
    return list[Math.floor(Math.random() * list.length)];
  }

  /* ---------------------------------------------------------
     Quality & release maths
     --------------------------------------------------------- */
  function gradeVideo(v) {
    const t = typeOf(v.type);
    const base = 22 + 0.34 * perfOf().value + 0.20 * gearScore() +
                 0.18 * skillAvg() + 0.12 * state.reputation;
    const noise = Math.random() * 14 - 7;
    v.quality = clamp(base + noise + roomBonus(), 5, 100);
    v.deadline = v.readyAt + 2 * DAY_MS;
  }

  function projected(v) {
    const t = typeOf(v.type);
    const trend = TREND_MULT[trendOf(v.niche)];
    const base = 90 + state.subs * 6;
    const q = 0.35 + (v.quality / 100) * 1.05;
    const rep = 0.7 + (state.reputation / 100) * 0.6;
    const est = base * q * trend * rep * t.appeal * 1.05;
    return {
      views: Math.round(est),
      low: Math.round(est * 0.5),
      high: Math.round(est * 2.3)
    };
  }

  function publish(videoId, title) {
    const v = state.videos.find(x => x.id === videoId);
    if (!v) return { ok: false, why: "Video not found." };
    if (v.status !== "ready") return { ok: false, why: "That video isn't finished yet." };

    if (title && title.trim()) v.title = title.trim().slice(0, 80);

    const t = typeOf(v.type);
    const trend = TREND_MULT[trendOf(v.niche)];
    const base = 90 + state.subs * 6;
    const q = 0.35 + (v.quality / 100) * 1.05;
    const rep = 0.7 + (state.reputation / 100) * 0.6;
    let luck = 0.6 + Math.pow(Math.random(), 2.0) * 3.4;
    if (Math.random() < 0.06) luck += Math.random() * 6;              /* the breakout */
    const views = Math.round(base * q * trend * rep * t.appeal * luck);

    const conv = 0.008 + (skillValue("engagement") / 100) * 0.012 + (v.quality / 100) * 0.008;
    const subsGained = Math.max(views >= 25 ? 1 : 0,
      Math.round(views * conv * NICHES[v.niche].conv));

    const monetised = isMonetised();
    const gross = monetised
      ? Math.round((views / 1000) * NICHES[v.niche].rpm * (0.5 + v.quality / 100 * 0.7))
      : 0;
    let net = Math.round(gross * (1 - PLATFORM_SHARE));

    /* sponsorship deals open up once the channel has reach */
    const sponsor = (state.subs >= 10000 && v.quality >= 65)
      ? Math.round(900 * Math.pow(state.subs / 10000, 0.45) * (v.quality / 100) * 1.4)
      : 0;
    if (sponsor > 0) {
      v.sponsor = sponsor;
      state.fin.sponsor = (state.fin.sponsor || 0) + sponsor;
      net += sponsor;
    }

    v.status = "published";
    v.publishedAt = new Date().toISOString();
    v.gameDate = (window.nuLimitsWorld && window.nuLimitsWorld.date)
      ? window.nuLimitsWorld.date.toISOString() : null;
    v.views = views;
    v.subsGained = subsGained;
    v.gross = gross;
    v.revenue = net;

    state.subs += subsGained;
    state.totalViews += views;
    state.fin.gross += gross;
    state.fin.net += net;

    if (net > 0) earn(net, sponsor > 0 ? `Revenue + sponsor: ${v.title}` : `Ad revenue: ${v.title}`);

    if (v.deadline && Date.now() > v.deadline) state.consistency = clamp(state.consistency - 6, 0, 100);
    else state.consistency = clamp(state.consistency + 3, 0, 100);

    const pull = (v.quality - state.reputation) * 0.08;
    state.reputation = clamp(state.reputation + pull + (views > base * 3 ? 2 : 0), 0, 100);

    addSkill(t.skill, 14 + v.quality * 0.22);
    addSkill("engagement", subsGained * 0.12);
    addSkill("planning", 4);
    if (Date.now() <= (v.deadline || 0)) state.consistency = clamp(state.consistency + 2, 0, 100);

    state.lastDay = window.nuLimitsWorld ? window.nuLimitsWorld.day : state.lastDay;
    checkMilestones();
    save();

    return { ok: true, video: v, views, subsGained, net, gross, monetised };
  }

  const isMonetised = () => !!state.milestones.monetised;

  /* ---------------------------------------------------------
     Livestreaming
     --------------------------------------------------------- */
  const STREAM_QUALITY = {
    q720: { label: "720p30", up: 8, perf: 20, key: "720p30" },
    q1080: { label: "1080p60", up: 20, perf: 45, key: "1080p60" },
    q1440: { label: "1440p60", up: 50, perf: 70, key: "1440p60" }
  };

  const STREAM_SECONDS_PER_HOUR = 20;  /* 1 stream hour plays out in 20 real seconds */

  function streamReadiness(qualityKey) {
    const q = STREAM_QUALITY[qualityKey] || STREAM_QUALITY.q1080;
    const net = part("internet");
    const p = perfOf().value;
    const problems = [];
    let risk = 0;

    if (!net || net.up < q.up) {
      const short = q.up - (net ? net.up : 0);
      risk += short * 0.10;
      problems.push(`${q.label} wants ${q.up} Mbps up — you have ${net ? net.up : 0}.`);
    }
    if (p < q.perf) {
      risk += (q.perf - p) * 0.9;
      problems.push(`Encoding ${q.label} wants ${q.perf} performance — yours is ${p}.`);
    }
    if (perfOf().throttled) {
      risk += 8;
      problems.push("Cooling is throttling the CPU under load.");
    }
    if (pc().condition < 70) {
      risk += (70 - pc().condition) * 0.35;
      problems.push("The rig is dusty — service it to avoid stutters.");
    }
    return { risk: clamp(risk, 0, 90), problems, ready: problems.length === 0 };
  }

  function startStream(hours, qualityKey) {
    if (state.live) return { ok: false, why: "You're already live." };
    if (!state.channel) return { ok: false, why: "Create your channel first." };

    const cost = Math.round(hours * 95 + 60);
    if (!free() && !window.nuLimitsCanPay(cost)) return { ok: false, why: `Going live costs ${money(cost)} in power and bandwidth.` };
    if (!spend(cost, `Livestream: ${hours}h`)) return { ok: false, why: "Payment failed." };
    state.fin.expenses += cost;

    const read = streamReadiness(qualityKey);
    const trend = TREND_MULT[trendOf(state.channel.niche)];
    const base = 3 + Math.pow(state.subs, 0.62) * 0.35;
    const draw = Math.round(base * trend * (0.6 + state.reputation / 120) * (1 - read.risk / 220));

    state.live = {
      startedAt: Date.now(),
      hours,
      quality: qualityKey,
      viewers: Math.max(3, draw),
      peak: Math.max(3, draw),
      dropped: 0,
      ticks: 0,
      risk: read.risk,
      donations: 0,
      log: [{ at: 0, text: `You're live at ${STREAM_QUALITY[qualityKey].label}.` }],
      ended: false
    };
    save();
    return { ok: true, live: state.live, readiness: read };
  }

  function tickStream() {
    const l = state.live;
    if (!l || l.ended) return null;

    l.ticks++;
    const total = l.hours * STREAM_SECONDS_PER_HOUR * 2;   /* two ticks a second */
    const progress = Math.min(1, l.ticks / total);
    const trend = TREND_MULT[trendOf(state.channel.niche)];
    const wobble = 0.88 + Math.random() * 0.24;

    const target = (3 + Math.pow(state.subs, 0.62) * 0.35) * trend *
                   (0.6 + state.reputation / 120) * (1 - l.risk / 220) *
                   (1 + progress * 0.55);
    l.viewers = Math.max(2, Math.round(target * wobble));
    l.peak = Math.max(l.peak, l.viewers);

    if (Math.random() < l.risk / 260) l.dropped += 1 + Math.round(Math.random() * 3);

    const perTick = (l.viewers / 5) * (0.5 + skillValue("engagement") / 90);
    l.donations += perTick;

    if (l.ticks % 12 === 0) {
      l.log.push({ at: l.ticks, text: `${l.viewers} watching · ${money(l.donations)} in donations` });
      if (l.log.length > 14) l.log.shift();
    }

    const failRate = l.dropped / Math.max(20, l.ticks * 4);
    if (failRate > 0.16 && progress > 0.15) {
      return endStream("signal", true);
    }

    if (l.ticks >= total) {
      return endStream("complete", true);
    }

    save();
    return { running: true, live: l, progress };
  }

  function endStream(reason, auto) {
    const l = state.live;
    if (!l) return null;

    const hoursWatched = Math.max(0.1, (l.ticks / (STREAM_SECONDS_PER_HOUR * 2)));
    const donations = Math.round(l.donations);
    const adShare = isMonetised() ? Math.round(l.peak * hoursWatched * 2.1) : 0;
    const payout = donations + adShare;

    l.ended = true;
    l.endedAt = new Date().toISOString();
    l.reason = reason;
    l.payout = payout;
    l.hoursWatched = Math.round(hoursWatched * 10) / 10;

    /* a stream grows the channel too */
    const gainedSubs = Math.round(l.peak * hoursWatched * 0.22 *
                                 (0.6 + skillValue("engagement") / 100));
    const gainedViews = Math.round(l.peak * hoursWatched * 11);
    state.subs += gainedSubs;
    state.totalViews += gainedViews;


    state.streams.unshift({
      id: uid("str"), at: l.endedAt, hours: l.hours, quality: l.quality,
      peak: l.peak, dropped: l.dropped, payout, reason, hoursWatched: l.hoursWatched,
      subs: gainedSubs, views: gainedViews
    });
    state.streams = state.streams.slice(0, 40);

    state.fin.donations += donations;
    state.fin.net += payout;
    if (payout > 0) earn(payout, `Livestream: ${l.hours}h · ${STREAM_QUALITY[l.quality].label}`);

    addSkill("streaming", l.ticks * 0.06 + l.peak * 0.05);
    addSkill("engagement", l.peak * 0.04);

    if (reason === "signal") {
      state.reputation = clamp(state.reputation - 3, 0, 100);
      state.consistency = clamp(state.consistency - 2, 0, 100);
    } else {
      state.reputation = clamp(state.reputation + 0.5, 0, 100);
    }

    checkMilestones();
    save();
    state.live = null;
    return { ended: true, payout, donations, adShare, reason, peak: l.peak, dropped: l.dropped,
             subs: gainedSubs, views: gainedViews };
  }

  /* ---------------------------------------------------------
     Monthly operating costs (called by world.js)
     --------------------------------------------------------- */
  function monthlyCosts() {
    if (!state.channel) return [];
    const lines = [];
    const net = part("internet");
    const room = part("room");
    if (net && net.cost > 0) lines.push({ label: `Creator internet · ${net.name}`, amount: net.cost });
    if (room && room.cost > 0) lines.push({ label: `Studio rent · ${room.name}`, amount: room.cost });
    if (state.pcs.length > 1) lines.push({ label: `Studio power · ${state.pcs.length} rigs`, amount: 260 * (state.pcs.length - 1) });
    return lines;
  }

  /* ---------------------------------------------------------
     Milestones
     --------------------------------------------------------- */


  function milestoneMet(m) {
    const kind = m.kind || "published";
    const target = m.target;

    if (kind === "subs") return state.subs >= Number(target || 0);
    if (kind === "views") return state.totalViews >= Number(target || 0);
    if (kind === "published") {
      return state.videos.filter(v => v.status === "published").length >= Number(target || 0);
    }
    if (kind === "streams") return state.streams.length >= Number(target || 0);
    if (kind === "vidViews") return state.videos.some(v => v.views >= Number(target || 0));
    if (kind === "monetised") return state.subs >= MONETISE_SUBS && state.totalViews >= MONETISE_VIEWS;
    if (kind === "room") return state.room === target;
    if (kind === "perf") return perfOf().value >= Number(target || 0);
    if (kind === "videos") {
      return state.videos.filter(v => v.status === "published").length >= Number(target || 0);
    }
    return false;
  }

  function checkMilestones() {
    milestonesOf().forEach(m => {
      if (!m || !m.id) return;
      if (state.milestones[m.id]) return;
      if (!milestoneMet(m)) return;
      state.milestones[m.id] = Date.now();
      if (Number(m.reward) > 0) earn(Math.round(m.reward), `Creator milestone: ${m.label}`);
      addSkill("planning", 25);
    });
  }

  /* ---------------------------------------------------------
     Tick — completes productions, drifts trends
     --------------------------------------------------------- */
  let listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function emit(evt) { listeners.forEach(fn => { try { fn(evt); } catch (e) {} }); }

  function tick() {
    let changed = false;

    state.videos.forEach(v => {
      if (v.status !== "producing") return;
      if (Date.now() < v.readyAt) return;
      gradeVideo(v);
      v.status = "ready";
      pc().condition = clamp(pc().condition - 1.6, 0, 100);
      changed = true;
      emit({ type: "ready", video: v });
    });

    if (refreshTrends(false)) { changed = true; emit({ type: "trends" }); }

    if (changed) save();
    return changed;
  }

  window.setInterval(tick, 900);

  /* ---------------------------------------------------------
     Channel creation
     --------------------------------------------------------- */
  function createChannel(name, niche) {
    if (state.channel) return { ok: false, why: "You already have a channel." };
    if (!NICHES[niche]) return { ok: false, why: "Pick a content category." };
    const clean = String(name || "").trim().slice(0, 28);
    if (clean.length < 3) return { ok: false, why: "Give your channel a name (3+ characters)." };

    state.channel = {
      name: clean,
      niche,
      createdAt: new Date().toISOString()
    };
    state.trends.day = window.nuLimitsWorld ? window.nuLimitsWorld.day : 1;
    save();
    return { ok: true };
  }

  /* ---------------------------------------------------------
     Edit-mode API — every catalogue entry is editable
     --------------------------------------------------------- */
  const clean = (v, max) => String(v == null ? "" : v).trim().slice(0, max || 60);

  function editChannel(patch) {
    if (!state.channel) return { ok: false, why: "No channel yet." };
    if (patch.name != null) {
      const name = clean(patch.name, 28);
      if (name.length < 3) return { ok: false, why: "Channel name needs 3+ characters." };
      state.channel.name = name;
    }
    if (patch.niche && NICHES[patch.niche]) state.channel.niche = patch.niche;
    save();
    return { ok: true };
  }

  function saveItem(slot, id, patch) {
    ensureCatalog();
    const list = shopOf(slot);
    const existing = id ? list.find(x => x.id === id) : null;

    if (existing) {
      Object.assign(existing, patch);
      existing.price = Math.max(0, Math.round(Number(existing.price) || 0));
      save();
      return { ok: true, id: existing.id };
    }

    const item = Object.assign({
      id: uid("it"),
      name: "New " + (SLOT_LABEL[slot] || "item"),
      price: 0,
      tier: 1,
      note: ""
    }, patch);
    item.price = Math.max(0, Math.round(Number(item.price) || 0));
    item.tier = Math.min(4, Math.max(1, Math.round(Number(item.tier) || 1)));
    list.push(item);
    save();
    return { ok: true, id: item.id };
  }

  function deleteItem(slot, id) {
    const list = shopOf(slot);
    const idx = list.findIndex(x => x.id === id);
    if (idx < 0) return { ok: false, why: "Item not found." };

    /* never leave a build pointing at something that no longer exists */
    const installed = state.gear[slot] === id ||
      (state.pcs || []).some(pc => pc.parts[slot] === id) ||
      (slot === "internet" && state.internet === id) ||
      (slot === "room" && state.room === id);
    if (installed) return { ok: false, why: "This one is installed on a rig — switch it out first." };

    list.splice(idx, 1);
    state.catalog.removed = state.catalog.removed || { shop: {}, types: [], milestones: [] };
    state.catalog.removed.shop[slot] = state.catalog.removed.shop[slot] || [];
    state.catalog.removed.shop[slot].push(id);
    save();
    return { ok: true };
  }

  function ensureCatalog() {
    if (!state.catalog || !state.catalog.types) state.catalog = mergeCatalog(state.catalog);
    return state.catalog;
  }

  function saveType(id, patch) {
    const types = ensureCatalog().types;
    const existing = id ? types[id] : null;

    if (existing) {
      Object.assign(existing, patch);
      existing.days = Math.max(1, Math.round(Number(existing.days) || 1));
      existing.cost = Math.max(0, Math.round(Number(existing.cost) || 0));
      existing.appeal = Math.max(0.2, Number(existing.appeal) || 1);
      save();
      return { ok: true, id };
    }

    const newId = "ct_" + Date.now().toString(36);
    const item = Object.assign({
      name: "New format",
      niche: "gaming",
      days: 1,
      appeal: 1,
      cost: 100,
      skill: "production",
      need: {}
    }, patch);
    item.id = newId;
    item.days = Math.max(1, Math.round(Number(item.days) || 1));
    item.cost = Math.max(0, Math.round(Number(item.cost) || 0));
    item.appeal = Math.max(0.2, Number(item.appeal) || 1);
    item.need = Object.assign({}, item.need || {});
    if (!NICHES[item.niche]) item.niche = "gaming";
    types[newId] = item;
    save();
    return { ok: true, id: newId };
  }

  function deleteType(id) {
    ensureCatalog();
    if (!state.catalog.types[id]) return { ok: false, why: "Format not found." };
    if (state.videos.some(v => v.type === id && v.status !== "published")) {
      return { ok: false, why: "A video in this format is still in production." };
    }
    delete state.catalog.types[id];
    state.catalog.removed.types.push(id);
    save();
    return { ok: true };
  }

  function saveMilestone(id, patch) {
    const list = milestonesOf();
    const existing = id ? list.find(m => m.id === id) : null;

    if (existing) {
      Object.assign(existing, patch);
      existing.reward = Math.max(0, Math.round(Number(existing.reward) || 0));
      save();
      return { ok: true, id };
    }

    const newId = "ms_" + Date.now().toString(36);
    const item = Object.assign({
      label: "New milestone",
      kind: "subs",
      target: 100,
      reward: 500
    }, patch);
    item.id = newId;
    item.reward = Math.max(0, Math.round(Number(item.reward) || 0));
    list.push(item);
    save();
    return { ok: true, id: newId };
  }

  function deleteMilestone(id) {
    const list = milestonesOf();
    const idx = list.findIndex(m => m.id === id);
    if (idx < 0) return { ok: false, why: "Milestone not found." };
    list.splice(idx, 1);
    state.catalog.removed.milestones.push(id);
    delete state.milestones[id];
    save();
    return { ok: true };
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */
  window.nuLimitsCreator = {
    NICHES, SLOTS: Object.keys(SLOT_LABEL), SLOT_LABEL, PC_SLOTS, GEAR_SLOTS,
    TREND_LEVELS, TREND_LABEL, TREND_MULT, STREAM_QUALITY, PLATFORM_SHARE,

    shopOf, typeOf, typeList, milestones: milestonesOf, milestoneMet,
    editChannel, saveItem, deleteItem, saveType, deleteType, saveMilestone, deleteMilestone,
    renamePc, removePc,
    MONETISE_SUBS, MONETISE_VIEWS,

    get state() { return state; },
    save, balance, money, esc,
    perf: () => perfOf().value,
    perfDetail: () => perfOf(),
    gearScore, roomBonus,
    part, owns, ownIds: ownedIds, findItem, compatibility,
    buyItem, install, repair, repairCost, addPc, setActivePc,
    skillValue, skillAvg, skillLevel,
    trendOf, refreshTrends,
    missingFor, produce, publish, defaultTitle, storage, STORAGE_CAP,
    projected, isMonetised,
    streamReadiness, startStream, tickStream, endStream, STREAM_SECONDS_PER_HOUR,
    monthlyCosts, checkMilestones, createChannel,
    tick, onChange,
    DAY_MS
  };

  refreshTrends(false);
})();

/* world.js calls this when it builds the monthly statement */
window.nuLimitsCreatorCosts = function () {
  try {
    return window.nuLimitsCreator ? window.nuLimitsCreator.monthlyCosts() : [];
  } catch (err) {
    return [];
  }
};
