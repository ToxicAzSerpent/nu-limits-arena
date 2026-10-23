const balanceElement = document.getElementById("balance");
const activityElement = document.getElementById("activity");

const pageNames = {
  home: "Home",
  business: "Businesses",
  invest: "Investments",
  property: "Properties",
  shop: "Luxury Shop",
  more: "Empire Hub"
};

function showActivity(title, message) {
  activityElement.innerHTML = `
    <span class="activity-icon">✦</span>
    <div>
      <strong>${title}</strong>
      <p class="muted">${message}</p>
    </div>
    <span class="activity-arrow">→</span>
  `;
}


function navigateTo(page) {
  const validPages = ["home", "business", "invest", "property", "shop", "more"];

  if (!validPages.includes(page)) return;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const mainContent = document.getElementById("main-content");
  const dynamicPage = document.getElementById("dynamic-page");

  if (!mainContent || !dynamicPage) return;

  if (page === "home") {
    mainContent.hidden = false;
    dynamicPage.hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });

    showActivity(
      "Your story begins now",
      "Make your first move and build your future."
    );
    return;
  }

  const pageContent = {
    business: {
      title: "Businesses",
      subtitle: "Build your empire, one business at a time.",
      cards: [
        {
          title: "YouTube Creator",
          description: "Build a channel, create videos, grow an audience and work towards monetisation.",
          action: "Start Creator Setup",
          id: "youtube-creator"
        }
      ]
    },
    invest: {
      title: "Investments",
      subtitle: "Explore opportunities to grow your capital.",
      cards: []
    },
    property: {
      title: "Properties",
      subtitle: "Discover properties for your empire.",
      cards: []
    },
   shop: {
  title: "Luxury Shop",
  subtitle: "Everything you need to build your empire.",
  cards: [
    {
      title: "Computers & PC Components",
      description: "Build your workstation with PCs, processors, graphics cards, RAM and storage.",
      action: "Explore Electronics",
      id: "shop-electronics"
    },
    {
      title: "Creator Equipment",
      description: "Upgrade your studio with microphones, cameras, lighting and streaming gear.",
      action: "Explore Equipment",
      id: "shop-creator"
    },
    {
      title: "Monitors & Accessories",
      description: "Discover premium monitors, keyboards, mice and essential accessories.",
      action: "Explore Accessories",
      id: "shop-accessories"
    },
    {
      title: "Luxury & Lifestyle",
      description: "Shop premium watches, fashion and luxury essentials for your character.",
      action: "Explore Luxury",
      id: "shop-luxury"
    }
  ]
},
    more: {
      title: "Empire Hub",
      subtitle: "Your garage, career, profile and settings.",
      cards: []
    }
  };

  if (page === "invest") {
    renderInvestments();
    mainContent.hidden = true;
    dynamicPage.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const selected = pageContent[page];
  const cardsHTML = selected.cards.length
    ? selected.cards.map(card => `
        <article class="creator-entry glass-panel">
          <div>
            <p class="eyebrow">BUSINESS OPPORTUNITY</p>
            <h2>${card.title}</h2>
            <p class="muted">${card.description}</p>
          </div>
          <button class="primary-button" type="button"
            data-shop-category="${card.id}">
            ${card.action}
          </button>
        </article>
      `).join("")
    : `
        <article class="creator-entry glass-panel">
          <h2>Coming next</h2>
          <p class="muted">This section will be built in a later stage. Your existing balance and saved progress remain in place.</p>
        </article>
      `;

  dynamicPage.innerHTML = `
    <section class="dynamic-page-content">
      <p class="eyebrow">NU LIMITS · EMPIRE</p>
      <h1>${selected.title}</h1>
      <p class="muted">${selected.subtitle}</p>
      <div class="dynamic-page-cards">${cardsHTML}</div>
      <button class="secondary-button" type="button" data-page="home">
        ← Back to Home
      </button>
    </section>
  `;

  mainContent.hidden = true;
  dynamicPage.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}


document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    navigateTo(button.dataset.page);
  });
});


