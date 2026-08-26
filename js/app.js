const app = document.getElementById("app");

const state = {
  screen: "login",
  algoId: null,
  tab: "learn",
  quizKind: "pre",
  quizIndex: 0,
  answers: [],
  showResult: false,
  lastScore: null,
  viz: {
    steps: [],
    i: 0,
    playing: false,
    timer: null,
    target: null,
    data: []
  }
};

let tickHandle = null;
let lastTick = 0;

function currentAlgo() {
  return ALGORITHMS.find((a) => a.id === state.algoId);
}

const RECORDS_ADMIN_ID = "14746";

function canViewRecords() {
  return Storage.getStudentId() === RECORDS_ADMIN_ID;
}

function rec() {
  const id = Storage.getStudentId();
  const algo = currentAlgo();
  if (!id || !algo) return null;
  return Storage.find(id, algo.id) || Storage.blank(id, algo.id, algo.name);
}

function trackingScreen() {
  return ["study", "posttest", "pretest"].includes(state.screen);
}

function flushTimer() {
  if (!lastTick || !trackingScreen()) return;
  const id = Storage.getStudentId();
  if (!id || !state.algoId) return;
  const now = Date.now();
  Storage.addTime(id, state.algoId, now - lastTick);
  lastTick = now;
}

function startTimer() {
  if (tickHandle) return;
  lastTick = Date.now();
  tickHandle = setInterval(() => {
    flushTimer();
    const el = document.querySelector(".timer");
    if (el) {
      const r = rec();
      el.textContent = r ? formatDuration(r.timeSpentMs) : "00:00";
    }
  }, 1000);
}

function stopTimer() {
  flushTimer();
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = null;
  lastTick = 0;
}

function navigate(screen, extra = {}) {
  Object.assign(state, extra, { screen });
  render();
}

function shell(inner, actions = "") {
  const sid = Storage.getStudentId();
  return `
    <header class="topbar">
      <div class="brand">
        <small>Design and Analysis of Algorithms</small>
        <strong>DAA Project</strong>
      </div>
      <div class="topbar-actions">
        ${sid ? `<span class="chip">Student ID: ${escapeHtml(sid)}</span>` : ""}
        ${sid && state.algoId && rec() ? `<span class="chip timer">${formatDuration(rec().timeSpentMs)}</span>` : ""}
        ${actions}
        ${canViewRecords() ? `<button class="ghost" type="button" data-act="records">Records &amp; CSV</button>` : ""}
        ${sid ? `<button class="ghost" type="button" data-act="logout">Log out</button>` : ""}
      </div>
    </header>
    <main class="layout">${inner}</main>
  `;
}

function render() {
  const sid = Storage.getStudentId();
  if (!sid && state.screen !== "login") {
    state.screen = "login";
  }
  if (state.screen === "records" && !canViewRecords()) {
    state.screen = sid ? "dashboard" : "login";
  }
  if (trackingScreen()) startTimer();
  else stopTimer();

  if (state.screen === "login") app.innerHTML = viewLogin();
  else if (state.screen === "dashboard") app.innerHTML = viewDashboard();
  else if (state.screen === "pretest" || state.screen === "posttest") app.innerHTML = viewQuiz();
  else if (state.screen === "study") app.innerHTML = viewStudy();
  else if (state.screen === "records") app.innerHTML = viewRecords();
  bind();
  if (state.screen === "study" && state.tab === "visualize") mountViz();
}

function viewLogin() {
  return shell(`
    <div class="login-wrap">
      <div class="hero-card">
        <div class="kicker">DAA Project</div>
        <h1>Learn algorithms by doing</h1>
        <p class="lead">Enter your Student ID. Each algorithm has a pre-test, a short lesson with live visualization, then a post-test. Student ID, algorithm name, scores, time spent, and attempts are stored automatically and can be exported as CSV.</p>
        <div class="req-grid">
          <div class="req">1. Pre-test before studying</div>
          <div class="req">2. Explanation, pseudocode, complexity</div>
          <div class="req">3. Step-by-step visualization</div>
          <div class="req">4. Post-test and CSV export</div>
        </div>
        <form id="login-form">
          <label for="sid">Student ID</label>
          <input id="sid" name="sid" type="text" maxlength="32" placeholder="e.g. 21CS041" value="${escapeHtml(Storage.lastId())}" required />
          <p class="hint">Letters, numbers, hyphen, and underscore only. Progress is stored in this browser.</p>
          <div class="footer-actions">
            <button class="btn" type="submit">Enter</button>
          </div>
        </form>
      </div>
    </div>
  `);
}

