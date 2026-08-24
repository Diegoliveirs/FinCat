export type PurchaseInput = {
  cashPriceCents: number;
  downPaymentCents: number;
  installmentCount: number;
  installmentCents: number;
  financedTotalCents?: number | null;
  recurringMonthlyCostCents?: number;
  monthlyIncomeCents?: number | null;
  currentMonthlyInstallmentsCents?: number;
  currentBalanceCents: number;
  desiredReserveCents: number;
  currentMonthlySurplusCents: number;
  categoryRemainingCents?: number | null;
  historyMonths: number;
  incomeStability?: "stable" | "variable" | "unknown";
  maxCommitmentPercent?: number;
};

export function savingsRate(income: number, net: number): number | null {
  return income > 0 ? (net / income) * 100 : null;
}

export function projectedExpense(spent: number, elapsedDays: number, daysInMonth: number): number | null {
  return elapsedDays > 0 && spent > 0 ? Math.round((spent / elapsedDays) * daysInMonth) : null;
}

export function budgetPressure(budgets: Array<{ limitCents: number; spentCents: number }>) {
  if (!budgets.length) return { percent: null, above80Count: 0 };
  const limit = budgets.reduce((sum, item) => sum + item.limitCents, 0);
  const spent = budgets.reduce((sum, item) => sum + item.spentCents, 0);
  return {
    percent: limit > 0 ? (spent / limit) * 100 : null,
    above80Count: budgets.filter((b) => b.limitCents > 0 && b.spentCents / b.limitCents >= 0.8).length,
  };
}

export function estimatedRunway(balance: number, monthlyExpenses: number[]): number | null {
  if (!monthlyExpenses.length) return null;
  const average = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length;
  return average > 0 ? balance / average : null;
}

export function evaluatePurchase(input: PurchaseInput) {
  const financedTotal =
    input.financedTotalCents ??
    (input.installmentCount > 0 ? input.downPaymentCents + input.installmentCount * input.installmentCents : null);
  const upfront = input.installmentCount > 0 ? input.downPaymentCents : input.cashPriceCents;
  const monthlyImpact = input.installmentCents + (input.recurringMonthlyCostCents ?? 0);
  const commitmentPercent = input.monthlyIncomeCents
    ? ((monthlyImpact + (input.currentMonthlyInstallmentsCents ?? 0)) / input.monthlyIncomeCents) * 100
    : null;
  const remainingCash = input.currentBalanceCents - upfront;
  const totalDifferenceCents = financedTotal == null ? null : financedTotal - input.cashPriceCents;
  const monthsToCash =
    input.currentMonthlySurplusCents > 0
      ? Math.max(
          0,
          Math.ceil(
            (input.cashPriceCents - Math.max(0, input.currentBalanceCents - input.desiredReserveCents)) /
              input.currentMonthlySurplusCents,
          ),
        )
      : null;
  const limit = input.maxCommitmentPercent ?? 30;
  const warning =
    remainingCash < input.desiredReserveCents ||
    (commitmentPercent != null && commitmentPercent > limit) ||
    (input.categoryRemainingCents != null && upfront > input.categoryRemainingCents) ||
    monthlyImpact > input.currentMonthlySurplusCents;
  const attention =
    !warning &&
    (commitmentPercent == null ||
      input.incomeStability === "variable" ||
      remainingCash < input.desiredReserveCents * 1.2);
  return {
    classification: warning ? "melhor esperar" : attention ? "atenção" : "compatível",
    totalDifferenceCents,
    commitmentPercent,
    remainingCashCents: remainingCash,
    monthlySurplusAfterCents: input.currentMonthlySurplusCents - monthlyImpact,
    monthsToCash,
    confidence: input.historyMonths >= 6 ? "alta" : input.historyMonths >= 3 ? "média" : "baixa",
  } as const;
}
