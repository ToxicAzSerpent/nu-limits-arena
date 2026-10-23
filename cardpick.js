/* ==========================================================
   NU LIMITS — PAY WITH  (round 17)

   A small debit / credit chooser that appears when you press
   Buy or a trade button, so the card is picked at the till
   instead of buried in the wallet.
   ========================================================== */

(function () {
  "use strict";

  let allowed = null;      /* the element we already asked about */

  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const selected = () => (window.nuLimitsCards ? window.nuLimitsCards.selected : "debit");

  function cardState() {
    const B = window.nuLimitsBank;
    const open = !!(B && B.cardActive && B.cardActive());
    return {
      open,
      limit: open ? B.cardLimit() : 0,
      used: open ? B.cardOutstanding() : 0
    };
  }

  function money(n) {
    return "R " + Math.round(Number(n) || 0).toLocaleString("en-ZA");
  }

  function build() {
    const modal = document.createElement("div");
    modal.className = "cp-modal";
    const st = cardState();
    const now = selected();

    modal.innerHTML = `<div class="cp-sheet" role="dialog" aria-modal="true" aria-label="Choose a card">
      <header><strong>Pay with</strong><button type="button" data-close aria-label="Cancel">✕</button></header>
      <div class="cp-cards">
        <button type="button" class="cp-card ${now === "debit" ? "is-on" : ""}" data-pick="debit">
          <span class="cp-face is-debit">
            <i>NU LIMITS</i>
            <em>4821</em>
            <span class="cp-chip"></span>
          </span>
          <b>Debit</b>
          <small>Cash and overdraft</small>
        </button>

        <button type="button" class="cp-card ${now === "credit" ? "is-on" : ""} ${st.open ? "" : "is-off"}" data-pick="credit">
          <span class="cp-face is-credit">
            <i>PLATINUM</i>
            <em>7734</em>
            <span class="cp-chip"></span>
          </span>
          <b>Credit</b>
          <small>${st.open ? `${money(st.limit - st.used)} of ${money(st.limit)} free` : "No credit line"}</small>
        </button>
      </div>
      <p class="cp-note">${st.open
        ? "Credit is borrowed money — it comes back on your statement."
        : "Open Platinum at Bank Corporation to shop on credit."}</p>
    </div>`;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));
    return modal;
  }

  function ask(el) {
    const modal = build();
    const close = () => { modal.classList.remove("show"); setTimeout(() => modal.remove(), 220); };

    modal.addEventListener("click", e => {
      if (e.target === modal || e.target.closest("[data-close]")) return close();

      const pick = e.target.closest("[data-pick]");
      if (!pick) return;

      const which = pick.dataset.pick;
      if (window.nuLimitsCards && window.nuLimitsCards.set) window.nuLimitsCards.set(which);

      close();
      allowed = el;
      setTimeout(() => { if (el.isConnected) el.click(); }, 60);
    });
  }

  document.addEventListener("click", e => {
    const el = e.target.closest('[data-act="buy"], [data-trade="buy"]');
    if (!el) return;

    if (allowed === el) { allowed = null; return; }
    if (editOn()) return;                     /* free play does not need a till */
    if (el.hasAttribute("disabled") || el.disabled) return;

    e.preventDefault();
    e.stopPropagation();
    ask(el);
  }, true);

  window.nuLimitsPayWith = { ask };
})();
