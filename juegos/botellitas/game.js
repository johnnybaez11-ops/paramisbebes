const COLORS = [
  { id: "red", symbol: "❤️", label: "roja", stream: "#ff626d" },
  { id: "blue", symbol: "⭐", label: "azul", stream: "#4caaf5" },
  { id: "yellow", symbol: "☀️", label: "amarilla", stream: "#ffc844" },
  { id: "green", symbol: "🍀", label: "verde", stream: "#45bd78" },
  { id: "purple", symbol: "🍇", label: "morada", stream: "#a276e8" },
  { id: "orange", symbol: "🍊", label: "naranja", stream: "#ff9848" },
];
const CAPACITY = 3;
const POUR_DURATION = 560;

const targetsElement = document.querySelector("#targets");
const sourcesElement = document.querySelector("#sources");
const playArea = document.querySelector("#play-area");
const pourEffect = document.querySelector("#pour-effect");
const matchGuide = document.querySelector("#match-guide");
const messageElement = document.querySelector("#message");
const celebration = document.querySelector("#celebration");
const praiseElement = document.querySelector("#praise");
const nextLevelButton = document.querySelector("#next-level-button");
const levelLabel = document.querySelector("#level-label");
const helpButton = document.querySelector("#help-button");
const resetButton = document.querySelector("#reset-button");
const musicButton = document.querySelector("#music-button");

let bottles = [];
let targetFill = {};
let selectedBottle = null;
let isPouring = false;
let level = 1;
let activeColors = [];
let audioContext = null;
let musicTimer = null;
let musicNoteIndex = 0;
let musicEnabled = false;

const MUSIC_NOTES = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 880, 698.46,
  523.25, 659.25, 783.99, 1046.5,
  880, 783.99, 659.25, 587.33,
];

function colorInfo(id) {
  return COLORS.find((color) => color.id === id);
}

function playMusicNote(frequency, startTime, duration, volume) {
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(volume, startTime + 0.035);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(envelope);
  envelope.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playNextMusicNote() {
  if (!audioContext || audioContext.state !== "running") return;

  const now = audioContext.currentTime;
  const frequency = MUSIC_NOTES[musicNoteIndex % MUSIC_NOTES.length];
  playMusicNote(frequency, now, 0.38, 0.035);

  if (musicNoteIndex % 4 === 0) {
    const bassNote = frequency / 2;
    playMusicNote(bassNote, now, 0.58, 0.012);
  }

  musicNoteIndex += 1;
}

async function setMusicEnabled(enabled) {
  const AudioContextConstructor =
    window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    messageElement.textContent = "La música no está disponible en este navegador.";
    return;
  }

  if (enabled) {
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContextConstructor();
    }

    await audioContext.resume();
    musicEnabled = true;
    musicButton.textContent = "🎶";
    musicButton.setAttribute("aria-label", "Pausar música");
    musicButton.setAttribute("aria-pressed", "true");
    playNextMusicNote();
    musicTimer = window.setInterval(playNextMusicNote, 480);
    return;
  }

  musicEnabled = false;
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  musicButton.textContent = "🎵";
  musicButton.setAttribute("aria-label", "Activar música");
  musicButton.setAttribute("aria-pressed", "false");
  if (audioContext && audioContext.state === "running") {
    await audioContext.suspend();
  }
}

function shuffledColors() {
  const colors = activeColors.flatMap((color) => Array(CAPACITY).fill(color.id));
  for (let index = colors.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [colors[index], colors[swapIndex]] = [colors[swapIndex], colors[index]];
  }
  return colors;
}

function makeBottles() {
  let contents;
  do {
    const colors = shuffledColors();
    contents = activeColors.map((_, index) =>
      colors.slice(index * CAPACITY, (index + 1) * CAPACITY),
    );
  } while (contents.some((bottle) => bottle.every((color) => color === bottle[0])));
  return contents;
}

function getLiquidRuns(contents) {
  const runs = [];
  for (const color of contents) {
    const previous = runs[runs.length - 1];
    if (previous?.color === color) previous.amount += 1;
    else runs.push({ color, amount: 1 });
  }
  return runs;
}

