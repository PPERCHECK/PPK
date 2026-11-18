// Focus timer keeps its deadline locally, so a background tab or reload won't lose time.
const timerKey = 'ssait-focus-timer-v1';
const focusDurations = new Set([5, 15, 25].map(minutes => minutes * 60));
let duration = 25 * 60;
let remaining = duration;
let deadline = 0;
let timerId = null;
const timer = document.querySelector('#timer');
const toggle = document.querySelector('#timer-toggle');
const caption = document.querySelector('#timer-caption');
const sessionNode = document.querySelector('#session-count');
const taskInput = document.querySelector('#focus-task');
function readStoredJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function storeValue(key, value) { try { localStorage.setItem(key, value); } catch {} }
let sessions = Math.max(0, Number(readStoredJSON('ssait-focus-sessions', 0)) || 0);
const savedTimer = readStoredJSON(timerKey, {});
if (focusDurations.has(Number(savedTimer?.duration))) duration = Number(savedTimer.duration);
document.querySelectorAll('.mode').forEach(mode => mode.classList.toggle('active', Number(mode.dataset.minutes) * 60 === duration));
remaining = Math.min(duration, Math.max(1, Number(savedTimer?.remaining) || duration));
deadline = Number(savedTimer?.deadline) || 0;
sessionNode.textContent = sessions;
caption.textContent = duration > 600 ? 'ОДНА ЗАДАЧА ЗА РАЗ' : 'ВРЕМЯ ПЕРЕВЕСТИ ДУХ';
try { taskInput.value = localStorage.getItem('ssait-focus-task') || ''; } catch { taskInput.value = ''; }
taskInput.addEventListener('input', () => storeValue('ssait-focus-task', taskInput.value));
function showTime() { timer.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`; }
function startLabel() { return duration === 25 * 60 ? 'Начать фокус ↗' : 'Начать перерыв ↗'; }
function persistTimer() { storeValue(timerKey, JSON.stringify({ duration, remaining, deadline, running: Boolean(deadline) })); }
function finishTimer() {
  clearInterval(timerId); timerId = null; deadline = 0; remaining = duration; showTime();
  if (duration === 25 * 60) {
    sessions++;
    storeValue('ssait-focus-sessions', String(sessions));
    sessionNode.textContent = sessions;
    caption.textContent = 'СЕССИЯ ЗАВЕРШЕНА — ХОРОШАЯ РАБОТА ✳';
    toggle.textContent = 'Начать снова ↗';
  } else {
    caption.textContent = 'ПЕРЕРЫВ ЗАВЕРШЁН — МОЖНО ПРОДОЛЖИТЬ';
    toggle.textContent = 'Начать перерыв ↗';
  }
  persistTimer();
}
function tickTimer() {
  remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  showTime();
  if (remaining <= 0) finishTimer();
}
function startTimer() {
  deadline = Date.now() + remaining * 1000;
  toggle.textContent = 'Пауза';
  caption.textContent = duration > 600 ? 'ОДНА ЗАДАЧА ЗА РАЗ' : 'ВРЕМЯ ПЕРЕВЕСТИ ДУХ';
  persistTimer();
  clearInterval(timerId);
  timerId = setInterval(tickTimer, 500);
}
showTime();
if (savedTimer?.running && deadline) {
  remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  if (remaining > 0) { toggle.textContent = 'Пауза'; timerId = setInterval(tickTimer, 500); } else finishTimer();
} else {
  deadline = 0;
  toggle.textContent = savedTimer?.remaining && remaining < duration ? 'Продолжить ↗' : startLabel();
  persistTimer();
}
document.querySelectorAll('.mode').forEach(mode => mode.addEventListener('click', () => {
  document.querySelectorAll('.mode').forEach(item => item.classList.toggle('active', item === mode));
  duration = Number(mode.dataset.minutes) * 60;
  remaining = duration;
  clearInterval(timerId); timerId = null; deadline = 0;
  toggle.textContent = startLabel();
  caption.textContent = duration > 600 ? 'ОДНА ЗАДАЧА ЗА РАЗ' : 'ВРЕМЯ ПЕРЕВЕСТИ ДУХ';
  showTime(); persistTimer();
}));
toggle.addEventListener('click', () => {
  if (deadline) {
    tickTimer();
    if (!deadline) return;
    clearInterval(timerId); timerId = null; deadline = 0;
    toggle.textContent = 'Продолжить ↗'; persistTimer(); return;
  }
  if (remaining <= 0) remaining = duration;
  startTimer();
});
document.querySelector('#timer-reset').addEventListener('click', () => {
  clearInterval(timerId); timerId = null; deadline = 0; remaining = duration;
  showTime(); toggle.textContent = startLabel(); persistTimer();
});
window.addEventListener('pagehide', () => { if (deadline) persistTimer(); });
window.addEventListener('focus', () => { if (deadline) tickTimer(); });

