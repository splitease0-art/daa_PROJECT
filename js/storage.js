const STORE_KEY = "daa_project_records_v2";
const SESSION_KEY = "daa_project_student";
const LAST_ID_KEY = "daa_project_last_student";

const Storage = {
  getStudentId() {
    return sessionStorage.getItem(SESSION_KEY) || "";
  },
  lastId() {
    return localStorage.getItem(LAST_ID_KEY) || "";
  },
  setStudentId(id) {
    sessionStorage.setItem(SESSION_KEY, id);
    localStorage.setItem(LAST_ID_KEY, id);
  },
  clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  },
  all() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      return Array.isArray(raw) ? raw.map(normalizeRecord) : [];
    } catch {
      return [];
    }
  },
  blank(studentId, algorithmId, algorithmName) {
    return blankRecord(studentId, algorithmId, algorithmName);
  },
  upsert(partial) {
    return this.write(partial);
  },
  saveAll(rows) {
    localStorage.setItem(STORE_KEY, JSON.stringify(rows.map(normalizeRecord)));
  },
  find(studentId, algorithmId) {
    return this.all().find(
      (r) => r.studentId === studentId && r.algorithmId === algorithmId
    );
  },
  ensure(studentId, algorithmId, algorithmName) {
    const existing = this.find(studentId, algorithmId);
    if (existing) return existing;
    return this.write({
      studentId,
      algorithmId,
      algorithmName,
      preTestScore: null,
      postTestScore: null,
      timeSpentMs: 0,
      numberOfAttempts: 0
    });
  },
  write(partial) {
    const rows = this.all();
    const i = rows.findIndex(
      (r) => r.studentId === partial.studentId && r.algorithmId === partial.algorithmId
    );
    const prev = i >= 0 ? rows[i] : blankRecord(partial.studentId, partial.algorithmId, partial.algorithmName);
    const next = normalizeRecord({ ...prev, ...partial, lastUpdated: new Date().toISOString() });
    if (i >= 0) rows[i] = next;
    else rows.push(next);
    this.saveAll(rows);
    return next;
  },
  addTime(studentId, algorithmId, ms) {
    if (!studentId || !algorithmId || ms == null || ms <= 0) return;
    const rec = this.find(studentId, algorithmId);
    if (!rec) return;
    this.write({ ...rec, timeSpentMs: rec.timeSpentMs + ms });
  },
  exportCsv() {
    const header = [
      "Student ID",
      "Algorithm Name",
      "Pre-Test Score",
      "Post-Test Score",
      "Time Spent",
      "Number of Attempts"
    ];
    const lines = [header.join(",")];
    for (const r of this.all()) {
      lines.push(
        [
          csvCell(r.studentId),
          csvCell(r.algorithmName),
          csvCell(scoreCell(r.preTestScore, r.preTestMax)),
          csvCell(scoreCell(r.postTestScore, r.postTestMax)),
          csvCell(formatDuration(r.timeSpentMs)),
          csvCell(r.numberOfAttempts)
        ].join(",")
      );
    }
    return "\uFEFF" + lines.join("\r\n");
  }
};

function blankRecord(studentId, algorithmId, algorithmName) {
  return normalizeRecord({
    studentId,
    algorithmId,
    algorithmName,
    preTestScore: null,
    postTestScore: null,
    timeSpentMs: 0,
    numberOfAttempts: 0
  });
}

function normalizeRecord(r) {
  const attempts = Number(r.numberOfAttempts ?? r.attempts ?? 0) || 0;
  return {
    studentId: String(r.studentId || ""),
    algorithmId: String(r.algorithmId || ""),
    algorithmName: String(r.algorithmName || ""),
    preTestScore: r.preTestScore == null || r.preTestScore === "" ? null : Number(r.preTestScore),
    preTestMax: Number(r.preTestMax || 5),
    postTestScore: r.postTestScore == null || r.postTestScore === "" ? null : Number(r.postTestScore),
    postTestMax: Number(r.postTestMax || 5),
    timeSpentMs: Number(r.timeSpentMs || 0),
    numberOfAttempts: attempts,
    attempts,
    preTestDone: Boolean(r.preTestDone) || r.preTestScore != null,
    postTestDone: Boolean(r.postTestDone) || r.postTestScore != null,
    lastUpdated: r.lastUpdated || new Date().toISOString()
  };
}

function scoreCell(score, max) {
  if (score == null) return "";
  return `${score}/${max || 5}`;
}

function csvCell(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatDuration(ms) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
