import { calcularCustoUnitario } from "@/features/insumos/services/insumo-custo";
import { listarAcessoriosDeEstoque } from "@/features/insumos/services/insumo-estoque";
import type { InsumoEmEstoque } from "@/features/insumos/types";
import type { ItemDoCatalogo } from "@/features/ficha-tecnica/types";

/**
 * Itens que podem entrar numa receita, vindos do estoque de insumos e ligados
 * por `id` real, nunca por texto livre. Insumos sem custo calculável ficam de fora: não dá
 * para precificar um consumo sem custo unitário.
 */
export function montarCatalogo(insumosEmEstoque: InsumoEmEstoque[]): ItemDoCatalogo[] {
  const insumos = insumosEmEstoque.flatMap((insumo): ItemDoCatalogo[] => {
    const base = calcularCustoUnitario(insumo);
    // custo vigente (média ponderada dos lotes) quando o insumo vem do banco
    const custo = base && insumo.custoPonderado ? { ...base, valor: insumo.custoPonderado } : base;
    if (!custo) return [];
    return [
      {
        id: insumo.id,
        nome: insumo.nomeComercial,
        detalhe: [insumo.cor, insumo.lote].filter(Boolean).join(" · "),
        unidade: custo.unidade,
        custoUnitario: custo.valor,
      },
    ];
  });

  const acessorios = listarAcessoriosDeEstoque().map(
    (item): ItemDoCatalogo => ({
      id: item.id,
      nome: item.nome,
      detalhe: item.tag,
      unidade: "un",
      custoUnitario: item.custoPorPeca,
    }),
  );

  return [...insumos, ...acessorios];
}
