import { archiveGoal, getGoalSummary, updateGoal } from "@/lib/goal-service";
import { financialGoalUpdateSchema } from "@/lib/validators";
import { requireSession, unauthorized } from "@/lib/auth-session";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const { id } = await params;
  const goal = getGoalSummary(session.user.id, Number(id));
  return goal ? Response.json(goal) : Response.json({ error: "Meta não encontrada" }, { status: 404 });
}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const { id } = await params;
  const parsed = financialGoalUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Alteração inválida", issues: parsed.error.flatten() }, { status: 400 });
  return updateGoal(session.user.id, Number(id), parsed.data)
    ? Response.json(getGoalSummary(session.user.id, Number(id)))
    : Response.json({ error: "Meta não encontrada" }, { status: 404 });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const { id } = await params;
  return archiveGoal(session.user.id, Number(id))
    ? Response.json({ ok: true })
    : Response.json({ error: "Meta não encontrada" }, { status: 404 });
}
