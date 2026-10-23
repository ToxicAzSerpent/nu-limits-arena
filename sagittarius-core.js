/* ==========================================================
   NU LIMITS — SAGITTARIUS AI  (round 18)

   An offline analyst that answers questions about the game by
   reading the live state of every system — no network, no keys.

     · intent matching over a keyword table
     · answers built from the actual numbers in your save
     · questions it cannot answer are said so, plainly

   Used by the chat widget (sagittarius.js).
   ========================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     Readers — every one is defensive, the game may be mid-load
     --------------------------------------------------------- */
  const money = n => (Number(n) < 0 ? "−R " : "R ") +
    Math.round(Math.abs(Number(n) || 0)).toLocaleString("en-ZA");

  /* market prices need the cents — R 0.26 is not R 0 */
  function pmoney(n) {
    const v = Number(n) || 0;
    if (Math.abs(v) < 1000) return "R " + v.toFixed(2);
    return "R " + Math.round(v).toLocaleString("en-ZA");
  }

  function balance() {
    try { return window.nuLimitsMoney && window.nuLimitsMoney.getBalance
      ? window.nuLimitsMoney.getBalance() : 0; } catch (e) { return 0; }
  }

  function market() {
    const M = window.nuLimitsMarket;
    if (!M) return [];
    return M.assets.map(a => {
      const s = liveOf(a.symbol, a);
      const pct = s && s.open ? ((s.price - s.open) / s.open) * 100 : 0;
      return { symbol: a.symbol, name: a.name, type: a.type, price: s ? s.price : a.price, pct };
    });
  }

  /* live prices come straight from the market engine, with the DOM as a fallback */
  function liveOf(sym, meta) {
    const M = window.nuLimitsMarket;
    if (M && M.priceOf && M.openOf) {
      try { return { price: M.priceOf(sym), open: M.openOf(sym) }; } catch (e) { /* fall through */ }
    }
    const el = document.querySelector(`[data-live-price="${sym}"]`);
    if (!el) return meta ? { price: meta.price, open: meta.price } : null;
    const raw = String(el.textContent).replace(/\s/g, "").replace(/^R/, "").replace(/,/g, ".");
    const price = Number(raw) || 0;
    const prevEl = document.querySelector(`[data-live-pct="${sym}"]`);
    const pct = prevEl ? Number(String(prevEl.textContent).replace(/[^\d.\-−+]/g, "")) || 0 : 0;
    return { price, open: price ? price / (1 + pct / 100) : 0 };
  }

  const top = (list, n, dir) => list
    .filter(a => Number.isFinite(a.pct))
    .sort((a, b) => dir * (b.pct - a.pct))
    .slice(0, n);

  function fromStorage(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      return v && typeof v === "object" ? v : fallback;
    } catch (e) { return fallback; }
  }

  function holdings() {
    const saved = fromStorage("nuLimitsInvestments_v1", { holdings: {} });
    const h = saved.holdings || {};
    return Object.keys(h).map(sym => {
      const meta = market().find(a => a.symbol === sym);
      const price = meta ? meta.price : 0;
      const value = price * h[sym].quantity;
      const cost = (h[sym].average || 0) * h[sym].quantity;
      return { sym, qty: h[sym].quantity, value, cost, pnl: value - cost };
    }).filter(r => r.qty > 0).sort((a, b) => b.value - a.value);
  }

  const family = () => (window.nuLimitsFamily && window.nuLimitsFamily.state) || null;
  const bank = () => (window.nuLimitsBank && window.nuLimitsBank.state) || null;
  const restaurant = () => (window.nuLimitsRestaurant && window.nuLimitsRestaurant.state) || null;
  const creator = () => (window.nuLimitsCreator && window.nuLimitsCreator.state) || null;

  function assets() {
    const s = fromStorage("nuLimitsAssets_v1", { items: [] });
    return (s.items || []);
  }

  function familyOf(item) { return (item.bills || []).reduce((t, b) => t + (b.amount || 0), 0) + (item.tax || 0) + (item.internet || 0); }

  function upkeep() {
    return assets().filter(i => i.owned && i.owner !== "partner")
      .reduce((t, i) => t + familyOf(i), 0);
  }

  /* ---------------------------------------------------------
     Answers
     --------------------------------------------------------- */
  const A = {};

  A.hello = () => "Sagittarius here. I can read your empire while we talk — wallet, markets, "
    + "property, the restaurant, the channel, the bank and the household. Ask me about any of them.";

  A.balance = () => {
    const b = balance();
    const lines = [`Your wallet holds **${money(b)}**.`];
    const B = bank();
    if (B && B.account) lines.push(`Cheque account ${B.account.number ? B.account.number + " " : ""}· credit score ${B.score}.`);
    if (B && B.card && B.card.status === "active") lines.push(`Platinum outstanding ${money(B.card.outstanding)} of ${money(B.card.limit)}.`);
    const lines2 = [];
    const loan = B && Array.isArray(B.loans) ? B.loans.find(l => l && l.outstanding > 0) : null;
    if (loan) lines2.push(`A loan is running with ${money(loan.outstanding)} left.`);
    if (b < 0) lines2.push("You are in the overdraft — interest is charged every month.");
    return lines.concat(lines2).join(" ");
  };

  A.trending = () => {
    const m = market();
    if (!m.length) return "Open the Investments page once and I can read live prices for you.";
    const up = top(m, 3, 1);
    const down = top(m, 2, -1);
    const fmt = l => l.map(a => `${a.symbol} ${a.pct >= 0 ? "+" : ""}${a.pct.toFixed(2)}% at ${pmoney(a.price)}`).join(", ");
    return `Right now the strongest moves are ${fmt(up)}. The weakest are ${fmt(down)}. `
      + "These are session prices — they reshuffle every couple of minutes, so the leaders rotate.";
  };

  A.best = () => {
    const m = market().filter(a => a.type === "Stock");
    if (!m.length) return "Open the Investments page once so I can read the market.";
    const b = top(m, 1, 1)[0];
    return `${b.symbol} is the best performing stock this session at ${b.pct >= 0 ? "+" : ""}${b.pct.toFixed(2)}%, `
      + `trading at ${pmoney(b.price)}. Rises like that can give back quickly — size the position accordingly.`;
  };

  A.crypto = () => {
    const m = market().filter(a => a.type === "Crypto");
    if (!m.length) return "Open the Investments page once so I can read the market.";
    const b = top(m, 3, 1);
    return `Crypto is ${b[0].pct >= 0 ? "bid up" : "off"}: ${b.map(a => `${a.symbol} ${a.pct.toFixed(2)}%`).join(", ")}. `
      + `There are ${m.length} coins listed on your exchange. Coins move far harder than equities — a 5% swing in an hour is ordinary.`;
  };

  A.portfolio = () => {
    const h = holdings();
    if (!h.length) return "You hold no positions yet. Open Investments, pick an asset and buy — commissions are 0.65% each way.";
    const total = h.reduce((t, r) => t + r.value, 0);
    const pnl = h.reduce((t, r) => t + r.pnl, 0);
    const rows = h.slice(0, 5).map(r => `${r.sym} ${money(r.value)} (${r.pnl >= 0 ? "+" : ""}${money(r.pnl)})`);
    return `Your portfolio is worth **${money(total)}**, ${pnl >= 0 ? "up" : "down"} ${money(Math.abs(pnl))} on cost. `
      + `Largest positions: ${rows.join(", ")}.`;
  };

  A.buy = () => {
    const b = balance();
    return `You can spend ${money(b)} in cash right now (Edit Mode removes the limit). `
      + "Every trade adds a 0.65% commission — on a R 10 000 order that is R 65 — and you can pay with either the debit or the Platinum card; the chooser appears at the till.";
  };

  A.property = () => {
    const items = assets().filter(i => i.owned && i.owner !== "partner");
    if (!items.length) return "You own no property yet. Mansions start at R 48 000, and each one carries power, water and tax every month on the statement.";
    const value = items.reduce((t, i) => t + i.price, 0);
    return `You own ${items.length} asset${items.length === 1 ? "" : "s"} worth ${money(value)}, with ${money(upkeep())} a month in running costs. `
      + `Biggest holding: ${items.slice().sort((a, b) => b.price - a.price)[0].name}. `
      + "Sell any of them from its card, or resell things you bought for your partner — unless you are divorced.";
  };

  A.cars = () => {
    const cars = assets().filter(i => i.category === "car" && i.owned && i.owner !== "partner");
    if (!cars.length) return "No cars in the garage yet. Cars live under Property → Cars, and each make has its own showroom page.";
    return `You have ${cars.length} car${cars.length === 1 ? "" : "s"}: ${cars.map(c => c.name).join(", ")}. `
      + "Monthly insurance, maintenance and fuel are on the statement; start or stop the engine from the card.";
  };

  A.restaurant = () => {
    const r = restaurant();
    if (!r) return "The restaurant is not open on this device yet — Business → Restaurant.";
    if (!r.owned) return "You have not bought the Restaurant yet. It needs R 75 000 in capital before the doors open.";
    const st = r.stats || {};
    return `The restaurant holds ${money(r.cash || 0)} in cash with ${(r.staff || []).length} staff. `
      + `Yesterday: ${st.covers || 0} covers, ${money(st.revenue || 0)} revenue, ${money(st.profit || 0)} profit. `
      + "Kitchen upgrades run to level 35 now — the ladder is where the real quality comes from.";
  };

  A.staff = () => {
    const r = restaurant();
    if (!r || !Array.isArray(r.staff)) return "No restaurant, no staff roster — the crew appears once you buy the Restaurant.";
    const lowest = r.staff.slice().sort((a, b) => a.morale - b.morale)[0];
    return `${r.staff.length} people on the payroll. Lowest morale is ${lowest ? `${lowest.name} at ${Math.round(lowest.morale)}%` : "—"}. `
      + "Promote the strong ones, and watch wages — unpaid days cost you staff.";
  };

  A.creator = () => {
    const c = creator();
    if (!c) return "The creator channel is not set up yet — Business → YouTube Creator Studio.";
    return `Channel travel: ${Math.round(c.subs || 0)} subscribers, ${Math.round(c.views || 0)} views, ${money(c.revenue || 0)} earned. `
      + "Gear quality drives watch time; publish on a schedule and the algorithm rewards consistency.";
  };

  A.family = () => {
    const f = family();
    if (!f) return "The household is empty — Family → Find a partner.";
    const p = f.partner;
    const kids = (f.children || []).length;
    const bits = [];
    bits.push(p ? `${p.name}, ${p.age}, ${p.title || "between jobs"}` : "no current partner");
    bits.push(`${kids} child${kids === 1 ? "" : "ren"}`);
    if (f.pregnancy) bits.push(`pregnant — due day ${f.pregnancy.dueDay}`);
    if (f.hospitalDue > 0) bits.push(`${money(f.hospitalDue)} in hospital arrears`);
    return `Household: ${bits.join(" · ")}. A ring from the jeweller is required before a wedding, and divorce costs R 45 000.`;
  };

  A.marriage = () => "Buy a ring at Cartier (Gold Band R 18 000 is enough), then propose from the partner card. "
    + "Divorce is R 45 000 and ends resale rights on everything you bought her — the goods stay hers.";

  A.pregnancy = () => {
    const f = family();
    if (!f || !f.pregnancy) return "No pregnancy running. The mating clock decides: under 30 real minutes favours a boy, 30–45 favours a girl, past 45 favours twin girls.";
    const pg = f.pregnancy;
    const world = window.nuLimitsWorld ? window.nuLimitsWorld.day : 0;
    const left = Math.max(0, pg.dueDay - world);
    return `${pg.motherName} is ${left} day${left === 1 ? "" : "s"} from the due date — ${pg.twins ? "twins" : "a single baby"}, ${pg.gender}. `
      + "The hospital bill lands on the birth: R 28 000, or R 46 000 for twins.";
  };

  A.bank = () => {
    const B = bank();
    if (!B) return "The bank is not loaded yet — tap Bank in the navigation.";
    const loan = Array.isArray(B.loans) ? B.loans.find(l => l && l.outstanding > 0) : null;
    const bits = [`Credit score ${B.score}.`, `Overdraft limit ${money(B.overdraft)}.`];
    if (B.card && B.card.status === "active") bits.push(`Platinum ${money(B.card.outstanding)} used of ${money(B.card.limit)}.`);
    if (loan) bits.push(`Loan outstanding ${money(loan.outstanding)}.`);
    if (B.card && B.card.status === "closed") bits.push("Platinum is closed after a default — rebuild with cash.");
    return bits.join(" ");
  };

  A.credit = () => {
    const B = bank();
    if (!B || !B.card || B.card.status !== "active") {
      return "No credit line open. Go to Bank → Platinum, pick a limit and press Open credit facility. "
        + "Borrowing lifts your spending power and your risk at the same time.";
    }
    const free = B.card.limit - B.card.outstanding;
    return `Platinum is open with ${money(free)} of headroom out of ${money(B.card.limit)}. `
      + "While Platinum is the selected card, earn-per-click is disabled — that is deliberate.";
  };

  A.debt = () => {
    const B = bank();
    if (!B) return "The bank is not loaded yet.";
    const loan = Array.isArray(B.loans) ? B.loans.find(l => l && l.outstanding > 0) : null;
    const total = (loan ? loan.outstanding : 0) + (B.card && B.card.status === "active" ? B.card.outstanding : 0);
    if (!total) return "You owe nothing. That is the strongest position in the game — keep it while you can.";
    return `Total debt ${money(total)}. Missed payments drop the score, recall the overdraft and, at the end, repossess assets. `
      + "Arrears are settled from cash, not credit.";
  };

  A.shop = () => {
    const s = fromStorage("nuLimitsShop_v1", { stores: [] });
    const owned = (s.stores || []).reduce((t, st) => t + (st.products || []).filter(p => p.owned).length, 0);
    return `${(s.stores || []).length} houses in the shop, ${owned} pieces in your wardrobe. `
      + "Buying in gift mode puts the piece on your partner's name instead — it then lives on the Property page under Wife or Girlfriend.";
  };

  A.theme = () => "Settings → Appearance. Light, Dark and Auto — Auto follows your phone. The dark theme is the gold-on-near-black one.";

  A.edit = () => {
    const on = !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
    return on
      ? "Edit Mode is **on** — nothing is charged, and every page shows its pencils, add-slots and photo uploads."
      : "Edit Mode is off. Home → Settings → Creator edit mode turns it on; while it is on, purchases are free and every creator feature is editable.";
  };

  A.time = () => {
    const w = window.nuLimitsWorld;
    if (!w) return "The world clock is not loaded.";
    return `Today is day ${w.day} of 2026. One real day is 15 seconds here, and the calendar runs 365 days to a year.`;
  };

  A.help = () => "Ask me things like: *what's trending*, *best stock today*, *how is my portfolio*, "
    + "*can I afford a mansion*, *how is the restaurant*, *what is my credit score*, *who is in my family*, "
    + "*when is the baby due*, *how do I marry her*, *what does a car cost me monthly*, *how does dark mode work*.";

  /* ---------------------------------------------------------
     Intent table — ordered, first match wins
     --------------------------------------------------------- */
  const RULES = [
    [/\b(hi|hello|hey|yo|good (morning|day|evening))\b/, A.hello],
    [/\b(help|what can you do|how do i ask|commands)\b/, A.help],
    [/\b(trend\w*|hottest|hot|moving|movers|top gainer|best performing|best stock|doing well|what.*buy)\b/, A.trending],
    [/\b(crypto|coins?|bitcoin|btc|altcoin)\b/, A.crypto],
    [/\b(portfolio|holding\w*|positions?|my stocks|invested|pnl|profit on)\b/, A.portfolio],
    [/\b(price of stocks|stock market|market|stocks)\b/, A.best],
    [/\b(afford|can i buy|how much can i spend|spending power|cash)\b/, A.buy],
    [/\b(restaurant|copper pot|kitchen|covers?|menu)\b/, A.restaurant],
    [/\b(staff|employees|waiter|chef|morale|wages)\b/, A.staff],
    [/\b(channel|creator|youtube|subs|subscribers?|views?|video)\b/, A.creator],
    [/\b(wife|partner|girlfriend|family|household|children|kids|ex)\b/, A.family],
    [/\b(marry|marriage|wedding|ring|divorce|separate)\b/, A.marriage],
    [/\b(pregnan\w*|baby|due|mating|twins)\b/, A.pregnancy],
    [/\b(bank|score|overdraft|loan|platinum)\b/, A.bank],
    [/\b(credit|borrow|limit|headroom)\b/, A.credit],
    [/\b(debt|owe|arrears|repossess)\b/, A.debt],
    [/\b(propert\w*|mansions?|houses?|assets?|real estate|penthouse)\b/, A.property],
    [/\b(cars?|vehicles?|garage|engines?|bmw|audi|porsche|mercedes)\b/, A.cars],
    [/\b(shop|wardrobe|clothes|bags|ring|jeweller|store)\b/, A.shop],
    [/\b(theme|dark mode|light mode|appearance)\b/, A.theme],
    [/\b(edit mode|free play|cheat|unlimited)\b/, A.edit],
    [/\b(day|date|year|calendar|time)\b/, A.time],
    [/\b(balance|wallet|money|how much do i have|net worth|rich)\b/, A.balance]
  ];

  function answer(question) {
    const q = String(question || "").toLowerCase().trim();
    if (!q) return A.help();
    for (let i = 0; i < RULES.length; i++) {
      if (RULES[i][0].test(q)) {
        try { return RULES[i][1](); }
        catch (err) { return "I hit an error reading that — try opening the page it belongs to first."; }
      }
    }
    return "I only read this game, so I will not guess. Ask me about the markets, your portfolio, "
      + "property, cars, the restaurant, the channel, the bank, your family, or how a feature works.";
  }

  window.nuLimitsSagittarius = { answer, A, market, holdings };
})();
