"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, X, AlertTriangle, Sparkles, Minimize2, ChevronDown, Check } from "lucide-react";
import { CatAvatar, CatMark, moodForBalance } from "@/components/ui/cat-mood";
import { AGENT_IDS, agents, type AgentId } from "@/lib/agents";
import {
  classifyProposalReply,
  matchesDestructiveConfirmation,
  proposalRequest,
  proposalStatusLabel,
  proposalSuccessMessage,
  type ProposalChatItem,
  type ProposalEnvelope,
} from "@/lib/ai/proposals";
import { Markdown } from "./markdown";
import { useRouter } from "next/navigation";

type Msg = { id: string; role: "user" | "cat"; content: string; agentId?: AgentId } | ProposalChatItem;

const financialTypeLabel: Record<string, string> = {
  expense: "Despesa",
  income: "Receita",
};

function proposalRows(proposal: ProposalEnvelope) {
  const data = proposal.data as Record<string, unknown>;
  const money = (value: unknown) =>
    typeof value === "number"
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100)
      : String(value);
  const labels: Record<string, string> = {
    name: "Nome",
    description: "Descrição",
    amountCents: "Valor",
    targetAmountCents: "Valor-alvo",
    initialAmountCents: "Já guardado",
    limitCents: "Limite",
    targetDate: "Prazo",
    savedAt: "Data",
    date: "Data",
    month: "Mês",
    type: "Tipo",
    kind: "Natureza",
    color: "Cor",
    desiredReserveCents: "Reserva desejada",
    minimumMonthlySurplusCents: "Sobra mínima",
    unregisteredDebtCents: "Dívidas externas",
    monthlyIncomeCents: "Renda mensal",
    maxIncomeCommitmentPercent: "Comprometimento máximo",
  };
  const hidden = new Set([
    "accountId",
    "categoryId",
    "transactionId",
    "budgetId",
    "goalId",
    "savingsId",
    "sortOrder",
    "impactCount",
  ]);
  return [
    ["Item", proposal.entityLabel],
    ...Object.entries(data)
      .filter(([key, value]) => !hidden.has(key) && value !== undefined)
      .map(([key, value]) => [
        labels[key] ?? key,
        /Cents$/.test(key)
          ? money(value)
          : (key === "type" || key === "kind") && typeof value === "string"
            ? (financialTypeLabel[value] ?? value)
            : /Date$|^date$|savedAt/.test(key)
              ? String(value).split("-").reverse().join("/")
              : String(value),
      ]),
  ];
}

