/* ==========================================================
   NU LIMITS — NU LIMITS STORE  (round 42)

   The Base44 storefront, rebuilt as a plain module so it can
   live inside the game:
     · hero with outlined type + scanline, featured piece
     · frosted inventory panel, 4 slots per page
     · collection grid with category filter
     · product view with sizes, quantity and Add to bag
     · bag drawer + checkout that debits the game wallet
     · bought pieces lock to OWNED (no separate inventory)
     · Creator Edit Mode drives the whole store

   Save: nuLimitsShopApp_v1
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsShopApp_v1";
  const PER_PAGE = 4;

  const money = n => "R " + Math.round(Number(n) || 0).toLocaleString("en-ZA");
  const uid = () => "ns_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
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
    el.__t = setTimeout(() => el.classList.remove("show"), 2600);
  }

  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const free = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());
  const balance = () => (window.nuLimitsMoney && window.nuLimitsMoney.getBalance)
    ? window.nuLimitsMoney.getBalance() : 0;

  /* ---------------------------------------------------------
     Seeds
     --------------------------------------------------------- */
  const SEED_SETTINGS = {
    store_name: "NU LIMITS",
    tagline: "Nu Limits Store",
    hero_kicker: "New release",
    hero_caption: "This is concept art using artificial technology & Photoshop",
    panel_description:
      "A combination of modern streetwear with advanced technological wearables, for a unique style.",
    background: "noir",
    currency: "R"
  };

  const BACKGROUNDS = [
    { id: "noir", label: "Noir" },
    { id: "aurora", label: "Aurora" },
    { id: "grid", label: "Grid" },
    { id: "ember", label: "Ember" }
  ];

  const SEED_ITEMS = [
    {
      name: "Vector Shell Jacket", price: 2890, category: "Outerwear",
      description: "Three-layer technical shell with reflective seam tape and a storm collar. Cut boxy, built for the city at night.",
      image_url: "images/shopapp/piece-jacket.jpg", sizes: "S,M,L,XL", stock: 8, featured: true, sort_order: 1
    },
    {
      name: "Static Heavy Hoodie", price: 1650, category: "Tops",
      description: "480 gsm loop-back cotton with a laser-cut chest panel and a double-layer hood.",
      image_url: "images/shopapp/piece-hoodie.jpg", sizes: "S,M,L,XL", stock: 12, sort_order: 2
    },
    {
      name: "Cargo Cell Trousers", price: 1980, category: "Bottoms",
      description: "Articulated technical cargo with modular straps, hidden zip pockets and a tapered ankle.",
      image_url: "images/shopapp/piece-cargo.jpg", sizes: "S,M,L,XL", stock: 6, sort_order: 3
    },
    {
      name: "Modular Utility Vest", price: 2240, category: "Outerwear",
      description: "Matte tactical vest with detachable pocket modules and a soft-lit seam along the placket.",
      image_url: "images/shopapp/piece-vest.jpg", sizes: "S,M,L,XL", stock: 5, sort_order: 4
    },
    {
      name: "Halo High-Top", price: 3190, category: "Footwear",
      description: "Chunky sculpted sole in translucent rubber, suede overlays and a padded collar.",
      image_url: "images/shopapp/piece-sneaker.jpg", sizes: "39,40,41,42,43,44", stock: 9, sort_order: 5
    },
    {
      name: "Eclipse Shield Shades", price: 1290, category: "Accessories",
      description: "Single-lens wraparound shield with a magenta mirror finish and a matte frame.",
      image_url: "images/shopapp/piece-shades.jpg", sizes: "One size", stock: 14, sort_order: 6
    }
  ];

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  function normalizeItem(it) {
    const out = Object.assign({
      id: uid(), name: "New piece", price: 0, description: "", image_url: "",
      category: "Outerwear", sizes: "S,M,L,XL", stock: 10,
      featured: false, active: true, sort_order: 0, owned: false, purchasedAt: null
    }, it || {});
    out.price = Math.max(0, Math.round(Number(out.price) || 0));
    out.stock = Math.max(0, Math.round(Number(out.stock) || 0));
    out.owned = !!out.owned;
    out.active = out.active !== false;
    return out;
  }

  function normalizeLine(l) {
    return {
      key: String(l.key || uid()),
      id: String(l.id || ""),
      name: String(l.name || "Piece"),
      price: Math.max(0, Math.round(Number(l.price) || 0)),
      image_url: String(l.image_url || ""),
      size: String(l.size || ""),
      qty: Math.max(1, Math.round(Number(l.qty) || 1))
    };
  }

  function normalizeOrder(o) {
    return Object.assign({
      order_number: "NU-00000", customer_name: "", customer_email: "",
      phone: "", address: "", notes: "", items: [], item_count: 0,
      total: 0, status: "new", day: null, date: null
    }, o || {}, { items: Array.isArray(o && o.items) ? o.items : [] });
  }

  let state = load();

  function blank() {
    return {
      version: 1,
      settings: JSON.parse(JSON.stringify(SEED_SETTINGS)),
      items: SEED_ITEMS.map(normalizeItem),
      orders: [],
      cart: []
    };
  }

  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { saved = null; }
    if (!saved || typeof saved !== "object") {
      const fresh = blank();
      try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch {}
      return fresh;
    }

    const out = {
      version: 1,
      settings: Object.assign({}, SEED_SETTINGS, saved.settings || {}),
      items: (Array.isArray(saved.items) ? saved.items : []).map(normalizeItem),
      orders: (Array.isArray(saved.orders) ? saved.orders : []).map(normalizeOrder),
      cart: (Array.isArray(saved.cart) ? saved.cart : []).map(normalizeLine)
    };

    /* a fresh save that predates the storefront still gets the seed pieces */
    if (!out.items.length) out.items = SEED_ITEMS.map(normalizeItem);
    return out;
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch {
      toast("Couldn't save — a photo may be too large.");
      return false;
    }
  }

  /* ---------------------------------------------------------
     UI state
     --------------------------------------------------------- */
  const ui = {
    activeId: null,       /* product dialog */
    cartOpen: false,
    checkoutOpen: false,
    collectionOpen: false,
    category: "All",
    page: 0,
    placed: null,
    manageOpen: false
  };

  const items = () => state.items.filter(i => i.active).sort((a, b) => a.sort_order - b.sort_order);
  const findItem = id => state.items.find(i => i.id === id);
  const featured = () => items().find(i => i.featured) || items()[0] || null;
  const cartCount = () => state.cart.reduce((n, l) => n + l.qty, 0);
  const subtotal = () => state.cart.reduce((n, l) => n + l.price * l.qty, 0);
  const categories = () => ["All", ...Array.from(new Set(items().map(i => i.category).filter(Boolean)))];
  const sizesOf = it => String(it && it.sizes || "").split(",").map(s => s.trim()).filter(Boolean);

  const draft = { size: "", qty: 1 };

  /* ---------------------------------------------------------
     Bits
     --------------------------------------------------------- */
  const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  const ICON_MINUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12h14"/></svg>';
  const ICON_BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>';
  const ICON_SWAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>';

  function pill(label, attrs, size) {
    return `<button class="nsa-pill ${size === "sm" ? "is-sm" : ""}" type="button" ${attrs}>
      <span>${esc(label)}</span>
      <span class="nsa-pill-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span>
    </button>`;
  }

  function badge(act, id, icon, title) {
    return `<button class="nsa-badge" type="button" data-nsa="${act}" data-id="${esc(id)}" aria-label="${esc(title)}">${icon}</button>`;
  }

  /* ---------------------------------------------------------
     Views
     --------------------------------------------------------- */
  function tileHTML(it, i) {
    const soldOut = it.stock === 0;
    return `<div class="nsa-tile${soldOut ? " is-out" : ""}" role="button" tabindex="0" data-nsa="open" data-id="${esc(it.id)}" style="--i:${i}">
      <span class="nsa-tile-art" style="background-image:url('${esc(it.image_url)}')"></span>
      <span class="nsa-tile-shade"></span>
      ${it.owned ? '<span class="nsa-owned">Owned</span>' : soldOut ? '<span class="nsa-sold">Sold out</span>' : ""}
      <span class="nsa-tile-txt">
        <b>${esc(it.name)}</b>
        <small>${esc(money(it.price))}</small>
      </span>
      <span class="nsa-tile-plus">${ICON_PLUS}</span>
      ${editOn() ? `<span class="nsa-tile-tools">
        ${badge("edit", it.id, "✎", "Name and price")}
        ${badge("swap", it.id, ICON_SWAP, "Photo from gallery")}
        ${badge("del", it.id, ICON_X, "Delete slot")}
      </span>` : ""}
    </div>`;
  }

  function heroHTML() {
    const f = featured();
    const words = String(state.settings.store_name || "NU LIMITS").split(" ");

    return `<section class="nsa-hero" data-bg="${esc(state.settings.background)}">
      <div class="nsa-bg" aria-hidden="true">
        <span class="nsa-grid"></span>
        <span class="nsa-blob b1"></span>
        <span class="nsa-blob b2"></span>
        <span class="nsa-blob b3"></span>
        <span class="nsa-vignette"></span>
      </div>

      <div class="nsa-hero-type" aria-hidden="true">
        ${words.map(w => `<span>${esc(w)}</span>`).join("")}
      </div>

      <div class="nsa-hero-art">
        ${f ? `<span class="nsa-hero-img" style="background-image:url('${esc(f.image_url)}')"></span>
        <span class="nsa-scan"></span>
        <span class="nsa-hero-fade"></span>` : '<span class="nsa-hero-empty">No pieces yet</span>'}
        ${f && editOn() ? `<span class="nsa-hero-tools">
          ${badge("swap-featured", f.id, ICON_SWAP, "Replace featured photo")}
          ${badge("edit-featured", f.id, "✎", "Edit featured piece")}
        </span>` : ""}
      </div>

      ${f ? `<button class="nsa-feature-chip" type="button" data-nsa="open" data-id="${esc(f.id)}">
        <small>Featured</small>
        <b>${esc(f.name)}</b>
        <span>${esc(money(f.price))}</span>
      </button>` : ""}

      <div class="nsa-hero-card">
        <p class="nsa-kicker">${esc(state.settings.hero_kicker)}${editOn() ? ' <button class="nsa-inline" type="button" data-nsa="e-kicker">edit</button>' : ""}</p>
        <p class="nsa-caption">${esc(state.settings.hero_caption)}${editOn() ? ' <button class="nsa-inline" type="button" data-nsa="e-caption">edit</button>' : ""}</p>
        <div class="nsa-hero-card-row">
          ${pill("Discover", 'data-nsa="browse"')}
          ${f ? `<button class="nsa-hero-thumb" type="button" data-nsa="open" data-id="${esc(f.id)}" style="background-image:url('${esc(f.image_url)}')" aria-label="${esc(f.name)}"></button>` : ""}
        </div>
      </div>
    </section>`;
  }

  function panelHTML() {
    const list = items();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (ui.page > pages - 1) ui.page = pages - 1;
    const visible = list.slice(ui.page * PER_PAGE, ui.page * PER_PAGE + PER_PAGE);

    return `<aside class="nsa-panel">
      <div class="nsa-panel-head">
        <span>${esc(state.settings.store_name)}</span>
        <small>${list.length} piece${list.length === 1 ? "" : "s"}</small>
      </div>

      <p class="nsa-panel-desc">${esc(state.settings.panel_description)}${editOn() ? ' <button class="nsa-inline" type="button" data-nsa="e-panel">edit</button>' : ""}</p>

      <div class="nsa-panel-cta">${pill("Discover", 'data-nsa="browse"', "sm")}</div>

      <div class="nsa-slots">
        ${visible.map(tileHTML).join("")}
        ${editOn() ? `<button class="nsa-slot-add" type="button" data-nsa="add">
          <span class="plus">${ICON_PLUS}</span><b>Add piece</b><small>photo · name · price</small>
        </button>` : ""}
        ${!list.length ? '<p class="nsa-empty">Inventory empty — add a piece in Edit Mode.</p>' : ""}
      </div>

      <div class="nsa-pager">
        <div class="nsa-dots">
          ${Array.from({ length: pages }).map((_, i) =>
            `<button type="button" data-nsa="page" data-i="${i}" aria-label="Page ${i + 1}" class="${i === ui.page ? "on" : ""}"></button>`).join("")}
        </div>
        <div class="nsa-arrows">
          <button type="button" data-nsa="prev" ${ui.page === 0 ? "disabled" : ""} aria-label="Previous">⌃</button>
          <button type="button" data-nsa="next" ${ui.page >= pages - 1 ? "disabled" : ""} aria-label="Next">⌄</button>
        </div>
      </div>
    </aside>`;
  }

  function topbarHTML() {
    return `<header class="nsa-top">
      <button class="nsa-exit" type="button" data-nsa="back-stores" aria-label="Back to stores">←</button>
      <button class="nsa-brand" type="button" data-nsa="back-stores">${esc(state.settings.store_name)}</button>
      <div class="nsa-top-actions">
        <button class="nsa-topbtn" type="button" data-nsa="cart">${ICON_BAG}<span>Bag</span><i>${cartCount()}</i></button>
        <button class="nsa-topbtn" type="button" data-nsa="orders">Orders<i>${state.orders.length}</i></button>
        <button class="nsa-topbtn is-edit${editOn() ? " on" : ""}" type="button" data-nsa="toggle-edit">
          ${editOn() ? "Editing" : "Edit"}
        </button>
        ${editOn() ? '<button class="nsa-topbtn is-manage" type="button" data-nsa="manage">Manage</button>' : ""}
      </div>
    </header>`;
  }

  function storefrontHTML() {
    return `${topbarHTML()}
      <div class="nsa-main">
        ${heroHTML()}
        ${panelHTML()}
      </div>`;
  }

  /* dialogs ------------------------------------------------- */
  function modal(inner, cls) {
    return `<div class="nsa-modal ${cls || ""}">
      <button class="nsa-modal-veil" type="button" data-nsa="close-modal" aria-label="Close"></button>
      <div class="nsa-modal-body" role="dialog" aria-modal="true">
        <button class="nsa-modal-x" type="button" data-nsa="close-modal" aria-label="Close">${ICON_X}</button>
        ${inner}
      </div>
    </div>`;
  }

  function productHTML() {
    const it = findItem(ui.activeId);
    if (!it) return "";
    const sizes = sizesOf(it);
    const soldOut = it.stock === 0;
    const body = `<div class="nsa-product">
      <div class="nsa-product-art" style="background-image:url('${esc(it.image_url)}')">
        <span class="nsa-product-fade"></span>
        ${editOn() ? `<span class="nsa-product-tools">
          ${badge("swap", it.id, ICON_SWAP, "Replace photo")}
        </span>` : ""}
      </div>
      <div class="nsa-product-side">
        <p class="nsa-kicker">${esc(it.category || "Nu Limits")}${editOn() ? ' <button class="nsa-inline" type="button" data-nsa="edit" data-id="' + esc(it.id) + '">edit</button>' : ""}</p>
        <h2>${esc(it.name)}</h2>
        <p class="nsa-product-price">${esc(money(it.price))}${it.owned ? ' <span class="nsa-owned is-inline">Owned</span>' : ""}</p>
        <p class="nsa-product-desc">${esc(it.description || "")}</p>

        ${sizes.length && sizes[0] !== "One size" ? `<div class="nsa-sizes">
          <p class="nsa-label">Size</p>
          <div class="nsa-size-row">
            ${sizes.map(s => `<button type="button" data-nsa="size" data-s="${esc(s)}" class="${draft.size === s ? "on" : ""}">${esc(s)}</button>`).join("")}
          </div>
        </div>` : ""}

        <div class="nsa-buy-row">
          <div class="nsa-qty">
            <button type="button" data-nsa="qty-" aria-label="Less">${ICON_MINUS}</button>
            <span>${draft.qty}</span>
            <button type="button" data-nsa="qty+" aria-label="More">${ICON_PLUS}</button>
          </div>
          ${it.owned
            ? pill("Already owned", 'data-nsa="none" disabled')
            : pill(soldOut ? "Sold out" : "Add to bag", `data-nsa="add-bag" data-id="${esc(it.id)}"${soldOut ? " disabled" : ""}`)}
        </div>

        <p class="nsa-fine">${soldOut ? "Restocking soon" : `${it.stock} in stock · ships in 2–4 days`}</p>
      </div>
    </div>`;
    return modal(body, "is-product");
  }

  function collectionHTML() {
    const cat = ui.category;
    const list = cat === "All" ? items() : items().filter(i => i.category === cat);
    const body = `<div class="nsa-collection">
      <p class="nsa-kicker">Collection</p>
      <h2>Every piece</h2>
      <div class="nsa-chips">
        ${categories().map(c => `<button type="button" data-nsa="cat" data-c="${esc(c)}" class="${c === cat ? "on" : ""}">${esc(c)}</button>`).join("")}
      </div>
      <div class="nsa-grid-cards">
        ${list.map(it => `<button class="nsa-card${it.stock === 0 ? " is-out" : ""}" type="button" data-nsa="open" data-id="${esc(it.id)}">
          <span class="nsa-card-art" style="background-image:url('${esc(it.image_url)}')"></span>
          <span class="nsa-card-txt">
            <b>${esc(it.name)}</b>
            <small>${esc(money(it.price))}</small>
          </span>
          ${it.owned ? '<span class="nsa-owned">Owned</span>' : it.stock === 0 ? '<span class="nsa-sold">Sold out</span>' : ""}
        </button>`).join("")}
        ${!list.length ? '<p class="nsa-empty">Nothing in this category yet.</p>' : ""}
      </div>
    </div>`;
    return modal(body, "is-collection");
  }

  function cartHTML() {
    const lines = state.cart;
    return `<aside class="nsa-drawer">
      <div class="nsa-drawer-head">
        <div><small>Nu Limits</small><h3>Your bag</h3></div>
        <button type="button" data-nsa="close-modal" aria-label="Close">${ICON_X}</button>
      </div>
      <div class="nsa-drawer-body">
        ${!lines.length ? `<div class="nsa-drawer-empty">
          <p>Your bag is empty.</p>
          ${pill("Browse collection", 'data-nsa="browse"', "sm")}
        </div>` : lines.map(l => `<article class="nsa-line">
          <span class="nsa-line-art" style="background-image:url('${esc(l.image_url)}')"></span>
          <div class="nsa-line-txt">
            <b>${esc(l.name)}</b>
            <small>${esc(l.size || "One size")}</small>
            <div class="nsa-line-row">
              <div class="nsa-line-qty">
                <button type="button" data-nsa="line-" data-key="${esc(l.key)}" aria-label="Less">${ICON_MINUS}</button>
                <span>${l.qty}</span>
                <button type="button" data-nsa="line+" data-key="${esc(l.key)}" aria-label="More">${ICON_PLUS}</button>
              </div>
              <b>${esc(money(l.price * l.qty))}</b>
              <button class="nsa-line-del" type="button" data-nsa="line-del" data-key="${esc(l.key)}" aria-label="Remove">${ICON_X}</button>
            </div>
          </div>
        </article>`).join("")}
      </div>
      ${lines.length ? `<div class="nsa-drawer-foot">
        <div class="nsa-sub"><span>Subtotal</span><b>${esc(money(subtotal()))}</b></div>
        <p class="nsa-fine">Shipping confirmed on the next step.</p>
        ${pill("Checkout", 'data-nsa="checkout"')}
      </div>` : ""}
    </aside>`;
  }

  function checkoutHTML() {
    if (ui.placed) {
      const o = ui.placed;
      return `<div class="nsa-placed">
        <span class="nsa-tick">✓</span>
        <h2>Order placed</h2>
        <p>Thanks ${esc(String(o.customer_name || "player").split(" ")[0])} — the studio has your order.</p>
        <div class="nsa-ref">
          <small>Reference</small>
          <b>${esc(o.order_number)}</b>
          <span>${esc(money(o.total))}</span>
        </div>
        <p class="nsa-fine">Paid from your wallet · ${esc(money(o.total))} debited</p>
        ${pill("Keep browsing", 'data-nsa="close-modal"')}
      </div>`;
    }

    const name = localStorage.getItem("nuLimitsPlayerName") || localStorage.getItem("playerName") || "";
    return `<form class="nsa-checkout" data-nsa-form>
      <div class="nsa-checkout-form">
        <p class="nsa-kicker">Checkout</p>
        <h2>Your details</h2>
        <label><span>Full name</span><input name="name" value="${esc(name)}" placeholder="Naledi Mokoena" autocomplete="name"></label>
        <label><span>Email</span><input name="email" type="email" placeholder="you@studio.com" autocomplete="email"></label>
        <label><span>Phone</span><input name="phone" placeholder="+27 00 000 0000"></label>
        <label><span>Delivery address</span><textarea name="address" rows="2" placeholder="Street, city, postal code"></textarea></label>
        <label><span>Notes</span><input name="notes" placeholder="Size preference, drop-off note"></label>
        <p class="nsa-error" data-nsa-error hidden></p>
      </div>
      <div class="nsa-checkout-side">
        <p class="nsa-label">Order</p>
        <ul>${state.cart.map(l => `<li><span>${l.qty} × ${esc(l.name)}${l.size ? " — " + esc(l.size) : ""}</span><b>${esc(money(l.price * l.qty))}</b></li>`).join("")}</ul>
        <div class="nsa-sub"><span>Total</span><b>${esc(money(subtotal()))}</b></div>
        <p class="nsa-fine">Wallet balance ${esc(money(balance()))}${free() ? " · free play" : ""}</p>
        ${pill("Place order", 'data-nsa="place"')}
      </div>
    </form>`;
  }

  function manageHTML() {
    const s = state.settings;
    const body = `<div class="nsa-manage">
      <p class="nsa-kicker">Edit Mode</p>
      <h2>Manage store</h2>

      <div class="nsa-manage-grid">
        <label><span>Store name</span><input data-nsa-f="store_name" value="${esc(s.store_name)}"></label>
        <label><span>Currency</span><input data-nsa-f="currency" value="${esc(s.currency)}"></label>
        <label class="wide"><span>Hero kicker</span><input data-nsa-f="hero_kicker" value="${esc(s.hero_kicker)}"></label>
        <label class="wide"><span>Hero caption</span><textarea data-nsa-f="hero_caption" rows="2">${esc(s.hero_caption)}</textarea></label>
        <label class="wide"><span>Panel description</span><textarea data-nsa-f="panel_description" rows="2">${esc(s.panel_description)}</textarea></label>
      </div>

      <p class="nsa-label">Background</p>
      <div class="nsa-bgs">
        ${BACKGROUNDS.map(b => `<button type="button" data-nsa="bg" data-b="${b.id}" class="${s.background === b.id ? "on" : ""}">${esc(b.label)}</button>`).join("")}
      </div>

      <div class="nsa-manage-head">
        <p class="nsa-label">Inventory · ${state.items.length} pieces</p>
        <button class="nsa-mini" type="button" data-nsa="add">Add piece</button>
      </div>
      <ul class="nsa-manage-list">
        ${state.items.map(it => `<li>
          <span class="nsa-manage-art" style="background-image:url('${esc(it.image_url)}')"></span>
          <div class="nsa-manage-txt">
            <b>${esc(it.name)}</b>
            <small>${esc(money(it.price))} · ${esc(it.category)} · ${it.stock} in stock${it.featured ? " · featured" : ""}${it.owned ? " · owned" : ""}</small>
          </div>
          <div class="nsa-manage-actions">
            <button class="nsa-mini" type="button" data-nsa="edit" data-id="${esc(it.id)}">Edit</button>
            <button class="nsa-mini" type="button" data-nsa="feature" data-id="${esc(it.id)}">${it.featured ? "Unfeature" : "Feature"}</button>
            <button class="nsa-mini danger" type="button" data-nsa="del" data-id="${esc(it.id)}">Delete</button>
          </div>
        </li>`).join("")}
      </ul>

      <div class="nsa-manage-foot">
        ${pill("Save store", 'data-nsa="save-settings"')}
      </div>
    </div>`;
    return modal(body, "is-manage");
  }

  function ordersHTML() {
    const list = state.orders.slice().reverse();
    const body = `<div class="nsa-orders">
      <p class="nsa-kicker">Orders</p>
      <h2>Your orders</h2>
      ${!list.length ? '<p class="nsa-empty">No orders yet.</p>' : list.map(o => `<article class="nsa-order">
        <div class="nsa-order-head"><b>${esc(o.order_number)}</b><span>${esc(money(o.total))}</span></div>
        <p>${o.items.map(i => `${i.quantity} × ${esc(i.name)}`).join(", ")}</p>
        <small>${o.item_count} item${o.item_count === 1 ? "" : "s"} · ${esc(o.status)}</small>
      </article>`).join("")}
    </div>`;
    return modal(body, "is-orders");
  }

  function overlaysHTML() {
    if (ui.activeId) return productHTML();
    if (ui.cartOpen) return modal(cartHTML(), "is-drawer");
    if (ui.checkoutOpen) return modal(checkoutHTML(), "is-checkout");
    if (ui.collectionOpen) return collectionHTML();
    return "";
  }

  function manageOverlay() {
    return ui.manageOpen ? manageHTML() : "";
  }

  function page() {
    return `<section class="dynamic-page-content sh-page nsa">
      ${storefrontHTML()}
      <div class="nsa-layer"></div>
      ${editOn() ? `<div class="nsa-editbar">
        <span>Edit Mode · store, hero, pieces</span>
        <button type="button" data-nsa="manage">Manage store</button>
      </div>` : ""}
      <button class="secondary-button nsa-back" type="button" data-nsa="back-stores">← Back to stores</button>
    </section>`;
  }

  let ordersOpen = false;

  /* ---------------------------------------------------------
     Render
     --------------------------------------------------------- */
  /* overlays live on <body> so fixed positioning is never trapped
     by a backdrop-filter ancestor */
  function syncOverlay() {
    let root = document.getElementById("nsa-overlay-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "nsa-overlay-root";
      document.body.appendChild(root);
    }
    root.innerHTML = overlaysHTML() + (ordersOpen ? ordersHTML() : "") + manageOverlay();
  }

  function clearOverlay() {
    const root = document.getElementById("nsa-overlay-root");
    if (root) root.innerHTML = "";
  }

  function render() {
    const host = document.querySelector(".sh-page.nsa");
    if (!host) return;
    const y = window.scrollY;
    host.outerHTML = page();
    syncOverlay();
    window.scrollTo({ top: y });
  }

  /* ---------------------------------------------------------
     Cart + buying
     --------------------------------------------------------- */
  function addToBag(it, size, qty) {
    const key = `${it.id}__${size || "one"}`;
    const line = state.cart.find(l => l.key === key);
    if (line) line.qty += qty;
    else state.cart.push(normalizeLine({
      key, id: it.id, name: it.name, price: it.price, image_url: it.image_url, size: size || "", qty
    }));
    persist();
    ui.activeId = null;
    ui.checkoutOpen = false;
    ui.cartOpen = true;
    render();
    toast(`${it.name} added to your bag`);
  }

  function placeOrder(form) {
    const total = subtotal();
    if (!state.cart.length) return;

    if (!free() && !window.nuLimitsCanPay(total)) {
      const have = window.nuLimitsSpendable ? window.nuLimitsSpendable() : balance();
      const err = document.querySelector("[data-nsa-error]");
      if (err) {
        err.hidden = false;
        err.textContent = `Not enough funds — you're ${money(total - have)} short.`;
      }
      toast(`Not enough funds — you're ${money(total - have)} short.`);
      return;
    }

    const ref = "NU-" + Date.now().toString(36).toUpperCase().slice(-5);
    const label = `NU Limits store — ${state.cart.length} line${state.cart.length === 1 ? "" : "s"} · ${ref}`;

    const order = normalizeOrder({
      order_number: ref,
      customer_name: form.name || "Player",
      customer_email: form.email || "",
      phone: form.phone || "",
      address: form.address || "",
      notes: form.notes || "",
      items: state.cart.map(l => ({ item_id: l.id, name: l.name, size: l.size, quantity: l.qty, price: l.price })),
      item_count: cartCount(),
      total,
      status: "new",
      day: (window.nuLimitsWorld && window.nuLimitsWorld.day) || null,
      date: new Date().toISOString()
    });

    /* debit only once the order is ready to commit */
    if (!free()) {
      if (!window.nuLimitsMoney || !window.nuLimitsMoney.transact("expense", total, label)) {
        toast("Purchase failed — check your balance.");
        return;
      }
    }

    /* bought = owned */
    state.cart.forEach(l => {
      const it = findItem(l.id);
      if (it) {
        it.owned = true;
        it.purchasedAt = order.date;
        it.stock = Math.max(0, it.stock - l.qty);
      }
    });

    state.orders.push(order);
    state.cart = [];
    state.day = order.day;
    persist();

    ui.placed = order;
    ui.checkoutOpen = true;
    ui.cartOpen = false;
    render();
  }

  /* ---------------------------------------------------------
     Editors
     --------------------------------------------------------- */
  const ask = (label, cur) => { const r = window.prompt(label, cur == null ? "" : cur); return r == null ? null : r; };
  const num = raw => {
    const n = Math.round(Number(String(raw).replace(/[^\d.-]/g, "")));
    return Number.isFinite(n) ? n : null;
  };

  /* round 44 — photos come from the phone gallery / camera roll.
     A hidden file input is opened straight away: no URL prompts. */
  function pickImage(cb) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const W = 720, H = Math.round(720 * 4 / 3);
        const c = document.createElement("canvas");
        c.width = W; c.height = H;
        const ctx = c.getContext("2d");
        const sc = Math.max(W / img.width, H / img.height);
        ctx.drawImage(img, (W - img.width * sc) / 2, (H - img.height * sc) / 2, img.width * sc, img.height * sc);
        cb(c.toDataURL("image/jpeg", 0.74));
        URL.revokeObjectURL(url);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    };
    input.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;width:1px;height:1px;";
    document.body.appendChild(input);
    input.addEventListener("change", () => setTimeout(() => input.remove(), 0));
    input.click();
    return input;
  }

  function editItem(id) {
    const it = id ? findItem(id) : null;
    const isNew = !it;

    const sheet = document.createElement("div");
    sheet.className = "mn-modal";
    sheet.innerHTML = `
      <div class="mn-sheet" role="dialog" aria-modal="true" aria-label="Edit piece">
        <header><strong>${isNew ? "Add" : "Edit"} piece</strong>
          <button type="button" data-x="close" aria-label="Close">×</button>
        </header>
        <div class="mn-form">
          <div class="mn-field">
            <label>PHOTO</label>
            <div class="mn-photo-row">
              <div class="mn-photo-thumb" data-thumb style="width:64px;height:85px;border-radius:12px;background-size:cover;background-position:center;${it && it.image_url ? `background-image:url('${esc(it.image_url)}')` : ""}"></div>
              <div class="mn-photo-actions">
                <button type="button" class="nsa-pick" data-x="pick">Choose from gallery</button>
                <small>Opens your photos — pick one and it drops straight in.</small>
              </div>
            </div>
            <input type="file" accept="image/*" data-file hidden>
          </div>
          <div class="mn-field"><label>NAME</label><input type="text" data-f="name" maxlength="42" value="${it ? esc(it.name) : ""}"></div>
          <div class="mn-two">
            <div class="mn-field"><label>PRICE (R)</label><input type="number" data-f="price" min="0" step="10" value="${it ? it.price : 0}"></div>
            <div class="mn-field"><label>STOCK</label><input type="number" data-f="stock" min="0" step="1" value="${it ? it.stock : 10}"></div>
          </div>
          <div class="mn-two">
            <div class="mn-field"><label>CATEGORY</label><input type="text" data-f="category" value="${it ? esc(it.category) : "Outerwear"}"></div>
            <div class="mn-field"><label>SIZES</label><input type="text" data-f="sizes" value="${it ? esc(it.sizes) : "S,M,L,XL"}"></div>
          </div>
          <div class="mn-field"><label>DESCRIPTION</label><textarea data-f="description" rows="3">${it ? esc(it.description) : ""}</textarea></div>
          <div class="mn-field"><label>FEATURED</label>
            <label class="mn-check"><input type="checkbox" data-f="featured" ${it && it.featured ? "checked" : ""}> Show on the hero</label>
          </div>
        </div>
        <footer>
          ${isNew ? "" : '<button type="button" class="mn-mini danger" data-x="del">Delete slot</button>'}
          <button type="button" class="mn-mini" data-x="close">Cancel</button>
          <button type="button" class="mn-save" data-x="save">Save</button>
        </footer>
      </div>`;

    document.body.appendChild(sheet);
    requestAnimationFrame(() => sheet.classList.add("show"));
    let photo = it ? it.image_url : "";
    const val = k => { const el = sheet.querySelector(`[data-f="${k}"]`); return el ? el.value : ""; };

    sheet.addEventListener("click", e => {
      const btn = e.target.closest("[data-x]");
      if (!btn) return;
      const x = btn.dataset.x;
      if (x === "close") return sheet.remove();
      if (x === "pick") return sheet.querySelector("[data-file]").click();
      if (x === "del") {
        if (!it) return sheet.remove();
        if (!window.confirm(`Remove "${it.name}" from the store?`)) return;
        state.items = state.items.filter(v => v.id !== it.id);
        state.cart = state.cart.filter(v => v.id !== it.id);
        persist();
        sheet.remove();
        ui.manageOpen = false;
        render();
        toast("Slot removed");
        return;
      }
      if (x === "save") {
        const name = val("name").trim() || "New piece";
        const target = it || normalizeItem({});
        target.name = name.slice(0, 42);
        target.price = Math.max(0, num(val("price")) || 0);
        target.stock = Math.max(0, num(val("stock")) || 0);
        target.category = val("category").trim() || "Outerwear";
        target.sizes = val("sizes").trim() || "One size";
        target.description = val("description").trim();
        target.featured = !!sheet.querySelector('[data-f="featured"]').checked;
        target.image_url = photo || (isNew ? "images/shopapp/piece-jacket.jpg" : target.image_url);
        if (isNew) {
          target.sort_order = state.items.length + 1;
          state.items.push(target);
        }
        if (target.featured) state.items.forEach(i => { if (i.id !== target.id) i.featured = false; });
        persist();
        sheet.remove();
        render();
        toast(isNew ? "Piece added" : "Piece saved");
      }
    });

    sheet.querySelector("[data-file]").addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const W = 720, H = Math.round(720 * 4 / 3);
        const c = document.createElement("canvas");
        c.width = W; c.height = H;
        const ctx = c.getContext("2d");
        const sc = Math.max(W / img.width, H / img.height);
        ctx.drawImage(img, (W - img.width * sc) / 2, (H - img.height * sc) / 2, img.width * sc, img.height * sc);
        photo = c.toDataURL("image/jpeg", 0.74);
        sheet.querySelector("[data-thumb]").style.backgroundImage = `url('${photo}')`;
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }

  /* ---------------------------------------------------------
     Click wiring
     --------------------------------------------------------- */
  function readManageFields() {
    const sheet = document.querySelector(".nsa-manage");
    if (!sheet) return;
    sheet.querySelectorAll("[data-nsa-f]").forEach(input => {
      const k = input.dataset.nsaF;
      if (k) state.settings[k] = input.value.trim() || state.settings[k];
    });
  }

  function onClick(e) {
    const el = e.target.closest("[data-nsa]");
    if (!el) return;
    const act = el.dataset.nsa;
    const id = el.dataset.id;
    const editOnly = ["add", "del", "swap", "swap-featured", "edit-featured", "edit", "feature",
      "manage", "save-settings", "bg", "e-kicker", "e-caption", "e-panel"];

    if (editOnly.includes(act) && !editOn()) return;
    e.preventDefault();
    e.stopPropagation();

    switch (act) {
      case "none": return;

      case "open": {
        const it = findItem(id);
        if (!it) return;
        ui.activeId = id;
        const sizes = sizesOf(it);
        draft.size = sizes[0] && sizes[0] !== "One size" ? sizes[0] : "";
        draft.qty = 1;
        ui.collectionOpen = false;
        render();
        return;
      }

      case "size": draft.size = el.dataset.s; render(); return;
      case "qty+": draft.qty = Math.min(20, draft.qty + 1); render(); return;
      case "qty-": draft.qty = Math.max(1, draft.qty - 1); render(); return;

      case "add-bag": {
        const it = findItem(id);
        if (!it || it.stock === 0) return;
        addToBag(it, draft.size, draft.qty);
        return;
      }

      case "cart": ui.cartOpen = true; ui.activeId = null; ui.checkoutOpen = false; render(); return;
      case "browse": ui.collectionOpen = true; ui.cartOpen = false; ui.activeId = null; ui.checkoutOpen = false; render(); return;
      case "cat": ui.category = el.dataset.c; render(); return;
      case "orders": ordersOpen = true; ui.cartOpen = false; ui.activeId = null; render(); return;

      case "close-modal":
        ui.activeId = null; ui.cartOpen = false; ui.checkoutOpen = false;
        ui.collectionOpen = false; ordersOpen = false; ui.manageOpen = false; ui.placed = null;
        render();
        return;

      case "line+": {
        const l = state.cart.find(x => x.key === el.dataset.key);
        if (l) { l.qty = Math.min(20, l.qty + 1); persist(); render(); }
        return;
      }
      case "line-": {
        const l = state.cart.find(x => x.key === el.dataset.key);
        if (l) { l.qty -= 1; state.cart = state.cart.filter(x => x.qty > 0); persist(); render(); }
        return;
      }
      case "line-del":
        state.cart = state.cart.filter(x => x.key !== el.dataset.key);
        persist(); render();
        return;

      case "checkout": ui.checkoutOpen = true; ui.cartOpen = false; ui.placed = null; render(); return;

      case "place": {
        const form = document.querySelector("[data-nsa-form]");
        if (!form) return;
        const fd = name => (form.querySelector(`[name="${name}"]`) || {}).value || "";
        const err = form.querySelector("[data-nsa-error]");
        if (!fd("name").trim() || !fd("email").trim()) {
          if (err) { err.hidden = false; err.textContent = "Add your name and email so we can confirm the order."; }
          return;
        }
        placeOrder({
          name: fd("name").trim(), email: fd("email").trim(), phone: fd("phone").trim(),
          address: fd("address").trim(), notes: fd("notes").trim()
        });
        return;
      }

      case "page": ui.page = Number(el.dataset.i) || 0; render(); return;
      case "prev": ui.page = Math.max(0, ui.page - 1); render(); return;
      case "next": ui.page = ui.page + 1; render(); return;

      /* ---------- edit mode ---------- */
      case "toggle-edit": {
        if (!window.nuLimitsEditMode) return;
        window.nuLimitsEditMode.set(!editOn());
        ui.activeId = null; ui.cartOpen = false; ui.checkoutOpen = false;
        ui.collectionOpen = false; ordersOpen = false; ui.manageOpen = false;
        render();
        return;
      }

      case "manage": ui.manageOpen = true; ui.cartOpen = false; ui.activeId = null; render(); return;
      case "add": ui.manageOpen = false; editItem(null); return;
      case "edit": ui.manageOpen = false; editItem(id); return;

      case "del": {
        const it = findItem(id);
        if (!it) return;
        if (!window.confirm(`Delete "${it.name}" from the store?`)) return;
        state.items = state.items.filter(x => x.id !== id);
        state.cart = state.cart.filter(x => x.id !== id);
        persist(); render(); toast("Piece deleted");
        return;
      }

      case "feature": {
        const it = findItem(id);
        if (!it) return;
        it.featured = !it.featured;
        if (it.featured) state.items.forEach(x => { if (x.id !== id) x.featured = false; });
        persist(); render(); toast(it.featured ? `${it.name} is featured` : "Featured cleared");
        return;
      }

      case "swap": {
        pickImage(src => {
          if (!src) return;
          const it = findItem(id);
          if (!it) return;
          it.image_url = src;
          persist(); render(); toast("Photo replaced");
        });
        return;
      }

      case "swap-featured":
      case "edit-featured": {
        const f = featured();
        if (!f) return;
        if (act === "edit-featured") return editItem(f.id);
        pickImage(src => {
          if (!src) return;
          f.image_url = src;
          persist(); render(); toast("Featured photo replaced");
        });
        return;
      }

      case "bg": {
        readManageFields();
        state.settings.background = el.dataset.b;
        persist(); render();
        return;
      }

      case "e-kicker": {
        const v = ask("Hero kicker", state.settings.hero_kicker);
        if (v == null) return;
        state.settings.hero_kicker = v.trim() || state.settings.hero_kicker;
        persist(); render();
        return;
      }
      case "e-caption": {
        const v = ask("Hero caption", state.settings.hero_caption);
        if (v == null) return;
        state.settings.hero_caption = v.trim();
        persist(); render();
        return;
      }
      case "e-panel": {
        const v = ask("Panel description", state.settings.panel_description);
        if (v == null) return;
        state.settings.panel_description = v.trim();
        persist(); render();
        return;
      }

      case "save-settings": {
        if (!document.querySelector(".nsa-manage")) return;
        readManageFields();
        persist();
        ui.manageOpen = false;
        render();
        toast("Store saved");
        return;
      }

      case "back-stores":
        ui.activeId = null; ui.cartOpen = false; ui.checkoutOpen = false;
        ui.collectionOpen = false; ordersOpen = false; ui.manageOpen = false;
        clearOverlay();
        if (window.nuLimitsShopGoto) window.nuLimitsShopGoto("stores");
        return;

      default: return;
    }
  }

  document.addEventListener("click", onClick, true);

  if (window.nuLimitsEditMode && window.nuLimitsEditMode.onChange) {
    window.nuLimitsEditMode.onChange(() => {
      if (document.querySelector(".sh-page.nsa")) render();
    });
  }

  window.nuLimitsShopApp = {
    page,
    clearOverlay,
    render,
    state: () => state,
    settings: () => state.settings,
    items,
    orders: () => state.orders,
    cart: () => state.cart,
    featured,
    subtotal,
    cartCount,
    addToBag,
    placeOrder,
    reset() { state = blank(); persist(); render(); }
  };
})();
