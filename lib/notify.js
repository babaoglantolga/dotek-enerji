// Sends a WhatsApp message to a technician.
// Provider: CallMeBot (free). Each technician activates it once and gets an API key.
// Set CALLMEBOT_KEYS in Vercel as JSON: {"905469979911":"1234567","905338454196":"7654321", ...}
export async function notifyTech(phone, text) {
  let keys = {};
  try { keys = JSON.parse(process.env.CALLMEBOT_KEYS || "{}"); } catch { keys = {}; }
  const apikey = keys[phone];
  if (!apikey) { console.warn("No CallMeBot key for", phone); return false; }
  const url = `https://api.callmebot.com/whatsapp.php?phone=%2B${phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  try {
    const r = await fetch(url);
    if (!r.ok) console.warn("CallMeBot", r.status, await r.text());
    return r.ok;
  } catch (e) { console.warn("CallMeBot error", e.message); return false; }
}
