import crypto from 'node:crypto';
import { getSql } from '../db.js';
import { ensureProductTables } from './_products.js';
import { ensureOrderTables } from './_orders.js';

const text = value => String(value ?? '').trim();

function razorpayConfig() {
  const keyId = text(process.env.RAZORPAY_KEY_ID);
  const keySecret = text(process.env.RAZORPAY_KEY_SECRET);
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel Environment Variables.');
  }
  return { keyId, keySecret };
}

function basicAuth(keyId, keySecret) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

async function createRazorpayOrder({ keyId, keySecret, amountPaise, receipt, notes }) {
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: basicAuth(keyId, keySecret),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const description = data?.error?.description || data?.error?.reason || 'Unable to create Razorpay order.';
    throw new Error(description);
  }
  return data;
}

function validSignature({ razorpayOrderId, razorpayPaymentId, signature, secret }) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const actual = text(signature);
  if (!/^[a-f0-9]{64}$/i.test(actual)) return false;
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(actual, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function loadOrder(sql, { orderId, checkoutToken }) {
  const id = Number(orderId);
  if (Number.isInteger(id) && id > 0) {
    const rows = await sql`
      SELECT id, order_number, checkout_token, customer_name, mobile, email,
             total_amount, order_status, payment_status, razorpay_order_id,
             razorpay_payment_id, created_at
      FROM dhoti_orders WHERE id=${id} LIMIT 1`;
    return rows[0] || null;
  }
  const token = text(checkoutToken);
  if (token) {
    const rows = await sql`
      SELECT id, order_number, checkout_token, customer_name, mobile, email,
             total_amount, order_status, payment_status, razorpay_order_id,
             razorpay_payment_id, created_at
      FROM dhoti_orders WHERE checkout_token=${token} LIMIT 1`;
    return rows[0] || null;
  }
  return null;
}

async function startPayment(req, res) {
  const sql = getSql();
  await ensureOrderTables(sql);
  const order = await loadOrder(sql, req.body || {});
  if (!order) return res.status(404).json({ error: 'Order not found. Please reopen checkout.' });

  if (order.payment_status === 'paid') {
    return res.status(200).json({
      alreadyPaid: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_status: order.payment_status,
        order_status: order.order_status,
        razorpay_payment_id: order.razorpay_payment_id
      }
    });
  }

  const { keyId, keySecret } = razorpayConfig();
  const amountPaise = Math.round(Number(order.total_amount || 0) * 100);
  if (!Number.isInteger(amountPaise) || amountPaise < 100) {
    return res.status(400).json({ error: 'Order amount is invalid.' });
  }

  let razorpayOrderId = text(order.razorpay_order_id);
  if (!razorpayOrderId) {
    const rpOrder = await createRazorpayOrder({
      keyId,
      keySecret,
      amountPaise,
      receipt: text(order.order_number || `ND-${order.id}`).slice(0, 40),
      notes: {
        nivetha_order_id: String(order.id),
        nivetha_order_number: text(order.order_number),
        customer_mobile: text(order.mobile)
      }
    });
    razorpayOrderId = text(rpOrder.id);
    if (!razorpayOrderId) throw new Error('Razorpay did not return an order ID.');
    await sql`
      UPDATE dhoti_orders
      SET razorpay_order_id=${razorpayOrderId}, payment_status='created', updated_at=NOW()
      WHERE id=${order.id} AND payment_status <> 'paid'`;
  }

  return res.status(200).json({
    keyId,
    razorpayOrderId,
    amount: amountPaise,
    currency: 'INR',
    name: "Nivetha Dhoti's",
    description: `Order ${order.order_number || order.id}`,
    order: {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      mobile: order.mobile,
      email: order.email || '',
      total_amount: Number(order.total_amount || 0)
    }
  });
}

