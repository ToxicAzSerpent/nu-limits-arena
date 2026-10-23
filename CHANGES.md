# Nu Limits — change log

Every round of tweaks gets documented here so you always know what moved.

---

## Round 1 — 2026-10-21 `r1`

**Type:** bug fix + project setup. No layout or feature changes — nothing you were
working on has been altered.

### Fixed

**Brand logo was missing.**
`index.html` pointed at `images/nu-limits-logo.png`, but no `images/` folder came
through in the files you sent. That produced a broken-image icon in the header
and a 190×19 px empty gap.

- Added `images/nu-limits-logo.svg` — a clean vector mark in your palette
  (`#F47B20` orange spark tile + `NU` charcoal / `LIMITS` orange wordmark).
- Exported `images/nu-limits-logo.png` at 3× (1140×240) as a raster fallback.
- Header now uses `<picture>` — browsers take the SVG, anything old falls back to the PNG.
- Result: header logo renders at its intended 190×40 with no layout shift.

> If you have your own logo file, just drop it in as
> `images/nu-limits-logo.svg` (or `.png`) — it will pick it up automatically.
> Delete this placeholder.

### Verified working (unchanged, but I confirmed it)

Ran the app in a headless browser at 390×844 and checked every path:

| Check | Result |
|---|---|
| Console errors | none |
| Failed network requests | none |
| `Earn R 15` button | R 100 000 → R 100 015, transaction recorded |
| Game clock | `Tuesday · 1 January 2030` / `DAY 1` |
| Nav → Businesses | renders, `h1` = "Businesses" |
| Nav → Investments | renders full terminal, `h1` = "Investments" |
| Nav → Luxury Shop | renders, `h1` = "Luxury Shop" |
| Nav → Empire Hub | renders, `h1` = "Empire Hub" |
| Nav → Properties | renders, `h1` = "Properties" |
| Wallet card switch | debit/credit z-order swaps correctly |

### Not changed on purpose

I did **not** touch `style.css`, `home-redesign.css` or `script.js`. You said
you're actively working on this, and I didn't want to create merge pain in code
you're editing. The only file I edited is `index.html` (one line, the logo).

### One thing you may want to look at

On the home screen the **Platinum credit card sits almost entirely behind the
debit card** — only a thin sliver shows along the top and bottom edges. That's
intentional per `home-redesign.css` (a stacked 3D wallet), but the "Switch card"
button is the only obvious affordance. If you want the second card more visible
as a teaser, that's a `translateY` / `scale` tweak in `home-redesign.css`. Say
the word and I'll adjust it.

---

## How to test a round

1. Download the ZIP for the round (e.g. `nu-limits-r1.zip`).
2. Extract to a **new folder** — don't overwrite your working copy.
3. Open `index.html` in your browser.
4. Compare against `backup/` inside the ZIP, which holds the exact files you sent me.

Your save lives in browser localStorage, so the same browser/profile keeps your
progress. Opening a different folder path is treated as the same origin
(`file://`), so your R balance and trades carry over.

---

# Round 2 — Live market chart + attached trade bar

**New files (nothing in `style.css` / `script.js` / `home-redesign.css` was edited):**
- `invest-live.css` — styling for the live dock, compact state and attached trade bar.
- `investments.js` — replaces the Investments page at runtime (overrides `renderInvestments()`); everything else keeps working.

`index.html` only gained two tags: the new stylesheet and `<script src="investments.js" defer>`.

## What changed

1. **The chart is actually live.** A `<canvas>` renderer redraws at 60 fps; the price engine ticks every 1.6 s.
2. **Not predictable.** Prices come from a stochastic engine, not a hard-coded array:
   - log-volatility follows an Ornstein–Uhlenbeck process → volatility clusters (calm stretches, then bursts)
   - a trend regime that flips every 12–38 steps
   - Poisson jumps (2% per tick, up to 3.2× normal size) → sudden shocks
   - each asset has its own seeded series per timeframe (1D/1W/1M/1Y/ALL) and its own volatility multiplier
3. **Smooth, not steppy.** New data is eased from the currently drawn curve into the new one (560 ms cubic ease-out), so the line flows instead of snapping.
4. **Trade box is attached to the graph.** The old separate `.nl-trade-panel` is gone — quantity stepper + Buy/Sell now sit inside the chart dock, directly under the graph.
5. **It stays attached while you scroll the stock list.** The dock is `position: sticky`; once it reaches the top it animates into a compact mode (chart 168 px → 54 px, stats/axis/ranges fade and collapse, buttons shrink 40 → 36 px) while the market list scrolls underneath. Scrolling back up restores it.
6. **Extras:** crosshair + price tooltip on the chart, price flash + tick arrow on each move, live revaluation of the market list and portfolio, toast confirmation on trades.

## Data safety
`nuLimitsInvestments_v1` is read and written with the exact same schema (`selected`, `holdings{symbol:{quantity,average}}`, `history[]`). Existing holdings and trade history load untouched. Trades settle through `window.nuLimitsMoney.transact()` so `nuLimitsMoneySave_v1` stays authoritative.

## Verified (Chromium, 390×844 mobile emulation)
| Check | Result |
|---|---|
| Console errors / failed requests | 0 / 0 |
| Price updates over 3.6 s | R 142,80 → R 142,53 |
| Canvas repaint | changed, 84 234 non-blank px |
| Sticky dock while scrolling | top pinned at 0 px at scrollY 501 and 1400 |
| Compact transition | chart 168 → 54 px, trade bar still visible |
| Buy 1 NVDA | balance R 100 000 → R 99 858, holding chip "1.000" |
| Reload | holding + balance preserved |
| Sell 0.5 NVDA | "Sold 0.5 NVDA for R 71,00", history updated |
| 360 px width | layout intact |

---

# Round 3 — pinned chart (no more shrinking) + black home icons

## 1. The chart no longer rescales while you scroll

**What was wrong:** round 2 changed the card's size from JavaScript on every scroll event (compact / expand). That state machine fought the browser: shrinking the card changed the page height, which changed the scroll position, which fired the check again — so it flickered between "minimised" and "maximised" on phone *and* laptop.

**What it does now:** everything scroll-related was deleted. The card is pinned with pure CSS (`position: sticky; top: 0`) at **one fixed size** — it never grows, never shrinks, never animates on scroll. It simply sticks to the top and the market list scrolls underneath it. The scroll listener and all `.is-compact` rules are gone from `investments.js` / `invest-live.css`.

Also removed on the pinned card: the translucent `rgba(...)` background and `backdrop-filter: blur()` (a known cause of repaint shimmer while scrolling on mobile). The card is now solid `#FFFDF9` with a lighter shadow, so it renders identically at every scroll position.

**Measured (390×844):** dock height **445 px** and top **0 px** at scrollY 600 / 1100 / bottom — identical, and the class list never changes.

## 2. Stats row fits on one line
OPEN / HIGH / LOW / VOL were wrapping onto two lines; they're now a 4-column grid (24 px, one row).

## 3. Short screens
On viewports under 760 px tall the chart drops to 116 px so the market list keeps some room. Static rule, no scroll logic.

## 4. New home icons
The four "Build your empire" cards had emoji-like glyphs (⌘ ◈ ⌂ ◇) on an orange tile. They're now **black tiles with detailed white line-art**, one new stylesheet — `home-icons.css`:

| Card | Icon |
|---|---|
| Businesses | storefront — awning, display window, door |
| Investments | candlestick chart on a price axis |
| Properties | house — pitched roof, window, front door |
| Luxury Shop | shopping bag with a cut-diamond sparkle |

Tiles are 43 px, radius 14 px, `linear-gradient(150deg,#33302B,#1B1916,#0E0D0B)` with an inner highlight and a lift on hover. `index.html` changed only inside those four `.action-icon` spans.

## Files
- `home-icons.css` — **new**
- `invest-live.css` — compact rules deleted, solid pinned dock, stats grid
- `investments.js` — scroll/compact logic deleted
- `index.html` — 4 icons + 1 stylesheet link

Verified: 0 console errors, 0 failed requests, phone 390×844 and 360×640, desktop 1440×900.

---

# Round 4 — Mansions / Property page + Creator edit mode

## The page
`Properties` (the route behind the "Properties" card on Home) is now a real mansion market.

- **Square 736 × 736 cards.** Every listing's photo area is a perfect 1:1 square — 324 × 394 px on a 390 px phone, 412 × 482 px on desktop, all identical, laid out by CSS grid so **no slot can ever overlap another**.
- **Photo as the background, black accent over it.** Each card is the photo with a top-to-bottom fade (`rgba(0,0,0,.42)` → `.06` → `.30` → `.86`) so the name, price and bills stay readable on any image.
- **Details on the card:** prestige level, status (FOR SALE / OWNED / LEASED), name, price, and a 2-column fact grid — tax, internet, and every bill (Power, Water, Garden, Security, Concierge…).
- **Black Buy and Lease buttons** in a cream action bar under the photo. They carry the amounts (`Buy · R 48 000`, `Lease · R 900`) so the two stay distinguishable.
- **Bought → OWNED** on the same card, same size, same details, with **Pay bills** (total monthly upkeep) and **Sell** (returns 80 % of the price). Nothing on the page is editable in play mode.
- **Filter tabs** — All / For sale / Owned — plus a portfolio strip: owned count, portfolio value, monthly upkeep.

## Creator edit mode
Home → **Settings → "Creator edit mode"** (new section at the bottom of the home page).

Turn it on and the Properties page changes shape:
- A black **EDIT MODE · MANSIONS** bar at the top with a Done button.
- **Edit / delete** buttons on every card.
- A dashed **"+ Add mansion slot"** tile with the same 1:1 dimensions — adds a slot and opens the editor.
- **"Add photo"** prompt on any card without a photo.

The editor is a bottom sheet with: photo (upload / remove), name, price, lease / month, tax / month, internet / month, prestige slider 0–100, and a **bills list you can add to and remove from** (Power, Water, anything).

The mode is a shared flag — `window.nuLimitsEditMode` with `isOn()`, `set(bool)` and `onChange(fn)` — so the next pages we build can read the same switch.

## Photos
Uploads are auto-cropped to **exactly 736 × 736** (centre crop, `cover`), re-encoded as JPEG at quality 0.74 and stored in the save. The three starter mansions ship with real photos in `images/mansions/` (736 × 736, ~68–130 KB each); you can delete or replace them in edit mode.

## Money
Buying, leasing, bills and selling all settle through `window.nuLimitsMoney.transact()`, so the balance, the home wallet and the transaction list stay in sync. Insufficient funds shows a toast with the exact shortfall. State lives in `nuLimitsMansions_v1` (`{version, editMode, mansions[]}`) and is separate from every other save.

## Files
- `properties.css` — **new**
- `properties.js` — **new**
- `images/mansions/mansion-01..03.jpg` — **new**
- `index.html` — one stylesheet link, one script tag, the Settings section
- `investments.js` — one added line: `window.nuLimitsInvestLeave` so the route can clean up

## Verified (Chromium, 390×844 + 1280×900)
| Check | Result |
|---|---|
| Console errors / failed requests | 0 / 0 |
| Cards | 3 × 324×394 px (phone), 3 × 412×482 px (desktop) |
| Square photo areas | all `width == height` |
| Overlapping slots | none |
| Edit mode switch | false → true, persists |
| Rename + price + photo upload | saved, photo stored as `data:image/jpeg` |
| Add slot → delete slot | 3 → 4 → 3, delete confirms |
| Buy R 77 777 mansion | R 100 000 → R 22 223, badge OWNED |
| Reload | ownership + portfolio kept |
| Pay bills R 2 359 | R 22 223 → R 19 864 |
| Sell (80 %) | R 19 864 → R 82 086, badge FOR SALE |
| Invest page after visiting Properties | still live, prices still ticking |

---

# Round 5 — Empire assets hub (cars, bikes, jets, yachts, islands, hangars) + collection

The Properties page is now an **asset hub** with a category rail:

`Mansions · Cars · Motorbikes · Private jets · Yachts · Islands · Hangars · My collection`

## Card shapes that suit each thing
- **Mansions / Islands** keep the round-4 **736 × 736 square** card.
- **Cars, motorbikes, jets, yachts, hangars** use a **4:3 landscape card** (324 × 243 on a phone) — the right shape for a vehicle, with room for specs.
- Everything still has the photo background + black fade, prestige pill and status badge.

**Specs that make sense per category** (all editable):

| Category | Shown on the card |
|---|---|
| Mansions | tax, internet, power, water |
| Cars / Motorbikes | 0–100 km/h, power, top speed, year |
| Private jets | range, cruise speed, seats, year |
| Yachts | length, guests, crew, range |
| Islands | tax, area, beaches, distance to mainland |
| Hangars | tax, jet capacity, floor area, built |

## Buy and lease where it makes sense
Buy + Lease on mansions, cars, bikes, jets, yachts and hangars. **Islands are buy-only** (no lease button, single full-width Buy). Owned things show **Pay bills** (the exact monthly total) and **Sell** (80 % back).

## Unlock rules
- **A private jet requires an owned private hangar.**
- **A yacht requires an owned private island.**
- Locked cards show a LOCKED badge, a dimmed photo and a single **"Unlock with a private hangar →"** button.
- The category shows an amber banner — *"Private jets require a private hangar."* — with a **View Hangars** shortcut that jumps straight to that category.
- Once you own one, the banner turns green: *"Unlocked — you own a private hangar."*
- The rule is enforced in the purchase code too, not just visually.

## My collection
The last chip lists **everything owned or leased** across every category in one place, with a small category tag on each card, the same Pay bills / Sell / End lease actions, and the empire totals pinned above: owned count, portfolio value and monthly upkeep.

## Edit mode
Works on every category now. Home → Settings → Creator edit mode gives you, per category:
- **"+ Add car slot"** (or mansion / jet / island …) with the correct shape
- **edit** and **delete** on every card
- the editor adapts: photo, name, price, lease, prestige, **the category's own spec fields**, and the bills list

## Save migration
New key `nuLimitsAssets_v1` (`{version:2, editMode, items[]}`). On first run it **imports your round-4 `nuLimitsMansions_v1` catalogue** — names, photos, prices, bills and owned/leased state all survive — then seeds the six new categories around it. Nothing is wiped; the old key is left untouched as a backup.

## Files
- `assets-hub.css` — **new** (category rail, 4:3 cards, lock states, collection)
- `properties.js` — extended from mansions to all assets (migration + rules)
- `properties.css` — toast nudge only
- `images/assets/` — **new**: 3 cars, 2 bikes, 2 jets, 2 yachts, 1 island, 1 hangar
- `index.html` — one stylesheet link

## Verified (Chromium, 390×844)
| Check | Result |
|---|---|
| Console errors / failed requests | 0 / 0 |
| Category chips | 8, active chip auto-centred in the rail |
| Mansion cards | square (1:1) |
| Car cards | 3, ratio 1.33 (4:3) |
| Car specs | 0–100, power, top speed, year |
| Jets without a hangar | 2 LOCKED, 0 buy buttons, gate banner shown |
| Buy hangar R 180 000 | R 5 000 000 → R 4 820 000 |
| Jets after hangar | unlocked, Buy available |
| Yachts without an island | still 2 LOCKED |
| Collection | jet + hangar listed with category tags, totals R 1 630 000 / R 19 500 |
| Edit mode add slot + spec edit | saved, name + power reflected on the card |
| Reload | ownership + edits persisted |
| r4 save migration | "Legacy Villa" kept as OWNED, 12 items total |
| Horizontal page overflow | 0 px in every category |

---

# Round 6 — Luxury Stores replaces the old Shop

The old Shop (4 generic categories, "BUSINESS OPPORTUNITY" eyebrows, no photos, no buy buttons) is **gone**. Tapping Shop now opens a fashion retail module.

## Structure
**Luxury Stores** → 6 brand houses → each with a **Women** and a **Men** section.

| House | Pieces |
|---|---|
| Hermès | Kelly bag, slingback pumps · holdall, loafers |
| Gucci | sunglasses, belted trench · wool suit, dress watch |
| Givenchy | silk gown, top-handle bag · cashmere knit, holdall |
| Louis Vuitton | trench, sunglasses · holdall, wool suit |
| Chanel | silk gown, slingbacks · dress watch, cashmere knit |
| Dolce & Gabbana | top-handle bag, silk gown · loafers, wool suit |

24 pieces, all photographed, all buyable.

