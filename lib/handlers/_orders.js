export async function ensureOrderTables(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS dhoti_orders (
      id BIGSERIAL PRIMARY KEY,
      order_number TEXT UNIQUE,
      checkout_token TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT,
      address_line_1 TEXT NOT NULL,
      address_line_2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
      shipping_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      order_status TEXT NOT NULL DEFAULT 'pending_payment',
      payment_status TEXT NOT NULL DEFAULT 'not_started',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS dhoti_order_items (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES dhoti_orders(id) ON DELETE CASCADE,
      product_id BIGINT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(12,2) NOT NULL,
      line_total NUMERIC(12,2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`ALTER TABLE dhoti_orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT`;
  await sql`ALTER TABLE dhoti_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT`;
  await sql`ALTER TABLE dhoti_orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT`;
  await sql`ALTER TABLE dhoti_orders ADD COLUMN IF NOT EXISTS payment_error_code TEXT`;
  await sql`ALTER TABLE dhoti_orders ADD COLUMN IF NOT EXISTS payment_error_description TEXT`;
  await sql`ALTER TABLE dhoti_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS dhoti_orders_razorpay_order_id_uidx ON dhoti_orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS dhoti_orders_razorpay_payment_id_idx ON dhoti_orders(razorpay_payment_id)`;
  await sql`CREATE INDEX IF NOT EXISTS dhoti_order_items_order_id_idx ON dhoti_order_items(order_id)`;
  await sql`CREATE INDEX IF NOT EXISTS dhoti_orders_mobile_idx ON dhoti_orders(mobile)`;
  await sql`CREATE INDEX IF NOT EXISTS dhoti_orders_created_at_idx ON dhoti_orders(created_at DESC)`;
}
