import db from "@/lib/db";
import { budgets, categories } from "@/lib/db/schema";
import { budgetSchema } from "@/lib/validators";
import { eq, and, sql } from "drizzle-orm";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const url = new URL(req.url);
  const month = url.searchParams.get("month");

  const conds = [eq(budgets.userId, session.user.id)];
  if (month) conds.push(eq(budgets.month, month));

  const rows = db
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
          AND t.user_id = ${session.user.id} AND substr(t.date, 1, 7) = ${budgets.month}
      ), 0)`,
    })
    .from(budgets)
    .innerJoin(categories, and(eq(categories.id, budgets.categoryId), eq(categories.userId, session.user.id)))
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(categories.name)
    .all();

  return Response.json(rows);
}

export async function POST(req: Request) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  let parsed;
  try {
    parsed = budgetSchema.safeParse(await req.json());
  } catch {
    return Response.json({ error: "JSON invalido" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = db
    .select()
    .from(budgets)
    .where(and(eq(budgets.userId, session.user.id), eq(budgets.categoryId, parsed.data.categoryId), eq(budgets.month, parsed.data.month)))
    .get();

  if (existing) {
    const updated = db
      .update(budgets)
      .set({ limitCents: parsed.data.limitCents })
      .where(eq(budgets.id, existing.id))
      .returning()
      .get();
    return Response.json(updated);
  }

  const result = db.insert(budgets).values({ ...parsed.data, userId: session.user.id }).run();
  const created = db
    .select()
    .from(budgets)
    .where(and(eq(budgets.id, Number(result.lastInsertRowid)), eq(budgets.userId, session.user.id)))
    .get();
  return Response.json(created, { status: 201 });
}
