import { createClient } from "@libsql/client";
import "dotenv/config";

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_TOKEN,
});

try {
  console.log("Creating users table...");

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

  console.log("Done.");
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