// ========================================
// NU LIMITS — INVESTMENT TERMINAL
// Simulated market data; not live prices.
// ========================================
function renderInvestments() {
  const root = document.getElementById("dynamic-page");
  if (!root) return;

  const assets = [
    { symbol: "NVDA", name: "NVIDIA Corporation", type: "Stock", price: 142.80, change: 2.42, points: [36,34,38,31,33,28,32,24,27,21,23,15,18,12,16,8,11,5,7,2] },
    { symbol: "AAPL", name: "Apple Inc.", type: "Stock", price: 248.50, change: 0.86, points: [33,35,30,31,27,30,25,26,23,27,20,21,18,22,15,16,11,13,8,7] },
    { symbol: "MSFT", name: "Microsoft Corporation", type: "Stock", price: 511.20, change: 1.14, points: [35,32,34,29,31,25,27,23,25,19,20,17,19,12,14,10,13,6,8,4] },
    { symbol: "TSLA", name: "Tesla, Inc.", type: "Stock", price: 342.70, change: -1.32, points: [7,12,5,14,9,17,10,18,13,22,16,24,18,26,20,29,25,31,27,35] },
    { symbol: "BTC", name: "Bitcoin", type: "Crypto", price: 108420.00, change: 3.74, points: [37,33,36,29,32,26,30,21,25,20,23,15,18,12,17,8,11,5,8,2] },
    { symbol: "ETH", name: "Ethereum", type: "Crypto", price: 3925.40, change: 2.08, points: [35,34,30,32,27,29,23,25,21,24,17,20,14,16,10,13,7,10,4,3] },
    { symbol: "SOL", name: "Solana", type: "Crypto", price: 184.20, change: -0.58, points: [9,5,12,8,16,10,18,13,21,15,24,18,26,22,29,25,31,27,33,35] },
    { symbol: "SPY", name: "S&P 500 ETF", type: "ETF", price: 672.15, change: 0.44, points: [34,32,33,29,30,27,28,24,26,22,23,19,20,16,18,13,14,10,11,7] }
  ];
  const moneyKey = "nuLimitsInvestments_v1";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(moneyKey) || "{}"); } catch { saved = {}; }
  if (!saved || typeof saved !== "object") saved = {};
  if (!saved.holdings) saved.holdings = {};
  if (!Array.isArray(saved.history)) saved.history = [];
  let selectedSymbol = assets.some(a => a.symbol === saved.selected) ? saved.selected : "NVDA";
  let range = "1D";
  let filter = "All";
  let search = "";

  const money = n => "R " + Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const signed = n => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}%`;
  const asset = () => assets.find(a => a.symbol === selectedSymbol) || assets[0];
  const persist = () => { saved.selected = selectedSymbol; localStorage.setItem(moneyKey, JSON.stringify(saved)); };
  const holdingsValue = () => Object.entries(saved.holdings).reduce((sum,[sym,h]) => {
    const a = assets.find(item => item.symbol === sym); return sum + (a ? a.price * h.quantity : 0);
  }, 0);
  const chartSvg = a => {
    const vals = a.points;
    const coords = vals.map((v,i) => `${20 + i * (560/(vals.length-1))},${20 + v*3.05}`).join(" ");
    const area = `M ${coords.replaceAll(" ", " L ")} L 580,150 L 20,150 Z`;
    const green = a.change >= 0;
    const color = green ? "#168A68" : "#C65A43";
    return `<svg class="nl-chart-svg" viewBox="0 0 600 170" role="img" aria-label="Simulated ${a.symbol} price chart">
      <defs><linearGradient id="nl-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".24"/><stop offset="100%" stop-color="${color}" stop-opacity="0.01"/></linearGradient></defs>
      ${[35,70,105,140].map(y=>`<line x1="20" y1="${y}" x2="580" y2="${y}" stroke="#e9e4dc" stroke-dasharray="3 5"/>`).join("")}
      <path d="${area}" fill="url(#nl-chart-fill)"/><polyline points="${coords}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="580" cy="${20+vals[vals.length-1]*3.05}" r="4.5" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>`;
  };
  const render = () => {
    const a = asset();
    const list = assets.filter(item => (filter === "All" || item.type === filter) && (`${item.symbol} ${item.name}`.toLowerCase().includes(search.toLowerCase())));
    const holding = saved.holdings[a.symbol] || { quantity: 0, average: 0 };
    const balance = window.nuLimitsMoney?.getBalance?.() ?? Number((localStorage.getItem("nuLimitsMoneySave_v1") && JSON.parse(localStorage.getItem("nuLimitsMoneySave_v1")).balance) || 100000);
    root.innerHTML = `<section class="dynamic-page-content nl-invest-page">
      <div class="nl-invest-heading"><div><p class="eyebrow">NU LIMITS / MARKETS</p><h1>Investments</h1><p class="muted">Build your portfolio. Track every move.</p></div><span class="nl-market-status"><i></i> MARKET SIMULATION</span></div>
      <section class="nl-chart-dock" aria-label="Selected asset chart">
        <div class="nl-chart-top"><div class="nl-asset-title"><span class="nl-asset-icon">${a.type === "Crypto" ? "₿" : a.type === "ETF" ? "↗" : "◈"}</span><div><strong>${a.symbol}</strong><small>${a.name}</small></div></div><span class="nl-asset-type">${a.type}</span></div>
        <div class="nl-price-line"><strong>${money(a.price)}</strong><span class="${a.change >= 0 ? "positive" : "negative"}">${signed(a.change)} today</span></div>
        <div class="nl-chart-stats"><span>OPEN <b>${money(a.price * .991)}</b></span><span>HIGH <b>${money(a.price * 1.018)}</b></span><span>LOW <b>${money(a.price * .978)}</b></span></div>
        <div class="nl-chart-area">${chartSvg(a)}</div>
        <div class="nl-chart-axis"><span>09:00</span><span>11:00</span><span>13:00</span><span>15:00</span><span>NOW</span></div>
        <div class="nl-range-controls">${["1D","1W","1M","1Y","ALL"].map(r=>`<button class="${range===r?"active":""}" data-range="${r}">${r}</button>`).join("")}</div>
        <p class="nl-sim-note">Illustrative simulated prices · Not connected to a live exchange</p>
      </section>
      <section class="nl-trade-panel"><div class="nl-trade-title"><div><p class="eyebrow">QUICK TRADE</p><h2>Trade ${a.symbol}</h2></div><span>Available <b>${money(balance)}</b></span></div>
        <label for="nl-quantity">Quantity</label><div class="nl-trade-controls"><input id="nl-quantity" type="number" min="0.001" step="0.001" value="1"/><button class="nl-buy" data-trade="buy">Buy</button><button class="nl-sell" data-trade="sell">Sell</button></div>
        <p class="nl-trade-feedback" id="nl-trade-feedback">Estimated order value: ${money(a.price)}</p></section>
      <section class="nl-market-section"><div class="nl-section-head"><div><p class="eyebrow">DISCOVER</p><h2>Markets</h2></div><input class="nl-market-search" id="nl-market-search" placeholder="Search assets" value="${search.replaceAll('"','&quot;')}" aria-label="Search markets"/></div>
        <div class="nl-filter-row">${["All","Stock","Crypto","ETF"].map(f=>`<button class="${filter===f?"active":""}" data-filter="${f}">${f === "Stock" ? "Stocks" : f === "Crypto" ? "Crypto" : f}</button>`).join("")}</div>
        <div class="nl-market-list">${list.map(item=>`<button class="nl-market-row ${item.symbol===selectedSymbol?"selected":""}" data-asset="${item.symbol}"><span class="nl-mini-symbol">${item.type==="Crypto"?"₿":item.type==="ETF"?"↗":"◈"}</span><span class="nl-market-name"><b>${item.symbol}</b><small>${item.name}</small></span><span class="nl-market-price"><b>${money(item.price)}</b><small class="${item.change>=0?"positive":"negative"}">${signed(item.change)}</small></span></button>`).join("") || `<p class="muted">No assets match your search.</p>`}</div></section>
      <section class="nl-portfolio-panel"><div class="nl-section-head"><div><p class="eyebrow">YOUR POSITIONS</p><h2>Portfolio</h2></div><strong>${money(holdingsValue())}</strong></div>
        <div class="nl-position-list">${Object.entries(saved.holdings).filter(([,h])=>h.quantity>0).map(([sym,h])=>{const item=assets.find(x=>x.symbol===sym);return item?`<div class="nl-position-row"><span><b>${sym}</b><small>${h.quantity.toFixed(3)} units</small></span><strong>${money(item.price*h.quantity)}</strong></div>`:""}).join("") || `<p class="muted">Your positions will appear here after your first trade.</p>`}</div>
      </section>
      <section class="nl-portfolio-panel"><div class="nl-section-head"><div><p class="eyebrow">RECENT ACTIVITY</p><h2>Trade history</h2></div></div><div class="nl-position-list">${saved.history.slice(0,8).map(t=>`<div class="nl-position-row"><span><b>${t.side} ${t.symbol}</b><small>${new Date(t.date).toLocaleString()}</small></span><strong class="${t.side==="BUY"?"positive":"negative"}">${money(t.total)}</strong></div>`).join("") || `<p class="muted">No trades yet.</p>`}</div></section>
      <button class="secondary-button" type="button" data-page="home">← Back to Home</button>
    </section>`;

    root.querySelectorAll("[data-asset]").forEach(btn=>btn.addEventListener("click",()=>{selectedSymbol=btn.dataset.asset;persist();render();}));
    root.querySelectorAll("[data-range]").forEach(btn=>btn.addEventListener("click",()=>{range=btn.dataset.range;render();}));
    root.querySelectorAll("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>{filter=btn.dataset.filter;render();}));
    const searchInput=root.querySelector("#nl-market-search");
    searchInput?.addEventListener("input",()=>{const pos=searchInput.selectionStart;search=searchInput.value;const listRoot=root.querySelector(".nl-market-list");const filtered=assets.filter(item=>(filter==="All"||item.type===filter)&&(`${item.symbol} ${item.name}`.toLowerCase().includes(search.toLowerCase())));listRoot.innerHTML=filtered.map(item=>`<button class="nl-market-row ${item.symbol===selectedSymbol?"selected":""}" data-asset="${item.symbol}"><span class="nl-mini-symbol">${item.type==="Crypto"?"₿":item.type==="ETF"?"↗":"◈"}</span><span class="nl-market-name"><b>${item.symbol}</b><small>${item.name}</small></span><span class="nl-market-price"><b>${money(item.price)}</b><small class="${item.change>=0?"positive":"negative"}">${signed(item.change)}</small></span></button>`).join("")||`<p class="muted">No assets match your search.</p>`;listRoot.querySelectorAll("[data-asset]").forEach(btn=>btn.addEventListener("click",()=>{selectedSymbol=btn.dataset.asset;persist();render();}));searchInput.focus();searchInput.setSelectionRange(pos,pos);});
    const quantityInput=root.querySelector("#nl-quantity");
    quantityInput?.addEventListener("input",()=>{const q=Number(quantityInput.value);const fb=root.querySelector("#nl-trade-feedback");fb.textContent=`Estimated order value: ${money(Math.max(0,q)*a.price)}`;});
    root.querySelectorAll("[data-trade]").forEach(btn=>btn.addEventListener("click",()=>{
      const qty=Number(quantityInput?.value);const current=asset();const total=Number((qty*current.price).toFixed(2));const side=btn.dataset.trade.toUpperCase();const fb=root.querySelector("#nl-trade-feedback");
      if(!Number.isFinite(qty)||qty<=0||qty>1000000){fb.textContent="Enter a valid quantity.";return;}
      const h=saved.holdings[current.symbol]||{quantity:0,average:0};
      if(side==="BUY"){
        if(total> (window.nuLimitsMoney?.getBalance?.() ?? 0)){fb.textContent="Insufficient cash balance for this order.";return;}
        if(!window.nuLimitsMoney?.transact?.("expense",total,`Investment purchase: ${qty} ${current.symbol}`)){fb.textContent="Trade could not be completed. Check your cash balance.";return;}
        const newQty=h.quantity+qty;h.average=((h.quantity*h.average)+(qty*current.price))/newQty;h.quantity=newQty;saved.holdings[current.symbol]=h;
      }else{
        if(qty>h.quantity){fb.textContent="You do not own enough units to sell.";return;}
        if(!window.nuLimitsMoney?.transact?.("income",total,`Investment sale: ${qty} ${current.symbol}`)){fb.textContent="Sale could not be completed.";return;}
        h.quantity=Number((h.quantity-qty).toFixed(6));if(h.quantity<=0)delete saved.holdings[current.symbol];else saved.holdings[current.symbol]=h;
      }
      saved.history.unshift({side,symbol:current.symbol,quantity:qty,total,date:new Date().toISOString()});saved.history=saved.history.slice(0,100);persist();render();
    }));
    root.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",()=>navigateTo(btn.dataset.page)));
  };
  persist();
  render();
}

