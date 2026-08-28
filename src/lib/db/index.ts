import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Next.js carrega .env durante `next dev`, mas os scripts de migration e
// bootstrap são executados diretamente pelo Node. Carregue o arquivo local
// apenas quando uma URL não tiver sido fornecida pelo ambiente.
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  try {
    process.loadEnvFile(".env");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL é obrigatório.");

const globalForDb = globalThis as unknown as { pool?: Pool; db?: ReturnType<typeof createDb> };

export const pool = globalForDb.pool ?? (globalForDb.pool = new Pool({ connectionString, max: 10 }));
export type Db = ReturnType<typeof createDb>;

export function createDb() {
  return drizzle(pool, { schema });
}

const db = globalForDb.db ?? (globalForDb.db = createDb());
export default db;
