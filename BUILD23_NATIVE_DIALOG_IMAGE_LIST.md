# Build 23 — Native QR Dialog + Shareable Image List

- Replaced the custom QR overlay with native HTML dialog. The × button uses form method=dialog, so closure no longer depends on JavaScript click handlers.
- Backdrop is lighter and has no blur.
- Added enquiry.html that shows every selected dhoti image, DH code and collection in one shareable page.
- WhatsApp message includes one enquiry-page link instead of separate image links.