function makeBottle({ contents, targetColor, index }) {
  const card = document.createElement("div");
  card.className = "bottle-card";

  const vessel = document.createElement("button");
  vessel.type = "button";
  vessel.className = `pour-bottle ${targetColor ? "target-bottle" : "source-bottle"}`;
  vessel.dataset.index = String(index);

  const neck = document.createElement("span");
  neck.className = "bottle-neck";
  neck.setAttribute("aria-hidden", "true");

  const body = document.createElement("span");
  body.className = "bottle-body";

  if (targetColor) {
    vessel.dataset.color = targetColor.id;
    vessel.setAttribute("aria-label", `Botellita ${targetColor.label}, vacía`);

    const mark = document.createElement("span");
    mark.className = `target-mark mark-${targetColor.id}`;
    mark.textContent = targetColor.symbol;
    mark.setAttribute("aria-hidden", "true");

    const liquid = document.createElement("span");
    liquid.className = `target-liquid color-${targetColor.id}`;
    liquid.style.height = `${(targetFill[targetColor.id] / CAPACITY) * 100}%`;
    liquid.setAttribute("aria-hidden", "true");

    if (targetFill[targetColor.id] > 0) vessel.classList.add("filled");
    if (selectedBottle !== null) vessel.classList.add("ready");
    vessel.addEventListener("click", () => pourInto(index));
    body.append(liquid, mark);
  } else {
    vessel.setAttribute("aria-label", "Botellita con líquido de varios colores");
    if (selectedBottle === index) vessel.classList.add("selected");

    let bottom = 0;
    getLiquidRuns(contents).forEach((run, runIndex, runs) => {
      const liquid = document.createElement("span");
      liquid.className = `liquid-layer color-${run.color}`;
      liquid.style.bottom = `${(bottom / CAPACITY) * 100}%`;
      liquid.style.height = `${(run.amount / CAPACITY) * 100}%`;
      if (runIndex === runs.length - 1) liquid.classList.add("top-layer");
      liquid.setAttribute("aria-hidden", "true");
      body.append(liquid);
      bottom += run.amount;
    });

    vessel.addEventListener("click", () => selectBottle(index));
  }

  vessel.append(neck, body);
  card.append(vessel);
  return card;
}

function render() {
  targetsElement.replaceChildren();
  sourcesElement.replaceChildren();
  matchGuide.replaceChildren();

  activeColors.forEach((color, index) => {
    targetsElement.append(makeBottle({ targetColor: color, index }));
    const dot = document.createElement("span");
    dot.className = "guide-dot";
    matchGuide.append(dot);
  });
  bottles.forEach((contents, index) => {
    sourcesElement.append(makeBottle({ contents, index }));
  });

  levelLabel.textContent = `${"⭐".repeat(Math.min(level, 5))} ${level}`;
  levelLabel.setAttribute("aria-label", `Nivel ${level}`);
  pourEffect.replaceChildren();
  pourEffect.setAttribute(
    "viewBox",
    `0 0 ${playArea.clientWidth} ${playArea.clientHeight}`,
  );
}

function selectBottle(index) {
  if (isPouring || bottles[index].length === 0) return;

  if (selectedBottle === index) {
    selectedBottle = null;
  } else {
    selectedBottle = index;
    const color = colorInfo(bottles[index][bottles[index].length - 1]);
    messageElement.textContent = `Vertiendo líquido ${color.label}.`;
  }

  render();
}

function drawPour(sourceIndex, targetIndex, color) {
  const source = sourcesElement.querySelector(`[data-index="${sourceIndex}"]`);
  const target = targetsElement.querySelector(`[data-index="${targetIndex}"]`);
  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const areaRect = playArea.getBoundingClientRect();
  const poursRight = targetRect.left > sourceRect.left;
  source.classList.add("pouring", poursRight ? "pour-right" : "pour-left");

  const startX =
    sourceRect.left +
    sourceRect.width / 2 +
    (poursRight ? 14 : -14) -
    areaRect.left;
  const startY = sourceRect.top - areaRect.top + 17;
  const endX = targetRect.left + targetRect.width / 2 - areaRect.left;
  const targetFillLevel = targetFill[color.id] / CAPACITY;
  const endY =
    targetRect.bottom -
    areaRect.top -
    17 -
    (targetRect.height - 17) * targetFillLevel;
  const curveY = Math.min(startY, endY) - 48;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    `M ${startX} ${startY} Q ${(startX + endX) / 2} ${curveY} ${endX} ${endY}`,
  );
  path.setAttribute("pathLength", "1");
  path.setAttribute("stroke", color.stream);
  path.classList.add("pour-stream");
  pourEffect.append(path);

  return new Promise((resolve) => {
    window.setTimeout(resolve, POUR_DURATION);
  });
}

