import db from "@/lib/db";
import { budgets, categories } from "@/lib/db/schema";
import { budgetSchema } from "@/lib/validators";
import { eq, and, sql } from "drizzle-orm";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    return unauthorized(error);
  }
  const url = new URL(req.url);
  const month = url.searchParams.get("month");

  const conds = [eq(budgets.userId, session.user.id)];
  if (month) conds.push(eq(budgets.month, month));

  const rows = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      month: budgets.month,
      limitCents: budgets.limitCents,
      name: categories.name,
      color: categories.color,
      spentCents: sql<number>`COALESCE((
        SELECT SUM(${sql.raw("t.amount_cents")}) FROM transactions t
        WHERE t.category_id = ${budgets.categoryId}
          AND t.type = 'expense'
          AND t.user_id = ${session.user.id} AND substring(t.date from 1 for 7) = ${budgets.month}
      ), 0)`,
    })
    .from(budgets)
    .innerJoin(categories, and(eq(categories.id, budgets.categoryId), eq(categories.userId, session.user.id)))
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(categories.name);

  return Response.json(rows);
}

export async function POST(req: Request) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    return unauthorized(error);
  }
  let parsed;
  try {
    parsed = budgetSchema.safeParse(await req.json());
  } catch {
    return Response.json({ error: "JSON invalido" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const [existing] = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, session.user.id),
        eq(budgets.categoryId, parsed.data.categoryId),
        eq(budgets.month, parsed.data.month),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(budgets)
      .set({ limitCents: parsed.data.limitCents })
      .where(eq(budgets.id, existing.id))
      .returning();
    return Response.json(updated);
  }

  const [created] = await db
    .insert(budgets)
    .values({ ...parsed.data, userId: session.user.id })
    .returning();
  return Response.json(created, { status: 201 });
}
