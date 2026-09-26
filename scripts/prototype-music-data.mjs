/**
 * Cópia fiel da lógica musical do protótipo (everbeat-codigo-fonte.html,
 * linhas ~209-278) — só o necessário para recalcular as partituras e
 * assar (bake) as 8 músicas dos chefes no novo formato orientado a dados
 * (content/songs/*.json). Não é executado pelo jogo: é uma ferramenta de
 * migração única, usada por scripts/bake-songs.mjs.
 */
const NI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function toMidi(n) { const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); return NI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12; }
export function fromMidi(v) { return NN[((v % 12) + 12) % 12] + (Math.floor(v / 12) - 1); }
function tr(n, s) { return s ? fromMidi(toMidi(n) + s) : n; }
function chord(name) { const m = /^([A-G])(#|b)?(m?)$/.exec(name); const pc = (NI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12; return { pc, tri: [0, m[3] ? 3 : 4, 7] }; }
const s16 = str => str.split(' ').map(n => [n, .25]);
const MK_A = [['A4', .5], ['B4', .5], ['C5', .5], ['D5', .5], ['E5', .5], ['C5', .5], ['E5', 1], ['D#5', .5], ['B4', .5], ['D#5', 1], ['D5', .5], ['A#4', .5], ['D5', 1],
  ['A4', .5], ['B4', .5], ['C5', .5], ['D5', .5], ['E5', .5], ['C5', .5], ['E5', .5], ['A5', .5], ['G5', .5], ['E5', .5], ['C5', .5], ['E5', .5], ['G5', 2]];
const MK_B = MK_A.map(([n, d]) => [tr(n, 7), d]);
const TM_A = [['B4', .25], ['A4', .25], ['G#4', .25], ['A4', .25], ['C5', 1], ['D5', .25], ['C5', .25], ['B4', .25], ['C5', .25], ['E5', 1],
  ['F5', .25], ['E5', .25], ['D#5', .25], ['E5', .25], ['B5', .25], ['A5', .25], ['G#5', .25], ['A5', .25], ['B5', .25], ['A5', .25], ['G#5', .25], ['A5', .25], ['C6', 1],
  ['A5', .5], ['C6', .5], ['B5', .25], ['A5', .25], ['G5', .25], ['A5', .25], ['B5', .25], ['A5', .25], ['G5', .25], ['A5', .25], ['B5', .25], ['A5', .25], ['G5', .25], ['F#5', .25], ['E5', 1], [null, 1], [null, 2]];
const TM_B = [['E5', .5], ['F5', .5], ['G5', .5], ['G5', .5], ['A5', .25], ['G5', .25], ['F5', .25], ['E5', .25], ['D5', 1], ['E5', .5], ['F5', .5], ['G5', .5], ['G5', .5], ['A5', .25], ['G5', .25], ['F5', .25], ['E5', .25], ['D5', 1],
  ['C5', .5], ['D5', .5], ['E5', .5], ['E5', .5], ['F5', .25], ['E5', .25], ['D5', .25], ['C5', .25], ['B4', 1], ['C5', .5], ['D5', .5], ['E5', .5], ['E5', .5], ['F5', .25], ['E5', .25], ['D5', .25], ['C5', .25], ['B4', 1]];
const FE_A = [['E5', .25], ['D#5', .25], ['E5', .25], ['B4', .25], ['D5', .25], ['C5', .25], ['A4', .5], [null, .25], ['C4', .25], ['E4', .25], ['A4', .25],
  ['B4', .5], [null, .25], ['E4', .25], ['G#4', .25], ['B4', .25], ['C5', .5], [null, .25], ['E4', .25], ['E5', .25], ['D#5', .25],
  ['E5', .25], ['D#5', .25], ['E5', .25], ['B4', .25], ['D5', .25], ['C5', .25], ['A4', .5], [null, .25], ['C4', .25], ['E4', .25], ['A4', .25],
  ['B4', .5], [null, .25], ['E4', .25], ['C5', .25], ['B4', .25]];
const FE_B = [[null, .75], ['B4', .25], ['C5', .25], ['D5', .25], ['E5', .75], ['G4', .25], ['F5', .25], ['E5', .25], ['D5', .75], ['F4', .25], ['E5', .25], ['D5', .25],
  ['C5', .75], ['E4', .25], ['D5', .25], ['C5', .25], ['B4', .5], [null, .25], ['E4', .25], ['E5', .25], ['D#5', .25]];
const FE = [...FE_A, ['A4', 1], [null, .5], ...FE_B, ...FE_A, ['A4', 1], ['E5', .25], ['D#5', .25]];
const ODE_A = [['E5', 1], ['E5', 1], ['F5', 1], ['G5', 1], ['G5', 1], ['F5', 1], ['E5', 1], ['D5', 1], ['C5', 1], ['C5', 1], ['D5', 1], ['E5', 1]];
const ODE = [...ODE_A, ['E5', 1.5], ['D5', .5], ['D5', 2], ...ODE_A, ['D5', 1.5], ['C5', .5], ['C5', 2],
  ['D5', 1], ['D5', 1], ['E5', 1], ['C5', 1], ['D5', 1], ['E5', .5], ['F5', .5], ['E5', 1], ['C5', 1], ['D5', 1], ['E5', .5], ['F5', .5], ['E5', 1], ['D5', 1], ['C5', 1], ['D5', 1], ['G4', 2],
  ...ODE_A, ['D5', 1.5], ['C5', .5], ['C5', 2]];
const BEE = [...s16('E6 D#6 D6 C#6 D6 C#6 C6 B5 C6 B5 A#5 A5 G#5 G5 F#5 F5'), ...s16('E5 D#5 D5 C#5 D5 C#5 C5 B4 C5 B4 A#4 A4 G#4 G4 F#4 F4'),
  ...s16('E5 D#5 D5 C#5 C5 F5 E5 D#5 E5 D#5 D5 C#5 C5 C#5 D5 D#5'), ...s16('E5 D#5 D5 C#5 C5 F5 E5 D#5 E5 D#5 D5 C#5 C5 C#5 D5 D#5'),
  ...s16('A4 A#4 B4 C5 C#5 D5 D#5 E5 F5 E5 D#5 D5 C#5 C5 B4 A#4'), ...s16('A4 A#4 B4 C5 C#5 D5 D#5 E5 F5 F#5 G5 G#5 A5 G#5 G5 F#5'),
  ...s16('E5 D#5 D5 C#5 C5 F5 E5 D#5 E5 D#5 D5 C#5 C5 C#5 D5 D#5'), ['E5', 1], [null, 1]];
const SWAN = [['E5', 2], ['A4', .5], ['B4', .5], ['C5', .5], ['D5', .5], ['E5', 1.5], ['C5', .5], ['E5', 1.5], ['C5', .5], ['E5', 1.5], ['A4', .5], ['C5', .5], ['A4', .5], ['F4', .5], ['C5', .5], ['A4', 4],
  ['D5', 2], ['G4', .5], ['A4', .5], ['B4', .5], ['C5', .5], ['D5', 1.5], ['B4', .5], ['D5', 1.5], ['B4', .5], ['D5', 1.5], ['G4', .5], ['B4', .5], ['G4', .5], ['E4', .5], ['B4', .5], ['E5', 4]];
const TOC = [['A5', .25], ['G5', .25], ['A5', 2], [null, 1.5], ['G5', .25], ['F5', .25], ['E5', .25], ['D5', .25], ['C#5', 1], ['D5', 2],
  ['A4', .25], ['G4', .25], ['A4', 2], [null, 1.5], ['E4', .5], ['F4', .5], ['C#4', 1], ['D4', 2],
  ...s16('D5 A4 F4 A4 D5 A4 F4 A4 D5 A4 F4 A4 D5 A4 F4 A4'), ...s16('C#5 A4 E4 A4 C#5 A4 E4 A4 C#5 A4 E4 A4 C#5 A4 E4 A4'),
  ...s16('D4 F4 A4 D5 F5 A5 D6 A5 F5 D5 A4 F4 D4 F4 A4 D5'), ...s16('E5 C#5 A4 E4 G4 A4 C#5 E5'), ['D5', 2]];
const FIFTH = [[null, .5], ['G4', .5], ['G4', .5], ['G4', .5], ['D#4', 2], [null, .5], ['F4', .5], ['F4', .5], ['F4', .5], ['D4', 2],
  [null, .5], ['G#4', .5], ['G#4', .5], ['G#4', .5], ['G4', 2], [null, .5], ['D#5', .5], ['D#5', .5], ['D#5', .5], ['C5', 2],
  [null, .5], ['G4', .5], ['G4', .5], ['G4', .5], ['D4', 2], [null, .5], ['G#4', .5], ['G#4', .5], ['G#4', .5], ['G4', 2],
  [null, .5], ['F5', .5], ['F5', .5], ['F5', .5], ['D5', 2], ['G5', .5], ['F5', .5], ['D#5', .5], ['D5', .5], ['C5', 2]];
const DIES = [['F5', 1], ['E5', 1], ['F5', 1], ['D5', 1], ['E5', 1], ['C5', 1], ['D5', 2], ['F5', 1], ['F5', .5], ['G5', .5], ['F5', 1], ['E5', 1], ['D5', 1], ['C5', .5], ['E5', .5], ['D5', 2],
  ['A5', 1], ['A5', .5], ['C6', .5], ['A5', 1], ['G5', 1], ['A5', 1], ['F5', 1], ['D5', 2], ['F5', 1], ['E5', 1], ['F5', 1], ['D5', 1], ['E5', 1], ['C5', 1], ['D5', 2]];

export const SONGS = {
  maestro: { mel: [...MK_A, ...MK_B], bpm: 100, bpmStep: 8, bpmMax: 180, drums: 'rock', bass: 'oct', arpFrom: 1, harmFrom: 1, fills: true, ch: { u: 2, s: ['Am', 'Am', 'B', 'A#', 'Am', 'Am', 'C', 'C', 'Em', 'Em', 'F#', 'F', 'Em', 'Em', 'G', 'G'] } },
  dj: { mel: [...TM_A, ...TM_B], bpm: 100, bpmStep: 6, bpmMax: 132, drums: 'break', bass: 'oompah', arpFrom: 1, harmFrom: 1, fills: true, ch: { u: 2, s: ['Am', 'Am', 'E', 'Am', 'Am', 'E', 'Am', 'E', 'C', 'G', 'C', 'G', 'Am', 'E', 'Am', 'E'] } },
  fantasma: { mel: FE, bpm: 84, bpmStep: 4, bpmMax: 104, drums: 'ghost', bass: 'hold', arpFrom: 0, harmFrom: 1, arpSlow: true, ch: { u: 1.5, s: ['Am', 'Am', 'E', 'Am', 'Am', 'Am', 'E', 'Am', 'Am', 'E', 'C', 'G', 'Am', 'E', 'Am', 'Am', 'E', 'Am', 'Am', 'Am', 'E'] } },
  zumbido: { mel: BEE, bpm: 88, bpmStep: 5, bpmMax: 114, drums: 'break', bass: 'gallop', arpFrom: 1, harmFrom: 2, fills: true, ch: { u: 2, s: ['E', 'E', 'E', 'E', 'Am', 'Am', 'Am', 'E', 'Am', 'Am', 'Am', 'E', 'Am', 'Am', 'E', 'E'] } },
  cisne: { mel: SWAN, bpm: 96, bpmStep: 6, bpmMax: 126, drums: 'ballad', bass: 'walk', arpFrom: 0, harmFrom: 1, arpSlow: true, melOct: [0, 12], ch: { u: 2, s: ['Am', 'Am', 'Am', 'Am', 'Am', 'F', 'Am', 'Am', 'G', 'G', 'G', 'G', 'G', 'Em', 'E', 'E'] } },
  orgao: { mel: TOC, bpm: 92, bpmStep: 6, bpmMax: 130, drums: 'rock', drumsFrom: 1, bass: 'hold', arpFrom: 1, harmFrom: 0, fills: true, duty: [0.5, 0.25, 0.125], ch: { u: 4, s: ['Dm', 'A', 'Dm', 'A', 'Dm', 'A', 'Dm', 'A'] } },
  colosso: { mel: FIFTH, bpm: 108, bpmStep: 8, bpmMax: 152, drums: 'march', bass: 'oct', arpFrom: 1, harmFrom: 0, fills: true, ch: { u: 4, s: ['Cm', 'G', 'Fm', 'Cm', 'G', 'Fm', 'G', 'Cm'] } },
  silencio: { mel: DIES, bpm: 110, bpmStep: 8, bpmMax: 172, drums: 'rock', bass: 'gallop', arpFrom: 1, harmFrom: 1, fills: true, silent: true, melOct: [0, 12], ch: { u: 2, s: ['Dm', 'Dm', 'C', 'Dm', 'Dm', 'F', 'C', 'Dm', 'F', 'F', 'Dm', 'Dm', 'Dm', 'Dm', 'C', 'Dm'] } }
};
for (const k in SONGS) {
  const s = SONGS[k]; let pos = 0; s.ev = []; s.map = new Map();
  for (const [n, d] of s.mel) { if (n) { const e = { pos, note: n, dur: d, midi: toMidi(n) }; s.ev.push(e); s.map.set(Math.round(pos * 4), e); } pos += d; }
  s.L = pos; s.pitches = [...new Set(s.ev.map(e => e.midi))].sort((a, b) => a - b); s.chords = s.ch.s.map(chord);
}
export const DRUMS = {
  rock: { k: [0, 8], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] }, break: { k: [0, 6, 10], s: [4, 12], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  ghost: { k: [0], s: [], h: [6, 14] }, soft: { k: [0], s: [], h: [8] }, ballad: { k: [0, 10], s: [8], h: [0, 4, 8, 12] }, march: { k: [0, 8], s: [4, 12, 14], h: [0, 2, 4, 6, 8, 10, 12, 14] }, none: { k: [], s: [], h: [] }
};

/** Créditos das obras em domínio público usadas nos arranjos 8-bit (mantidos conforme a bíblia). */
export const CREDITOS = {
  maestro: 'Edvard Grieg — "In the Hall of the Mountain King" (Peer Gynt), domínio público, arranjo 8-bit original.',
  dj: 'Wolfgang Amadeus Mozart — "Rondo alla Turca" (Sonata para piano nº 11), domínio público, arranjo 8-bit original.',
  fantasma: 'Ludwig van Beethoven — "Für Elise", domínio público, arranjo 8-bit original.',
  zumbido: 'Nikolai Rimsky-Korsakov — "Voo do Besouro" (O Conto do Czar Saltan), domínio público, arranjo 8-bit original.',
  cisne: 'Camille Saint-Saëns — "O Cisne" (O Carnaval dos Animais), domínio público, arranjo 8-bit original.',
  orgao: 'Johann Sebastian Bach — "Tocata e Fuga em Ré menor", domínio público, arranjo 8-bit original.',
  colosso: 'Ludwig van Beethoven — Sinfonia nº 5, 1º movimento, domínio público, arranjo 8-bit original.',
  silencio: 'Canto gregoriano — "Dies Irae", domínio público, arranjo 8-bit original.'
};
