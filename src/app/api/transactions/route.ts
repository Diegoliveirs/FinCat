import db from "@/lib/db";
import { transactions, accounts, categories } from "@/lib/db/schema";
import { transactionSchema } from "@/lib/validators";
import { desc, eq, and, sql } from "drizzle-orm";
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
  const accountId = url.searchParams.get("accountId");
  const categoryId = url.searchParams.get("categoryId");
  const type = url.searchParams.get("type");
  const limit = Number(url.searchParams.get("limit") ?? 200);

  const conds = [eq(transactions.userId, session.user.id)];
  if (month) conds.push(sql`substring(${transactions.date} from 1 for 7) = ${month}`);
  if (accountId) conds.push(eq(transactions.accountId, Number(accountId)));
  if (categoryId) conds.push(eq(transactions.categoryId, Number(categoryId)));
  if (type) conds.push(eq(transactions.type, type as "income" | "expense"));

  const where = conds.length > 0 ? and(...conds) : undefined;

  const rows = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      type: transactions.type,
      amountCents: transactions.amountCents,
      description: transactions.description,
      date: transactions.date,
      createdAt: transactions.createdAt,
      accountName: accounts.name,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .innerJoin(accounts, and(eq(accounts.id, transactions.accountId), eq(accounts.userId, session.user.id)))
    .innerJoin(categories, and(eq(categories.id, transactions.categoryId), eq(categories.userId, session.user.id)))
    .where(where)
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(limit);

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
    parsed = transactionSchema.safeParse(await req.json());
  } catch {
    return Response.json({ error: "JSON invalido" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const [inserted] = await db
    .insert(transactions)
    .values({ ...parsed.data, userId: session.user.id, createdAt: Date.now() })
    .returning({ id: transactions.id });
  const [created] = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      type: transactions.type,
      amountCents: transactions.amountCents,
      description: transactions.description,
      date: transactions.date,
      accountName: accounts.name,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .innerJoin(accounts, and(eq(accounts.id, transactions.accountId), eq(accounts.userId, session.user.id)))
    .innerJoin(categories, and(eq(categories.id, transactions.categoryId), eq(categories.userId, session.user.id)))
    .where(and(eq(transactions.id, inserted.id), eq(transactions.userId, session.user.id)));
  return Response.json(created, { status: 201 });
}
