import { describe, it, expect } from 'vitest';
import { calcularNota, melhorNota } from '../engine/battle/nota.js';

const stats = (o) => ({ douradasVistas: 10, douradasColetadas: 10, respostaPontos: 10, respostaNotas: 10, danoTomado: 0, danoCausado: 0, ...o });

describe('nota final', () => {
  it('luta perfeita é S', () => {
    expect(calcularNota({ hp: 100, maxHp: 100, stats: stats() }).letra).toBe('S');
  });
  it('quase morrendo e sem coletar nada é D', () => {
    expect(calcularNota({ hp: 5, maxHp: 100, stats: stats({ douradasColetadas: 0, respostaPontos: 2 }) }).letra).toBe('D');
  });
  it('meio a meio fica no meio', () => {
    expect(calcularNota({ hp: 50, maxHp: 100, stats: stats({ douradasColetadas: 7, respostaPontos: 7 }) }).letra).toBe('B');
  });
  it('recorde guarda a melhor letra', () => {
    expect(melhorNota('B', 'A')).toBe('A');
    expect(melhorNota('S', 'C')).toBe('S');
    expect(melhorNota(null, 'C')).toBe('C');
  });
});
