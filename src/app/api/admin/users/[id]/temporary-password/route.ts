import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireSession, unauthorized } from "@/lib/auth-session";
import db from "@/lib/db";
import { user } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "admin") return Response.json({ error: "Não encontrado" }, { status: 404 });
    const { id } = await params;
    const [target] = await db
      .select()
      .from(user)
      .where(and(eq(user.id, id), ne(user.role, "admin")))
      .limit(1);
    if (!target) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
    const temporaryPassword = `Fc!${randomBytes(8).toString("base64url")}`;
    await auth.api.setUserPassword({ body: { userId: id, newPassword: temporaryPassword }, headers: await headers() });
    await auth.api.revokeUserSessions({ body: { userId: id }, headers: await headers() });
    await db.update(user).set({ forcePasswordChange: true }).where(eq(user.id, id));
    return Response.json({ temporaryPassword });
  } catch (error) {
    return unauthorized(error);
  }
}
