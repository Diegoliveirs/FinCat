import { Gauge, PiggyBank, ShieldCheck, TrendingUp } from "lucide-react";
import { formatBRL } from "@/lib/money";
import type { Overview } from "@/lib/stats";

export function KpiGrid({ kpis }: { kpis: Overview["kpis"] }) {
  const items = [
    {
      label: "Taxa de economia",
      value: kpis.savingsRatePercent == null ? "—" : `${kpis.savingsRatePercent.toFixed(1)}%`,
      help: kpis.savingsRatePercent == null ? "Registre uma receita" : "do que entrou ficou no mês",
      icon: PiggyBank,
    },
    {
      label: "Projeção de gastos",
      value: kpis.projectedExpenseCents == null ? "—" : formatBRL(kpis.projectedExpenseCents),
      help: kpis.projectedExpenseCents == null ? "Registre despesas" : "no ritmo atual",
      icon: TrendingUp,
    },
    {
      label: "Pressão dos orçamentos",
      value: kpis.budgetPressurePercent == null ? "—" : `${kpis.budgetPressurePercent.toFixed(0)}%`,
      help:
        kpis.budgetPressurePercent == null ? "Crie seu primeiro limite" : `${kpis.budgetsAbove80Count} acima de 80%`,
      icon: Gauge,
    },
    {
      label: "Fôlego estimado",
      value: kpis.estimatedRunwayMonths == null ? "—" : `${kpis.estimatedRunwayMonths.toFixed(1)} meses`,
      help: kpis.estimatedRunwayMonths == null ? "Complete 3 meses de histórico" : "pelo gasto médio recente",
      icon: ShieldCheck,
    },
  ];
  return (
    <div className="kpi-grid">
      {items.map(({ label, value, help, icon: Icon }) => (
        <div className="kpi" key={label}>
          <Icon className="text-brand size-4" />
          <div>
            <p className="text-muted text-xs">{label}</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{value}</p>
            <p className="text-muted mt-1 text-xs">{help}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
