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

describe('amuletos da Aventura', () => {
  const novo = (amuletos, hpExtra = 0) => {
    const boss = bosses.get('maestro');
    return new BattleController({ boss, song: songs.get(boss.musica), noteTypes, effects, amuletos, hpExtra });
  };

  it('fôlego dá +20 de HP e o nível soma vida extra', () => {
    expect(novo([]).maxHp).toBe(100);
    expect(novo(['fole'], 30).maxHp).toBe(150);
  });

  it('esporo levanta uma única vez com 40% de HP', () => {
    const b = novo(['esporo']);
    b.hurt(500); expect(b.over).toBe(false); expect(b.hp).toBe(40);
    b.inv = 0; b.hurt(500); expect(b.over).toBe(true);
  });

  it('chá cura 12 quando a música dá a volta', () => {
    const b = novo(['cha']);
    b.hurt = () => {};
    b.hp = 50;
    b.update(1, 0.016);
    b.update(songs.get('maestro').comprimentoBatidas + 0.1, 0.016);
    expect(b.hp).toBe(62);
  });

  it('tênis alonga a janela segura do pulo e o metrônomo reduz a aceleração', () => {
    const b = novo(['tenis', 'metro']);
    b.jump = true; b.jt = 460;
    expect(b.jumpSafe()).toBe(true);
    expect(novo([]).multiplicadorAceleracao()).toBe(1);
    expect(b.multiplicadorAceleracao()).toBe(0.5);
  });
});

describe('movimentos especiais na batalha', () => {
  const lutaCom = (tipo, lane) => {
    const boss = bosses.get('maestro');
    const b = new BattleController({ boss, song: songs.get(boss.musica), noteTypes, effects, chart: [{ beat: 8, lanes: [lane], type: tipo, len: 0 }] });
    b._startResponseIfDue = () => {};
    return b;
  };

  it('divisora se parte em duas pistas no meio do caminho', () => {
    const b = lutaCom('divisora', 2);
    for (let nb = 0; nb < 7.5; nb += 0.05) b.update(nb, 0.016);
    const pistas = b.notes.filter((n) => n.type === 'divisora' && n.beat === 8).map((n) => n.lanes[0]).sort();
    expect(pistas).toEqual([1, 3]);
  });

  it('ímã puxa o jogador uma pista na direção da nota', () => {
    const b = lutaCom('ima', 4);
    b.lane = 2;
    for (let nb = 0; nb < 7.8; nb += 0.05) b.update(nb, 0.016);
    expect(b.lane).toBe(3);
  });

  it('gelo deixa o jogador lento se acertar', () => {
    const b = lutaCom('gelo', 2);
    b.lane = 2;
    for (let nb = 0; nb < 8.2; nb += 0.05) b.update(nb, 0.016);
    expect(b.lento).toBeGreaterThan(0);
    b.moveLane(1); b.moveLane(1);
    expect(b.lane).toBe(3); // a segunda troca foi barrada pela lentidão
  });

  it('fantasma fica quase invisível no meio do caminho', () => {
    const b = lutaCom('fantasma', 1);
    for (let nb = 0; nb < 5.8; nb += 0.05) b.update(nb, 0.016);
    expect(b.notes[0]._opacidade).toBeLessThan(0.5);
  });
});
