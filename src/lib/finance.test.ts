import test from "node:test";
import assert from "node:assert/strict";
import { budgetPressure, estimatedRunway, evaluatePurchase, projectedExpense, savingsRate } from "./finance";

test("calcula KPIs e preserva ausência de base", () => {
  assert.equal(savingsRate(100_000, 20_000), 20);
  assert.equal(savingsRate(0, 0), null);
  assert.equal(projectedExpense(1_000, 10, 30), 3_000);
  assert.deepEqual(budgetPressure([]), { percent: null, above80Count: 0 });
  assert.equal(estimatedRunway(300_000, [100_000, 100_000, 100_000]), 3);
});

test("avalia à vista, parcelado com juros e renda variável", () => {
  const base = {
    cashPriceCents: 100_000,
    downPaymentCents: 0,
    installmentCount: 0,
    installmentCents: 0,
    currentBalanceCents: 500_000,
    desiredReserveCents: 200_000,
    currentMonthlySurplusCents: 80_000,
    historyMonths: 6,
  };
  assert.equal(evaluatePurchase(base).classification, "compatível");
  const financed = evaluatePurchase({
    ...base,
    installmentCount: 10,
    installmentCents: 12_000,
    financedTotalCents: 120_000,
    monthlyIncomeCents: 100_000,
    maxCommitmentPercent: 10,
  });
  assert.equal(financed.totalDifferenceCents, 20_000);
  assert.equal(financed.classification, "melhor esperar");
  const variable = evaluatePurchase({
    ...base,
    installmentCount: 5,
    installmentCents: 5_000,
    financedTotalCents: null,
    monthlyIncomeCents: null,
    incomeStability: "variable",
    historyMonths: 1,
  });
  assert.equal(variable.confidence, "baixa");
  assert.equal(variable.classification, "atenção");
});
