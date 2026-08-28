import db from "@/lib/db";
import { accounts, transactions, categories, budgets } from "@/lib/db/schema";
import { sql, desc, and, eq } from "drizzle-orm";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { budgetPressure, estimatedRunway, projectedExpense, savingsRate } from "@/lib/finance";

export type CategoryTotal = {
  categoryId: number;
  name: string;
  color: string;
  kind: "income" | "expense";
  totalCents: number;
};

export type BudgetProgress = {
  categoryId: number;
  name: string;
  color: string;
  limitCents: number;
  spentCents: number;
  percent: number;
  over: boolean;
};

export type EvolutionPoint = {
  month: string;
  income: number;
  expense: number;
};

export type Overview = {
  totalBalanceCents: number;
  monthIncomeCents: number;
  monthExpenseCents: number;
  monthNetCents: number;
  byCategory: CategoryTotal[];
  evolution: EvolutionPoint[];
  budgets: BudgetProgress[];
  kpis: {
    savingsRatePercent: number | null;
    projectedExpenseCents: number | null;
    budgetPressurePercent: number | null;
    budgetsAbove80Count: number;
    estimatedRunwayMonths: number | null;
  };
  diagnosis: { tone: "positive" | "warning" | "danger" | "neutral"; title: string; detail: string; action: string };
};

export async function getOverview(userId: string, month = format(new Date(), "yyyy-MM")): Promise<Overview> {
  const [y, m] = month.split("-").map(Number);
  const start = format(new Date(y, m - 1, 1), "yyyy-MM-dd");
  const end = format(new Date(y, m, 0), "yyyy-MM-dd");

  const [initialRow = { initial: 0 }] = await db
    .select({ initial: sql<number>`COALESCE(SUM(${accounts.initialBalanceCents}), 0)` })
    .from(accounts)
    .where(eq(accounts.userId, userId));

  const [incomeExpenseRow = { income: 0, expense: 0 }] = await db
    .select({
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amountCents} ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amountCents} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId));

  const [monthRow = { income: 0, expense: 0 }] = await db
    .select({
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amountCents} ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amountCents} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), sql`${transactions.date} >= ${start} AND ${transactions.date} <= ${end}`),
    );

  const byCategory: CategoryTotal[] = await db
    .select({
      categoryId: categories.id,
      name: categories.name,
      color: categories.color,
      kind: categories.kind,
      totalCents: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
    })
    .from(transactions)
    .innerJoin(categories, and(eq(categories.id, transactions.categoryId), eq(categories.userId, userId)))
    .where(
      and(eq(transactions.userId, userId), sql`${transactions.date} >= ${start} AND ${transactions.date} <= ${end}`),
    )
    .groupBy(categories.id)
    .orderBy(desc(sql`SUM(${transactions.amountCents})`));

  const evolution: EvolutionPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(y, m - 1, 1), i);
    const mm = format(d, "yyyy-MM");
    const s = format(d, "yyyy-MM-dd");
    const e = format(new Date(d.getFullYear(), d.getMonth() + 1, 0), "yyyy-MM-dd");
    const [row = { income: 0, expense: 0 }] = await db
      .select({
        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amountCents} ELSE 0 END), 0)`,
        expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amountCents} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), sql`${transactions.date} >= ${s} AND ${transactions.date} <= ${e}`));
    evolution.push({ month: format(d, "MMM/yy"), income: row.income, expense: row.expense });
  }

  const budgetRows = await db
    .select({
      categoryId: budgets.categoryId,
      name: categories.name,
      color: categories.color,
      limitCents: budgets.limitCents,
      spentCents: sql<number>`COALESCE((
        SELECT SUM(${transactions.amountCents}) FROM ${transactions}
        WHERE ${transactions.categoryId} = ${budgets.categoryId}
          AND ${transactions.type} = 'expense'
          AND ${transactions.date} >= ${start} AND ${transactions.date} <= ${end}
      ), 0)`,
    })
    .from(budgets)
    .innerJoin(categories, and(eq(categories.id, budgets.categoryId), eq(categories.userId, userId)))
    .where(and(eq(budgets.userId, userId), sql`${budgets.month} = ${month}`));

  const budgetProgress: BudgetProgress[] = budgetRows.map((b) => {
    const percent = b.limitCents > 0 ? (b.spentCents / b.limitCents) * 100 : 0;
    return {
      categoryId: b.categoryId,
      name: b.name,
      color: b.color,
      limitCents: b.limitCents,
      spentCents: b.spentCents,
      percent: Math.round(percent),
      over: b.spentCents > b.limitCents,
    };
  });

  const totalBalanceCents = initialRow.initial + incomeExpenseRow.income - incomeExpenseRow.expense;
  const monthIncomeCents = monthRow.income;
  const monthExpenseCents = monthRow.expense;

  const now = new Date();
  const pressure = budgetPressure(budgetProgress);
  const recentExpenses = evolution
    .slice(-3)
    .map((point) => point.expense)
    .filter((value) => value > 0);
  const kpis = {
    savingsRatePercent: savingsRate(monthIncomeCents, monthIncomeCents - monthExpenseCents),
    projectedExpenseCents: projectedExpense(
      monthExpenseCents,
      now.getDate(),
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    ),
    budgetPressurePercent: pressure.percent,
    budgetsAbove80Count: pressure.above80Count,
    estimatedRunwayMonths: estimatedRunway(totalBalanceCents, recentExpenses),
  };
  const diagnosis =
    totalBalanceCents < 0
      ? {
          tone: "danger" as const,
          title: "Seu caixa está no vermelho",
          detail: "O saldo total já não cobre os compromissos registrados.",
          action: "Revise os maiores gastos e adie novas compras.",
        }
      : monthIncomeCents === 0
        ? {
            tone: "neutral" as const,
            title: "Falta registrar sua receita",
            detail: "Sem entrada no mês, as projeções perdem precisão.",
            action: "Registre a renda para liberar a taxa de economia.",
          }
        : pressure.above80Count > 0
          ? {
              tone: "warning" as const,
              title: `${pressure.above80Count} orçamento${pressure.above80Count > 1 ? "s" : ""} pede atenção`,
              detail: "Uma ou mais categorias já consumiram 80% do limite.",
              action: "Abra os orçamentos e ajuste o restante do mês.",
            }
          : {
              tone: "positive" as const,
              title: "O mês está sob controle",
              detail: "Receitas, gastos e limites registrados não indicam pressão imediata.",
              action: "Mantenha o ritmo e revise a projeção semanalmente.",
            };

  return {
    totalBalanceCents,
    monthIncomeCents,
    monthExpenseCents,
    monthNetCents: monthIncomeCents - monthExpenseCents,
    byCategory,
    evolution,
    budgets: budgetProgress,
    kpis,
    diagnosis,
  };
}