function viewDashboard() {
  const sid = Storage.getStudentId();
  const cards = ALGORITHMS.map((a) => {
    const r = Storage.find(sid, a.id);
    const pre = r?.preTestDone ? `Pre ${r.preTestScore}/${r.preTestMax}` : "Pre-test pending";
    const post = r?.postTestDone ? `Post ${r.postTestScore}/${r.postTestMax}` : "Post-test pending";
    const att = r ? `${r.numberOfAttempts} attempt${r.numberOfAttempts === 1 ? "" : "s"}` : "0 attempts";
    const time = r ? formatDuration(r.timeSpentMs) : "00:00";
    return `
      <article class="algo-card">
        <span class="badge">${escapeHtml(a.topic)}</span>
        <h3>${escapeHtml(a.name)}</h3>
        <p class="meta">${escapeHtml(a.blurb)}</p>
        <div class="status-row">
          <span class="pill ${r?.preTestDone ? "done" : "wait"}">${pre}</span>
          <span class="pill ${r?.postTestDone ? "done" : "wait"}">${post}</span>
          <span class="pill">${att}</span>
          <span class="pill">${time}</span>
        </div>
        <button class="btn" type="button" data-open="${a.id}">Open module</button>
      </article>
    `;
  }).join("");
  return shell(`
    <div class="section-head">
      <div>
        <div class="kicker">Modules</div>
        <h2>Choose an algorithm</h2>
        <p class="lead">Complete the pre-test first. You cannot skip ahead to the lesson.</p>
      </div>
    </div>
    <div class="algo-grid">${cards}</div>
  `);
}

function viewQuiz() {
  const algo = currentAlgo();
  const kind = state.screen === "pretest" ? "pre" : "post";
  const questions = kind === "pre" ? algo.preTest : algo.postTest;
  const i = state.quizIndex;
  const q = questions[i];
  const selected = state.answers[i];
  const r = rec();

  if (state.showResult) {
    const score = state.lastScore;
    const max = questions.length;
    const good = score / max >= 0.6;
    return shell(`
      <button class="back" type="button" data-act="dash">← Dashboard</button>
      <div class="quiz-card">
        <div class="kicker">${kind === "pre" ? "Pre-test" : "Post-test"} · ${escapeHtml(algo.name)}</div>
        <h2>Score: ${score} / ${max}</h2>
        <div class="score-banner ${good ? "ok" : "warn"}">
          ${kind === "pre"
            ? "Your baseline is saved. Continue to the lesson — you can improve on the post-test."
            : good
              ? "Strong result. You can review the lesson or try another algorithm."
              : "Review the explanation, complexity, and visualization, then you may retake the post-test."}
        </div>
        <p class="meta">Time spent: ${formatDuration(r.timeSpentMs)} · Number of attempts: ${r.numberOfAttempts}</p>
        <div class="footer-actions">
          ${kind === "pre"
            ? `<button class="btn" type="button" data-act="study">Start lesson</button>`
            : `<button class="btn" type="button" data-act="study">Back to lesson</button>
               <button class="btn-secondary" type="button" data-act="retake-post">Retake post-test</button>`}
          <button class="btn-secondary" type="button" data-act="dash">Dashboard</button>
        </div>
      </div>
    `);
  }

  const options = q.options
    .map((opt, idx) => {
      let cls = "option";
      if (selected === idx) cls += " selected";
      return `<button class="${cls}" type="button" data-opt="${idx}">${escapeHtml(opt)}</button>`;
    })
    .join("");

  return shell(`
    <button class="back" type="button" data-act="dash">← Dashboard</button>
    <div class="quiz-card">
      <div class="kicker">${kind === "pre" ? "Pre-test" : "Post-test"} · ${escapeHtml(algo.name)}</div>
      <div class="q-count">Question ${i + 1} of ${questions.length}</div>
      <div class="progress"><span style="width:${((i) / questions.length) * 100}%"></span></div>
      <h2>${escapeHtml(q.q)}</h2>
      <div class="options">${options}</div>
      <div class="footer-actions">
        <button class="btn-secondary" type="button" data-act="prev-q" ${i === 0 ? "disabled" : ""}>Previous</button>
        <button class="btn" type="button" data-act="next-q" ${selected == null ? "disabled" : ""}>
          ${i === questions.length - 1 ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  `);
}

