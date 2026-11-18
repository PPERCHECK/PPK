const KEY = 'ssait-quest-log-v1';
const starter = [
  { id: 'world', title: 'Зайти в Beblox и найти новый маршрут', done: false, created: Date.now() },
  { id: 'build', title: 'Построить маленький дом в Crafting Box', done: false, created: Date.now() },
  { id: 'draw', title: 'Нарисовать пиксельный значок мастерской', done: false, created: Date.now() }
];
const suggestions = [
  'Пройти один уровень Signal Shift без подсказок',
  'Построить в Crafting Box место для отдыха',
  'Установить новый личный рекорд в Night Runner',
  'Нарисовать открытку для друга в Pixel Studio',
  'Исследовать три улицы в Beblox',
  'Записать идею новой игры в блокнот'
];
const list = document.querySelector('#quest-list');
const form = document.querySelector('#quest-form');
const input = document.querySelector('#quest-input');
const empty = document.querySelector('#quest-empty');
let tasks = readTasks();
let filter = 'all';
let toastTimer;

function readTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(stored) ? stored.filter(task => task && typeof task.title === 'string').map(task => ({ id: String(task.id), title: task.title.slice(0, 80), done: Boolean(task.done), created: Number(task.created) || Date.now(), completedAt: Number(task.completedAt) || 0 })) : starter;
  } catch { return starter; }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch { showToast('Браузер не разрешил сохранить список'); } }
function showToast(message) {
  const toast = document.querySelector('#quest-toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
}
function render() {
  const done = tasks.filter(task => task.done).length;
  const active = tasks.length - done;
  const xp = done * 25;
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);
  const weekDone = tasks.filter(task => task.done && task.completedAt >= weekStart.getTime()).length;
  document.querySelector('#active-count').textContent = active;
  document.querySelector('#done-count').textContent = done;
  document.querySelector('#rewarded-count').textContent = weekDone;
  document.querySelector('#quest-xp').innerHTML = `${xp} <i>XP</i>`;
  const fill = Math.min(100, weekDone / 5 * 100);
  document.querySelector('#week-fill').style.width = `${fill}%`;
  document.querySelector('#week-hint').textContent = weekDone >= 5 ? 'Пять маленьких побед — уже большая серия!' : `Ещё ${5 - weekDone} ${taskWord(5 - weekDone)} до цели: 5 выполненных миссий.`;
  try { document.querySelector('#quest-profile-name').textContent = localStorage.getItem('ssait-profile-name-v1') || 'Искатель 47'; } catch {}
  const visible = tasks.filter(task => filter === 'all' || (filter === 'done' ? task.done : !task.done));
  list.replaceChildren();
  for (const task of visible) {
    const item = document.createElement('li'); item.className = `quest-item${task.done ? ' done' : ''}`;
    const check = document.createElement('button'); check.className = 'quest-check'; check.type = 'button'; check.setAttribute('aria-label', task.done ? 'Вернуть в активные' : 'Отметить выполненной'); check.textContent = task.done ? '✓' : '';
    check.addEventListener('click', () => { task.done = !task.done; task.completedAt = task.done ? Date.now() : 0; save(); render(); if (task.done) showToast('Миссия закрыта · +25 XP ✳'); });
    const copy = document.createElement('span'); copy.className = 'quest-copy';
    const title = document.createElement('b'); title.textContent = task.title;
    const meta = document.createElement('small'); meta.textContent = task.done ? 'ВЫПОЛНЕНО · +25 XP' : 'МАСТЕРСКАЯ · +25 XP'; copy.append(title, meta);
    const remove = document.createElement('button'); remove.className = 'quest-delete'; remove.type = 'button'; remove.setAttribute('aria-label', 'Удалить миссию'); remove.textContent = '×'; remove.addEventListener('click', () => { tasks = tasks.filter(item => item.id !== task.id); save(); render(); });
    item.append(check, copy, remove); list.append(item);
  }
  empty.hidden = visible.length !== 0;
}
function taskWord(count) { return count % 10 === 1 && count % 100 !== 11 ? 'миссия' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'миссии' : 'миссий'; }
form.addEventListener('submit', event => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) { input.focus(); return; }
  tasks.unshift({ id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, title: title.slice(0, 80), done: false, created: Date.now() });
  input.value = ''; filter = 'all'; document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button.dataset.filter === filter)); save(); render(); showToast('Миссия добавлена ✳');
});
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button)); render(); }));
document.querySelector('#suggest-button').addEventListener('click', () => {
  const available = suggestions.filter(suggestion => !tasks.some(task => task.title === suggestion));
  if (!available.length) { showToast('Все идеи уже добавлены — придумай свою ✳'); input.focus(); return; }
  input.value = available[Math.floor(Math.random() * available.length)]; input.focus();
});
window.addEventListener('storage', event => { if (event.key === 'ssait-profile-name-v1') render(); });
render();
