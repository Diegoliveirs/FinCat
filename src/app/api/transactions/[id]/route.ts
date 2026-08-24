import db from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { transactionUpdateSchema } from "@/lib/validators";
import { and, eq } from "drizzle-orm";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const { id } = await ctx.params;
  let parsed;
  try {
    parsed = transactionUpdateSchema.safeParse(await req.json());
  } catch {
    return Response.json({ error: "JSON invalido" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = db
    .update(transactions)
    .set(parsed.data)
    .where(and(eq(transactions.id, Number(id)), eq(transactions.userId, session.user.id)))
    .returning()
    .get();
  if (!updated) return Response.json({ error: "Transacao nao encontrada" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const { id } = await ctx.params;
  const deleted = db
    .delete(transactions)
    .where(and(eq(transactions.id, Number(id)), eq(transactions.userId, session.user.id)))
    .returning()
    .get();
  if (!deleted) return Response.json({ error: "Transação não encontrada" }, { status: 404 });
  return Response.json({ ok: true });
}
