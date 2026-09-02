import { put } from '@vercel/blob';

function authorized(req) {
  return process.env.ADMIN_PASSWORD &&
    req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

function safeName(name = 'dhoti-image.jpg') {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-100) || 'dhoti-image.jpg';
}

async function readBody(req, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const error = new Error('Image is too large. Maximum size is 4 MB.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  try {
    if (!authorized(req)) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const contentType = String(req.headers['content-type'] || '').toLowerCase();
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(contentType)) {
      return res.status(400).json({ error: 'Use a JPG, PNG or WEBP image.' });
    }

    const file = await readBody(req, 4 * 1024 * 1024);
    if (!file.length) {
      return res.status(400).json({ error: 'No image received.' });
    }

    const originalName = safeName(req.headers['x-file-name']);
    const productCode = safeName(req.headers['x-product-code'] || 'product').replace(/\.[^.]+$/, '');
    const pathname = `products/${productCode}/${Date.now()}-${originalName}`;

    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType
    });

    return res.status(201).json({
      url: blob.url,
      pathname: blob.pathname
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Image upload failed'
    });
  }
}
