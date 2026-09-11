# Build 18 — Session-only Enquiry List

## Change
The portfolio enquiry list now uses `sessionStorage` instead of `localStorage`.

## Behaviour
- Refreshing the same tab keeps the enquiry list.
- Navigating to login/account and back in the same tab keeps the enquiry list.
- Closing the tab ends the enquiry session.
- Opening Nivetha in a new tab starts with an empty enquiry list.
- Legacy persistent `nivetha_cart` data from older builds is removed on page load.

Customer login/session and enquiry type remain unchanged.