function viewStudy() {
  const algo = currentAlgo();
  const r = rec();
  const tabs = [
    ["learn", "Explanation"],
    ["pseudo", "Pseudocode"],
    ["complex", "Complexity"],
    ["visualize", "Visualization"]
  ]
    .map(
      ([id, label]) =>
        `<button class="tab ${state.tab === id ? "active" : ""}" type="button" data-tab="${id}">${label}</button>`
    )
    .join("");

  let body = "";
  if (state.tab === "learn") {
    body = `<p>${escapeHtml(algo.explanation).replace(/\n\n/g, "</p><p>")}</p>
            <p class="note">${escapeHtml(algo.extra)}</p>`;
  } else if (state.tab === "pseudo") {
    body = `<pre>${escapeHtml(algo.pseudocode)}</pre>`;
  } else if (state.tab === "complex") {
    body = `
      <div class="complexity">
        <div class="comp-box"><span>Best time</span><strong>${escapeHtml(algo.time.best)}</strong></div>
        <div class="comp-box"><span>Average time</span><strong>${escapeHtml(algo.time.average)}</strong></div>
        <div class="comp-box"><span>Worst time</span><strong>${escapeHtml(algo.time.worst)}</strong></div>
        <div class="comp-box"><span>Space</span><strong>${escapeHtml(algo.space)}</strong></div>
      </div>
      <p class="note" style="margin-top:16px">${escapeHtml(algo.extra)}</p>
    `;
  } else {
    body = `
      <div class="viz-toolbar">
        <button class="btn-secondary" type="button" data-viz="new">New data</button>
        <button class="btn-secondary" type="button" data-viz="prev">Step back</button>
        <button class="btn" type="button" data-viz="play">${state.viz.playing ? "Pause" : "Play"}</button>
        <button class="btn-secondary" type="button" data-viz="next">Step forward</button>
        <button class="btn-secondary" type="button" data-viz="reset">Reset</button>
        ${
          algo.id === "binary"
            ? `<label style="margin:0">Target
                <input id="viz-target" type="text" style="width:88px;display:inline-block;padding:8px 10px" />
               </label>
               <button class="btn-secondary" type="button" data-viz="set-target">Search</button>`
            : ""
        }
      </div>
      <div id="viz-stage" class="viz-stage"></div>
      <div class="legend">
        <span><i class="dot" style="background:#b45309"></i> Compare</span>
        <span><i class="dot" style="background:#9f2d2d"></i> Write / swap</span>
        <span><i class="dot" style="background:#1d6b45"></i> Sorted</span>
        <span><i class="dot" style="background:#1e4d7b"></i> Mid (binary search)</span>
      </div>
    `;
  }

  return shell(`
    <button class="back" type="button" data-act="dash">← Dashboard</button>
    <div class="kicker">${escapeHtml(algo.topic)}</div>
    <h2>${escapeHtml(algo.name)}</h2>
    <p class="meta">Pre-test ${r.preTestScore}/${r.preTestMax}${
      r.postTestDone ? ` · Last post-test ${r.postTestScore}/${r.postTestMax}` : ""
    }</p>
    <div class="tabs">${tabs}</div>
    <div class="panel">${body}</div>
    <div class="footer-actions">
      <button class="btn" type="button" data-act="start-post">Take post-test</button>
    </div>
  `);
}

