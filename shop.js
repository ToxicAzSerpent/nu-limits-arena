/* ==========================================================
   NU LIMITS — LUXURY STORES  (round 6)

   Replaces the old Shop scaffold entirely.
   • brand stores (Hermès, Gucci, Givenchy, Louis Vuitton,
     Chanel, Dolce & Gabbana)
   • every store has a Women and a Men section
   • 3:4 portrait product cards — the shape fashion retail uses
   • Buy deducts through window.nuLimitsMoney
   • creator edit mode: add / edit / delete stores and pieces

   Save: nuLimitsShop_v1
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsShop_v1";
  const PHOTO_SIZE = 736;

  const money = n => "R " + Math.round(Number(n) || 0).toLocaleString("en-ZA");
  const uid = () => "sh_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

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

  const balance = () => (window.nuLimitsMoney && window.nuLimitsMoney.getBalance)
    ? window.nuLimitsMoney.getBalance() : 0;
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const free = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());

  const ICON_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6"/><path d="M10 11v6M14 11v6"/></svg>';

  /* ---------------------------------------------------------
     Starter boutiques
     --------------------------------------------------------- */
  const piece = (name, price, audience, photo, material, sizes, desc) =>
    ({ name, price, audience, photo, material, sizes, desc, owned: false, purchasedAt: null });

  /* a ring is a ring — the family page looks for this flag before a proposal */
  const ring = (name, price, photo, material, desc, use) =>
    ({ name, price, audience: "women", photo, material, sizes: "Ring · sizes 48–58", desc,
       owned: false, purchasedAt: null, ring: true, ringUse: use });

  const SEED = [
    {
      name: "Hermès", tagline: "Paris, since 1837", photo: "images/shop/w-03.jpg",
      products: [
        piece("Box Calf Kelly", 145000, "women", "images/shop/w-03.jpg", "Box calf leather", "One size", "Hand-stitched top-handle bag with palladium hardware."),
        piece("Slingback Pumps", 38500, "women", "images/shop/w-05.jpg", "Satin", "36–42", "Pointed slingbacks with a sculpted 65 mm heel."),
        piece("Weekend Holdall", 62000, "men", "images/shop/m-05.jpg", "Grained calfskin", "One size", "Travel holdall with hand-burnished handles."),
        piece("Leather Loafers", 24500, "men", "images/shop/m-04.jpg", "Polished calf", "39–46", "Moccasin loafers on a leather sole.")
      ]
    },
    {
      name: "Gucci", tagline: "Florence, since 1921", photo: "images/shop/w-04.jpg",
      products: [
        piece("Oversized Sunglasses", 12400, "women", "images/shop/w-04.jpg", "Acetate", "One size", "Bold squared frames with gradient lenses."),
        piece("Belted Trench", 48000, "women", "images/shop/w-02.jpg", "Cotton gabardine", "XS–XL", "Double-breasted trench with a leather belt."),
        piece("Two-Piece Wool Suit", 56000, "men", "images/shop/m-01.jpg", "Virgin wool", "46–56", "Single-breasted suit with a half-canvas front."),
        piece("Steel Dress Watch", 89000, "men", "images/shop/m-03.jpg", "Steel & alligator", "40 mm", "Automatic movement on a hand-stitched strap.")
      ]
    },
    {
      name: "Givenchy", tagline: "Paris, since 1952", photo: "images/shop/w-01.jpg",
      products: [
        piece("Silk Evening Gown", 92000, "women", "images/shop/w-01.jpg", "Silk crêpe", "36–42", "Floor-length gown with a sculpted bodice."),
        piece("Top Handle Bag", 71500, "women", "images/shop/w-03.jpg", "Smooth calf", "One size", "Structured bag with a turn-lock closure."),
        piece("Cashmere Knit", 26500, "men", "images/shop/m-02.jpg", "Cashmere", "S–XL", "Ribbed crew neck in grade-A cashmere."),
        piece("Weekend Holdall", 54000, "men", "images/shop/m-05.jpg", "Grained calfskin", "One size", "Soft-sided holdall with a detachable strap.")
      ]
    },
    {
      name: "Louis Vuitton", tagline: "Paris, since 1854", photo: "images/shop/w-02.jpg",
      products: [
        piece("Belted Trench", 44500, "women", "images/shop/w-02.jpg", "Cotton gabardine", "XS–XL", "Classic trench with a storm flap and belt."),
        piece("Oversized Sunglasses", 9800, "women", "images/shop/w-04.jpg", "Acetate", "One size", "Cat-eye frames with gold-tone temples."),
        piece("Weekend Holdall", 68000, "men", "images/shop/m-05.jpg", "Taurillon leather", "One size", "Cabin-sized holdall with a leather tag."),
        piece("Two-Piece Wool Suit", 61500, "men", "images/shop/m-01.jpg", "Super 120s wool", "46–56", "Tailored suit with a tapered trouser.")
      ]
    },
    {
      name: "Chanel", tagline: "Paris, since 1910", photo: "images/shop/w-05.jpg",
      products: [
        piece("Silk Evening Gown", 118000, "women", "images/shop/w-01.jpg", "Silk crêpe", "36–42", "Bias-cut gown with a plunging neckline."),
        piece("Slingback Heels", 42000, "women", "images/shop/w-05.jpg", "Satin & grosgrain", "36–42", "Two-tone slingbacks with a block heel."),
        piece("Steel Dress Watch", 76500, "men", "images/shop/m-03.jpg", "Steel & leather", "38 mm", "Slim dress watch with a lacquered dial."),
        piece("Cashmere Knit", 31000, "men", "images/shop/m-02.jpg", "Cashmere", "S–XL", "Boxy knit with dropped shoulders.")
      ]
    },
    {
      name: "Dolce & Gabbana", tagline: "Milan, since 1985", photo: "images/shop/m-04.jpg",
      products: [
        piece("Top Handle Bag", 64000, "women", "images/shop/w-03.jpg", "Smooth calf", "One size", "Compact top-handle bag with a gold clasp."),
        piece("Silk Evening Gown", 86000, "women", "images/shop/w-01.jpg", "Silk crêpe", "36–42", "Column gown with a lace-trimmed neckline."),
        piece("Leather Loafers", 19800, "men", "images/shop/m-04.jpg", "Polished calf", "39–46", "Penny loafers with a stacked leather heel."),
        piece("Two-Piece Wool Suit", 49500, "men", "images/shop/m-01.jpg", "Wool blend", "46–56", "Sicilian-cut suit with a soft shoulder.")
      ]
    },
    {
      name: "Prada", tagline: "Milan, since 1913", photo: "images/shop/prada-w.jpg",
      products: [
        piece("Re-Nylon Trench", 68500, "women", "images/shop/prada-w.jpg", "Re-nylon & wool", "36–44", "Belted double-breasted trench cut from regenerated nylon."),
        piece("Cashmere Overcoat", 96000, "men", "images/shop/prada-m.jpg", "Cashmere & virgin wool", "46–56", "Single-breasted overcoat with a soft, unstructured shoulder.")
      ]
    },
    {
      name: "Versace", tagline: "Milan, since 1978", photo: "images/shop/versace-w.jpg",
      products: [
        piece("Baroque Silk Gown", 124000, "women", "images/shop/versace-w.jpg", "Printed silk", "36–42", "Floor-length baroque-print gown with a chain-detail waist."),
        piece("Leather Biker Jacket", 74000, "men", "images/shop/versace-m.jpg", "Lamb nappa", "46–56", "Asymmetric biker in glossy nappa with gunmetal hardware.")
      ]
    },
    {
      name: "Balenciaga", tagline: "Paris, since 1917", photo: "images/shop/balenciaga-w.jpg",
      products: [
        piece("Sculpted Wool Coat", 58000, "women", "images/shop/balenciaga-w.jpg", "Boiled wool", "34–42", "Oversized cocoon coat with a strong, rounded shoulder."),
        piece("Oversized Hoodie", 21500, "men", "images/shop/balenciaga-m.jpg", "Heavy cotton fleece", "S–XL", "Dropped-shoulder hoodie in 480 gsm loopback cotton.")
      ]
    },
    {
      name: "Rolex", tagline: "Geneva, since 1905 · watches only", photo: "images/shop/rolex-w.jpg",
      products: [
        piece("Datejust 36 · Two-Tone", 168000, "women", "images/shop/rolex-w.jpg", "Steel & yellow gold", "36 mm", "Champagne dial, fluted bezel, jubilee bracelet."),
        piece("Submariner Date", 215000, "men", "images/shop/rolex-m.jpg", "Oystersteel & ceramic", "41 mm", "Black ceramic bezel, 300 m water resistance.")
      ]
    },
    {
      id: "jewellery", name: "Cartier",
      tagline: "Paris, since 1847 · engagement rings", photo: "images/shop/jewellery.jpg",
      products: [
        ring("Gold Band", 18000, "images/shop/jewellery.jpg", "18k yellow gold", "A plain 2 mm band, polished by hand.", "wedding"),
        ring("Solitaire Ring", 45000, "images/shop/jewellery.jpg", "18k gold · 0.5 ct", "Brilliant-cut solitaire on a knife-edge band.", "wedding"),
        ring("Éternité Diamond Band", 118000, "images/shop/jewellery.jpg", "18k gold · 2.1 ct", "A full circle of pavé-set diamonds.", "wedding")
      ]
    }
  ];

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  function normalizeProduct(p) {
    const out = Object.assign({
      id: uid(), name: "New piece", price: 0, audience: "women",
      photo: "", material: "", sizes: "One size", desc: "",
      owned: false, purchasedAt: null
    }, p || {});
    out.price = Math.max(0, Number(out.price) || 0);
    out.audience = out.audience === "men" ? "men" : "women";
    out.owned = !!out.owned;
    return out;
  }

  function normalizeStore(s) {
    const out = Object.assign({ id: uid(), name: "New store", tagline: "", photo: "" }, s || {});
    out.products = (Array.isArray(s && s.products) ? s.products : []).map(normalizeProduct);
    if (!out.photo && out.products[0]) out.photo = out.products[0].photo;
    return out;
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      toast("Couldn't save — a photo may be too large.");
      return false;
    }
  }

  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { saved = null; }

    if (saved && Array.isArray(saved.stores)) {
      const out = { version: 1, stores: saved.stores.map(normalizeStore) };

      /* houses added in a later round must reach existing saves */
      const known = new Set(out.stores.map(s => String(s.name || "").toLowerCase()));
      let changed = false;
      SEED.forEach(seed => {
        if (!known.has(seed.name.toLowerCase())) {
          out.stores.push(normalizeStore(JSON.parse(JSON.stringify(seed))));
          changed = true;
        }
      });

      if (changed) {
        try { localStorage.setItem(KEY, JSON.stringify(out)); } catch {}
      }
      return out;
    }

    const fresh = { version: 1, stores: SEED.map(normalizeStore) };
    try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch {}
    return fresh;
  }

  let state = load();
  let view = "stores";          /* stores | store | wardrobe */
  let storeId = null;
  let audience = "women";

  /* ---------------------------------------------------------
     Derived
     --------------------------------------------------------- */
  const findStore = id => state.stores.find(s => s.id === id);
  const allProducts = () => state.stores.flatMap(s => s.products.map(p => ({ store: s, p })));
  const ownedPieces = () => allProducts().filter(x => x.p.owned && x.p.owner !== "partner");
  const partnerPieces = () => allProducts().filter(x => x.p.owned && x.p.owner === "partner");
  const pieces = () => state.stores.reduce((n, s) => n + s.products.length, 0);
  const wardrobeValue = () => ownedPieces().reduce((t, x) => t + x.p.price, 0);

  /* ---------------------------------------------------------
     Views
     --------------------------------------------------------- */
  function storeCard(s) {
    const n = s.products.length;
    const tools = editOn() ? `<div class="sh-tools">
        <button data-act="edit-store" data-id="${esc(s.id)}" aria-label="Edit store">${ICON_EDIT}</button>
        <button data-act="delete-store" data-id="${esc(s.id)}" aria-label="Delete store">${ICON_TRASH}</button>
      </div>` : "";

    return `<article class="sh-store" data-store="${esc(s.id)}"
              ${s.photo ? `style="background-image:url('${esc(s.photo)}')"` : ""}>
        ${tools}
        <div class="sh-store-inner">
          <span class="sh-store-name">${esc(s.name)}</span>
          <span class="sh-store-meta">Women · Men · ${n} piece${n === 1 ? "" : "s"}</span>
        </div>
      </article>`;
  }

  function productCard(store, p, opts) {
    const showStore = opts && opts.showStore;
    const tools = editOn() ? `<div class="sh-tools">
        <button data-act="edit-product" data-id="${esc(store.id)}" data-pid="${esc(p.id)}" aria-label="Edit piece">${ICON_EDIT}</button>
        <button data-act="delete-product" data-id="${esc(store.id)}" data-pid="${esc(p.id)}" aria-label="Delete piece">${ICON_TRASH}</button>
      </div>` : "";

    return `<article class="sh-item">
      <div class="sh-photo" ${p.photo ? `style="background-image:url('${esc(p.photo)}')"` : ""}>
        ${p.owned ? `<span class="sh-owned${p.owner === "partner" ? " is-hers" : ""}">${p.owner === "partner" ? "HERS" : "OWNED"}</span>` : ""}
        ${showStore ? `<span class="sh-store-tag">${esc(store.name)}</span>` : ""}
        ${tools}
      </div>
      <div class="sh-item-body">
        <h3 class="sh-name">${esc(p.name)}</h3>
        <p class="sh-price">${esc(money(p.price))}</p>
        <p class="sh-meta">${esc([p.material, p.sizes].filter(Boolean).join(" · ") || "—")}</p>
        <button class="sh-buy ${p.owned ? "owned" : ""}"
                data-act="buy" data-id="${esc(store.id)}" data-pid="${esc(p.id)}"
                ${p.owned ? "disabled" : ""}>${p.owned ? "Owned" : "Buy"}</button>
      </div>
    </article>`;
  }

  function storesView() {
    const owned = ownedPieces().length;
    return `<section class="dynamic-page-content sh-page">
      <div class="sh-head">
        <p class="eyebrow">NU LIMITS / LUXURY RETAIL</p>
        <h1>Luxury Stores</h1>
        <p class="muted">Six houses. Women's and men's. ${pieces()} pieces on the rail.</p>
      </div>

      <div class="sh-stats">
        <span><small>PIECES OWNED</small><strong>${owned} / ${pieces()}</strong></span>
        <span><small>WARDROBE VALUE</small><strong>${esc(money(wardrobeValue()))}</strong></span>
      </div>

      <div class="sh-chips">
        <button data-view="stores" class="active">Stores</button>
        <button data-view="wardrobe">My wardrobe${owned ? ` (${owned})` : ""}</button>
      </div>

      <div class="sh-stores">
        <article class="sh-store sh-nuapp" data-act="open-nuapp"
                 style="background-image:url('images/shopapp/piece-jacket.jpg')">
          <div class="sh-store-inner">
            <span class="sh-store-name">NU LIMITS Store</span>
            <span class="sh-store-meta">Streetwear · tech-wear · bag &amp; checkout</span>
          </div>
        </article>
        ${state.stores.map(storeCard).join("")}
        ${editOn() ? `<button class="sh-add" data-act="add-store">
            <span class="plus">+</span>
            <strong>Add store</strong>
            <small>Brand house</small>
          </button>` : ""}
      </div>

      <button class="secondary-button" type="button" data-page="home" style="margin-top:22px">← Back to Home</button>
    </section>`;
  }

  function storeView() {
    const s = findStore(storeId);
    if (!s) { view = "stores"; return storesView(); }
    const list = s.products.filter(p => p.audience === audience);
    const wCount = s.products.filter(p => p.audience === "women").length;
    const mCount = s.products.filter(p => p.audience === "men").length;

    return `<section class="dynamic-page-content sh-page">
      <button class="sh-back" data-act="back">← All stores</button>

      <header class="sh-brand">
        <p class="eyebrow">MAISON</p>
        <h1>${esc(s.name)}</h1>
        <p class="muted">${esc(s.tagline || "Luxury house")}</p>
      </header>

      <div class="sh-seg">
        <button data-aud="women" class="${audience === "women" ? "active" : ""}">
          Women<small>${wCount} PIECE${wCount === 1 ? "" : "S"}</small>
        </button>
        <button data-aud="men" class="${audience === "men" ? "active" : ""}">
          Men<small>${mCount} PIECE${mCount === 1 ? "" : "S"}</small>
        </button>
      </div>

      <div class="sh-grid">
        ${list.map(p => productCard(s, p)).join("")}
        ${editOn() ? `<button class="sh-add" data-act="add-product">
            <span class="plus">+</span>
            <strong>Add ${audience === "women" ? "women's" : "men's"} piece</strong>
            <small>3 : 4</small>
          </button>` : ""}
        ${!list.length && !editOn() ? `<p class="sh-empty">Nothing in this section yet.</p>` : ""}
      </div>

      <button class="secondary-button" type="button" data-page="home" style="margin-top:22px">← Back to Home</button>
    </section>`;
  }

  function wardrobeView() {
    const owned = ownedPieces();
    return `<section class="dynamic-page-content sh-page">
      <div class="sh-head">
        <p class="eyebrow">NU LIMITS / LUXURY RETAIL</p>
        <h1>My wardrobe</h1>
        <p class="muted">Everything you've bought, across every house.</p>
      </div>

      <div class="sh-stats">
        <span><small>PIECES OWNED</small><strong>${owned.length} / ${pieces()}</strong></span>
        <span><small>WARDROBE VALUE</small><strong>${esc(money(wardrobeValue()))}</strong></span>
      </div>

      <div class="sh-chips">
        <button data-view="stores">Stores</button>
        <button data-view="wardrobe" class="active">My wardrobe</button>
      </div>

      <div class="sh-grid">
        ${owned.map(x => productCard(x.store, x.p, { showStore: true })).join("")}
        ${!owned.length ? `<p class="sh-empty">Your wardrobe is empty — buy something in a store and it lands here.</p>` : ""}
      </div>

      <button class="secondary-button" type="button" data-page="home" style="margin-top:22px">← Back to Home</button>
    </section>`;
  }

  function render() {
    const root = document.getElementById("dynamic-page");
    if (!root) return;

    /* round 42/43 — the NU Limits storefront takes the whole screen */
    if (view === "nuapp" && window.nuLimitsShopApp) {
      document.body.classList.add("nsa-immersive");
      root.innerHTML = window.nuLimitsShopApp.page();
      window.scrollTo({ top: 0 });
      return;
    }
    document.body.classList.remove("nsa-immersive");

    root.innerHTML = view === "store" ? storeView() : view === "wardrobe" ? wardrobeView() : storesView();
    const back = root.querySelector("[data-page]");
    if (back) back.addEventListener("click", () => (window.nuLimitsBack ? window.nuLimitsBack() : navigateTo("home")));
  }

  /* ---------------------------------------------------------
     Buy
     --------------------------------------------------------- */
  function buy(sid, pid) {
    const s = findStore(sid);
    const p = s && s.products.find(x => x.id === pid);
    if (!p || p.owned) return;

    /* round 13 — Buy for Her: the piece belongs to the partner */
    const fam = window.nuLimitsFamily;
    const gifting = !!(fam && fam.giftMode && fam.giftMode() && fam.partner && fam.partner());
    const herName = gifting ? fam.partner().name : null;

    if (!free() && !window.nuLimitsCanPay(p.price)) {
      const have = window.nuLimitsSpendable ? window.nuLimitsSpendable() : balance();
      return toast(`Not enough funds — you're ${money(p.price - have)} short.`);
    }
    if (!window.nuLimitsMoney ||
        !window.nuLimitsMoney.transact("expense", p.price,
          gifting ? `${p.name} for ${herName} — ${s.name}` : `${p.name} — ${s.name}`)) {
      return toast("Purchase failed — check your balance.");
    }

    p.owned = true;
    p.purchasedAt = new Date().toISOString();
    p.card = (window.nuLimitsCards && window.nuLimitsCards.label())
      ? window.nuLimitsCards.label() : "Debit •4821";
    p.gameDate = (window.nuLimitsWorld && window.nuLimitsWorld.date)
      ? window.nuLimitsWorld.date.toISOString() : null;

    if (gifting) {
      p.owner = "partner";
      p.ownerName = herName;
    }

    persist();
    render();
    toast(gifting
      ? `Bought ${p.name} for ${herName} · ${money(p.price)}`
      : `Bought ${p.name} · ${money(p.price)}`);
  }

  /* ---------------------------------------------------------
     Editor
     --------------------------------------------------------- */
  function billRowsUnused() {} /* placeholder */

  function openProductEditor(sid, pid) {
    const s = findStore(sid);
    if (!s) return;
    let p = pid ? s.products.find(x => x.id === pid) : null;
    const isNew = !p;
    if (isNew) {
      p = normalizeProduct({ audience });
      s.products.push(p);
      persist();
    }

    const modal = document.createElement("div");
    modal.className = "mn-modal";
    modal.innerHTML = `
      <div class="mn-sheet" role="dialog" aria-modal="true" aria-label="Edit piece">
        <header><strong>${isNew ? "Add" : "Edit"} piece</strong>
          <button type="button" data-act="close" aria-label="Close">×</button>
        </header>
        <div class="mn-form">
          <div class="mn-field">
            <label>PHOTO — 3 : 4</label>
            <div class="mn-photo-row">
              <div class="mn-photo-thumb" data-thumb style="width:56px;height:75px;border-radius:10px;${p.photo ? `background-image:url('${esc(p.photo)}')` : ""}"></div>
              <div class="mn-photo-actions">
                <button type="button" class="mn-mini" data-act="pick">Upload photo</button>
                <button type="button" class="mn-mini danger" data-act="clear-photo">Remove photo</button>
              </div>
            </div>
            <input type="file" accept="image/*" data-file hidden>
          </div>

          <div class="mn-field">
            <label>NAME</label>
            <input type="text" data-f="name" maxlength="40" value="${esc(p.name)}">
          </div>

          <div class="mn-two">
            <div class="mn-field"><label>PRICE (R)</label>
              <input type="number" data-f="price" min="0" step="100" value="${p.price}"></div>
            <div class="mn-field"><label>SECTION</label>
              <select data-f="audience">
                <option value="women" ${p.audience === "women" ? "selected" : ""}>Women</option>
                <option value="men" ${p.audience === "men" ? "selected" : ""}>Men</option>
              </select></div>
          </div>

          <div class="mn-two">
            <div class="mn-field"><label>MATERIAL</label>
              <input type="text" data-f="material" maxlength="28" value="${esc(p.material)}" placeholder="Cashmere"></div>
            <div class="mn-field"><label>SIZES</label>
              <input type="text" data-f="sizes" maxlength="20" value="${esc(p.sizes)}" placeholder="S–XL"></div>
          </div>

          <div class="mn-field"><label>DESCRIPTION</label>
            <textarea data-f="desc" maxlength="140" placeholder="Short note about the piece">${esc(p.desc)}</textarea></div>
        </div>
        <footer>
          <button type="button" class="mn-btn soft" data-act="close">Cancel</button>
          <button type="button" class="mn-btn" data-act="save">Save piece</button>
        </footer>
      </div>`;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));

    const draft = { photo: p.photo || "" };

    modal.addEventListener("click", e => {
      if (e.target === modal) return close();
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      if (btn.dataset.act === "close") return close();
      if (btn.dataset.act === "save") return save();
      if (btn.dataset.act === "pick") return modal.querySelector("[data-file]").click();
      if (btn.dataset.act === "clear-photo") {
        draft.photo = "";
        modal.querySelector("[data-thumb]").style.backgroundImage = "";
      }
    });

    modal.querySelector("[data-file]").addEventListener("change", async e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await processPhoto(file);
        draft.photo = dataUrl;
        modal.querySelector("[data-thumb]").style.backgroundImage = `url('${dataUrl}')`;
        toast("Photo ready");
      } catch (err) {
        toast(err.message === "Too large" ? "That image is too large." : "Couldn't read that image.");
      } finally {
        e.target.value = "";
      }
    });

    document.addEventListener("keydown", onKey);
    function onKey(e) { if (e.key === "Escape") close(); }
    function close() {
      document.removeEventListener("keydown", onKey);
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 240);
    }

    function save() {
      const val = f => {
        const el = modal.querySelector(`[data-f='${f}']`);
        return el ? el.value : "";
      };
      const target = s.products.find(x => x.id === p.id);
      if (!target) return close();
      Object.assign(target, {
        photo: draft.photo,
        name: val("name").trim() || "New piece",
        price: Math.max(0, Number(val("price")) || 0),
        audience: val("audience") === "men" ? "men" : "women",
        material: val("material").trim(),
        sizes: val("sizes").trim(),
        desc: val("desc").trim()
      });
      if (!s.photo) s.photo = target.photo || s.photo;
      persist();
      audience = target.audience;
      close();
      render();
      toast("Saved");
    }
  }

  function openStoreEditor(sid) {
    let s = sid ? findStore(sid) : null;
    const isNew = !s;
    if (isNew) {
      s = normalizeStore({ name: "New store", tagline: "Luxury house", photo: "" });
      state.stores.push(s);
      persist();
    }

    const modal = document.createElement("div");
    modal.className = "mn-modal";
    modal.innerHTML = `
      <div class="mn-sheet" role="dialog" aria-modal="true" aria-label="Edit store">
        <header><strong>${isNew ? "Add" : "Edit"} store</strong>
          <button type="button" data-act="close" aria-label="Close">×</button>
        </header>
        <div class="mn-form">
          <div class="mn-field">
            <label>COVER PHOTO</label>
            <div class="mn-photo-row">
              <div class="mn-photo-thumb" data-thumb style="width:56px;height:75px;border-radius:10px;${s.photo ? `background-image:url('${esc(s.photo)}')` : ""}"></div>
              <div class="mn-photo-actions">
                <button type="button" class="mn-mini" data-act="pick">Upload photo</button>
                <button type="button" class="mn-mini danger" data-act="clear-photo">Remove photo</button>
              </div>
            </div>
            <input type="file" accept="image/*" data-file hidden>
          </div>
          <div class="mn-field">
            <label>STORE NAME</label>
            <input type="text" data-f="name" maxlength="30" value="${esc(s.name)}" placeholder="Hermès">
          </div>
          <div class="mn-field">
            <label>TAGLINE</label>
            <input type="text" data-f="tagline" maxlength="40" value="${esc(s.tagline)}" placeholder="Paris, since 1837">
          </div>
        </div>
        <footer>
          <button type="button" class="mn-btn soft" data-act="close">Cancel</button>
          <button type="button" class="mn-btn" data-act="save">Save store</button>
        </footer>
      </div>`;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));

    const draft = { photo: s.photo || "" };

    modal.addEventListener("click", e => {
      if (e.target === modal) return close();
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      if (btn.dataset.act === "close") return close();
      if (btn.dataset.act === "save") return save();
      if (btn.dataset.act === "pick") return modal.querySelector("[data-file]").click();
      if (btn.dataset.act === "clear-photo") {
        draft.photo = "";
        modal.querySelector("[data-thumb]").style.backgroundImage = "";
      }
    });

    modal.querySelector("[data-file]").addEventListener("change", async e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await processPhoto(file);
        draft.photo = dataUrl;
        modal.querySelector("[data-thumb]").style.backgroundImage = `url('${dataUrl}')`;
      } catch { toast("Couldn't read that image."); }
      finally { e.target.value = ""; }
    });

    document.addEventListener("keydown", onKey);
    function onKey(e) { if (e.key === "Escape") close(); }
    function close() {
      document.removeEventListener("keydown", onKey);
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 240);
    }

    function save() {
      const val = f => modal.querySelector(`[data-f='${f}']`).value;
      const target = findStore(s.id);
      if (!target) return close();
      target.name = val("name").trim() || "New store";
      target.tagline = val("tagline").trim();
      target.photo = draft.photo;
      if (!persist()) return;
      close();
      render();
      toast("Store saved");
    }
  }

  function processPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error("Not an image"));
      if (file.size > 24 * 1024 * 1024) return reject(new Error("Too large"));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const W = PHOTO_SIZE;
          const H = Math.round(PHOTO_SIZE * 4 / 3);
          const c = document.createElement("canvas");
          c.width = W; c.height = H;
          const ctx = c.getContext("2d");
          const scale = Math.max(W / img.width, H / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
          resolve(c.toDataURL("image/jpeg", 0.74));
        } catch (err) { reject(err); }
        finally { URL.revokeObjectURL(url); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unreadable image")); };
      img.src = url;
    });
  }

  /* ---------------------------------------------------------
     Wiring
     --------------------------------------------------------- */
  const isOnPage = () => {
    const dyn = document.getElementById("dynamic-page");
    return dyn && !dyn.hidden && !!dyn.querySelector(".sh-page");
  };

  const dyn = document.getElementById("dynamic-page");
  if (dyn) {
    dyn.addEventListener("click", e => {
      if (!e.target.closest(".sh-page")) return;

      const actBtn = e.target.closest("[data-act]");
      if (actBtn) {
        const act = actBtn.dataset.act;
        const sid = actBtn.dataset.id;
        const pid = actBtn.dataset.pid;

        if (act === "back") { view = "stores"; render(); window.scrollTo({ top: 0 }); return; }
        if (act === "open-nuapp") { view = "nuapp"; render(); return; }
        if (act === "buy") return buy(sid, pid);
        if (act === "add-store") return openStoreEditor(null);
        if (act === "edit-store") return openStoreEditor(sid);
        if (act === "delete-store") {
          const s = findStore(sid);
          if (s && window.confirm(`Delete "${s.name}" and its pieces?`)) {
            state.stores = state.stores.filter(x => x.id !== sid);
            persist(); render(); toast("Store deleted");
          }
          return;
        }
        if (act === "add-product") return openProductEditor(storeId, null);
        if (act === "edit-product") return openProductEditor(sid, pid);
        if (act === "delete-product") {
          const s = findStore(sid);
          const p = s && s.products.find(x => x.id === pid);
          if (p && window.confirm(`Delete "${p.name}"?`)) {
            s.products = s.products.filter(x => x.id !== pid);
            persist(); render(); toast("Piece deleted");
          }
          return;
        }
        return;
      }

      const audBtn = e.target.closest("[data-aud]");
      if (audBtn) { audience = audBtn.dataset.aud; render(); return; }

      const viewBtn = e.target.closest("[data-view]");
      if (viewBtn) { view = viewBtn.dataset.view; render(); window.scrollTo({ top: 0 }); return; }

      const storeEl = e.target.closest("[data-store]");
      if (storeEl) {
        storeId = storeEl.dataset.store;
        view = "store";
        const s = findStore(storeId);
        if (s) {
          const first = s.products.find(p => p.audience === "women") || s.products[0];
          if (first) audience = first.audience;
        }
        render();
        window.scrollTo({ top: 0 });
      }
    });
  }

  /* re-render when the creator toggles edit mode */
  if (window.nuLimitsEditMode && window.nuLimitsEditMode.onChange) {
    window.nuLimitsEditMode.onChange(() => { if (isOnPage()) render(); });
  }

  /* ---------------------------------------------------------
     Route — replaces the old Shop page
     --------------------------------------------------------- */
  const prevNavigate = window.navigateTo;
  window.navigateTo = function (page) {
    if (page !== "shop") document.body.classList.remove("nsa-immersive");
    if (page === "shop") {
      document.querySelectorAll(".nav-item").forEach(b =>
        b.classList.toggle("active", b.dataset.page === page));
      if (typeof window.nuLimitsInvestLeave === "function") window.nuLimitsInvestLeave();
      const main = document.getElementById("main-content");
      const dp = document.getElementById("dynamic-page");
      if (!main || !dp) return;
      main.hidden = true;
      dp.hidden = false;
      view = "stores";
      storeId = null;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    return prevNavigate.apply(this, arguments);
  };

  window.nuLimitsShopGoto = function (v) {
    view = v || "stores";
    storeId = null;
    if (view !== "nuapp") document.body.classList.remove("nsa-immersive");
    render();
    window.scrollTo({ top: 0 });
  };
  window.renderShop = render;
})();
