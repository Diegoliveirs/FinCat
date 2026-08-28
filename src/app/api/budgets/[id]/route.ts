import db from "@/lib/db";
import { budgets } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    return unauthorized(error);
  }
  const { id } = await ctx.params;
  const [deleted] = await db
    .delete(budgets)
    .where(and(eq(budgets.id, Number(id)), eq(budgets.userId, session.user.id)))
    .returning();
  if (!deleted) return Response.json({ error: "Orçamento não encontrado" }, { status: 404 });
  return Response.json({ ok: true });
}
