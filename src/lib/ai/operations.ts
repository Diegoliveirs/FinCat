import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, like, sql } from "drizzle-orm";
import db from "@/lib/db";
import {
  accounts,
  budgets,
  categories,
  financialGoals,
  financialProfile,
  savingsEntries,
  transactions,
} from "@/lib/db/schema";
import { getGoalSummaries, getSavingsOverview } from "@/lib/goal-service";
import { getOverview } from "@/lib/stats";
import { agents, type AgentId } from "@/lib/agents";
import { proposalSchema, type ProposalInput } from "@/lib/validators";
import { isDestructive, type ProposalEnvelope } from "@/lib/ai/proposals";

type BuildResult = { proposal: ProposalEnvelope } | { error: string };

async function recordFor(kind: ProposalInput["kind"], data: Record<string, unknown>, userId: string) {
  if (kind === "transaction_update" || kind === "transaction_delete" || kind === "reclassification") {
    const [record] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, Number(data.transactionId)), eq(transactions.userId, userId)))
      .limit(1);
    return record ?? null;
  }
  if (kind === "account_update" || kind === "account_delete") {
    const [record] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, Number(data.accountId)), eq(accounts.userId, userId)))
      .limit(1);
    return record ?? null;
  }
  if (kind === "category_update" || kind === "category_delete") {
    const [record] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, Number(data.categoryId)), eq(categories.userId, userId)))
      .limit(1);
    return record ?? null;
  }
  if (kind === "budget_delete") {
    const [record] = await db
      .select({ id: budgets.id, name: categories.name })
      .from(budgets)
      .innerJoin(categories, and(eq(categories.id, budgets.categoryId), eq(categories.userId, userId)))
      .where(and(eq(budgets.id, Number(data.budgetId)), eq(budgets.userId, userId)))
      .limit(1);
    return record ?? null;
  }
  if (kind === "goal_update" || kind === "goal_archive") {
    const [record] = await db
      .select()
      .from(financialGoals)
      .where(and(eq(financialGoals.id, Number(data.goalId)), eq(financialGoals.userId, userId)))
      .limit(1);
    return record ?? null;
  }
  if (kind === "savings_delete") {
    const [record] = await db
      .select()
      .from(savingsEntries)
      .where(and(eq(savingsEntries.id, Number(data.savingsId)), eq(savingsEntries.userId, userId)))
      .limit(1);
    return record ?? null;
  }
  return null;
}

function titleFor(kind: ProposalInput["kind"]) {
  return (
    {
      transaction_create: "Registrar movimentação",
      transaction_update: "Alterar movimentação",
      transaction_delete: "Excluir movimentação",
      reclassification: "Reclassificar movimentação",
      account_create: "Criar conta",
      account_update: "Alterar conta",
      account_delete: "Excluir conta",
      category_create: "Criar categoria",
      category_update: "Alterar categoria",
      category_delete: "Excluir categoria",
      budget_upsert: "Salvar orçamento",
      budget_delete: "Excluir orçamento",
      profile_update: "Atualizar perfil financeiro",
      goal_create: "Criar meta",
      goal_update: "Alterar meta",
      goal_archive: "Arquivar meta",
      savings_create: "Registrar economia",
      savings_delete: "Excluir economia",
    } satisfies Record<ProposalInput["kind"], string>
  )[kind];
}

