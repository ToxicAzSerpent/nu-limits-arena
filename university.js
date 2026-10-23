/* ==========================================================
   NU LIMITS — UNIVERSITY ROAD  (round 19)

   Campus, faculties, enrolment, study, assessments, money and
   qualifications — all on the existing game clock and wallet.

     · seven faculties, full-time or part-time
     · attendance and study sessions decide your marks
     · tuition is charged through nuLimitsMoney (one charge each)
     · permanent qualifications, never duplicated
     · Edit Mode can settle attendance and force a module

   Save: nuLimitsUniversity_v1
   ========================================================== */

(function () {
  "use strict";

  const KEY = "nuLimitsUniversity_v1";

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  const money = n => (Number(n) < 0 ? "−R " : "R ") +
    Math.round(Math.abs(Number(n) || 0)).toLocaleString("en-ZA");
  const day = () => (window.nuLimitsWorld ? window.nuLimitsWorld.day : 1);
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const freePlay = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const uid = p => (p || "uv") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const v = JSON.parse(raw);
      return v && typeof v === "object" ? v : fallback;
    } catch (err) { return fallback; }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (err) { return false; }
  }

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
    el.__t = window.setTimeout(() => el.classList.remove("show"), 3400);
  }

  function dateFor(dayNum) {
    const base = (window.nuLimitsWorld && window.nuLimitsWorld.date) || new Date();
    const d = new Date(base.getTime() + (dayNum - day()) * 86400000);
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  }

  /* ---------------------------------------------------------
     Faculties
     --------------------------------------------------------- */
  const COURSES = [
    {
      id: "business", name: "Business Management", faculty: "Faculty of Commerce",
      blurb: "Strategy, operations, people and money — the language of running anything.",
      level: "Degree", modules: 8, days: 240, fee: 96000, reg: 3500,
      entry: "Matric · 60% average", careers: ["Operations manager", "Retail director", "Business consultant"],
      icon: "briefcase"
    },
    {
      id: "finance", name: "Finance & Accounting", faculty: "Faculty of Commerce",
      blurb: "Statements, valuations, audit and the discipline behind every balance sheet.",
      level: "Degree", modules: 8, days: 260, fee: 108000, reg: 3800,
      entry: "Matric · 65% average · maths", careers: ["Financial analyst", "Chartered accountant (articles)", "Portfolio associate"],
      icon: "chart"
    },
    {
      id: "cs", name: "Computer Science & IT", faculty: "Faculty of Science",
      blurb: "Algorithms, systems, data and the software that runs a modern company.",
      level: "Degree", modules: 8, days: 250, fee: 112000, reg: 3800,
      entry: "Matric · 65% · maths 60%", careers: ["Software engineer", "Data analyst", "Platform engineer"],
      icon: "code"
    },
    {
      id: "engineering", name: "Engineering", faculty: "Faculty of Engineering",
      blurb: "Structures, machines and process — the physical side of an empire.",
      level: "Degree", modules: 9, days: 300, fee: 128000, reg: 4200,
      entry: "Matric · 70% · maths & physics", careers: ["Project engineer", "Plant manager", "Consulting engineer"],
      icon: "gear"
    },
    {
      id: "marketing", name: "Marketing", faculty: "Faculty of Arts & Commerce",
      blurb: "Brand, media, consumer behaviour and the craft of being remembered.",
      level: "Diploma", modules: 6, days: 150, fee: 62000, reg: 2500,
      entry: "Matric · 55% average", careers: ["Brand manager", "Media planner", "Content director"],
      icon: "megaphone"
    },
    {
      id: "law", name: "Law", faculty: "Faculty of Law",
      blurb: "Contract, company and commercial law for people who read the fine print.",
      level: "Degree", modules: 9, days: 300, fee: 132000, reg: 4200,
      entry: "Matric · 70% · language 65%", careers: ["Legal advisor", "Candidate attorney", "Compliance officer"],
      icon: "scales"
    },
    {
      id: "logistics", name: "Logistics & Supply Chain", faculty: "Faculty of Commerce",
      blurb: "Freight, warehousing, customs and the quiet margin inside every delivery.",
      level: "Diploma", modules: 6, days: 160, fee: 68000, reg: 2600,
      entry: "Matric · 55% average", careers: ["Supply chain planner", "Warehouse manager", "Freight broker"],
      icon: "truck"
    }
  ];

  const MODES = {
    full: { label: "Full-time", rate: 3.4, note: "Faster — three years in one, but no room for a job.", factor: 1 },
    part: { label: "Part-time", rate: 1.9, note: "Slower, and it leaves your week free to earn.", factor: 1.7 }
  };

  const RETake_FEE = 1400;
  const RETAKE_DAYS = 5;
  const PASS = 50;

  const MODULE_NAMES = {
    business: ["Principles of management", "Business economics", "Organisational behaviour", "Operations",
      "Marketing fundamentals", "Financial literacy", "Strategy", "Capstone project"],
    finance: ["Accounting I", "Accounting II", "Corporate finance", "Taxation", "Audit",
      "Management accounting", "Financial modelling", "Valuation", "Capstone"],
    cs: ["Programming I", "Programming II", "Data structures", "Databases", "Networks",
      "Operating systems", "Software engineering", "Machine learning", "Capstone"],
    engineering: ["Mathematics I", "Mathematics II", "Statics & materials", "Thermodynamics",
      "Electrical systems", "Control", "Manufacturing", "Project management", "Design project"],
    marketing: ["Consumer behaviour", "Brand strategy", "Digital media", "Copy & content",
      "Campaign planning", "Marketing project"],
    law: ["Legal foundations", "Contract law", "Company law", "Commercial transactions",
      "Labour law", "Civil procedure", "Evidence", "Legal practice", "Moot court"],
    logistics: ["Supply chain basics", "Warehousing", "Freight & transport", "Customs",
      "Inventory control", "Logistics project"]
  };

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  function blank() {
    return {
      version: 1,
      enrolment: null,
      qualifications: [],
      history: [],
      lastDay: day(),
      visits: 0
    };
  }

  let state = null;

  function load() {
    if (state) return state;
    const saved = readJSON(KEY, null);
    state = Object.assign(blank(), saved && typeof saved === "object" ? saved : {});
    if (!Array.isArray(state.qualifications)) state.qualifications = [];
    if (!Array.isArray(state.history)) state.history = [];
    if (!state.enrolment) state.enrolment = null;
    return state;
  }

  const persist = () => writeJSON(KEY, state);

  const courseOf = id => COURSES.find(c => c.id === id) || null;

  function event(text, amount, kind) {
    load().history.unshift({
      id: uid("uh"), text, amount: amount || 0, kind: kind || "info",
      day: day(), at: new Date().toISOString()
    });
    state.history = state.history.slice(0, 40);
  }

  /* ---------------------------------------------------------
     Student record helpers
     --------------------------------------------------------- */
  const cur = () => (load().enrolment ? load().enrolment : null);
  const currentModule = () => {
    const e = cur();
    if (!e) return null;
    return e.modules[e.index] || null;
  };

  const attendanceAvg = () => {
    const e = cur();
    if (!e) return 0;
    const done = e.modules.filter(m => m.done);
    if (!done.length) return Math.round(e.attendance);
    return Math.round((e.attendance + done.reduce((t, m) => t + m.attendance, 0) / done.length) / 2);
  };

  const averageMark = () => {
    const e = cur();
    if (!e) return 0;
    const done = e.modules.filter(m => m.done);
    if (!done.length) return 0;
    return Math.round(done.reduce((t, m) => t + m.mark, 0) / done.length);
  };

  const completion = () => {
    const e = cur();
    if (!e) return 0;
    const c = courseOf(e.courseId);
    if (!c) return 0;
    const passed = e.modules.filter(m => m.done).length;
    const part = currentModule() ? (currentModule().progress / 100) : 0;
    return Math.round(((passed + part) / c.modules) * 100);
  };

  const outstanding = () => {
    const e = cur();
    if (!e) return 0;
    return Math.max(0, Math.round(e.balanceOwing));
  };

  const scholarshipOk = () => {
    const e = cur();
    if (!e) return false;
    return e.attendance >= 85 && averageMark() >= 70 && e.modules.some(m => m.done);
  };

  const discount = () => (scholarshipOk() ? 0.3 : 0);

  const graduationDay = () => {
    const e = cur();
    if (!e) return 0;
    const c = courseOf(e.courseId);
    const left = e.modules.filter(m => !m.done).length;
    if (!left) return day();
    const perModule = (c.days / c.modules) / MODES[e.mode].rate;
    return day() + Math.round(left * perModule * MODES[e.mode].factor);
  };

  /* ---------------------------------------------------------
     Money
     --------------------------------------------------------- */
  function charge(amount, description) {
    const amt = Math.round(Number(amount) || 0);
    if (amt <= 0) return true;
    if (freePlay() || editOn()) return true;      /* r11 — edit mode bypasses money */
    const M = window.nuLimitsMoney;
    if (!M) return false;
    if (window.nuLimitsCanPay && !window.nuLimitsCanPay(amt)) return false;
    return !!M.transact("expense", amt, description);
  }

  /* ---------------------------------------------------------
     Enrolment
     --------------------------------------------------------- */
  function enrol(courseId, mode) {
    const c = courseOf(courseId);
    if (!c) return toast("Unknown course.", true);
    if (cur()) return toast("You are already enrolled — finish or withdraw first.", true);

    const reg = c.reg;
    if (!charge(reg, `University registration · ${c.name}`)) {
      return toast(`Registration is ${money(reg)} — you cannot cover it yet.`, true);
    }

    const names = MODULE_NAMES[c.id] || [];
    const modules = [];
    for (let i = 0; i < c.modules; i++) {
      modules.push({
        name: names[i] || `Module ${i + 1}`,
        progress: 0, mark: 0, done: false,
        attendance: 100, ready: false,
        attempts: 0, retakeOn: 0
      });
    }

    load().enrolment = {
      id: uid("en"),
      courseId: c.id,
      mode: mode === "part" ? "part" : "full",
      startedDay: day(),
      modules,
      index: 0,
      attendance: 96,
      prep: 10,
      balanceOwing: 0,
      lastTick: day(),
      lastStudyDay: 0,
      lastAttendDay: 0,
      paid: 0
    };

    event(`Registered for ${c.name} (${MODES[state.enrolment.mode].label})`, -reg, "fee");
    persist();
    render();
    toast(`Registered — ${money(reg)} paid. Welcome to ${c.faculty}.`);
  }

  function withdraw() {
    const e = cur();
    if (!e) return;
    const c = courseOf(e.courseId);
    if (!window.confirm(`Withdraw from ${c.name}? Fees already paid are not refunded.`)) return;
    event(`Withdrew from ${c.name}`, 0, "withdraw");
    load().enrolment = null;
    persist();
    render();
    toast("Withdrawn. You can enrol again whenever you like.");
  }

  /* ---------------------------------------------------------
     The study day
     --------------------------------------------------------- */
  function tick() {
    load();
    const e = cur();
    if (!e) return;

    const today = day();
    if (e.lastTick >= today) return;

    const gaps = Math.min(6, today - e.lastTick);
    const mod = currentModule();
    const c = courseOf(e.courseId);
    e.lastTick = today;

    /* attendance drifts down when you are not turning up */
    if (e.lastAttendDay < today) e.attendance = clamp(e.attendance - 3 * gaps, 0, 100);
    /* preparation fades */
    e.prep = clamp(e.prep - 3 * gaps, 0, 100);

    if (mod && !mod.done) {
      const rate = MODES[e.mode].rate * (0.55 + 0.45 * (e.attendance / 100)) * gaps;
      mod.progress = clamp(mod.progress + rate, 0, 100);
      if (mod.progress >= 100 && !mod.ready) {
        mod.ready = true;
        mod.attendance = Math.round(e.attendance);
        /* tuition becomes due when the assessment opens */
        const fee = tuitionForModule(c, e);
        e.balanceOwing += fee;
        event(`${mod.name} ready for assessment · ${money(fee)} tuition due`, 0, "due");
      }
    }

    persist();
    if (isPage()) render();
  }

  function tuitionForModule(c, e) {
    const base = Math.round(c.fee / c.modules);
    const withMode = Math.round(base * (e.mode === "part" ? 1.08 : 1));
    return Math.round(withMode * (1 - discount()));
  }

  const payFees = () => {
    const e = cur();
    if (!e) return;
    const due = outstanding();
    if (due <= 0) return toast("Nothing outstanding.", true);
    if (!charge(due, `University tuition · ${courseOf(e.courseId).name}`)) {
      return toast(`Tuition is ${money(due)} — you cannot cover it yet.`, true);
    }
    e.paid += due;
    e.balanceOwing = 0;
    event(`Tuition paid · ${money(due)}`, -due, "fee");
    persist(); render();
    toast(`Paid ${money(due)} in tuition.`);
  };

  /* ---------------------------------------------------------
     Actions
     --------------------------------------------------------- */
  const attend = () => {
    const e = cur();
    if (!e) return;
    const today = day();
    if (e.lastAttendDay >= today) return toast("Classes are done for today — come back tomorrow.", true);
    e.lastAttendDay = today;
    e.attendance = clamp(e.attendance + 6, 0, 100);
    e.prep = clamp(e.prep + 4, 0, 100);
    event("Attended today's classes", 0, "attend");
    persist(); render();
    toast("Classes attended — attendance up.");
  };

  const study = () => {
    const e = cur();
    if (!e) return;
    const today = day();
    if (e.lastStudyDay >= today) return toast("One study session a day is enough.", true);
    e.lastStudyDay = today;
    e.prep = clamp(e.prep + 18, 0, 100);
    const mod = currentModule();
    if (mod) mod.progress = clamp(mod.progress + 2.5, 0, 100);
    event("Study session in the library", 0, "study");
    persist(); render();
    toast("Studied — preparation up.");
  };

  const sitExam = () => {
    const e = cur();
    const mod = currentModule();
    if (!e || !mod) return;
    if (!mod.ready) return toast("The assessment is not open yet.", true);
    if (outstanding() > 0) return toast(`Settle ${money(outstanding())} in tuition before sitting.`, true);
    if (mod.retakeOn > day()) return toast(`Retake opens on ${dateFor(mod.retakeOn)}.`, true);

    if (mod.retakeOn && mod.attempts > 0) {
      if (!charge(RETake_FEE, `Exam retake · ${mod.name}`)) {
        return toast(`A retake costs ${money(RETake_FEE)}.`, true);
      }
      mod.retakeOn = 0;
      event(`Retake paid · ${mod.name}`, -RETake_FEE, "fee");
    }

    /* mark: attendance and preparation carry it, exams carry a little luck */
    const att = (mod.attendance != null ? mod.attendance : e.attendance) / 100;
    const prep = e.prep / 100;
    const roll = 0.82 + Math.random() * 0.3;
    const mark = Math.round(clamp((38 + att * 34 + prep * 28) * roll, 0, 100));

    mod.attempts += 1;
    mod.mark = Math.max(mod.mark, mark);

    if (mark >= PASS) {
      mod.done = true;
      mod.ready = false;
      mod.passedOn = day();
      e.index += 1;
      e.prep = clamp(e.prep - 20, 0, 100);
      event(`Passed ${mod.name} · ${mark}%`, 0, "pass");

      if (e.index >= e.modules.length) graduate();
      else toast(`${mod.name} passed with ${mark}%. Next module unlocked.`);
    } else {
      mod.retakeOn = day() + RETAKE_DAYS;
      e.prep = clamp(e.prep - 10, 0, 100);
      event(`Failed ${mod.name} · ${mark}% — retake available ${dateFor(mod.retakeOn)}`, 0, "fail");
      toast(`${mod.name}: ${mark}% — below ${PASS}%. Retake from ${dateFor(mod.retakeOn)}.`, true);
    }

    persist();
    render();
  };

  function graduate() {
    const e = cur();
    if (!e) return;
    const c = courseOf(e.courseId);
    const marks = e.modules.map(m => m.mark);
    const final = Math.round(marks.reduce((a, b) => a + b, 0) / marks.length);

    /* never award the same qualification twice */
    const already = load().qualifications.some(q => q.courseId === c.id);
    if (!already) {
      load().qualifications.unshift({
        id: uid("q"),
        studentId: e.id,
        courseId: c.id,
        name: c.name,
        level: c.level,
        faculty: c.faculty,
        final,
        attendance: attendanceAvg(),
        completedDay: day(),
        careers: c.careers.slice(),
        awardedAt: new Date().toISOString()
      });
    }

    event(`Graduated · ${c.level} in ${c.name} · ${final}% average`, 0, "graduate");
    load().enrolment = null;
    persist();
    render();
    toast(`Graduated — ${c.level} in ${c.name}, ${final}% average.`);
  }

  /* ---------------------------------------------------------
     Marks
     --------------------------------------------------------- */
  const gradeOf = m => (m >= 75 ? "A" : m >= 70 ? "B+" : m >= 65 ? "B" : m >= 60 ? "C+" : m >= 55 ? "C" : m >= 50 ? "D" : "F");

  /* ---------------------------------------------------------
     Icons
     --------------------------------------------------------- */
  const IC = {
    briefcase: '<path d="M3 8.5h18v11H3z"/><path d="M8 8.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5M3 13h18"/>',
    chart: '<path d="M4 20V6M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-7"/>',
    code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v2.4M12 18.1v2.4M4.9 7.9l2 1.2M17.1 14.9l2 1.2M4.9 16.1l2-1.2M17.1 9.1l2-1.2"/>',
    megaphone: '<path d="M4 10v4l12 5V5L4 10Z"/><path d="M16 8.5a3.5 3.5 0 0 1 0 7"/>',
    scales: '<path d="M12 4v16M7 20h10M5 9h14"/><path d="m5 9-2.5 5h5L5 9Zm14 0-2.5 5h5L19 9Z"/>',
    truck: '<path d="M3 7h10v9H3zM13 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
    cap: '<path d="m2.5 9 9.5-4 9.5 4L12 13 2.5 9Z"/><path d="M6.5 11v5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-5"/>'
  };
  const svg = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${IC[n] || IC.cap}</svg>`;

  /* ---------------------------------------------------------
     Page
     --------------------------------------------------------- */
  let tab = "campus";

  const isPage = () => {
    const dp = document.getElementById("dynamic-page");
    return !!(dp && !dp.hidden && dp.querySelector(".uv-page"));
  };

  function statCards() {
    const e = cur();
    const q = load().qualifications;
    if (!e) {
      return `<div class="uv-stats">
        <span><small>COURSES</small><strong>${COURSES.length}</strong></span>
        <span><small>ENROLLED</small><strong>No</strong></span>
        <span><small>QUALIFICATIONS</small><strong>${q.length}</strong></span>
      </div>`;
    }
    return `<div class="uv-stats">
      <span><small>COMPLETE</small><strong>${completion()}%</strong></span>
      <span><small>AVERAGE</small><strong>${averageMark()}%</strong></span>
      <span><small>ATTENDANCE</small><strong>${attendanceAvg()}%</strong></span>
    </div>`;
  }

  function hero() {
    return `<div class="uv-hero">
      <div class="uv-hero-art"></div>
      <div class="uv-hero-fade"></div>
      <div class="uv-hero-body">
        <p class="eyebrow">NU LIMITS / CITY · UNIVERSITY ROAD</p>
        <h1>University Road</h1>
        <p>Seven faculties. Real fees, real classes, and a qualification that stays on your record.</p>
      </div>
    </div>`;
  }

  function tabs() {
    const e = cur();
    const list = [["campus", "Campus"], ["courses", "Courses"]];
    if (e) list.push(["student", "My studies"]);
    list.push(["record", "Qualifications"]);
    return `<div class="uv-tabs">${list.map(([id, label]) =>
      `<button type="button" data-uv="tab" data-tab="${id}" class="${tab === id ? "on" : ""}">${label}</button>`
    ).join("")}</div>`;
  }

  function campusTab() {
    const e = cur();
    return `<div class="uv-body">
      <div class="uv-card">
        <div class="uv-card-head"><h2>Why the road matters</h2><span class="uv-chip">OFFLINE · ON DEVICE</span></div>
        <p class="uv-copy">A qualification is permanent. It opens careers that a hustle cannot buy, and it costs
          real money and real game days — the same ones your businesses are running on.</p>
        <div class="uv-faculties">
          ${COURSES.map(c => `<div class="uv-fac">
            <span class="uv-fac-ico">${svg(c.icon)}</span>
            <div><b>${esc(c.name)}</b><small>${esc(c.faculty)} · ${c.level} · ${c.modules} modules</small></div>
          </div>`).join("")}
        </div>
      </div>

      <div class="uv-card">
        <div class="uv-card-head"><h2>Campus facilities</h2></div>
        <div class="uv-facility-grid">
          <div><b>Library</b><small>Study sessions raise preparation.</small></div>
          <div><b>Lecture halls</b><small>Attendance is taken every game day.</small></div>
          <div><b>Assessment centre</b><small>Tests, projects and final exams.</small></div>
          <div><b>Bursary office</b><small>85% attendance and a 70% average earns 30% off.</small></div>
        </div>
      </div>

      <div class="uv-card">
        <div class="uv-card-head"><h2>Admission</h2></div>
        <ul class="uv-list">
          <li>Registration is charged once and is separate from tuition.</li>
          <li>Tuition falls due per module, when its assessment opens.</li>
          <li>You cannot sit an assessment with tuition outstanding.</li>
          <li>Full-time study moves faster; part-time leaves room to earn.</li>
        </ul>
        ${e ? `<p class="uv-fine">You are enrolled — open <b>My studies</b> to see where you stand.</p>`
            : `<button class="uv-btn is-primary" type="button" data-uv="tab" data-tab="courses">Browse courses</button>`}
      </div>
    </div>`;
  }

  function coursesTab() {
    const e = cur();
    return `<div class="uv-body">
      ${COURSES.map(c => `<div class="uv-course">
        <div class="uv-course-top">
          <span class="uv-fac-ico">${svg(c.icon)}</span>
          <div>
            <b>${esc(c.name)}</b>
            <small>${esc(c.faculty)} · ${c.level}</small>
          </div>
          <span class="uv-price">${money(c.fee)}</span>
        </div>
        <p class="uv-copy">${esc(c.blurb)}</p>
        <div class="uv-facts">
          <span><small>DURATION</small><b>${Math.round(c.days / 30)} months</b></span>
          <span><small>MODULES</small><b>${c.modules}</b></span>
          <span><small>REGISTRATION</small><b>${money(c.reg)}</b></span>
        </div>
        <div class="uv-entry"><b>Entry</b> ${esc(c.entry)}</div>
        <div class="uv-careers">${c.careers.map(x => `<span>${esc(x)}</span>`).join("")}</div>
        ${e
          ? `<p class="uv-fine">${e.courseId === c.id ? "You are enrolled here." : "Finish your current course first."}</p>`
          : `<div class="uv-enrol">
               <button type="button" class="uv-mode" data-uv="enrol" data-course="${c.id}" data-mode="full">
                 Enrol full-time<small>fastest track</small>
               </button>
               <button type="button" class="uv-mode" data-uv="enrol" data-course="${c.id}" data-mode="part">
                 Enrol part-time<small>${Math.round(MODES.part.factor * 100)}% longer</small>
               </button>
             </div>`}
      </div>`).join("")}
    </div>`;
  }

  function studentTab() {
    const e = cur();
    if (!e) return `<div class="uv-body"><div class="uv-card"><p class="uv-copy">Not enrolled.</p></div></div>`;
    const c = courseOf(e.courseId);
    const mod = currentModule();
    const due = outstanding();
    const today = day();
    const studiedToday = e.lastStudyDay >= today;
    const attendedToday = e.lastAttendDay >= today;

    return `<div class="uv-body">
      <div class="uv-card is-focus">
        <div class="uv-card-head">
          <h2>${esc(c.name)}</h2>
          <span class="uv-chip">${MODES[e.mode].label}</span>
        </div>
        <div class="uv-progress">
          <span class="uv-bar"><i style="width:${completion()}%"></i></span>
          <b>${completion()}%</b>
        </div>
        <div class="uv-facts">
          <span><small>MODULE</small><b>${Math.min(e.index + 1, c.modules)} of ${c.modules}</b></span>
          <span><small>AVERAGE</small><b>${averageMark() ? averageMark() + "%" : "—"}</b></span>
          <span><small>ATTENDANCE</small><b>${attendanceAvg()}%</b></span>
        </div>
        <div class="uv-facts">
          <span><small>PREPARATION</small><b>${Math.round(e.prep)}%</b></span>
          <span><small>GRADUATION</small><b>${dateFor(graduationDay())}</b></span>
          <span><small>FEES DUE</small><b class="${due ? "is-warn" : ""}">${due ? money(due) : "None"}</b></span>
        </div>
      </div>

      ${mod ? `<div class="uv-card ${mod.ready ? "is-ready" : ""}">
        <div class="uv-card-head">
          <h2>${esc(mod.name)}</h2>
          <span class="uv-chip ${mod.ready ? "is-on" : ""}">${mod.ready ? "ASSESSMENT OPEN" : "IN PROGRESS"}</span>
        </div>
        <div class="uv-progress">
          <span class="uv-bar"><i style="width:${Math.round(mod.progress)}%"></i></span>
          <b>${Math.round(mod.progress)}%</b>
        </div>
        <p class="uv-fine">${mod.ready
          ? due > 0
            ? `Settle ${money(due)} in tuition to sit this assessment.`
            : mod.retakeOn > today
              ? `Retake available on ${dateFor(mod.retakeOn)}.`
              : "Attendance and preparation set the mark. Sit when you are ready."
          : "Attend classes and study to move this module forward."}</p>
        <div class="uv-actions">
          <button class="uv-btn" type="button" data-uv="attend" ${attendedToday ? "disabled" : ""}>Attend today</button>
          <button class="uv-btn" type="button" data-uv="study" ${studiedToday ? "disabled" : ""}>Study session</button>
          ${mod.ready ? `<button class="uv-btn is-primary" type="button" data-uv="exam" ${(due > 0 || mod.retakeOn > today) ? "disabled" : ""}>
            ${mod.attempts ? `Retake · ${money(RETake_FEE)}` : "Sit the assessment"}</button>` : ""}
          ${due > 0 ? `<button class="uv-btn is-warn" type="button" data-uv="pay">Pay ${money(due)} tuition</button>` : ""}
        </div>
      </div>` : ""}

      <div class="uv-card">
        <div class="uv-card-head"><h2>Module record</h2><span class="uv-chip">${e.modules.filter(m => m.done).length} PASSED</span></div>
        <div class="uv-modules">
          ${e.modules.map((m, i) => `<div class="uv-mod ${m.done ? "is-done" : i === e.index ? "is-now" : ""}">
            <span class="uv-mod-n">${i + 1}</span>
            <div><b>${esc(m.name)}</b><small>${m.done ? `${m.mark}% · ${gradeOf(m.mark)} · attendance ${m.attendance}%` : i === e.index ? "current module" : "locked"}</small></div>
            <span class="uv-mod-state">${m.done ? "PASS" : i === e.index ? `${Math.round(m.progress)}%` : "—"}</span>
          </div>`).join("")}
        </div>
        <button class="uv-link" type="button" data-uv="withdraw">Withdraw from the course</button>
      </div>

      ${editOn() ? `<div class="uv-card is-edit">
        <div class="uv-card-head"><h2>Edit Mode</h2><span class="uv-chip">CREATOR</span></div>
        <div class="uv-actions">
          <button class="uv-btn" type="button" data-uv="e-att">Set attendance 100%</button>
          <button class="uv-btn" type="button" data-uv="e-prep">Set preparation 100%</button>
          <button class="uv-btn is-primary" type="button" data-uv="e-finish">Finish this module</button>
          <button class="uv-btn is-warn" type="button" data-uv="e-reset">Reset university</button>
        </div>
      </div>` : ""}
    </div>`;
  }

  function recordTab() {
    const q = load().qualifications;
    return `<div class="uv-body">
      <div class="uv-card">
        <div class="uv-card-head"><h2>Qualifications</h2><span class="uv-chip">${q.length} HELD</span></div>
        ${q.length ? q.map(x => `<div class="uv-cert">
          <span class="uv-cert-seal">${svg("cap")}</span>
          <div>
            <b>${esc(x.level)} in ${esc(x.name)}</b>
            <small>${esc(x.faculty)} · awarded ${dateFor(x.completedDay)} · ${x.final}% average · ${gradeOf(x.final)}</small>
            <div class="uv-careers">${(x.careers || []).map(cr => `<span>${esc(cr)}</span>`).join("")}</div>
          </div>
        </div>`).join("")
        : `<p class="uv-copy">No qualifications yet. Enrol, pass every module and this page becomes your record.</p>`}
      </div>

      <div class="uv-card">
        <div class="uv-card-head"><h2>Activity</h2></div>
        ${load().history.length
          ? `<div class="uv-log">${load().history.slice(0, 12).map(h => `<div class="uv-log-row">
              <span class="${h.amount < 0 ? "is-neg" : ""}">${esc(h.text)}</span>
              <small>${dateFor(h.day)}</small>
            </div>`).join("")}</div>`
          : `<p class="uv-fine">Nothing yet.</p>`}
      </div>
    </div>`;
  }

  function pageHTML() {
    const body = tab === "courses" ? coursesTab()
      : tab === "student" ? studentTab()
        : tab === "record" ? recordTab()
          : campusTab();

    return `<section class="dynamic-page-content uv-page">
      ${hero()}
      ${statCards()}
      ${tabs()}
      ${body}
      <button class="secondary-button" type="button" data-go-home style="margin-top:22px">← Back to Home</button>
    </section>`;
  }

  function render() {
    const dp = document.getElementById("dynamic-page");
    if (!dp) return;
    dp.innerHTML = pageHTML();
    ensureBackBar(dp);
  }

  /* round 24 — the bar is injected by back-nav.js; keep it above our markup */
  function ensureBackBar(dp) {
    if (!dp) return;
    if (dp.querySelector(":scope > .nl-backbar")) return;
    const bar = document.createElement("div");
    bar.className = "nl-backbar";
    bar.innerHTML = `<button class="nl-back" type="button" aria-label="Go back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m14 6-6 6 6 6"/>
      </svg>
      <span>Back</span>
    </button>`;
    bar.querySelector("button").addEventListener("click", () => {
      if (window.nuLimitsBack) window.nuLimitsBack();
      else window.navigateTo("home");
    });
    dp.insertBefore(bar, dp.firstChild);
  }

  /* ---------------------------------------------------------
     Wiring
     --------------------------------------------------------- */
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-uv]");
    if (!el || !isPage()) return;
    const act = el.dataset.uv;

    if (act === "tab") { tab = el.dataset.tab; render(); return; }
    if (act === "enrol") return enrol(el.dataset.course, el.dataset.mode);
    if (act === "attend") return attend();
    if (act === "study") return study();
    if (act === "exam") return sitExam();
    if (act === "pay") return payFees();
    if (act === "withdraw") return withdraw();

    if (act === "e-att" || act === "e-prep" || act === "e-finish" || act === "e-reset") {
      const s = cur();
      if (!s) return;
      if (act === "e-att") s.attendance = 100;
      if (act === "e-prep") s.prep = 100;
      if (act === "e-finish") {
        const m = currentModule();
        if (m) {
          const first = !m.ready;
          m.progress = 100; m.ready = true; m.attendance = Math.round(s.attendance);
          /* same tuition rule as the normal tick — charged once only */
          if (first) {
            const c = courseOf(s.courseId);
            const fee = tuitionForModule(c, s);
            s.balanceOwing += fee;
            event(`${m.name} ready for assessment · ${money(fee)} tuition due`, 0, "due");
          }
        }
      }
      if (act === "e-reset") {
        if (!window.confirm("Reset all university progress on this device?")) return;
        state = Object.assign(blank(), { lastDay: day() });
        persist(); render(); toast("University reset.");
        return;
      }
      persist(); render(); toast("Updated.");
    }
  });

  /* route */
  const prevNavigate = window.navigateTo;
  window.navigateTo = function (page) {
    if (typeof window.nuLimitsNoteNav === "function") window.nuLimitsNoteNav(page);
    if (page !== "university") {
      const active = document.querySelector(".uv-page");
      if (active) {
        /* leave cleanly: hand the shell back to whichever page is next */
        const dp = document.getElementById("dynamic-page");
        if (dp && page !== "university") dp.innerHTML = "";
      }
      return prevNavigate.apply(this, arguments);
    }

    document.querySelectorAll(".nav-item").forEach(b =>
      b.classList.toggle("active", b.dataset.page === page));
    if (typeof window.nuLimitsInvestLeave === "function") window.nuLimitsInvestLeave();

    const main = document.getElementById("main-content");
    const dp = document.getElementById("dynamic-page");
    if (!main || !dp) return;
    main.hidden = true;
    dp.hidden = false;
    load().visits = (load().visits || 0) + 1;
    tick();
    persist();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  };

  /* the clock */
  window.setInterval(tick, 1000);

  /* boot */
  const boot = () => {
    load();
    tick();
    persist();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  /* boot the page if someone deep-links to it */
  if (location.hash === "#university") window.setTimeout(() => window.navigateTo("university"), 400);

  window.nuLimitsUniversity = {
    get state() { return load(); },
    get courses() { return COURSES.slice(); },
    get qualifications() { return load().qualifications.slice(); },
    enrol, withdraw, attend, study, sitExam, payFees, graduate,
    completion, averageMark, attendanceAvg, outstanding, graduationDay,
    render, tick,
    open: () => window.navigateTo("university")
  };
})();
