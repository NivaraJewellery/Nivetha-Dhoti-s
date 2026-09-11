# Build 22 — Hard QR Close Fix

- Reworked the WhatsApp QR modal close path so it no longer depends on a single CSS class.
- The X button and backdrop now have inline fallbacks, direct capture listeners, and delegated capture handling.
- Closing explicitly sets `hidden`, removes `is-open`, sets `display:none !important`, disables pointer events, removes body scroll lock, and clears the QR image.
- Opening explicitly sets `display:grid !important` and restores pointer events.
- Asset query versions bumped to v22 where applicable to reduce stale-cache behavior.
