/**
 * Deriva a coreografia de ataques a partir da trilha de melodia de uma
 * música (seção 3.1/3.3 da bíblia): cada nota da melodia se torna um ataque,
 * escolhendo um tipo de nota da tabela orientada a dados e uma pista com
 * base na altura do som (grave à esquerda, agudo à direita — como no
 * protótipo). Não é código específico de chefe: qualquer música gera uma
 * coreografia jogável só com isso; ajustes por chefe entram como dados
 * (ver content/bosses/*.json) e não como um "post-processamento" em JS.
 */
export function buildChoreographyFromMelody(song, noteTypes, opts = {}) {
  const lanes = opts.lanes ?? 5;
  const melodia = song.trilhas.melodia;
  const pitches = [...new Set(melodia.map((e) => pitchOf(e.nota)))].sort((a, b) => a - b);
  const laneOf = (nota) => {
    if (pitches.length <= 1) return Math.floor(lanes / 2);
    const idx = pitches.indexOf(pitchOf(nota));
    return Math.round((idx / (pitches.length - 1)) * (lanes - 1));
  };

  const eventos = [];
  const doradaCadaBatidas = opts.doradaCadaBatidas ?? 2; // 1 dourada a cada 2 batidas com nota, como o protótipo (bar%2===0)
  let ultimaDouradaEm = -Infinity;

  for (const nota of melodia) {
    const lane = laneOf(nota.nota);
    const ehLonga = nota.duracao >= (opts.limiarLonga ?? 1.5);
    const tipoId = ehLonga ? (opts.tipoLonga ?? 'longa') : (opts.tipoPadrao ?? 'normal');
    const tipo = noteTypes.get(tipoId);

    const dourada = !ehLonga && nota.pos - ultimaDouradaEm >= doradaCadaBatidas;
    const tipoFinalId = dourada ? (opts.tipoDourada ?? 'dourada') : tipoId;
    if (dourada) ultimaDouradaEm = nota.pos;

    eventos.push({
      beat: nota.pos,
      lanes: [lane],
      type: tipoFinalId,
      len: ehLonga ? Math.max(0.75, nota.duracao * 0.8) : 0,
      nota: nota.nota
    });
  }

  eventos.sort((a, b) => a.beat - b.beat);
  return eventos;
}

const NI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function pitchOf(nota) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(nota);
  return NI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3]) * 12;
}
