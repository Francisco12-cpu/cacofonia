import { buildChoreographyFromMelody } from '../../engine/battle/choreography.js';
import { judgeInstantNote, tickLongNoteDamage, finalizeLongNote } from '../../engine/battle/collision.js';
import { createMovementRegistry } from '../../engine/notes/movements.js';
import {
  createMelodyCollector, startResponsePhase, judgeResponseHit, expireIfMissed, finalizeResponse
} from '../../engine/battle/resposta.js';

const DIFICULDADE_DANO = { facil: 0.6, normal: 1, dificil: 1.5 };
const TIER_DANO = { 1: 0.8, 2: 1, 3: 1.2 };
const JUMP_MS = 520;

/**
 * Orquestra uma luta: agenda o gráfico de ataques (a partir da melodia ou de
 * um gráfico customizado do editor), julga colisões via engine/battle,
 * aplica efeitos especiais via engine/effects, roda a coleta de notas
 * douradas e a fase de Resposta (engine/battle/resposta.js). Não desenha
 * nada — isso é trabalho do Stage3D; este módulo só produz o estado que a
 * cena renderiza.
 */
export class BattleController {
  constructor({ boss, song, noteTypes, effects, chart, dificuldade = 'normal', onWin, onLose }) {
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
    this.hp = 100; this.maxHp = 100;
    this.bhp = boss.hpMax; this.bmax = boss.hpMax;
    this.over = false; this.vencedor = null;
    this.floats = []; this.banner = null;
    this.fxState = {};
    this.melody = createMelodyCollector();
    this.douradasOferecidas = 0;
    this.janelasFeitas = new Set();
    this.responsePhase = null;
    this.nowBeat = -4;
    this.APPROACH_PADRAO = 4;
    this.setChart(chart || buildChoreographyFromMelody(song, noteTypes));
  }

  /**
   * A música toca em loop indefinidamente (engine/audio/songPlayer), mas um
   * gráfico (assado ou do editor) só cobre uma volta. Repete o gráfico por
   * voltas suficientes pra cobrir as janelas de Resposta do chefe e mais uma
   * margem, em vez de a luta "esvaziar" de notas a partir da volta 2.
   */
  setChart(chart) {
    this.chart = chart;
    const L = this.song.comprimentoBatidas;
    const ultimaJanela = Math.max(0, ...this.boss.janelasDeAtaque.map((j) => j.batida));
    const voltas = Math.max(3, Math.ceil((ultimaJanela + L) / L) + 1);
    this.pending = [];
    for (let volta = 0; volta < voltas; volta++) {
      for (const c of chart) this.pending.push({ ...c, lanes: c.lanes.slice(), beat: c.beat + volta * L });
    }
    this.pending.sort((a, b) => a.beat - b.beat);
  }

  dmgMult() { return DIFICULDADE_DANO[this.dificuldade] ?? 1; }
  tierMult() { return TIER_DANO[this.boss.tier] ?? 1; }

  jumpSafe() { return this.jump && this.jt >= 50 && this.jt <= 420; }

  /** Garante que notas cujo instante de aviso já chegou estejam agendadas (`pending` -> `notes`). */
  ensureChart(nb) {
    for (const c of this.pending) {
      if (c._agendado) continue;
      const tipo = this.noteTypes.get(c.type);
      const ap = this._approachFor(tipo, c);
      if (nb < c.beat - ap - 0.05) continue;
      c._agendado = true;
      this.notes.push({
        ...c, hit: c.beat, ap, judged: false, tickTimer: 0, atingiuAoMenosUmTique: false, zig: Math.random() * 6
      });
      if (tipo.coletavel) this.douradasOferecidas++;
    }
  }

  _approachFor(tipo, evento) {
    const fx = this.effects.evaluate(this.boss.efeitosEspeciais, this.nowBeat, this._loopAtual());
    return fx.fast ? 2.6 : (tipo.avisoBatidasResolvido ?? this.APPROACH_PADRAO);
  }

  _loopAtual() { return Math.max(0, Math.floor(this.nowBeat / this.song.comprimentoBatidas)); }

  moveLane(d) {
    if (this.responsePhase || this.over) return;
    const nl = Math.min(4, Math.max(0, this.lane + d));
    if (nl === this.lane) return;
    this.lane = nl;
  }

  doJump() {
    if (this.responsePhase || this.over) return;
    if (this.jump) { this.jbuf = 0.14; return; }
    this.jump = true; this.jt = 0;
  }

  doDive() { if (this.jump) { this.jt = Math.max(this.jt, JUMP_MS * 0.78); this.dive = true; } }

  /** Uma única entrada serve para coletar douradas na luta normal E para responder na fase de Resposta. */
  doCollect() {
    if (this.over) return;
    if (this.responsePhase) { this._respondHit(); return; }
    this._tryCollectGolden();
  }

