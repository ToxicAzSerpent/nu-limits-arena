/* ==========================================================
   NU LIMITS — WORLD CLOCK, WALLET & MONTHLY ECONOMICS
   Round 7

   • 1 game day = 15 real seconds · 365 days = 1 year
   • calendar starts Thursday 1 January 2026
   • weekday strip + year at the top of Home
   • realistic two-card wallet, fluid switch, both cards usable
   • every purchase is stamped with the card that paid
   • month rollover charges upkeep / leases / Platinum fee,
     and refuses to overdraw — it warns instead

   Saves: nuLimitsWorld_v1 · nuLimitsCards_v1
   Reads: nuLimitsAssets_v1 · nuLimitsShop_v1 · nuLimitsMoneySave_v1
   ========================================================== */

(function () {
  "use strict";

  const WORLD_KEY  = "nuLimitsWorld_v1";
  const CARDS_KEY  = "nuLimitsCards_v1";
  const ASSETS_KEY = "nuLimitsAssets_v1";

  const DAY_MS = 15000;                 /* one game day = 15 s */
  const DAY = 86400000;
  const START_UTC = Date.UTC(2026, 0, 1);
  const CREDIT_FEE = 0.025;             /* 2.5 % Platinum statement fee */

  const DOW_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const DOW_LONG  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const MONTHS    = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"];

  /* ---------------------------------------------------------
     Small utilities
     --------------------------------------------------------- */
  const money = n => "R " + Math.round(Number(n) || 0).toLocaleString("en-ZA");
  const clamp0 = n => Math.max(0, Math.round(Number(n) || 0));

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
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  const balance = () =>
    (window.nuLimitsMoney && window.nuLimitsMoney.getBalance)
      ? window.nuLimitsMoney.getBalance()
      : 0;

  /* ---------------------------------------------------------
     Date maths
     --------------------------------------------------------- */
  const dateFromOffset = offset => new Date(START_UTC + offset * DAY);
  const dowIndex = d => (d.getUTCDay() + 6) % 7;          /* Mon = 0 */
  const monthKey = d => d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
  const daysInYear = y => ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365;

  function dayOfYear(d) {
    return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) -
                       Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY) + 1;
  }

  function longDate(d) {
    return `${DOW_LONG[dowIndex(d)]} · ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }

  /* ---------------------------------------------------------
     1 · Neutralise the round-1 clock
     script.js captured #game-date / #game-day and rewrites them
     with a 2030 date every second. Replace both nodes so those
     writes land on detached elements and can never win.
     --------------------------------------------------------- */
  ["game-date", "game-day"].forEach(id => {
    const old = document.getElementById(id);
    if (!old) return;
    const fresh = old.cloneNode(false);
    fresh.textContent = "";
    old.replaceWith(fresh);
  });

  /* ---------------------------------------------------------
     2 · Wallet state
     --------------------------------------------------------- */
  function loadCards() {
    const saved = readJSON(CARDS_KEY, null);
    return {
      version: 1,
      selected: saved && saved.selected === "credit" ? "credit" : "debit",
      credit: (saved && saved.credit && typeof saved.credit === "object")
        ? { month: String(saved.credit.month || ""), amount: clamp0(saved.credit.amount) }
        : { month: "", amount: 0 }
    };
  }

  let cards = loadCards();

  const CARD_LABEL = {
    debit: "Debit •4821",
    credit: "Platinum •7734"
  };

  const cardLabel = which => CARD_LABEL[which || cards.selected] || CARD_LABEL.debit;

  /* ---------------------------------------------------------
     What can actually pay for things right now?
     Cash in the account, or the Platinum limit when that card
     is selected and the Bank Corporation has opened a line.
     --------------------------------------------------------- */
  function spendable() {
    const B = window.nuLimitsBank;
    if (cards.selected === "credit" && B && B.cardActive && B.cardActive()) {
      return B.cardAvailable();
    }
    return balance();
  }

  window.nuLimitsSpendable = spendable;
  window.nuLimitsCanPay = amount => spendable() >= Math.round(Number(amount) || 0);

  /* ---------------------------------------------------------
     3 · World state
     --------------------------------------------------------- */
  function loadWorld() {
    const now = Date.now();
    const saved = readJSON(WORLD_KEY, null);

    let startedAt = saved && typeof saved.startedAt === "number" && saved.startedAt > 0
      ? saved.startedAt : now;

    const savedOffset = (saved && Number.isFinite(saved.offset))
      ? Math.max(0, Math.round(saved.offset)) : 0;

    /* the calendar can never travel backwards, and catches up at most one day */
    let offset = Math.max(0, Math.floor((now - startedAt) / DAY_MS));
    if (offset < savedOffset) offset = savedOffset;
    if (offset > savedOffset + 1) offset = savedOffset + 1;
    startedAt = now - offset * DAY_MS;

    const key = monthKey(dateFromOffset(offset));

    return {
      version: 1,
      startedAt,
      offset,
      lastMonth: (saved && typeof saved.lastMonth === "string") ? saved.lastMonth : key,
      due: (saved && saved.due && Array.isArray(saved.due.lines)) ? saved.due : null
    };
  }

  let world = loadWorld();

  const offsetNow = () => Math.max(0, Math.floor((Date.now() - world.startedAt) / DAY_MS));
  const dateNow = () => dateFromOffset(offsetNow());

  const persistWorld = () => writeJSON(WORLD_KEY, world);
  const persistCards = () => writeJSON(CARDS_KEY, cards);

  /* ---------------------------------------------------------
     4 · Calendar strip (top of Home)
     --------------------------------------------------------- */
  const wallet = document.getElementById("wallet-stack");
  const datebar = wallet ? wallet.querySelector(".nl-datebar") : null;

  let weekEl = null, yearEl = null, subEl = null;

  if (wallet) {
    const cal = document.createElement("div");
    cal.className = "nl-cal";
    cal.innerHTML = `
      <div class="nl-cal-head">
        <span class="nl-cal-year"><b id="nl-year">2026</b><small>YEAR</small></span>
        <span class="nl-cal-sub" id="nl-cal-sub">Day 1 of 365</span>
        <button class="nl-cal-skip" id="nl-cal-skip" type="button"
                aria-label="Advance one game day" title="Skip one day">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
               stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m5 6 6 6-6 6"/><path d="m13 6 6 6-6 6"/>
          </svg>
        </button>
      </div>
      <div class="nl-week" id="nl-week" role="list" aria-label="Days of the week"></div>`;

    wallet.insertBefore(cal, datebar || wallet.firstChild);

    weekEl = cal.querySelector("#nl-week");
    yearEl = cal.querySelector("#nl-year");
    subEl = cal.querySelector("#nl-cal-sub");

    weekEl.innerHTML = DOW_SHORT.map((d, i) =>
      `<span class="nl-dow" data-dow="${i}" role="listitem"><i>${d}</i><b>—</b></span>`).join("");

    const skip = cal.querySelector("#nl-cal-skip");
    if (skip) skip.addEventListener("click", () => advanceDays(1));
  }

  /* ---------------------------------------------------------
     5 · Card deck
     --------------------------------------------------------- */
  const deck = document.getElementById("nl-deck");
  const cardEls = deck ? Array.from(deck.querySelectorAll("[data-card]")) : [];
  const paywith = document.getElementById("nl-paywith");
  const flipBtn = document.getElementById("nl-flip");

  function paintCards(animate) {
    cardEls.forEach(el => {
      const front = el.dataset.card === cards.selected;
      el.classList.toggle("is-front", front);
      el.classList.toggle("is-back", !front);
      el.setAttribute("aria-pressed", String(front));
      el.setAttribute("tabindex", front ? "0" : "-1");
    });
    if (paywith) paywith.textContent = cardLabel();
    if (deck && animate) {
      deck.classList.remove("is-swapping");
      void deck.offsetWidth;
      deck.classList.add("is-swapping");
      window.setTimeout(() => deck.classList.remove("is-swapping"), 680);
    }
  }

  function selectCard(next, animate) {
    if (next !== "debit" && next !== "credit") return;
    if (next === cards.selected) {
      const el = cardEls.find(c => c.dataset.card === next);
      if (el) {
        el.classList.remove("is-pulsing");
        void el.offsetWidth;
        el.classList.add("is-pulsing");
      }
      return;
    }
    cards.selected = next;
    persistCards();
    paintCards(animate !== false);
    if (navigator.vibrate) { try { navigator.vibrate(7); } catch (err) {} }
    renderEco();
    document.dispatchEvent(new CustomEvent("nuLimitsCardChange", {
      detail: { card: next, label: cardLabel(next) }
    }));
  }

  cardEls.forEach(el => {
    el.addEventListener("click", () => selectCard(el.dataset.card));
    el.addEventListener("keydown", ev => {
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
        ev.preventDefault();
        selectCard(cards.selected === "debit" ? "credit" : "debit");
      }
    });
  });

  if (flipBtn) {
    flipBtn.addEventListener("click", () =>
      selectCard(cards.selected === "debit" ? "credit" : "debit"));
  }

  /* the Platinum card face shows what has been charged to it this month */
  const creditEl = document.getElementById("nl-credit-used");

  /* outstanding Platinum spend — cleared when the statement runs */
  function creditUsed() {
    return clamp0(cards.credit.amount);
  }

  function monthLabelOf(key) {
    const parts = String(key || "").split("-");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    if (!y || !m || m < 1 || m > 12) return "LAST MONTH";
    return MONTHS[m - 1] + " " + y;
  }

  function paintCredit() {
    if (!creditEl) return;

    const B = window.nuLimitsBank;
    /* always look the sub-line up — the bank module paints it too */
    let sub = document.getElementById("nl-credit-sub");

    if (B && B.cardOpen && B.cardOpen()) {
      creditEl.textContent = money(B.cardOutstanding());
      if (!sub) {
        sub = document.createElement("em");
        sub.id = "nl-credit-sub";
        sub.className = "nl-credit-sub";
        creditEl.parentNode.appendChild(sub);
      }
      const avail = B.cardAvailable();
      sub.textContent = `of ${money(B.cardLimit())} · ${money(avail)} available`;
      sub.classList.toggle("is-low", avail < B.cardLimit() * 0.15);
      return;
    }

    if (sub) sub.textContent = "No credit line · open Bank";
    creditEl.textContent = money(creditUsed());
  }

  /* ---------------------------------------------------------
     6 · Stamp every purchase with the card that paid
     --------------------------------------------------------- */
  const moneyApi = window.nuLimitsMoney;

  /* raw, un-stamped transaction writer — used for bills and statements */
  const rawTransact = (moneyApi && typeof moneyApi.transact === "function" && !moneyApi.__nlCardWrapped)
    ? moneyApi.transact.bind(moneyApi)
    : null;

  if (moneyApi && rawTransact) {
    moneyApi.transact = function (type, amount, description) {
      const amt = Math.round(Number(amount) || 0);

      if (type !== "expense") {
        return rawTransact(type, amount, description);
      }

      const label = cardLabel();

      /* round 12 — an activated Platinum line charges the card, not the wallet */
      const B = window.nuLimitsBank;
      const freeNow = !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());

      if (cards.selected === "credit" && !freeNow) {
        if (!B || !B.cardActive || !B.cardActive()) {
          if (B && B.cardFrozen && B.cardFrozen()) {
            toast("Your Platinum card is frozen — unfreeze it at Bank Corporation.");
          } else if (B && B.cardClosed && B.cardClosed()) {
            toast("Platinum is closed after the default. Ride the overdraft instead.");
          } else {
            toast("No credit line yet — activate Platinum at Bank Corporation.");
          }
          return false;
        }
        /* an activated Platinum line charges the card, not the wallet */
        return B.cardCharge(amt, String(description || "Purchase"), label);
      }

      const ok = rawTransact(type, amount, `${description} · ${label}`);

      if (ok && amt > 0) {
        if (cards.selected === "credit") {
          const key = monthKey(dateNow());
          cards.credit = {
            month: key,
            amount: (cards.credit.month === key ? clamp0(cards.credit.amount) : 0) + amt
          };
          persistCards();
          paintCredit();
          renderEco();
        }
      }

      return ok;
    };

    moneyApi.__nlCardWrapped = true;
  }

  /* ---------------------------------------------------------
     7 · Monthly economics
     --------------------------------------------------------- */
  function readAssets() {
    const data = readJSON(ASSETS_KEY, null);
    return (data && Array.isArray(data.items)) ? data.items : [];
  }

  function upkeepOf(item) {
    const bills = Array.isArray(item.bills)
      ? item.bills.reduce((t, b) => t + clamp0(b && b.amount), 0)
      : 0;
    return clamp0(item.tax) + clamp0(item.internet) + bills;
  }

  function statementLines() {
    const lines = [];

    /* other businesses register their monthly bills here */
    if (typeof window.nuLimitsCreatorCosts === "function") {
      try {
        window.nuLimitsCreatorCosts().forEach(l => {
          if (l && l.amount > 0) lines.push({ kind: "creator", label: String(l.label || "Creator costs"), amount: clamp0(l.amount) });
        });
      } catch (err) { /* never break the statement */ }
    }

    readAssets().forEach(item => {
      if (!item || typeof item !== "object") return;
      const name = String(item.name || "Untitled");

      if (item.owned) {
        const total = upkeepOf(item);
        if (total > 0) lines.push({ kind: "bills", label: `Upkeep: ${name}`, amount: total });
      } else if (item.leased) {
        const rent = clamp0(item.lease);
        if (rent > 0) lines.push({ kind: "lease", label: `Lease: ${name}`, amount: rent });
      }
    });

    /* round 12 — the Bank Corporation bills the Platinum card itself */

    return lines;
  }

  const totalOf = lines => lines.reduce((t, l) => t + l.amount, 0);

  function nextStatementLabel() {
    const d = dateNow();
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    return `${next.getUTCDate()} ${MONTHS[next.getUTCMonth()]} ${next.getUTCFullYear()}`;
  }

  function toast(msg) {
    let el = document.querySelector(".mn-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "mn-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(el.__t);
    el.__t = window.setTimeout(() => el.classList.remove("show"), 3600);
  }

  function settle(lines) {
    /* bills and statements are debit orders: they may dip into the
       overdraft, and anything the bank refuses stays unpaid */
    const unpaid = [];
    lines.forEach(line => {
      const charge = window.nuLimitsMoney && window.nuLimitsMoney.charge;
      const ok = charge
        ? charge(line.amount, line.label)
        : (rawTransact ? rawTransact("expense", line.amount, line.label) : false);
      if (!ok) unpaid.push(line);
    });
    return unpaid;
  }

  function runStatement(closingKey) {
    const lines = statementLines();
    const total = totalOf(lines);

    /* a new month — the Platinum usage counter starts again */
    cards.credit = { month: monthKey(dateNow()), amount: 0 };
    persistCards();
    paintCredit();

    if (total <= 0) {
      world.due = null;
      persistWorld();
      renderEco();
      return;
    }

    const unpaid = settle(lines);

    if (unpaid.length) {
      const short = totalOf(unpaid);
      world.due = {
        month: closingKey,
        total: short,
        lines: unpaid,
        raisedAt: new Date().toISOString()
      };
      persistWorld();
      renderEco();
      toast(`Statement short ${money(short)} — the bank returned it unpaid.`);
      return;
    }

    world.due = null;
    persistWorld();
    renderEco();
    toast(`Statement settled · ${money(total)} for ${monthLabelOf(closingKey)}`);
  }

  function payDue() {
    const due = world.due;
    if (!due) return;
    const unpaid = settle(due.lines);
    if (unpaid.length) {
      world.due = { month: due.month, total: totalOf(unpaid), lines: unpaid, raisedAt: due.raisedAt };
      persistWorld();
      renderEco();
      return toast(`Still short ${money(totalOf(unpaid))} — earn or sell something first.`);
    }
    world.due = null;
    persistWorld();
    renderEco();
    toast(`Paid ${money(due.total)} — you're up to date.`);
  }

  /* ---------------------------------------------------------
     8 · Statement card on Home
     --------------------------------------------------------- */
  let ecoEl = null;

  function mountEco() {
    if (ecoEl || !wallet) return ecoEl;
    ecoEl = document.createElement("div");
    ecoEl.className = "nl-eco";
    ecoEl.id = "nl-eco";
    ecoEl.innerHTML = `
      <div class="nl-eco-main">
        <p class="eyebrow" id="nl-eco-eyebrow">MONTHLY STATEMENT</p>
        <span class="nl-eco-amount" id="nl-eco-amount">R 0</span>
        <span class="nl-eco-when" id="nl-eco-when">No upkeep — nothing owned yet</span>
      </div>
      <button class="nl-eco-pay" id="nl-eco-pay" type="button" hidden>Pay now</button>`;

    wallet.appendChild(ecoEl);
    const pay = ecoEl.querySelector("#nl-eco-pay");
    if (pay) pay.addEventListener("click", payDue);
    return ecoEl;
  }

  function renderEco() {
    if (!mountEco()) return;

    const eyebrow = ecoEl.querySelector("#nl-eco-eyebrow");
    const amount = ecoEl.querySelector("#nl-eco-amount");
    const when = ecoEl.querySelector("#nl-eco-when");
    const pay = ecoEl.querySelector("#nl-eco-pay");
    const due = world.due;

    ecoEl.classList.remove("is-due", "is-clear");

    if (due) {
      const short = Math.max(0, due.total - balance());
      ecoEl.classList.add("is-due");
      eyebrow.textContent = `UPKEEP DUE · ${monthLabelOf(due.month).toUpperCase()}`;
      amount.textContent = money(due.total);
      when.textContent = short > 0
        ? `Short ${money(short)} — earn or sell to settle`
        : "Funded — tap Pay now";
      pay.hidden = short > 0;
    } else {
      const lines = statementLines();
      const total = totalOf(lines);

      if (total <= 0) ecoEl.classList.add("is-clear");

      eyebrow.textContent = "MONTHLY STATEMENT";
      amount.textContent = money(total);
      when.textContent = total > 0
        ? `Auto-charged ${nextStatementLabel()} · ${lines.length} line${lines.length === 1 ? "" : "s"}`
        : `Next statement ${nextStatementLabel()} · nothing to charge`;
      pay.hidden = true;
    }
  }

  /* ---------------------------------------------------------
     9 · Clock render + tick
     --------------------------------------------------------- */
  const dateEl = document.getElementById("game-date");
  const dayEl = document.getElementById("game-day");

  function paintClock() {
    const d = dateNow();
    const offset = offsetNow();

    if (dateEl) dateEl.textContent = longDate(d);
    if (dayEl) dayEl.textContent = `DAY ${offset + 1}`;
    if (yearEl) yearEl.textContent = String(d.getUTCFullYear());

    if (subEl) {
      subEl.textContent = `Day ${dayOfYear(d)} of ${daysInYear(d.getUTCFullYear())}`;
    }

    if (weekEl) {
      const today = dowIndex(d);
      const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - today));

      Array.from(weekEl.children).forEach((chip, i) => {
        const day = new Date(monday.getTime() + i * DAY);
        const num = chip.querySelector("b");
        if (num) num.textContent = String(day.getUTCDate());
        chip.classList.toggle("is-today", i === today);
        chip.classList.toggle("is-outside",
          day.getUTCMonth() !== d.getUTCMonth() || day.getUTCFullYear() !== d.getUTCFullYear());
      });
    }

    paintCredit();
  }

  function advanceDays(n) {
    const days = Math.max(1, Math.round(Number(n) || 1));
    world.startedAt -= days * DAY_MS;
    persistWorld();
    tick();
  }

  let lastOffset = -1;
  let lastEcoPaint = 0;

  function tick() {
    const offset = offsetNow();
    const d = dateFromOffset(offset);

    if (offset !== lastOffset) {
      lastOffset = offset;
      world.offset = offset;
      persistWorld();
      paintClock();

      const key = monthKey(d);
      if (world.lastMonth && key > world.lastMonth) {
        const prev = world.lastMonth;
        world.lastMonth = key;
        persistWorld();
        runStatement(prev);
      } else if (!world.lastMonth) {
        world.lastMonth = key;
        persistWorld();
      }
    }

    /* keep the statement card honest even when the money moves on its own */
    const now = Date.now();
    if (now - lastEcoPaint > 1200) {
      lastEcoPaint = now;
      renderEco();
    }
  }

  /* ---------------------------------------------------------
     10 · Boot
     --------------------------------------------------------- */
  paintCards(false);
  paintClock();
  paintCredit();
  renderEco();
  persistWorld();

  if (world.due) renderEco();

  window.setInterval(tick, 500);

  /* public API */
  window.nuLimitsWorld = {
    DAY_MS,
    get date() { return dateNow(); },
    get day() { return offsetNow() + 1; },
    get year() { return dateNow().getUTCFullYear(); },
    get monthKey() { return monthKey(dateNow()); },
    get due() { return world.due; },
    get upkeep() { return totalOf(statementLines()); },
    advanceDays,
    settleNow: payDue,
    label: cardLabel
  };

  window.nuLimitsCards = {
    get selected() { return cards.selected; },
    get used() {
      const B = window.nuLimitsBank;
      return (B && B.cardActive && B.cardActive()) ? B.cardOutstanding() : creditUsed();
    },
    label: cardLabel,
    set: which => selectCard(which, true)
  };
})();
