const KEY = 'ssait-memory-best-v1';
const symbols = ['🍓','🌙','🪐','🍄','🐸','🦋','🍋','🐙','🌻','🧊','🎈','🦊'];
const board = document.querySelector('#memory-board');
const sizeSelect = document.querySelector('#memory-size');
const movesNode = document.querySelector('#memory-moves');
const timeNode = document.querySelector('#memory-time');
const pairsNode = document.querySelector('#memory-pairs');
const recordNode = document.querySelector('#memory-record');
const winPanel = document.querySelector('#memory-win');
const winCopy = document.querySelector('#memory-win-copy');
let first = null;
let locked = false;
let moves = 0;
let pairs = 0;
let elapsed = 0;
let startedAt = 0;
let ticker = null;
let flipTimer = null;
let records = readRecords();

function readRecords() {
  try { const data = JSON.parse(localStorage.getItem(KEY) || '{}'); return data && typeof data === 'object' ? data : {}; }
  catch { return {}; }
}
function saveRecords() { try { localStorage.setItem(KEY, JSON.stringify(records)); } catch {} }
function timeText(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function currentTime() { return startedAt ? elapsed + Math.floor((Date.now() - startedAt) / 1000) : elapsed; }
function updateStats() {
  movesNode.textContent = moves;
  timeNode.textContent = timeText(currentTime());
  pairsNode.textContent = `${pairs} / ${Number(sizeSelect.value) * 2}`;
  const record = records[sizeSelect.value];
  recordNode.textContent = record?.moves ? `${record.moves} · ${timeText(record.seconds)}` : '—';
}
function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  return items;
}
function startGame() {
  clearInterval(ticker); clearTimeout(flipTimer); flipTimer = null; first = null; locked = false; moves = 0; pairs = 0; elapsed = 0; startedAt = 0; winPanel.hidden = true; board.replaceChildren();
  const pairCount = Number(sizeSelect.value) * 2;
  const deck = shuffle([...symbols.slice(0, pairCount), ...symbols.slice(0, pairCount)]);
  for (const [index, symbol] of deck.entries()) {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'memory-card'; card.dataset.symbol = symbol;
    card.setAttribute('aria-label', `Карточка ${index + 1}, закрыта`);
    card.addEventListener('click', () => flip(card)); board.append(card);
  }
  updateStats();
}
function flip(card) {
  if (locked || card.classList.contains('open') || card.classList.contains('matched')) return;
  if (!startedAt) { startedAt = Date.now(); ticker = setInterval(updateStats, 500); }
  card.classList.add('open'); card.textContent = card.dataset.symbol; card.setAttribute('aria-label', `Карточка: ${card.dataset.symbol}`);
  if (!first) { first = card; return; }
  moves++;
  if (first.dataset.symbol === card.dataset.symbol) {
    first.classList.add('matched'); card.classList.add('matched'); first.disabled = true; card.disabled = true; pairs++; first = null; updateStats();
    if (pairs === Number(sizeSelect.value) * 2) finish();
    return;
  }
  const previous = first; first = null; locked = true; updateStats();
  flipTimer = setTimeout(() => {
    flipTimer = null;
    for (const item of [previous, card]) { item.classList.remove('open'); item.textContent = ''; item.setAttribute('aria-label', `Карточка ${[...board.children].indexOf(item) + 1}, закрыта`); }
    locked = false;
  }, 750);
}
function finish() {
  clearInterval(ticker); elapsed = currentTime(); startedAt = 0;
  const old = records[sizeSelect.value];
  const improved = !old || moves < old.moves || (moves === old.moves && elapsed < old.seconds);
  if (improved) { records[sizeSelect.value] = { moves, seconds: elapsed }; saveRecords(); }
  records.wins = (Number(records.wins) || 0) + 1; saveRecords(); updateStats();
  winCopy.textContent = `${moves} ходов · ${timeText(elapsed)}${improved ? ' · новый рекорд!' : ''}`;
  winPanel.hidden = false;
}
document.querySelector('#memory-new').addEventListener('click', startGame);
document.querySelector('#memory-again').addEventListener('click', startGame);
sizeSelect.addEventListener('change', startGame);
window.addEventListener('pagehide', () => { clearInterval(ticker); clearTimeout(flipTimer); });
startGame();
