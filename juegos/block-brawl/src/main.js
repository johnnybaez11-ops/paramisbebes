import * as THREE from 'three';

const shell = document.querySelector('#game-shell');
const sceneRoot = document.querySelector('#scene');
const labelsRoot = document.querySelector('#world-labels');
const bossHud = document.querySelector('#boss-hud');
const bossHudName = document.querySelector('#boss-hud-name');
const bossHudFill = document.querySelector('#boss-hud-fill');
const bossHudHealth = document.querySelector('#boss-hud-health');
const message = document.querySelector('#center-message');
const startButton = document.querySelector('#start-button');
const fullscreenButton = document.querySelector('#fullscreen-button');
const playerLevel = document.querySelector('#player-level');
const shopModal = document.querySelector('#shop-modal');
const shopCoins = document.querySelector('#shop-coins');
const shopFeedback = document.querySelector('#shop-feedback');
const shieldStatus = document.querySelector('#shield-status');
const playerTwoShieldStatus = document.querySelector('#player-two-shield-status');
const playerHealthFill = document.querySelector('#player-health-fill');
const playerHealthText = document.querySelector('#player-health-text');
const koCount = document.querySelector('#ko-count');
const comboCount = document.querySelector('#combo-count');
const comboHits = document.querySelector('#combo-hits');
const weaponName = document.querySelector('#weapon-name');
const weaponIcon = document.querySelector('#weapon-icon');
const weaponRank = document.querySelector('#weapon-rank');
const playerTwoPanel = document.querySelector('#player-two-panel');
const playerTwoHealthFill = document.querySelector('#player-two-health-fill');
const playerTwoHealthText = document.querySelector('#player-two-health-text');
const playerTwoStatus = document.querySelector('#player-two-status');
const playerTwoCombo = document.querySelector('#player-two-combo b');
const playerTwoToggle = document.querySelector('#player-two-toggle');
const playerTwoControls = document.querySelector('#player-two-controls');
const callout = document.querySelector('#combat-callout');
const waveToast = document.querySelector('#wave-toast');
const toast = document.querySelector('#toast');
const gamepadStatus = document.querySelector('#gamepad-status');
const coinCount = document.querySelector('#coin-count');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
sceneRoot.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a5dcf3');
scene.fog = new THREE.Fog('#a5dcf3', 37, 90);
const camera = new THREE.PerspectiveCamera(47, 1, 0.1, 130);
const clock = new THREE.Clock();
const arenaBounds = 20;
const jumpHeight = 1.5;
const keys = new Set();
const activeTouches = new Set();
let touchMoveX = 0;
let touchMoveY = 0;
const previousGamepadButtons = new Set();
const enemies = [];
const fighters = [];
const labels = new Map();
const temporaryObjects = [];
const projectiles = [];
const dragonFireballs = [];
const acidPuddles = [];
const lavaImpacts = [];
const chests = [];
const companionMagic = { name: 'MAGIA FELINA', icon: '✦', kind: 'projectile', damage: 26, range: 32, cooldown: 1.35, speed: 21, splash: 0, color: '#b86cff' };
const weaponStages = [
  { name: 'PALO', icon: '╱', kind: 'melee', damage: 22, range: 3.5, cooldown: 0.48, speed: 0, splash: 0, color: '#9a6146' },
  { name: 'BATE', icon: '⚾', kind: 'melee', damage: 30, range: 4.2, cooldown: 0.52, speed: 0, splash: 0, color: '#b57645' },
  { name: 'ESPADA', icon: '⚔', kind: 'melee', damage: 42, range: 4.5, cooldown: 0.46, speed: 0, splash: 0, color: '#d9e6e2' },
  { name: 'PISTOLA', icon: '▪', kind: 'projectile', damage: 34, range: 24, cooldown: 0.48, speed: 28, splash: 0, color: '#526f80' },
  { name: 'RIFLE', icon: '▪', kind: 'projectile', damage: 48, range: 34, cooldown: 0.62, speed: 38, splash: 0, color: '#4f6959' },
  { name: 'BAZUCA', icon: '✹', kind: 'projectile', damage: 72, range: 38, cooldown: 0.95, speed: 20, splash: 5.5, color: '#e27c4e' },
  { name: 'MARTILLO', icon: '⬟', kind: 'melee', damage: 64, range: 4.8, cooldown: 0.82, speed: 0, splash: 0, color: '#687d83' },
  { name: 'LANZADOR LÁSER', icon: '✦', kind: 'projectile', damage: 58, range: 42, cooldown: 0.72, speed: 48, splash: 1.8, color: '#58d9d0' },
  { name: 'ARCO', icon: 'A', kind: 'projectile', damage: 64, range: 46, cooldown: 0.48, speed: 54, splash: 0, color: '#93633f' },
];
let started = false;
let shopPaused = false;
let playerHealth = 100;
let knockouts = 0;
let combo = 0;
let comboTimer = 0;
let wave = 1;
let level = 1;
let coins = 0;
let chestSpawnTimer = 25;
let bossesDefeated = 0;
let bossesSinceCompanion = 0;
let companion = null;
let companionLabel = null;
let shopkeeper = null;
let shopkeeperLabel = null;
let spawnTimer = 0;
let toastTimer = 0;
let attackCooldown = 0;
let hurtFlash = 0;
let blockActive = false;
let soundEnabled = true;
let audioContext;
let cameraYaw = 0;
let cameraPitch = 0.5;
let mouseLookActive = false;
let lookPointerId = null;
let lookPointerX = 0;
let lookPointerY = 0;
let gamepadIndex = null;
let gamepadId = null;
let gamepadMoveX = 0;
let gamepadMoveY = 0;
let gamepadBlockActive = false;
let equippedWeaponIndex = -1;
let maxWeaponUnlocked = -1;
let activePlayers = 1;

const mats = {
  grass: new THREE.MeshStandardMaterial({ color: '#83c986', roughness: 1 }),
  sand: new THREE.MeshStandardMaterial({ color: '#edcf8a', roughness: 1 }),
  cream: new THREE.MeshStandardMaterial({ color: '#fff1cb', roughness: 0.85 }),
  wood: new THREE.MeshStandardMaterial({ color: '#9a6146', roughness: 1 }),
  darkWood: new THREE.MeshStandardMaterial({ color: '#64483d', roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ color: '#c3d2c0', roughness: 1 }),
  yellow: new THREE.MeshStandardMaterial({ color: '#ffd259', roughness: 0.8 }),
};

scene.add(new THREE.HemisphereLight('#effffb', '#719f72', 2.15));
const sun = new THREE.DirectionalLight('#fff4d4', 3.1);
sun.position.set(-16, 28, 13);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -32;
sun.shadow.camera.right = 32;
sun.shadow.camera.top = 32;
sun.shadow.camera.bottom = -32;
sun.shadow.bias = -0.0004;
scene.add(sun);

function box(parent, size, material, position, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = castShadow;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, top, bottom, height, material, position, segments = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeArena() {
  for (const [radius, material, y] of [[30, mats.grass, -0.35], [22, mats.sand, -0.3], [5.4, new THREE.MeshStandardMaterial({ color: '#f5dfa8', roughness: 1 }), -0.27]]) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), material);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = y;
    disc.receiveShadow = true;
    scene.add(disc);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.35, 0.09, 5, 56), new THREE.MeshStandardMaterial({ color: '#f1a35c', roughness: 0.85 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.18;
  scene.add(ring);

  for (let i = 0; i < 42; i++) {
    const angle = i * 2.4;
    const distance = 6.1 + (i % 5) * 2.8;
    const tile = box(scene, [0.7 + (i % 3) * 0.35, 0.025, 0.7], i % 4 ? mats.sand : mats.stone, [Math.cos(angle) * distance, -0.26, Math.sin(angle) * distance], false);
    tile.rotation.y = angle;
  }
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = Math.cos(angle) * 21.2;
    const z = Math.sin(angle) * 21.2;
    const post = box(scene, [0.22, 2.3, 0.22], mats.wood, [x, 0.8, z]);
    post.rotation.y = -angle;
    box(scene, [0.25, 0.19, 0.25], mats.yellow, [x, 2.04, z]);
    const rail = box(scene, [2, 0.14, 0.18], mats.cream, [Math.cos(angle + 0.16) * 21.1, 0.45, Math.sin(angle + 0.16) * 21.1]);
    rail.rotation.y = -angle;
    if (i % 2 === 0) {
      const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.6, 4), new THREE.MeshStandardMaterial({ color: i % 4 === 0 ? '#f26b54' : '#58c9b7' }));
      pennant.position.set(x, 2.8, z);
      pennant.rotation.y = angle;
      scene.add(pennant);
    }
  }
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + 0.1;
    const distance = 28 + (i % 3) * 2;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const trunkHeight = 1.8 + (i % 4) * 0.25;
    cylinder(scene, 0.26, 0.36, trunkHeight, mats.wood, [x, trunkHeight / 2 - 0.2, z], 6);
    const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(1.65 + (i % 3) * 0.2, 0), new THREE.MeshStandardMaterial({ color: ['#44ab8a', '#78c97d', '#3e9784'][i % 3], roughness: 1, flatShading: true }));
    canopy.position.set(x, trunkHeight + 1, z);
    canopy.scale.y = 1.15;
    canopy.castShadow = true;
    scene.add(canopy);
    if (i % 3 === 0) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), mats.stone);
      rock.position.set(x + Math.cos(angle + 1) * 2.2, 0.15, z + Math.sin(angle + 1) * 2.2);
      rock.scale.set(1.4, 0.7, 1);
      rock.castShadow = true;
      scene.add(rock);
    }
  }
  const sign = new THREE.Group();
  sign.position.set(-13, 0, -19);
  sign.rotation.y = -0.35;
  box(sign, [4.6, 1.25, 0.22], mats.wood, [0, 4.1, 0]);
  box(sign, [4.1, 0.78, 0.08], mats.yellow, [0, 4.15, 0.14]);
  cylinder(sign, 0.14, 0.14, 3.9, mats.darkWood, [-1.7, 1.95, 0], 6);
  cylinder(sign, 0.14, 0.14, 3.9, mats.darkWood, [1.7, 1.95, 0], 6);
  scene.add(sign);
}

function disposeObject3D(object) {
  const geometries = new Set();
  const materials = new Set();
  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    if (Array.isArray(child.material)) child.material.forEach((material) => materials.add(material));
    else if (child.material) materials.add(child.material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
function createFighter({ player = false, color = '#ed805b', accent = '#f7d26e', name = 'RIVAL' } = {}) {
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  root.add(pivot);
  const skin = new THREE.MeshStandardMaterial({ color: player ? '#f6c99d' : '#d9a77d', roughness: 0.83 });
  const shirt = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const trim = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.8 });
  const pants = new THREE.MeshStandardMaterial({ color: player ? '#344c68' : '#384c45', roughness: 0.95 });
  const shoe = new THREE.MeshStandardMaterial({ color: '#f7efe0', roughness: 0.9 });
  const eye = new THREE.MeshStandardMaterial({ color: '#203b43', roughness: 0.6 });
  box(pivot, [0.9, 0.82, 0.48], shirt, [0, 1.55, 0]);
  box(pivot, [0.96, 0.16, 0.52], trim, [0, 1.25, 0]);
  box(pivot, [0.63, 0.65, 0.58], skin, [0, 2.32, 0]);
  box(pivot, [0.69, 0.19, 0.62], player ? new THREE.MeshStandardMaterial({ color: '#252f46' }) : trim, [0, 2.68, 0]);
  box(pivot, [0.11, 0.11, 0.035], eye, [-0.16, 2.36, 0.3]);
  box(pivot, [0.11, 0.11, 0.035], eye, [0.16, 2.36, 0.3]);
  box(pivot, [0.07, 0.035, 0.035], new THREE.MeshStandardMaterial({ color: '#bd685a' }), [0, 2.19, 0.3]);
  const limbs = {};
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.57, 1.83, 0);
    pivot.add(arm);
    box(arm, [0.29, 0.68, 0.3], shirt, [0, -0.28, 0]);
    box(arm, [0.32, 0.28, 0.32], skin, [0, -0.67, 0.02]);
    limbs[side < 0 ? 'leftArm' : 'rightArm'] = arm;
    const leg = new THREE.Group();
    leg.position.set(side * 0.25, 1.16, 0);
    pivot.add(leg);
    box(leg, [0.33, 0.67, 0.36], pants, [0, -0.29, 0]);
    box(leg, [0.38, 0.2, 0.54], shoe, [0, -0.67, 0.09]);
    limbs[side < 0 ? 'leftLeg' : 'rightLeg'] = leg;
  }
  box(pivot, [0.1, 0.13, 0.11], trim, [-0.33, 1.95, 0.23]);
  box(pivot, [0.1, 0.13, 0.11], trim, [0.33, 1.95, 0.23]);
  root.userData = { pivot, limbs, player, name };
  return root;
}

