# Build 21 — QR Modal Fix

- Replaced mixed inline/hidden/display close logic with one class-based modal state.
- Close X reliably closes the QR popup.
- Clicking the dark backdrop also closes the popup.
- Escape key remains supported.
- Removed heavy backdrop blur and reduced overlay darkness so the storefront stays visible behind the popup.
- Bumped storefront.js/styles.css cache version to v21.
