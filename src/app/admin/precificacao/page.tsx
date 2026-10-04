import type { Metadata } from "next";
import { BuscaDeFichaForm } from "@/features/ficha-tecnica/components/BuscaDeFichaForm";
import { PrecificacaoPorCodigo } from "@/features/ficha-tecnica/components/PrecificacaoPorCodigo";
import { PricingSettingsWorkspace } from "@/features/ficha-tecnica/components/PricingSettingsWorkspace";
import { lerConfiguracaoDePrecificacao } from "@/features/ficha-tecnica/services/configuracao-de-precificacao-db";
import {
  buscarFichaPorCodigo,
  listarSugestoesDeCodigo,
} from "@/features/ficha-tecnica/services/ficha-por-codigo-db";
import type { FichaPorCodigo } from "@/features/ficha-tecnica/types";
import { hasPermission } from "@/features/rbac/services/access-control";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { ErroDeNegocio } from "@/lib/erro-de-negocio";

export const metadata: Metadata = {
  title: "Motor de Precificação | Admin",
};

export default async function PrecificacaoPage({ searchParams }: PageProps<"/admin/precificacao">) {
  const { codigo } = await searchParams;
  const codigoDigitado = typeof codigo === "string" ? codigo.trim() : "";

  const ator = await getAuthenticatedUser();
  const [{ configuracao, atualizadoEm, bancoDisponivel }, sugestoes] = await Promise.all([
    lerConfiguracaoDePrecificacao(ator),
    listarSugestoesDeCodigo(ator),
  ]);
  const podeEditar = Boolean(ator && hasPermission(ator.role, "margins:write"));

  let ficha: FichaPorCodigo | null = null;
  let erroDaBusca: string | null = null;
  if (codigoDigitado !== "") {
    try {
      ficha = await buscarFichaPorCodigo(ator, codigoDigitado);
    } catch (erro) {
      erroDaBusca =
        erro instanceof ErroDeNegocio ? erro.message : "Não foi possível consultar a ficha técnica. Tente novamente.";
    }
  }

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-widest text-terracotta uppercase">
          Motor de fórmulas &amp; modelagem
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">Motor de precificação</h1>
        <p className="max-w-2xl text-muted-foreground">
          Puxe a ficha técnica de um pedido ou produto pelo código para calcular o custo e o preço com os custos
          vigentes do estoque, e ajuste abaixo os valores globais usados em todas as fichas.
        </p>
      </header>

      {bancoDisponivel ? null : (
        <p role="alert" className="rounded-xl border border-ochre/50 bg-canvas p-4 text-sm text-ink">
          Banco de dados indisponível: exibindo os valores padrão e o salvamento não vai funcionar.
          Suba o banco com <code className="font-mono">pnpm db:up</code>.
        </p>
      )}

      <BuscaDeFichaForm codigoAtual={codigoDigitado} sugestoes={sugestoes} erro={erroDaBusca} />

      {ficha ? <PrecificacaoPorCodigo key={ficha.codigo} ficha={ficha} configuracao={configuracao} /> : null}

      <PricingSettingsWorkspace
        salva={configuracao}
        atualizadoEm={atualizadoEm}
        somenteLeitura={!podeEditar}
      />
    </div>
  );
}