function createWeaponModel(parent, index) {
  const weapon = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: index === 0 ? '#9a6146' : '#bb7743', roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: '#dbe6df', metalness: 0.72, roughness: 0.28 });
  const dark = new THREE.MeshStandardMaterial({ color: '#364d4a', roughness: 0.72 });
  const accent = new THREE.MeshStandardMaterial({ color: index === 5 ? '#e87943' : '#e2bd64', roughness: 0.7 });

  if (index === 0 || index === 1) {
    cylinder(weapon, index === 0 ? 0.075 : 0.055, 0.055, 1.05, wood, [0, 0, 0.52], 7).rotation.x = Math.PI / 2;
    if (index === 1) cylinder(weapon, 0.12, 0.075, 0.42, wood, [0, 0, 0.94], 8).rotation.x = Math.PI / 2;
    box(weapon, [0.14, 0.13, 0.12], accent, [0, 0, 0.04]);
  } else if (index === 2) {
    box(weapon, [0.12, 0.055, 0.83], metal, [0, 0, 0.64]);
    box(weapon, [0.39, 0.09, 0.12], accent, [0, 0, 0.17]);
    box(weapon, [0.11, 0.1, 0.29], wood, [0, 0, -0.03]);
  } else if (index === 3) {
    box(weapon, [0.2, 0.19, 0.42], dark, [0, 0.02, 0.29]);
    box(weapon, [0.08, 0.08, 0.3], metal, [0, 0.04, 0.64]);
    box(weapon, [0.12, 0.26, 0.15], wood, [0, -0.17, 0.17]);
    box(weapon, [0.23, 0.07, 0.09], accent, [0, -0.07, 0.12]);
  } else if (index === 4) {
    box(weapon, [0.24, 0.2, 0.79], dark, [0, 0, 0.35]);
    box(weapon, [0.09, 0.09, 0.66], metal, [0, 0.02, 1.04]);
    box(weapon, [0.2, 0.19, 0.32], wood, [0, 0, -0.18]);
    box(weapon, [0.13, 0.26, 0.16], dark, [0, -0.2, 0.2]);
    box(weapon, [0.19, 0.08, 0.2], accent, [0, 0.12, 0.37]);
  } else if (index === 5) {
    cylinder(weapon, 0.2, 0.2, 1.12, dark, [0, 0.04, 0.55], 10).rotation.x = Math.PI / 2;
    cylinder(weapon, 0.24, 0.24, 0.12, accent, [0, 0.04, 1.1], 10).rotation.x = Math.PI / 2;
    box(weapon, [0.26, 0.16, 0.27], wood, [0, -0.22, 0.23]);
    box(weapon, [0.44, 0.08, 0.2], accent, [0, -0.02, 0.36]);
  } else if (index === 6) {
    box(weapon, [0.68, 0.52, 0.57], dark, [0, 0.04, 0.72]);
    box(weapon, [0.78, 0.14, 0.65], metal, [0, 0.04, 0.72]);
    box(weapon, [0.16, 0.18, 0.42], wood, [0, 0.02, 0.18]);
    box(weapon, [0.84, 0.08, 0.14], accent, [0, -0.12, 0.72]);
  } else if (index === 7) {
    box(weapon, [0.33, 0.32, 0.87], dark, [0, 0.04, 0.48]);
    box(weapon, [0.14, 0.13, 0.95], metal, [0, 0.04, 1.08]);
    box(weapon, [0.4, 0.37, 0.22], accent, [0, 0.04, 0.68]);
    box(weapon, [0.12, 0.45, 0.15], metal, [0, 0.04, 0.68]);
  } else {
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.065, 6, 16, Math.PI), wood);
    bow.position.set(0, 0, 0.55);
    bow.rotation.z = Math.PI / 2;
    weapon.add(bow);
    box(weapon, [0.035, 0.95, 0.035], metal, [0, 0, 0.55]);
    box(weapon, [0.035, 0.035, 0.78], accent, [0, 0, 0.58]);
  }
  weapon.position.set(0, -0.69, 0.13);
  weapon.rotation.x = index <= 2 ? 0.08 : -0.08;
  weapon.visible = false;
  parent.add(weapon);
  return weapon;
}

function equipWeapon(index, announceUnlock = false) {
  equippedWeaponIndex = index;
  for (const fighter of fighters) {
    for (let weaponIndex = 0; weaponIndex < fighter.userData.weaponModel.length; weaponIndex++) {
      fighter.userData.weaponModel[weaponIndex].visible = weaponIndex === equippedWeaponIndex && fighter.visible;
    }
  }
  const weapon = weaponStages[equippedWeaponIndex];
  weaponName.textContent = weapon ? weapon.name : 'MANOS';
  weaponIcon.textContent = weapon ? weapon.icon : '✊';
  weaponRank.textContent = weapon ? `ARMA ${equippedWeaponIndex + 1}/${weaponStages.length}` : 'INICIAL';
  document.querySelector('#weapon-display').classList.toggle('weapon-powered', weapon?.kind === 'projectile');
  if (announceUnlock && weapon) {
    showToast(`¡ARMA NUEVA: ${weapon.name}!`);
    announce(weapon.name === 'BAZUCA' ? '¡BAZUCA!' : `¡${weapon.name}!`);
    playSound(520 + equippedWeaponIndex * 45, 0.2, 'triangle', 0.045);
  }
}

makeArena();
const player = createFighter({ player: true, color: '#339ec5', accent: '#ffd259', name: 'NOVA' });
player.position.set(0, 0, 8);
player.userData.weaponModel = weaponStages.map((_, index) => createWeaponModel(player.userData.limbs.rightArm, index));
player.userData.health = 100;
player.userData.energy = 100;
player.userData.attackCooldown = 0;
player.userData.comboStep = 0;
player.userData.comboWindow = 0;
player.userData.comboCount = 0;
player.userData.isPlayerTwo = false;
scene.add(player);
fighters.push(player);
const playerTwo = createFighter({ player: true, color: '#8b68c7', accent: '#64d3bf', name: 'PULSE' });
playerTwo.position.set(-2.5, 0, 9.2);
playerTwo.userData.weaponModel = weaponStages.map((_, index) => createWeaponModel(playerTwo.userData.limbs.rightArm, index));
playerTwo.userData.health = 100;
playerTwo.userData.energy = 100;
playerTwo.userData.attackCooldown = 0;
playerTwo.userData.comboStep = 0;
playerTwo.userData.comboWindow = 0;
playerTwo.userData.comboCount = 0;
playerTwo.userData.isPlayerTwo = true;
scene.add(playerTwo);
fighters.push(playerTwo);
playerTwo.visible = false;
playerTwoPanel.hidden = true;
equipWeapon(-1);
const botColors = [{ color: '#ed805b', accent: '#f7d26e', name: 'CRUNCH' }, { color: '#7966b7', accent: '#60d1b5', name: 'ZAP' }, { color: '#dc5e71', accent: '#f5d37c', name: 'BOLT' }];
const bossTypes = [
  { color: '#bd4f4f', accent: '#ffd15d', name: 'TITÁN', scale: 2.8, health: 360, damage: 18, speed: 1.2, flying: false },
  { color: '#557b5c', accent: '#a8d47c', name: 'GOLEM', scale: 3.05, health: 410, damage: 22, speed: 0.95, flying: false },
  { color: '#4e8296', accent: '#f4cc63', name: 'ROBOT', scale: 2.7, health: 380, damage: 20, speed: 1.4, flying: false },
  { color: '#4aaf7b', accent: '#ffd15d', name: 'DRAGÓN BLOCK', scale: 1.55, health: 520, damage: 24, speed: 1.55, flying: true },
  { color: '#72a93d', accent: '#e9c46a', name: 'SERPIENTE ÁCIDA', scale: 2.45, health: 430, damage: 18, speed: 1.25, flying: false, acid: true, kind: 'snake' },
  { color: '#9a563d', accent: '#f0c04d', name: 'ESCORPIÓN ÁCIDO', scale: 2.35, health: 450, damage: 20, speed: 1.1, flying: false, acid: true, kind: 'scorpion' },
];
const dragonPalettes = [
  { body: '#36a76f', dark: '#237b62', belly: '#f0ce70', wings: '#e97849', horn: '#f5e7b7' },
  { body: '#a94b57', dark: '#702d46', belly: '#f0b86b', wings: '#603c91', horn: '#ffe0a3' },
  { body: '#397caf', dark: '#24516e', belly: '#9de0d4', wings: '#7c55b8', horn: '#d5edff' },
  { body: '#8e63ad', dark: '#543e78', belly: '#e8d888', wings: '#d85d7c', horn: '#ffe5b8' },
];
let nextDragonPalette = 0;
let nextAcidBoss = 4;
let volcano = null;
let volcanoAttackTimer = 0;

function addBot({ boss = false, bossPreset: requestedBossPreset = null, dragonPalette = null } = {}) {
  const bossPreset = boss ? requestedBossPreset ?? bossTypes[Math.floor(Math.random() * bossTypes.length)] : null;
  const preset = bossPreset ?? botColors[(wave + enemies.length + knockouts) % botColors.length];
  const angle = Math.random() * Math.PI * 2;
  const distance = boss ? (bossPreset.flying ? 13 : 15) : 12 + Math.random() * 5;
  const model = createFighter(preset);
  if (boss) {
    model.scale.setScalar(bossPreset.scale);
    if (bossPreset.flying) {
      addDragonFeatures(model, dragonPalette);
      model.traverse((part) => {
        part.castShadow = false;
        part.receiveShadow = false;
      });
    }
    if (bossPreset.kind === 'snake') addSnakeFeatures(model, bossPreset);
    if (bossPreset.kind === 'scorpion') addScorpionFeatures(model, bossPreset);
  }
  model.position.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
  model.rotation.y = Math.atan2(player.position.x - model.position.x, player.position.z - model.position.z);
  scene.add(model);
  const label = document.createElement('div');
  label.className = boss ? 'bot-label boss-label' : 'bot-label';
  label.innerHTML = `<span>${boss ? 'JEFE · ' : ''}${preset.name}</span><span class="bot-bar"><i></i></span>`;
  labelsRoot.appendChild(label);
  const bot = {
    model,
    health: boss ? bossPreset.health : 60,
    maxHealth: boss ? bossPreset.health : 60,
    attackCooldown: boss ? 2.2 : 1.4 + Math.random(),
    hitFlash: 0,
    alive: true,
    swing: 0,
    label,
    stun: 0,
    boss,
    bossPreset,
    flying: Boolean(bossPreset?.flying),
    grabbedBy: null,
    thrown: false,
    thrownBy: null,
  };
  enemies.push(bot);
  labels.set(bot, label);
}

function addSnakeFeatures(model, preset) {
  const pivot = model.userData.pivot;
  for (const part of pivot.children) part.visible = false;
  const scales = new THREE.MeshStandardMaterial({ color: preset.color, roughness: 0.58, flatShading: true });
  const belly = new THREE.MeshStandardMaterial({ color: '#d6cf79', roughness: 0.82 });
  const eyes = new THREE.MeshStandardMaterial({ color: '#ff4c36', emissive: '#b51e12', emissiveIntensity: 1.2 });
  for (let i = 0; i < 6; i++) {
    const segment = new THREE.Mesh(new THREE.SphereGeometry(0.72 - i * 0.045, 10, 8), scales);
    segment.scale.set(1.05, 0.62, 1.05);
    segment.position.set(0, 0.48 + Math.sin(i * 0.8) * 0.12, -1.65 + i * 0.6);
    segment.castShadow = true; pivot.add(segment);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.68, 10, 8), scales);
  head.scale.set(1.05, 0.72, 1.15); head.position.set(0, 1.02, 2.05); pivot.add(head);
  box(pivot, [0.78, 0.18, 0.72], belly, [0, 0.58, 2.3]);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), eyes);
    eye.position.set(side * 0.42, 1.14, 2.45); pivot.add(eye);
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.36, 5), belly);
    fang.position.set(side * 0.23, 0.66, 2.7); fang.rotation.x = Math.PI; pivot.add(fang);
  }
}

function addScorpionFeatures(model, preset) {
  const pivot = model.userData.pivot;
  for (const part of pivot.children) part.visible = false;
  const shell = new THREE.MeshStandardMaterial({ color: preset.color, roughness: 0.48, metalness: 0.18, flatShading: true });
  const gold = new THREE.MeshStandardMaterial({ color: preset.accent, roughness: 0.5, metalness: 0.24 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), shell);
  body.scale.set(1.2, 0.65, 1.55); body.position.set(0, 0.9, 0); pivot.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.58, 10, 8), shell);
  head.scale.set(1.25, 0.7, 0.9); head.position.set(0, 0.95, 1.35); pivot.add(head);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({ color: '#ff543d', emissive: '#e21e12' }));
    eye.position.set(side * 0.42, 1.12, 1.67); pivot.add(eye);
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.85, 5), gold);
    claw.position.set(side * 1.05, 0.72, 1.6); claw.rotation.x = Math.PI / 2; claw.rotation.z = side * 0.3; pivot.add(claw);
    for (let leg = 0; leg < 3; leg++) {
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.2, 6), shell);
      limb.position.set(side * 0.82, 0.42, 0.52 - leg * 0.62); limb.rotation.z = side * 0.78; pivot.add(limb);
    }
  }
  for (let i = 0; i < 4; i++) {
    const segment = new THREE.Mesh(new THREE.SphereGeometry(0.38 - i * 0.045, 8, 6), i === 3 ? gold : shell);
    segment.position.set(0, 1.25 + Math.sin((i + 1) / 5 * Math.PI) * 0.55, -0.75 - i * 0.52); pivot.add(segment);
  }
  const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 6), gold);
  stinger.position.set(0, 1.73, -2.75); stinger.rotation.x = -0.35; pivot.add(stinger);
}

