import { differenceInCalendarMonths, format, isBefore, parseISO } from "date-fns";

export type GoalStatus = "active" | "completed" | "archived";
export type GoalProgressInput = {
  targetAmountCents: number;
  targetDate: string;
  savedCents: number;
  savedThisMonthCents?: number;
  status: GoalStatus;
};

export function calculateGoalProgress(input: GoalProgressInput, now = new Date()) {
  const remainingCents = Math.max(0, input.targetAmountCents - input.savedCents);
  const monthsRemaining = Math.max(1, differenceInCalendarMonths(parseISO(input.targetDate), now));
  const monthlyRecommendedCents = remainingCents > 0 ? Math.ceil(remainingCents / monthsRemaining) : 0;
  const percentage =
    input.targetAmountCents > 0 ? Math.min(100, (input.savedCents / input.targetAmountCents) * 100) : 0;
  const completed = input.status === "completed" || remainingCents === 0;
  const overdue = !completed && isBefore(parseISO(input.targetDate), new Date(format(now, "yyyy-MM-dd")));
  return {
    savedCents: input.savedCents,
    remainingCents,
    percentage,
    monthsRemaining,
    monthlyRecommendedCents,
    reviewPending: !completed && (input.savedThisMonthCents ?? 0) === 0,
    state: completed
      ? "completed"
      : overdue
        ? "overdue"
        : (input.savedThisMonthCents ?? 0) > 0
          ? "on_track"
          : "needs_contribution",
  } as const;
}
