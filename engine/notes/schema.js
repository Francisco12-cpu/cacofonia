const FORMAS = new Set(['esfera', 'prisma', 'losango', 'placa', 'anel', 'customizado']);
const ALTURAS = new Set(['baixa', 'alta']);

export function validateNoteType(def) {
  const errs = [];
  const req = (cond, msg) => { if (!cond) errs.push(msg); };

  req(typeof def.id === 'string' && def.id.length > 0, 'id ausente');
  req(typeof def.nome === 'string' && def.nome.length > 0, 'nome ausente');
  req(FORMAS.has(def.forma), `forma inválida: ${def.forma}`);
  req(Number.isInteger(def.pistas) && def.pistas >= 1, 'pistas deve ser inteiro >= 1');
  req(ALTURAS.has(def.altura), `altura inválida: ${def.altura}`);
  req(typeof def.duracao === 'number' && def.duracao >= 0, 'duracao deve ser número >= 0');
  req(typeof def.cor === 'string' && /^#[0-9a-fA-F]{6}$/.test(def.cor), 'cor deve ser hex #rrggbb');
  req(typeof def.instrumento === 'string' && def.instrumento.length > 0, 'instrumento ausente');
  req(typeof def.dano === 'number' && def.dano >= 0, 'dano deve ser número >= 0');
  req(def.avisoBatidas === 'auto' || typeof def.avisoBatidas === 'number', 'avisoBatidas deve ser "auto" ou número');
  req(def.movimento && typeof def.movimento.tipo === 'string', 'movimento.tipo ausente');

  if (def.altura === 'alta' && def.duracaoVariavel) {
    req(
      def.tiqueDano && typeof def.tiqueDano.intervalo === 'number' && def.tiqueDano.intervalo > 0,
      'tiqueDano.intervalo obrigatório para notas altas com duração variável'
    );
  }

  if (errs.length) throw new Error(`Tipo de nota inválido (${def.id || '?'}): ${errs.join('; ')}`);
}

export function computeAvisoBatidas(def) {
  if (def.avisoBatidas !== 'auto') return def.avisoBatidas;
  const base = 4;
  const fatorPorPista = 0.5;
  const extraParede = def.altura === 'alta' ? 1 : 0;
  return base + (def.pistas - 1) * fatorPorPista + extraParede;
}
