import { createNoteTypeRegistry } from './registry.js';

// import.meta.glob é resolvido em tempo de build pelo Vite: cada tipo de nota
// em content/notetypes/*.json entra automaticamente, sem tocar neste arquivo.
const modules = import.meta.glob('../../content/notetypes/*.json', { eager: true });

export function loadNoteTypeRegistry() {
  const defs = Object.values(modules).map((m) => m.default ?? m);
  return createNoteTypeRegistry(defs);
}
