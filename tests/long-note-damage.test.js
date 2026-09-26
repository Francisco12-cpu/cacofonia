import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentDir } from '../scripts/lib/readContentDir.mjs';
import { createNoteTypeRegistry } from '../engine/notes/registry.js';
import { tickLongNoteDamage, finalizeLongNote } from '../engine/battle/collision.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const noteTypes = createNoteTypeRegistry(readContentDir(join(__dirname, '../content/notetypes')));

describe('dano de nota longa (bíblia 3.2)', () => {
  it('causa dano repetido por tique de tempo real, não uma vez só', () => {
    const longa = noteTypes.get('longa'); // altura "alta", tiqueDano.intervalo = 0.35s
    const note = { hit: 0, len: 4, lanes: [2], judged: false, tickTimer: 0 };

    // jogador fica 1.4s dentro da nota, avançando em frames de 0.1s (14 frames)
    let totalDano = 0;
    let nowBeat = 0;
    for (let i = 0; i < 14; i++) {
      nowBeat += 0.1; // beats avançam junto por simplicidade do teste
      totalDano += tickLongNoteDamage(note, longa, {
        lane: 2, jumpSafe: false, nowBeat, dtSeconds: 0.1
      });
    }

    // 1.4s / 0.35s = 4 tiques inteiros -> 4x o dano, nunca 1x (o bug antigo)
    expect(totalDano).toBe(longa.dano * 4);
    expect(totalDano).toBeGreaterThan(longa.dano); // trava de regressão explícita
  });

  it('não causa dano se o jogador sai da pista da nota', () => {
    const longa = noteTypes.get('longa');
    const note = { hit: 0, len: 4, lanes: [2], judged: false, tickTimer: 0 };
    const dano = tickLongNoteDamage(note, longa, { lane: 0, jumpSafe: false, nowBeat: 1, dtSeconds: 1 });
    expect(dano).toBe(0);
  });

  it('nota longa de altura "alta" não é evitável pulando (precisa trocar de pista)', () => {
    const longa = noteTypes.get('longa');
    const note = { hit: 0, len: 4, lanes: [2], judged: false, tickTimer: 0 };
    const dano = tickLongNoteDamage(note, longa, { lane: 2, jumpSafe: true, nowBeat: 0.5, dtSeconds: 0.5 });
    expect(dano).toBeGreaterThan(0);
  });

  it('acumulador não perde tiques mesmo com frames longos (independe da taxa de quadros)', () => {
    const longa = noteTypes.get('longa');
    const noteFrames = { hit: 0, len: 10, lanes: [1], judged: false, tickTimer: 0 };
    const noteOneBigFrame = { hit: 0, len: 10, lanes: [1], judged: false, tickTimer: 0 };

    let danoFrames = 0, nb = 0;
    for (let i = 0; i < 70; i++) { // 70 frames de 0.05s = 3.5s
      nb += 0.05;
      danoFrames += tickLongNoteDamage(noteFrames, longa, { lane: 1, jumpSafe: false, nowBeat: nb, dtSeconds: 0.05 });
    }
    const danoUmFrame = tickLongNoteDamage(noteOneBigFrame, longa, { lane: 1, jumpSafe: false, nowBeat: 3.5, dtSeconds: 3.5 });

    expect(danoFrames).toBe(danoUmFrame);
  });

  it('dá combo (não-dano) ao finalizar uma nota longa nunca atingida', () => {
    const longa = noteTypes.get('longa');
    const note = { hit: 0, len: 2, lanes: [3], judged: false, tickTimer: 0 };
    // jogador nunca fica na pista 3
    tickLongNoteDamage(note, longa, { lane: 0, jumpSafe: false, nowBeat: 1, dtSeconds: 1 });
    const resultado = finalizeLongNote(note, 2.1);
    expect(resultado).toBe(true); // true = combo, nota nunca causou dano
    expect(note.judged).toBe(true);
  });
});
