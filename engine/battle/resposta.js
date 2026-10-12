/**
 * Mecânica "Resposta" (seção 4 da bíblia). Fluxo:
 *  1. Durante a luta normal, notas douradas coletadas com sucesso entram
 *     numa melodia em construção (createMelodyCollector).
 *  2. Numa janela de ataque fixa (boss.janelasDeAtaque), a fase de resposta
 *     começa: cada nota coletada vira uma barra de tempo, em sequência
 *     (startResponsePhase).
 *  3. O jogador aperta uma vez por nota da própria melodia; cada aperto é
 *     julgado (judgeResponseHit) em perfeito/bom/erro.
 *  4. Ao fim, o dano é proporcional à completude (quantas douradas do trecho
 *     foram mesmo coletadas) e à qualidade média do tempo (finalizeResponse).
 *
 * Como a fase apresenta as notas sempre na ordem em que foram coletadas
 * (uma barra por vez, sequencial), "fora de ordem" não é uma entrada
 * separada — vira, na prática, uma sequência de erros de tempo, que já
 * colapsa o dano para perto de zero pela fórmula abaixo. Isso é uma
 * simplificação deliberada desta primeira leva (motor de testes, seção 7);
 * dá pra evoluir para múltiplas barras simultâneas depois sem mudar essa
 * API.
 */

export function createMelodyCollector() {
  const notas = [];
  return {
    collect(nota, beat) { notas.push({ nota, beat }); },
    snapshot() { return notas.slice(); },
    /** As notas coletadas sem copiar (somente leitura) — para desenhar a cada quadro sem alocar. */
    get lista() { return notas; },
    clear() { notas.length = 0; },
    get tamanho() { return notas.length; }
  };
}

/**
 * @param melodia — snapshot de createMelodyCollector()
 * @param opts.intervaloBatidas espaçamento entre as barras de tempo
 * @param opts.inicioBatidas batidas de preparo antes da 1ª barra (sem isso a 1ª
 *   nota cairia no mesmo instante em que a fase aparece — impossível de acertar)
 */
export function startResponsePhase(melodia, opts = {}) {
  const intervaloBatidas = opts.intervaloBatidas ?? 1;
  const inicioBatidas = opts.inicioBatidas ?? 0;
  return {
    notas: melodia.map((n, i) => ({ nota: n.nota, janelaCentro: inicioBatidas + i * intervaloBatidas })),
    respostas: [],
    indiceAtual: 0,
    encerrada: melodia.length === 0
  };
}

export function notaAtual(fase) {
  return fase.indiceAtual < fase.notas.length ? fase.notas[fase.indiceAtual] : null;
}

/**
 * Registra uma tentativa de acerto no instante `tempoAtualBatidas`.
 * Retorna a qualidade do acerto, ou null se não havia nota pendente.
 */
export function judgeResponseHit(fase, tempoAtualBatidas, janelas = {}) {
  const nota = notaAtual(fase);
  if (!nota) return null;
  const janelaBoa = janelas.boa ?? 0.3, janelaPerfeita = janelas.perfeita ?? 0.1;
  const offset = tempoAtualBatidas - nota.janelaCentro;
  const dist = Math.abs(offset);
  const qualidade = dist <= janelaPerfeita ? 'perfeito' : dist <= janelaBoa ? 'bom' : 'errou';
  fase.respostas.push({ nota: nota.nota, qualidade, offset });
  fase.indiceAtual++;
  if (fase.indiceAtual >= fase.notas.length) fase.encerrada = true;
  return { qualidade, offset };
}

/** Passagem do tempo sem input: se a janela da nota atual já passou, conta como erro (mantém a ordem). */
export function expireIfMissed(fase, tempoAtualBatidas, janelaBoa = 0.3) {
  const nota = notaAtual(fase);
  if (!nota) return null;
  if (tempoAtualBatidas - nota.janelaCentro > janelaBoa) {
    fase.respostas.push({ nota: nota.nota, qualidade: 'errou', offset: tempoAtualBatidas - nota.janelaCentro });
    fase.indiceAtual++;
    if (fase.indiceAtual >= fase.notas.length) fase.encerrada = true;
    return 'errou';
  }
  return null;
}

const PONTOS_QUALIDADE = { perfeito: 1, bom: 0.6, errou: 0 };

/**
 * @param totalDouradasOferecidas quantas notas douradas passaram pelo jogador
 *   até esta janela (coletadas ou não) — mede completude.
 * @param danoBase dano máximo possível de uma resposta perfeita e completa.
 */
export function finalizeResponse(fase, totalDouradasOferecidas, danoBase) {
  const totalColetadas = fase.notas.length;
  const completude = totalDouradasOferecidas > 0 ? Math.min(1, totalColetadas / totalDouradasOferecidas) : 0;
  const precisaoMedia = fase.respostas.length
    ? fase.respostas.reduce((acc, r) => acc + PONTOS_QUALIDADE[r.qualidade], 0) / fase.respostas.length
    : 0;
  const fatorDano = completude * precisaoMedia;
  return {
    completude,
    precisaoMedia,
    fatorDano,
    dano: Math.round(danoBase * fatorDano)
  };
}
