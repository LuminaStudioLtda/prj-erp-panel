"use server";

import { revalidatePath } from "next/cache";
import { listarProdutosParaPedido, alterarStatusDoPedido, criarPedido } from "@/features/pedidos/services/pedidos-db";
import { validarNovoPedido } from "@/features/pedidos/services/novo-pedido";
import { ORDEM_DOS_STATUS } from "@/features/pedidos/services/pedido-status";
import type { NovoPedidoFormErrors, NovoPedidoFormValues, StatusDoPedido } from "@/features/pedidos/types";
import { executarAcao } from "@/lib/auth/executar-acao";
import { ErroDeNegocio } from "@/lib/erro-de-negocio";
import type { ResultadoDaAcao } from "@/lib/resultado-da-acao";

function atualizarTelas() {
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/insumos");
  revalidatePath("/admin");
}

export type CriarPedidoResultado = ResultadoDaAcao<{ codigo: string }> & { erros?: NovoPedidoFormErrors };

export async function criarPedidoAction(
  valores: NovoPedidoFormValues,
  status: "DRAFT" | "AWAITING_PRODUCTION",
): Promise<CriarPedidoResultado> {
  let errosDeCampo: NovoPedidoFormErrors | undefined;

  const resultado = await executarAcao("inventory:write", "Não foi possível criar o pedido.", async (ator) => {
    const produtos = await listarProdutosParaPedido(ator);
    const validacao = validarNovoPedido(valores, produtos);
    if (!validacao.pedido) {
      errosDeCampo = validacao.erros;
      throw new ErroDeNegocio("Revise os campos destacados.");
    }

    const criado = await criarPedido(ator, validacao.pedido, status);
    atualizarTelas();
    return criado;
  });

  return errosDeCampo ? { ...resultado, erros: errosDeCampo } : resultado;
}

export async function alterarStatusAction(
  pedidoId: string,
  para: StatusDoPedido,
): Promise<ResultadoDaAcao<{ codigo: string; baixas: number }>> {
  return executarAcao("inventory:write", "Não foi possível alterar o status do pedido.", async (ator) => {
    if (!ORDEM_DOS_STATUS.includes(para)) throw new ErroDeNegocio("Status inválido.");

    const resultado = await alterarStatusDoPedido(ator, pedidoId, para);
    atualizarTelas();
    return resultado;
  });
}
