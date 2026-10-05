import { parseNumeroPtBr } from "@/features/insumos/services/insumo-form";
import {
  calcularPrecificacao,
  MARGEM_PADRAO_PCT,
  type ConfiguracaoDePrecificacao,
  type ResultadoDePrecificacao,
} from "@/features/ficha-tecnica/services/precificacao";

export type ConfiguracaoGlobal = {
  precificacao: ConfiguracaoDePrecificacao;
  /** Margem de lucro inicial das fichas técnicas, em pontos percentuais inteiros (35 = 35%). */
  margemPadraoPct: number;
};

export const CONFIGURACAO_GLOBAL_PADRAO: ConfiguracaoGlobal = {
  precificacao: { valorHoraTrabalhada: 25, taxaPerdas: 0.05 },
  margemPadraoPct: MARGEM_PADRAO_PCT,
};

export type ConfiguracaoFormValues = {
  valorHora: string;
  /** Taxa de perdas em pontos percentuais (5 = 5%). */
  taxaPerdasPct: string;
  margemPadraoPct: string;
};

export type ConfiguracaoFormErrors = Partial<Record<keyof ConfiguracaoFormValues, string>>;

export type ResultadoDaValidacao =
  | { configuracao: ConfiguracaoGlobal; erros?: undefined }
  | { configuracao?: undefined; erros: ConfiguracaoFormErrors };

export const VALOR_HORA_MAXIMO = 10_000;

/** Peça fictícia usada só para o administrador enxergar o efeito dos valores globais. */
export const PECA_DE_EXEMPLO = {
  custoInsumos: 18,
  tempoMinutos: 120,
  embalagens: 4,
} as const;

export function simularPecaDeExemplo(configuracao: ConfiguracaoGlobal): ResultadoDePrecificacao {
  return calcularPrecificacao(
    { ...PECA_DE_EXEMPLO, margem: configuracao.margemPadraoPct / 100, precoManual: null },
    configuracao.precificacao,
  );
}

export function configuracaoParaFormulario(configuracao: ConfiguracaoGlobal): ConfiguracaoFormValues {
  const { precificacao, margemPadraoPct } = configuracao;
  return {
    valorHora: precificacao.valorHoraTrabalhada.toFixed(2).replace(".", ","),
    taxaPerdasPct: String(Math.round(precificacao.taxaPerdas * 10_000) / 100).replace(".", ","),
    margemPadraoPct: String(margemPadraoPct),
  };
}

export function validarConfiguracao(valores: ConfiguracaoFormValues): ResultadoDaValidacao {
  const erros: ConfiguracaoFormErrors = {};

  const valorHora = parseNumeroPtBr(valores.valorHora);
  if (valorHora === null || valorHora <= 0 || valorHora > VALOR_HORA_MAXIMO) {
    erros.valorHora = "Informe o valor da hora em reais, maior que zero (ex.: 25,00).";
  }

  const taxaPct = parseNumeroPtBr(valores.taxaPerdasPct);
  if (taxaPct === null || taxaPct < 0 || taxaPct > 100) {
    erros.taxaPerdasPct = "Informe a taxa de perdas entre 0 e 100 (ex.: 5).";
  }

  const margem = parseNumeroPtBr(valores.margemPadraoPct);
  if (margem === null || !Number.isInteger(margem) || margem < 0 || margem > 100) {
    erros.margemPadraoPct = "Informe a margem padrão como número inteiro entre 0 e 100 (ex.: 35).";
  }

  if (valorHora === null || taxaPct === null || margem === null || Object.keys(erros).length > 0) {
    return { erros };
  }

  return {
    configuracao: {
      precificacao: {
        valorHoraTrabalhada: Math.round(valorHora * 100) / 100,
        taxaPerdas: Math.round(taxaPct * 100) / 10_000,
      },
      margemPadraoPct: margem,
    },
  };
}
