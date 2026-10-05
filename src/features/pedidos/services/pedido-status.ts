import type { StatusDoPedido } from "@/features/pedidos/types";

export const ROTULO_DO_STATUS: Record<StatusDoPedido, string> = {
  DRAFT: "Rascunho",
  AWAITING_PRODUCTION: "Aguardando produção",
  AWAITING_PAYMENT: "Aguardando pagamento",
  IN_PRODUCTION: "Em confecção",
  READY_TO_SHIP: "Pronto p/ envio",
  SHIPPED: "Enviado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

/** Ordem em que os status aparecem em filtros e legendas. */
export const ORDEM_DOS_STATUS: StatusDoPedido[] = [
  "DRAFT",
  "AWAITING_PAYMENT",
  "AWAITING_PRODUCTION",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

const TRANSICOES: Record<StatusDoPedido, StatusDoPedido[]> = {
  DRAFT: ["AWAITING_PRODUCTION", "CANCELLED"],
  AWAITING_PAYMENT: ["AWAITING_PRODUCTION", "CANCELLED"],
  AWAITING_PRODUCTION: ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION: ["READY_TO_SHIP", "SHIPPED", "CANCELLED"],
  READY_TO_SHIP: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function transicoesPermitidas(status: StatusDoPedido): StatusDoPedido[] {
  return TRANSICOES[status];
}

export function podeTransicionar(de: StatusDoPedido, para: StatusDoPedido): boolean {
  return TRANSICOES[de].includes(para);
}

/** A baixa de materiais acontece uma única vez, na entrada em confecção. */
export function disparaBaixaDeEstoque(de: StatusDoPedido, para: StatusDoPedido): boolean {
  return para === "IN_PRODUCTION" && de !== "IN_PRODUCTION";
}

/** Pedidos que ainda não foram entregues nem cancelados. */
export const STATUS_EM_ABERTO: StatusDoPedido[] = [
  "AWAITING_PAYMENT",
  "AWAITING_PRODUCTION",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "SHIPPED",
];

export type EtapaSeguinte = { para: StatusDoPedido; rotulo: string };

/** Ação principal oferecida na lista para cada status (o cancelamento é uma ação à parte). */
export function proximaEtapa(status: StatusDoPedido): EtapaSeguinte | null {
  switch (status) {
    case "DRAFT":
    case "AWAITING_PAYMENT":
      return { para: "AWAITING_PRODUCTION", rotulo: "Confirmar pedido" };
    case "AWAITING_PRODUCTION":
      return { para: "IN_PRODUCTION", rotulo: "Iniciar confecção" };
    case "IN_PRODUCTION":
    case "READY_TO_SHIP":
      return { para: "SHIPPED", rotulo: "Marcar como enviado" };
    case "SHIPPED":
      return { para: "COMPLETED", rotulo: "Concluir" };
    case "COMPLETED":
    case "CANCELLED":
      return null;
  }
}
