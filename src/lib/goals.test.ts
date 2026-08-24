import test from "node:test";
import assert from "node:assert/strict";
import { calculateGoalProgress } from "./goals";
test("calcula progresso e recomendação mensal", () => {
  const result = calculateGoalProgress(
    {
      targetAmountCents: 600_000,
      targetDate: "2027-02-18",
      savedCents: 120_000,
      savedThisMonthCents: 20_000,
      status: "active",
    },
    new Date("2026-08-18T12:00:00"),
  );
  assert.equal(result.percentage, 20);
  assert.equal(result.remainingCents, 480_000);
  assert.equal(result.monthlyRecommendedCents, 80_000);
  assert.equal(result.reviewPending, false);
  assert.equal(result.state, "on_track");
});
test("mantém lembrete sem aporte e conclui em 100%", () => {
  const pending = calculateGoalProgress(
    { targetAmountCents: 100_000, targetDate: "2026-12-01", savedCents: 0, status: "active" },
    new Date("2026-08-18T12:00:00"),
  );
  assert.equal(pending.reviewPending, true);
  const done = calculateGoalProgress(
    { targetAmountCents: 100_000, targetDate: "2026-12-01", savedCents: 120_000, status: "active" },
    new Date("2026-08-18T12:00:00"),
  );
  assert.equal(done.percentage, 100);
  assert.equal(done.state, "completed");
});
test("marca meta vencida", () => {
  const result = calculateGoalProgress(
    { targetAmountCents: 100_000, targetDate: "2026-07-01", savedCents: 10_000, status: "active" },
    new Date("2026-08-18T12:00:00"),
  );
  assert.equal(result.state, "overdue");
  assert.equal(result.monthsRemaining, 1);
});
