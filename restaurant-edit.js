/* ==========================================================
   NU LIMITS — RESTAURANT EDIT MODE
   Round 10

   Edit Mode sheets for the restaurant: the business itself,
   every dish, every employee, every upgrade tier and every
   role wage.
   ========================================================== */

(function () {
  "use strict";

  const R = window.nuLimitsRestaurant;
  if (!R) return;
  const esc = R.esc;
  const money = R.money;

  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const rerender = () => { if (window.renderRestaurant) window.renderRestaurant(); };

  function toast(msg, bad) {
    let el = document.querySelector(".mn-toast");
    if (!el) { el = document.createElement("div"); el.className = "mn-toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.toggle("is-bad", !!bad);
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(el.__t);
    el.__t = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function field(label, name, value, opts) {
    const o = opts || {};
    const type = o.type || "text";
    if (type === "select") {
      return `<label class="mn-field"><span>${esc(label)}</span>
        <select data-field="${name}">
          ${(o.options || []).map(([v, t]) =>
            `<option value="${esc(v)}"${String(value) === String(v) ? " selected" : ""}>${esc(t)}</option>`).join("")}
        </select></label>`;
    }
    return `<label class="mn-field"><span>${esc(label)}</span>
      <input type="${type}" data-field="${name}" value="${esc(value)}"
        ${o.min != null ? `min="${o.min}"` : ""} ${o.max != null ? `max="${o.max}"` : ""}
        ${o.step != null ? `step="${o.step}"` : ""}></label>`;
  }

  function openSheet(title, bodyHTML, onSave, onDelete) {
    const modal = document.createElement("div");
    modal.className = "mn-modal";
    modal.innerHTML = `<div class="mn-sheet">
      <header><strong>${esc(title)}</strong><button type="button" data-close>✕</button></header>
      <div class="mn-form">
        ${bodyHTML}
        <div class="rs-edit-actions">
          ${onDelete ? '<button type="button" class="mn-mini danger" data-del>Delete</button>' : ""}
          <button type="button" class="mn-btn" data-save>Save</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));

    const close = () => { modal.classList.remove("show"); setTimeout(() => modal.remove(), 260); };
    modal.addEventListener("click", e => {
      if (e.target === modal || e.target.closest("[data-close]")) close();
    });

    modal.querySelector("[data-save]").addEventListener("click", () => {
      const data = {};
      modal.querySelectorAll("[data-field]").forEach(el => { data[el.dataset.field] = el.value; });
      const res = onSave(data);
      if (!res || res.ok) {
        close();
        rerender();
        toast((res && res.message) || "Saved");
      } else toast(res.why || "Could not save", true);
    });

    const del = modal.querySelector("[data-del]");
    if (del && onDelete) {
      del.addEventListener("click", () => {
        if (!window.confirm("Delete this permanently?")) return;
        const res = onDelete();
        if (res && res.ok) { close(); rerender(); toast("Deleted"); }
        else toast((res && res.why) || "Could not delete", true);
      });
    }
    return modal;
  }

  /* ---------------------------------------------------------
     Restaurant profile
     --------------------------------------------------------- */
  function profile() {
    const s = R.state;
    openSheet("Restaurant details", `
      ${field("Name", "name", s.name)}
      ${field("Concept", "cuisine", s.cuisine, {
        type: "select",
        options: Object.keys(R.CUISINES).map(k => [k, R.CUISINES[k].label])
      })}
      ${field("Purchase price (R)", "purchasePrice", s.purchasePrice, { type: "number", min: 0 })}
      <p class="rs-hint">The concept changes the pull of the room slightly. The purchase price only matters before you buy.</p>
    `, d => R.editProfile({
      name: d.name,
      cuisine: d.cuisine,
      purchasePrice: Number(d.purchasePrice)
    }));
  }

  /* ---------------------------------------------------------
     Dish
     --------------------------------------------------------- */
  function dish(id) {
    const item = id ? R.state.menu[id] : null;
    const cats = Array.from(new Set(Object.keys(R.state.menu).map(k => R.state.menu[k].cat)));
    if (!cats.length) cats.push("Food");
    if (item && !cats.includes(item.cat)) cats.push(item.cat);

    openSheet(item ? "Edit dish" : "New dish", `
      ${field("Name", "name", item ? item.name : "")}
      ${field("Category", "cat", item ? item.cat : "Food", { type: "select", options: cats.map(c => [c, c]) })}
      ${field("Menu price (R)", "price", item ? item.price : 120, { type: "number", min: 0 })}
      ${field("Food cost (R)", "cost", item ? item.cost : 40, { type: "number", min: 0 })}
      ${field("Prep days", "prep", item ? item.prep : 6, { type: "number", min: 1, max: 30 })}
      ${field("Popularity", "appeal", item ? item.appeal : 1, { type: "number", min: 0.2, max: 2, step: "0.05" })}
      ${field("Plate quality", "q", item ? item.q : 1, { type: "number", min: 0.5, max: 1.6, step: "0.05" })}
      <p class="rs-hint">The market price is remembered from the original menu — push above it and covers drop.</p>
    `,
      d => R.editMenu(id, {
        name: d.name, emoji: d.emoji || "", cat: d.cat,
        price: Math.max(10, Number(d.price) || 10),
        cost: Math.max(0, Number(d.cost) || 0),
        prep: Math.max(1, Number(d.prep) || 1),
        appeal: Number(d.appeal) || 1,
        q: Number(d.q) || 1
      }),
      item ? () => R.deleteMenu(id) : null
    );
  }

  /* ---------------------------------------------------------
     Employee
     --------------------------------------------------------- */
  function employee(id) {
    const emp = R.state.staff.find(s => s.id === id);
    if (!emp) return toast("Employee not found", true);
    openSheet("Edit employee", `
      ${field("Name", "name", emp.name)}
      ${field("Skill (1–5)", "skill", emp.skill, { type: "number", min: 1, max: 5, step: "0.1" })}
      ${field("Daily wage (R)", "wage", emp.wage, { type: "number", min: 0 })}
      ${field("Morale (0–100)", "morale", Math.round(emp.morale), { type: "number", min: 0, max: 100 })}
      <p class="rs-hint">Role is ${esc(R.roleDef(emp.role).label)}. Promotions happen from the staff list, not here.</p>
    `, d => R.editEmployee(id, {
      name: d.name, skill: Number(d.skill), wage: Number(d.wage), morale: Number(d.morale)
    }));
  }

  /* ---------------------------------------------------------
     Upgrade tier
     --------------------------------------------------------- */
  function upgrade(id, level) {
    const item = R.upgradeList().find(u => u.id === id);
    if (!item) return toast("Upgrade not found", true);
    const idx = Math.max(0, Math.min(item.tiers.length - 1, level));
    const tier = item.tiers[idx];
    const fx = tier.fx || {};

    openSheet(`Edit ${item.name}`, `
      ${field("Upgrade name", "name", item.name)}
      ${field("Tier label", "label", tier.label)}
      ${field("Tier price (R)", "price", tier.price, { type: "number", min: 0 })}
      <div class="rs-edit-note">Tier ${idx + 1} of ${item.tiers.length} — these effects apply when this level is the one you own.</div>
      ${field("Kitchen points", "fast", fx.fast || 0, { type: "number", min: 0 })}
      ${field("Quality points", "q", fx.q || 0, { type: "number", min: 0 })}
      ${field("Seats", "seats", fx.seats || 0, { type: "number", min: 0 })}
      ${field("Extra seats (terrace)", "seatsAdd", fx.seatsAdd || 0, { type: "number", min: 0 })}
      ${field("Draw charm %", "charm", fx.charm || 0, { type: "number", min: 0 })}
      ${field("Table turns", "turns", fx.turns || 0, { type: "number", min: 0, step: "0.1" })}
      ${field("Staff cap", "staff", fx.staff || 0, { type: "number", min: 0 })}
      ${field("Delivery capacity", "online", fx.online || 0, { type: "number", min: 0 })}
      ${field("Host capacity", "host", fx.host || 0, { type: "number", min: 0 })}
      ${field("Waste %", "waste", fx.waste || 0, { type: "number", min: 0, max: 40 })}
      ${field("Monthly rent (R)", "rent", fx.rent || 0, { type: "number", min: 0 })}
      ${field("Floor space (m²)", "space", fx.space || 0, { type: "number", min: 0 })}
    `, d => {
      const out = {};
      ["fast", "q", "seats", "seatsAdd", "charm", "turns", "staff", "online", "host", "waste", "rent", "space"].forEach(k => {
        const v = Number(d[k]);
        if (Number.isFinite(v) && v > 0) out[k] = v;
        else if (k === "waste" && v === 0) out[k] = 0;
      });
      return R.editUpgrade(id, idx, {
        name: d.name,
        label: d.label,
        price: Number(d.price),
        fx: out
      });
    });
  }

  /* ---------------------------------------------------------
     Role wages
     --------------------------------------------------------- */
  function wages() {
    const roles = R.roleDefAll();
    const list = Object.keys(roles).filter(id => roles[id].label);
    openSheet("Role wages", `
      <p class="rs-hint">Base daily wage per role. New hires are priced from this plus their skill.</p>
      ${list.map(id => field(roles[id].label, "role_" + id, roles[id].wage, { type: "number", min: 0 })).join("")}
    `, d => {
      list.forEach(id => R.editRole(id, { wage: Number(d["role_" + id]) }));
      return { ok: true, message: "Wages updated" };
    });
  }

  /* ---------------------------------------------------------
     All 35 levels of one upgrade — prices and labels
     --------------------------------------------------------- */
  function levels(id) {
    const item = R.upgradeList().find(u => u.id === id);
    if (!item) return toast("Upgrade not found", true);

    const rows = item.tiers.map((t, i) => `
      <div class="rs-lev">
        <span class="rs-lev-n">L${i + 1}</span>
        <input type="text" maxlength="24" data-lab="${i}" value="${esc(t.label)}">
        <input type="number" min="0" step="500" data-price="${i}" value="${t.price}">
      </div>`).join("");

    const modal = openSheet(`Levels · ${item.name}`, `
      <p class="rs-hint">${item.tiers.length} levels. Each level costs more than the one before it — level 1 is the kit you start with.</p>
      <div class="rs-levs">${rows}</div>
    `, () => ({ ok: true }), null);

    const saveBtn = modal.querySelector("[data-save]");
    saveBtn.addEventListener("click", e => {
      e.stopImmediatePropagation();
      modal.querySelectorAll("[data-price]").forEach(el => {
        const i = Number(el.dataset.price);
        const lab = modal.querySelector(`[data-lab="${i}"]`);
        R.setTier(id, i, { price: Number(el.value) || 0, label: lab ? lab.value : undefined });
      });
      modal.querySelector("[data-close]").click();
      rerender();
      toast(`${item.name} levels saved`);
    }, true);
  }

  window.nuLimitsRestaurantEdit = { isOn: editOn, profile, dish, employee, upgrade, levels, wages };
})();
