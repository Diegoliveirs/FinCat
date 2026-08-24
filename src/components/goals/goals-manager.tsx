"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths } from "date-fns";
import { Archive, Plus, Sparkles, Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatBRL } from "@/lib/money";
import type { getGoalSummaries, getSavingsOverview } from "@/lib/goal-service";
import { toast } from "sonner";
type Goal = ReturnType<typeof getGoalSummaries>[number];
type Savings = ReturnType<typeof getSavingsOverview>;

export function GoalsManager({ goals, savings }: { goals: Goal[]; savings: Savings }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState(0);
  const [date, setDate] = useState(format(addMonths(new Date(), 6), "yyyy-MM-dd"));
  const [initial, setInitial] = useState(0);
  const [saveAmount, setSaveAmount] = useState(0);
  const [saveGoalId, setSaveGoalId] = useState("");
  const create = async () => {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, targetAmountCents: target, targetDate: date, initialAmountCents: initial }),
      });
      if (res.ok) {
        toast.success("Meta criada");
        setCreating(false);
        setName("");
        setTarget(0);
        setInitial(0);
        router.refresh();
      } else toast.error("Revise os dados da meta");
    } catch {
      toast.error("Sem conexão. Tente criar a meta novamente.");
    } finally {
      setPending(false);
    }
  };
  const save = async () => {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: saveGoalId ? Number(saveGoalId) : null,
          amountCents: saveAmount,
          savedAt: format(new Date(), "yyyy-MM-dd"),
          description: saveGoalId ? "Aporte manual" : "Economia geral",
        }),
      });
      if (res.ok) {
        toast.success(saveGoalId ? "Aporte registrado" : "Economia registrada");
        setSaving(false);
        setSaveAmount(0);
        setSaveGoalId("");
        router.refresh();
      } else toast.error("Não foi possível registrar o valor");
    } catch {
      toast.error("Sem conexão. Tente registrar novamente.");
    } finally {
      setPending(false);
    }
  };
  const archive = async (id: number) => {
    if (pending || !confirm("Arquivar esta meta? O histórico será preservado.")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Meta arquivada");
        router.refresh();
      } else toast.error("Não foi possível arquivar");
    } catch {
      toast.error("Sem conexão. Tente arquivar novamente.");
    } finally {
      setPending(false);
    }
  };
  const removeSaving = async (id: number) => {
    if (pending || !confirm("Excluir este registro? O progresso da meta será recalculado.")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/savings/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Registro excluído");
        router.refresh();
      } else toast.error("Não foi possível excluir");
    } catch {
      toast.error("Sem conexão. Tente excluir novamente.");
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="space-y-8">
      <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
        <div className="bg-surface p-5">
          <p className="text-muted text-xs">Economias registradas</p>
          <p className="text-brand mt-2 font-mono text-2xl font-semibold">{formatBRL(savings.totalSavedCents)}</p>
        </div>
        <div className="bg-surface p-5">
          <p className="text-muted text-xs">Sem meta definida</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{formatBRL(savings.unallocatedCents)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("fincat:open-chat", {
                detail: { prompt: "Quero criar uma meta para ", agentId: "persinha" },
              }),
            )
          }
          className="bg-brand flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
        >
          <Sparkles className="size-4" />
          Criar com o Persinha
        </button>
        <button
          onClick={() => setCreating((v) => !v)}
          className="text-muted flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm"
        >
          <Plus className="size-4" />
          Criar manualmente
        </button>
        <button
          onClick={() => setSaving((v) => !v)}
          className="text-muted rounded-xl border border-white/10 px-4 py-2.5 text-sm"
        >
          Registrar economia ou aporte
        </button>
      </div>
      {saving && (
        <div className="bg-surface grid gap-4 rounded-2xl border border-white/10 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-muted text-xs">
            Destino
            <select
              value={saveGoalId}
              onChange={(e) => setSaveGoalId(e.target.value)}
              className="bg-bg text-ink mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
            >
              <option value="">Economias gerais</option>
              {goals
                .filter((goal) => goal.status === "active")
                .map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-muted text-xs">
            Valor
            <CurrencyInput value={saveAmount} onChange={setSaveAmount} ariaLabel="Valor guardado" className="mt-1.5" />
          </label>
          <button
            onClick={save}
            disabled={saveAmount <= 0}
            className="bg-brand rounded-xl px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
          >
            Registrar
          </button>
        </div>
      )}
      {creating && (
        <div className="bg-surface grid gap-4 rounded-2xl border border-white/10 p-5 sm:grid-cols-2">
          <label className="text-muted text-xs">
            Nome
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-bg text-ink mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-muted text-xs">
            Prazo
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-bg text-ink mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-muted text-xs">
            Valor-alvo
            <CurrencyInput value={target} onChange={setTarget} className="mt-1.5" />
          </label>
          <label className="text-muted text-xs">
            Já guardado
            <CurrencyInput value={initial} onChange={setInitial} className="mt-1.5" />
          </label>
          <button
            onClick={create}
            disabled={name.trim().length < 2 || target <= 0 || !date}
            className="bg-brand rounded-xl px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40 sm:col-span-2"
          >
            Criar meta
          </button>
        </div>
      )}
      <section>
        <h2 className="text-lg font-semibold">Suas metas</h2>
        <div className="mt-3 divide-y divide-white/8 border-y border-white/8">
          {goals.length ? (
            goals.map((goal) => (
              <div key={goal.id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{goal.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${goal.status === "completed" ? "bg-brand/12 text-brand" : "text-muted bg-white/8"}`}
                    >
                      {goal.status === "completed" ? "concluída" : "ativa"}
                    </span>
                  </div>
                  <div className="mt-3 max-w-2xl">
                    <ProgressBar percent={goal.progress.percentage} />
                  </div>
                  <p className="text-muted mt-2 text-xs">
                    {formatBRL(goal.savedCents)} de {formatBRL(goal.targetAmountCents)} ·{" "}
                    {goal.progress.percentage.toFixed(0)}% · {goal.targetDate.split("-").reverse().join("/")}
                  </p>
                  {goal.status === "active" && (
                    <p className="text-muted mt-1 text-xs">
                      Recomendação atual: {formatBRL(goal.progress.monthlyRecommendedCents)} por mês.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => archive(goal.id)}
                  className="text-muted hover:text-ink flex items-center gap-1.5 text-xs"
                >
                  <Archive className="size-4" />
                  Arquivar
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted py-8 text-sm">Nenhuma meta criada ainda.</p>
          )}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Histórico de economias</h2>
        <div className="mt-3 divide-y divide-white/8 border-y border-white/8">
          {savings.entries.length ? (
            savings.entries.slice(0, 50).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-brand font-mono text-sm">{formatBRL(entry.amountCents)}</p>
                  <p className="text-muted mt-0.5 text-xs">
                    {entry.description || "Economia"} · {entry.savedAt.split("-").reverse().join("/")}
                  </p>
                </div>
                <button
                  disabled={pending}
                  aria-label="Excluir registro"
                  onClick={() => removeSaving(entry.id)}
                  className="text-muted hover:text-danger p-2 disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted py-8 text-sm">Nenhum valor guardado registrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}
