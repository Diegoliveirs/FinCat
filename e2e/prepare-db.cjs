const fs = require("node:fs");
const Database = require("better-sqlite3");
const { drizzle } = require("drizzle-orm/better-sqlite3");
const { migrate } = require("drizzle-orm/better-sqlite3/migrator");

const databasePath = process.env.DATABASE_URL;
if (!databasePath) throw new Error("DATABASE_URL não foi informado para o Playwright");
const path = require("node:path");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const database = new Database(databasePath);
migrate(drizzle(database), { migrationsFolder: path.join(process.cwd(), "drizzle") });
database
  .prepare("INSERT INTO accounts (name, type, initial_balance_cents, created_at) VALUES (?, ?, ?, ?)")
  .run("Conta E2E", "cc", 0, Date.now());
database
  .prepare("INSERT INTO categories (name, kind, color, sort_order) VALUES (?, ?, ?, ?)")
  .run("Outros gastos", "expense", "#A3BFFF", 0);
database.close();
