// Supabase'den (pg_net) gelen bildirimi kişinin telefonlarına iletir.
// Anahtarlar burada saklanmaz; istekle birlikte veritabanından gelir.
import { gonder } from "../lib/webpush.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.statusCode = 405; return res.end(); }
  const b = req.body || {};
  const v = b.vapid || {}, subs = Array.isArray(b.subs) ? b.subs.slice(0, 20) : [], p = b.payload || {};
  if (!v.pub || !v.priv || !subs.length) { res.statusCode = 400; return res.end("eksik"); }
  const payload = { title: String(p.title || "Dotek").slice(0, 80), body: String(p.body || "").slice(0, 300), url: String(p.url || "/dotek").slice(0, 200), tag: String(p.tag || "").slice(0, 60) };
  const sonuc = await Promise.all(subs.map(s => gonder(s, payload, { pub: v.pub, priv: v.priv, sub: v.sub || "https://dotek-enerji.vercel.app" }).catch(() => 0)));
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ sonuc, gone: subs.filter((s, i) => sonuc[i] === 404 || sonuc[i] === 410).map(s => s.endpoint) }));
}
