/**
 * Motor de precificação com as fórmulas do BRD (docs/TRILHAS_DESENVOLVIMENTO.md, Trilha 3):
 *
 *   Custo_Insumos  = Σ (Quantidade_Usada * Custo_Unitário_Insumo)
 *   Custo_Mão_Obra = (Tempo_Total_Minutos / 60) * VHT
 *   Custo_Direto   = Custo_Insumos + Custo_Mão_Obra + Embalagens
 *   Preço_Sugerido = Custo_Direto * (1 + Taxa_Perdas) * (1 + Margem_Lucro_%)
 */

export type ConfiguracaoDePrecificacao = {
  /** Valor da Hora Trabalhada (VHT), em reais. */
  valorHoraTrabalhada: number;
  /** Taxa de perdas como fração (0,05 = 5%). */
  taxaPerdas: number;
};

/** Margem de lucro inicial (em pontos percentuais) quando o administrador ainda não definiu a sua. */
export const MARGEM_PADRAO_PCT = 35;

export type EntradaDePrecificacao = {
  custoInsumos: number;
  tempoMinutos: number;
  embalagens: number;
  /** Margem de lucro desejada como fração (0,35 = 35%). */
  margem: number;
  /** `null` mantém o preço sugerido. */
  precoManual: number | null;
};

export type ResultadoDePrecificacao = {
  custoInsumos: number;
  custoMaoDeObra: number;
  embalagens: number;
  custoDireto: number;
  /** Valor monetário da taxa de perdas sobre o custo direto. */
  valorPerdas: number;
  precoSugerido: number;
  precoFinal: number;
  /** Lucro do preço sugerido, em reais, depois de custo direto e perdas. */
  lucroSugerido: number;
  /** Lucro do preço final aplicado, em reais, depois de custo direto e perdas. */
  lucro: number;
  /** Margem de lucro real sobre o custo direto com perdas (cálculo reverso do preço final). */
  margemReal: number;
};

export function calcularCustoMaoDeObra(tempoMinutos: number, valorHora: number): number {
  return (tempoMinutos / 60) * valorHora;
}

export function calcularPrecificacao(
  entrada: EntradaDePrecificacao,
  configuracao: ConfiguracaoDePrecificacao,
): ResultadoDePrecificacao {
  const custoMaoDeObra = calcularCustoMaoDeObra(entrada.tempoMinutos, configuracao.valorHoraTrabalhada);
  const custoDireto = entrada.custoInsumos + custoMaoDeObra + entrada.embalagens;
  const custoComPerdas = custoDireto * (1 + configuracao.taxaPerdas);

  const precoSugerido = arredondarMoeda(custoComPerdas * (1 + entrada.margem));
  const precoFinal = entrada.precoManual ?? precoSugerido;

  return {
    custoInsumos: entrada.custoInsumos,
    custoMaoDeObra,
    embalagens: entrada.embalagens,
    custoDireto,
    valorPerdas: custoDireto * configuracao.taxaPerdas,
    precoSugerido,
    precoFinal,
    lucroSugerido: precoSugerido - custoComPerdas,
    lucro: precoFinal - custoComPerdas,
    margemReal: custoComPerdas > 0 ? precoFinal / custoComPerdas - 1 : 0,
  };
}

function arredondarMoeda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}


export { formatarMoeda, formatarPercentual } from "@/lib/formatar";
