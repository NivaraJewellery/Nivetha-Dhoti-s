# Build 19 - Enquiry Image Identification + QR Close Fix

Changes:
- My Enquiry keeps a clear product thumbnail, product code and collection for every selected dhoti.
- WhatsApp pre-filled text now includes the product code and the product image URL for each selected model, so the model can be visually identified from WhatsApp.
- QR modal close button is hardened with direct and delegated click handlers.
- Closing the QR modal now resets body scroll state and cancels pending QR image callbacks.
- QR close button is raised above modal content with a larger reliable click/touch target.

Note: WhatsApp `wa.me` pre-filled messages cannot automatically attach product image files. Image URLs are included in the text so they can be opened/previewed in WhatsApp.
