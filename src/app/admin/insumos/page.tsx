import type { Metadata } from "next";
import { GestaoDeInsumosView } from "@/features/insumos/components/GestaoDeInsumosView";
import { listarAcessoriosDeEstoque } from "@/features/insumos/services/insumo-estoque";
import { listarInsumos } from "@/features/insumos/services/insumos-db";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Gestão de Insumos | Admin",
};

export default async function GestaoDeInsumosPage() {
  const { insumos, bancoDisponivel } = await listarInsumos(await getAuthenticatedUser());

  return (
    <GestaoDeInsumosView
      insumos={insumos}
      acessoriosIniciais={listarAcessoriosDeEstoque()}
      bancoDisponivel={bancoDisponivel}
    />
  );
}
