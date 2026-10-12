/**
 * Paleta fixa do jogo (31 cores + transparente). Sprites, notas, cenários e
 * UI escolhem daqui — é o que faz tudo parecer do mesmo mundo. Cada letra é
 * o código usado na arte em texto (engine/render2d/sprites.js).
 */
export const PALETTE = {
  K: '#0b0714', // contorno / olhos
  Z: '#2a1840', // violeta-noite
  B: '#2a1b4a', // marinho
  V: '#6a3fb5', // violeta
  p: '#9b5cd6', // roxo
  P: '#e8b4ff', // lilás
  W: '#f4f0ff', // branco
  I: '#bfe9ff', // gelo
  L: '#8fffff', // ciano claro
  C: '#2be9ff', // ciano
  c: '#1a8fb0', // azul-petróleo
  S: '#c9d6ff', // prata
  s: '#6b78a8', // ardósia
  M: '#8a93a8', // cinza
  m: '#4a5068', // cinza escuro
  X: '#6a6a7c', // pedra
  Y: '#f5ff3d', // amarelo neon
  A: '#ffb000', // âmbar
  U: '#d4a017', // ouro velho
  O: '#ff8a2b', // laranja
  E: '#ff5a1f', // brasa
  R: '#ff2f8e', // rosa neon
  b: '#ff9ac1', // rosa claro
  r: '#e0304a', // vermelho
  Q: '#8b0f2a', // vinho
  G: '#3de07a', // verde
  g: '#1f8a47', // verde escuro
  F: '#ffd0a8', // pele
  f: '#d99a6c', // pele sombra
  N: '#8a5a3a', // marrom
  n: '#5a3a24'  // marrom escuro
};

export function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToRgb([h, s, l]) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** Gira o matiz `h` em direção a `alvo` por no máximo `graus`. */
function puxarMatiz(h, alvo, graus) {
  let d = ((alvo - h + 540) % 360) - 180;
  return h + Math.sign(d) * Math.min(Math.abs(d), graus);
}

/**
 * Rampa de 4 tons com deslocamento de matiz (técnica clássica de pixel art):
 * sombras puxam para o violeta-azul, luzes puxam para o amarelo. Muito mais
 * viva do que só escurecer/clarear multiplicando o RGB.
 */
const rampCache = new Map();
export function ramp(hex) {
  if (rampCache.has(hex)) return rampCache.get(hex);
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  const cinza = s < 0.08;
  const sombra = hslToRgb([cinza ? 250 : puxarMatiz(h, 255, 14), Math.min(1, cinza ? 0.15 : s * 1.05), l * 0.66]);
  const funda = hslToRgb([cinza ? 255 : puxarMatiz(h, 260, 26), Math.min(1, cinza ? 0.2 : s * 1.1), l * 0.42]);
  const luz = hslToRgb([cinza ? 60 : puxarMatiz(h, 58, 10), cinza ? 0.12 : s, Math.min(0.97, l + (1 - l) * 0.45)]);
  const r = { funda: rgbToHex(funda), sombra: rgbToHex(sombra), base: hex, luz: rgbToHex(luz) };
  rampCache.set(hex, r);
  return r;
}

/** Mistura duas cores hex (t=0 -> a, t=1 -> b). */
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
}

/** Cor da paleta mais próxima — para "encaixar" cores vindas de conteúdo (JSON) na paleta. */
const snapCache = new Map();
export function snapToPalette(hex) {
  if (snapCache.has(hex)) return snapCache.get(hex);
  const [r, g, b] = hexToRgb(hex);
  let best = hex, bd = Infinity;
  for (const v of Object.values(PALETTE)) {
    const [R, G, B] = hexToRgb(v);
    const d = (r - R) ** 2 * 0.3 + (g - G) ** 2 * 0.59 + (b - B) ** 2 * 0.11;
    if (d < bd) { bd = d; best = v; }
  }
  snapCache.set(hex, best);
  return best;
}