function addDragonFeatures(model, palette = dragonPalettes[0]) {
  const pivot = model.userData.pivot;
  for (const child of pivot.children) child.visible = false;
  const scales = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.72, flatShading: true });
  const darkScales = new THREE.MeshStandardMaterial({ color: palette.dark, roughness: 0.78, flatShading: true });
  const belly = new THREE.MeshStandardMaterial({ color: palette.belly, roughness: 0.9, flatShading: true });
  const wingMaterial = new THREE.MeshStandardMaterial({ color: palette.wings, roughness: 0.82, flatShading: true, side: THREE.DoubleSide });
  const horn = new THREE.MeshStandardMaterial({ color: palette.horn, roughness: 0.72 });
  const eye = new THREE.MeshStandardMaterial({ color: '#ff5148', emissive: '#ff2924', emissiveIntensity: 2 });
  box(pivot, [1.85, 1.55, 3.4], scales, [0, 1.65, -0.5]);
  box(pivot, [1.27, 1.1, 2.35], belly, [0, 1.25, 0.08]);
  box(pivot, [1.18, 1.35, 1.65], scales, [0, 2.15, 1.75]);
  box(pivot, [1.18, 0.82, 1.2], scales, [0, 2.45, 2.65]);
  box(pivot, [1.25, 0.48, 0.98], belly, [0, 2.12, 3.3]);
  box(pivot, [1.35, 0.22, 0.38], darkScales, [0, 1.87, 3.12]);
  box(pivot, [0.62, 0.12, 0.15], horn, [0, 2.0, 3.79]);
  box(pivot, [0.36, 0.2, 0.62], new THREE.MeshStandardMaterial({ color: '#ffb149', emissive: '#f25a28', emissiveIntensity: 1.2 }), [0, 2.24, 4.02]);
  for (const side of [-1, 1]) {
    box(pivot, [0.16, 0.16, 0.12], eye, [side * 0.49, 2.57, 3.04]);
    const hornMesh = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.78, 5), horn);
    hornMesh.position.set(side * 0.48, 3.08, 2.45);
    hornMesh.rotation.z = side * -0.42;
    pivot.add(hornMesh);
    const wing = new THREE.Group();
    wing.position.set(side * 0.85, 2.15, -0.85);
    const wingPanel = box(wing, [2.05, 0.16, 2.35], wingMaterial, [side * 0.98, 0, -0.24]);
    wingPanel.rotation.z = side * -0.28;
    const wingTip = box(wing, [1.2, 0.14, 1.65], scales, [side * 2.02, 0, 0.72]);
    wingTip.rotation.z = side * 0.45;
    for (let finger = 0; finger < 3; finger++) {
      const spar = box(wing, [0.11, 0.11, 2.85 - finger * 0.38], darkScales, [side * (0.38 + finger * 0.72), 0.12, -0.28 + finger * 0.35]);
      spar.rotation.x = -0.2;
    }
    pivot.add(wing);
    model.userData[`wing${side}`] = wing;
    const arm = box(pivot, [0.38, 1.02, 0.52], scales, [side * 1.02, 1.05, 0.12]);
    arm.rotation.z = side * -0.15;
    box(pivot, [0.5, 0.44, 0.64], darkScales, [side * 1.02, 0.52, 0.38]);
    box(pivot, [0.22, 0.55, 0.25], horn, [side * 1.02, 0.18, 0.62]);
  }
  for (let segment = 0; segment < 5; segment++) {
    const tailPiece = box(pivot, [1.1 - segment * 0.13, 0.96 - segment * 0.12, 0.9], segment % 2 ? scales : darkScales, [0, 1.48 - segment * 0.06, -2.05 - segment * 0.77]);
    tailPiece.rotation.x = -0.1 * segment;
  }
  for (let spike = 0; spike < 5; spike++) {
    const dorsalSpike = new THREE.Mesh(new THREE.ConeGeometry(0.32 - spike * 0.025, 0.8 - spike * 0.06, 5), horn);
    dorsalSpike.position.set(0, 2.65, 0.8 - spike * 0.72);
    dorsalSpike.rotation.x = Math.PI / 2;
    pivot.add(dorsalSpike);
  }
}

function spawnWave(count) {
  for (let i = 0; i < count; i++) addBot();
  waveToast.querySelector('b').textContent = String(wave).padStart(2, '0');
  waveToast.classList.add('visible');
  window.setTimeout(() => waveToast.classList.remove('visible'), 1600);
}
function announce(text) {
  callout.textContent = text;
  callout.classList.remove('show');
  void callout.offsetWidth;
  callout.classList.add('show');
}
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 1300);
}
function playSound(frequency, duration = 0.08, type = 'sine', volume = 0.04) {
  if (!soundEnabled) return;
  try {
    audioContext ??= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch { /* Audio is optional when the browser blocks it. */ }
}

function spawnHitEffect(position, color = '#fff1a3') {
  const geometry = new THREE.IcosahedronGeometry(0.28, 0);
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
  const spark = new THREE.Mesh(geometry, material);
  spark.position.copy(position);
  scene.add(spark);
  temporaryObjects.push({ object: spark, life: 0.28, maxLife: 0.28 });
}

function spawnHeartReward(fighter, amount) {
  if (fighter.userData.health <= 0) return;
  fighter.userData.health = Math.min(100, fighter.userData.health + amount);
  if (fighter === player) {
    playerHealth = fighter.userData.health;
    playerHealthFill.style.width = `${playerHealth}%`;
    playerHealthText.textContent = `${playerHealth} / 100`;
  } else {
    playerTwoHealthFill.style.width = `${fighter.userData.health}%`;
    playerTwoHealthText.textContent = `${fighter.userData.health} / 100`;
  }
  const heart = new THREE.Shape();
  heart.moveTo(0, -0.65);
  heart.bezierCurveTo(-0.18, -0.35, -0.9, 0.12, -0.7, 0.58);
  heart.bezierCurveTo(-0.53, 0.98, -0.08, 0.86, 0, 0.52);
  heart.bezierCurveTo(0.08, 0.86, 0.53, 0.98, 0.7, 0.58);
  heart.bezierCurveTo(0.9, 0.12, 0.18, -0.35, 0, -0.65);
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(heart), new THREE.MeshBasicMaterial({ color: '#ff5574', transparent: true, opacity: 1, side: THREE.DoubleSide }));
  mesh.position.copy(fighter.position).add(new THREE.Vector3(0, 2.9, 0));
  mesh.scale.setScalar(0.8);
  scene.add(mesh);
  temporaryObjects.push({ object: mesh, life: 1.1, maxLife: 1.1, riseSpeed: 1.15 });
}

function spawnDragonFireball(bot, target) {
  const impact = target.position.clone();
  impact.y = 0.08;
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(1.55, 1.95, 40),
    new THREE.MeshBasicMaterial({ color: '#ff4d38', transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.copy(impact);
  scene.add(marker);
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 12, 10),
    new THREE.MeshStandardMaterial({ color: '#ff612e', emissive: '#ff2b12', emissiveIntensity: 1.7, roughness: 0.35 }),
  );
  flame.position.set(impact.x, bot.model.position.y + 4.8, impact.z);
  scene.add(flame);
  dragonFireballs.push({ bot, target, impact, marker, flame, warning: 0, fallDuration: 1.35, radius: 1.9 });
  playSound(150, 0.16, 'sawtooth', 0.035);
}

function spawnAcidAttack(bot, target) {
  const impact = target.position.clone(); impact.y = 0.06;
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1.72, 32), new THREE.MeshBasicMaterial({ color: '#8df044', transparent: true, opacity: 0.78, side: THREE.DoubleSide }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.copy(impact); scene.add(mesh);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.8, 32), new THREE.MeshBasicMaterial({ color: '#d7ff63', transparent: true, opacity: 0.92, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.copy(impact).y += 0.025; scene.add(ring);
  acidPuddles.push({ bot, mesh, ring, position: impact, radius: 1.72, life: 6, hit: new Set() });
}

function updateAcidPuddles(delta) {
  for (let i = acidPuddles.length - 1; i >= 0; i--) {
    const puddle = acidPuddles[i]; puddle.life -= delta;
    puddle.mesh.material.opacity = Math.max(0, Math.min(1, puddle.life / 1.2)) * 0.78;
    puddle.ring.material.opacity = 0.55 + Math.sin(performance.now() * 0.01) * 0.25;
    const victims = [...fighters.filter((fighter) => fighter.visible && fighter.userData.health > 0)];
    if (companion?.userData.health > 0) victims.push(companion);
    for (const victim of victims) {
      if (puddle.hit.has(victim)) continue;
      if (Math.hypot(victim.position.x - puddle.position.x, victim.position.z - puddle.position.z) <= puddle.radius) {
        puddle.hit.add(victim);
        if (victim === companion) damageCompanion(10, puddle.bot);
        else damagePlayer(10, puddle.bot, victim);
      }
    }
    if (puddle.life <= 0) {
      scene.remove(puddle.mesh, puddle.ring); puddle.mesh.geometry.dispose(); puddle.mesh.material.dispose(); puddle.ring.geometry.dispose(); puddle.ring.material.dispose(); acidPuddles.splice(i, 1);
    }
  }
}

function activateVolcano() {
  if (volcano) return;
  volcano = new THREE.Group(); volcano.position.set(-12, 0, -13);
  const rock = new THREE.Mesh(new THREE.ConeGeometry(4.1, 5.4, 8), new THREE.MeshStandardMaterial({ color: '#49434c', roughness: 0.95, flatShading: true }));
  rock.position.y = 2.45; rock.rotation.y = 0.3; volcano.add(rock);
  const lava = new THREE.Mesh(new THREE.CircleGeometry(1.18, 20), new THREE.MeshStandardMaterial({ color: '#ff5a21', emissive: '#ff3211', emissiveIntensity: 2.1, side: THREE.DoubleSide }));
  lava.rotation.x = -Math.PI / 2; lava.position.set(0, 4.84, 0); volcano.add(lava);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.2, 8, 20), new THREE.MeshStandardMaterial({ color: '#e87938', emissive: '#a52a18', emissiveIntensity: 0.7 }));
  rim.rotation.x = Math.PI / 2; rim.position.set(0, 4.78, 0); volcano.add(rim);
  scene.add(volcano); volcanoAttackTimer = 2.5;
  showToast('¡NIVEL 5! EL VOLCÁN DESPIERTA'); announce('¡VOLCÁN ACTIVO!');
}

function spawnLavaImpact(target) {
  const impact = target.position.clone(); impact.y = 0.08;
  const marker = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.82, 32), new THREE.MeshBasicMaterial({ color: '#ff5429', transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
  marker.rotation.x = -Math.PI / 2; marker.position.copy(impact); scene.add(marker);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 0), new THREE.MeshStandardMaterial({ color: '#ff642d', emissive: '#e73812', emissiveIntensity: 1.4, roughness: 0.7 }));
  rock.position.copy(volcano.position).add(new THREE.Vector3(0, 5.2, 0)); scene.add(rock);
  lavaImpacts.push({ impact, marker, rock, start: rock.position.clone(), timer: 0, radius: 1.82 });
}

function updateVolcano(delta) {
  if (!volcano || !started) return;
  volcanoAttackTimer -= delta;
  if (volcanoAttackTimer <= 0) {
    volcanoAttackTimer = 3.2;
    const targets = fighters.filter((fighter) => fighter.visible && fighter.userData.health > 0);
    if (companion?.userData.health > 0) targets.push(companion);
    if (targets.length) spawnLavaImpact(targets[Math.floor(Math.random() * targets.length)]);
  }
  for (let i = lavaImpacts.length - 1; i >= 0; i--) {
    const impact = lavaImpacts[i]; impact.timer += delta;
    impact.marker.material.opacity = 0.45 + Math.sin(impact.timer * 12) * 0.4;
    const flight = Math.min(impact.timer / 1.15, 1);
    impact.rock.position.x = THREE.MathUtils.lerp(impact.start.x, impact.impact.x, flight);
    impact.rock.position.z = THREE.MathUtils.lerp(impact.start.z, impact.impact.z, flight);
    impact.rock.position.y = THREE.MathUtils.lerp(impact.start.y, 0.5, flight) + Math.sin(flight * Math.PI) * 7;
    impact.rock.rotation.x += delta * 4; impact.rock.rotation.z += delta * 3;
    if (impact.timer < 1.15) continue;
    spawnHitEffect(impact.impact.clone().add(new THREE.Vector3(0, 0.25, 0)), '#ff652f');
    const victims = [...fighters.filter((fighter) => fighter.visible && fighter.userData.health > 0)];
    if (companion?.userData.health > 0) victims.push(companion);
    for (const victim of victims) {
      if (Math.hypot(victim.position.x - impact.impact.x, victim.position.z - impact.impact.z) > impact.radius) continue;
      victim.userData.energy = Math.max(0, (victim.userData.energy ?? 100) - 20);
      updateEnergyHud(victim);
      showToast(`${victim === companion ? 'PERLA-MAGIC' : 'JUGADOR'}: -20 ENERGÍA`);
    }
    scene.remove(impact.marker, impact.rock); impact.marker.geometry.dispose(); impact.marker.material.dispose(); impact.rock.geometry.dispose(); impact.rock.material.dispose(); lavaImpacts.splice(i, 1);
  }
}

