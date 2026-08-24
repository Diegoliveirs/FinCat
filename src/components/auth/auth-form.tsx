"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "register" | "password" }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? ""); const confirmation = String(data.get("confirmation") ?? "");
    if (mode !== "login" && password !== confirmation) { setError("As senhas não coincidem."); setBusy(false); return; }
    try {
      if (mode === "login") {
        const result = await authClient.signIn.username({ username: String(data.get("username")), password });
        if (result.error) throw new Error(result.error.status === 429 ? "Muitas tentativas. Aguarde alguns minutos." : "Usuário ou senha inválidos.");
        if ((result.data?.user as { forcePasswordChange?: boolean } | undefined)?.forcePasswordChange) { router.push("/trocar-senha"); router.refresh(); return; }
      } else if (mode === "register") {
        const username = String(data.get("username")).trim().toLowerCase();
        const result = await authClient.signUp.email({ name: String(data.get("name")), username, email: `${username}@users.fincat.invalid`, password });
        if (result.error) throw new Error(result.error.status === 429 ? "Limite de cadastros atingido. Tente mais tarde." : "Não foi possível criar a conta. Verifique os dados.");
      } else {
        const result = await authClient.changePassword({ currentPassword: String(data.get("currentPassword")), newPassword: password, revokeOtherSessions: true });
        if (result.error) throw new Error("A senha atual não confere ou a nova senha é inválida.");
        await fetch("/api/account/password-changed", { method: "POST" });
      }
      router.push("/"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível continuar."); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="auth-form">
    {mode === "register" ? <label>Seu nome<input name="name" required minLength={2} autoComplete="name" /></label> : null}
    {mode !== "password" ? <label>Usuário<input name="username" required minLength={3} maxLength={32} autoCapitalize="none" autoComplete="username" /></label> : <label>Senha atual<input name="currentPassword" type="password" required autoComplete="current-password" /></label>}
    <label>{mode === "password" ? "Nova senha" : "Senha"}<input name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
    {mode !== "login" ? <label>Confirmar senha<input name="confirmation" type="password" required minLength={8} autoComplete="new-password" /></label> : null}
    {error ? <p role="alert" className="auth-error">{error}</p> : null}
    <button disabled={busy}>{busy ? "Aguarde…" : mode === "login" ? "Entrar no cofre" : mode === "register" ? "Criar minha conta" : "Atualizar senha"}</button>
    {mode === "login" ? <p>Ainda não tem acesso? <Link href="/cadastro">Criar conta</Link></p> : mode === "register" ? <p>Já tem conta? <Link href="/login">Entrar</Link></p> : null}
  </form>;
}
