/** Erro com mensagem segura para exibir ao usuário (regra de negócio violada, não falha técnica). */
export class ErroDeNegocio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroDeNegocio";
  }
}

export function mensagemDoErro(erro: unknown, padrao: string): string {
  return erro instanceof ErroDeNegocio ? erro.message : padrao;
}