function updateDragonFireballs(delta) {
  if (!started) {
    for (const fireball of dragonFireballs) {
      scene.remove(fireball.marker, fireball.flame);
      fireball.marker.geometry.dispose();
      fireball.marker.material.dispose();
      fireball.flame.geometry.dispose();
      fireball.flame.material.dispose();
    }
    dragonFireballs.length = 0;
    return;
  }
  for (let index = dragonFireballs.length - 1; index >= 0; index--) {
    const fireball = dragonFireballs[index];
    fireball.warning += delta;
    fireball.marker.material.opacity = 0.52 + Math.sin(fireball.warning * 12) * 0.35;
    const fallProgress = THREE.MathUtils.clamp((fireball.warning - 0.48) / (fireball.fallDuration - 0.48), 0, 1);
    fireball.flame.position.set(fireball.impact.x, 7.6 * (1 - fallProgress) + 0.45, fireball.impact.z);
    fireball.flame.scale.setScalar(0.8 + Math.sin(fireball.warning * 15) * 0.15);
    if (fireball.warning < fireball.fallDuration) continue;
    spawnHitEffect(fireball.impact.clone().add(new THREE.Vector3(0, 0.3, 0)), '#ff6a36');
    const victims = [...fighters];
    if (companion?.userData.health > 0) victims.push(companion);
    for (const victim of victims) {
      if (!victim.visible || victim.userData.health <= 0) continue;
      const distance = Math.hypot(victim.position.x - fireball.impact.x, victim.position.z - fireball.impact.z);
      if (distance <= fireball.radius) {
        if (victim === companion) damageCompanion(30, fireball.bot);
        else damagePlayer(30, fireball.bot, victim);
      }
      if (!started) break;
    }
    scene.remove(fireball.marker, fireball.flame);
    fireball.marker.geometry.dispose();
    fireball.marker.material.dispose();
    fireball.flame.geometry.dispose();
    fireball.flame.material.dispose();
    dragonFireballs.splice(index, 1);
  }
}

function clearChests() {
  for (const chest of chests) {
    labelsRoot.removeChild(chest.label);
    scene.remove(chest.model);
    disposeObject3D(chest.model);
  }
  chests.length = 0;
}

function spawnChest() {
  const model = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#93552f', roughness: 0.72 });
  const darkWood = new THREE.MeshStandardMaterial({ color: '#563623', roughness: 0.82 });
  const gold = new THREE.MeshStandardMaterial({ color: '#ffd05a', metalness: 0.52, roughness: 0.32, emissive: '#7d4b08', emissiveIntensity: 0.35 });
  box(model, [1.35, 0.78, 0.92], wood, [0, 0.43, 0]);
  box(model, [1.42, 0.2, 0.98], darkWood, [0, 0.91, 0]);
  box(model, [0.18, 0.82, 0.98], gold, [0, 0.45, 0]);
  box(model, [1.4, 0.12, 0.12], gold, [0, 0.76, 0.49]);
  box(model, [0.27, 0.27, 0.08], gold, [0, 0.48, 0.53]);
  const angle = Math.random() * Math.PI * 2;
  const distance = 7 + Math.random() * 5;
  model.position.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
  scene.add(model);
  const label = document.createElement('div');
  label.className = 'bot-label chest-label';
  label.textContent = '✦ COFRE · ACÉRCATE';
  labelsRoot.appendChild(label);
  chests.push({ model, label });
  showToast('¡APARECIÓ UN COFRE!');
}

function grantChestWeapon() {
  let rewardIndex = maxWeaponUnlocked + 1;
  if (rewardIndex >= weaponStages.length) {
    rewardIndex = weaponStages.length;
    weaponStages.push({ name: `ARMA MÍSTICA ${rewardIndex - 8}`, icon: '✦', kind: 'projectile', damage: 78 + (rewardIndex - 9) * 3, range: 48, cooldown: 0.56, speed: 45, splash: 1.8, color: '#55d9c5' });
    for (const fighter of fighters) {
      fighter.userData.weaponModel.push(createWeaponModel(fighter.userData.limbs.rightArm, rewardIndex));
    }
  }
  maxWeaponUnlocked = rewardIndex;
  equipWeapon(rewardIndex, true);
  showToast(`¡COFRE ABIERTO · ${weaponStages[rewardIndex].name}!`);
  announce('¡ARMA NUEVA!');
  playSound(680, 0.24, 'triangle', 0.05);
}

function updateChests(delta) {
  if (!started) return;
  if (chests.length < 2) chestSpawnTimer -= delta;
  if (chestSpawnTimer <= 0 && chests.length < 2) {
    spawnChest();
    chestSpawnTimer = 42;
  }
  if (chests.length === 0) return;
  const rect = shell.getBoundingClientRect();
  for (let index = chests.length - 1; index >= 0; index--) {
    const chest = chests[index];
    const point = chest.model.position.clone().add(new THREE.Vector3(0, 1.65, 0)).project(camera);
    chest.label.style.left = `${(point.x * 0.5 + 0.5) * rect.width}px`;
    chest.label.style.top = `${(-point.y * 0.5 + 0.5) * rect.height}px`;
    chest.label.style.display = point.z < 1 ? 'block' : 'none';
    chest.model.rotation.y += delta * 0.45;
    chest.model.position.y = 0.06 + Math.sin(performance.now() * 0.003) * 0.08;
    const collector = fighters.find((fighter) => fighter.visible && fighter.userData.health > 0 && Math.hypot(fighter.position.x - chest.model.position.x, fighter.position.z - chest.model.position.z) < 2.15);
    if (!collector) continue;
    labelsRoot.removeChild(chest.label);
    scene.remove(chest.model);
    disposeObject3D(chest.model);
    chests.splice(index, 1);
    grantChestWeapon();
  }
}

function createMagicCat() {
  const cat = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: '#111216', roughness: 0.74, flatShading: true });
  const lightFur = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.82, flatShading: true });
  const gold = new THREE.MeshStandardMaterial({ color: '#ffd66b', metalness: 0.28, roughness: 0.4 });
  const eye = new THREE.MeshStandardMaterial({ color: '#66f2db', emissive: '#35d5c7', emissiveIntensity: 1.4 });
  const orbMaterial = new THREE.MeshStandardMaterial({ color: '#c994ff', emissive: '#a13dff', emissiveIntensity: 2.1, roughness: 0.25 });
  const sphere = (material, position, scale) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cat.add(mesh);
    return mesh;
  };
  sphere(fur, [0, 0.82, 0], [0.48, 0.62, 0.4]);
  sphere(lightFur, [0, 0.8, 0.34], [0.28, 0.36, 0.11]);
  sphere(fur, [0, 1.68, 0.12], [0.49, 0.45, 0.43]);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.52, 5), fur);
    ear.position.set(side * 0.31, 2.04, 0.05);
    ear.rotation.z = side * -0.22;
    ear.castShadow = true;
    cat.add(ear);
    sphere(lightFur, [side * 0.19, 1.71, 0.5], [0.075, 0.11, 0.045]);
    sphere(eye, [side * 0.19, 1.78, 0.505], [0.06, 0.075, 0.045]);
    sphere(lightFur, [side * 0.28, 0.2, 0.22], [0.17, 0.16, 0.2]);
    sphere(lightFur, [side * 0.28, 0.2, -0.23], [0.17, 0.16, 0.2]);
  }
  sphere(lightFur, [0, 1.53, 0.52], [0.17, 0.12, 0.09]);
  sphere(gold, [0, 1.58, 0.6], [0.055, 0.045, 0.04]);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.09, 8), gold);
  brim.position.set(0, 2.08, 0.08);
  cat.add(brim);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.39, 0.76, 7), fur);
  hat.position.set(0, 2.45, 0.08);
  hat.rotation.z = -0.12;
  hat.castShadow = true;
  cat.add(hat);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.72, -0.32), new THREE.Vector3(0.18, 0.56, -0.66),
    new THREE.Vector3(0.35, 0.95, -0.85), new THREE.Vector3(0.2, 1.25, -0.8),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 14, 0.1, 7, false), fur);
  tail.castShadow = true;
  cat.add(tail);
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 1.2, 7), gold);
  staff.position.set(0.62, 0.93, 0.08);
  staff.rotation.z = -0.16;
  cat.add(staff);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), orbMaterial);
  orb.position.set(0.67, 1.58, 0.08);
  cat.add(orb);
  cat.scale.setScalar(0.78);
  cat.userData = { isCompanion: true, health: 100, energy: 100, attackCooldown: 0, hitFlash: 0, orb, tail };
  cat.position.copy(player.position).add(new THREE.Vector3(1.5, 0, 1.2));
  scene.add(cat);
  companion = cat;
  companionLabel = document.createElement('div');
  companionLabel.className = 'bot-label companion-label';
  companionLabel.innerHTML = '<span class="companion-name">✦ Perla-Magic · GATA MÁGICA</span><span class="companion-health"><i></i></span><span class="companion-energy"><i></i></span>';
  labelsRoot.appendChild(companionLabel);
}

function dismissMagicCat() {
  if (!companion) return;
  scene.remove(companion);
  disposeObject3D(companion);
  companionLabel?.remove();
  companion = null;
  companionLabel = null;
}

function updateMagicCat(delta) {
  if (!companion || !started || companion.userData.health <= 0) return;
  const owner = fighters.find((fighter) => fighter.visible && fighter.userData.health > 0) ?? player;
  const behind = new THREE.Vector3(Math.sin(owner.rotation.y), 0, Math.cos(owner.rotation.y)).multiplyScalar(-1.35);
  const side = new THREE.Vector3(Math.cos(owner.rotation.y), 0, -Math.sin(owner.rotation.y)).multiplyScalar(1.05);
  const followTarget = owner.position.clone().add(behind).add(side);
  companion.position.lerp(followTarget, 1 - Math.exp(-delta * 5));
  companion.position.y = 0.06 + Math.sin(performance.now() * 0.004) * 0.12;
  companion.userData.hitFlash = Math.max(0, companion.userData.hitFlash - delta);
  companion.scale.setScalar(0.78 * (companion.userData.hitFlash > 0 ? 1.08 : 1));
  companion.userData.tail.rotation.z = Math.sin(performance.now() * 0.006) * 0.18;
  companion.userData.orb.scale.setScalar(0.85 + Math.sin(performance.now() * 0.01) * 0.18);
  const rect = shell.getBoundingClientRect();
  const point = companion.position.clone().add(new THREE.Vector3(0, 2.75, 0)).project(camera);
  companionLabel.style.left = `${(point.x * 0.5 + 0.5) * rect.width}px`;
  companionLabel.style.top = `${(-point.y * 0.5 + 0.5) * rect.height}px`;
  companionLabel.style.display = point.z < 1 ? 'block' : 'none';
  companionLabel.querySelector('.companion-health i').style.width = `${companion.userData.health}%`;
  companionLabel.querySelector('.companion-name').textContent = `✦ Perla-Magic · ${Math.ceil(companion.userData.health)} VIDA`;
  companionLabel.querySelector('.companion-energy i').style.width = `${companion.userData.energy}%`;
  companion.userData.attackCooldown = Math.max(0, companion.userData.attackCooldown - delta);
  if (companion.userData.attackCooldown > 0) return;
  const target = enemies
    .filter((bot) => bot.alive && companion.position.distanceTo(bot.model.position) <= companionMagic.range)
    .sort((first, second) => companion.position.distanceToSquared(first.model.position) - companion.position.distanceToSquared(second.model.position))[0];
  if (!target) return;
  const aim = target.model.position.clone().add(new THREE.Vector3(0, target.flying ? 4.2 : 1.25, 0));
  const origin = companion.position.clone().add(new THREE.Vector3(0, 1.45, 0));
  const direction = aim.sub(origin).normalize();
  companion.rotation.y = Math.atan2(direction.x, direction.z);
  companion.userData.attackCooldown = companionMagic.cooldown;
  fireProjectile(companionMagic, direction, companion, 1);
  playSound(610, 0.1, 'sine', 0.028);
}

function updateEnergyHud(fighter) {
  if (fighter === companion) {
    companionLabel?.querySelector('.companion-energy i')?.style.setProperty('width', `${fighter.userData.energy}%`);
    return;
  }
  const track = document.querySelector(fighter === playerTwo ? '#player-two-energy-track' : '#player-energy-track');
  if (!track) return;
  [...track.children].forEach((segment, index) => segment.classList.toggle('empty', fighter.userData.energy <= (index * 100) / track.children.length));
}

