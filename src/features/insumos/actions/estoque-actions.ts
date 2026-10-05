"use server";

import { revalidatePath } from "next/cache";
import { MOTIVOS_DA_BAIXA, type MotivoDaBaixa } from "@/features/insumos/services/movimentacao";
import { insumoParaValoresDoForm, parseNumeroPtBr, validarInsumoForm } from "@/features/insumos/services/insumo-form";
import {
  cadastrarInsumo,
  listarHistoricoDoInsumo,
  registrarBaixaManual,
  registrarEntrada,
} from "@/features/insumos/services/insumos-db";
import type { InsumoInput, MovimentacaoDeEstoque } from "@/features/insumos/types";
import { executarAcao } from "@/lib/auth/executar-acao";
import { ErroDeNegocio } from "@/lib/erro-de-negocio";
import type { ResultadoDaAcao } from "@/lib/resultado-da-acao";

function atualizarTelas() {
  revalidatePath("/admin/insumos");
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
}

export async function cadastrarInsumoAction(insumo: InsumoInput): Promise<ResultadoDaAcao> {
  return executarAcao("inventory:write", "Não foi possível salvar o insumo. Tente novamente.", async (ator) => {
    const validacao = validarInsumoForm(insumoParaValoresDoForm(insumo));
    if (!validacao.valido) throw new ErroDeNegocio("Os dados do insumo são inválidos.");

    await cadastrarInsumo(ator, validacao.insumo);
    atualizarTelas();
  });
}

export type EntradaForm = {
  materialId: string;
  cones: string;
  precoCone: string;
  rendimento: string;
  lote: string;
  observacao: string;
};

export async function registrarEntradaAction(dados: EntradaForm): Promise<ResultadoDaAcao> {
  return executarAcao("inventory:write", "Não foi possível registrar a entrada.", async (ator) => {
    const cones = parseNumeroPtBr(dados.cones);
    const precoCone = parseNumeroPtBr(dados.precoCone);
    const rendimento = parseNumeroPtBr(dados.rendimento);
    if (cones === null || precoCone === null || rendimento === null) {
      throw new ErroDeNegocio("Informe cones, preço e rendimento com números válidos.");
    }

    await registrarEntrada(ator, {
      materialId: dados.materialId,
      cones,
      precoCone,
      rendimento,
      loteReferencia: dados.lote.slice(0, 120),
      observacao: dados.observacao.slice(0, 500),
    });
    atualizarTelas();
  });
}

export type BaixaForm = {
  materialId: string;
  quantidade: string;
  motivo: MotivoDaBaixa;
  observacao: string;
};

export async function registrarBaixaAction(dados: BaixaForm): Promise<ResultadoDaAcao> {
  return executarAcao("inventory:write", "Não foi possível registrar a baixa.", async (ator) => {
    const quantidade = parseNumeroPtBr(dados.quantidade);
    if (quantidade === null || quantidade <= 0) throw new ErroDeNegocio("Informe uma quantidade maior que zero.");
    if (!MOTIVOS_DA_BAIXA.includes(dados.motivo)) throw new ErroDeNegocio("Escolha o motivo da baixa.");

    await registrarBaixaManual(ator, {
      materialId: dados.materialId,
      quantidade,
      motivo: dados.motivo,
      observacao: dados.observacao.slice(0, 500),
    });
    atualizarTelas();
  });
}

export async function buscarHistoricoAction(materialId: string): Promise<ResultadoDaAcao<MovimentacaoDeEstoque[]>> {
  return executarAcao("inventory:read", "Não foi possível carregar o histórico.", (ator) =>
    listarHistoricoDoInsumo(ator, materialId),
  );
}
