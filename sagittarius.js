/* ==========================================================
   NU LIMITS — SAGITTARIUS AI WIDGET  (round 18)

   A floating assistant. Everything is offline: the answers come
   from sagittarius-core.js reading your save.

     · lime LED blinks while it "thinks"
     · messages stream in character by character
     · minimises to a single button, remembers its size
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsSagittarius_v1";

  const LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" stroke-opacity=".42" stroke-width="1.1"/>
    <path d="M15.9 7.4h-6M9.9 7.4 15.2 16.6M15.2 16.6h-6.1M15.9 7.4l.9-1.9" fill="none"
          stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="16.9" cy="5.2" r="1.25" fill="currentColor"/>
  </svg>`;

  const state = {
    open: false,
    busy: false,
    messages: []
  };

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "null");
      return { open: false, messages: [], ...(v && typeof v === "object" ? v : {}) };
    } catch (err) { return { open: false, messages: [] }; }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        open: state.open,
        messages: state.messages.slice(-40).map(m => ({ role: m.role, text: m.text }))
      }));
    } catch (err) { /* ignore */ }
  }

  /* light markdown: **bold** and *italic* */
  function fmt(text) {
    return String(text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/\*(.+?)\*/g, "<i>$1</i>");
  }

  function build() {
    const wrap = document.createElement("div");
    wrap.className = "sg-root";
    wrap.innerHTML = `
      <button class="sg-launch" type="button" aria-label="Open Sagittarius AI">
        <span class="sg-launch-logo">${LOGO}</span>
        <span class="sg-launch-led" aria-hidden="true"></span>
      </button>

      <section class="sg-panel" aria-label="Sagittarius AI">
        <header class="sg-head" title="Drag to move">
          <span class="sg-mark">${LOGO}</span>
          <span class="sg-id">
            <b>Sagittarius AI</b>
            <small><i class="sg-led"></i> <span class="sg-status">on device · ready</span></small>
          </span>
          <span class="sg-grip" aria-hidden="true">⋮⋮</span>
          <button class="sg-reset" type="button" aria-label="Reset position" title="Reset position">⌂</button>
          <button class="sg-min" type="button" aria-label="Minimise">–</button>
        </header>

        <div class="sg-log" id="sg-log"></div>

        <form class="sg-form" autocomplete="off">
          <input class="sg-input" placeholder="Ask about your empire…" aria-label="Ask Sagittarius">
          <button class="sg-send" type="submit" aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </form>
        <p class="sg-foot">Reads this device only · no connection</p>
      </section>`;
    return wrap;
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function start() {
    if (!window.nuLimitsSagittarius) return;

    const saved = read();
    state.open = !!saved.open;
    state.messages = Array.isArray(saved.messages) ? saved.messages : [];

    const root = build();
    /* round 24 — dock the launcher in the header so it never floats over
       page buttons; the panel is fixed-position and still overlays. */
    const bar = document.querySelector(".topbar");
    const bell = document.getElementById("notifications");
    if (bar) {
      if (bell) bar.insertBefore(root, bell);
      else bar.appendChild(root);
      bar.classList.add("has-ai");
    } else {
      document.body.appendChild(root);
    }

    const panel = root.querySelector(".sg-panel");
    const log = root.querySelector("#sg-log");
    const input = root.querySelector(".sg-input");
    const status = root.querySelector(".sg-status");
    const launch = root.querySelector(".sg-launch");

    const scrollDown = () => { log.scrollTop = log.scrollHeight; };

    /* ---------------------------------------------------------
       Round 26 — the panel can be dragged anywhere on screen
       (mouse, touch and pen); the position is remembered.
       --------------------------------------------------------- */
    const POS_KEY = "nuLimitsSagittariusPos_v1";
    let drag = null;

    function readPos() {
      try {
        const p = JSON.parse(localStorage.getItem(POS_KEY) || "null");
        if (p && typeof p.x === "number" && typeof p.y === "number") return p;
      } catch (err) { /* ignore */ }
      return null;
    }

    function writePos(p) {
      try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch (err) { /* ignore */ }
    }

    function place(x, y) {
      const r = panel.getBoundingClientRect();
      const maxX = Math.max(8, window.innerWidth - r.width - 8);
      const maxY = Math.max(8, window.innerHeight - r.height - 8);
      const nx = Math.min(Math.max(8, x), maxX);
      const ny = Math.min(Math.max(8, y), maxY);
      panel.style.left = nx + "px";
      panel.style.top = ny + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      return { x: nx, y: ny };
    }

    function restorePos() {
      const p = readPos();
      if (!p) return;
      requestAnimationFrame(() => {
        const r = panel.getBoundingClientRect();
        place(p.x, p.y);
        void r;
      });
    }

    function resetPos() {
      try { localStorage.removeItem(POS_KEY); } catch (err) { /* ignore */ }
      panel.style.left = panel.style.top = "";
      panel.style.right = "16px";
      panel.style.bottom = "calc(96px + env(safe-area-inset-bottom))";
    }

    const head = panel.querySelector(".sg-head");

    const startDrag = e => {
      if (e.target.closest("button")) return;          /* minimise / reset stay clickable */
      const r = panel.getBoundingClientRect();
      drag = {
        id: e.pointerId,
        dx: (e.touches ? e.touches[0].clientX : e.clientX) - r.left,
        dy: (e.touches ? e.touches[0].clientY : e.clientY) - r.top
      };
      panel.classList.add("is-dragging");
      try { head.setPointerCapture && e.pointerId != null && head.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    };

    const moveDrag = e => {
      if (!drag) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - drag.dx;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - drag.dy;
      place(x, y);
      e.preventDefault();
    };

    const endDrag = () => {
      if (!drag) return;
      drag = null;
      panel.classList.remove("is-dragging");
      writePos({ x: panel.getBoundingClientRect().left, y: panel.getBoundingClientRect().top });
    };

    head.addEventListener("pointerdown", startDrag);
    window.addEventListener("pointermove", moveDrag, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    head.addEventListener("touchstart", e => { if (!window.PointerEvent) startDrag(e); }, { passive: false });
    window.addEventListener("touchmove", e => { if (!window.PointerEvent) moveDrag(e); }, { passive: false });
    window.addEventListener("touchend", () => { if (!window.PointerEvent) endDrag(); });

    panel.querySelector(".sg-reset").addEventListener("click", resetPos);
    window.addEventListener("resize", () => {
      const p = readPos();
      if (p) place(p.x, p.y);
    });
    restorePos();

    function paint() {
      log.innerHTML = state.messages.map(m =>
        `<div class="sg-msg is-${m.role}"><div class="sg-bubble">${fmt(m.text)}</div></div>`
      ).join("");
      scrollDown();
    }

    function greet() {
      if (state.messages.length) return;
      state.messages.push({ role: "bot", text: window.nuLimitsSagittarius.A.help() });
      paint();
      save();
    }

    function setOpen(on) {
      state.open = on;
      root.classList.toggle("is-open", on);
      save();
      if (on) {
        greet();
        setTimeout(() => input.focus({ preventScroll: true }), 220);
        scrollDown();
      }
    }

    /* one message, typed out */
    function typeOut(text) {
      return new Promise(resolve => {
        const msg = { role: "bot", text: "" };
        state.messages.push(msg);
        const el = document.createElement("div");
        el.className = "sg-msg is-bot";
        el.innerHTML = `<div class="sg-bubble"></div>`;
        log.appendChild(el);
        const bubble = el.querySelector(".sg-bubble");

        let i = 0;
        const step = Math.max(1, Math.round(text.length / 90));
        const tick = window.setInterval(() => {
          i += step;
          msg.text = text.slice(0, i);
          bubble.innerHTML = fmt(msg.text);
          scrollDown();
          if (i >= text.length) {
            window.clearInterval(tick);
            msg.text = text;
            save();
            resolve();
          }
        }, 16);

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          window.clearInterval(tick);
          msg.text = text;
          bubble.innerHTML = fmt(text);
          save();
          resolve();
        }
      });
    }

    async function ask(question) {
      if (!question.trim() || state.busy) return;

      state.busy = true;
      root.classList.add("is-thinking");
      status.textContent = "searching your empire…";

      state.messages.push({ role: "user", text: question });
      paint();

      /* the LED blink is the tell — give it a beat so it reads */
      await new Promise(r => setTimeout(r, 520));

      const text = window.nuLimitsSagittarius.answer(question);

      root.classList.remove("is-thinking");
      status.textContent = "on device · ready";
      await typeOut(text);

      state.busy = false;
    }

    root.querySelector(".sg-form").addEventListener("submit", e => {
      e.preventDefault();
      const q = input.value;
      input.value = "";
      ask(q);
    });

    root.querySelector(".sg-min").addEventListener("click", () => setOpen(false));
    launch.addEventListener("click", () => setOpen(!state.open));

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && state.open) setOpen(false);
    });

    paint();
    if (state.open) { root.classList.add("is-open"); greet(); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
