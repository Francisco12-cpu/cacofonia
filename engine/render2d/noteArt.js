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

/** Bumerangue: meia-lua em "V". */
function bumerangue(cor) {
  const img = novo(16, 14);
  pintarMascara(img, (x, y) => {
    const dx = x - 7.5, dy = y - 6.5;
    return (Math.abs(dx) - dy * 0.9 <= 6 && Math.abs(dx) - dy * 0.9 >= 1.5 && y >= 1 && y <= 12 && Math.abs(dx) <= 7.5);
  }, cor);
  brilhoEm(img, 2, 3);
  return img;
}

/** Fantasma: fantasminha com olhos e barra ondulada. */
function fantasminha(cor) {
  const img = novo(14, 15);
  pintarMascara(img, (x, y) => {
    if (y < 7) return (x - 6.5) ** 2 + (y - 6.5) ** 2 <= 6.4 ** 2;
    return x >= 0.3 && x <= 12.7 && !(y >= 12 && (x + (y > 13 ? 1 : 0)) % 4 === 0);
  }, cor);
  for (const x of [4, 8]) { put(img, x, 6, PALETTE.K); put(img, x, 7, PALETTE.K); put(img, x + 1, 6, PALETTE.K); put(img, x + 1, 7, PALETTE.K); }
  return img;
}

/** Ímã: ferradura com pontas claras. */
function ima(cor) {
  const img = novo(14, 15);
  pintarMascara(img, (x, y) => {
    const dx = x - 6.5, dy = y - 6.5;
    const arco = y <= 6.5 && dx * dx + dy * dy <= 42 && dx * dx + dy * dy >= 9;
    const pernas = y > 6.5 && y <= 14 && ((x >= 0 && x <= 3.5) || (x >= 9.5 && x <= 13));
    return arco || pernas;
  }, cor);
  for (let x = 1; x <= 3; x++) for (const y of [12, 13]) { put(img, x, y, PALETTE.W); put(img, x + 9, y, PALETTE.W); }
  return img;
}

/** Gelo: floco de neve (cruz + diagonais). */
function floco(cor) {
  const img = novo(15, 15), c = 7;
  pintarMascara(img, (x, y) => {
    const dx = Math.abs(x - c), dy = Math.abs(y - c);
    return (dx <= 1 && dy <= 7) || (dy <= 1 && dx <= 7) || (Math.abs(dx - dy) <= 1 && dx <= 5) || (dx <= 2.5 && dy <= 2.5);
  }, cor);
  put(img, c, c, PALETTE.W);
  return img;
}

/** Divisora: orbe com uma fenda no meio, prestes a se partir. */
function divisoraIcon(cor) {
  const img = novo(15, 14);
  pintarMascara(img, (x, y) => (x - 7) ** 2 + (y - 6.5) ** 2 <= 6.4 ** 2 && Math.abs(x - 7) >= 1, cor);
  brilhoEm(img, 3, 3); brilhoEm(img, 9, 3);
  return img;
}

const POR_MOVIMENTO = { bumerangue, fantasma: fantasminha, ima, gelo: floco, divisora: divisoraIcon };

/**
 * Ícone de um tipo de nota. `quadro` só importa para a moeda.
 * Tipo: { forma, altura, pistas, coletavel, duracaoVariavel, cor, movimento }.
 * Movimentos especiais (bumerangue, fantasma, ímã, gelo, divisora) têm
 * silhueta própria, para nunca dependerem só da cor.
 */
export function noteIcon(tipo, quadro = 0) {
  const cor = snapToPalette(tipo.cor);
  if (tipo.coletavel) return moeda(cor, quadro);
  const porMov = POR_MOVIMENTO[tipo.movimento?.tipo];
  if (porMov && tipo.pistas < 2) return porMov(cor);
  if (tipo.pistas >= 2 || tipo.forma === 'placa' || tipo.duracaoVariavel) return placa(cor);
  if (tipo.forma === 'prisma' && tipo.altura === 'alta') return parede(cor);
  if (tipo.forma === 'losango') return losango(cor);
  return orbe(cor);
}