  _tryCollectGolden() {
    const spb = 1; // julgamento em batidas, não segundos, aqui
    const janelaBoa = 0.30, janelaPerfeita = 0.07;
    const candidatos = this.notes.filter((n) => !n.judged && this.noteTypes.get(n.type).coletavel && n.lanes.includes(this.lane));
    const alvo = candidatos.find((n) => Math.abs(this.nowBeat - n.beat) <= janelaBoa);
    if (!alvo) return false;
    alvo.judged = true;
    this.melody.collect(this._notaDaMelodiaPara(alvo), this.nowBeat);
    this.combo++;
    this.floats.push({ t: 0, text: Math.abs(this.nowBeat - alvo.beat) <= janelaPerfeita ? 'PERFEITO!' : 'COLETADA!', col: '#ffc300', at: 'p' });
    return true;
  }

  /** A nota "dourada" carrega a altura original da melodia (guardada no gráfico pela seção 3.3). */
  _notaDaMelodiaPara(evento) { return evento.nota || 'C5'; }

  _startResponseIfDue() {
    for (const janela of this.boss.janelasDeAtaque) {
      if (this.janelasFeitas.has(janela.batida)) continue;
      if (this.nowBeat >= janela.batida) {
        this.janelasFeitas.add(janela.batida);
        this.responsePhase = startResponsePhase(this.melody.snapshot(), { intervaloBatidas: 1 });
        this.responsePhase._inicioBeat = this.nowBeat;
        this.responsePhase._douradasNoTrecho = this.douradasOferecidas;
        this.banner = { t: 0, text: 'RESPOSTA!' };
        break;
      }
    }
  }

  _respondHit() {
    const fase = this.responsePhase;
    const tempoRelativo = this.nowBeat - fase._inicioBeat;
    const r = judgeResponseHit(fase, tempoRelativo, { boa: 0.35, perfeita: 0.12 });
    if (r) this.floats.push({ t: 0, text: r.qualidade.toUpperCase(), col: r.qualidade === 'perfeito' ? '#fff' : r.qualidade === 'bom' ? '#ffc300' : '#8f88b8', at: 'p' });
    if (fase.encerrada) this._finishResponse();
  }

  _finishResponse() {
    const fase = this.responsePhase;
    const danoBase = 60 + this.combo;
    const resultado = finalizeResponse(fase, fase._douradasNoTrecho || 1, danoBase);
    this.bhp = Math.max(0, this.bhp - resultado.dano);
    this.floats.push({ t: 0, text: `RESPOSTA -${resultado.dano}`, col: '#ffc300', at: 'b' });
    this.melody.clear();
    this.douradasOferecidas = 0;
    this.responsePhase = null;
    if (this.bhp <= 0) this._win();
  }

  hurt(dano, origem) {
    if (this.inv > 0 || this.over) return;
    const d = Math.round(dano * this.dmgMult() * this.tierMult());
    this.hp = Math.max(0, this.hp - d);
    this.combo = 0; this.inv = 0.45;
    this.floats.push({ t: 0, text: `${origem ? origem + ' ' : ''}-${Math.min(d, 999)}`, col: '#ff2f8e', at: 'p' });
    if (this.hp <= 0) this._lose();
  }

  _win() { this.over = true; this.vencedor = true; if (this.onWin) this.onWin(this); }
  _lose() { this.over = true; this.vencedor = false; if (this.onLose) this.onLose(this); }

  /** @param nowBeat beat atual do relógio de áudio; @param dt segundos reais desde o último quadro */
  update(nowBeat, dt) {
    if (this.over) return;
    this.nowBeat = nowBeat;
    this.inv = Math.max(0, this.inv - dt);
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter((f) => f.t < 1);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 1.5) this.banner = null; }

    if (this.jump) {
      this.jt += dt * 1000 * (this.dive ? 2.2 : 1);
      if (this.jt >= JUMP_MS) { this.jump = false; this.jt = 0; this.dive = false; if (this.jbuf > 0) { this.jbuf = 0; this.doJump(); } }
    }

    this.fxState = this.effects.evaluate(this.boss.efeitosEspeciais, nowBeat, this._loopAtual());

    if (this.responsePhase) {
      expireIfMissed(this.responsePhase, nowBeat - this.responsePhase._inicioBeat, 0.35);
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
          if (n.lanes.includes(this.lane) && !this.jumpSafe()) this.hurt(tipo.dano, 'DOURADA');
          else this.combo++;
        }
        continue;
      }
      const { damage, combo } = judgeInstantNote(n, tipo, { lane: this.lane, jumpSafe: this.jumpSafe(), nowBeat, lagBeats: 0.02 });
      if (n.judged) {
        if (damage > 0) this.hurt(damage, tipo.nome.toUpperCase());
        else if (combo) this.combo++;
      }
    }
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.notes = this.notes.filter((n) => nowBeat < n.beat + (n.len || 0) + 1.5);
  }
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
