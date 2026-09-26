import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Lê todo *.json de um diretório de conteúdo e retorna os objetos parseados. Usado por scripts e testes em Node, fora do pipeline do Vite. */
export function readContentDir(dirPath) {
  return readdirSync(dirPath)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dirPath, f), 'utf8')));
}
