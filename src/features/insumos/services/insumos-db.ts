import "server-only";

import { Prisma } from "@/generated/prisma/client";
import {
  arredondarQuantidade,
  calcularEntrada,
  custoMedioPonderado,
  totalEmEstoque,
  type LoteDeEstoque,
} from "@/features/insumos/services/estoque-calculos";
import { bloquearMateriais, consumirMaterial, lerLotes } from "@/features/insumos/services/estoque-db";
import { calcularCustoUnitario } from "@/features/insumos/services/insumo-custo";
import { quantidadeInicial } from "@/features/insumos/services/insumo-estoque";
import {
  motivoDoBancoParaBaixa,
  montarObservacaoDaBaixa,
  tipoDaMovimentacao,
  type MotivoDaBaixa,
} from "@/features/insumos/services/movimentacao";
import {
  ROTULO_CATEGORIA,
  type CategoriaInsumo,
  type InsumoEmEstoque,
  type InsumoInput,
  type MovimentacaoDeEstoque,
  type UnidadeInsumo,
} from "@/features/insumos/types";
import type { AuthenticatedUser } from "@/features/rbac/types";
import { ErroDeNegocio } from "@/lib/erro-de-negocio";
import { withDatabaseRole } from "@/lib/with-database-role";

const KINDS_DE_INSUMO = Object.values(ROTULO_CATEGORIA);

const UNIDADE_DO_BANCO: Record<UnidadeInsumo, "GRAM" | "METER" | "UNIT"> = { g: "GRAM", m: "METER", un: "UNIT" };

function unidadeDoInsumo(unidade: string): UnidadeInsumo {
  return unidade === "GRAM" ? "g" : unidade === "METER" ? "m" : "un";
}

function categoriaDoKind(kind: string): CategoriaInsumo {
  const encontrada = (Object.keys(ROTULO_CATEGORIA) as CategoriaInsumo[]).find((c) => ROTULO_CATEGORIA[c] === kind);
  return encontrada ?? "aviamento";
}

export type InsumosLidos = {
  insumos: InsumoEmEstoque[];
  /** `false` quando o banco não respondeu. */
  bancoDisponivel: boolean;
};

type MaterialComLotes = Prisma.MaterialGetPayload<{ include: { lots: true } }>;

function paraInsumoEmEstoque(material: MaterialComLotes): InsumoEmEstoque {
  const unidade = unidadeDoInsumo(material.unit);
  const lotes: LoteDeEstoque[] = material.lots.map((lote) => ({
    id: lote.id,
    quantidade: lote.quantityOnHand.toNumber(),
    custoUnitario: lote.unitCost.toNumber(),
    recebidoEm: lote.receivedAt,
  }));
  const maisRecente = [...material.lots].sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())[0];
  const rendimento = material.coneYield?.toNumber() ?? null;

  return {
    id: material.id,
    categoria: categoriaDoKind(material.kind),
    sku: material.sku ?? "",
    nomeComercial: material.name,
    marca: [material.brand, material.line, material.tex ? `Tex ${material.tex}` : null].filter(Boolean).join(" · "),
    cor: material.visualColor ?? "",
    lote: maisRecente?.reference ?? "",
    unidade,
    pesoGramas: unidade === "g" ? rendimento : null,
    rendimentoMetros: unidade === "g" ? (material.coneMeters?.toNumber() ?? null) : unidade === "m" ? rendimento : null,
    precoAquisicao: material.conePrice?.toNumber() ?? 0,
    estoqueAtual: totalEmEstoque(lotes),
    pontoPedido: material.reorderPoint.toNumber(),
    custoPonderado: custoMedioPonderado(lotes),
    lotes: material.lots.map((lote) => ({
      referencia: lote.reference ?? "Sem lote",
      quantidade: lote.quantityOnHand.toNumber(),
      custoUnitario: lote.unitCost.toNumber(),
    })),
  };
}

export async function listarInsumos(ator: AuthenticatedUser | null): Promise<InsumosLidos> {
  try {
    const materiais = await withDatabaseRole(ator, (transacao) =>
      transacao.material.findMany({
        where: { kind: { in: KINDS_DE_INSUMO } },
        include: { lots: true },
        orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      }),
    );
    return { insumos: materiais.map(paraInsumoEmEstoque), bancoDisponivel: true };
  } catch {
    return { insumos: [], bancoDisponivel: false };
  }
}