function createShopkeeper() {
  const door = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#654630', roughness: 0.88 });
  const trim = new THREE.MeshStandardMaterial({ color: '#d39a4c', metalness: 0.3, roughness: 0.5 });
  const portal = new THREE.MeshBasicMaterial({ color: '#54d8c1', transparent: true, opacity: 0.48, side: THREE.DoubleSide });
  box(door, [0.22, 4.2, 0.35], trim, [-1.35, 2.1, 0]);
  box(door, [0.22, 4.2, 0.35], trim, [1.35, 2.1, 0]);
  box(door, [2.9, 0.25, 0.4], trim, [0, 4.15, 0]);
  box(door, [2.48, 3.9, 0.22], wood, [0, 1.95, -0.08]);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 3.45), portal);
  glow.position.set(0, 2, 0.045);
  door.add(glow);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), trim);
  knob.position.set(0.82, 1.7, 0.11);
  door.add(knob);
  door.position.set(5.4, 0, 5.0);
  scene.add(door);

  const goblin = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: '#64a84d', roughness: 0.86, flatShading: true });
  const darkGreen = new THREE.MeshStandardMaterial({ color: '#367442', roughness: 0.9 });
  const coat = new THREE.MeshStandardMaterial({ color: '#713f82', roughness: 0.82 });
  const skin = new THREE.MeshStandardMaterial({ color: '#91c96c', roughness: 0.84 });
  const eye = new THREE.MeshStandardMaterial({ color: '#f6df77', emissive: '#c5962e', emissiveIntensity: 0.6 });
  box(goblin, [0.82, 0.9, 0.52], coat, [0, 0.78, 0]);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), green);
  head.position.set(0, 1.57, 0.05);
  goblin.add(head);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.66, 5), green);
    ear.position.set(side * 0.48, 1.72, 0);
    ear.rotation.z = side * -Math.PI / 2.4;
    goblin.add(ear);
    const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eye);
    eyeMesh.position.set(side * 0.16, 1.63, 0.38);
    goblin.add(eyeMesh);
  }
  box(goblin, [0.46, 0.11, 0.18], darkGreen, [0, 1.32, 0.36]);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.72, 7), coat);
  hat.position.set(0, 2.08, 0);
  goblin.add(hat);
  cylinder(goblin, 0.48, 0.48, 0.1, trim, [0, 1.81, 0], 8);
  box(goblin, [0.26, 0.3, 0.14], trim, [0.25, 0.75, 0.31]);
  goblin.position.set(6.8, 0, 6.1);
  goblin.rotation.y = -0.55;
  scene.add(goblin);
  shopkeeper = goblin;
  shopkeeperLabel = document.createElement('div');
  shopkeeperLabel.className = 'bot-label merchant-label';
  shopkeeperLabel.textContent = 'DUENDE · TIENDA';
  labelsRoot.appendChild(shopkeeperLabel);
}

function updateShopkeeper() {
  if (!shopkeeper || !shopkeeperLabel) return;
  const rect = shell.getBoundingClientRect();
  const point = shopkeeper.position.clone().add(new THREE.Vector3(0, 2.8, 0)).project(camera);
  shopkeeperLabel.style.left = `${(point.x * 0.5 + 0.5) * rect.width}px`;
  shopkeeperLabel.style.top = `${(-point.y * 0.5 + 0.5) * rect.height}px`;
  shopkeeperLabel.style.display = point.z < 1 ? 'block' : 'none';
  const nearby = fighters.some((fighter) => fighter.visible && fighter.userData.health > 0 && fighter.position.distanceTo(shopkeeper.position) < 4.5);
  shopkeeperLabel.textContent = nearby ? 'DUENDE · PULSA E PARA COMPRAR' : 'DUENDE · TIENDA';
}

function openShop() {
  if (!started) {
    showToast('INICIA UNA PARTIDA PARA ABRIR LA TIENDA');
    return;
  }
  if (shopPaused) return;
  shopPaused = true;
  keys.clear();
  blockActive = false;
  gamepadBlockActive = false;
  touchMoveX = 0;
  touchMoveY = 0;
  shopCoins.textContent = String(coins);
  shopFeedback.textContent = 'Elige un objeto para comprar.';
  shopModal.hidden = false;
}

function closeShop() {
  if (!shopPaused) return;
  shopPaused = false;
  shopModal.hidden = true;
  keys.clear();
}

function updateShieldStatus() {
  const update = (fighter, element) => {
    const hits = fighter.userData.shieldHits ?? 0;
    element.hidden = hits <= 0;
    element.classList.toggle('metal', fighter.userData.shieldType === 'metal');
    element.textContent = hits > 0 ? `ESCUDO ${fighter.userData.shieldType === 'metal' ? 'METÁLICO' : 'DE MADERA'} · ${hits} GOLPES` : '';
  };
  update(player, shieldStatus);
  update(playerTwo, playerTwoShieldStatus);
}

function buyShopItem(itemId) {
  const items = {
    heart: { cost: 3, name: 'Corazón' },
    sword: { cost: 5, name: 'Espada', weaponIndex: 2 },
    bazooka: { cost: 8, name: 'Bazuca', weaponIndex: 5 },
    laser: { cost: 10, name: 'Lanzador láser', weaponIndex: 7 },
    'wood-shield': { cost: 4, name: 'Escudo de madera', shield: 'wood', hits: 3 },
    'metal-shield': { cost: 7, name: 'Escudo de metal', shield: 'metal', hits: 5 },
  };
  const item = items[itemId];
  if (!item || !shopPaused) return;
  if (coins < item.cost) {
    shopFeedback.textContent = `Te faltan monedas para comprar ${item.name}.`;
    return;
  }
  if (itemId === 'heart' && fighters.filter((fighter) => fighter.visible && fighter.userData.health > 0).every((fighter) => fighter.userData.health >= 100)) {
    shopFeedback.textContent = 'Tu equipo ya tiene toda la vida.';
    return;
  }
  coins -= item.cost;
  coinCount.textContent = String(coins);
  shopCoins.textContent = String(coins);
  if (itemId === 'heart') {
    for (const fighter of fighters) {
      if (fighter.visible) spawnHeartReward(fighter, 35);
    }
  } else if (item.shield) {
    for (const fighter of fighters) {
      if (!fighter.visible || fighter.userData.health <= 0) continue;
      fighter.userData.shieldType = item.shield;
      fighter.userData.shieldHits = item.hits;
    }
    updateShieldStatus();
  } else {
    maxWeaponUnlocked = Math.max(maxWeaponUnlocked, item.weaponIndex);
    equipWeapon(item.weaponIndex, true);
  }
  shopFeedback.textContent = `Compraste ${item.name}. El combate sigue pausado.`;
}

function damageEnemy(bot, damage, direction, weapon, impactPosition, attacker = player) {
  if (!bot.alive) return;
  bot.health = Math.max(0, bot.health - damage);
  bot.stun = 0.34;
  bot.model.position.addScaledVector(direction, weapon.splash ? 1.1 : weapon.kind === 'melee' ? 1.65 : 0.55);
  bot.hitFlash = 0.18;
  spawnHitEffect(impactPosition ?? bot.model.position.clone().add(new THREE.Vector3(0, 2.3, 0)), weapon.color);
  const fighterState = attacker.userData;
  if (!fighterState.isCompanion && !fighterState.comboHitRegistered) {
    fighterState.comboHitRegistered = true;
    fighterState.comboCount = fighterState.comboStep;
    combo = fighterState.comboCount;
    comboTimer = fighterState.comboWindow;
    const hitCount = fighterState.comboCount;
    const meter = attacker === player ? comboHits : document.querySelector('#player-two-combo .combo-hits');
    meter.querySelectorAll('i').forEach((hit, index) => hit.classList.toggle('active', index < hitCount));
    if (attacker === player) {
      comboCount.textContent = `${hitCount}/5`;
      document.querySelector('.combo-meter').classList.toggle('finisher-ready', hitCount === 5);
    } else {
      playerTwoStatus.textContent = hitCount === 5 ? '¡REMATE!' : `${hitCount}/5 GOLPES`;
      playerTwoCombo.textContent = `${hitCount}/5`;
    }
    announce(hitCount === 5 ? '¡COMBO DE 5! ¡REMATE!' : `GOLPE ${hitCount}/5`);
  }
  playSound(weapon.splash ? 95 : 145 + (fighterState.comboStep ?? 0) * 32, 0.11, 'square', 0.035);
  if (bot.health <= 0) defeatBot(bot);
}

function findAimTarget(direction, range, attacker = player) {
  let target = null;
  let bestDot = -0.1;
  for (const bot of enemies) {
    if (!bot.alive) continue;
    const toward = new THREE.Vector3().subVectors(bot.model.position, attacker.position);
    toward.y = 0;
    const distance = toward.length();
    if (distance > range) continue;
    const dot = direction.dot(toward.normalize());
    if (dot > bestDot) { target = bot; bestDot = dot; }
  }
  return target;
}

function fireProjectile(weapon, direction, attacker = player, comboMultiplier = 1) {
  const material = new THREE.MeshStandardMaterial({ color: weapon.color, emissive: weapon.color, emissiveIntensity: 0.7, roughness: 0.4 });
  const mesh = weapon.splash
    ? new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.72, 8), material)
    : weapon.name === 'ARCO'
      ? new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 6), material)
      : new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), material);
  mesh.position.copy(attacker.position).add(new THREE.Vector3(0, 1.8, 0)).addScaledVector(direction, 0.85);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  mesh.castShadow = true;
  scene.add(mesh);
  projectiles.push({ mesh, direction: direction.clone(), weapon, attacker, comboMultiplier, distanceLeft: weapon.range });
}

function detonateProjectile(projectile, position, directTarget) {
  const { weapon } = projectile;
  if (weapon.splash > 0) {
    spawnHitEffect(position, '#ffb84f');
    const explosion = new THREE.Mesh(
      new THREE.SphereGeometry(weapon.splash, 14, 10),
      new THREE.MeshBasicMaterial({ color: '#ff9a4f', transparent: true, opacity: 0.25, wireframe: true }),
    );
    explosion.position.copy(position);
    scene.add(explosion);
    temporaryObjects.push({ object: explosion, life: 0.42, maxLife: 0.42 });
    for (const bot of enemies) {
      if (!bot.alive) continue;
      const targetPosition = bot.model.position.clone().add(new THREE.Vector3(0, 1.1, 0));
      const distance = targetPosition.distanceTo(position);
      if (bot === directTarget || distance < weapon.splash) {
        const direction = new THREE.Vector3().subVectors(bot.model.position, projectile.attacker.position).normalize();
        const falloff = Math.max(0.45, 1 - distance / (weapon.splash * 1.5));
        damageEnemy(bot, Math.round(weapon.damage * projectile.comboMultiplier * falloff), direction, weapon, targetPosition, projectile.attacker);
      }
    }
  } else if (directTarget?.alive) {
    const direction = new THREE.Vector3().subVectors(directTarget.model.position, projectile.attacker.position).normalize();
    damageEnemy(directTarget, Math.round(weapon.damage * projectile.comboMultiplier), direction, weapon, directTarget.model.position.clone().add(new THREE.Vector3(0, 1.4, 0)), projectile.attacker);
  }
}

function updateProjectiles(delta) {
  for (let index = projectiles.length - 1; index >= 0; index--) {
    const projectile = projectiles[index];
    const step = Math.min(projectile.weapon.speed * delta, projectile.distanceLeft);
    projectile.mesh.position.addScaledVector(projectile.direction, step);
    projectile.distanceLeft -= step;
    let impactTarget = null;
    for (const bot of enemies) {
      if (!bot.alive) continue;
      const targetPosition = bot.model.position.clone().add(new THREE.Vector3(0, bot.flying ? 4.5 : 1.25, 0));
      if (projectile.mesh.position.distanceTo(targetPosition) < 0.85) { impactTarget = bot; break; }
    }
    if (impactTarget || projectile.distanceLeft <= 0) {
      detonateProjectile(projectile, projectile.mesh.position.clone(), impactTarget);
      scene.remove(projectile.mesh);
      projectile.mesh.geometry.dispose();
      projectile.mesh.material.dispose();
      projectiles.splice(index, 1);
    }
  }
}

