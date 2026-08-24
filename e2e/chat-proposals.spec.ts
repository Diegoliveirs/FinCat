import { expect, test, type Page } from "@playwright/test";

async function openChat(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  const opener = page.getByRole("button", { name: "Abrir chat do gato" });
  if (await opener.isVisible()) {
    await opener.click();
    await expect(page.getByLabel("Mensagem para o FinCat")).toBeVisible();
  }
}

async function mockGoalProposal(page: Page, name: string) {
  await page.route("**/api/ai/chat", async (route) => {
    const proposal = {
      id: `proposal-${name}`,
      agentId: "persinha",
      kind: "goal_create",
      title: "Criar meta",
      destructive: false,
      entityLabel: name,
      data: { name, targetAmountCents: 1200000, targetDate: "2027-02-18", initialAmountCents: 0 },
    };
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        `data: ${JSON.stringify({ type: "agent", agentId: "persinha" })}`,
        `data: ${JSON.stringify({ type: "proposal", proposal })}`,
        `data: ${JSON.stringify({ type: "done" })}`,
        "",
      ].join("\n\n"),
    });
  });
}

test("confirma pelo botão e mantém o cartão concluído sem bolha vazia", async ({ page }) => {
  await mockGoalProposal(page, "Notebook de trabalho");
  await openChat(page);
  await page.getByLabel("Mensagem para o FinCat").fill("Quero uma meta para um notebook");
  await page.getByRole("button", { name: "Enviar" }).click();
  const card = page.getByTestId("proposal-card");
  await expect(card).toContainText("Notebook de trabalho");
  await card.getByRole("button", { name: "Confirmar" }).click();
  await expect(card).toContainText("Meta criada");
  await expect(card.getByRole("button", { name: "Confirmar" })).toHaveCount(0);
  await expect(page.getByText(/vou acompanhar seu progresso/i)).toBeVisible();
  await expect(page.locator('[data-testid="chat-message"]:empty')).toHaveCount(0);
});

test("aceita pelo texto e preserva o cartão", async ({ page }) => {
  await mockGoalProposal(page, "Viagem");
  await openChat(page);
  const input = page.getByLabel("Mensagem para o FinCat");
  await input.fill("Crie uma meta de viagem");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByTestId("proposal-card")).toContainText("Pendente");
  await input.fill("pode criar");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByTestId("proposal-card")).toContainText("Meta criada");
});
