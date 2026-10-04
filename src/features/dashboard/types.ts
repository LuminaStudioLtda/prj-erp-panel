import type { Status } from "@/components/StatusBadge";
import type { StatusDoPedido } from "@/features/pedidos/types";

export type PedidoResumo = {
  id: string;
  cliente: string;
  status: StatusDoPedido;
  total: number;
  criadoEm: Date;
  itens: { nome: string; quantidade: number }[];
};

export type ResumoDoMes = {
  faturamento: number;
  faturamentoMesAnterior: number;
  /** Variação como fração (0,12 = +12%); `null` quando o mês anterior não teve faturamento. */
  variacao: number | null;
  emProducao: { pedidos: number; pecas: number };
  aguardandoPagamento: { pedidos: number; total: number };
};

export type LinhaDaFila = {
  id: string;
  peca: string;
  cliente: string;
  criadoEm: Date;
  status: Extract<StatusDoPedido, "IN_PRODUCTION" | "READY_TO_SHIP">;
};

export type FioEmDestaque = {
  id: string;
  nome: string;
  cor: string;
  estoqueAtual: number;
  unidade: string;
  status: Status;
  /** Nível da barra, de 0 a 1. */
  nivel: number;
};

export type SerieDeFaturamento = {
  /** Faturamento acumulado por dia do mês atual, do dia 1 até hoje (índice 0 = dia 1). */
  atual: number[];
  /** Faturamento acumulado por dia do mês anterior, mês inteiro. */
  anterior: number[];
};

export type PedidosPorStatus = {
  status: StatusDoPedido;
  rotulo: string;
  quantidade: number;
};
