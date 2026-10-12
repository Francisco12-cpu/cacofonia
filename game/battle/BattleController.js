import { buildChoreographyFromMelody } from '../../engine/battle/choreography.js';
import { judgeInstantNote, tickLongNoteDamage, finalizeLongNote } from '../../engine/battle/collision.js';
import { createMovementRegistry } from '../../engine/notes/movements.js';
import { janelaDevida } from '../../engine/battle/janelas.js';
import {
  createMelodyCollector, startResponsePhase, judgeResponseHit, expireIfMissed, finalizeResponse
} from '../../engine/battle/resposta.js';

const DIFICULDADE_DANO = { facil: 0.6, normal: 1, dificil: 1.5 };
const TIER_DANO = { 1: 0.8, 2: 1, 3: 1.2 };
const JUMP_MS = 520;
const RESPOSTA_PREPARO = 2; // batidas entre o aviso "RESPOSTA!" e a 1ª barra

/**
 * Orquestra uma luta: agenda o gráfico de ataques (a partir da melodia ou de
 * um gráfico customizado do editor), julga colisões via engine/battle,
 * aplica efeitos especiais via engine/effects, roda a coleta de notas
 * douradas e a fase de Resposta (engine/battle/resposta.js). Não desenha
 * nada — isso é trabalho do Stage3D; este módulo só produz o estado que a
 * cena renderiza.
 */
export class BattleController {
  /**
   * @param amuletos ids de amuletos equipados na Aventura (game/world/dados.js):
   *   tenis (pulo protege mais tempo), fole (+20 HP), cha (cura a cada volta),
   *   oculos (notas aparecem mais cedo), esporo (revive uma vez), metro
   *   (chefe acelera metade), luva (janela da Resposta maior e +25% de dano).
   * @param hpExtra vida a mais por nível (Aventura).
   */
  constructor({ boss, song, noteTypes, effects, chart, dificuldade = 'normal', amuletos = [], hpExtra = 0, onWin, onLose }) {
    this.boss = boss;
    this.song = song;
    this.noteTypes = noteTypes;
    this.effects = effects;
    this.movs = createMovementRegistry();
    this.dificuldade = dificuldade;
    this.onWin = onWin;
    this.onLose = onLose;
    this.notes = [];
    this.lane = 2; this.vl = 2;
    this.jump = false; this.jt = 0; this.jbuf = 0; this.dive = false;
    this.inv = 0; this.combo = 0; this.maxCombo = 0;
    this.amuletos = new Set(amuletos);
    this.maxHp = 100 + hpExtra + (this.amuletos.has('fole') ? 20 : 0); this.hp = this.maxHp;
    this.reviveu = false; this.ultimaVolta = 0;
    this.lento = 0; this.cooldownPista = 0;
    this.bhp = boss.hpMax; this.bmax = boss.hpMax;
    this.over = false; this.vencedor = null;
    this.floats = []; this.banner = null;
    /** Fila de acontecimentos (dano, coleta, acerto...) que a camada de apresentação consome para som/partículas. */
    this.events = [];
    this._novasNotas = [];
    this.fala = null;
    this.fxState = {};
    this.melody = createMelodyCollector();
    this.douradasOferecidas = 0;
    /** Estatísticas da luta inteira, para a nota final (engine/battle/nota.js). */
    this.stats = { douradasVistas: 0, douradasColetadas: 0, respostaPontos: 0, respostaNotas: 0, danoTomado: 0, danoCausado: 0 };
    this.janelasFeitas = new Set();
    this.responsePhase = null;
    this.nowBeat = -4;
    this.APPROACH_PADRAO = 4;
    this.setChart(chart || buildChoreographyFromMelody(song, noteTypes));
  }

  /**
   * A música toca em loop indefinidamente (engine/audio/songPlayer), mas um
   * gráfico (assado ou do editor) só cobre uma volta. As voltas são geradas
   * sob demanda (_estenderGrafico), então a luta nunca "esvazia" de notas.
   */
  setChart(chart) {
    this.chart = chart;
    this.pending = [];
    this._voltasGeradas = 0;
    this._estenderGrafico(this.nowBeat + 16);
  }

  _estenderGrafico(ateBatida) {
    const L = this.song.comprimentoBatidas;
    if (!(L > 0) || !this.chart.length) return;
    let mudou = false;
    while (this._voltasGeradas * L < ateBatida) {
      const volta = this._voltasGeradas++;
      for (const c of this.chart) this.pending.push({ ...c, lanes: c.lanes.slice(), beat: c.beat + volta * L });
      mudou = true;
    }
    if (mudou) {
      this.pending = this.pending.filter((c) => !c._agendado);
      this.pending.sort((a, b) => a.beat - b.beat);
    }
  }

