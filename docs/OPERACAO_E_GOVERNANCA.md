# Operação, qualidade e governança

## Ambientes e branches

| Branch | Ambiente | Recebe pull requests de |
| --- | --- | --- |
| `main` | Produção | `hml` |
| `hml` | Homologação / QA | `feat/*`, `fix/*`, `chore/*` |
| `feat/*`, `fix/*`, `chore/*` | Desenvolvimento | criada a partir de `hml` |

O fluxo normal é `feature → hml → main`. Uma correção urgente pode ser criada a partir de `main` com o prefixo `hotfix/`, passar por PR para `main` e ser imediatamente trazida de volta para `hml`.

## Política de PR

- Nenhuma alteração chega a `main` por push direto.
- Todo merge depende de CI verde e PR aprovado.
- PR para `hml` deve ter tarefa vinculada, objetivo, critério de aceite, evidência visual quando aplicável e plano de teste.
- Use squash merge com título no padrão Conventional Commits.

## Proteções a configurar no GitHub

Estas configurações exigem permissão administrativa e não podem ser versionadas no Git:

1. Em **Settings → Rules → Rulesets**, crie uma regra para `main`:
   - bloqueie deleção e force push;
   - exija pull request, uma aprovação e descarte aprovações desatualizadas;
   - exija o status check `lint, typecheck and build`;
   - exija conversa resolvida;
   - restrinja bypass às pessoas autorizadas para a branch.
2. Crie a mesma proteção para `hml`, permitindo PRs e exigindo o status check `lint, typecheck and build`.
3. Em **Settings → General → Pull Requests**, habilite apenas **Squash merging**.
4. Dê aos colaboradores o menor nível de acesso necessário; mantenha permissões administrativas restritas.

## Deploy recomendado

Use um único projeto Vercel conectado ao repositório:

- `main` publica produção;
- `hml` publica preview estável de homologação;
- cada PR recebe preview isolado para revisão.

Defina a raiz do repositório como **Root Directory** do projeto Vercel. Segredos devem existir somente nas variáveis de ambiente da Vercel/GitHub; nunca em arquivos `.env` commitados.
