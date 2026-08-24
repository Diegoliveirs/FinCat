import type { AgentId } from "@/lib/agents";
import type { ProposalInput } from "@/lib/validators";

export type ProposalKind = ProposalInput["kind"];
export type ProposalStatus = "pending" | "confirming" | "confirmed" | "cancelled" | "error";

export type ProposalEnvelope = ProposalInput & {
  id: string;
  agentId: AgentId;
  title: string;
  destructive: boolean;
  entityLabel: string;
  impact?: string;
};

export type ProposalChatItem = {
  id: string;
  role: "proposal";
  proposal: ProposalEnvelope;
  status: ProposalStatus;
  error?: string;
};

const destructiveKinds = new Set<ProposalKind>([
  "transaction_delete",
  "account_delete",
  "category_delete",
  "budget_delete",
  "goal_archive",
  "savings_delete",
]);

export function isDestructive(kind: ProposalKind) {
  return destructiveKinds.has(kind);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const acceptReplies = new Set([
  "sim",
  "confirmo",
  "pode confirmar",
  "pode criar",
  "pode criar essa meta",
  "pode registrar",
  "pode salvar",
  "salvar",
  "registrar",
  "ok pode",
]);
const cancelReplies = new Set(["nao", "cancelar", "cancela", "deixa pra la", "desistir"]);

export function classifyProposalReply(value: string): "confirm" | "cancel" | "none" {
  const normalized = normalize(value);
  if (acceptReplies.has(normalized)) return "confirm";
  if (cancelReplies.has(normalized)) return "cancel";
  return "none";
}

export function matchesDestructiveConfirmation(value: string, entityLabel: string) {
  const normalized = normalize(value);
  const label = normalize(entityLabel);
  return /^(excluir|apagar|remover|arquivar)\b/.test(normalized) && label.length > 0 && normalized.includes(label);
}

export function proposalStatusLabel(proposal: ProposalEnvelope, status: ProposalStatus) {
  if (status === "pending") return "Pendente";
  if (status === "confirming") return "Confirmando…";
  if (status === "cancelled") return "Cancelada";
  if (status === "error") return "Não concluída";
  if (proposal.kind === "goal_create") return "Meta criada";
  if (proposal.kind === "goal_update") return "Meta atualizada";
  if (proposal.kind === "goal_archive") return "Meta arquivada";
  if (proposal.kind.endsWith("_delete")) return "Excluído";
  if (proposal.kind.endsWith("_create") || proposal.kind === "savings_create") return "Registrado";
  return "Atualizada";
}

export function proposalSuccessMessage(proposal: ProposalEnvelope) {
  const label = proposal.entityLabel;
  switch (proposal.kind) {
    case "goal_create":
      return `Prrr… a meta **${label}** foi criada. Vou acompanhar seu progresso com você.`;
    case "savings_create":
      return `Prrr… registrei o valor guardado${label ? ` para **${label}**` : ""}. Seu progresso já foi atualizado.`;
    case "transaction_create":
      return `Miau. A movimentação **${label}** foi registrada.`;
    case "goal_archive":
      return `A meta **${label}** foi arquivada e o histórico foi preservado.`;
    default:
      return `Pronto. **${label}** foi ${proposalStatusLabel(proposal, "confirmed").toLocaleLowerCase("pt-BR")}.`;
  }
}

export function proposalRequest(proposal: ProposalEnvelope): {
  url: string;
  method: "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
} {
  const data = { ...proposal.data } as Record<string, unknown>;
  const takeId = (key: string) => {
    const value = data[key];
    delete data[key];
    return value;
  };
  switch (proposal.kind) {
    case "transaction_create":
      return { url: "/api/transactions", method: "POST", body: data };
    case "transaction_update":
      return { url: `/api/transactions/${takeId("transactionId")}`, method: "PATCH", body: data };
    case "reclassification":
      return { url: `/api/transactions/${takeId("transactionId")}`, method: "PATCH", body: data };
    case "transaction_delete":
      return { url: `/api/transactions/${takeId("transactionId")}`, method: "DELETE" };
    case "account_create":
      return { url: "/api/accounts", method: "POST", body: data };
    case "account_update":
      return { url: `/api/accounts/${takeId("accountId")}`, method: "PATCH", body: data };
    case "account_delete":
      return { url: `/api/accounts/${takeId("accountId")}?cascade=1`, method: "DELETE" };
    case "category_create":
      return { url: "/api/categories", method: "POST", body: data };
    case "category_update":
      return { url: `/api/categories/${takeId("categoryId")}`, method: "PATCH", body: data };
    case "category_delete":
      return { url: `/api/categories/${takeId("categoryId")}`, method: "DELETE" };
    case "budget_upsert":
      return { url: "/api/budgets", method: "POST", body: data };
    case "budget_delete":
      return { url: `/api/budgets/${takeId("budgetId")}`, method: "DELETE" };
    case "profile_update":
      return { url: "/api/financial-profile", method: "PATCH", body: data };
    case "goal_create":
      return { url: "/api/goals", method: "POST", body: data };
    case "goal_update":
      return { url: `/api/goals/${takeId("goalId")}`, method: "PATCH", body: data };
    case "goal_archive":
      return { url: `/api/goals/${takeId("goalId")}`, method: "DELETE" };
    case "savings_create":
      return { url: "/api/savings", method: "POST", body: data };
    case "savings_delete":
      return { url: `/api/savings/${takeId("savingsId")}`, method: "DELETE" };
  }
}
