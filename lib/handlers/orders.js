import { getSql } from '../db.js';
import { ensureProductTables } from './_products.js';
import { ensureOrderTables } from './_orders.js';

const text = value => String(value ?? '').trim();
const qty = value => Number.parseInt(value, 10);

function cleanCustomer(body = {}) {
  const customer = body.customer || {};
  return {
    name: text(customer.name),
    mobile: text(customer.mobile).replace(/\D/g, ''),
    email: text(customer.email),
    address1: text(customer.address1),
    address2: text(customer.address2),
    city: text(customer.city),
    state: text(customer.state),
    pincode: text(customer.pincode).replace(/\D/g, '')
  };
}

function validateCustomer(c) {
  if (c.name.length < 2) return 'Enter a valid customer name.';
  if (!/^[6-9]\d{9}$/.test(c.mobile)) return 'Enter a valid 10-digit Indian mobile number.';
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return 'Enter a valid email address.';
  if (c.address1.length < 5) return 'Enter the delivery address.';
  if (c.city.length < 2) return 'Enter the city.';
  if (!c.state) return 'Select the state.';
  if (!/^\d{6}$/.test(c.pincode)) return 'Enter a valid 6-digit pincode.';
  return '';
}

function makeOrderNumber(id) {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `ND${day}-${String(id).padStart(6, '0')}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const checkoutToken = text(req.body?.checkoutToken);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const customer = cleanCustomer(req.body);
    const shippingCharge = Math.max(0, Number(req.body?.shippingCharge || 0));

    if (!checkoutToken || checkoutToken.length < 12 || checkoutToken.length > 120) {
      return res.status(400).json({ error: 'Invalid checkout session. Please reopen checkout and try again.' });
    }

    const customerError = validateCustomer(customer);
    if (customerError) return res.status(400).json({ error: customerError });
    if (!items.length) return res.status(400).json({ error: 'Your cart is empty.' });

    const sql = getSql();
    await ensureProductTables(sql);
    await ensureOrderTables(sql);

    const existing = await sql`
      SELECT id, order_number, subtotal, shipping_charge, total_amount, order_status, payment_status, created_at
      FROM dhoti_orders WHERE checkout_token=${checkoutToken} LIMIT 1`;
    if (existing.length) {
      return res.status(200).json({ order: existing[0], duplicate: true });
    }

    const normalizedItems = [];
    for (const raw of items) {
      const productId = Number(raw?.id);
      const quantity = qty(raw?.qty);
      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ error: 'One or more cart items are invalid.' });
      }

      const rows = await sql`
        SELECT id, product_code, product_name, retail_price, stock, active
        FROM dhoti_products WHERE id=${productId} LIMIT 1`;
      const product = rows[0];
      if (!product || product.active === false) {
        return res.status(409).json({ error: 'A product in your cart is no longer available. Please refresh your cart.' });
      }
      const stock = Number(product.stock || 0);
      if (quantity > stock) {
        return res.status(409).json({ error: `Only ${stock} available for ${product.product_code}. Please update the quantity.` });
      }
      const price = Number(product.retail_price || 0);
      normalizedItems.push({
        productId: Number(product.id),
        productCode: product.product_code,
        productName: product.product_name || '',
        quantity,
        unitPrice: price,
        lineTotal: price * quantity
      });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalAmount = subtotal + shippingCharge;

    const inserted = await sql`
      INSERT INTO dhoti_orders (
        checkout_token, customer_name, mobile, email,
        address_line_1, address_line_2, city, state, pincode,
        subtotal, shipping_charge, total_amount
      ) VALUES (
        ${checkoutToken}, ${customer.name}, ${customer.mobile}, ${customer.email || null},
        ${customer.address1}, ${customer.address2 || null}, ${customer.city}, ${customer.state}, ${customer.pincode},
        ${subtotal}, ${shippingCharge}, ${totalAmount}
      ) RETURNING id, order_number, subtotal, shipping_charge, total_amount, order_status, payment_status, created_at`;

    const order = inserted[0];
    const orderNumber = makeOrderNumber(order.id);
    await sql`UPDATE dhoti_orders SET order_number=${orderNumber}, updated_at=NOW() WHERE id=${order.id}`;

    for (const item of normalizedItems) {
      await sql`
        INSERT INTO dhoti_order_items (
          order_id, product_id, product_code, product_name, quantity, unit_price, line_total
        ) VALUES (
          ${order.id}, ${item.productId}, ${item.productCode}, ${item.productName || null},
          ${item.quantity}, ${item.unitPrice}, ${item.lineTotal}
        )`;
    }

    return res.status(201).json({
      order: {
        ...order,
        order_number: orderNumber,
        items: normalizedItems.map(item => ({
          product_id: item.productId,
          product_code: item.productCode,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.lineTotal
        }))
      }
    });
  } catch (error) {
    const message = String(error?.message || 'Unable to create order');
    if (message.includes('duplicate key') && message.includes('checkout_token')) {
      return res.status(409).json({ error: 'This checkout request was already submitted. Please reopen checkout.' });
    }
    return res.status(500).json({ error: message });
  }
}