function ProposalCard({
  item,
  onConfirm,
  onCancel,
}: {
  item: ProposalChatItem;
  onConfirm: (item: ProposalChatItem) => void;
  onCancel: (item: ProposalChatItem) => void;
}) {
  const actionable = item.status === "pending" || item.status === "error";
  const status = proposalStatusLabel(item.proposal, item.status);
  return (
    <div data-testid="proposal-card" className="row-in border-brand/35 bg-brand/5 rounded-2xl border p-3 text-xs">
      <div className="flex items-center gap-2">
        <CatAvatar variant={item.proposal.agentId} className="size-7" label={agents[item.proposal.agentId].name} />
        <div className="min-w-0 flex-1">
          <div className="text-brand font-semibold">{item.proposal.title}</div>
          <div className="text-muted text-[10px]">Proposta do {agents[item.proposal.agentId].name}</div>
        </div>
        <span
          aria-live="polite"
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.status === "confirmed" ? "bg-brand/15 text-brand" : item.status === "error" ? "bg-danger/15 text-danger" : "text-muted bg-white/8"}`}
        >
          {status}
        </span>
      </div>
      <div className="bg-bg mt-3 space-y-1.5 rounded-xl p-2.5">
        {proposalRows(item.proposal).map(([label, value]) => (
          <div key={String(label)} className="flex justify-between gap-3">
            <span className="text-muted">{String(label)}</span>
            <span className="text-ink max-w-[60%] text-right break-words">{String(value ?? "—")}</span>
          </div>
        ))}
        {item.proposal.impact && <p className="text-danger mt-2">{item.proposal.impact}</p>}
        {item.error && <p className="text-danger mt-2">{item.error}</p>}
      </div>
      {actionable && (
        <div className="mt-3 flex gap-2">
          <button className="bg-brand rounded-lg px-3 py-2 font-semibold text-black" onClick={() => onConfirm(item)}>
            Confirmar
          </button>
          <button className="text-muted rounded-lg border border-white/10 px-3 py-2" onClick={() => onCancel(item)}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

function AgentPortrait({ id, className = "size-9" }: { id: "auto" | AgentId; className?: string }) {
  return id === "auto" ? (
    <CatMark className={className} label="FinCat, seleção automática" />
  ) : (
    <CatAvatar variant={id} className={className} label={agents[id].name} />
  );
}

function AgentPicker({ value, onChange }: { value: "auto" | AgentId; onChange: (value: "auto" | AgentId) => void }) {
  const [open, setOpen] = useState(false);
  const selected = value === "auto" ? { name: "Automático", specialty: "FinCat escolhe" } : agents[value];
  const options: Array<"auto" | AgentId> = ["auto", ...AGENT_IDS];
  return (
    <div className="relative">
      <span className="text-muted mb-1.5 block text-[11px] font-medium">Especialista</span>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="bg-bg focus-visible:border-brand flex w-full items-center gap-2.5 rounded-xl border border-white/10 px-2.5 py-2 text-left transition-colors hover:border-white/20"
      >
        <AgentPortrait id={value} className="size-8 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="text-ink block truncate text-xs font-semibold">{selected.name}</span>
          <span className="text-muted block truncate text-[10px]">{selected.specialty}</span>
        </span>
        <ChevronDown className={`text-muted size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Escolher especialista"
          className="bg-surface-2 mt-2 overflow-hidden rounded-2xl border border-white/10 p-1.5"
        >
          {options.map((id) => {
            const meta =
              id === "auto" ? { name: "Automático", specialty: "FinCat escolhe o especialista" } : agents[id];
            const selectedOption = value === id;
            return (
              <button
                type="button"
                role="menuitemradio"
                aria-checked={selectedOption}
                key={id}
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${selectedOption ? "bg-white/8" : "hover:bg-white/5"}`}
              >
                <AgentPortrait id={id} className="size-9 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="text-ink block text-xs font-semibold">{meta.name}</span>
                  <span className="text-muted block truncate text-[10px]">{meta.specialty}</span>
                </span>
                {selectedOption && <Check className="text-brand size-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
function readStream(
  res: Response,
  onText: (t: string) => void,
  onTool: (id: number | null, msg: string) => void,
  onAgent: (id: AgentId) => void,
  onProposal: (proposal: ProposalEnvelope) => void,
  onInsight: (content: string) => void,
) {
  return new Promise<void>(async (resolve) => {
    const reader = res.body?.getReader();
    if (!reader) return resolve();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";
      for (const block of lines) {
        if (!block.startsWith("data:")) continue;
        const payload = block.slice(5).trim();
        if (!payload) continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "text") onText(evt.content);
          else if (evt.type === "tool") onTool(evt.transactionId, evt.message);
          else if (evt.type === "agent") onAgent(evt.agentId);
          else if (evt.type === "proposal") onProposal(evt.proposal);
          else if (evt.type === "insight") onInsight(evt.content);
        } catch {
          /* ignorar */
        }
      }
    }
    resolve();
  });
}

export function CatPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: crypto.randomUUID(),
      role: "cat",
      content: "Miau. Sou o FinCat. Me diz quanto gastou ou pergunta o que quiser das suas finanças.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [alert, setAlert] = useState<string | null>(null);
  const historyRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [balance, setBalance] = useState(0);
  const [agentChoice, setAgentChoice] = useState<"auto" | AgentId>("auto");
  const [activeAgent, setActiveAgent] = useState<AgentId>("siamesinho");

  useEffect(() => {
    const openChat = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string; agentId?: AgentId }>).detail;
      setCollapsed(false);
      setOpen(true);
      if (detail?.prompt) setInput(detail.prompt);
      if (detail?.agentId) {
        setAgentChoice(detail.agentId);
        setActiveAgent(detail.agentId);
      }
    };
    window.addEventListener("fincat:open-chat", openChat);
    return () => window.removeEventListener("fincat:open-chat", openChat);
  }, []);

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((r) => r.json())
      .then((data) => {
        setBalance(data.totalBalanceCents);
        const over = data.budgets?.filter((b: { over: boolean }) => b.over);
        if (over?.length > 0) {
          setAlert(`Estourou: ${over.map((b: { name: string }) => b.name).join(", ")}. Tá gastando demais.`);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem("fincat-panel-collapsed") === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (mobile) return;
    try {
      localStorage.setItem("fincat-panel-collapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed, mobile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!streamingText) return;
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [streamingText]);

  const appendCat = useCallback((content: string, agentId: AgentId) => {
    if (!content.trim()) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "cat", content, agentId }]);
    historyRef.current = [...historyRef.current, { role: "assistant", content }];
  }, []);

  const updateProposal = useCallback((id: string, update: Partial<Pick<ProposalChatItem, "status" | "error">>) => {
    setMessages((current) =>
      current.map((item) => (item.role === "proposal" && item.id === id ? { ...item, ...update } : item)),
    );
  }, []);

  const confirmProposal = useCallback(
    async (item: ProposalChatItem) => {
      if (item.status === "confirming" || item.status === "confirmed") return;
      updateProposal(item.id, { status: "confirming", error: undefined });
      const request = proposalRequest(item.proposal);
      try {
        const res = await fetch(request.url, {
          method: request.method,
          headers: { "Content-Type": "application/json" },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const error =
            typeof body?.error === "string"
              ? body.error
              : "Não foi possível concluir. Revise a proposta e tente novamente.";
          updateProposal(item.id, { status: "error", error });
          appendCat(error, item.proposal.agentId);
          return;
        }
        updateProposal(item.id, { status: "confirmed", error: undefined });
        appendCat(proposalSuccessMessage(item.proposal), item.proposal.agentId);
        toast.success(proposalStatusLabel(item.proposal, "confirmed"));
        router.refresh();
      } catch {
        const error = "Sem conexão. A proposta não foi gravada; tente confirmar novamente.";
        updateProposal(item.id, { status: "error", error });
        appendCat(error, item.proposal.agentId);
      }
    },
    [appendCat, router, updateProposal],
  );

  const cancelProposal = useCallback(
    (item: ProposalChatItem) => {
      if (item.status === "confirmed") return;
      updateProposal(item.id, { status: "cancelled", error: undefined });
      appendCat(`Tudo bem. Não gravei **${item.proposal.entityLabel}**.`, item.proposal.agentId);
    },
    [appendCat, updateProposal],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const pending = [...messages]
      .reverse()
      .find(
        (item): item is ProposalChatItem =>
          item.role === "proposal" && (item.status === "pending" || item.status === "error"),
      );
    setInput("");
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: text }]);
    historyRef.current = [...historyRef.current, { role: "user", content: text }];
    if (pending) {
      const reply = classifyProposalReply(text);
      if (reply === "cancel") {
        cancelProposal(pending);
        return;
      }
      if (reply === "confirm") {
        if (pending.proposal.destructive && !matchesDestructiveConfirmation(text, pending.proposal.entityLabel)) {
          appendCat(
            `Para sua segurança, escreva **excluir ${pending.proposal.entityLabel}** ou use o botão do cartão.`,
            pending.proposal.agentId,
          );
          return;
        }
        await confirmProposal(pending);
        return;
      }
      if (pending.proposal.destructive && matchesDestructiveConfirmation(text, pending.proposal.entityLabel)) {
        await confirmProposal(pending);
        return;
      }
    }
    setStreaming(true);
    setStreamingText("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: historyRef.current.slice(-8), agentId: agentChoice }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        appendCat(err?.error ?? `Falha: ${res.status}`, activeAgent);
        return;
      }
      let catText = "";
      let responseAgent = activeAgent;
      await readStream(
        res,
        (chunk) => {
          catText += chunk;
          setStreamingText(catText);
        },
        (_txId, msg) => {
          if (msg) toast.error(msg);
        },
        (id) => {
          responseAgent = id;
          setActiveAgent(id);
        },
        (proposal) =>
          setMessages((current) => [...current, { id: proposal.id, role: "proposal", proposal, status: "pending" }]),
        (content) => appendCat(content, responseAgent),
      );
      if (catText.trim()) appendCat(catText, responseAgent);
    } catch {
      appendCat("Deu ruim na conexão. Tenta de novo.", activeAgent);
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  }, [activeAgent, agentChoice, appendCat, cancelProposal, confirmProposal, input, messages, streaming]);

  const panel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <CatAvatar
            variant={activeAgent}
            mood={moodForBalance(balance)}
            className="size-9"
            label={agents[activeAgent].name}
          />
          <div>
            <div className="text-sm font-bold">{agents[activeAgent].name}</div>
            <div className="text-muted text-[11px]">{agents[activeAgent].specialty}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {alert && (
            <button
              onClick={() => setAlert(null)}
              title="Estouro de orçamento"
              className="bg-danger/15 text-danger flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
            >
              <AlertTriangle className="size-3" />
              estouro
            </button>
          )}
          {!mobile && (
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Recolher painel"
              title="Recolher"
              className="press text-muted rounded-full p-1.5 hover:bg-white/5"
            >
              <Minimize2 className="size-4" />
            </button>
          )}
          {mobile && (
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar painel"
              className="press text-muted rounded-full p-1.5 hover:bg-white/5"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <AgentPicker
          value={agentChoice}
          onChange={(id) => {
            setAgentChoice(id);
            if (id !== "auto") setActiveAgent(id);
          }}
        />
        {messages.map((m) =>
          m.role === "proposal" ? (
            <ProposalCard key={m.id} item={m} onConfirm={confirmProposal} onCancel={cancelProposal} />
          ) : (
            <div key={m.id} className={`row-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "cat" && m.agentId && (
                <CatAvatar variant={m.agentId} className="mr-2 size-7 shrink-0" label={agents[m.agentId].name} />
              )}
              <div
                data-testid="chat-message"
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-brand text-black" : "text-ink bg-white/5"
                }`}
              >
                {m.role === "user" ? m.content : <Markdown>{m.content}</Markdown>}
              </div>
            </div>
          ),
        )}
        {streaming && (
          <div className="flex justify-start">
            <div
              data-testid="chat-stream"
              className={`text-ink max-w-[85%] rounded-2xl bg-white/5 px-3.5 py-2.5 text-sm leading-relaxed ${
                streamingText.length > 0 ? "type-cursor" : ""
              }`}
            >
              {streamingText.length === 0 ? (
                <span className="text-muted text-xs">Analisando…</span>
              ) : (
                <Markdown>{streamingText}</Markdown>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="bg-bg/60 focus-within:border-brand/60 flex items-center gap-2 rounded-2xl border border-white/10 p-1.5 pl-3.5">
          <input
            aria-label="Mensagem para o FinCat"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="gastei 45 no mercado ontem"
            className="text-ink placeholder:text-muted/50 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            onClick={send}
            disabled={streaming || !input.trim()}
            aria-label="Enviar"
            className="press bg-brand flex size-8 shrink-0 items-center justify-center rounded-full text-black disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
        <div className="text-muted/60 mt-1.5 flex items-center gap-1 px-1 text-[10px]">
          <Sparkles className="size-3" />
          cadastra gastos, responde perguntas, cobra estouro
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!mobile && !collapsed && (
        <aside className="bg-surface fixed inset-y-0 right-0 z-40 hidden w-[22rem] border-l border-white/10 lg:block">
          {panel}
        </aside>
      )}

      {mobile && (
        <>
          {!open && (
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir chat do gato"
              className="press bg-surface fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full border border-white/10 shadow-lg shadow-black/40"
            >
              <CatAvatar variant={activeAgent} mood="neutro" className="size-11" label={agents[activeAgent].name} />
            </button>
          )}
          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
              <div className="drawer-enter bg-surface absolute inset-x-0 top-10 bottom-0 rounded-t-[2rem] border-t border-white/10">
                {panel}
              </div>
            </div>
          )}
        </>
      )}

      {!mobile && collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Reabrir chat do gato"
          className="press bg-surface fixed right-4 bottom-6 z-40 flex size-14 items-center justify-center rounded-full border border-white/10 shadow-lg shadow-black/40"
        >
          <CatAvatar variant={activeAgent} mood="neutro" className="size-11" label={agents[activeAgent].name} />
        </button>
      )}
    </>
  );
}
