/* ==========================================================
   NU LIMITS — LIVE INVESTMENT TERMINAL  (round 2)
   Replaces the Investments page with a live, stochastic
   market simulator + attached sticky trade bar.

   Loaded after script.js. It overrides renderInvestments()
   globally, exactly the way the original does, so every
   existing entry point (bottom nav, home action card) keeps
   working untouched.
   ========================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     Deterministic PRNG — same seed => same series
     --------------------------------------------------------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Box–Muller normal */
  function gauss(rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------------------------------------------------------
     Realistic price series
     - log-vol follows an OU process  -> volatility clustering
     - drifting trend regime that flips mid-walk
     - Poisson jumps                  -> sudden shocks
     - rescaled so the last point is the live price
     --------------------------------------------------------- */
  function buildSeries(price, n, vol, seed, driftBias) {
    const rng = mulberry32(seed);
    const logVolMean = Math.log(vol);
    let lv = logVolMean + gauss(rng) * 0.22;
    let trend = (rng() - 0.5) * 2 * (driftBias || 0.012);
    let trendLife = Math.floor(12 + rng() * 26);

    const out = new Array(n);
    out[0] = 100;

    for (let i = 1; i < n; i++) {
      /* volatility clustering */
      lv = logVolMean + 0.955 * (lv - logVolMean) + 0.085 * gauss(rng);
      const sigma = Math.exp(lv);

      /* trend regime flips periodically */
      if (--trendLife <= 0) {
        trend = (rng() - 0.5) * 2 * (driftBias || 0.012);
        trendLife = Math.floor(12 + rng() * 26);
      }

      let step = trend / n + sigma * gauss(rng);

      /* jumps — rare, asymmetric, fat-tailed */
      if (rng() < 0.011) {
        const dir = rng() < 0.5 ? -1 : 1;
        step += dir * (0.5 + rng() * 2.4) * sigma;
      }

      out[i] = out[i - 1] * Math.exp(step);
    }

    /* scale so the walk ends exactly at the live price */
    const k = price / out[n - 1];
    for (let i = 0; i < n; i++) out[i] *= k;
    return out;
  }

  /* ---------------------------------------------------------
     Timeframe definitions
     --------------------------------------------------------- */
  const RANGES = {
    "1D":  { n: 96,  vol: 0.0055, drift: 0.010, labels: ["09:30", "11:00", "13:00", "15:00", "NOW"] },
    "1W":  { n: 84,  vol: 0.0110, drift: 0.020, labels: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    "1M":  { n: 90,  vol: 0.0170, drift: 0.032, labels: ["4 Oct", "11 Oct", "18 Oct", "25 Oct", "Now"] },
    "1Y":  { n: 120, vol: 0.0225, drift: 0.055, labels: ["Nov", "Feb", "May", "Aug", "Nov"] },
    "ALL": { n: 150, vol: 0.0270, drift: 0.080, labels: ["2021", "2022", "2023", "2024", "Now"] }
  };

  /* ---------------------------------------------------------
     Per-asset market state (survives re-renders)
     --------------------------------------------------------- */
  const ASSETS = [
    { symbol: "NVDA", name: "NVIDIA Corporation", type: "Stock", price: 142.80,  vol: 1.00 },
    { symbol: "AAPL", name: "Apple Inc.",         type: "Stock", price: 248.50,  vol: 0.62 },
    { symbol: "MSFT", name: "Microsoft Corporation", type: "Stock", price: 511.20, vol: 0.55 },
    { symbol: "TSLA", name: "Tesla, Inc.",        type: "Stock", price: 342.70,  vol: 1.35 },
    { symbol: "BTC",  name: "Bitcoin",            type: "Crypto", price: 108420.00, vol: 1.75 },
    { symbol: "ETH",  name: "Ethereum",           type: "Crypto", price: 3925.40, vol: 1.85 },
    { symbol: "SOL",  name: "Solana",             type: "Crypto", price: 184.20,  vol: 2.30 },
    { symbol: "SPY",  name: "S&P 500 ETF",        type: "ETF",   price: 672.15,  vol: 0.34 },

    /* ---- 20 more stocks ---- */
    { symbol: "AMZN", name: "Amazon.com, Inc.",       type: "Stock", price: 218.40, vol: 0.78 },
    { symbol: "GOOGL", name: "Alphabet Inc.",         type: "Stock", price: 186.25, vol: 0.66 },
    { symbol: "META", name: "Meta Platforms, Inc.",   type: "Stock", price: 612.80, vol: 0.92 },
    { symbol: "NFLX", name: "Netflix, Inc.",          type: "Stock", price: 724.50, vol: 0.86 },
    { symbol: "AMD",  name: "Advanced Micro Devices", type: "Stock", price: 168.90, vol: 1.12 },
    { symbol: "INTC", name: "Intel Corporation",      type: "Stock", price: 24.60,  vol: 0.94 },
    { symbol: "ORCL", name: "Oracle Corporation",     type: "Stock", price: 178.30, vol: 0.71 },
    { symbol: "CRM",  name: "Salesforce, Inc.",       type: "Stock", price: 286.40, vol: 0.82 },
    { symbol: "ADBE", name: "Adobe Inc.",             type: "Stock", price: 512.70, vol: 0.79 },
    { symbol: "UBER", name: "Uber Technologies",      type: "Stock", price: 78.20,  vol: 0.98 },
    { symbol: "SHOP", name: "Shopify Inc.",           type: "Stock", price: 108.60, vol: 1.08 },
    { symbol: "KO",   name: "The Coca-Cola Company",  type: "Stock", price: 69.40,  vol: 0.42 },
    { symbol: "JNJ",  name: "Johnson & Johnson",      type: "Stock", price: 158.90, vol: 0.40 },
    { symbol: "V",    name: "Visa Inc.",              type: "Stock", price: 312.50, vol: 0.48 },
    { symbol: "MA",   name: "Mastercard Inc.",        type: "Stock", price: 528.10, vol: 0.50 },
    { symbol: "WMT",  name: "Walmart Inc.",           type: "Stock", price: 92.30,  vol: 0.44 },
    { symbol: "DIS",  name: "The Walt Disney Company", type: "Stock", price: 96.80, vol: 0.66 },
    { symbol: "BA",   name: "The Boeing Company",     type: "Stock", price: 156.20, vol: 0.92 },
    { symbol: "NKE",  name: "Nike, Inc.",             type: "Stock", price: 78.90,  vol: 0.70 },
    { symbol: "PFE",  name: "Pfizer Inc.",            type: "Stock", price: 26.10,  vol: 0.58 },

    /* ---- 20 more cryptocurrencies ---- */
    { symbol: "BNB",  name: "BNB",                    type: "Crypto", price: 682.40, vol: 1.60 },
    { symbol: "XRP",  name: "XRP",                    type: "Crypto", price: 2.36,   vol: 2.05 },
    { symbol: "ADA",  name: "Cardano",                type: "Crypto", price: 0.94,   vol: 2.20 },
    { symbol: "DOGE", name: "Dogecoin",               type: "Crypto", price: 0.38,   vol: 2.65 },
    { symbol: "AVAX", name: "Avalanche",              type: "Crypto", price: 42.70,  vol: 2.35 },
    { symbol: "DOT",  name: "Polkadot",               type: "Crypto", price: 6.85,   vol: 2.15 },
    { symbol: "MATIC", name: "Polygon",               type: "Crypto", price: 0.52,   vol: 2.40 },
    { symbol: "LINK", name: "Chainlink",              type: "Crypto", price: 22.40,  vol: 2.10 },
    { symbol: "LTC",  name: "Litecoin",               type: "Crypto", price: 118.60, vol: 1.80 },
    { symbol: "ATOM", name: "Cosmos",                 type: "Crypto", price: 8.20,   vol: 2.25 },
    { symbol: "XLM",  name: "Stellar",                type: "Crypto", price: 0.44,   vol: 2.05 },
    { symbol: "TRX",  name: "TRON",                   type: "Crypto", price: 0.26,   vol: 1.95 },
    { symbol: "APT",  name: "Aptos",                  type: "Crypto", price: 11.80,  vol: 2.45 },
    { symbol: "ARB",  name: "Arbitrum",               type: "Crypto", price: 0.86,   vol: 2.55 },
    { symbol: "OP",   name: "Optimism",               type: "Crypto", price: 1.74,   vol: 2.50 },
    { symbol: "NEAR", name: "NEAR Protocol",          type: "Crypto", price: 6.40,   vol: 2.30 },
    { symbol: "FIL",  name: "Filecoin",               type: "Crypto", price: 5.15,   vol: 2.20 },
    { symbol: "ETC",  name: "Ethereum Classic",       type: "Crypto", price: 27.90,  vol: 1.90 },
    { symbol: "AAVE", name: "Aave",                   type: "Crypto", price: 268.40, vol: 2.30 },
    { symbol: "UNI",  name: "Uniswap",                type: "Crypto", price: 14.60,  vol: 2.15 }
  ];

  window.nuLimitsMarket = {
    get assets() { return ASSETS; },
    priceOf: sym => stateFor(sym).price,
    openOf: sym => stateFor(sym).open,
    typeOf: sym => (ASSETS.find(a => a.symbol === sym) || { type: "Stock" }).type,
    FEE: 0.0065
  };

  const logoSrc = a => (window.nuLimitsAssetLogos
    ? window.nuLimitsAssetLogos.logo(a.symbol, a.type)
    : iconFor(a.type));

  /* every trade carries a small commission — round 17 */
  const FEE = 0.0065;

  const SESSION_SALT = Math.floor(Date.now() / 120000); /* reshuffles every 2 min */
  const market = Object.create(null);

  function stateFor(symbol) {
    if (market[symbol]) return market[symbol];
    const meta = ASSETS.find(a => a.symbol === symbol) || ASSETS[0];
    const baseSeed = symbol.split("").reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0;
    const s = {
      symbol,
      vol: meta.vol,
      price: meta.price,
      open: meta.price * (1 - (mulberry32(baseSeed ^ SESSION_SALT)() - 0.5) * 0.02),
      seedBase: (baseSeed ^ (SESSION_SALT * 2654435761)) >>> 0,
      series: Object.create(null),
      prevPrice: meta.price
    };
    const spread = mulberry32(baseSeed ^ 0x9e3779b9)();
    s.dayHigh = Math.max(s.open, s.price) * (1 + 0.0012 + spread * 0.006);
    s.dayLow = Math.min(s.open, s.price) * (1 - 0.0012 - (1 - spread) * 0.006);
    market[symbol] = s;
    return s;
  }

  function seriesFor(symbol, range) {
    const st = stateFor(symbol);
    if (st.series[range]) return st.series[range];
    const cfg = RANGES[range];
    const seed = (st.seedBase + range.split("").reduce((a, c) => a + c.charCodeAt(0) * 7919, 0)) >>> 0;
    const vol = cfg.vol * st.vol;
    st.series[range] = buildSeries(st.price, cfg.n, vol, seed, cfg.drift);
    return st.series[range];
  }

  /* one market tick — realistic, non-repeating */
  let tickAccumulator = 0;
  function tickMarket() {
    ASSETS.forEach(a => {
      const st = stateFor(a.symbol);
      const sigma = 0.0016 * st.vol;
      let move = sigma * (Math.random() - 0.5) * 2;
      if (Math.random() < 0.02) move *= 3.2;              /* occasional burst */
      st.prevPrice = st.price;
      st.price = Math.max(0.01, +(st.price * (1 + move)).toFixed(2));
      st.dayHigh = Math.max(st.dayHigh, st.price);
      st.dayLow = Math.min(st.dayLow, st.price);

      /* live-appended point for short ranges */
      Object.keys(st.series).forEach(range => {
        const arr = st.series[range];
        if (!arr || !arr.length) return;
        if (range === "1D" || range === "1W") {
          arr.shift();
          arr.push(st.price);
        } else {
          arr[arr.length - 1] = st.price;
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Live chart (canvas)
     --------------------------------------------------------- */
  const charts = new Set();
  let rafId = null;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  class LiveChart {
    constructor(canvas, tipEl) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.tip = tipEl;
      this.values = [];
      this.from = [];
      this.to = [];
      this.t = 1;
      this.hover = null;
      this.positive = true;
      this.startTime = 0;
      this.host = canvas.parentElement;
      this._onResize = () => this.resize();
      window.addEventListener("resize", this._onResize);
      if (window.ResizeObserver) {
        this.ro = new ResizeObserver(this._onResize);
        this.ro.observe(this.host);
      }
      this._bindPointer();
      charts.add(this);
      this.resize();
      ensureLoop();
    }

    destroy() {
      charts.delete(this);
      window.removeEventListener("resize", this._onResize);
      if (this.ro) this.ro.disconnect();
    }

    resize() {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const r = this.host.getBoundingClientRect();
      this.w = Math.max(40, r.width);
      this.h = Math.max(30, r.height);
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    setData(values, animate) {
      if (!values || values.length < 2) return;
      if (animate === false || !this.values.length || this.values.length !== values.length) {
        this.values = values.slice();
        this.from = this.values.slice();
        this.to = this.values.slice();
        this.t = 1;
        return;
      }
      /* interpolate from currently-drawn state -> new state */
      this.from = this.values.slice();
      this.to = values.slice();
      this.t = 0;
      this.startTime = performance.now();
    }

    interpolated() {
      const e = easeOutCubic(this.t);
      const a = this.from, b = this.to;
      if (!a.length) return b.slice();
      const n = b.length;
      const out = new Array(n);
      for (let i = 0; i < n; i++) {
        const av = a[i] === undefined ? b[i] : a[i];
        out[i] = av + (b[i] - av) * e;
      }
      return out;
    }

    _bindPointer() {
      const onMove = e => {
        const r = this.host.getBoundingClientRect();
        const x = clamp((e.touches ? e.touches[0].clientX : e.clientX) - r.left, 0, r.width);
        this.hover = x / r.width;
        if (this.tip) this.updateTip();
      };
      const onLeave = () => {
        this.hover = null;
        if (this.tip) this.tip.classList.remove("show");
      };
      this.host.addEventListener("pointermove", onMove);
      this.host.addEventListener("pointerdown", onMove);
      this.host.addEventListener("pointerleave", onLeave);
      this.host.addEventListener("pointerup", e => {
        if (e.pointerType !== "mouse") setTimeout(onLeave, 1500);
      });
    }

    updateTip() {
      const v = this.interpolated();
      const i = clamp(Math.round(this.hover * (v.length - 1)), 0, v.length - 1);
      const price = v[i];
      const first = v[0];
      const dp = price - first;
      const pct = first ? (dp / first) * 100 : 0;
      const up = dp >= 0;
      this.tip.innerHTML =
        NLmoney(price) +
        '<small>' + (up ? "+" : "\u2212") + NLmoney(Math.abs(dp)) +
        " (" + (up ? "+" : "\u2212") + Math.abs(pct).toFixed(2) + "%)</small>";
      const tw = this.tip.offsetWidth || 100;
      const x = clamp(this.hover * this.w, tw / 2 + 2, this.w - tw / 2 - 2);
      this.tip.style.left = x + "px";
      this.tip.classList.add("show");
    }

    draw(now) {
      const ctx = this.ctx;
      const w = this.w, h = this.h;
      if (!ctx || !w || !h) return;

      if (this.t < 1) {
        this.t = clamp((now - this.startTime) / 560, 0, 1);
      }
      const vals = this.interpolated();
      this.values = vals;
      if (vals.length < 2) return;

      ctx.clearRect(0, 0, w, h);

      let lo = Infinity, hi = -Infinity;
      for (const v of vals) { if (v < lo) lo = v; if (v > hi) hi = v; }
      const pad = (hi - lo) * 0.16 || hi * 0.01 || 1;
      lo -= pad; hi += pad;

      const yOf = v => h - ((v - lo) / (hi - lo)) * (h - 8) - 4;
      const n = vals.length;
      const xOf = i => (i / (n - 1)) * w;

      const up = vals[n - 1] >= vals[0];
      this.positive = up;
      const lineColor = up ? "#168A68" : "#C65A43";

      /* grid */
      ctx.save();
      ctx.strokeStyle = "rgba(90,70,50,.075)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = Math.round((h / 4) * i) + .5;
        ctx.setLineDash([2, 5]);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.restore();

      /* smooth path (quadratic midpoints) */
      const path = new Path2D();
      path.moveTo(xOf(0), yOf(vals[0]));
      for (let i = 1; i < n - 1; i++) {
        const xc = (xOf(i) + xOf(i + 1)) / 2;
        const yc = (yOf(vals[i]) + yOf(vals[i + 1])) / 2;
        path.quadraticCurveTo(xOf(i), yOf(vals[i]), xc, yc);
      }
      path.lineTo(xOf(n - 1), yOf(vals[n - 1]));

      /* area fill */
      const area = new Path2D(path);
      area.lineTo(w, h);
      area.lineTo(0, h);
      area.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, up ? "rgba(22,138,104,.22)" : "rgba(198,90,67,.22)");
      grad.addColorStop(1, up ? "rgba(22,138,104,0)" : "rgba(198,90,67,0)");
      ctx.fillStyle = grad;
      ctx.fill(area);

      /* line */
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = this.h < 80 ? 1.8 : 2.4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke(path);

      /* live tip */
      const lastX = xOf(n - 1);
      const lastY = yOf(vals[n - 1]);
      const pulse = (Math.sin(now / 430) + 1) / 2;

      if (this.h >= 80) {
        ctx.beginPath();
        ctx.arc(lastX - 1.5, lastY, 7 + pulse * 5, 0, Math.PI * 2);
        ctx.fillStyle = up ? "rgba(22,138,104,.13)" : "rgba(198,90,67,.13)";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(lastX - 1.5, lastY, this.h < 80 ? 2.4 : 3.6, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.strokeStyle = "#fffdf9";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      /* crosshair */
      if (this.hover != null && this.h >= 80) {
        const x = this.hover * w;
        const i = clamp(Math.round(this.hover * (n - 1)), 0, n - 1);
        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = "rgba(50,40,30,.32)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(xOf(i), yOf(vals[i]), 4, 0, Math.PI * 2);
        ctx.fillStyle = "#fffdf9";
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = lineColor;
        ctx.stroke();
      }
    }
  }

  function ensureLoop() {
    if (rafId) return;
    const loop = now => {
      if (!charts.size) { rafId = null; return; }
      charts.forEach(c => c.draw(now));
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------
     Formatting helpers
     --------------------------------------------------------- */
  function NLmoney(n) {
    return "R " + Number(n).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  function NLsignedPct(n) {
    return (n >= 0 ? "+" : "\u2212") + Math.abs(n).toFixed(2) + "%";
  }
  function iconFor(type) {
    return type === "Crypto" ? "\u20BF" : type === "ETF" ? "\u2197" : "\u25C8";
  }

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  let toastEl = null, toastTimer = null;
  function nlToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "nl-toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2300);
  }

  /* ---------------------------------------------------------
     The page
     --------------------------------------------------------- */
  let activeChart = null;
  let liveTimer = null;
  let ui = null;

  function destroyInvestPage() {
    if (activeChart) { activeChart.destroy(); activeChart = null; }
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
    ui = null;
  }

  window.renderInvestments = function renderInvestments() {
    const root = document.getElementById("dynamic-page");
    if (!root) return;

    destroyInvestPage();

    /* ---------------- persisted state ---------------- */
    const KEY = "nuLimitsInvestments_v1";
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { saved = {}; }
    if (!saved || typeof saved !== "object") saved = {};
    if (!saved.holdings) saved.holdings = {};
    if (!Array.isArray(saved.history)) saved.history = [];

    let selectedSymbol = ASSETS.some(a => a.symbol === saved.selected) ? saved.selected : "NVDA";
    let range = "1D";
    let filter = "All";
    let search = "";

    const persist = () => {
      saved.selected = selectedSymbol;
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch {}
    };

    const assetMeta = () => ASSETS.find(a => a.symbol === selectedSymbol) || ASSETS[0];
    const assetState = () => stateFor(selectedSymbol);
    const balance = () => (window.nuLimitsMoney && window.nuLimitsMoney.getBalance)
      ? window.nuLimitsMoney.getBalance() : 0;

    const holdingsValue = () => Object.entries(saved.holdings).reduce((sum, [sym, h]) => {
      const a = ASSETS.find(x => x.symbol === sym);
      if (!a) return sum;
      return sum + stateFor(sym).price * h.quantity;
    }, 0);

    /* ---------------- markup ---------------- */
    root.innerHTML = `
      <section class="dynamic-page-content nl-invest-page">
        <div class="nl-invest-heading">
          <div>
            <p class="eyebrow">NU LIMITS / MARKETS</p>
            <h1>Investments</h1>
            <p class="muted">Build your portfolio. Track every move.</p>
          </div>
        </div>

        <section class="nl-live-dock" id="nl-dock" aria-label="Live asset chart and trade">
          <div class="nl-dock-head">
            <div class="nl-dock-id">
              <span class="nl-dock-icon" id="nl-icon">◈</span>
              <span class="nl-dock-text">
                <strong id="nl-sym">NVDA</strong>
                <small id="nl-name">NVIDIA Corporation</small>
              </span>
            </div>
            <span class="nl-holding-chip" id="nl-holding" hidden></span>
            <span class="nl-live-badge"><i></i> LIVE</span>
          </div>

          <div class="nl-price-line">
            <strong id="nl-price">R 0.00</strong>
            <span class="nl-tick-flag" id="nl-flag"></span>
            <span class="nl-delta positive" id="nl-delta">+0.00%</span>
          </div>

          <div class="nl-chart-stats">
            <span>OPEN <b id="nl-open">—</b></span>
            <span>HIGH <b id="nl-high">—</b></span>
            <span>LOW <b id="nl-low">—</b></span>
            <span>VOL <b id="nl-vol">—</b></span>
          </div>

          <div class="nl-chart-area" id="nl-chart-area">
            <canvas id="nl-canvas"></canvas>
            <div class="nl-chart-tip" id="nl-tip"></div>
          </div>

          <div class="nl-chart-axis" id="nl-axis"></div>

          <div class="nl-range-controls" id="nl-ranges">
            ${Object.keys(RANGES).map(r =>
              `<button type="button" data-range="${r}" class="${r === range ? "active" : ""}">${r}</button>`
            ).join("")}
          </div>

          <p class="nl-sim-note">Simulated live prices · not a real exchange</p>

          <div class="nl-trade-attached">
            <div class="nl-trade-row">
              <div class="nl-qty-group">
                <button class="nl-qty-step" type="button" data-step="-1" aria-label="Decrease quantity">−</button>
                <input class="nl-qty-input" id="nl-qty" type="number" min="0.001" step="0.001" value="1"
                       inputmode="decimal" aria-label="Quantity">
                <button class="nl-qty-step" type="button" data-step="1" aria-label="Increase quantity">+</button>
              </div>
              <div class="nl-trade-buttons">
                <button class="nl-buy" type="button" data-trade="buy">Buy</button>
                <button class="nl-sell" type="button" data-trade="sell">Sell</button>
              </div>
            </div>
            <p class="nl-trade-feedback" id="nl-feedback">Estimated order value: —</p>
          </div>
        </section>

        <section class="nl-market-section" id="nl-markets">
          <div class="nl-section-head">
            <div>
              <p class="eyebrow">DISCOVER</p>
              <h2>Markets</h2>
            </div>
            <input class="nl-market-search" id="nl-search" placeholder="Search assets"
                   aria-label="Search markets" value="${search.replace(/"/g, "&quot;")}">
            <button class="nl-collapse" type="button" id="nl-collapse"
                    aria-label="Collapse the market list" aria-expanded="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                   stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>
          <div class="nl-filter-row" id="nl-filters">
            ${["All", "Stock", "Crypto", "ETF"].map(f =>
              `<button type="button" data-filter="${f}" class="${f === filter ? "active" : ""}">${
                f === "Stock" ? "Stocks" : f === "Crypto" ? "Crypto" : f
              }</button>`
            ).join("")}
          </div>
          <div class="nl-market-list" id="nl-list"></div>
        </section>

        <section class="nl-portfolio-panel" id="nl-portfolio">
          <div class="nl-section-head">
            <div>
              <p class="eyebrow">YOUR POSITIONS</p>
              <h2>Portfolio</h2>
            </div>
            <strong id="nl-holdings-value">R 0.00</strong>
            <button class="nl-jump" type="button" id="nl-jump" aria-label="Jump to the portfolio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                   stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px">
                <path d="M12 5v14M6 13l6 6 6-6"/></svg>
              Portfolio
            </button>
          </div>
          <div class="nl-position-list" id="nl-positions"></div>
        </section>

        <section class="nl-portfolio-panel">
          <div class="nl-section-head">
            <div>
              <p class="eyebrow">RECENT ACTIVITY</p>
              <h2>Trade history</h2>
            </div>
          </div>
          <div class="nl-position-list" id="nl-history"></div>
        </section>

        <button class="secondary-button" type="button" data-page="home">← Back to Home</button>
      </section>`;

    /* ---------------- element refs ---------------- */
    const $ = id => root.querySelector("#" + id);
    const dockEl = $("nl-dock");
    const canvas = $("nl-canvas");
    const tipEl = $("nl-tip");
    const priceEl = $("nl-price");
    const deltaEl = $("nl-delta");
    const flagEl = $("nl-flag");
    const qtyEl = $("nl-qty");
    const feedbackEl = $("nl-feedback");
    const axisEl = $("nl-axis");
    const listEl = $("nl-list");
    const posEl = $("nl-positions");
    const histEl = $("nl-history");
    const holdValEl = $("nl-holdings-value");
    const holdingChip = $("nl-holding");

    activeChart = new LiveChart(canvas, tipEl);

    /* ---------------- rendering ---------------- */
    function paintAxis() {
      axisEl.innerHTML = RANGES[range].labels.map(l => `<span>${l}</span>`).join("");
    }

    function paintHead() {
      const meta = assetMeta();
      const st = assetState();
      $("nl-sym").textContent = meta.symbol;
      $("nl-name").textContent = meta.name;
      $("nl-icon").innerHTML = `<img class="nl-dock-logo" alt="" src="${logoSrc(meta)}">`;
      $("nl-open").textContent = NLmoney(st.open);
      $("nl-high").textContent = NLmoney(st.dayHigh);
      $("nl-low").textContent = NLmoney(st.dayLow);
      $("nl-vol").textContent = (st.vol * 42).toFixed(1) + "M";
      paintQuote();

      const h = saved.holdings[meta.symbol];
      if (h && h.quantity > 0) {
        holdingChip.hidden = false;
        holdingChip.innerHTML = `HOLDING <b>${h.quantity.toFixed(3)}</b>`;
      } else {
        holdingChip.hidden = true;
      }
    }

    function paintQuote() {
      const st = assetState();
      const arr = st.series[range] || [];
      const first = arr.length ? arr[0] : st.price;
      const pct = first ? ((st.price - first) / first) * 100 : 0;
      priceEl.textContent = NLmoney(st.price);
      deltaEl.textContent = NLsignedPct(pct) + " " + (range === "1D" ? "today" : "period");
      deltaEl.classList.toggle("positive", pct >= 0);
      deltaEl.classList.toggle("negative", pct < 0);
    }

    function paintList() {
      const q = search.trim().toLowerCase();
      const rows = ASSETS.filter(a =>
        (filter === "All" || a.type === filter) &&
        (`${a.symbol} ${a.name}`.toLowerCase().includes(q))
      );

      listEl.innerHTML = rows.map(a => {
        const st = stateFor(a.symbol);
        const pct = st.open ? ((st.price - st.open) / st.open) * 100 : 0;
        return `<button class="nl-market-row ${a.symbol === selectedSymbol ? "selected" : ""}"
                        type="button" data-asset="${a.symbol}">
          <span class="nl-mini-symbol"><img class="nl-mini-logo" alt="" src="${logoSrc(a)}"></span>
          <span class="nl-market-name"><b>${a.symbol}</b><small>${a.name}</small></span>
          <span class="nl-market-price">
            <b data-live-price="${a.symbol}">${NLmoney(st.price)}</b>
            <small data-live-pct="${a.symbol}" class="${pct >= 0 ? "positive" : "negative"}">${NLsignedPct(pct)}</small>
          </span>
        </button>`;
      }).join("") || `<p class="muted">No assets match your search.</p>`;
    }

    function paintPositions() {
      const rows = Object.entries(saved.holdings)
        .filter(([, h]) => h.quantity > 0)
        .map(([sym, h]) => {
          const a = ASSETS.find(x => x.symbol === sym);
          if (!a) return "";
          const st = stateFor(sym);
          const value = st.price * h.quantity;
          const cost = h.average * h.quantity;
          const pl = value - cost;
          const plPct = cost ? (pl / cost) * 100 : 0;
          return `<div class="nl-position-row">
            <span>
              <b>${sym}</b>
              <small>${h.quantity.toFixed(3)} units · avg ${NLmoney(h.average)}</small>
            </span>
            <span style="text-align:right">
              <strong>${NLmoney(value)}</strong>
              <small class="${pl >= 0 ? "positive" : "negative"}"
                     style="display:block;margin-top:2px;font-weight:750">
                ${pl >= 0 ? "+" : "\u2212"}${NLmoney(Math.abs(pl))} (${NLsignedPct(plPct)})
              </small>
            </span>
          </div>`;
        }).join("");
      posEl.innerHTML = rows || `<p class="muted">Your positions will appear here after your first trade.</p>`;
      holdValEl.textContent = NLmoney(holdingsValue());
    }

    function paintHistory() {
      histEl.innerHTML = saved.history.slice(0, 8).map(t => `
        <div class="nl-position-row">
          <span>
            <b>${t.side} ${t.symbol}</b>
            <small>${new Date(t.date).toLocaleString("en-ZA")} · ${t.quantity} units</small>
          </span>
          <strong class="${t.side === "BUY" ? "negative" : "positive"}">${NLmoney(t.total)}</strong>
        </div>`).join("") || `<p class="muted">No trades yet.</p>`;
    }

    function paintFeedback() {
      const qty = Number(qtyEl.value);
      const st = assetState();
      if (!Number.isFinite(qty) || qty <= 0) {
        feedbackEl.textContent = "Enter a quantity to trade.";
        feedbackEl.className = "nl-trade-feedback";
        return;
      }
      const gross = qty * st.price;
      const fee = Math.round(gross * FEE);
      feedbackEl.textContent =
        `${qty} × ${NLmoney(st.price)} = ${NLmoney(gross)} + ${NLmoney(fee)} fee (0.65%)  ·  Available ${NLmoney(balance())}`;
      feedbackEl.className = "nl-trade-feedback";
    }

    function drawChart(animate) {
      activeChart.setData(seriesFor(selectedSymbol, range).slice(), animate);
    }

    function fullRepaint() {
      paintHead();
      paintAxis();
      paintList();
      paintPositions();
      paintHistory();
      paintFeedback();
      drawChart(true);
    }

    /* ---------------- trades ---------------- */
    function runTrade(side) {
      const meta = assetMeta();
      const st = assetState();
      const qty = Number(qtyEl.value);
      /* nuLimitsMoney.transact() settles in whole rand */
      const gross = qty * st.price;
      const fee = Math.round(gross * FEE);
      const total = side === "BUY"
        ? Math.max(0, Math.round(gross + fee))     /* pay a little more */
        : Math.max(0, Math.round(gross - fee));    /* receive a little less */

      const fail = msg => {
        feedbackEl.textContent = msg;
        feedbackEl.className = "nl-trade-feedback is-error";
      };

      if (!Number.isFinite(qty) || qty <= 0 || qty > 1e6) return fail("Enter a valid quantity.");

      const h = saved.holdings[meta.symbol] || { quantity: 0, average: 0 };

      if (side === "BUY") {
        const free = !!(window.nuLimitsFree && window.nuLimitsFree.on());
        if (!free && !(window.nuLimitsCanPay ? window.nuLimitsCanPay(total) : total <= balance())) {
          return fail("Insufficient funds for this order.");
        }
        if (!window.nuLimitsMoney || !window.nuLimitsMoney.transact("expense", total,
            `Investment purchase: ${qty} ${meta.symbol}`)) {
          return fail("Trade could not be completed. Check your cash balance.");
        }
        const newQty = h.quantity + qty;
        h.average = ((h.quantity * h.average) + (qty * st.price)) / newQty;
        h.fees = Math.round((h.fees || 0) + fee);
        h.quantity = newQty;
        saved.holdings[meta.symbol] = h;
      } else {
        if (qty > h.quantity) return fail("You do not own enough units to sell.");
        if (!window.nuLimitsMoney || !window.nuLimitsMoney.transact("income", total,
            `Investment sale: ${qty} ${meta.symbol}`)) {
          return fail("Sale could not be completed.");
        }
        h.quantity = Number((h.quantity - qty).toFixed(6));
        if (h.quantity <= 0) delete saved.holdings[meta.symbol];
        else saved.holdings[meta.symbol] = h;
      }

      saved.history.unshift({
        side, symbol: meta.symbol, quantity: qty, total, date: new Date().toISOString()
      });
      saved.history = saved.history.slice(0, 100);
      persist();

      /* update only what changed — keeps the chart animation alive */
      paintPositions();
      paintHistory();
      paintHead();
      paintFeedback();

      feedbackEl.textContent =
        `${side === "BUY" ? "Bought" : "Sold"} ${qty} ${meta.symbol} for ${NLmoney(total)} · fee ${NLmoney(fee)}`;
      feedbackEl.className = "nl-trade-feedback is-ok";
      nlToast(`${side === "BUY" ? "Bought" : "Sold"} ${qty} ${meta.symbol} · ${NLmoney(total)} (fee ${NLmoney(fee)})`);
    }

    /* ---------------- pinned dock ----------------
       The dock is pinned with pure CSS `position: sticky`.
       No scroll listener, no resizing -> no jitter while scrolling. */

    /* ---------------- events ---------------- */
    root.querySelector("#nl-ranges").addEventListener("click", e => {
      const btn = e.target.closest("[data-range]");
      if (!btn) return;
      range = btn.dataset.range;
      root.querySelectorAll("#nl-ranges button").forEach(b =>
        b.classList.toggle("active", b === btn));
      paintAxis();
      paintQuote();
      drawChart(true);
    });

    root.querySelector("#nl-filters").addEventListener("click", e => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      filter = btn.dataset.filter;
      root.querySelectorAll("#nl-filters button").forEach(b =>
        b.classList.toggle("active", b === btn));
      paintList();
    });

    $("nl-search").addEventListener("input", e => {
      search = e.target.value;
      paintList();
    });

    /* collapse the market list so the portfolio is one tap away */
    const markets = $("nl-markets");
    const collapse = $("nl-collapse");
    try {
      if (sessionStorage.getItem("nlMarketsCollapsed") === "1") {
        markets.classList.add("is-collapsed");
        collapse.setAttribute("aria-expanded", "false");
      }
    } catch (err) { /* ignore */ }

    collapse.addEventListener("click", () => {
      const now = markets.classList.toggle("is-collapsed");
      collapse.setAttribute("aria-expanded", now ? "false" : "true");
      collapse.setAttribute("aria-label", now ? "Expand the market list" : "Collapse the market list");
      try { sessionStorage.setItem("nlMarketsCollapsed", now ? "1" : "0"); } catch (err) { /* ignore */ }
    });

    $("nl-jump").addEventListener("click", () => {
      const p = $("nl-portfolio");
      if (!p) return;
      p.scrollIntoView({ behavior: "smooth", block: "start" });
      p.classList.add("is-flash");
      setTimeout(() => p.classList.remove("is-flash"), 900);
    });

    listEl.addEventListener("click", e => {
      const row = e.target.closest("[data-asset]");
      if (!row) return;
      selectedSymbol = row.dataset.asset;
      persist();
      paintHead();
      paintList();
      paintFeedback();
      drawChart(true);
    });

    root.querySelector(".nl-qty-group").addEventListener("click", e => {
      const btn = e.target.closest("[data-step]");
      if (!btn) return;
      const step = Number(btn.dataset.step);
      const cur = Number(qtyEl.value) || 0;
      const next = Math.max(0.001, Number((cur + step).toFixed(3)));
      qtyEl.value = next;
      paintFeedback();
    });

    qtyEl.addEventListener("input", paintFeedback);

    root.querySelector(".nl-trade-buttons").addEventListener("click", e => {
      const btn = e.target.closest("[data-trade]");
      if (!btn) return;
      runTrade(btn.dataset.trade.toUpperCase());
    });

    root.querySelectorAll("[data-page]").forEach(btn =>
      btn.addEventListener("click", () => navigateTo(btn.dataset.page)));

    /* ---------------- boot ---------------- */
    persist();
    fullRepaint();

    ui = { paintHead, paintQuote, paintList, paintFeedback, paintPositions };

    /* ---------------- live ticker ---------------- */
    tickMarket();
    liveTimer = setInterval(() => {
      tickMarket();

      /* update DOM surgically — no full re-render */
      const st = assetState();
      const prev = priceEl.textContent;
      paintQuote();
      if (prev !== priceEl.textContent) {
        const up = st.price >= st.prevPrice;
        priceEl.classList.remove("tick-up", "tick-down");
        void priceEl.offsetWidth;
        priceEl.classList.add(up ? "tick-up" : "tick-down");
        flagEl.className = "nl-tick-flag " + (up ? "up" : "down");
        setTimeout(() => { flagEl.className = "nl-tick-flag"; }, 420);
      }

      $("nl-high").textContent = NLmoney(st.dayHigh);
      $("nl-low").textContent = NLmoney(st.dayLow);

      /* market list live prices */
      root.querySelectorAll("[data-live-price]").forEach(el => {
        const sym = el.dataset.livePrice;
        const s2 = stateFor(sym);
        el.textContent = NLmoney(s2.price);
        const pctEl = root.querySelector(`[data-live-pct="${sym}"]`);
        if (pctEl) {
          const pct = s2.open ? ((s2.price - s2.open) / s2.open) * 100 : 0;
          pctEl.textContent = NLsignedPct(pct);
          pctEl.className = pct >= 0 ? "positive" : "negative";
        }
      });

      /* positions revalue live */
      paintPositions();
      paintFeedback();

      /* animate the chart forward */
      drawChart(true);
    }, 1600);
  };

  /* let other routes tear this page down cleanly */
  window.nuLimitsInvestLeave = destroyInvestPage;

  /* clean up if the user leaves the page */
  const origNavigate = window.navigateTo;
  if (typeof origNavigate === "function") {
    window.navigateTo = function (page) {
      if (page !== "invest") destroyInvestPage();
      return origNavigate.apply(this, arguments);
    };
  }
})();
