import { useState } from "react";
import { criarAcessorioEmEstoque } from "@/features/insumos/services/insumo-estoque";
import type { AcessorioEmEstoque, AcessorioInput } from "@/features/insumos/types";

/**
 * Acessórios (etiquetas, botões, sacolas) em memória, iniciados com os dados de exemplo do
 * service. Não sobrevivem a um recarregar de página: os insumos já vêm do banco, os
 * acessórios ainda não têm tabela própria.
 */
export function useAcessoriosMockStore(acessoriosIniciais: AcessorioEmEstoque[]) {
  const [acessorios, setAcessorios] = useState(acessoriosIniciais);

  function adicionarAcessorio(acessorio: AcessorioInput) {
    setAcessorios((atual) => [criarAcessorioEmEstoque(acessorio), ...atual]);
  }

  return { acessorios, adicionarAcessorio };
}
