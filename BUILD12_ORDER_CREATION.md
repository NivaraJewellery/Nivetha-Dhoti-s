# Nivetha Dhoti — Build 12: Order Creation

This build adds actual order creation and persistence to Neon/Postgres.

## Customer flow
1. Add dhoti to cart.
2. Proceed to Checkout.
3. Guest is sent to Login and cart is preserved.
4. After login, checkout resumes.
5. Customer enters delivery details.
6. CREATE ORDER validates the form again on the client.
7. Server re-checks each product, current price, active state and stock.
8. Order + order items are saved in the database.
9. An order number like `ND20260908-000123` is returned.
10. Payment status remains `not_started` and order status remains `pending_payment` for the next payment build.

## New database tables
- `dhoti_orders`
- `dhoti_order_items`

Tables are created automatically on first order request using the existing `DATABASE_URL`.

## Important behavior
- Prices are calculated server-side from `dhoti_products`; browser prices are not trusted.
- Stock is checked server-side before order creation.
- Stock is NOT deducted yet. It should be deducted only after successful payment in the payment build.
- A checkout token prevents duplicate orders from double-clicks/retries.
- The token is reset whenever the cart changes.

## New API
`POST /api/orders`

## Next build
Payment integration + successful-payment stock deduction + order confirmation.
