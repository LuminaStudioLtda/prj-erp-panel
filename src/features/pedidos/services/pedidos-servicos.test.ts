import { describe, expect, it } from "vitest";
import {
  calcularNecessidadeDeMateriais,
  encontrarFaltas,
} from "@/features/pedidos/services/baixa-estoque";
import {
  formatarCodigoDoPedido,
  normalizarCodigoDoPedido,
  normalizarCodigoDoProduto,
} from "@/features/pedidos/services/codigo-pedido";
import {
  calcularTotalDoPedido,
  lerDataDoFormulario,
  sugerirEntrega,
  validarNovoPedido,
  VALORES_INICIAIS_DO_PEDIDO,
} from "@/features/pedidos/services/novo-pedido";
import {
  calcularIndicadoresDePedidos,
  contarPorStatus,
  filtrarPedidos,
} from "@/features/pedidos/services/pedido-indicadores";
import {
  disparaBaixaDeEstoque,
  podeTransicionar,
  proximaEtapa,
  transicoesPermitidas,
} from "@/features/pedidos/services/pedido-status";
import type { PedidoDaLista, ProdutoParaPedido } from "@/features/pedidos/types";

const PRODUTOS: ProdutoParaPedido[] = [
  { id: "p1", codigo: "LUM-P-0001", nome: "Cardigan Aurora Cru", preco: 480, diasDeConfeccao: 12 },
  { id: "p2", codigo: "LUM-P-0002", nome: "Bolsa Tecida", preco: 189.9, diasDeConfeccao: 7 },
];

function pedido(parcial: Partial<PedidoDaLista>): PedidoDaLista {
  return {
    id: "x",
    codigo: "#LUM-2026-0001",
    cliente: "Mariana Brandão",
    contato: null,
    status: "AWAITING_PRODUCTION",
    total: 100,
    criadoEm: new Date(2026, 9, 1),
    entregaPrevista: new Date(2026, 9, 20),
    itens: [{ produtoId: "p1", nome: "Cardigan Aurora Cru", quantidade: 1, precoUnitario: 100 }],
    ...parcial,
  };
}

describe("código do pedido", () => {
  it("formata com ano e sequência de 4 dígitos", () => {
    expect(formatarCodigoDoPedido(2026, 1)).toBe("#LUM-2026-0001");
    expect(formatarCodigoDoPedido(2026, 123)).toBe("#LUM-2026-0123");
    expect(formatarCodigoDoPedido(2026, 12345)).toBe("#LUM-2026-12345");
  });

  it("normaliza o que o usuário digita", () => {
    expect(normalizarCodigoDoPedido("#LUM-2026-0001")).toBe("#LUM-2026-0001");
    expect(normalizarCodigoDoPedido(" lum-2026-1 ")).toBe("#LUM-2026-0001");
    expect(normalizarCodigoDoPedido("LUM-2026-0042")).toBe("#LUM-2026-0042");
  });

  it("recusa textos que não são códigos de pedido", () => {
    for (const texto of ["", "LUM-P-0001", "#LUM-26-0001", "#LUM-2026-0000", "pedido 1"]) {
      expect(normalizarCodigoDoPedido(texto)).toBeNull();
    }
  });

  it("reconhece códigos de produto", () => {
    expect(normalizarCodigoDoProduto("LUM-P-0001")).toBe("LUM-P-0001");
    expect(normalizarCodigoDoProduto("lum-p-2")).toBe("LUM-P-0002");
    expect(normalizarCodigoDoProduto("#LUM-2026-0001")).toBeNull();
  });
});