function renderCreatorSetup(message = "") {
  const dynamicPage = document.getElementById("dynamic-page");
  if (!dynamicPage) return;

  let savedSetup = {};
  try {
    savedSetup = JSON.parse(
      localStorage.getItem("nuLimitsCreatorSetup_v1") || "{}"
    );
  } catch {
    savedSetup = {};
  }


  dynamicPage.innerHTML = `
    <section class="dynamic-page-content creator-dashboard">

      <div class="creator-topline">
        <div>
          <p class="eyebrow">NU LIMITS / CREATOR STUDIO</p>
          <h1>Build your influence.</h1>
          <p class="muted">
            Turn your creativity into a business. Start small, grow your audience,
            unlock new categories and build your media empire.
          </p>
        </div>
        <div class="creator-live-badge">
          <span class="creator-status-dot"></span>
          CHANNEL SETUP
        </div>
      </div>

      <article class="creator-hero glass-panel">
        <div class="creator-avatar" aria-hidden="true">▶</div>
        <div class="creator-hero-copy">
          <p class="eyebrow">YOUR CHANNEL</p>
          <h2 id="creator-preview-name">Your creator journey starts here</h2>
          <p id="creator-preview-category" class="muted">
            Choose your niche and establish your brand.
          </p>
          <div class="creator-tag-row">
            <span class="creator-tag">New creator</span>
            <span class="creator-tag">Not monetised</span>
          </div>
        </div>
        <div class="creator-hero-stat">
          <span>SUBSCRIBERS</span>
          <strong>0</strong>
          <small>Just getting started</small>
        </div>
      </article>

      ${message ? `<p class="creator-message" role="status">${message}</p>` : ""}

      <div class="creator-section-heading">
        <div>
          <p class="eyebrow">YOUR FIRST MILESTONE</p>
          <h2>Set up your channel</h2>
        </div>
        <span class="creator-step-count">STEP 01 / 03</span>
      </div>

      <article class="creator-entry glass-panel">
        <div class="creator-card-intro">
          <div class="creator-icon-tile">✦</div>
          <div>
            <h2>Channel identity</h2>
            <p class="muted">
              Choose a memorable name and the content you want to create.
            </p>
          </div>
        </div>

        <form id="creator-setup-form" class="creator-form">
          <label for="creator-channel-name">Channel name</label>
          <input
            id="creator-channel-name"
            name="channelName"
            class="creator-input"
            type="text"
            maxlength="30"
            placeholder="e.g. The Next Level"
            required
          >

          <label for="creator-category">Main content category</label>
          <select
            id="creator-category"
            name="category"
            class="creator-select"
            required
          >
            <option value="">Choose your category</option>
            <option value="Gaming">Gaming</option>
            <option value="IRL / Lifestyle">IRL / Lifestyle</option>
            <option value="Reviews & Tech">Reviews & Tech</option>
            <option value="Esports">Esports</option>
          </select>

          <div class="creator-form-note">
            <span aria-hidden="true">ⓘ</span>
            Your secondary categories will unlock as your channel grows.
          </div>

          <button class="earn-click-button" type="submit">
            Save Channel Setup <span aria-hidden="true">→</span>
          </button>
        </form>
      </article>

      <div class="creator-section-heading">
        <div>
          <p class="eyebrow">BEFORE YOU LAUNCH</p>
          <h2>Build your creator setup</h2>
        </div>
        <span class="creator-step-count">STEP 02 / 03</span>
      </div>

      <div class="creator-requirement-grid">
        <article class="creator-requirement glass-panel">
          <div class="creator-requirement-icon">⌂</div>
          <div>
            <h3>A place to create</h3>
            <p>Own or rent a home.</p>
          </div>
          <span class="creator-requirement-status">Pending</span>
        </article>

        <article class="creator-requirement glass-panel">
          <div class="creator-requirement-icon">▣</div>
          <div>
            <h3>Computer</h3>
            <p>Your content workstation.</p>
          </div>
          <span class="creator-requirement-status">Pending</span>
        </article>

        <article class="creator-requirement glass-panel">
          <div class="creator-requirement-icon">♫</div>
          <div>
            <h3>Microphone</h3>
            <p>Capture clear audio.</p>
          </div>
          <span class="creator-requirement-status">Pending</span>
        </article>

        <article class="creator-requirement glass-panel">
          <div class="creator-requirement-icon">◎</div>
          <div>
            <h3>Camera</h3>
            <p>Record your content.</p>
          </div>
          <span class="creator-requirement-status">Pending</span>
        </article>
      </div>

      <div class="creator-section-heading">
        <div>
          <p class="eyebrow">GROW YOUR EMPIRE</p>
          <h2>Your future milestones</h2>
        </div>
        <span class="creator-step-count">STEP 03 / 03</span>
      </div>

      <article class="creator-entry glass-panel creator-milestone-card">
        <div class="creator-milestone-row">
          <div class="creator-milestone-icon">↗</div>
          <div>
            <h3>Grow your audience</h3>
            <p>Build subscribers, views and channel reputation.</p>
          </div>
          <span class="creator-lock">01</span>
        </div>

        <div class="creator-milestone-divider"></div>

        <div class="creator-milestone-row">
          <div class="creator-milestone-icon">✦</div>
          <div>
            <h3>Unlock new categories</h3>
            <p>Reach channel-growth milestones to expand your content.</p>
          </div>
          <span class="creator-lock">02</span>
        </div>

        <div class="creator-milestone-divider"></div>

        <div class="creator-milestone-row">
          <div class="creator-milestone-icon">◈</div>
          <div>
            <h3>Work towards monetisation</h3>
            <p>Build your channel before unlocking creator income.</p>
          </div>
          <span class="creator-lock">03</span>
        </div>
      </article>

      <button
        id="creator-back-business"
        class="secondary-button"
        type="button"
      >
        ← Back to Businesses
      </button>
    </section>
  `;


  document.getElementById("creator-channel-name").value =
    savedSetup.channelName || "";

  document.getElementById("creator-category").value =
    savedSetup.category || "";

  document.getElementById("creator-setup-form").addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const channelName = document
        .getElementById("creator-channel-name")
        .value.trim();

      const category = document
        .getElementById("creator-category")
        .value;

      if (!channelName || !category) return;

      const setup = {
        channelName,
        category,
        status: "setup-in-progress"
      };

      try {
        localStorage.setItem(
          "nuLimitsCreatorSetup_v1",
          JSON.stringify(setup)
        );

        renderCreatorSetup("Channel details saved successfully.");
      } catch {
        renderCreatorSetup(
          "Could not save your setup. Check your browser storage."
        );
      }
    }
  );

  document.getElementById("creator-back-business").addEventListener(
    "click",
    () => navigateTo("business")
  );
}


