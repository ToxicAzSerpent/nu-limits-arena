/* ==========================================================
   NU LIMITS — CREATOR BUSINESS  ·  INTERFACE
   Round 8
   ========================================================== */

(function () {
  "use strict";

  const C = window.nuLimitsCreator;
  if (!C) return;

  const esc = C.esc;
  const money = C.money;
  const st = () => C.state;

  let tab = "dash";
  let streamHours = 1;
  let streamQuality = "q1080";
  let diversifyNiche = null;

  const root = () => document.getElementById("dynamic-page");
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const E = () => window.nuLimitsCreatorEdit;
  const ICON_PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const fmt = n => Math.round(Number(n) || 0).toLocaleString("en-ZA");

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

  /* ---------------------------------------------------------
     Shell
     --------------------------------------------------------- */
  function hero() {
    const s = st();
    const niche = C.NICHES[s.channel.niche];
    const live = s.live ? '<span class="cr-live-dot">● LIVE</span>' : "";
    return `<div class="cr-hero" style="background-image:url('${niche.photo}')">
      <div class="cr-hero-in">
        <p class="eyebrow">NU LIMITS / CREATOR BUSINESS</p>
        <h1>${esc(s.channel.name)} ${live}</h1>
        <p>${esc(niche.label)} · ${fmt(s.subs)} subscribers · ${fmt(s.totalViews)} views</p>
      </div>
    </div>`;
  }

  function stats() {
    const s = st();
    const p = C.perf();
    return `<div class="cr-stats">
      <div class="cr-stat"><small>SUBS</small><strong>${fmt(s.subs)}</strong></div>
      <div class="cr-stat"><small>VIEWS</small><strong>${fmt(s.totalViews)}</strong></div>
      <div class="cr-stat"><small>REPUTATION</small><strong>${Math.round(s.reputation)}</strong></div>
      <div class="cr-stat is-accent"><small>PC PERF.</small><strong>${p}</strong></div>
    </div>`;
  }

  function tabs() {
    const s = st();
    const ready = s.videos.filter(v => v.status === "ready").length;
    const producing = s.videos.filter(v => v.status === "producing").length;
    const items = [
      ["dash", "Dashboard", 0],
      ["studio", "Studio", 0],
      ["produce", "Produce", producing],
      ["publish", "Publish", ready],
      ["live", "Live", s.live ? 1 : 0]
    ];
    return `<div class="cr-tabs">
      ${items.map(([id, label, badge]) => `<button type="button" data-cr="tab" data-tab="${id}"
        class="${tab === id ? "active" : ""}">${label}${badge ? `<span class="cr-badge">${badge}</span>` : ""}</button>`).join("")}
    </div>`;
  }

  /* ---------------------------------------------------------
     Onboarding
     --------------------------------------------------------- */
  function onboard() {
    return `<div class="cr-onboard">
      <p class="eyebrow">START A BUSINESS</p>
      <h1>YouTube Content Creator</h1>
      <p class="cr-lead">Build a channel from a bedroom desk to a professional studio. Choose a niche,
      buy the right gear, produce videos, go live, and grow an audience that pays.</p>

      <div class="cr-field">
        <label for="cr-channel-name">Channel name</label>
        <input id="cr-channel-name" type="text" maxlength="28" placeholder="e.g. Obey After Dark" autocomplete="off">
      </div>

      <p class="eyebrow" style="margin:0 0 8px">CONTENT CATEGORY</p>
      <div class="cr-niches" id="cr-niches">
        ${Object.keys(C.NICHES).map((id, i) => {
          const n = C.NICHES[id];
          return `<button type="button" class="cr-niche${i === 0 ? " is-on" : ""}"
            data-cr="niche" data-niche="${id}" style="background-image:url('${n.photo}')">
            <span><b>${esc(n.label)}</b><small>${esc(n.blurb)}</small></span>
          </button>`;
        }).join("")}
      </div>

      <button class="cr-primary" type="button" data-cr="create">Create my channel</button>
      <p class="cr-hint">Comes with a starter rig, a headset mic, a phone camera and a bedroom corner.
      Your balance stays with the rest of the empire.</p>
    </div>`;
  }

  /* ---------------------------------------------------------
     Dashboard
     --------------------------------------------------------- */
  function trendBoard() {
    const s = st();
    const levels = C.TREND_LEVELS;
    return `<div class="cr-card">
      <div class="cr-card-head">
        <h2>Trends right now</h2>
        <button class="cr-mini-btn" type="button" data-cr="refresh-trends">Refresh</button>
      </div>
      <div class="cr-trends">
        ${Object.keys(C.NICHES).map(id => {
          const lv = C.trendOf(id);
          const notes = { low: "Quiet audience", normal: "Steady demand", high: "Audience surging", viral: "Everyone is watching" };
          return `<div class="cr-trend is-${lv}">
            <div><b>${esc(C.NICHES[id].label)}</b><small>${notes[lv]}</small></div>
            <i>${C.TREND_LABEL[lv]}</i>
          </div>`;
        }).join("")}
      </div>
      <p class="cr-hint">Trends shift every few game days. They raise the ceiling — they don't guarantee a hit.</p>
    </div>`;
  }

  function moneyCard() {
    const s = st();
    const monetised = C.isMonetised();
    const subPct = Math.min(100, (s.subs / C.MONETISE_SUBS) * 100);
    const viewPct = Math.min(100, (s.totalViews / C.MONETISE_VIEWS) * 100);
    const profit = s.fin.net - s.fin.expenses;
    return `<div class="cr-card">
      <div class="cr-card-head">
        <h2>Business dashboard</h2>
        <span class="cr-tag ${monetised ? "good" : ""}">${monetised ? "MONETISED" : "PRE-MONETISATION"}</span>
      </div>

      <div class="cr-row"><div class="cr-row-main"><b>Gross advertising</b><small>Before the platform's cut</small></div><b>${money(s.fin.gross)}</b></div>
      <div class="cr-row"><div class="cr-row-main"><b>Platform share</b><small>${Math.round(C.PLATFORM_SHARE * 100)} % to YouTube</small></div><b>−${money(s.fin.gross * C.PLATFORM_SHARE)}</b></div>
      ${s.fin.sponsor ? `<div class="cr-row"><div class="cr-row-main"><b>Sponsorships</b><small>Brand deals on strong uploads</small></div><b>${money(s.fin.sponsor)}</b></div>` : ""}
      <div class="cr-row"><div class="cr-row-main"><b>Net creator earnings</b><small>Ads, donations and streams</small></div><b>${money(s.fin.net)}</b></div>
      <div class="cr-row"><div class="cr-row-main"><b>Operating expenses</b><small>Production, gear, power, rent</small></div><b>−${money(s.fin.expenses)}</b></div>
      <div class="cr-row"><div class="cr-row-main"><b>Profit</b><small>Lifetime, this business</small></div><b style="color:${profit >= 0 ? "#14795A" : "#B7452F"}">${money(profit)}</b></div>

      ${monetised ? "" : `<div style="margin-top:12px">
        <p class="cr-sub" style="margin-bottom:7px">Monetisation unlocks at ${fmt(C.MONETISE_SUBS)} subs and ${fmt(C.MONETISE_VIEWS)} views.</p>
        <div class="cr-skill"><b>Subscribers</b><div class="cr-bar"><i style="width:${subPct}%"></i></div><span>${Math.round(subPct)}%</span></div>
        <div class="cr-skill"><b>Views</b><div class="cr-bar"><i style="width:${viewPct}%"></i></div><span>${Math.round(viewPct)}%</span></div>
      </div>`}
    </div>`;
  }

  function skillsCard() {
    const s = st();
    const labels = { production: "Production", editing: "Editing", streaming: "Streaming", engagement: "Engagement", planning: "Planning" };
    return `<div class="cr-card">
      <div class="cr-card-head"><h2>Creator skills</h2><span class="cr-tag">LVL ${Math.floor(C.skillAvg() / 5) + 1}</span></div>
      ${Object.keys(labels).map(k => `<div class="cr-skill">
        <b>${labels[k]}</b>
        <div class="cr-bar"><i style="width:${C.skillValue(k)}%"></i></div>
        <span>${C.skillValue(k)}</span>
      </div>`).join("")}
      <p class="cr-hint">Skills sharpen with every upload and stream. They improve the odds — never a guarantee.</p>
    </div>`;
  }

  function milestonesCard() {
    const s = st();
    const list = C.milestones();
    const done = list.filter(m => s.milestones[m.id]).length;
    return `<div class="cr-card">
      <div class="cr-card-head"><h2>Milestones</h2>
        ${editOn() ? `<button class="cr-mini-btn" type="button" data-cr="add-milestone">+ Add</button>` : `<span class="cr-tag">${done} / ${list.length}</span>`}
      </div>
      ${list.map(m => `<div class="cr-ms ${s.milestones[m.id] ? "done" : ""}">
        <span class="cr-ms-ico">${s.milestones[m.id] ? "✓" : "·"}</span>
        <div class="cr-ms-text">
          <b>${esc(m.label)}</b>
          <span>${s.milestones[m.id] ? "DONE" : money(m.reward)}</span>
        </div>
        ${editOn() ? `<button class="cr-row-edit" type="button" data-cr="edit-milestone"
          data-id="${esc(m.id)}" aria-label="Edit milestone" title="Edit">${ICON_PEN}</button>` : ""}
      </div>`).join("")}
    </div>`;
  }

  function recentCard() {
    const s = st();
    const pub = s.videos.filter(v => v.status === "published").slice(0, 4);
    if (!pub.length) return "";
    return `<div class="cr-card">
      <div class="cr-card-head"><h2>Recent uploads</h2><button class="cr-mini-btn" type="button" data-cr="tab" data-tab="publish">All</button></div>
      ${pub.map(v => `<div class="cr-published">
        <div><b>${esc(v.title)}</b><small>${esc(typeName(v.type))} · quality ${v.quality}</small></div>
        <span>${fmt(v.views)} views<br><small style="color:#91867A">+${fmt(v.subsGained)} subs</small></span>
      </div>`).join("")}
    </div>`;
  }

  function healthCard() {
    const s = st();
    const niche = s.channel.niche;
    const lv = C.trendOf(niche);
    return `<div class="cr-card">
      <div class="cr-card-head"><h2>Channel health</h2>
        <span class="cr-tag ${lv === "viral" ? "good" : ""}">${esc(C.TREND_LABEL[lv])} trend</span>
      </div>
      <div class="cr-skill"><b>Reputation</b>
        <div class="cr-bar"><i style="width:${Math.round(s.reputation)}%"></i></div>
        <span>${Math.round(s.reputation)}</span>
      </div>
      <div class="cr-skill"><b>Consistency</b>
        <div class="cr-bar ${s.consistency > 60 ? "is-cool" : "is-warn"}"><i style="width:${Math.round(s.consistency)}%"></i></div>
        <span>${Math.round(s.consistency)}</span>
      </div>
      <p class="cr-hint">Upload on schedule to keep consistency up. Your niche is trending ${C.TREND_LABEL[lv].toLowerCase()} right now.</p>
    </div>`;
  }

  function editCard() {
    if (!editOn()) return "";
    return `<div class="cr-card cr-editcard">
      <div class="cr-card-head"><h2>Edit Mode is on</h2><span class="cr-tag">creator</span></div>
      <p class="cr-sub">Everything in this business is editable — the channel, every piece of gear and its price, every content format and every milestone.</p>
      <div class="cr-editgrid">
        <button type="button" data-cr="edit-channel">Edit channel</button>
        <button type="button" data-cr="edit-gear">Gear &amp; prices</button>
        <button type="button" data-cr="add-type">Add format</button>
        <button type="button" data-cr="add-milestone">Add milestone</button>
      </div>
    </div>`;
  }

  const dashboard = () => hero() + stats() + tabs() + editCard() + healthCard() + trendBoard() + moneyCard() + skillsCard() + milestonesCard() + recentCard();

  /* ---------------------------------------------------------
     Studio
     --------------------------------------------------------- */
  function pips(tier) {
    let out = '<span class="cr-pips">';
    for (let i = 1; i <= 4; i++) out += `<span class="${i <= tier ? "on" : ""}"></span>`;
    return out + "</span>";
  }

  function slotRow(slot) {
    const item = C.part(slot);
    return `<div class="cr-row">
      <div class="cr-row-main">
        <b>${esc(C.SLOT_LABEL[slot])}</b>
        <small>${item ? esc(item.name) + pips(item.tier) : "Nothing installed"}</small>
      </div>
      ${editOn() && item ? `<button class="cr-row-edit" type="button" data-cr="edit-item"
        data-slot="${slot}" data-id="${esc(item.id)}" aria-label="Edit ${esc(item.name)}" title="Edit">${ICON_PEN}</button>` : ""}
      <button class="cr-row-act soft" type="button" data-cr="shop" data-slot="${slot}">${item ? "Change" : "Add"}</button>
    </div>`;
  }

  function perfCard() {
    const p = C.perf();
    const d = C.perfDetail();
    const pc = st().pcs[st().activePc];
    const disk = C.storage();
    const cls = p >= 60 ? "is-cool" : p >= 35 ? "" : "is-warn";
    return `<div class="cr-card">
      <div class="cr-card-head">
        <h2>${esc(pc.name)}</h2>
        ${editOn()
          ? `<span class="cr-head-tools">
               <button class="cr-row-edit" type="button" data-cr="edit-rig" aria-label="Edit rig" title="Edit rig">${ICON_PEN}</button>
               <button class="cr-mini-btn" type="button" data-cr="newpc">+ New rig</button>
             </span>`
          : `<button class="cr-mini-btn" type="button" data-cr="newpc">+ New rig</button>`}
      </div>
      <div class="cr-meter">
        <div class="cr-meter-head">
          <b>${p}<small> / 100</small></b>
          <span>Performance</span>
        </div>
        <div class="cr-bar ${cls}"><i style="width:${p}%"></i></div>
      </div>
      ${d.throttled ? `<div class="cr-flag">⚠ Cooling is throttling this build — upgrade the cooler.</div>` : ""}
      <div style="margin-top:12px">
        <div class="cr-skill"><b>Condition</b>
          <div class="cr-bar ${pc.condition > 70 ? "is-cool" : "is-warn"}"><i style="width:${pc.condition}%"></i></div>
          <span>${Math.round(pc.condition)}%</span>
        </div>
        ${pc.condition < 100 ? `<p class="cr-hint">Service it for ${money(C.repairCost())} to restore full performance.</p>` : ""}
      </div>
      <div class="cr-skill" style="margin-top:4px"><b>Storage</b>
        <div class="cr-bar ${disk.free ? "" : "is-warn"}"><i style="width:${Math.min(100, disk.used / disk.cap * 100)}%"></i></div>
        <span>${disk.used}/${disk.cap}</span>
      </div>
      <div class="cr-row" style="border-top:0;padding-top:8px">
        <div class="cr-row-main"><b>Repair &amp; clean</b><small>Dust and thermal paste</small></div>
        <button class="cr-row-act" type="button" data-cr="repair" ${pc.condition >= 100 ? "disabled" : ""}>${pc.condition >= 100 ? "Clean" : money(C.repairCost())}</button>
      </div>
      <p class="cr-hint">${disk.ssd} holds ${disk.cap} unfinished video${disk.cap === 1 ? "" : "s"} — ${disk.free} free. A second rig costs ${money(6000)}.</p>
    </div>`;
  }

  function pcSelector() {
    const s = st();
    if (s.pcs.length < 2) return "";
    return `<div class="cr-durations" style="margin-bottom:12px">
      ${s.pcs.map((pc, i) => `<button class="cr-chip ${i === s.activePc ? "on" : ""}" type="button" data-cr="pc" data-i="${i}">${esc(pc.name)}</button>`).join("")}
    </div>`;
  }

  function setupCard() {
    const net = C.part("internet");
    const room = C.part("room");
    return `<div class="cr-card">
      <div class="cr-card-head"><h2>Studio setup</h2></div>
      <div class="cr-row">
        <div class="cr-row-main"><b>Internet</b><small>${net ? esc(net.name) + " · " + net.up + " Mbps up" : "—"}</small></div>
        <button class="cr-row-act soft" type="button" data-cr="shop" data-slot="internet">Change</button>
      </div>
      <div class="cr-row">
        <div class="cr-row-main"><b>Space</b><small>${room ? esc(room.name) + (room.bonus ? " · +" + room.bonus + " quality" : "") : "—"}</small></div>
        <button class="cr-row-act soft" type="button" data-cr="shop" data-slot="room">Change</button>
      </div>
      <p class="cr-hint">Internet and studio rent are billed with your monthly statement.</p>
    </div>`;
  }

  const studio = () => hero() + stats() + tabs() + pcSelector() + perfCard() +
    `<div class="cr-card">
      <div class="cr-card-head"><h2>The build</h2><span class="cr-tag">${C.PC_SLOTS.length} parts</span></div>
      ${C.PC_SLOTS.map(slotRow).join("")}
    </div>
    <div class="cr-card">
      <div class="cr-card-head"><h2>Gear</h2></div>
      ${C.GEAR_SLOTS.map(slotRow).join("")}
    </div>` + setupCard();

  /* ---------------------------------------------------------
     Shop sheet
     --------------------------------------------------------- */
  function openShop(slot) {
    const items = C.shopOf(slot) || [];
    const currentId = (() => {
      if (slot === "internet") return st().internet;
      if (slot === "room") return st().room;
      if (C.GEAR_SLOTS.includes(slot)) return st().gear[slot];
      return st().pcs[st().activePc].parts[slot];
    })();

    const modal = document.createElement("div");
    modal.className = "mn-modal";
    modal.innerHTML = `<div class="mn-sheet">
      <header>
        <strong>${esc(C.SLOT_LABEL[slot])}</strong>
        <button type="button" data-close>✕</button>
      </header>
      <div class="cr-shop-list">
        ${items.map(it => {
          const compatible = ["cpu", "mobo", "ram", "gpu", "psu", "cooling"].includes(slot)
            ? C.compatibility(slot, it) : { ok: true };
          const owned = C.owns(slot, it.id) || slot === "internet" || slot === "room";
          const active = it.id === currentId;
          const monthly = (slot === "internet" || slot === "room") && it.cost ? ` · ${money(it.cost)}/mo` : "";
          return `<div class="cr-shop-item ${compatible.ok ? "" : "is-locked"}">
            <div class="cr-shop-item-main">
              <b>${esc(it.name)} ${pips(it.tier || 1)}</b>
              <small>${esc(it.note || "")}${monthly}</small>
              ${compatible.ok ? "" : `<em>${esc(compatible.why)}</em>`}
            </div>
            ${editOn() ? `<button class="soft" type="button" data-cr="edit-item"
                data-slot="${slot}" data-id="${esc(it.id)}" aria-label="Edit">✎</button>` : ""}
            ${active
              ? `<button class="soft" type="button" disabled>Installed</button>`
              : owned
                ? `<button type="button" data-cr="buy" data-slot="${slot}" data-id="${it.id}" ${compatible.ok ? "" : "disabled"}>Install</button>`
                : `<button type="button" data-cr="buy" data-slot="${slot}" data-id="${it.id}" ${compatible.ok ? "" : "disabled"}>${it.price ? money(it.price) : "Free"}</button>`}
          </div>`;
        }).join("")}
      </div>
      ${editOn() ? `<button class="cr-add-row" type="button" data-cr="edit-item" data-slot="${slot}" data-id="">
        + Add ${esc((C.SLOT_LABEL[slot] || "item").toLowerCase())}
      </button>` : ""}
      <p class="cr-hint">Compatibility is checked before anything is installed — socket, memory generation and power draw.</p>
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
    modal.querySelectorAll("[data-cr='buy']").forEach(btn => {
      btn.addEventListener("click", () => {
        const res = C.buyItem(btn.dataset.slot, btn.dataset.id);
        toast(res.ok ? res.message : res.why, !res.ok);
        if (res.ok) { close(); render(); }
      });
    });

    modal.querySelectorAll("[data-cr='edit-item']").forEach(btn => {
      btn.addEventListener("click", () => {
        close();
        if (E()) E().item(btn.dataset.slot, btn.dataset.id || null);
      });
    });
  }


  /* ---------------------------------------------------------
     Produce
     --------------------------------------------------------- */
  function typeName(id) {
    const t = C.typeOf(id);
    return t ? t.name : "Video";
  }

  function reqChips(typeId) {
    const t = C.typeOf(typeId);
    if (!t) return [];
    const out = [];
    if (t.need.perf) out.push([`PC ${t.need.perf}+`, C.perf() >= t.need.perf]);
    if (t.need.mic) {
      const mic = C.part("mic");
      out.push([`Mic tier ${t.need.mic}`, !!mic && mic.tier >= t.need.mic]);
    }
    if (t.need.camera) {
      const cam = C.part("camera");
      out.push([`Camera tier ${t.need.camera}`, !!cam && cam.tier >= t.need.camera]);
    }
    if (t.need.capture) {
      const cap = C.part("capture");
      out.push(["Capture card", !!cap && cap.tier >= t.need.capture]);
    }
    return out;
  }

  function typeCard(id) {
    const t = C.typeOf(id);
    if (!t) return "";
    const mine = st().channel.niche === t.niche;
    const locked = !mine && st().subs < 1000;
    const missing = C.missingFor(id);
    const chips = reqChips(id).map(([label, ok]) =>
      `<span class="cr-req ${ok ? "" : "miss"}">${esc(label)}</span>`).join("");

    return `<article class="cr-type">
      <div class="cr-type-top">
        <div>
          <b>${esc(t.name)}</b>
          <small>${esc(C.NICHES[t.niche].label)} · ${t.days} game day${t.days === 1 ? "" : "s"} · appeal ×${t.appeal.toFixed(2)}</small>
        </div>
        <div class="cr-type-price"><b>${money(t.cost)}</b><small>per video</small></div>
      </div>
      <div class="cr-reqs">${chips}</div>
      <div class="cr-type-foot">
        ${locked
          ? `<span class="cr-req miss">Diversify at 1 000 subs</span>`
          : missing.length
            ? `<span class="cr-hint" style="margin:0">${esc(missing[0])}</span>`
            : `<span class="cr-hint" style="margin:0">Ready to shoot</span>`}
        ${editOn() ? `<button class="cr-row-edit" type="button" data-cr="edit-type" data-id="${esc(id)}"
          aria-label="Edit format" title="Edit format">${ICON_PEN}</button>` : ""}
        <button class="cr-go" type="button" data-cr="produce" data-type="${id}"
          ${locked || missing.length ? "disabled" : ""}>Start</button>
      </div>
    </article>`;
  }

  function queueCard() {
    const jobList = st().videos.filter(v => v.status === "producing");
    const readyList = st().videos.filter(v => v.status === "ready");

    if (!jobList.length && !readyList.length) {
      return `<div class="cr-card">
        <div class="cr-card-head"><h2>Production queue</h2></div>
        <div class="cr-empty">Nothing in production. Pick a format above and start shooting.</div>
      </div>`;
    }

    const now = Date.now();
    return `<div class="cr-card">
      <div class="cr-card-head"><h2>Production queue</h2><span class="cr-tag">${C.storage().used}/${C.storage().cap} slots</span></div>
      ${jobList.map(v => {
        const t = C.typeOf(v.type) || { name: "Video" };
        const total = Math.max(1, v.readyAt - v.startedAt);
        const pct = Math.min(100, Math.max(0, ((now - v.startedAt) / total) * 100));
        const left = Math.max(0, Math.ceil((v.readyAt - now) / 1000));
        return `<div class="cr-job">
          <div class="cr-job-top"><b>${esc(v.title)}</b><span>${left}s</span></div>
          <div class="cr-bar"><i style="width:${pct}%"></i></div>
          <small>${esc(t.name)} · ${pct < 100 ? "rendering" : "finishing"}</small>
        </div>`;
      }).join("")}
      ${readyList.length ? `<div class="cr-okbox" style="margin-top:10px">${readyList.length} finished video${readyList.length === 1 ? "" : "s"} waiting in the publishing centre.</div>` : ""}
    </div>`;
  }

  function calendarCard() {
    const list = st().videos.filter(v => v.status !== "published" && v.deadline);
    if (!list.length) return "";
    return `<div class="cr-card">
      <div class="cr-card-head"><h2>Content calendar</h2><span class="cr-tag">slots</span></div>
      ${list.map(v => {
        const ms = v.deadline - Date.now();
        const days = ms / C.DAY_MS;
        const late = ms < 0;
        const label = late
          ? `Overdue by ${Math.max(1, Math.round(-days))} game day${Math.round(-days) === 1 ? "" : "s"}`
          : `Due in ${Math.max(1, Math.round(days))} game day${Math.round(days) === 1 ? "" : "s"}`;
        return `<div class="cr-row">
          <div class="cr-row-main"><b>${esc(v.title)}</b><small>${esc(typeName(v.type))}</small></div>
          <span class="cr-tag ${late ? "bad" : "good"}">${label}</span>
        </div>`;
      }).join("")}
      <p class="cr-hint">Missing a slot costs consistency and reputation — publishing late is allowed, it just hurts.</p>
    </div>`;
  }

  function producePanel() {
    const niche = st().channel.niche;
    const mine = C.typeList().filter(t => t.niche === niche).map(t => t.id);
    const others = C.typeList().filter(t => t.niche !== niche).map(t => t.id);

    return hero() + stats() + tabs() +
      trendBoard() +
      `<div class="cr-card">
        <div class="cr-card-head"><h2>${esc(C.NICHES[niche].label)} formats</h2>
          ${editOn() ? `<button class="cr-mini-btn" type="button" data-cr="add-type">+ Add</button>` : `<span class="cr-tag">${mine.length}</span>`}
        </div>
        <div class="cr-types">${mine.map(typeCard).join("")}</div>
      </div>
      <div class="cr-card">
        <div class="cr-card-head"><h2>Other niches</h2><span class="cr-tag">diversify</span></div>
        ${Object.keys(C.NICHES).filter(n => n !== niche).map(n => {
          const unlocked = st().subs >= 1000;
          const lv = C.trendOf(n);
          return `<div class="cr-row">
            <div class="cr-row-main">
              <b>${esc(C.NICHES[n].label)}</b>
              <small>${unlocked ? "Open · pick a format below" : "Unlocks at 1 000 subscribers"} · trend ${C.TREND_LABEL[lv]}</small>
            </div>
            <button class="cr-row-act ${unlocked ? "" : "soft"} ${diversifyNiche === n ? "" : ""}" type="button"
              data-cr="diversify" data-niche="${n}" ${unlocked ? "" : "disabled"}>${unlocked ? (diversifyNiche === n ? "Hide" : "View formats") : "Locked"}</button>
          </div>`;
        }).join("")}
        ${st().subs >= 1000 && diversifyNiche
          ? `<div class="cr-types" style="margin-top:10px">${C.typeList().filter(t => t.niche === diversifyNiche).map(t => typeCard(t.id)).join("")}</div>`
          : ""}
      </div>      </div>` + queueCard() + calendarCard();
  }

  /* ---------------------------------------------------------
     Publish
     --------------------------------------------------------- */
  function publishPanel() {
    const readyList = st().videos.filter(v => v.status === "ready");
    const pub = st().videos.filter(v => v.status === "published").slice(0, 12);

    const readyHTML = readyList.length
      ? readyList.map(v => {
          const proj = C.projected(v);
          const overdue = v.deadline && Date.now() > v.deadline;
          return `<div class="cr-ready" data-video="${v.id}">
            <div class="cr-ready-top">
              <b>Ready to publish</b>
              <span>${overdue ? "past its slot" : "on schedule"}</span>
            </div>
            <input class="cr-title-input" type="text" maxlength="80" value="${esc(v.title)}" aria-label="Video title">
            <div class="cr-ready-meta">
              <span class="cr-tag">${esc(typeName(v.type))}</span>
              <span class="cr-tag ${v.quality >= 60 ? "good" : ""}">Quality ${v.quality}</span>
              <span class="cr-tag">Trend ${C.TREND_LABEL[C.trendOf(v.niche)]}</span>
              <span class="cr-tag">Projected ${fmt(proj.low)}–${fmt(proj.high)} views</span>
              ${overdue ? '<span class="cr-tag bad">Consistency risk</span>' : ""}
            </div>
            <button class="cr-publish" type="button" data-cr="publish" data-id="${v.id}">Publish to channel</button>
          </div>`;
        }).join("")
      : `<div class="cr-empty">Nothing waiting. Finish a production first — completed videos only go live when you publish them.</div>`;

    return hero() + stats() + tabs() +
      `<div class="cr-card">
        <div class="cr-card-head"><h2>Publishing centre</h2><span class="cr-tag">${readyList.length} ready</span></div>
        ${readyHTML}
        <p class="cr-hint">Titles and timing are your call. Publish late and consistency slips; skip too long and the algorithm forgets you.</p>
      </div>
      <div class="cr-card">
        <div class="cr-card-head"><h2>Published</h2><span class="cr-tag">${pub.length}</span></div>
        ${pub.length ? pub.map(v => `<div class="cr-published">
          <div><b>${esc(v.title)}</b><small>${esc(typeName(v.type))} · quality ${v.quality} · ${v.gameDate ? new Date(v.gameDate).toLocaleDateString("en-ZA",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}) : "—"}</small></div>
          <span>${fmt(v.views)} views<br><small style="color:#91867A">+${fmt(v.subsGained)} subs · ${money(v.revenue)}</small></span>
        </div>`).join("") : `<div class="cr-empty">No uploads yet.</div>`}
      </div>`;
  }

  /* ---------------------------------------------------------
     Live
     --------------------------------------------------------- */
  function liveSetup() {
    const read = C.streamReadiness(streamQuality);
    const cost = Math.round(streamHours * 95 + 60);
    const durs = [[0.5, "30 min"], [1, "1 hour"], [2, "2 hours"], [4, "4 hours"]];

    return `<div class="cr-card">
      <div class="cr-card-head"><h2>Go live</h2><span class="cr-tag">${esc(C.part("internet") ? C.part("internet").name : "—")}</span></div>

      <p class="cr-sub">Duration</p>
      <div class="cr-durations">
        ${durs.map(([h, label]) => `<button class="cr-chip ${streamHours === h ? "on" : ""}" type="button"
          data-cr="dur" data-h="${h}">${label}</button>`).join("")}
      </div>

      <p class="cr-sub" style="margin-top:12px">Stream quality</p>
      <div class="cr-qualities">
        ${Object.keys(C.STREAM_QUALITY).map(q => `<button class="cr-chip ${streamQuality === q ? "on" : ""}" type="button"
          data-cr="qual" data-q="${q}">${C.STREAM_QUALITY[q].label}</button>`).join("")}
      </div>

      ${read.problems.length
        ? `<div class="cr-warnbox">${read.problems.map(p => `<p>⚠ ${esc(p)}</p>`).join("")}
            <p>Risk ${read.risk}% — dropped frames will cut this stream short.</p></div>`
        : `<div class="cr-okbox">Your setup can carry ${C.STREAM_QUALITY[streamQuality].label} cleanly.</div>`}

      <div class="cr-row" style="margin-top:10px">
        <div class="cr-row-main"><b>Power &amp; bandwidth</b><small>Charged when you go live</small></div>
        <b>${money(cost)}</b>
      </div>

      <button class="cr-primary" type="button" data-cr="live" style="margin-top:6px">Go live for ${durs.find(d => d[0] === streamHours)[1]}</button>
    </div>`;
  }

  function livePanel() {
    const l = st().live;
    const q = C.STREAM_QUALITY[l.quality];
    return `<div class="cr-live-panel" id="cr-live-panel">
      <div class="cr-live-top">
        <span class="cr-live-pill"><i></i>LIVE</span>
        <span style="font-size:9px;font-weight:800">${esc(q.label)}</span>
        <small id="cr-live-clock">0:00 / ${l.hours}h</small>
      </div>
      <div class="cr-live-grid">
        <div><small>Watching</small><b id="cr-live-viewers">${l.viewers}</b></div>
        <div><small>Peak</small><b id="cr-live-peak">${l.peak}</b></div>
        <div><small>Donations</small><b id="cr-live-money">R 0</b></div>
      </div>
      <div class="cr-bar" style="background:rgba(255,255,255,.14)"><i id="cr-live-bar" style="width:0%"></i></div>
      <div class="cr-live-log" id="cr-live-log" style="margin-top:10px">
        ${l.log.map(x => `<span>${esc(x.text)}</span>`).join("")}
      </div>
      <div class="cr-live-actions">
        <button class="cr-end" type="button" data-cr="end">End stream</button>
      </div>
      <p style="margin:10px 0 0;font-size:8px;color:rgba(255,255,255,.42)">Dropped frames: <span id="cr-live-drops">${l.dropped}</span> · keep an eye on your connection.</p>
    </div>`;
  }

  function streamHistory() {
    const list = st().streams.slice(0, 6);
    if (!list.length) return "";
    return `<div class="cr-card">
      <div class="cr-card-head"><h2>Past streams</h2></div>
      ${list.map(s => `<div class="cr-published">
        <div><b>${s.hours}h · ${esc(C.STREAM_QUALITY[s.quality].label)}</b>
        <small>${s.reason === "signal" ? "Ended by connection" : "Completed"} · peak ${fmt(s.peak)}${s.subs ? ` · +${fmt(s.subs)} subs` : ""}</small></div>
        <span>${money(s.payout)}</span>
      </div>`).join("")}
    </div>`;
  }

  function liveTab() {
    return hero() + stats() + tabs() +
      (st().live ? livePanel() : liveSetup()) +
      streamHistory() +
      `<div class="cr-card">
        <div class="cr-card-head"><h2>How streaming pays</h2></div>
        <p class="cr-sub">Donations scale with viewers and your engagement skill. Advertising only counts once the channel is monetised. Longer streams earn more but burn more power — and a weak rig will drop frames until the stream dies.</p>
      </div>`;
  }

  /* ---------------------------------------------------------
     Render + routing
     --------------------------------------------------------- */
  function render() {
    const r = root();
    if (!r) return;

    const body = !st().channel
      ? onboard()
      : { dash: dashboard, studio, produce: producePanel, publish: publishPanel, live: liveTab }[tab]();

    r.innerHTML = `<section class="dynamic-page-content cr-page" id="cr-page">
      <div class="cr-body">${body}</div>
    </section>`;

    const main = document.getElementById("main-content");
    if (main) main.hidden = true;
    r.hidden = false;
  }

  /* ---------------------------------------------------------
     Interactions
     --------------------------------------------------------- */
  let chosenNiche = "gaming";

  document.addEventListener("click", e => {
    const scope = e.target.closest("#dynamic-page");
    if (!scope || !e.target.closest(".cr-page")) return;

    const el = e.target.closest("[data-cr]");
    if (!el) return;
    const act = el.dataset.cr;

    if (act === "tab") {
      tab = el.dataset.tab;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (act === "niche") {
      chosenNiche = el.dataset.niche;
      document.querySelectorAll(".cr-niche").forEach(n =>
        n.classList.toggle("is-on", n.dataset.niche === chosenNiche));
      return;
    }

    if (act === "create") {
      const input = document.getElementById("cr-channel-name");
      const res = C.createChannel(input ? input.value : "", chosenNiche);
      if (!res.ok) return toast(res.why, true);
      tab = "dash";
      render();
      toast("Channel created — welcome to the grind");
      return;
    }

    if (act === "shop") return openShop(el.dataset.slot);

    if (act === "edit-rig") { if (E()) E().rig(); return; }
    if (act === "edit-channel") { if (E()) E().channel(); return; }
    if (act === "edit-gear") { tab = "studio"; render(); toast("Tap ✎ beside any part to edit it"); return; }
    if (act === "edit-item") { if (E()) E().item(el.dataset.slot, el.dataset.id || null); return; }
    if (act === "edit-type") { if (E()) E().type(el.dataset.id || null); return; }
    if (act === "add-type") { if (E()) E().type(null); return; }
    if (act === "edit-milestone") { if (E()) E().milestone(el.dataset.id || null); return; }
    if (act === "add-milestone") { if (E()) E().milestone(null); return; }

    if (act === "diversify") {
      diversifyNiche = diversifyNiche === el.dataset.niche ? null : el.dataset.niche;
      render();
      return;
    }

    if (act === "repair") {
      const res = C.repair();
      toast(res.ok ? res.message : res.why, !res.ok);
      if (res.ok) render();
      return;
    }

    if (act === "newpc") {
      const res = C.addPc();
      toast(res.ok ? res.message : res.why, !res.ok);
      if (res.ok) render();
      return;
    }

    if (act === "pc") {
      C.setActivePc(Number(el.dataset.i));
      render();
      return;
    }

    if (act === "produce") {
      const res = C.produce(el.dataset.type);
      toast(res.ok ? res.message : res.why, !res.ok);
      if (res.ok) { tab = "produce"; render(); }
      return;
    }

    if (act === "publish") {
      const card = el.closest(".cr-ready");
      const input = card ? card.querySelector(".cr-title-input") : null;
      const res = C.publish(el.dataset.id, input ? input.value : "");
      if (!res.ok) return toast(res.why, true);
      render();
      toast(`Published — ${fmt(res.views)} views, +${fmt(res.subsGained)} subscribers`);
      return;
    }

    if (act === "dur") {
      streamHours = Number(el.dataset.h);
      render();
      return;
    }

    if (act === "qual") {
      streamQuality = el.dataset.q;
      render();
      return;
    }

    if (act === "live") {
      const res = C.startStream(streamHours, streamQuality);
      if (!res.ok) return toast(res.why, true);
      tab = "live";
      render();
      toast("You're live");
      return;
    }

    if (act === "end") {
      const res = C.endStream("manual");
      render();
      if (res) toast(`Stream ended · ${money(res.payout)} earned`);
      return;
    }

    if (act === "refresh-trends") {
      C.refreshTrends(true);
      render();
      toast("Trend board refreshed");
    }
  });

  /* ---------------------------------------------------------
     Live ticking — runs even if you leave the tab open elsewhere
     --------------------------------------------------------- */
  function paintLive() {
    const l = st().live;
    if (!l) return;

    const viewers = document.getElementById("cr-live-viewers");
    if (!viewers) return;   /* not on the live panel */

    const total = l.hours * C.STREAM_SECONDS_PER_HOUR * 2;
    const pct = Math.min(100, (l.ticks / total) * 100);
    const seconds = (l.ticks / 2);

    viewers.textContent = l.viewers;
    const peak = document.getElementById("cr-live-peak");
    if (peak) peak.textContent = l.peak;
    const moneyEl = document.getElementById("cr-live-money");
    if (moneyEl) moneyEl.textContent = money(l.donations);
    const bar = document.getElementById("cr-live-bar");
    if (bar) bar.style.width = pct + "%";
    const clock = document.getElementById("cr-live-clock");
    if (clock) {
      const mm = Math.floor(seconds / 60);
      const ss = String(Math.floor(seconds % 60)).padStart(2, "0");
      clock.textContent = `${mm}:${ss} / ${l.hours}h`;
    }
    const drops = document.getElementById("cr-live-drops");
    if (drops) drops.textContent = l.dropped;
    const log = document.getElementById("cr-live-log");
    if (log) log.innerHTML = l.log.map(x => `<span>${esc(x.text)}</span>`).join("");
  }

  window.setInterval(() => {
    if (!st().live) return;
    const res = C.tickStream();
    if (!res) return;
    if (res.ended) {
      render();
      toast(res.reason === "signal"
        ? `Stream cut out — ${money(res.payout)} earned before it dropped`
        : `Stream finished · ${money(res.payout)} earned`, res.reason === "signal");
      return;
    }
    paintLive();
  }, 500);

  /* ---------------------------------------------------------
     Auto-refresh when a render finishes
     --------------------------------------------------------- */
  C.onChange(evt => {
    if (evt.type === "ready") {
      toast(`“${evt.video.title}” is ready to publish`);
    }
    if (window.__crVisible && window.__crVisible()) {
      if (["produce", "publish", "dash"].includes(tab)) render();
    }
  });

  /* ---------------------------------------------------------
     Routing
     --------------------------------------------------------- */
  const prevNavigate = window.navigateTo;

  window.navigateTo = function (page) {
    if (page === "creator") {
      document.querySelectorAll(".nav-item").forEach(b =>
        b.classList.toggle("active", b.dataset.page === "business"));
      if (typeof window.nuLimitsInvestLeave === "function") window.nuLimitsInvestLeave();
      tab = "dash";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    return prevNavigate.apply(this, arguments);
  };

  window.__crVisible = () => !!document.getElementById("cr-page");
  window.renderCreator = render;
})();
