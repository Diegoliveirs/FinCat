import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { sqlite?: Database.Database; db?: ReturnType<typeof init> };

function getSqlite(): Database.Database {
  if (globalForDb.sqlite) return globalForDb.sqlite;
  const url = process.env.DATABASE_URL ?? "./data/fincat.db";
  const dir = path.dirname(path.resolve(url));
  fs.mkdirSync(dir, { recursive: true });
  const sqlite = new Database(url);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  globalForDb.sqlite = sqlite;
  return sqlite;
}

export type Db = ReturnType<typeof init>;

export function init() {
  const sqlite = getSqlite();
  const db = drizzle(sqlite, { schema });
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  }
  return db;
}

const db = globalForDb.db ?? (globalForDb.db = init());

export default db;
