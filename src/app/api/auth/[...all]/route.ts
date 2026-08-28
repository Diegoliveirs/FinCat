import { toNextJsHandler } from "better-auth/next-js";
import { auth, ensureOwner } from "@/lib/auth";

const handler = toNextJsHandler(auth);
export async function GET(request: Request) {
  await ensureOwner();
  return handler.GET(request);
}
export async function POST(request: Request) {
  await ensureOwner();
  return handler.POST(request);
}
