/**
 * Melodias compostas no editor (seção 5). O conteúdo em content/songs é
 * imutável; o que o jogador compõe fica no localStorage, por id de música,
 * e substitui só a trilha de melodia — harmonia/baixo/bateria continuam as
 * do arranjo original.
 */
import { ler, gravar } from '../storage.js';

const KEY = 'cacofonia-melodias';

/** Nota de melodia bem formada (protege contra saves/importações corrompidos). */
export function notaDeMelodiaValida(e) {
  return !!e && typeof e.nota === 'string' && /^([A-G])(#|b)?(-?\d)$/.test(e.nota)
    && Number.isFinite(e.pos) && e.pos >= 0 && Number.isFinite(e.duracao) && e.duracao > 0;
}

export function carregarMelodias() {
  const todas = ler(KEY, {});
  return todas && typeof todas === 'object' ? todas : {};
}

export function salvarMelodia(songId, melodia) {
  const todas = carregarMelodias();
  if (melodia) todas[songId] = melodia; else delete todas[songId];
  gravar(KEY, todas);
}

/** A música como o jogador a deixou: a original, com a melodia do editor (se houver e for válida). */
export function songComMelodiaDoJogador(song) {
  const melodia = carregarMelodias()[song.id];
  if (!Array.isArray(melodia) || !melodia.every(notaDeMelodiaValida)) return song;
  return { ...song, trilhas: { ...song.trilhas, melodia }, melodiaCustomizada: true };
}
