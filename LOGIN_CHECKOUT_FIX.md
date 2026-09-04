# Nivetha Dhoti - Login / Checkout Routing Fix

New flow:
1. Guest adds item to cart.
2. Guest clicks Proceed to Checkout.
3. Store saves the cart and redirects to `account.html?return=checkout`.
4. Customer logs in.
5. Customer returns to `index.html?checkout=1`.
6. Store loads products/cart and automatically opens checkout.
7. Logged-in customers go directly from cart to checkout.

Notes:
- Cart remains in existing `nivetha_cart` localStorage.
- Customer session is currently client-side (`nivetha-customer`).
- Server-side OTP/account authentication is not present in the supplied source and should be added before treating this as production authentication.
