import { AuthForm } from "@/components/auth/auth-form"; import { AuthShell } from "@/components/auth/auth-shell";
export const dynamic = "force-dynamic";
export default function PasswordPage() { return <AuthShell title="Defina uma nova senha" text="Esta troca encerra as outras sessões e libera novamente seu acesso."><AuthForm mode="password" /></AuthShell>; }
