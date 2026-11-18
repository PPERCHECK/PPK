const filters = [...document.querySelectorAll('.tool-filter')];
const cards = [...document.querySelectorAll('.tool-app-card')];
const search = document.querySelector('#tool-search');
const count = document.querySelector('#tool-result-count');
let category = 'all';

function renderApps() {
  const query = search.value.trim().toLocaleLowerCase('ru');
  let visible = 0;
  for (const card of cards) {
    const matchesCategory = category === 'all' || card.dataset.category === category;
    const matchesText = !query || card.textContent.toLocaleLowerCase('ru').includes(query);
    card.hidden = !(matchesCategory && matchesText);
    if (!card.hidden) visible++;
  }
  const lastTwo = visible % 100;
  const last = visible % 10;
  const word = last === 1 && lastTwo !== 11 ? 'КОМНАТА' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'КОМНАТЫ' : 'КОМНАТ';
  count.textContent = `${visible} ${word}`;
  document.querySelector('#tool-empty').hidden = visible > 0;
}

filters.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  filters.forEach(item => item.classList.toggle('active', item === button));
  renderApps();
}));
search.addEventListener('input', renderApps);
renderApps();
