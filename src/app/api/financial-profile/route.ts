import db from "@/lib/db";
import { financialProfile } from "@/lib/db/schema";
import { financialProfileSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try { const { user } = await requireSession(); return Response.json(db.select().from(financialProfile).where(eq(financialProfile.userId, user.id)).get() ?? null); }
  catch (error) { return unauthorized(error); }
}

export async function PATCH(req: Request) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const incoming = financialProfileSchema.partial().safeParse(await req.json().catch(() => null));
  if (!incoming.success || Object.keys(incoming.data).length === 0)
    return Response.json(
      { error: "Perfil inválido", issues: incoming.success ? undefined : incoming.error.flatten() },
      { status: 400 },
    );
  const current = db.select().from(financialProfile).where(eq(financialProfile.userId, session.user.id)).get();
  const parsed = financialProfileSchema.safeParse({
    desiredReserveCents: 0,
    minimumMonthlySurplusCents: 0,
    unregisteredDebtCents: 0,
    monthlyIncomeCents: null,
    incomeStability: "unknown",
    maxIncomeCommitmentPercent: 30,
    ...current,
    ...incoming.data,
  });
  if (!parsed.success)
    return Response.json({ error: "Perfil inválido", issues: parsed.error.flatten() }, { status: 400 });
  db.insert(financialProfile)
    .values({ userId: session.user.id, ...parsed.data, updatedAt: Date.now() })
    .onConflictDoUpdate({ target: financialProfile.userId, set: { ...parsed.data, updatedAt: Date.now() } })
    .run();
  return Response.json(db.select().from(financialProfile).where(eq(financialProfile.userId, session.user.id)).get());
}
