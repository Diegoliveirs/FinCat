import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import db, { pool } from "./index";

async function main() {
  try {
    await db.execute(sql`select pg_advisory_lock(726107)`);
    await migrate(db, { migrationsFolder: "drizzle" });
  } finally {
    await db.execute(sql`select pg_advisory_unlock(726107)`).catch(() => undefined);
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
});
