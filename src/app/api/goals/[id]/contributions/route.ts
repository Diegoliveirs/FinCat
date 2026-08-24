import { addSavingsEntry, getGoalSummary } from "@/lib/goal-service";
import { savingsEntrySchema } from "@/lib/validators";
import { requireSession, unauthorized } from "@/lib/auth-session";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const { id } = await params;
  const parsed = savingsEntrySchema.safeParse({ ...(await req.json().catch(() => null)), goalId: Number(id) });
  if (!parsed.success)
    return Response.json({ error: "Aporte inválido", issues: parsed.error.flatten() }, { status: 400 });
  try {
    addSavingsEntry(session.user.id, parsed.data);
    return Response.json(getGoalSummary(session.user.id, Number(id)), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao guardar" }, { status: 400 });
  }
}
