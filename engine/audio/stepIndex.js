/** Indexa uma trilha por passo de 16 avos (`pos*4` arredondado) -> lista de eventos naquele passo. Sem dependência de Tone.js, para poder ser testada em Node puro. */
export function buildStepIndex(trilha = []) {
  const map = new Map();
  for (const ev of trilha) {
    const step = Math.round(ev.pos * 4);
    if (!map.has(step)) map.set(step, []);
    map.get(step).push(ev);
  }
  return map;
}
