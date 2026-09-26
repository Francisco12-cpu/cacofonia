import { validateNoteType, computeAvisoBatidas } from './schema.js';

/**
 * Registro de tipos de nota. O motor não conhece nenhum tipo de antemão —
 * tudo vem de `content/notetypes/*.json` (ver seção 3.1 da bíblia).
 */
export function createNoteTypeRegistry(defs) {
  const byId = new Map();
  for (const def of defs) {
    validateNoteType(def);
    if (byId.has(def.id)) throw new Error(`Tipo de nota duplicado: ${def.id}`);
    byId.set(def.id, Object.freeze({ ...def, avisoBatidasResolvido: computeAvisoBatidas(def) }));
  }
  return {
    get(id) {
      const t = byId.get(id);
      if (!t) throw new Error(`Tipo de nota desconhecido: ${id}`);
      return t;
    },
    has(id) { return byId.has(id); },
    all() { return [...byId.values()]; },
    ids() { return [...byId.keys()]; }
  };
}
