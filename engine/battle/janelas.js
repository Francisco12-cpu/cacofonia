/**
 * Janelas de ataque (seção 3.4/4): pontos fixos definidos por cada chefe em
 * batidas absolutas. A música toca em loop indefinidamente, então o padrão
 * de janelas se repete com período = menor múltiplo da volta que contém a
 * última janela (ex.: volta de 32 batidas, janelas em 24 e 56 -> período 64
 * -> 24, 56, 88, 120, ...). Continua determinístico e fixo por chefe — só
 * não "acaba" depois da última janela declarada, o que deixava a luta
 * impossível de vencer.
 */
export function periodoDasJanelas(janelas, comprimentoVolta) {
  const ultima = Math.max(0, ...janelas.map((j) => j.batida));
  return comprimentoVolta * (Math.floor(ultima / comprimentoVolta) + 1);
}

/** Primeira janela (batida absoluta) com início <= nowBeat ainda não consumida, ou null. */
export function janelaDevida(janelas, comprimentoVolta, nowBeat, feitas) {
  const P = periodoDasJanelas(janelas, comprimentoVolta);
  const ciclo = Math.max(0, Math.floor(nowBeat / P));
  for (let c = Math.max(0, ciclo - 1); c <= ciclo; c++) {
    for (const j of janelas) {
      const abs = j.batida + c * P;
      if (abs <= nowBeat && !feitas.has(abs)) return abs;
    }
  }
  return null;
}
