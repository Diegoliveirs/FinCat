import assert from "node:assert/strict";
import test from "node:test";
import { classifyProposalReply, matchesDestructiveConfirmation } from "./proposals";

test("classifica confirmações e cancelamentos conservadoramente", () => {
  assert.equal(classifyProposalReply("Sim!"), "confirm");
  assert.equal(classifyProposalReply("pode criar essa meta"), "confirm");
  assert.equal(classifyProposalReply("não"), "cancel");
  assert.equal(classifyProposalReply("pode mudar para 8 meses?"), "none");
});

test("exclusão textual exige ação e entidade", () => {
  assert.equal(matchesDestructiveConfirmation("sim", "Nubank"), false);
  assert.equal(matchesDestructiveConfirmation("Excluir conta Nubank", "Nubank"), true);
});
