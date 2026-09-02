# Nivetha Dhoti's v8 — Direct Product Image Upload

Built on v7.

## What changed
- Admin now has Choose Image buttons for Photo 1, Photo 2 and Photo 3.
- JPG, PNG and WEBP supported.
- Maximum 4 MB per image.
- Images upload to Vercel Blob.
- The returned public Blob URL is automatically stored with the product.
- Existing product images remain editable.
- Images can be removed from a product without deleting the product.
- Storefront continues to use the same image_1/image_2/image_3 fields, so no DB migration is required.

## One-time Vercel setup
Before using image upload:
1. Open the Nivetha Dhoti's project in Vercel.
2. Go to Storage.
3. Create/connect a Vercel Blob store with PUBLIC access.
4. Make sure the Blob store is connected to this project.
5. Redeploy v8 after connecting the store.

The project already uses DATABASE_URL and ADMIN_PASSWORD. Keep both.

## Upload limits
This build intentionally limits each image to 4 MB because the upload passes through a Vercel Function. Resize/compress larger product photos before uploading.
