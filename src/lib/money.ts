export function formatBRL(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatBRLCompact(cents: number): string {
  return formatBRL(cents).replace(/,00$/, "");
}

export function centsToInput(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function inputToCents(input: string): number {
  const normalized = input.replace(/[^\d,]/g, "").replace(",", ".");
  const value = parseFloat(normalized);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}

export function signColor(cents: number): string {
  if (cents > 0) return "var(--brand)";
  if (cents < 0) return "var(--danger)";
  return "var(--ink)";
}
