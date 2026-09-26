import { validateSong, comprimentoEmBatidas } from './schema.js';

export function createSongRegistry(defs) {
  const byId = new Map();
  for (const def of defs) {
    validateSong(def);
    if (byId.has(def.id)) throw new Error(`Música duplicada: ${def.id}`);
    byId.set(def.id, Object.freeze({ ...def, comprimentoBatidas: comprimentoEmBatidas(def) }));
  }
  return {
    get(id) {
      const s = byId.get(id);
      if (!s) throw new Error(`Música desconhecida: ${id}`);
      return s;
    },
    has(id) { return byId.has(id); },
    all() { return [...byId.values()]; },
    ids() { return [...byId.keys()]; }
  };
}
