import { getOverview } from "@/lib/stats";
import { requireSession, unauthorized } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let session;
  try {
    session = await requireSession();
  } catch (error) {
    return unauthorized(error);
  }
  const url = new URL(req.url);
  const month = url.searchParams.get("month") ?? undefined;
  return Response.json(getOverview(session.user.id, month));
}
