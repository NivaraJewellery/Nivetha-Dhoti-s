# Build 24 – Enquiry History

- Saves each submitted WhatsApp enquiry into the logged-in customer's local profile history.
- Clears the active enquiry list immediately after the WhatsApp request is initiated.
- Adds ENQUIRY HISTORY to the storefront menu and a View Enquiry History action in the account page.
- Adds enquiry-history.html with list and individual detail views including product images, codes, collections, enquiry type, timestamp and customer details.
- History is currently browser-local because the existing customer login is localStorage-based. Cross-device history requires server-side customer authentication/storage.