async function pourInto(targetIndex) {
  if (isPouring) return;
  if (selectedBottle === null) {
    messageElement.textContent = "Primero toca una botellita con líquido.";
    return;
  }

  const contents = bottles[selectedBottle];
  if (!contents.length) return;

  const colorId = contents[contents.length - 1];
  const color = colorInfo(colorId);
  const targetColor = COLORS[targetIndex];
  const availableSpace = CAPACITY - targetFill[targetColor.id];

  if (targetColor.id !== colorId || availableSpace === 0) {
    const target = targetsElement.querySelector(`[data-index="${targetIndex}"]`);
    target.classList.remove("wrong");
    void target.offsetWidth;
    target.classList.add("wrong");
    messageElement.textContent = "Busca la botellita del mismo color.";
    return;
  }

  const runs = getLiquidRuns(contents);
  const runSize = runs[runs.length - 1].amount;
  const amount = Math.min(runSize, availableSpace);
  isPouring = true;
  targetsElement.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  sourcesElement.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });

  await drawPour(selectedBottle, targetIndex, color);

  bottles[selectedBottle].splice(-amount);
  targetFill[color.id] += amount;
  selectedBottle = null;
  isPouring = false;

  const complete = activeColors.every(
    (item) => targetFill[item.id] === CAPACITY,
  );
  if (complete) {
    celebration.classList.add("visible");
    celebration.setAttribute("aria-hidden", "false");
    nextLevelButton.disabled = false;
    praiseElement.textContent = [
      "¡Muy bien!",
      "¡Lo hiciste genial!",
      "¡Qué campeón!",
      "¡Eres increíble!",
      "¡Bravo, lo lograste!",
    ][(level - 1) % 5];
    messageElement.textContent = `Nivel ${level} completado. ${praiseElement.textContent}`;
    nextLevelButton.focus();
  } else {
    messageElement.textContent = `¡Muy bien! El líquido ${color.label} está en su lugar.`;
  }

  render();
}

function showHint() {
  if (isPouring) return;

  let sourceIndex = selectedBottle;
  if (sourceIndex === null || bottles[sourceIndex].length === 0) {
    sourceIndex = bottles.findIndex((bottle) => bottle.length > 0);
  }

  if (sourceIndex < 0) return;

  selectedBottle = sourceIndex;
  const color = colorInfo(bottles[sourceIndex][bottles[sourceIndex].length - 1]);
  render();

  const target = targetsElement.querySelector(`[data-color="${color.id}"]`);
  target.classList.add("hint");
  window.setTimeout(() => target.classList.remove("hint"), 1400);
  messageElement.textContent = `El líquido ${color.label} va con su mismo color.`;
}

function resetGame() {
  activeColors = COLORS.slice(0, Math.min(level + 1, COLORS.length));
  bottles = makeBottles();
  targetFill = Object.fromEntries(activeColors.map((color) => [color.id, 0]));
  selectedBottle = null;
  isPouring = false;
  celebration.classList.remove("visible");
  celebration.setAttribute("aria-hidden", "true");
  nextLevelButton.disabled = true;
  messageElement.textContent = "Juego nuevo.";
  render();
}

function startNextLevel() {
  level += 1;
  celebration.classList.remove("visible");
  celebration.setAttribute("aria-hidden", "true");
  resetGame();
  window.setTimeout(() => sourcesElement.querySelector("button")?.focus(), 0);
}

musicButton.addEventListener("click", async () => {
  await setMusicEnabled(!musicEnabled);
});
helpButton.addEventListener("click", showHint);
resetButton.addEventListener("click", resetGame);
nextLevelButton.addEventListener("click", startNextLevel);
window.addEventListener("resize", render);

resetGame();
