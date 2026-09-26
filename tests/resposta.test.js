import { describe, it, expect } from 'vitest';
import {
  createMelodyCollector, startResponsePhase, judgeResponseHit, finalizeResponse, expireIfMissed, notaAtual
} from '../engine/battle/resposta.js';

describe('mecânica Resposta (seção 4)', () => {
  it('coleta notas douradas ao longo da luta normal', () => {
    const melodia = createMelodyCollector();
    melodia.collect('A4', 4);
    melodia.collect('C5', 8);
    expect(melodia.tamanho).toBe(2);
    expect(melodia.snapshot()).toEqual([{ nota: 'A4', beat: 4 }, { nota: 'C5', beat: 8 }]);
  });

  it('melodia completa e bem cronometrada dá dano cheio', () => {
    const melodia = createMelodyCollector();
    melodia.collect('A4', 0); melodia.collect('B4', 1); melodia.collect('C5', 2);
    const fase = startResponsePhase(melodia.snapshot(), { intervaloBatidas: 1 });
    judgeResponseHit(fase, 0);
    judgeResponseHit(fase, 1);
    judgeResponseHit(fase, 2);
    const resultado = finalizeResponse(fase, 3, 100);
    expect(resultado.completude).toBe(1);
    expect(resultado.precisaoMedia).toBe(1);
    expect(resultado.dano).toBe(100);
  });

  it('melodia incompleta (só coletou parte) dá dano proporcional', () => {
    const melodia = createMelodyCollector();
    melodia.collect('A4', 0); melodia.collect('B4', 1); // só 2 de 4 douradas que passaram
    const fase = startResponsePhase(melodia.snapshot());
    judgeResponseHit(fase, 0);
    judgeResponseHit(fase, 1);
    const resultado = finalizeResponse(fase, 4, 100);
    expect(resultado.completude).toBe(0.5);
    expect(resultado.dano).toBe(50);
  });

  it('muito desafinada (erros de tempo consecutivos) colapsa o dano', () => {
    const melodia = createMelodyCollector();
    melodia.collect('A4', 0); melodia.collect('B4', 1); melodia.collect('C5', 2);
    const fase = startResponsePhase(melodia.snapshot());
    judgeResponseHit(fase, 5); // muito longe da janela -> "errou"
    judgeResponseHit(fase, 9);
    judgeResponseHit(fase, 13);
    const resultado = finalizeResponse(fase, 3, 100);
    expect(resultado.precisaoMedia).toBe(0);
    expect(resultado.dano).toBe(0);
  });

  it('acerto dentro da janela "boa" mas fora da "perfeita" vale menos', () => {
    const melodia = createMelodyCollector();
    melodia.collect('A4', 0);
    const fase = startResponsePhase(melodia.snapshot());
    const r = judgeResponseHit(fase, 0.2, { boa: 0.3, perfeita: 0.1 });
    expect(r.qualidade).toBe('bom');
  });

  it('não responder a tempo conta como erro e mantém a ordem (expireIfMissed)', () => {
    const melodia = createMelodyCollector();
    melodia.collect('A4', 0); melodia.collect('B4', 1);
    const fase = startResponsePhase(melodia.snapshot());
    expect(notaAtual(fase).nota).toBe('A4');
    expireIfMissed(fase, 1.0, 0.3); // passou da janela da primeira nota sem apertar
    expect(fase.respostas[0].qualidade).toBe('errou');
    expect(notaAtual(fase).nota).toBe('B4'); // avançou pra próxima, ordem preservada
  });

  it('fase sem nenhuma dourada coletada já começa encerrada, sem dano', () => {
    const fase = startResponsePhase([]);
    expect(fase.encerrada).toBe(true);
    const resultado = finalizeResponse(fase, 5, 100);
    expect(resultado.dano).toBe(0);
  });
});