  dmgMult() { return DIFICULDADE_DANO[this.dificuldade] ?? 1; }
  tierMult() { return TIER_DANO[this.boss.tier] ?? 1; }

  jumpSafe() {
    const [de, ate] = this.amuletos.has('tenis') ? [30, 490] : [50, 420];
    return this.jump && this.jt >= de && this.jt <= ate;
  }

  /** O metrônomo faz o chefe acelerar só metade a cada volta (passado ao songPlayer como stepMul). */
  multiplicadorAceleracao() { return this.amuletos.has('metro') ? 0.5 : 1; }

  /** Garante que notas cujo instante de aviso já chegou estejam agendadas (`pending` -> `notes`). */
  ensureChart(nb) {
    this._estenderGrafico(nb + 16);
    for (const c of this.pending) {
      if (c._agendado) continue;
      const tipo = this.noteTypes.get(c.type);
      const ap = this._approachFor(tipo, c);
      if (nb < c.beat - ap - 0.05) continue;
      c._agendado = true;
      // Nota que já deveria estar no meio do caminho (ex.: logo depois de uma
      // fase de Resposta) é descartada em vez de surgir em cima do jogador.
      if (nb > c.beat - ap * 0.5) continue;
      this.notes.push({
        ...c, hit: c.beat, ap, judged: false, tickTimer: 0, atingiuAoMenosUmTique: false, zig: Math.random() * 6
      });
    }
    if (this.pending.length > 256) this.pending = this.pending.filter((c) => !c._agendado);
  }

  _approachFor(tipo, evento) {
    const fx = this.effects.evaluate(this.boss.efeitosEspeciais, this.nowBeat, this._loopAtual());
    const extra = this.amuletos.has('oculos') ? 0.75 : 0;
    return (fx.fast ? 2.6 : (tipo.avisoBatidasResolvido ?? this.APPROACH_PADRAO)) + extra;
  }

  _loopAtual() { return Math.max(0, Math.floor(this.nowBeat / this.song.comprimentoBatidas)); }

  moveLane(d) {
    if (this.responsePhase || this.over) return;
    if (this.cooldownPista > 0) return; // gelo: o herói fica lento para trocar de pista
    const nl = Math.min(4, Math.max(0, this.lane + d));
    if (nl === this.lane) return;
    this.lane = nl;
    if (this.lento > 0) this.cooldownPista = 0.22;
    this.events.push({ tipo: 'mover', lane: nl });
  }

  doJump() {
    if (this.responsePhase || this.over) return;
    if (this.jump) { this.jbuf = 0.14; return; }
    this.jump = true; this.jt = 0;
    this.events.push({ tipo: 'pulo' });
  }

  doDive() { if (this.jump) { this.jt = Math.max(this.jt, JUMP_MS * 0.78); this.dive = true; } }

  /** Uma única entrada serve para coletar douradas na luta normal E para responder na fase de Resposta. */
  doCollect() {
    if (this.over) return;
    if (this.responsePhase) { this._respondHit(); return; }
    this._tryCollectGolden();
  }

  _tryCollectGolden() {
    const janelaBoa = 0.30, janelaPerfeita = 0.07;
    const candidatos = this.notes.filter((n) => !n.judged && this.noteTypes.get(n.type).coletavel && n.lanes.includes(this.lane));
    const alvo = candidatos.find((n) => Math.abs(this.nowBeat - n.beat) <= janelaBoa);
    if (!alvo) { this.events.push({ tipo: 'coletaVazia' }); return false; }
    alvo.judged = true;
    this.douradasOferecidas++;
    this.stats.douradasVistas++; this.stats.douradasColetadas++;
    const nota = this._notaDaMelodiaPara(alvo);
    this.melody.collect(nota, this.nowBeat);
    this.combo++;
    const perfeito = Math.abs(this.nowBeat - alvo.beat) <= janelaPerfeita;
    this.floats.push({ t: 0, text: perfeito ? 'PERFEITO!' : 'COLETADA!', col: '#ffc300', at: 'p' });
    this.events.push({ tipo: 'coleta', nota, lane: this.lane, perfeito });
    return true;
  }

  /** A nota "dourada" carrega a altura original da melodia (guardada no gráfico pela seção 3.3). */
  _notaDaMelodiaPara(evento) { return evento.nota || 'C5'; }

