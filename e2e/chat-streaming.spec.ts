import { expect, test, type Page } from "@playwright/test";

const fullResponse = "Streaming imediato aparece antes do fim da resposta.";

async function openChat(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  const opener = page.getByRole("button", { name: "Abrir chat do gato" });
  if (await opener.isVisible()) await opener.click();
  await expect(page.getByLabel("Mensagem para o FinCat")).toBeVisible();
}

test("mostra os chunks enquanto a resposta ainda está em andamento", async ({ page }) => {
  await page.addInitScript((responseText) => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const requestUrl = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
      const url = new URL(requestUrl, window.location.href);
      if (url.pathname !== "/api/ai/chat") return originalFetch(input, init);

      const encoder = new TextEncoder();
      const event = (value: unknown) => encoder.encode(`data: ${JSON.stringify(value)}\n\n`);
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(event({ type: "agent", agentId: "siamesinho" }));
            const chunks = [...responseText];
            let index = 0;
            const interval = window.setInterval(() => {
              controller.enqueue(event({ type: "text", content: chunks[index] }));
              index += 1;
              if (index < chunks.length) return;

              window.clearInterval(interval);
              window.setTimeout(() => {
                controller.enqueue(event({ type: "done" }));
                controller.close();
              }, 150);
            }, 8);
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    };
  }, fullResponse);

  await openChat(page);
  const input = page.getByLabel("Mensagem para o FinCat");
  await input.fill("Me mostre um streaming");
  await page.getByRole("button", { name: "Enviar" }).click();

  const liveMessage = page.getByTestId("chat-stream");
  await expect(liveMessage).toContainText("Streaming imediato");
  await expect(input).toBeDisabled();
  await expect(page.getByTestId("chat-message").filter({ hasText: fullResponse })).toBeVisible();
  await expect(liveMessage).toHaveCount(0);
});
