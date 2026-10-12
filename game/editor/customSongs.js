/**
 * Melodias compostas no editor (seção 5). O conteúdo em content/songs é
 * imutável; o que o jogador compõe fica no localStorage, por id de música,
 * e substitui só a trilha de melodia — harmonia/baixo/bateria continuam as
 * do arranjo original.
 */
const KEY = 'cacofonia-melodias';

export function carregarMelodias() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function salvarMelodia(songId, melodia) {
  const todas = carregarMelodias();
  if (melodia) todas[songId] = melodia; else delete todas[songId];
  localStorage.setItem(KEY, JSON.stringify(todas));
}

/** A música como o jogador a deixou: a original, com a melodia do editor (se houver). */
export function songComMelodiaDoJogador(song) {
  const melodia = carregarMelodias()[song.id];
  if (!Array.isArray(melodia)) return song;
  return { ...song, trilhas: { ...song.trilhas, melodia }, melodiaCustomizada: true };
}
