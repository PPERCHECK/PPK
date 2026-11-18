const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const stage = document.querySelector('.run-stage');
const startButton = document.querySelector('#start-button');
const jumpButton = document.querySelector('#jump-button');
const scoreLabel = document.querySelector('#score');
const bestLabel = document.querySelector('#best');
const paceLabel = document.querySelector('#pace');
const distanceLabel = document.querySelector('#distance-label');
const title = document.querySelector('#overlay-title');
const copy = document.querySelector('#overlay-copy');
const eyebrow = document.querySelector('#overlay-eyebrow');
const bestKey = 'ssait-night-runner-best';
const input = new Set();

let w = 0, h = 0, dpr = 1, state = 'ready', lastFrame = 0, distance = 0, speed = 320, spawnTimer = 0, best = Number(localStorage.getItem(bestKey)) || 0, soundOn = false, audio;
let player = {x: 105, y: 0, vy: 0, jumps: 0, width: 34, height: 42};
let obstacles = [], sparks = [], particles = [], floorY = 0, world = 0;

function resize() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = rect.width; h = rect.height;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  floorY = h * .78;
  player.x = Math.max(56, Math.min(115, w * .18));
  if (state !== 'running') player.y = floorY - player.height;
  draw(0);
}

function formatted(value) { return String(Math.floor(value)).padStart(6, '0'); }
function updateLabels() {
  scoreLabel.textContent = formatted(distance);
  bestLabel.textContent = formatted(best);
  paceLabel.textContent = `x${(speed / 320).toFixed(1)}`;
  distanceLabel.textContent = `${(distance / 12).toFixed(0)} М · ${state === 'running' ? 'НОЧЬ ВПЕРЕДИ' : state === 'paused' ? 'ПАУЗА' : state === 'over' ? 'ЗАБЕГ ОКОНЧЕН' : 'ГОРОД ЖДЁТ'}`;
}

function sound(frequency = 440, length = .055) {
  if (!soundOn) return;
  try {
    audio ||= new AudioContext();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.045, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + length);
  } catch {}
}

function startRun() {
  distance = 0; speed = 320; spawnTimer = .6; obstacles = []; sparks = []; particles = [];
  player.y = floorY - player.height; player.vy = 0; player.jumps = 0;
  state = 'running'; lastFrame = 0;
  stage.classList.add('playing'); overlay.classList.add('hidden');
  startButton.innerHTML = 'Начать забег <span>↗</span>';
  updateLabels();
}

function resumeRun() {
  if (state !== 'paused') return startRun();
  state = 'running'; lastFrame = 0;
  stage.classList.add('playing'); overlay.classList.add('hidden');
  startButton.innerHTML = 'Начать забег <span>↗</span>';
  updateLabels();
}

function finishRun() {
  state = 'over'; stage.classList.remove('playing'); overlay.classList.remove('hidden');
  eyebrow.textContent = 'ЗАБЕГ ЗАВЕРШЁН'; title.innerHTML = 'Город<br><em>поймал.</em>';
  copy.textContent = `Ты пробежал ${(distance / 12).toFixed(0)} метров. Ещё одна попытка — и можно дальше.`;
  startButton.innerHTML = 'Ещё один забег <span>↻</span>';
  if (distance > best) { best = Math.floor(distance); localStorage.setItem(bestKey, String(best)); sound(720, .13); }
  updateLabels();
}

function jump() {
  if (state === 'ready' || state === 'over') { startRun(); return; }
  if (state !== 'running' || player.jumps >= 2) return;
  player.vy = player.jumps === 0 ? -690 : -590;
  player.jumps++;
  for (let i = 0; i < 7; i++) particles.push({x: player.x + player.width * .5, y: floorY - 4, vx: (Math.random() - .5) * 150, vy: -Math.random() * 150, life: .35, max: .35, color: i % 3 ? '#d7ff73' : '#ff9a7c'});
  sound(player.jumps === 1 ? 520 : 760, .06);
}

function addObstacle() {
  const type = Math.random();
  if (type > .82) {
    sparks.push({x: w + 20, y: floorY - 72 - Math.random() * 62, r: 8, taken: false, phase: Math.random() * 5});
    return;
  }
  const width = type < .35 ? 20 : 27 + Math.random() * 14;
  const height = type < .35 ? 30 : 28 + Math.random() * 25;
  obstacles.push({x: w + 20, y: floorY - height, width, height, kind: Math.random() > .54 ? 'spike' : 'block'});
  if (type > .66) obstacles.push({x: w + 20 + 54, y: floorY - 33, width: 20, height: 33, kind: 'spike'});
}

function roundedRect(x, y, width, height, radius, fill) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill();
}