describe("transições de status", () => {
  it("permite o fluxo normal e bloqueia saltos", () => {
    expect(podeTransicionar("DRAFT", "AWAITING_PRODUCTION")).toBe(true);
    expect(podeTransicionar("AWAITING_PRODUCTION", "IN_PRODUCTION")).toBe(true);
    expect(podeTransicionar("IN_PRODUCTION", "SHIPPED")).toBe(true);
    expect(podeTransicionar("SHIPPED", "COMPLETED")).toBe(true);
    expect(podeTransicionar("DRAFT", "IN_PRODUCTION")).toBe(false);
    expect(podeTransicionar("AWAITING_PRODUCTION", "SHIPPED")).toBe(false);
  });

  it("estados finais não têm saída", () => {
    expect(transicoesPermitidas("COMPLETED")).toEqual([]);
    expect(transicoesPermitidas("CANCELLED")).toEqual([]);
  });

  it("só a entrada em confecção dispara a baixa de estoque", () => {
    expect(disparaBaixaDeEstoque("AWAITING_PRODUCTION", "IN_PRODUCTION")).toBe(true);
    expect(disparaBaixaDeEstoque("IN_PRODUCTION", "SHIPPED")).toBe(false);
    expect(disparaBaixaDeEstoque("DRAFT", "AWAITING_PRODUCTION")).toBe(false);
    expect(disparaBaixaDeEstoque("IN_PRODUCTION", "IN_PRODUCTION")).toBe(false);
  });
});

