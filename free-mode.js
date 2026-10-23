/* ==========================================================
   NU LIMITS — FREE PLAY  (round 11)

   Everything here is tied to Edit Mode:
     · prices no longer block a purchase or a page
     · the starting capital can be set to any amount

   Loaded first so every other script can ask `nuLimitsFree.on()`.
   ========================================================== */

(function () {
  "use strict";

  const CAPITAL_KEY = "nuLimitsStartCapital_v1";
  const DEFAULT_CAPITAL = 100000;

  /* ---------------------------------------------------------
     Is Edit Mode on?
     --------------------------------------------------------- */
  function on() {
    return !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  }

  /* ---------------------------------------------------------
     Money wrapper — only unaffordable expenses become free.
     Affordable ones still move real money so the ledger keeps
     telling the truth while you test.
     --------------------------------------------------------- */
  let originalTransact = null;

  function wrapMoney() {
    const money = window.nuLimitsMoney;
    if (!money || typeof money.transact !== "function") return false;
    if (money.__freeWrapped) return true;

    originalTransact = money.transact.bind(money);
    money.transact = function (type, amount, description) {
      if (on() && type === "expense") {
        const bal = money.getBalance();
        const cost = Math.round(Number(amount) || 0);
        if (cost > bal) return true;      /* free play — pretend it was paid */
      }
      return originalTransact(type, amount, description);
    };
    money.__freeWrapped = true;
    return true;
  }

  /* ---------------------------------------------------------
     Set the balance to an exact amount (used by the capital field)
     --------------------------------------------------------- */
  function setBalance(target) {
    const money = window.nuLimitsMoney;
    if (!money) return { ok: false, why: "Money system not ready." };
    const value = Math.max(0, Math.round(Number(target) || 0));
    if (!Number.isSafeInteger(value)) return { ok: false, why: "Enter a whole amount." };

    const cur = money.getBalance();
    const delta = value - cur;
    if (delta === 0) return { ok: true, message: "Balance already there." };

    const fn = originalTransact || money.transact.bind(money);
    const done = delta > 0
      ? fn("income", delta, "Edit mode · capital set")
      : fn("expense", Math.abs(delta), "Edit mode · capital set");

    if (!done) return { ok: false, why: "That amount could not be applied." };
    return { ok: true, message: "Balance set to R " + value.toLocaleString("en-ZA").replace(/,/g, " ") };
  }

  function startCapital() {
    try {
      const raw = localStorage.getItem(CAPITAL_KEY);
      if (raw === null || raw === "") return DEFAULT_CAPITAL;
      const v = Number(raw);
      return Number.isSafeInteger(v) && v >= 0 ? v : DEFAULT_CAPITAL;
    } catch (e) {
      return DEFAULT_CAPITAL;
    }
  }

  function saveStartCapital(v) {
    const value = Math.max(0, Math.round(Number(v) || 0));
    try { localStorage.setItem(CAPITAL_KEY, String(value)); } catch (e) { /* ignore */ }
    return value;
  }

  /* ---------------------------------------------------------
     Settings panel — capital field
     --------------------------------------------------------- */
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
    el.__t = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function syncPill() {
    const pill = document.getElementById("free-pill");
    if (pill) {
      pill.textContent = on() ? "On — nothing is charged" : "Off";
      pill.classList.toggle("on", on());
    }
    const row = document.getElementById("free-play-row");
    if (row) row.classList.toggle("active", on());
  }

  function wireSettings() {
    const input = document.getElementById("start-capital");
    const apply = document.getElementById("start-capital-apply");
    const reset = document.getElementById("start-capital-set");

    if (input) {
      input.value = String(startCapital());
      input.addEventListener("change", () => {
        const v = saveStartCapital(input.value);
        input.value = String(v);
        const hint = document.getElementById("capital-hint");
        if (hint) hint.textContent = `New games start with R ${v.toLocaleString("en-ZA").replace(/,/g, " ")}.`;
      });
    }

    if (apply) {
      apply.addEventListener("click", () => {
        const v = Number(input ? input.value : startCapital());
        saveStartCapital(v);
        const res = setBalance(v);
        toast(res.message || res.why, !res.ok);
      });
    }

    if (reset) {
      reset.addEventListener("click", () => {
        saveStartCapital(DEFAULT_CAPITAL);
        if (input) input.value = String(DEFAULT_CAPITAL);
        toast("Starting capital reset to R 100 000");
      });
    }
  }

  /* ---------------------------------------------------------
     A quiet badge so it is obvious you are in free play
     --------------------------------------------------------- */
  const BADGE = "Edit Mode · free play";

  function decorateBackBar() {
    const bar = document.querySelector("#dynamic-page > .nl-backbar");
    if (!bar) return;

    const existing = bar.querySelector(".free-badge");
    if (!on()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const chip = document.createElement("span");
    chip.className = "free-badge";
    chip.textContent = BADGE;
    bar.appendChild(chip);
  }

  function whenEditMode(fn) {
    if (window.nuLimitsEditMode) return fn(window.nuLimitsEditMode);
    let tries = 0;
    const timer = window.setInterval(() => {
      if (window.nuLimitsEditMode || ++tries > 200) {
        window.clearInterval(timer);
        if (window.nuLimitsEditMode) fn(window.nuLimitsEditMode);
      }
    }, 25);
  }

  function boot() {
    wrapMoney();
    wireSettings();
    syncPill();

    /* properties.js defines the switch after this file — wait for it */
    whenEditMode(api => {
      api.onChange(() => {
        syncPill();
        decorateBackBar();
        if (window.renderCreator && document.querySelector(".cr-page")) window.renderCreator();
        if (window.renderRestaurant && document.querySelector(".rs-page")) window.renderRestaurant();
        if (window.renderBusinesses && document.querySelector(".bz-page")) window.renderBusinesses();
      });
    });

    document.addEventListener("click", e => {
      if (e.target.closest(".nav-item[data-page='home']")) window.setTimeout(syncPill, 60);
    });

    const dp = document.getElementById("dynamic-page");
    if (dp) {
      new MutationObserver(() => {
        window.requestAnimationFrame(decorateBackBar);
      }).observe(dp, { childList: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.nuLimitsFree = {
    on,
    setBalance,
    startCapital,
    saveStartCapital,
    DEFAULT_CAPITAL,
    wrapMoney
  };
})();
