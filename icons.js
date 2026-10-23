/* ==========================================================
   NU LIMITS — MONOCHROME ICON SET (round 15)

   One 24×24 grid, 1.55 stroke, currentColor. Used wherever an
   emoji used to sit so the app reads as one drawing, not a
   fruit machine. Sized by CSS.
   ========================================================== */

(function () {
  "use strict";

  const P = {
    /* ---------------- menu: food ---------------- */
    burger:
      '<path d="M4.2 9.6c0-2.7 3.5-4.8 7.8-4.8s7.8 2.1 7.8 4.8"/>' +
      '<path d="M4.4 12.2h15.2"/>' +
      '<path d="M4.7 14.8h14.6a3.4 3.4 0 0 1-3.4 3.4H8.1a3.4 3.4 0 0 1-3.4-3.4Z"/>',
    pasta:
      '<path d="M3.6 12.6h16.8a8.4 8.4 0 0 1-16.8 0Z"/>' +
      '<path d="M8.6 9.8V5.4M12 10.2V4.6M15.4 9.8V5.4"/>',
    caesar:
      '<path d="M3.6 12.6h16.8a8.4 8.4 0 0 1-16.8 0Z"/>' +
      '<path d="M12 10.8c-2.5 0-3.7-1.6-3.7-3.4 2.2 0 3.7 1.2 3.7 3.4Z"/>' +
      '<path d="M12 10.8c2.5 0 3.7-1.6 3.7-3.4-2.2 0-3.7 1.2-3.7 3.4Z"/>',
    pizza:
      '<path d="M6.3 5.1h11.4c.6 0 1 .6.8 1.2l-5.4 13.4c-.2.6-1 .6-1.2 0L4.1 6.3"/>' +
      '<circle cx="10.6" cy="9.6" r="1"/>' +
      '<circle cx="13.8" cy="12.2" r="1"/>',
    ribs:
      '<path d="M3.4 12a5.6 5.6 0 0 1 5.6-5.6h4.4a5.6 5.6 0 0 1 0 11.2H9A5.6 5.6 0 0 1 3.4 12Z"/>' +
      '<path d="M14.2 9.4h3.4a2.6 2.6 0 0 1 0 5.2h-3.4"/>' +
      '<path d="M6.4 10.6c1.4.4 1.8 1.8 1.2 3.2"/>',
    steak:
      '<path d="M6.6 3.8v6.4a2.8 2.8 0 0 0 5.6 0V3.8"/>' +
      '<path d="M9.4 10.6V20.2"/>' +
      '<path d="M17.6 3.8c1.4 1.2 2 3 2 5.4v11"/>',
    plate_steak:
      '<circle cx="12" cy="12" r="8.2"/>' +
      '<path d="M8.2 12.6c0-2.2 1.7-3.8 4-3.8 2 0 3.4.9 3.9 2.2.4 1.1-.3 2.3-1.6 2.8-1.3.5-2.7.6-4 .2-1.4-.4-2.3-1-2.3-1.4Z"/>',
    curry:
      '<path d="M3.6 12.6h16.8a8.4 8.4 0 0 1-16.8 0Z"/>' +
      '<path d="M8.4 5.6c0 1.2 1 1.4 1 2.6M12 4.6c0 1.4 1 1.6 1 3.1M15.6 5.6c0 1.2 1 1.4 1 2.6"/>',
    linefish:
      '<path d="M20.3 12c-2.6 2.9-6 4.6-9.5 4.6S4.6 15.2 3 12c1.6-3.2 4.3-4.6 7.8-4.6s6.9 1.7 9.5 4.6Z"/>' +
      '<path d="M3 12 1.4 9.2M3 12 1.4 14.8"/>' +
      '<circle cx="16.2" cy="11.2" r=".9"/>',
    fondant:
      '<path d="M4.4 16.4h15.2"/>' +
      '<path d="M6.3 16.4a5.7 5.7 0 0 1 11.4 0"/>' +
      '<path d="M9.6 11.9c.2-1.5 1.4-2.6 2.9-2.9"/>',
    cheesecake:
      '<path d="M4.6 17.8 12 5.4l7.4 12.4"/>' +
      '<path d="M3.4 17.8h17.2"/>' +
      '<path d="M8.3 11.6h7.4"/>',

    /* ---------------- menu: drinks ---------------- */
    wine:
      '<path d="M7.4 3.6h9.2l-.7 6.2a3.9 3.9 0 0 1-7.8 0L7.4 3.6Z"/>' +
      '<path d="M12 13.9v6.5"/>' +
      '<path d="M8.6 20.4h6.8"/>' +
      '<path d="M7.9 6.9h8.2"/>',
    beer:
      '<path d="M5.4 8.2h9.2v11a1.6 1.6 0 0 1-1.6 1.6H7a1.6 1.6 0 0 1-1.6-1.6v-11Z"/>' +
      '<path d="M14.6 10.6h2.8a1.6 1.6 0 0 1 1.6 1.6v3.6a1.6 1.6 0 0 1-1.6 1.6h-2.8"/>' +
      '<path d="M5.4 8.2c0-2 1.4-3.2 3.1-3.2 1.2 0 2 .5 2.6 1.2.6-.7 1.4-1.2 2.6-1.2"/>',
    cocktail:
      '<path d="M4.2 5.2h15.6L12.6 13v6.4"/>' +
      '<path d="M8.6 20.4h8"/>' +
      '<path d="M4.2 5.2 12 12l7.8-6.8"/>',
    coffee:
      '<path d="M4.6 8.6h12v5.2a5 5 0 0 1-5 5H9.6a5 5 0 0 1-5-5V8.6Z"/>' +
      '<path d="M16.6 10h1.6a2.4 2.4 0 0 1 0 4.8h-1.6"/>' +
      '<path d="M3.4 21h14.4"/>',
    soda:
      '<path d="M7.2 7.6h9.6l-1.1 12a1.4 1.4 0 0 1-1.4 1.3H9.7a1.4 1.4 0 0 1-1.4-1.3l-1.1-12Z"/>' +
      '<path d="M7.2 7.6 14.8 2.4"/>' +
      '<path d="M6.6 11.4h10.8"/>',
    shake:
      '<path d="M7.6 8.6h8.8l-.9 11.1a1.4 1.4 0 0 1-1.4 1.3H9.9a1.4 1.4 0 0 1-1.4-1.3L7.6 8.6Z"/>' +
      '<path d="M7.2 8.6a4.8 4.8 0 0 1 9.6 0"/>' +
      '<path d="M13.4 3.4 12 8.6"/>',

    /* ---------------- upgrade: kitchen ---------------- */
    flame:
      '<path d="M12 3.4c2.8 3.4 5.4 5.7 5.4 9a5.4 5.4 0 0 1-10.8 0c0-1.6.7-2.9 1.8-4.2.5 1.3 1.3 2 2.3 2 .9 0 1.5-.7 1.5-1.8 0-1.6-.6-3.1-.2-5Z"/>',
    oven:
      '<rect x="3.6" y="4.6" width="16.8" height="16" rx="2.2"/>' +
      '<path d="M3.6 9.4h16.8"/>' +
      '<circle cx="7.2" cy="7" r=".9"/><circle cx="10.4" cy="7" r=".9"/>' +
      '<rect x="6.6" y="12" width="10.8" height="6" rx="1.2"/>',
    fryer:
      '<path d="M4.6 9.6h14.8l-1.4 9.4a1.6 1.6 0 0 1-1.6 1.4H7.6a1.6 1.6 0 0 1-1.6-1.4L4.6 9.6Z"/>' +
      '<path d="M8.4 9.6 9.8 4.4M13.6 9.6 12.2 4.4"/>' +
      '<path d="M8.2 13.4h7.6"/>',
    knife:
      '<path d="M6.4 3.6v7.2a3 3 0 0 0 6 0V3.6"/>' +
      '<path d="M9.4 10.8V20.4"/>' +
      '<path d="M16.6 3.6c1.6 1.4 2.4 3.4 2.4 6v10.8"/>',
    fridge:
      '<rect x="5.6" y="3.2" width="12.8" height="17.6" rx="2.2"/>' +
      '<path d="M5.6 10.4h12.8"/>' +
      '<path d="M8.4 6.4v2.2M8.4 12.6v2.6"/>',
    fan:
      '<circle cx="12" cy="12" r="2"/>' +
      '<path d="M12 10c0-3.4 1.2-5.6 3.2-5.6 1.7 0 2.8 1.4 2.8 3 0 2.1-2.4 2.8-6 2.6Z"/>' +
      '<path d="M14 12.9c3 1.7 4.3 3.7 3.3 5.4-.9 1.5-2.7 1.8-4.2 1-1.8-1-1.6-3.5-.1-6.4Z"/>' +
      '<path d="M10 13.1c-3 1.6-5.3 1.4-6.1-.2-.8-1.5-.1-3.2 1.6-3.9 1.9-.8 3.9.8 4.5 4.1Z"/>',
    dish:
      '<path d="M12 4.2c2.6 2.8 4.2 5 4.2 7.2a4.2 4.2 0 0 1-8.4 0c0-2.2 1.6-4.4 4.2-7.2Z"/>' +
      '<path d="M4.4 18.2c1.4 0 1.4 1.6 2.8 1.6s1.4-1.6 2.8-1.6 1.4 1.6 2.8 1.6 1.4-1.6 2.8-1.6 1.4 1.6 2.8 1.6"/>',
    cup:
      '<path d="M5.4 8h11v5.4a4.6 4.6 0 0 1-4.6 4.6H10a4.6 4.6 0 0 1-4.6-4.6V8Z"/>' +
      '<path d="M16.4 9.4h1.4a2.2 2.2 0 0 1 0 4.4h-1.4"/>' +
      '<path d="M4 21h13.4"/>',

    /* ---------------- upgrade: dining ---------------- */
    chair:
      '<path d="M7 4.4v14.2M17 4.4v14.2"/>' +
      '<path d="M7 10.6h10"/>' +
      '<path d="M5.6 18.6 7 14.4M18.4 18.6 17 14.4"/>' +
      '<path d="M9.4 4.4c0 2.4 1.2 3.8 2.6 3.8s2.6-1.4 2.6-3.8"/>',
    lamp:
      '<path d="M6.6 13.4 12 4.6l5.4 8.8H6.6Z"/>' +
      '<path d="M12 13.4v6.2"/>' +
      '<path d="M8.8 19.6h6.4"/>' +
      '<path d="M12 2.6v1.4"/>',
    snowflake:
      '<path d="M12 3.6v16.8"/>' +
      '<path d="M4.7 7.8l14.6 8.4M19.3 7.8 4.7 16.2"/>' +
      '<path d="M9.4 5.4 12 8l2.6-2.6M9.4 18.6 12 16l2.6 2.6"/>',
    music:
      '<circle cx="7.4" cy="17.4" r="2.6"/>' +
      '<circle cx="16.8" cy="15.4" r="2.6"/>' +
      '<path d="M10 17.4V7.6l9.4-2v9.8"/>',
    leaf:
      '<path d="M20 4c-8 0-13 3.6-13 9.4a4.8 4.8 0 0 0 4.8 4.8C17.4 18.2 20 12.4 20 4Z"/>' +
      '<path d="M4 20c1.6-4.6 4.6-8 9-10.6"/>',

    /* ---------------- upgrade: tech + delivery + space ---------------- */
    monitor:
      '<rect x="3.4" y="5.2" width="17.2" height="11.6" rx="1.8"/>' +
      '<path d="M9.4 20.4h5.2M12 16.8v3.6"/>' +
      '<path d="M6.6 8.4h5.4"/>',
    box:
      '<path d="M12 3.6 20 8v8l-8 4.4L4 16V8l8-4.4Z"/>' +
      '<path d="M4 8l8 4.4L20 8"/>' +
      '<path d="M12 12.4v8"/>',
    book:
      '<rect x="4.6" y="3.6" width="14.8" height="16.8" rx="2.2"/>' +
      '<path d="M8.4 3.6v16.8"/>' +
      '<path d="M11.4 8.4h5M11.4 12h5M11.4 15.6h3"/>',
    camera:
      '<rect x="3.2" y="7.4" width="12.4" height="9.6" rx="2.2"/>' +
      '<path d="M15.6 11.4l5.2-2.6v7.2l-5.2-2.6"/>' +
      '<circle cx="8" cy="12.2" r="1.6"/>',
    bag:
      '<path d="M4.8 8.6h14.4l-1.2 10.8a1.6 1.6 0 0 1-1.6 1.4H7.6a1.6 1.6 0 0 1-1.6-1.4L4.8 8.6Z"/>' +
      '<path d="M8.8 8.6V7a3.2 3.2 0 0 1 6.4 0v1.6"/>',
    scooter:
      '<circle cx="6" cy="17.6" r="2.8"/>' +
      '<circle cx="18.4" cy="17.6" r="2.8"/>' +
      '<path d="M8.8 17.6h6.6l2-8.4h-2.2"/>' +
      '<path d="M4.6 9.2h5"/>',
    building:
      '<path d="M4 20.4V8.2l8-4 8 4v12.2"/>' +
      '<path d="M2.6 20.4h18.8"/>' +
      '<path d="M9 20.4v-4.8h6v4.8"/>' +
      '<path d="M8.4 10.4h1.6M14 10.4h1.6"/>',

    /* ---------------- fallbacks ---------------- */
    cutlery:
      '<path d="M6.4 3.6v7.2a3 3 0 0 0 6 0V3.6M9.4 10.8V20.4"/>' +
      '<path d="M16.8 3.6c1.6 1.4 2.2 3.4 2.2 6v10.8"/>',
    cake:
      '<path d="M4.4 20.4h15.2"/>' +
      '<path d="M5.6 20.4v-6.2a2 2 0 0 1 2-2h8.8a2 2 0 0 1 2 2v6.2"/>' +
      '<path d="M12 12.2V8.6"/>' +
      '<circle cx="12" cy="6.8" r="1.4"/>',
    glass:
      '<path d="M7.4 4h9.2l-1 9.4a3.7 3.7 0 0 1-7.2 0L7.4 4Z"/>' +
      '<path d="M12 13.4v6.8M8.8 20.2h6.4"/>',
    plate:
      '<circle cx="12" cy="12" r="8.2"/>' +
      '<circle cx="12" cy="12" r="4.6"/>'
  };

  const DISH = {
    burger: "burger", pasta: "pasta", caesar: "caesar", pizza: "pizza",
    ribs: "ribs", steak: "plate_steak", curry: "curry", linefish: "linefish",
    fondant: "fondant", cheesecake: "cheesecake",
    wine: "wine", beer: "beer", cocktail: "cocktail",
    coffee: "coffee", soda: "soda", shake: "shake"
  };

  const UPGRADE = {
    range: "flame", oven: "oven", fryer: "fryer", prep: "knife",
    fridge: "fridge", hood: "fan", dish: "dish", coffee: "cup",
    tables: "chair", decor: "lamp", aircon: "snowflake", sound: "music",
    terrace: "leaf", pos: "monitor", stock: "box", booking: "book",
    cctv: "camera", platform: "bag", bikes: "scooter", packaging: "box",
    space: "building"
  };

  const BY_CAT = {
    Food: "cutlery", Dessert: "cake", Drinks: "glass",
    Kitchen: "flame", Dining: "chair", Tech: "monitor",
    Delivery: "box", Space: "building"
  };

  function svg(name) {
    const body = P[name] || P.plate;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }

  window.nuLimitsIcons = {
    svg,
    dish(id, cat) { return svg(DISH[id] || BY_CAT[cat] || "plate"); },
    upgrade(id, cat) { return svg(UPGRADE[id] || BY_CAT[cat] || "plate"); },
    has: name => !!P[name]
  };
})();
