import { addSavingsEntry, getSavingsOverview } from "@/lib/goal-service";
import { savingsEntrySchema } from "@/lib/validators";
import { requireSession, unauthorized } from "@/lib/auth-session";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const raw = new URL(req.url).searchParams.get("goalId");
  return Response.json(getSavingsOverview(session.user.id, raw ? Number(raw) : undefined));
}
export async function POST(req: Request) {
  let session; try { session = await requireSession(); } catch (error) { return unauthorized(error); }
  const parsed = savingsEntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Economia inválida", issues: parsed.error.flatten() }, { status: 400 });
  try {
    const id = addSavingsEntry(session.user.id, parsed.data);
    return Response.json({ id, ...getSavingsOverview(session.user.id) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao guardar" }, { status: 400 });
  }
}
