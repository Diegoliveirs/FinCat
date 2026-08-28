"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
type Row = {
  id: string;
  name: string;
  username?: string | null;
  role?: string | null;
  banned?: boolean | null;
  createdAt: Date;
};
export function UsersAdmin({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    const result = await authClient.admin.listUsers({
      query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
    });
    if (result.data) setUsers(result.data.users as Row[]);
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);
  async function action(id: string, kind: "ban" | "unban" | "revoke" | "reset" | "delete") {
    if (id === currentUserId) return toast.error("Você não pode alterar sua própria conta aqui.");
    if (kind === "delete" && !confirm("Excluir este usuário e todos os dados financeiros dele?")) return;
    if (kind === "reset") {
      const result = await fetch(`/api/admin/users/${id}/temporary-password`, { method: "POST" });
      const body = await result.json();
      if (!result.ok) return toast.error(body.error ?? "Falha ao redefinir senha");
      await navigator.clipboard.writeText(body.temporaryPassword).catch(() => undefined);
      toast.success(`Senha temporária: ${body.temporaryPassword} (copiada)`);
      return;
    }
    const api = authClient.admin;
    const result =
      kind === "ban"
        ? await api.banUser({ userId: id, banReason: "Acesso bloqueado pelo dono" })
        : kind === "unban"
          ? await api.unbanUser({ userId: id })
          : kind === "revoke"
            ? await api.revokeUserSessions({ userId: id })
            : await api.removeUser({ userId: id });
    if (result.error) toast.error("A operação não pôde ser concluída.");
    else {
      toast.success("Acesso atualizado.");
      await load();
    }
  }
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Papel</th>
            <th>Estado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4}>Carregando…</td>
            </tr>
          ) : (
            users.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <span>@{item.username}</span>
                </td>
                <td>{item.role}</td>
                <td>{item.banned ? "Bloqueado" : "Ativo"}</td>
                <td>
                  <div className="admin-actions">
                    {item.banned ? (
                      <button onClick={() => action(item.id, "unban")}>Desbloquear</button>
                    ) : (
                      <button onClick={() => action(item.id, "ban")}>Bloquear</button>
                    )}
                    <button onClick={() => action(item.id, "reset")}>Senha temporária</button>
                    <button onClick={() => action(item.id, "revoke")}>Revogar sessões</button>
                    <button className="danger" onClick={() => action(item.id, "delete")}>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
