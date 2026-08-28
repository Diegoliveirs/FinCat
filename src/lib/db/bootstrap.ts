import { ensureOwner } from "@/lib/auth";
import { pool } from "./index";

async function main() {
  try {
    await ensureOwner();
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
