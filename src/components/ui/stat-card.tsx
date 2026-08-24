import { formatBRL } from "@/lib/money";

type Props = {
  label: string;
  cents: number;
  positive?: boolean;
  hint?: string;
};

export function StatCard({ label, cents, positive, hint }: Props) {
  const isPositive = positive ?? cents >= 0;
  return (
    <div className="card-border rounded-card bg-surface p-4">
      <div className="text-muted text-xs">{label}</div>
      <div
        className="mt-1.5 font-mono text-xl font-bold tracking-tight tabular-nums"
        style={{ color: isPositive ? "var(--color-brand)" : "var(--color-danger)" }}
      >
        {formatBRL(cents)}
      </div>
      {hint && <div className="text-muted mt-1 text-[11px]">{hint}</div>}
    </div>
  );
}
