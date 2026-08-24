"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBRL } from "@/lib/money";
import { format, parseISO } from "date-fns";

type Tx = {
  id: number;
  accountId: number;
  categoryId: number;
  type: "income" | "expense";
  amountCents: number;
  description: string;
  date: string;
  accountName: string;
  categoryName: string;
  categoryColor: string;
};

type Account = { id: number; name: string; type: string; initialBalanceCents: number };
type Category = { id: number; name: string; kind: "income" | "expense"; color: string };

const emptyForm = {
  accountId: "",
  categoryId: "",
  type: "expense" as "income" | "expense",
  amountCents: 0,
  description: "",
  date: format(new Date(), "yyyy-MM-dd"),
};

export default function TransactionsPage() {
  const [rows, setRows] = useState<Tx[] | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [accountFilter, setAccountFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ month });
    if (accountFilter) params.set("accountId", accountFilter);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) setRows(await res.json());
  }, [month, accountFilter, categoryFilter]);

  useEffect(() => {
    (async () => {
      const [acc, cat] = await Promise.all([
        fetch("/api/accounts").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
      ]);
      setAccounts(acc);
      setCategories(cat);
    })();
  }, []);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, accountId: accounts[0] ? String(accounts[0].id) : "", type: "expense" });
    setOpen(true);
  };

  const openEdit = (tx: Tx) => {
    setEditing(tx);
    setForm({
      accountId: String(tx.accountId),
      categoryId: String(tx.categoryId),
      type: tx.type,
      amountCents: tx.amountCents,
      description: tx.description,
      date: tx.date,
    });
    setOpen(true);
  };

  const save = async () => {
    if (form.amountCents <= 0) {
      toast.error("Valor precisa ser maior que zero");
      return;
    }
    if (!form.accountId || !form.categoryId) {
      toast.error("Conta e categoria obrigatórias");
      return;
    }
    setSaving(true);
    const payload = {
      accountId: Number(form.accountId),
      categoryId: Number(form.categoryId),
      type: form.type,
      amountCents: form.amountCents,
      description: form.description,
      date: form.date,
    };
    try {
      const res = editing
        ? await fetch(`/api/transactions/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error ? JSON.stringify(err.error) : "Falha ao salvar");
      } else {
        toast.success(editing ? "Transação atualizada" : "Transação cadastrada");
        setOpen(false);
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (tx: Tx) => {
    await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
    toast("Transação removida");
    load();
  };

  const cats = categories.filter((c) => c.kind === form.type);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted text-sm">Tudo que entrou e saiu.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Nova
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
        <Select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="w-44">
          <option value="">Todas as contas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-44">
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nenhuma transação no filtro atual."
          action={
            <Button onClick={openCreate} variant="outline">
              Cadastrar primeira
            </Button>
          }
        />
      ) : (
        <div className="card-border rounded-card bg-surface overflow-hidden">
          {rows.map((tx, i) => (
            <div
              key={tx.id}
              className="row-in flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <div className="text-muted w-20 shrink-0 font-mono text-[11px]">{format(parseISO(tx.date), "dd/MM")}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{tx.description || "Sem descrição"}</div>
                <div className="text-muted text-[11px]">
                  <span style={{ color: tx.categoryColor }}>{tx.categoryName}</span> · {tx.accountName}
                </div>
              </div>
              <div
                className={`shrink-0 font-mono text-sm font-bold tabular-nums ${tx.type === "income" ? "text-brand" : "text-danger"}`}
              >
                {tx.type === "income" ? "+" : "-"}
                {formatBRL(tx.amountCents)}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => openEdit(tx)}
                  aria-label="Editar"
                  className="press text-muted hover:text-ink rounded-full p-1.5 hover:bg-white/5"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => remove(tx)}
                  aria-label="Excluir"
                  className="press text-muted hover:bg-danger/15 hover:text-danger rounded-full p-1.5"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar transação" : "Nova transação"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense", categoryId: "" })}
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </Select>
            <Select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
              <option value="">Conta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Categoria</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <CurrencyInput value={form.amountCents} onChange={(cents) => setForm({ ...form, amountCents: cents })} />
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição (ex: mercado da semana)"
          />
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
