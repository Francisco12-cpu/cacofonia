import { PALETTE as P } from '../../engine/render2d/palette.js';

/**
 * Cenários de fundo em pixel art, um por `cenario.bg` dos chefes. Cada
 * cenário tem 3 camadas (longe / meio / perto) desenhadas em canvas de baixa
 * resolução e montadas no Stage3D como planos em profundidades diferentes —
 * a perspectiva da câmera dá o parallax. Camadas `animada: true` são
 * redesenhadas ~15x/s e reagem à batida (`kick`).
 *
 * pintar(ctx, w, h, t, kick, cor) — t em segundos, kick 0..1, cor do chefe.
 */

function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

/** Céu em faixas com pontilhado (dither) na transição — gradiente "de pixel art". */
function faixas(c, w, y0, y1, cores) {
  const n = cores.length, alt = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    const ya = Math.round(y0 + i * alt), yb = Math.round(y0 + (i + 1) * alt);
    R(c, 0, ya, w, yb - ya, cores[i]);
    if (i + 1 < n) {
      c.fillStyle = cores[i + 1];
      for (let y = yb - 2; y < yb; y++) for (let x = (y & 1); x < w; x += 2) c.fillRect(x, y, 1, 1);
    }
  }
}
function estrelas(c, w, h, n, seed, cores, t = 0) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * w), y = Math.floor(r() * h), cor = cores[Math.floor(r() * cores.length)], fase = r() * 6.28;
    if (Math.sin(t * 2 + fase) > -0.6) R(c, x, y, 1, 1, cor);
    if (r() < 0.06 && Math.sin(t * 3 + fase) > 0.7) { R(c, x - 1, y, 3, 1, cor); R(c, x, y - 1, 1, 3, cor); }
  }
}
function circulo(c, cx, cy, r, col) {
  for (let y = -r; y <= r; y++) { const hw = Math.floor(Math.sqrt(r * r - y * y)); R(c, cx - hw, cy + y, hw * 2 + 1, 1, col); }
}
function elipseContorno(c, cx, cy, rx, ry, col, passo = 0.04) {
  for (let a = 0; a < Math.PI * 2; a += passo) R(c, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 1, 1, col);
}

