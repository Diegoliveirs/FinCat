"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CreditCard, PiggyBank, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBRL } from "@/lib/money";

type Account = {
  id: number;
  name: string;
  type: "cc" | "poupanca" | "dinheiro";
  initialBalanceCents: number;
  balanceCents?: number;
};

const typeMeta = {
  cc: { label: "Conta corrente", icon: CreditCard },
  poupanca: { label: "Poupança", icon: PiggyBank },
  dinheiro: { label: "Dinheiro", icon: Banknote },
};

export default function AccountsPage() {
  const [rows, setRows] = useState<Account[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<Account["type"]>("cc");
  const [initial, setInitial] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/accounts");
    if (!res.ok) return;
    const list: Account[] = await res.json();
    const txs = await fetch("/api/transactions?limit=10000").then((r) => r.json());
    const enriched = list.map((a) => ({
      ...a,
      balanceCents:
        a.initialBalanceCents +
        txs
          .filter((t: { accountId: number }) => t.accountId === a.id)
          .reduce((sum: number, t: { type: string; amountCents: number }) => {
            return t.type === "income" ? sum + t.amountCents : sum - t.amountCents;
          }, 0),
    }));
    setRows(enriched);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setType("cc");
    setInitial(0);
    setOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setName(a.name);
    setType(a.type);
    setInitial(a.initialBalanceCents);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Nome obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), type, initialBalanceCents: initial };
      const res = editing
        ? await fetch(`/api/accounts/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        toast.error("Falha ao salvar conta");
      } else {
        toast.success(editing ? "Conta atualizada" : "Conta criada");
        setOpen(false);
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: Account) => {
    if (!confirm(`Excluir a conta ${a.name}? As movimentações vinculadas também serão excluídas.`)) return;
    const res = await fetch(`/api/accounts/${a.id}?cascade=1`, { method: "DELETE" });
    if (res.ok) {
      toast("Conta removida");
      load();
    } else toast.error("Não foi possível remover a conta");
  };

  const total = rows?.reduce((s, a) => s + (a.balanceCents ?? 0), 0) ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted text-sm">Onde seu dinheiro vive.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Nova
        </Button>
      </div>

      {rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nenhuma conta ainda."
          action={
            <Button onClick={openCreate} variant="outline">
              Criar primeira
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-card bg-surface/60 flex items-baseline justify-between border border-white/10 px-4 py-3">
            <span className="text-muted text-sm">Soma das contas</span>
            <span
              className="font-mono text-xl font-bold tabular-nums"
              style={{ color: total >= 0 ? "var(--color-brand)" : "var(--color-danger)" }}
            >
              {formatBRL(total)}
            </span>
          </div>
          {rows.map((a, i) => {
            const Icon = typeMeta[a.type].icon;
            return (
              <div
                key={a.id}
                className="card-border row-in rounded-card bg-surface flex items-center gap-4 p-4"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <Icon className="text-muted size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  <div className="text-muted text-[11px]">{typeMeta[a.type].label}</div>
                </div>
                <div
                  className={`shrink-0 font-mono text-sm font-bold tabular-nums ${(a.balanceCents ?? 0) >= 0 ? "text-brand" : "text-danger"}`}
                >
                  {formatBRL(a.balanceCents ?? 0)}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEdit(a)}
                    aria-label="Editar"
                    className="press text-muted hover:text-ink rounded-full p-1.5 hover:bg-white/5"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => remove(a)}
                    aria-label="Excluir"
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar conta" : "Nova conta"}>
        <div className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Nubank)" />
          <Select value={type} onChange={(e) => setType(e.target.value as Account["type"])}>
            <option value="cc">Conta corrente</option>
            <option value="poupanca">Poupança</option>
            <option value="dinheiro">Dinheiro</option>
          </Select>
          <div>
            <label className="text-muted mb-1 block text-xs">Saldo inicial</label>
            <CurrencyInput value={initial} onChange={setInitial} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
