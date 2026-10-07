# Lumina ERP

Base Next.js para o painel ERP da Lumina. Stack: Next.js, TypeScript, Tailwind, shadcn/ui, Zustand, PostgreSQL e Prisma.

Para iniciar: `pnpm install` e `pnpm dev`. Use exclusivamente pnpm.

Antes de qualquer alteração estrutural, de convenção ou regra de negócio, leia [ARCHITECTURE.md](ARCHITECTURE.md). Antes de implementar ou alterar UI, leia [docs/DESIGN.md](docs/DESIGN.md) e use apenas os tokens semânticos definidos em `src/app/globals.css`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
