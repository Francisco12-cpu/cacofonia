import { describe, it, expect } from 'vitest';
import { BOSS_ART, HERO_ARTS, SMALL_ART } from '../engine/render2d/art.js';
import { expandRows, frameGrid, listFrames, rasterize, scale2x } from '../engine/render2d/pixelart.js';
import { PALETTE, ramp, snapToPalette } from '../engine/render2d/palette.js';
import { noteIcon } from '../engine/render2d/noteArt.js';
import { cenario } from '../game/battle/backdrops.js';

const VALIDOS = new Set(['.', 'k', '_', ...Object.keys(PALETTE)]);

describe('arte em pixel', () => {
  for (const [id, def] of Object.entries({ ...BOSS_ART, ...HERO_ARTS })) {
    it(`${id}: linhas com a mesma largura e só letras da paleta`, () => {
      const larg = new Set(def.rows.map((r) => r.length));
      expect(larg.size).toBe(1);
      for (const r of def.rows) for (const ch of r) expect(VALIDOS.has(ch), `${id}: "${ch}"`).toBe(true);
    });
    it(`${id}: todos os quadros rasterizam com o mesmo tamanho`, () => {
      const base = expandRows(def);
      for (const f of listFrames(def)) {
        const g = frameGrid(def, f);
        expect(g.length).toBe(base.length);
        expect(g[0].length).toBe(base[0].length);
        const img = rasterize(g, { outline: true });
        expect(img.w).toBe(base[0].length + 2);
        expect(img.data.some((v, i) => i % 4 === 3 && v === 255)).toBe(true);
      }
    });
  }

  it('chefes têm 32×32 e quadros de ataque e dano', () => {
    for (const [id, def] of Object.entries(BOSS_ART)) {
      const g = expandRows(def);
      expect([g.length, g[0].length], id).toEqual([32, 32]);
      expect(Object.keys(def.frames)).toEqual(expect.arrayContaining(['atk', 'hurt']));
    }
  });

  it('sprites pequenos do mundo usam só letras da paleta', () => {
    for (const rows of Object.values(SMALL_ART)) for (const r of rows) for (const ch of r) expect(VALIDOS.has(ch)).toBe(true);
  });

  it('rampa de cor: sombra mais escura e luz mais clara que a base', () => {
    const lum = (h) => { const n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11; };
    for (const cor of Object.values(PALETTE)) {
      const r = ramp(cor);
      expect(lum(r.funda)).toBeLessThanOrEqual(lum(r.sombra) + 0.5);
      expect(lum(r.sombra)).toBeLessThanOrEqual(lum(cor) + 0.5);
      expect(lum(r.luz)).toBeGreaterThanOrEqual(lum(cor) - 0.5);
    }
  });

  it('cores de conteúdo encaixam na paleta', () => {
    expect(snapToPalette('#ff2f8e')).toBe(PALETTE.R);
    expect(Object.values(PALETTE)).toContain(snapToPalette('#123456'));
  });

  it('scale2x dobra o tamanho', () => {
    const g = scale2x([['.', 'R'], ['R', 'R']]);
    expect([g.length, g[0].length]).toEqual([4, 4]);
  });

  it('ícones de nota diferem por forma (acessibilidade: não só por cor)', () => {
    const mesmaCor = '#2be9ff';
    const orbe = noteIcon({ forma: 'esfera', altura: 'baixa', pistas: 1, cor: mesmaCor });
    const los = noteIcon({ forma: 'losango', altura: 'baixa', pistas: 1, cor: mesmaCor });
    const par = noteIcon({ forma: 'prisma', altura: 'alta', pistas: 1, cor: mesmaCor });
    expect(new Set([`${orbe.w}x${orbe.h}`, `${los.w}x${los.h}`, `${par.w}x${par.h}`]).size).toBe(3);
  });

  it('todo cenário de chefe existe e tem 3 camadas', () => {
    for (const bg of ['stars', 'eq', 'fog', 'hive', 'lake', 'pipes', 'sun', 'void']) {
      const c = cenario(bg);
      expect(Object.keys(c)).toEqual(['longe', 'meio', 'perto']);
    }
  });
});
