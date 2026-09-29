# Como contribuir

## Fluxo obrigatório

1. Atualize a branch `hml`: `git switch hml` e `git pull origin hml`.
2. Crie uma branch curta a partir dela: `git switch -c feat/nome-da-entrega`.
3. Faça commits pequenos em inglês no padrão Conventional Commits, por exemplo `feat: add inventory dashboard`.
4. Abra um PR para `hml`, vinculando a issue ou tarefa e preenchendo o template do PR.
5. Após revisão, CI verde e validação de QA em `hml`, promova `hml` para `main` por PR.

Não faça push direto em `main` ou `hml`, não force-push em branches compartilhadas e não inclua `.env` ou chaves no Git.

## Antes de abrir o PR

```bash
pnpm lint
pnpm typecheck
pnpm build
```

O hook de pré-commit executa lint e checagem de tipos para arquivos de aplicação. O CI executa lint, tipos e build limpo em todos os PRs.

## Padrões

- TypeScript estrito; `any` explícito é erro.
- Componentes reutilizáveis entre domínios ficam em `src/components`; componentes shadcn/ui em `src/components/ui`.
- Use o alias `@/` para imports internos.
- Não altere componentes `ui` sem necessidade: prefira compor ou criar componente de domínio dentro de `src/features`.
- O PR deve ter uma única intenção. Mudanças de escopo exigem nova issue ou tarefa.
