"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Modal } from "@/components/ui/modal";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL } from "@/lib/money";
import { format } from "date-fns";

type BudgetRow = {
  id: number;
  categoryId: number;
  month: string;
  limitCents: number;
  name: string;
  color: string;
  spentCents: number;
};

type Category = { id: number; name: string; kind: "income" | "expense"; color: string };

export default function BudgetsPage() {
  const [rows, setRows] = useState<BudgetRow[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/budgets?month=${month}`);
    if (res.ok) setRows(await res.json());
  }, [month]);

  useEffect(() => {
    (async () => {
      const cats = await fetch("/api/categories").then((r) => r.json());
      setCategories(cats.filter((c: Category) => c.kind === "expense"));
    })();
  }, []);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  const openCreate = () => {
    setCategoryId("");
    setLimit(0);
    setOpen(true);
  };

  const save = async () => {
    if (!categoryId || limit <= 0) {
      toast.error("Escolhe categoria e um limite acima de zero");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: Number(categoryId), month, limitCents: limit }),
      });
      if (!res.ok) {
        toast.error("Falha ao salvar orçamento");
      } else {
        toast.success("Orçamento salvo");
        setOpen(false);
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number, name: string) => {
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    toast(`Orçamento de ${name} removido`);
    load();
  };

  const used = new Set(rows?.map((r) => r.categoryId) ?? []);
  const free = categories.filter((c) => !used.has(c.id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted text-sm">Limites por categoria. Estourar = gato bravo.</p>
        </div>
        <Button onClick={openCreate} disabled={free.length === 0}>
          <Plus className="size-4" /> Novo
        </Button>
      </div>

      <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />

      {rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nenhum orçamento este mês."
          action={
            <Button onClick={openCreate} variant="outline" disabled={free.length === 0}>
              Definir limite
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const percent = r.limitCents > 0 ? (r.spentCents / r.limitCents) * 100 : 0;
            const over = r.spentCents > r.limitCents;
            return (
              <div key={r.id} className="card-border row-in rounded-card bg-surface p-4">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm font-medium" style={{ color: r.color }}>
                    {r.name}
                  </span>
                  <span className="text-muted font-mono text-xs">
                    {formatBRL(r.spentCents)} / {formatBRL(r.limitCents)}
                    {over && <span className="text-danger ml-2 font-bold">estourou</span>}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar percent={percent} color={r.color} over={over} />
                  </div>
                  <button
                    onClick={() => remove(r.id, r.name)}
                    aria-label="Excluir orçamento"
                    className="press text-muted hover:bg-danger/15 hover:text-danger rounded-full p-1.5"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo orçamento">
        <div className="space-y-4">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Categoria</option>
            {free.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <CurrencyInput value={limit} onChange={setLimit} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
