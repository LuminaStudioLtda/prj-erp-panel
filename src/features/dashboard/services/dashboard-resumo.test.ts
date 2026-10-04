import { describe, expect, it } from "vitest";
import {
  calcularResumoDoMes,
  calcularSerieDeFaturamento,
  contarAlertasDeFios,
  contarPedidosPorStatus,
  listarFiosEmDestaque,
  montarFilaDeConfeccao,
} from "@/features/dashboard/services/dashboard-resumo";
import type { PedidoResumo } from "@/features/dashboard/types";
import type { InsumoEmEstoque } from "@/features/insumos/types";

const AGORA = new Date(2026, 9, 15); // 15/10/2026

function pedido(parcial: Partial<PedidoResumo>): PedidoResumo {
  return {
    id: "p",
    cliente: "Cliente",
    status: "COMPLETED",
    total: 100,
    criadoEm: new Date(2026, 9, 5),
    itens: [{ nome: "Peça", quantidade: 1 }],
    ...parcial,
  };
}

function fio(parcial: Partial<InsumoEmEstoque>): InsumoEmEstoque {
  return {
    id: "f",
    categoria: "fio",
    sku: "",
    nomeComercial: "Fio",
    marca: "",
    cor: "Cru",
    lote: "",
    unidade: "g",
    pesoGramas: 100,
    rendimentoMetros: 100,
    precoAquisicao: 10,
    estoqueAtual: 100,
    pontoPedido: 100,
    ...parcial,
  };
}

describe("calcularResumoDoMes", () => {
  it("soma só pedidos pagos do mês atual e compara com o mês anterior", () => {
    const resumo = calcularResumoDoMes(
      [
        pedido({ total: 200 }),
        pedido({ total: 100, status: "IN_PRODUCTION" }),
        pedido({ total: 999, status: "AWAITING_PAYMENT" }),
        pedido({ total: 999, status: "CANCELLED" }),
        pedido({ total: 150, criadoEm: new Date(2026, 8, 20) }),
        pedido({ total: 999, criadoEm: new Date(2026, 7, 31) }),
      ],
      AGORA,
    );

    expect(resumo.faturamento).toBe(300);
    expect(resumo.faturamentoMesAnterior).toBe(150);
    expect(resumo.variacao).toBeCloseTo(1, 10);
  });

  it("não calcula variação quando o mês anterior não faturou", () => {
    expect(calcularResumoDoMes([pedido({ total: 50 })], AGORA).variacao).toBeNull();
  });

  it("conta peças em produção e o valor aguardando pagamento", () => {
    const resumo = calcularResumoDoMes(
      [
        pedido({ status: "IN_PRODUCTION", itens: [{ nome: "A", quantidade: 2 }, { nome: "B", quantidade: 1 }] }),
        pedido({ status: "IN_PRODUCTION", itens: [{ nome: "C", quantidade: 4 }] }),
        pedido({ status: "AWAITING_PAYMENT", total: 80 }),
        pedido({ status: "AWAITING_PAYMENT", total: 20 }),
      ],
      AGORA,
    );

    expect(resumo.emProducao).toEqual({ pedidos: 2, pecas: 7 });
    expect(resumo.aguardandoPagamento).toEqual({ pedidos: 2, total: 100 });
  });

  it("sem pedidos devolve zeros", () => {
    const resumo = calcularResumoDoMes([], AGORA);
    expect(resumo.faturamento).toBe(0);
    expect(resumo.emProducao).toEqual({ pedidos: 0, pecas: 0 });
  });
});

