# Dotek Enerji Sistemleri – web sitesi

Cephe girişli site, 5 dilli yapay zekâ asistanı, randevu sistemi ve teknisyen paneli.

- `public/index.html` – site
- `public/panel.html` – teknisyen paneli (`/panel`, şifreli)
- `api/chat.js` – asistan (Anthropic API)
- `api/randevu.js` – randevu oluşturma / müşteri durumu
- `api/panel.js` – panel işlemleri (onay, yeni saat, tamamlandı)

## Vercel ortam değişkenleri

| Ad | Ne için |
|---|---|
| `ANTHROPIC_API_KEY` | Asistan (console.anthropic.com) |
| `PANEL_PASSWORD` | Teknisyen paneli şifresi |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Randevu veritabanı (Vercel > Storage > Upstash for Redis ekleyince otomatik gelir) |
| `CALLMEBOT_KEYS` | Teknisyen WhatsApp bildirimleri, örn. `{"905469979911":"123456"}` |
| `ANTHROPIC_MODEL` | İsteğe bağlı, varsayılan `claude-haiku-4-5` |
| `SITE_URL` | İsteğe bağlı, örn. `https://dotekenerjisistemleri.com` |

## Teknisyen WhatsApp bildirimi (CallMeBot, ücretsiz)

Her teknisyen kendi telefonundan bir kez:
1. callmebot.com sitesindeki (WhatsApp bölümü) güncel CallMeBot numarasını rehbere ekler.
2. WhatsApp'tan bu numaraya şu mesajı yollar: `I allow callmebot to send me messages`
3. Gelen API anahtarını yöneticiye iletir; anahtar `CALLMEBOT_KEYS` içine eklenir.
