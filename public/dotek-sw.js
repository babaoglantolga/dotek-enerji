// Dotek Saha — telefona "uygulama" olarak eklenebilmesi için. Veri önbelleğe alınmaz; her şey canlı gelir.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#0D1526;color:#fff;font:16px system-ui;text-align:center;padding:24px"><div><div style="font-size:44px">📶</div><h2>İnternet yok</h2><p>Bağlantı gelince sayfayı yenileyin.</p></div>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
