import { describe, expect, it } from "vitest";
import {
  calcularEntrada,
  custoMedioPonderado,
  distribuirSaidaFifo,
  totalEmEstoque,
  type LoteDeEstoque,
} from "@/features/insumos/services/estoque-calculos";

const lote = (id: string, quantidade: number, custoUnitario: number, diasAtras: number): LoteDeEstoque => ({
  id,
  quantidade,
  custoUnitario,
  recebidoEm: new Date(2026, 9, 1 - diasAtras),
});

describe("custoMedioPonderado", () => {
  it("pondera o custo pela quantidade de cada lote", () => {
    // (440 × 0,105 + 400 × 0,12) ÷ 840
    expect(custoMedioPonderado([lote("a", 440, 0.105, 60), lote("b", 400, 0.12, 20)])).toBe(0.11214);
  });

  it("com um único lote devolve o custo dele", () => {
    expect(custoMedioPonderado([lote("a", 120, 0.272, 1)])).toBe(0.272);
  });

  it("ignora lotes zerados e devolve null sem saldo", () => {
    expect(custoMedioPonderado([lote("a", 0, 9, 3), lote("b", 100, 0.5, 1)])).toBe(0.5);
    expect(custoMedioPonderado([lote("a", 0, 9, 3)])).toBeNull();
    expect(custoMedioPonderado([])).toBeNull();
  });

  it("preserva 5 casas decimais", () => {
    expect(custoMedioPonderado([lote("a", 3, 0.12345, 1)])).toBe(0.12345);
  });
});

describe("calcularEntrada", () => {
  it("multiplica cones por rendimento e divide o preço pelo rendimento", () => {
    // 2 cones de 400 g a R$ 42,00 cada
    expect(calcularEntrada({ cones: 2, precoCone: 42, rendimento: 400 })).toEqual({
      quantidade: 800,
      custoUnitario: 0.105,
    });
  });

  it("mantém 5 casas no custo unitário", () => {
    expect(calcularEntrada({ cones: 1, precoCone: 36.5, rendimento: 254 })?.custoUnitario).toBe(0.14370);
  });

  it("rejeita valores zerados, negativos ou inválidos", () => {
    for (const entrada of [
      { cones: 0, precoCone: 10, rendimento: 100 },
      { cones: 1, precoCone: -1, rendimento: 100 },
      { cones: 1, precoCone: 10, rendimento: 0 },
      { cones: Number.NaN, precoCone: 10, rendimento: 100 },
    ]) {
      expect(calcularEntrada(entrada)).toBeNull();
    }
  });
});

describe("distribuirSaidaFifo", () => {
  const lotes = [lote("novo", 400, 0.12, 20), lote("antigo", 440, 0.105, 60)];

  it("consome primeiro o lote mais antigo", () => {
    expect(distribuirSaidaFifo(lotes, 100)).toEqual({
      consumo: [{ loteId: "antigo", quantidade: 100 }],
      faltante: 0,
    });
  });

  it("avança para o próximo lote quando o primeiro acaba", () => {
    const { consumo, faltante } = distribuirSaidaFifo(lotes, 500);
    expect(consumo).toEqual([
      { loteId: "antigo", quantidade: 440 },
      { loteId: "novo", quantidade: 60 },
    ]);
    expect(faltante).toBe(0);
  });

  it("informa o que faltou quando o saldo não cobre", () => {
    const { consumo, faltante } = distribuirSaidaFifo(lotes, 900);
    expect(consumo.reduce((soma, c) => soma + c.quantidade, 0)).toBe(840);
    expect(faltante).toBe(60);
  });

  it("não altera a lista original", () => {
    const copia = [...lotes];
    distribuirSaidaFifo(lotes, 10);
    expect(lotes).toEqual(copia);
  });
});

describe("totalEmEstoque", () => {
  it("soma os lotes sem erro de ponto flutuante", () => {
    expect(totalEmEstoque([lote("a", 0.1, 1, 1), lote("b", 0.2, 1, 1)])).toBe(0.3);
  });
});
