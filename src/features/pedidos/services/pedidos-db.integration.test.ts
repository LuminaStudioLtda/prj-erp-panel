import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buscarFichaPorCodigo } from "@/features/ficha-tecnica/services/ficha-por-codigo-db";
import {
  listarHistoricoDoInsumo,
  listarInsumos,
  registrarBaixaManual,
  registrarEntrada,
} from "@/features/insumos/services/insumos-db";
import { alterarStatusDoPedido, criarPedido, listarPedidos } from "@/features/pedidos/services/pedidos-db";
import type { AuthenticatedUser } from "@/features/rbac/types";
import { getDb } from "@/lib/db";
import { ErroDeNegocio } from "@/lib/erro-de-negocio";
import { withDatabaseRole } from "@/lib/with-database-role";

const ator: AuthenticatedUser = { id: "teste-integracao", name: "Teste", role: "ADMIN" };
const sufixo = `it${Date.now()}`;
const ids = {
  fio: `mat-${sufixo}-fio`,
  ziper: `mat-${sufixo}-zip`,
  loteAntigo: `lot-${sufixo}-a`,
  loteNovo: `lot-${sufixo}-b`,
  loteZiper: `lot-${sufixo}-z`,
  bolsa: `prod-${sufixo}-bolsa`,
  avulso: `prod-${sufixo}-avulso`,
  receita: `rec-${sufixo}`,
};
const codigosCriados: string[] = [];
const idsDePedidos: string[] = [];

async function saldo(materialId: string): Promise<number> {
  const lotes = await getDb().$transaction(async (t) => {
    await t.$queryRaw`SELECT set_config('app.role', 'ADMIN', true)`;
    return t.materialLot.findMany({ where: { materialId } });
  });
  return lotes.reduce((soma, lote) => soma + lote.quantityOnHand.toNumber(), 0);
}

async function novoPedido(produtoId: string, quantidade: number) {
  const { codigo } = await criarPedido(
    ator,
    { cliente: "Cliente de teste", contato: null, entregaPrevista: null, itens: [{ produtoId, quantidade }] },
    "AWAITING_PRODUCTION",
  );
  codigosCriados.push(codigo);
  const { pedidos } = await listarPedidos(ator);
  const pedido = pedidos.find((p) => p.codigo === codigo);
  if (!pedido) throw new Error("pedido não encontrado após criar");
  idsDePedidos.push(pedido.id);
  return pedido;
}

beforeAll(async () => {
  await withDatabaseRole(ator, async (t) => {
    await t.material.create({
      data: { id: ids.fio, name: `Fio ${sufixo}`, kind: "Fios & Lãs", unit: "GRAM", reorderPoint: 10, conePrice: 10, coneYield: 100 },
    });
    await t.material.create({
      data: { id: ids.ziper, name: `Zíper ${sufixo}`, kind: "Aviamentos", unit: "UNIT", reorderPoint: 1 },
    });
    await t.materialLot.create({
      data: { id: ids.loteAntigo, materialId: ids.fio, reference: "Lote antigo", unitCost: 0.1, quantityOnHand: 100, receivedAt: new Date(2026, 0, 1) },
    });
    await t.materialLot.create({
      data: { id: ids.loteNovo, materialId: ids.fio, reference: "Lote novo", unitCost: 0.2, quantityOnHand: 100, receivedAt: new Date(2026, 5, 1) },
    });
    await t.materialLot.create({
      data: { id: ids.loteZiper, materialId: ids.ziper, reference: "Zíper", unitCost: 3, quantityOnHand: 5 },
    });
    await t.product.create({
      data: { id: ids.bolsa, code: `LUM-P-9${sufixo.slice(-3)}`, name: `Bolsa ${sufixo}`, slug: `bolsa-${sufixo}`, description: "teste", price: 100, status: "ACTIVE", salesModes: ["MADE_TO_ORDER"] },
    });
    await t.product.create({
      data: { id: ids.avulso, code: `LUM-P-8${sufixo.slice(-3)}`, name: `Avulso ${sufixo}`, slug: `avulso-${sufixo}`, description: "teste", price: 50, status: "ACTIVE", salesModes: ["MADE_TO_ORDER"] },
    });
    await t.recipe.create({
      data: {
        id: ids.receita,
        productId: ids.bolsa,
        estimatedMinutes: 120,
        indirectCosts: 4,
        items: { create: [{ materialId: ids.fio, quantity: 30 }, { materialId: ids.ziper, quantity: 1 }] },
      },
    });
  });
});

