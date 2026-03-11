const CACHE = 'navigator-v1';
const OFFLINE_URL = './index.html';

// 安裝時快取殼層（Shell）
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([OFFLINE_URL])).then(() => self.skipWaiting())
  );
});

// 啟動時清除舊快取
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 攔截請求：網路優先，失敗時回傳快取
self.addEventListener('fetch', e => {
  // 只處理 GET，忽略 Supabase API 請求
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 成功時順便更新快取
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => cached || caches.match(OFFLINE_URL))
      )
  );
});
