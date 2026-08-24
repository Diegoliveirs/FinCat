import test from "node:test";
import assert from "node:assert/strict";
import { routeAgent } from "./agents";
test("roteia quatro especialidades", () => {
  assert.equal(routeAgent("quero comprar parcelado"), "frajolinha");
  assert.equal(routeAgent("quero comprar um iPhone em 6 meses"), "persinha");
  assert.equal(routeAgent("iPhone em 6 meses"), "persinha");
  assert.equal(routeAgent("guardei 500 reais"), "persinha");
  assert.equal(routeAgent("projete o fim do mês"), "laranjinha");
  assert.equal(routeAgent("registra meu mercado"), "siamesinho");
});