async function verifyPayment(req, res) {
  const body = req.body || {};
  const razorpayOrderId = text(body.razorpay_order_id);
  const razorpayPaymentId = text(body.razorpay_payment_id);
  const signature = text(body.razorpay_signature);
  if (!razorpayOrderId || !razorpayPaymentId || !signature) {
    return res.status(400).json({ error: 'Incomplete payment verification details.' });
  }

  const { keySecret } = razorpayConfig();
  if (!validSignature({ razorpayOrderId, razorpayPaymentId, signature, secret: keySecret })) {
    return res.status(400).json({ error: 'Payment verification failed. Please contact support if money was deducted.' });
  }

  const sql = getSql();
  await ensureProductTables(sql);
  await ensureOrderTables(sql);
  const order = await loadOrder(sql, body);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (text(order.razorpay_order_id) !== razorpayOrderId) {
    return res.status(400).json({ error: 'Payment order does not match this checkout.' });
  }
  if (order.payment_status === 'paid') {
    return res.status(200).json({
      verified: true,
      duplicate: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        order_status: order.order_status,
        payment_status: order.payment_status,
        razorpay_payment_id: order.razorpay_payment_id
      }
    });
  }

  // Claim this order once, verify all item stock, deduct stock, and finalize the
  // payment state in one PostgreSQL statement. This prevents a duplicate
  // verification request from deducting inventory twice.
  const result = await sql`
    WITH claimed AS (
      UPDATE dhoti_orders
      SET payment_status='processing',
          razorpay_payment_id=${razorpayPaymentId},
          razorpay_signature=${signature},
          updated_at=NOW()
      WHERE id=${order.id}
        AND razorpay_order_id=${razorpayOrderId}
        AND payment_status IN ('not_started','created','failed')
      RETURNING id
    ),
    item_stock AS (
      SELECT i.product_id, i.quantity, p.stock, p.active
      FROM dhoti_order_items i
      JOIN claimed c ON c.id=i.order_id
      LEFT JOIN dhoti_products p ON p.id=i.product_id
    ),
    eligibility AS (
      SELECT
        COUNT(*)::int AS item_count,
        COUNT(stock)::int AS product_count,
        COALESCE(BOOL_AND(active IS TRUE AND stock >= quantity), FALSE) AS ok
      FROM item_stock
    ),
    deducted AS (
      UPDATE dhoti_products p
      SET stock=p.stock-i.quantity, updated_at=NOW()
      FROM dhoti_order_items i, claimed c, eligibility e
      WHERE i.order_id=c.id
        AND p.id=i.product_id
        AND e.ok
        AND e.item_count=e.product_count
      RETURNING p.id
    ),
    finalized AS (
      UPDATE dhoti_orders o
      SET payment_status=CASE
            WHEN e.ok AND e.item_count=e.product_count AND (SELECT COUNT(*) FROM deducted)=e.item_count THEN 'paid'
            ELSE 'payment_received_stock_issue'
          END,
          order_status=CASE
            WHEN e.ok AND e.item_count=e.product_count AND (SELECT COUNT(*) FROM deducted)=e.item_count THEN 'confirmed'
            ELSE 'attention_required'
          END,
          paid_at=CASE
            WHEN e.ok AND e.item_count=e.product_count AND (SELECT COUNT(*) FROM deducted)=e.item_count THEN NOW()
            ELSE o.paid_at
          END,
          updated_at=NOW()
      FROM claimed c, eligibility e
      WHERE o.id=c.id
      RETURNING o.id, o.order_number, o.order_status, o.payment_status, o.razorpay_payment_id, o.paid_at
    )
    SELECT *,
      (SELECT item_count FROM eligibility) AS item_count,
      (SELECT COUNT(*)::int FROM deducted) AS deducted_count
    FROM finalized`;

  if (!result.length) {
    const latest = await loadOrder(sql, { orderId: order.id });
    if (latest?.payment_status === 'paid') {
      return res.status(200).json({
        verified: true,
        duplicate: true,
        order: {
          id: latest.id,
          order_number: latest.order_number,
          order_status: latest.order_status,
          payment_status: latest.payment_status,
          razorpay_payment_id: latest.razorpay_payment_id
        }
      });
    }
    return res.status(409).json({ error: 'This payment is already being processed. Please refresh after a moment.' });
  }

  const finalized = result[0];
  if (finalized.payment_status !== 'paid') {
    return res.status(409).json({
      error: 'Payment was received, but stock could not be finalized. Please contact support with your order number.',
      paymentReceived: true,
      order: finalized
    });
  }

  return res.status(200).json({ verified: true, order: finalized });
}

async function paymentFailed(req, res) {
  const body = req.body || {};
  const sql = getSql();
  await ensureOrderTables(sql);
  const order = await loadOrder(sql, body);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.payment_status !== 'paid') {
    await sql`
      UPDATE dhoti_orders
      SET payment_status='failed',
          payment_error_code=${text(body.code) || null},
          payment_error_description=${text(body.description) || null},
          updated_at=NOW()
      WHERE id=${order.id} AND payment_status <> 'paid'`;
  }
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const action = text(req.body?.action);
    if (action === 'create') return await startPayment(req, res);
    if (action === 'verify') return await verifyPayment(req, res);
    if (action === 'failed') return await paymentFailed(req, res);
    return res.status(400).json({ error: 'Invalid payment action.' });
  } catch (error) {
    console.error('Nivetha payment error:', error);
    return res.status(500).json({ error: String(error?.message || 'Payment service error') });
  }
}
