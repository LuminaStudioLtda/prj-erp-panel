import { arredondarQuantidade } from "@/features/insumos/services/estoque-calculos";
import type { FaltaDeMaterial } from "@/features/pedidos/types";

export type ReceitaDoProduto = {
  produtoId: string;
  itens: { materialId: string; quantidade: number }[];
};

export type NecessidadeDeMateriais = {
  /** Quantidade total de cada material, somando as fichas técnicas de todos os produtos do pedido. */
  porMaterial: Map<string, number>;
  /** Produtos do pedido que não têm ficha técnica cadastrada. */
  produtosSemFicha: string[];
};

/** Soma o consumo de materiais: Σ (quantidade do produto × quantidade do material na ficha técnica). */
export function calcularNecessidadeDeMateriais(
  itens: { produtoId: string | null; nome: string; quantidade: number }[],
  receitas: ReceitaDoProduto[],
): NecessidadeDeMateriais {
  const porMaterial = new Map<string, number>();
  const produtosSemFicha: string[] = [];

  for (const item of itens) {
    const receita = item.produtoId ? receitas.find((r) => r.produtoId === item.produtoId) : undefined;
    if (!receita || receita.itens.length === 0) {
      produtosSemFicha.push(item.nome);
      continue;
    }
    for (const consumo of receita.itens) {
      const atual = porMaterial.get(consumo.materialId) ?? 0;
      porMaterial.set(consumo.materialId, atual + consumo.quantidade * item.quantidade);
    }
  }

  for (const [materialId, quantidade] of porMaterial) {
    porMaterial.set(materialId, arredondarQuantidade(quantidade));
  }

  return { porMaterial, produtosSemFicha };
}

export type SaldoDeMaterial = { materialId: string; nome: string; unidade: string; disponivel: number };

export function encontrarFaltas(
  necessidade: Map<string, number>,
  saldos: SaldoDeMaterial[],
): FaltaDeMaterial[] {
  const faltas: FaltaDeMaterial[] = [];
  for (const [materialId, necessario] of necessidade) {
    const saldo = saldos.find((s) => s.materialId === materialId);
    const disponivel = saldo?.disponivel ?? 0;
    if (necessario > disponivel) {
      faltas.push({
        materialId,
        nome: saldo?.nome ?? "Material removido",
        unidade: saldo?.unidade ?? "",
        necessario,
        disponivel,
      });
    }
  }
  return faltas;
}

/** Mensagem para o usuário: "Fio X (precisa de 900 g, há 840 g)". */
export function descreverFaltas(faltas: FaltaDeMaterial[]): string {
  const formatar = (valor: number, unidade: string) =>
    `${valor.toLocaleString("pt-BR")}${unidade === "UNIT" ? " un" : unidade === "GRAM" ? " g" : unidade === "METER" ? " m" : ""}`;
  return faltas
    .map((f) => `${f.nome} (precisa de ${formatar(f.necessario, f.unidade)}, há ${formatar(f.disponivel, f.unidade)})`)
    .join("; ");
}