const CENARIOS = {
  /** Maestro: sala de concerto no espaço, vórtice girando e cortinas. */
  stars: {
    longe: { pintar(c, w, h) {
      faixas(c, w, 0, h, ['#05020f', '#0e0420', P.Z, '#3a0d3e', '#55124c']);
      estrelas(c, w, h * 0.7, 55, 7, [P.W, P.P, P.p]);
      R(c, 0, h * 0.82, w, h * 0.18, '#0b0714');
    } },
    meio: { animada: true, pintar(c, w, h, t, kick) {
      const cx = w / 2, cy = h * 0.42;
      for (let braco = 0; braco < 4; braco++) for (let k = 4; k < 60; k++) {
        const a = k * 0.16 + t * 0.7 + braco * Math.PI / 2, r = k * 0.8 * (1 + kick * 0.08);
        const cor = k < 14 ? P.P : k < 34 ? P.p : P.V;
        R(c, cx + Math.cos(a) * r * 1.8, cy + Math.sin(a) * r * 0.55, 1, 1, cor);
      }
    } },
    perto: { pintar(c, w, h) {
      for (const lado of [0, 1]) for (let i = 0; i < 26; i++) {
        const x = lado ? w - 1 - i : i, dobra = Math.floor(i / 5) % 2;
        R(c, x, 0, 1, h - (i * 0.9), dobra ? P.Q : P.R);
      }
      R(c, 0, 0, w, 6, P.U); for (let x = 4; x < w; x += 12) { R(c, x, 6, 3, 4, P.A); R(c, x + 1, 10, 1, 2, P.U); }
    } }
  },

  /** DJ: clube com equalizador gigante e caixas de som. */
  eq: {
    longe: { pintar(c, w, h) {
      faixas(c, w, 0, h, ['#040c12', '#081a24', '#0c2430']);
      for (let y = 4; y < h * 0.8; y += 6) for (let x = (y / 6 % 2) * 6; x < w; x += 12) R(c, x, y, 11, 5, '#0a1e2a');
      R(c, 0, h * 0.8, w, h * 0.2, '#03080c');
    } },
    meio: { animada: true, pintar(c, w, h, t, kick) {
      const n = 22, bw = Math.floor(w / n);
      for (let i = 0; i < n; i++) {
        const v = 0.35 + 0.3 * Math.sin(t * 3.1 + i * 0.7) * Math.sin(t * 1.3 + i * 0.31) + kick * 0.45 * (1 - Math.abs(i - n / 2) / n);
        const blocos = Math.max(1, Math.round(v * 14));
        for (let b = 0; b < blocos; b++) R(c, i * bw + 1, h - 4 - b * 4, bw - 2, 3, b > 11 ? P.R : b > 7 ? P.Y : P.G);
      }
    } },
    perto: { animada: true, pintar(c, w, h, t, kick) {
      for (const x0 of [2, w - 34]) {
        R(c, x0, 8, 32, h - 8, '#120c1c'); R(c, x0, 8, 32, 1, P.m);
        for (const [cy, r] of [[20, 9], [44, 11]]) {
          const rr = r + Math.round(kick * 2);
          circulo(c, x0 + 16, cy, rr, P.m); circulo(c, x0 + 16, cy, rr - 2, '#1a1530'); circulo(c, x0 + 16, cy, 3, P.M);
        }
      }
    } }
  },

  /** Cantora Fantasma: teatro em ruínas, lustre e névoa. */
  fog: {
    longe: { pintar(c, w, h) {
      faixas(c, w, 0, h, ['#02080c', '#04121a', '#082028']);
      circulo(c, w / 2, h * 0.32, 22, '#0e3440'); circulo(c, w / 2, h * 0.32, 19, '#123c4a');
      for (let a = 0; a < 8; a++) R(c, w / 2 + Math.cos(a * 0.785) * 10 - 1, h * 0.32 + Math.sin(a * 0.785) * 10, 2, 9, '#0e3440');
      circulo(c, w / 2 + 6, h * 0.26, 6, P.I); circulo(c, w / 2 + 4, h * 0.25, 5, '#123c4a');
      R(c, 0, h * 0.8, w, h * 0.2, '#020609');
    } },
    meio: { pintar(c, w, h) {
      for (let i = 0; i < 6; i++) {
        const x = i * (w / 5) - 12, topo = h * 0.25 + (i % 2) * 6;
        R(c, x, topo, 8, h - topo, P.B); R(c, x + 8, topo, 2, h - topo, P.Z);
        for (let a = 0; a <= 20; a++) { const ang = Math.PI * a / 20; R(c, x + 4 + (w / 5) / 2 - Math.cos(ang) * (w / 10), topo - Math.sin(ang) * 14, 3, 3, P.B); }
      }
      const lx = w / 2; R(c, lx, 0, 1, 14, P.U);
      for (let i = -3; i <= 3; i++) { R(c, lx + i * 5 - 1, 14 + Math.abs(i), 3, 3, P.U); R(c, lx + i * 5, 11 + Math.abs(i), 1, 3, P.A); }
    } },
    perto: { animada: true, pintar(c, w, h, t) {
      c.globalAlpha = 0.18;
      for (let i = 0; i < 7; i++) {
        const x = ((t * (6 + i * 2) + i * 70) % (w + 120)) - 60, y = h * 0.35 + (i % 3) * 9;
        R(c, x, y, 60, 5, P.L); R(c, x + 10, y - 3, 34, 3, P.L); R(c, x + 6, y + 5, 40, 2, P.L);
      }
      c.globalAlpha = 1;
    } }
  },

  /** Rainha Zumbido: colmeia brilhando no ritmo. */
  hive: {
    longe: { pintar(c, w, h) {
      faixas(c, w, 0, h, ['#1f1600', '#2e2000', '#422e00', '#5a3a00']);
      R(c, 0, h * 0.8, w, h * 0.2, '#140e00');
    } },
    meio: { animada: true, pintar(c, w, h, t, kick) {
      const r = 7, dx = r * 1.75, dy = r * 1.5;
      for (let j = 0; j < h / dy + 1; j++) for (let i = -1; i < w / dx + 1; i++) {
        const cx = i * dx + (j % 2) * dx / 2, cy = j * dy;
        const aceso = Math.sin(i * 1.7 + j * 2.3 + t * 2) > 0.85 - kick * 0.5;
        for (let k = 0; k < 6; k++) {
          const a = k * Math.PI / 3 + Math.PI / 6;
          R(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 2, P.U);
        }
        if (aceso) circulo(c, cx, cy, 3, P.A);
      }
    } },
    perto: { pintar(c, w, h) {
      const r = rng(31);
      for (let x = 0; x < w; x += 3) { const l = 2 + Math.floor(r() * 10); R(c, x, 0, 3, l, P.A); R(c, x + 1, l, 1, 2, P.Y); }
      for (let i = 0; i < 9; i++) { const x = Math.floor(r() * w); R(c, x, h - 6, 1, 6, P.g); R(c, x - 1, h - 8, 3, 2, i % 2 ? P.b : P.W); }
    } }
  },

  /** Cisne de Cristal: lago noturno com a lua refletida. */
  lake: {
    longe: { pintar(c, w, h, t) {
      faixas(c, w, 0, h * 0.78, ['#020818', '#05102a', '#0a1c40', '#12285a']);
      estrelas(c, w, h * 0.6, 70, 11, [P.W, P.I], t);
      circulo(c, w * 0.7, h * 0.3, 12, P.W); circulo(c, w * 0.7 - 3, h * 0.28, 3, P.I);
      R(c, 0, h * 0.78, w, h * 0.22, '#0a2a5a');
    } },
    meio: { pintar(c, w, h) {
      const r = rng(5);
      let y = h * 0.6;
      for (let x = 0; x < w; x++) { y += (r() - 0.5) * 3; y = Math.max(h * 0.45, Math.min(h * 0.75, y)); R(c, x, y, 1, h - y, '#06122c'); }
      for (let i = 0; i < 26; i++) { const x = Math.floor(r() * w), alt = 6 + Math.floor(r() * 10); R(c, x, h - alt - 4, 1, alt, '#0b1c3c'); }
    } },
    perto: { animada: true, pintar(c, w, h, t) {
      R(c, 0, h * 0.55, w, h * 0.45, '#0a2a5a');
      for (let i = 0; i < 18; i++) {
        const y = h * 0.6 + i * 1.6, larg = 14 - i * 0.5 + Math.sin(t * 3 + i) * 3;
        R(c, w * 0.7 - larg / 2 + Math.sin(t * 2 + i * 0.8) * 2, y, larg, 1, i % 2 ? P.I : P.L);
      }
      for (let i = 0; i < 20; i++) R(c, ((i * 37 + t * 8) % w), h * 0.6 + (i * 7) % (h * 0.35), 4, 1, '#1d4e9e');
    } }
  },

  /** Órgão-Mecânico: catedral com rosácea de vitral e tubos. */
  pipes: {
    longe: { animada: true, pintar(c, w, h, t) {
      faixas(c, w, 0, h, ['#0c0202', '#1a0505', '#260808']);
      const cx = w / 2, cy = h * 0.6, cores = [P.R, P.Y, P.C, P.G, P.p, P.O];
      circulo(c, cx, cy, 26, '#2a1010');
      for (let s = 0; s < 12; s++) for (let r = 6; r < 24; r += 1) {
        const a = s * Math.PI / 6 + r * 0.01;
        R(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.95, 2, 2, cores[(s + Math.floor(t * 2)) % cores.length]);
      }
      circulo(c, cx, cy, 5, P.Y);
      R(c, 0, h * 0.82, w, h * 0.18, '#080101');
    } },
    meio: { pintar(c, w, h) {
      for (let i = 0; i < 24; i++) {
        if (i >= 9 && i <= 14) continue; // vão no meio: o chefe fica emoldurado pelos tubos
        const x = 8 + i * ((w - 16) / 23), d = Math.abs(i - 11.5), alt = h * 0.3 + d * 2.2;
        R(c, x, h - alt, 7, alt, P.m); R(c, x + 5, h - alt, 2, alt, '#2a2f45'); R(c, x, h - alt, 7, 1, P.M);
        R(c, x + 1, h - alt + 6, 5, 2, P.K); R(c, x, h - alt + 10, 7, 1, P.U);
      }
    } },
    perto: { pintar(c, w, h) {
      for (const x0 of [0, w - 22]) {
        R(c, x0, 0, 22, h, P.m); R(c, x0 + 3, 0, 2, h, P.X); R(c, x0 + 17, 0, 2, h, '#2a2f45');
        for (let y = 6; y < h; y += 14) R(c, x0, y, 22, 2, P.X);
      }
    } }
  },

  /** Colosso: pôr do sol sintético, vulcões e brasas. */
  sun: {
    longe: { animada: true, pintar(c, w, h, t) {
      faixas(c, w, 0, h * 0.8, ['#200800', '#3a0c02', '#6a1a04', '#a8340a']);
      const cx = w / 2, cy = h * 0.62, r = 30;
      for (let y = -r; y < 0; y++) {
        const hw = Math.sqrt(r * r - y * y), k = (y + r) / r;
        if (y > -r * 0.5 && Math.floor((y + t * 6) / 3) % 3 === 0) continue;
        R(c, cx - hw, cy + y, hw * 2, 1, k < 0.4 ? P.Y : k < 0.7 ? P.A : P.O);
      }
      R(c, 0, h * 0.8, w, h * 0.2, '#100300');
    } },
    meio: { pintar(c, w, h) {
      const pico = (x, larg, alt) => { for (let i = 0; i < larg; i++) { const y = h - alt + Math.abs(i - larg / 2) * (alt / (larg / 2)); R(c, x + i, y, 1, h - y, '#1a0600'); if (Math.abs(i - larg / 2) < 3) R(c, x + i, h - alt + 1, 1, 2, P.E); } };
      pico(-10, 90, h * 0.7); pico(70, 120, h * 0.95); pico(170, 100, h * 0.6);
    } },
    perto: { animada: true, pintar(c, w, h, t) {
      for (let i = 0; i < 40; i++) {
        const x = (i * 53 + Math.sin(t + i) * 6) % w, y = h - ((t * (10 + i % 7 * 3) + i * 17) % h);
        R(c, x, y, 1, 1, i % 3 ? P.O : P.Y);
      }
    } }
  },

  /** O Grande Silêncio: vazio com pautas quebradas flutuando. */
  void: {
    longe: { pintar(c, w, h, t) {
      R(c, 0, 0, w, h, '#000000');
      estrelas(c, w, h, 50, 3, ['#555', '#888', '#ccc'], t);
    } },
    meio: { animada: true, pintar(c, w, h, t) {
      for (let k = 0; k < 4; k++) {
        const y0 = 10 + k * 16 + Math.sin(t * 0.6 + k) * 3, x0 = ((t * (4 + k * 2) + k * 70) % (w + 80)) - 60, larg = 40 + k * 8;
        for (let l = 0; l < 5; l++) for (let x = 0; x < larg; x++) if ((x + l * 3 + k) % 11 !== 0) R(c, x0 + x, y0 + l * 2, 1, 1, '#777');
        R(c, x0 + 10, y0 + 2, 3, 2, '#bbb'); R(c, x0 + 12, y0 - 4, 1, 6, '#bbb');
        R(c, x0 + 26, y0 + 6, 3, 2, '#bbb'); R(c, x0 + 28, y0, 1, 6, '#bbb');
      }
    } },
    perto: { pintar() {} }
  }
};

/** Especificação das camadas de um cenário: tamanho do canvas e posição no palco 3D. */
export const CAMADAS = {
  longe: { w: 256, h: 96, mundoW: 200, mundoH: 75, y: 21, z: -70 },
  meio: { w: 256, h: 80, mundoW: 128, mundoH: 40, y: 10, z: -46 },
  perto: { w: 256, h: 64, mundoW: 84, mundoH: 21, y: 6, z: -31 }
};

export function cenario(bg) { return CENARIOS[bg] || CENARIOS.stars; }