export async function cadastrarInsumo(ator: AuthenticatedUser, insumo: InsumoInput): Promise<void> {
  const custo = calcularCustoUnitario(insumo);
  if (!custo) throw new ErroDeNegocio("Não foi possível calcular o custo unitário com os dados informados.");

  const quantidade = quantidadeInicial(insumo);
  const rendimento = insumo.unidade === "g" ? insumo.pesoGramas : insumo.unidade === "m" ? insumo.rendimentoMetros : 1;

  try {
    await withDatabaseRole(ator, async (transacao) => {
      const material = await transacao.material.create({
        data: {
          sku: insumo.sku.trim() || null,
          name: insumo.nomeComercial.trim(),
          brand: insumo.marca.trim() || null,
          visualColor: insumo.cor.trim() || null,
          kind: ROTULO_CATEGORIA[insumo.categoria],
          unit: UNIDADE_DO_BANCO[insumo.unidade],
          conePrice: insumo.precoAquisicao,
          coneYield: rendimento,
          coneMeters: insumo.unidade === "g" ? insumo.rendimentoMetros : null,
          reorderPoint: Math.max(1, Math.round(quantidade * 0.25)),
        },
      });
      const lote = await transacao.materialLot.create({
        data: {
          materialId: material.id,
          reference: insumo.lote.trim() || null,
          unitCost: custo.valor,
          quantityOnHand: quantidade,
        },
      });
      await transacao.stockMovement.create({
        data: {
          materialId: material.id,
          materialLotId: lote.id,
          reason: "PURCHASE",
          origin: "Cadastro do insumo",
          note: insumo.lote.trim() || null,
          quantityDelta: quantidade,
          resultingStock: quantidade,
        },
      });
    });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      throw new ErroDeNegocio("Já existe um insumo cadastrado com este SKU.");
    }
    throw erro;
  }
}

export type EntradaDeEstoque = {
  materialId: string;
  cones: number;
  precoCone: number;
  rendimento: number;
  loteReferencia: string;
  observacao: string;
};

export async function registrarEntrada(ator: AuthenticatedUser, entrada: EntradaDeEstoque): Promise<void> {
  const calculada = calcularEntrada(entrada);
  if (!calculada) throw new ErroDeNegocio("Informe cones, preço e rendimento maiores que zero.");

  await withDatabaseRole(ator, async (transacao) => {
    await bloquearMateriais(transacao, [entrada.materialId]);
    const material = await transacao.material.findUnique({ where: { id: entrada.materialId } });
    if (!material) throw new ErroDeNegocio("Insumo não encontrado.");

    const lotes = await lerLotes(transacao, material.id);
    const saldoAnterior = totalEmEstoque(lotes);
    const referencia = entrada.loteReferencia.trim() || null;

    const lote = await transacao.materialLot.create({
      data: {
        materialId: material.id,
        reference: referencia,
        unitCost: calculada.custoUnitario,
        quantityOnHand: calculada.quantidade,
      },
    });
    await transacao.material.update({
      where: { id: material.id },
      data: { conePrice: entrada.precoCone, coneYield: entrada.rendimento },
    });
    await transacao.stockMovement.create({
      data: {
        materialId: material.id,
        materialLotId: lote.id,
        reason: "PURCHASE",
        origin: "Entrada de lote",
        note: entrada.observacao.trim() || null,
        quantityDelta: calculada.quantidade,
        resultingStock: arredondarQuantidade(saldoAnterior + calculada.quantidade),
      },
    });
  });
}

export type BaixaManual = {
  materialId: string;
  quantidade: number;
  motivo: MotivoDaBaixa;
  observacao: string;
};

export async function registrarBaixaManual(ator: AuthenticatedUser, baixa: BaixaManual): Promise<void> {
  if (!Number.isFinite(baixa.quantidade) || baixa.quantidade <= 0) {
    throw new ErroDeNegocio("Informe uma quantidade maior que zero.");
  }

  await withDatabaseRole(ator, async (transacao) => {
    await bloquearMateriais(transacao, [baixa.materialId]);
    const material = await transacao.material.findUnique({ where: { id: baixa.materialId } });
    if (!material) throw new ErroDeNegocio("Insumo não encontrado.");

    await consumirMaterial(transacao, {
      materialId: material.id,
      quantidade: baixa.quantidade,
      motivo: motivoDoBancoParaBaixa(baixa.motivo),
      origem: "Baixa manual",
      observacao: montarObservacaoDaBaixa(baixa.motivo, baixa.observacao),
    });
  });
}

export async function listarHistoricoDoInsumo(
  ator: AuthenticatedUser,
  materialId: string,
): Promise<MovimentacaoDeEstoque[]> {
  const movimentos = await withDatabaseRole(ator, (transacao) =>
    transacao.stockMovement.findMany({
      where: { materialId },
      include: { materialLot: { select: { reference: true } }, order: { select: { code: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  );

  return movimentos.map((movimento) => ({
    id: movimento.id,
    tipo: tipoDaMovimentacao(movimento.reason),
    quantidade: movimento.quantityDelta.toNumber(),
    saldoApos: movimento.resultingStock.toNumber(),
    lote: movimento.materialLot?.reference ?? null,
    codigoPedido: movimento.order?.code ?? null,
    origem: movimento.origin,
    observacao: movimento.note,
    data: movimento.createdAt,
  }));
}
