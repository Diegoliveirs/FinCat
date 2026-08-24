"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type Category = { id: number; name: string; kind: "income" | "expense"; color: string; sortOrder: number };

const palette = ["#A3BFFF", "#FFEC7E", "#D38DFF", "#CFFF04", "#FC94A6"];

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [color, setColor] = useState(palette[0]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setRows(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = (k: "expense" | "income") => {
    setEditing(null);
    setName("");
    setKind(k);
    setColor(palette[0]);
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setKind(c.kind);
    setColor(c.color);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Nome obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), kind, color, sortOrder: editing?.sortOrder ?? 0 };
      const res = editing
        ? await fetch(`/api/categories/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        toast.error("Falha ao salvar categoria");
      } else {
        toast.success(editing ? "Categoria atualizada" : "Categoria criada");
        setOpen(false);
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Excluir a categoria ${c.name}?`)) return;
    const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Categoria removida");
      load();
    } else {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "Não foi possível remover a categoria");
    }
  };

  const list = (kind: "expense" | "income") => rows?.filter((r) => r.kind === kind) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted text-sm">Organize seus gastos e ganhos.</p>
        </div>
      </div>

      {rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <>
          {(["expense", "income"] as const).map((k) => (
            <div key={k}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-muted text-sm font-semibold">{k === "expense" ? "Despesas" : "Receitas"}</h2>
                <Button className="h-9 px-4 text-xs" onClick={() => openCreate(k)}>
                  <Plus className="size-3.5" /> Adicionar
                </Button>
              </div>
              {list(k).length === 0 ? (
                <EmptyState title={`Nenhuma categoria de ${k === "expense" ? "despesa" : "receita"}.`} />
              ) : (
                <div className="card-border rounded-card bg-surface overflow-hidden">
                  {list(k).map((c, i) => (
                    <div
                      key={c.id}
                      className="row-in flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0"
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <span className="size-3 shrink-0 rounded-full" style={{ background: c.color }} />
                      <div className="flex-1 text-sm font-medium">{c.name}</div>
                      <button
                        onClick={() => openEdit(c)}
                        aria-label="Editar"
                        className="press text-muted hover:text-ink rounded-full p-1.5 hover:bg-white/5"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        aria-label="Excluir"
                        className="press text-muted hover:bg-danger/15 hover:text-danger rounded-full p-1.5"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar categoria" : "Nova categoria"}>
        <div className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Lazer)" />
          <Select value={kind} onChange={(e) => setKind(e.target.value as "expense" | "income")}>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </Select>
          <div>
            <label className="text-muted mb-1 block text-xs">Cor</label>
            <div className="flex items-center gap-2">
              {palette.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`cor ${c}`}
                  className={`size-7 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-white/60" : "hover:scale-105"}`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent"
              />
            </div>
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