function attack(type, attacker = player) {
  if (!started || attacker.userData.attackCooldown > 0 || attacker.userData.health <= 0) return;
  const state = attacker.userData;
  if (type === 'grab') {
    state.attackCooldown = 0.55;
    const facing = new THREE.Vector3(Math.sin(attacker.rotation.y), 0, Math.cos(attacker.rotation.y));
    grabAndThrow(attacker, facing);
    return;
  }
  const isKick = type === 'kick' && equippedWeaponIndex < 0;
  const weapon = equippedWeaponIndex >= 0 ? weaponStages[equippedWeaponIndex] : null;
  state.attackCooldown = weapon?.cooldown ?? (isKick ? 0.48 : 0.28);
  state.comboStep = state.comboWindow > 0 && state.comboStep < 5 ? state.comboStep + 1 : 1;
  state.comboWindow = 1.75;
  state.comboHitRegistered = false;
  const comboMultiplier = [1, 1.08, 1.17, 1.32, 1.72][state.comboStep - 1];
  const limbs = state.limbs;
  const limb = limbs[weapon || !isKick ? 'rightArm' : 'rightLeg'];
  limb.userData.swing = isKick ? 'kick' : weapon?.kind === 'projectile' ? 'shoot' : 'punch';
  limb.userData.swingTime = weapon?.kind === 'projectile' ? 0.2 : isKick ? 0.34 : 0.24;
  playSound(weapon?.kind === 'projectile' ? (weapon.splash ? 110 : 280) : isKick ? 165 : 240, 0.08, 'triangle', 0.055);

  const facing = new THREE.Vector3(Math.sin(attacker.rotation.y), 0, Math.cos(attacker.rotation.y));
  if (weapon?.kind === 'projectile') {
    const target = findAimTarget(facing, weapon.range, attacker);
    const targetPosition = target?.flying
      ? target.model.position.clone().add(new THREE.Vector3(0, 4.0, 0))
      : target?.model.position;
    const direction = targetPosition
      ? new THREE.Vector3().subVectors(targetPosition, attacker.position).normalize()
      : facing;
    if (!target?.flying) direction.y = 0;
    direction.normalize();
    fireProjectile(weapon, direction, attacker, comboMultiplier);
    return;
  }

  const range = weapon?.range ?? (isKick ? 3.4 : 2.8);
  const damage = Math.round((weapon?.damage ?? (isKick ? 22 : 13)) * comboMultiplier);
  for (const bot of enemies) {
    if (!bot.alive) continue;
    const toward = new THREE.Vector3().subVectors(bot.model.position, attacker.position);
    const distance = toward.length();
    toward.normalize();
    if (distance <= range && facing.dot(toward) > -0.05) {
      damageEnemy(bot, damage, toward, weapon ?? { kind: 'melee', name: null, color: '#fff1a3' }, undefined, attacker);
    }
  }
}

function grabAndThrow(attacker, facing) {
  if (equippedWeaponIndex >= 0) {
    showToast('EQUIPA UN ARMA PARA PODER AGARRAR');
    return;
  }
  const target = enemies
    .filter((bot) => bot.alive && !bot.grabbedBy && !bot.thrown)
    .map((bot) => ({ bot, distance: bot.model.position.distanceTo(attacker.position) }))
    .filter(({ distance }) => distance < 3.3)
    .sort((left, right) => left.distance - right.distance)[0]?.bot;
  if (!target) {
    showToast('ACÉRCATE A UN ENEMIGO');
    return;
  }
  target.grabbedBy = attacker;
  target.thrownBy = attacker;
  target.grabTimer = 0.38;
  target.throwHit = new Set();
  target.stun = 1;
  target.throwDirection = facing.clone();
  target.model.position.copy(attacker.position).addScaledVector(facing, 1.6);
  target.model.position.y = attacker.position.y + (target.boss ? 2.2 : 0.8);
  announce('¡AGARRADO!');
  playSound(170, 0.14, 'triangle', 0.045);
}

function updateThrownEnemies(delta) {
  for (const bot of enemies) {
    if (bot.grabbedBy) {
      bot.grabTimer -= delta;
      if (bot.grabTimer <= 0) {
        bot.thrown = true;
        bot.grabbedBy = null;
        bot.throwLife = 0.9;
        bot.model.position.y = 1.2;
        announce('¡LANZAMIENTO!');
        playSound(260, 0.13, 'sawtooth', 0.035);
      }
      continue;
    }
    if (!bot.thrown || !bot.alive) continue;
    const movement = 18 * delta;
    bot.model.position.addScaledVector(bot.throwDirection, movement);
    bot.model.position.y = Math.max(0, bot.model.position.y - delta * 2.8);
    bot.throwLife -= delta;
    for (const victim of enemies) {
      if (!victim.alive || victim === bot || victim.grabbedBy || bot.throwHit.has(victim)) continue;
      if (victim.model.position.distanceTo(bot.model.position) < (victim.boss ? 2.7 : 1.6)) {
        bot.throwHit.add(victim);
        victim.stun = 0.7;
        const direction = new THREE.Vector3().subVectors(victim.model.position, bot.model.position).normalize();
        damageEnemy(victim, bot.boss ? 55 : 30, direction, { kind: 'melee', name: 'LANZAMIENTO', color: '#ffd259' }, undefined, bot.thrownBy ?? player);
      }
    }
    if (bot.throwLife <= 0) {
      bot.thrown = false;
      bot.model.position.y = 0;
      bot.stun = 0.45;
    }
  }
}
function defeatBot(bot) {
  const defeatedDragon = Boolean(bot.bossPreset?.flying);
  let companionUnlockedNow = false;
  bot.alive = false;
  bot.label.remove();
  labels.delete(bot);
  knockouts++;
  if (bot.boss) {
    coins += 4;
    coinCount.textContent = String(coins);
    bossesDefeated++;
    bossesSinceCompanion++;
    if (bossesSinceCompanion >= 2) {
      bossesSinceCompanion = 0;
      companionUnlockedNow = !companion || companion.userData.health <= 0;
    }
  }
  if (defeatedDragon) {
    level++;
    playerLevel.textContent = `NV. ${String(level).padStart(2, '0')}`;
    if (level === 5) activateVolcano();
  }
  koCount.textContent = `${knockouts} K.O.`;
  const unlockedIndex = Math.min(knockouts - 1, weaponStages.length - 1);
  maxWeaponUnlocked = Math.max(maxWeaponUnlocked, unlockedIndex);
  if (unlockedIndex > equippedWeaponIndex) equipWeapon(unlockedIndex, true);
  if (knockouts % 5 === 0) {
    for (const fighter of fighters) {
      if (fighter.visible) spawnHeartReward(fighter, 25);
    }
    showToast('♥ RECOMPENSA: +25 VIDA');
  }
  announce('¡K. O.!');
  playSound(420, 0.23, 'triangle', 0.05);
  if (knockouts % 5 === 0) {
    const bossCount = 2;
    const bossNames = ['DRAGÓN BLOCK'];
    const dragonPalette = dragonPalettes[nextDragonPalette % dragonPalettes.length];
    nextDragonPalette++;
    const dragonPreset = { ...bossTypes[3], color: dragonPalette.body, accent: dragonPalette.horn };
    addBot({ boss: true, bossPreset: dragonPreset, dragonPalette });
    maxWeaponUnlocked = Math.max(maxWeaponUnlocked, weaponStages.length - 1);
    equipWeapon(weaponStages.length - 1, true);
    if (bossCount === 2) {
      const preset = bossTypes[nextAcidBoss];
      nextAcidBoss = nextAcidBoss === 4 ? 5 : 4;
      bossNames.push(preset.name);
      addBot({ boss: true, bossPreset: preset });
    }
    announce(bossCount > 1 ? '¡JEFES MÚLTIPLES!' : `¡JEFE ${bossNames[0]}!`);
    showToast(`¡${bossNames.join(' + ')}!`);
  }
  if (defeatedDragon) {
    const rewardIndex = weaponStages.length;
    weaponStages.push({ name: `LANZA DRACÓNICA ${level}`, icon: '♢', kind: 'projectile', damage: 88, range: 50, cooldown: 0.58, speed: 49, splash: 2.6, color: '#ff7043' });
    for (const fighter of fighters) {
      fighter.userData.weaponModel.push(createWeaponModel(fighter.userData.limbs.rightArm, rewardIndex));
      if (fighter.visible) spawnHeartReward(fighter, 35);
    }
    maxWeaponUnlocked = rewardIndex;
    equipWeapon(rewardIndex, true);
    announce(`¡NIVEL ${level}!`);
    showToast(`+4 MONEDAS · ♥ NIVEL ${level} · ARMA Y +35 VIDA`);
  } else if (bot.boss) {
    showToast('+4 MONEDAS POR VENCER AL JEFE');
  }
  if (companionUnlockedNow) {
    if (companion) dismissMagicCat();
    createMagicCat();
    announce('¡PERLA-MAGIC TE ACOMPAÑA!');
    showToast('+4 MONEDAS · ¡PERLA-MAGIC REGRESA!');
  }
  bot.model.userData.pivot.userData.fall = 0.45;
  const finishBotRemoval = () => {
    if (shopPaused) {
      window.setTimeout(finishBotRemoval, 100);
      return;
    }
    scene.remove(bot.model);
    disposeObject3D(bot.model);
    const index = enemies.indexOf(bot);
    if (index !== -1) enemies.splice(index, 1);
  };
  window.setTimeout(finishBotRemoval, 520);
  if (enemies.filter((item) => item.alive).length === 0) spawnTimer = 2.2;
}
function damagePlayer(amount, attacker, victim = player) {
  if (victim.userData.health <= 0) return;
  if ((victim.userData.shieldHits ?? 0) > 0) {
    victim.userData.shieldHits--;
    updateShieldStatus();
    spawnHitEffect(victim.position.clone().add(new THREE.Vector3(0, 1.6, 0)), victim.userData.shieldType === 'metal' ? '#b9e8ff' : '#d9b681');
    playSound(310, 0.1, 'triangle', 0.04);
    if (victim.userData.shieldHits > 0) showToast(`ESCUDO BLOQUEÓ EL GOLPE · ${victim.userData.shieldHits} RESTANTES`);
    else {
      victim.userData.shieldType = null;
      updateShieldStatus();
      showToast('ESCUDO DESTRUIDO');
    }
    return;
  }
  const isBlocking = victim === player
    ? blockActive || gamepadBlockActive
    : victim.userData.blocking;
  const reduced = isBlocking ? Math.ceil(amount * 0.22) : amount;
  victim.userData.health = Math.max(0, victim.userData.health - reduced);
  if (victim === player) {
    playerHealth = victim.userData.health;
    playerHealthFill.style.width = `${playerHealth}%`;
    playerHealthText.textContent = `${playerHealth} / 100`;
    combo = 0;
    player.userData.comboCount = 0;
    player.userData.comboStep = 0;
    player.userData.comboWindow = 0;
    player.userData.comboHitRegistered = false;
    comboCount.textContent = '0/5';
    comboHits.querySelectorAll('i').forEach((hit) => hit.classList.remove('active'));
    document.querySelector('.combo-meter').classList.remove('finisher-ready');
  } else {
    playerTwoHealthFill.style.width = `${victim.userData.health}%`;
    playerTwoHealthText.textContent = `${victim.userData.health} / 100`;
    victim.userData.comboCount = 0;
    victim.userData.comboStep = 0;
    victim.userData.comboWindow = 0;
    victim.userData.comboHitRegistered = false;
    playerTwoCombo.textContent = '0/5';
    document.querySelectorAll('#player-two-combo .combo-hits i').forEach((hit) => hit.classList.remove('active'));
    playerTwoStatus.textContent = victim.userData.health ? 'LISTO' : 'K.O.';
  }
  hurtFlash = 0.22;
  spawnHitEffect(victim.position.clone().add(new THREE.Vector3(0, 1.8, 0)), isBlocking ? '#8ae6cf' : '#ff9576');
  playSound(isBlocking ? 350 : 90, 0.13, isBlocking ? 'sine' : 'sawtooth', 0.05);
  if (isBlocking) showToast('¡BLOQUEO PERFECTO!');
  else announce('¡AY!');
  const push = new THREE.Vector3().subVectors(victim.position, attacker.model.position).normalize();
  victim.position.addScaledVector(push, isBlocking ? 0.18 : 0.55);
  if (fighters.filter((fighter) => fighter.visible).every((fighter) => fighter.userData.health <= 0)) endGame();
}
function damageCompanion(amount, attacker) {
  if (!companion || companion.userData.health <= 0) return;
  companion.userData.health = Math.max(0, companion.userData.health - amount);
  companion.userData.hitFlash = 0.28;
  companionLabel.querySelector('.companion-health i').style.width = `${companion.userData.health}%`;
  spawnHitEffect(companion.position.clone().add(new THREE.Vector3(0, 1.8, 0)), '#ff879c');
  const push = new THREE.Vector3().subVectors(companion.position, attacker.model.position).normalize();
  companion.position.addScaledVector(push, 0.42);
  playSound(95, 0.12, 'sawtooth', 0.035);
  if (companion.userData.health <= 0) {
    companion.visible = false;
    companionLabel.classList.add('companion-down');
    companionLabel.querySelector('.companion-name').textContent = '✦ Perla-Magic · K.O.';
    companionLabel.style.display = 'none';
    showToast('PERLA-MAGIC FUERA DE COMBATE');
    announce('¡PERLA-MAGIC K.O.!');
  } else {
    showToast(`PERLA-MAGIC ${companion.userData.health} / 100 DE VIDA`);
  }
}
function endGame() {
  started = false;
  if (shopPaused) closeShop();
  clearChests();
  blockActive = false;
  message.querySelector('.message-kicker').textContent = 'FIN DE LA PARTIDA';
  message.querySelector('h1').innerHTML = '¡BUEN <span>INTENTO!</span>';
  message.querySelector('p').textContent = `Derribaste ${knockouts} bots en la Isla del Trueno.`;
  startButton.innerHTML = 'VOLVER A JUGAR <span>↻</span>';
  message.classList.remove('hidden');
}
function startGame() {
  shopPaused = false;
  shopModal.hidden = true;
  playerHealth = 100;
  player.userData.health = 100;
  playerTwo.userData.health = 100;
  knockouts = 0;
  combo = 0;
  wave = 1;
  level = 1;
  coins = 0;
  bossesDefeated = 0;
  bossesSinceCompanion = 0;
  nextAcidBoss = 4;
  volcanoAttackTimer = 0;
  if (volcano) { scene.remove(volcano); disposeObject3D(volcano); volcano = null; }
  for (const puddle of acidPuddles) { scene.remove(puddle.mesh, puddle.ring); disposeObject3D(puddle.mesh); disposeObject3D(puddle.ring); }
  acidPuddles.length = 0;
  for (const impact of lavaImpacts) { scene.remove(impact.marker, impact.rock); disposeObject3D(impact.marker); disposeObject3D(impact.rock); }
  lavaImpacts.length = 0;
  player.userData.energy = 100; playerTwo.userData.energy = 100;
  updateEnergyHud(player); updateEnergyHud(playerTwo);
  coinCount.textContent = '0';
  chestSpawnTimer = 25;
  playerLevel.textContent = 'NV. 01';
  playerHealthFill.style.width = '100%';
  playerHealthText.textContent = '100 / 100';
  playerTwoHealthFill.style.width = '100%';
  playerTwoHealthText.textContent = '100 / 100';
  playerTwoStatus.textContent = activePlayers > 1 ? 'LISTO' : 'INACTIVO';
  koCount.textContent = '0 K.O.';
  comboCount.textContent = '0/5';
  playerTwoCombo.textContent = '0/5';
  comboHits.querySelectorAll('i').forEach((hit) => hit.classList.remove('active'));
  document.querySelectorAll('#player-two-combo .combo-hits i').forEach((hit) => hit.classList.remove('active'));
  document.querySelector('.combo-meter').classList.remove('finisher-ready');
  playerTwo.userData.attackCooldown = 0;
  playerTwo.userData.blocking = false;
  for (const fighter of fighters) {
    fighter.userData.shieldHits = 0;
    fighter.userData.shieldType = null;
  }
  updateShieldStatus();
  player.userData.attackCooldown = 0;
  maxWeaponUnlocked = -1;
  player.position.set(0, 0, 8);
  playerTwo.position.set(-2.5, 0, 9.2);
  playerTwo.visible = activePlayers > 1;
  playerTwoPanel.hidden = activePlayers < 2;
  playerTwo.userData.comboCount = 0;
  playerTwo.userData.comboStep = 0;
  playerTwo.userData.comboWindow = 0;
  playerTwo.userData.comboHitRegistered = false;
  player.userData.comboCount = 0;
  player.userData.comboStep = 0;
  player.userData.comboWindow = 0;
  player.userData.comboHitRegistered = false;
  for (const bot of enemies) {
    scene.remove(bot.model);
    bot.label.remove();
    disposeObject3D(bot.model);
  }
  clearChests();
  enemies.length = 0;
  for (const projectile of projectiles) {
    scene.remove(projectile.mesh);
    projectile.mesh.geometry.dispose();
    projectile.mesh.material.dispose();
  }
  projectiles.length = 0;
  dismissMagicCat();
  equipWeapon(-1);
  started = true;
  message.classList.add('hidden');
  spawnWave(3 * activePlayers);
  showToast('¡DERROTA A TODOS!');
}

