/* ==========================================================
   NU LIMITS — UNIVERSAL BACK BUTTON  (round 8b)

   Every dynamic page gets a "Back" button pinned above its
   content. Navigation is remembered as a stack, so Back always
   returns to the page you actually came from.
   ========================================================== */

(function () {
  "use strict";

  const HISTORY_LIMIT = 12;

  let stack = [];
  let currentPage = "home";
  let goingBack = false;

  const root = () => document.getElementById("dynamic-page");

  /* ---------------------------------------------------------
     Wrap every navigation — this script loads last, so it sees
     the calls made by shop, garage, creator and businesses.
     --------------------------------------------------------- */
  const prevNavigate = window.navigateTo;

  function note(page) {
    if (!goingBack) {
      if (page === "home") {
        stack = [];
      } else if (currentPage && currentPage !== page) {
        stack.push(currentPage);
        if (stack.length > HISTORY_LIMIT) stack.shift();
      }
    }
    currentPage = page;
  }

  /* pages that wrap navigateTo themselves (university, jobs) call this so the
     back stack still knows where the player came from */
  window.nuLimitsNoteNav = function (page) {
    note(page);
    scheduleInject();
    return true;
  };

  window.navigateTo = function (page) {
    note(page);
    const out = prevNavigate.apply(this, arguments);
    scheduleInject();
    return out;
  };

  /* ---------------------------------------------------------
     The button
     --------------------------------------------------------- */
  function goBack() {
    if (!stack.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const target = stack.pop();
    goingBack = true;
    try {
      window.navigateTo(target);
    } finally {
      goingBack = false;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backBar() {
    const wrap = document.createElement("div");
    wrap.className = "nl-backbar";
    wrap.innerHTML = `<button class="nl-back" type="button" aria-label="Go back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m14 6-6 6 6 6"/>
      </svg>
      <span>Back</span>
    </button>`;

    wrap.querySelector("button").addEventListener("click", goBack);

    return wrap;
  }

  function inject() {
    const dp = root();
    if (!dp || dp.hidden) return;
    if (!dp.firstElementChild) return;
    /* round 37 — every page gets the bar, rendered or not */
    stamp();
    relabelFooters();
  }

  /* round 24 — if a page redraws its own innerHTML the bar goes with it,
     so every freshly painted page gets the bar moved back in */
  function stamp() {
    const dp = root();
    if (!dp || dp.hidden) return;
    const page = dp.firstElementChild;
    if (!page || !page.classList || page.classList.contains("nl-backbar")) return;
    if (!dp.querySelector(":scope > .nl-backbar")) {
      dp.insertBefore(backBar(), dp.firstChild);
    }
  }

  /* the "← Back to Home" buttons at the foot of every page should
     return to where you came from, not to Home every time */
  function relabelFooters() {
    const dp = root();
    if (!dp) return;
    dp.querySelectorAll('.secondary-button[data-page="home"]').forEach(b => {
      b.textContent = stack.length ? "← Back" : "← Back to Home";
    });
  }

  document.addEventListener("click", e => {
    const b = e.target.closest('.secondary-button[data-page="home"], [data-uv-back], [data-jb-back], [data-go-home]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    if (stack.length) goBack();
    else window.navigateTo("home");
  }, true);

  window.nuLimitsBack = goBack;

  let queued = false;
  function scheduleInject() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      inject();
      relabelFooters();
    });
  }

  /* pages replace their own innerHTML constantly — keep the bar on top */
  const start = () => {
    const dp = root();
    if (!dp) return;

    const observer = new MutationObserver(() => {
      if (!dp.hidden) scheduleInject();
    });
    observer.observe(dp, { childList: true, subtree: true });

    scheduleInject();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
