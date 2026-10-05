import { formatarMoeda } from "@/lib/formatar";
import type { SerieDeFaturamento } from "@/features/dashboard/types";

const LARGURA = 640;
const ALTURA = 240;
const MARGEM = { topo: 16, direita: 16, base: 28, esquerda: 72 };
const DIVISOES_Y = 4;

const FORMATO_COMPACTO = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Arredonda o teto do eixo para 1, 2 ou 5 × potência de dez, para o eixo ter marcas legíveis. */
function tetoDoEixo(maximo: number): number {
  if (maximo <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  const mantissa = maximo / potencia;
  const passo = mantissa <= 1 ? 1 : mantissa <= 2 ? 2 : mantissa <= 5 ? 5 : 10;
  return passo * potencia;
}

export function FaturamentoChart({ serie }: { serie: SerieDeFaturamento }) {
  const dias = Math.max(serie.atual.length, serie.anterior.length, 2);
  const maximo = Math.max(0, ...serie.atual, ...serie.anterior);
  const teto = tetoDoEixo(maximo);

  const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const alturaUtil = ALTURA - MARGEM.topo - MARGEM.base;
  const x = (indice: number) => MARGEM.esquerda + (indice / (dias - 1)) * larguraUtil;
  const y = (valor: number) => MARGEM.topo + alturaUtil - (valor / teto) * alturaUtil;

  const linha = (valores: number[]) =>
    valores.map((valor, indice) => `${indice === 0 ? "M" : "L"}${x(indice).toFixed(1)},${y(valor).toFixed(1)}`).join(" ");
  const area = (valores: number[]) =>
    valores.length === 0
      ? ""
      : `${linha(valores)} L${x(valores.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;

  const totalAtual = serie.atual.at(-1) ?? 0;
  const totalAnterior = serie.anterior.at(-1) ?? 0;
  const marcasX = [1, Math.ceil(dias / 4), Math.ceil(dias / 2), Math.ceil((dias * 3) / 4), dias];

  return (
    <section aria-label="Faturamento acumulado" className="flex flex-col gap-4 rounded-xl bg-surface p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold text-ink">Faturamento acumulado</h2>
          <p className="text-sm text-muted-foreground">Mês atual comparado ao anterior, dia a dia.</p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-terracotta" />
            Este mês: <span className="font-mono text-ink">{formatarMoeda(totalAtual)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-ochre" />
            Mês anterior: <span className="font-mono text-ink">{formatarMoeda(totalAnterior)}</span>
          </li>
        </ul>
      </header>

      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        role="img"
        aria-label={`Faturamento acumulado: ${formatarMoeda(totalAtual)} neste mês contra ${formatarMoeda(totalAnterior)} no mês anterior`}
        className="h-auto w-full"
      >
        {Array.from({ length: DIVISOES_Y + 1 }, (_, i) => {
          const valor = (teto / DIVISOES_Y) * i;
          return (
            <g key={i}>
              <line
                x1={MARGEM.esquerda}
                x2={LARGURA - MARGEM.direita}
                y1={y(valor)}
                y2={y(valor)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={MARGEM.esquerda - 8}
                y={y(valor) + 4}
                textAnchor="end"
                className="fill-muted-foreground font-mono text-[10px]"
              >
                {valor === 0 ? "0" : FORMATO_COMPACTO.format(valor)}
              </text>
            </g>
          );
        })}

        {marcasX.map((dia) => (
          <text
            key={dia}
            x={x(dia - 1)}
            y={ALTURA - 8}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[10px]"
          >
            {dia}
          </text>
        ))}

        <path
          d={linha(serie.anterior)}
          fill="none"
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-ochre"
        />
        <path d={area(serie.atual)} className="fill-terracotta/10" />
        <path
          d={linha(serie.atual)}
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-terracotta"
        />
        {serie.atual.length > 0 ? (
          <circle
            cx={x(serie.atual.length - 1)}
            cy={y(totalAtual)}
            r={4}
            className="fill-terracotta stroke-surface"
            strokeWidth={2}
          />
        ) : null}
      </svg>

      {maximo === 0 ? (
        <p className="-mt-2 text-xs text-muted-foreground">Nenhum pedido pago nos dois meses ainda.</p>
      ) : null}
    </section>
  );
}
