# Nivetha Dhoti's v6 — Product Admin

Included:
- Password protected `/admin`
- Neon-backed product catalogue
- Product Code, Product Name, Category
- Retail Price + Wholesale Price
- Wholesale MOQ
- Stock
- Active/hidden status
- Description
- Up to 3 image URLs with preview
- Add / edit / delete
- Product Name / Product Code / Category filters
- Public `/api/products` excludes wholesale price

Vercel env vars required:
- `DATABASE_URL`
- `ADMIN_PASSWORD`

Tables are created automatically. Image uploads are intentionally URL-based for this build; proper file storage will be connected separately rather than storing large image binaries in Neon.
