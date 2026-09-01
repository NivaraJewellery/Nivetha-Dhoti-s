# Nivetha Dhoti's — Build v1

Initial visual/foundation prototype for a Retail + Wholesale dhoti e-commerce website.

## Included
- Responsive premium South Indian visual direction (ivory, maroon, gold)
- Homepage hero, categories, featured products, wholesale section and trust strip
- Initial product model in app.js with Product Code, Name, Category, Retail Price, Wholesale Price and MOQ
- Mobile responsive layout

## Architecture decisions locked in
- One product record supports both retail and wholesale pricing
- Wholesale price is not publicly exposed in the storefront UI
- Wholesale customers will require approval before wholesale pricing is shown
- MOQ will be product-specific
- Retail and wholesale will share inventory

## Next build
Build v2 should add the Admin Product module and persistent database model, including up to 3 product images.
