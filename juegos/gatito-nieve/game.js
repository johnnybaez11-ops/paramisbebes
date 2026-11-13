(() => {
'use strict';

/* ---------- Canvas ---------- */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('n');
const hintEl = document.getElementById('hint');
const startEl = document.getElementById('start');
const muteBtn = document.getElementById('mute');

let W = 0, H = 0, S = 1, GY = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  S = Math.min(W / 100, H / 90);
  GY = H * 0.8;
}
window.addEventListener('resize', resize);
resize();

/* ---------- Estado ---------- */
let started = false;
let score = 0;
let time = 0;
let laughT = 0;   // tiempo restante de risa
let splatT = 0;   // nieve en la cara
let firstThrow = false;

const balls = [];
const parts = [];
const flakes = Array.from({ length: 90 }, () => ({
  x: Math.random(), y: Math.random(),
  r: 0.5 + Math.random() * 1.2,
  v: 0.03 + Math.random() * 0.05,
  ph: Math.random() * 6.28
}));
const bgStars = Array.from({ length: 45 }, (_, i) => ({
  x: (i * 0.6180339 % 1), y: ((i * 0.3819 + 0.11) % 1) * 0.5, ph: i
}));

const cat = { x: 0, y: 0 };

/* ---------- Audio (todo sintetizado, sin archivos) ---------- */
let ac = null, master, musicGain, sfx, noiseBuffer;
let musicOn = true;
let timer = null;

function initAudio() {
  if (ac) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain();
  master.gain.value = 0.9;
  master.connect(ac.destination);
  musicGain = ac.createGain();
  musicGain.gain.value = musicOn ? 0.22 : 0;
  musicGain.connect(master);
  sfx = ac.createGain();
  sfx.gain.value = 1;
  sfx.connect(master);
  noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate);
  const d = noiseBuffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

// Jingle Bells (dominio público) — [nota MIDI, pulsos]
const melody = [
  [64,1],[64,1],[64,2],[64,1],[64,1],[64,2],
  [64,1],[67,1],[60,1.5],[62,.5],[64,4],
  [65,1],[65,1],[65,1.5],[65,.5],[65,1],[64,1],[64,1],[64,.5],[64,.5],[62,1],[62,1],[64,1],[62,2],[67,2],
  [64,1],[64,1],[64,2],[64,1],[64,1],[64,2],
  [64,1],[67,1],[60,1.5],[62,.5],[64,4],
  [65,1],[65,1],[65,1.5],[65,.5],[65,1],[64,1],[64,1],[64,.5],[64,.5],[67,1],[67,1],[65,1],[62,1],[60,4],
  [0,2]
];
const BEAT = 0.46;
let ni = 0, nextT = 0;

function playNote(m, t, d) {
  const f = 440 * Math.pow(2, (m - 69) / 12);
  const len = Math.max(d, 0.3);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.9, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  g.connect(musicGain);
  const o1 = ac.createOscillator();
  o1.type = 'triangle';
  o1.frequency.value = f;
  o1.connect(g);
  o1.start(t); o1.stop(t + len + 0.05);
  const o2 = ac.createOscillator();
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.25, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o2.type = 'sine';
  o2.frequency.value = f * 2;
  o2.connect(g2); g2.connect(musicGain);
  o2.start(t); o2.stop(t + 0.4);
  // campanita brillante
  const o3 = ac.createOscillator();
  const g3 = ac.createGain();
  g3.gain.setValueAtTime(0.12, t);
  g3.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o3.type = 'sine';
  o3.frequency.value = f * 4;
  o3.connect(g3); g3.connect(musicGain);
  o3.start(t); o3.stop(t + 0.2);
}

function schedule() {
  if (!ac || ac.state !== 'running') return;
  if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
  while (nextT < ac.currentTime + 0.6) {
    const [m, b] = melody[ni];
    if (m > 0) playNote(m, nextT, b * BEAT);
    nextT += b * BEAT;
    ni = (ni + 1) % melody.length;
  }
}

function startMusic() {
  if (!ac || timer) return;
  timer = setInterval(schedule, 100);
  schedule();
}

function bp(freq, q) {
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function noiseHit(t, type, f0, f1, dur, vol) {
  const s = ac.createBufferSource();
  s.buffer = noiseBuffer;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfx);
  s.start(t); s.stop(t + dur + 0.05);
}

function sndThrow() {
  if (!ac) return;
  noiseHit(ac.currentTime, 'bandpass', 500, 2200, 0.25, 0.35);
}

function sndMiss() {
  if (!ac) return;
  noiseHit(ac.currentTime, 'lowpass', 1500, 250, 0.2, 0.45);
}

function sndHit() {
  if (!ac) return;
  const t = ac.currentTime;
  noiseHit(t, 'lowpass', 2500, 300, 0.22, 0.8);
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.15);
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(g); g.connect(sfx);
  o.start(t); o.stop(t + 0.2);
}

