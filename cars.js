/* ==========================================================
   NU LIMITS — CARS  (round 16)

   The car section works like a real showroom: makes first, then
   models inside the make.

     · a square tile per make, photo + arrow, subtle hover
     · tapping a make opens that make's page: fading hero photo
       of the model, then only that make's cars
     · every car can start and stop its engine — record it in
       the shop (edit mode) or hear the synthesised idle
     · edit mode: add / rename / re-photograph / delete makes

   Saves: nuLimitsCarBrands_v1 · nuLimitsEngines_v1
   Reads: nuLimitsAssets_v1 (through properties.js)
   ========================================================== */

(function () {
  "use strict";

  const BRAND_KEY = "nuLimitsCarBrands_v1";
  const ENGINE_KEY = "nuLimitsEngines_v1";
  const SOUND_LIMIT = 420 * 1024;     /* characters of data URL per clip */

  const SEED = [
    {
      id: "mb", name: "Mercedes-Benz", photo: "images/cars/mb.jpg",
      about: "Quiet power. Salon comfort with a motorway stride."
    },
    {
      id: "audi", name: "Audi", photo: "images/cars/audi.jpg",
      about: "Four rings, quattro grip, and the cleanest cabins in the class."
    },
    {
      id: "bmw", name: "BMW", photo: "images/cars/bmw.jpg",
      about: "Rear-drive balance and an engine note worth the tunnel."
    },
    {
      id: "porsche", name: "Porsche", photo: "images/cars/porsche.jpg",
      about: "The everyday supercar. Rear engine, zero excuses."
    }
  ];

  /* models that top up a make when it has nothing listed */
  const TOPUP = {
    mb: {
      name: "C 200 AMG Line", price: 985000, lease: 14800, prestige: 58,
      photo: "images/cars/mb.jpg",
      bills: [{ label: "Insurance", amount: 3400 }, { label: "Maintenance", amount: 1500 }, { label: "Fuel", amount: 2100 }],
      specs: { zero: 6.0, power: 204, top: 245, year: 2024 }
    },
    audi: {
      name: "RS 6 Avant", price: 1780000, lease: 26500, prestige: 76,
      photo: "images/cars/audi.jpg",
      bills: [{ label: "Insurance", amount: 6200 }, { label: "Maintenance", amount: 2600 }, { label: "Fuel", amount: 3100 }],
      specs: { zero: 3.6, power: 630, top: 305, year: 2024 }
    },
    bmw: {
      name: "330i M Sport", price: 895000, lease: 13400, prestige: 55,
      photo: "images/cars/bmw.jpg",
      bills: [{ label: "Insurance", amount: 3100 }, { label: "Maintenance", amount: 1350 }, { label: "Fuel", amount: 1950 }],
      specs: { zero: 5.8, power: 190, top: 250, year: 2023 }
    },
    porsche: {
      name: "911 Carrera", price: 2350000, lease: 34500, prestige: 92,
      photo: "images/cars/porsche.jpg",
      bills: [{ label: "Insurance", amount: 8400 }, { label: "Maintenance", amount: 3600 }, { label: "Fuel", amount: 3400 }],
      specs: { zero: 4.1, power: 385, top: 293, year: 2024 }
    }
  };

  /* ---------------------------------------------------------
     Storage
     --------------------------------------------------------- */
  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const v = JSON.parse(raw);
      return v && typeof v === "object" ? v : fallback;
    } catch (err) { return fallback; }
  };

  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (err) { return false; }
  };

  const slug = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);

  let store = null;

  function normaliseBrand(b, i) {
    const name = String((b && b.name) || "New make").slice(0, 28);
    return {
      id: String((b && b.id) || slug(name) || "make" + i),
      name,
      photo: String((b && b.photo) || "images/cars/mb.jpg"),
      about: String((b && b.about) || "").slice(0, 140)
    };
  }

  function load() {
    if (store) return store;
    const saved = read(BRAND_KEY, null);
    if (saved && Array.isArray(saved.brands) && saved.brands.length) {
      store = { version: 1, brands: saved.brands.map(normaliseBrand) };
    } else {
      store = { version: 1, brands: SEED.map((b, i) => normaliseBrand(b, i)) };
      write(BRAND_KEY, store);
    }
    return store;
  }

  const save = () => { load(); write(BRAND_KEY, store); };

  const brands = () => load().brands.slice();
  const byId = id => load().brands.find(b => b.id === id) || null;
  const byName = name => load().brands.find(b => b.name === name) || null;

  function newId(base) {
    const root = slug(base) || "make";
    let id = root;
    let n = 2;
    while (load().brands.some(b => b.id === id)) id = root + "-" + n++;
    return id;
  }

  function addBrand(name) {
    const label = String(name || "").trim() || "New make";
    const brand = normaliseBrand({ id: newId(label), name: label, photo: "images/cars/mb.jpg" }, 0);
    load().brands.push(brand);
    save();
    return brand;
  }

  function editBrand(id, patch) {
    const b = byId(id);
    if (!b) return null;
    if (patch.name != null) b.name = String(patch.name).slice(0, 28).trim() || b.name;
    if (patch.photo != null) b.photo = String(patch.photo);
    if (patch.about != null) b.about = String(patch.about).slice(0, 140);
    save();
    return b;
  }

  function removeBrand(id) {
    load().brands = load().brands.filter(b => b.id !== id);
    save();
  }

  /* every make should have at least one model to sell */
  function topUp(items, normalize) {
    load();
    let changed = false;
    store.brands.forEach(b => {
      const has = items.some(i => i.category === "car" && i.brand === b.id);
      if (has) return;
      const preset = TOPUP[b.id] || {
        name: b.name + " model", price: 650000, lease: 9800, prestige: 45,
        photo: b.photo,
        bills: [{ label: "Insurance", amount: 2600 }, { label: "Maintenance", amount: 1100 }, { label: "Fuel", amount: 1800 }],
        specs: { zero: 6.4, power: 200, top: 240, year: 2024 }
      };
      items.push(normalize(Object.assign({}, preset, {
        id: "car_" + b.id + "_" + Date.now().toString(36),
        category: "car",
        brand: b.id,
        tax: 0,
        internet: 0
      })));
      changed = true;
    });
    return changed;
  }

  /* ---------------------------------------------------------
     Engine audio
     --------------------------------------------------------- */
  let ctx = null;
  let voice = null;
  let audioEl = null;
  let runningId = null;

  const engines = () => read(ENGINE_KEY, {});

  function engineOf(id) { return engines()[id] || null; }

  function setEngine(id, dataUrl) {
    const all = engines();
    if (!dataUrl) { delete all[id]; write(ENGINE_KEY, all); return { ok: true }; }
    if (String(dataUrl).length > SOUND_LIMIT) {
      return { ok: false, why: "That clip is too big — keep it under 20 seconds." };
    }
    all[id] = String(dataUrl);
    if (!write(ENGINE_KEY, all)) {
      delete all[id];
      return { ok: false, why: "The browser is out of storage for sounds." };
    }
    return { ok: true };
  }

  const isRunning = id => runningId === id;

  function stop() {
    if (audioEl) {
      try { audioEl.pause(); } catch (err) { /* ignore */ }
      audioEl = null;
    }
    if (voice && ctx) {
      const t = ctx.currentTime;
      try {
        voice.gain.gain.cancelScheduledValues(t);
        voice.gain.gain.setTargetAtTime(0, t, 0.08);
        voice.osc.forEach(o => o.stop(t + 0.4));
      } catch (err) { /* ignore */ }
      voice = null;
    }
    runningId = null;
  }

  function synthEngine() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();

    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 6;

    const osc = [46, 69, 92].map((hz, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "sawtooth" : "square";
      o.frequency.value = hz;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.5 : 0.18;
      o.connect(g).connect(filter);
      o.start();
      return o;
    });

    /* a slow wobble so it idles instead of humming flat */
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 7.5;
    lfoGain.gain.value = 26;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    filter.connect(gain).connect(ctx.destination);
    gain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.25);

    return { gain, osc: osc.concat(lfo), filter };
  }

  function start(id) {
    stop();
    const clip = engineOf(id);

    if (clip) {
      try {
        audioEl = new Audio(clip);
        audioEl.loop = true;
        audioEl.volume = 0.85;
        audioEl.play();
      } catch (err) { audioEl = null; }
    }

    if (!audioEl) {
      voice = synthEngine();
      if (!voice) return { ok: false, why: "This browser cannot play engine sounds." };
    }

    runningId = id;
    return { ok: true, recorded: !!clip };
  }

  function toggle(id) {
    if (isRunning(id)) { stop(); return { ok: true, running: false }; }
    const res = start(id);
    return Object.assign({ running: res.ok }, res);
  }

  /* ---------------------------------------------------------
     Photo upload (edit mode)
     --------------------------------------------------------- */
  function pickPhoto(cb) {
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
          const S = 900;
          const c = document.createElement("canvas");
          c.width = c.height = S;
          const g = c.getContext("2d");
          const scale = Math.max(S / img.width, S / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          g.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
          cb(c.toDataURL("image/jpeg", 0.78));
        } catch (err) {
          cb(null);
        }
        URL.revokeObjectURL(url);
        input.remove();
      };
      img.onerror = () => { cb(null); URL.revokeObjectURL(url); input.remove(); };
      img.src = url;
    });
    input.click();
  }

  function pickSound(cb) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) { input.remove(); return; }
      if (file.size > 900 * 1024) {
        cb({ ok: false, why: "That file is too big — trim the clip first." });
        input.remove();
        return;
      }
      const fr = new FileReader();
      fr.onload = () => { cb({ ok: true, dataUrl: String(fr.result) }); input.remove(); };
      fr.onerror = () => { cb({ ok: false, why: "That file could not be read." }); input.remove(); };
      fr.readAsDataURL(file);
    });
    input.click();
  }

  function uploadSound(id, done) {
    pickSound(res => {
      if (!res.ok) { if (done) done(res); return; }
      const saved = setEngine(id, res.dataUrl);
      if (done) done(saved);
    });
  }

  window.nuLimitsCars = {
    brands, byId, byName, addBrand, editBrand, removeBrand, topUp,
    BRAND_KEY, ENGINE_KEY,
    engineOf, setEngine, uploadSound, toggle, start, stop, isRunning,
    pickPhoto, pickSound, SOUND_LIMIT
  };
})();