## Dimensions that fit clothing
- **Store tiles and product cards are 3:4 portrait** — the ratio fashion retail uses. 156 × 208 px on a phone, 200 px wide on desktop, two per row.
- Brand names are set in a **serif wordmark** (uppercase, letterspaced) over the photo with the same black fade as the rest of the app.
- Product card: photo on top, then name, price, **material · sizes**, and a black **Buy** button.

## Buying
Buy deducts through `window.nuLimitsMoney` and marks the piece owned — the badge flips to **OWNED**, the button becomes **"Owned"** (disabled), and the piece appears in **My wardrobe** with its house name on the card. Summary strip tracks *pieces owned / wardrobe value*.

## Creator edit mode
Works with the same Home → Settings switch:
- **"+ Add store"** tile on the list, **"+ Add women's/men's piece"** inside a store
- edit / delete on every store tile and every product card
- store editor: cover photo, name, tagline
- piece editor: photo, name, price, **Women/Men section**, material, sizes, description
- uploads are cropped to 3:4 and stored in the save

## Files
- `shop.css` — **new**
- `shop.js` — **new**
- `images/shop/` — **new**: 10 fashion photos (5 women's, 5 men's), 3:4, 800 × 1067
- `index.html` — one stylesheet link + one script tag

`script.js` is untouched; the old shop markup is simply never reached because the route is intercepted.

## Verified (390×844 + 1280×900)
| Check | Result |
|---|---|
| Console errors / failed requests | 0 / 0 |
| Old scaffold text | 0 hits |
| Stores | 6, correct brand names, 3:4 tiles |
| Store page | Women 2 / Men 2, item ratio 0.75 |
| Buy watch R 89 000 | R 100 000 → R 11 000, OWNED badge, button "Owned" |
| Wardrobe | 1 piece, house tag GUCCI, value R 89 000 |
| Add store (edit mode) | 6 → 7 stores, persisted after reload |
| Add piece | created inside the new store, persisted |
| Desktop | 2 columns × 200 px, no text clipping |

---

# Round 7 — Calendar, real cards, monthly bills, Garage & Wardrobe

Six changes, all additive. Existing saves carry over — nothing is wiped.

## 1 · The clock actually runs a calendar

- **1 game day = 15 real seconds.** **365 days = 1 year.**
- The game starts on **Thursday 1 January 2026**. Day 1. Year 2026.
- Every 15 s the date rolls forward; 31 December rolls into **1 January of the next year**.
- The old round-1 clock in `script.js` still wrote a *2030* date into `#game-date` / `#game-day`
  every second. Those two nodes are now replaced at boot, so those writes land on detached
  elements and can never win. `script.js` itself is untouched apart from one guard (below).
- Progress is saved (`nuLimitsWorld_v1`) — close the tab and the calendar picks up where it
  left off, catching up at most one day so a long absence never lands a surprise bill.

## 2 · Weekdays and the year at the top

Above the wallet, on Home:

```
2026 YEAR                                     Day 1 of 365   ⟫
[MON 29] [TUE 30] [WED 31] [THU 1] [FRI 2] [SAT 3] [SUN 4]
✦ THURSDAY · 1 JANUARY 2026                            DAY 1
```

- Seven-day strip, **today filled black**, days from the previous month greyed.
- Year counter + "Day N of 365" (366 in a leap year).
- `⟫` skips one game day — handy when you want to watch a month tick over.
  Console equivalent: `nuLimitsWorld.advanceDays(30)`.

## 3 · Cards that look like cards

Both cards were rebuilt from scratch:

| Detail | Debit •4821 | Platinum •7734 |
|---|---|---|
| Finish | near-black metal, orange sheen | brushed platinum, white sheen |
| Chip | gold contact plate with traces | silver plate |
| Number | `•••• •••• •••• 4821` embossed | `•••• •••• •••• 7734` |
| Holder / expiry | OBEY S. · 09/29 | OBEY S. · 11/28 |
| Reads | TOTAL NET WORTH + live balance | CREDIT USED this statement |
| Network mark | two interlocking discs | two interlocking discs |

- The two cards sit in a **stack** (front + peeking behind), like cards on a table.
- Switching — tap the peeking edge, tap **⇄ Switch card**, or use ← → keys — lifts the new
  card out of the stack and settles it in front with a 620 ms eased transform, plus a short
  haptic tick on phones. No scroll listeners, no layout resizing.
- Your choice is saved and survives a reload.

## 4 · Every purchase knows which card paid

- The selected card is stamped onto **every expense**: shop pieces, assets, leases, bills.
- Transaction line: `Re-Nylon Trench — Prada · Platinum •7734`.
- The piece / vehicle itself stores the card **and the in-game date**, shown in
  **Wardrobe**, **Garage** and **My wardrobe** rows: `Platinum •7734 · 1 January 2026`.

## 5 · Monthly economics

A statement runs on the 1st of every game month (every 30 game days ≈ 7½ real minutes).

Charged automatically:
- **Bills + tax + internet** for every owned property, vehicle, jet, yacht, island, hangar
- **Lease** for everything you rent
- **Platinum statement** — 2.5 % of the money you put on the credit card that month

On Home, under the wallet, a statement card shows what is coming:

- normal: `R 3 183 — Auto-charged 1 February 2026 · 2 lines`
- short on cash: the card turns amber, `UPKEEP DUE · FEBRUARY 2026 · R 420 · Short R 320`,
  a toast fires, and **nothing is charged** — the balance can never be pushed below R 0.
  A **Pay now** button appears as soon as you can cover it.
- nothing owned: `R 0 — Next statement 1 March 2026 · nothing to charge`

Each line is written into Money activity (`Upkeep: Blackline Cafe`, `Lease: Obsidian GT`,
`Platinum statement`) so the ledger always balances.

## 6 · Garage and Wardrobe

Two new pages, reachable from the **Home action grid**, mirroring My collection.

**Garage** — cars, bikes, jets, yachts, islands and hangars (mansions stay in My collection).
Stats: in the garage · collection value · monthly cost. Filter pills for each category.
Each card shows prestige, value, upkeep or lease, bill count, and the card + date it was bought with.

**Wardrobe** — every owned piece, **grouped by house**, with a filter pill per house.
Stats: pieces · houses · wardrobe value. Each card carries the house tag and the card used.

Both are read-only, like the rest of r4: selling, leasing and paying bills still happen in
My collection.

## 7 · Four new houses — and Rolex is watches only

| House | Women | Men |
|---|---|---|
| Prada | Re-Nylon Trench · R 68 500 | Cashmere Overcoat · R 96 000 |
| Versace | Baroque Silk Gown · R 124 000 | Leather Biker Jacket · R 74 000 |
| Balenciaga | Sculpted Wool Coat · R 58 000 | Oversized Hoodie · R 21 500 |
| **Rolex** | Datejust 36 · Two-Tone · R 168 000 | Submariner Date · R 215 000 |

8 new editorial photographs, 3:4, shot to match the existing lookbook (warm plaster, daylight).
**Existing saves pick the new houses up automatically** — the shop merges any house added in a
later round by name, so you keep every piece you already own.

## Files

| File | Status |
|---|---|
| `wallet.css` | **new** — card anatomy, 3D deck, calendar strip, statement card |
| `world.js` | **new** — clock, calendar, card selection, statement engine |
| `garage.css` | **new** — garage + wardrobe layout |
| `garage.js` | **new** — both collection pages + routing |
| `images/shop/prada-w.jpg`, `prada-m.jpg`, `versace-w.jpg`, `versace-m.jpg`, `balenciaga-w.jpg`, `balenciaga-m.jpg`, `rolex-w.jpg`, `rolex-m.jpg` | **new** |
| `shop.js` | 4 houses added, legacy-save merge, card + date stamped on purchase |
| `properties.js` | card + date stamped on buy and lease |
| `script.js` | one guard: the generic tap-scale no longer fires on the card deck |
| `index.html` | new stylesheet + script links, new wallet markup, Garage/Wardrobe tiles |

## Testing it

1. Open Home — the date reads **Thursday · 1 January 2026**, **DAY 1**, year **2026**.
2. Wait 15 seconds — **Friday · 2 January 2026**, DAY 2. The week strip moves.
3. Tap the peeking card or **⇄ Switch card** — the Platinum card slides to the front.
4. Buy anything (Shop → Prada → Buy). Money activity shows `… · Platinum •7734`.
   Open **Wardrobe** — the piece is there under **Prada** with the card and date.
5. Tap **⟫** 30 times (or `nuLimitsWorld.advanceDays(30)` in the console) — the statement
   charges bills, leases and the Platinum fee, and the money leaves your balance.
6. Spend down to almost nothing, then advance another 30 days — the amber
   **UPKEEP DUE** card appears and the balance is left alone.

## Verified (390×844 phone + 1440×1000 desktop)

| Check | Result |
|---|---|
| Clock | 1 Jan 2026 → 2 Jan 2026 after 16 s, DAY 1 → DAY 2 |
| Week strip | 7 chips, today highlighted (Thu = index 3), out-of-month days greyed |
| Year | 2026 at boot |
| Card switch | debit → credit via the peeking edge; label `Platinum •7734` |
| Purchase with credit | `Re-Nylon Trench — Prada · Platinum •7734`, credit used R 68 500 |
| Card stored on piece | `{card: "Platinum •7734", gameDate: 1 Jan 2026}` |
| Garage | 1 asset, value R 42 000, monthly R 420, `Platinum •7734 · 1 January 2026` |
| Wardrobe | house group **Prada**, 1 piece, card + date line |
| Statement | R 420 upkeep + R 2 763 Platinum fee = **R 3 183** charged |
| Short on cash | balance untouched at R 100, `is-due` card, toast `you're R 320 short` |
| Legacy shop save | 6 houses → **10** after reload, owned pieces kept |
| Console errors / failed requests | 0 / 0 |
| Horizontal overflow | 0 px on phone, home and garage |

## Round 7b — the transaction list now shows the card and the game date

- Each row is **three lines**: item name, a **card badge** (`Debit •4821` black / `Platinum •7734` platinum), then the **in-game date** (`1 January 2026`).
- The card is no longer welded onto the description — it is parsed out of the stored transaction and drawn as a badge, so old records read cleanly too.
- Dates in the ledger are **game dates** from the calendar (1 Jan 2026, 2 Jan 2026…), not the phone's real clock. Records written before this change keep their real timestamp.
- Income rows (`Earn Per Click`, investment sales) have no badge — they were never charged to a card.
- Long names wrap under the amount instead of being pushed off-screen; verified 0 px horizontal overflow with 7 rows expanded.

## Round 7c — the transaction panel: one heading, a button, and polish

**Old:** a "MONEY MANAGEMENT / Money activity" heading, then a second "Recent transactions" heading, a big glass card, and a toggle that only switched 4 rows ↔ all rows — it never actually closed.

**Now:** a single compact **Transactions** bar.

- **Heading removed twice over** — no eyebrow, no "Money activity", just **Transactions** with a small count badge (`15`) and a round chevron button.
- **It opens and closes properly.** Collapsed it is a 58 px bar; open it expands with a 400 ms eased height transition. The chevron rotates into a filled black circle when open.
- **The choice is remembered** (`nuLimitsTxOpen_v1`) — it stays closed when you come back.
- Header is one whole tap target, `aria-expanded` is kept in sync, and the height animation is disabled under `prefers-reduced-motion`.

**Polish — it now reads like a bank statement**

| Before | Now |
|---|---|
| 4 loose white cards | one continuous ledger, hairline dividers |
| date on every row | **sticky date headers** — `3 JANUARY 2026`, `2 JANUARY 2026` |
| plain text row | **direction icon** (red ↗ out, green ↘ in), name, card badge, amount |
| `−R 68 500` inside a card | right-aligned tabular amount, red out / green in |
| 100 rows `⌃ ⌄` expand | list caps at 54 vh and **scrolls inside**, with a **Closing balance** footer |

Everything else is unchanged: card badges still show exactly which card paid (`Debit •4821` / `Platinum •7734`), dates are game dates, income rows have no badge, and the ledger is written by the same money module, so shop, assets, leases, bills and the monthly statement all land here.

**New file:** `transactions.css` — panel, header, ledger rows, sticky dates, closing balance.
`script.js` — the transaction block of the money module was rewritten (render + toggle state); `index.html` — the transactions section replaced.

**Verified (390×844, 360×780, 1440×1000)**

| Check | Result |
|---|---|
| Collapsed height | 58 px (56 px at 360) |
| Open height, 4 rows | 440 px; 15 rows → capped at 527 px with internal scroll |
| Close again | returns to 58 px |
| Persistence | reopened after reload because it was open — state saved |
| Date grouping | 3 groups: 3 Jan / 2 Jan / 1 Jan 2026, sticky while scrolling |
| Card badges | `Platinum •7734`, `Debit •4821` on their own purchases |
| Closing balance | `CLOSING BALANCE R 842 575` |
| Console errors / overflow | 0 / 0 px |

---

# Round 8 — YouTube Content Creator Business

The Business tab is now a full creator simulation. Tapping **Creator Studio** on Home (the old
"Businesses" card) opens it. Nothing about the rest of the empire changed — investments,
properties, shop, garage, wallet and the monthly statement all still work exactly as before.

## 1 · Start a channel

Pick a **channel name** and one of four categories — **Gaming**, **IRL / Lifestyle**,
**Reviews & Tech**, **Esports** — then choose a format to shoot. Each category has its own
formats, audience conversion and ad rate, so the four play differently.

You start with a real starter build: Ryzen 3 4100 · B450M · 16 GB DDR4 · GTX 1650 · 500 GB SATA
· 450 W · stock cooler · 24″ monitor · USB headset mic · phone camera · desk lamp ·
50/50 fibre · bedroom corner. **PC performance 27.** That's the floor, and everything you
see in the game is measured against it.

## 2 · Studio — equipment that actually matters

Fourteen slots, all buyable and all visible:

| Group | Slots |
|---|---|
| **The build** | processor, motherboard, memory, graphics card, storage, power supply, cooling, case |
| **Gear** | monitor, microphone, camera, lighting, capture card |
| **Setup** | internet line, studio space |

**Compatibility is enforced before a rand is spent** — socket (AM4/AM5), memory generation
(DDR4/DDR5) and power draw must all line up:

> *"Needs an AM5 motherboard — yours is AM4."*
> *"450 W Bronze can't carry this — the build would draw 675 W."*

**Performance** is a real calculation, not a label: CPU + GPU + memory + storage contribute,
**cooling throttles the build** if you pair a 4090 with a stock cooler, and **condition** decays
1.6 % per finished video until you service it. **Storage capacity** caps how many unfinished
videos you can hold (500 GB → 2, 4 TB → 16), so the cheap drive becomes a real bottleneck.
You can run **multiple rigs** (R 6 000 to assemble a second) and switch the active one.

## 3 · Production

Sixteen formats across the four niches — gameplay, challenge, tutorial, stream highlights,
vlog, day-in-the-life, travel film, unboxing, review, comparison, tech tutorial, ranked,
tournament recap, strategy, analysis.

