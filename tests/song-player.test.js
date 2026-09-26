import { describe, it, expect } from 'vitest';
import { buildStepIndex } from '../engine/audio/stepIndex.js';

describe('indexação de trilha por passo de 16 avos', () => {
  it('agrupa eventos pelo passo arredondado de pos*4', () => {
    const idx = buildStepIndex([
      { pos: 0, nota: 'A4', duracao: 0.5 },
      { pos: 0.25, nota: 'B4', duracao: 0.25 },
      { pos: 1, nota: 'C5', duracao: 0.5 }
    ]);
    expect(idx.get(0)).toHaveLength(1);
    expect(idx.get(1)).toHaveLength(1);
    expect(idx.get(4)).toHaveLength(1);
    expect(idx.get(2)).toBeUndefined();
  });

  it('vazio para trilha vazia', () => {
    expect(buildStepIndex([]).size).toBe(0);
    expect(buildStepIndex(undefined).size).toBe(0);
  });
});
