const FORMATO_MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const FORMATO_PERCENTUAL = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const FORMATO_DATA_CURTA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

export function formatarMoeda(valor: number): string {
  return FORMATO_MOEDA.format(valor);
}

/** Formata uma fração como percentual pt-BR com uma casa (0,368 → "36,8%"). */
export function formatarPercentual(fracao: number): string {
  return FORMATO_PERCENTUAL.format(fracao);
}

export function formatarDataCurta(data: Date): string {
  return FORMATO_DATA_CURTA.format(data);
}

const FORMATO_DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatarDataHora(data: Date): string {
  return FORMATO_DATA_HORA.format(data);
}
