// Cari-Kasa · Kapıda satış: fotoğraftan stok ürününü bulur (Claude görsel tanıma).
// Yalnızca giriş yapmış Cari-Kasa kullanıcıları (Supabase oturumu) kullanabilir.
import { sendJson } from "../lib/util.js";

const SB_URL = "https://lbrbbmpebmepbrvxdfyi.supabase.co";
const SB_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxicmJibXBlYm1lcGJydnhkZnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNTU4NTgsImV4cCI6MjEwNzgzMTg1OH0.UaXo2-XKSL2asf1wSniJT3sYUzmvMLINcrzB50evSiA";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "method" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return sendJson(res, 503, { error: "tanıma kapalı" });

  const tok = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!tok) return sendJson(res, 401, { error: "giriş gerekli" });
  try {
    const a = await fetch(SB_URL + "/auth/v1/user", { headers: { apikey: SB_ANON, authorization: "Bearer " + tok } });
    if (!a.ok) return sendJson(res, 401, { error: "giriş gerekli" });
  } catch (e) {
    return sendJson(res, 502, { error: "oturum kontrol edilemedi" });
  }

  const b = req.body || {};
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.foto || ""));
  if (!m || m[2].length > 3000000) return sendJson(res, 400, { error: "fotoğraf geçersiz" });
  const L = (Array.isArray(b.urunler) ? b.urunler : [])
    .slice(0, 4000)
    .filter(x => Array.isArray(x) && x.length >= 2)
    .map(x => [String(x[0]).replace(/[^\w.-]/g, "").slice(0, 40), String(x[1]).replace(/[\r\n|]/g, " ").slice(0, 140)])
    .filter(x => x[0] && x[1]);
  if (!L.length) return sendJson(res, 400, { error: "ürün listesi boş" });
  const ids = new Set(L.map(x => x[0]));

  const liste = L.map(([id, ad]) => id + " | " + ad).join("\n");
  const istem =
    "Bu fotoğraf bir elektrik/elektronik malzeme dükkânında çekildi. Fotoğraftaki ürünü aşağıdaki stok listesinde bul.\n" +
    "Etiket, marka, model kodu, amper/kW/mm² değeri, kutup sayısı, renk ve şekle bak.\n" +
    'Sadece şu JSON\'u yaz, başka hiçbir şey yazma: {"tanim":"fotoğrafta ne gördüğün, kısa Türkçe","ids":["en olası id", "..."]}\n' +
    "ids en fazla 5 tane olsun, en olası önce; sadece listedeki id'leri kullan; emin değilsen yine en yakınları ver, hiç benzer yoksa boş liste.\n\n" +
    "STOK LİSTESİ (id | ürün adı):\n" + liste;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.URUN_TANI_MODEL || "claude-haiku-4-5",
        max_tokens: 300,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/" + m[1], data: m[2] } },
          { type: "text", text: istem },
        ] }],
      }),
    });
    const j = await r.json();
    if (!r.ok) { console.error("anthropic", r.status, JSON.stringify(j)); return sendJson(res, 502, { error: "tanıma servisi yanıt vermedi" }); }
    const text = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("");
    const js = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    let o = {};
    try { o = JSON.parse(js); } catch (e) { o = {}; }
    const out = (Array.isArray(o.ids) ? o.ids : []).map(String).filter(i => ids.has(i)).slice(0, 5);
    return sendJson(res, 200, { tanim: String(o.tanim || "").slice(0, 200), ids: out });
  } catch (e) {
    console.error(e);
    return sendJson(res, 502, { error: "tanıma servisi yanıt vermedi" });
  }
}
