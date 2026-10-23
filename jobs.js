/* =========================================================
   NU LIMITS — JOBS (Round 20)
   Real-world employment board: requirements, interviews,
   probation, slow promotions, payroll with PAYE / UIF /
   pension, annual increases, resignations, payslips.
   Shares the game clock, money ledger, university
   qualifications, themes and Creator Edit Mode.
   ========================================================= */

(function () {
  "use strict";

  const KEY = "nuLimitsJobs_v1";
  const MIN_KEY = "nuLimitsEmpireMin_v1";
  const VERSION = 1;
  const PASS_DAYS = 3;              /* days before a rejected applicant may retry */
  const REVIEW_MS = 9000;           /* promotion board */
  const CYCLE_DAYS = 30;            /* salary cycle */
  const MAX_GRADE_HISTORY = 40;

  let interviewMs = 30000;          /* real interview length */
  let interviewState = null;

  const day = () => (window.nuLimitsWorld ? window.nuLimitsWorld.day : 1);
  const editOn = () => !!(window.nuLimitsEditMode && window.nuLimitsEditMode.isOn());
  const freePlay = () => !!(window.nuLimitsFree && window.nuLimitsFree.on());
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const uid = p => (p || "jb") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const money = n => "R " + Math.round(Number(n) || 0).toLocaleString("en-ZA");
  const money0 = n => "R" + Math.round(Number(n) || 0).toLocaleString("en-ZA");

  function dateFor(dayNum) {
    const base = (window.nuLimitsWorld && window.nuLimitsWorld.date) || new Date();
    const d = new Date(base.getTime() + (dayNum - day()) * 86400000);
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
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

  /* ---------------------------------------------------------
     Save
     --------------------------------------------------------- */
  function blank() {
    return {
      version: VERSION,
      career: null,
      interviews: {},
      outcomes: [],          /* hired / rejected / promoted / resigned */
      payslips: [],
      salaryScale: {},       /* per-job multiplier, editable in Edit Mode */
      visits: 0
    };
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (err) { return fallback; }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (err) { return false; }
  }

  let state = null;

  function load() {
    if (state) return state;
    const saved = readJSON(KEY, null);
    state = Object.assign(blank(), saved || {});
    state.version = VERSION;
    if (!Array.isArray(state.payslips)) state.payslips = [];
    if (!Array.isArray(state.outcomes)) state.outcomes = [];
    if (!state.salaryScale || typeof state.salaryScale !== "object") state.salaryScale = {};
    if (!state.interviews || typeof state.interviews !== "object") state.interviews = {};
    return state;
  }

  function persist() { writeJSON(KEY, load()); }

  /* ---------------------------------------------------------
     Jobs — one per university course
     --------------------------------------------------------- */
  const GRADES = (names, pays, gates) =>
    names.map((name, i) => ({ name, pay: pays[i], minDays: gates[i] ? gates[i][0] : 0, minPerf: gates[i] ? gates[i][1] : 0 }));

  const JOBS = [
    {
      id: "operations",
      courseId: "business",
      title: "Operations Manager",
      employer: "Vantage Holdings",
      sector: "Business & Operations",
      track: "Operations",
      location: "Sandton, Johannesburg",
      reportsTo: "Head of Operations",
      reports: "9 coordinators",
      hours: "08:00 – 17:00 · Mon to Fri",
      probation: 90,
      minFinal: 55,
      level: "Degree",
      pass: 58,
      blurb: "Run the day-to-day of a mid-sized group: suppliers, staff rotas, service levels and the monthly operating report.",
      duties: ["Own the weekly operating plan", "Manage supplier and service-level agreements", "Run the monthly performance review"],
      grades: GRADES(
        ["Graduate Trainee", "Operations Coordinator", "Operations Manager", "Regional Manager", "Head of Operations"],
        [18500, 26000, 38500, 56000, 82000],
        [[0, 0], [90, 62], [180, 70], [240, 78], [300, 85]]
      )
    },
    {
      id: "finance",
      courseId: "finance",
      title: "Financial Accountant",
      employer: "Meridian Capital",
      sector: "Finance & Accounting",
      track: "Finance",
      location: "Rosebank, Johannesburg",
      reportsTo: "Finance Manager",
      reports: "2 bookkeepers",
      hours: "08:00 – 17:00 · Mon to Fri",
      probation: 90,
      minFinal: 58,
      level: "Degree",
      pass: 62,
      blurb: "Prepare the monthly accounts, reconcile the ledger and keep the auditors comfortable.",
      duties: ["Month-end close and reconciliations", "Draft management accounts", "Support the interim audit"],
      grades: GRADES(
        ["Trainee Accountant", "Junior Accountant", "Financial Accountant", "Finance Manager", "Financial Director"],
        [20000, 29500, 44000, 68000, 105000],
        [[0, 0], [90, 63], [180, 71], [250, 79], [310, 86]]
      )
    },
    {
      id: "software",
      courseId: "cs",
      title: "Software Engineer",
      employer: "Nova Systems",
      sector: "Computer Science & IT",
      track: "Engineering",
      location: "Bryanston, Johannesburg",
      reportsTo: "Engineering Lead",
      reports: "cross-functional pod",
      hours: "09:00 – 17:30 · hybrid",
      probation: 60,
      minFinal: 60,
      level: "Degree",
      pass: 64,
      blurb: "Ship features on a payments platform: TypeScript, Node, tests and code review.",
      duties: ["Deliver the sprint backlog", "Write and review tests", "Take part in on-call rotation"],
      grades: GRADES(
        ["Junior Developer", "Software Engineer", "Senior Engineer", "Engineering Lead", "Head of Engineering"],
        [24000, 36000, 55000, 78000, 120000],
        [[0, 0], [80, 64], [170, 72], [240, 80], [300, 87]]
      )
    },
    {
      id: "civil",
      courseId: "engineering",
      title: "Site Engineer",
      employer: "Ironline Construction",
      sector: "Engineering",
      track: "Engineering",
      location: "Midrand, Gauteng",
      reportsTo: "Project Engineer",
      reports: "4 site foremen",
      hours: "06:30 – 16:00 · Mon to Sat",
      probation: 120,
      minFinal: 60,
      level: "Degree",
      pass: 63,
      blurb: "Turn drawings into a site that passes inspection: setting out, quality control and safety files.",
      duties: ["Setting-out and quality checks", "Daily safety and labour records", "Report progress to the project engineer"],
      grades: GRADES(
        ["Graduate Engineer", "Site Engineer", "Project Engineer", "Engineering Manager", "Chief Engineer"],
        [23000, 34000, 52000, 74000, 112000],
        [[0, 0], [110, 64], [200, 72], [270, 80], [330, 87]]
      )
    },
    {
      id: "brand",
      courseId: "marketing",
      title: "Marketing Coordinator",
      employer: "Bright & Co",
      sector: "Marketing",
      track: "Marketing",
      location: "Braamfontein, Johannesburg",
      reportsTo: "Brand Manager",
      reports: "2 interns",
      hours: "08:30 – 17:00 · Mon to Fri",
      probation: 60,
      minFinal: 52,
      level: "Diploma",
      pass: 56,
      blurb: "Own the campaign calendar, the agency briefs and the numbers that prove the spend worked.",
      duties: ["Run the content calendar", "Brief and check agency work", "Report reach and conversion"],
      grades: GRADES(
        ["Marketing Assistant", "Marketing Coordinator", "Brand Manager", "Marketing Manager", "Head of Brand"],
        [14500, 21000, 33000, 50000, 76000],
        [[0, 0], [75, 60], [160, 69], [230, 77], [290, 84]]
      )
    },
    {
      id: "legal",
      courseId: "law",
      title: "Candidate Attorney",
      employer: "Kruger Attorneys",
      sector: "Law",
      track: "Legal",
      location: "Marshalltown, Johannesburg",
      reportsTo: "Senior Associate",
      reports: "article clerk pool",
      hours: "08:00 – 18:00 · Mon to Fri",
      probation: 120,
      minFinal: 62,
      level: "Degree",
      pass: 66,
      blurb: "Two years of articles: drafting, court runs, discovery and the kind of hours the brochures leave out.",
      duties: ["Draft pleadings and opinions", "Attend court and consultations", "Manage discovery files"],
      grades: GRADES(
        ["Candidate Attorney", "Associate", "Senior Associate", "Partner", "Managing Partner"],
        [16000, 32000, 52000, 88000, 150000],
        [[0, 0], [150, 66], [240, 74], [320, 82], [380, 88]]
      )
    },
    {
      id: "freight",
      courseId: "logistics",
      title: "Supply Chain Coordinator",
      employer: "Cape Freight Co",
      sector: "Logistics & Supply Chain",
      track: "Logistics",
      location: "City Deep, Johannesburg",
      reportsTo: "Logistics Manager",
      reports: "3 clerks",
      hours: "07:00 – 16:00 · Mon to Fri",
      probation: 60,
      minFinal: 50,
      level: "Diploma",
      pass: 55,
      blurb: "Keep stock moving: inbound bookings, customs paperwork, warehouse picks and delivery windows.",
      duties: ["Book inbound and outbound loads", "Chase customs and clearing documents", "Keep the stock system honest"],
      grades: GRADES(
        ["Logistics Clerk", "Supply Chain Coordinator", "Warehouse Manager", "Logistics Manager", "Head of Supply Chain"],
        [13500, 20500, 32000, 48000, 72000],
        [[0, 0], [75, 59], [150, 68], [220, 76], [280, 83]]
      )
    }
  ];

  const jobOf = id => JOBS.find(j => j.id === id) || null;
  const courseName = id => {
    const U = window.nuLimitsUniversity;
    const c = U && U.courses ? U.courses.find(x => x.id === id) : null;
    return c ? c.name : id;
  };

  const scaleOf = jobId => {
    const s = load().salaryScale[jobId];
    return typeof s === "number" && s > 0.4 && s < 3 ? s : 1;
  };

  const gradePayOf = (job, grade) => {
    const g = job.grades[clamp(grade, 0, job.grades.length - 1)];
    return Math.round((g.pay * scaleOf(job.id)) / 100) * 100;
  };

  const career = () => load().career;

  /* ---------------------------------------------------------
     Tax — South African PAYE (annual brackets, primary rebate),
     UIF 1 % capped, pension 7.5 % employee contribution.
     --------------------------------------------------------- */
  const BRACKETS = [
    [237100, 0, 0.18],
    [370500, 42678, 0.26],
    [512800, 77362, 0.31],
    [673000, 121475, 0.36],
    [857500, 179147, 0.39],
    [1817000, 251258, 0.41],
    [Infinity, 644489, 0.45]
  ];
  const REBATE = 17235;

  function payeAnnual(annual) {
    let tax = 0;
    let lower = 0;
    for (const [cap, base, rate] of BRACKETS) {
      if (annual <= cap) { tax = base + (annual - lower) * rate; break; }
      lower = cap;
    }
    return Math.max(0, tax - REBATE);
  }

  const UIF_CAP = 177.12;
  const PENSION_RATE = 0.075;

  function payslipMath(gross) {
    const g = Math.max(0, Math.round(gross));
    const paye = Math.round(payeAnnual(g * 12) / 12);
    const uif = Math.round(Math.min(UIF_CAP, g * 0.01) * 100) / 100;
    const pension = Math.round(g * PENSION_RATE);
    const net = Math.max(0, Math.round(g - paye - uif - pension));
    return { gross: g, paye, uif, pension, net };
  }

  /* ---------------------------------------------------------
     Eligibility
     --------------------------------------------------------- */
  const qualifications = () => (window.nuLimitsUniversity ? window.nuLimitsUniversity.qualifications : []);

  function bestQualificationFor(courseId) {
    const list = qualifications().filter(q => q.courseId === courseId);
    if (!list.length) return null;
    return list.sort((a, b) => b.final - a.final)[0];
  }

  function eligibility(job) {
    const q = bestQualificationFor(job.courseId);
    if (!q) return { ok: false, why: `Needs a ${job.level} in ${courseName(job.courseId)}` };
    if (q.final < job.minFinal) return { ok: false, why: `${q.level} average ${q.final}% — ${job.minFinal}% required` };
    const c = career();
    if (c && c.jobId === job.id) return { ok: false, why: "You already hold this post" };
    if (c && c.jobId !== job.id) return { ok: false, why: `Resign from ${jobOf(c.jobId).employer} before applying` };
    const interview = load().interviews[job.id];
    if (interview && interview.rejectedDay && day() < interview.rejectedDay + PASS_DAYS) {
      return { ok: false, why: `Reapply from ${dateFor(interview.rejectedDay + PASS_DAYS)}` };
    }
    return { ok: true, why: `Qualified — ${q.level} at ${q.final}%`, qual: q };
  }

  /* ---------------------------------------------------------
     Tick: absences, service days, annual increase, payroll
     --------------------------------------------------------- */
  function tick() {
    const s = load();
    const c = s.career;
    if (!c) return;
    const today = day();
    if (c.lastTick >= today) return;

    const gaps = Math.min(10, today - c.lastTick);
    for (let d = c.lastTick + 1; d <= today; d += 1) {
      if (c.lastClockDay < d) {
        c.performance = clamp(c.performance - 5, 0, 100);
        c.absent = (c.absent || 0) + 1;
      }
    }
    c.daysInGrade += gaps;
    c.daysEmployed += gaps;
    c.lastTick = today;

    /* annual increase — one notch every 365 days served */
    const due = Math.floor(c.daysEmployed / 365);
    if (due > (c.increases || 0)) {
      c.increases = due;
      c.payFactor = 1 + 0.06 * due;
      s.outcomes.unshift({ kind: "increase", text: `Annual increase +6 % — now on ${money(payFor(c))} a month`, day: today });
    }

    while (today >= c.payDay) { runPayroll(c, s); c.payDay += CYCLE_DAYS; }
    persist();
  }

  function payFor(c) {
    const job = jobOf(c.jobId);
    if (!job) return 0;
    return Math.round((gradePayOf(job, c.grade) * (c.payFactor || 1)) / 100) * 100;
  }

  function runPayroll(c, s) {
    const job = jobOf(c.jobId);
    if (!job) return;
    const base = payFor(c);
    const daily = base / CYCLE_DAYS;
    const absent = c.absent || 0;
    const gross = Math.max(Math.round(base * 0.4), Math.round(base - daily * absent));
    const slip = payslipMath(gross);
    const bonusCycle = monthOf() === 11 && c.performance >= 75 ? Math.round(gross * 0.6) : 0;

    const M = window.nuLimitsMoney;
    if (M && !editOn() && !freePlay()) {
      M.transact("income", gross + bonusCycle, `Salary · ${job.employer} · ${job.grades[c.grade].name}`);
      if (slip.paye > 0) M.transact("expense", slip.paye, `PAYE · SARS · ${monthLabel()}`);
      if (slip.uif > 0) M.transact("expense", Math.round(slip.uif), `UIF 1% · ${monthLabel()}`);
      if (slip.pension > 0) M.transact("expense", slip.pension, `Pension 7.5% · fund contribution`);
    }

    s.payslips.unshift({
      id: uid("slip"), day: day(), period: monthLabel(), employer: job.employer,
      grade: job.grades[c.grade].name, gross: slip.gross, paye: slip.paye, uif: slip.uif,
      pension: slip.pension, bonus: bonusCycle, net: slip.net + bonusCycle, absences: absent
    });
    s.payslips = s.payslips.slice(0, 24);
    c.absent = 0;
    c.paidToDay = day();
  }

  function monthOf() {
    const d = (window.nuLimitsWorld && window.nuLimitsWorld.date) || new Date();
    return d.getMonth();
  }

  function monthLabel() {
    const d = (window.nuLimitsWorld && window.nuLimitsWorld.date) || new Date();
    return d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
  }

  /* ---------------------------------------------------------
     Actions
     --------------------------------------------------------- */
  function clockIn() {
    const c = career();
    if (!c) return toast("You are not employed yet.", true);
    if (c.lastClockDay === day()) return toast("You already clocked in today.", true);
    c.lastClockDay = day();
    c.workDays = (c.workDays || 0) + 1;
    c.performance = clamp(c.performance + 2, 0, 100);
    load().outcomes.unshift({ kind: "work", text: `Clocked in at ${jobOf(c.jobId).employer}`, day: day() });
    persist(); render();
    toast("Clocked in — a full day on the floor.");
  }

  function promotionReady(c) {
    const job = jobOf(c.jobId);
    if (!job) return false;
    const next = job.grades[c.grade + 1];
    if (!next) return false;
    return c.daysInGrade >= (next.minDays || 0) && c.performance >= (next.minPerf || 0);
  }

  function requestPromotion() {
    const c = career();
    if (!c) return;
    const job = jobOf(c.jobId);
    const next = job.grades[c.grade + 1];
    if (!next) return toast("You are at the top of this ladder.", true);
    if (!promotionReady(c)) return toast("The board will not see you yet — check the requirements.", true);

    const perf = c.performance;
    const gap = perf - (next.minPerf || 0);
    const chance = clamp(0.35 + gap / 40, 0.35, 0.95);
    const pass = editOn() || Math.random() < chance;
    if (pass) {
      c.grade += 1;
      c.daysInGrade = 0;
      c.performance = clamp(c.performance - 4, 0, 100);
      load().outcomes.unshift({ kind: "promoted", text: `Promoted to ${next.name} — ${money(gradePayOf(job, c.grade))} a month`, day: day() });
      toast(`Promoted — ${next.name}, ${money(gradePayOf(job, c.grade))} a month.`);
    } else {
      c.daysInGrade = Math.round(c.daysInGrade * 0.75);
      load().outcomes.unshift({ kind: "declined", text: `Promotion review declined — ${next.name} board want another cycle`, day: day() });
      toast("The board declined this round. Keep attendance up and try again.", true);
    }
    persist(); render();
  }

  function resign() {
    const c = career();
    if (!c) return;
    const job = jobOf(c.jobId);
    load().outcomes.unshift({ kind: "resigned", text: `Resigned from ${job.employer}`, day: day() });
    load().career = null;
    persist(); render();
    toast("Resigned. Notice served — the post is open again.");
  }

  /* -------- interviews -------- */
  function apply(jobId) {
    const job = jobOf(jobId);
    if (!job) return;
    const el = eligibility(job);
    if (!el.ok) return toast(el.why, true);
    if (interviewState) return toast("An interview is already running.", true);
    startInterview(job, el.qual);
  }

  const STAGES = [
    "Screening call · HR",
    "Panel interview · hiring manager",
    "Technical assessment",
    "References & checks",
    "Offer discussion"
  ];

  function startInterview(job, qual) {
    interviewState = {
      job, qual, started: Date.now(), ms: editOn() ? 3000 : interviewMs,
      raf: 0, done: false
    };
    paintInterview();
    const step = () => {
      const s = interviewState;
      if (!s || s.done) return;
      const pct = clamp(((Date.now() - s.started) / s.ms) * 100, 0, 100);
      const bar = document.querySelector(".jbx-bar > i");
      const num = document.querySelector(".jbx-pct");
      const stage = document.querySelector(".jbx-stage");
      if (bar) bar.style.width = pct.toFixed(1) + "%";
      if (num) num.textContent = Math.round(pct) + "%";
      if (stage) stage.textContent = STAGES[Math.min(STAGES.length - 1, Math.floor((pct / 100) * STAGES.length))];
      if (pct >= 100) return finishInterview();
      s.raf = requestAnimationFrame(step);
    };
    interviewState.raf = requestAnimationFrame(step);
  }

  function paintInterview() {
    const s = interviewState;
    if (!s) return;
    let host = document.getElementById("jb-interview");
    if (!host) {
      host = document.createElement("div");
      host.id = "jb-interview";
      host.className = "jbx";
      document.body.appendChild(host);
    }
    host.innerHTML = `
      <div class="jbx-card" role="dialog" aria-modal="true" aria-label="Interview in progress">
        <p class="jbx-eyebrow">INTERVIEW IN PROGRESS</p>
        <h3>${esc(s.job.title)}</h3>
        <p class="jbx-emp">${esc(s.job.employer)} · ${esc(s.job.location)}</p>
        <div class="jbx-stage">${esc(STAGES[0])}</div>
        <div class="jbx-bar"><i style="width:0%"></i></div>
        <div class="jbx-foot">
          <span class="jbx-pct">0%</span>
          <button type="button" class="jbx-cancel" data-jb="cancel-interview">Withdraw application</button>
        </div>
        <p class="jbx-note">Your ${esc(s.qual.level)} in ${esc(courseName(s.job.courseId))} (${s.qual.final}%) sets the starting point. The panel decides.</p>
      </div>`;
    host.classList.add("show");
  }

  function finishInterview() {
    const s = interviewState;
    if (!s) return;
    s.done = true;
    cancelAnimationFrame(s.raf);
    const st = load();
    const fit = s.qual.final;
    const score = clamp(fit * 0.62 + Math.random() * 38, 0, 100);
    const pass = score >= s.job.pass;
    const job = s.job;

    if (pass) {
      const shift = Math.round((gradePayOf(job, 0) * (score >= 80 ? 1.05 : 1)) / 100) * 100;
      st.career = {
        id: uid("emp"), jobId: job.id, grade: 0,
        startedDay: day(), lastTick: day(), daysInGrade: 0, daysEmployed: 0,
        performance: 55, absent: 0, workDays: 0,
        lastClockDay: 0, payDay: day() + CYCLE_DAYS, payFactor: 1, increases: 0,
        entryScore: Math.round(score), entryPay: shift
      };
      st.outcomes.unshift({ kind: "hired", text: `Hired by ${job.employer} as ${job.grades[0].name}`, day: day() });
      st.interviews[job.id] = { passedDay: day() };
      const host = document.getElementById("jb-interview");
      if (host) {
        host.querySelector(".jbx-card").classList.add("is-done");
        host.querySelector(".jbx-stage").textContent = `Offer: ${job.grades[0].name} · ${money(shift)} a month`;
        host.querySelector(".jbx-bar > i").style.width = "100%";
        host.querySelector(".jbx-pct").textContent = "100%";
        const btn = host.querySelector("[data-jb=cancel-interview]");
        if (btn) { btn.textContent = "Close"; btn.dataset.jb = "close-interview"; }
      }
      toast(`Hired — ${job.grades[0].name} at ${job.employer}.`);
    } else {
      st.interviews[job.id] = { rejectedDay: day() };
      st.outcomes.unshift({ kind: "rejected", text: `Interview declined · ${job.title} (${Math.round(score)}%)`, day: day() });
      const host = document.getElementById("jb-interview");
      if (host) {
        host.querySelector(".jbx-card").classList.add("is-fail");
        host.querySelector(".jbx-stage").textContent = `Not successful · scored ${Math.round(score)}% against ${job.pass}%`;
        host.querySelector(".jbx-pct").textContent = "100%";
        const btn = host.querySelector("[data-jb=cancel-interview]");
        if (btn) { btn.textContent = "Close"; btn.dataset.jb = "close-interview"; }
      }
      toast("The panel went with another candidate. Reapply after three days.", true);
    }
    interviewState = null;
    persist();
    render();
  }

  function cancelInterview() {
    if (interviewState) {
      cancelAnimationFrame(interviewState.raf);
      interviewState = null;
      toast("Application withdrawn.", true);
    }
    closeInterview();
  }

  function closeInterview() {
    const host = document.getElementById("jb-interview");
    if (host) { host.classList.remove("show"); host.innerHTML = ""; }
    render();
  }

  /* ---------------------------------------------------------
     Render
     --------------------------------------------------------- */
  let tab = "roles";
  const isPage = () => {
    const dp = document.getElementById("dynamic-page");
    return !!(dp && !dp.hidden && dp.querySelector(".jb-page"));
  };

  const IC = {
    bag: '<path d="M3 8.5h18v11H3z"/><path d="M8 8.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5M3 13h18"/>',
    cap: '<path d="m2.6 9 9.4-4 9.4 4L12 13 2.6 9Z"/><path d="M6.6 11v5c0 1.5 2.4 3 5.4 3s5.4-1.5 5.4-3v-5"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'
  };
  const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k] || IC.bag}</svg>`;

  function hero() {
    const c = career();
    const job = c ? jobOf(c.jobId) : null;
    return `<header class="jb-hero">
      <div class="jb-hero-top">
        <span class="jb-hero-icon">${svg("bag")}</span>
        <span class="jb-hero-chip">${c ? esc(job.employer) : "OPEN MARKET"}</span>
      </div>
      <h1>Jobs</h1>
      <p>${c
        ? `${esc(job.grades[c.grade].name)} · ${esc(job.location)} · ${money(payFor(c))} a month`
        : "Seven careers, seven qualifications. Apply, interview, work the ladder."}</p>
    </header>`;
  }

  function stats() {
    const c = career();
    const q = qualifications().length;
    return `<div class="jb-stats">
      <span><small>ROLES</small><strong>${JOBS.length}</strong></span>
      <span><small>QUALIFICATIONS</small><strong>${q}</strong></span>
      <span><small>STATUS</small><strong>${c ? "Employed" : "Open"}</strong></span>
    </div>`;
  }

  function tabs() {
    const items = [["roles", "Vacancies"], ["job", "My job"], ["payslips", "Payslips"]];
    return `<div class="jb-tabs">${items.map(([id, label]) =>
      `<button type="button" class="jb-tab${tab === id ? " is-on" : ""}" data-jb="tab" data-tab="${id}">${label}</button>`).join("")}</div>`;
  }

  function roles() {
    const c = career();
    return `<div class="jb-list">${JOBS.map(job => {
      const el = eligibility(job);
      const mine = c && c.jobId === job.id;
      const q = bestQualificationFor(job.courseId);
      const tag = mine ? "Current post" : el.ok ? "Open to you" : "Locked";
      const first = gradePayOf(job, 0);
      const last = gradePayOf(job, job.grades.length - 1);
      return `<article class="jb-card${mine ? " is-mine" : el.ok ? " is-open" : ""}">
        <div class="jb-card-head">
          <div>
            <h3>${esc(job.title)}</h3>
            <p class="jb-emp">${esc(job.employer)} · ${esc(job.sector)}</p>
          </div>
          <span class="jb-tag${mine ? " is-mine" : el.ok ? " is-open" : ""}">${tag}</span>
        </div>
        <p class="jb-blurb">${esc(job.blurb)}</p>
        <div class="jb-facts">
          <span><small>LOCATION</small><b>${esc(job.location)}</b></span>
          <span><small>HOURS</small><b>${esc(job.hours)}</b></span>
          <span><small>PROBATION</small><b>${job.probation} days</b></span>
          <span><small>REPORTS TO</small><b>${esc(job.reportsTo)}</b></span>
        </div>
        <div class="jb-req">
          <span class="jb-req-icon">${svg("cap")}</span>
          <div>
            <b>${esc(job.level)} in ${esc(courseName(job.courseId))}</b>
            <small>Minimum final average ${job.minFinal}%${q ? ` · you have ${q.final}%` : ""}</small>
          </div>
        </div>
        <ul class="jb-duties">${job.duties.map(d => `<li>${esc(d)}</li>`).join("")}</ul>
        <div class="jb-pay">
          <span><small>START</small><b>${money0(first)}</b></span>
          <span class="jb-pay-line"></span>
          <span><small>TOP</small><b>${money0(last)}</b></span>
        </div>
        <div class="jb-actions">
          <button type="button" class="jb-btn is-primary" data-jb="apply" data-job="${job.id}"${el.ok ? "" : " disabled"}>${mine ? "Employed" : "Apply"}</button>
          <span class="jb-why">${esc(el.why)}</span>
        </div>
        ${editOn() ? `<div class="jb-editrow">
          <button type="button" class="jb-mini" data-jb="hire" data-job="${job.id}">Hire instantly</button>
          <button type="button" class="jb-mini" data-jb="scale" data-job="${job.id}" data-dir="-1">Pay −10%</button>
          <button type="button" class="jb-mini" data-jb="scale" data-job="${job.id}" data-dir="1">Pay +10%</button>
          <span class="jb-mini-note">×${scaleOf(job.id).toFixed(2)}</span>
        </div>` : ""}
      </article>`;
    }).join("")}</div>`;
  }

  function myJob() {
    const c = career();
    if (!c) {
      return `<div class="jb-empty">
        <span class="jb-empty-icon">${svg("doc")}</span>
        <h3>No post yet</h3>
        <p>Graduate from University Road, then open <b>Vacancies</b> and apply. The interview runs for about 30 seconds.</p>
      </div>`;
    }
    const job = jobOf(c.jobId);
    const g = job.grades[c.grade];
    const next = job.grades[c.grade + 1];
    const pay = payFor(c);
    const slip = payslipMath(pay);
    const ready = promotionReady(c);
    const dayIn = c.lastClockDay === day();
    const tenure = c.startedDay ? dateFor(c.startedDay) : "—";

    const ladders = job.grades.map((gr, i) => `
      <li class="jb-ladder${i < c.grade ? " is-done" : i === c.grade ? " is-now" : ""}">
        <span class="jb-ladder-dot"></span>
        <span class="jb-ladder-name">${esc(gr.name)}</span>
        <span class="jb-ladder-pay">${money0(gradePayOf(job, i))}</span>
      </li>`).join("");

    return `<div class="jb-workspace">
      <div class="jb-card is-mine">
        <div class="jb-card-head">
          <div>
            <h3>${esc(g.name)}</h3>
            <p class="jb-emp">${esc(job.employer)} · ${esc(job.track)}</p>
          </div>
          <span class="jb-tag is-mine">Grade ${c.grade + 1}/${job.grades.length}</span>
        </div>
        <div class="jb-contract">
          <span><small>STARTED</small><b>${tenure}</b></span>
          <span><small>SERVICE</small><b>${c.daysEmployed} days</b></span>
          <span><small>REPORTS TO</small><b>${esc(job.reportsTo)}</b></span>
          <span><small>LEAVE</small><b>21 days a year</b></span>
          <span><small>NOTICE</small><b>30 days</b></span>
          <span><small>PROBATION</small><b>${c.daysEmployed >= job.probation ? "Passed" : `${job.probation - c.daysEmployed} days left`}</b></span>
        </div>
      </div>

      <div class="jb-grid2">
        <div class="jb-card">
          <h4 class="jb-h4">This month</h4>
          <div class="jb-paylist">
            <span><i>Gross</i><b>${money(slip.gross)}</b></span>
            <span><i>PAYE</i><b class="is-neg">−${money(slip.paye)}</b></span>
            <span><i>UIF 1%</i><b class="is-neg">−${money(slip.uif)}</b></span>
            <span><i>Pension 7.5%</i><b class="is-neg">−${money(slip.pension)}</b></span>
            <span class="is-total"><i>Net pay</i><b>${money(slip.net)}</b></span>
          </div>
          <p class="jb-fine">Next payroll in ${Math.max(0, c.payDay - day())} days${c.absent ? ` · ${c.absent} unauthorised absence${c.absent > 1 ? "s" : ""} this cycle` : ""}.</p>
        </div>
        <div class="jb-card">
          <h4 class="jb-h4">Performance</h4>
          <div class="jb-meter"><i style="width:${Math.round(c.performance)}%"></i></div>
          <div class="jb-meter-row"><b>${Math.round(c.performance)}%</b><span>${c.performance >= 80 ? "Exceeds" : c.performance >= 65 ? "Meets" : "Needs work"}</span></div>
          <p class="jb-fine">Clock in each day: +2 performance. Every missed day −5 and it is docked from the next payslip.</p>
        </div>
      </div>

      ${next ? `<div class="jb-card">
        <div class="jb-card-head">
          <div><h4 class="jb-h4">Promotion · ${esc(next.name)}</h4>
          <p class="jb-emp">${money0(gradePayOf(job, c.grade))} → ${money0(gradePayOf(job, c.grade + 1))} a month</p></div>
          <span class="jb-tag${ready ? " is-open" : ""}">${ready ? "Eligible" : "In progress"}</span>
        </div>
        <div class="jb-checks">
          <span class="${c.daysInGrade >= next.minDays ? "ok" : ""}"><i>Time in grade</i><b>${c.daysInGrade} / ${next.minDays} days</b></span>
          <span class="${c.performance >= next.minPerf ? "ok" : ""}"><i>Performance</i><b>${Math.round(c.performance)}% / ${next.minPerf}%</b></span>
        </div>
        <div class="jb-actions">
          <button type="button" class="jb-btn is-primary" data-jb="promote"${ready ? "" : " disabled"}>Request promotion review</button>
          <span class="jb-why">${ready ? "The board decides — attendance and performance carry you." : "Promotions are not automatic. Serve the time first."}</span>
        </div>
      </div>` : `<div class="jb-card"><h4 class="jb-h4">Top of the ladder</h4><p class="jb-fine">You hold the most senior post in this function.</p></div>`}

      <div class="jb-card">
        <h4 class="jb-h4">Career ladder</h4>
        <ul class="jb-ladderlist">${ladders}</ul>
      </div>

      <div class="jb-actions is-wide">
        <button type="button" class="jb-btn is-primary" data-jb="clock"${dayIn ? " disabled" : ""}>${dayIn ? "Clocked in today" : "Clock in today"}</button>
        <button type="button" class="jb-btn is-ghost" data-jb="resign">Resign</button>
      </div>

      ${editOn() ? `<div class="jb-editpanel">
        <p class="jb-edit-title">CREATOR · EDIT MODE</p>
        <div class="jb-editgrid">
          <button type="button" class="jb-mini" data-jb="e-perf">Performance 100%</button>
          <button type="button" class="jb-mini" data-jb="e-promote">Promote now</button>
          <button type="button" class="jb-mini" data-jb="e-demote">Grade −1</button>
          <button type="button" class="jb-mini" data-jb="e-payday">Run payroll now</button>
          <button type="button" class="jb-mini" data-jb="e-reset">Reset career</button>
        </div>
      </div>` : ""}
    </div>`;
  }

  function payslips() {
    const list = load().payslips;
    const log = load().outcomes.slice(0, 8);
    return `<div class="jb-list">
      <div class="jb-card">
        <h4 class="jb-h4">Payslips</h4>
        ${list.length ? `<div class="jb-slips">${list.map(s => `
          <div class="jb-slip">
            <div class="jb-slip-top">
              <b>${esc(s.period)}</b>
              <span>${money(s.net)}</span>
            </div>
            <small>${esc(s.employer)} · ${esc(s.grade)}</small>
            <div class="jb-slip-nums">
              <span>Gross ${money0(s.gross)}</span>
              <span>PAYE −${money0(s.paye)}</span>
              <span>UIF −${money0(s.uif)}</span>
              <span>Pension −${money0(s.pension)}</span>
              ${s.bonus ? `<span class="is-bonus">13th cheque +${money0(s.bonus)}</span>` : ""}
            </div>
          </div>`).join("")}</div>`
        : `<p class="jb-fine">No payslips yet — the first one lands after ${CYCLE_DAYS} days of service.</p>`}
      </div>
      <div class="jb-card">
        <h4 class="jb-h4">Career record</h4>
        ${log.length ? `<ul class="jb-log">${log.map(o => `<li><span>${esc(o.text)}</span><b>${dateFor(o.day)}</b></li>`).join("")}</ul>`
        : `<p class="jb-fine">Nothing on file yet.</p>`}
      </div>
    </div>`;
  }

  function pageHTML() {
    const body = tab === "job" ? myJob() : tab === "payslips" ? payslips() : roles();
    return `<section class="dynamic-page-content jb-page">
      ${hero()}
      ${stats()}
      ${tabs()}
      ${body}
      <button class="secondary-button" type="button" data-go-home style="margin-top:22px">← Back to Home</button>
    </section>`;
  }

  function render() {
    const dp = document.getElementById("dynamic-page");
    if (!dp) return;
    if (!dp.querySelector(".jb-page") && dp.hidden) return;
    dp.innerHTML = pageHTML();
    ensureBackBar(dp);
    paintBadge();
  }

  function ensureBackBar(dp) {
    if (!dp || dp.querySelector(":scope > .nl-backbar")) return;
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
     Home qualification badge + empire minimiser
     --------------------------------------------------------- */
  function highestQualification() {
    const q = qualifications().slice();
    if (!q.length) return null;
    return q.sort((a, b) => b.final - a.final)[0];
  }

  function paintBadge() {
    const el = document.getElementById("nl-qualbadge");
    if (!el) return;
    const q = highestQualification();
    const title = el.querySelector("#nl-qualbadge-title");
    const sub = el.querySelector("#nl-qualbadge-sub");
    if (!title || !sub) return;
    if (q) {
      title.textContent = `${q.level} · ${q.name}`;
      sub.textContent = `Final average ${q.final}% · awarded ${dateFor(q.completedDay)}${q.careers && q.careers[0] ? " · " + q.careers[0] : ""}`;
      el.classList.add("is-earned");
    } else {
      title.textContent = "No qualification yet";
      sub.textContent = "Graduate at University Road to unlock the jobs board";
      el.classList.remove("is-earned");
    }
  }

  function readMin() {
    try { return localStorage.getItem(MIN_KEY) === "1"; } catch (err) { return false; }
  }

  function applyMin(min) {
    const grid = document.querySelector(".action-grid");
    const btn = document.getElementById("empire-toggle");
    if (grid) grid.classList.toggle("is-min", !!min);
    if (btn) {
      btn.setAttribute("aria-pressed", min ? "true" : "false");
      btn.setAttribute("aria-label", min ? "Show all shortcuts" : "Minimise shortcuts");
      const label = btn.querySelector(".empire-toggle-label");
      if (label) label.textContent = min ? "Show all" : "Minimise";
    }
    try { localStorage.setItem(MIN_KEY, min ? "1" : "0"); } catch (err) {}
  }

  /* ---------------------------------------------------------
     Events — one delegated listener on document
     --------------------------------------------------------- */
  document.addEventListener("click", e => {
    const toggle = e.target.closest("#empire-toggle");
    if (toggle) {
      const grid = document.querySelector(".action-grid");
      applyMin(!(grid && grid.classList.contains("is-min")));
      return;
    }

    const el = e.target.closest("[data-jb]");
    if (!el) return;
    const act = el.dataset.jb;

    if (act === "tab") { tab = el.dataset.tab; render(); return; }
    if (act === "apply") return apply(el.dataset.job);
    if (act === "cancel-interview") return cancelInterview();
    if (act === "close-interview") return closeInterview();
    if (act === "clock") return clockIn();
    if (act === "promote") return requestPromotion();
    if (act === "resign") {
      if (!window.confirm("Resign from this post? Your record stays, the salary stops.")) return;
      return resign();
    }

    /* Creator tools */
    const s = load();
    const c = s.career;

    if (act === "hire") {
      const job = jobOf(el.dataset.job);
      if (!job) return;
      s.career = {
        id: uid("emp"), jobId: job.id, grade: 0, startedDay: day(), lastTick: day(),
        daysInGrade: 0, daysEmployed: 0, performance: 70, absent: 0, workDays: 0,
        lastClockDay: 0, payDay: day() + CYCLE_DAYS, payFactor: 1, increases: 0,
        entryScore: 100, entryPay: gradePayOf(job, 0)
      };
      s.outcomes.unshift({ kind: "hired", text: `Creator hire · ${job.employer}`, day: day() });
      persist(); tab = "job"; render(); toast("Hired through Edit Mode.");
      return;
    }

    if (act === "scale") {
      const job = jobOf(el.dataset.job);
      if (!job) return;
      const dir = Number(el.dataset.dir) || 1;
      s.salaryScale[job.id] = clamp(scaleOf(job.id) + dir * 0.1, 0.5, 2.5);
      persist(); render(); toast(`Pay scale ×${scaleOf(job.id).toFixed(2)}`);
      return;
    }

    if (!c) return;

    if (act === "e-perf") { c.performance = 100; persist(); render(); toast("Performance set to 100%."); return; }
    if (act === "e-promote") {
      const job = jobOf(c.jobId);
      if (c.grade < job.grades.length - 1) { c.grade += 1; c.daysInGrade = 0; }
      persist(); render(); toast("Promoted through Edit Mode.");
      return;
    }
    if (act === "e-demote") {
      if (c.grade > 0) { c.grade -= 1; c.daysInGrade = 0; }
      persist(); render(); toast("Grade lowered.");
      return;
    }
    if (act === "e-payday") { runPayroll(c, s); persist(); render(); toast("Payroll forced."); return; }
    if (act === "e-reset") {
      if (!window.confirm("Reset the whole career record on this device?")) return;
      state = blank();
      persist(); tab = "roles"; render(); toast("Career reset.");
    }
  });

  /* ---------------------------------------------------------
     Route
     --------------------------------------------------------- */
  const prevNavigate = window.navigateTo;
  window.navigateTo = function (page) {
    if (typeof window.nuLimitsNoteNav === "function") window.nuLimitsNoteNav(page);
    if (page !== "jobs") {
      const dp = document.getElementById("dynamic-page");
      if (dp && dp.querySelector(".jb-page")) dp.innerHTML = "";
      return prevNavigate.apply(this, arguments);
    }

    document.querySelectorAll(".nav-item").forEach(b =>
      b.classList.toggle("active", b.dataset.page === page));
    if (typeof window.nuLimitsInvestLeave === "function") window.nuLimitsInvestLeave();

    const main = document.getElementById("main-content");
    const dp = document.getElementById("dynamic-page");
    if (!main || !dp) return;

    if (!dp.querySelector(".jb-page")) tab = "roles";
    main.hidden = true;
    dp.hidden = false;
    load().visits = (load().visits || 0) + 1;
    tick();
    persist();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  };

  /* keep the clock honest while the page is open */
  let lastEdit = null;
  window.setInterval(() => {
    paintBadge();
    const ed = editOn();
    if (lastEdit === null) lastEdit = ed;
    else if (ed !== lastEdit) { lastEdit = ed; if (isPage()) render(); }
    if (!isPage()) return;
    const before = JSON.stringify(load().career);
    tick();
    if (JSON.stringify(load().career) !== before) render();
  }, 1000);

  window.addEventListener("hashchange", () => {
    if (location.hash.replace("#", "") === "jobs") window.navigateTo("jobs");
  });

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function boot() {
    load();
    applyMin(readMin());
    paintBadge();
    if (location.hash.replace("#", "") === "jobs") window.navigateTo("jobs");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.nuLimitsJobs = {
    get state() { return load(); },
    get jobs() { return JOBS.slice(); },
    get career() { return career(); },
    eligibility, apply, clockIn, requestPromotion, resign,
    payslipMath, payFor, promotionReady,
    tick, render, paintBadge,
    open: () => window.navigateTo("jobs"),
    setInterviewMs: ms => { interviewMs = Math.max(400, Number(ms) || 30000); },
    get interviewMs() { return interviewMs; }
  };
})();
