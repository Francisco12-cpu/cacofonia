/**
 * Prévia (PNG) dos cenários de batalha em pixel art: as 3 camadas de cada
 * cenário empilhadas (longe, meio, perto), sem abrir o jogo.
 * Uso: node scripts/preview-backdrops.mjs [saida.png] [t]
 */
import { writePng } from './lib/png.mjs';
import { cenario, CAMADAS } from '../game/battle/backdrops.js';

const saida = process.argv[2] || 'backdrops-preview.png';
const T = +(process.argv[3] || 1.3);
const ids = ['stars', 'eq', 'fog', 'hive', 'lake', 'pipes', 'sun', 'void'];

/** Contexto 2D mínimo (fillRect + globalAlpha) que escreve num buffer RGBA. */
function fakeCtx(w, h) {
  const data = new Uint8ClampedArray(w * h * 4);
  const ctx = {
    fillStyle: '#000', globalAlpha: 1,
    fillRect(x, y, ww, hh) {
      let s = this.fillStyle; if (s.length === 4) s = '#' + [...s.slice(1)].map((c) => c + c).join('');
      const n = parseInt(s.slice(1), 16), rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255], a = this.globalAlpha;
      for (let j = Math.max(0, y); j < Math.min(h, y + hh); j++) for (let i = Math.max(0, x); i < Math.min(w, x + ww); i++) {
        const o = (j * w + i) * 4;
        for (let k = 0; k < 3; k++) data[o + k] = data[o + k] * (1 - a) + rgb[k] * a;
        data[o + 3] = Math.min(255, data[o + 3] + 255 * a);
      }
    }
  };
  return { ctx, data };
}

const camadas = ['longe', 'meio', 'perto'];
const W = 256, H = camadas.reduce((a, k) => a + CAMADAS[k].h, 0);
const COLS = 4, ESC = 2, GAP = 6;
const SW = (W + GAP) * COLS * ESC, SH = (H + GAP) * Math.ceil(ids.length / COLS) * ESC;
const px = new Uint8Array(SW * SH * 4).fill(40);
ids.forEach((id, n) => {
  const cen = cenario(id), ox = (n % COLS) * (W + GAP), oy0 = Math.floor(n / COLS) * (H + GAP);
  let oy = oy0;
  for (const k of camadas) {
    const { w, h } = CAMADAS[k], { ctx, data } = fakeCtx(w, h);
    cen[k].pintar(ctx, w, h, T, 0.6, '#ff2f8e');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4; const xad = ((x >> 3) + (y >> 3)) & 1;
      const a = data[i + 3] / 255, fundo = xad ? 70 : 50;
      for (let dy = 0; dy < ESC; dy++) for (let dx = 0; dx < ESC; dx++) {
        const o = (((oy + y) * ESC + dy) * SW + (ox + x) * ESC + dx) * 4;
        px[o] = data[i] * a + fundo * (1 - a); px[o + 1] = data[i + 1] * a + fundo * (1 - a); px[o + 2] = data[i + 2] * a + fundo * (1 - a); px[o + 3] = 255;
      }
    }
    oy += h;
  }
});
writePng(saida, SW, SH, px);
console.log(`prévia: ${saida} (${SW}x${SH})`);
