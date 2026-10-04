import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { bloquearMateriais, consumirMaterial, lerLotes } from "@/features/insumos/services/estoque-db";
import { totalEmEstoque } from "@/features/insumos/services/estoque-calculos";
import {
  calcularNecessidadeDeMateriais,
  descreverFaltas,
  encontrarFaltas,
  type SaldoDeMaterial,
} from "@/features/pedidos/services/baixa-estoque";
import { formatarCodigoDoPedido } from "@/features/pedidos/services/codigo-pedido";
import { disparaBaixaDeEstoque, podeTransicionar, ROTULO_DO_STATUS } from "@/features/pedidos/services/pedido-status";
import type {
  NovoPedidoValidado,
  PedidoDaLista,
  ProdutoParaPedido,
  StatusDoPedido,
} from "@/features/pedidos/types";
import type { AuthenticatedUser } from "@/features/rbac/types";
import { ErroDeNegocio } from "@/lib/erro-de-negocio";
import { withDatabaseRole } from "@/lib/with-database-role";

type PedidoComItens = Prisma.OrderGetPayload<{ include: { items: true } }>;

function paraPedidoDaLista(pedido: PedidoComItens): PedidoDaLista {
  return {
    id: pedido.id,
    codigo: pedido.code ?? `#${pedido.id.slice(0, 8)}`,
    cliente: pedido.customerName,
    contato: pedido.customerContact,
    status: pedido.status,
    total: pedido.total.toNumber(),
    criadoEm: pedido.createdAt,
    entregaPrevista: pedido.expectedDeliveryAt,
    itens: pedido.items.map((item) => ({
      produtoId: item.productId,
      nome: item.productName,
      quantidade: item.quantity,
      precoUnitario: item.unitPrice.toNumber(),
    })),
  };
}

function paraProdutoParaPedido(produto: Prisma.ProductGetPayload<object>): ProdutoParaPedido {
  return {
    id: produto.id,
    codigo: produto.code ?? "",
    nome: produto.name,
    preco: produto.price.toNumber(),
    diasDeConfeccao: produto.madeToOrderDays,
  };
}

export async function listarProdutosParaPedido(ator: AuthenticatedUser): Promise<ProdutoParaPedido[]> {
  const produtos = await withDatabaseRole(ator, (transacao) =>
    transacao.product.findMany({
      where: { code: { not: null }, status: { not: "ARCHIVED" } },
      orderBy: { name: "asc" },
    }),
  );
  return produtos.map(paraProdutoParaPedido);
}

export type PedidosLidos = {
  pedidos: PedidoDaLista[];
  produtos: ProdutoParaPedido[];
  bancoDisponivel: boolean;
};

export async function listarPedidos(ator: AuthenticatedUser | null): Promise<PedidosLidos> {
  try {
    const [pedidos, produtos] = await withDatabaseRole(ator, (transacao) =>
      Promise.all([
        transacao.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 300 }),
        transacao.product.findMany({
          where: { code: { not: null }, status: { not: "ARCHIVED" } },
          orderBy: { name: "asc" },
        }),
      ]),
    );

    return {
      pedidos: pedidos.map(paraPedidoDaLista),
      produtos: produtos.map(paraProdutoParaPedido),
      bancoDisponivel: true,
    };
  } catch {
    return { pedidos: [], produtos: [], bancoDisponivel: false };
  }
}

/** Próximo código do ano, incrementado de forma atômica (sem repetir mesmo com pedidos simultâneos). */
async function proximoCodigo(transacao: Prisma.TransactionClient, ano: number): Promise<string> {
  const [linha] = await transacao.$queryRaw<{ last_value: number }[]>`
    INSERT INTO order_counters (year, last_value) VALUES (${ano}, 1)
    ON CONFLICT (year) DO UPDATE SET last_value = order_counters.last_value + 1
    RETURNING last_value`;
  return formatarCodigoDoPedido(ano, Number(linha.last_value));
}

