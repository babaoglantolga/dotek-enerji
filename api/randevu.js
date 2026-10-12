import { getAppt, putAppt, addToIndex } from "../lib/store.js";
import { DEPTS, rid, clean, trDate, siteUrl, publicAppt, sendJson } from "../lib/util.js";
import { notifyTech } from "../lib/notify.js";

const LANGS = ["tr", "en", "ru", "el", "fa"];
const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d);
const isTime = t => /^\d{2}:\d{2}$/.test(t);

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const b = req.body || {};
      const a = {
        id: rid(10), token: rid(24),
        name: clean(b.name, 80), phone: clean(b.phone, 30), dept: String(b.dept || ""),
        date: String(b.date || ""), time: String(b.time || ""),
        place: b.place === "yerinde" ? "yerinde" : "atolye",
        note: clean(b.note, 500), lang: LANGS.includes(b.lang) ? b.lang : "tr",
        status: "yeni", createdAt: new Date().toISOString(),
      };
      if (!a.name || a.phone.replace(/\D/g, "").length < 7 || !DEPTS[a.dept] || !isDate(a.date) || !isTime(a.time))
        return sendJson(res, 400, { error: "invalid" });
      a.deptName = DEPTS[a.dept].name;
      await putAppt(a);
      await addToIndex(a);
      const d = DEPTS[a.dept];
      await notifyTech(d.phone,
        `Yeni randevu – ${d.tr} Atölyesi\n${trDate(a.date)} saat ${a.time} · ${a.place === "yerinde" ? "Yerinde servis" : "Atölyeye getirecek"}\n${a.name} · ${a.phone}` +
        (a.note ? `\nNot: ${a.note}` : "") + `\n\nOnaylamak ya da yeni saat vermek için:\n${siteUrl(req)}/panel`);
      return sendJson(res, 200, { id: a.id, token: a.token });
    }

    const q = req.method === "GET" ? req.query : (req.body || {});
    const a = q.id ? await getAppt(String(q.id)) : null;
    if (!a || a.token !== String(q.token || "")) return sendJson(res, 404, { error: "not found" });

    if (req.method === "GET") return sendJson(res, 200, publicAppt(a));

    if (req.method === "PATCH") {
      const st = q.status;
      if (st !== "kabul" && st !== "iptal") return sendJson(res, 400, { error: "invalid" });
      if (st === "kabul" && a.status !== "oneri") return sendJson(res, 409, { error: "nothing to accept" });
      a.status = st; a.updatedAt = new Date().toISOString();
      await putAppt(a);
      const d = DEPTS[a.dept];
      const txt = st === "kabul"
        ? `${d.tr} Atölyesi: ${a.name} yeni saati kabul etti → ${trDate(a.newDate)} saat ${a.newTime}.`
        : `${d.tr} Atölyesi: ${a.name} (${a.phone}) ${trDate(a.date)} ${a.time} randevusunu iptal etti.`;
      await notifyTech(d.phone, txt);
      return sendJson(res, 200, publicAppt(a));
    }
    return sendJson(res, 405, { error: "method" });
  } catch (e) {
    console.error(e);
    return sendJson(res, 500, { error: "server" });
  }
}
