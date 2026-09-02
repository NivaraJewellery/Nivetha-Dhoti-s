export async function ensureProductTables(sql){
  await sql`CREATE TABLE IF NOT EXISTS dhoti_products (id SERIAL PRIMARY KEY, product_code TEXT NOT NULL UNIQUE, product_name TEXT NOT NULL, category TEXT NOT NULL, retail_price NUMERIC(12,2) NOT NULL DEFAULT 0, wholesale_price NUMERIC(12,2) NOT NULL DEFAULT 0, wholesale_moq INTEGER NOT NULL DEFAULT 1, stock INTEGER NOT NULL DEFAULT 0, image_1 TEXT, image_2 TEXT, image_3 TEXT, description TEXT, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS product_code TEXT`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS product_name TEXT`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS category TEXT`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS retail_price NUMERIC(12,2) NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(12,2) NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS wholesale_moq INTEGER NOT NULL DEFAULT 1`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS image_1 TEXT`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS image_2 TEXT`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS image_3 TEXT`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS description TEXT`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  await sql`ALTER TABLE dhoti_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
}
