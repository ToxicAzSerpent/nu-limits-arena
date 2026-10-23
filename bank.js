/* ==========================================================
   NU LIMITS — BANK CORPORATION  (round 12)

   A real lending institution:
     · personal loans with monthly instalments and interest
     · a Platinum credit facility tied to the Home card
     · an overdraft that lets the balance go negative
     · missed payments, default notices and repossession

   Save: nuLimitsBank_v1
   Reads: nuLimitsMoneySave_v1 · nuLimitsCards_v1
          nuLimitsAssets_v1 · nuLimitsShop_v1
          nuLimitsInvestments_v1 · nuLimitsCreator_v1
          nuLimitsRestaurant_v1
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsBank_v1";
  const CYCLE = 30;                 /* one statement cycle = 30 game days */
  const ADMIN_FEE = 69;             /* monthly loan administration fee */
  const ACCOUNT_FEE = 25;           /* monthly cheque-account fee */
  const OD_RATE = 0.205;            /* overdraft interest, per year */
  const MIN_LOAN = 5000;
  const TERMS = [6, 12, 24, 36];

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  const rand = n => Math.round(Math.abs(Number(n) || 0)).toLocaleString("en-ZA");
  const money = n => (Number(n) < 0 ? "−R " : "R ") + rand(n);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const day = () => (window.nuLimitsWorld ? window.nuLimitsWorld.day : 1);
  const free = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const api = () => window.nuLimitsMoney;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
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

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  function defaultCard() {
    return {
      status: "off", limit: 0, outstanding: 0, apr: 21.7,
      openedDay: 0, nextDue: 0, missed: 0, interest: 0,
      lastStatement: 0, lastStatementDay: 0
    };
  }

  function defaults() {
    return {
      version: 1,
      score: 642,
      overdraft: 30000,
      account: "1054 8872 331",
      branch: "Sandton City · 198",
      loans: [],
      card: defaultCard(),
      history: [],
      notices: [],
      stats: { borrowed: 0, repaid: 0, missed: 0, repossessed: 0, writtenOff: 0 },
      nextFeeDay: CYCLE,
      banUntil: 0,
      odStrikes: 0,
      lastDay: 0
    };
  }

  function normalizeLoan(l) {
    const base = {
      id: "ln_" + Math.random().toString(36).slice(2, 8),
      principal: 0, initiation: 0, financed: 0, rate: 0.214,
      months: 24, instalment: 0, outstanding: 0, openedDay: 1,
      nextDue: CYCLE + 1, missed: 0, paid: 0, status: "active"
    };
    const out = Object.assign(base, l || {});
    out.principal = Math.max(0, Math.round(Number(out.principal) || 0));
    out.outstanding = Math.max(0, Math.round(Number(out.outstanding) || 0));
    out.months = TERMS.includes(Number(out.months)) ? Number(out.months) : 24;
    out.instalment = Math.max(0, Math.round(Number(out.instalment) || 0));
    out.nextDue = Math.max(1, Math.round(Number(out.nextDue) || CYCLE));
    if (!["active", "settled", "defaulted", "written off"].includes(out.status)) out.status = "active";
    return out;
  }

  function load() {
    const saved = readJSON(KEY, null) || {};
    const base = defaults();
    const s = Object.assign(base, saved);

    s.score = clamp(Math.round(Number(s.score) || 642), 300, 850);
    const odRaw = Number(s.overdraft);
    s.overdraft = clamp(Math.round(Number.isFinite(odRaw) ? odRaw : 30000), 0, 2000000);
    s.loans = Array.isArray(saved.loans) ? saved.loans.map(normalizeLoan) : [];
    s.card = Object.assign(defaultCard(), saved.card && typeof saved.card === "object" ? saved.card : {});
    s.card.limit = Math.max(0, Math.round(Number(s.card.limit) || 0));
    s.card.outstanding = Math.max(0, Math.round(Number(s.card.outstanding) || 0));
    s.card.apr = clamp(Number(s.card.apr) || 21.7, 5, 40);
    if (!["off", "active", "frozen", "closed"].includes(s.card.status)) s.card.status = "off";
    s.history = Array.isArray(s.history) ? s.history.slice(0, 120) : [];
    s.notices = Array.isArray(s.notices) ? s.notices.slice(0, 40) : [];
    s.stats = Object.assign(base.stats, saved.stats || {});
    s.nextFeeDay = Math.max(1, Math.round(Number(s.nextFeeDay) || CYCLE));
    s.banUntil = Math.max(0, Math.round(Number(s.banUntil) || 0));
    s.odStrikes = Math.max(0, Math.round(Number(s.odStrikes) || 0));
    return s;
  }

  let state = load();
  let tab = "overview";
  let termDraft = 24;

  const persist = () => writeJSON(KEY, state);

  function log(kind, label, amount) {
    state.history.unshift({
      day: day(), kind, label,
      amount: Math.round(Number(amount) || 0)
    });
    state.history = state.history.slice(0, 120);
  }

  function notice(kind, title, body) {
    state.notices.unshift({ day: day(), kind, title, body });
    state.notices = state.notices.slice(0, 40);
  }

  /* ---------------------------------------------------------
     Credit model
     --------------------------------------------------------- */
  function band(score) {
    if (score >= 750) return { label: "Excellent", tone: "good" };
    if (score >= 700) return { label: "Good", tone: "good" };
    if (score >= 650) return { label: "Fair", tone: "warn" };
    if (score >= 600) return { label: "Weak", tone: "warn" };
    return { label: "Poor", tone: "bad" };
  }

  function maxLoan() {
    const s = state.score;
    if (s < 520) return 10000;
    if (s < 600) return 25000;
    if (s < 650) return 60000;
    if (s < 700) return 150000;
    if (s < 750) return 300000;
    return 600000;
  }

  function maxCard() {
    const s = state.score;
    if (s < 520) return 5000;
    if (s < 600) return 10000;
    if (s < 650) return 25000;
    if (s < 700) return 50000;
    if (s < 750) return 100000;
    return 200000;
  }

  const loanRate = () => clamp(0.135 + (800 - state.score) * 0.0005, 0.135, 0.295);
  const cardApr = () => clamp(0.205 + (700 - state.score) * 0.0002, 0.175, 0.26);
  const pct = n => (n * 100).toFixed(2).replace(/\.00$/, "") + "%";

  function initiation(principal) {
    return Math.min(1207.5, 165 + principal * 0.10);
  }

  function quote(principal, months) {
    const p = Math.max(0, Math.round(Number(principal) || 0));
    const n = TERMS.includes(Number(months)) ? Number(months) : 24;
    const fee = Math.round(initiation(p));
    const financed = p + fee;
    const rate = loanRate();
    const r = rate / 12;
    const inst = financed > 0 ? financed * r / (1 - Math.pow(1 + r, -n)) : 0;
    return {
      principal: p, months: n, fee, financed,
      rate, instalment: Math.round(inst),
      total: Math.round(inst * n),
      interest: Math.round(inst * n - financed)
    };
  }

  const activeLoan = () => state.loans.find(l => l.status === "active") || null;
  const cardOpen = () => state.card.status === "active" || state.card.status === "frozen";
  const cardActive = () => state.card.status === "active";
  const cardAvailable = () => Math.max(0, state.card.limit - state.card.outstanding);

  function overdraftUsed() {
    const bal = api() ? api().getBalance() : 0;
    return bal < 0 ? Math.abs(bal) : 0;
  }

  function totalDebt() {
    const loans = state.loans.filter(l => l.status === "active")
      .reduce((t, l) => t + l.outstanding, 0);
    const card = cardOpen() ? state.card.outstanding : 0;
    return loans + card + Math.max(0, overdraftUsed());
  }

  function scoreShift(delta) {
    state.score = clamp(Math.round(state.score + delta), 300, 850);
  }

  /* ---------------------------------------------------------
     Loans
     --------------------------------------------------------- */
  function applyLoan(principal, months) {
    if (activeLoan()) {
      toast("You already have a personal loan running.", true);
      return false;
    }
    if (state.banUntil && day() < state.banUntil) {
      toast("The bank has you on a credit bureau listing — no new lending yet.", true);
      return false;
    }

    const p = Math.round(Number(principal) || 0);
    if (!Number.isFinite(p) || p < MIN_LOAN) {
      toast(`The smallest personal loan is ${money(MIN_LOAN)}.`, true);
      return false;
    }
    if (p > maxLoan()) {
      toast(`Affordability caps this application at ${money(maxLoan())}.`, true);
      return false;
    }

    const q = quote(p, months);
    const first = day() + CYCLE;

    state.loans.unshift({
      id: "ln_" + Date.now().toString(36),
      principal: p,
      initiation: q.fee,
      financed: q.financed,
      rate: q.rate,
      months: q.months,
      instalment: q.instalment,
      outstanding: q.financed,
      openedDay: day(),
      nextDue: first,
      missed: 0,
      paid: 0,
      status: "active"
    });

    state.stats.borrowed += p;
    scoreShift(-6);                     /* a hard enquiry dings the score */
    log("loan", `Personal loan granted · ${money(p)} over ${q.months} months`, p);
    notice("info", "Personal loan approved",
      `${money(p)} was paid into your cheque account. First instalment of ${money(q.instalment)} + ${money(ADMIN_FEE)} admin debit on day ${first}.`);

    if (api()) api().transact("income", p, "Bank Corporation · personal loan");
    persist();
    render();
    paintHome();
    toast(`${money(p)} paid into your account.`);
    return true;
  }

  function reduceLoan(loan, amount) {
    loan.outstanding = Math.max(0, Math.round(loan.outstanding - amount));
    if (loan.outstanding <= 0) {
      loan.status = "settled";
      scoreShift(15);
      notice("good", "Loan settled", `Your ${money(loan.principal)} loan is fully repaid. The facility is closed.`);
      log("settled", `Loan settled · ${money(loan.principal)}`, loan.principal);
    }
  }

  function payInstalment(id) {
    const loan = state.loans.find(l => l.id === id && l.status === "active");
    if (!loan) return;

    const due = loan.instalment + ADMIN_FEE;
    if (!api() || !api().transact("expense", due, "Loan instalment · Bank Corporation")) {
      toast(`Instalment is ${money(due)} — the account is short.`, true);
      return;
    }

    const interest = loan.outstanding * (loan.rate / 12);
    const principalPart = Math.max(0, loan.instalment - interest);
    loan.paid += 1;
    loan.missed = 0;
    loan.nextDue = Math.max(loan.nextDue, day() + CYCLE);
    state.stats.repaid += due;
    scoreShift(4);
    log("repay", `Instalment paid · ${money(loan.instalment)} + ${money(ADMIN_FEE)} admin`, due);
    reduceLoan(loan, principalPart || loan.instalment);

    persist();
    render();
    paintHome();
    toast(`Instalment paid · ${money(due)}`);
  }

  function settleLoan(id) {
    const loan = state.loans.find(l => l.id === id && l.status === "active");
    if (!loan) return;

    const payoff = loan.outstanding;
    if (!api() || !api().transact("expense", payoff, "Loan settlement · Bank Corporation")) {
      toast(`Early settlement needs ${money(payoff)} in the account.`, true);
      return;
    }

    state.stats.repaid += payoff;
    log("repay", `Early settlement · ${money(payoff)}`, payoff);
    reduceLoan(loan, payoff);
    persist();
    render();
    paintHome();
    toast(`Loan settled · ${money(payoff)}`);
  }

  /* ---------------------------------------------------------
     Platinum credit facility
     --------------------------------------------------------- */
  function activateCard(limit) {
    if (state.card.status === "active" || state.card.status === "frozen") {
      toast("You already have a Platinum facility.", true);
      return false;
    }
    if (state.banUntil && day() < state.banUntil) {
      toast("No new credit while you are listed at the bureau.", true);
      return false;
    }

    const want = Math.round(Number(limit) || 0);
    if (want < 1000) {
      toast("The smallest Platinum limit is R 1 000.", true);
      return false;
    }
    if (want > maxCard()) {
      toast(`The bank can approve up to ${money(maxCard())} on your profile.`, true);
      return false;
    }

    state.card = Object.assign(defaultCard(), {
      status: "active",
      limit: want,
      outstanding: 0,
      apr: cardApr() * 100,
      openedDay: day(),
      nextDue: day() + CYCLE
    });

    scoreShift(-4);                     /* credit application enquiry */
    log("card", `Platinum facility opened · ${money(want)} limit`, want);
    notice("info", "Platinum card activated",
      `Your limit is ${money(want)} at ${cardApr() * 100 > 0 ? pct(state.card.apr / 100) : ""} per year. Purchases now go on the card when it is selected at checkout.`);

    persist();
    render();
    paintHome();

    if (window.nuLimitsCards && window.nuLimitsCards.set) window.nuLimitsCards.set("credit");
    toast(`Platinum limit ${money(want)} activated — it is now your payment card.`);
    return true;
  }

  function cardCharge(amount, description, label) {
    const amt = Math.round(Number(amount) || 0);
    if (!(amt > 0)) return false;
    if (!cardActive()) return false;

    if (amt > cardAvailable()) {
      toast(`Platinum limit exceeded — ${money(cardAvailable())} available.`, true);
      return false;
    }

    if (free()) {
      if (api()) api().note("expense", amt, `${description} · ${label || "Platinum •7734"} (free play)`);
      return true;
    }

    state.card.outstanding += amt;
    if (api()) api().note("expense", amt, `${description} · ${label || "Platinum •7734"} (card)`);
    persist();
    paintHome();
    return true;
  }

  function payCard(amount, why) {
    const amt = Math.round(Number(amount) || 0);
    if (!(amt > 0)) return false;
    if (!cardOpen()) return false;

    const pay = Math.min(amt, state.card.outstanding);
    if (pay <= 0) {
      toast("Nothing outstanding on the Platinum card.");
      return false;
    }
    if (!api() || !api().transact("expense", pay, why || "Platinum card payment")) {
      toast(`That payment needs ${money(pay)} in the account.`, true);
      return false;
    }

    state.card.outstanding = Math.max(0, state.card.outstanding - pay);
    if (state.card.outstanding === 0) state.card.missed = 0;
    state.stats.repaid += pay;
    scoreShift(3);
    log("repay", `Platinum payment · ${money(pay)}`, pay);
    persist();
    render();
    paintHome();
    toast(`Paid ${money(pay)} onto the Platinum card.`);
    return true;
  }

  function freezeCard() {
    if (!cardOpen()) return;
    state.card.status = state.card.status === "frozen" ? "active" : "frozen";
    if (state.card.status === "frozen" && window.nuLimitsCards && window.nuLimitsCards.set) {
      window.nuLimitsCards.set("debit");
    }
    log("card", state.card.status === "frozen" ? "Card frozen by you" : "Card unfrozen", 0);
    persist();
    render();
    paintHome();
    toast(state.card.status === "frozen" ? "Card frozen — no new purchases." : "Card unfrozen.");
  }

  /* ---------------------------------------------------------
     Monthly cycle — instalments, statements, interest
     --------------------------------------------------------- */
  function loanCycle(loan, atDay) {
    loan.nextDue = atDay + CYCLE;

    const interest = loan.outstanding * (loan.rate / 12);
    const principalPart = Math.max(0, loan.instalment - interest);
    const debit = loan.instalment + ADMIN_FEE;

    if (free()) {
      loan.paid += 1;
      loan.missed = 0;
      reduceLoan(loan, principalPart || loan.instalment);
      return;
    }

    const ok = api() && api().charge(debit, `Loan instalment · day ${atDay}`);

    if (ok) {
      loan.paid += 1;
      loan.missed = 0;
      state.stats.repaid += debit;
      scoreShift(4);
      log("repay", `Instalment ${loan.paid}/${loan.months} · ${money(debit)}`, debit);
      reduceLoan(loan, principalPart || loan.instalment);
      return;
    }

    loan.missed += 1;
    state.stats.missed += 1;
    scoreShift(-35);
    log("missed", `Instalment ${loan.paid + 1} returned unpaid · ${money(debit)}`, debit);
    notice("bad", "Debit order returned",
      `The instalment of ${money(debit)} could not be collected on day ${atDay}. ${loan.missed === 1 ? "One more missed payment and the loan is in default." : "The account is now in default."}`);

    if (loan.missed >= 2) defaultAccount(`Loan ${money(loan.principal)} in default`);
  }

  function cardCycle(atDay) {
    const card = state.card;
    card.nextDue = atDay + CYCLE;

    if (!cardOpen() || card.outstanding <= 0) return;

    const interest = Math.round(card.outstanding * (card.apr / 100) / 12);
    card.outstanding += interest;
    card.interest += interest;
    card.lastStatement = interest;

    if (interest > 0) {
      log("interest", `Card interest at ${card.apr.toFixed(2)}% p.a. · ${money(interest)}`, interest);
    }

    if (free()) return;

    const min = Math.min(card.outstanding, Math.max(250, Math.round(card.outstanding * 0.05)));
    card.minDue = min;

    const ok = api() && api().charge(min, `Platinum minimum payment · day ${atDay}`);

    if (ok) {
      card.outstanding = Math.max(0, card.outstanding - min);
      card.missed = 0;
      state.stats.repaid += min;
      scoreShift(3);
      log("repay", `Minimum payment · ${money(min)}`, min);
      if (card.outstanding === 0) card.missed = 0;
      return;
    }

    card.missed += 1;
    state.stats.missed += 1;
    scoreShift(-40);
    log("missed", `Platinum minimum unpaid · ${money(min)}`, min);
    notice("bad", "Platinum payment missed",
      `The minimum of ${money(min)} could not be collected on day ${atDay}. ${card.missed === 1 ? "Another miss will close the facility." : "The facility is in default."}`);

    if (card.missed >= 2) defaultAccount("Platinum card in default");
  }

  function feeCycle(atDay) {
    state.nextFeeDay = atDay + CYCLE;

    if (free()) return;

    const bal = api() ? api().getBalance() : 0;

    if (bal < 0) {
      state.odStrikes = (state.odStrikes || 0) + 1;
    } else {
      state.odStrikes = 0;
    }

    if (state.odStrikes >= 3) {
      notice("bad", "Overdraft recalled",
        `The account has been overdrawn for ${state.odStrikes} statement cycles. The bank has demanded repayment in full.`);
      defaultAccount("Overdraft recalled after 3 unpaid cycles");
      return;
    }

    if (bal < 0) {
      const interest = Math.round(Math.abs(bal) * OD_RATE / 12);
      if (interest > 0 && api()) {
        api().charge(interest, "Overdraft interest · Bank Corporation");
        log("interest", `Overdraft interest · ${money(interest)}`, interest);
      }
    } else if (bal > 0 && api()) {
      api().charge(ACCOUNT_FEE, "Monthly account fee");
      log("fee", `Monthly account fee · ${money(ACCOUNT_FEE)}`, ACCOUNT_FEE);
    }
  }

  /* ---------------------------------------------------------
     Default & repossession
     --------------------------------------------------------- */
  function defaultAccount(reason) {
    const debt = totalDebt();
    const seized = liquidate(debt);

    applyProceeds(seized.recovered);

    const left = Math.max(0, debt - seized.recovered);

    state.loans.forEach(l => {
      if (l.status === "active") {
        l.status = left > 0 ? "written off" : "settled";
        l.outstanding = 0;
      }
    });

    if (cardOpen()) {
      state.card.outstanding = 0;
      state.card.status = "closed";
    }

    if (left > 0) {
      const balNow = api() ? api().getBalance() : 0;
      if (balNow < 0) api().transact("income", -balNow, "Bad debt written off · overdraft cleared");
      state.stats.writtenOff += left;
      scoreShift(-400);
      state.banUntil = day() + 180;
      notice("bad", "Judgement granted",
        `${reason}. Assets were sold at auction and ${money(left)} remains unpaid. The shortfall is written off as bad debt and reported to the credit bureau for 180 days.`);
    } else {
      scoreShift(-160);
      state.banUntil = day() + 60;
      notice("bad", "Account in default",
        `${reason}. The bank has taken possession of your assets and closed every facility.`);
    }

    state.stats.repossessed += 1;
    state.card.missed = 0;

    if (window.nuLimitsCards && window.nuLimitsCards.set) window.nuLimitsCards.set("debit");

    persist();

    try {
      sessionStorage.setItem("nuLimitsBankFlash", JSON.stringify({
        taken: seized.items,
        left
      }));
    } catch (err) { /* ignore */ }

    window.setTimeout(() => { window.location.reload(); }, 80);
  }

  /* ---------- liquidation ---------- */

  function liquidate(debt) {
    const items = [];
    let recovered = 0;

    const want = () => recovered < debt;

    function seize(name, kind, value, apply) {
      if (!want()) return;
      const v = Math.max(0, Math.round(value));
      if (v <= 0) return;
      apply();
      items.push({ name, kind, value: v });
      recovered += v;
    }

    /* 1 · investments — most liquid, sold first */
    const inv = readJSON("nuLimitsInvestments_v1", null);
    if (inv && inv.holdings && typeof inv.holdings === "object") {
      let touched = false;
      Object.keys(inv.holdings).forEach(sym => {
        if (!want()) return;
        const h = inv.holdings[sym] || {};
        const qty = Number(h.quantity) || 0;
        const avg = Number(h.average) || 0;
        if (qty <= 0 || avg <= 0) { delete inv.holdings[sym]; touched = true; return; }
        seize(`Portfolio · ${+qty.toFixed(3)} ${sym}`, "investment", qty * avg, () => {
          delete inv.holdings[sym];
          touched = true;
        });
      });
      if (touched) writeJSON("nuLimitsInvestments_v1", inv);
    }

    /* 2 · luxury purchases */
    const shop = readJSON("nuLimitsShop_v1", null);
    if (shop && Array.isArray(shop.stores)) {
      let touched = false;
      shop.stores.forEach(store => {
        (Array.isArray(store.products) ? store.products : []).forEach(p => {
          if (!want()) return;
          if (!p || !p.owned) return;
          seize(p.name || "Luxury purchase", "collectible", (Number(p.price) || 0) * 0.45, () => {
            p.owned = false;
            p.purchasedAt = null;
            p.card = null;
            touched = true;
          });
        });
      });
      if (touched) writeJSON("nuLimitsShop_v1", shop);
    }

    /* 3 · vehicles, then property */
    const assets = readJSON("nuLimitsAssets_v1", null);
    if (assets && Array.isArray(assets.items)) {
      const factor = { car: 0.65, bike: 0.68, jet: 0.62, yacht: 0.62, island: 0.68, hangar: 0.70, mansion: 0.70 };
      const order = ["car", "bike", "jet", "yacht", "hangar", "island", "mansion"];
      let touched = false;

      order.forEach(cat => {
        assets.items.forEach(item => {
          if (!want()) return;
          if (!item || item.category !== cat || !item.owned) return;
          seize(item.name || "Asset", cat === "mansion" ? "property" : "vehicle",
            (Number(item.price) || 0) * (factor[cat] || 0.65), () => {
              item.owned = false;
              item.leased = false;
              item.acquiredAt = null;
              item.card = null;
              touched = true;
            });
        });
      });

      if (touched) writeJSON("nuLimitsAssets_v1", assets);
    }

    /* 4 · creator studio equipment */
    const cr = readJSON("nuLimitsCreator_v1", null);
    if (cr && cr.channel && want()) {
      const shopCat = (cr.catalog && cr.catalog.shop) || {};
      const starter = { cpu: "cpu1", mobo: "mb1", ram: "ram1", gpu: "gpu1", ssd: "ssd1", psu: "psu1", cooling: "cool1", case: "case1" };
      let value = 0;

      Object.keys(cr.owned || {}).forEach(slot => {
        (cr.owned[slot] || []).forEach(id => {
          const it = (shopCat[slot] || []).find(x => x && x.id === id);
          if (it) value += Number(it.price) || 0;
        });
      });

      (cr.pcs || []).forEach(pc => {
        Object.keys(pc.parts || {}).forEach(slot => {
          const id = pc.parts[slot];
          if (!id || id === starter[slot]) return;
          const it = (shopCat[slot] || []).find(x => x && x.id === id);
          if (it) value += Number(it.price) || 0;
        });
      });

      if (value > 0) {
        seize("Creator studio equipment", "equipment", value * 0.35, () => {
          cr.owned = {};
          cr.gear = { monitor: "mon1", mic: "mic1", camera: "cam0", light: "lit1", capture: null };
          cr.pcs = [{
            id: "pc_starter", name: "First build", condition: 100,
            parts: Object.assign({}, starter)
          }];
          cr.activePc = 0;
          writeJSON("nuLimitsCreator_v1", cr);
        });
      }
    }

    /* 5 · the restaurant — the business goes last */
    const rs = readJSON("nuLimitsRestaurant_v1", null);
    if (rs && rs.owned && want()) {
      const price = Number(rs.purchasePrice) || 75000;
      const till = Math.max(0, Math.round(Number(rs.cash) || 0));
      seize("Restaurant · business and equipment", "business", price * 0.75 + till, () => {
        rs.owned = false;
        rs.cash = 0;
        rs.staff = [];
        rs.upgrades = {};
        rs.reviews = [];
        writeJSON("nuLimitsRestaurant_v1", rs);
      });
    }

    return { items, recovered };
  }

  function applyProceeds(recovered) {
    let left = Math.max(0, Math.round(recovered));
    if (!left) return;

    if (cardOpen() && state.card.outstanding > 0) {
      const pay = Math.min(left, state.card.outstanding);
      state.card.outstanding -= pay;
      left -= pay;
    }

    state.loans.forEach(l => {
      if (left <= 0 || l.status !== "active") return;
      const pay = Math.min(left, l.outstanding);
      l.outstanding -= pay;
      left -= pay;
      if (l.outstanding <= 0) l.status = "settled";
    });

    const bal = api() ? api().getBalance() : 0;
    if (bal < 0 && left > 0) {
      const use = Math.min(left, -bal);
      if (api()) api().transact("income", use, "Repossession proceeds · overdraft cleared");
      left -= use;
    }

    if (left > 0 && api()) {
      api().transact("income", left, "Bank Corporation · auction surplus");
    }
  }

  /* ---------------------------------------------------------
     Day tick
     --------------------------------------------------------- */
  let bootDay = null;

  function runDay(atDay) {
    state.loans.forEach(l => {
      if (l.status !== "active") return;
      if (atDay >= l.nextDue) loanCycle(l, atDay);
    });

    if (cardOpen() && state.card.nextDue && atDay >= state.card.nextDue) {
      cardCycle(atDay);
    }

    if (atDay >= state.nextFeeDay) feeCycle(atDay);
  }

  function tick() {
    const d = day();
    if (bootDay === null) { bootDay = d; return; }
    if (d === bootDay) return;

    const from = bootDay;
    bootDay = d;

    for (let x = from + 1; x <= d && x - from <= 120; x++) runDay(x);

    state.lastDay = d;
    persist();
    if (isOnPage()) render();
    paintHome();
  }

  /* ---------------------------------------------------------
     Home strip + Platinum face
     --------------------------------------------------------- */
  function paintCardFace() {
    const used = document.getElementById("nl-credit-used");
    if (!used) return;

    let sub = document.getElementById("nl-credit-sub");
    document.querySelectorAll(".nl-card-balance #nl-credit-sub").forEach((el, i) => {
      if (i > 0) el.remove();
    });
    if (!sub) {
      sub = document.createElement("em");
      sub.id = "nl-credit-sub";
      sub.className = "nl-credit-sub";
      used.parentNode.appendChild(sub);
    }

    if (cardOpen()) {
      used.textContent = money(state.card.outstanding);
      const avail = cardAvailable();
      sub.textContent = `of ${money(state.card.limit)} · ${money(avail)} available`;
      sub.classList.toggle("is-low", avail < state.card.limit * 0.15);
    } else {
      used.textContent = money(0);
      sub.textContent = "No credit line · open Bank";
      sub.classList.remove("is-low");
    }
  }

  function paintHome() {
    paintCardFace();

    const strip = document.getElementById("bk-home-line");
    if (!strip) return;

    const bal = api() ? api().getBalance() : 0;
    const bits = [];

    if (state.card.status === "active") {
      bits.push(`Platinum ${money(state.card.outstanding)} of ${money(state.card.limit)}`);
    } else if (state.card.status === "frozen") {
      bits.push("Platinum frozen");
    } else if (state.card.status === "closed") {
      bits.push("Platinum closed");
    }

    const loan = activeLoan();
    if (loan) bits.push(`Loan ${money(loan.outstanding)}`);

    if (bal < 0) bits.push(`Overdrawn ${money(bal)}`);

    if (!bits.length) bits.push("No borrowing");

    bits.push(`Score ${state.score} · ${band(state.score).label}`);

    strip.textContent = bits.join(" · ");
    strip.classList.toggle("is-neg", bal < 0 || state.card.status === "closed");

    const badge = document.getElementById("bk-home-badge");
    if (badge) {
      const due = loan || (cardOpen() && state.card.outstanding > 0);
      badge.textContent = state.card.status === "closed" ? "Default" : (due ? "Active" : "Clear");
      badge.className = "bk-home-badge " + (state.card.status === "closed" ? "is-bad" : (due ? "is-on" : "is-clear"));
    }
  }

  /* ---------------------------------------------------------
     Rendering
     --------------------------------------------------------- */
  const root = () => document.getElementById("dynamic-page");

  function isOnPage() {
    const dp = root();
    return dp && !dp.hidden && !!dp.querySelector(".bk-page");
  }

  function dateFor(dayNum) {
    const base = (window.nuLimitsWorld && window.nuLimitsWorld.date) || new Date();
    const now = day();
    const d = new Date(base.getTime() + (dayNum - now) * 86400000);
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  }

  function scoreMeter() {
    const p = ((state.score - 300) / 550) * 100;
    return `<div class="bk-meter bk-meter-score"><span style="width:${p.toFixed(1)}%"></span>
      <i style="left:${(((600 - 300) / 550) * 100).toFixed(1)}%"></i>
      <i style="left:${(((650 - 300) / 550) * 100).toFixed(1)}%"></i>
      <i style="left:${(((700 - 300) / 550) * 100).toFixed(1)}%"></i>
      <i style="left:${(((750 - 300) / 550) * 100).toFixed(1)}%"></i></div>`;
  }

  function top() {
    const bal = api() ? api().getBalance() : 0;
    const b = band(state.score);
    const loan = activeLoan();
    const card = cardOpen() ? state.card : null;

    return `
    <header class="bk-hero">
      <div class="bk-hero-main">
        <span class="bk-crest" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12 16 4l13 8"/><path d="M5 12v13M11 12v13M16 12v13M21 12v13M27 12v13"/>
            <path d="M3 27h26"/><path d="M3 9h26"/>
          </svg>
        </span>
        <div class="bk-hero-text">
          <p class="eyebrow">BANK CORPORATION</p>
          <h1>Bank Corporation</h1>
          <p class="muted">Personal loans · Platinum credit · overdraft facilities</p>
        </div>
      </div>
      <p class="bk-reg">Reg 1974/003182/07 · FSP 41928 · NCRCP 2211 · an authorised financial services provider</p>
    </header>

    <div class="bk-summary">
      <article class="${bal < 0 ? "is-neg" : ""}">
        <small>CHEQUE ACCOUNT</small>
        <strong>${money(bal)}</strong>
        <em>${bal < 0
          ? `Overdrawn · ${pct(OD_RATE)} p.a.`
          : `${money(state.overdraft)} overdraft`}</em>
      </article>
      <article>
        <small>CREDIT SCORE</small>
        <strong>${state.score}</strong>
        <em>${b.label} · ${state.stats.missed} missed</em>
      </article>
      <article>
        <small>TOTAL OWED</small>
        <strong>${money(totalDebt())}</strong>
        <em>${[loan ? "1 loan" : null, card ? "Platinum" : null].filter(Boolean).join(" · ") || "Nothing outstanding"}</em>
      </article>
    </div>

    <div class="bk-tabs" role="tablist">
      ${[["overview", "Overview"], ["loans", "Loans"], ["card", "Platinum"], ["record", "Record"]]
        .map(([id, label]) => `<button type="button" role="tab" data-bk="tab" data-tab="${id}"
          aria-selected="${tab === id}" class="${tab === id ? "on" : ""}">${label}</button>`).join("")}
    </div>`;
  }

  function overviewTab() {
    const bal = api() ? api().getBalance() : 0;
    const loan = activeLoan();
    const card = cardOpen() ? state.card : null;
    const odUsed = Math.min(state.overdraft, Math.max(0, -bal));
    const odPct = state.overdraft ? (odUsed / state.overdraft) * 100 : 0;

    return `
    <section class="bk-card">
      <div class="bk-card-head">
        <div>
          <p class="eyebrow">CHEQUE ACCOUNT</p>
          <strong class="bk-acc">${esc(state.account)}</strong>
        </div>
        <span class="bk-chip">${bal < 0 ? "OVERDRAWN" : "IN CREDIT"}</span>
      </div>

      <div class="bk-bal-line ${bal < 0 ? "is-neg" : ""}">${money(bal)}</div>

      <div class="bk-od">
        <div class="bk-od-head"><span>Overdraft used</span><b>${money(odUsed)} / ${money(state.overdraft)}</b></div>
        <div class="bk-meter ${odUsed > state.overdraft * 0.8 ? "is-hot" : ""}"><span style="width:${Math.min(100, odPct).toFixed(1)}%"></span></div>
        <p class="bk-fine">Overdraft interest ${pct(OD_RATE)} p.a., charged monthly on the negative balance. A monthly account fee of ${money(ACCOUNT_FEE)} applies while the account is in credit.</p>
      </div>

      ${bal < 0 ? `<div class="bk-alert is-bad">
        <strong>You are ${money(bal)} overdrawn.</strong>
        <span>Instalments and debit orders are taken from this account. Clear the overdraft to stop the interest.</span>
      </div>` : ""}
    </section>

    <section class="bk-card">
      <p class="eyebrow">NEXT PAYMENTS</p>
      <div class="bk-list">
        ${loan ? `<div class="bk-row">
          <span class="bk-ico">1</span>
          <span class="bk-row-main"><b>Personal loan instalment</b>
            <small>${money(loan.instalment)} + ${money(ADMIN_FEE)} admin · ${dateFor(loan.nextDue)}</small></span>
          <strong>${money(loan.instalment + ADMIN_FEE)}</strong>
        </div>` : ""}
        ${card && card.outstanding > 0 ? `<div class="bk-row">
          <span class="bk-ico">2</span>
          <span class="bk-row-main"><b>Platinum minimum payment</b>
            <small>${money(Math.max(250, Math.round(card.outstanding * 0.05)))} (5% of balance) · ${dateFor(card.nextDue)}</small></span>
          <strong>${money(Math.max(250, Math.round(card.outstanding * 0.05)))}</strong>
        </div>` : ""}
        ${!loan && (!card || card.outstanding === 0) ? `<p class="bk-empty">No payments scheduled. Nothing borrowed, nothing due.</p>` : ""}
      </div>
    </section>

    <section class="bk-card">
      <div class="bk-card-head">
        <div><p class="eyebrow">CREDITWORTHINESS</p><strong>${state.score} · ${band(state.score).label}</strong></div>
        <span class="bk-chip ${band(state.score).tone}">${band(state.score).tone === "good" ? "GOOD STANDING" : band(state.score).tone === "warn" ? "WATCH" : "AT RISK"}</span>
      </div>
      ${scoreMeter()}
      <div class="bk-score-scale"><span>300</span><span>600</span><span>650</span><span>700</span><span>850</span></div>
      <p class="bk-fine">Your score decides your rate, your limit and whether the bank lends at all. On-time payments help. Missed debit orders, defaults and judgements hurt.</p>
      <div class="bk-facts">
        <span><b>${money(maxLoan())}</b><small>MAX LOAN</small></span>
        <span><b>${money(maxCard())}</b><small>MAX CARD LIMIT</small></span>
        <span><b>${pct(loanRate())}</b><small>YOUR RATE</small></span>
      </div>
    </section>

    ${state.banUntil > day() ? `<div class="bk-alert is-bad">
      <strong>Credit bureau listing</strong>
      <span>No new lending until day ${state.banUntil} (${dateFor(state.banUntil)}).</span>
    </div>` : ""}

    ${noticesBlock(4)}`;
  }

  function loansTab() {
    const loan = activeLoan();
    const amount = Math.min(Number(state.draftAmount) || 25000, maxLoan());
    const q = quote(amount, termDraft);

    return `
    ${loan ? `
    <section class="bk-card bk-loan">
      <div class="bk-card-head">
        <div><p class="eyebrow">ACTIVE LOAN</p><strong>${money(loan.principal)} · ${loan.months} months</strong></div>
        <span class="bk-chip">${pct(loan.rate)}</span>
      </div>

      <div class="bk-bal-line">${money(loan.outstanding)}<small>outstanding</small></div>

      <div class="bk-meter"><span style="width:${clamp(((loan.financed - loan.outstanding) / loan.financed) * 100, 0, 100).toFixed(1)}%"></span></div>
      <div class="bk-od-head"><span>${loan.paid} of ${loan.months} instalments paid</span><b>${money(loan.instalment)} / month</b></div>

      <div class="bk-grid2">
        <span><small>NEXT DEBIT</small><b>${dateFor(loan.nextDue)}</b></span>
        <span><small>MONTHLY DEBIT</small><b>${money(loan.instalment + ADMIN_FEE)}</b></span>
        <span><small>MISSED PAYMENTS</small><b class="${loan.missed ? "is-bad" : ""}">${loan.missed}</b></span>
        <span><small>SETTLEMENT</small><b>${money(loan.outstanding)}</b></span>
      </div>

      <div class="bk-btnrow">
        <button class="bk-btn" type="button" data-bk="loan-pay">Pay instalment now</button>
        <button class="bk-btn is-ghost" type="button" data-bk="loan-settle">Settle early · ${money(loan.outstanding)}</button>
      </div>

      <p class="bk-fine">Interest is charged monthly at ${pct(loan.rate)} p.a. on the outstanding balance. A ${money(ADMIN_FEE)} admin fee is added to every instalment. Settling early saves the remaining interest.</p>

      ${scheduleBlock(loan)}
    </section>` : `
    <section class="bk-card bk-apply">
      <div class="bk-card-head">
        <div><p class="eyebrow">PERSONAL LOAN</p><strong>Ask for a loan</strong></div>
        <span class="bk-chip">UP TO ${money(maxLoan())}</span>
      </div>

      <label class="bk-label" for="bk-amount">Amount</label>
      <div class="bk-amount">
        <span>R</span>
        <input id="bk-amount" type="number" min="${MIN_LOAN}" step="1000" inputmode="numeric"
               value="${Math.min(amount, maxLoan())}" aria-label="Loan amount">
      </div>
      <div class="bk-pills">
        ${[10000, 25000, 50000, 100000].filter(v => v <= maxLoan()).map(v =>
          `<button type="button" data-bk="amount" data-v="${v}" class="${Number(amount) === v ? "on" : ""}">${money(v)}</button>`).join("")}
        <button type="button" data-bk="amount" data-v="${maxLoan()}" class="${Number(amount) === maxLoan() ? "on" : ""}">Max</button>
      </div>

      <label class="bk-label">Term</label>
      <div class="bk-pills" id="bk-terms">
        ${TERMS.map(t => `<button type="button" data-bk="term" data-v="${t}" class="${termDraft === t ? "on" : ""}">${t} months</button>`).join("")}
      </div>

      <div class="bk-quote" id="bk-quote">${quoteBlock(q)}</div>

      <button class="bk-btn is-wide" type="button" data-bk="loan-apply">Apply · ${money(amount)}</button>
      <p class="bk-fine">Subject to affordability and a credit check. Initiation fee ${money(1207.5)} (capped by the NCA) is added to the loan. ${money(ADMIN_FEE)} monthly admin fee. Interest ${pct(loanRate())} p.a. Fixed instalment, fixed term.</p>
    </section>`}

    ${state.loans.filter(l => l.status !== "active").length ? `
    <section class="bk-card">
      <p class="eyebrow">PREVIOUS LOANS</p>
      <div class="bk-list">
        ${state.loans.filter(l => l.status !== "active").slice(0, 6).map(l => `
          <div class="bk-row">
            <span class="bk-ico">${l.status === "settled" ? "✓" : "!"}</span>
            <span class="bk-row-main"><b>${money(l.principal)} · ${l.months} months</b>
              <small>${esc(l.status.toUpperCase())} · opened day ${l.openedDay}</small></span>
            <strong>${l.status === "settled" ? "Cleared" : money(l.outstanding)}</strong>
          </div>`).join("")}
      </div>
    </section>` : ""}`;
  }

  function quoteBlock(q) {
    return `
      <div class="bk-quote-head">
        <span><small>MONTHLY INSTALMENT</small><b>${money(q.instalment)}</b></span>
        <span><small>+ ADMIN</small><b>${money(ADMIN_FEE)}</b></span>
      </div>
      <div class="bk-quote-grid">
        <span><small>INTEREST RATE</small><b>${pct(q.rate)} p.a.</b></span>
        <span><small>INITIATION FEE</small><b>${money(q.fee)}</b></span>
        <span><small>FINANCED</small><b>${money(q.financed)}</b></span>
        <span><small>TOTAL REPAYABLE</small><b>${money(q.total)}</b></span>
      </div>
      <p class="bk-fine">Cost of credit ${money(q.interest)} over ${q.months} months. Total monthly debit ${money(q.instalment + ADMIN_FEE)}.</p>`;
  }

  function scheduleBlock(loan) {
    let bal = loan.outstanding;
    const r = loan.rate / 12;
    const rows = [];
    for (let i = 1; i <= 6 && bal > 0; i++) {
      const interest = bal * r;
      const principal = Math.max(0, loan.instalment - interest);
      const next = Math.max(0, bal - principal);
      rows.push({ i: loan.paid + i, interest, principal, bal: next, when: dateFor(loan.nextDue + (i - 1) * CYCLE) });
      bal = next;
    }
    if (!rows.length) return "";
    return `<div class="bk-schedule">
      <p class="eyebrow">NEXT PAYMENTS</p>
      <table>
        <thead><tr><th>#</th><th>Date</th><th>Interest</th><th>Principal</th><th>Balance</th></tr></thead>
        <tbody>${rows.map(r2 => `<tr>
          <td>${r2.i}</td><td>${r2.when}</td>
          <td>${money(r2.interest)}</td><td>${money(r2.principal)}</td><td>${money(r2.bal)}</td>
        </tr>`).join("")}</tbody>
      </table>
    </div>`;
  }

  function cardTab() {
    const card = state.card;
    const open = cardOpen();
    const avail = cardAvailable();
    const usedPct = card.limit ? (card.outstanding / card.limit) * 100 : 0;
    const minDue = Math.max(250, Math.round(card.outstanding * 0.05));

    if (!open) {
      return `
      <section class="bk-card bk-platinum">
        <div class="bk-plat-face">
          <span class="bk-plat-brand">NU<b>LIMITS</b></span>
          <span class="bk-plat-kind">PLATINUM</span>
          <span class="bk-plat-num">•••• 7734</span>
          <span class="bk-plat-name">OBEY S.</span>
        </div>

        <div class="bk-card-head">
          <div><p class="eyebrow">CREDIT FACILITY</p><strong>Activate your Platinum line</strong></div>
          <span class="bk-chip">APR ${pct(cardApr())}</span>
        </div>

        <p class="bk-copy">Once activated, choosing the Platinum card at the top of Home puts purchases on your credit line instead of your cash. Available limit shows on the card itself.</p>

        <label class="bk-label" for="bk-limit">Requested limit</label>
        <div class="bk-amount"><span>R</span>
          <input id="bk-limit" type="number" min="1000" step="1000" inputmode="numeric"
                 value="${Math.min(25000, maxCard())}" aria-label="Credit limit">
        </div>
        <div class="bk-pills">
          ${[5000, 10000, 25000, 50000, 100000].filter(v => v <= maxCard()).map(v =>
            `<button type="button" data-bk="limit" data-v="${v}">${money(v)}</button>`).join("")}
        </div>

        <div class="bk-grid2">
          <span><small>MAX APPROVED</small><b>${money(maxCard())}</b></span>
          <span><small>INTEREST</small><b>${pct(cardApr())} p.a.</b></span>
          <span><small>MINIMUM PAYMENT</small><b>5% or R 250</b></span>
          <span><small>STATEMENT CYCLE</small><b>Every 30 days</b></span>
        </div>

        <button class="bk-btn is-wide" type="button" data-bk="card-activate">Open credit facility</button>
        <p class="bk-fine">A credit check is done when you apply. Interest is charged monthly on the balance. Missing two minimum payments closes the facility and starts recovery proceedings.</p>
      </section>`;
    }

    return `
    <section class="bk-card bk-platinum">
      <div class="bk-plat-face ${card.status === "frozen" ? "is-frozen" : ""}">
        <span class="bk-plat-brand">NU<b>LIMITS</b></span>
        <span class="bk-plat-kind">${card.status === "frozen" ? "FROZEN" : "PLATINUM"}</span>
        <span class="bk-plat-num">•••• 7734</span>
        <span class="bk-plat-name">OBEY S.</span>
      </div>

      <div class="bk-card-head">
        <div><p class="eyebrow">CREDIT FACILITY</p><strong>Platinum · •••• 7734</strong></div>
        <span class="bk-chip ${card.status === "frozen" ? "warn" : "good"}">${card.status === "frozen" ? "FROZEN" : "ACTIVE"}</span>
      </div>

      <div class="bk-bal-line">${money(card.outstanding)}<small>outstanding</small></div>
      <div class="bk-meter ${usedPct > 85 ? "is-hot" : ""}"><span style="width:${clamp(usedPct, 0, 100).toFixed(1)}%"></span></div>
      <div class="bk-od-head"><span>${money(avail)} available</span><b>limit ${money(card.limit)}</b></div>

      <div class="bk-grid2">
        <span><small>INTEREST</small><b>${pct(card.apr / 100)} p.a.</b></span>
        <span><small>MINIMUM DUE</small><b>${money(minDue)}</b></span>
        <span><small>NEXT STATEMENT</small><b>${dateFor(card.nextDue)}</b></span>
        <span><small>MISSED PAYMENTS</small><b class="${card.missed ? "is-bad" : ""}">${card.missed}</b></span>
      </div>

      <div class="bk-btnrow">
        <button class="bk-btn" type="button" data-bk="card-min">Pay minimum · ${money(minDue)}</button>
        <button class="bk-btn is-ghost" type="button" data-bk="card-full">Pay full · ${money(card.outstanding)}</button>
      </div>

      <div class="bk-inline">
        <input id="bk-card-pay" type="number" min="1" step="100" inputmode="numeric" placeholder="Other amount">
        <button class="bk-btn is-small" type="button" data-bk="card-pay">Pay amount</button>
        <button class="bk-btn is-small is-ghost" type="button" data-bk="card-freeze">${card.status === "frozen" ? "Unfreeze" : "Freeze card"}</button>
      </div>

      <button class="bk-btn is-wide ${card.status === "frozen" ? "is-ghost" : ""}" type="button" data-bk="use-card"
        ${card.status === "frozen" ? "disabled" : ""}>
        ${window.nuLimitsCards && window.nuLimitsCards.selected === "credit" ? "Platinum is your payment card" : "Use Platinum at checkout"}
      </button>

      <p class="bk-fine">Select Platinum at the top of Home and every purchase goes on the card — no cash leaves your account. Interest is charged monthly at ${pct(card.apr / 100)} p.a. on the outstanding balance.</p>
    </section>

    <section class="bk-card">
      <p class="eyebrow">CARD ACTIVITY</p>
      <div class="bk-list">
        ${state.history.filter(h => h.kind === "card" || h.kind === "interest" || (h.kind === "repay" && /Platinum/.test(h.label)) || (h.kind === "missed" && /Platinum/.test(h.label))).slice(0, 6).map(h => `
          <div class="bk-row">
            <span class="bk-ico">${h.kind === "missed" ? "!" : h.kind === "interest" ? "%" : "•"}</span>
            <span class="bk-row-main"><b>${esc(h.label)}</b><small>Day ${h.day}</small></span>
            <strong>${money(h.amount)}</strong>
          </div>`).join("") || `<p class="bk-empty">No card activity yet.</p>`}
      </div>
    </section>`;
  }

  function recordTab() {
    return `
    <section class="bk-card">
      <div class="bk-card-head">
        <div><p class="eyebrow">STATEMENT OF ACCOUNT</p><strong>Bank activity</strong></div>
        <span class="bk-chip">DAY ${day()}</span>
      </div>
      <div class="bk-list">
        ${state.history.slice(0, 24).map(h => `
          <div class="bk-row">
            <span class="bk-ico ${h.kind === "missed" ? "is-bad" : h.kind === "repay" ? "is-good" : ""}">${
              h.kind === "missed" ? "!" : h.kind === "repay" ? "✓" : h.kind === "interest" ? "%" : "•"}</span>
            <span class="bk-row-main"><b>${esc(h.label)}</b><small>Day ${h.day} · ${esc(h.kind)}</small></span>
            <strong>${money(h.amount)}</strong>
          </div>`).join("") || `<p class="bk-empty">No activity yet. Your loan, card and overdraft entries will appear here.</p>`}
      </div>
    </section>

    ${noticesBlock(20)}

    <section class="bk-card bk-fine-card">
      <p class="eyebrow">THE FINE PRINT</p>
      <ul class="bk-terms">
        <li>Credit provider: Bank Corporation Ltd, registered credit provider NCRCP 2211.</li>
        <li>Interest is charged monthly in arrears on the outstanding balance.</li>
        <li>Initiation fee ${money(1207.5)} once-off, ${money(ADMIN_FEE)} monthly administration fee.</li>
        <li>Overdraft interest ${pct(OD_RATE)} p.a. on any negative balance.</li>
        <li>Two missed instalments put the account in default. The bank may then sell assets to recover the debt.</li>
        <li>Assets are sold at auction value, not at what you paid for them.</li>
        <li>Any shortfall becomes bad debt, is reported to the credit bureau and blocks new lending.</li>
      </ul>
    </section>`;
  }

  function noticesBlock(limit) {
    const list = state.notices.slice(0, limit);
    if (!list.length) return "";
    return `<section class="bk-card">
      <p class="eyebrow">NOTICES</p>
      <div class="bk-notices">
        ${list.map(n => `<div class="bk-notice is-${esc(n.kind)}">
          <b>${esc(n.title)}</b>
          <span>${esc(n.body)}</span>
          <small>Day ${n.day}</small>
        </div>`).join("")}
      </div>
    </section>`;
  }

  function editBlock() {
    if (!editOn()) return "";
    return `<section class="bk-card bk-edit">
      <div class="bk-card-head">
        <div><p class="eyebrow">CREATOR EDIT MODE</p><strong>Bank tools</strong></div>
        <span class="bk-chip">TESTING</span>
      </div>

      <div class="bk-edit-row">
        <label>Credit score</label>
        <input id="bk-edit-score" type="number" min="300" max="850" value="${state.score}">
        <button class="bk-btn is-small" type="button" data-bk="edit-score">Set</button>
      </div>
      <div class="bk-edit-row">
        <label>Overdraft</label>
        <input id="bk-edit-od" type="number" min="0" step="1000" value="${state.overdraft}">
        <button class="bk-btn is-small" type="button" data-bk="edit-od">Set</button>
      </div>
      <div class="bk-edit-row">
        <label>Card limit</label>
        <input id="bk-edit-limit" type="number" min="0" step="1000" value="${state.card.limit}">
        <button class="bk-btn is-small" type="button" data-bk="edit-limit">Set</button>
      </div>

      <div class="bk-btnrow">
        <button class="bk-btn is-small is-ghost" type="button" data-bk="edit-waive">Waive arrears</button>
        <button class="bk-btn is-small is-danger" type="button" data-bk="edit-default">Force a default</button>
      </div>
      <p class="bk-fine">Free play is ${free() ? "on — no instalments or interest are charged while Edit Mode is on" : "off"}. Forcing a default runs the repossession engine for real.</p>
    </section>`;
  }

  function render() {
    const dp = root();
    if (!dp) return;

    const body = tab === "loans" ? loansTab()
      : tab === "card" ? cardTab()
      : tab === "record" ? recordTab()
      : overviewTab();

    dp.innerHTML = `
      <section class="dynamic-page-content bk-page">
        ${top()}
        ${body}
        ${editBlock()}
        <p class="bk-disclaimer">Simulated institution for Nu Limits. Not a real bank, not real credit.</p>
      </section>`;

    const amountEl = dp.querySelector("#bk-amount");
    if (amountEl) {
      amountEl.addEventListener("input", () => {
        state.draftAmount = Number(amountEl.value) || 0;
        const q = quote(state.draftAmount, termDraft);
        const box = dp.querySelector("#bk-quote");
        if (box) box.innerHTML = quoteBlock(q);
        const apply = dp.querySelector('[data-bk="loan-apply"]');
        if (apply) apply.textContent = `Apply · ${money(state.draftAmount)}`;
      });
    }

    paintHome();
  }

  /* ---------------------------------------------------------
     Events
     --------------------------------------------------------- */
  function setPage() {
    const main = document.getElementById("main-content");
    const dp = root();
    if (!main || !dp) return;
    main.hidden = true;
    dp.hidden = false;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.addEventListener("click", e => {
    const scope = e.target.closest("#dynamic-page .bk-page");
    if (!scope) return;

    const btn = e.target.closest("[data-bk]");
    if (!btn) return;
    const act = btn.dataset.bk;

    if (act === "tab") {
      tab = btn.dataset.tab || "overview";
      render();
      return;
    }

    if (act === "amount") {
      state.draftAmount = Number(btn.dataset.v) || 0;
      return render();
    }

    if (act === "term") {
      termDraft = Number(btn.dataset.v) || 24;
      return render();
    }

    if (act === "loan-apply") {
      const input = scope.querySelector("#bk-amount");
      return applyLoan(input ? Number(input.value) : state.draftAmount, termDraft);
    }

    if (act === "loan-pay") {
      const loan = activeLoan();
      if (loan) payInstalment(loan.id);
      return;
    }

    if (act === "loan-settle") {
      const loan = activeLoan();
      if (loan) settleLoan(loan.id);
      return;
    }

    if (act === "limit") {
      state.draftLimit = Number(btn.dataset.v) || 0;
      const input = scope.querySelector("#bk-limit");
      if (input) input.value = String(state.draftLimit);
      return;
    }

    if (act === "card-activate") {
      const input = scope.querySelector("#bk-limit");
      return activateCard(input ? Number(input.value) : state.draftLimit);
    }

    if (act === "card-min") return payCard(Math.max(250, Math.round(state.card.outstanding * 0.05)), "Platinum minimum payment");
    if (act === "card-full") return payCard(state.card.outstanding, "Platinum full settlement");
    if (act === "card-pay") {
      const input = scope.querySelector("#bk-card-pay");
      return payCard(input ? Number(input.value) : 0, "Platinum card payment");
    }
    if (act === "card-freeze") return freezeCard();

    if (act === "use-card") {
      if (state.card.status === "frozen") return toast("Unfreeze the card first.", true);
      if (window.nuLimitsCards && window.nuLimitsCards.set) window.nuLimitsCards.set("credit");
      render();
      return toast("Platinum selected — purchases now go on the card.");
    }

    if (act === "edit-score" && editOn()) {
      const input = scope.querySelector("#bk-edit-score");
      state.score = clamp(Math.round(Number(input.value) || 300), 300, 850);
      log("edit", `Credit score set to ${state.score}`, 0);
      persist(); render(); paintHome();
      return toast(`Credit score set to ${state.score}.`);
    }

    if (act === "edit-od" && editOn()) {
      const input = scope.querySelector("#bk-edit-od");
      state.overdraft = clamp(Math.round(Number(input.value) || 0), 0, 2000000);
      log("edit", `Overdraft set to ${money(state.overdraft)}`, 0);
      persist(); render();
      return toast(`Overdraft limit ${money(state.overdraft)}.`);
    }

    if (act === "edit-limit" && editOn()) {
      const input = scope.querySelector("#bk-edit-limit");
      const v = clamp(Math.round(Number(input.value) || 0), 0, 2000000);
      state.card.limit = v;
      if (state.card.status === "off" && v > 0) {
        state.card.status = "active";
        state.card.openedDay = day();
        state.card.nextDue = day() + CYCLE;
        state.card.apr = cardApr() * 100;
      }
      log("edit", `Platinum limit set to ${money(v)}`, 0);
      persist(); render(); paintHome();
      return toast(`Platinum limit ${money(v)}.`);
    }

    if (act === "edit-waive" && editOn()) {
      state.card.missed = 0;
      state.loans.forEach(l => { if (l.status === "active") l.missed = 0; });
      state.banUntil = 0;
      persist(); render(); paintHome();
      return toast("Arrears waived.");
    }

    if (act === "edit-default" && editOn()) {
      if (!window.confirm("Force a default? Assets will be sold and the page will reload.")) return;
      return defaultAccount("Default forced in Edit Mode");
    }
  });

  /* ---------------------------------------------------------
     Routing
     --------------------------------------------------------- */
  const prevNavigate = window.navigateTo;

  window.navigateTo = function (page) {
    if (page === "bank") {
      document.querySelectorAll(".nav-item").forEach(b =>
        b.classList.toggle("active", b.dataset.page === "bank"));
      if (typeof window.nuLimitsInvestLeave === "function") window.nuLimitsInvestLeave();
      setPage();
      return;
    }
    return prevNavigate.apply(this, arguments);
  };

  /* nav + home strip */
  document.querySelectorAll('[data-page="bank"]').forEach(el => {
    el.addEventListener("click", () => window.navigateTo("bank"));
  });

  if (window.nuLimitsEditMode && typeof window.nuLimitsEditMode.onChange === "function") {
    window.nuLimitsEditMode.onChange(() => { if (isOnPage()) render(); });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  bootDay = day();
  paintHome();

  try {
    const flash = sessionStorage.getItem("nuLimitsBankFlash");
    if (flash) {
      sessionStorage.removeItem("nuLimitsBankFlash");
      const data = JSON.parse(flash);
      const items = Array.isArray(data.taken) ? data.taken : [];
      window.setTimeout(() => {
        toast(items.length
          ? `Repossessed ${items.length} asset${items.length === 1 ? "" : "s"} — ${money(items.reduce((t, i) => t + i.value, 0))} recovered.`
          : "No assets to seize — the shortfall was written off.", true);
      }, 700);
      if (items.length) {
        notice("bad", "Assets repossessed",
          items.map(i => `${i.name} · ${money(i.value)}`).join(" · "));
        items.forEach(i => state.history.unshift({
          day: day(), kind: "seized",
          label: `Repossessed · ${i.name}`,
          amount: i.value
        }));
        state.history.unshift({
          day: day(), kind: "settled",
          label: "Debt settled from auction proceeds",
          amount: items.reduce((t, i) => t + i.value, 0)
        });
        state.history = state.history.slice(0, 120);
        persist();
        if (isOnPage()) render();
      }
    }
  } catch (err) { /* ignore */ }

  window.setInterval(tick, 700);
  window.setInterval(paintHome, 1500);

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */
  window.nuLimitsBank = {
    get state() { return state; },
    get score() { return state.score; },
    overdraftLimit: () => state.overdraft,
    cardOpen,
    cardActive,
    cardFrozen: () => state.card.status === "frozen",
    cardClosed: () => state.card.status === "closed",
    cardAvailable,
    cardLimit: () => state.card.limit,
    cardOutstanding: () => state.card.outstanding,
    cardCharge,
    totalDebt,
    open: () => window.navigateTo("bank"),
    render,
    paintHome
  };
})();
