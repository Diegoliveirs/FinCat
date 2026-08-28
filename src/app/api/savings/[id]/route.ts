import { deleteSavingsEntry } from "@/lib/goal-service";
import { requireSession, unauthorized } from "@/lib/auth-session";
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    return unauthorized(error);
  }
  const { id } = await params;
  return (await deleteSavingsEntry(session.user.id, Number(id)))
    ? Response.json({ ok: true })
    : Response.json({ error: "Registro não encontrado" }, { status: 404 });
}
