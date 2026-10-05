import { arredondarQuantidade } from "@/features/insumos/services/estoque-calculos";
import type { FichaPorCodigo, ItemDaFichaPorCodigo } from "@/features/ficha-tecnica/types";

export type MaterialDaFicha = {
  materialId: string;
  nome: string;
  unidade: ItemDaFichaPorCodigo["unidade"];
  /** Quantidade consumida por uma unidade do produto. */
  quantidade: number;
  custoUnitario: number | null;
};

export type ProdutoParaFicha = {
  nome: string;
  /** Quantas unidades do produto entram na consulta (1 numa consulta por produto). */
  quantidade: number;
  receita: { minutos: number; indiretos: number; itens: MaterialDaFicha[] } | null;
};

export type FichaConsolidada = Pick<
  FichaPorCodigo,
  "produtos" | "itens" | "tempoMinutos" | "custosIndiretos" | "custoInsumos" | "produtosSemFicha" | "insumosSemCusto"
>;

const CASAS_DO_CUSTO = 100_000;

/**
 * Junta as fichas técnicas dos produtos de uma consulta:
 * materiais iguais são somados, e tempo e custos indiretos são multiplicados pela quantidade.
 */
export function consolidarFicha(produtos: ProdutoParaFicha[]): FichaConsolidada {
  const porMaterial = new Map<string, ItemDaFichaPorCodigo>();
  const produtosSemFicha: string[] = [];
  let tempoMinutos = 0;
  let custosIndiretos = 0;

  for (const produto of produtos) {
    if (!produto.receita) {
      produtosSemFicha.push(produto.nome);
      continue;
    }
    tempoMinutos += produto.receita.minutos * produto.quantidade;
    custosIndiretos += produto.receita.indiretos * produto.quantidade;

    for (const material of produto.receita.itens) {
      const existente = porMaterial.get(material.materialId);
      const quantidade = (existente?.quantidade ?? 0) + material.quantidade * produto.quantidade;
      porMaterial.set(material.materialId, {
        materialId: material.materialId,
        nome: material.nome,
        unidade: material.unidade,
        quantidade,
        custoUnitario: material.custoUnitario,
        custo: 0,
      });
    }
  }

  const itens = [...porMaterial.values()].map((item) => {
    const quantidade = arredondarQuantidade(item.quantidade);
    return { ...item, quantidade, custo: Math.round(quantidade * (item.custoUnitario ?? 0) * CASAS_DO_CUSTO) / CASAS_DO_CUSTO };
  });

  return {
    produtos: produtos.map((produto) => ({ nome: produto.nome, quantidade: produto.quantidade })),
    itens,
    tempoMinutos,
    custosIndiretos: Math.round(custosIndiretos * 100) / 100,
    custoInsumos: itens.reduce((soma, item) => soma + item.custo, 0),
    produtosSemFicha,
    insumosSemCusto: itens.filter((item) => item.custoUnitario === null).map((item) => item.nome),
  };
}