document.getElementById("dynamic-page")?.addEventListener(
  "click",
  event => {
    const actionButton = event.target.closest(
      "[data-shop-category]"
    );

    if (!actionButton) return;

    const categoryId = actionButton.dataset.shopCategory;

    if (categoryId === "youtube-creator") {
      renderCreatorSetup();
      return;
    }

    renderShopCategory(categoryId);
  }
);

function renderShopCategory(categoryId) {
  const categories = {
    "shop-electronics": {
      title: "Computers & PC Components",
      subtitle: "Build your ultimate workstation.",
      products: [
        ["Gaming PC", "A complete desktop for gaming and content creation.", 25000],
        ["Graphics Card", "Upgrade your workstation's graphics performance.", 12000],
        ["Processor", "Power up your computer with a faster CPU.", 6500],
        ["RAM Memory", "Improve multitasking and system performance.", 1800],
        ["SSD Storage", "Expand your storage with a fast solid-state drive.", 1500]
      ]
    },
    "shop-creator": {
      title: "Creator Equipment",
      subtitle: "Everything you need to launch your creator career.",
      products: [
        ["Microphone", "Capture clear, professional-quality audio.", 1200],
        ["Creator Camera", "Record videos in high quality.", 4500],
        ["Studio Lighting", "Improve the look of your recordings.", 900],
        ["Webcam", "Stream and record directly from your computer.", 1500]
      ]
    },
    "shop-accessories": {
      title: "Monitors & Accessories",
      subtitle: "Fine-tune your setup with premium accessories.",
      products: [
        ["Gaming Monitor", "A large display for work and gaming.", 4200],
        ["Mechanical Keyboard", "A responsive keyboard for your setup.", 1100],
        ["Gaming Mouse", "Precise control for gaming and everyday use.", 650],
        ["Headphones", "Hear every detail while creating content.", 950]
      ]
    },
    "shop-luxury": {
      title: "Luxury & Lifestyle",
      subtitle: "Enjoy the rewards of building your empire.",
      products: [
        ["Luxury Watch", "A statement accessory for your character.", 8500],
        ["Designer Outfit", "Refresh your character's personal style.", 3500],
        ["Premium Sunglasses", "Complete your luxury look.", 1800]
      ]
    }
  };

  const category = categories[categoryId];

  if (!category) return;

  const dynamicPage = document.getElementById("dynamic-page");
  if (!dynamicPage) return;

  dynamicPage.innerHTML = `
    <section class="dynamic-page-content">
      <p class="eyebrow">NU LIMITS · LUXURY SHOP</p>
      <h1>${category.title}</h1>
      <p class="muted">${category.subtitle}</p>

      <div class="dynamic-page-cards">
        ${category.products.map(([name, description, price]) => `
          <article class="creator-entry glass-panel">
            <div>
              <p class="eyebrow">AVAILABLE ITEM</p>
              <h2>${name}</h2>
              <p class="muted">${description}</p>
              <h3>R ${price.toLocaleString("en-ZA")}</h3>
            </div>
          </article>
        `).join("")}
      </div>

      <button class="secondary-button" type="button" id="back-to-shop">
       ← Back to Shop
      </button>
    </section>
  `;

  document.getElementById("back-to-shop")?.addEventListener("click", () => {
  navigateTo("shop");
});

window.scrollTo({ top: 0, behavior: "smooth" });
}


