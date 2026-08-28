import { getOverview } from "@/lib/stats";
import { BalanceHero } from "@/components/ui/balance-hero";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CategoryDonut, EvolutionChart } from "@/components/ui/charts";
import { KpiGrid } from "@/components/ui/kpi-grid";
import { formatBRL } from "@/lib/money";
import { ArrowRight, Sparkles } from "lucide-react";
import { GoalsHome } from "@/components/goals/goals-home";
import { getGoalSummaries } from "@/lib/goal-service";
import { requirePageSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requirePageSession();
  const data = await getOverview(session.user.id);
  const goals = (await getGoalSummaries(session.user.id)).filter((goal) => goal.status === "active");
  return (
    <div className="space-y-10">
      <section className="dashboard-intro">
        <div className="agent-reading">
          <div className="text-brand flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4" />
            Leitura do FinCat
          </div>
          <p>Seu dinheiro contado como decisão, não como planilha.</p>
        </div>
        <div className={`diagnosis diagnosis-${data.diagnosis.tone}`}>
          <div>
            <h1>{data.diagnosis.title}</h1>
            <p>{data.diagnosis.detail}</p>
          </div>
          <a href={data.diagnosis.tone === "warning" ? "/orcamentos" : "/transacoes"}>
            {data.diagnosis.action}
            <ArrowRight className="size-4" />
          </a>
        </div>
        <div className="wipe editorial-balance">
          <BalanceHero totalCents={data.totalBalanceCents} />
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          <StatCard label="Entradas no mês" cents={data.monthIncomeCents} positive />
          <StatCard label="Saídas no mês" cents={data.monthExpenseCents} positive={false} hint="o que saiu do caixa" />
          <StatCard label="Resultado do mês" cents={data.monthNetCents} hint="receitas menos despesas" />
        </div>
        <KpiGrid kpis={data.kpis} />
      </section>
      <GoalsHome goals={goals} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold tracking-tight">Fluxo — 6 meses</h2>
          <EvolutionChart data={data.evolution} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold tracking-tight">Gastos por categoria</h2>
          {data.byCategory.length ? (
            <CategoryDonut data={data.byCategory.filter((c) => c.kind === "expense")} />
          ) : (
            <p className="text-muted py-10 text-center text-sm">Sem gastos este mês.</p>
          )}
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="mb-4 text-lg font-bold tracking-tight">Orçamentos do mês</h2>
        {data.budgets.length ? (
          <div className="space-y-4">
            {data.budgets.map((b) => (
              <div key={b.categoryId}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-sm" style={{ color: b.color }}>
                    {b.name}
                  </span>
                  <span className="text-muted font-mono text-xs">
                    {formatBRL(b.spentCents)} / {formatBRL(b.limitCents)}
                    {b.over && <span className="text-danger ml-2">estourou</span>}
                  </span>
                </div>
                <ProgressBar percent={b.percent} color={b.color} over={b.over} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted py-4 text-center text-sm">Nenhum orçamento definido este mês.</p>
        )}
      </Card>
    </div>
  );
}
