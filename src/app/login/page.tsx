import { AuthForm } from "@/components/auth/auth-form"; import { AuthShell } from "@/components/auth/auth-shell";
export default function LoginPage() { return <AuthShell title="Abra o seu cofre" text="Use seu usuário e senha. Seus dados ficam separados de todas as outras contas."><AuthForm mode="login" /></AuthShell>; }
