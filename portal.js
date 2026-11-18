const menuButton = document.querySelector('#menu-toggle');
const mainNav = document.querySelector('.main-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  menuButton.textContent = isOpen ? '×' : '☰';
});

mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  if (menuButton) menuButton.textContent = '☰';
}));

const resumeLink = document.querySelector('#resume-room');
if (resumeLink) {
  const allowedRooms = new Set(['game/', 'crafting/', 'drift/', 'runner/', 'draw/', 'puzzle/']);
  try {
    const lastRoom = JSON.parse(localStorage.getItem('ssait-last-room') || 'null');
    if (lastRoom && allowedRooms.has(lastRoom.href)) {
      resumeLink.href = lastRoom.href;
      document.querySelector('#resume-room-title').textContent = lastRoom.title || 'Продолжить игру';
      resumeLink.hidden = false;
    }
  } catch {}
}

const homeLinks = document.querySelectorAll('a[href="game/"],a[href="crafting/"],a[href="drift/"],a[href="runner/"],a[href="draw/"],a[href="puzzle/"]');
homeLinks.forEach(link => link.addEventListener('click', () => {
  try { localStorage.setItem('ssait-last-room', JSON.stringify({ href: link.getAttribute('href'), title: link.querySelector('h3')?.textContent || link.textContent.trim(), at: Date.now() })); } catch {}
}));
