import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
export default function CadastroPage() {
  return (
    <AuthShell title="Crie seu território" text="Seu usuário identifica a conta. O FinCat não pede nem exibe e-mail.">
      <AuthForm mode="register" />
    </AuthShell>
  );
}
