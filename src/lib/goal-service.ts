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

export function getGoalSummaries(userId: string, includeArchived = false) {
  const month = format(new Date(), "yyyy-MM");
  const rows = db.select().from(financialGoals)
    .where(includeArchived ? eq(financialGoals.userId, userId) : and(eq(financialGoals.userId, userId), ne(financialGoals.status, "archived")))
    .orderBy(financialGoals.targetDate).all();
  const totals = db.select({ goalId: savingsEntries.goalId, total: sql<number>`SUM(${savingsEntries.amountCents})` }).from(savingsEntries)
    .where(and(eq(savingsEntries.userId, userId), sql`${savingsEntries.goalId} IS NOT NULL`)).groupBy(savingsEntries.goalId).all();
  const monthTotals = db.select({ goalId: savingsEntries.goalId, total: sql<number>`SUM(${savingsEntries.amountCents})` }).from(savingsEntries)
    .where(and(eq(savingsEntries.userId, userId), sql`${savingsEntries.goalId} IS NOT NULL AND substr(${savingsEntries.savedAt}, 1, 7) = ${month}`)).groupBy(savingsEntries.goalId).all();
  const totalByGoal = new Map(totals.map((r) => [r.goalId, Number(r.total)]));
  const monthByGoal = new Map(monthTotals.map((r) => [r.goalId, Number(r.total)]));
  return rows.map((goal) => { const savedCents = totalByGoal.get(goal.id) ?? 0; return { ...goal, savedCents, progress: calculateGoalProgress({ ...goal, savedCents, savedThisMonthCents: monthByGoal.get(goal.id) ?? 0 }) }; });
}

export function getGoalSummary(userId: string, id: number) { return getGoalSummaries(userId, true).find((g) => g.id === id); }

export function getSavingsOverview(userId: string, goalId?: number) {
  const where = goalId == null ? eq(savingsEntries.userId, userId) : and(eq(savingsEntries.userId, userId), eq(savingsEntries.goalId, goalId));
  const entries = db.select().from(savingsEntries).where(where).orderBy(desc(savingsEntries.savedAt), desc(savingsEntries.id)).all();
  const total = entries.reduce((sum, e) => sum + e.amountCents, 0);
  const linked = db.select({ total: sql<number>`COALESCE(SUM(${savingsEntries.amountCents}), 0)` }).from(savingsEntries).where(and(eq(savingsEntries.userId, userId), sql`${savingsEntries.goalId} IS NOT NULL`)).get()?.total ?? 0;
  const unallocated = db.select({ total: sql<number>`COALESCE(SUM(${savingsEntries.amountCents}), 0)` }).from(savingsEntries).where(and(eq(savingsEntries.userId, userId), sql`${savingsEntries.goalId} IS NULL`)).get()?.total ?? 0;
  return { entries, totalSavedCents: total, linkedSavedCents: Number(linked), generalSavedCents: Number(unallocated), unallocatedCents: Number(unallocated) };
}

export function createGoal(userId: string, input: GoalCreate) {
  return db.transaction((tx) => {
    const now = Date.now();
    const result = tx.insert(financialGoals).values({ userId, name: input.name, targetAmountCents: input.targetAmountCents, targetDate: input.targetDate, createdAt: now, updatedAt: now }).run();
    const id = Number(result.lastInsertRowid);
    if (input.initialAmountCents && input.initialAmountCents > 0) tx.insert(savingsEntries).values({ userId, goalId: id, amountCents: input.initialAmountCents, savedAt: format(new Date(), "yyyy-MM-dd"), description: "Valor inicial", createdAt: now }).run();
    return id;
  });
}

export function updateGoal(userId: string, id: number, input: GoalUpdate) {
  const row = db.update(financialGoals).set({ ...input, updatedAt: Date.now() }).where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId))).returning().get();
  return row ? getGoalSummary(userId, id) : undefined;
}
export function archiveGoal(userId: string, id: number) { return db.update(financialGoals).set({ status: "archived", updatedAt: Date.now() }).where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId))).run().changes > 0; }

export function addSavingsEntry(userId: string, input: SavingsCreate) {
  return db.transaction((tx) => {
    if (input.goalId != null && !tx.select().from(financialGoals).where(and(eq(financialGoals.id, input.goalId), eq(financialGoals.userId, userId), ne(financialGoals.status, "archived"))).get()) throw new Error("Meta não encontrada");
    const result = tx.insert(savingsEntries).values({ userId, goalId: input.goalId ?? null, amountCents: input.amountCents, savedAt: input.savedAt, description: input.description, createdAt: Date.now() }).run();
    return Number(result.lastInsertRowid);
  });
}
export function deleteSavingsEntry(userId: string, id: number) { return db.delete(savingsEntries).where(and(eq(savingsEntries.id, id), eq(savingsEntries.userId, userId))).run().changes > 0; }
