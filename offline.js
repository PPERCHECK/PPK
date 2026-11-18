const offlineEntry = new URL(document.currentScript?.src || 'offline.js', location.href);
const workerUrl = new URL('sw.js', new URL('./', offlineEntry));
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(workerUrl).catch(() => {});
  }, { once: true });
}
