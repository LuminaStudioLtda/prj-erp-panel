import { describe, expect, it } from "vitest";
import {
  VALORES_INICIAIS,
  calcularLinhasDaReceita,
  calcularPrecificacaoDoFormulario,
  calcularTempoEmMinutos,
  somarCustoDosInsumos,
} from "@/features/ficha-tecnica/services/ficha-tecnica-form";
import type { ItemDoCatalogo } from "@/features/ficha-tecnica/types";

const CATALOGO: ItemDoCatalogo[] = [
  { id: "fio-a", nome: "Fio A", detalhe: "", unidade: "g", custoUnitario: 0.12345 },
  { id: "botao", nome: "Botão", detalhe: "", unidade: "un", custoUnitario: 1.5 },
];

describe("calcularTempoEmMinutos", () => {
  it("soma horas e minutos", () => {
    expect(calcularTempoEmMinutos("1", "30")).toBe(90);
    expect(calcularTempoEmMinutos("2", "")).toBe(120);
  });

  it("aceita minutos que não completam uma hora e valores acima de 59", () => {
    expect(calcularTempoEmMinutos("", "45")).toBe(45);
    expect(calcularTempoEmMinutos("0", "75")).toBe(75);
    expect(calcularTempoEmMinutos("3", "7")).toBe(187);
  });

  it("trata vazio e valores inválidos como zero", () => {
    expect(calcularTempoEmMinutos("", "")).toBe(0);
    expect(calcularTempoEmMinutos("abc", "10")).toBe(10);
    expect(calcularTempoEmMinutos("-1", "1,5")).toBe(0);
  });
});

describe("calcularLinhasDaReceita / somarCustoDosInsumos", () => {
  it("multiplica a quantidade pelo custo unitário do insumo cadastrado", () => {
    const linhas = calcularLinhasDaReceita(
      [
        { insumoId: "fio-a", quantidade: "250" },
        { insumoId: "botao", quantidade: "2" },
      ],
      CATALOGO,
    );

    // 250 × 0,12345 = 30,8625 (custo unitário com 5 casas) + 2 × 1,50
    expect(linhas[0].custo).toBeCloseTo(30.8625, 10);
    expect(linhas[1].custo).toBeCloseTo(3, 10);
    expect(somarCustoDosInsumos(linhas)).toBeCloseTo(33.8625, 10);
  });

  it("aceita vírgula decimal na quantidade", () => {
    const [linha] = calcularLinhasDaReceita([{ insumoId: "botao", quantidade: "1,5" }], CATALOGO);
    expect(linha.quantidade).toBe(1.5);
    expect(linha.custo).toBeCloseTo(2.25, 10);
  });

  it("não calcula custo para quantidade vazia, zero ou insumo inexistente", () => {
    const linhas = calcularLinhasDaReceita(
      [
        { insumoId: "fio-a", quantidade: "" },
        { insumoId: "fio-a", quantidade: "0" },
        { insumoId: "fantasma", quantidade: "10" },
      ],
      CATALOGO,
    );

    expect(linhas.map((linha) => linha.custo)).toEqual([null, null, null]);
    expect(somarCustoDosInsumos(linhas)).toBe(0);
  });
});

describe("calcularPrecificacaoDoFormulario", () => {
  const configuracao = { valorHoraTrabalhada: 25, taxaPerdas: 0.1 };

  it("integra receita, tempo, embalagens, margem e preço manual", () => {
    const valores = {
      ...VALORES_INICIAIS,
      itens: [{ insumoId: "botao", quantidade: "4" }],
      horas: "1",
      minutos: "30",
      embalagens: "5,00",
      margemPct: 40,
    };
    const linhas = calcularLinhasDaReceita(valores.itens, CATALOGO);

    const sugerido = calcularPrecificacaoDoFormulario(valores, linhas, configuracao);
    // insumos 6 + mão de obra 37,50 + embalagens 5 = 48,50 → × 1,10 × 1,40
    expect(sugerido.custoDireto).toBeCloseTo(48.5, 10);
    expect(sugerido.precoSugerido).toBeCloseTo(74.69, 10);

    const manual = calcularPrecificacaoDoFormulario({ ...valores, precoManual: "90,00" }, linhas, configuracao);
    expect(manual.precoFinal).toBe(90);
    expect(manual.margemReal).toBeCloseTo(90 / (48.5 * 1.1) - 1, 10);
  });

  it("ignora preço manual inválido e embalagens negativas", () => {
    const valores = { ...VALORES_INICIAIS, embalagens: "-3", precoManual: "abc" };
    const resultado = calcularPrecificacaoDoFormulario(valores, [], configuracao);

    expect(resultado.embalagens).toBe(0);
    expect(resultado.precoFinal).toBe(resultado.precoSugerido);
  });
});