describe("montarFilaDeConfeccao", () => {
  it("lista só pedidos em confecção ou prontos, do mais antigo ao mais novo, respeitando o limite", () => {
    const fila = montarFilaDeConfeccao(
      [
        pedido({ id: "novo", status: "IN_PRODUCTION", criadoEm: new Date(2026, 9, 10) }),
        pedido({ id: "antigo", status: "READY_TO_SHIP", criadoEm: new Date(2026, 9, 1) }),
        pedido({ id: "pago", status: "COMPLETED" }),
        pedido({ id: "meio", status: "IN_PRODUCTION", criadoEm: new Date(2026, 9, 5) }),
      ],
      2,
    );

    expect(fila.map((linha) => linha.id)).toEqual(["antigo", "meio"]);
  });

  it("resume pedidos com vários itens e sem itens", () => {
    const [varios, vazio] = montarFilaDeConfeccao([
      pedido({
        id: "v",
        status: "IN_PRODUCTION",
        criadoEm: new Date(2026, 9, 1),
        itens: [{ nome: "Cardigan", quantidade: 1 }, { nome: "Touca", quantidade: 1 }, { nome: "Meia", quantidade: 1 }],
      }),
      pedido({ id: "z", status: "IN_PRODUCTION", criadoEm: new Date(2026, 9, 2), itens: [] }),
    ]);

    expect(varios.peca).toBe("Cardigan +2");
    expect(vazio.peca).toBe("Pedido sem itens");
  });
});

describe("calcularSerieDeFaturamento", () => {
  it("acumula por dia do mês atual até hoje e do mês anterior inteiro", () => {
    const serie = calcularSerieDeFaturamento(
      [
        pedido({ total: 100, criadoEm: new Date(2026, 9, 2, 14) }),
        pedido({ total: 50, criadoEm: new Date(2026, 9, 2, 18) }),
        pedido({ total: 200, criadoEm: new Date(2026, 9, 10) }),
        pedido({ total: 999, status: "AWAITING_PAYMENT", criadoEm: new Date(2026, 9, 3) }),
        pedido({ total: 70, criadoEm: new Date(2026, 8, 30) }),
      ],
      AGORA,
    );

    expect(serie.atual).toHaveLength(15);
    expect(serie.atual[0]).toBe(0);
    expect(serie.atual[1]).toBe(150);
    expect(serie.atual[8]).toBe(150);
    expect(serie.atual[9]).toBe(350);
    expect(serie.atual[14]).toBe(350);
    expect(serie.anterior).toHaveLength(30);
    expect(serie.anterior[29]).toBe(70);
  });

  it("sem pedidos, devolve séries zeradas", () => {
    const serie = calcularSerieDeFaturamento([], AGORA);
    expect(serie.atual.every((valor) => valor === 0)).toBe(true);
    expect(serie.anterior.every((valor) => valor === 0)).toBe(true);
  });
});

describe("contarPedidosPorStatus", () => {
  it("conta cada status, incluindo os vazios, em ordem fixa", () => {
    const contagem = contarPedidosPorStatus([
      pedido({ status: "COMPLETED" }),
      pedido({ status: "COMPLETED" }),
      pedido({ status: "IN_PRODUCTION" }),
    ]);

    expect(contagem).toHaveLength(8);
    expect(contagem.find((item) => item.status === "COMPLETED")?.quantidade).toBe(2);
    expect(contagem.find((item) => item.status === "IN_PRODUCTION")?.quantidade).toBe(1);
    expect(contagem.find((item) => item.status === "CANCELLED")?.quantidade).toBe(0);
  });
});

describe("estoque de fios", () => {
  it("ordena do estoque mais crítico para o mais folgado e ignora não-fios", () => {
    const destaque = listarFiosEmDestaque([
      fio({ id: "folgado", estoqueAtual: 900, pontoPedido: 100 }),
      fio({ id: "critico", estoqueAtual: 50, pontoPedido: 100 }),
      fio({ id: "aviamento", categoria: "aviamento", estoqueAtual: 1, pontoPedido: 100 }),
      fio({ id: "baixo", estoqueAtual: 150, pontoPedido: 100 }),
    ]);

    expect(destaque.map((item) => item.id)).toEqual(["critico", "baixo", "folgado"]);
    expect(destaque.map((item) => item.status)).toEqual(["critico", "baixo", "ok"]);
    expect(destaque[0].nivel).toBeCloseTo(0.125, 10);
    expect(destaque[2].nivel).toBe(1);
  });

  it("conta alertas só entre os fios", () => {
    expect(
      contarAlertasDeFios([
        fio({ estoqueAtual: 50 }),
        fio({ estoqueAtual: 150 }),
        fio({ estoqueAtual: 900 }),
        fio({ categoria: "embalagem", estoqueAtual: 1 }),
      ]),
    ).toBe(2);
  });
});
