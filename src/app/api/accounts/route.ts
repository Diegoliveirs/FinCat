import db from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { accountSchema } from "@/lib/validators";
import { and, eq } from "drizzle-orm";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try { const { user } = await requireSession(); return Response.json(db.select().from(accounts).where(eq(accounts.userId, user.id)).orderBy(accounts.id).all()); }
  catch (error) { return unauthorized(error); }
}

export async function POST(req: Request) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  let parsed;
  try {
    parsed = accountSchema.safeParse(await req.json());
  } catch {
    return Response.json({ error: "JSON invalido" }, { status: 400 });
  }
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { initialBalanceCents, ...rest } = parsed.data;
  const result = db
    .insert(accounts)
    .values({ ...rest, userId: session.user.id, initialBalanceCents, createdAt: Date.now() })
    .run();
  const created = db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, Number(result.lastInsertRowid)), eq(accounts.userId, session.user.id)))
    .get();
  return Response.json(created, { status: 201 });
}
