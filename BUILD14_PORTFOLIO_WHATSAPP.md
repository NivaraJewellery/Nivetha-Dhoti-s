# Build 14 — Portfolio + WhatsApp Enquiry

## Customer flow
1. Browse dhoti catalogue (prices hidden).
2. Open a dhoti and choose quantity.
3. Add it to **My Dhoti List**.
4. Open the list from the heart/list icon.
5. Click **Send Request on WhatsApp**.
6. If not logged in, the customer is sent to login and returned to the list afterwards.
7. WhatsApp opens with customer name/mobile/email plus selected product codes, collection and quantities.

## Payment disabled
The Razorpay script is not loaded and the checkout/payment UI is not reachable in this build. Existing payment/backend files are retained so commerce can be restored later without rebuilding from scratch.

## IMPORTANT — WhatsApp number
Edit `storefront.js` and set:

```js
whatsappNumber: '91XXXXXXXXXX'
```

Use the Nivetha Dhoti WhatsApp number in international format, digits only, with country code and without `+`.

Until this value is configured, the storefront will show a clear configuration message instead of opening WhatsApp.