describe("proximaEtapa", () => {
  it("toda etapa oferecida é uma transição permitida", () => {
    for (const status of ["DRAFT", "AWAITING_PAYMENT", "AWAITING_PRODUCTION", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED"] as const) {
      const etapa = proximaEtapa(status);
      expect(etapa).not.toBeNull();
      expect(podeTransicionar(status, etapa!.para)).toBe(true);
    }
  });

  it("estados finais não têm próxima etapa", () => {
    expect(proximaEtapa("COMPLETED")).toBeNull();
    expect(proximaEtapa("CANCELLED")).toBeNull();
  });

  it("iniciar confecção é a etapa que baixa o estoque", () => {
    const etapa = proximaEtapa("AWAITING_PRODUCTION");
    expect(etapa?.para).toBe("IN_PRODUCTION");
    expect(disparaBaixaDeEstoque("AWAITING_PRODUCTION", etapa!.para)).toBe(true);
  });
});

describe("indicadores e filtros de pedidos", () => {
  const agora = new Date(2026, 9, 15);
  const lista = [
    pedido({ id: "1", status: "IN_PRODUCTION", total: 300 }),
    pedido({ id: "2", status: "AWAITING_PRODUCTION", total: 200, entregaPrevista: new Date(2026, 10, 3) }),
    pedido({ id: "3", status: "COMPLETED", total: 900 }),
    pedido({ id: "4", status: "CANCELLED", total: 500 }),
    pedido({ id: "5", status: "DRAFT", total: 50 }),
  ];

  it("calcula os quatro indicadores", () => {
    expect(calcularIndicadoresDePedidos(lista, agora)).toEqual({
      total: 5,
      emConfeccao: 1,
      // pedidos 1 e 3 entregam em outubro e não são rascunho nem cancelados
      entregasDoMes: 2,
      // em aberto: 1 (300) + 2 (200)
      faturamentoPrevisto: 500,
    });
  });

  it("filtra por status, por código, por cliente e por produto, ignorando acento", () => {
    expect(filtrarPedidos(lista, "", "IN_PRODUCTION").map((p) => p.id)).toEqual(["1"]);
    expect(filtrarPedidos(lista, "#lum-2026-0001", "todos")).toHaveLength(5);
    expect(filtrarPedidos([pedido({ cliente: "Beatriz Lima" })], "beatriz", "todos")).toHaveLength(1);
    expect(filtrarPedidos([pedido({ cliente: "João Álvares" })], "joao alvares", "todos")).toHaveLength(1);
    expect(filtrarPedidos(lista, "cardigan", "COMPLETED").map((p) => p.id)).toEqual(["3"]);
    expect(filtrarPedidos(lista, "inexistente", "todos")).toEqual([]);
  });

  it("conta pedidos por status", () => {
    const contagem = contarPorStatus(lista);
    expect(contagem.todos).toBe(5);
    expect(contagem.IN_PRODUCTION).toBe(1);
    expect(contagem.SHIPPED).toBeUndefined();
  });
});

describe("necessidade de materiais e faltas", () => {
  const receitas = [
    { produtoId: "p1", itens: [{ materialId: "fio", quantidade: 450 }] },
    {
      produtoId: "p2",
      itens: [
        { materialId: "cordao", quantidade: 380 },
        { materialId: "fio", quantidade: 20.5 },
      ],
    },
  ];

  it("soma as fichas técnicas multiplicadas pelas quantidades do pedido", () => {
    const { porMaterial, produtosSemFicha } = calcularNecessidadeDeMateriais(
      [
        { produtoId: "p1", nome: "Cardigan", quantidade: 2 },
        { produtoId: "p2", nome: "Bolsa", quantidade: 3 },
      ],
      receitas,
    );

    expect(porMaterial.get("fio")).toBe(900 + 61.5);
    expect(porMaterial.get("cordao")).toBe(1140);
    expect(produtosSemFicha).toEqual([]);
  });

  it("aponta produtos sem ficha técnica ou sem vínculo com produto", () => {
    const { produtosSemFicha, porMaterial } = calcularNecessidadeDeMateriais(
      [
        { produtoId: "p9", nome: "Sem ficha", quantidade: 1 },
        { produtoId: null, nome: "Avulso", quantidade: 1 },
      ],
      receitas,
    );

    expect(produtosSemFicha).toEqual(["Sem ficha", "Avulso"]);
    expect(porMaterial.size).toBe(0);
  });

  it("encontra faltas comparando a necessidade com o saldo", () => {
    const faltas = encontrarFaltas(new Map([["fio", 900], ["cordao", 100]]), [
      { materialId: "fio", nome: "Fio", unidade: "g", disponivel: 840 },
      { materialId: "cordao", nome: "Cordão", unidade: "g", disponivel: 3400 },
    ]);

    expect(faltas).toEqual([{ materialId: "fio", nome: "Fio", unidade: "g", necessario: 900, disponivel: 840 }]);
  });
});

describe("novo pedido", () => {
  const valido = {
    ...VALORES_INICIAIS_DO_PEDIDO,
    cliente: "  Mariana ",
    entregaPrevista: "2026-10-20",
    linhas: [{ produtoId: "p1", quantidade: "2" }],
  };

  it("valida e normaliza", () => {
    const resultado = validarNovoPedido(valido, PRODUTOS);
    expect(resultado.pedido).toEqual({
      cliente: "Mariana",
      contato: null,
      entregaPrevista: new Date(2026, 9, 20, 12),
      itens: [{ produtoId: "p1", quantidade: 2 }],
    });
  });

  it("aponta cliente, linhas e data inválidos", () => {
    expect(validarNovoPedido({ ...valido, cliente: "" }, PRODUTOS).erros?.cliente).toBeTruthy();
    expect(validarNovoPedido({ ...valido, linhas: [] }, PRODUTOS).erros?.linhas).toBeTruthy();
    expect(validarNovoPedido({ ...valido, entregaPrevista: "31/02/2026" }, PRODUTOS).erros?.entregaPrevista).toBeTruthy();
    expect(validarNovoPedido({ ...valido, entregaPrevista: "2026-02-31" }, PRODUTOS).erros?.entregaPrevista).toBeTruthy();
    for (const quantidade of ["0", "1,5", "-1", "abc", ""]) {
      expect(validarNovoPedido({ ...valido, linhas: [{ produtoId: "p1", quantidade }] }, PRODUTOS).erros?.linhas).toBeTruthy();
    }
    expect(validarNovoPedido({ ...valido, linhas: [{ produtoId: "fantasma", quantidade: "1" }] }, PRODUTOS).erros?.linhas).toBeTruthy();
  });

  it("aceita entrega vazia", () => {
    expect(validarNovoPedido({ ...valido, entregaPrevista: "" }, PRODUTOS).pedido?.entregaPrevista).toBeNull();
  });

  it("calcula o total e sugere a entrega pelo maior prazo", () => {
    const linhas = [
      { produtoId: "p1", quantidade: "2" },
      { produtoId: "p2", quantidade: "3" },
    ];
    expect(calcularTotalDoPedido(linhas, PRODUTOS)).toBeCloseTo(960 + 569.7, 10);
    expect(sugerirEntrega(linhas, PRODUTOS, new Date(2026, 9, 1))).toBe("2026-10-13");
    expect(sugerirEntrega([], PRODUTOS, new Date(2026, 9, 1))).toBe("");
  });

  it("lê datas do formulário", () => {
    expect(lerDataDoFormulario("2026-10-20")).toEqual(new Date(2026, 9, 20, 12));
    expect(lerDataDoFormulario("")).toBeNull();
  });
});
