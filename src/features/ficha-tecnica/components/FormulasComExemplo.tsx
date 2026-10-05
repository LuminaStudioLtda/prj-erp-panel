import { formatarMoeda, formatarPercentual } from "@/lib/formatar";
import { SecaoDaFicha } from "@/features/ficha-tecnica/components/SecaoDaFicha";
import {
  PECA_DE_EXEMPLO,
  simularPecaDeExemplo,
  type ConfiguracaoGlobal,
} from "@/features/ficha-tecnica/services/configuracao-de-precificacao";

type FormulasComExemploProps = {
  configuracao: ConfiguracaoGlobal;
  /** `true` quando os números vêm do formulário ainda não salvo. */
  naoSalva: boolean;
};

export function FormulasComExemplo({ configuracao, naoSalva }: FormulasComExemploProps) {
  const resultado = simularPecaDeExemplo(configuracao);
  const { valorHoraTrabalhada, taxaPerdas } = configuracao.precificacao;
  const horas = PECA_DE_EXEMPLO.tempoMinutos / 60;

  const passos = [
    {
      nome: "Custo_Insumos",
      formula: "Σ (Quantidade_Usada × Custo_Unitário_Insumo)",
      conta: `Soma dos insumos da peça = ${formatarMoeda(resultado.custoInsumos)}`,
    },
    {
      nome: "Custo_Mão_Obra",
      formula: "(Tempo_Total_Minutos ÷ 60) × VHT",
      conta: `(${PECA_DE_EXEMPLO.tempoMinutos} ÷ 60) × ${formatarMoeda(valorHoraTrabalhada)} = ${formatarMoeda(resultado.custoMaoDeObra)}`,
    },
    {
      nome: "Custo_Direto",
      formula: "Custo_Insumos + Custo_Mão_Obra + Embalagens",
      conta: `${formatarMoeda(resultado.custoInsumos)} + ${formatarMoeda(resultado.custoMaoDeObra)} + ${formatarMoeda(resultado.embalagens)} = ${formatarMoeda(resultado.custoDireto)}`,
    },
    {
      nome: "Preço_Sugerido",
      formula: "Custo_Direto × (1 + Taxa_Perdas) × (1 + Margem_Lucro_%)",
      conta: `${formatarMoeda(resultado.custoDireto)} × (1 + ${formatarPercentual(taxaPerdas)}) × (1 + ${configuracao.margemPadraoPct}%) = ${formatarMoeda(resultado.precoSugerido)}`,
    },
  ];

  return (
    <SecaoDaFicha
      titulo="Fórmulas aplicadas"
      descricao={`Definidas pelo BRD do ateliê, calculadas para a peça de exemplo (${horas}h de confecção) com ${naoSalva ? "os valores do formulário, ainda não salvos" : "a configuração salva"}.`}
    >
      <ol className="flex flex-col gap-4">
        {passos.map((passo, indice) => (
          <li key={passo.nome} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-md bg-terracotta font-mono text-xs font-semibold text-surface"
            >
              {indice + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-mono text-sm font-semibold text-ink">{passo.nome}</span>
              <span className="font-mono text-xs text-muted-foreground">{passo.formula}</span>
              <span className="font-mono text-sm text-ink">{passo.conta}</span>
            </div>
          </li>
        ))}
      </ol>
    </SecaoDaFicha>
  );
}