function sndLaugh() {
  if (!ac) return;
  const t0 = ac.currentTime + 0.12;
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t = t0 + i * 0.17;
    const base = 640 - i * 30;
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(base * 1.18, t);
    o.frequency.exponentialRampToValueAtTime(base * 0.82, t + 0.14);
    const f1 = bp(900, 5), f2 = bp(2400, 7);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1.3, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(f1); o.connect(f2);
    f1.connect(g); f2.connect(g);
    g.connect(sfx);
    o.start(t); o.stop(t + 0.18);
    noiseHit(t, 'highpass', 3000, 3500, 0.05, 0.12); // "j" de jaja
  }
  // final tipo "miau" contento
  const t = t0 + n * 0.17;
  const o = ac.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(520, t);
  o.frequency.linearRampToValueAtTime(900, t + 0.14);
  o.frequency.linearRampToValueAtTime(560, t + 0.45);
  const f1 = bp(1000, 5), f2 = bp(2600, 7);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(1.4, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o.connect(f1); o.connect(f2);
  f1.connect(g); f2.connect(g);
  g.connect(sfx);
  o.start(t); o.stop(t + 0.55);
}

muteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  musicOn = !musicOn;
  muteBtn.textContent = musicOn ? '🔔' : '🔇';
  if (musicGain) musicGain.gain.value = musicOn ? 0.22 : 0;
});
muteBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

document.addEventListener('visibilitychange', () => {
  if (!ac) return;
  if (document.hidden) ac.suspend(); else ac.resume();
});

/* ---------- Partículas ---------- */
const COLORS = ['#ffeb3b', '#ff5252', '#40c4ff', '#69f0ae', '#ff80ab', '#fff'];

function burst(x, y, n, stars) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (10 + Math.random() * 30) * S;
    parts.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 15 * S,
      life: 0.7 + Math.random() * 0.6,
      max: 1.3,
      c: stars ? COLORS[(Math.random() * COLORS.length) | 0] : '#fff',
      size: (stars ? 2.4 : 1.6) * S * (0.6 + Math.random() * 0.7),
      star: stars,
      rot: Math.random() * 6
    });
  }
}

