import { describe, expect, it } from "vitest";
import {
  calcularCustoMaoDeObra,
  calcularPrecificacao,
  type ConfiguracaoDePrecificacao,
  type EntradaDePrecificacao,
} from "@/features/ficha-tecnica/services/precificacao";

const CONFIGURACAO: ConfiguracaoDePrecificacao = { valorHoraTrabalhada: 25, taxaPerdas: 0.1 };

function entrada(parcial: Partial<EntradaDePrecificacao> = {}): EntradaDePrecificacao {
  return { custoInsumos: 20, tempoMinutos: 90, embalagens: 5, margem: 0.4, precoManual: null, ...parcial };
}

describe("calcularCustoMaoDeObra", () => {
  it("converte minutos em horas e multiplica pelo VHT", () => {
    expect(calcularCustoMaoDeObra(90, 25)).toBeCloseTo(37.5, 10);
    expect(calcularCustoMaoDeObra(60, 25)).toBeCloseTo(25, 10);
  });

  it("aceita tempo em minutos que não é múltiplo de 60", () => {
    expect(calcularCustoMaoDeObra(7, 25)).toBeCloseTo((7 / 60) * 25, 10);
    expect(calcularCustoMaoDeObra(61, 24)).toBeCloseTo(24.4, 10);
  });

  it("retorna zero sem tempo", () => {
    expect(calcularCustoMaoDeObra(0, 25)).toBe(0);
  });
});

describe("calcularPrecificacao", () => {
  it("aplica as fórmulas do BRD termo a termo", () => {
    const resultado = calcularPrecificacao(entrada(), CONFIGURACAO);

    expect(resultado.custoInsumos).toBe(20);
    expect(resultado.custoMaoDeObra).toBeCloseTo(37.5, 10);
    expect(resultado.embalagens).toBe(5);
    expect(resultado.custoDireto).toBeCloseTo(62.5, 10);
    expect(resultado.valorPerdas).toBeCloseTo(6.25, 10);
    // 62,50 × 1,10 × 1,40
    expect(resultado.precoSugerido).toBeCloseTo(96.25, 10);
    expect(resultado.precoFinal).toBe(resultado.precoSugerido);
    expect(resultado.lucroSugerido).toBeCloseTo(27.5, 10);
  });

  it("com taxa de perdas e margem zero, o preço sugerido é o custo direto", () => {
    const resultado = calcularPrecificacao(
      entrada({ custoInsumos: 10, tempoMinutos: 60, embalagens: 0, margem: 0 }),
      { valorHoraTrabalhada: 20, taxaPerdas: 0 },
    );

    expect(resultado.custoDireto).toBeCloseTo(30, 10);
    expect(resultado.valorPerdas).toBe(0);
    expect(resultado.precoSugerido).toBeCloseTo(30, 10);
    expect(resultado.lucroSugerido).toBeCloseTo(0, 10);
    expect(resultado.margemReal).toBeCloseTo(0, 10);
  });

  it("só taxa de perdas zero: preço = custo direto × (1 + margem)", () => {
    const resultado = calcularPrecificacao(entrada(), { valorHoraTrabalhada: 25, taxaPerdas: 0 });
    expect(resultado.precoSugerido).toBeCloseTo(62.5 * 1.4, 10);
  });

  it("só margem zero: preço = custo direto × (1 + perdas)", () => {
    const resultado = calcularPrecificacao(entrada({ margem: 0 }), CONFIGURACAO);
    expect(resultado.precoSugerido).toBeCloseTo(68.75, 10);
  });

  it("mantém custo de insumo com 5 casas decimais até o arredondamento final", () => {
    // 3 × 0,12345 = 0,37035 de insumo, sem mão de obra, embalagem, perdas nem margem.
    const resultado = calcularPrecificacao(
      entrada({ custoInsumos: 3 * 0.12345, tempoMinutos: 0, embalagens: 0, margem: 0 }),
      { valorHoraTrabalhada: 25, taxaPerdas: 0 },
    );

    expect(resultado.custoDireto).toBeCloseTo(0.37035, 10);
    expect(resultado.precoSugerido).toBe(0.37);
  });

  it("arredonda o preço sugerido para centavos", () => {
    const resultado = calcularPrecificacao(entrada({ tempoMinutos: 7 }), CONFIGURACAO);
    expect(resultado.precoSugerido).toBe(Math.round(resultado.precoSugerido * 100) / 100);
  });

  describe("preço manual (cálculo reverso da margem real)", () => {
    it("usa o preço manual como preço final e deriva a margem real", () => {
      const resultado = calcularPrecificacao(entrada({ precoManual: 110 }), CONFIGURACAO);

      expect(resultado.precoFinal).toBe(110);
      expect(resultado.precoSugerido).toBeCloseTo(96.25, 10);
      // 110 / (62,50 × 1,10) − 1
      expect(resultado.margemReal).toBeCloseTo(0.6, 10);
      expect(resultado.lucro).toBeCloseTo(41.25, 10);
    });

    it("com o preço sugerido digitado, a margem real volta à desejada", () => {
      const sugerido = calcularPrecificacao(entrada(), CONFIGURACAO).precoSugerido;
      const resultado = calcularPrecificacao(entrada({ precoManual: sugerido }), CONFIGURACAO);

      expect(resultado.margemReal).toBeCloseTo(0.4, 10);
    });

    it("margem real negativa quando o preço não cobre custo com perdas", () => {
      const resultado = calcularPrecificacao(entrada({ precoManual: 50 }), CONFIGURACAO);

      expect(resultado.margemReal).toBeLessThan(0);
      expect(resultado.lucro).toBeLessThan(0);
    });
  });

  it("sem custo algum, não gera NaN nem divisão por zero", () => {
    const resultado = calcularPrecificacao(
      entrada({ custoInsumos: 0, tempoMinutos: 0, embalagens: 0 }),
      CONFIGURACAO,
    );

    expect(resultado.custoDireto).toBe(0);
    expect(resultado.precoSugerido).toBe(0);
    expect(resultado.margemReal).toBe(0);
    expect(Number.isNaN(resultado.lucro)).toBe(false);
  });
});
