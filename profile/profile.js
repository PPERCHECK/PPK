const profileNameKey = 'ssait-profile-name-v1';
const profileAvatarKey = 'ssait-profile-avatar-v1';
const nameInput = document.querySelector('#profile-name');
const avatarPreview = document.querySelector('#avatar-preview');
const displayName = document.querySelector('#profile-display-name');
const displayAvatar = document.querySelector('#profile-display-avatar');
let avatar = localStorage.getItem(profileAvatarKey) || '🚀';

nameInput.value = localStorage.getItem(profileNameKey) || 'Искатель 47';
avatarPreview.textContent = avatar;
displayName.textContent = nameInput.value;
displayAvatar.textContent = avatar;
nameInput.addEventListener('input', () => { displayName.textContent = nameInput.value.trim() || 'Искатель 47'; });
document.querySelectorAll('[data-avatar]').forEach(button => {
  button.classList.toggle('selected', button.dataset.avatar === avatar);
  button.addEventListener('click', () => {
    avatar = button.dataset.avatar;
    avatarPreview.textContent = avatar;
    displayAvatar.textContent = avatar;
    document.querySelectorAll('[data-avatar]').forEach(item => item.classList.toggle('selected', item === button));
  });
});

let toastTimer;
function showSaved() {
  const toast = document.querySelector('#profile-toast');
  toast.textContent = 'Профиль сохранён на этом устройстве ✳';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

document.querySelector('#profile-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = nameInput.value.trim().slice(0, 18) || 'Искатель 47';
  nameInput.value = name;
  try {
    localStorage.setItem(profileNameKey, name);
    localStorage.setItem(profileAvatarKey, avatar);
    showSaved();
  } catch {
    document.querySelector('#profile-toast').textContent = 'Браузер не разрешил сохранить профиль';
    document.querySelector('#profile-toast').classList.add('show');
  }
});

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}
function readNumber(key) {
  try { return Math.max(0, Number(localStorage.getItem(key)) || 0); }
  catch { return 0; }
}
function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function renderProgress() {
  const signals = [...new Set(readJSON('ssait-beblox-signals-v1', []).filter(Number.isInteger).filter(i => i >= 0 && i < 3))];
  const runner = readNumber('ssait-night-runner-best');
  const drift = readNumber('ssait-drift-best');
  const focus = readNumber('ssait-focus-sessions');
  const build = readJSON('crafting-box-edits', { placed: [] });
  const blocks = Array.isArray(build?.placed) ? build.placed.length : 0;
  const pixel = readJSON('ssait-pixel-studio-v1', []);
  const hasArt = Array.isArray(pixel) && pixel.some(Boolean);
  const puzzle = readJSON('ssait-signal-shift-v1', { best: {} });
  const puzzleBest = puzzle?.best && typeof puzzle.best === 'object' ? puzzle.best : {};
  const puzzleLevels = Object.keys(puzzleBest).filter(level => Number(level) >= 1 && Number(level) <= 5 && Number(puzzleBest[level]) > 0).length;
  const notes = readJSON('ssait-workshop-notes-v1', []);
  const noteCount = Array.isArray(notes) ? notes.length : 0;
  const quests = readJSON('ssait-quest-log-v1', []);
  const questList = Array.isArray(quests) ? quests : [];
  const questDone = questList.filter(task => task?.done).length;

  document.querySelector('#signals-stat').textContent = `${signals.length} / 3`;
  document.querySelector('#runner-stat').textContent = `${Math.floor(runner / 12)} м`;
  document.querySelector('#drift-stat').textContent = drift ? formatTime(drift) : '—';
  document.querySelector('#blocks-stat').textContent = String(blocks);
  document.querySelector('#focus-stat').textContent = String(focus);
  document.querySelector('#art-stat').textContent = hasArt ? 'Готово ✳' : 'Пока пусто';
  document.querySelector('#puzzle-stat').textContent = `${puzzleLevels} / 5`;
  document.querySelector('#notes-stat').textContent = String(noteCount);
  document.querySelector('#quests-stat').textContent = `${questDone} / ${questList.length}`;

  const xp = focus * 20 + signals.length * 25 + Math.floor(Math.min(runner, 5000) / 100) + (drift ? 40 : 0) + Math.min(blocks, 30) * 2 + (hasArt ? 25 : 0) + Math.min(noteCount, 10) * 2 + puzzleLevels * 20 + questDone * 25;
  const level = Math.floor(xp / 100) + 1;
  const levelXP = xp % 100;
  const ranks = ['Новичок', 'Исследователь', 'Создатель', 'Мастер миров', 'Легенда квартала'];
  document.querySelector('#level-number').textContent = String(level).padStart(2, '0');
  document.querySelector('#rank-name').textContent = ranks[Math.min(level - 1, ranks.length - 1)];
  document.querySelector('#xp-label').textContent = `${levelXP} / 100 XP`;
  document.querySelector('#xp-fill').style.width = `${levelXP}%`;
  document.querySelector('#xp-next').textContent = `До уровня ${String(level + 1).padStart(2, '0')} — ${100 - levelXP} XP`;

  const badges = [
    ['✦', 'Первый сигнал', 'Найди сигнал в Beblox', signals.length >= 1],
    ['☼', 'Голос города', 'Собери все 3 сигнала', signals.length === 3],
    ['↟', 'Ночная прогулка', 'Пробеги 1 000 очков', runner >= 1000],
    ['★', 'Город не поймал', 'Пробеги 5 000 очков', runner >= 5000],
    ['◌', 'Первый занос', 'Заверши гонку Drift Box', drift > 0],
    ['▧', 'Свой архитектор', 'Поставь 25 блоков', blocks >= 25],
    ['▦', 'Пиксельный автор', 'Сохрани свой рисунок', hasArt],
    ['◷', 'В своём ритме', 'Заверши фокус-сессию', focus > 0],
    ['⌘', 'Первая связь', 'Пройди первый уровень Signal Shift', puzzleLevels >= 1],
    ['✧', 'Мастер сигнала', 'Пройди все пять уровней', puzzleLevels === 5],
    ['☑', 'Слово сдержано', 'Выполни первую личную миссию', questDone >= 1]
  ];
  const grid = document.querySelector('#badge-grid');
  grid.replaceChildren();
  for (const [icon, title, description, unlocked] of badges) {
    const card = document.createElement('article');
    card.className = `badge-card${unlocked ? '' : ' locked'}`;
    const symbol = document.createElement('span'); symbol.className = 'badge-icon'; symbol.textContent = icon;
    const heading = document.createElement('b'); heading.textContent = title;
    const detail = document.createElement('small'); detail.textContent = unlocked ? 'Открыто · ✳' : description;
    card.append(symbol, heading, detail); grid.append(card);
  }
  document.querySelector('#badge-count').textContent = String(badges.filter(badge => badge[3]).length);
}

renderProgress();
window.addEventListener('focus', renderProgress);
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderProgress(); });
window.addEventListener('storage', event => { if (event.key === 'ssait-quest-log-v1') renderProgress(); });
