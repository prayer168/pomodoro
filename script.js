const MODES = {
  focus: { label: "專注時間", minutesKey: "focusMinutes" },
  short: { label: "短休息", minutesKey: "shortMinutes" },
  long: { label: "長休息", minutesKey: "longMinutes" }
};

const STORAGE_KEY = "work-pomodoro-state-v1";
const TODAY_KEY = getLocalDateKey();

const elements = {
  body: document.body,
  timeReadout: document.querySelector("#timeReadout"),
  phaseLabel: document.querySelector("#phaseLabel"),
  progressValue: document.querySelector("#progressValue"),
  oakSvgMount: document.querySelector("#oakSvgMount"),
  oakSvg: null,
  forestPatch: document.querySelector("#forestPatch"),
  startPause: document.querySelector("#startPause"),
  resetTimer: document.querySelector("#resetTimer"),
  skipTimer: document.querySelector("#skipTimer"),
  themeToggle: document.querySelector("#themeToggle"),
  currentTask: document.querySelector("#currentTask"),
  todayCount: document.querySelector("#todayCount"),
  clearToday: document.querySelector("#clearToday"),
  focusMinutes: document.querySelector("#focusMinutes"),
  shortMinutes: document.querySelector("#shortMinutes"),
  longMinutes: document.querySelector("#longMinutes"),
  soundToggle: document.querySelector("#soundToggle"),
  notifyToggle: document.querySelector("#notifyToggle"),
  modeTabs: document.querySelectorAll(".mode-tab")
};

const state = {
  mode: "focus",
  isRunning: false,
  intervalId: null,
  endAt: 0,
  remainingSeconds: 25 * 60,
  focusCompletedInCycle: 0,
  todayCount: 0,
  theme: "light"
};

function readStoredState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function saveState() {
  const payload = {
    task: elements.currentTask.value,
    todayKey: TODAY_KEY,
    todayCount: state.todayCount,
    focusCompletedInCycle: state.focusCompletedInCycle,
    theme: state.theme,
    settings: {
      focusMinutes: elements.focusMinutes.value,
      shortMinutes: elements.shortMinutes.value,
      longMinutes: elements.longMinutes.value,
      sound: elements.soundToggle.checked,
      notify: elements.notifyToggle.checked
    }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function getModeSeconds(mode = state.mode) {
  const minutesInput = elements[MODES[mode].minutesKey];
  const minutes = Math.max(1, Number.parseInt(minutesInput.value, 10) || 1);
  return minutes * 60;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function svgElement(name, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function appendSvg(parent, name, attrs = {}) {
  const node = svgElement(name, attrs);
  parent.appendChild(node);
  return node;
}

function createAcorn(parent, x, y, scale) {
  const acorn = appendSvg(parent, "g", {
    class: "svg-acorn",
    transform: `translate(${x} ${y}) scale(${scale})`
  });
  appendSvg(acorn, "path", {
    class: "svg-acorn-body",
    d: "M0 8 C-10 10 -15 20 -12 31 C-9 43 0 50 10 42 C19 34 19 17 10 10 C7 8 4 7 0 8Z"
  });
  appendSvg(acorn, "path", {
    class: "svg-acorn-cap",
    d: "M-14 9 C-8 -2 7 -4 16 5 C11 12 -5 14 -14 9Z"
  });
  appendSvg(acorn, "path", {
    class: "svg-acorn-stem",
    d: "M4 -2 C8 -8 12 -10 17 -12"
  });
}

function buildOakSvg() {
  const svg = svgElement("svg", {
    class: "oak-svg",
    viewBox: "0 0 430 320",
    role: "img",
    "aria-label": "專注橡樹會隨時間長大並結出橡實"
  });

  appendSvg(svg, "rect", { class: "svg-sky", width: "430", height: "320", rx: "18" });
  appendSvg(svg, "circle", { class: "svg-sun", cx: "342", cy: "62", r: "26" });
  appendSvg(svg, "ellipse", { class: "svg-cloud", cx: "92", cy: "62", rx: "34", ry: "12" });
  appendSvg(svg, "ellipse", { class: "svg-cloud", cx: "280", cy: "118", rx: "24", ry: "9" });
  appendSvg(svg, "ellipse", { class: "svg-ground", cx: "215", cy: "300", rx: "255", ry: "74" });

  const oak = appendSvg(svg, "g", { class: "svg-oak" });
  appendSvg(oak, "path", {
    class: "svg-trunk",
    d: "M199 248 C199 210 203 176 212 140 C221 176 231 211 231 248Z"
  });
  appendSvg(oak, "path", {
    class: "svg-trunk-line",
    d: "M214 238 C214 202 217 174 224 150"
  });
  appendSvg(oak, "ellipse", { class: "svg-leaf-dark", cx: "178", cy: "124", rx: "78", ry: "66" });
  appendSvg(oak, "ellipse", { class: "svg-leaf", cx: "230", cy: "102", rx: "86", ry: "78" });
  appendSvg(oak, "ellipse", { class: "svg-leaf-hi", cx: "276", cy: "136", rx: "70", ry: "58" });
  appendSvg(oak, "ellipse", { class: "svg-leaf", cx: "216", cy: "158", rx: "98", ry: "70" });
  createAcorn(oak, 174, 132, 0.7);
  createAcorn(oak, 243, 118, 0.8);
  createAcorn(oak, 222, 170, 0.72);

  elements.oakSvgMount.replaceChildren(svg);
  elements.oakSvg = svg;
}

function render() {
  const duration = getModeSeconds();
  const elapsed = duration - state.remainingSeconds;
  const progress = duration > 0 ? Math.min(Math.max(elapsed / duration, 0), 1) : 0;
  const plantGrowth = state.mode === "focus" ? progress : 1;
  const fruitGrowth = state.mode === "focus" ? Math.min(Math.max((progress - 0.85) / 0.15, 0), 1) : 1;
  elements.timeReadout.textContent = formatTime(state.remainingSeconds);
  elements.phaseLabel.textContent = MODES[state.mode].label;
  elements.startPause.textContent = state.isRunning ? "守著橡樹" : state.mode === "focus" ? "種下專注橡樹" : "開始休息";
  elements.todayCount.textContent = state.todayCount;
  elements.progressValue.style.width = `${Math.round(progress * 100)}%`;
  elements.oakSvg.style.setProperty("--growth", plantGrowth.toFixed(2));
  elements.oakSvg.style.setProperty("--fruit", fruitGrowth.toFixed(2));
  elements.body.classList.toggle("rest-mode", state.mode !== "focus");
  elements.body.classList.toggle("dark", state.theme === "dark");

  elements.modeTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });

  renderForestPatch();
  document.title = `${formatTime(state.remainingSeconds)} | ${MODES[state.mode].label}`;
}

function renderForestPatch() {
  const treeCount = Math.min(state.todayCount, 24);
  elements.forestPatch.innerHTML = "";

  for (let index = 0; index < treeCount; index += 1) {
    const tree = document.createElement("span");
    tree.className = "mini-tree";
    tree.title = `第 ${index + 1} 棵專注橡樹`;
    elements.forestPatch.appendChild(tree);
  }
}

function switchMode(mode) {
  stopTimer();
  state.mode = mode;
  state.remainingSeconds = getModeSeconds(mode);
  render();
  saveState();
}

function stopTimer() {
  state.isRunning = false;
  clearInterval(state.intervalId);
  state.intervalId = null;
}

function startTimer() {
  state.isRunning = true;
  state.endAt = Date.now() + state.remainingSeconds * 1000;
  state.intervalId = window.setInterval(tick, 250);
  render();
}

function tick() {
  state.remainingSeconds = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
  render();

  if (state.remainingSeconds === 0) {
    advanceSegment();
  }
}

function advanceSegment(countFocusCompletion = true) {
  stopTimer();

  if (state.mode === "focus") {
    if (countFocusCompletion) {
      state.todayCount += 1;
      state.focusCompletedInCycle += 1;
    }
    state.mode = countFocusCompletion && state.focusCompletedInCycle % 4 === 0 ? "long" : "short";
  } else {
    state.mode = "focus";
  }

  state.remainingSeconds = getModeSeconds();
  notifyDone();
  render();
  saveState();
}

function notifyDone() {
  if (elements.soundToggle.checked) {
    playChime();
  }

  if (elements.notifyToggle.checked && "Notification" in window && Notification.permission === "granted") {
    const nextLabel = MODES[state.mode].label;
    new Notification("番茄鐘完成", { body: `下一段：${nextLabel}` });
  }
}

function playChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.55);
  gain.connect(context.destination);

  [660, 880].forEach((frequency, index) => {
    const osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;
    osc.connect(gain);
    osc.start(context.currentTime + index * 0.13);
    osc.stop(context.currentTime + 0.5 + index * 0.13);
  });
}

