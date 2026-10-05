import { STATUS_EM_ABERTO } from "@/features/pedidos/services/pedido-status";
import type { PedidoDaLista, StatusDoPedido } from "@/features/pedidos/types";

export type IndicadoresDePedidos = {
  total: number;
  emConfeccao: number;
  entregasDoMes: number;
  /** Soma dos pedidos em aberto: ainda não concluídos, cancelados nem em rascunho. */
  faturamentoPrevisto: number;
};

function mesmoMes(data: Date, referencia: Date): boolean {
  return data.getFullYear() === referencia.getFullYear() && data.getMonth() === referencia.getMonth();
}

export function calcularIndicadoresDePedidos(pedidos: PedidoDaLista[], agora: Date): IndicadoresDePedidos {
  return {
    total: pedidos.length,
    emConfeccao: pedidos.filter((pedido) => pedido.status === "IN_PRODUCTION").length,
    entregasDoMes: pedidos.filter(
      (pedido) =>
        pedido.entregaPrevista !== null &&
        mesmoMes(pedido.entregaPrevista, agora) &&
        pedido.status !== "CANCELLED" &&
        pedido.status !== "DRAFT",
    ).length,
    faturamentoPrevisto: pedidos
      .filter((pedido) => STATUS_EM_ABERTO.includes(pedido.status))
      .reduce((soma, pedido) => soma + pedido.total, 0),
  };
}

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Filtra por status e por texto livre no código, no cliente e nos nomes dos produtos; cada palavra digitada precisa aparecer. */
export function filtrarPedidos(
  pedidos: PedidoDaLista[],
  busca: string,
  status: StatusDoPedido | "todos",
): PedidoDaLista[] {
  const termos = semAcento(busca.trim().replace(/^#/, "")).split(/\s+/).filter(Boolean);

  return pedidos.filter((pedido) => {
    if (status !== "todos" && pedido.status !== status) return false;
    if (termos.length === 0) return true;

    const alvo = semAcento(
      [pedido.codigo.replace(/^#/, ""), pedido.cliente, ...pedido.itens.map((item) => item.nome)].join(" "),
    );
    return termos.every((termo) => alvo.includes(termo));
  });
}

export function contarPorStatus(pedidos: PedidoDaLista[]): Record<StatusDoPedido | "todos", number> {
  const contagem = { todos: pedidos.length } as Record<StatusDoPedido | "todos", number>;
  for (const pedido of pedidos) contagem[pedido.status] = (contagem[pedido.status] ?? 0) + 1;
  return contagem;
}
