import db from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { categorySchema } from "@/lib/validators";
import { and, eq } from "drizzle-orm";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try { const { user } = await requireSession(); return Response.json(db.select().from(categories).where(eq(categories.userId, user.id)).orderBy(categories.sortOrder, categories.id).all()); }
  catch (error) { return unauthorized(error); }
}

export async function POST(req: Request) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  let parsed;
  try {
    parsed = categorySchema.safeParse(await req.json());
  } catch {
    return Response.json({ error: "JSON invalido" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const result = db.insert(categories).values({ ...parsed.data, userId: session.user.id }).run();
  const created = db
    .select()
    .from(categories)
    .where(and(eq(categories.id, Number(result.lastInsertRowid)), eq(categories.userId, session.user.id)))
    .get();
  return Response.json(created, { status: 201 });
}
