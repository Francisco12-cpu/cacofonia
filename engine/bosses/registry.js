import { validateBoss } from './schema.js';

export function createBossRegistry(defs, deps) {
  const byId = new Map();
  for (const def of defs) {
    validateBoss(def, deps);
    if (byId.has(def.id)) throw new Error(`Chefe duplicado: ${def.id}`);
    byId.set(def.id, Object.freeze(def));
  }
  return {
    get(id) {
      const b = byId.get(id);
      if (!b) throw new Error(`Chefe desconhecido: ${id}`);
      return b;
    },
    has(id) { return byId.has(id); },
    all() { return [...byId.values()]; },
    ids() { return [...byId.keys()]; },
    porTier(tier) { return [...byId.values()].filter((b) => b.tier === tier); }
  };
}