function drawStar(x, y, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

/* ---------- Lanzar bola de nieve ---------- */
function throwBall(tx, ty) {
  const sx = W / 2 + (tx - W / 2) * 0.35;
  balls.push({ sx, sy: H + 6 * S, tx, ty, p: 0, dur: 0.42 });
  sndThrow();
  if (!firstThrow) {
    firstThrow = true;
    hintEl.style.display = 'none';
  }
}

function catCenter() {
  return { x: cat.x, y: cat.y - 28 * S };
}

function landBall(b) {
  const c = catCenter();
  const d = Math.hypot(b.tx - c.x, b.ty - c.y);
  if (d < 30 * S) {
    // ¡Le dio! (zona muy generosa para manitas pequeñas)
    score++;
    scoreEl.textContent = score;
    laughT = 1.9;
    splatT = 2.2;
    burst(b.tx, b.ty, 26, true);
    burst(b.tx, b.ty, 14, false);
    sndHit();
    sndLaugh();
  } else {
    burst(b.tx, b.ty, 12, false);
    sndMiss();
  }
}

canvas.addEventListener('pointerdown', (e) => {
  if (!started) return;
  e.preventDefault();
  throwBall(e.clientX, e.clientY);
});

/* ---------- Dibujo ---------- */
function ell(x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackground(t) {
  const g = ctx.createLinearGradient(0, 0, 0, GY);
  g.addColorStop(0, '#0b1d4a');
  g.addColorStop(1, '#3b5fa8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // estrellas
  ctx.fillStyle = '#fff';
  for (const s of bgStars) {
    ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + s.ph));
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, 0.35 * S, 0, 6.3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // luna
  const mx = W * 0.82, my = H * 0.16;
  const mg = ctx.createRadialGradient(mx, my, 2 * S, mx, my, 14 * S);
  mg.addColorStop(0, 'rgba(255,250,210,0.5)');
  mg.addColorStop(1, 'rgba(255,250,210,0)');
  ctx.fillStyle = mg;
  ctx.fillRect(mx - 15 * S, my - 15 * S, 30 * S, 30 * S);
  ell(mx, my, 6.5 * S, 6.5 * S, '#fff8d6');

  // colinas lejanas
  ell(W * 0.2, GY, W * 0.4, 9 * S, '#8fa8d8');
  ell(W * 0.75, GY + S, W * 0.5, 11 * S, '#a7bde6');
}

function tree(x, by, h, t, seed) {
  const w = h * 0.62;
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x - h * 0.05, by - h * 0.12, h * 0.1, h * 0.12);
  const pal = ['#ff5252', '#ffeb3b', '#40c4ff', '#ff80ab'];
  let topY = by;
  for (let i = 0; i < 3; i++) {
    const ty = by - h * 0.1 - i * h * 0.27;
    const tw = w * (1 - i * 0.26);
    const th = h * 0.42;
    ctx.fillStyle = i % 2 ? '#2e7d32' : '#1b5e20';
    ctx.beginPath();
    ctx.moveTo(x, ty - th);
    ctx.lineTo(x + tw / 2, ty);
    ctx.lineTo(x - tw / 2, ty);
    ctx.closePath();
    ctx.fill();
    topY = ty - th;
    for (let j = 0; j < 3; j++) {
      const lx = x + (j - 1) * tw * 0.28;
      const ly = ty - th * (j === 1 ? 0.45 : 0.12);
      ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 3 + i * 2 + j * 1.3 + seed));
      ell(lx, ly, h * 0.03, h * 0.03, pal[(i + j + seed) % 4]);
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#ffd600';
  drawStar(x, topY, h * 0.07, t * 0.5);
}

function drawGround() {
  ctx.fillStyle = '#eef4ff';
  ctx.fillRect(0, GY + 2 * S, W, H - GY);
  const bumps = [0.1, 0.35, 0.6, 0.85];
  for (let i = 0; i < bumps.length; i++) {
    ell(W * bumps[i], GY + 3 * S, W * 0.28, 5 * S, '#f8fbff');
  }
  ell(W * 0.5, H, W * 0.8, (H - GY) * 0.5, '#dde8fb');
}

function drawCat(t) {
  const x = cat.x, y = cat.y;
  const laughing = laughT > 0;
  const bob = laughing ? -Math.abs(Math.sin(t * 16)) * 3 * S : Math.sin(t * 2) * 0.4 * S;
  const shake = laughing ? Math.sin(t * 40) * 0.8 * S : 0;

  ctx.save();
  ctx.translate(x + shake, y + bob);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const orange = '#ff9f43', dark = '#e67e22', cream = '#fff3e0';

  // cola
  ctx.strokeStyle = orange;
  ctx.lineWidth = 5 * S;
  ctx.beginPath();
  ctx.moveTo(10 * S, -8 * S);
  ctx.quadraticCurveTo(28 * S, -8 * S + Math.sin(t * 4) * 5 * S, 22 * S, -30 * S + Math.sin(t * 4) * 6 * S);
  ctx.stroke();

  // cuerpo
  ell(0, -14 * S, 15 * S, 16 * S, orange);
  ell(0, -12 * S, 9 * S, 11 * S, cream);
  // patitas
  ell(-8 * S, -1 * S, 6.5 * S, 3.8 * S, cream);
  ell(8 * S, -1 * S, 6.5 * S, 3.8 * S, cream);
  // rayas del cuerpo
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.6 * S;
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.moveTo(i * 14 * S, -20 * S); ctx.lineTo(i * 10 * S, -19 * S);
    ctx.moveTo(i * 14.5 * S, -14 * S); ctx.lineTo(i * 10.5 * S, -14 * S);
    ctx.stroke();
  }

  // cabeza
  const hy = -38 * S;
  // orejas
  for (let i = -1; i <= 1; i += 2) {
    ctx.fillStyle = orange;
    ctx.beginPath();
    ctx.moveTo(i * 4 * S, hy - 9 * S);
    ctx.lineTo(i * 14 * S, hy - 20 * S);
    ctx.lineTo(i * 13 * S, hy - 3 * S);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffab91';
    ctx.beginPath();
    ctx.moveTo(i * 7 * S, hy - 9 * S);
    ctx.lineTo(i * 12 * S, hy - 15 * S);
    ctx.lineTo(i * 11.5 * S, hy - 6 * S);
    ctx.closePath();
    ctx.fill();
  }
  ell(0, hy, 14 * S, 12.5 * S, orange);
  // rayitas de la frente
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.6 * S;
  ctx.beginPath();
  ctx.moveTo(0, hy - 12 * S); ctx.lineTo(0, hy - 7 * S);
  ctx.moveTo(-4 * S, hy - 11.5 * S); ctx.lineTo(-3 * S, hy - 7.5 * S);
  ctx.moveTo(4 * S, hy - 11.5 * S); ctx.lineTo(3 * S, hy - 7.5 * S);
  ctx.stroke();

  // mejillas
  ctx.globalAlpha = 0.6;
  ell(-9 * S, hy + 3 * S, 3 * S, 2 * S, '#ff8a80');
  ell(9 * S, hy + 3 * S, 3 * S, 2 * S, '#ff8a80');
  ctx.globalAlpha = 1;

  // ojos
  if (laughing) {
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.8 * S;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.arc(i * 6 * S, hy - 1 * S, 2.8 * S, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  } else {
    for (let i = -1; i <= 1; i += 2) {
      ell(i * 6 * S, hy - 1 * S, 3.2 * S, 3.8 * S, '#fff');
      ell(i * 6 * S, hy - 0.5 * S, 2 * S, 2.8 * S, '#2d1b0e');
      ell(i * 6 * S + 0.7 * S, hy - 1.5 * S, 0.8 * S, 0.8 * S, '#fff');
    }
  }

  // nariz
  ctx.fillStyle = '#ff6f91';
  ctx.beginPath();
  ctx.moveTo(-2 * S, hy + 3 * S);
  ctx.lineTo(2 * S, hy + 3 * S);
  ctx.lineTo(0, hy + 5 * S);
  ctx.closePath();
  ctx.fill();

  // boca
  if (laughing) {
    const open = 2.8 + Math.abs(Math.sin(t * 16)) * 2;
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, hy + 8 * S, 4.2 * S, open * S, 0, 0, Math.PI * 2);
    ctx.fill();
    ell(0, hy + (8 + open * 0.5) * S, 2.4 * S, open * 0.45 * S, '#ff8a9b');
  } else {
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.2 * S;
    ctx.beginPath();
    ctx.moveTo(0, hy + 5 * S); ctx.lineTo(0, hy + 6.5 * S);
    ctx.moveTo(-3.5 * S, hy + 7 * S);
    ctx.quadraticCurveTo(-1.7 * S, hy + 8.5 * S, 0, hy + 6.5 * S);
    ctx.quadraticCurveTo(1.7 * S, hy + 8.5 * S, 3.5 * S, hy + 7 * S);
    ctx.stroke();
  }

  // bigotes
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 0.9 * S;
  for (let i = -1; i <= 1; i += 2) {
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      ctx.moveTo(i * 8 * S, hy + (4 + k * 1.5) * S);
      ctx.lineTo(i * 18 * S, hy + (2 + k * 4) * S);
      ctx.stroke();
    }
  }

  // gorro de Navidad
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.moveTo(-11 * S, hy - 9 * S);
  ctx.quadraticCurveTo(-4 * S, hy - 26 * S, 9 * S, hy - 24 * S + Math.sin(t * 3) * S);
  ctx.quadraticCurveTo(8 * S, hy - 14 * S, 11 * S, hy - 9 * S);
  ctx.closePath();
  ctx.fill();
  ell(0, hy - 9.5 * S, 12.5 * S, 2.8 * S, '#fff');
  ell(9 * S, hy - 24 * S + Math.sin(t * 3) * S, 3 * S, 3 * S, '#fff');

  // nieve en la carita
  if (splatT > 0) {
    ctx.globalAlpha = Math.min(1, splatT);
    ell(-5 * S, hy - 3 * S, 4.5 * S, 3.6 * S, '#fff');
    ell(3 * S, hy + 1 * S, 3.6 * S, 3 * S, '#f4f8ff');
    ell(7 * S, hy - 5 * S, 2.4 * S, 2 * S, '#fff');
    ell(-9 * S, hy + 2 * S, 2 * S, 1.8 * S, '#f4f8ff');
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // "¡Ja ja ja!"
  if (laughing) {
    ctx.save();
    ctx.font = `800 ${8 * S}px "Trebuchet MS", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 1.6 * S;
    ctx.strokeStyle = '#c62828';
    ctx.fillStyle = '#fff';
    const ty = y - 66 * S - Math.abs(Math.sin(t * 8)) * 3 * S;
    ctx.strokeText('¡Ja ja ja!', x, ty);
    ctx.fillText('¡Ja ja ja!', x, ty);
    ctx.restore();
  }
}

function drawBall(b) {
  const p = b.p;
  const e = 1 - Math.pow(1 - p, 2);
  const x = b.sx + (b.tx - b.sx) * e;
  const y = b.sy + (b.ty - b.sy) * e - Math.sin(Math.PI * p) * 10 * S;
  const r = (5.5 - 3 * p) * S;
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.arc(x + 0.5 * S, y + 0.7 * S, r, 0, 6.3); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#fff');
  g.addColorStop(1, '#bcd4f5');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
}

function drawSnow(t) {
  ctx.fillStyle = '#fff';
  for (const f of flakes) {
    const x = (f.x + Math.sin(t * 0.6 + f.ph) * 0.02) * W;
    const y = f.y * H;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(x, y, f.r * S * 0.55, 0, 6.3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ---------- Bucle ---------- */
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;

  // gato se pasea despacito
  cat.x = W / 2 + Math.sin(time * 0.5) * W * 0.24;
  cat.y = GY + 4 * S;

  if (laughT > 0) laughT -= dt;
  if (splatT > 0) splatT -= dt;

  for (const f of flakes) {
    f.y += f.v * dt;
    if (f.y > 1) { f.y = 0; f.x = Math.random(); }
  }

  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    b.p += dt / b.dur;
    if (b.p >= 1) {
      landBall(b);
      balls.splice(i, 1);
    }
  }

  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.vy += 60 * S * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += dt * 4;
  }

  drawBackground(time);
  tree(W * 0.09, GY + 2 * S, 42 * S, time, 0);
  tree(W * 0.91, GY + 2 * S, 42 * S, time, 2);
  drawGround();
  drawCat(time);
  drawSnow(time);
  for (const b of balls) drawBall(b);
  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.5));
    ctx.fillStyle = p.c;
    if (p.star) drawStar(p.x, p.y, p.size, p.rot);
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.3); ctx.fill(); }
  }
  ctx.globalAlpha = 1;

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- Inicio ---------- */
function begin(e) {
  if (e) e.preventDefault();
  if (started) return;
  started = true;
  initAudio();
  if (ac && ac.state === 'suspended') ac.resume();
  startMusic();
  startEl.style.display = 'none';
  hintEl.style.display = 'block';
}
document.getElementById('play').addEventListener('click', begin);
startEl.addEventListener('click', begin);
})();
