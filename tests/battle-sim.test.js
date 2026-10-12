import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentDir } from '../scripts/lib/readContentDir.mjs';
import { createBossRegistry } from '../engine/bosses/registry.js';
import { createSongRegistry } from '../engine/songs/registry.js';
import { createNoteTypeRegistry } from '../engine/notes/registry.js';
import { createEffectRegistry } from '../engine/effects/plugins.js';
import { BattleController } from '../game/battle/BattleController.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const songs = createSongRegistry(readContentDir(join(__dirname, '../content/songs')).filter((d) => d.trilhas));
const effects = createEffectRegistry();
const bosses = createBossRegistry(readContentDir(join(__dirname, '../content/bosses')), { songRegistry: songs, effectRegistry: effects });
const noteTypes = createNoteTypeRegistry(readContentDir(join(__dirname, '../content/notetypes')));

/**
 * Simula uma luta com um "bot perfeito" (coleta toda dourada no centro e
 * responde no centro de cada barra), sem dano de esquiva. Garante que a luta
 * é vencível — antes, as janelas de Resposta acabavam na batida 56 e nenhum
 * chefe podia ser derrotado.
 */
function simular(bossId, maxBatidas = 2000) {
  const boss = bosses.get(bossId);
  const battle = new BattleController({ boss, song: songs.get(boss.musica), noteTypes, effects });
  battle.hurt = () => {};
  const dt = 1 / 60, bps = songs.get(boss.musica).bpm / 60;
  let nb = -4;
  while (!battle.over && nb < maxBatidas) {
    nb += dt * bps;
    battle.update(nb, dt);
    const fase = battle.responsePhase;
    if (fase) {
      const alvo = fase.notas[fase.indiceAtual];
      if (alvo && nb - fase._inicioBeat >= alvo.janelaCentro) battle.doCollect();
      continue;
    }
    const dourada = battle.notes.find((n) => !n.judged && noteTypes.get(n.type).coletavel && nb >= n.beat);
    if (dourada) { battle.lane = dourada.lanes[0]; battle.doCollect(); }
  }
  return { battle, nb };
}

describe('simulação de luta completa', () => {
  for (const id of bosses.ids()) {
    it(`${id}: um jogador perfeito vence`, () => {
      const { battle } = simular(id);
      expect(battle.over).toBe(true);
      expect(battle.vencedor).toBe(true);
    });
  }

  it('a coreografia não acaba depois de algumas voltas', () => {
    const boss = bosses.get('maestro');
    const battle = new BattleController({ boss, song: songs.get(boss.musica), noteTypes, effects });
    battle.hurt = () => {};
    battle._startResponseIfDue = () => {};
    let vistas = 0;
    for (let nb = 0; nb < 400; nb += 0.05) {
      battle.update(nb, 0.03);
      if (nb > 380) vistas += battle.notes.length;
    }
    expect(vistas).toBeGreaterThan(0);
  });
});
