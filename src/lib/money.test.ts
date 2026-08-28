import assert from "node:assert/strict";
import test from "node:test";
import { inputToCents, normalizeCurrencyInput } from "./money";

test("mantém a digitação monetária brasileira estável", () => {
  assert.equal(normalizeCurrencyInput("1234,567"), "1234,56");
  assert.equal(normalizeCurrencyInput("1.234,50"), "1234,50");
  assert.equal(normalizeCurrencyInput("12,3,4"), "12,34");
  assert.equal(inputToCents(normalizeCurrencyInput("1234,56")), 123_456);
});
