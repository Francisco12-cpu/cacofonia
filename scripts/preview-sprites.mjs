/**
 * Gera uma folha de prévia (PNG) com todos os sprites e quadros, para
 * conferir a arte sem abrir o jogo.
 * Uso: node scripts/preview-sprites.mjs [saida.png] [escala]
 */
import { writePng } from './lib/png.mjs';
import { BOSS_ART, HERO_ARTS, SMALL_ART } from '../engine/render2d/art.js';
import { frameGrid, listFrames, rasterize } from '../engine/render2d/pixelart.js';

const saida = process.argv[2] || 'sprites-preview.png';
const ESC = +(process.argv[3] || 4);

const itens = [];
for (const [id, def] of Object.entries({ ...BOSS_ART, ...HERO_ARTS })) {
  const linha = [];
  for (const f of listFrames(def)) linha.push(rasterize(frameGrid(def, f), { outline: true }));
  linha.push(rasterize(frameGrid(def, 'base'), { outline: true, gray: 0.85 }));
  itens.push(linha);
}
itens.push(Object.values(SMALL_ART).map((rows) => rasterize(rows.map((r) => [...r]))));

const GAP = 4;
const larg = Math.max(...itens.map((l) => l.reduce((a, s) => a + s.w + GAP, GAP)));
const alt = itens.reduce((a, l) => a + Math.max(...l.map((s) => s.h)) + GAP, GAP);
const W = larg * ESC, H = alt * ESC;
const px = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) { const x = Math.floor((i % W) / ESC), y = Math.floor(Math.floor(i / W) / ESC); const xad = ((x >> 2) + (y >> 2)) & 1; px.set(xad ? [40, 30, 64, 255] : [28, 20, 48, 255], i * 4); }
let oy = GAP;
for (const l of itens) {
  let ox = GAP;
  for (const s of l) {
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const i = (y * s.w + x) * 4; if (!s.data[i + 3]) continue;
      for (let dy = 0; dy < ESC; dy++) for (let dx = 0; dx < ESC; dx++) {
        const o = (((oy + y) * ESC + dy) * W + (ox + x) * ESC + dx) * 4;
        px[o] = s.data[i]; px[o + 1] = s.data[i + 1]; px[o + 2] = s.data[i + 2]; px[o + 3] = 255;
      }
    }
    ox += s.w + GAP;
  }
  oy += Math.max(...l.map((s) => s.h)) + GAP;
}

writePng(saida, W, H, px);
console.log(`prévia: ${saida} (${W}x${H})`);
