// Upstash Redis (Vercel Marketplace > Upstash for Redis) over REST — no dependencies.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export async function redis(...cmd) {
  if (!URL_ || !TOKEN) throw new Error("Redis env vars missing (KV_REST_API_URL / KV_REST_API_TOKEN)");
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export async function getAppt(id) {
  const raw = await redis("GET", "randevu:" + id);
  return raw ? JSON.parse(raw) : null;
}
export async function putAppt(a) {
  await redis("SET", "randevu:" + a.id, JSON.stringify(a));
}
export async function addToIndex(a) {
  await redis("ZADD", "randevular", Date.parse(a.createdAt) || Date.now(), a.id);
}
export async function listAppts(n = 200) {
  const ids = await redis("ZRANGE", "randevular", 0, n - 1, "REV");
  if (!ids || !ids.length) return [];
  const raws = await redis("MGET", ...ids.map(i => "randevu:" + i));
  return raws.filter(Boolean).map(r => JSON.parse(r));
}
