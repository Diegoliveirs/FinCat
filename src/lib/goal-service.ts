import db from "@/lib/db";
import { financialGoals, savingsEntries } from "@/lib/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { format } from "date-fns";
import { calculateGoalProgress } from "@/lib/goals";
import type { z } from "zod";
import type { financialGoalCreateSchema, financialGoalUpdateSchema, savingsEntrySchema } from "@/lib/validators";

type GoalCreate = z.infer<typeof financialGoalCreateSchema>;
type GoalUpdate = z.infer<typeof financialGoalUpdateSchema>;
type SavingsCreate = z.infer<typeof savingsEntrySchema>;

export async function getGoalSummaries(userId: string, includeArchived = false) {
  const month = format(new Date(), "yyyy-MM");
  const [rows, totals, monthTotals] = await Promise.all([
    db
      .select()
      .from(financialGoals)
      .where(
        includeArchived
          ? eq(financialGoals.userId, userId)
          : and(eq(financialGoals.userId, userId), ne(financialGoals.status, "archived")),
      )
      .orderBy(financialGoals.targetDate),
    db
      .select({ goalId: savingsEntries.goalId, total: sql<number>`COALESCE(SUM(${savingsEntries.amountCents}), 0)` })
      .from(savingsEntries)
      .where(and(eq(savingsEntries.userId, userId), sql`${savingsEntries.goalId} IS NOT NULL`))
      .groupBy(savingsEntries.goalId),
    db
      .select({ goalId: savingsEntries.goalId, total: sql<number>`COALESCE(SUM(${savingsEntries.amountCents}), 0)` })
      .from(savingsEntries)
      .where(
        and(
          eq(savingsEntries.userId, userId),
          sql`${savingsEntries.goalId} IS NOT NULL AND substring(${savingsEntries.savedAt}, 1, 7) = ${month}`,
        ),
      )
      .groupBy(savingsEntries.goalId),
  ]);
  const totalByGoal = new Map(totals.map((r) => [r.goalId, Number(r.total)]));
  const monthByGoal = new Map(monthTotals.map((r) => [r.goalId, Number(r.total)]));
  return rows.map((goal) => {
    const savedCents = totalByGoal.get(goal.id) ?? 0;
    return {
      ...goal,
      savedCents,
      progress: calculateGoalProgress({ ...goal, savedCents, savedThisMonthCents: monthByGoal.get(goal.id) ?? 0 }),
    };
  });
}

export async function getGoalSummary(userId: string, id: number) {
  return (await getGoalSummaries(userId, true)).find((g) => g.id === id);
}

export async function getSavingsOverview(userId: string, goalId?: number) {
  const where =
    goalId == null
      ? eq(savingsEntries.userId, userId)
      : and(eq(savingsEntries.userId, userId), eq(savingsEntries.goalId, goalId));
  const [entries, linkedRows, unallocatedRows] = await Promise.all([
    db.select().from(savingsEntries).where(where).orderBy(desc(savingsEntries.savedAt), desc(savingsEntries.id)),
    db
      .select({ total: sql<number>`COALESCE(SUM(${savingsEntries.amountCents}), 0)` })
      .from(savingsEntries)
      .where(and(eq(savingsEntries.userId, userId), sql`${savingsEntries.goalId} IS NOT NULL`)),
    db
      .select({ total: sql<number>`COALESCE(SUM(${savingsEntries.amountCents}), 0)` })
      .from(savingsEntries)
      .where(and(eq(savingsEntries.userId, userId), sql`${savingsEntries.goalId} IS NULL`)),
  ]);
  const total = entries.reduce((sum, entry) => sum + entry.amountCents, 0);
  const linked = Number(linkedRows[0]?.total ?? 0);
  const unallocated = Number(unallocatedRows[0]?.total ?? 0);
  return {
    entries,
    totalSavedCents: total,
    linkedSavedCents: linked,
    generalSavedCents: unallocated,
    unallocatedCents: unallocated,
  };
}

export async function createGoal(userId: string, input: GoalCreate) {
  return db.transaction(async (tx) => {
    const now = Date.now();
    const [goal] = await tx
      .insert(financialGoals)
      .values({
        userId,
        name: input.name,
        targetAmountCents: input.targetAmountCents,
        targetDate: input.targetDate,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: financialGoals.id });
    if (!goal) throw new Error("Não foi possível criar a meta");
    if (input.initialAmountCents && input.initialAmountCents > 0)
      await tx.insert(savingsEntries).values({
        userId,
        goalId: goal.id,
        amountCents: input.initialAmountCents,
        savedAt: format(new Date(), "yyyy-MM-dd"),
        description: "Valor inicial",
        createdAt: now,
      });
    return goal.id;
  });
}

export async function updateGoal(userId: string, id: number, input: GoalUpdate) {
  const rows = await db
    .update(financialGoals)
    .set({ ...input, updatedAt: Date.now() })
    .where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId)))
    .returning({ id: financialGoals.id });
  return rows[0] ? getGoalSummary(userId, id) : undefined;
}
export async function archiveGoal(userId: string, id: number) {
  const rows = await db
    .update(financialGoals)
    .set({ status: "archived", updatedAt: Date.now() })
    .where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId)))
    .returning({ id: financialGoals.id });
  return rows.length > 0;
}

export async function addSavingsEntry(userId: string, input: SavingsCreate) {
  return db.transaction(async (tx) => {
    if (input.goalId != null) {
      const goals = await tx
        .select({ id: financialGoals.id })
        .from(financialGoals)
        .where(
          and(
            eq(financialGoals.id, input.goalId),
            eq(financialGoals.userId, userId),
            ne(financialGoals.status, "archived"),
          ),
        )
        .limit(1);
      if (!goals[0]) throw new Error("Meta não encontrada");
    }
    const [entry] = await tx
      .insert(savingsEntries)
      .values({
        userId,
        goalId: input.goalId ?? null,
        amountCents: input.amountCents,
        savedAt: input.savedAt,
        description: input.description,
        createdAt: Date.now(),
      })
      .returning({ id: savingsEntries.id });
    if (!entry) throw new Error("Não foi possível registrar a economia");
    return entry.id;
  });
}
export async function deleteSavingsEntry(userId: string, id: number) {
  const rows = await db
    .delete(savingsEntries)
    .where(and(eq(savingsEntries.id, id), eq(savingsEntries.userId, userId)))
    .returning({ id: savingsEntries.id });
  return rows.length > 0;
}
