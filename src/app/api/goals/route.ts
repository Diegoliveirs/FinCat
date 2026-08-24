import { createGoal, getGoalSummaries } from "@/lib/goal-service";
import { financialGoalCreateSchema } from "@/lib/validators";
import { requireSession, unauthorized } from "@/lib/auth-session";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const includeArchived = new URL(req.url).searchParams.get("includeArchived") === "1";
  return Response.json(getGoalSummaries(session.user.id, includeArchived));
}
export async function POST(req: Request) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const parsed = financialGoalCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Meta inválida", issues: parsed.error.flatten() }, { status: 400 });
  const id = createGoal(session.user.id, parsed.data);
  return Response.json(
    getGoalSummaries(session.user.id, true).find((goal) => goal.id === id),
    { status: 201 },
  );
}
