import { ensureOwner } from "@/lib/auth";
import db from "@/lib/db";
import { user } from "@/lib/db/schema";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed demonstrativo é proibido em produção.");
  await ensureOwner();
  const owner = db.select({ username: user.username }).from(user).limit(1).get();
  console.info(`[fincat] Ambiente de desenvolvimento preparado para @${owner?.username}. Nenhum dado demonstrativo financeiro foi inserido.`);
}
void main();
