import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, ensureOwner } from "@/lib/auth";

export async function getSession() {
  await ensureOwner();
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(allowPasswordChange = false) {
  const session = await getSession();
  if (!session)
    throw new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  if (session.user.forcePasswordChange && !allowPasswordChange)
    throw new Response(JSON.stringify({ error: "Troca de senha obrigatória" }), {
      status: 428,
      headers: { "content-type": "application/json" },
    });
  return session;
}

export async function requirePageSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.forcePasswordChange) redirect("/trocar-senha");
  return session;
}

export function unauthorized(error: unknown) {
  if (error instanceof Response) return error;
  console.error(error);
  return Response.json({ error: "Erro interno" }, { status: 500 });
}
