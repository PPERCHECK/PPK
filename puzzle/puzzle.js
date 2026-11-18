const storageKey = 'ssait-signal-shift-v1';
const DIRS = ['n', 'e', 's', 'w'];
const DELTAS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const levels = [
  { title: 'Первый контакт', route: [[2,0],[2,1],[3,1],[3,2],[3,3],[4,3]] },
  { title: 'Тихая улица', route: [[0,2],[1,2],[1,1],[2,1],[3,1],[3,2],[4,2]] },
  { title: 'Поворот за углом', route: [[0,1],[1,1],[1,2],[1,3],[2,3],[3,3],[3,4],[4,4]] },
  { title: 'Старый квартал', route: [[2,0],[1,0],[1,1],[1,2],[2,2],[2,3],[3,3],[4,3]] },
  { title: 'Последний маяк', route: [[0,4],[1,4],[2,4],[2,3],[2,2],[3,2],[3,1],[4,1]] }
];
let saved = { unlocked: 1, best: {} };
try { saved = { ...saved, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; } catch {}
saved.unlocked = Math.max(1, Math.min(levels.length, Number(saved.unlocked) || 1));
saved.best = saved.best && typeof saved.best === 'object' ? saved.best : {};
let levelIndex = 0, moves = 0, tiles = [], solved = false, hintTimer;

const board = document.querySelector('#circuit-board');
const message = document.querySelector('#shift-message');
const nextButton = document.querySelector('#next-button');

function cellId([x, y]) { return y * 5 + x; }
function direction(from, to) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  if (dx === 1) return 1;
  if (dy === 1) return 2;
  if (dx === -1) return 3;
  return 0;
}
function turn(dirs) { return dirs.map(dir => (dir + 1) % 4); }

function createLevel() {
  const route = levels[levelIndex].route;
  tiles = Array.from({ length: 25 }, () => ({ active: false, dirs: [], target: [] }));
  for (let i = 0; i < route.length; i++) {
    const id = cellId(route[i]), target = [];
    if (i > 0) target.push(direction(route[i], route[i - 1]));
    if (i < route.length - 1) target.push(direction(route[i], route[i + 1]));
    tiles[id] = { active: true, target, dirs: turn(target) };
  }
  moves = 0; solved = false; nextButton.hidden = true;
  document.querySelector('#level-label').textContent = String(levelIndex + 1).padStart(2, '0');
  document.querySelector('#level-title').textContent = levels[levelIndex].title;
  document.querySelector('#move-count').textContent = '00';
  document.querySelector('#best-moves').textContent = saved.best[levelIndex + 1] || '—';
  document.querySelector('#tile-hint').textContent = 'НАЖМИ НА ДЕТАЛЬ, ЧТОБЫ ПОВЕРНУТЬ';
  document.querySelector('.board-frame').classList.remove('connected');
  message.className = 'shift-message';
  message.textContent = 'Найди дорогу от маяка к выходу.';
  renderBoard(); renderLevels();
}

function renderLevels() {
  const host = document.querySelector('#level-buttons'); host.replaceChildren();
  document.querySelector('#unlock-status').textContent = `${String(saved.unlocked).padStart(2, '0')} / 05 ОТКРЫТО`;
  levels.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'level-button' + (index === levelIndex ? ' active' : '');
    button.textContent = String(index + 1).padStart(2, '0');
    button.disabled = index + 1 > saved.unlocked;
    button.setAttribute('aria-label', `Уровень ${index + 1}${button.disabled ? ', закрыт' : ''}`);
    button.addEventListener('click', () => { levelIndex = index; createLevel(); });
    host.append(button);
  });
}

