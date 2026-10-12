import crypto from "node:crypto";
import { getAppt, putAppt, listAppts } from "../lib/store.js";
import { sendJson } from "../lib/util.js";

function authed(req) {
  const pass = process.env.PANEL_PASSWORD || "";
  const got = String(req.headers["x-panel-key"] || "");
  if (!pass || got.length !== pass.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(pass));
}
const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d);
const isTime = t => /^\d{2}:\d{2}$/.test(t);

export default async function handler(req, res) {
  if (!authed(req)) return sendJson(res, 401, { error: "auth" });
  try {
    if (req.method === "GET") {
      const items = (await listAppts(200)).map(({ token, ...a }) => a);
      return sendJson(res, 200, { items });
    }
    if (req.method === "POST") {
      const b = req.body || {};
      const a = await getAppt(String(b.id || ""));
      if (!a) return sendJson(res, 404, { error: "not found" });
      if (b.action === "onay") a.status = "onay";
      else if (b.action === "oneri" && isDate(b.newDate) && isTime(b.newTime)) { a.status = "oneri"; a.newDate = b.newDate; a.newTime = b.newTime; }
      else if (b.action === "tamam") a.status = "tamam";
      else return sendJson(res, 400, { error: "invalid" });
      a.updatedAt = new Date().toISOString();
      await putAppt(a);
      const { token, ...pub } = a;
      return sendJson(res, 200, pub);
    }
    return sendJson(res, 405, { error: "method" });
  } catch (e) {
    console.error(e);
    return sendJson(res, 500, { error: "server" });
  }
}
