import { sprite } from '../../engine/render2d/sprites.js';
import { PALETTE as P, ramp, snapToPalette } from '../../engine/render2d/palette.js';

/**
 * Fundo animado dos menus (seção 2: "os prédios do menu pulsam com a
 * música"): céu synthwave, sol listrado, cidade neon em pixel art cujas
 * janelas acendem na batida, grade do chão correndo no andamento da música e
 * Eco correndo em direção ao horizonte. Desenhado em baixa resolução e
 * ampliado sem filtro, como a batalha.
 */
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export class MenuBg {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.t = 0; this.cor = P.R; this.alvoCor = P.R; this.reduzido = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.ps = Math.max(2, Math.floor(Math.min(h, w * 0.75) / 200));
    this.w = Math.ceil(w / this.ps); this.h = Math.ceil(h / this.ps);
    this.cv.width = this.w; this.cv.height = this.h;
    this.ctx.imageSmoothingEnabled = false;
    // Prédios: gerados uma vez por tamanho de tela (determinísticos).
    const r = rng(42); this.predios = [];
    for (let x = -4; x < this.w + 4;) {
      const larg = 10 + Math.floor(r() * 16), alt = 14 + Math.floor(r() * this.h * 0.22);
      this.predios.push({ x, larg, alt, antena: r() < 0.3, fase: r() * 8, letreiro: r() < 0.25 ? Math.floor(r() * 3) : -1 });
      x += larg + 1 + Math.floor(r() * 3);
    }
    this.estrelas = Array.from({ length: 70 }, () => ({ x: Math.floor(r() * this.w), y: Math.floor(r() * this.h * 0.45), f: r() * 6 }));
  }

  /** Cor de destaque (ex.: a do chefe escolhido); a transição é suave. */
  destaque(cor) { this.alvoCor = snapToPalette(cor); }

  /** @param batida batida atual da música do menu (ou null sem música) */
  render(dt, batida, bpm = 112) {
    this.t += dt;
    if (this.cor !== this.alvoCor) this.cor = this.alvoCor;
    const c = this.ctx, W = this.w, H = this.h, t = this.t;
    const b = batida ?? t * bpm / 60;
    const kick = Math.pow(1 - (b - Math.floor(b)), 3);
    const hz = Math.round(H * 0.6), R = ramp(this.cor);
    const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

    // Céu em faixas com pontilhado.
    const faixas = ['#05020f', '#0e0420', P.Z, '#3a0d3e', R.funda];
    const alt = hz / faixas.length;
    faixas.forEach((col, i) => {
      px(0, i * alt, W, alt + 1, col);
      if (i + 1 < faixas.length) { c.fillStyle = faixas[i + 1]; for (let y = Math.round((i + 1) * alt) - 2; y < (i + 1) * alt; y++) for (let x = y & 1; x < W; x += 2) c.fillRect(x, y, 1, 1); }
    });
    for (const s of this.estrelas) if (Math.sin(t * 2 + s.f) > -0.5) px(s.x, s.y, 1, 1, s.f > 5 ? P.W : P.P);

    // Sol listrado que pulsa no bumbo.
    const sr = Math.min(W, H) * 0.2 * (1 + kick * 0.05), sx = W / 2, sy = hz - 2;
    for (let y = -sr; y < 0; y++) {
      const hw = Math.sqrt(sr * sr - y * y), k = (y + sr) / sr;
      if (y > -sr * 0.5 && Math.floor((y + t * 8) / 3) % 3 === 0) continue;
      px(sx - hw, sy + y, hw * 2, 1, k < 0.35 ? P.Y : k < 0.65 ? P.A : k < 0.85 ? P.O : P.R);
    }

    // Cidade neon: janelas acendem no ritmo, letreiros piscam.
    for (const p of this.predios) {
      const topo = hz - p.alt;
      px(p.x, topo, p.larg, p.alt, '#0d0620');
      px(p.x, topo, p.larg, 1, R.sombra);
      if (p.antena) { px(p.x + Math.floor(p.larg / 2), topo - 6, 1, 6, '#0d0620'); if (Math.floor(b) % 2) px(p.x + Math.floor(p.larg / 2), topo - 7, 1, 1, P.R); }
      for (let y = topo + 3; y < hz - 3; y += 4) for (let x = p.x + 2; x < p.x + p.larg - 2; x += 3) {
        const aceso = Math.sin(x * 1.3 + y * 0.7 + p.fase + Math.floor(b) * 2.1) > 0.35 - kick * 0.5;
        if (aceso) px(x, y, 1, 2, (x + y) % 5 ? P.Y : this.cor);
      }
      if (p.letreiro >= 0) {
        const cor = [P.C, P.R, P.G][p.letreiro], liga = Math.floor(t * 3 + p.fase) % 5 !== 0;
        if (liga) { px(p.x + 2, topo + 4, p.larg - 4, 1, cor); px(p.x + 2, topo + 8, p.larg - 4, 1, cor); }
      }
    }

    // Chão em grade correndo no andamento da música.
    px(0, hz, W, H - hz, '#07030f');
    px(0, hz, W, 1, this.cor);
    const off = b % 1;
    c.fillStyle = this.cor;
    for (let k = 0; k < 10; k++) {
      const d = (k + off) / 10, y = hz + Math.round(Math.pow(d, 2.2) * (H - hz));
      c.globalAlpha = 0.2 + 0.6 * d; c.fillRect(0, y, W, 1);
    }
    c.globalAlpha = 0.45;
    for (let i = -14; i <= 14; i++) {
      for (let s = 0; s <= 1; s += 0.02) {
        const x = W / 2 + i * 6 * (1 - s) + i * W * 0.16 * s, y = hz + s * (H - hz);
        c.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
    c.globalAlpha = 1;

    // Eco correndo no ritmo.
    const spr = sprite('eco_costas', Math.floor(b * 2) % 2 ? 'passo' : 'base');
    const bob = Math.round(Math.abs(Math.sin(b * Math.PI)) * 2);
    c.globalAlpha = 0.4; px(W / 2 - 8, H - 10, 16, 2, '#000'); c.globalAlpha = 1;
    c.drawImage(spr, Math.round(W / 2 - spr.width / 2), H - spr.height - 9 - bob);

    // Notinhas subindo.
    if (!this.reduzido) {
      c.font = "8px 'Press Start 2P', monospace"; c.textBaseline = 'top';
      for (let i = 0; i < 6; i++) {
        const f = (t * 0.2 + i / 6) % 1, x = (i * 53 + Math.sin(t + i) * 10) % W, y = hz - f * hz;
        c.globalAlpha = 1 - f; c.fillStyle = i % 2 ? P.C : P.b; c.fillText(i % 2 ? '♪' : '♫', Math.round(x), Math.round(y));
      }
      c.globalAlpha = 1;
    }
    return kick;
  }
}
