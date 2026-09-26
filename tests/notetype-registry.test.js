import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentDir } from '../scripts/lib/readContentDir.mjs';
import { createNoteTypeRegistry } from '../engine/notes/registry.js';
import { validateNoteType } from '../engine/notes/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, '../content/notetypes');

describe('registro de tipos de nota', () => {
  it('carrega e valida todos os 7 tipos migrados do protótipo', () => {
    const defs = readContentDir(contentDir);
    const registry = createNoteTypeRegistry(defs);
    const ids = registry.ids().sort();
    expect(ids).toEqual(['dourada', 'larga', 'longa', 'normal', 'onda', 'parede', 'zigue-zague'].sort());
  });

  it('rejeita um tipo sem os campos obrigatórios', () => {
    expect(() => validateNoteType({ id: 'quebrado' })).toThrow(/inválido/);
  });

  it('exige tiqueDano em nota alta com duração variável', () => {
    expect(() => validateNoteType({
      id: 'teste', nome: 'Teste', forma: 'prisma', pistas: 1, altura: 'alta',
      duracao: 1, duracaoVariavel: true, cor: '#ff0000', instrumento: 'lead',
      dano: 10, avisoBatidas: 'auto', movimento: { tipo: 'reto' }
    })).toThrow(/tiqueDano/);
  });

  it('resolve avisoBatidas "auto" a partir de pistas e altura', () => {
    const defs = readContentDir(contentDir);
    const registry = createNoteTypeRegistry(defs);
    const parede = registry.get('parede');
    const normal = registry.get('normal');
    expect(parede.avisoBatidasResolvido).toBeGreaterThan(normal.avisoBatidasResolvido);
  });
});
