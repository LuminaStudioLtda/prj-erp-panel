import "server-only";

import type { AuthenticatedUser, Permission } from "@/features/rbac/types";
import { hasPermission } from "@/features/rbac/services/access-control";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { ErroDeNegocio, mensagemDoErro } from "@/lib/erro-de-negocio";
import type { ResultadoDaAcao } from "@/lib/resultado-da-acao";

/**
 * Executa o trabalho de uma server action só para quem tem a permissão, devolvendo erros de
 * negócio como mensagem em vez de estourar uma exceção para o navegador.
 */
export async function executarAcao<T>(
  permissao: Permission,
  mensagemPadrao: string,
  trabalho: (ator: AuthenticatedUser) => Promise<T>,
): Promise<ResultadoDaAcao<T>> {
  try {
    const ator = await getAuthenticatedUser();
    if (!ator || !hasPermission(ator.role, permissao)) {
      throw new ErroDeNegocio("Você não tem permissão para esta ação.");
    }
    return { ok: true, dados: await trabalho(ator) };
  } catch (erro) {
    return { ok: false, erro: mensagemDoErro(erro, mensagemPadrao) };
  }
}
