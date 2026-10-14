import { FACTS } from "../lib/facts.js";
import { sendJson, clean } from "../lib/util.js";

const ROOM_NAMES = { elec: "Electronic Board Repair", gen: "Generator Sales & Repair", auto: "Automation", elecw: "Electrical Work", bob: "Motor Rewinding", p3d: "3D Printing & Scanning" };

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "method" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return sendJson(res, 503, { error: "assistant not configured" });

  const body = req.body || {};
  let msgs = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  msgs = msgs
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(m => ({ role: m.role, content: clean(m.content, 1200) }))
    .filter(m => m.content);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return sendJson(res, 400, { error: "bad messages" });

  const room = Array.isArray(body.room) ? body.room.filter(k => ROOM_NAMES[k]) : [];
  const where = room.length
    ? `\n\nThe customer is standing inside the shop at the ${room.map(k => ROOM_NAMES[k]).join(" & ")} desk. Speak as the staff member at that desk (first person, friendly), still following all rules above.`
    : "";

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
        max_tokens: 300,
        system: FACTS + where,
        messages: msgs,
      }),
    });
    const j = await r.json();
    if (!r.ok) { console.error("anthropic", r.status, JSON.stringify(j)); return sendJson(res, 502, { error: "upstream" }); }
    const text = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("").trim();
    return sendJson(res, 200, { text });
  } catch (e) {
    console.error(e);
    return sendJson(res, 502, { error: "upstream" });
  }
}