  _startResponseIfDue() {
    const janela = janelaDevida(this.boss.janelasDeAtaque, this.song.comprimentoBatidas, this.nowBeat, this.janelasFeitas);
    if (janela === null) return;
    this.janelasFeitas.add(janela);
    if (this.melody.tamanho === 0) {
      // Nada coletado: a janela passa sem pausar a esquiva, mas avisa o jogador.
      this.banner = { t: 0, text: 'SEM MELODIA PARA RESPONDER' };
      this.douradasOferecidas = 0;
      return;
    }
    this.responsePhase = startResponsePhase(this.melody.snapshot(), { intervaloBatidas: 1, inicioBatidas: RESPOSTA_PREPARO });
    this.responsePhase._inicioBeat = this.nowBeat;
    this.responsePhase._douradasNoTrecho = this.douradasOferecidas;
    // As notas em voo somem (viram partículas) — senão ficariam congeladas e
    // acertariam o jogador todas de uma vez quando a esquiva voltasse.
    for (const n of this.notes) if (!n.judged) { n.judged = true; this.events.push({ tipo: 'dissolver', lane: n.lanes[0], beat: n.beat }); }
    this.notes = [];
    this.jump = false; this.jt = 0; this.dive = false;
    this.banner = { t: 0, text: 'RESPOSTA!' };
    this.events.push({ tipo: 'respostaInicio' });
  }

  _respondHit() {
    const fase = this.responsePhase;
    const tempoRelativo = this.nowBeat - fase._inicioBeat;
    const r = judgeResponseHit(fase, tempoRelativo, this._janelasResposta());
    if (r) {
      this.floats.push({ t: 0, text: r.qualidade.toUpperCase(), col: r.qualidade === 'perfeito' ? '#fff' : r.qualidade === 'bom' ? '#ffc300' : '#8f88b8', at: 'p' });
      this.events.push({ tipo: 'respostaNota', nota: fase.respostas[fase.respostas.length - 1].nota, qualidade: r.qualidade });
    }
    if (fase.encerrada) this._finishResponse();
  }

  _finishResponse() {
    const fase = this.responsePhase;
    const danoBase = Math.round((60 + this.combo) * (this.amuletos.has('luva') ? 1.25 : 1));
    const resultado = finalizeResponse(fase, fase._douradasNoTrecho || 1, danoBase);
    this.bhp = Math.max(0, this.bhp - resultado.dano);
    this.stats.danoCausado += resultado.dano;
    // Inclui as notas que expiraram sem aperto (contam como erro).
    this.stats.respostaNotas += fase.respostas.length;
    this.stats.respostaPontos += resultado.precisaoMedia * fase.respostas.length;
    this.floats.push({ t: 0, text: `RESPOSTA -${resultado.dano}`, col: '#ffc300', at: 'b' });
    this.events.push({ tipo: 'respostaFim', dano: resultado.dano, fator: resultado.fatorDano });
    const provs = this.boss.falas.provocacoes || [];
    if (resultado.dano > 0 && provs.length && this.bhp > 0) this.fala = { t: 0, text: provs[Math.floor(Math.random() * provs.length)] };
    this.melody.clear();
    this.douradasOferecidas = 0;
    this.responsePhase = null;
    if (this.bhp <= 0) this._win();
  }

  /**
   * Saídas extras dos plugins de movimento (engine/notes/movements.js):
   * fantasma some no meio do caminho, ímã puxa o jogador uma pista em
   * direção à nota, gelo deixa o jogador lento se acertar, divisora se parte
   * em duas pistas no meio do caminho.
   */
  _efeitosDeMovimento(n, mov) {
    n._opacidade = mov.opacidade ?? 1;
    if (mov.puxaJogador && !n._puxou) {
      n._puxou = true;
      const alvo = n.lanes[0], dir = Math.sign(alvo - this.lane) * Math.sign(mov.puxaJogador);
      if (dir && !this.responsePhase) { this.lane = Math.min(4, Math.max(0, this.lane + dir)); this.events.push({ tipo: 'puxado', lane: this.lane }); }
    }
    if (mov.lentidaoAoAtingir) n._gelo = mov.lentidaoAoAtingir;
    if (mov.divideEm !== undefined && mov.divideEm !== null && !n._dividiu) {
      n._dividiu = true;
      const base = n.lanes[0];
      const alvos = (Array.isArray(mov.divideEm) ? mov.divideEm : [base - 1, base + 1]).map((l) => Math.min(4, Math.max(0, l)));
      n.lanes = [alvos[0]];
      if (alvos[1] !== undefined && alvos[1] !== alvos[0]) this._novasNotas.push({ ...n, lanes: [alvos[1]], _dividiu: true, zig: n.zig + 1 });
      this.events.push({ tipo: 'divide', lanes: alvos, beat: n.beat });
    }
  }

  hurt(dano, origem) {
    if (this.inv > 0 || this.over) return;
    const d = Math.round(dano * this.dmgMult() * this.tierMult());
    this.hp = Math.max(0, this.hp - d);
    this.stats.danoTomado += d;
    this.combo = 0; this.inv = 0.45;
    this.floats.push({ t: 0, text: `${origem ? origem + ' ' : ''}-${Math.min(d, 999)}`, col: '#ff2f8e', at: 'p' });
    this.events.push({ tipo: 'dano', dano: d, lane: this.lane });
    if (this.hp <= 0) this._lose();
  }

