/**
 * Colisão de notas contra o jogador. Lê `dano`, `altura` e `tiqueDano` do
 * tipo de nota (registro orientado a dados) em vez de ter um `switch` fixo
 * por tipo, como no protótipo.
 */

export function isOverlapping(note, nowBeat) {
  const end = note.hit + (note.len || 0);
  return nowBeat >= note.hit && nowBeat <= end;
}

export function laneBlocked(note, lane) {
  return note.lanes.includes(lane);
}

/**
 * Nota instantânea (duracao/len === 0): dano de impacto único no instante do
 * acerto, como sempre foi. Continua igual ao protótipo.
 */
export function judgeInstantNote(note, noteType, { lane, jumpSafe, nowBeat, lagBeats = 0 }) {
  if (note.judged || (note.len || 0) > 0) return { damage: 0, combo: false };
  if (nowBeat < note.hit + lagBeats) return { damage: 0, combo: false };
  note.judged = true;
  const avoided = laneBlocked(note, lane) ? (noteType.altura === 'baixa' && jumpSafe) : true;
  if (avoided) return { damage: 0, combo: true };
  return { damage: noteType.dano, combo: false };
}

/**
 * CORREÇÃO DO BUG (bíblia 3.2): dano de nota longa por TIQUE DE TEMPO REAL
 * (segundos), não por um flag único que dispara uma vez só. Enquanto o
 * jogador estiver na pista de uma nota com duração > 0 e não conseguir
 * evitá-la (altura "alta" nunca é evitável pulando), o dano de `noteType.dano`
 * é aplicado a cada `tiqueDano.intervalo` segundos. O acumulador (`tickTimer`)
 * usa tempo real decorrido, então funciona igual em qualquer taxa de quadros
 * e não perde tiques se um frame demorar mais que o intervalo.
 */
export function tickLongNoteDamage(note, noteType, { lane, jumpSafe, nowBeat, dtSeconds }) {
  if (note.judged) return 0;
  const hasDuration = (note.len || 0) > 0;
  if (!hasDuration) return 0;

  const overlapping = isOverlapping(note, nowBeat) && laneBlocked(note, lane);
  const avoidedByJump = noteType.altura === 'baixa' && jumpSafe;
  if (!overlapping || avoidedByJump) {
    note.tickTimer = 0;
    return 0;
  }

  const intervalo = noteType.tiqueDano?.intervalo ?? 0.35;
  const EPS = 1e-9; // tolerância contra erro de ponto flutuante ao somar dt em vários frames
  note.tickTimer = (note.tickTimer || 0) + dtSeconds;
  let dano = 0;
  while (note.tickTimer >= intervalo - EPS) {
    dano += noteType.dano;
    note.tickTimer -= intervalo;
    note.atingiuAoMenosUmTique = true;
  }
  return dano;
}

/** Fecha o julgamento de uma nota longa quando ela termina (dá combo se nunca acertou). */
export function finalizeLongNote(note, nowBeat) {
  const end = note.hit + (note.len || 0);
  if (note.judged || nowBeat <= end) return null;
  note.judged = true;
  return !note.atingiuAoMenosUmTique;
}