const notificationsButton = document.getElementById("notifications");

if (notificationsButton) {
  notificationsButton.addEventListener("click", () => {
    showActivity(
      "You're all caught up",
      "New empire updates will appear here."
    );

    document.querySelector(".section-block:last-of-type")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

document.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => {
    button.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(.96)" },
        { transform: "scale(1)" }
      ],
      { duration: 180, easing: "ease-out" }
    );
  });
});

console.log("Nu Limits interface initialized.");


// ========================================
// NU LIMITS — PERSISTENT MONEY SYSTEM
// ========================================

(function () {
  "use strict";

  const SAVE_KEY = "nuLimitsMoneySave_v1";
  const STARTING_BALANCE = 100000;
  const MAX_TRANSACTION = 1000000000000;

  const balanceElement = document.getElementById("balance");
  const historyElement = document.getElementById("transaction-history");
  const countElement = document.getElementById("transaction-count");
  const toggleButton = document.getElementById("transaction-toggle");
  const toggleIcon = document.getElementById("transaction-toggle-icon");
  let showAllTransactions = false;

  if (
    !balanceElement ||
    !historyElement ||
    !countElement
  ) {

    console.error(
      "Nu Limits money system: Required HTML elements were not found."
    );
    return;
  }

  function createInitialSave() {
    return {
      balance: STARTING_BALANCE,
      transactions: []
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);

      if (!raw) return createInitialSave();

      const saved = JSON.parse(raw);

      if (
        !saved ||
        !Number.isSafeInteger(saved.balance) ||
        saved.balance < 0 ||
        !Array.isArray(saved.transactions)
      ) {
        return createInitialSave();
      }

      return {
        balance: saved.balance,
        transactions: saved.transactions.filter((item) =>
          item &&
          typeof item.description === "string" &&
          Number.isSafeInteger(item.amount) &&
          typeof item.date === "string" &&
          (item.type === "income" || item.type === "expense")
        ).slice(0, 100)
      };
    } catch (error) {
      console.error("Nu Limits could not load its money save:", error);
      return createInitialSave();
    }
  }

  let save = loadSave();

  function persistSave(nextSave) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(nextSave));
      return true;
    } catch (error) {
      alert(
        "Your browser could not save the money changes. " +
        "Your balance has not been changed. Check your browser storage."
      );
      console.error("Nu Limits could not save:", error);
      return false;
    }
  }

  function formatMoney(amount) {
    return "R " + amount.toLocaleString("en-ZA");
  }

  function render() {
    balanceElement.textContent = formatMoney(save.balance);
    historyElement.replaceChildren();

    countElement.textContent =
      save.transactions.length +
      (save.transactions.length === 1 ? " record" : " records");

    if (save.transactions.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-transactions";
      empty.textContent = "Your transactions will appear here.";
      historyElement.appendChild(empty);
      return;
    }

    save.transactions
  .slice(0, showAllTransactions ? 100 : 4)
  .forEach((transaction) => {
      const row = document.createElement("div");
      row.className = "transaction-row";

      const details = document.createElement("div");
      details.className = "transaction-details";

      const description = document.createElement("strong");
      description.textContent = transaction.description;

      const date = document.createElement("small");
      date.textContent = new Date(transaction.date).toLocaleString("en-ZA");

      const amount = document.createElement("strong");
      amount.className =
        transaction.type === "income"
          ? "transaction-income"
          : "transaction-expense";

      amount.textContent =
        (transaction.type === "income" ? "+" : "−") +
        formatMoney(transaction.amount);

      details.append(description, date);
      row.append(details, amount);
      historyElement.appendChild(row);
    });
  }

  function recordTransaction(type) {
    const descriptionInput = prompt(
      type === "income"
        ? "What is this income for?"
        : "What is this expense for?"
    );

    if (descriptionInput === null) return;

    const description = descriptionInput.trim();

    if (!description) {
      alert("Please enter a transaction description.");
      return;
    }

    const amountInput = prompt("Enter the amount in rand (R), without decimals:");

    if (amountInput === null) return;

    const amountText = amountInput.trim();

    if (!/^\d+$/.test(amountText)) {
      alert("Enter a whole number, such as 500 or 2500.");
      return;
    }

    const amount = Number(amountText);

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > MAX_TRANSACTION
    ) {
      alert("Enter a valid amount greater than zero.");
      return;
    }

    let newBalance;

    if (type === "expense") {
      if (amount > save.balance) {
        alert("Insufficient funds! Your balance cannot go below R 0.");
        return;
      }

      newBalance = save.balance - amount;
    } else {
      newBalance = save.balance + amount;

      if (!Number.isSafeInteger(newBalance)) {
        alert("This transaction would make the balance too large.");
        return;
      }
    }

    const transaction = {
      type,
      description,
      amount,
      date: new Date().toISOString()
    };

    const nextSave = {
      balance: newBalance,
      transactions: [transaction, ...save.transactions].slice(0, 100)
    };

    if (!persistSave(nextSave)) return;

    save = nextSave;
    render();
  }



