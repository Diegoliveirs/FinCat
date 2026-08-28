import db from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { accountUpdateSchema } from "@/lib/validators";
import { transactions } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    return unauthorized(error);
  }
  const { id } = await ctx.params;
  let parsed;
  try {
    parsed = accountUpdateSchema.safeParse(await req.json());
  } catch {
    return Response.json({ error: "JSON invalido" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const [updated] = await db
    .update(accounts)
    .set(parsed.data)
    .where(and(eq(accounts.id, Number(id)), eq(accounts.userId, session.user.id)))
    .returning();
  if (!updated) return Response.json({ error: "Conta nao encontrada" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    return unauthorized(error);
  }
  const { id } = await ctx.params;
  const accountId = Number(id);
  const [existing] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, session.user.id)))
    .limit(1);
  if (!existing) return Response.json({ error: "Conta não encontrada" }, { status: 404 });
  const [countResult] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), eq(transactions.userId, session.user.id)));
  const count = countResult?.count ?? 0;
  if (count > 0 && new URL(req.url).searchParams.get("cascade") !== "1")
    return Response.json(
      { error: "A conta possui movimentações", impact: { transactionCount: count } },
      { status: 409 },
    );
  await db.delete(accounts).where(and(eq(accounts.id, accountId), eq(accounts.userId, session.user.id)));
  return Response.json({ ok: true });
}
