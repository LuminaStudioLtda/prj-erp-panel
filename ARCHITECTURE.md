# Arquitetura - Lumina ERP

## Visão geral

Este repositório contém a base do painel ERP da Lumina. Os módulos de negócio serão adicionados de forma incremental, por domínio. Nenhuma regra do e-commerce foi migrada para este projeto.

O Next.js App Router entrega rotas. Regras de negócio pertencem à feature que as utiliza, nunca à página, layout ou componente visual.

## Estrutura de pastas

```text
src/
  app/          # Rotas, layouts e Route Handlers do Next.js App Router.
  features/     # Domínios de negócio e seus casos de uso.
  components/   # UI reutilizada por duas ou mais features; shadcn em components/ui.
  hooks/        # Hooks reutilizados por duas ou mais features.
  lib/          # Clientes de API/PostgreSQL e helpers gerais sem domínio específico.
  store/        # Stores Zustand compartilhadas, uma por domínio.
```

### Onde cada coisa vai

- Uma feature fica em `src/features/<nome-em-kebab-case>/` e pode ter `components/`, `hooks/`, `services/` e `types.ts` próprios.
- Código usado apenas por uma feature permanece nela. Código usado por duas ou mais sobe para `components/`, `hooks/`, `lib/` ou `store/`.
- `components/` contém UI sem regra de domínio. Primitives do shadcn/ui ficam em `components/ui/`.
- `lib/` concentra clientes de infraestrutura e helpers gerais. Acesso ao PostgreSQL (via Prisma) ocorre somente em `services/` da feature responsável, usando o cliente definido em `lib/`.
- `store/` contém estado global ou compartilhado entre features. Nomeie cada arquivo como `use-<dominio>-store.ts`. Estado local de uma feature permanece nela.
- Não crie `shared/`, `entities/`, `widgets/` ou uma pasta genérica de tipos.

## Convenções

- Features e diretórios: `kebab-case` (`contas-a-pagar`, `controle-estoque`).
- Componentes React: `PascalCase.tsx`.
- Hooks: `use-nome-do-hook.ts`.
- Serviços: `nome-do-servico.ts`.
- Tipos: no arquivo onde são usados ou em `features/<feature>/types.ts`; não crie `src/types`.
- Importe o arquivo real diretamente. Barrel files `index.ts` e `index.tsx` que apenas reexportam arquivos são proibidos.
- Use os aliases `@/features/*`, `@/components/*`, `@/hooks/*`, `@/lib/*` e `@/store/*`.
- TypeScript é estrito; `any` explícito é proibido.

## Estado, design e dados

Zustand é a solução de estado global. Crie uma store somente para estado que atravesse componentes ou features. Não duplique dados persistidos: o serviço da feature é a fonte de dados do servidor.

Para UI, siga [docs/DESIGN.md](docs/DESIGN.md). Cores são consumidas pelos tokens semânticos de `src/app/globals.css`; não use hex ou cor utilitária arbitrária nos componentes.

## Stack e comandos

- Next.js App Router e React
- TypeScript estrito
- Tailwind CSS e shadcn/ui
- Zustand
- PostgreSQL com Prisma para persistência; autenticação própria (senha com scrypt e sessão JWT em cookie httpOnly)

Use exclusivamente pnpm:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## Commits e qualidade

Husky roda `pnpm exec lint-staged` antes de cada commit. Para arquivos JS/TS/TSX em `src`, lint-staged executa `pnpm lint` e `pnpm typecheck`.

Antes de abrir PR, execute também `pnpm build`. Não contorne hooks nem edite `node_modules` manualmente.

## Regras de negócio

As regras de negócio do ERP ainda não foram fornecidas. Não crie ou deduza regras a partir deste template. Quando a especificação estiver disponível, registre a fonte de verdade e o resumo aprovado nesta seção.

## Restrições importantes

- Não implemente lógica de negócio em componentes de UI, layouts ou páginas.
- Não acesse o banco diretamente fora de services da feature responsável.
- Não use npm ou yarn.
- Não crie dependências circulares entre features.
- Não suba segredos, arquivos `.env` ou dados pessoais para o Git.
