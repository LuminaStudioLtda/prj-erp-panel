const PADRAO_DO_CODIGO = /^#?LUM-(\d{4})-(\d{1,})$/i;

/** Código legível e sequencial do pedido: `#LUM-2026-0001`. */
export function formatarCodigoDoPedido(ano: number, sequencia: number): string {
  return `#LUM-${ano}-${String(sequencia).padStart(4, "0")}`;
}

/** Normaliza o que o usuário digitou (`lum-2026-1`, `#LUM-2026-0001`) para o formato oficial, ou `null`. */
export function normalizarCodigoDoPedido(texto: string): string | null {
  const encontrado = PADRAO_DO_CODIGO.exec(texto.trim());
  if (!encontrado) return null;

  const sequencia = Number(encontrado[2]);
  return sequencia > 0 ? formatarCodigoDoPedido(Number(encontrado[1]), sequencia) : null;
}

const PADRAO_DO_PRODUTO = /^LUM-P-(\d{1,})$/i;

/** Código de produto no formato `LUM-P-0001`, ou `null` se o texto não for um. */
export function normalizarCodigoDoProduto(texto: string): string | null {
  const encontrado = PADRAO_DO_PRODUTO.exec(texto.trim().replace(/^#/, ""));
  if (!encontrado) return null;

  const sequencia = Number(encontrado[1]);
  return sequencia > 0 ? `LUM-P-${String(sequencia).padStart(4, "0")}` : null;
}