if (toggleButton && toggleIcon) {
  toggleButton.addEventListener("click", () => {
    showAllTransactions = !showAllTransactions;

    toggleButton.setAttribute(
      "aria-expanded",
      String(showAllTransactions)
    );

    toggleButton.setAttribute(
      "aria-label",
      showAllTransactions
        ? "Minimize transactions"
        : "Expand transactions"
    );

    toggleIcon.textContent = showAllTransactions ? "⌄" : "⌃";

    render();
  });
}



  // Earn R15 with every click
  const earnClickButton = document.getElementById("earn-click-button");
  const EARN_PER_CLICK = 15;

  if (earnClickButton) {
    earnClickButton.addEventListener("click", () => {
      const nextSave = {
        balance: save.balance + EARN_PER_CLICK,
        transactions: [
          {
            type: "income",
            description: "Earn Per Click",
            amount: EARN_PER_CLICK,
            date: new Date().toISOString()
          },
          ...save.transactions
        ].slice(0, 100)
      };

      if (!Number.isSafeInteger(nextSave.balance)) {
        alert("Your balance has reached its maximum safe limit.");
        return;
      }

      if (!persistSave(nextSave)) return;

      save = nextSave;
      render();

      earnClickButton.classList.add("is-earning");
      window.setTimeout(() => {
        earnClickButton.classList.remove("is-earning");
      }, 180);
    });
  }

  // NU LIMITS — wire income & expense buttons
  document.querySelectorAll(".income-button").forEach((button) => {
    button.addEventListener("click", () => recordTransaction("income"));
  });

  document.querySelectorAll(".expense-button").forEach((button) => {
    button.addEventListener("click", () => recordTransaction("expense"));
  });

  window.nuLimitsMoney = {
    getBalance: () => save.balance,
    transact: (type, amount, description) => {
      if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_TRANSACTION || !Number.isSafeInteger(Math.round(amount))) return false;
      const rounded = Math.round(amount);
      const nextBalance = type === "income" ? save.balance + rounded : type === "expense" ? save.balance - rounded : NaN;
      if (!Number.isSafeInteger(nextBalance) || nextBalance < 0) return false;
      const nextSave = { balance: nextBalance, transactions: [{ type, description: String(description || "Investment transaction"), amount: rounded, date: new Date().toISOString() }, ...save.transactions].slice(0, 100) };
      if (!persistSave(nextSave)) return false;
      save = nextSave;
      render();
      return true;
    }
  };

  render();
})();

