import { PALETTE, ramp, mix, hexToRgb, snapToPalette } from './palette.js';

/**
 * Ícones em pixel art das notas, gerados a partir da `forma` e da `cor` do
 * tipo de nota (content/notetypes). A forma continua sendo o diferenciador
 * principal (acessibilidade, seção 3.1) — a cor só acompanha.
 * Puro (sem DOM): devolve { w, h, data } RGBA.
 */

function novo(w, h) { return { w, h, data: new Uint8ClampedArray(w * h * 4) }; }
function put(img, x, y, hex, a = 255) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const [r, g, b] = hexToRgb(hex), i = (y * img.w + x) * 4;
  img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = a;
}

/** Pinta uma máscara (função x,y -> bool) com sombreamento de rampa + contorno escuro tingido. */
function pintarMascara(img, dentro, cor) {
  const R = ramp(cor), cx = img.w / 2, cy = img.h / 2;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!dentro(x, y)) continue;
    const borda = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
    if (borda) { put(img, x, y, mix(PALETTE.K, R.funda, 0.35)); continue; }
    // Luz vindo de cima-esquerda.
    const lx = (x - cx) / img.w, ly = (y - cy) / img.h, l = -lx * 0.8 - ly;
    put(img, x, y, l > 0.32 ? R.luz : l > -0.05 ? R.base : l > -0.35 ? R.sombra : R.funda);
  }
}

function brilhoEm(img, x, y) { put(img, x, y, PALETTE.W); put(img, x + 1, y, PALETTE.W); put(img, x, y + 1, PALETTE.W); }

/** Orbe (esfera). */
function orbe(cor) {
  const img = novo(14, 14), r = 6.4;
  pintarMascara(img, (x, y) => (x - 6.5) ** 2 + (y - 6.5) ** 2 <= r * r, cor);
  brilhoEm(img, 4, 3);
  return img;
}

/** Losango (zigue-zague). */
function losango(cor) {
  const img = novo(14, 16);
  pintarMascara(img, (x, y) => Math.abs(x - 6.5) / 6.6 + Math.abs(y - 7.5) / 7.6 <= 1, cor);
  brilhoEm(img, 5, 4);
  return img;
}

/** Parede (prisma alto): bloco com faixas de aviso. */
function parede(cor) {
  const img = novo(16, 22);
  const dentro = (x, y) => x >= 0 && x < 16 && y >= 0 && y < 22;
  pintarMascara(img, dentro, cor);
  const R = ramp(cor);
  for (let y = 3; y < 19; y++) for (let x = 2; x < 14; x++) if (((x + y) >> 2) % 2 === 0) put(img, x, y, R.funda);
  for (let x = 1; x < 15; x++) { put(img, x, 1, R.luz); put(img, x, 20, R.funda); }
  return img;
}

/** Moeda dourada (anel coletável), 4 quadros girando. */
function moeda(cor, quadro) {
  const larguras = [12, 9, 4, 9], wq = larguras[quadro % 4];
  const img = novo(14, 14), cx = 6.5, cy = 6.5;
  const dentro = (x, y) => ((x - cx) / (wq / 2 + 0.4)) ** 2 + ((y - cy) / 6.4) ** 2 <= 1;
  pintarMascara(img, dentro, cor);
  const R = ramp(cor);
  if (wq >= 9) {
    // Nota musical gravada no meio da moeda.
    for (let y = 4; y <= 8; y++) put(img, 7, y, R.funda);
    put(img, 6, 9, R.funda); put(img, 5, 9, R.funda); put(img, 5, 8, R.funda); put(img, 6, 8, R.funda);
    put(img, 8, 4, R.funda); put(img, 8, 5, R.funda);
  } else for (let y = 3; y <= 10; y++) put(img, 6, y, R.luz);
  brilhoEm(img, Math.max(3, Math.round(cx - wq / 4)), 3);
  return img;
}

/** Textura repetível de placa (larga/onda/longa): listras diagonais em movimento. */
function placa(cor) {
  const img = novo(16, 8), R = ramp(cor);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) {
    let c = ((x + y) >> 2) % 2 ? R.base : R.sombra;
    if (y === 0) c = R.luz; if (y === 7) c = R.funda;
    put(img, x, y, c);
  }
  return img;
}

/** Faísca em cruz para partículas. */
export function faisca() {
  const img = novo(3, 3);
  put(img, 1, 0, '#ffffff'); put(img, 0, 1, '#ffffff'); put(img, 1, 1, '#ffffff'); put(img, 2, 1, '#ffffff'); put(img, 1, 2, '#ffffff');
  return img;
}

/** Estrela de 4 pontas (5×5) para brilhos maiores. */
export function estrela() {
  const img = novo(5, 5);
  for (const [x, y] of [[2, 0], [2, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [2, 3], [2, 4]]) put(img, x, y, '#ffffff');
  return img;
}

/**
 * Ícone de um tipo de nota. `quadro` só importa para a moeda.
 * Tipo: { forma, altura, pistas, coletavel, duracaoVariavel, cor }.
 */
export function noteIcon(tipo, quadro = 0) {
  const cor = snapToPalette(tipo.cor);
  if (tipo.coletavel) return moeda(cor, quadro);
  if (tipo.pistas >= 2 || tipo.forma === 'placa' || tipo.duracaoVariavel) return placa(cor);
  if (tipo.forma === 'prisma' && tipo.altura === 'alta') return parede(cor);
  if (tipo.forma === 'losango') return losango(cor);
  return orbe(cor);
}

