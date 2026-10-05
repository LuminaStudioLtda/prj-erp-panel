import "server-only";

import { inicioDoMes } from "@/features/dashboard/services/dashboard-resumo";
import type { PedidoResumo } from "@/features/dashboard/types";
import type { StatusDoPedido } from "@/features/pedidos/types";
import type { AuthenticatedUser } from "@/features/rbac/types";
import { withDatabaseRole } from "@/lib/with-database-role";

const STATUS_ABERTOS: StatusDoPedido[] = ["AWAITING_PAYMENT", "AWAITING_PRODUCTION", "IN_PRODUCTION", "READY_TO_SHIP"];

export type PedidosLidos = {
  pedidos: PedidoResumo[];
  /** `false` quando o banco não respondeu: o dashboard mostra o aviso em vez de zeros. */
  bancoDisponivel: boolean;
};

/** Pedidos do mês atual e do anterior (para a variação) mais todos os que ainda estão em aberto. */
export async function listarPedidosDoDashboard(
  ator: AuthenticatedUser | null,
  agora: Date,
): Promise<PedidosLidos> {
  try {
    const registros = await withDatabaseRole(ator, (transacao) =>
      transacao.order.findMany({
        where: {
          OR: [{ createdAt: { gte: inicioDoMes(agora, -1) } }, { status: { in: STATUS_ABERTOS } }],
        },
        include: { items: { select: { productName: true, quantity: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    );

    return {
      bancoDisponivel: true,
      pedidos: registros.map((pedido) => ({
        id: pedido.id,
        cliente: pedido.customerName,
        status: pedido.status,
        total: pedido.total.toNumber(),
        criadoEm: pedido.createdAt,
        itens: pedido.items.map((item) => ({ nome: item.productName, quantidade: item.quantity })),
      })),
    };
  } catch {
    return { pedidos: [], bancoDisponivel: false };
  }
}
