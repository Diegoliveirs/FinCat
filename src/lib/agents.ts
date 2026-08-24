export const AGENT_IDS = ["siamesinho", "frajolinha", "persinha", "laranjinha"] as const;
export type AgentId = (typeof AGENT_IDS)[number];

export const agents = {
  siamesinho: {
    name: "Siamesinho",
    specialty: "Movimentações",
    description: "Registra, encontra e corrige lançamentos.",
    voice: "Atento e preciso; pode usar um 'miau' curto ao organizar ou localizar algo.",
  },
  frajolinha: {
    name: "Frajolinha",
    specialty: "Decisão de compra",
    description: "Compara pagar agora, parcelar ou esperar.",
    voice: "Cauteloso; pode usar 'mrr…' uma vez quando uma compra exige atenção.",
  },
  persinha: {
    name: "Persinha",
    specialty: "Metas e orçamentos",
    description: "Planeja metas e limites que protegem sua sobra.",
    voice: "Calmo e acolhedor; pode usar 'prrr' uma vez ao reconhecer progresso ou conclusão.",
  },
  laranjinha: {
    name: "Laranjinha",
    specialty: "Análises",
    description: "Encontra tendências, projeções e anomalias.",
    voice: "Curioso; pode usar 'miau?' uma vez ao investigar informação faltante.",
  },
} satisfies Record<AgentId, { name: string; specialty: string; description: string; voice: string }>;

export function routeAgent(message: string): AgentId {
  const text = message.toLocaleLowerCase("pt-BR");
  if (/meta|objetivo|econom|guardei|guardar|juntar|em\s+\d+\s+mes|até\s+\d{1,2}[\/\-]/.test(text)) return "persinha";
  if (/compr|parcel|preço|preco|à vista|a vista|vale a pena/.test(text)) return "frajolinha";
  if (/orçamento|orcamento|limite|planej/.test(text)) return "persinha";
  if (/proje|tendência|tendencia|compar|resumo|anomalia|mês passado|mes passado/.test(text)) return "laranjinha";
  return "siamesinho";
}
