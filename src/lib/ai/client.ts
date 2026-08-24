export type AiMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  toolCallId?: string;
  name?: string;
  toolCalls?: Array<{ id: string; name: string; args: string }>;
};

export type AiTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolCallPayload = {
  id: string;
  name: string;
  args: string;
};

export type AiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
};

export function getAiConfig(): AiConfig | null {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!baseUrl || !apiKey || !model) return null;
  return {
    baseUrl,
    apiKey,
    model,
    timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 30000),
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  let b = baseUrl.trim();
  if (b.endsWith("/")) b = b.slice(0, -1);
  if (b.endsWith("/chat/completions")) b = b.slice(0, -"/chat/completions".length);
  if (b.endsWith("/v1")) return `${b}/chat/completions`;
  return `${b}/chat/completions`;
}

function toOpenAiMessages(messages: AiMessage[]) {
  return messages.map((m) => {
    if (m.role === "tool") {
      const msg: Record<string, unknown> = { role: "tool", tool_call_id: m.toolCallId, content: m.content };
      if (m.name) msg.name = m.name;
      return msg;
    }
    const base = { role: m.role, content: m.content ?? "" } as Record<string, unknown>;
    if (m.toolCallId) base.tool_call_id = m.toolCallId;
    if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
      base.tool_calls = m.toolCalls.map((t) => ({
        id: t.id,
        type: "function",
        function: { name: t.name, arguments: t.args },
      }));
    }
    return base;
  });
}

export type StreamResult =
  { kind: "text"; content: string } | { kind: "toolCall"; call: ToolCallPayload } | { kind: "done" };

export async function* chatStream(messages: AiMessage[], tools: AiTool[]): AsyncGenerator<StreamResult, void, unknown> {
  const config = getAiConfig();
  if (!config) {
    yield { kind: "text", content: "IA nao configurada. Define AI_BASE_URL, AI_API_KEY e AI_MODEL no .env" };
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetch(normalizeBaseUrl(config.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: toOpenAiMessages(messages),
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? "auto" : undefined,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const short = body.slice(0, 200);
      yield {
        kind: "text",
        content: `Provider respondeu ${res.status}: ${short || res.statusText}`,
      };
      return;
    }

    if (!res.body) {
      yield { kind: "text", content: "Sem resposta do provider." };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let activeToolId: string | null = null;
    let toolName = "";
    let toolArgs = "";
    let finishReason: string | null = null;

    const emitToolCall = (): ToolCallPayload | null => {
      if (!activeToolId) return null;
      const call = { id: activeToolId, name: toolName, args: toolArgs };
      activeToolId = null;
      toolName = "";
      toolArgs = "";
      return call;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") {
          finishReason = "stop";
          continue;
        }
        let json: {
          choices?: Array<{
            delta?: {
              content?: string;
              tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }>;
            };
            finish_reason?: string | null;
          }>;
        };
        try {
          json = JSON.parse(payload);
        } catch {
          continue;
        }
        const choice = json.choices?.[0];
        if (!choice) continue;
        if (choice.finish_reason) finishReason = choice.finish_reason;
        const delta = choice.delta;
        if (!delta) continue;
        if (delta.content) {
          yield { kind: "text", content: delta.content };
        }
        const calls = delta.tool_calls;
        if (calls && calls.length > 0) {
          for (const call of calls) {
            if (call.id) activeToolId = call.id;
            if (call.function?.name) toolName = call.function.name;
            if (call.function?.arguments) toolArgs += call.function.arguments;
          }
        }
      }
    }

    if (activeToolId) {
      const call = emitToolCall();
      if (call) yield { kind: "toolCall", call };
    } else if (finishReason === "tool_calls") {
      const call = emitToolCall();
      if (call) yield { kind: "toolCall", call };
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      yield { kind: "text", content: "Provider demorou demais. Tenta de novo ou usa outro provider." };
    } else {
      yield {
        kind: "text",
        content: `Erro de rede no provider: ${err instanceof Error ? err.message : "desconhecido"}`,
      };
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function completeToolTurn(
  messages: AiMessage[],
  tools: AiTool[],
  toolCalls: ToolCallPayload[],
  onChunk: (text: string) => void,
  toolResults?: string[],
): Promise<void> {
  const config = getAiConfig();
  if (!config) return;

  const withTool = messages.map((m) => {
    const base = { role: m.role, content: m.content ?? "" } as Record<string, unknown>;
    if (m.toolCallId) base.tool_call_id = m.toolCallId;
    return base;
  });

  const apiMessages = [
    ...withTool,
    {
      role: "assistant",
      content: "",
      tool_calls: toolCalls.map((t) => ({
        id: t.id,
        type: "function",
        function: { name: t.name, arguments: t.args },
      })),
    },
    ...toolCalls.map((t, index) => ({
      role: "tool",
      tool_call_id: t.id,
      content: toolResults?.[index] ?? t.args,
    })),
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const res = await fetch(normalizeBaseUrl(config.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages: apiMessages, stream: true }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      onChunk(`Falha ao concluir: ${res.status}`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const content = json.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          /* ignorar */
        }
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      onChunk("Provider demorou demais. Tenta de novo.");
    }
  } finally {
    clearTimeout(timer);
  }
}
