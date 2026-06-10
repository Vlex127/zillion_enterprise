import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_TOKEN,
});

let initPromise: Promise<void> | null = null

export async function ensureDB() {
  if (initPromise) return initPromise

  initPromise = (async () => {
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
        cost_price REAL NOT NULL,
        retail_price REAL NOT NULL,
        bulk_stock INTEGER NOT NULL DEFAULT 0,
        imei TEXT UNIQUE,
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
  })()

  return initPromise
}