function togglePlayerTwo() {
  activePlayers = activePlayers === 1 ? 2 : 1;
  playerTwoToggle.classList.toggle('active', activePlayers === 2);
  playerTwoToggle.setAttribute('aria-pressed', String(activePlayers === 2));
  playerTwoToggle.textContent = activePlayers === 2 ? '− QUITAR JUGADOR 2' : '+ JUGAR CON JUGADOR 2';
  playerTwoControls.hidden = activePlayers !== 2;
  playerTwoPanel.hidden = !started || activePlayers !== 2;
  playerTwo.userData.health = 100;
  playerTwo.visible = started && activePlayers === 2;
  equipWeapon(equippedWeaponIndex);
  playerTwoHealthFill.style.width = '100%';
  playerTwoHealthText.textContent = '100 / 100';
  playerTwoStatus.textContent = activePlayers === 2 ? 'LISTO' : 'INACTIVO';
  if (started && activePlayers === 2) spawnWave(3);
}

function toggleWeaponMode(fighter = player) {
  if (maxWeaponUnlocked < 0) {
    showToast('DERROTA A UN RIVAL PARA GANAR UN ARMA');
    return;
  }
  equipWeapon(equippedWeaponIndex < 0 ? maxWeaponUnlocked : -1);
  if (fighter === playerTwo) playerTwoStatus.textContent = equippedWeaponIndex < 0 ? 'A MANO' : weaponStages[equippedWeaponIndex].name;
}
function clampArena(fighter = player) {
  const max = 18.7;
  fighter.position.x = THREE.MathUtils.clamp(fighter.position.x, -max, max);
  fighter.position.z = THREE.MathUtils.clamp(fighter.position.z, -max, max);
}

function gamepadAxis(value) {
  const deadzone = 0.18;
  const magnitude = Math.abs(value);
  return magnitude < deadzone ? 0 : Math.sign(value) * (magnitude - deadzone) / (1 - deadzone);
}

function updateGamepad(delta) {
  const pads = navigator.getGamepads?.() ?? [];
  let pad = gamepadIndex === null ? null : pads[gamepadIndex];
  if (!pad?.connected) pad = Array.from(pads).find((candidate) => candidate?.connected) ?? null;

  if (!pad) {
    gamepadIndex = null;
    gamepadMoveX = 0;
    gamepadMoveY = 0;
    gamepadBlockActive = false;
    previousGamepadButtons.clear();
    if (gamepadId !== null) showToast('MANDO DESCONECTADO');
    gamepadId = null;
    gamepadStatus.classList.remove('connected');
    shell.classList.remove('gamepad-connected');
    gamepadStatus.querySelector('b').textContent = 'SIN MANDO';
    return;
  }

  gamepadIndex = pad.index;
  if (gamepadId !== pad.id) {
    gamepadId = pad.id;
    gamepadStatus.classList.add('connected');
    shell.classList.add('gamepad-connected');
    gamepadStatus.querySelector('b').textContent = 'MANDO OK';
    showToast('MANDO CONECTADO');
  }

  const isPressed = (index) => {
    const button = pad.buttons[index];
    return Boolean(button && (button.pressed || button.value > 0.5));
  };
  const pressed = new Set();
  for (let index = 0; index < pad.buttons.length; index++) {
    if (isPressed(index)) pressed.add(index);
  }

  gamepadMoveX = gamepadAxis(pad.axes[0] ?? 0);
  gamepadMoveY = gamepadAxis(pad.axes[1] ?? 0);
  if (pressed.has(14)) gamepadMoveX = -1;
  if (pressed.has(15)) gamepadMoveX = 1;
  if (pressed.has(12)) gamepadMoveY = -1;
  if (pressed.has(13)) gamepadMoveY = 1;
  gamepadBlockActive = pressed.has(4) || pressed.has(6);

  const justPressed = (index) => pressed.has(index) && !previousGamepadButtons.has(index);
  if (justPressed(9)) startGame();
  if (justPressed(0) && started) player.userData.pivot.position.y = jumpHeight;
  if (justPressed(2)) attack('punch');
  if (justPressed(1) || justPressed(3)) attack('kick');
  if (justPressed(5)) attack('grab');
  if (justPressed(7)) attack(equippedWeaponIndex < 0 ? 'grab' : 'kick');
  if (justPressed(10)) toggleWeaponMode(player);
  if (justPressed(11)) { cameraYaw = 0; cameraPitch = 0.5; }
  previousGamepadButtons.clear();
  for (const index of pressed) previousGamepadButtons.add(index);

  cameraYaw -= gamepadAxis(pad.axes[2] ?? 0) * delta * 2.4;
  cameraPitch = THREE.MathUtils.clamp(cameraPitch + gamepadAxis(pad.axes[3] ?? 0) * delta * 1.7, 0.12, 0.95);
}

function updatePlayer(fighter, delta) {
  const isSecondPlayer = fighter.userData.isPlayerTwo;
  const move = new THREE.Vector3();
  const up = isSecondPlayer ? keys.has('arrowup') : keys.has('w') || activeTouches.has('up');
  const down = isSecondPlayer ? keys.has('arrowdown') : keys.has('s') || activeTouches.has('down');
  const left = isSecondPlayer ? keys.has('arrowleft') : keys.has('a') || activeTouches.has('left');
  const right = isSecondPlayer ? keys.has('arrowright') : keys.has('d') || activeTouches.has('right');
  if (up) move.z -= 1;
  if (down) move.z += 1;
  if (left) move.x -= 1;
  if (right) move.x += 1;
  if (!isSecondPlayer) {
    move.x = THREE.MathUtils.clamp(move.x + gamepadMoveX + touchMoveX, -1, 1);
    move.z = THREE.MathUtils.clamp(move.z + gamepadMoveY + touchMoveY, -1, 1);
  }
  const playerYaw = isSecondPlayer ? cameraYaw + Math.PI : cameraYaw;
  const forwardInput = -move.z;
  const sideInput = move.x;
  move.set(
    Math.cos(playerYaw) * sideInput - Math.sin(playerYaw) * forwardInput,
    0,
    -Math.sin(playerYaw) * sideInput - Math.cos(playerYaw) * forwardInput,
  );
  const isMoving = move.lengthSq() > 0;
  if (isMoving) {
    move.normalize();
    fighter.position.addScaledVector(move, delta * 7.6);
    fighter.rotation.y = Math.atan2(move.x, move.z);
  } else fighter.rotation.y = playerYaw + Math.PI;
  clampArena(fighter);
  const { pivot, limbs } = fighter.userData;
  pivot.position.y = Math.max(0, pivot.position.y - delta * 8);
  if (isMoving) {
    const stride = Math.sin(performance.now() * 0.012) * 0.52;
    limbs.leftLeg.rotation.x = stride;
    limbs.rightLeg.rotation.x = -stride;
    limbs.leftArm.rotation.x = -stride * 0.65;
    if (!limbs.rightArm.userData.swing) limbs.rightArm.rotation.x = stride * 0.65;
  } else if (!limbs.leftArm.userData.swing) {
    limbs.leftLeg.rotation.x = THREE.MathUtils.damp(limbs.leftLeg.rotation.x, 0, 10, delta);
    limbs.rightLeg.rotation.x = THREE.MathUtils.damp(limbs.rightLeg.rotation.x, 0, 10, delta);
    const guarding = isSecondPlayer ? fighter.userData.blocking : blockActive || gamepadBlockActive;
    limbs.leftArm.rotation.x = THREE.MathUtils.damp(limbs.leftArm.rotation.x, guarding ? -1.15 : 0, 12, delta);
    if (!limbs.rightArm.userData.swing) limbs.rightArm.rotation.x = THREE.MathUtils.damp(limbs.rightArm.rotation.x, guarding ? -1.15 : 0, 12, delta);
  }
  fighter.userData.attackCooldown = Math.max(0, fighter.userData.attackCooldown - delta);
  fighter.userData.comboWindow = Math.max(0, fighter.userData.comboWindow - delta);
  if (fighter.userData.comboWindow === 0 && fighter.userData.comboStep > 0) {
    fighter.userData.comboStep = 0;
    fighter.userData.comboCount = 0;
    fighter.userData.comboHitRegistered = false;
    if (isSecondPlayer) {
      playerTwoCombo.textContent = '0/5';
      playerTwoStatus.textContent = 'LISTO';
      document.querySelectorAll('#player-two-combo .combo-hits i').forEach((hit) => hit.classList.remove('active'));
    } else {
      combo = 0;
      comboCount.textContent = '0/5';
      comboTimer = 0;
      comboHits.querySelectorAll('i').forEach((hit) => hit.classList.remove('active'));
      document.querySelector('.combo-meter').classList.remove('finisher-ready');
    }
  }
  for (const [limb, duration, amplitude] of [[limbs.rightArm, 0.24, 2.1], [limbs.rightLeg, 0.34, 1.8]]) {
    if (limb.userData.swingTime > 0) {
      limb.userData.swingTime -= delta;
      const progress = 1 - Math.max(0, limb.userData.swingTime) / duration;
      limb.rotation.x = -Math.sin(Math.min(1, progress) * Math.PI) * amplitude;
      if (limb.userData.swingTime <= 0) delete limb.userData.swing;
    }
  }
  if (hurtFlash > 0) { hurtFlash -= delta; pivot.scale.setScalar(1 + Math.sin(performance.now() * 0.05) * 0.04); }
  else pivot.scale.setScalar(1);
}

