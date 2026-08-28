import { ensureOwner } from "@/lib/auth";
import { pool } from "./index";

async function main() {
  try {
    await ensureOwner();
  } finally {
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
});
