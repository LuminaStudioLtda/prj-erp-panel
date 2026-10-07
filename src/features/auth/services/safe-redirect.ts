/** Aceita apenas caminhos internos, evitando open redirect. */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback: string,
) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