Each has **requirements, a production time in game days, a cost and an appeal multiplier**.
Anything with an unmet requirement is greyed out with the exact reason ("Needs a tier 2
microphone"). Production runs in the background and **queues** — you can have several
shooting at once, limited by your drive. Videos finish **ready**, not published.

## 4 · Publishing centre

Finished videos wait for you. Rename them, read the readout —
**quality, current trend, projected view range** — then hit **Publish to channel**.
A **content calendar** shows each slot's deadline; publishing late costs consistency and
reputation, but it is always allowed. Consistency also rises when you hit slots.

## 5 · Growth that isn't a button

Views come from quality × reputation × trend × appeal × luck, where **luck is deliberately
swingy** — some uploads flop at 30 views, others break out. Subscribers convert from views at a
rate driven by engagement skill and video quality. A video can pull 20 000 views and add ten
subs, or 800 views and add forty.

**Trends** roll every few game days across all four niches (Low / Normal / High / Viral) with
random timing and duration, and the dashboard always shows the current board. Trends raise the
ceiling — they never guarantee a hit.

## 6 · Livestreaming

Four durations (30 min, 1 h, 2 h, 4 h) and three quality tiers (720p30, 1080p60, 1440p60).
Before you go live the panel tells you exactly what will go wrong:

> *"Encoding 1080p60 wants 45 performance — yours is 27."*
> *"720p30 wants 8 Mbps up — you have 25."* → risk 0 %, safe

Once live: a **live viewer count that moves**, peak, donations ticking up, a progress bar and an
event log. Dropped frames accumulate from weak internet, hot hardware or a dusty rig — past a
threshold **the stream dies on air** and costs you reputation. You can end early at any time.
Weak streams cannot be faked into good ones by going live longer.

## 7 · Money — all of it through the empire

Every expense and every payout goes through `window.nuLimitsMoney`, so it lands in the same
balance and the same **Transactions** panel as everything else:

- equipment, production costs, stream power/bandwidth, repairs
- **ad revenue** (only after monetisation), **donations**, **sponsorships** above 10 000 subs
- a monthly line for **creator internet** and **studio rent**, charged by the same statement
  engine as property bills (via a hook in `world.js`)

The business dashboard splits it exactly as specified: **gross advertising → platform share
(45 %) → net creator earnings → operating expenses → profit**, with monetisation progress bars
before it unlocks.

**Monetisation** at **1 000 subscribers + 15 000 views** (deliberately reachable in a few hours
of play, unlike YouTube's real thresholds).

## 8 · Skills and milestones

Five skills — production, editing, streaming, engagement, planning — each levelled by doing the
work, each feeding quality, conversion or stream stability. Eight milestones from *first upload*
to *pro own a pro studio build-out*, each paying a cash reward.

## Files

| File | Status |
|---|---|
| `creator-core.js` | **new** — all simulation: catalogue, compatibility, performance, trends, production, publishing, streaming, expenses, milestones |
| `creator.js` | **new** — the five-tab interface and routing |
| `creator.css` | **new** — hero, stat tiles, tabs, catalogues, live panel |
| `images/creator/*.jpg` | **new** — 5 photos (gaming, IRL, tech, esports, studio) |
| `world.js` | one hook: `nuLimitsCreatorCosts()` folded into the monthly statement |
| `index.html` | two scripts, one stylesheet, Home card relabelled **Creator Studio** |

## Verified (390×844, 360×780, 1440×1000)

| Check | Result |
|---|---|
| Start from Home card | onboarding → channel created, persists across reload |
| Gear purchase | RTX 4070 bought: balance −R 24 000, perf 27 → 43, ledger line stamped with the paying card |
| Incompatible part | 4090 blocked by 450 W PSU with the reason shown (button disabled) |
| Production | queue number, live progress, finishes into the publishing centre |
| Publish | title edit saved, quality/trend/projection readout, views and subs credited, milestone reward paid |
| Monetisation | at 1 000 subs + 15 000 views → R 798 gross, R 359 platform share, **R 439 net** |
| Streaming | 720p30 clean vs 1080p60 flagged (risk 18 %), live viewers/donations ticking, stream ends and pays out, +subs |
| Storage cap | 500 GB drive full at 2 videos — third blocked with the reason |
| Monthly costs | `Creator internet · Fibre 1 Gbps` R 2 200 and `Studio rent · Rented studio` R 2 500 appear in the statement |
| Console errors / failed requests | 0 / 0 |
| Horizontal overflow | 0 px on all five tabs at all three widths |

---

# Round 9 — Edit everything, a real business list, and a way back

Round 9 closes the gaps left after the creator build: the creator is now fully editable in
Edit Mode, every page has a Back button, the milestone column reads left to right, and the
Business tab is a portfolio list instead of a single studio page.

## 1 · Edit Mode reaches the creator

`properties.js` already owned the global Edit Mode switch (Home → Settings). The creator now
listens to it and exposes a pencil anywhere there is something to change.

| What | Where | What you can change |
|---|---|---|
| **Channel** | dashboard edit card · **Edit channel** | name (3–28 chars), content category |
| **Rig** | studio · pencil beside the rig name | rig name, delete the rig (first rig is protected) |
| **Every part** | studio rows, and inside every shop sheet | name, price, tier, note, plus the type-specific fields — watts, socket, memory generation, cooler level, drive capacity, upload speed, monthly cost, quality bonus |
| **Every gear item** | gear rows, and inside every shop sheet | same as above |
| **Content formats** | produce tab · **+ Add** / pencil on a card | name, category, production days, cost, appeal multiplier, trained skill, PC/mic/camera/capture-card requirements |
| **Milestones** | dashboard · **+ Add** / pencil on a row | label, trigger, target, reward |

Adding and deleting are supported everywhere a list exists:

* **+ Add processor / graphics card / …** at the bottom of every shop sheet creates a new part in that slot.
* **+ Add** in the formats header creates a format; **Delete** removes one (blocked while a video of that format is still rendering).
* **+ Add** in the milestones header creates a milestone; **Delete** removes one.
* Deleting something that is bolted into a rig is refused with the reason — switch it out first.

### How it persists

`creator-core.js` no longer reads its catalogue straight from the `SHOP` / `TYPES` /
`MILESTONES` constants. `state.catalog` is a merged view of the shipped defaults and whatever
the player has changed, so edits survive a reload without rewriting the source file. Deletions
are remembered as tombstones, so a deleted default never creeps back. Old saves migrate on
load — a missing catalogue simply means "everything is at its default".

Milestones stopped being hard-coded predicates and became data: `{ id, label, kind, target,
reward }` where `kind` is one of `subs`, `views`, `published`, `vidViews`, `streams`,
`monetised`, `perf`, `room`. That is what makes them editable at all, including brand-new ones.

`isMonetised()` still drives the milestone check, so a hand-edited "Monetise" milestone cannot
desync from the dashboard.

## 2 · Back on every page

`back-nav.js` wraps `navigateTo` (it loads last, so it sees every page's routing) and keeps a
short history stack. A pill-shaped **‹ Back** bar is injected as the first element of
`#dynamic-page` and re-injected whenever a page re-renders.

* Shop, Garage, Invest, Properties, Wallet/statements, Creator and Businesses all carry it.
* Back returns to the page you actually came from, not a hard-coded home.
* Back from the first visited page goes Home.
* Home itself has no bar — it is the root.

## 3 · Milestones read left to right

Every milestone row is now `icon · label · amount`, all flush left, with the pencil pinned to
the right edge when Edit Mode is on. Nothing is centred any more.

## 4 · Business tab is a list

`businesses.js` owns the Business tab. It renders a portfolio list, not a page:

* **YouTube Creator Studio** is the first row — cover photo, title, a live subtitle
  (`Obey After Dark · 1 840 subs · Gaming`), a status chip (*New* / *Active* / *Monetised*) and
  **Open →**. Tapping it enters the creator exactly as before.
* **Add business** (Edit Mode only) creates more rows with a name, one-line description and an
  uploaded cover photo — resized to 736 px and stored as a JPEG data URL.
* Each row can be edited or deleted in Edit Mode. The YouTube row can be renamed and re-covered
  but not deleted, so the channel can never become unreachable.
* Businesses that are not built yet open a placeholder notice instead of a broken page.
* Save: `nuLimitsBusinesses_v1`.

The home card **Creator Studio** now lands on this list.

## Files

| File | Status |
|---|---|
| `creator-edit.js` | **new** — the editor sheets: channel, rig, part, format, milestone |
| `businesses.js` | **new** — the business list page, its editor and routing |
| `back-nav.js` | **new** — navigation stack and the universal Back bar |
| `creator-core.js` | editable catalogue + data-driven milestones + `renamePc` / `removePc` + editable drive capacity |
| `creator.js` | pencils, add buttons, edit card, left-aligned milestones, route renamed to `creator` |
| `creator.css` | back bar, edit affordances, sheet fields, business list, milestone grid |
| `index.html` | three new scripts |

## Verified (390×844, 360×780, 1440×1000)

| Check | Result |
|---|---|
| Back bar on every page | present on shop, garage, invest, properties, wallet, creator, businesses |
| Back from creator | returns to the business list; back again returns home |
| Edit Mode toggle | Home → Settings switch flips it; creator page redraws with pens visible |
| Channel rename | saved and shown in the hero and the business subtitle |
| Gear price edit | Ryzen 3 4100 set to R 1 234 → shop and studio rows both show R 1 234 |
| Add format | "Speedrun Sunday" created → 17 formats, appears on the produce tab |
| Add milestone | "Hit 50 videos" created → 9 milestones, row left-aligned |
| Rig rename | "First build" → "The Grind Rig", persisted |
| Delete protection | installed part refused; only rig refused |
| Add business | "Coffee Roastery" added with no photo, placeholder notice on open |
| Edit Mode off | pens, add tiles and the edit card all disappear |
| Production / publish / stream | produce → rewind → publish (266 views) → stream start and end, 0 errors |
| Horizontal overflow | 0 px on all pages at all three widths |
| Console errors | 0 |

---

# Round 10 — The Copper Pot

A second business, and a real one: a restaurant you have to buy before it trades.
Capital in, staff on the payroll, a kitchen that can only fire so many plates, and bills
that arrive whether the room is full or not.

## 1 · It starts with capital

The restaurant is a row on the Business tab, marked **For sale · R 75 000 capital required**.
Tapping it opens the sale memorandum: lease deposit, liquor and trading licence, kitchen
fit-out, opening stock — itemised, adding up to the asking price. The money leaves your
personal balance in one transaction. You cannot open the doors without it.

The sale includes the site, the menu, the licence **and the four staff who already work there** —
a chef, two waiters and a cleaner on R 1 370 a day — plus R 10 000 in the till.

## 2 · The room

Six tabs: **Overview · Menu · Staff · Upgrades · Orders · Reports.**

* **Overview** — hero, till / covers / revenue / profit, a live capacity panel showing which
  part of the business is the bottleneck (demand, kitchen, floor, seats), yesterday's service,
  and deposit / draw buttons.
* **Menu** — 16 dishes and drinks, 10 live at the start. Every item shows price, food cost and
  margin. Toggle dishes on and off; thin menus are cheaper to run but draw fewer people.
* **Staff** — payroll, headcount against the site's staff cap, average skill and morale, and a
  roster grouped by role with **promote** and **fire** on every person.
* **Upgrades** — 21 upgrade lines across Kitchen, Dining, Tech, Delivery and Space, each with
  2–4 tiers and real numbers attached.
* **Orders** — delivery platform, bike capacity, commission and packaging, plus four discounts.
* **Reports** — yesterday's full P&L line by line, a 14-day revenue chart, lifetime totals and
  the review feed.

## 3 · The economy — no free money

Every game day (15 real seconds) the restaurant runs a service:

| In | Out |
|---|---|
| covers × average basket | food & stock cost |
| online orders, net of 28 % platform commission and packaging | wages, every single day |
| | electricity, scaled by covers and equipment |
| | water, scaled by covers |
| | rent and lot levy / rates |
| | spoilage — worse with a big menu, better with cold rooms and stock control |
| | kitchen maintenance, 0.07 % of everything you've installed |
| | random breakdowns (5.5 % a day) |
| | **provisional tax, 27 % of the month's profit, every 30 days** |

Wages, stock and bills come out of the **business till**, not your personal balance. If the till
goes negative it charges 1.5 % a day in overdraft interest, and after two unpaid days the
unhappiest employee walks out. Deposit capital to rescue it, or draw profit when it's healthy
(R 2 000 always stays behind).

## 4 · Customers, reviews and compounding growth

Demand is built from reputation, food quality, price against the market, the day of the week,
the charm of the room, the breadth of the menu and a **buzz** score. Buzz drifts toward a target
set by your reputation and review count — so a room that reviews well gets busier every week,
and one that slips empties out. Nothing here is a fixed payout.

Each service produces real reviews with names, star ratings and dish-specific complaints.
Reviews move reputation (slowly), reputation moves buzz, buzz fills seats. Food quality comes
from the chefs on the line, the equipment in the kitchen and the dishes themselves.

**Prices are elastic.** Raise the menu above market and covers fall; trim it and the room fills.
The value-for-money score also feeds the reviews, so gouging costs stars.

## 5 · Staff are a career, not a number

Hire from three generated candidates per role — each with a name, a skill rating (1–5) and an
asking wage. Every hire costs a fee (two days' wage) and then wages every day.

Promotion ladders:

* Waiter → **Supervisor** → **Manager** → **Director**
* Chef → **Head chef**
* Barman → **Bar manager**
* Cleaner — no ladder, and the only role that keeps hygiene up

Managers and directors are never hired directly — they have to be promoted from the floor.
Each promotion needs a skill and time threshold and pays a bonus out of the till.

**Firing** costs three days' severance and drops everyone else's morale by eight.

## 6 · Upgrades

Kitchen: range cooker, convection oven, deep fryer, prep station, cold room, extractor hood,
dishwash station, coffee machine.
Dining: tables & chairs (24 → 78 seats), interior and décor, air conditioning, sound and
lighting, outdoor terrace.
Tech: POS, stock control, booking system, security cameras.
Delivery: platform listing, delivery bikes (1 → 4), packaging station.
Space: 80 m² → 140 m² → 220 m², which raises the seat cap, the staff cap and the rent.

Seats are capped by floor space, so a bigger dining room means a bigger lease — exactly the
trade a real operator makes.

## 7 · Edit Mode

Everything added this round is editable like the creator business:

| What | Where |
|---|---|
| Name, concept, purchase price | Edit card → **Restaurant details** |
| Every dish — name, icon, category, price, food cost, prep, popularity, plate quality | pencil on any menu row, plus **+ Add a dish** |
| Every employee — name, skill, wage, morale | pencil on any staff row |
| Every upgrade tier — name, label, price and every effect value | pencil on any upgrade card |
| Base wage for all nine roles | **Role wages** |

## Files

| File | Status |
|---|---|
| `restaurant-core.js` | **new** — the whole simulation: purchase, menu, staff, upgrades, promos, reviews, daily P&L, tax, tick |
| `restaurant.js` | **new** — acquisition screen and the six-tab interface |
| `restaurant-edit.js` | **new** — edit sheets for the profile, dishes, employees, upgrade tiers and role wages |
| `restaurant.css` | **new** — the whole restaurant surface |
| `businesses.js` | restaurant row, live subtitle and status, delete protection |
| `index.html` | one stylesheet, three scripts |
| `images/restaurant/hero.jpg`, `kitchen.jpg` | **new** |

## Verified (390×844, 360×780, 1440×1000)

| Check | Result |
|---|---|
| Capital gate | buy blocked without R 75 000; purchase deducts R 75 000 and opens with R 10 000 in the till |
| Day settlement | world clock rolled a day → covers served, cash 10 000 → 10 702, stats updated |
| Costs | rent, lot levy, power, water, wages, spoilage, maintenance, commission and monthly 27 % tax all land in the P&L |
| Staff | hire (4 → 5), promote ladder, fire with severance and morale hit |
| Upgrades | Range cooker L1 → L2 for R 12 000, kitchen capacity 23 → 29 |
| Menu | price edit saved, price index moves with it, new dish added (16 → 17) |
| Promotions | Happy hour starts, cuts the basket 15 % and lifts foot traffic |
| Cash transfers | deposit R 5 000 moves personal → till |
| Edit Mode | 16 pencils on the menu, all five sheets open and save, everything disappears when Edit Mode is off |
| Back button | present on the acquisition screen and every restaurant tab |
| Horizontal overflow | 0 px on all six tabs and the business list at all three widths |
| Console errors / failed requests | 0 / 0 |

---

# Round 11 — Free play and your own starting capital

Two things, both tied to Edit Mode: prices stop blocking you, and you choose how much money
you start with.

## 1 · Free play, switched by Edit Mode

Turn Edit Mode on (Home → Settings) and the Settings card says **Free play — On — nothing is
charged**. From that moment:

* **Nothing is gated by price.** The restaurant can be bought with R 0 in your account, upgrades
  and hires go through with an empty till, properties and cars can be leased or bought, shop
  pieces and creator gear install, and investment orders fill.
* **Affordable purchases still debit normally** — the ledger keeps telling the truth while you
  test; only a purchase you could not otherwise afford is made free.
* **The restaurant cannot fail while testing.** If the till would go negative it is held at zero,
  so staff never walk out mid-preview.
* **Properties show the player actions in Edit Mode.** Cards used to offer only “Edit details”;
  they now also carry Buy / Lease / Pay bills / Sell, so you can operate an asset without
  leaving Edit Mode.
* A small **Edit Mode · free play** badge sits in the back bar on every page.

Turn Edit Mode off and every rule snaps back exactly as before.

Where the gate was removed: `properties.js` (buy, lease, bills), `shop.js` (pieces),
`investments.js` (buy orders), `creator-core.js` (gear, repairs, second rig, production,
streaming), `restaurant-core.js` (purchase, hire, promote, upgrade, promotion) and the shared
money layer, which now treats an unaffordable expense as settled while free play is on.

## 2 · Starting capital

Home → Settings has a new **Starting capital** row:

* type any amount (the default is R 100 000) and press **Apply** — your balance is set to exactly
  that, up or down, in one ledger entry;
* the amount is remembered in `nuLimitsStartCapital_v1`, and **a brand-new game now starts with
  whatever you set** instead of the old fixed R 100 000.

## Files

| File | Status |
|---|---|
| `free-mode.js` | **new** — free-play switch, money wrapper, capital field, back-bar badge |
| `free-mode.css` | **new** — settings rows, pill, capital input, badge |
| `script.js` | starting balance now reads the saved capital |
| `properties.js` | price gates respect free play; buy/lease/bills/sell available in Edit Mode |
| `shop.js`, `investments.js` | price gates respect free play |
| `creator-core.js` | five price gates respect free play |
| `restaurant-core.js` | purchase, hire, promote, upgrade and promotion free; no failure state while free |
| `restaurant.js` | acquisition button reads “Take the keys — free play” |
| `index.html` | settings rows, one stylesheet, one script |

## Verified (390×844, 360×780, 1440×1000)

| Check | Result |
|---|---|
| Capital field | defaults to 100 000; set to 450 000 → balance becomes R 450 000, saved |
| New game | clearing the money save starts the next game at the saved capital |
| Free play on | restaurant bought at R 0, upgrade and hire at R 0, property bought at R 0, shop piece bought at R 0, creator CPU installed at R 0 |
| Free play off | same property buy blocked: “Not enough cash — you're R 120 000 short.” |
| Normal play | with R 500 000 and Edit Mode off, a R 145 000 bag still debits R 145 000 |
| Settings | toggle, free-play row and capital row all render and stay in sync |
| All pages | 8 pages × 3 widths: 0 px overflow, 0 console errors, 0 failed requests |

---

# Round 12 — Bank Corporation: loans, credit, overdraft, repossession

A game about money needs a bank. Nu Limits now has one — and it behaves like a real lender,
not a shop that refuses politely. Your balance can go negative, debit orders can bounce, and
assets can be sold out from under you.

Open it from the **Bank** tab in the bottom bar, or the **Bank Corporation** strip under the
wallet on Home.

## 1 · Debt is real now

* **The balance can go negative.** Instalments, statements, fees and overdraft interest are
  *debit orders*: they are taken whether or not there is cash, up to your overdraft limit.
  Your wallet shows `−R 8 450` in red, with an OVERDRAWN badge on the account.
* **Overdraft**: R 30 000 by default, charged at 20.5% p.a. monthly. If a debit order would take
  you past the limit it is **returned unpaid** — that is when arrears start.
* **The monthly statement no longer refuses to charge.** Upkeep, leases and creator costs are
  debited at month end. Anything the bank refuses stays as **Upkeep due** on Home, exactly as
  before, but now it is the overdraft limit that decides, not a polite warning.
* **A monthly account fee of R 25** is charged while the account is in credit.
* Overdrawn for **three statement cycles** → the overdraft is recalled and the account defaults.

## 2 · Personal loans

Loans tab. Choose an amount (R 5 000 up to your affordability cap), pick a term (6 / 12 / 24 / 36
months) and read the live quote before you apply:

* **Rate** from your credit score — 21.40% p.a. at 642, better as the score climbs, capped at 29.5%;
* **Initiation fee** R 1 207.50 (NCA-capped), added to the financed amount;
* **R 69 monthly administration fee** on top of every instalment;
* **amortisation table** — the next six payments, split into interest and principal;
* the money is paid into your cheque account immediately, and **the first instalment is debited
  30 game days later**, then every 30 days.

You can **pay an instalment early** or **settle the whole loan** at any time. Settling early
saves the remaining interest. One personal loan at a time.

## 3 · Platinum: a real credit card

The Platinum card on Home stops being decoration.

* Activate a credit facility in the **Platinum** tab: the bank approves a limit from your profile
  (R 25 000 at score 642, up to R 200 000).
* The moment the facility opens, **Platinum becomes your payment card** — and the card face on
  Home now reads **CREDIT USED / of R 25 000 · R 18 600 available**, live.
* With Platinum selected, **purchases no longer touch your cash**. Shop pieces, property, cars,
  creator gear, production costs, investments and even the restaurant go on the card and draw
  the limit. The transaction list stamps each one `· Platinum •7734 (card)`.
* **A card purchase that would exceed the limit is declined** — it will not silently raid your
  balance.
* Interest 21.66% p.a. at score 642, charged monthly on the outstanding balance. The minimum
  payment is 5% of the balance or R 250, whichever is larger, collected by debit order every
  30 days.
* **Earn Per Click is disabled while Platinum is selected** — credit is not income. The button
  greys out and the caption reads “Credit is not income — switch to Debit to earn.”
* Freeze and unfreeze the card, pay the minimum, pay the full balance, or pay any amount.

## 4 · Default and repossession

Two missed payments on a loan, on the card, or a recalled overdraft put the account in default.
The bank then does what banks do:

1. **Liquidates your assets**, most liquid first: investments → luxury purchases (45% of price)
   → vehicles (62–68%) → property (70%) → creator equipment (35%) → the restaurant (75% of the
   purchase price plus its till).
2. Every seized item is **removed from your collections** — sold out of Properties, Garage,
   Wardrobe, the portfolio and the studio — and the proceeds pay the debt.
3. **Surplus proceeds go back to you.** A shortfall becomes **bad debt**: written off, reported
   to the credit bureau, score dropped to the floor, and **no new lending for 180 days**.
4. A notice is written to the bank record with exactly what was taken and for how much, and the
   app reloads so every page shows the asset gone.

## 5 · Credit score

Starts at 642. On-time instalments and card payments help. Missed debit orders hurt. A default
hurts badly. The score sets your **rate**, your **loan cap**, your **card limit** and whether the
bank will lend at all. The scale is drawn on the Overview tab with 600/650/700/750 markers.

## 6 · Edit Mode

Everything in the bank is wired to Edit Mode (round 9 rule):

* **Bank tools** appear at the bottom of the page only while Edit Mode is on: set the credit
  score, set the overdraft, grant or change the Platinum limit, waive arrears, or **force a
  default** to run the repossession engine end to end.
* **Free play wins**: while Edit Mode is on, instalments, card minimums, interest and fees are
  skipped and card purchases are recorded without creating debt.

## Files

| File | Status |
|---|---|
| `bank.js` | **new** — lending engine, credit card, overdraft, default & repossession, full page |
| `bank.css` | **new** — bank page, platinum face, meters, notices, home strip, negative money |
| `script.js` | negative balances allowed; new `charge()` and `note()` money APIs; earn-per-click lock |
| `world.js` | statement settles through the overdraft; Platinum purchases route to the bank; card face shows limit/available; `nuLimitsCanPay()` |
| `shop.js`, `properties.js`, `investments.js`, `creator-core.js`, `restaurant-core.js` | affordability checks now understand the Platinum limit |
| `index.html` | Bank tab, home strip, bank stylesheet + script |

## Verified in a browser

| Check | Result |
|---|---|
| Loan | R 25 000 / 24 months at 21.40% → R 1 352 instalment, R 1 208 initiation, R 32 445 total; balance +R 25 000 |
| Instalment | 30 days later R 1 421 (instalment + admin) debited; loan balance R 26 208 → R 25 323 |
| Negative balance | with R 0 and no overdraft room the debit order is returned, balance stays R 0; with room it goes to −R 1 423 and the wallet shows −R 1 423 in red |
| Platinum purchase | R 145 000 bag bought with Platinum: cash unchanged at R 100 000, card outstanding R 145 000, face reads “of R 500 000 · R 355 000 available” |
| Earn lock | Platinum selected → Earn Per Click disabled and relabelled; Debit selected → earns R 15 |
| Other purchases | investment order R 143 and restaurant R 75 000 both went on the card, cash untouched |
| Card limit | purchase above the available limit is declined, no cash fallback |
| Statement | R 5 000 upkeep auto-debited into the account; nothing left “due” |
| Default (automatic) | two missed instalments with no overdraft room → default, car seized (R 812 500), debt cleared, surplus R 786 292 returned |
| Default (Edit Mode) | forced default sold the R 145 000 bag for R 65 250, cleared the R 26 208 loan, left the car and villa alone |
| Repossession records | asset removed from `nuLimitsAssets_v1` / shop / studio, notice + statement lines written |
| Pages | 9 pages × 3 viewports: 0 px overflow, 0 console errors, 0 failed requests |

---

# Round 13 — Family: partners, marriage, children and the household

A sixth tab, and the first one that is not about money you can spend. You find someone,
she moves in with her savings, you buy a ring before you can propose, and the clock you
start decides whether you are having a boy, a girl or twins. Pregnancy outlives the
marriage, the hospital bill outlives the pregnancy, and anything you buy her stays hers.

## 1 · A partner, and her money

**Find a partner** draws three candidates, each with a name, an age and a job or a college:

* **Job** — title, employer and a monthly salary (R 18 500 – R 41 000).
* **College** — course and campus, no salary while she studies.

Whoever you pick moves in with her savings, and **her savings are added to your balance the
day she moves in** — R 6 000 for Hope Meyer, up to R 70 000 for the better-paid candidates.
Her salary then lands every 30 game days as a real credit on the wallet, labelled
`Partner salary · <name>`.

She keeps a working life of her own: **Switch job** (three fresh offers, each a different
employer and salary), **Quit job** (income drops to zero) and **College** (she enrols and
stops earning). Every change is written into the family record.

## 2 · The ring comes first

The jeweller is a new house in the shop — **Cartier** — with three rings:

| Ring | Price |
|---|---|
| Gold Band · 18k | R 18 000 |
| Solitaire Ring · 0.5 ct | R 45 000 |
| Éternité Diamond Band · 2.1 ct | R 118 000 |

Marriage is gated on actually owning one. Until then the partner card shows
*"You need a wedding ring — a ring from the jeweller is required before a proposal"* with a
button that opens the jeweller's storefront directly. On the wedding day the ring leaves
your wardrobe (`ringGiven`) and is recorded on her file as **Day 1 · Gold Band**, so the
ring you chose is part of the history.

**Divorce** costs **R 45 000** and is confirmed before it runs. **Separate** is free and
only available while she is a girlfriend. Either way she becomes an ex with the date, the
reason and the number of children, and the page slides straight into the single state.

## 3 · The mating clock is real time

**Start the clock** and it runs on wall-clock minutes, not game days. The card shows the
running `mm:ss`, a bar that fills against the 45-minute window, the live odds
(*"A boy · 85%"* → *"A girl · 80%"* → *"Twin girls · 65%"*) and the next threshold.

| Time stopped | Result |
|---|---|
| under 30 minutes | 85 % boy, 15 % girl |
| 30 – 45 minutes | 80 % girl, 20 % boy |
| 45 minutes and over | 65 % twin girls, 35 % a single girl |

**Stop the clock** freezes the elapsed time, rolls the sex and starts a pregnancy. The
clock keeps running if you leave the page — it is `Date.now()`, not a frame timer.

## 4 · Pregnancy, birth and the hospital

The pregnancy card tracks 30 game days with a ring that fills as the weeks pass, the week
number out of 40, mother, father, due date, the time that was on the clock and a
**SINGLE / TWINS** chip. **The pregnancy survives a divorce** — the mother's name stays on
the scan even after she has left the house.

At full term the baby is born with a first name, **the mother's full name, the father's
name** and the hospital bill:

| Birth | Bill |
|---|---|
| One baby | R 28 000 |
| Twins | R 46 000 |

The bill is charged to the wallet on the day of the birth. Under round 12 rules a legal
bill may push the account into the overdraft, so a player with no cash ends up negative
rather than skipping the birth. If there is no overdraft headroom left the amount parks in
**hospital account outstanding**, and an alert appears under the stat strip with a **Pay**
button until it is settled.

## 5 · Buy for Her

Four tiles under her name — **Shop · Jeweller · Property · Cars** — switch on gift mode and
take you to that page. A fixed bar sits at the bottom of the screen the whole time:
*"Buying for **Naledi Ngcobo** · it belongs to her"* with **Cancel**.

Everything bought while the bar is on is tagged with her name:

* **Shop pieces** get `owner:"partner"` and a **HERS** badge. They are excluded from your
  wardrobe value and from the "My collection" count.
* **Property, cars, jets, yachts** get `owner:"partner"` too, and are excluded from your
  portfolio and from the garage.

The Property page grows a **Wife / Girlfriend** chip (it reads *Ex-wife / Ex-girlfriend*
once she has left) with her own header, her own count and her own portfolio value and
monthly upkeep. Each item carries **Resell · R 27 000**, which pays 60 % of the purchase
price for property and 50 % for shop pieces. After a divorce the button flips to
**Cannot resell after divorce** and is disabled — the goods stay hers and stay unsellable.

## 6 · The record

* **Partner card** — name, age, days together, job or college, employer or campus, monthly
  income, what she brought in, and the wedding day with the ring.
* **Children** — every child with their name, `Mother · Father`, the day they were born and
  the hospital bill marked **PAID** or **DUE**.
* **Previous partners** — everyone before, with job or course, employer, married or dating,
  the day range, how many children, and a **DIVORCED / SEPARATED** chip.
* **Family record** — a running feed of every event with the money attached: savings in,
  salary in, ring, wedding, birth, hospital, resale, divorce.

## 7 · Edit Mode

The family is fully editable, like every other feature since round 9:

* **Edit partner** — name, age, job title, employer, income, or switch her to a college
  course; saves straight into the household.
* **Wind the clock to 32 min / 46 min** — jump the mating timer so the girl and twin-girl
  branches can be tested without waiting.
* **Birth now** — deliver the current pregnancy immediately.
* **Reset family** — puts the household back to a clean, single state.

## Files

| File | Status |
|---|---|
| `family.js` | **new** — household engine, mating clock, pregnancy, gifts, routing, edit panel |
| `family.css` | **new** — hero, partner card, clock, pregnancy ring, gift bar, sheets |
| `index.html` | Family tab, `family.css`, `family.js` |
| `home-redesign.css` | bottom nav widened from five columns to six |
| `shop.js` | Cartier house with three rings, `owner` / `ownerName` on purchases, HERS badge, wardrobe excludes her pieces |
| `properties.js` | Wife / Girlfriend chip, her possessions view, resale action, gift tagging, her items out of the collection |
| `garage.js` | her cars are not listed as yours |
| `images/shop/jewellery.jpg` | **new** — ring photography for the jeweller |

## Verified in a browser

| Check | Result |
|---|---|
| Partner | Hope Meyer, 24, BCom Law · Wits — savings R 6 000 credited, balance R 100 000 → R 106 000 |
| Job switch | Marketing coordinator · Hollard · R 19 000; quit → Unemployed · R 0 |
| Ring gate | marriage refused without a ring; Gold Band bought for R 18 000, then married, file reads “Day 1 · Gold Band” |
| Mating clock | start 00:00 → wound to 32:00 in Edit Mode → odds “A girl · 80%” → stop → girl, due day 31 |
| Twin branch | wound to 46 minutes → twins; birth produced Zoe S. and Isabella S., R 46 000 each, both PAID |
| Divorce | R 45 000 charged, pregnancy kept, ex recorded as DIVORCED, birth completed afterwards |
| Resale | before the split, property resells at 60 %; after the split the control reads “Cannot resell after divorce” and is disabled |
| Property page | “Girlfriend’s possessions” heading, HERS chip, her total and monthly upkeep, item HERS badge |
| Hospital arrears | seeded R 28 000 bill → alert under the stats with Pay; wallet renders −R 28 000 after a bill pushes into the overdraft |
| Household after divorce | header reads “Single · no children yet”, children and history keep their mother’s name |
| Pages | 10 pages × 390 / 360 / 1440: 0 px overflow, 0 console errors, 0 failed requests |

---

# Round 14 — Dark mode, and a new set of gift icons

## 1 · Appearance, in Settings

Home → **Settings** now opens with **Appearance**: `Light · Dark · Auto`.

* **Light** — the original warm paper look.
* **Dark** — for late sessions. Every page, card, sheet, chart and toast repaints, not just
  the background.
* **Auto** — follows the phone's own light/dark setting and switches with it, live.

The choice is remembered (`nuLimitsTheme_v1`). A tiny inline script in `<head>` applies it
**before the first paint**, so a dark-mode player never sees a white flash on reload, and
`<meta name="theme-color">` follows the theme so the browser chrome matches.

## 2 · How the dark theme is built

Hand-writing a second palette for 15 stylesheets invites misses, so the dark colour layer is
**generated**: `tools/darkgen.py` reads every stylesheet, converts each colour to HSL, and
re-emits only the declarations that need to change — inverted surfaces, lifted text, softened
borders, recoloured accents — behind an `html[data-theme="dark"]` prefix.

That produced **774 rules** covering style, home, wallet, shop, property, garage, invest,
creator, restaurant, transactions, bank and family CSS. The originals are untouched, so light
mode cannot regress. Re-run `python3 tools/darkgen.py` after any styling round to refresh it.

Details that needed a human touch:

* **The logo** swaps to a dark-artwork SVG (`images/nu-limits-logo-dark.svg`) instead of being
  CSS-filtered, so the orange mark stays true.
* **Text gradients** (the "Build limitless." headline) keep their `background-clip: text`
  after the colour swap, so they stay gradients instead of turning into solid bars.
* **Dark text on pastel chips** is lifted to a readable tone; **white text on dark cards**
  stays white.
* **Borders and shadows** are re-weighted — glass borders drop to ~10 % instead of turning
  into bright outlines.

## 3 · Buy for Her gets real icons

The four gift tiles were emoji (👗 💍 🏠 🚗) and read badly at 17 px. They are now inline
line icons drawn to the same 24 px / 1.55 stroke grid as the rest of the app:

| Tile | Icon |
|---|---|
| Shop | clothes hanger |
| Jeweller | solitaire ring |
| Property | house |
| Cars | side-view car |

Her possession rows use the same icon set (hanger, car, house, or a gem for anything else),
so a gifted item is recognisable at a glance in either theme.

## Files

| File | Status |
|---|---|
| `theme.js` | **new** — reads/writes the choice, resolves Auto, paints `data-theme`, fires `nuLimitsThemeChange` |
| `theme.css` | **new** — the Appearance switch, dark-logo swap, theme transition |
| `theme-dark.css` | **new (generated)** — 774 dark override rules across all 15 stylesheets |
| `images/nu-limits-logo-dark.svg` | **new** — cream "NU", orange "LIMITS" |
| `tools/darkgen.py` | **new** — regenerates `theme-dark.css` |
| `index.html` | Appearance row in Settings, theme links, pre-paint theme script |
| `family.js` / `family.css` | gift tiles and possession rows use inline SVG icons |
| `bank.css` | Platinum face sub-line on Home |

## Verified in a browser

| Check | Result |
|---|---|
| Switch | Light → Dark → Auto, stored in `nuLimitsTheme_v1`, hint text follows each mode |
| Persistence | reload in dark stays dark from the first frame; no white flash |
| Auto | “Following your device — currently light.” |
| Coverage | Home, Business, Invest, Shop (stores and products), Property, Garage, Creator, Restaurant, Bank (all four tabs), Family — screenshots in both themes |
| Gift bar | shows on shop / property / garage / creator, hidden on Home and Family |
| Gift icons | 4 inline SVGs, no emoji left in the Buy for Her card |
| Layout | 10 pages × 390 / 360 / 1440 in dark **and** light: 0 px overflow, 0 console errors, 0 failed requests |

---

# Round 15 — Premium night theme, no more stray bill buttons, line icons for the menu

## 1 · The night theme, rebuilt to the reference

Dark mode is no longer "the light theme with the lights off". It is now a near-black,
warm, gold-lit surface the way a premium app looks at night:

| Layer | Value |
|---|---|
| Page | `#0b0a08` with two soft gold-and-amber radial glows behind the content |
| Card | `#191612 → #121110` vertical wash, 1 px `rgba(255,246,235,.075)` edge, 22 px radius |
| Card shadow | `0 18px 40px rgba(0,0,0,.5)` plus a 1 px inner top highlight |
| Accent | gold `#e2be6e`, soft `#f0d8a4`, deep `#a97c33` |
| Text | `#f3eee6` on `#968c80` muted |

What the gold does:

* **Primary buttons** — rich gold gradient (`#f2d9a6 → #dcb066 → #b98a3d`) with near-black
  ink, a soft gold drop-glow and a light top edge. Secondary buttons become translucent
  charcoal with a hairline border.
* **Navigation** — the active tab is a gold wash with gold label and a gold indicator dot.
* **Headlines** — *"Build limitless."* and every page `<h1>` carry a bright gold gradient
  through `background-clip: text`.
* **Small print** — eyebrows and section labels move to muted gold with wider tracking.
* **Danger** stays warm red, on a translucent red fill, so *Divorce* never looks like a
  money button.
* **The logo** — its own dark artwork, cream `NU` and gold `LIMITS`.

The colour layer is still generated (`tools/darkgen.py`, now 803 rules) but the palette was
rewritten: light surfaces map to the near-black card wash, warm and violet accents collapse
into the one gold, greens / reds / blues keep their meaning, borders drop to ~7 % white and
primary oranges are darkened into deep amber wherever they are used as a fill.

## 2 · “Pay bills” is gone

A cash-bought car was offering **Pay bills · R 8 400** next to **Sell**. The purchase is
already paid for, so the button made no sense — and it also double-charged, because the same
running costs were already on the Monthly Statement.

The button is removed from every owned item on every page (cars, motorbikes, mansions, jets,
yachts, islands, hangars) in both normal and Edit Mode, and `payBills()` plus its click
handler are deleted. Owned items now show **Sell** only, plus **Edit details** in Edit Mode.

The costs themselves stay, in one place: a car still carries **insurance, maintenance and
fuel** every month, itemised on the Monthly Statement on Home (verified: an owned Obsidian GT
reports `R 8 400` monthly upkeep — R 4 200 insurance, R 1 800 maintenance, R 2 400 fuel).

## 3 · Menu icons instead of emoji

The restaurant menu was a row of emoji. It is now a single monochrome line-icon set, drawn on
the same 24 px / 1.55 stroke grid as the rest of the app (`icons.js`):

* **16 dishes** — burger, pasta, salad, pizza slice, ribs, steak on a plate, curry, fish,
  fondant, cheesecake wedge, wine, beer, martini, coffee, soft drink, shake.
* **21 upgrades** — flame, oven, fryer, knife, fridge, extractor, wash, cup, chair, lamp,
  snowflake, note, leaf, monitor, box, book, camera, bag, scooter, packaging, building.
* **Fallbacks** — an unknown dish draws a plate, and by category: cutlery for Food, cake for
  Dessert, glass for Drinks.
* The **Icon field is gone** from the dish editor: no emoji to type, and custom dishes pick
  their icon from the category automatically.

Icons are `currentColor`, so they are black line art in light mode and warm white in the
night theme.

## Files

| File | Status |
|---|---|
| `icons.js` | **new** — monochrome dish + upgrade icon set |
| `theme-dark.css` | regenerated — 803 rules on the new gold palette |
| `theme.css` | premium night surface, gold buttons, gold nav, danger styling |
| `images/nu-limits-logo-dark.svg` | gold `LIMITS` |
| `restaurant.js` | menu rows and upgrade cards draw SVG icons |
| `restaurant-edit.js` | the Icon field is removed from the dish sheet |
| `restaurant.css` | `.rs-emoji` becomes an icon holder |
| `properties.js` | `Pay bills` removed; `payBills()` deleted |
| `index.html` | loads `icons.js` |

## Verified in a browser

| Check | Result |
|---|---|
| Night theme | home, business, invest, shop, property, garage, creator, restaurant, bank, family — all near-black with gold accents, no leftover orange or purple |
| Light theme | unchanged; menu icons render as black line art on cream |
| Buttons | primary gold with dark ink, secondary charcoal, divorce red |
| Pay bills | 0 buttons on any owned asset; an owned car shows `Sell` and its R 8 400 still appears on the statement |
| Menu icons | 16 / 16 dish rows draw an SVG; 21 upgrade cards draw one |
| Editing | dish sheet opens without an Icon field, saves cleanly |
| Layout | 10 pages × 390 / 360 / 1440 in **both** themes: 0 px overflow, 0 console errors |

---

# Round 16 — The car section is a showroom now

## 1 · Makes first, then models

Cars no longer open as one flat list. Tapping **Cars** lands on a showroom of **marque
tiles** — a square card per make, photo, name, model count and an arrow. Four to start:

| Make | Photo | First model |
|---|---|---|
| Mercedes-Benz | `images/cars/mb.jpg` | S 500 4MATIC · R 2 150 000 |
| Audi | `images/cars/audi.jpg` | A6 45 TFSI · R 1 095 000 |
| BMW | `images/cars/bmw.jpg` | X3 xDrive20d · R 985 000 |
| Porsche | `images/cars/porsche.jpg` | 911 Carrera · R 2 350 000 |

The tiles are **2 × 2 on a phone and 4 across on a wide screen**, all exactly the same square
size. On hover the photo pushes in 7 %, the tile lifts 3 px, a gold rim catches the edge and
the arrow slides up-right and turns gold. On touch it compresses slightly on press.

## 2 · One page per make

Tapping a tile opens that make's page:

* a **hero photo with a soft fade** into the page — the model shot is masked out at the bottom
  so the title sits in the picture rather than on top of a hard edge, with a 1.1 s fade-in;
* the marque name, one line about it, and how many models it holds;
* **only that make's cars**, in the same card design used everywhere else in the game —
  photos, prestige, price, specs, monthly bills, buy / lease / sell;
* a **← All makes** pill to come back out.

Old saves are migrated in place: every car without a make is given one, a make with no models
gets its first model created, and the three original cars are renamed to real models
(S 500 4MATIC, A6 45 TFSI, X3 xDrive20d) so the pages read properly.

## 3 · Start engine / Stop engine

Every car you own carries an engine strip under its card:

* **Start engine** — plays the car's recorded clip on loop, or, if none was uploaded, a
  synthesised idle (three detuned oscillators through a low-pass with a slow wobble) so the
  button always does something;
* while it runs the LED pulses and the button turns **Stop engine**;
* **Upload sound** (Edit Mode) takes any audio file, stores it against that car and the strip
  reads `RECORDED` instead of `SYNTH IDLE`. Clips are capped at ~20 seconds and ~900 KB, with
  a clear message when a file is too big.

Only one engine can run at a time — starting another stops the first.

## 4 · Edit Mode on the showroom

* **PHOTO** on each marque tile — upload a square cover, cropped to 900 × 900;
* **pencil** — rename the make and edit its one-line description;
* **trash** — delete the make (and its models, after a confirmation);
* **+ Add make** tile — a dashed square that creates a new marque and drops you straight into
  its (empty) page to add the first model. New slots created inside a make inherit it;
* the car editor gained a **MAKE** dropdown, so any model can be moved between makes.

## Files

| File | Status |
|---|---|
| `cars.js` | **new** — marque store, coverage top-up, engine audio (recorded + synth), photo/sound pickers |
| `cars.css` | **new** — square tiles, hover motion, fading hero, engine strip |
| `images/cars/{mb,audi,bmw,porsche}.jpg` | **new** — four studio shots |
| `properties.js` | showroom + per-make page, engine strip, makes in Edit Mode, MAKE dropdown, save migration |
| `index.html` | loads `cars.js` / `cars.css` |
| `theme-dark.css` | regenerated with the cars layer (827 rules) |

## Verified in a browser

| Check | Result |
|---|---|
| Showroom | 4 marque tiles, 2 columns at 390 / 360, 4 columns at 1440, 0 px overflow |
| Make page | hero + only that make's models: Mercedes-Benz → 1 card (S 500 4MATIC); models tagged mb / audi / bmw / porsche in storage |
| Migration | legacy cars renamed, every car given a make, Porsche auto-filled with the 911 |
| Engine | start → `Stop engine` + pulsing LED; stop → idle; uploading a WAV saved it and flipped the strip to `RECORDED` |
| Edit Mode | 4 tile tool sets, add-make tile, prompt → new marque created and opened |
| Themes | showroom, make page and engine strip checked in light and dark |
| Regression | 10 pages × 390 / 360 / 1440 in both themes: 0 overflow, 0 console errors |

---

# Round 17 — 35 upgrade levels, a bigger market, a card chooser at the till

## 1 · Restaurant upgrades run to level 35

Every upgrade — all 21 of them, kitchen through delivery — now has **35 levels** instead of
2–4. The authored tiers stay exactly as they were (levels 1–4 for the range cooker, the
4-burner at R 12 000 and so on); the rest are generated so that **each level costs more than
the one before it**:

* price `previous × 1.185`, rounded to the nearest R 500 (R 50 below R 1 000);
* effects keep climbing — kitchen and quality points step up, waste steps down, seats, staff
  cap and delivery capacity grow;
* labels read `Level 5`, `Level 6` … and can be renamed.

Top level costs, for scale: range cooker **R 16 334 000**, oven R 11 540 000, extractor hood
R 27 472 500.

**Edit Mode**: a pencil on every upgrade card opens **Levels · <name>** — a scrolling list of
all 35 levels, each with a label and a price field. Change any price, press Save, and it is
written into the restaurant catalogue.

## 2 · Back buttons

* The back button at the top no longer bounces you to Home: it walks the real trail. Shop →
  store → Back lands on Shop, and only the next Back goes Home. When there is nothing left in
  the trail it stays put instead of dumping you on the homepage.
* The footer button now reads **“← Back”** and walks the same trail. It only says
  **“← Back to Home”** when Home really is where you came from.

## 3 · English names

Every generated name is English now:

* staff — James Fletcher, Emily Carter, Oliver Hayes, Grace Palmer, and the hire pool;
* customers and reviewers — A. Bennett, J. Hartley, K. Simmons, M. Fletcher, T. Parker …
* partners — Emily, Sophie, Charlotte, Olivia, Amelia / Smith, Taylor, Brown, Wilson;
* children — Jack, Oliver, Harry, George / Amelia, Isla, Ava, Zoe.

Names already saved on your device are not rewritten — only new ones are drawn from the new
lists.

## 4 · Home tile

The **Creator Studio** card is now **Business** with the same briefcase icon as the
navigation bar, and reads *Run your ventures*.

## 5 · Markets: 48 assets

**24 stocks** and **23 cryptocurrencies** plus the S&P 500 ETF, each with its own logo:

| | |
|---|---|
| Stocks | NVDA, AAPL, MSFT, TSLA, AMZN, GOOGL, META, NFLX, AMD, INTC, ORCL, CRM, ADBE, UBER, SHOP, KO, JNJ, V, MA, WMT, DIS, BA, NKE, PFE |
| Crypto | BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, DOT, MATIC, LINK, LTC, ATOM, XLM, TRX, APT, ARB, OP, NEAR, FIL, ETC, AAVE, UNI |

Logos are generated marks (deterministic colour per symbol, round for coins, rounded square
for equities) so every row reads at a glance. **Edit Mode → “Edit asset logos”** on the
Investments page opens a grid of all 48 and lets you upload an image for any of them.

**Trades cost a little more**: a **0.65 % commission** is added on a buy and taken off a sell.
The preview reads `10 × R 248,85 = R 2 488,50 + R 16,00 fee (0.65 %)`, and the confirmation
shows the fee.

## 6 · Choose the card at the till

Pressing **Buy** (shop, property, cars, garage) or **Buy** on a trade now opens a small
**“Pay with”** sheet: two small card faces, **Debit ·4821** and **Platinum ·7734**, with the
credit headroom underneath. Tap one and the purchase continues on that card. It is skipped in
Edit Mode (free play) and when a card is already the selected one.

## Files

| File | Status |
|---|---|
| `restaurant-core.js` | 35-level expander, `setTier()`, English staff/reviewer names |
| `restaurant-edit.js` | `levels()` sheet — every level editable |
| `restaurant.js` / `restaurant.css` | pencil on upgrade cards, level editor styling |
| `back-nav.js` | real back trail for the header and footer buttons |
| `investments.js` | 40 new listings, logos, 0.65 % fee, market API |
| `asset-logos.js` | **new** — generated logos, uploads, Edit Mode grid |
| `cardpick.js` / `cardpick.css` | **new** — the Pay with sheet |
| `family.js` | English partner and child names |
| `index.html` | Business tile, new assets |

## Verified in a browser

| Check | Result |
|---|---|
| Levels | 21 upgrades × 35 levels, every price strictly increasing in all 21 |
| Level editor | 35 rows open, editing level 31 to R 777 000 saves and persists |
| Back | Shop → store → Back returns to Shop; second Back returns Home; footer reads “← Back” |
| Markets | 48 listings, 48 logos rendered; fee line `+ R 16,00 (0.65 %)` on a 10-share buy |
| Logo editor | opens with 48 tiles when Edit Mode is on |
| Pay with | 2 card faces, sheet closes on pick and the purchase continues |
| Regression | 10 pages × 390 / 360 / 1440 in both themes: 0 px overflow, 0 console errors |

---

# Round 18 — Sagittarius AI, a folding market list

## 1 · Sagittarius AI

A floating assistant bottom-right on every page. It runs **entirely on the device** — no
network, no key, no model call — and answers by reading the live state of the game.

**How it works.** `sagittarius-core.js` has a table of intents (regex → answer). Each answer is
built at the moment you ask from the real systems: the wallet, the market engine, your
holdings, the property list, the restaurant, the creator channel, the bank, the household and
the calendar. If a question matches nothing, it says so rather than inventing an answer.

It knows, among others:

| You ask | It answers from |
|---|---|
| “what's the trending stock right now?” | live prices and open, ranked |
| “best bitcoin today” | the crypto board, count of listed coins |
| “how is my portfolio” | holdings, value, P&L on cost |
| “how much money do I have” | wallet, cheque account, credit score |
| “how is the restaurant” | cash, staff count, yesterday's covers and profit |
| “what is my credit score” | bank score, overdraft, Platinum headroom |
| “who is my partner” / “when is the baby due” | household, gestation, hospital arrears |
| “how do I marry her” | the ring gate and the divorce fee |
| “what does a car cost me monthly” | owned cars and their bills |
| “how does dark mode work”, “is edit mode on”, “what day is it” | settings and the world clock |

**The widget.** A round launcher opens a compact panel:

* header with the **Sagittarius mark** (bow and star, drawn as inline SVG) and a live status
  line;
* **a lime-green LED** that blinks while it is searching — `.is-thinking` on the root drives a
  0.85 s pulse on both the header LED and the launcher dot;
* answers **stream in character by character** (~16 ms per frame) over a 520 ms “searching”
  beat, so the LED is always visible;
* user bubbles are near-black (gold in dark mode), bot bubbles are paper, both fade up on
  arrival;
* minimise with the **–** button or Escape; the open state and last 40 messages are remembered;
* `prefers-reduced-motion` turns the typing and transitions off.

## 2 · The Discover list folds away

The Markets section on the Investments page has a **chevron** in its header. Tap it and the
filter row and the 48-row list collapse, leaving the header — and the **Portfolio** panel a
short scroll below. The state is remembered for the session, and a **↓ Portfolio** button next
to the holdings value jumps straight down and flashes the panel's border gold.

## Files

| File | Status |
|---|---|
| `sagittarius-core.js` | **new** — intent table and answers built from live state |
| `sagittarius.js` | **new** — launcher, panel, typing animation, LED state |
| `sagittarius.css` | **new** — panel, bubbles, LED pulse, collapse button |
| `investments.js` | `priceOf` / `openOf` on the market API, collapse + jump controls |
| `invest-live.css` | jump flash |
| `index.html` | loads the two scripts and the stylesheet |

## Verified in a browser

| Check | Result |
|---|---|
| Answers | 14 sample questions answered accurately, including live movers with cents (`R 0.26` for TRX) |
| Offline | no fetch, no keys — everything from localStorage and in-memory state |
| Thinking state | `.is-thinking` set on send, LED pulses, cleared when the answer starts |
| Animation | messages stream in; panel opens with a scale-and-rise |
| Minimise | **–** closes it, launcher returns, state persists across reload |
| Markets | collapse hides the list, jump scrolls to the portfolio and flashes it |
| Regression | 10 pages × 390 / 360 / 1440 in both themes: 0 px overflow, 0 console errors |

# Round 19 — University Road

New interactive location, opened from the **University Road** tile on the home grid
(and `#university` deep link). No separate currency: registration, tuition,
retakes and scholarships all move the existing balance and write into the
existing transaction history.

## What is on the page

| Tab | Contents |
|---|---|
| **Campus** | Faculties, facilities, intake facts, enrolment status |
| **Courses** | All seven courses with duration, total fee, registration fee, entry requirements, careers and a Full-time / Part-time chooser |
| **My studies** | Progress %, module list, average, attendance, preparation, fees due, estimated graduation date, and the action buttons |
| **Qualifications** | Permanent certificates / diplomas / degrees with final average, attendance and the careers they unlock |

Courses: Business Management (Degree, 8 modules, 240 days, R96 000, reg R3 500),
Finance & Accounting (Degree, 8, 260, R108 000, R3 800), Computer Science & IT
(Degree, 8, 250, R112 000, R3 800), Engineering (Degree, 9, 300, R128 000, R4 200),
Marketing (Diploma, 6, 150, R62 000, R2 500), Law (Degree, 9, 300, R132 000, R4 200),
Logistics & Supply Chain (Diploma, 6, 160, R68 000, R2 600).

## Systems reused

* **Game clock** (`nuLimitsWorld.day`) — attendance and preparation decay per day,
  module progress accrues per day, retakes open after 5 days, graduation date is projected.
* **Money** (`nuLimitsMoney.transact`) — every rand is an `expense` with a description
  such as `University registration · Marketing · Debit ‑4821`. Edit Mode and Free Play bypass charges.
* **Save** — `nuLimitsUniversity_v1` next to the existing keys; older saves are unaffected.
* **Edit Mode** — attendance/study boosters, finish module, reset, all in the Edit Mode panel.
* **Back navigation / theme** — uses `back-nav.js`, both light and dark tokens.

## Fair-play rules

* Full-time: 3.4× speed, but the timetable eats the day. Part-time: 1.9× speed,
  1.7× longer to graduate — but you keep working.
* Missed classes: attendance −3 per day away, preparation −3; attending gives +6
  attendance and +4 preparation, studying +18 preparation and +2.5 % of the module.
* Exam mark = 38 + attendance×34 + preparation×28, spread ±15 %. Below 50 % fails,
  retake opens 5 days later and costs R1 400.
* Tuition for a module is charged **once**, when the assessment opens, and blocks the exam until paid.
* Attendance ≥ 85 % and average ≥ 70 % earns a 30 % scholarship on later module fees.

## Verified in a browser

| Check | Result |
|---|---|
| Enrolment | R2 500 registration deducted — 100 000 → 97 500 in the live balance and in the statement |
| Progression | ticking the clock moves the module bar, attendance falls, tuition appears once (R10 333 for Marketing full-time) |
| Exam gate | sitting with money owing is refused; paying clears it and the exam opens |
| Failure path | failed at 42 % → retake opened 5 days later, retake cost R1 400 and was charged once |
| Graduation | all 6 modules passed → Diploma written to Qualifications; re-enrolling the same course cannot award a second copy |
| Persistence | reload keeps module state, marks, money and qualifications; no duplicate tuition |
| Responsiveness | 360 / 390 / 1440, all four tabs, plus a 390 dark pass: 0 px overflow, 0 console errors |
| Edit Mode | four creator tools render and work |

## Files

| File | Status |
|---|---|
| `university.js` | **new** — course data, clock-driven engine, money, render, Edit Mode |
| `university.css` | **new** — campus hero, course cards, module list, certificates, dark block |
| `images/university/campus.jpg` | **new** — hero photo |
| `index.html` | stylesheet + script, seventh home tile `University Road` |
| `tools/darkgen.py` | regenerates the dark block for `university.css` |

## Limitations

* The game has no job system yet, so a qualification lists the careers it unlocks
  but there is no employment screen to bind them to. Promotion logic is therefore not wired.
* Course durations are game days (1 day = 15 s), so a degree plays out over roughly an hour of real time.

# Round 20 — Jobs, qualification badge, empire minimiser

## Jobs board
Seven real-life posts, one per university course:

| Course | Job | Employer | Entry → top |
|---|---|---|---|
| Business Management | Operations Manager | Vantage Holdings | R18 500 → R82 000 |
| Finance & Accounting | Financial Accountant | Meridian Capital | R20 000 → R105 000 |
| Computer Science & IT | Software Engineer | Nova Systems | R24 000 → R120 000 |
| Engineering | Site Engineer | Ironline Construction | R23 000 → R112 000 |
| Marketing | Marketing Coordinator | Bright & Co | R14 500 → R76 000 |
| Law | Candidate Attorney | Kruger Attorneys | R16 000 → R150 000 |
| Logistics & Supply Chain | Supply Chain Coordinator | Cape Freight Co | R13 500 → R72 000 |

Each post lists location, hours, probation, reporting line, duties and the exact
qualification gate — the degree/diploma **and** a minimum final average
(50–62 % depending on the post). Applying without it is refused with the reason.

## Getting the job
* **Apply → interview** runs a 30-second progress bar through five stages
  (screening call, panel, technical assessment, references, offer). Withdraw at any time.
* The panel scores you from your qualification average plus variance; the post's own
  pass mark decides. A rejection blocks re-application for 3 game days.
* Hired at grade 1 with a 30 / 60 / 90 / 120-day probation.

## Working and promotions
* **Clock in** once a game day: +2 performance. Every missed day −5 and is docked from the payslip.
* Five grades per ladder (e.g. Trainee → Junior → Financial Accountant → Finance Manager → Financial Director).
* Promotion needs **time in grade** (75–380 days) **and** a performance threshold (59–88 %).
  The board can still decline; a declined review costs 25 % of your time in grade.
* +6 % annual increase every 365 days of service; a 13th cheque in December when performance ≥ 75 %.

## Pay and tax (real SA deductions)
Gross salary → **PAYE** (annual brackets + primary rebate), **UIF 1 %** (capped R177.12)
and **pension 7.5 %**, each written to the existing transaction history, with a
payslip per 30-day cycle in the Payslips tab. Example: R44 000 gross →
PAYE R9 143, UIF R177, pension R3 300, net R31 380.

## Home screen
* **Qualification badge** at the top of Home: level, course, final average, award date and
  a career it unlocks; tap to open University Road. Updates live after graduation.
* **Empire minimiser** on *Build your empire* — collapses the grid to four icons
  (Business, University, Jobs, Investments) and remembers the choice per device.

## Creator Edit Mode
* Per post: **Hire instantly**, **Pay −10 % / +10 %** (pay scale is stored per job).
* On your own post: performance 100 %, promote now, grade −1, run payroll now, reset career.
* The panel appears and disappears the moment Edit Mode is toggled.

## Verified in a browser
| Check | Result |
|---|---|
| Requirements | all 7 apply buttons locked with no qualification; only the matching course unlocks |
| Interview | overlay opens, bar animates, 30 s default (tested at 2 s), offer card on pass, "not successful" on fail |
| Hire → contract | grade 1, probation, reports-to, leave and notice all render |
| Promotion gate | blocked at 0/90 days, eligible at 105 days + 100 % performance, promotion applied once |
| Payroll | 31-day cycle credits salary, debits PAYE / UIF / pension, payslip stored, balances correct |
| Persistence | grade, payslips, pay scale and career record survive reload |
| Badge | reads "No qualification yet", then "Degree · Computer Science & IT · 84 %" after graduating |
| Minimiser | 4 icons when collapsed, 8 when expanded, state survives reload |
| Responsiveness | 360 / 390 / 1440 + dark pass on home, roles, my job and payslips: 0 px overflow, 0 console errors |

## Files
| File | Status |
|---|---|
| `jobs.js` | **new** — job data, eligibility, interview, payroll, tax, render, Edit Mode |
| `jobs.css` | **new** — board, contract, payslips, interview overlay, badge, minimiser |
| `index.html` | `jobs.css` / `jobs.js`, qualification badge, Jobs tile, minimiser button |
| `theme-dark.css` | regenerated from `tools/darkgen.py` (now includes `jobs.css`) |

## Limitations
* One post at a time — applying elsewhere requires resigning.
* Promotions depend on service days and performance only; there is no separate skills or
  interview-for-promotion mini-game beyond the board decision.
* Payroll months follow the game clock (1 day = 15 s), so a salary cycle is ~7.5 real minutes.

# Round 21 — Blush theme, ignition sequence, vehicle sounds

## Blush — the new default look
A second complete theme, modelled on the beauty-studio reference: warm cream paper,
dusty-rose accents, charcoal feature cards, soft pill buttons and dark tab pills.
It is now the **default** on first launch and for every existing save that never chose
a theme. The old look is untouched: **Settings → Appearance** now offers
**Blush · Light · Dark · Auto**, and Light is the original warm paper theme.
Every page inherits it through variables plus an override sheet, so University, Jobs,
Garage, Bank and the rest all follow without being rewritten.

## Ignition — every car and bike, in the shop and in the garage
* **Start engine** now appears on **every car and bike** card — showroom models for sale,
  your collection, the garage and the make pages. Previously it was cars-only and owned-only.
* Pressing it plays a three-and-a-half second **start sequence**: key in → ignition on,
  dash check → cranking → catch → engine running → throttle blip → settle to idle.
  A tachometer sweeps 0–8 000 rpm with a live needle and digital readout, six cylinder
  LEDs fire in order, exhaust puffs drift, the cabin glow rises with the revs and the
  stage list ticks off as it goes.
* While the engine runs the button turns dark with a pastel-green pulsing dot and reads
  **Stop engine**; the overlay keeps an idling lope until you close or stop it.
* Bikes use a higher-revving synth note and have their own overlay tag.

## Your own vehicle sounds (Creator Edit Mode)
* **Sound library** in the ignition overlay (and any **Upload sound** button on a card)
  lets you attach a recording to a single car or bike, or set one **default engine note**
  that plays for every vehicle without its own clip.
* Clips are stored in the existing `nuLimitsEngines_v1` key, capped at ~1 MB, with
  Preview and Remove per vehicle. Without a clip the synthesised engine plays.

## Verified in a browser
| Check | Result |
|---|---|
| Default theme | fresh save boots `blush`; switch to Light / Dark / Auto persists across reload |
| Switcher | four options in Settings, hints update per mode |
| Start buttons | showroom car 1/1, garage 2 assets → car + bike pill each, bike cards tagged BIKE |
| Sequence | overlay opens, stages advance, rpm 121 (cranking) → 896 (idle), running id tracked |
| Stop | overlay and pill reset, engine id cleared |
| Library | Edit Mode only; 6 vehicle rows, default clip saved and recognised, Remove disabled when empty |
| Dark pass | ignition overlay and blush pages render in dark and light with no errors |
| Regression | 12 pages × 360 / 390 / 1440: 0 px overflow, 0 console errors |

## Files
| File | Status |
|---|---|
| `theme-blush.css` | **new** — the blush palette and component overrides |
| `ignition.js` | **new** — start sequence, tachometer, audio, sound library |
| `ignition.css` | **new** — start pills, overlay, gauges, library sheet |
| `theme.js` | blush added as a mode and the default |
| `index.html` | blush sheet, higher-contrast boot script, fourth theme button, ignition assets |
| `properties.js` | engine row on every car **and** bike, new pill, hands the start to ignition.js |
| `garage.js` | start pill on owned cars and bikes |

## Limitations
* Uploaded clips must be small (about 15 s, under 1 MB) because they live in localStorage.
* The tachometer and stage timings are the same for every vehicle; a supercar and a hatchback
  do not yet differ beyond the bike/car note.
* Auto follows the device between Light and Dark only — it does not pick Blush.


# Round 22 — shape and colour pass

* **Square card edges fixed.** The wallet cards now sit inside a rounded deck and use a
  real 24 px radius with a mask, so the dark card, the platinum card and the stacked card
  behind it all read as cards — no square corners at any width.
* **No more white box around the "Paying with … Switch card" strip.** It is now a single
  rounded pill, and Switch card itself is a blush-pink pill.
* **University tabs fixed.** Campus / Courses / My studies / Qualifications no longer sit
  inside a white plate with a square edge; each tab is its own pill and the active one is
  blush pink.
* **Buttons are blush pink everywhere.** Every primary action (Apply, Buy, Save, Bank
  actions, University actions) uses the same gradient as Jobs → Apply. Secondary and back
  buttons are pink-outlined pills.
* **Bottom navigation matches the theme.** The active tab is the same blush-pink pill as
  Apply, with a dark label and icon; inactive tabs are muted rose.
* **Segmented controls unified:** Stores / My wardrobe, the asset category chips and the
  Bank tabs all use the same pill language.
* **Start-engine feature removed** from every page — showroom, collection and garage.
  Edit Mode still lets you attach an engine note to a car or bike (Upload sound); the
  ignition overlay, its animation and ignition.js / ignition.css are gone.

Verified: 12 pages × 5 passes (390 blush, 360 blush, 1440 blush, 390 light, 390 dark) —
0 px overflow, 0 console errors, 0 "Start engine" controls left in the DOM.

# Round 23 — new logo, blush sweep

## Logo
Both supplied images were cut out of their backgrounds (alpha extracted edge-by-edge,
no white or black box left behind) and are now the real brand assets:

| File | Use |
|---|---|
| `images/nu-limits-mark-light.png` | N-L monogram, ink — light and blush themes |
| `images/nu-limits-mark-dark.png` | N-L monogram, white — dark theme |
| `images/nu-limits-word-light.png` | NU LIMITS wordmark, ink — light and blush themes |
| `images/nu-limits-word-dark.png` | NU LIMITS wordmark, white — dark theme |

The header now shows the **monogram first, then the wordmark beside it** (`.brand-lockup`),
replacing the orange square tile + old logo. It swaps automatically with the theme and
stays at 30 px / 13 px so it fits 360 px screens without wrapping.

## Blush sweep
* **Bank Corporation crest** — the orange shield is now blush pink on both the Bank page
  and the Bank strip on the home screen.
* **Investments page** — the 1D/1W/1M/1Y/ALL range pills, the quantity stepper, Buy / Sell
  and the market cards now follow the theme: Buy is the blush-pink primary, Sell is a
  pink-outlined pill, and the active range is the same pink as Jobs → Apply.
* Quantity stepper rebuilt as one pill (no square white box around the number).

## Verified
12 pages × 5 passes (390 / 360 / 1440 blush, 390 light, 390 dark): 0 px overflow,
0 console errors; header shows the ink lockup in blush and light, the white lockup in dark.

# Round 24 — smaller logo, AI launcher docked, back buttons fixed

* **Logo reduced** — monogram is now 21 px tall and the wordmark 9 px (was 30 / 13), so
  the header is calm instead of loud. Same lockup on every page, because it lives in the
  shared top bar; it still swaps to the white assets in dark mode.
* **Sagittarius button no longer covers anything** — the launcher moved out of the
  floating bottom-right corner and now sits in the top bar next to the notifications bell
  (38 px circle, gold mark, lime LED). The chat panel still opens over the page but above
  the bottom navigation. Automated overlap test: 0 interactive elements under the launcher.
* **Back buttons fixed (University and Jobs).**
  * the top `Back` bar is now re-injected after every page redraw, so it can never be
    wiped by a render;
  * the pages that wrap `navigateTo` themselves (University, Jobs) now report to the
    back-navigation stack, which is why Back previously did nothing — it now returns to
    the page you came from;
  * `← Back to Home` clears the page from the dynamic shell before navigating, so it
    always lands on Home even when the stack is empty.
* Regression: 12 pages × 5 passes (390 / 360 / 1440 blush, 390 light, 390 dark) —
  0 px overflow, 0 console errors; University Back, University Back to Home and Jobs Back
  all verified landing on the right screen.

# Round 25 — card faces match the light theme, new logo on both cards

The blush sheet was repainting **both** wallet cards with one charcoal gradient, which is
why the platinum card came out black. That rule is gone, so each card keeps its own
wallet.css artwork: charcoal debit, light platinum — identical to the light theme.

Both cards now carry the new logo instead of the old "NU LIMITS" text: white monogram +
wordmark on the debit card, ink monogram + wordmark on the platinum card — mark 15 px,
wordmark 6.5 px, so it stays small in the corner.

Verified: card backgrounds read straight from wallet.css (no blush override), card flip
shows the light platinum card, and the 12-page × 5-pass sweep is still 0 px overflow /
0 console errors.

# Round 26 — card shapes restored, draggable Sagittarius

* **Build your empire tiles** are rounded squares (21 px) again, exactly as in light mode —
  the blush pill rule was catching every `button`, so the tiles had become capsules.
  The rule now excludes card-like buttons, and the icon tiles are back to 14 px.
* **YouTube content categories** are 16 px rounded image tiles again (they were pills
  too); the selected niche ring and check badge now use the blush rose instead of orange.
* **Sagittarius panel can be dragged** — grab the header and move it anywhere on screen
  (mouse, touch, pen). It stays inside the viewport, remembers its position across reloads,
  and a ⌂ button in the header snaps it back to the default corner.

Verified: tile radius 21 px, niche radius 16 px, drag moved the panel 28,496 → 8,236 and
the position survived a reload; 12 pages × 5 passes still 0 px overflow / 0 console errors.

# Round 27 — flat navigation, blush CTAs everywhere

* **Bottom navigation is no longer a pill.** The active tab is back to the light-mode
  language: no shape at all, just the blush-rose icon + label with the small underline bar
  underneath. (A later `button { border-radius: 999px }` rule was outranking the reset —
  the nav rule is now `!important` and scoped to `.bottom-nav`.)
* **Remaining orange accents removed:** the Family hero crest, the Bank hero wash and the
  restaurant "for sale" pill are blush now; the primary buttons on Family
  (Find a partner), Creator (Create my channel) and Restaurant (Buy for R 75 000) are the
  same blush pink as Jobs → Apply — they had been charcoal and were missed by the earlier
  sweep, because they are styled per-page rather than through `.primary-button`.
* The Home qualification card is a 20 px card rather than a capsule.

Verified: active nav radius 0 px, no dark CTA buttons left on any page, no orange
backgrounds except the debit card's own metallic sheen; 12 pages × 5 passes — 0 px
overflow, 0 console errors.

# Round 28 — Mansion Explorer

The mansions page is unchanged in its listing, buying and leasing. Each mansion card now
carries an **Explore this mansion →** button that opens that address on its own sheet:

* **Hero cover** — the mansion's own photo, with the address, price, prestige and status.
* **Real-estate facts** — bedrooms, bathrooms, garages, erf size (m²), under-roof area (m²)
  and staff, all derived from the price/prestige and editable.
* **The property** — a written note, security, levies & rates and parking.
* **Gallery** — your own photos, any number, each with an optional cover choice.
* **Room by room** — eight slots out of the box (arrival & façade, entrance hall, living
  room, kitchen, master suite, garden & pool, garage, staff quarters), each with its own
  photo, name and one-line note; add or delete slots freely.
* **Lightbox** — tap any photo for a full-screen view with arrows and a counter.

Everything is per mansion (its own record in `nuLimitsMansionTour_v1`), so photos and slots
on Palm Ridge Villa never appear on another address.

**Creator Edit Mode** turns on the editing layer inside the explorer: Change cover,
Add photo (auto-resized to 1600 px), Cover / Remove per photo, Upload / Rename / Delete per
slot, Add slot, Edit notes, and tap any stat to correct the number. With Edit Mode off the
page is read-only apart from opening photos.

Verified: 3 mansion cards → Explore opens the right record, stats 6 / slots 8, photo upload
writes through to localStorage (1 photo, cover set) and survives a reload, records stay
separate per mansion, lightbox opens and closes, and the 12-page × 5-pass sweep is still
0 px overflow / 0 console errors.

# Round 29 — explorer tiles de-capsuled (fix)

The bedroom / bathroom / garage / size cards (and the Add photo and gallery tiles) were
being rounded again by the global `button { border-radius: 999px }` rule in the blush theme.
The radius is now locked inside `mansion.css` itself at the higher specificity:

```
.mt .mt-stat, .mt .mt-section, .mt .mt-room, .mt .mt-editor-bar { border-radius: 16px !important; }
.mt .mt-add, .mt .mt-shot-img { border-radius: 14px !important; }
```

so it holds whichever theme is active — blush, light or dark — not just when `data-theme`
is `blush`. Round controls inside the sheet (photo tools, cover pill) stay pills on purpose.

Verified: `.mt-stat` 16px, `.mt-room` 16px, `.mt-section` 16px, `.mt-add` / `.mt-shot-img`
14px in blush, light and dark, with and without Creator Edit Mode. No console errors.

# Round 30 — explorer fact cards are blush pink

The six detail cards (bedrooms · bathrooms · garages · erf size · under roof · staff) now
carry the house blush instead of white paper:

```
background: linear-gradient(148deg, #F9E2DE 0%, #EFCEC7 100%);
border: 1px solid rgba(206,143,136,.55);
box-shadow: 0 10px 22px rgba(206,143,136,.26);
label #97655E · number #2A2120
```

Dark mode keeps the same cards tuned to the night palette (translucent rose on charcoal,
numbers in cream) so nothing turns unreadable. In Creator Edit Mode the tap-to-edit cards
keep their dashed rose outline.

Verified: blush gradient computed on `.mt-stat`, radius still 16px, ink #2A2120; dark theme
falls back to rgba rose on charcoal with #F6E7E3 numbers. No console errors.

# Round 31 — Explore opens a page, and a nicer button

The explorer is no longer a pop-up sheet. **Explore this mansion** now routes to its own
page in the app (`navigateTo("mansion")`), the same way University Road and Jobs work:

* real page in `#dynamic-page` with the standard **Back** bar at the top, the bottom nav
  still under it, and a **← Back to mansions** button at the end of the page
* the back stack still knows you came from Mansions, so Back returns there
* deep-link `#mansion` still boots the page
* page scrolls with the app — no overlay, no dimmed background, no body scroll lock
  (the photo lightbox stays full-screen, because that is a photo viewer)
* class renamed to `.mt-page` so it can never collide with the properties page's `.mn-page`

The button itself was redesigned: a soft blush gradient card-button with a house glyph in a
frosted chip, a small "VIRTUAL VIEWING" kicker over **Explore this mansion**, and a dark
circular arrow — same 16px card language as the tiles on that page.

Verified: 3 Explore buttons → page opens with hero, 6 pink facts, property, gallery, 8 room
slots; Back bar and Back to mansions both return to the mansions list; Edit Mode gives
cover + add photo + 8 slot uploads, upload writes through and persists; 0 px overflow and
0 console errors across 12 pages × 5 theme/width passes.

# Round 32 — tap a mansion, it opens the residence page

**The Explore button is gone.** The mansion card itself is now the door: tapping anywhere on
a mansion card that is not a button (photo, name, price, facts) opens that residence's page.
Buy / Lease / Sell / Edit details still work exactly as before.

**The interior now matches the reference layout:**

* full-bleed hero photo, with a circular share and a heart (save) button floating top-right
* a dark residence stage under it: ★ rating pill + "Villa" pill, the name, a location pin
  with the suburb, the price (with the monthly lease beside it), three spec pills —
  **4 Beds · 6 Baths · 955 m²** — and a full-width **Schedule Visit →** button that books a
  private viewing on the next game day and shows the day once booked
* then the blush fact cards, The property, the gallery and the room-by-room slots, all still
  editable with Creator Edit Mode, and ← Back to mansions at the end

**Start engine is gone everywhere**, including Creator Edit Mode: the engine row (with its
"Upload sound" control) was removed from every car and bike card, so no vehicle — owned,
leased or edited — shows an ignition or sound control anymore.

Verified: 0 Explore buttons, 3 explorable mansion cards; tapping the card opens the stage
page (name, price, 4 Beds / 6 Baths / m², Schedule Visit); Buy still opens the card chooser
instead of the page; Schedule Visit books "Day 2" and the heart saves to the record; engine
rows 0 and no "start engine" text on Cars, Motorbikes and My collection in Edit Mode;
0 px overflow and 0 console errors across the 12-page × 5 pass sweep.

# Round 33 — Creator Edit Mode edits everything

A new layer, `creator-anything.js` + `creator-anything.css`, turns edit mode into a
whole-app editor. It only exists while Creator Edit Mode is on.

* **Tap any word, heading, label, price, caption, badge or button** → a small dark bubble
  gives you **Edit text** (type anything, or clear it to go back), **Hide** and **Restore**.
* **Tap any photo or art block** → **Swap image**: paste an image URL or upload a file
  (resized to 1400 px), and the same picture spot changes everywhere it is saved.
* **Long-press (450 ms)** anything that is a working control — Buy, Lease, tabs, chips,
  nav — and the same bubble opens on it, so nothing is impossible to reach.
* **Hide** removes a block, card, row, section, button or photo from that page; the normal
  controls still work afterwards.
* **Restore** puts the current page back exactly as it shipped (with a confirm).
* The floating **Anything** pill opens a panel with **+ Add block** (your own text or picture
  block appended to the page), **Reset page**, and a live count of your edits.
* Everything you change is stored per page in `nuLimitsAnything_v1` and re-applied after
  reloads and after the game re-renders a page. Works on Home, Properties, Mansions, Shop,
  Investments, Business, Garage, Bank, Family, University and Jobs.

Verified with edit mode on across all 12 pages: bar present, 0 px overflow, 0 console
errors; text edit persists through a reload; hide records to the save; custom block renders;
working controls (bottom nav, Buy) still function and long-press opens the bubble on them.

# Round 34 — delete any block, not just its text

The edit bubble is now delete-first. Tap anything and the top row offers to **remove the
thing itself**, at every size, each chip labelled by what it will take out:

* **✕ This line** — just the text / value you tapped
* **✕ Section** — the whole block around it (e.g. *The property* card with notes,
  security, levies and parking)
* **✕ Bigger block** — the next container up (the fact cards row, the stage, the list)
* **✕ Card / Tile / Row / Hero / This button / This picture** — named when the class says so

Below the chips sit **Edit text**, **Swap image** (when the thing has a picture) and
**Undo my changes here**. Long-press still opens the same bubble on working buttons.

Deletions are stored per page in `nuLimitsAnything_v1` and re-applied on every render and
after reload, and they stay hidden with edit mode off — so a removed section really is gone
from the page, not just hidden while you are editing.

Verified on the mansion page: tapping the property paragraph shows
`This line · Section · Bigger block · Section`; choosing Section removes the card
(`display:none`), the removal survives a reload and a page re-open, and it still holds with
Creator Edit Mode turned off (bar gone, section still hidden). 0 console errors.

# Round 35 — reverted the Anything editor and the mansion interior page

Both of the last two experiments are out, as asked:

* **the "tap anything" editor is gone** — `creator-anything.js` / `.css` deleted and removed
  from `index.html`, so Creator Edit Mode is back to exactly what it was in round 32: no
  floating *Anything* pill, no tap bubble, no delete chips.
* **opening a mansion is gone** — `mansion.js` / `.css` deleted, the card's `is-explorable`
  class removed, so tapping a mansion card does nothing again; the Mansions page is just the
  listing it has always been (buy, lease, sell, edit details, photos).

Nothing else was touched: mansions, cars, bikes, jets, yachts, islands, collection, garage,
bank, family, business, shop, investments, university, jobs and the blush theme are all as
they were in round 32.

Verified: no Anything bar and no leftover stylesheet with edit mode on, 3 mansion cards with
0 explorable classes, tapping a card keeps you on the list, Buy still opens the card chooser,
and the 12-page × 5 pass sweep is still 0 px overflow / 0 console errors.

# Round 36 — edit badges: delete, replace and add on everything

Creation Edit Mode now puts real controls **on top of** the page instead of hiding them in a
tap menu. A floating layer sits above the content, so the game's own buttons still work:

* **⇄ on every photo** — every image, cover and art block (mansion cards, car photos,
  creator niches, shop photos, bank card art) gets a replace button: paste a URL or upload a
  file, resized to 1400 px.
* **✕ on every photo, card, row, tile, slot and panel** — removes that block from the page
  (home tiles, asset cards, creator niches, dishes, upgrade rows, transaction rows, …).
* **＋ on every section** — add your own text or photo block right under that section.
* **↺ Undo page** in the small floating toolbar restores everything on the current page and
  shows how many edits the page carries.

Changes are stored per page in `nuLimitsEditTargets_v1`, re-applied after reloads and after
the game re-renders a page, and they hold with edit mode off.

Verified with edit mode on across Home, Properties, Mansions, Business, Creator, Restaurant,
Shop, Investments, Empire Hub, University, Jobs, Garage, Bank and Family: badges appear on
every page (2–14 per viewport), deleting a home tile removes it and stays removed after a
reload, a photo swap stores to the save, an added text block renders, 0 px overflow and
0 console errors everywhere.

# Round 37 — four new businesses, real trading, back buttons everywhere

**Businesses page** — the heading is now simply **Businesses** (was "My businesses") and the
list is at the top of the page: YouTube Creator Studio, Restaurant, NU Roast Coffee,
NU Limits Logistics, Level Up Games, NU Motors.

**The Copper Pot is now "Restaurant"** everywhere — the business list, the restaurant's own
page, the Sagittarius replies and the bank repossession line. The old name migrates on load.

**Four new ventures** (`ventures.js`), all built the same way:

| Business | Buy-in | Unit | Daily rent |
|---|---|---|---|
| NU Roast Coffee — specialty coffee house | R 480 000 | cups | R 2 400 |
| NU Limits Logistics — courier depot | R 1 250 000 | parcels | R 5 200 |
| Level Up Games — console & game store | R 640 000 | sales | R 3 100 |
| NU Motors — car dealership | R 2 400 000 | cars | R 8 600 |

* **You must buy a business before it trades** — a buy page shows price, rent, wage and your
  balance, and the CTA is the purchase. No trading until the capital clears.
* **Real trading loop on the game clock** (1 day = 15 s): stock, staff, price, marketing and
  reputation feed a demand curve, so the four bars (Stock · Staffing · Reputation · Today vs
  target) move for a reason and track correctly.
* **Randomness** — every day varies ±22–42% and there is a 40% chance of an event: office
  block opening, espresso machine failure, bean price spike, load-shedding, console launch
  week, title delay, repo auction, corporate fleet order, fuel hikes, and more. Each event
  leaves a note on the day's trading panel.
* **Five upgrades per business, 5 levels each** with their own progress tracks and rising
  costs, plus **Auto-restock** (standing supplier order) so a busy store does not silently
  run dry, **Restock**, **Hire**, **Run a campaign**, **Change price** and **Bank the takings**.
* The till pays its own bills first; the owner only covers the shortfall.

**Back on every page** — the universal back bar now attaches to every dynamic page (Home,
Businesses, Properties, Shop, Investments, Empire Hub, University, Jobs, Garage, Bank,
Family, Creator, Restaurant and the ventures), and the footer buttons on those pages call
the back stack instead of dumping you on the homepage. The venture pages' footer reads
"← Back to businesses".

Verified: 6 businesses listed, buying works and no trading happens before purchase, four
ventures trade day after day with different revenue each day (coffee R 13 083 → logistics
R 42 169 → games R 109 452), auto-restock refills the stock bar, back bar present on all
13 pages, 0 px overflow and 0 console errors across the 5-pass sweep.

# Round 38 — Edit Mode inside the businesses, and Light back as default

**Light theme is the default again** (`theme.js`). New installs start on Light, and an
existing save that was still sitting on the old blush default is moved to Light once — after
that, choosing Blush (or Dark, or Auto) in Settings sticks.

**Creator Edit Mode now edits each venture itself.** With edit mode on, every business page
opens with an *Edit Mode* panel (dashed rose card) where each value is a button:

* **Business name** — renames the venture on its page and in the Businesses list
* **Cover photo** — paste a URL or upload a file
* **Purchase price**, **Unit price**, **Base price**, **Daily rent**, **Staff wage**
* **Money in the till**, **Stock**, **Staff on shift**, **Reputation** (0–100)
* **Upgrade levels** — a − / + stepper per upgrade, 0 to 5, straight to the level you want
* **Add R 50 000 to the till** and **Reset this business**

Edits feed the simulation: a cheaper wage cuts your daily costs, a higher base price changes
what demand expects, more staff or stock lifts the bars, and upgrade levels change margins
and capacity — the numbers all recalculate on the page.

Verified: name → "Pixel Palace" shows on the page and in the Businesses list and survives a
reload; till edited to R 250 000 shows in the hero; upgrade stepper set to 3/5 renders 3/5
and stores; theme boots Light, Blush still selectable; 0 px overflow and 0 console errors on
the 5-pass sweep.

# Round 39 — real logistics depot, and the business pages follow the theme

**Logistics is now a fleet operation** (`logistics.js` + `.css`):

* **Five trucks to buy**, each with its own price, payload, fuel burn and daily maintenance:
  Isuzu FTR 8-ton (R 420 000 · 26 L/100 km), Freightliner Cascadia (R 1 250 000 · 32),
  Volvo FH16 34-ton (R 2 100 000 · 38), Scania R500 Reefer (R 2 650 000 · 41) and
  MAN TGS 40-ton (R 2 400 000 · 44). Buy as many as you like.
* **Drivers you hire** with a skill rating and a daily wage; a driver can only be on one
  load at a time, same as a truck.
* **Eleven destinations**, each with a real distance from the Johannesburg depot — Pretoria
  58 km, Maputo 550, Durban 570, Harare 1 100, Cape Town 1 400, Windhoek 1 500, Lusaka 1 600,
  Nairobi 3 800 km.
* **Fuel scales with distance:** cost = distance ÷ 100 × the truck's L/100 km × the diesel
  price, so Nairobi in a 44 L/100 km MAN costs ~R 38 000 of diesel while Pretoria in the
  Isuzu costs ~R 340. The live quote shows distance, fuel, maintenance, freight revenue and
  expected profit before you dispatch.
* **Shipments move Packed → Shipped → In Transit → Delivered** one stage per game day and
  only **pay out on delivery**, then the truck and driver are freed up again.
* Live bars for fleet utilisation, drivers available and the diesel price; Edit Mode inside
  the page can change the business name, cover, diesel price, till, reputation and buy-in.

**Every business page follows the theme now.** Light is the default look, so the Businesses
list and the venture pages no longer keep their old blush-cream surfaces — cards are white on
the light page, still cream in Blush and dark in Dark; only the dark theme overrides surfaces.

Verified: buying the depot and two trucks, hiring two drivers, dispatching a load (Packed),
one game day later it reads In Transit with 3 pipeline steps filled; short vs long hauls show
correctly scaled fuel (R 339 · 58 km vs R 8 190 · 1 400 km); new truck art generated; 0 px
overflow and 0 console errors on the 5-pass sweep.

# Round 41 — NU Roast Coffee rebuilt to the coffee-app layout, plus deliveries

The coffee business now opens on the same screen as the example app: a greeting and
**"What would you like to drink today?"**, a rounded search pill, a **Flat 20% Off** promo
banner with a veil, a horizontally scrolling **Popular now** rail, a points strip with a
Redeem button, category tiles and a menu of item cards.

**The store**
* 16 items with real coffee photography — six hot coffees, three iced, two frappes,
  four desserts and two "More" drinks; every picture can be swapped from Edit Mode.
* Each row shows its own price, the old price struck through with a green **−%** badge
  when it is discounted, and an **In stock / Out of stock** chip; sold-out rows grey out
  and cannot be ordered.
* **All** tile plus Hot coffee, Iced coffee, Frappe, Desserts and More; Edit Mode adds a
  category slot, deletes one, or renames it. Search filters across every category.
* "Order now" applies the 20% promo to the whole menu (press again to remove it) — the
  prices on screen drop by a fifth, and sales pay out at the promo price.
* + on any row rings up a sale into the till; points accrue and 120 points redeems a
  free coffee.
* Popular rail artwork carries its discount badge, or a "Sold out" flag.

**Delivery page** — 9 Los Angeles / California destinations with real distances and a
price that scales with them: Hollywood 8 km · Downtown LA 5 km · Beverly Hills 11 km ·
Santa Monica 19 km · Venice Beach 22 km · Pasadena 17 km · Long Beach 34 km · Anaheim 43 km ·
Huntington Beach 52 km (R 558, 114 min ETA). Pick a driver, dispatch, and the order card
shows the route, the fare, the ETA and a **scooter strip that creeps along the line** as the
progress bar fills through Confirmed → Preparing → On the way → Delivered. Each game day
adds 36–52%, so a run completes in 2–3 days and the fare lands in the till. Delivered runs
drop into a "Delivered today" list; the page also tracks deliveries completed and on-time rate.

**Staff** — hire baristas at R 2 800 each, fire them, and edit the daily wage; the payroll
rolls straight into the daily costs.

**Books** — revenue against every deduction, itemised: rent, **electricity (lights)**,
**water**, **wages** and **VAT at 15%**, with net profit for the day, a cost-ratio bar and
the stock room (beans & milk) with a Restock button.

**Reviews** — the shop is rated 4.3 from seeded English-name reviews (Michael Johnson,
Sarah Williams, David Brown, Emily Davis); Edit Mode adds or deletes a review and edits
the star rating.

**Upgrades** — five shop-wide upgrades (espresso machine, pastry case, app ordering,
seating, roastery) bought with cash, each with a level and a price, and each pushing the
daily take up.

**Creator Edit Mode reaches all of it** — the business name, cover photo, till, reputation
and buy-in; the promo banner; each item's name, description, photo, price, discount and
stock state; categories; staff; every expense line; reviews; upgrades. Every badge is a
visible ✕ / ⇄ / ＋, with per-page undo, and the page re-renders the moment Edit Mode is
switched on.

Verified: bought the shop (R 480 000), sold a cappuccino for R 45 into the till, searched
"crois" and got the croissant from across the categories, Desserts tile shows 4 items, the
20% promo took R 45 → R 36, hired a second barista, changed electricity R 620 → R 740, added
a fifth-star review from "Nathan Brooks", dispatched Huntington Beach (52 km, R 558,
114 min) and watched 37% → 86% → Delivered with the fare paid, plus an added item and a
discount edit in Edit Mode. 0 px overflow, 0 console errors, dark theme checked.

# Round 42 — the Base44 "NU Limits Store" ported into the game's Shop page

The storefront from the Base44 project (`github.com/ToxicAzSerpent/nu-limits-shop`) now
runs inside NU Limits as a native page — no iframe, no server, no Base44 SDK.

**What was ported**
* The hero: outlined wordmark behind a pill-arched featured piece, a magenta scanline, the
  frosted "New release" card with Discover and a featured thumbnail.
* The inventory panel: store name, piece count, description, Discover, a 2×2 slot grid with
  a dot/arrow pager (4 slots per page, 6 pieces seeded).
* Collection view with category chips (All · Outerwear · Tops · Bottoms · Footwear ·
  Accessories) built from the live catalogue.
* Product view: category kicker, name, price, description, size pills, quantity stepper,
  Add to bag, stock line.
* Bag drawer with line quantities, remove, subtotal and Checkout.
* Checkout: name, email, phone, address, notes, live order summary, wallet balance and
  Place order — then an "Order placed" receipt with the NU- reference.
* Manage store (Edit Mode only): store name, currency, hero kicker/caption/panel copy,
  four backgrounds (Noir · Aurora · Grid · Ember) and a full inventory list with
  add / edit / feature / delete.
* Orders view, kept from the original Base44 record shape (order number, lines, total,
  status, game day).

**How it links to the game**
* Lives inside the existing Shop page as the **NU LIMITS Store** card above the luxury
  houses — Back returns to the store list, never the homepage.
* Checkout debits `window.nuLimitsMoney` once, with a "NU Limits store — n lines · NU-XXXXX"
  transaction, so the HUD, bank and transaction log all agree; insufficient funds blocks the
  order and says how short you are; Free Play spends nothing.
* Bought pieces lock to **Owned** (the game's own flag, same one the wardrobe reads), stock
  decrements and the piece stays in the collection.
* Save is `nuLimitsShopApp_v1`, normalised on load — cart, orders, owned flags and settings
  survive a reload; older saves get the seed catalogue without losing anything.
* Edit Mode drives the whole store: photo swap badges on hero and slots, edit/delete per
  piece, the Manage store sheet, and the page re-renders the moment Edit Mode is toggled.
* Theme aware: the dark storefront is the store's own surface, blush re-tints the accents,
  light keeps the same shelf — nothing breaks the game's light default.

**Rebuild notes** — React/framer-motion/lucide/Tailwind and the Base44 entities were replaced
with plain modules: `shopapp.js` (~1000 lines) + `shopapp.css`, seeded from the entity
schemas (ShopItem, ShopSettings, ShopOrder). Six pieces of streetwear art were generated for
`images/shopapp/` so the store is not empty and works offline.

Verified: store card → hero renders with the featured jacket, collection shows 6 cards and
filters to 1 for Footwear, product opens with 4 sizes, quantity 2 → bag shows R 5 780,
checkout with name/email places `NU-VS0QL` for R 5 780 and the wallet moves 9 100 000 →
9 094 220, the jacket flips to Owned with stock 8 → 6, Edit Mode shows the add-slot and 10
badges, a new piece "Signal Knit Balaclava" R 640 saves (6 → 7), Manage store renamed the
shop to "NU LIMITS ATELIER" and switched the background to Aurora. 0 px overflow, 0 console
errors across light, dark and blush, 5-pass sweep clean.

# Round 43 — the storefront now owns the whole screen, and its theme runs the game

**Full page.** Opening the NU Limits Store drops the game chrome entirely: no topbar, no
bottom nav, no page frame — the store fills the viewport and scrolls as one page. On a phone
it is the hero, the "New release" card, then the inventory panel stacked; from 820 px it
splits into the hero and the frosted inventory panel side by side, capped at 1400 px. The
store's own bar stays pinned at the top with a round ← back to the stores list, plus Bag and
Orders. Leaving restores the game exactly as it was.

**Noir theme (new, Settings → Appearance).** The store's palette is now a whole-game theme:
void `#0e0e13` surfaces, the 72 px grid, a frosted-glass card stack, magenta `#d550e5`
accents and indigo bloom. Added to `theme.js` as a fifth mode (light · dark · blush · noir ·
auto), remembered between sessions, with `theme-noir.css` loaded last so it wins cleanly.
It restyles: the shell and topbar, home headings (the gradient line), the qualification
badge, the date strip, the debit/credit cards (magenta bloom instead of champagne), the
bottom nav and its active indicator, the theme picker, and the module surfaces and sheets
across businesses, bank, creator, restaurant, family, jobs, university, garage, properties,
transactions, coffee and games. Feedback colours went to mint and rose so they read on black.

Verified in noir: 12 pages at 390 px and 360 px, 0 px overflow everywhere, 0 console errors;
the theme survives a reload; the picker shows five modes. Store checkout still debits once
(`NU-WBEEO` R 2 890, wallet 9 100 000 → 9 097 110), ← returns to the stores list with the
topbar and nav back. The 5-pass light/dark/blush sweep is still clean.

# Round 44 — Edit Mode works again, and it edits the NU Limits Store

**The old black-and-white switch is gone.** Creator Edit Mode is now a blush pill in
Settings — "Edit Mode" / "Editing" — and it responds immediately. The store also carries its
own **Edit** button in its top bar, so you can turn editing on without leaving the shop.

**Why it felt broken:** the store was rendering its edit badges inside a clickable tile, so
the browser nested the ✕/⇄ buttons inside the product button and threw them away — the slots
showed no controls at all. The tiles are plain blocks now, with three working badges each:

* **✎ Edit** — name, price, stock, category, sizes, description, featured
* **⇄ Photo** — opens your phone gallery / camera roll and drops the picture straight in
* **✕ Delete** — asks once, then removes the slot

**Add a slot:** the dashed "Add piece" tile opens the same sheet, empty. Name it, price it,
tap **Choose from gallery**, pick a photo from your phone and Save — it appears in the grid
instantly. **Delete a slot:** the trash in the sheet footer, or the ✕ badge on the tile.

**Gallery, not URLs.** The image-URL prompt is gone. Every photo control now opens the native
file picker (on a phone that is Photos/Camera Roll), crops it to the store's 4:3 frame at
720 px and stores it with the save, so it survives a refresh.

**Cleaner edit chrome.** The floating ✕/⇄ badges and the black "Undo page" bar no longer pile
on top of the store — the store runs its own badges, and its edit strip ends with
**Manage store** for the copy, backgrounds and inventory list. Other pages keep their old
badges and undo exactly as before.

Verified end to end: turned Edit Mode on from Settings, opened the store, renamed a piece to
"Vector Shell Jacket II" and its price to R 3 150 (the tile updated), replaced its photo with
a file from the picker, deleted a slot (6 → 5), added "Gallery Piece" at R 899 with a picked
photo, toggled Edit Mode off from the store's own bar. The edit sheet sits above the
full-page store, 0 px overflow, 0 console errors, and the 5-pass theme sweep is still clean.
