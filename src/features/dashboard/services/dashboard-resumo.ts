import { capacidadeDeReferencia, statusDoEstoque } from "@/features/insumos/services/insumo-estoque";
import type { InsumoEmEstoque } from "@/features/insumos/types";
import type {
  FioEmDestaque,
  LinhaDaFila,
  PedidoResumo,
  PedidosPorStatus,
  ResumoDoMes,
  SerieDeFaturamento,
} from "@/features/dashboard/types";
import { ORDEM_DOS_STATUS, ROTULO_DO_STATUS } from "@/features/pedidos/services/pedido-status";
import type { StatusDoPedido } from "@/features/pedidos/types";

/** Rascunhos, pedidos ainda não pagos e cancelados: não entram no faturamento. */
const FORA_DO_FATURAMENTO: readonly StatusDoPedido[] = ["DRAFT", "AWAITING_PAYMENT", "CANCELLED"];

export function inicioDoMes(data: Date, deslocamentoEmMeses = 0): Date {
  return new Date(data.getFullYear(), data.getMonth() + deslocamentoEmMeses, 1);
}

function somarFaturamento(pedidos: PedidoResumo[], inicio: Date, fim: Date): number {
  return pedidos
    .filter(
      (pedido) =>
        !FORA_DO_FATURAMENTO.includes(pedido.status) && pedido.criadoEm >= inicio && pedido.criadoEm < fim,
    )
    .reduce((soma, pedido) => soma + pedido.total, 0);
}

export function calcularResumoDoMes(pedidos: PedidoResumo[], agora: Date): ResumoDoMes {
  const inicioAtual = inicioDoMes(agora);
  const inicioProximo = inicioDoMes(agora, 1);
  const inicioAnterior = inicioDoMes(agora, -1);

  const faturamento = somarFaturamento(pedidos, inicioAtual, inicioProximo);
  const faturamentoMesAnterior = somarFaturamento(pedidos, inicioAnterior, inicioAtual);

  const emProducao = pedidos.filter((pedido) => pedido.status === "IN_PRODUCTION");
  const aguardando = pedidos.filter((pedido) => pedido.status === "AWAITING_PAYMENT");

  return {
    faturamento,
    faturamentoMesAnterior,
    variacao: faturamentoMesAnterior > 0 ? faturamento / faturamentoMesAnterior - 1 : null,
    emProducao: {
      pedidos: emProducao.length,
      pecas: emProducao.reduce(
        (soma, pedido) => soma + pedido.itens.reduce((parcial, item) => parcial + item.quantidade, 0),
        0,
      ),
    },
    aguardandoPagamento: {
      pedidos: aguardando.length,
      total: aguardando.reduce((soma, pedido) => soma + pedido.total, 0),
    },
  };
}

/** Pedidos em confecção ou prontos para envio, do mais antigo para o mais recente. */
export function montarFilaDeConfeccao(pedidos: PedidoResumo[], limite = 5): LinhaDaFila[] {
  return pedidos
    .filter(
      (pedido): pedido is PedidoResumo & { status: LinhaDaFila["status"] } =>
        pedido.status === "IN_PRODUCTION" || pedido.status === "READY_TO_SHIP",
    )
    .sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())
    .slice(0, limite)
    .map((pedido) => {
      const [primeiro, ...demais] = pedido.itens;
      return {
        id: pedido.id,
        peca: primeiro ? (demais.length > 0 ? `${primeiro.nome} +${demais.length}` : primeiro.nome) : "Pedido sem itens",
        cliente: pedido.cliente,
        criadoEm: pedido.criadoEm,
        status: pedido.status,
      };
    });
}

/** Fios ordenados do estoque mais próximo do ponto de pedido para o mais folgado. */
export function listarFiosEmDestaque(insumos: InsumoEmEstoque[], limite = 5): FioEmDestaque[] {
  const razao = (insumo: InsumoEmEstoque) => insumo.estoqueAtual / insumo.pontoPedido;

  return insumos
    .filter((insumo) => insumo.categoria === "fio")
    .sort((a, b) => razao(a) - razao(b))
    .slice(0, limite)
    .map((insumo) => ({
      id: insumo.id,
      nome: insumo.nomeComercial,
      cor: insumo.cor,
      estoqueAtual: insumo.estoqueAtual,
      unidade: insumo.unidade,
      status: statusDoEstoque(insumo.estoqueAtual, insumo.pontoPedido),
      nivel: Math.min(1, insumo.estoqueAtual / capacidadeDeReferencia(insumo.pontoPedido)),
    }));
}

export function contarAlertasDeFios(insumos: InsumoEmEstoque[]): number {
  return insumos.filter(
    (insumo) => insumo.categoria === "fio" && statusDoEstoque(insumo.estoqueAtual, insumo.pontoPedido) !== "ok",
  ).length;
}

function acumularPorDia(pedidos: PedidoResumo[], inicio: Date, dias: number): number[] {
  const porDia = new Array<number>(dias).fill(0);
  for (const pedido of pedidos) {
    if (FORA_DO_FATURAMENTO.includes(pedido.status)) continue;
    const { criadoEm } = pedido;
    if (criadoEm.getFullYear() === inicio.getFullYear() && criadoEm.getMonth() === inicio.getMonth()) {
      const indice = criadoEm.getDate() - 1;
      if (indice < dias) porDia[indice] += pedido.total;
    }
  }
  return porDia.reduce<number[]>((acumulado, valor, i) => [...acumulado, (acumulado[i - 1] ?? 0) + valor], []);
}

export function calcularSerieDeFaturamento(pedidos: PedidoResumo[], agora: Date): SerieDeFaturamento {
  const inicioAtual = inicioDoMes(agora);
  const inicioAnterior = inicioDoMes(agora, -1);
  const diasDoMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0).getDate();

  return {
    atual: acumularPorDia(pedidos, inicioAtual, agora.getDate()),
    anterior: acumularPorDia(pedidos, inicioAnterior, diasDoMesAnterior),
  };
}

export function contarPedidosPorStatus(pedidos: PedidoResumo[]): PedidosPorStatus[] {
  return ORDEM_DOS_STATUS.map((status) => ({
    status,
    rotulo: ROTULO_DO_STATUS[status],
    quantidade: pedidos.filter((pedido) => pedido.status === status).length,
  }));
}
