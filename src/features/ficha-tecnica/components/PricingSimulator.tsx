import { formatarMoeda, formatarPercentual } from "@/lib/formatar";
import { SecaoDaFicha } from "@/features/ficha-tecnica/components/SecaoDaFicha";
import { PECA_DE_EXEMPLO, simularPecaDeExemplo } from "@/features/ficha-tecnica/services/configuracao-de-precificacao";
import type { ConfiguracaoGlobal } from "@/features/ficha-tecnica/services/configuracao-de-precificacao";

type PricingSimulatorProps = {
  salva: ConfiguracaoGlobal;
  /** `null` quando os campos do formulário ainda não formam uma configuração válida. */
  rascunho: ConfiguracaoGlobal | null;
};

export function PricingSimulator({ salva, rascunho }: PricingSimulatorProps) {
  const atual = simularPecaDeExemplo(salva);
  const novo = rascunho ? simularPecaDeExemplo(rascunho) : null;

  const linhas = [
    { rotulo: "Mão de obra", valor: (r: typeof atual) => r.custoMaoDeObra },
    { rotulo: "Custo direto", valor: (r: typeof atual) => r.custoDireto },
    { rotulo: "Taxa de perdas", valor: (r: typeof atual) => r.valorPerdas },
    { rotulo: "Lucro previsto", valor: (r: typeof atual) => r.lucroSugerido },
  ];

  const diferenca = novo ? novo.precoSugerido - atual.precoSugerido : 0;
  const houveMudanca = novo !== null && Math.abs(diferenca) >= 0.005;

  return (
    <SecaoDaFicha
      titulo="Simulador"
      descricao={`Peça de exemplo: ${formatarMoeda(PECA_DE_EXEMPLO.custoInsumos)} em insumos, ${PECA_DE_EXEMPLO.tempoMinutos / 60}h de confecção e ${formatarMoeda(PECA_DE_EXEMPLO.embalagens)} em embalagens.`}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs tracking-wider text-muted-foreground uppercase">
            <th className="pb-2 font-semibold">
              <span className="sr-only">Termo</span>
            </th>
            <th className="pb-2 text-right font-semibold">Salvo</th>
            <th className="pb-2 text-right font-semibold">Novo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {linhas.map((linha) => (
            <tr key={linha.rotulo}>
              <th scope="row" className="py-2 text-left font-normal text-muted-foreground">
                {linha.rotulo}
              </th>
              <td className="py-2 text-right font-mono text-ink">{formatarMoeda(linha.valor(atual))}</td>
              <td className="py-2 text-right font-mono text-ink">{novo ? formatarMoeda(linha.valor(novo)) : "—"}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="py-3 text-left font-semibold text-ink">
              Preço sugerido
            </th>
            <td className="py-3 text-right font-mono font-semibold text-ink">{formatarMoeda(atual.precoSugerido)}</td>
            <td className="py-3 text-right font-mono text-lg font-semibold text-terracotta">
              {novo ? formatarMoeda(novo.precoSugerido) : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {novo === null ? (
        <p role="status" className="rounded-xl bg-canvas p-3 text-xs text-ink">
          Corrija os campos do formulário para ver a simulação.
        </p>
      ) : houveMudanca ? (
        <p role="status" className="rounded-xl bg-canvas p-3 text-xs text-ink">
          Com estes valores o preço sugerido da peça de exemplo{" "}
          {diferenca > 0 ? "sobe" : "cai"}{" "}
          <span className={`font-mono font-semibold ${diferenca > 0 ? "text-terracotta" : "text-sage-foreground"}`}>
            {formatarMoeda(Math.abs(diferenca))} ({formatarPercentual(Math.abs(diferenca) / atual.precoSugerido)})
          </span>
          . Salve para aplicar às próximas fichas.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Sem alterações em relação ao que está salvo.</p>
      )}
    </SecaoDaFicha>
  );
}
