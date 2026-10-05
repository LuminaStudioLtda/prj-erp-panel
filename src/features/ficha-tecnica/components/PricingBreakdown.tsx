import {
  formatarMoeda,
  formatarPercentual,
  type ConfiguracaoDePrecificacao,
  type ResultadoDePrecificacao,
} from "@/features/ficha-tecnica/services/precificacao";

type PricingBreakdownProps = {
  resultado: ResultadoDePrecificacao;
  configuracao: ConfiguracaoDePrecificacao;
  /** Margem desejada em pontos percentuais inteiros (35 = 35%). */
  margemPct: number;
};

const LINHA = "flex items-baseline justify-between gap-3 text-sm";

export function PricingBreakdown({ resultado, configuracao, margemPct }: PricingBreakdownProps) {
  const { custoDireto, custoInsumos, custoMaoDeObra, embalagens } = resultado;
  const partes = [
    { rotulo: "Insumos", valor: custoInsumos, classe: "bg-terracotta" },
    { rotulo: "Mão de obra", valor: custoMaoDeObra, classe: "bg-ink" },
    { rotulo: "Embalagens", valor: embalagens, classe: "bg-ochre" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl bg-canvas p-4">
        <div className={LINHA}>
          <span className="text-muted-foreground">Custo total de produção direta</span>
          <span className="font-mono text-xl font-semibold text-ink">{formatarMoeda(custoDireto)}</span>
        </div>
        <div
          role="img"
          aria-label="Proporção entre insumos, mão de obra e embalagens no custo direto"
          className="flex h-2 overflow-hidden rounded-full bg-border"
        >
          {custoDireto > 0
            ? partes.map((parte) => (
                <span
                  key={parte.rotulo}
                  className={parte.classe}
                  style={{ width: `${(parte.valor / custoDireto) * 100}%` }}
                />
              ))
            : null}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {partes.map((parte) => (
            <li key={parte.rotulo} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`size-2 rounded-full ${parte.classe}`} />
              {parte.rotulo}: <span className="font-mono text-ink">{formatarMoeda(parte.valor)}</span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="flex flex-col gap-2 border-t border-border pt-4">
        <div className={LINHA}>
          <dt className="text-muted-foreground">Custo dos insumos</dt>
          <dd className="font-mono text-ink">{formatarMoeda(custoInsumos)}</dd>
        </div>
        <div className={LINHA}>
          <dt className="text-muted-foreground">Custo de mão de obra</dt>
          <dd className="font-mono text-ink">{formatarMoeda(custoMaoDeObra)}</dd>
        </div>
        <div className={LINHA}>
          <dt className="text-muted-foreground">Embalagens, tags &amp; mimos</dt>
          <dd className="font-mono text-ink">{formatarMoeda(embalagens)}</dd>
        </div>
        <div className={`${LINHA} border-t border-border pt-2`}>
          <dt className="font-semibold text-ink">Custo direto</dt>
          <dd className="font-mono font-semibold text-ink">{formatarMoeda(custoDireto)}</dd>
        </div>
        <div className={LINHA}>
          <dt className="text-muted-foreground">
            Taxa de perdas ({formatarPercentual(configuracao.taxaPerdas)})
          </dt>
          <dd className="font-mono text-ink">{formatarMoeda(resultado.valorPerdas)}</dd>
        </div>
        <div className={LINHA}>
          <dt className="text-muted-foreground">Margem de lucro ({margemPct}%)</dt>
          <dd className="font-mono text-ink">{formatarMoeda(resultado.lucroSugerido)}</dd>
        </div>
        <div className={`${LINHA} border-t border-border pt-2`}>
          <dt className="text-muted-foreground">Preço sugerido pelo algoritmo</dt>
          <dd className="font-mono text-lg font-semibold text-ink">
            {formatarMoeda(resultado.precoSugerido)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
