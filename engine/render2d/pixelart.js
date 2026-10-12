import { PALETTE, ramp, mix, hexToRgb } from './palette.js';

/**
 * Rasterizador de pixel art em texto — puro (sem DOM), para rodar no
 * navegador e em Node (prévia em PNG: scripts/preview-sprites.mjs).
 *
 * Formato da arte (ver engine/render2d/art.js):
 *  - `rows`: linhas de texto, um caractere por pixel, letras da PALETTE;
 *    '.' = transparente, 'K' = contorno/olho escuro, 'k' = linha interna
 *    colorida (vira o tom mais fundo da cor vizinha).
 *  - `mirror: true`: `rows` traz só a metade esquerda; a direita é espelhada.
 *  - `frames`: quadros de animação como camadas (`{ x, y, rows, mirror }`)
 *    por cima da base — '.' mantém, '_' apaga.
 */

export function expandRows(def) {
  const base = def.mirror ? def.rows.map((r) => r + [...r].reverse().join('')) : def.rows.slice();
  const w = Math.max(...base.map((r) => r.length));
  return base.map((r) => r.padEnd(w, '.'));
}

function aplicarCamada(grid, cam) {
  const w = grid[0].length;
  const pintar = (x0, linhas) => {
    linhas.forEach((ln, j) => {
      const y = cam.y + j; if (y < 0 || y >= grid.length) return;
      for (let i = 0; i < ln.length; i++) {
        const ch = ln[i], x = x0 + i; if (ch === '.' || x < 0 || x >= w) continue;
        grid[y][x] = ch === '_' ? '.' : ch;
      }
    });
  };
  pintar(cam.x, cam.rows);
  if (cam.mirror) {
    const larg = Math.max(...cam.rows.map((r) => r.length));
    pintar(w - cam.x - larg, cam.rows.map((r) => [...r.padEnd(larg, '.')].reverse().join('')));
  }
}

/** Grade (array de arrays de caracteres) de um quadro. Quadros genéricos: `respira` (sobe 1px o tronco). */
export function frameGrid(def, frame = 'base') {
  const grid = expandRows(def).map((r) => [...r]);
  if (frame === 'base') return grid;
  if (frame === 'respira') {
    const corte = Math.round(grid.length * 0.62);
    const vazia = Array(grid[0].length).fill('.');
    return [vazia, ...grid.slice(0, corte), ...grid.slice(corte + 1)];
  }
  const camadas = def.frames?.[frame];
  if (camadas) for (const c of camadas) aplicarCamada(grid, c);
  return grid;
}

export function listFrames(def) {
  return ['base', 'respira', ...Object.keys(def.frames || {})];
}

/** Escala 2× "Scale2x/EPX": suaviza diagonais da arte sem borrar (usado para retratos grandes). */
export function scale2x(grid) {
  const h = grid.length, w = grid[0].length;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : grid[y][x]);
  const out = Array.from({ length: h * 2 }, () => Array(w * 2).fill('.'));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
    out[y * 2][x * 2] = C === A && C !== D && A !== B ? A : P;
    out[y * 2][x * 2 + 1] = A === B && A !== C && B !== D ? B : P;
    out[y * 2 + 1][x * 2] = D === C && D !== B && C !== A ? C : P;
    out[y * 2 + 1][x * 2 + 1] = B === D && B !== A && D !== C ? D : P;
  }
  return out;
}

const PRETO = PALETTE.K;

/**
 * Converte uma grade em pixels RGBA.
 * @param opts.outline  adiciona contorno externo automático (1px) tingido pela cor vizinha
 * @param opts.tint     pinta todos os pixels opacos com uma cor só (flash de acerto)
 * @param opts.gray     0..1 — dessatura (chefe derrotado)
 * @param opts.shade    false desliga o sombreamento automático
 */
export function rasterize(grid, opts = {}) {
  const pad = opts.outline ? 1 : 0;
  const gh = grid.length, gw = grid[0].length, w = gw + pad * 2, h = gh + pad * 2;
  const data = new Uint8ClampedArray(w * h * 4);
  const ch = (x, y) => (x < 0 || y < 0 || x >= gw || y >= gh ? '.' : grid[y][x]);
  const cheio = (x, y) => { const c = ch(x, y); return c !== '.' && c !== 'K' && c !== 'k' && !!PALETTE[c]; };
  const opaco = (x, y) => { const c = ch(x, y); return c !== '.' && (!!PALETTE[c] || c === 'k'); };
  const vizinhaDominante = (x, y) => {
    const cont = {};
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const c = ch(x + dx, y + dy); if (cheio(x + dx, y + dy)) cont[c] = (cont[c] || 0) + 1;
    }
    let best = null, n = 0; for (const c in cont) if (cont[c] > n) { n = cont[c]; best = c; }
    return best;
  };
  const put = (x, y, hex, a = 255) => {
    let [r, g, b] = hexToRgb(hex);
    if (opts.gray) { const l = r * 0.3 + g * 0.59 + b * 0.11; r += (l - r) * opts.gray; g += (l - g) * opts.gray; b += (l - b) * opts.gray; }
    const i = ((y + pad) * w + (x + pad)) * 4;
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
  };

  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const c = grid[y][x];
    if (c === '.') continue;
    if (opts.tint) { if (opaco(x, y)) put(x, y, opts.tint); continue; }
    if (c === 'K') {
      // Contorno "sel-out": a borda externa ganha um toque da cor vizinha; linhas internas ficam escuras.
      const borda = !opaco(x - 1, y) || !opaco(x + 1, y) || !opaco(x, y - 1) || !opaco(x, y + 1);
      const viz = vizinhaDominante(x, y);
      put(x, y, borda && viz ? mix(PRETO, ramp(PALETTE[viz]).funda, 0.35) : PRETO);
      continue;
    }
    if (c === 'k') { const viz = vizinhaDominante(x, y); put(x, y, viz ? ramp(PALETTE[viz]).funda : PRETO); continue; }
    const base = PALETTE[c]; if (!base) continue;
    if (opts.shade === false) { put(x, y, base); continue; }
    const R = ramp(base);
    const eT = !cheio(x, y - 1), eL = !cheio(x - 1, y), eB = !cheio(x, y + 1), eR = !cheio(x + 1, y);
    let cor = base;
    if (eB && eR) cor = R.funda;
    else if (eB || (eR && !eT)) cor = R.sombra;
    else if (eT && !eR && !eL) cor = R.luz;
    put(x, y, cor);
  }

  if (opts.outline && !opts.tint) {
    for (let y = -1; y <= gh; y++) for (let x = -1; x <= gw; x++) {
      if (opaco(x, y)) continue;
      let viz = null;
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) if (opaco(x + dx, y + dy)) { viz = ch(x + dx, y + dy); break; }
      if (!viz) continue;
      const cor = PALETTE[viz] && viz !== 'K' ? mix(PRETO, ramp(PALETTE[viz]).funda, 0.3) : PRETO;
      const i = ((y + pad) * w + (x + pad)) * 4;
      const [r, g, b] = hexToRgb(cor);
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  } else if (opts.outline && opts.tint) {
    for (let y = -1; y <= gh; y++) for (let x = -1; x <= gw; x++) {
      if (opaco(x, y)) continue;
      if ([[0, -1], [-1, 0], [1, 0], [0, 1]].some(([dx, dy]) => opaco(x + dx, y + dy))) {
        const i = ((y + pad) * w + (x + pad)) * 4; const [r, g, b] = hexToRgb(opts.tint);
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
      }
    }
  }
  return { w, h, data };
}
