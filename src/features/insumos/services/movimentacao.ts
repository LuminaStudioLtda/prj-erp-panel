import type { TipoDeMovimentacao } from "@/features/insumos/types";

/** Motivo gravado em `stock_movements.reason` (enum do banco). */
export type MotivoDoBanco = "PURCHASE" | "ADJUSTMENT" | "PRODUCTION" | "ORDER" | "RETURN" | "LOSS";

export function tipoDaMovimentacao(motivo: MotivoDoBanco): TipoDeMovimentacao {
  switch (motivo) {
    case "PURCHASE":
    case "RETURN":
      return "ENTRADA";
    case "PRODUCTION":
    case "ORDER":
      return "SAIDA_PRODUCAO";
    case "LOSS":
      return "SAIDA_PERDA";
    case "ADJUSTMENT":
      return "AJUSTE";
  }
}

export type MotivoDaBaixa = "perda" | "sobra" | "teste" | "ajuste";

export const ROTULO_MOTIVO_DA_BAIXA: Record<MotivoDaBaixa, string> = {
  perda: "Perda de material",
  sobra: "Sobra inutilizável",
  teste: "Teste de ponto / amostra",
  ajuste: "Ajuste de inventário",
};

export const MOTIVOS_DA_BAIXA = Object.keys(ROTULO_MOTIVO_DA_BAIXA) as MotivoDaBaixa[];

/** Perdas, sobras e testes viram "Baixa manual"; só o ajuste de inventário é registrado como ajuste. */
export function motivoDoBancoParaBaixa(motivo: MotivoDaBaixa): "LOSS" | "ADJUSTMENT" {
  return motivo === "ajuste" ? "ADJUSTMENT" : "LOSS";
}

/** Texto da observação gravada: motivo + o que o usuário escreveu. */
export function montarObservacaoDaBaixa(motivo: MotivoDaBaixa, texto: string): string {
  const detalhe = texto.trim();
  return detalhe ? `${ROTULO_MOTIVO_DA_BAIXA[motivo]}: ${detalhe}` : ROTULO_MOTIVO_DA_BAIXA[motivo];
}
