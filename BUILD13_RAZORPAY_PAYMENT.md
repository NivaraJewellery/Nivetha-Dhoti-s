# Nivetha Dhoti — Build 13 Razorpay Payment

## Checkout flow
Guest -> Login -> Checkout -> Pending internal order -> Razorpay payment -> Server signature verification -> Confirm order -> Deduct stock -> Clear cart.

## Vercel Environment Variables required
Add these in the same Vercel project that already contains DATABASE_URL:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Start with Razorpay Test Mode keys. Redeploy after adding/changing environment variables.

Important: `RAZORPAY_KEY_SECRET` stays server-side. The browser receives only the public Key ID.

## New backend route
`POST /api/payments`

Actions:
- `create` — creates/reuses a Razorpay Order using the amount stored in `dhoti_orders`.
- `verify` — verifies Razorpay HMAC SHA-256 signature server-side and confirms the order.
- `failed` — records failed payment information for a pending order.

## Database changes
`dhoti_orders` gains these columns automatically:
- razorpay_order_id
- razorpay_payment_id
- razorpay_signature
- payment_error_code
- payment_error_description
- paid_at

## Inventory safety
Stock is not reduced when the pending order is created. After a valid payment signature is received, the database claims the order once and deducts inventory. Duplicate verification requests cannot intentionally deduct the same order twice.

If payment is authenticated but inventory cannot be finalized because stock changed concurrently, the order is marked `attention_required` / `payment_received_stock_issue` rather than pretending the order completed.

## Test before Live Mode
1. Add Razorpay Test Mode keys to Vercel.
2. Add a product to the cart and proceed through login and checkout.
3. Click PAY NOW.
4. Complete a Razorpay test payment.
5. Confirm the checkout says Order Confirmed.
6. Confirm the cart is cleared.
7. Confirm product stock is reduced only once.
8. Repeat with a failed/cancelled payment; cart and pending order should remain retryable.
9. Only after successful testing, replace Test keys with Live keys.
