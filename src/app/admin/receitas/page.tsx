import type { Metadata } from "next";
import { FichaTecnicaView } from "@/features/ficha-tecnica/components/FichaTecnicaView";
import { montarCatalogo } from "@/features/ficha-tecnica/services/catalogo-de-insumos";
import { lerConfiguracaoDePrecificacao } from "@/features/ficha-tecnica/services/configuracao-de-precificacao-db";
import { listarInsumos } from "@/features/insumos/services/insumos-db";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Receitas & Produtos | Admin",
};

export default async function ReceitasEProdutosPage() {
  const ator = await getAuthenticatedUser();
  const [{ configuracao: global }, { insumos }] = await Promise.all([
    lerConfiguracaoDePrecificacao(ator),
    listarInsumos(ator),
  ]);

  return (
    <FichaTecnicaView
      catalogo={montarCatalogo(insumos)}
      configuracao={global.precificacao}
      margemPadraoPct={global.margemPadraoPct}
    />
  );
}
