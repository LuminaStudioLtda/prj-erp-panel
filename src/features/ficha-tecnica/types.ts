import type { UnidadeInsumo } from "@/features/insumos/types";

export type StatusPublicacao = "rascunho" | "ativo" | "pausado" | "fora-de-linha";

/** Insumo ou acessório do catálogo que pode compor uma receita, já com o custo unitário calculado. */
export type ItemDoCatalogo = {
  id: string;
  nome: string;
  detalhe: string;
  unidade: UnidadeInsumo;
  /** Valor em reais por `unidade`. */
  custoUnitario: number;
};

/** Linha da receita como o usuário a edita: a quantidade é texto, aceitando vírgula. */
export type ItemDaReceitaForm = {
  insumoId: string;
  quantidade: string;
};

export type FotoDoProduto = {
  id: string;
  nome: string;
  url: string;
};

export type FichaTecnicaFormValues = {
  nome: string;
  categoria: string;
  narrativa: string;
  status: StatusPublicacao;
  destaqueNaVitrine: boolean;
  prontaEntrega: boolean;
  estoqueFisico: string;
  sobEncomenda: boolean;
  prazoDias: string;
  itens: ItemDaReceitaForm[];
  horas: string;
  minutos: string;
  embalagens: string;
  /** Margem de lucro desejada, em pontos percentuais inteiros (35 = 35%). */
  margemPct: number;
  /** Vazio mantém o preço sugerido pelo motor. */
  precoManual: string;
};

export type FichaTecnicaFormErrors = Partial<
  Record<
    "nome" | "categoria" | "modalidade" | "estoqueFisico" | "prazoDias" | "itens" | "tempo" | "embalagens" | "precoManual",
    string
  >
>;

export const ROTULO_STATUS_PUBLICACAO: Record<StatusPublicacao, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo na Loja",
  pausado: "Pausado",
  "fora-de-linha": "Fora de Linha",
};

/** Efeito de cada estado na vitrine (docs/TRILHAS_DESENVOLVIMENTO.md, Trilha 4). */
export const EFEITO_STATUS_PUBLICACAO: Record<StatusPublicacao, string> = {
  rascunho: "Invisível na loja.",
  ativo: "Visível e disponível para compra.",
  pausado: "Continua visível, mas não pode ser comprado.",
  "fora-de-linha": "Arquivado: sai da vitrine.",
};

export type ItemDaFichaPorCodigo = {
  materialId: string;
  nome: string;
  unidade: "g" | "m" | "un";
  /** Quantidade total consumida (já multiplicada pela quantidade de cada produto). */
  quantidade: number;
  /** Custo vigente no estoque no momento da consulta; `null` quando o insumo nunca teve custo registrado. */
  custoUnitario: number | null;
  custo: number;
};

export type FichaPorCodigo = {
  tipo: "pedido" | "produto";
  codigo: string;
  descricao: string;
  /** Valor total do pedido (`null` para consulta por produto). */
  valorDoPedido: number | null;
  produtos: { nome: string; quantidade: number }[];
  itens: ItemDaFichaPorCodigo[];
  tempoMinutos: number;
  custosIndiretos: number;
  custoInsumos: number;
  /** Produtos sem ficha técnica cadastrada: não entram no cálculo. */
  produtosSemFicha: string[];
  /** Insumos sem custo unitário: contam como zero no cálculo. */
  insumosSemCusto: string[];
};
