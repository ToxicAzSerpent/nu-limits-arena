/* ==========================================================
   NU LIMITS — THE COPPER POT (interface)
   Round 10
   ========================================================== */

(function () {
  "use strict";

  const I = window.nuLimitsIcons || { dish: () => "", upgrade: () => "" };

  const R = window.nuLimitsRestaurant;
  if (!R) return;

  const esc = R.esc;
  const money = R.money;

  const root = () => document.getElementById("dynamic-page");
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const E = () => window.nuLimitsRestaurantEdit;

  const ICON_PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

  let tab = "overview";
  let menuCat = "All";

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

  const starRow = (n, max) => {
    const full = Math.round(n);
    let out = "";
    for (let i = 1; i <= (max || 5); i++) out += `<i class="${i <= full ? "on" : ""}">★</i>`;
    return out;
  };

  const pct = (v, cap) => Math.max(2, Math.min(100, Math.round((v / (cap || 1)) * 100)));

  /* ---------------------------------------------------------
     Acquisition screen
     --------------------------------------------------------- */
  function acquisition() {
    const price = R.purchasePrice();
    const bal = R.personalBalance();
    const free = !!(window.nuLimitsFree && window.nuLimitsFree.on());
    const can = free || bal >= price;

    return `<section class="dynamic-page-content rs-page">
      <div class="rs-acq">
        <div class="rs-acq-photo" style="background-image:url('images/restaurant/hero.jpg')">
          <div class="rs-acq-shade"></div>
          <div class="rs-acq-top">
            <span class="rs-pill">FOR SALE</span>
            <span class="rs-pill ghost">${esc(R.CUISINES[R.state.cuisine].label)}</span>
          </div>
          <div class="rs-acq-title">
            <p>NU LIMITS / BUSINESS</p>
            <h1>${esc(R.state.name)}</h1>
            <span class="rs-acq-stars">${starRow(4.2)} <b>4.2</b> <small>· 386 reviews</small></span>
          </div>
        </div>

        <div class="rs-acq-body">
          <p class="rs-lede">A 24-seat corner bistro with a name worth keeping. The owner is emigrating and wants a clean sale — keys, licence, fit-out and the team, all in one number.</p>

          <div class="rs-card">
            <div class="rs-card-head"><h2>What the capital buys</h2><span class="rs-tag">once-off</span></div>
            ${[
              ["Lease deposit & transfer", 30000],
              ["Liquor & trading licence", 12000],
              ["Kitchen fit-out & equipment", 25000],
              ["Opening stock & float", 8000]
            ].map(([label, amt]) => `<div class="rs-line"><span>${esc(label)}</span><b>${money(amt)}</b></div>`).join("")}
            <div class="rs-line total"><span>Capital required</span><b>${money(price)}</b></div>
          </div>

          <div class="rs-card">
            <div class="rs-card-head"><h2>The deal</h2></div>
            <div class="rs-deal">
              <div><b>24</b><span>seats</span></div>
              <div><b>4</b><span>staff stay on</span></div>
              <div><b>10</b><span>dishes on the menu</span></div>
              <div><b>${money(10000)}</b><span>opening float</span></div>
            </div>
            <p class="rs-hint">Wages, rent, water, power, levies and provisional tax come out of the business every day. Fill seats, set prices and keep the reviews above four stars or the room empties.</p>
          </div>

          <div class="rs-acq-actions">
            <button class="rs-btn primary" type="button" data-rs="buy" ${can ? "" : "disabled"}>
              ${free ? "Take the keys — free play" : can ? `Buy for ${money(price)}` : `Need ${money(price - bal)} more`}
            </button>
            <p class="rs-hint center">${free
              ? "Edit Mode is on — no capital required."
              : `Your balance: <b>${money(bal)}</b>`}</p>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------
     Operating shell
     --------------------------------------------------------- */
  function hero() {
    const s = R.state;
    const st = R.stars();
    const alerts = R.alerts();
    return `<div class="rs-hero" style="background-image:url('images/restaurant/hero.jpg')">
      <div class="rs-hero-shade"></div>
      <div class="rs-hero-body">
        <p>NU LIMITS / BUSINESS · RESTAURANT</p>
        <h1>${esc(s.name)}</h1>
        <div class="rs-hero-row">
          <span class="rs-stars">${starRow(st)} <b>${st.toFixed(1)}</b></span>
          <span class="rs-hero-dot">·</span>
          <span>${esc(R.CUISINES[s.cuisine].label)}</span>
          <span class="rs-hero-dot">·</span>
          <span>${s.businessDay} days trading</span>
        </div>
      </div>
      ${alerts.length ? `<span class="rs-hero-flag ${alerts[0].level}">${esc(alerts[0].text.slice(0, 34))}${alerts[0].text.length > 34 ? "…" : ""}</span>` : ""}
    </div>`;
  }

  function statTiles() {
    const st = R.state.stats || { covers: 0, revenue: 0, profit: 0, onlineOrders: 0 };
    const cash = Math.round(R.state.cash);
    return `<div class="rs-stats">
      <div class="rs-stat ${cash < 0 ? "bad" : ""}"><span>Till</span><b>${money(cash)}</b><small>${cash < 0 ? "overdrawn" : "in the till"}</small></div>
      <div class="rs-stat"><span>Covers</span><b>${st.covers}</b><small>served · ${st.onlineOrders || 0} online</small></div>
      <div class="rs-stat"><span>Revenue</span><b>${money(st.revenue)}</b><small>yesterday</small></div>
      <div class="rs-stat ${st.profit < 0 ? "bad" : ""}"><span>Profit</span><b>${money(st.profit)}</b><small>after costs</small></div>
    </div>`;
  }

  function tabs() {
    const list = [["overview", "Overview"], ["menu", "Menu"], ["staff", "Staff"],
                  ["upgrades", "Upgrades"], ["orders", "Orders"], ["reports", "Reports"]];
    return `<div class="rs-tabs">${list.map(([id, label]) =>
      `<button type="button" data-rs="tab" data-tab="${id}" class="${tab === id ? "on" : ""}">${label}</button>`).join("")}</div>`;
  }

  /* ---------------------------------------------------------
     Overview
     --------------------------------------------------------- */
  function capacityCard() {
    const cap = R.capacity();
    const demand = R.state.stats ? R.state.stats.demand : 0;
    const rows = [
      ["Demand", demand, Math.max(cap.total, demand, 1), "customers who wanted a table"],
      ["Kitchen", cap.kitchen, Math.max(cap.kitchen, demand, 1), "plates the pass can fire"],
      ["Floor", cap.service, Math.max(cap.service, demand, 1), "covers the team can serve"],
      ["Seats", cap.seats, Math.max(cap.seats, demand, 1), "covers across the day"]
    ];
    const bottleneck = cap.kitchen <= cap.service && cap.kitchen <= cap.seats ? "Kitchen"
      : cap.service <= cap.seats ? "Floor" : "Seats";
    return `<div class="rs-card">
      <div class="rs-card-head"><h2>Service capacity</h2><span class="rs-tag warn">${bottleneck} binds</span></div>
      ${rows.map(([label, v, max, sub]) => `
        <div class="rs-meter">
          <div class="rs-meter-top"><b>${label}</b><span>${v} <small>${sub}</small></span></div>
          <div class="rs-bar ${label === "Demand" ? "demand" : ""}"><i style="width:${pct(v, max)}%"></i></div>
        </div>`).join("")}
      <p class="rs-hint">You served <b>${R.state.stats ? R.state.stats.covers : 0}</b> of ${demand || 0} who walked in. Upgrade the bottleneck before the reviews notice.</p>
    </div>`;
  }

  function cashCard() {
    return `<div class="rs-card">
      <div class="rs-card-head"><h2>Business cash</h2><span class="rs-tag">${money(Math.round(R.state.cash))}</span></div>
      <p class="rs-sub">Wages, stock and bills come out of this till — not your personal balance.</p>
      <div class="rs-two">
        <button class="rs-btn" type="button" data-rs="deposit">Deposit capital</button>
        <button class="rs-btn" type="button" data-rs="withdraw">Draw profit</button>
      </div>
    </div>`;
  }

  function editCard() {
    if (!editOn()) return "";
    return `<div class="rs-card rs-editcard">
      <div class="rs-card-head"><h2>Edit Mode is on</h2><span class="rs-tag">restaurant</span></div>
      <p class="rs-sub">Everything in this business is editable — the name, the cuisine, every dish and price, every upgrade tier and every wage.</p>
      <div class="rs-editgrid">
        <button type="button" data-rs="edit-profile">Restaurant details</button>
        <button type="button" data-rs="edit-menu">Add a dish</button>
        <button type="button" data-rs="edit-wages">Role wages</button>
        <button type="button" data-rs="tab" data-tab="upgrades">Upgrades</button>
      </div>
    </div>`;
  }

  function overview() {
    const st = R.state.stats;
    const alerts = R.alerts();
    const rev = st ? st.revenue : 0;
    const other = st ? Math.max(0, st.costs - st.foodCost - st.wages -
      (st.power + st.water + st.rent + st.levies)) : 0;

    return `<div class="rs-body">
      ${alerts.length ? `<div class="rs-alerts">${alerts.map(a =>
        `<div class="rs-alert ${a.level}">${esc(a.text)}</div>`).join("")}</div>` : ""}

      ${capacityCard()}

      <div class="rs-card">
        <div class="rs-card-head"><h2>Yesterday's service</h2>
          <span class="rs-tag">${st ? `${st.covers} covers · ${R.state.stats.quality} quality` : "closed"}</span></div>
        ${st ? `
          <div class="rs-split">
            <div><span>Revenue</span><b>${money(rev)}</b></div>
            <div><span>Food cost</span><b>−${money(st.foodCost)}</b></div>
            <div><span>Wages</span><b>−${money(st.wages)}</b></div>
            <div><span>Bills</span><b>−${money(st.power + st.water + st.rent + st.levies)}</b></div>
            ${other > 0 ? `<div><span>Other</span><b>−${money(other)}</b></div>` : ""}
          </div>
          <div class="rs-line total"><span>Profit for the day</span><b class="${st.profit < 0 ? "neg" : "pos"}">${money(st.profit)}</b></div>
          ${st.repairNote ? `<p class="rs-hint bad">${esc(st.repairNote)}</p>` : ""}
        ` : `<p class="rs-empty">The doors open on the next game day. Hire staff and set your menu tonight.</p>`}
      </div>

      ${cashCard()}
      ${editCard()}
    </div>`;
  }

  /* ---------------------------------------------------------
     Menu
     --------------------------------------------------------- */
  function menuRow(id) {
    const m = R.state.menu[id];
    if (!m) return "";
    const on = R.state.active.includes(id);
    const margin = m.price > 0 ? Math.round(((m.price - m.cost) / m.price) * 100) : 0;
    return `<div class="rs-row ${on ? "" : "off"}">
      <span class="rs-emoji">${I.dish(id, m.cat)}</span>
      <div class="rs-row-main">
        <b>${esc(m.name)}</b>
        <small>${esc(m.cat)} · costs ${money(m.cost)} · ${margin}% margin</small>
      </div>
      <div class="rs-row-price">
        <b>${money(m.price)}</b>
        <small>${esc(String(m.prep))} d prep</small>
      </div>
      ${editOn() ? `<button class="rs-pen" type="button" data-rs="edit-dish" data-id="${esc(id)}" aria-label="Edit dish">${ICON_PEN}</button>` : ""}
      <button class="rs-toggle ${on ? "on" : ""}" type="button" data-rs="toggle-dish" data-id="${esc(id)}">
        ${on ? "On" : "Off"}
      </button>
    </div>`;
  }

  function menu() {
    const s = R.state;
    const cats = ["All"].concat(Array.from(new Set(Object.keys(s.menu).map(id => s.menu[id].cat))));
    if (!cats.includes(menuCat)) menuCat = "All";
    const ids = Object.keys(s.menu).filter(id => menuCat === "All" || s.menu[id].cat === menuCat);

    return `<div class="rs-body">
      <div class="rs-card">
        <div class="rs-card-head"><h2>Menu board</h2><span class="rs-tag">${s.active.length} live</span></div>
        <div class="rs-chips">
          ${cats.map(c => `<button type="button" class="${menuCat === c ? "on" : ""}" data-rs="menu-cat" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}
        </div>
        <div class="rs-lines">${ids.map(menuRow).join("")}</div>
        ${editOn() ? `<button class="rs-add" type="button" data-rs="edit-dish" data-id="">+ Add a dish</button>` : ""}
        <p class="rs-hint">Average basket <b>${money(R.ticket())}</b> · price index <b>${R.priceIndex().toFixed(2)}×</b> market. Push prices up and covers fall; trim them and the room fills.</p>
      </div>

      <div class="rs-card">
        <div class="rs-card-head"><h2>Kitchen quality</h2><span class="rs-tag">${R.quality()}/100</span></div>
        <div class="rs-bar"><i style="width:${R.quality()}%"></i></div>
        <p class="rs-hint">Quality comes from the chefs on the line, the equipment and the dishes themselves. Better plates mean better reviews, and better reviews fill more seats.</p>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------
     Staff
     --------------------------------------------------------- */
  function staffRow(emp) {
    const role = R.roleDef(emp.role);
    const p = R.promotionFor(emp);
    return `<div class="rs-staff">
      <span class="rs-avatar" data-dept="${esc(role.dept)}">${esc(emp.name.slice(0, 1))}</span>
      <div class="rs-row-main">
        <b>${esc(emp.name)}</b>
        <small>${esc(role.label)} · ${emp.skill.toFixed(1)}★ · ${Math.round(emp.morale)}% · ${emp.days || 0}d</small>
      </div>
      <div class="rs-row-price"><b>${money(emp.wage)}</b><small>per day</small></div>
      <div class="rs-row-tools">
        ${editOn() ? `<button class="rs-pen" type="button" data-rs="edit-employee" data-id="${esc(emp.id)}" aria-label="Edit employee">${ICON_PEN}</button>` : ""}
        ${p ? `<button class="rs-mini ${p.ready ? "good" : ""}" type="button" data-rs="promote" data-id="${esc(emp.id)}"
          ${p.ready ? "" : "disabled"} title="${p.ready ? "Promote to " + esc(p.label) : `Needs ${p.needSkill} skill & ${p.needDays} days`}">↑ Promote to ${esc(p.label)}</button>
          <small class="rs-need">${p.ready ? "" : `${p.needSkill} skill · ${p.needDays} days`}</small>` : ""}
        <button class="rs-mini danger" type="button" data-rs="fire" data-id="${esc(emp.id)}">Fire</button>
      </div>
    </div>`;
  }

  function staff() {
    const s = R.state;
    const groups = ["chef", "headchef", "waiter", "supervisor", "barman", "barmanager", "cleaner", "manager", "director"];
    const byRole = groups.map(role => [role, s.staff.filter(e => e.role === role)]).filter(([, list]) => list.length);

    return `<div class="rs-body">
      <div class="rs-card">
        <div class="rs-card-head"><h2>Payroll</h2><span class="rs-tag ${R.wageBill() > 4000 ? "warn" : ""}">${money(R.wageBill())} / day</span></div>
        <div class="rs-split">
          <div><span>Headcount</span><b>${s.staff.length} / ${R.staffCap()}</b></div>
          <div><span>Average skill</span><b>${s.staff.length ? (s.staff.reduce((n, e) => n + e.skill, 0) / s.staff.length).toFixed(1) : "0.0"}★</b></div>
          <div><span>Average morale</span><b>${s.staff.length ? Math.round(s.staff.reduce((n, e) => n + e.morale, 0) / s.staff.length) : 0}%</b></div>
          <div><span>Monthly wage bill</span><b>${money(R.wageBill() * 30)}</b></div>
        </div>
        <button class="rs-btn primary" type="button" data-rs="hire">Hire someone</button>
        ${editOn() ? `<button class="rs-btn" type="button" data-rs="edit-wages">Edit role wages</button>` : ""}
      </div>

      ${byRole.map(([role, list]) => `
        <div class="rs-card">
          <div class="rs-card-head"><h2>${esc(R.roleDef(role).label)}</h2><span class="rs-tag">${list.length}</span></div>
          <p class="rs-sub">${esc(R.roleDef(role).blurb || "")}</p>
          ${list.map(staffRow).join("")}
        </div>`).join("")}

      ${!s.staff.length ? `<p class="rs-empty">No staff. Nothing happens in a kitchen without people.</p>` : ""}
    </div>`;
  }

  /* ---------------------------------------------------------
     Upgrades
     --------------------------------------------------------- */
  function upgradeCard(item) {
    const lvl = Number(R.state.upgrades[item.id]) || 0;
    const tier = item.tiers[lvl] || item.tiers[0];
    const next = R.nextTier(item.id);
    const fx = tier.fx || {};
    const bits = [];
    if (fx.fast) bits.push(`+${fx.fast} kitchen`);
    if (fx.seats) bits.push(`${fx.seats} seats`);
    if (fx.seatsAdd) bits.push(`+${fx.seatsAdd} seats`);
    if (fx.q) bits.push(`+${fx.q} quality`);
    if (fx.charm) bits.push(`+${fx.charm}% draw`);
    if (fx.turns) bits.push(`+${fx.turns} turns`);
    if (fx.staff) bits.push(`${fx.staff} staff cap`);
    if (fx.online) bits.push(`${fx.online} delivery`);
    if (fx.waste) bits.push(`${fx.waste}% waste`);
    if (fx.rent) bits.push(`${money(fx.rent)} rent`);

    return `<div class="rs-up ${next ? "" : "maxed"}">
      <div class="rs-up-top">
        <span class="rs-emoji">${I.upgrade(item.id, item.cat)}</span>
        <div class="rs-row-main">
          <b>${esc(item.name)}</b>
          <small>${esc(tier.label)}</small>
        </div>
        <span class="rs-tag">L${lvl + 1}</span>
        ${editOn() ? `<button class="rs-pen" type="button" data-rs="edit-levels" data-id="${esc(item.id)}" aria-label="Edit levels">${ICON_PEN}</button>` : ""}
      </div>
      <div class="rs-up-fx">${bits.length ? bits.map(b => `<span>${esc(b)}</span>`).join("") : "<span>starter kit</span>"}</div>
      ${next ? `<div class="rs-up-buy">
        <div><b>${money(next.tier.price)}</b><small>${esc(next.tier.label)}</small></div>
        <button class="rs-btn small" type="button" data-rs="upgrade" data-id="${esc(item.id)}">Upgrade</button>
      </div>` : `<div class="rs-up-max">Top tier reached</div>`}
      ${editOn() ? `<button class="rs-pen corner" type="button" data-rs="edit-upgrade" data-id="${esc(item.id)}" data-level="${lvl + (next ? 1 : 0)}" aria-label="Edit upgrade">${ICON_PEN}</button>` : ""}
    </div>`;
  }

  function upgrades() {
    const items = R.upgradeList();
    const cats = ["Kitchen", "Dining", "Tech", "Delivery", "Space"];
    return `<div class="rs-body">
      <div class="rs-card">
        <div class="rs-card-head"><h2>The build</h2><span class="rs-tag">${money(Math.round(R.state.cash))} in the till</span></div>
        <p class="rs-sub">Every tier is a real cost. Kitchen speed sets how many plates leave the pass, seats set how many people fit, and both are capped by the floor you can afford to rent.</p>
      </div>
      ${cats.map(cat => {
        const list = items.filter(u => u.cat === cat);
        if (!list.length) return "";
        return `<div class="rs-card">
          <div class="rs-card-head"><h2>${esc(cat)}</h2><span class="rs-tag">${list.length}</span></div>
          <div class="rs-ups">${list.map(upgradeCard).join("")}</div>
        </div>`;
      }).join("")}
    </div>`;
  }

  /* ---------------------------------------------------------
     Orders & promotions
     --------------------------------------------------------- */
  function orders() {
    const s = R.state;
    const listed = Number(s.upgrades.platform) > 0;
    const e = R.effects();
    const last = s.stats || { onlineOrders: 0 };

    return `<div class="rs-body">
      <div class="rs-card">
        <div class="rs-card-head"><h2>Online orders</h2><span class="rs-tag ${listed ? "good" : ""}">${listed ? "listed" : "not listed"}</span></div>
        <div class="rs-split">
          <div><span>Orders yesterday</span><b>${last.onlineOrders || 0}</b></div>
          <div><span>Delivery capacity</span><b>${e.online}/day</b></div>
          <div><span>Platform commission</span><b>28%</b></div>
          <div><span>Packaging</span><b>${money(Number(s.upgrades.packaging) > 0 ? 5 : 7)}/order</b></div>
        </div>
        <p class="rs-hint">Delivery is thinner margin than a table, but it fills the kitchen on quiet nights. List on the app, then add bikes to keep up.</p>
        <button class="rs-btn" type="button" data-rs="tab" data-tab="upgrades">Manage delivery kit →</button>
      </div>

      ${R.state.stats && R.state.stats.demand >= R.capacity().total
        ? `<div class="rs-alert warn">The room is already full — ${R.state.stats.demand} people wanted a table and you seated ${R.state.stats.covers}. A discount can't add covers you don't have; it only cuts the bill.</div>`
        : ""}

      <div class="rs-card">
        <div class="rs-card-head"><h2>Discounts & promotions</h2>
          <span class="rs-tag ${s.promo ? "good" : ""}">${s.promo ? s.promo.daysLeft + " days left" : "none running"}</span></div>
        ${s.promo ? `
          <div class="rs-promo-live">
            <div>
              <b>${esc(s.promo.label)}</b>
              <small>${Math.round(s.promo.discount * 100)}% off · ${s.promo.mult}× foot traffic</small>
            </div>
            <button class="rs-mini danger" type="button" data-rs="stop-promo">Pull it</button>
          </div>` : ""}
        <div class="rs-promos">
          ${R.PROMOS.map(p => `<div class="rs-promo">
            <div class="rs-row-main"><b>${esc(p.label)}</b><small>${esc(p.blurb)}</small></div>
            <div class="rs-promo-buy">
              <span>${money(p.cost)}<small> · ${money(Math.round(p.cost / p.days))}/day</small></span>
              <button class="rs-mini" type="button" data-rs="promo" data-id="${esc(p.id)}"
                ${s.promo || s.promoCooldown > 0 ? "disabled" : ""}>Run</button>
            </div>
          </div>`).join("")}
        </div>
        <p class="rs-hint">A promotion only pays when you have empty seats to fill. Discount a full room and you just cut the bill.</p>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------
     Reports
     --------------------------------------------------------- */
  function reports() {
    const s = R.state;
    const st = s.stats;
    const days = R.lastDays(14);
    const max = Math.max.apply(null, days.map(d => Math.max(d.revenue, 1)).concat([1]));

    return `<div class="rs-body">
      ${st ? `<div class="rs-card">
        <div class="rs-card-head"><h2>Day ${st.day} · ${esc(st.weekday)}</h2>
          <span class="rs-tag">${st.stars ? st.stars.toFixed(1) + "★" : "no reviews"}</span></div>
        <div class="rs-pl">
          <div class="rs-line"><span>Covers served</span><b>${st.covers} of ${st.demand}</b></div>
          <div class="rs-line"><span>Online orders</span><b>${st.onlineOrders}</b></div>
          <div class="rs-line"><span>Food & drink revenue</span><b>${money(st.revenue)}</b></div>
          <div class="rs-line"><span>Food & stock cost</span><b class="neg">−${money(st.foodCost)}</b></div>
          <div class="rs-line"><span>Wages</span><b class="neg">−${money(st.wages)}</b></div>
          <div class="rs-line"><span>Electricity</span><b class="neg">−${money(st.power)}</b></div>
          <div class="rs-line"><span>Water</span><b class="neg">−${money(st.water)}</b></div>
          <div class="rs-line"><span>Rent</span><b class="neg">−${money(st.rent)}</b></div>
          <div class="rs-line"><span>Lot levy & rates</span><b class="neg">−${money(st.levies)}</b></div>
          <div class="rs-line"><span>Spoilage</span><b class="neg">−${money(st.spoilage)}</b></div>
          <div class="rs-line"><span>Maintenance</span><b class="neg">−${money(st.maintenance)}</b></div>
          ${st.commission ? `<div class="rs-line"><span>Delivery commission</span><b class="neg">−${money(st.commission)}</b></div>` : ""}
          ${st.marketing ? `<div class="rs-line"><span>Marketing</span><b class="neg">−${money(st.marketing)}</b></div>` : ""}
          ${st.repairs ? `<div class="rs-line"><span>Repairs</span><b class="neg">−${money(st.repairs)}</b></div>` : ""}
          ${st.tax ? `<div class="rs-line"><span>Provisional tax (27%)</span><b class="neg">−${money(st.tax)}</b></div>` : ""}
          <div class="rs-line total"><span>Net</span><b class="${st.profit < 0 ? "neg" : "pos"}">${money(st.profit)}</b></div>
        </div>
      </div>` : ""}

      <div class="rs-card">
        <div class="rs-card-head"><h2>Last 14 days</h2><span class="rs-tag">revenue</span></div>
        <div class="rs-chart">
          ${days.map(d => `<div class="rs-bar-col" title="${esc(d.date)}">
            <div class="rs-bar-fill" style="height:${Math.max(4, Math.round((d.revenue / max) * 100))}%"></div>
            <span>${esc(d.weekday[0])}</span>
          </div>`).join("")}
        </div>
        <div class="rs-legend"><span>Peak ${money(Math.max.apply(null, days.map(d => d.revenue).concat([0])))}</span><span>${days.length} days</span></div>
      </div>

      <div class="rs-card">
        <div class="rs-card-head"><h2>Lifetime</h2><span class="rs-tag">${s.businessDay} days</span></div>
        <div class="rs-split">
          <div><span>Revenue</span><b>${money(s.totals.revenue)}</b></div>
          <div><span>Costs</span><b>${money(s.totals.costs)}</b></div>
          <div><span>Tax paid</span><b>${money(s.totals.tax)}</b></div>
          <div><span>Covers</span><b>${s.totals.covers}</b></div>
        </div>
      </div>

      <div class="rs-card">
        <div class="rs-card-head"><h2>Reviews</h2><span class="rs-tag">${s.reviewCount} total</span></div>
        ${s.reviews.length ? s.reviews.slice(0, 8).map(r => `
          <div class="rs-review">
            <div class="rs-review-top">
              <span class="rs-review-stars">${starRow(r.stars)}</span>
              <b>${esc(r.name || "Guest")}</b>
              <small>${r.stars.toFixed(1)}</small>
            </div>
            <p>${esc(r.text)}</p>
          </div>`).join("") : `<p class="rs-empty">No reviews yet.</p>`}
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------
     Sheets
     --------------------------------------------------------- */
  function sheet(title, bodyHTML, opts) {
    const o = opts || {};
    const modal = document.createElement("div");
    modal.className = "mn-modal";
    modal.innerHTML = `<div class="mn-sheet">
      <header><strong>${esc(title)}</strong><button type="button" data-close>✕</button></header>
      <div class="mn-form">${bodyHTML}</div>
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
    if (o.onMount) o.onMount(modal, close);
    return { modal, close };
  }

  function hireSheet() {
    let role = "waiter";
    const { modal } = sheet("Hire staff", `<div data-hire-body></div>`, {
      onMount(m) {
        const body = m.querySelector("[data-hire-body]");
        const paint = () => {
          const list = R.candidates(role);
          body.innerHTML = `
            <label class="mn-field"><span>Role</span>
              <select data-role>
                ${R.HIREABLE.map(id => `<option value="${id}" ${id === role ? "selected" : ""}>${esc(R.roleDef(id).label)} — ${money(R.roleDef(id).wage)}/day base</option>`).join("")}
              </select>
            </label>
            <p class="rs-hint">${esc(R.roleDef(role).blurb || "")}</p>
            <div class="rs-cands">
              ${list.map((c, i) => `<div class="rs-cand">
                <div class="rs-row-main"><b>${esc(c.name)}</b><small>${c.skill.toFixed(1)}★ · asks ${money(c.wage)}/day</small></div>
                <div class="rs-cand-buy"><span>${money(c.hireFee)}</span>
                  <button class="rs-mini good" type="button" data-pick="${i}">Hire</button></div>
              </div>`).join("")}
            </div>
            <p class="rs-hint">${R.state.staff.length} / ${R.staffCap()} staff on the books. The hire fee covers uniforms, paperwork and training.</p>`;
          body.querySelector("[data-role]").addEventListener("change", e => { role = e.target.value; paint(); });
          body.querySelectorAll("[data-pick]").forEach(btn => {
            btn.addEventListener("click", () => {
              const res = R.hire(list[Number(btn.dataset.pick)]);
              if (res.ok) { toast(res.message); m.remove(); render(); }
              else toast(res.why, true);
            });
          });
        };
        paint();
      }
    });
    return modal;
  }

  function cashSheet(kind) {
    const isDeposit = kind === "deposit";
    const max = isDeposit ? R.personalBalance() : Math.max(0, Math.floor(R.state.cash - 2000));
    sheet(isDeposit ? "Deposit capital" : "Draw profit", `
      <p class="rs-hint">${isDeposit
        ? `Move money from your personal balance (${money(R.personalBalance())}) into the business till.`
        : `Move profit out of the till and into your account. ${money(2000)} stays behind as working cash.`}</p>
      <label class="mn-field"><span>Amount (R)</span>
        <input type="number" min="1" step="100" value="${Math.min(5000, Math.max(0, max))}" data-amt>
      </label>
      <button class="rs-btn primary" type="button" data-go>${isDeposit ? "Deposit" : "Draw"}</button>
    `, {
      onMount(m, close) {
        m.querySelector("[data-go]").addEventListener("click", () => {
          const amt = Number(m.querySelector("[data-amt]").value);
          const res = isDeposit ? R.deposit(amt) : R.withdraw(amt);
          if (res.ok) { toast(res.message); close(); render(); }
          else toast(res.why, true);
        });
      }
    });
  }

  /* ---------------------------------------------------------
     Render
     --------------------------------------------------------- */
  function pageHTML() {
    const s = R.state;
    if (!s.owned) return acquisition();

    let body = overview();
    if (tab === "menu") body = menu();
    else if (tab === "staff") body = staff();
    else if (tab === "upgrades") body = upgrades();
    else if (tab === "orders") body = orders();
    else if (tab === "reports") body = reports();

    return `<section class="dynamic-page-content rs-page">
      ${hero()}
      ${statTiles()}
      ${tabs()}
      ${body}
    </section>`;
  }

  function render() {
    const dp = root();
    if (!dp) return;
    dp.innerHTML = pageHTML();
    const main = document.getElementById("main-content");
    if (main) main.hidden = true;
    dp.hidden = false;
  }
  window.renderRestaurant = render;

  /* ---------------------------------------------------------
     Routing
     --------------------------------------------------------- */
  const prevNavigate = window.navigateTo;
  window.navigateTo = function (page) {
    if (page === "restaurant") {
      document.querySelectorAll(".nav-item").forEach(b =>
        b.classList.toggle("active", b.dataset.page === "business"));
      if (typeof window.nuLimitsInvestLeave === "function") window.nuLimitsInvestLeave();
      if (R.state.owned) tab = "overview";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    return prevNavigate.apply(this, arguments);
  };

  /* ---------------------------------------------------------
     Events
     --------------------------------------------------------- */
  document.addEventListener("click", e => {
    const scope = e.target.closest("#dynamic-page .rs-page");
    if (!scope) return;

    const el = e.target.closest("[data-rs]");
    if (!el) return;
    const act = el.dataset.rs;

    if (act === "tab") { tab = el.dataset.tab; render(); return; }
    if (act === "menu-cat") { menuCat = el.dataset.cat; render(); return; }

    if (act === "buy") {
      const res = R.purchase();
      if (res.ok) { toast(res.message); tab = "overview"; render(); }
      else toast(res.why, true);
      return;
    }

    if (act === "toggle-dish") {
      const res = R.toggleDish(el.dataset.id);
      if (res.ok) { toast(res.message); render(); } else toast(res.why, true);
      return;
    }

    if (act === "hire") { hireSheet(); return; }
    if (act === "deposit") { cashSheet("deposit"); return; }
    if (act === "withdraw") { cashSheet("withdraw"); return; }

    if (act === "fire") {
      if (!window.confirm("Let this person go? Three days' severance is paid out of the till.")) return;
      const res = R.fire(el.dataset.id);
      if (res.ok) { toast(res.message); render(); } else toast(res.why, true);
      return;
    }

    if (act === "promote") {
      const res = R.promote(el.dataset.id);
      if (res.ok) { toast(res.message); render(); } else toast(res.why, true);
      return;
    }

    if (act === "upgrade") {
      const res = R.buyUpgrade(el.dataset.id);
      if (res.ok) { toast(res.message); render(); } else toast(res.why, true);
      return;
    }

    if (act === "promo") {
      const res = R.startPromo(el.dataset.id);
      if (res.ok) { toast(res.message); render(); } else toast(res.why, true);
      return;
    }

    if (act === "stop-promo") {
      const res = R.stopPromo();
      if (res.ok) { toast(res.message); render(); } else toast(res.why, true);
      return;
    }

    if (act === "edit-profile") { if (E()) E().profile(); return; }
    if (act === "edit-menu" || act === "edit-dish") { if (E()) E().dish(el.dataset.id || null); return; }
    if (act === "edit-employee") { if (E()) E().employee(el.dataset.id); return; }
    if (act === "edit-upgrade") { if (E()) E().upgrade(el.dataset.id, Number(el.dataset.level) || 0); return; }
    if (act === "edit-wages") { if (E()) E().wages(); return; }
    if (act === "edit-levels") { if (E()) E().levels(el.dataset.id); return; }
  });

  /* live updates from the simulation */
  R.onChange(() => { if (document.querySelector(".rs-page")) render(); });

  if (window.nuLimitsEditMode && window.nuLimitsEditMode.onChange) {
    window.nuLimitsEditMode.onChange(() => { if (document.querySelector(".rs-page")) render(); });
  }

  window.nuLimitsRestaurantUI = { render, openTab: t => { tab = t; render(); } };
})();
