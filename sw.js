const CACHE = 'ssait-shell-v7';
const FILES = [
  './', './index.html', './games/', './chat/', './tools/', './focus/', './notepad/', './idea-lab/', './sound-garden/', './notes/', './projects/', './quests/',
  './game/', './crafting/', './drift/', './runner/', './draw/', './profile/', './puzzle/', './memory/',
  './portal.css', './portal.js', './offline.js', './favicon.svg', './manifest.webmanifest',
  './assets/ssait-worlds.jpg', './vendor/three.module.js', './vendor/three.core.js', './vendor/THREE-LICENSE.txt',
  './chat/chat.css', './chat/chat.js', './tools/tools.css', './tools/tools.js', './focus/focus.js', './notepad/notepad.js', './idea-lab/ideas.js', './sound-garden/sound-garden.css', './sound-garden/sound-garden.js',
  './game/game.css', './game/game.js', './crafting/craft.css', './crafting/craft.js', './games/library.css',
  './drift/drift.css', './drift/drift.js', './runner/runner.css', './runner/runner.js',
  './draw/draw.css', './draw/draw.js', './profile/profile.css', './profile/profile.js', './puzzle/puzzle.css', './puzzle/puzzle.js', './games/games.css', './games/games.js', './quests/quests.css', './quests/quests.js', './memory/memory.css', './memory/memory.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('ssait-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    }).catch(async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      const path = new URL(request.url).pathname;
      const exact = FILES.find(file => new URL(file, self.registration.scope).pathname === path || new URL(file, self.registration.scope).pathname === `${path}/`);
      return exact ? caches.match(exact) : caches.match('./index.html');
    }));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});


