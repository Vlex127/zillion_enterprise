import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_TOKEN,
});

let initPromise: Promise<void> | null = null

export async function ensureDB() {
  if (initPromise) return initPromise

  const promise = (async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL DEFAULT 'seller',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        brand TEXT,
        category TEXT,
        inventoryType TEXT NOT NULL DEFAULT 'BULK' CHECK (inventoryType IN ('SERIALIZED', 'BULK')),
        cost_price REAL NOT NULL,
        retail_price REAL NOT NULL,
        bulk_stock INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        product_id TEXT NOT NULL REFERENCES products(id),
        seller_id TEXT NOT NULL REFERENCES users(id),
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total REAL NOT NULL,
        cost_price REAL NOT NULL,
        profit REAL NOT NULL,
        payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'pos')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        product_id TEXT NOT NULL REFERENCES products(id),
        imei TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold')),
        sale_id TEXT REFERENCES sales(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    const cols = await db.execute(`SELECT COUNT(*) as cnt FROM pragma_table_info('products') WHERE name = 'inventoryType'`)
    if (Number(cols.rows[0]?.cnt ?? 0) === 0) {
      await db.execute(`ALTER TABLE products ADD COLUMN inventoryType TEXT NOT NULL DEFAULT 'BULK'`)
    }
  })()

  initPromise = promise.catch((err) => {
    initPromise = null
    throw err
  })

  return initPromise
}
