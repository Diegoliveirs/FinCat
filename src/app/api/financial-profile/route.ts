import db from "@/lib/db";
import { financialProfile } from "@/lib/db/schema";
import { financialProfileSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await requireSession();
    const [profile] = await db.select().from(financialProfile).where(eq(financialProfile.userId, user.id)).limit(1);
    return Response.json(profile ?? null);
  } catch (error) {
    return unauthorized(error);
  }
}

export async function PATCH(req: Request) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    return unauthorized(error);
  }
  const incoming = financialProfileSchema.partial().safeParse(await req.json().catch(() => null));
  if (!incoming.success || Object.keys(incoming.data).length === 0)
    return Response.json(
      { error: "Perfil inválido", issues: incoming.success ? undefined : incoming.error.flatten() },
      { status: 400 },
    );
  const [current] = await db
    .select()
    .from(financialProfile)
    .where(eq(financialProfile.userId, session.user.id))
    .limit(1);
  const defaults = {
    desiredReserveCents: 0,
    minimumMonthlySurplusCents: 0,
    unregisteredDebtCents: 0,
    monthlyIncomeCents: null,
    incomeStability: "unknown" as const,
    maxIncomeCommitmentPercent: 30,
  };
  const baseProfile = current ? { ...defaults, ...current } : defaults;
  const parsed = financialProfileSchema.safeParse({
    ...baseProfile,
    ...incoming.data,
  });
  if (!parsed.success)
    return Response.json({ error: "Perfil inválido", issues: parsed.error.flatten() }, { status: 400 });
  await db
    .insert(financialProfile)
    .values({ userId: session.user.id, ...parsed.data, updatedAt: Date.now() })
    .onConflictDoUpdate({ target: financialProfile.userId, set: { ...parsed.data, updatedAt: Date.now() } });
  const [profile] = await db
    .select()
    .from(financialProfile)
    .where(eq(financialProfile.userId, session.user.id))
    .limit(1);
  return Response.json(profile ?? null);
}
