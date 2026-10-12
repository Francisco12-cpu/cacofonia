import { describe, it, expect } from 'vitest';
import { periodoDasJanelas, janelaDevida } from '../engine/battle/janelas.js';

describe('janelas de ataque repetidas', () => {
  const janelas = [{ batida: 24 }, { batida: 56 }];

  it('período é o menor múltiplo da volta que passa da última janela', () => {
    expect(periodoDasJanelas(janelas, 32)).toBe(64);
    expect(periodoDasJanelas([{ batida: 64 }], 32)).toBe(96);
    expect(periodoDasJanelas([{ batida: 23.625 }, { batida: 55.125 }], 31.5)).toBe(63);
  });

  it('as janelas continuam depois da última declarada (luta sempre vencível)', () => {
    const feitas = new Set();
    const vistas = [];
    for (let b = 0; b < 200; b += 0.25) {
      const j = janelaDevida(janelas, 32, b, feitas);
      if (j !== null) { feitas.add(j); vistas.push(j); }
    }
    expect(vistas).toEqual([24, 56, 88, 120, 152, 184]);
  });

  it('nada antes da primeira janela', () => {
    expect(janelaDevida(janelas, 32, 10, new Set())).toBeNull();
  });
});