export async function buildProposal(
  toolName: string,
  args: unknown,
  agentId: AgentId,
  userId: string,
): Promise<BuildResult> {
  const value = (args && typeof args === "object" ? args : {}) as Record<string, unknown>;
  const action = String(value.action ?? "");
  let candidate: unknown;
  if (toolName === "propose_transaction_operation")
    candidate = {
      kind:
        action === "create"
          ? "transaction_create"
          : action === "delete"
            ? "transaction_delete"
            : action === "reclassify"
              ? "reclassification"
              : "transaction_update",
      data: { ...value, action: undefined },
    };
  if (toolName === "propose_account")
    candidate = { kind: `account_${action}`, data: { ...value, action: undefined, type: value.accountType } };
  if (toolName === "propose_category")
    candidate = { kind: `category_${action}`, data: { ...value, action: undefined } };
  if (toolName === "propose_budget")
    candidate = {
      kind: action === "delete" ? "budget_delete" : "budget_upsert",
      data: { ...value, action: undefined },
    };
  if (toolName === "propose_profile") candidate = { kind: "profile_update", data: value };
  if (toolName === "propose_goal_operation")
    candidate = {
      kind: action === "archive" ? "goal_archive" : `goal_${action}`,
      data: { ...value, action: undefined },
    };
  if (toolName === "propose_savings_operation")
    candidate = {
      kind: action === "delete" ? "savings_delete" : "savings_create",
      data: { ...value, action: undefined },
    };
  const parsed = proposalSchema.safeParse(candidate);
  if (!parsed.success)
    return { error: "A proposta está incompleta. Informe os campos necessários antes de confirmar." };
  const proposal = parsed.data;
  const data = proposal.data as Record<string, unknown>;
  const existing = (await recordFor(proposal.kind, data, userId)) as Record<string, unknown> | null | undefined;
  let relatedLabel: string | undefined;
  let impact: string | undefined;
  if (
    (proposal.kind.endsWith("_update") ||
      proposal.kind.endsWith("_delete") ||
      proposal.kind === "reclassification" ||
      proposal.kind === "goal_archive") &&
    !existing
  )
    return { error: "Não encontrei o registro citado. Confira o nome ou identificador." };

  if (
    proposal.kind === "transaction_create" ||
    proposal.kind === "transaction_update" ||
    proposal.kind === "reclassification"
  ) {
    const categoryId = Number(data.categoryId ?? existing?.categoryId);
    const accountId = Number(data.accountId ?? existing?.accountId);
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
      .limit(1);
    const type = String(data.type ?? existing?.type ?? "");
    if (!category) return { error: "A categoria informada não existe." };
    if (proposal.kind !== "reclassification" && !account) return { error: "A conta informada não existe." };
    if (type && category.kind !== type) return { error: "A categoria não corresponde ao tipo da movimentação." };
    relatedLabel = String(
      data.description ?? existing?.description ?? `${type === "income" ? "Receita" : "Despesa"} em ${category.name}`,
    );
  }
  if (proposal.kind === "account_delete") {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(transactions)
      .where(and(eq(transactions.accountId, Number(data.accountId)), eq(transactions.userId, userId)));
    const count = countRow?.count ?? 0;
    data.impactCount = count;
    impact = `${count} movimentação(ões) também serão excluídas.`;
  }
  if (proposal.kind === "category_delete") {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(transactions)
      .where(and(eq(transactions.categoryId, Number(data.categoryId)), eq(transactions.userId, userId)));
    const count = countRow?.count ?? 0;
    if (count > 0)
      return { error: `Essa categoria ainda está em ${count} movimentação(ões). Reclassifique-as antes de excluir.` };
    const [budgetCountRow] = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(budgets)
      .where(and(eq(budgets.categoryId, Number(data.categoryId)), eq(budgets.userId, userId)));
    const budgetCount = budgetCountRow?.count ?? 0;
    impact =
      budgetCount > 0
        ? `${budgetCount} orçamento(s) vinculado(s) também serão excluídos.`
        : "Nenhuma movimentação será afetada.";
  }

  if (proposal.kind === "budget_upsert") {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, Number(data.categoryId)), eq(categories.userId, userId)))
      .limit(1);
    if (!category || category.kind !== "expense") return { error: "Escolha uma categoria de despesa existente." };
    relatedLabel = `${category.name} · ${String(data.month)}`;
  }
  if (proposal.kind === "savings_create" && data.goalId) {
    const [goal] = await db
      .select()
      .from(financialGoals)
      .where(and(eq(financialGoals.id, Number(data.goalId)), eq(financialGoals.userId, userId)))
      .limit(1);
    if (!goal) return { error: "A meta informada não existe." };
    relatedLabel = goal.name;
  }

  const entityLabel = String(
    relatedLabel ??
      data.name ??
      existing?.name ??
      existing?.description ??
      (proposal.kind === "profile_update"
        ? "perfil financeiro"
        : proposal.kind === "savings_create"
          ? "economias gerais"
          : titleFor(proposal.kind)),
  );
  return {
    proposal: {
      ...proposal,
      id: randomUUID(),
      agentId,
      title: titleFor(proposal.kind),
      destructive: isDestructive(proposal.kind),
      entityLabel,
      impact,
    },
  };
}

export async function queryFinances(args: unknown, userId: string) {
  const value = (args && typeof args === "object" ? args : {}) as Record<string, unknown>;
  const domain = String(value.domain ?? "overview");
  const limit = Math.min(50, Math.max(1, Number(value.limit ?? 20)));
  if (domain === "overview") return getOverview(userId);
  if (domain === "accounts") return await db.select().from(accounts).where(eq(accounts.userId, userId)).limit(limit);
  if (domain === "categories")
    return await db.select().from(categories).where(eq(categories.userId, userId)).limit(limit);
  if (domain === "profile") {
    const [profile] = await db.select().from(financialProfile).where(eq(financialProfile.userId, userId)).limit(1);
    return profile ?? null;
  }
  if (domain === "goals") return (await getGoalSummaries(userId, true)).slice(0, limit);
  if (domain === "savings") {
    const data = await getSavingsOverview(userId);
    return { ...data, entries: data.entries.slice(0, limit) };
  }
  if (domain === "budgets") {
    const month = typeof value.month === "string" ? value.month : undefined;
    return await db
      .select({ id: budgets.id, month: budgets.month, limitCents: budgets.limitCents, category: categories.name })
      .from(budgets)
      .innerJoin(categories, and(eq(categories.id, budgets.categoryId), eq(categories.userId, userId)))
      .where(month ? and(eq(budgets.userId, userId), eq(budgets.month, month)) : eq(budgets.userId, userId))
      .limit(limit);
  }
  const conditions = [eq(transactions.userId, userId)];
  if (typeof value.month === "string") conditions.push(like(transactions.date, `${value.month}%`));
  if (value.type === "income" || value.type === "expense") conditions.push(eq(transactions.type, value.type));
  if (typeof value.search === "string" && value.search.trim())
    conditions.push(like(transactions.description, `%${value.search.trim()}%`));
  return await db
    .select({
      id: transactions.id,
      date: transactions.date,
      type: transactions.type,
      amountCents: transactions.amountCents,
      description: transactions.description,
      account: accounts.name,
      category: categories.name,
    })
    .from(transactions)
    .innerJoin(accounts, and(eq(accounts.id, transactions.accountId), eq(accounts.userId, userId)))
    .innerJoin(categories, and(eq(categories.id, transactions.categoryId), eq(categories.userId, userId)))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date))
    .limit(limit);
}

export function proposalAgentName(agentId: AgentId) {
  return agents[agentId].name;
}
