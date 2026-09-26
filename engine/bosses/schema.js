export function validateBoss(def, { songRegistry, effectRegistry } = {}) {
  const errs = [];
  const req = (cond, msg) => { if (!cond) errs.push(msg); };

  req(typeof def.id === 'string' && def.id.length > 0, 'id ausente');
  req(typeof def.nome === 'string' && def.nome.length > 0, 'nome ausente');
  req(typeof def.musica === 'string', 'musica ausente');
  req(typeof def.hpMax === 'number' && def.hpMax > 0, 'hpMax deve ser número > 0');
  req(Array.isArray(def.janelasDeAtaque) && def.janelasDeAtaque.length > 0, 'janelasDeAtaque deve ter ao menos um ponto fixo');
  req(def.falas && Array.isArray(def.falas.intro) && Array.isArray(def.falas.vitoria), 'falas.intro e falas.vitoria são obrigatórias');

  if (songRegistry && def.musica && !songRegistry.has(def.musica)) {
    errs.push(`musica desconhecida: ${def.musica}`);
  }
  if (effectRegistry && Array.isArray(def.efeitosEspeciais)) {
    for (const efeito of def.efeitosEspeciais) {
      if (!effectRegistry.has(efeito.tipo)) errs.push(`efeito especial desconhecido: ${efeito.tipo}`);
    }
  }
  if (Array.isArray(def.janelasDeAtaque)) {
    for (const janela of def.janelasDeAtaque) {
      req(typeof janela.batida === 'number' && janela.batida >= 0, `janela de ataque inválida: ${JSON.stringify(janela)}`);
    }
  }

  if (errs.length) throw new Error(`Chefe inválido (${def.id || '?'}): ${errs.join('; ')}`);
}
