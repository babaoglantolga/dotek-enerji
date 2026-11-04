// Dotek Saha — telefona "uygulama" olarak eklenebilmesi için. Veri önbelleğe alınmaz; her şey canlı gelir.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#0D1526;color:#fff;font:16px system-ui;text-align:center;padding:24px"><div><div style="font-size:44px">📶</div><h2>İnternet yok</h2><p>Bağlantı gelince sayfayı yenileyin.</p></div>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});

// Telefona bildirim (program kapalıyken de)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Dotek', {
    body: d.body || 'Yeni bildirim', icon: '/ikon/ikon-192.png?v=3', badge: '/ikon/ikon-192.png?v=3',
    tag: d.tag || undefined, data: { url: d.url || '/dotek' }, lang: 'tr', vibrate: [120, 60, 120]
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/dotek';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    const w = l.find(c => c.url.includes('/dotek'));
    if (w) { w.postMessage({ tip: 'bildirim' }); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
