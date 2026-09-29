# Design System - Lumina ERP

## Princípios

O painel deve ser operacional, calmo e legível: informação densa, hierarquia clara e feedback de estado inequívoco. Privilegie interfaces responsivas, sem ornamentação visual desnecessária.

## Paleta semântica

| Token | Hex | Uso obrigatório |
| --- | --- | --- |
| `canvas` | `#F9F7F2` | Fundo principal quente. |
| `surface` | `#FFFFFF` | Formulários, tabelas e superfícies elevadas. |
| `ink` | `#30312E` | Texto principal, navegação e alto contraste. |
| `muted` | `#777773` | Texto secundário e metadados. |
| `border` | `#E4E2DD` | Divisórias e bordas sutis. |
| `terracotta` | `#8C6A5D` | Ação primária, foco e seleção. |
| `sage` | `#A3B18A` | Sucesso, disponibilidade saudável e estados positivos. |
| `ochre` | `#D4A373` | Avisos leves e detalhes editoriais. |
| `critical` | `#9B3A32` | Erros, ações destrutivas e estados críticos. |

Os valores estão mapeados em `src/app/globals.css`. Use classes semânticas como `bg-primary`, `text-muted`, `border-border` e `text-destructive`; não espalhe hexadecimais nos componentes.

Não use preto puro, cores neon, gradientes decorativos, sombras brilhantes ou `sage` e `ochre` como ações primárias concorrentes.

## Componentes e estados

- Use primitives shadcn/ui em `src/components/ui` e componha componentes de domínio dentro da feature correspondente.
- Botões primários usam terracota. Erros usam `critical`; sucesso usa `sage`; avisos usam `ochre`.
- Campos possuem rótulo acima e erro abaixo. Estados de carregamento preservam o volume do conteúdo com skeletons.
- Centralize mapeamentos de status por domínio; não defina cores de status soltas em páginas.

## Layout e acessibilidade

- Painéis administrativos usam sidebar persistente no desktop e drawer no mobile.
- Abaixo de 768 px, layouts em múltiplas colunas passam para uma coluna e alvos de toque têm ao menos 44 px.
- Tabelas devem ter alternativa em cards ou rolagem horizontal claramente indicada em telas pequenas.
- Use `min-h-[100dvh]`, foco visível em terracota, contraste AA, rótulos associados e navegação completa por teclado.
- Animações duram de 150 a 220 ms e usam apenas `transform` ou `opacity`. Respeite `prefers-reduced-motion`.