// ========================================
// NU LIMITS — SAVED GAME CLOCK
// 1 game day = 15 real seconds
// ========================================

(function () {
  "use strict";

  const DATE_KEY = "nuLimitsGameClock_v1";
  const DAY_LENGTH_MS = 15000;
  const START_DATE = new Date(Date.UTC(2030, 0, 1));

  const dateElement = document.getElementById("game-date");
  const dayElement = document.getElementById("game-day");

  if (!dateElement || !dayElement) {
    console.error("Nu Limits game clock: Date display elements not found.");
    return;
  }

  function loadStartTime() {
    try {
      const saved = localStorage.getItem(DATE_KEY);

      if (saved !== null) {
        const timestamp = Number(saved);

        if (Number.isSafeInteger(timestamp) && timestamp >= 0) {
          return timestamp;
        }
      }

      const now = Date.now();
      localStorage.setItem(DATE_KEY, String(now));
      return now;
    } catch (error) {
      console.error("Nu Limits game clock could not load its save:", error);
      return Date.now();
    }
  }

  const realStartTime = loadStartTime();

  function renderGameDate() {
    const elapsed = Math.max(0, Date.now() - realStartTime);
    const dayOffset = Math.floor(elapsed / DAY_LENGTH_MS);
    const currentDate = new Date(START_DATE);

    currentDate.setUTCDate(START_DATE.getUTCDate() + dayOffset);

    const weekday = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      timeZone: "UTC"
    }).format(currentDate);

    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }).format(currentDate);

    dateElement.textContent = `${weekday} · ${formattedDate}`;
    dayElement.textContent = `DAY ${dayOffset + 1}`;
  }

  renderGameDate();
  window.setInterval(renderGameDate, 1000);
})();


