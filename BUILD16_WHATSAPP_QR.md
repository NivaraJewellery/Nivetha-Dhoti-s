# Build 16 — WhatsApp QR handoff

- Desktop/laptop: **SEND REQUEST ON WHATSAPP** now opens a QR-code popup instead of navigating away.
- Scan the QR code with a mobile camera to open WhatsApp with the full enquiry message pre-filled.
- Mobile/tablet visitors continue directly to WhatsApp.
- The popup includes **OPEN WHATSAPP ON THIS DEVICE** as a fallback.
- Existing login requirement, Retail/Wholesale selection, customer details, enquiry list, and configured WhatsApp number `919789105558` are preserved.
- QR images are generated on demand from the encoded `wa.me` request URL using QuickChart's QR endpoint.