function drawBackground(dt) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#19172f'); sky.addColorStop(.5, '#4b3970'); sky.addColorStop(.79, '#bb718b'); sky.addColorStop(1, '#503755');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  const moonX = w * .78, moonY = h * .2;
  const halo = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 85);
  halo.addColorStop(0, '#ffe6b699'); halo.addColorStop(1, '#ffe6b600');
  ctx.fillStyle = halo; ctx.fillRect(moonX - 85, moonY - 85, 170, 170);
  ctx.fillStyle = '#f6e1ca'; ctx.beginPath(); ctx.arc(moonX, moonY, 25, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 35; i++) {
    const x = (i * 131 - world * .015) % (w + 30);
    const px = x < 0 ? x + w + 30 : x;
    const y = (i * 47 % Math.max(h * .54, 1));
    ctx.fillStyle = i % 5 ? '#fff9' : '#ffe5a6'; ctx.globalAlpha = .2 + (i % 4) * .13;
    ctx.fillRect(px, y, i % 7 === 0 ? 2 : 1.4, i % 7 === 0 ? 2 : 1.4);
  }
  ctx.globalAlpha = 1;
  const farOffset = world * .08 % 160;
  ctx.fillStyle = '#342b4f';
  for (let x = -180 - farOffset; x < w + 160; x += 160) {
    const bw = 55 + (Math.abs(x / 10) % 30);
    const bh = h * (.12 + (Math.abs(x / 8) % 13) / 100);
    ctx.fillRect(x, floorY - bh - 34, bw, bh + 35);
    ctx.fillStyle = '#facd8f55';
    for (let wx = x + 10; wx < x + bw - 5; wx += 13) for (let wy = floorY - bh - 21; wy < floorY - 40; wy += 17) if ((wx + wy) % 3 < 1) ctx.fillRect(wx, wy, 4, 6);
    ctx.fillStyle = '#342b4f';
  }
  const nearOffset = world * .22 % 120;
  ctx.fillStyle = '#29243f';
  for (let x = -125 - nearOffset; x < w + 100; x += 120) {
    const bh = h * (.08 + (Math.abs(x / 13) % 9) / 100);
    ctx.beginPath(); ctx.moveTo(x, floorY - 32); ctx.lineTo(x + 36, floorY - bh - 32); ctx.lineTo(x + 81, floorY - 32); ctx.closePath(); ctx.fill();
  }
  const ground = ctx.createLinearGradient(0, floorY, 0, h);
  ground.addColorStop(0, '#47334f'); ground.addColorStop(1, '#251f38');
  ctx.fillStyle = ground; ctx.fillRect(0, floorY, w, h - floorY);
  ctx.fillStyle = '#d7ff73'; ctx.globalAlpha = .75; ctx.fillRect(0, floorY, w, 2); ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff29';
  for (let x = -(world % 98); x < w; x += 98) roundedRect(x, floorY + 26, 48, 2, 2, '#ffffff29');
  for (let x = -(world * .42 % 140); x < w; x += 140) roundedRect(x, floorY + 62, 34, 1, 1, '#ffffff20');
}

function drawPlayer(time) {
  const bob = state === 'running' && player.y >= floorY - player.height - 1 ? Math.sin(time * .02) * 1.6 : 0;
  const px = player.x, py = player.y + bob;
  ctx.save();
  ctx.globalAlpha = .22; ctx.fillStyle = '#070710'; ctx.beginPath(); ctx.ellipse(px + 17, floorY + 3, player.jumps ? 14 : 20, player.jumps ? 3 : 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowColor = '#d7ff73'; ctx.shadowBlur = 17;
  roundedRect(px + 2, py + 10, player.width - 4, player.height - 8, 9, '#d7ff73');
  ctx.shadowBlur = 0;
  roundedRect(px + 5, py, player.width - 8, 23, 9, '#ffd0b3');
  roundedRect(px + 2, py + 2, player.width - 4, 9, 6, '#514072');
  ctx.fillStyle = '#302342'; ctx.fillRect(px + 23, py + 11, 3, 4);
  ctx.fillStyle = '#443454'; ctx.fillRect(px + 7, py + 34, 8, 9); ctx.fillRect(px + 21, py + 34, 8, 9);
  ctx.restore();
}

function drawObstacle(obstacle) {
  ctx.save();
  if (obstacle.kind === 'spike') {
    ctx.shadowColor = '#ff9a7c'; ctx.shadowBlur = 13;
    ctx.fillStyle = '#ff9a7c'; ctx.beginPath(); ctx.moveTo(obstacle.x, floorY); ctx.lineTo(obstacle.x + obstacle.width * .5, obstacle.y); ctx.lineTo(obstacle.x + obstacle.width, floorY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd6b4'; ctx.globalAlpha = .8; ctx.beginPath(); ctx.moveTo(obstacle.x + obstacle.width * .48, obstacle.y + 8); ctx.lineTo(obstacle.x + obstacle.width * .78, floorY - 3); ctx.lineTo(obstacle.x + obstacle.width * .56, floorY - 3); ctx.closePath(); ctx.fill();
  } else {
    ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 12;
    roundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 5, '#a78bfa');
    ctx.shadowBlur = 0; ctx.strokeStyle = '#e5d7ff'; ctx.globalAlpha = .7; ctx.strokeRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
  }
  ctx.restore();
}

function draw(time) {
  ctx.clearRect(0, 0, w, h);
  drawBackground(0);
  for (const spark of sparks) {
    if (spark.taken) continue;
    const y = spark.y + Math.sin(time * .004 + spark.phase) * 4;
    ctx.save(); ctx.translate(spark.x, y); ctx.rotate(Math.PI / 4);
    ctx.shadowColor = '#d7ff73'; ctx.shadowBlur = 15; roundedRect(-6, -6, 12, 12, 2, '#d7ff73');
    ctx.restore();
  }
  obstacles.forEach(drawObstacle);
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.max); ctx.fillStyle = particle.color; ctx.fillRect(particle.x, particle.y, 3, 3);
  }
  ctx.globalAlpha = 1;
  drawPlayer(time);
}

