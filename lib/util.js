import crypto from "node:crypto";

export const DEPTS = {
  elec:  { tr: "Elektronik",  name: "Elektronik Kart Tamiri", phone: "905469979911" },
  gen:   { tr: "Jeneratör",   name: "Jeneratör Satış ve Tamiri", phone: "905428633677" },
  auto:  { tr: "Otomasyon",   name: "Otomasyon", phone: "905338454196" },
  elecw: { tr: "Elektrik",    name: "Elektrik İşleri", phone: "905338454196" },
  p3d:   { tr: "3D Baskı",    name: "3D Baskı ve Tarama", phone: "905469979911" },
  bob:   { tr: "Bobinaj",     name: "Bobinaj", phone: "905469939911" },
};

export const rid = (n = 12) => crypto.randomBytes(n).toString("base64url").slice(0, n);

export function trDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : d || "";
}

export function clean(v, max = 300) {
  return String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

export function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `https://${host}`;
}

// Public view of an appointment for the customer (never returns the token).
export function publicAppt(a) {
  const { token, ...rest } = a;
  return rest;
}

export function sendJson(res, code, obj) {
  res.status(code).setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(obj));
}
