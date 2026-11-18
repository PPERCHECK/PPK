// Keep the home screen usable on small touch devices.
document.querySelectorAll('.app-card').forEach(card => {
  card.addEventListener('focus', () => card.classList.add('focused'));
});

