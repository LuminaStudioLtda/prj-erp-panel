import "server-only";

import { Prisma } from "@/generated/prisma/client";
import {
  arredondarQuantidade,
  distribuirSaidaFifo,
  totalEmEstoque,
  type LoteDeEstoque,
} from "@/features/insumos/services/estoque-calculos";
import type { MotivoDoBanco } from "@/features/insumos/services/movimentacao";
import { ErroDeNegocio } from "@/lib/erro-de-negocio";

type Transacao = Prisma.TransactionClient;

/** Trava as linhas dos materiais até o fim da transação, evitando duas baixas simultâneas no mesmo saldo. */
export async function bloquearMateriais(transacao: Transacao, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const ordenados = [...new Set(ids)].sort();
  await transacao.$queryRaw`SELECT id FROM materials WHERE id IN (${Prisma.join(ordenados)}) ORDER BY id FOR UPDATE`;
}

export async function lerLotes(transacao: Transacao, materialId: string): Promise<LoteDeEstoque[]> {
  const lotes = await transacao.materialLot.findMany({ where: { materialId } });
  return lotes.map((lote) => ({
    id: lote.id,
    quantidade: lote.quantityOnHand.toNumber(),
    custoUnitario: lote.unitCost.toNumber(),
    recebidoEm: lote.receivedAt,
  }));
}

export type SaidaDeMaterial = {
  materialId: string;
  quantidade: number;
  motivo: Extract<MotivoDoBanco, "LOSS" | "ADJUSTMENT" | "ORDER" | "PRODUCTION">;
  origem: string;
  observacao?: string | null;
  pedidoId?: string | null;
};

/**
 * Baixa o material pelos lotes mais antigos primeiro, gravando uma movimentação por lote.
 * Exige que o material já esteja travado (`bloquearMateriais`). Lança `ErroDeNegocio` se o saldo não cobrir.
 */
export async function consumirMaterial(transacao: Transacao, saida: SaidaDeMaterial): Promise<void> {
  const lotes = await lerLotes(transacao, saida.materialId);
  const { consumo, faltante } = distribuirSaidaFifo(lotes, saida.quantidade);
  if (faltante > 0) {
    throw new ErroDeNegocio(
      `Saldo insuficiente: faltam ${faltante.toLocaleString("pt-BR")} para concluir a baixa.`,
    );
  }

  let saldo = totalEmEstoque(lotes);
  for (const item of consumo) {
    saldo = arredondarQuantidade(saldo - item.quantidade);
    await transacao.materialLot.update({
      where: { id: item.loteId },
      data: { quantityOnHand: { decrement: item.quantidade } },
    });
    await transacao.stockMovement.create({
      data: {
        materialId: saida.materialId,
        materialLotId: item.loteId,
        orderId: saida.pedidoId ?? null,
        reason: saida.motivo,
        origin: saida.origem,
        note: saida.observacao ?? null,
        quantityDelta: -item.quantidade,
        resultingStock: saldo,
      },
    });
  }
}