function updateEnemies(delta) {
  for (const bot of [...enemies]) {
    if (!bot.alive || bot.grabbedBy || bot.thrown) continue;
    const model = bot.model;
    const targets = fighters.filter((fighter) => fighter.visible && fighter.userData.health > 0);
    if (companion && companion.userData.health > 0) targets.push(companion);
    const target = targets
      .sort((first, second) => first.position.distanceToSquared(model.position) - second.position.distanceToSquared(model.position))[0];
    if (!target) continue;
    if (bot.flying) model.position.y = 2.8 + Math.sin(performance.now() * 0.002 + model.position.x) * 0.3;
    const difference = new THREE.Vector3().subVectors(target.position, model.position);
    difference.y = 0;
    const distance = difference.length();
    const direction = difference.clone().normalize();
    model.rotation.y = Math.atan2(direction.x, direction.z);
    bot.attackCooldown -= delta;
    bot.stun = Math.max(0, bot.stun - delta);
    const { pivot, limbs } = model.userData;
    if (distance > (bot.boss ? 2.9 : 2.1) && bot.stun <= 0) {
      const chaseSpeed = bot.boss ? bot.bossPreset.speed : 1.7 + Math.min(wave, 4) * 0.14;
      model.position.addScaledVector(direction, delta * chaseSpeed);
      const stride = Math.sin(performance.now() * 0.009 + model.position.x) * 0.38;
      limbs.leftLeg.rotation.x = stride;
      limbs.rightLeg.rotation.x = -stride;
      limbs.leftArm.rotation.x = -stride * 0.5;
      limbs.rightArm.rotation.x = stride * 0.5;
    } else {
      limbs.leftLeg.rotation.x = THREE.MathUtils.damp(limbs.leftLeg.rotation.x, 0, 9, delta);
      limbs.rightLeg.rotation.x = THREE.MathUtils.damp(limbs.rightLeg.rotation.x, 0, 9, delta);
    }
    const attackDistance = bot.flying ? 10 : bot.bossPreset?.acid ? 13 : bot.boss ? 3.45 : 2.45;
    if (distance < attackDistance && bot.attackCooldown <= 0 && bot.stun <= 0 && started) {
      bot.attackCooldown = bot.boss ? 2.7 + Math.random() * 0.6 : 2 + Math.random() * 0.5;
      bot.swing = 0.4;
      playSound(190, 0.06, 'triangle', 0.025);
      if (bot.flying) {
        spawnDragonFireball(bot, target);
      } else if (bot.bossPreset?.acid) {
        spawnAcidAttack(bot, target);
      } else if (Math.random() > 0.15) {
        const damage = bot.boss ? bot.bossPreset.damage + Math.min(wave, 4) : 6 + Math.min(wave, 4);
        if (target === companion) damageCompanion(damage, bot);
        else damagePlayer(damage, bot, target);
      }
    }
    if (bot.swing > 0) {
      bot.swing -= delta;
      limbs.leftArm.rotation.x = -Math.sin((1 - bot.swing / 0.4) * Math.PI) * 1.9;
    }
    if (bot.flying) {
      model.userData.wing1.rotation.z = Math.sin(performance.now() * 0.012) * 0.48;
      model.userData['wing-1'].rotation.z = -Math.sin(performance.now() * 0.012) * 0.48;
    }
    if (bot.hitFlash > 0) { bot.hitFlash -= delta; pivot.scale.setScalar(1 + Math.sin(performance.now() * 0.05) * 0.05); }
    else pivot.scale.setScalar(1);
    const label = labels.get(bot);
    if (label) {
      const labelHeight = 3.08 * (bot.boss ? bot.bossPreset.scale : 1);
      const point = model.position.clone().add(new THREE.Vector3(0, labelHeight, 0)).project(camera);
      const rect = shell.getBoundingClientRect();
      label.style.left = `${(point.x * 0.5 + 0.5) * rect.width}px`;
      label.style.top = `${(-point.y * 0.5 + 0.5) * rect.height}px`;
      label.style.display = point.z < 1 ? 'block' : 'none';
      label.querySelector('.bot-bar i').style.width = `${(bot.health / bot.maxHealth) * 100}%`;
    }
  }
}
function updateEffects(delta) {
  for (let i = temporaryObjects.length - 1; i >= 0; i--) {
    const item = temporaryObjects[i];
    item.life -= delta;
    if (item.riseSpeed) item.object.position.y += item.riseSpeed * delta;
    item.object.scale.multiplyScalar(1 + delta * 3);
    item.object.material.opacity = Math.max(0, item.life / item.maxLife);
    if (item.life <= 0) {
      scene.remove(item.object);
      item.object.geometry.dispose();
      item.object.material.dispose();
      temporaryObjects.splice(i, 1);
    }
  }
}
function updateCamera(delta) {
  const distance = 18.5;
  const horizontalDistance = Math.cos(cameraPitch) * distance;
  const cameraTarget = playerTwo.visible
    ? player.position.clone().add(playerTwo.position).multiplyScalar(0.5)
    : player.position;
  const desired = new THREE.Vector3(
    cameraTarget.x + Math.sin(cameraYaw) * horizontalDistance,
    cameraTarget.y + 1.5 + Math.sin(cameraPitch) * distance,
    cameraTarget.z + Math.cos(cameraYaw) * horizontalDistance,
  );
  camera.position.lerp(desired, 1 - Math.exp(-delta * 3.3));
  camera.lookAt(cameraTarget.x, cameraTarget.y + 1, cameraTarget.z);
}
function updateBossHud() {
  const boss = enemies.find((bot) => bot.alive && bot.boss);
  bossHud.hidden = !boss;
  if (!boss) return;
  bossHudName.textContent = boss.bossPreset.name;
  bossHudFill.style.width = `${(boss.health / boss.maxHealth) * 100}%`;
  bossHudHealth.textContent = `${Math.ceil(boss.health)} / ${boss.maxHealth}`;
}

function tick() {
  requestAnimationFrame(tick);
  const delta = Math.min(clock.getDelta(), 0.05);
  if (shopPaused) {
    renderer.render(scene, camera);
    return;
  }
  updateGamepad(delta);
  for (const fighter of fighters) {
    if (fighter.visible && fighter.userData.health > 0) updatePlayer(fighter, delta);
  }
  updateEnemies(delta);
  updateMagicCat(delta);
  updateBossHud();
  updateProjectiles(delta);
  updateDragonFireballs(delta);
  updateAcidPuddles(delta);
  updateVolcano(delta);
  updateChests(delta);
  updateThrownEnemies(delta);
  updateEffects(delta);
  updateCamera(delta);
  updateShopkeeper();
  if (started && enemies.filter((bot) => bot.alive).length === 0 && spawnTimer > 0) {
    spawnTimer -= delta;
    if (spawnTimer <= 0) { wave++; spawnWave(Math.min((2 + wave) * activePlayers, 8)); }
  }
  renderer.render(scene, camera);
}
function resize() {
  const width = shell.clientWidth;
  const height = shell.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 700 ? 54 : 47;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  const code = event.code.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
  keys.add(key);
  keys.add(code);
  if (event.repeat) return;
  if (key === 'escape' && shopPaused) { closeShop(); return; }
  if (key === 'p' && started) { shopPaused ? closeShop() : openShop(); return; }
  if (key === 'e' && started && !shopPaused) {
    const nearShop = fighters.some((fighter) => fighter.visible && fighter.userData.health > 0 && fighter.position.distanceTo(shopkeeper.position) < 4.5);
    if (nearShop) openShop();
    else showToast('ACÉRCATE A LA PUERTA DEL DUENDE');
    return;
  }
  if (shopPaused) return;
  if (key === 'f2') togglePlayerTwo();
  if (key === 'j') attack('punch', player);
  if (key === 'k') attack('kick', player);
  if (key === 'g') attack('grab', player);
  if (key === 'q') toggleWeaponMode(player);
  if (key === 'l') blockActive = true;
  if (key === ' ' && started) player.userData.pivot.position.y = jumpHeight;
  if (activePlayers > 1) {
    if (code === 'numpad1') attack('punch', playerTwo);
    if (code === 'numpad2') attack('kick', playerTwo);
    if (code === 'numpad3') attack('grab', playerTwo);
    if (code === 'numpaddecimal') toggleWeaponMode(playerTwo);
    if (code === 'numpad0' && started) playerTwo.userData.pivot.position.y = jumpHeight;
    if (code === 'numpad5') playerTwo.userData.blocking = true;
  }
}, { passive: false });
window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  const code = event.code.toLowerCase();
  keys.delete(key);
  keys.delete(code);
  if (key === 'l') blockActive = false;
  if (code === 'numpad5') playerTwo.userData.blocking = false;
});
window.addEventListener('blur', () => { keys.clear(); activeTouches.clear(); touchMoveX = 0; touchMoveY = 0; blockActive = false; mouseLookActive = false; });
renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (!started) return;
  if (event.pointerType === 'mouse') {
    if (event.button === 0) attack('punch');
    if (event.button === 2) blockActive = true;
    mouseLookActive = true;
    renderer.domElement.setPointerCapture(event.pointerId);
  } else if (event.pointerType === 'touch') {
    mouseLookActive = true;
    lookPointerId = event.pointerId;
    lookPointerX = event.clientX;
    lookPointerY = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
  }
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (!started || !mouseLookActive) return;
  if (event.pointerType === 'mouse') {
    cameraYaw -= event.movementX * 0.0045;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch + event.movementY * 0.003, 0.12, 0.95);
  } else if (event.pointerType === 'touch' && event.pointerId === lookPointerId) {
    const deltaX = event.clientX - lookPointerX;
    const deltaY = event.clientY - lookPointerY;
    lookPointerX = event.clientX;
    lookPointerY = event.clientY;
    cameraYaw -= deltaX * 0.008;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch + deltaY * 0.006, 0.12, 0.95);
  }
});
const releaseMouse = (event) => {
  if (event.pointerType === 'touch' && event.pointerId !== lookPointerId) return;
  if (event.pointerType !== 'mouse' && event.pointerType !== 'touch') return;
  mouseLookActive = false;
  if (event.pointerType === 'touch') lookPointerId = null;
  if (event.button === 2) blockActive = false;
};
renderer.domElement.addEventListener('pointerup', releaseMouse);
renderer.domElement.addEventListener('pointercancel', releaseMouse);
renderer.domElement.addEventListener('lostpointercapture', releaseMouse);
startButton.addEventListener('click', startGame);
document.querySelector('#shop-open-button').addEventListener('click', openShop);
document.querySelector('#shop-close').addEventListener('click', closeShop);
document.querySelector('#shop-resume').addEventListener('click', closeShop);
shopModal.addEventListener('click', (event) => {
  const item = event.target.closest('[data-shop-item]');
  if (item) buyShopItem(item.dataset.shopItem);
});
fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shell.requestFullscreen();
  } catch {
    showToast('PANTALLA COMPLETA NO DISPONIBLE');
  }
});
document.addEventListener('fullscreenchange', () => {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa');
  fullscreenButton.title = isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';
  resize();
});
playerTwoToggle.addEventListener('click', togglePlayerTwo);
document.querySelector('#sound-button').addEventListener('click', (event) => {
  soundEnabled = !soundEnabled;
  event.currentTarget.textContent = soundEnabled ? '♫' : '♪';
  event.currentTarget.setAttribute('aria-label', soundEnabled ? 'Desactivar sonidos' : 'Activar sonidos');
  event.currentTarget.title = soundEnabled ? 'Sonidos activados' : 'Sonidos desactivados';
});
const movePad = document.querySelector('#move-pad');
const joystickThumb = document.querySelector('#joystick-thumb');
let joystickPointerId = null;
const updateJoystick = (event) => {
  const bounds = movePad.getBoundingClientRect();
  const travel = bounds.width * 0.29;
  const dx = event.clientX - (bounds.left + bounds.width / 2);
  const dy = event.clientY - (bounds.top + bounds.height / 2);
  const distance = Math.hypot(dx, dy);
  const scale = distance > travel ? travel / distance : 1;
  const x = dx * scale / travel;
  const y = dy * scale / travel;
  const magnitude = Math.hypot(x, y);
  const deadZone = 0.12;
  const adjusted = magnitude <= deadZone ? 0 : Math.min(1, (magnitude - deadZone) / (1 - deadZone));
  const directionScale = magnitude > 0 ? adjusted / magnitude : 0;
  touchMoveX = x * directionScale;
  touchMoveY = y * directionScale;
  joystickThumb.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
};
const releaseJoystick = (event) => {
  if (event.pointerId !== joystickPointerId) return;
  joystickPointerId = null;
  touchMoveX = 0;
  touchMoveY = 0;
  joystickThumb.style.transform = '';
};
movePad.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (joystickPointerId !== null) return;
  joystickPointerId = event.pointerId;
  movePad.setPointerCapture(event.pointerId);
  updateJoystick(event);
});
movePad.addEventListener('pointermove', (event) => {
  if (event.pointerId === joystickPointerId) updateJoystick(event);
});
movePad.addEventListener('pointerup', releaseJoystick);
movePad.addEventListener('pointercancel', releaseJoystick);
movePad.addEventListener('lostpointercapture', releaseJoystick);
document.querySelectorAll('[data-action]').forEach((button) => {
  const action = button.dataset.action;
  const release = (event) => { event.preventDefault(); button.classList.remove('active'); if (action === 'block') blockActive = false; };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault(); button.classList.add('active'); button.setPointerCapture(event.pointerId);
    if (action === 'block') blockActive = true;
    if (action === 'punch' || action === 'kick' || action === 'grab') attack(action);
    if (action === 'jump' && started) player.userData.pivot.position.y = jumpHeight;
    if (action === 'weapon' && started) toggleWeaponMode(player);
  });
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
});
createShopkeeper();
resize();
tick();
