const ESCALAS = {
  'maior': [0, 2, 4, 5, 7, 9, 11],
  'menor natural': [0, 2, 3, 5, 7, 8, 10]
};

const NI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function pitchClass(nota) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(nota);
  if (!m) throw new Error(`Nota inválida: ${nota}`);
  return (NI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
}
/** Classe de altura da tônica de um tom (ex: "Am", "F#", "C") — sem oitava. */
function rootPitchClass(tom) {
  const m = /^([A-G])(#|b)?m?$/.exec(tom);
  if (!m) throw new Error(`Tom inválido: ${tom}`);
  return (NI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
}

export function validateSong(def) {
  const errs = [];
  const req = (cond, msg) => { if (!cond) errs.push(msg); };

  req(typeof def.id === 'string' && def.id.length > 0, 'id ausente');
  req(typeof def.bpm === 'number' && def.bpm > 0, 'bpm deve ser número > 0');
  req(typeof def.compasso === 'string', 'compasso ausente');
  req(typeof def.tom === 'string', 'tom ausente');
  req(ESCALAS[def.escala] !== undefined, `escala desconhecida: ${def.escala} (use ${Object.keys(ESCALAS).join(' | ')})`);
  req(def.trilhas && typeof def.trilhas === 'object', 'trilhas ausente');

  if (def.trilhas) {
    for (const nome of ['melodia', 'harmonia', 'baixo', 'arpejo']) {
      const trilha = def.trilhas[nome];
      if (!trilha) continue;
      for (const nota of trilha) {
        req(typeof nota.pos === 'number' && nota.pos >= 0, `${nome}: pos inválido em ${JSON.stringify(nota)}`);
        req(typeof nota.duracao === 'number' && nota.duracao > 0, `${nome}: duracao inválida em ${JSON.stringify(nota)}`);
        req(typeof nota.nota === 'string', `${nome}: campo "nota" ausente em ${JSON.stringify(nota)}`);
      }
    }
    if (def.trilhas.bateria) {
      for (const golpe of def.trilhas.bateria) {
        req(typeof golpe.voz === 'string', `bateria: campo "voz" ausente em ${JSON.stringify(golpe)}`);
      }
    }
  }

  if (errs.length) throw new Error(`Música inválida (${def.id || '?'}): ${errs.join('; ')}`);
}

/** Trava de escala do editor (seção 3.3): a nota pertence ao tom/escala configurados? */
export function notaNaEscala(nota, tom, escala) {
  const graus = ESCALAS[escala];
  if (!graus) throw new Error(`Escala desconhecida: ${escala}`);
  const tonica = rootPitchClass(tom);
  const intervalo = ((pitchClass(nota) - tonica) % 12 + 12) % 12;
  return graus.includes(intervalo);
}

export function comprimentoEmBatidas(song) {
  let max = 0;
  for (const trilha of Object.values(song.trilhas)) {
    for (const evento of trilha) max = Math.max(max, evento.pos + evento.duracao);
  }
  return max;
}
