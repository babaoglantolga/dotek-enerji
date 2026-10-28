// Kaya Döviz kurlarını sunucu tarafından okur (tarayıcı doğrudan okuyamıyor)
export default async function handler(req, res) {
  try {
    const r = await fetch("https://kaya.exchange/jsonData.json?t=" + Date.now(), {
      headers: { "User-Agent": "Mozilla/5.0 (DotekCariKasa)", Accept: "application/json,text/plain,*/*" }
    });
    const t = await r.text();
    if (!r.ok || !t.trim().startsWith("[")) {
      res.statusCode = 502; res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "kaya", status: r.status }));
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.end(t);
  } catch (e) {
    res.statusCode = 502; res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: String(e && e.message || e) }));
  }
}
