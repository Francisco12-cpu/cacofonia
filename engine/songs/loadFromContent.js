import { createSongRegistry } from './registry.js';

const modules = import.meta.glob('../../content/songs/*.json', { eager: true });

export function loadSongRegistry() {
  const defs = Object.values(modules).map((m) => m.default ?? m);
  return createSongRegistry(defs);
}
