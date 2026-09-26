import { describe, it, expect } from 'vitest';
import { createEffectRegistry } from '../engine/effects/plugins.js';

describe('plugins de efeito especial', () => {
  const fx = createEffectRegistry();

  it('camera-giro do Maestro Vórtice reproduz a fórmula original (loop>=2, min(3,loop-1))', () => {
    const inst = { tipo: 'camera-giro', aPartirDaVolta: 2 };
    // original: loop>=2 ? sin(nb*PI/8)*0.14*min(3,loop-1) : 0
    const nb = 4, loop = 3;
    const esperado = Math.sin(nb * Math.PI / 8) * 0.14 * Math.min(3, loop - 1);
    expect(fx.evaluate([inst], nb, loop).roll).toBeCloseTo(esperado, 10);
    expect(fx.evaluate([inst], nb, 1).roll).toBe(0); // antes da volta 2, sem giro
  });

  it('apagao (Cantora Fantasma) alterna a cada 16 batidas a partir da volta 1', () => {
    const inst = { tipo: 'apagao', aPartirDaVolta: 1, periodoBatidas: 16 };
    expect(fx.evaluate([inst], 0, 1).dark).toBe(false);
    expect(fx.evaluate([inst], 16, 1).dark).toBe(true);
    expect(fx.evaluate([inst], 0, 0).dark).toBe(false); // antes da volta 1
  });

  it('espelho (Órgão-Mecânico) liga só no último quarto do ciclo, a partir da volta 2', () => {
    const inst = { tipo: 'espelho', aPartirDaVolta: 2, periodoBatidas: 32, inicioFracao: 24 / 32 };
    expect(fx.evaluate([inst], 20, 2).mirror).toBe(false);
    expect(fx.evaluate([inst], 25, 2).mirror).toBe(true);
    expect(fx.evaluate([inst], 25, 1).mirror).toBe(false);
  });

  it('silencio (O Grande Silêncio) combina invert + espelho na mesma fase', () => {
    const inst = { tipo: 'silencio', aPartirDaVolta: 1, espelharAPartirDaVolta: 2 };
    // fase silenciosa: floor(nb/16) % 3 === 2 -> nb=32 -> floor(32/16)=2 -> 2%3===2 true
    expect(fx.evaluate([inst], 32, 2)).toEqual({ invert: true, mirror: true });
    expect(fx.evaluate([inst], 32, 1)).toEqual({ invert: true }); // ainda não espelha na volta 1
  });

  it('combina múltiplos efeitos ligados no mesmo chefe', () => {
    const instancias = [
      { tipo: 'terremoto', aPartirDaVolta: 1 },
      { tipo: 'vitral', aPartirDaVolta: 1 }
    ];
    const out = fx.evaluate(instancias, 20, 2);
    expect(out).toHaveProperty('quake');
    expect(out).toHaveProperty('hue');
  });

  it('lança erro para tipo de efeito desconhecido', () => {
    expect(() => fx.evaluate([{ tipo: 'raio-laser' }], 0, 0)).toThrow(/desconhecido/);
  });
});
