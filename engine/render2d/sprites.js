import { BOSS_ART, HERO_ARTS, SMALL_ART as SMALL_BASE, ICON_ART } from './art.js';
import { frameGrid, rasterize } from './pixelart.js';

/**
 * Sprites em canvas, gerados a partir da arte em texto (engine/render2d/art.js)
 * pelo rasterizador puro (engine/render2d/pixelart.js), com cache.
 *
 *   sprite('maestro')                 -> quadro base do chefe
 *   sprite('maestro', 'atk')          -> quadro de ataque
 *   sprite('maestro', 'base', { tint: '#fff' })  -> silhueta (flash de acerto)
 *   sprite('maestro', 'base', { gray: 0.85 })    -> derrotado
 *   sprite('eco_u1')                  -> sprite pequeno do mundo aberto
 */
const DEFS = { ...BOSS_ART, ...HERO_ARTS };
const SMALL_ART = { ...SMALL_BASE, ...ICON_ART };
const cache = new Map();

function toCanvas({ w, h, data }) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0);
  return c;
}

export function hasSprite(id) { return id in DEFS || id in SMALL_ART; }

export function sprite(id, frame = 'base', opts = {}) {
  const key = `${id}|${frame}|${opts.tint || ''}|${opts.gray || 0}`;
  if (cache.has(key)) return cache.get(key);
  let img;
  if (DEFS[id]) {
    const def = DEFS[id];
    const f = frame in (def.frames || {}) || frame === 'respira' ? frame : 'base';
    img = rasterize(frameGrid(def, f), { outline: true, tint: opts.tint, gray: opts.gray });
  } else if (SMALL_ART[id]) {
    img = rasterize(SMALL_ART[id].map((r) => [...r]), { tint: opts.tint, gray: opts.gray });
  } else throw new Error(`Sprite desconhecido: ${id}`);
  const c = toCanvas(img);
  cache.set(key, c);
  return c;
}

/** Compatibilidade com o código antigo: mapa id -> canvas base (e versão branca). */
let compat = null;
export function getSpriteCache() {
  if (!compat) {
    const SPR = {}, SPR_W = {};
    for (const id of [...Object.keys(DEFS), ...Object.keys(SMALL_ART)]) {
      Object.defineProperty(SPR, id, { get: () => sprite(id), enumerable: true });
      Object.defineProperty(SPR_W, id, { get: () => sprite(id, 'base', { tint: '#ffffff' }), enumerable: true });
    }
    compat = { SPR, SPR_W };
  }
  return compat;
}

export const SPR_TXT = SMALL_ART;

/** Ícone/sprite como URL de imagem (para <img> na interface HTML). */
const urlCache = new Map();
export function spriteUrl(id, frame = 'base', opts = {}) {
  const k = `${id}|${frame}|${opts.tint || ''}|${opts.gray || 0}`;
  if (!urlCache.has(k)) urlCache.set(k, sprite(id, frame, opts).toDataURL());
  return urlCache.get(k);
}
