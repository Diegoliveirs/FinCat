"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatBRL } from "@/lib/money";
import type { getGoalSummaries } from "@/lib/goal-service";
import { toast } from "sonner";

type Goal = Awaited<ReturnType<typeof getGoalSummaries>>[number];
export function GoalsHome({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Goal | null>(null);
  const [amount, setAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showAmount, setShowAmount] = useState(false);
  const contribute = async () => {
    if (!selected || amount <= 0 || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/goals/${selected.id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: amount,
          savedAt: format(new Date(), "yyyy-MM-dd"),
          description: "Revisão mensal",
        }),
      });
      if (res.ok) {
        toast.success("Aporte registrado");
        setSelected(null);
        setAmount(0);
        setShowAmount(false);
        router.refresh();
      } else {
        const body = await res.json().catch(() => null);
        toast.error(typeof body?.error === "string" ? body.error : "Não foi possível registrar o aporte");
      }
    } catch {
      toast.error("Sem conexão. Tente registrar o aporte novamente.");
    } finally {
      setSaving(false);
    }
  };
  if (!goals.length)
    return (
      <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Sua próxima meta começa aqui</h2>
          <p className="text-muted mt-1 text-sm">Diga ao Persinha o que você quer comprar, o valor e o prazo.</p>
        </div>
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("fincat:open-chat", {
                detail: { prompt: "Quero criar uma meta para ", agentId: "persinha" },
              }),
            )
          }
          className="press bg-brand rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
        >
          Criar com o Persinha
        </button>
      </Card>
    );
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="font-semibold">Metas em andamento</h2>
          <p className="text-muted mt-1 text-xs">Até três objetivos mais próximos do prazo.</p>
        </div>
        <Link href="/metas" className="text-brand flex items-center gap-1.5 text-xs font-semibold">
          Ver todas
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="hairline">
        {goals.slice(0, 3).map((goal) => (
          <div key={goal.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{goal.name}</span>
                <span className="text-muted font-mono text-xs tabular-nums">
                  {goal.progress.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar percent={goal.progress.percentage} />
              </div>
              <div className="text-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>
                  {formatBRL(goal.savedCents)} de {formatBRL(goal.targetAmountCents)}
                </span>
                <span>Guardar {formatBRL(goal.progress.monthlyRecommendedCents)}/mês</span>
                <span>até {goal.targetDate.split("-").reverse().join("/")}</span>
              </div>
            </div>
            {goal.progress.reviewPending ? (
              <button
                onClick={() => setSelected(goal)}
                className="press border-brand/35 text-brand rounded-xl border px-3 py-2 text-xs font-semibold"
              >
                Atualizar este mês
              </button>
            ) : (
              <span className="text-brand flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="size-4" />
                Aporte registrado
              </span>
            )}
          </div>
        ))}
      </div>
      <Modal
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setShowAmount(false);
          setAmount(0);
        }}
        title={selected ? `Como foi com “${selected.name}”?` : "Atualizar meta"}
      >
        <div className="space-y-4">
          <p className="text-muted text-sm">Você já conseguiu guardar algum valor neste mês?</p>
          {!showAmount ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setShowAmount(true)}
                className="bg-brand rounded-xl px-4 py-3 text-sm font-semibold text-black"
              >
                Já guardei
              </button>
              <button
                onClick={() => setSelected(null)}
                className="text-muted rounded-xl border border-white/10 px-4 py-3 text-sm"
              >
                Ainda não guardei
              </button>
            </div>
          ) : (
            <>
              <CurrencyInput value={amount} onChange={setAmount} ariaLabel="Valor guardado neste mês" />
              <button
                disabled={amount <= 0 || saving}
                onClick={contribute}
                className="bg-brand w-full rounded-xl px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
              >
                {saving ? "Guardando…" : "Confirmar aporte"}
              </button>
            </>
          )}
        </div>
      </Modal>
    </Card>
  );
}