function viewRecords() {
  const rows = Storage.all();
  const body = rows.length
    ? rows
        .map(
          (r) => `<tr>
            <td>${escapeHtml(r.studentId)}</td>
            <td>${escapeHtml(r.algorithmName)}</td>
            <td>${r.preTestScore == null ? "—" : `${r.preTestScore}/${r.preTestMax}`}</td>
            <td>${r.postTestScore == null ? "—" : `${r.postTestScore}/${r.postTestMax}`}</td>
            <td>${formatDuration(r.timeSpentMs)}</td>
            <td>${r.numberOfAttempts}</td>
          </tr>`
        )
        .join("")
    : "";
  return shell(`
    <button class="back" type="button" data-act="dash">← Dashboard</button>
    <div class="section-head">
      <div>
        <div class="kicker">Instructor / student records</div>
        <h2>Collected data</h2>
        <p class="lead">Automatically stored: Student ID, Algorithm Name, Pre-Test Score, Post-Test Score, Time Spent, Number of Attempts.</p>
      </div>
    </div>
    <div class="table-wrap">
      ${
        rows.length
          ? `<table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Algorithm Name</th>
                  <th>Pre-Test Score</th>
                  <th>Post-Test Score</th>
                  <th>Time Spent</th>
                  <th>Number of Attempts</th>
                </tr>
              </thead>
              <tbody>${body}</tbody>
            </table>`
          : `<div class="empty">No records yet. Complete a pre-test to create the first row.</div>`
      }
    </div>
    <div class="footer-actions">
      <button class="btn" type="button" data-act="export" ${rows.length ? "" : "disabled"}>Export CSV</button>
      <button class="btn-danger" type="button" data-act="clear">Clear all records</button>
    </div>
  `);
}

function bind() {
  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = document.getElementById("sid").value.trim();
    if (!/^[A-Za-z0-9_-]{2,32}$/.test(raw)) {
      alert("Use 2–32 characters: letters, numbers, hyphen, or underscore.");
      return;
    }
    Storage.setStudentId(raw);
    navigate("dashboard");
  });

  app.querySelectorAll("[data-act]").forEach((el) => {
    el.addEventListener("click", () => onAct(el.getAttribute("data-act")));
  });
  app.querySelectorAll("[data-open]").forEach((el) => {
    el.addEventListener("click", () => openAlgo(el.getAttribute("data-open")));
  });
  app.querySelectorAll("[data-tab]").forEach((el) => {
    el.addEventListener("click", () => {
      state.tab = el.getAttribute("data-tab");
      state.viz.playing = false;
      clearVizTimer();
      render();
    });
  });
  app.querySelectorAll("[data-opt]").forEach((el) => {
    el.addEventListener("click", () => {
      state.answers[state.quizIndex] = Number(el.getAttribute("data-opt"));
      render();
    });
  });
  app.querySelectorAll("[data-viz]").forEach((el) => {
    el.addEventListener("click", () => onViz(el.getAttribute("data-viz")));
  });
}

function openAlgo(id) {
  state.algoId = id;
  state.tab = "learn";
  clearVizTimer();
  state.viz = { steps: [], i: 0, playing: false, timer: null, target: null, data: [] };
  const sid = Storage.getStudentId();
  const algo = ALGORITHMS.find((a) => a.id === id);
  const r = Storage.ensure(sid, id, algo.name);
  if (!r.preTestDone) startQuiz("pre");
  else navigate("study");
}

function startQuiz(kind) {
  const algo = currentAlgo();
  const questions = kind === "pre" ? algo.preTest : algo.postTest;
  state.quizKind = kind;
  state.quizIndex = 0;
  state.answers = Array(questions.length).fill(null);
  state.showResult = false;
  state.lastScore = null;
  navigate(kind === "pre" ? "pretest" : "posttest");
}

function submitQuiz() {
  const algo = currentAlgo();
  const kind = state.screen === "pretest" ? "pre" : "post";
  const questions = kind === "pre" ? algo.preTest : algo.postTest;
  if (state.answers.some((a) => a == null)) {
    alert("Answer every question before submitting.");
    return;
  }
  let score = 0;
  questions.forEach((q, i) => {
    if (state.answers[i] === q.a) score += 1;
  });
  flushTimer();
  const sid = Storage.getStudentId();
  const prev = Storage.find(sid, algo.id) || Storage.blank(sid, algo.id, algo.name);
  if (kind === "pre") {
    Storage.write({
      ...prev,
      studentId: sid,
      algorithmId: algo.id,
      algorithmName: algo.name,
      preTestScore: score,
      preTestMax: questions.length,
      preTestDone: true
    });
  } else {
    const tries = (prev.numberOfAttempts || 0) + 1;
    Storage.write({
      ...prev,
      studentId: sid,
      algorithmId: algo.id,
      algorithmName: algo.name,
      postTestScore: score,
      postTestMax: questions.length,
      postTestDone: true,
      numberOfAttempts: tries,
      attempts: tries
    });
  }
  state.lastScore = score;
  state.showResult = true;
  render();
}

