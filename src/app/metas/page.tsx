import { getGoalSummaries, getSavingsOverview } from "@/lib/goal-service";
import { GoalsManager } from "@/components/goals/goals-manager";
import { requirePageSession } from "@/lib/auth-session";
export const dynamic = "force-dynamic";
export default async function GoalsPage() {
  const session = await requirePageSession();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
        <p className="text-muted mt-2 max-w-2xl text-sm">
          Transforme o que você quer em um plano mensal simples — e conte ao Persinha quando guardar.
        </p>
      </div>
      <GoalsManager
        goals={getGoalSummaries(session.user.id, true).filter((goal) => goal.status !== "archived")}
        savings={getSavingsOverview(session.user.id)}
      />
    </div>
  );
}
