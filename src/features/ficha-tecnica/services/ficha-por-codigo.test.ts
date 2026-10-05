import { describe, expect, it } from "vitest";
import { consolidarFicha, type ProdutoParaFicha } from "@/features/ficha-tecnica/services/ficha-por-codigo";
import { calcularPrecificacao } from "@/features/ficha-tecnica/services/precificacao";

const FIO = { materialId: "fio", nome: "Fio Algodão", unidade: "g" as const, custoUnitario: 0.11214 };
const ZIPER = { materialId: "ziper", nome: "Zíper", unidade: "un" as const, custoUnitario: 3.2 };

const cardigan: ProdutoParaFicha = {
  nome: "Cardigan",
  quantidade: 2,
  receita: { minutos: 420, indiretos: 8, itens: [{ ...FIO, quantidade: 450 }] },
};
const bolsa: ProdutoParaFicha = {
  nome: "Bolsa",
  quantidade: 1,
  receita: { minutos: 300, indiretos: 5, itens: [{ ...FIO, quantidade: 20 }, { ...ZIPER, quantidade: 1 }] },
};

describe("consolidarFicha", () => {
  it("soma materiais iguais, multiplicando pela quantidade de cada produto", () => {
    const ficha = consolidarFicha([cardigan, bolsa]);

    expect(ficha.itens).toHaveLength(2);
    const fio = ficha.itens.find((i) => i.materialId === "fio");
    expect(fio?.quantidade).toBe(920); // 450 × 2 + 20
    expect(fio?.custo).toBeCloseTo(920 * 0.11214, 5);
    expect(ficha.itens.find((i) => i.materialId === "ziper")?.custo).toBeCloseTo(3.2, 10);
  });

  it("multiplica tempo e custos indiretos pela quantidade", () => {
    const ficha = consolidarFicha([cardigan, bolsa]);
    expect(ficha.tempoMinutos).toBe(420 * 2 + 300);
    expect(ficha.custosIndiretos).toBe(8 * 2 + 5);
  });

  it("custo dos insumos é a soma de quantidade × custo unitário vigente", () => {
    const ficha = consolidarFicha([cardigan, bolsa]);
    expect(ficha.custoInsumos).toBeCloseTo(920 * 0.11214 + 3.2, 4);
  });

  it("marca produtos sem ficha e insumos sem custo, sem quebrar o cálculo", () => {
    const ficha = consolidarFicha([
      cardigan,
      { nome: "Avulso", quantidade: 1, receita: null },
      { nome: "Sem custo", quantidade: 1, receita: { minutos: 10, indiretos: 0, itens: [{ materialId: "x", nome: "Fio novo", unidade: "g", quantidade: 5, custoUnitario: null }] } },
    ]);

    expect(ficha.produtosSemFicha).toEqual(["Avulso"]);
    expect(ficha.insumosSemCusto).toEqual(["Fio novo"]);
    expect(ficha.custoInsumos).toBeCloseTo(900 * 0.11214, 4);
  });

  it("lista vazia gera ficha zerada", () => {
    const ficha = consolidarFicha([]);
    expect(ficha.itens).toEqual([]);
    expect(ficha.custoInsumos).toBe(0);
    expect(ficha.tempoMinutos).toBe(0);
  });

  it("alimenta o motor de precificação com as fórmulas do BRD", () => {
    const ficha = consolidarFicha([bolsa]);
    const resultado = calcularPrecificacao(
      {
        custoInsumos: ficha.custoInsumos,
        tempoMinutos: ficha.tempoMinutos,
        embalagens: ficha.custosIndiretos,
        margem: 0.35,
        precoManual: null,
      },
      { valorHoraTrabalhada: 40, taxaPerdas: 0.08 },
    );

    // insumos 20 × 0,11214 + 3,20 = 5,4428 · mão de obra (300 ÷ 60) × 40 = 200 · indiretos 5
    expect(resultado.custoDireto).toBeCloseTo(5.4428 + 200 + 5, 4);
    expect(resultado.precoSugerido).toBeCloseTo((5.4428 + 205) * 1.08 * 1.35, 1);
  });
});
