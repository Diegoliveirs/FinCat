import db from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { categoryUpdateSchema } from "@/lib/validators";
import { transactions } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const { id } = await ctx.params;
  let parsed;
  try {
    parsed = categoryUpdateSchema.safeParse(await req.json());
  } catch {
    return Response.json({ error: "JSON invalido" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = db
    .update(categories)
    .set(parsed.data)
    .where(and(eq(categories.id, Number(id)), eq(categories.userId, session.user.id)))
    .returning()
    .get();
  if (!updated) return Response.json({ error: "Categoria nao encontrada" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const { id } = await ctx.params;
  const categoryId = Number(id);
  const existing = db.select().from(categories).where(and(eq(categories.id, categoryId), eq(categories.userId, session.user.id))).get();
  if (!existing) return Response.json({ error: "Categoria não encontrada" }, { status: 404 });
  const count =
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(eq(transactions.categoryId, categoryId), eq(transactions.userId, session.user.id)))
      .get()?.count ?? 0;
  if (count > 0)
    return Response.json(
      { error: "Reclassifique as movimentações antes de excluir a categoria", impact: { transactionCount: count } },
      { status: 409 },
    );
  db.delete(categories).where(and(eq(categories.id, categoryId), eq(categories.userId, session.user.id))).run();
  return Response.json({ ok: true });
}
