import { describe, expect, it } from "vitest";
import {
  CONFIGURACAO_GLOBAL_PADRAO,
  configuracaoParaFormulario,
  simularPecaDeExemplo,
  validarConfiguracao,
  type ConfiguracaoFormValues,
} from "@/features/ficha-tecnica/services/configuracao-de-precificacao";

function valores(parcial: Partial<ConfiguracaoFormValues> = {}): ConfiguracaoFormValues {
  return { valorHora: "25,50", taxaPerdasPct: "5", margemPadraoPct: "35", ...parcial };
}

describe("validarConfiguracao", () => {
  it("converte VHT em reais e taxa de perdas de pontos percentuais para fração", () => {
    expect(validarConfiguracao(valores()).configuracao).toEqual({
      precificacao: { valorHoraTrabalhada: 25.5, taxaPerdas: 0.05 },
      margemPadraoPct: 35,
    });
  });

  it("aceita taxa de perdas e margem zero, e taxa decimal", () => {
    const zerada = validarConfiguracao(valores({ taxaPerdasPct: "0", margemPadraoPct: "0" })).configuracao;
    expect(zerada?.precificacao.taxaPerdas).toBe(0);
    expect(zerada?.margemPadraoPct).toBe(0);

    expect(validarConfiguracao(valores({ taxaPerdasPct: "7,5" })).configuracao?.precificacao.taxaPerdas).toBe(0.075);
  });

  it("rejeita VHT vazio, zero, negativo ou não numérico", () => {
    for (const valorHora of ["", "0", "-5", "abc"]) {
      const resultado = validarConfiguracao(valores({ valorHora }));
      expect(resultado.erros?.valorHora).toBeTruthy();
      expect(resultado.configuracao).toBeUndefined();
    }
  });

  it("rejeita taxa de perdas fora de 0 a 100", () => {
    for (const taxaPerdasPct of ["", "-1", "100,5", "x"]) {
      expect(validarConfiguracao(valores({ taxaPerdasPct })).erros?.taxaPerdasPct).toBeTruthy();
    }
  });

  it("rejeita margem padrão fora de 0 a 100 ou não inteira", () => {
    for (const margemPadraoPct of ["", "-1", "101", "12,5", "x"]) {
      expect(validarConfiguracao(valores({ margemPadraoPct })).erros?.margemPadraoPct).toBeTruthy();
    }
  });

  it("reporta todos os erros ao mesmo tempo", () => {
    const resultado = validarConfiguracao({ valorHora: "", taxaPerdasPct: "", margemPadraoPct: "" });
    expect(Object.keys(resultado.erros ?? {}).sort()).toEqual(["margemPadraoPct", "taxaPerdasPct", "valorHora"]);
  });
});

describe("configuracaoParaFormulario", () => {
  it("formata para os campos em pt-BR e volta ao mesmo valor", () => {
    const configuracao = {
      precificacao: { valorHoraTrabalhada: 25, taxaPerdas: 0.075 },
      margemPadraoPct: 40,
    };
    const formulario = configuracaoParaFormulario(configuracao);

    expect(formulario).toEqual({ valorHora: "25,00", taxaPerdasPct: "7,5", margemPadraoPct: "40" });
    expect(validarConfiguracao(formulario).configuracao).toEqual(configuracao);
  });
});

describe("simularPecaDeExemplo", () => {
  it("aplica as fórmulas do BRD à peça de exemplo", () => {
    const resultado = simularPecaDeExemplo({
      precificacao: { valorHoraTrabalhada: 25, taxaPerdas: 0.1 },
      margemPadraoPct: 40,
    });

    // insumos 18 + mão de obra (120 ÷ 60) × 25 = 50 + embalagens 4 = 72 → × 1,10 × 1,40
    expect(resultado.custoMaoDeObra).toBeCloseTo(50, 10);
    expect(resultado.custoDireto).toBeCloseTo(72, 10);
    expect(resultado.precoSugerido).toBeCloseTo(110.88, 10);
  });

  it("a configuração padrão gera um preço positivo", () => {
    expect(simularPecaDeExemplo(CONFIGURACAO_GLOBAL_PADRAO).precoSugerido).toBeGreaterThan(0);
  });
});
