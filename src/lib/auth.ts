import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin, username } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import db from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { initializeUserData } from "@/lib/defaults";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret && process.env.NODE_ENV === "production") throw new Error("BETTER_AUTH_SECRET é obrigatório em produção.");

export const auth = betterAuth({
  appName: "FinCat",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: secret ?? "development-only-secret-change-before-production-32-chars",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/username": { window: 60 * 15, max: 5 },
      "/sign-up/email": { window: 60 * 60, max: 5 },
    },
  },
  user: {
    additionalFields: {
      forcePasswordChange: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  databaseHooks: { user: { create: { after: async (created) => initializeUserData(created.id) } } },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 32,
      usernameValidator: (value) => /^[a-zA-Z0-9._-]+$/.test(value),
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      bannedUserMessage: "Seu acesso está bloqueado. Fale com o administrador.",
    }),
    nextCookies(),
  ],
});

let bootstrapPromise: Promise<void> | undefined;
export function ensureOwner() {
  bootstrapPromise ??= (async () => {
    const [existing] = await db.select({ id: schema.user.id }).from(schema.user).limit(1);
    if (existing) return;
    const name = process.env.FINCAT_OWNER_NAME;
    const ownerUsername = process.env.FINCAT_OWNER_USERNAME;
    const password = process.env.FINCAT_OWNER_PASSWORD;
    if (!name || !ownerUsername || !password)
      throw new Error(
        "Primeiro boot incompleto: configure FINCAT_OWNER_NAME, FINCAT_OWNER_USERNAME e FINCAT_OWNER_PASSWORD.",
      );
    const normalized = ownerUsername.trim().toLowerCase();
    const result = await auth.api.signUpEmail({
      body: { name, username: normalized, email: `${normalized}@users.fincat.invalid`, password },
    });
    if (!result.user?.id) throw new Error("Não foi possível criar o dono inicial.");
    await db
      .update(schema.user)
      .set({ role: "admin" })
      .where((await import("drizzle-orm")).eq(schema.user.id, result.user.id));
    console.info(`[fincat] Dono inicial criado: ${normalized}`);
  })();
  return bootstrapPromise;
}