function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y + 4 < b.y + b.height && a.y + a.height - 3 > b.y;
}

function frame(time) {
  requestAnimationFrame(frame);
  const dt = Math.min((time - (lastFrame || time)) / 1000, .032); lastFrame = time;
  if (state === 'running') {
    world += speed * dt; distance += speed * dt * .08; speed = Math.min(630, 320 + distance * .065);
    player.vy += 1780 * dt; player.y += player.vy * dt;
    if (player.y >= floorY - player.height) { player.y = floorY - player.height; player.vy = 0; player.jumps = 0; }
    spawnTimer -= dt;
    if (spawnTimer <= 0) { addObstacle(); spawnTimer = Math.max(.68, 1.42 - (speed - 320) / 900) + Math.random() * .5; }
    obstacles.forEach(obstacle => obstacle.x -= speed * dt); obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > -30);
    sparks.forEach(spark => {
      spark.x -= speed * dt;
      if (!spark.taken && intersects({x:player.x,y:player.y,width:player.width,height:player.height},{x:spark.x-spark.r,y:spark.y-spark.r,width:spark.r*2,height:spark.r*2})) {
        spark.taken = true; distance += 45; sound(880, .045);
      }
    });
    sparks = sparks.filter(spark => !spark.taken && spark.x > -30);
    particles.forEach(particle => {particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += 220 * dt; particle.life -= dt;});
    particles = particles.filter(particle => particle.life > 0);
    if (obstacles.some(obstacle => intersects(player, obstacle))) { sound(150, .18); finishRun(); }
    updateLabels();
  }
  draw(time);
}

startButton.addEventListener('click', () => state === 'paused' ? resumeRun() : startRun());
jumpButton.addEventListener('pointerdown', event => { event.preventDefault(); jump(); });
canvas.addEventListener('pointerdown', event => { if (state !== 'paused') jump(); });
document.querySelector('#pause-button').addEventListener('click', () => {
  if (state === 'running') { state = 'paused'; overlay.classList.remove('hidden'); eyebrow.textContent = 'ПЕРЕДЫШКА'; title.innerHTML = 'Пауза<span style="color:var(--lime)">.</span>'; copy.textContent = `Дистанция — ${(distance / 12).toFixed(0)} метров. Готов продолжить?`; startButton.innerHTML = 'Продолжить <span>▶</span>'; stage.classList.remove('playing'); }
  else if (state === 'paused') resumeRun();
});
document.querySelector('#sound-toggle').addEventListener('click', event => {
  soundOn = !soundOn; event.currentTarget.textContent = soundOn ? '♫' : '♩'; event.currentTarget.setAttribute('aria-label', soundOn ? 'Звук включён' : 'Звук выключен'); sound(620);
});
window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if ([' ', 'arrowup', 'w'].includes(key)) { event.preventDefault(); if (!input.has(key)) jump(); }
  if (key === 'p') document.querySelector('#pause-button').click();
  input.add(key);
});
window.addEventListener('keyup', event => input.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => input.clear());
window.addEventListener('resize', resize);

bestLabel.textContent = formatted(best); resize(); requestAnimationFrame(frame);

