# Lumina ERP

Projeto Next.js de painel ERP (módulo de ateliê: insumos, ficha técnica, precificação, estoque, produção e pedidos). Use somente pnpm: `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm typecheck` e `pnpm build`.

Antes de editar, leia [ARCHITECTURE.md](ARCHITECTURE.md) e siga sua estrutura FBS simplificada, convenções de import, regras de Zustand e limites de responsabilidade. Consulte também [AGENTS.md](AGENTS.md). Para UI, leia [docs/DESIGN.md](docs/DESIGN.md) e use os tokens semânticos de `src/app/globals.css`. Não use npm/yarn, barrel files, `any` explícito, cores arbitrárias ou lógica de negócio em UI.
