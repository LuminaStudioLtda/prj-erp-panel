# Lumina ERP

Painel ERP da Lumina, com módulos de ateliê, construído com Next.js, TypeScript, Tailwind CSS, shadcn/ui e Phosphor Icons.

## Começar a desenvolver

O app Next, a governança, os hooks e o CI vivem na raiz do repositório.

```bash
copy .env.example .env
pnpm install
pnpm db:up
pnpm db:migrate:dev
pnpm db:seed
pnpm dev
```

Abra `http://localhost:3000`.

Copie `.env.example` para `.env`; a senha do PostgreSQL ali é só para desenvolvimento local. Suba o banco com `pnpm db:up` e aplique o schema inicial com `pnpm db:migrate:dev`. Defina `SESSION_SECRET` com um valor aleatório de pelo menos 32 bytes e gere o client do Prisma com `pnpm db:generate`.

## Comandos de qualidade

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm test:integration
```

Os três comandos precisam passar antes de abrir um PR. O pré-commit usa Husky + lint-staged para impedir commits com erro de lint, de tipos ou `any` explícito em código de aplicação. O GitHub Actions repete lint, tipos e build em ambiente limpo.

## Fluxo de entrega

```
feat/* ou fix/*  →  homolog (QA)  →  main (produção)
```

- `main` é intocável por push direto, representa produção e só recebe PR de `homolog`.
- `homolog` é o ambiente de integração e QA.
- Cada pessoa cria `feat/*`, `fix/*` ou `chore/*` a partir de `homolog` e abre PR de volta para `homolog`.
- Pedro é o responsável por revisar e fazer merge em `main`.
- Use PRs pequenos, vinculados a uma issue/cartão Trello, e commits no padrão Conventional Commits.

As regras completas de operação, proteção no GitHub e deploy estão em [docs/OPERACAO_E_GOVERNANCA.md](docs/OPERACAO_E_GOVERNANCA.md). O procedimento diário está em [CONTRIBUTING.md](CONTRIBUTING.md). O modelo visual, as regras de negócio extraídas do Stitch e o backlog de MVP estão em [docs/DESIGN.md](docs/DESIGN.md), [docs/REGRAS_DE_NEGOCIO.md](docs/REGRAS_DE_NEGOCIO.md) e [docs/TRELLO_BACKLOG_MVP.md](docs/TRELLO_BACKLOG_MVP.md).

## UI e Stitch

shadcn/ui é a fonte dos primitives acessíveis e versionados no próprio projeto; Phosphor Icons é o padrão de ícones. O modelo Stitch já foi decomposto em tokens, layout, componentes reutilizáveis, estados, regras e backlog nos documentos acima. Não usamos o Stitch como código pronto sem essa revisão.