function requestNotificationPermission() {
  if (!elements.notifyToggle.checked || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().then(saveState);
  }
}

function hydrate() {
  const stored = readStoredState();
  const settings = stored.settings || {};
  elements.currentTask.value = stored.task || "";
  elements.focusMinutes.value = settings.focusMinutes || 25;
  elements.shortMinutes.value = settings.shortMinutes || 5;
  elements.longMinutes.value = settings.longMinutes || 15;
  elements.soundToggle.checked = settings.sound !== false;
  elements.notifyToggle.checked = Boolean(settings.notify);
  state.theme = stored.theme || "light";
  state.todayCount = stored.todayKey === TODAY_KEY ? Number(stored.todayCount) || 0 : 0;
  state.focusCompletedInCycle = Number(stored.focusCompletedInCycle) || 0;
  state.remainingSeconds = getModeSeconds();
}

elements.startPause.addEventListener("click", () => {
  if (state.isRunning) {
    stopTimer();
  } else {
    startTimer();
  }
  render();
  saveState();
});

elements.resetTimer.addEventListener("click", () => {
  stopTimer();
  state.remainingSeconds = getModeSeconds();
  render();
  saveState();
});

elements.skipTimer.addEventListener("click", () => advanceSegment(false));

elements.themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  render();
  saveState();
});

elements.clearToday.addEventListener("click", () => {
  state.todayCount = 0;
  state.focusCompletedInCycle = 0;
  render();
  saveState();
});

elements.modeTabs.forEach((button) => {
  button.addEventListener("click", () => switchMode(button.dataset.mode));
});

[elements.focusMinutes, elements.shortMinutes, elements.longMinutes].forEach((input) => {
  input.addEventListener("change", () => {
    input.value = Math.min(Number(input.max), Math.max(Number(input.min), Number(input.value) || Number(input.min)));
    if (!state.isRunning) {
      state.remainingSeconds = getModeSeconds();
    }
    render();
    saveState();
  });
});

elements.currentTask.addEventListener("input", saveState);
elements.soundToggle.addEventListener("change", saveState);
elements.notifyToggle.addEventListener("change", requestNotificationPermission);
elements.notifyToggle.addEventListener("change", saveState);

buildOakSvg();
hydrate();
render();
