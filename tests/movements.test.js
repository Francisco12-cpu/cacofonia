import { describe, it, expect } from 'vitest';
import { createMovementRegistry } from '../engine/notes/movements.js';

describe('plugins de movimento', () => {
  const movs = createMovementRegistry();

  it('reto nunca desloca a nota', () => {
    expect(movs.apply({ tipo: 'reto' }, 0).laneOffset).toBe(0);
    expect(movs.apply({ tipo: 'reto' }, 1).laneOffset).toBe(0);
  });

  it('zigzag converge para a pista verdadeira exatamente no instante do acerto (p=1)', () => {
    const off = movs.apply({ tipo: 'zigzag' }, 1, 0.7).laneOffset;
    expect(Math.abs(off)).toBeLessThan(1e-9);
  });

  it('zigzag oscila enquanto se aproxima (p entre 0 e 1)', () => {
    const off = movs.apply({ tipo: 'zigzag' }, 0.3, 0).laneOffset;
    expect(off).not.toBe(0);
  });

  it('fantasma fica intangível dentro da janela configurada', () => {
    const def = { tipo: 'fantasma', janelaInvisivel: [0.4, 0.6] };
    expect(movs.apply(def, 0.5).intangivel).toBe(true);
    expect(movs.apply(def, 0.1).intangivel).toBe(false);
  });

  it('ima só puxa o jogador perto do instante do acerto', () => {
    const def = { tipo: 'ima', ativarEm: 0.8, direcaoPistas: -1 };
    expect(movs.apply(def, 0.5).puxaJogador).toBe(0);
    expect(movs.apply(def, 0.9).puxaJogador).toBe(-1);
  });

  it('lança erro para um tipo de movimento desconhecido', () => {
    expect(() => movs.apply({ tipo: 'voo-supersonico' }, 0)).toThrow(/desconhecido/);
  });
});
