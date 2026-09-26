import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentDir } from '../scripts/lib/readContentDir.mjs';
import { createBossRegistry } from '../engine/bosses/registry.js';
import { createSongRegistry } from '../engine/songs/registry.js';
import { createEffectRegistry } from '../engine/effects/plugins.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bossDefs = readContentDir(join(__dirname, '../content/bosses'));
const songRegistry = createSongRegistry(readContentDir(join(__dirname, '../content/songs')).filter((d) => d.trilhas));
const effectRegistry = createEffectRegistry();

describe('registro de chefes', () => {
  it('carrega e valida os 8 chefes migrados, todos referenciando música e efeitos existentes', () => {
    const registry = createBossRegistry(bossDefs, { songRegistry, effectRegistry });
    expect(registry.ids().sort()).toEqual(
      ['maestro', 'dj', 'fantasma', 'zumbido', 'cisne', 'orgao', 'colosso', 'silencio'].sort()
    );
  });

  it('nenhum chefe perdeu falas de introdução ou vitória na migração', () => {
    const registry = createBossRegistry(bossDefs, { songRegistry, effectRegistry });
    for (const boss of registry.all()) {
      expect(boss.falas.intro.length, `${boss.id} sem intro`).toBeGreaterThan(0);
      expect(boss.falas.vitoria.length, `${boss.id} sem vitória`).toBeGreaterThan(0);
    }
  });

  it('rejeita chefe que referencia uma música inexistente', () => {
    expect(() => createBossRegistry(
      [{ id: 'x', nome: 'X', musica: 'nao-existe', hpMax: 100, janelasDeAtaque: [{ batida: 1 }], falas: { intro: ['a'], vitoria: ['b'] } }],
      { songRegistry, effectRegistry }
    )).toThrow(/musica desconhecida/);
  });

  it('rejeita chefe que referencia um efeito especial inexistente', () => {
    expect(() => createBossRegistry(
      [{ id: 'x', nome: 'X', musica: 'maestro', hpMax: 100, efeitosEspeciais: [{ tipo: 'raio-laser' }], janelasDeAtaque: [{ batida: 1 }], falas: { intro: ['a'], vitoria: ['b'] } }],
      { songRegistry, effectRegistry }
    )).toThrow(/efeito especial desconhecido/);
  });

  it('O Grande Silêncio é o único chefe final', () => {
    const registry = createBossRegistry(bossDefs, { songRegistry, effectRegistry });
    const finais = registry.all().filter((b) => b.final);
    expect(finais.map((b) => b.id)).toEqual(['silencio']);
  });

  it('janelas de ataque (Resposta) são pontos fixos, não dependem de estado de jogo', () => {
    const registry = createBossRegistry(bossDefs, { songRegistry, effectRegistry });
    for (const boss of registry.all()) {
      expect(boss.janelasDeAtaque.length).toBeGreaterThanOrEqual(1);
      for (const janela of boss.janelasDeAtaque) expect(typeof janela.batida).toBe('number');
    }
  });
});
