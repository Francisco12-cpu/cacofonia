import { createBossRegistry } from './registry.js';

const modules = import.meta.glob('../../content/bosses/*.json', { eager: true });

export function loadBossRegistry(deps) {
  const defs = Object.values(modules).map((m) => m.default ?? m);
  return createBossRegistry(defs, deps);
}
