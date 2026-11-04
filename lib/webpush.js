// Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) — dış paket kullanmadan.
import crypto from "node:crypto";

const b64u = b => Buffer.from(b).toString("base64url");
const unb64u = s => Buffer.from(String(s), "base64url");

function hkdf(salt, ikm, info, len) {
  const prk = crypto.createHmac("sha256", salt).update(ikm).digest();
  return crypto.createHmac("sha256", prk).update(Buffer.concat([info, Buffer.from([1])])).digest().subarray(0, len);
}

export function sifrele(payload, p256dh, auth) {
  const uaPub = unb64u(p256dh), authSecret = unb64u(auth);
  const ecdh = crypto.createECDH("prime256v1"); ecdh.generateKeys();
  const asPub = ecdh.getPublicKey();
  const shared = ecdh.computeSecret(uaPub);
  const ikm = hkdf(authSecret, shared, Buffer.concat([Buffer.from("WebPush: info\0"), uaPub, asPub]), 32);
  const salt = crypto.randomBytes(16);
  const cek = hkdf(salt, ikm, Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = hkdf(salt, ikm, Buffer.from("Content-Encoding: nonce\0"), 12);
  const c = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const ct = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, ct]);
}

export function vapidBaslik(endpoint, pub, priv, sub) {
  const p = unb64u(pub);
  const key = crypto.createPrivateKey({ key: { kty: "EC", crv: "P-256", d: priv, x: b64u(p.subarray(1, 33)), y: b64u(p.subarray(33, 65)) }, format: "jwk" });
  const h = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const c = b64u(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub }));
  const sig = crypto.sign("sha256", Buffer.from(h + "." + c), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${h}.${c}.${b64u(sig)}, k=${pub}`;
}

const IZINLI = [/\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.push\.apple\.com$/, /\.notify\.windows\.com$/, /^push\.services\.mozilla\.com$/];
export const izinliUc = e => { try { const u = new URL(e); return u.protocol === "https:" && IZINLI.some(r => r.test(u.hostname)); } catch { return false; } };

export async function gonder(abone, payload, vapid) {
  if (!izinliUc(abone.endpoint)) return 400;
  const body = sifrele(JSON.stringify(payload), abone.p256dh, abone.auth);
  const r = await fetch(abone.endpoint, {
    method: "POST",
    headers: { Authorization: vapidBaslik(abone.endpoint, vapid.pub, vapid.priv, vapid.sub), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "86400", Urgency: "high" },
    body,
  });
  return r.status;
}