  _win() { this.over = true; this.vencedor = true; if (this.onWin) this.onWin(this); }
  _lose() {
    if (this.amuletos.has('esporo') && !this.reviveu) {
      this.reviveu = true; this.hp = Math.round(this.maxHp * 0.4); this.inv = 1.5;
      this.banner = { t: 0, text: 'O ESPORO TE LEVANTOU!' };
      this.events.push({ tipo: 'reviver' });
      return;
    }
    this.over = true; this.vencedor = false; if (this.onLose) this.onLose(this);
  }

  _janelasResposta() { return this.amuletos.has('luva') ? { boa: 0.5, perfeita: 0.16 } : { boa: 0.35, perfeita: 0.12 }; }

  /** @param nowBeat beat atual do relógio de áudio; @param dt segundos reais desde o último quadro */
  update(nowBeat, dt) {
    if (this.over) return;
    this.nowBeat = nowBeat;
    this.inv = Math.max(0, this.inv - dt);
    this.lento = Math.max(0, this.lento - dt);
    this.cooldownPista = Math.max(0, this.cooldownPista - dt);
    const volta = this._loopAtual();
    if (volta > this.ultimaVolta) {
      this.ultimaVolta = volta;
      if (this.amuletos.has('cha') && this.hp < this.maxHp) {
        const cura = Math.min(12, this.maxHp - this.hp); this.hp += cura;
        this.floats.push({ t: 0, text: `CHÁ +${cura}`, col: '#3de07a', at: 'p' });
      }
    }
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter((f) => f.t < 1);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 1.5) this.banner = null; }
    if (this.fala) { this.fala.t += dt; if (this.fala.t > 2.6) this.fala = null; }

    if (this.jump) {
      this.jt += dt * 1000 * (this.dive ? 2.2 : 1);
      if (this.jt >= JUMP_MS) { this.jump = false; this.jt = 0; this.dive = false; if (this.jbuf > 0) { this.jbuf = 0; this.doJump(); } }
    }

    this.fxState = this.effects.evaluate(this.boss.efeitosEspeciais, nowBeat, this._loopAtual());

    if (this.responsePhase) {
      expireIfMissed(this.responsePhase, nowBeat - this.responsePhase._inicioBeat, this._janelasResposta().boa);
      if (this.responsePhase.encerrada) this._finishResponse();
      return; // pausa a esquiva normal durante a fase de Resposta
    }

    this.ensureChart(nowBeat);
    this._startResponseIfDue();

    for (const n of this.notes) {
      if (n.judged) continue;
      const tipo = this.noteTypes.get(n.type);
      const mov = this.movs.apply(tipo.movimento, clamp01((nowBeat - (n.beat - n.ap)) / n.ap), n.zig);
      n._laneOffsetVisual = mov.laneOffset || 0;
      this._efeitosDeMovimento(n, mov);

      if ((n.len || 0) > 0) {
        const dano = tickLongNoteDamage(n, tipo, { lane: this.lane, jumpSafe: this.jumpSafe(), nowBeat, dtSeconds: dt });
        if (dano > 0) this.hurt(dano, tipo.nome.toUpperCase());
        const resultado = finalizeLongNote(n, nowBeat);
        if (resultado === true) this.combo++;
        continue;
      }
      if (tipo.coletavel) {
        if (nowBeat > n.beat + 0.30) {
          n.judged = true;
          this.douradasOferecidas++; // passou sem ser coletada: conta para a completude da Resposta
          this.stats.douradasVistas++;
          if (n.lanes.includes(this.lane) && !this.jumpSafe()) this.hurt(tipo.dano, 'DOURADA');
          else this.combo++;
        }
        continue;
      }
      const { damage, combo } = judgeInstantNote(n, tipo, { lane: this.lane, jumpSafe: this.jumpSafe(), nowBeat, lagBeats: 0.02 });
      if (n.judged) {
        if (damage > 0) { this.hurt(damage, tipo.nome.toUpperCase()); if (n._gelo) { this.lento = 2; this.floats.push({ t: 0, text: 'CONGELOU!', col: '#bfe9ff', at: 'p' }); } }
        else if (combo) { this.combo++; if (n.lanes.includes(this.lane)) this.events.push({ tipo: 'esquiva', lane: this.lane }); }
      }
    }
    if (this._novasNotas.length) { this.notes.push(...this._novasNotas); this._novasNotas.length = 0; }
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.notes = this.notes.filter((n) => nowBeat < n.beat + (n.len || 0) + 1.5);
  }
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
