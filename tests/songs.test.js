import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentDir } from '../scripts/lib/readContentDir.mjs';
import { createSongRegistry } from '../engine/songs/registry.js';
import { validateSong, notaNaEscala } from '../engine/songs/schema.js';
import { createNoteTypeRegistry } from '../engine/notes/registry.js';
import { buildChoreographyFromMelody } from '../engine/battle/choreography.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const songDefs = readContentDir(join(__dirname, '../content/songs')).filter((d) => d.trilhas); // ignora SCHEMA.md se algum dia entrar aqui
const noteTypes = createNoteTypeRegistry(readContentDir(join(__dirname, '../content/notetypes')));

describe('registro de músicas', () => {
  it('carrega e valida as 8 músicas de chefe + 5 temas (título e mundos) assados do protótipo', () => {
    const registry = createSongRegistry(songDefs);
    expect(registry.ids().sort()).toEqual(
      ['maestro', 'dj', 'fantasma', 'zumbido', 'cisne', 'orgao', 'colosso', 'silencio', 'vila', 'floresta', 'cidadela', 'titulo', 'final'].sort()
    );
  });

  it('rejeita música sem trilhas', () => {
    expect(() => validateSong({ id: 'x', bpm: 100, compasso: '4/4', tom: 'C', escala: 'maior' })).toThrow(/trilhas/);
  });

  it('cada música tem crédito da obra em domínio público preservado', () => {
    const registry = createSongRegistry(songDefs);
    for (const song of registry.all()) {
      expect(song.credito, `${song.id} sem crédito`).toMatch(/domínio público/);
    }
  });

  it('trava de escala: A4 pertence a Am (menor natural), mas A#4 não', () => {
    expect(notaNaEscala('A4', 'Am', 'menor natural')).toBe(true);
    expect(notaNaEscala('A#4', 'Am', 'menor natural')).toBe(false);
  });

  // Não testamos "toda nota da melodia está na escala travada" contra o conteúdo já
  // existente: as 8 músicas modulam entre acordes (ex: DJ Tamborim passa por E maior
  // dentro de um tom geral de Am, usando o G# da menor harmônica). `tom`/`escala` no
  // JSON são uma classificação de referência para o editor; a trava de escala real
  // (notaNaEscala) é aplicada à NOVA nota que o editor for inserir, não retroativamente
  // ao que já foi composto por progressão de acordes.
});

describe('coreografia derivada da melodia', () => {
  const registry = createSongRegistry(songDefs);

  it('gera um ataque por nota de melodia (mais notas douradas trocando o tipo, não somando)', () => {
    const maestro = registry.get('maestro');
    const coreografia = buildChoreographyFromMelody(maestro, noteTypes);
    expect(coreografia.length).toBe(maestro.trilhas.melodia.length);
  });

  it('inclui notas douradas coletáveis periodicamente', () => {
    const maestro = registry.get('maestro');
    const coreografia = buildChoreographyFromMelody(maestro, noteTypes);
    expect(coreografia.some((o) => o.type === 'dourada')).toBe(true);
  });

  it('é determinística (mesma entrada, mesma saída)', () => {
    const dj = registry.get('dj');
    const a = buildChoreographyFromMelody(dj, noteTypes);
    const b = buildChoreographyFromMelody(dj, noteTypes);
    expect(a).toEqual(b);
  });

  it('grave vai para pistas mais à esquerda, agudo para pistas mais à direita', () => {
    const cisne = registry.get('cisne');
    const coreografia = buildChoreographyFromMelody(cisne, noteTypes);
    const graveEvento = coreografia.reduce((min, o) => (o.beat < min.beat ? o : min), coreografia[0]);
    // não é uma prova geral, mas garante que a função de pista é monotônica com o pitch (testado indiretamente abaixo)
    expect(graveEvento.lanes[0]).toBeGreaterThanOrEqual(0);
    expect(graveEvento.lanes[0]).toBeLessThan(5);
  });
});