function renderBoard() {
  board.replaceChildren();
  const route = levels[levelIndex].route;
  const start = cellId(route[0]), goal = cellId(route.at(-1));
  tiles.forEach((tile, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'circuit-tile';
    if (!tile.active) {
      button.classList.add('blank'); button.disabled = true; button.setAttribute('aria-label', 'Пустая клетка'); board.append(button); return;
    }
    button.classList.add('active');
    if (index === start) button.classList.add('start');
    if (index === goal) button.classList.add('goal');
    button.setAttribute('aria-label', index === start ? 'Маяк, повернуть деталь' : index === goal ? 'Выход, повернуть деталь' : 'Деталь цепи, повернуть');
    tile.dirs.forEach(dir => {
      const arm = document.createElement('i'); arm.className = `circuit-arm arm-${DIRS[dir]}`; button.append(arm);
    });
    if (index === start || index === goal) {
      const node = document.createElement('span'); node.className = 'tile-node'; node.textContent = index === start ? '✦' : '↗'; button.append(node);
    }
    button.addEventListener('click', () => rotateTile(index, button));
    board.append(button);
  });
}

function connectedPath() {
  const route = levels[levelIndex].route;
  const start = cellId(route[0]), goal = cellId(route.at(-1));
  const queue = [start], seen = new Set(queue);
  while (queue.length) {
    const current = queue.shift();
    if (current === goal) return true;
    const x = current % 5, y = Math.floor(current / 5);
    for (const dir of tiles[current].dirs) {
      const [dx, dy] = DELTAS[dir], nx = x + dx, ny = y + dy;
      if (nx < 0 || nx > 4 || ny < 0 || ny > 4) continue;
      const next = ny * 5 + nx;
      if (tiles[next].active && tiles[next].dirs.includes((dir + 2) % 4) && !seen.has(next)) {
        seen.add(next); queue.push(next);
      }
    }
  }
  return false;
}

function rotateTile(index, button) {
  if (solved) return;
  tiles[index].dirs = turn(tiles[index].dirs);
  button.querySelectorAll('.circuit-arm').forEach(arm => arm.remove());
  tiles[index].dirs.forEach(dir => {
    const arm = document.createElement('i'); arm.className = `circuit-arm arm-${DIRS[dir]}`; button.append(arm);
  });
  moves++;
  document.querySelector('#move-count').textContent = String(moves).padStart(2, '0');
  document.querySelector('#tile-hint').textContent = `${moves} ${moves === 1 ? 'ХОД' : 'ХОДА'} · ПОВОРАЧИВАЙ ДАЛЬШЕ`;
  if (connectedPath()) finishLevel();
}

function finishLevel() {
  solved = true;
  document.querySelector('.board-frame').classList.add('connected');
  message.className = 'shift-message success';
  message.textContent = `Связь восстановлена за ${moves} ходов ✳`;
  const level = levelIndex + 1;
  if (!saved.best[level] || moves < saved.best[level]) saved.best[level] = moves;
  saved.unlocked = Math.max(saved.unlocked, Math.min(levels.length, level + 1));
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch {}
  document.querySelector('#best-moves').textContent = saved.best[level];
  document.querySelector('#tile-hint').textContent = 'СИГНАЛ ПРОШЁЛ ПО ЦЕПИ';
  if (level < levels.length) { nextButton.hidden = false; nextButton.focus({ preventScroll: true }); }
  renderLevels();
}

document.querySelector('#hint-button').addEventListener('click', () => {
  clearTimeout(hintTimer);
  board.querySelectorAll('.path-hint').forEach(tile => tile.classList.remove('path-hint'));
  levels[levelIndex].route.forEach(([x, y]) => board.children[cellId([x, y])].classList.add('path-hint'));
  document.querySelector('#tile-hint').textContent = 'ПУТЬ ПОДСВЕЧЕН · ПОПРОБУЙ СОБРАТЬ ЕГО';
  hintTimer = setTimeout(() => {
    board.querySelectorAll('.path-hint').forEach(tile => tile.classList.remove('path-hint'));
    document.querySelector('#tile-hint').textContent = solved ? 'СИГНАЛ ПРОШЁЛ ПО ЦЕПИ' : 'НАЖМИ НА ДЕТАЛЬ, ЧТОБЫ ПОВЕРНУТЬ';
  }, 1700);
});
document.querySelector('#reset-button').addEventListener('click', createLevel);
nextButton.addEventListener('click', () => { if (levelIndex + 1 < saved.unlocked) { levelIndex++; createLevel(); } });

createLevel();