/* ===== NU LIMITS WALLET CARD SWITCHING ===== */
(() => {
  const wallet = document.getElementById("wallet-stack");
  const switchButton = document.getElementById("wallet-switch");
  const cardLabel = document.getElementById("wallet-card-label");

  if (!wallet || !switchButton || !cardLabel) return;

  const debitCard = wallet.querySelector(".debit-card");
  const creditCard = wallet.querySelector(".credit-card");
  const dots = wallet.querySelectorAll(".wallet-dot");

  if (!debitCard || !creditCard) return;

  let creditActive = false;

  function switchCard() {
    creditActive = !creditActive;
    wallet.classList.toggle("credit-active", creditActive);

    cardLabel.textContent = creditActive
      ? "Platinum credit card"
      : "Debit card";

    switchButton.innerHTML = creditActive
      ? "<span>⇄</span> Show debit card"
      : "<span>⇄</span> Show credit card";

    dots.forEach((dot, index) => {
      dot.classList.toggle(
        "active",
        index === (creditActive ? 1 : 0)
      );
    });
  }

  // Clicking either card swaps the front and back positions.
  debitCard.addEventListener("click", switchCard);
  creditCard.addEventListener("click", switchCard);
  switchButton.addEventListener("click", switchCard);

  // Also allow keyboard users to switch cards.
  [debitCard, creditCard].forEach((card) => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        switchCard();
      }
    });
  });

  // Use a saved player name when available.
  const playerName =
    localStorage.getItem("nuLimitsPlayerName") ||
    localStorage.getItem("playerName") ||
    "PLAYER NAME";

  const debitName = document.getElementById("debit-player-name");
  const creditName = document.getElementById("credit-player-name");

  if (debitName) debitName.textContent = playerName;
  if (creditName) creditName.textContent = playerName;
})();