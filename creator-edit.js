/* ==========================================================
   NU LIMITS — CREATOR EDIT MODE
   Round 8b

   Every creator catalogue entry is editable when Edit Mode is
   on (Home → Settings): channel, gear and prices, content
   formats, milestones. Add and delete are supported too.

   Reads/writes through window.nuLimitsCreator.
   ========================================================== */

(function () {
  "use strict";

  const C = window.nuLimitsCreator;
  if (!C) return;

  const esc = C.esc;
  const money = C.money;

  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());

  function toast(msg, bad) {
    if (window.__crToast) return window.__crToast(msg, bad);
  }
  const rerender = () => { if (window.renderCreator) window.renderCreator(); };

  /* ---------------------------------------------------------
     Sheet plumbing
     --------------------------------------------------------- */
  function openSheet(title, bodyHTML, onSave, onDelete) {
    const modal = document.createElement("div");
    modal.className = "mn-modal";
    modal.innerHTML = `<div class="mn-sheet">
      <header>
        <strong>${esc(title)}</strong>
        <button type="button" data-close>✕</button>
      </header>
      <div class="mn-form">
        ${bodyHTML}
        <div class="cr-edit-actions">
          ${onDelete ? '<button type="button" class="mn-mini danger" data-del>Delete</button>' : ""}
          <button type="button" class="mn-btn" data-save>Save</button>
        </div>
      </div>
    </div>`;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));

    const close = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 260);
    };

    modal.addEventListener("click", e => {
      if (e.target === modal || e.target.closest("[data-close]")) close();
    });

    const save = modal.querySelector("[data-save]");
    save.addEventListener("click", () => {
      const data = {};
      modal.querySelectorAll("[data-field]").forEach(el => {
        const key = el.dataset.field;
        if (el.type === "checkbox") data[key] = el.checked;
        else data[key] = el.value;
      });
      const res = onSave(data);
      if (!res || res.ok) {
        close();
        rerender();
        toast(res && res.message ? res.message : "Saved");
      } else {
        toast(res.why || "Could not save", true);
      }
    });

    const del = modal.querySelector("[data-del]");
    if (del && onDelete) {
      del.addEventListener("click", () => {
        if (!window.confirm("Delete this permanently?")) return;
        const res = onDelete();
        if (res && res.ok) {
          close();
          rerender();
          toast("Deleted");
        } else {
          toast((res && res.why) || "Could not delete", true);
        }
      });
    }

    return modal;
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
    if (type === "checkbox") {
      return `<label class="mn-field mn-check"><input type="checkbox" data-field="${name}"
        ${value ? "checked" : ""}> <span>${esc(label)}</span></label>`;
    }
    return `<label class="mn-field"><span>${esc(label)}</span>
      <input type="${type}" data-field="${name}" value="${esc(value)}"
        ${o.min != null ? `min="${o.min}"` : ""} ${o.max != null ? `max="${o.max}"` : ""}
        ${o.step != null ? `step="${o.step}"` : ""}></label>`;
  }

  /* ---------------------------------------------------------
     Channel
     --------------------------------------------------------- */
  function openChannel() {
    const ch = C.state.channel;
    if (!ch) return toast("Create the channel first", true);

    const nicheOptions = Object.keys(C.NICHES).map(id => [id, C.NICHES[id].label]);

    openSheet("Edit channel", `
      ${field("Channel name", "name", ch.name)}
      ${field("Content category", "niche", ch.niche, { type: "select", options: nicheOptions })}
      <p class="cr-hint">The category changes which formats you can shoot until you diversify.</p>
    `, d => C.editChannel(d));
  }

  /* ---------------------------------------------------------
     Gear / parts
     --------------------------------------------------------- */
  function slotFields(slot, item) {
    const it = item || {};
    let extra = "";

    if (["cpu", "gpu", "psu"].includes(slot)) {
      extra += field("Watts", "watts", it.watts != null ? it.watts : 100, { type: "number", min: 0, max: 2000 });
    }
    if (slot === "cpu" || slot === "mobo") {
      extra += field("Socket", "socket", it.socket || "AM4", {
        type: "select", options: [["AM4", "AM4"], ["AM5", "AM5"]]
      });
    }
    if (slot === "mobo") {
      extra += field("Memory generation", "mem", it.mem || "DDR4", {
        type: "select", options: [["DDR4", "DDR4"], ["DDR5", "DDR5"]]
      });
    }
    if (slot === "ram") {
      extra += field("Generation", "gen", it.gen || "DDR4", {
        type: "select", options: [["DDR4", "DDR4"], ["DDR5", "DDR5"]]
      });
    }
    if (slot === "cooling") {
      extra += field("Cooling level", "cool", it.cool != null ? it.cool : 1, { type: "number", min: 0, max: 6 });
    }
    if (slot === "ssd") {
      extra += field("Holds unfinished videos", "cap", it.cap != null ? it.cap : 2, { type: "number", min: 1, max: 60 });
    }
    if (slot === "internet") {
      extra += field("Upload Mbps", "up", it.up != null ? it.up : 25, { type: "number", min: 0, max: 2000 });
      extra += field("Monthly cost", "cost", it.cost != null ? it.cost : 700, { type: "number", min: 0 });
    }
    if (slot === "room") {
      extra += field("Quality bonus", "bonus", it.bonus != null ? it.bonus : 0, { type: "number", min: 0, max: 40 });
      extra += field("Monthly rent", "cost", it.cost != null ? it.cost : 0, { type: "number", min: 0 });
    }
    return extra;
  }

  function openItem(slot, id) {
    const list = C.shopOf(slot);
    const item = id ? list.find(x => x.id === id) : null;

    openSheet((item ? "Edit " : "New ") + (C.SLOT_LABEL[slot] || "item"), `
      ${field("Name", "name", item ? item.name : "")}
      ${field("Price (R)", "price", item ? item.price : 0, { type: "number", min: 0 })}
      ${field("Tier 1–4", "tier", item ? item.tier : 1, { type: "number", min: 1, max: 4 })}
      ${field("Note", "note", item ? (item.note || "") : "")}
      ${slotFields(slot, item)}
    `,
      d => {
        const patch = {
          name: d.name,
          price: Number(d.price),
          tier: Number(d.tier),
          note: d.note
        };
        ["watts", "cool", "cap", "up", "cost", "bonus"].forEach(k => {
          if (d[k] !== undefined && d[k] !== "") patch[k] = Number(d[k]);
        });
        if (d.socket) patch.socket = d.socket;
        if (d.mem) patch.mem = d.mem;
        if (d.gen) patch.gen = d.gen;
        const res = C.saveItem(slot, id, patch);
        return res.ok ? { ok: true, message: item ? "Item updated" : "Item added" } : res;
      },
      item ? () => C.deleteItem(slot, id) : null
    );
  }

  /* ---------------------------------------------------------
     Rig
     --------------------------------------------------------- */
  function openRig() {
    const idx = C.state.activePc;
    const pc = C.state.pcs[idx];
    if (!pc) return;

    openSheet("Edit rig", `
      ${field("Rig name", "name", pc.name)}
      <p class="cr-hint">The parts themselves live in the build list — edit any one of them to change performance and price.</p>
    `,
      d => C.renamePc(idx, d.name),
      () => C.removePc(idx)
    );
  }

  /* ---------------------------------------------------------
     Content formats
     --------------------------------------------------------- */
  function openType(id) {
    const t = id ? C.typeOf(id) : null;
    const need = (t && t.need) || {};

    const nicheOptions = Object.keys(C.NICHES).map(n => [n, C.NICHES[n].label]);
    const skillOptions = [["production", "Production"], ["editing", "Editing"],
                          ["streaming", "Streaming"], ["engagement", "Engagement"], ["planning", "Planning"]];

    openSheet(t ? "Edit format" : "New content format", `
      ${field("Name", "name", t ? t.name : "")}
      ${field("Category", "niche", t ? t.niche : C.state.channel.niche, { type: "select", options: nicheOptions })}
      ${field("Production days", "days", t ? t.days : 1, { type: "number", min: 1, max: 10 })}
      ${field("Cost per video (R)", "cost", t ? t.cost : 100, { type: "number", min: 0 })}
      ${field("Appeal multiplier", "appeal", t ? t.appeal : 1, { type: "number", min: 0.2, max: 3, step: "0.01" })}
      ${field("Trains skill", "skill", t ? t.skill : "production", { type: "select", options: skillOptions })}
      ${field("Needs PC performance", "needPerf", need.perf || 0, { type: "number", min: 0, max: 100 })}
      ${field("Needs mic tier (0–3)", "needMic", need.mic || 0, { type: "number", min: 0, max: 3 })}
      ${field("Needs camera tier (0–3)", "needCamera", need.camera || 0, { type: "number", min: 0, max: 3 })}
      ${field("Needs a capture card", "needCapture", !!need.capture, { type: "checkbox" })}
    `,
      d => {
        const needNext = {};
        if (Number(d.needPerf) > 0) needNext.perf = Number(d.needPerf);
        if (Number(d.needMic) > 0) needNext.mic = Number(d.needMic);
        if (Number(d.needCamera) > 0) needNext.camera = Number(d.needCamera);
        if (d.needCapture) needNext.capture = 1;

        const res = C.saveType(id, {
          name: d.name,
          niche: d.niche,
          days: Number(d.days),
          cost: Number(d.cost),
          appeal: Number(d.appeal),
          skill: d.skill,
          need: needNext
        });
        return res.ok ? { ok: true, message: t ? "Format updated" : "Format added" } : res;
      },
      t ? () => C.deleteType(id) : null
    );
  }

  /* ---------------------------------------------------------
     Milestones
     --------------------------------------------------------- */
  function openMilestone(id) {
    const list = C.milestones();
    const m = id ? list.find(x => x.id === id) : null;

    const kindOptions = [
      ["subs", "Subscribers"],
      ["views", "Total channel views"],
      ["published", "Videos published"],
      ["vidViews", "A single video's views"],
      ["streams", "Livestreams finished"],
      ["perf", "PC performance"],
      ["monetised", "Monetisation unlocked"],
      ["room", "Studio space"]
    ];

    openSheet(m ? "Edit milestone" : "New milestone", `
      ${field("Label", "label", m ? m.label : "")}
      ${field("Trigger", "kind", m ? m.kind : "subs", { type: "select", options: kindOptions })}
      ${field("Target", "target", m ? m.target : 100, { type: "text" })}
      ${field("Reward (R)", "reward", m ? m.reward : 500, { type: "number", min: 0 })}
      <p class="cr-hint">A “Studio space” target takes an item id from the space list (e.g. room3).</p>
    `,
      d => {
        let target = d.target;
        if (d.kind !== "room") target = Number(d.target) || 0;
        const res = C.saveMilestone(id, {
          label: d.label,
          kind: d.kind,
          target,
          reward: Number(d.reward)
        });
        return res.ok ? { ok: true, message: m ? "Milestone updated" : "Milestone added" } : res;
      },
      m ? () => C.deleteMilestone(id) : null
    );
  }

  window.nuLimitsCreatorEdit = {
    isOn: editOn,
    channel: openChannel,
    item: openItem,
    rig: openRig,
    type: openType,
    milestone: openMilestone
  };
})();
