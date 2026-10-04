const CASAS_DO_CUSTO = 5;
const CASAS_DA_QUANTIDADE = 3;

export type LoteDeEstoque = {
  id: string;
  quantidade: number;
  /** R$ por grama, metro ou unidade, com até 5 casas decimais. */
  custoUnitario: number;
  recebidoEm: Date;
};

export type ConsumoDeLote = { loteId: string; quantidade: number };

function arredondar(valor: number, casas: number): number {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

export function arredondarQuantidade(valor: number): number {
  return arredondar(valor, CASAS_DA_QUANTIDADE);
}

export function arredondarCusto(valor: number): number {
  return arredondar(valor, CASAS_DO_CUSTO);
}

export function totalEmEstoque(lotes: LoteDeEstoque[]): number {
  return arredondarQuantidade(lotes.reduce((soma, lote) => soma + lote.quantidade, 0));
}

/** Custo médio ponderado dos lotes com saldo; `null` quando não há saldo em nenhum lote. */
export function custoMedioPonderado(lotes: LoteDeEstoque[]): number | null {
  const comSaldo = lotes.filter((lote) => lote.quantidade > 0);
  const total = comSaldo.reduce((soma, lote) => soma + lote.quantidade, 0);
  if (total <= 0) return null;

  const valor = comSaldo.reduce((soma, lote) => soma + lote.quantidade * lote.custoUnitario, 0);
  return arredondarCusto(valor / total);
}

export type EntradaDeCones = {
  cones: number;
  /** Preço pago por cone, novelo ou pacote. */
  precoCone: number;
  /** Rendimento de um cone na unidade do insumo (g, m ou un). */
  rendimento: number;
};

/** Quantidade que entra no estoque e o custo unitário do lote: preço do cone ÷ rendimento. */
export function calcularEntrada({ cones, precoCone, rendimento }: EntradaDeCones) {
  const valido = [cones, precoCone, rendimento].every((n) => Number.isFinite(n) && n > 0);
  if (!valido) return null;

  return {
    quantidade: arredondarQuantidade(cones * rendimento),
    custoUnitario: arredondarCusto(precoCone / rendimento),
  };
}

/** Consome os lotes mais antigos primeiro (FIFO). `faltante` é o que o saldo não cobriu. */
export function distribuirSaidaFifo(
  lotes: LoteDeEstoque[],
  quantidade: number,
): { consumo: ConsumoDeLote[]; faltante: number } {
  const ordenados = lotes
    .filter((lote) => lote.quantidade > 0)
    .sort((a, b) => a.recebidoEm.getTime() - b.recebidoEm.getTime());

  const consumo: ConsumoDeLote[] = [];
  let restante = arredondarQuantidade(quantidade);

  for (const lote of ordenados) {
    if (restante <= 0) break;
    const retirada = Math.min(lote.quantidade, restante);
    consumo.push({ loteId: lote.id, quantidade: arredondarQuantidade(retirada) });
    restante = arredondarQuantidade(restante - retirada);
  }

  return { consumo, faltante: Math.max(0, restante) };
}
