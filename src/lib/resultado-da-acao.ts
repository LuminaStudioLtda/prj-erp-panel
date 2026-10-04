export type ResultadoDaAcao<T = void> = { ok: true; dados: T } | { ok: false; erro: string };