afterAll(async () => {
  await withDatabaseRole(ator, async (t) => {
    await t.stockMovement.deleteMany({ where: { OR: [{ materialId: { in: [ids.fio, ids.ziper] } }, { orderId: { in: idsDePedidos } }] } });
    await t.orderItem.deleteMany({ where: { orderId: { in: idsDePedidos } } });
    await t.order.deleteMany({ where: { id: { in: idsDePedidos } } });
    await t.recipeItem.deleteMany({ where: { recipeId: ids.receita } });
    await t.recipe.deleteMany({ where: { id: ids.receita } });
    await t.product.deleteMany({ where: { id: { in: [ids.bolsa, ids.avulso] } } });
    await t.materialLot.deleteMany({ where: { materialId: { in: [ids.fio, ids.ziper] } } });
    await t.material.deleteMany({ where: { id: { in: [ids.fio, ids.ziper] } } });

    // devolve o contador ao maior código que sobrou, sem deixar buracos de testes
    const ano = new Date().getFullYear();
    await t.$executeRaw`
      UPDATE order_counters
      SET last_value = COALESCE((SELECT MAX(split_part(code, '-', 3)::int) FROM orders WHERE code LIKE ${`#LUM-${ano}-%`}), 0)
      WHERE year = ${ano}`;
  });
  await getDb().$disconnect();
});

describe("código único do pedido", () => {
  it("gera #LUM-AAAA-XXXX sequencial e nunca repete, mesmo com pedidos simultâneos", async () => {
    const pedidos = await Promise.all(Array.from({ length: 6 }, () => novoPedido(ids.bolsa, 1)));
    const codigos = pedidos.map((p) => p.codigo);

    expect(new Set(codigos).size).toBe(6);
    for (const codigo of codigos) expect(codigo).toMatch(/^#LUM-\d{4}-\d{4,}$/);

    const sequencias = codigos.map((c) => Number(c.split("-")[2])).sort((a, b) => a - b);
    expect(sequencias[5] - sequencias[0]).toBe(5);
  });
});

describe("baixa automática ao entrar em confecção", () => {
  it("baixa os materiais da ficha técnica pelo lote mais antigo e registra a rastreabilidade", async () => {
    const antes = { fio: await saldo(ids.fio), ziper: await saldo(ids.ziper) };
    const pedido = await novoPedido(ids.bolsa, 2); // 2 × (30 g de fio + 1 zíper)

    const resultado = await alterarStatusDoPedido(ator, pedido.id, "IN_PRODUCTION");

    expect(resultado.baixas).toBe(2);
    expect(await saldo(ids.fio)).toBe(antes.fio - 60);
    expect(await saldo(ids.ziper)).toBe(antes.ziper - 2);

    const lotes = await getDb().$transaction(async (t) => {
      await t.$queryRaw`SELECT set_config('app.role', 'ADMIN', true)`;
      return t.materialLot.findMany({ where: { materialId: ids.fio }, orderBy: { receivedAt: "asc" } });
    });
    expect(lotes[0].quantityOnHand.toNumber()).toBe(40); // lote antigo consumido primeiro
    expect(lotes[1].quantityOnHand.toNumber()).toBe(100);

    const historico = await listarHistoricoDoInsumo(ator, ids.fio);
    const baixa = historico.find((h) => h.codigoPedido === pedido.codigo);
    expect(baixa).toMatchObject({ tipo: "SAIDA_PRODUCAO", quantidade: -60, saldoApos: antes.fio - 60 });
  });

  it("não baixa duas vezes: uma segunda transição para confecção é recusada", async () => {
    const pedido = await novoPedido(ids.bolsa, 1);
    await alterarStatusDoPedido(ator, pedido.id, "IN_PRODUCTION");
    const saldoDepois = await saldo(ids.fio);

    await expect(alterarStatusDoPedido(ator, pedido.id, "IN_PRODUCTION")).rejects.toBeInstanceOf(ErroDeNegocio);
    expect(await saldo(ids.fio)).toBe(saldoDepois);
  });

  it("recusa a transição e não altera nada quando falta material", async () => {
    const saldoAntes = { fio: await saldo(ids.fio), ziper: await saldo(ids.ziper) };
    const pedido = await novoPedido(ids.bolsa, 50); // 1500 g de fio e 50 zíperes

    await expect(alterarStatusDoPedido(ator, pedido.id, "IN_PRODUCTION")).rejects.toThrow(/Estoque insuficiente/);

    expect(await saldo(ids.fio)).toBe(saldoAntes.fio);
    expect(await saldo(ids.ziper)).toBe(saldoAntes.ziper);
    const { pedidos } = await listarPedidos(ator);
    expect(pedidos.find((p) => p.id === pedido.id)?.status).toBe("AWAITING_PRODUCTION");
  });

  it("recusa produto sem ficha técnica", async () => {
    const pedido = await novoPedido(ids.avulso, 1);
    await expect(alterarStatusDoPedido(ator, pedido.id, "IN_PRODUCTION")).rejects.toThrow(/Sem ficha técnica/);
  });

  it("recusa transições fora do fluxo", async () => {
    const pedido = await novoPedido(ids.bolsa, 1);
    await expect(alterarStatusDoPedido(ator, pedido.id, "COMPLETED")).rejects.toBeInstanceOf(ErroDeNegocio);
  });
});

describe("entradas e baixas manuais", () => {
  it("recalcula o custo médio ponderado com o novo lote", async () => {
    const antes = (await listarInsumos(ator)).insumos.find((i) => i.id === ids.fio);
    const saldoAntes = antes?.estoqueAtual ?? 0;

    await registrarEntrada(ator, {
      materialId: ids.fio,
      cones: 1,
      precoCone: 30,
      rendimento: 100,
      loteReferencia: "Lote entrada",
      observacao: "teste",
    });

    const depois = (await listarInsumos(ator)).insumos.find((i) => i.id === ids.fio);
    expect(depois?.estoqueAtual).toBe(saldoAntes + 100);
    expect(depois?.lotes?.some((l) => l.referencia === "Lote entrada" && l.custoUnitario === 0.3)).toBe(true);

    const lotes = depois?.lotes ?? [];
    const esperado = lotes.reduce((s, l) => s + l.quantidade * l.custoUnitario, 0) / lotes.reduce((s, l) => s + l.quantidade, 0);
    expect(depois?.custoPonderado).toBeCloseTo(esperado, 5);
  });

  it("baixa manual consome o saldo, aparece no histórico e não passa do saldo", async () => {
    const saldoAntes = await saldo(ids.fio);
    await registrarBaixaManual(ator, { materialId: ids.fio, quantidade: 10, motivo: "perda", observacao: "fio emaranhado" });

    expect(await saldo(ids.fio)).toBe(saldoAntes - 10);
    const historico = await listarHistoricoDoInsumo(ator, ids.fio);
    expect(historico[0]).toMatchObject({ tipo: "SAIDA_PERDA", quantidade: -10 });
    expect(historico[0].observacao).toContain("fio emaranhado");

    await expect(
      registrarBaixaManual(ator, { materialId: ids.fio, quantidade: saldoAntes * 10, motivo: "perda", observacao: "" }),
    ).rejects.toThrow(/Saldo insuficiente/);
    expect(await saldo(ids.fio)).toBe(saldoAntes - 10);
  });

  it("ajuste de inventário é registrado como AJUSTE", async () => {
    await registrarBaixaManual(ator, { materialId: ids.ziper, quantidade: 1, motivo: "ajuste", observacao: "contagem" });
    const historico = await listarHistoricoDoInsumo(ator, ids.ziper);
    expect(historico[0].tipo).toBe("AJUSTE");
  });
});

describe("ficha técnica por código", () => {
  it("puxa a ficha de um pedido com os custos vigentes do estoque", async () => {
    const pedido = await novoPedido(ids.bolsa, 3);
    const ficha = await buscarFichaPorCodigo(ator, pedido.codigo.toLowerCase());

    expect(ficha.tipo).toBe("pedido");
    expect(ficha.codigo).toBe(pedido.codigo);
    expect(ficha.valorDoPedido).toBe(300);
    expect(ficha.tempoMinutos).toBe(360); // 3 × 120 min
    expect(ficha.custosIndiretos).toBe(12); // 3 × R$ 4
    expect(ficha.itens.find((i) => i.materialId === ids.fio)?.quantidade).toBe(90);
    expect(ficha.itens.find((i) => i.materialId === ids.ziper)?.quantidade).toBe(3);

    const insumos = (await listarInsumos(ator)).insumos.find((i) => i.id === ids.fio);
    const fio = ficha.itens.find((i) => i.materialId === ids.fio);
    expect(fio?.custoUnitario).toBe(insumos?.custoPonderado);
    expect(ficha.custoInsumos).toBeCloseTo((fio?.custo ?? 0) + 3 * 3, 5);
  });

  it("puxa a ficha de um produto pelo código do produto", async () => {
    const { pedidos, produtos } = await listarPedidos(ator);
    expect(pedidos.length).toBeGreaterThan(0);
    const bolsa = produtos.find((p) => p.id === ids.bolsa);

    const ficha = await buscarFichaPorCodigo(ator, bolsa?.codigo ?? "");
    expect(ficha.tipo).toBe("produto");
    expect(ficha.produtos).toEqual([{ nome: `Bolsa ${sufixo}`, quantidade: 1 }]);
    expect(ficha.tempoMinutos).toBe(120);
  });

  it("recusa códigos inválidos e inexistentes", async () => {
    await expect(buscarFichaPorCodigo(ator, "abc")).rejects.toThrow(/Código inválido/);
    await expect(buscarFichaPorCodigo(ator, "#LUM-2026-99999")).rejects.toThrow(/não encontrado/);
    await expect(buscarFichaPorCodigo(ator, "LUM-P-99999")).rejects.toThrow(/não encontrado/);
  });
});