function onAct(act) {
  if (act === "logout") {
    stopTimer();
    Storage.clearSession();
    navigate("login");
  } else if (act === "dash") navigate("dashboard");
  else if (act === "records") {
    if (canViewRecords()) navigate("records");
  }
  else if (act === "study") navigate("study", { tab: state.tab || "learn" });
  else if (act === "start-post") startQuiz("post");
  else if (act === "retake-post") startQuiz("post");
  else if (act === "next-q") {
    const algo = currentAlgo();
    const questions = state.screen === "pretest" ? algo.preTest : algo.postTest;
    if (state.quizIndex >= questions.length - 1) submitQuiz();
    else {
      state.quizIndex += 1;
      render();
    }
  } else if (act === "prev-q") {
    state.quizIndex = Math.max(0, state.quizIndex - 1);
    render();
  } else if (act === "export") {
    if (canViewRecords()) downloadCsv();
  } else if (act === "clear") {
    if (!canViewRecords()) return;
    if (confirm("Delete every saved record on this browser?")) {
      Storage.saveAll([]);
      render();
    }
  }
}

function downloadCsv() {
  const csv = Storage.exportCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "algorithm-learning-records.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function initVizData() {
  const algo = currentAlgo();
  if (algo.id === "binary") {
    state.viz.data = Viz.uniqueSorted(12, 4, 90);
    state.viz.target =
      state.viz.data[Math.floor(Math.random() * state.viz.data.length)];
    state.viz.steps = binarySteps(state.viz.data, state.viz.target);
  } else if (algo.id === "merge") {
    state.viz.data = Viz.randomArray(8, 5, 40);
    state.viz.steps = mergeSteps(state.viz.data);
  } else {
    state.viz.data = Viz.randomArray(8, 5, 40);
    state.viz.steps = bubbleSteps(state.viz.data);
  }
  state.viz.i = 0;
}

function mountViz() {
  if (!state.viz.steps.length) initVizData();
  const stage = document.getElementById("viz-stage");
  if (!stage) return;
  const step = state.viz.steps[state.viz.i];
  renderBars(stage, step, Math.max(...state.viz.data, 1));
  const t = document.getElementById("viz-target");
  if (t) t.value = String(state.viz.target ?? "");
}

function clearVizTimer() {
  if (state.viz.timer) {
    clearInterval(state.viz.timer);
    state.viz.timer = null;
  }
}

function onViz(cmd) {
  const algo = currentAlgo();
  if (cmd === "new") {
    clearVizTimer();
    state.viz.playing = false;
    initVizData();
    render();
  } else if (cmd === "reset") {
    clearVizTimer();
    state.viz.playing = false;
    state.viz.i = 0;
    render();
  } else if (cmd === "next") {
    state.viz.i = Math.min(state.viz.steps.length - 1, state.viz.i + 1);
    if (state.viz.i === state.viz.steps.length - 1) {
      state.viz.playing = false;
      clearVizTimer();
    }
    render();
  } else if (cmd === "prev") {
    state.viz.i = Math.max(0, state.viz.i - 1);
    render();
  } else if (cmd === "play") {
    if (state.viz.playing) {
      state.viz.playing = false;
      clearVizTimer();
      render();
      return;
    }
    state.viz.playing = true;
    render();
    clearVizTimer();
    state.viz.timer = setInterval(() => {
      if (state.viz.i >= state.viz.steps.length - 1) {
        state.viz.playing = false;
        clearVizTimer();
        render();
        return;
      }
      state.viz.i += 1;
      const stage = document.getElementById("viz-stage");
      if (stage) renderBars(stage, state.viz.steps[state.viz.i], Math.max(...state.viz.data, 1));
      const playBtn = app.querySelector('[data-viz="play"]');
      if (playBtn) playBtn.textContent = "Pause";
    }, 750);
  } else if (cmd === "set-target") {
    const raw = document.getElementById("viz-target")?.value.trim();
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      alert("Enter a numeric target.");
      return;
    }
    state.viz.target = n;
    state.viz.steps = binarySteps(state.viz.data, n);
    state.viz.i = 0;
    state.viz.playing = false;
    clearVizTimer();
    render();
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

window.addEventListener("beforeunload", flushTimer);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) flushTimer();
  else if (trackingScreen()) lastTick = Date.now();
});

render();
