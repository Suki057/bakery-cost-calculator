/* 最小离线缓存 service worker：让「添加到主屏幕」后的应用可离线使用 */
/* 更新策略：联网时优先从网络拉最新版，同时更新缓存；离线时才用缓存 */
const CACHE = 'bakery-cost-v2';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './app-icon-192.png', './app-icon-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // 网络可用：返回最新响应并更新缓存
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return resp;
      })
      .catch(() => {
        // 离线：回退缓存
        return caches.match(e.request).then(hit => hit || caches.match('./index.html'));
      })
  );
});
