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
  focusPlant: document.querySelector("#focusPlant"),
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
  elements.focusPlant.style.setProperty("--growth", plantGrowth.toFixed(2));
  elements.focusPlant.style.setProperty("--fruit", fruitGrowth.toFixed(2));
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

hydrate();
render();
