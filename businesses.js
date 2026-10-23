/* ==========================================================
   NU LIMITS — BUSINESSES  (round 8b)

   The Business tab is a portfolio list. Each business is a row
   you enter; YouTube Creator Studio is the first one. New
   businesses can be added, edited and deleted in Edit Mode.

   Save: nuLimitsBusinesses_v1
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsBusinesses_v1";
  const PHOTO_SIZE = 736;

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const uid = () => "bz_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());

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

  const ICON_PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6"/><path d="M10 11v6M14 11v6"/></svg>';

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  function defaults() {
    return [{
      id: "youtube",
      type: "creator",
      name: "YouTube Creator Studio",
      blurb: "Build a channel, an audience and a creator business.",
      photo: "images/creator/gaming.jpg"
    }, {
      id: "restaurant",
      type: "restaurant",
      name: "Restaurant",
      blurb: "A 24-seat corner bistro. Capital required before the doors open.",
      photo: "images/restaurant/hero.jpg"
    }, {
      id: "coffee", type: "venture", name: "NU Roast Coffee",
      blurb: "Specialty coffee house — buy it, staff it, then let the morning rush pay.",
      photo: "images/coffee/cafe-hero.jpg"
    }, {
      id: "logistics", type: "venture", name: "NU Limits Logistics",
      blurb: "Courier depot — trucks, drivers and long hauls, paid per load.",
      photo: "images/ventures/logistics-hero.jpg"
    }, {
      id: "games", type: "venture", name: "Level Up Games",
      blurb: "Console and game store — PlayStation and Xbox on the shelf.",
      photo: "images/creator/gaming.jpg"
    }, {
      id: "motors", type: "venture", name: "NU Motors",
      blurb: "Car dealership — buy the stock, prep it, sell it on.",
      photo: "images/cars/bmw.jpg"
    }];
  }

  function normalize(b) {
    return {
      id: b && b.id ? String(b.id) : uid(),
      type: b && b.type ? String(b.type) : "custom",
      name: String((b && b.name) || "New business").slice(0, 48),
      blurb: String((b && b.blurb) || "").slice(0, 120),
      photo: String((b && b.photo) || "")
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && Array.isArray(saved.items)) {
          const items = saved.items.map(normalize);
          defaults().forEach(d => {
            if (!items.some(i => i.id === d.id)) items.unshift(normalize(d));
          });
          return items;
        }
      }
    } catch (err) { /* fall through */ }
    const fresh = defaults().map(normalize);
    persist(fresh);
    return fresh;
  }

  function persist(list) {
    try { localStorage.setItem(KEY, JSON.stringify({ version: 1, items: list || state })); }
    catch (err) { toast("Couldn't save — the photo may be too large.", true); }
  }

  let state = load();

  /* round 37 — the bistro is just "Restaurant" now */
  (function renameRestaurant() {
    let touched = false;
    state.forEach(b => {
      if (b.type === "restaurant" && /copper pot/i.test(b.name)) { b.name = "Restaurant"; touched = true; }
    });
    if (touched) persist(state);
  })();

  /* ---------------------------------------------------------
     Live subtitle for the creator business
     --------------------------------------------------------- */
  function subtitleFor(b) {
    if (b.type === "venture" && window.nuLimitsVentures) {
      return window.nuLimitsVentures.summary(b.id).sub;
    }
    if (b.type === "restaurant") {
      const Rs = window.nuLimitsRestaurant;
      if (!Rs) return "Restaurant";
      const st = Rs.state;
      if (!st.owned) return `For sale · ${Rs.money(Rs.purchasePrice())} capital required`;
      const last = st.stats ? `${st.stats.covers} covers` : "opening soon";
      return `${last} · ${Rs.stars().toFixed(1)}★ · ${Rs.money(Math.round(st.cash))} in the till`;
    }
    if (b.type !== "creator") return "Placeholder — edit it in Edit Mode";
    const C = window.nuLimitsCreator;
    if (!C || !C.state || !C.state.channel) return "Not started · tap to set up";
    const ch = C.state.channel;
    return `${ch.name} · ${Math.round(C.state.subs).toLocaleString("en-ZA")} subs · ${C.NICHES[ch.niche].label}`;
  }

  function statusFor(b) {
    if (b.type === "venture" && window.nuLimitsVentures) {
      const sm = window.nuLimitsVentures.summary(b.id);
      return [sm.status, sm.cls];
    }
    if (b.type === "restaurant") {
      const Rs = window.nuLimitsRestaurant;
      if (!Rs || !Rs.state.owned) return ["For sale", ""];
      if (Rs.state.cash < 0) return ["Overdrawn", "bad"];
      return ["Trading", "good"];
    }
    if (b.type !== "creator") return ["Draft", ""];
    const C = window.nuLimitsCreator;
    if (!C || !C.state.channel) return ["New", ""];
    return C.isMonetised() ? ["Monetised", "good"] : ["Active", ""];
  }

  /* ---------------------------------------------------------
     Page
     --------------------------------------------------------- */
  function businessCard(b) {
    const [status, cls] = statusFor(b);
    const V = window.nuLimitsVentures;
    const shownName = (b.type === "venture" && V) ? V.name(b.id) : b.name;
    const shownPhoto = (b.type === "venture" && V) ? V.photo(b.id) : b.photo;
    const tools = editOn() ? `<div class="bz-tools">
        <button type="button" data-bz="edit" data-id="${esc(b.id)}" aria-label="Edit business">${ICON_PEN}</button>
        ${b.type === "creator" || b.type === "restaurant" ? "" : `<button type="button" data-bz="delete" data-id="${esc(b.id)}" aria-label="Delete business">${ICON_TRASH}</button>`}
      </div>` : "";

    return `<article class="bz-card" data-bz-open="${esc(b.id)}">
      <div class="bz-photo" ${shownPhoto ? `style="background-image:url('${esc(shownPhoto)}')"` : ""}>
        ${shownPhoto ? "" : '<span class="bz-photo-empty">NO PHOTO</span>'}
        ${tools}
      </div>
      <div class="bz-body">
        <div class="bz-body-top">
          <h2>${esc(shownName)}</h2>
          <span class="bz-status ${cls}">${esc(status)}</span>
        </div>
        <p class="bz-sub">${esc(subtitleFor(b))}</p>
        ${b.blurb ? `<p class="bz-blurb">${esc(b.blurb)}</p>` : ""}
        <span class="bz-enter">Open <i aria-hidden="true">→</i></span>
      </div>
    </article>`;
  }

  function pageHTML() {
    return `<section class="dynamic-page-content bz-page">
      <div class="bz-head">
        <p class="eyebrow">NU LIMITS / BUSINESS</p>
        <h1>Businesses</h1>
        <p class="muted">${state.length} businesses · buy one first, then run it day by day.</p>
      </div>

      <div class="bz-list">
        ${state.map(businessCard).join("")}
        ${editOn() ? `<button class="bz-add" type="button" data-bz="add">
            <span class="plus">+</span>
            <strong>Add business</strong>
            <small>Name it, give it a cover</small>
          </button>` : ""}
      </div>

      ${!state.length ? `<p class="bz-empty">Nothing here yet.</p>` : ""}
    </section>`;
  }

  function render() {
    const root = document.getElementById("dynamic-page");
    if (!root) return null;
    root.innerHTML = pageHTML();
    const main = document.getElementById("main-content");
    if (main) main.hidden = true;
    root.hidden = false;
    return root;
  }

  /* ---------------------------------------------------------
     Editor
     --------------------------------------------------------- */
  function openEditor(id) {
    const b = id ? state.find(x => x.id === id) : null;
    const isNew = !b;

    const modal = document.createElement("div");
    modal.className = "mn-modal";
    modal.innerHTML = `<div class="mn-sheet">
      <header>
        <strong>${isNew ? "Add business" : "Edit business"}</strong>
        <button type="button" data-close>✕</button>
      </header>
      <div class="mn-form">
        <label class="mn-field"><span>Name</span>
          <input type="text" data-field="name" maxlength="48" value="${esc(b ? b.name : "")}">
        </label>
        <label class="mn-field"><span>One-line description</span>
          <input type="text" data-field="blurb" maxlength="120" value="${esc(b ? b.blurb : "")}">
        </label>
        <label class="mn-field"><span>Cover photo</span>
          <input type="file" accept="image/*" data-photo>
        </label>
        <div class="mn-photo-row">
          <div class="mn-photo-thumb" data-thumb
               ${b && b.photo ? `style="background-image:url('${esc(b.photo)}')"` : ""}></div>
          <div class="mn-photo-actions">
            <button type="button" class="mn-mini" data-clear>Remove photo</button>
          </div>
        </div>
        <div class="cr-edit-actions">
          ${!isNew && b.type !== "creator" && b.type !== "restaurant" ? '<button type="button" class="mn-mini danger" data-del>Delete</button>' : ""}
          <button type="button" class="mn-btn" data-save>Save</button>
        </div>
      </div>
    </div>`;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));

    let photo = b ? b.photo : "";

    const thumb = modal.querySelector("[data-thumb]");
    const paintThumb = () => {
      thumb.style.backgroundImage = photo ? `url('${photo}')` : "";
    };

    const close = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 260);
    };

    modal.addEventListener("click", e => {
      if (e.target === modal || e.target.closest("[data-close]")) close();
    });

    modal.querySelector("[data-clear]").addEventListener("click", () => {
      photo = "";
      paintThumb();
    });

    modal.querySelector("[data-photo]").addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, PHOTO_SIZE / Math.max(img.width, img.height));
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          photo = canvas.toDataURL("image/jpeg", 0.74);
          paintThumb();
        };
        img.src = String(ev.target.result);
      };
      reader.readAsDataURL(file);
    });

    modal.querySelector("[data-save]").addEventListener("click", () => {
      const name = modal.querySelector('[data-field="name"]').value.trim();
      const blurb = modal.querySelector('[data-field="blurb"]').value.trim();
      if (name.length < 2) return toast("Give the business a name", true);

      if (isNew) {
        state.push(normalize({ id: uid(), name, blurb, photo, type: "custom" }));
      } else {
        b.name = name;
        b.blurb = blurb;
        b.photo = photo;
      }
      persist();
      close();
      render();
      toast(isNew ? "Business added" : "Business updated");
    });

    const del = modal.querySelector("[data-del]");
    if (del) {
      del.addEventListener("click", () => {
        if (!window.confirm("Delete this business?")) return;
        state = state.filter(x => x.id !== id);
        persist(state);
        close();
        render();
        toast("Business deleted");
      });
    }
  }

  /* ---------------------------------------------------------
     Routing
     --------------------------------------------------------- */
  const prevNavigate = window.navigateTo;

  window.navigateTo = function (page) {
    if (page === "business") {
      document.querySelectorAll(".nav-item").forEach(b =>
        b.classList.toggle("active", b.dataset.page === "business"));
      if (typeof window.nuLimitsInvestLeave === "function") window.nuLimitsInvestLeave();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    return prevNavigate.apply(this, arguments);
  };

  document.addEventListener("click", e => {
    const scope = e.target.closest("#dynamic-page .bz-page");
    if (!scope) return;

    const tool = e.target.closest("[data-bz]");
    if (tool) {
      const act = tool.dataset.bz;
      if (act === "add") return openEditor(null);
      if (act === "edit") return openEditor(tool.dataset.id);
      if (act === "delete") {
        if (!window.confirm("Delete this business?")) return;
        state = state.filter(x => x.id !== tool.dataset.id);
        persist(state);
        render();
        toast("Business deleted");
        return;
      }
    }

    const card = e.target.closest("[data-bz-open]");
    if (!card) return;

    const b = state.find(x => x.id === card.dataset.bzOpen);
    if (!b) return;

    if (b.type === "creator") {
      window.navigateTo("creator");
    } else if (b.type === "restaurant") {
      window.navigateTo("restaurant");
    } else if (b.type === "venture" && window.nuLimitsVentures) {
      window.nuLimitsVentures.open(b.id);
    } else {
      toast("This business is a placeholder — edit it in Edit Mode");
    }
  });

  if (window.nuLimitsEditMode && window.nuLimitsEditMode.onChange) {
    window.nuLimitsEditMode.onChange(() => {
      if (document.querySelector(".bz-page")) render();
    });
  }

  window.renderBusinesses = render;
  window.nuLimitsBusinessesRefresh = () => { state = load(); if (document.querySelector(".bz-page")) render(); };
  window.nuLimitsBusinesses = {
    get list() { return state.slice(); },
    render,
    open: id => openEditor(id)
  };
})();
