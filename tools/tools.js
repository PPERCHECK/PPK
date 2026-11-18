const tabs=[...document.querySelectorAll('.tool-tab')],panels=[...document.querySelectorAll('.tool-panel')];tabs.forEach(t=>t.addEventListener('click',()=>{tabs.forEach(x=>x.classList.toggle('active',x===t));panels.forEach(p=>p.classList.toggle('active',p.id===t.dataset.tab+'-panel'));history.replaceState(null,'','#'+t.dataset.tab)}));const initialTab=location.hash.slice(1);if(['focus','notes','ideas'].includes(initialTab))document.querySelector('[data-tab="'+initialTab+'"]').click();
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

// Autosaved notebook, each note stays in localStorage on this device.
const noteKey='ssait-workshop-notes-v1';let notes=[];try{notes=JSON.parse(localStorage.getItem(noteKey)||'[]')}catch{}if(!Array.isArray(notes))notes=[];if(!notes.length)notes=[{id:'welcome',title:'Добро пожаловать',body:'Записывай сюда задумки, планы и всё, что не хочется потерять.',updated:Date.now()}];let active=notes[0].id;const list=document.querySelector('#notes-list'),title=document.querySelector('#note-title'),body=document.querySelector('#note-body'),status=document.querySelector('#note-status');function saveNotes(){try{localStorage.setItem(noteKey,JSON.stringify(notes))}catch{}status.textContent='Сохранено · '+new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}function renderNotes(){list.innerHTML='';notes.sort((a,b)=>b.updated-a.updated).forEach(n=>{const el=document.createElement('div');el.className='note-item'+(n.id===active?' active':'');const b=document.createElement('b');b.textContent=n.title||'Без названия';const s=document.createElement('small');s.textContent=n.body||'Пустая заметка';el.append(b,s);el.addEventListener('click',()=>{active=n.id;renderNotes();loadNote()});list.append(el)})}function loadNote(){const n=notes.find(x=>x.id===active);title.value=n?.title||'';body.value=n?.body||''}function updateNote(){const n=notes.find(x=>x.id===active);if(!n)return;n.title=title.value;n.body=body.value;n.updated=Date.now();saveNotes();renderNotes()}title.addEventListener('input',updateNote);body.addEventListener('input',updateNote);document.querySelector('#new-note').addEventListener('click',()=>{const n={id:crypto.randomUUID?.()||String(Date.now()),title:'',body:'',updated:Date.now()};notes.unshift(n);active=n.id;renderNotes();loadNote();title.focus();saveNotes()});document.querySelector('#delete-note').addEventListener('click',()=>{if(notes.length<=1){title.value='';body.value='';updateNote();return}notes=notes.filter(n=>n.id!==active);active=notes[0].id;renderNotes();loadNote();saveNotes()});renderNotes();loadNote();
// Seeded idea cards can be reshuffled; copy uses the clipboard when available.
const ideas=[['ИГРА · МИР','Построй остров, на котором каждый новый игрок приносит один неожиданный блок.'],['АРКАДА · ВЫЗОВ','Гонка по городу, где трасса каждый круг меняет одно правило.'],['МИКРОПРИЛОЖЕНИЕ','Карта настроения, которая превращает один короткий ответ в цветной пейзаж.'],['ИСТОРИЯ · ВЫБОР','Найди пять предметов в комнате — каждый рассказывает другую версию одного дня.'],['ИГРА · КООП','Два игрока видят разные половины чертежа и вместе собирают механизм.'],['МИР · ИССЛЕДОВАНИЕ','Маленький ночной рынок, где у каждого торговца своя головоломка.'],['ИНСТРУМЕНТ · ТВОРЧЕСТВО','Генератор мини-проектов: один час, три цвета и предмет, который лежит рядом.'],['АРКАДА · РЕАКЦИЯ','Уклоняйся от волн препятствий, которые двигаются под ритм музыки.']];let lastIdea=-1;function newIdea(){let i=Math.floor(Math.random()*ideas.length);if(i===lastIdea)i=(i+1)%ideas.length;lastIdea=i;document.querySelector('#idea-category').textContent=ideas[i][0];document.querySelector('#idea-text').textContent=ideas[i][1]}document.querySelector('#new-idea').addEventListener('click',newIdea);document.querySelector('#copy-idea').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.querySelector('#idea-text').textContent);document.querySelector('#copy-idea').textContent='Скопировано ✓';setTimeout(()=>document.querySelector('#copy-idea').textContent='Копировать',1300)}catch{document.querySelector('#idea-text').select?.()}});newIdea();
