import "server-only";

import { custoMedioPonderado } from "@/features/insumos/services/estoque-calculos";
import {
  consolidarFicha,
  type MaterialDaFicha,
  type ProdutoParaFicha,
} from "@/features/ficha-tecnica/services/ficha-por-codigo";
import type { FichaPorCodigo } from "@/features/ficha-tecnica/types";
import { normalizarCodigoDoPedido, normalizarCodigoDoProduto } from "@/features/pedidos/services/codigo-pedido";
import type { AuthenticatedUser } from "@/features/rbac/types";
import { ErroDeNegocio } from "@/lib/erro-de-negocio";
import { withDatabaseRole } from "@/lib/with-database-role";

const INCLUIR_RECEITA = {
  recipe: { include: { items: { include: { material: { include: { lots: true } } } } } },
} as const;

function unidadeDaFicha(unidade: string): MaterialDaFicha["unidade"] {
  return unidade === "GRAM" ? "g" : unidade === "METER" ? "m" : "un";
}

type ProdutoComReceita = Awaited<ReturnType<typeof buscarProdutos>>[number];

async function buscarProdutos(ator: AuthenticatedUser | null, ids: string[]) {
  return withDatabaseRole(ator, (transacao) =>
    transacao.product.findMany({ where: { id: { in: ids } }, include: INCLUIR_RECEITA }),
  );
}

/** Custo vigente: média ponderada dos lotes com saldo; sem saldo, o custo do lote mais recente. */
function custoVigente(material: NonNullable<ProdutoComReceita["recipe"]>["items"][number]["material"]): number | null {
  const lotes = material.lots.map((lote) => ({
    id: lote.id,
    quantidade: lote.quantityOnHand.toNumber(),
    custoUnitario: lote.unitCost.toNumber(),
    recebidoEm: lote.receivedAt,
  }));
  const ponderado = custoMedioPonderado(lotes);
  if (ponderado !== null) return ponderado;

  const maisRecente = [...lotes].sort((a, b) => b.recebidoEm.getTime() - a.recebidoEm.getTime())[0];
  return maisRecente ? maisRecente.custoUnitario : null;
}

function paraProdutoParaFicha(produto: ProdutoComReceita, quantidade: number): ProdutoParaFicha {
  const receita = produto.recipe;
  return {
    nome: produto.name,
    quantidade,
    receita:
      receita && receita.items.length > 0
        ? {
            minutos: receita.estimatedMinutes,
            indiretos: receita.indirectCosts.toNumber(),
            itens: receita.items.map((item) => ({
              materialId: item.materialId,
              nome: item.material.name,
              unidade: unidadeDaFicha(item.material.unit),
              quantidade: item.quantity.toNumber(),
              custoUnitario: custoVigente(item.material),
            })),
          }
        : null,
  };
}

export async function buscarFichaPorCodigo(
  ator: AuthenticatedUser | null,
  codigoDigitado: string,
): Promise<FichaPorCodigo> {
  const codigoPedido = normalizarCodigoDoPedido(codigoDigitado);
  const codigoProduto = codigoPedido ? null : normalizarCodigoDoProduto(codigoDigitado);
  if (!codigoPedido && !codigoProduto) {
    throw new ErroDeNegocio("Código inválido. Use o formato #LUM-2026-0001 (pedido) ou LUM-P-0001 (produto).");
  }

  if (codigoPedido) {
    const pedido = await withDatabaseRole(ator, (transacao) =>
      transacao.order.findUnique({ where: { code: codigoPedido }, include: { items: true } }),
    );
    if (!pedido) throw new ErroDeNegocio(`Pedido ${codigoPedido} não encontrado.`);

    const produtoIds = pedido.items.flatMap((item) => (item.productId ? [item.productId] : []));
    const produtos = await buscarProdutos(ator, produtoIds);

    const consolidada = consolidarFicha(
      pedido.items.map((item): ProdutoParaFicha => {
        const produto = produtos.find((p) => p.id === item.productId);
        return produto
          ? paraProdutoParaFicha(produto, item.quantity)
          : { nome: item.productName, quantidade: item.quantity, receita: null };
      }),
    );

    return {
      tipo: "pedido",
      codigo: codigoPedido,
      descricao: `Pedido de ${pedido.customerName}`,
      valorDoPedido: pedido.total.toNumber(),
      ...consolidada,
    };
  }

  const produto = await withDatabaseRole(ator, (transacao) =>
    transacao.product.findUnique({ where: { code: codigoProduto! }, include: INCLUIR_RECEITA }),
  );
  if (!produto) throw new ErroDeNegocio(`Produto ${codigoProduto} não encontrado.`);

  return {
    tipo: "produto",
    codigo: codigoProduto!,
    descricao: produto.name,
    valorDoPedido: null,
    ...consolidarFicha([paraProdutoParaFicha(produto, 1)]),
  };
}

export type SugestaoDeCodigo = { codigo: string; descricao: string };

/** Códigos recentes de pedidos e todos os de produtos, para o campo de busca sugerir. */
export async function listarSugestoesDeCodigo(ator: AuthenticatedUser | null): Promise<SugestaoDeCodigo[]> {
  try {
    const [pedidos, produtos] = await withDatabaseRole(ator, (transacao) =>
      Promise.all([
        transacao.order.findMany({
          where: { code: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { code: true, customerName: true },
        }),
        transacao.product.findMany({
          where: { code: { not: null }, status: { not: "ARCHIVED" } },
          orderBy: { name: "asc" },
          select: { code: true, name: true },
        }),
      ]),
    );

    return [
      ...pedidos.map((pedido) => ({ codigo: pedido.code ?? "", descricao: `Pedido · ${pedido.customerName}` })),
      ...produtos.map((produto) => ({ codigo: produto.code ?? "", descricao: `Produto · ${produto.name}` })),
    ];
  } catch {
    return [];
  }
}