export async function criarPedido(
  ator: AuthenticatedUser,
  pedido: NovoPedidoValidado,
  status: Extract<StatusDoPedido, "DRAFT" | "AWAITING_PRODUCTION">,
): Promise<{ codigo: string }> {
  return withDatabaseRole(ator, async (transacao) => {
    const produtos = await transacao.product.findMany({
      where: { id: { in: pedido.itens.map((item) => item.produtoId) }, status: { not: "ARCHIVED" } },
    });

    const itens = pedido.itens.map((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      if (!produto) throw new ErroDeNegocio("Um dos produtos escolhidos não está mais disponível.");
      return { produto, quantidade: item.quantidade };
    });

    const total = itens.reduce((soma, item) => soma + item.produto.price.toNumber() * item.quantidade, 0);
    const codigo = await proximoCodigo(transacao, new Date().getFullYear());

    await transacao.order.create({
      data: {
        code: codigo,
        customerName: pedido.cliente,
        customerEmail: pedido.contato?.includes("@") ? pedido.contato : "",
        customerContact: pedido.contato,
        expectedDeliveryAt: pedido.entregaPrevista,
        status,
        total: Math.round((total + Number.EPSILON) * 100) / 100,
        items: {
          create: itens.map((item) => ({
            productId: item.produto.id,
            productName: item.produto.name,
            quantity: item.quantidade,
            unitPrice: item.produto.price,
          })),
        },
      },
    });

    return { codigo };
  });
}

/**
 * Muda o status do pedido. Ao entrar em confecção, baixa no estoque os materiais da ficha técnica
 * de cada produto (quantidade da ficha × quantidade do pedido), tudo na mesma transação: se
 * faltar material ou ficha técnica, nada é alterado.
 */
export async function alterarStatusDoPedido(
  ator: AuthenticatedUser,
  pedidoId: string,
  para: StatusDoPedido,
): Promise<{ codigo: string; baixas: number }> {
  return withDatabaseRole(ator, async (transacao) => {
    const pedido = await transacao.order.findUnique({ where: { id: pedidoId }, include: { items: true } });
    if (!pedido) throw new ErroDeNegocio("Pedido não encontrado.");

    const de = pedido.status;
    const codigo = pedido.code ?? pedido.id;
    if (!podeTransicionar(de, para)) {
      throw new ErroDeNegocio(`Não é possível mudar de "${ROTULO_DO_STATUS[de]}" para "${ROTULO_DO_STATUS[para]}".`);
    }

    let baixas = 0;
    if (disparaBaixaDeEstoque(de, para)) {
      const jaBaixado = await transacao.stockMovement.count({ where: { orderId: pedido.id, reason: "ORDER" } });
      if (jaBaixado === 0) baixas = await baixarMateriaisDoPedido(transacao, pedido, codigo);
    }

    const { count } = await transacao.order.updateMany({ where: { id: pedido.id, status: de }, data: { status: para } });
    if (count === 0) throw new ErroDeNegocio("O pedido foi alterado por outra pessoa. Atualize a página e tente de novo.");

    return { codigo, baixas };
  });
}

async function baixarMateriaisDoPedido(
  transacao: Prisma.TransactionClient,
  pedido: PedidoComItens,
  codigo: string,
): Promise<number> {
  const produtoIds = pedido.items.flatMap((item) => (item.productId ? [item.productId] : []));
  const receitas = await transacao.recipe.findMany({
    where: { productId: { in: produtoIds } },
    include: { items: true },
  });

  const { porMaterial, produtosSemFicha } = calcularNecessidadeDeMateriais(
    pedido.items.map((item) => ({ produtoId: item.productId, nome: item.productName, quantidade: item.quantity })),
    receitas.map((receita) => ({
      produtoId: receita.productId,
      itens: receita.items.map((item) => ({ materialId: item.materialId, quantidade: item.quantity.toNumber() })),
    })),
  );
  if (produtosSemFicha.length > 0) {
    throw new ErroDeNegocio(`Sem ficha técnica cadastrada: ${produtosSemFicha.join(", ")}.`);
  }

  const materialIds = [...porMaterial.keys()];
  await bloquearMateriais(transacao, materialIds);

  const materiais = await transacao.material.findMany({ where: { id: { in: materialIds } } });
  const saldos: SaldoDeMaterial[] = [];
  for (const material of materiais) {
    saldos.push({
      materialId: material.id,
      nome: material.name,
      unidade: material.unit,
      disponivel: totalEmEstoque(await lerLotes(transacao, material.id)),
    });
  }

  const faltas = encontrarFaltas(porMaterial, saldos);
  if (faltas.length > 0) throw new ErroDeNegocio(`Estoque insuficiente: ${descreverFaltas(faltas)}.`);

  for (const [materialId, quantidade] of porMaterial) {
    await consumirMaterial(transacao, {
      materialId,
      quantidade,
      motivo: "ORDER",
      origem: `Pedido ${codigo}`,
      observacao: "Baixa automática ao entrar em confecção",
      pedidoId: pedido.id,
    });
  }
  return porMaterial.size;
}
