const chips = document.querySelectorAll('.filter-chip');
const cards = document.querySelectorAll('.catalog-grid .world-card');
chips.forEach(chip => chip.addEventListener('click', () => {
  chips.forEach(item => item.classList.toggle('active', item === chip));
  const filter = chip.dataset.filter;
  cards.forEach(card => { card.hidden = filter !== 'all' && card.dataset.type !== filter; });
}));
