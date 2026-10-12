import { SPAN, laneX } from './Stage3D.js';

/** Aplica os efeitos visuais (seção 3.4) ao contêiner da cena via CSS — câmera/tela, não o palco 3D em si. */
export function applyEffectsToDom(stageEl, fx, reducedFx) {
  const filt = [];
  if (fx.invert) filt.push(reducedFx ? 'brightness(0.5)' : 'invert(1)');
  if (fx.hue && !reducedFx) filt.push(`hue-rotate(${fx.hue}deg)`);
  if (fx.drop && !reducedFx && Math.floor(performance.now() / 125) % 2) filt.push('grayscale(1) contrast(1.4)');
  stageEl.style.filter = filt.join(' ') || 'none';
  stageEl.style.transform = `scale(${fx.mirror ? -1 : 1},${fx.flipY ? -1 : 1})`;
}

const FONT = "8px 'Press Start 2P', monospace";
const QUAL_COR = { perfeito: '#ffffff', bom: '#ffc300', errou: '#8f88b8' };

/** Posição diatônica (linha/espaço da pauta) de uma nota tipo "C#5" — para a mini-pauta. */
function passoNaPauta(nota) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(nota || '');
  if (!m) return 0;
  return 'CDEFGAB'.indexOf(m[1]) + (+m[3]) * 7;
}

/** Texto com sombra de 1px (estilo 8-bit). */
function texto(c, s, x, y, cor, sombra = '#000') {
  c.fillStyle = sombra; c.fillText(s, x + 1, y + 1);
  c.fillStyle = cor; c.fillText(s, x, y);
}

/**
 * Desenha um quadro da batalha. A cena 3D e o overlay 2D são desenhados na
 * mesma resolução baixa (Stage3D.size) e ampliados sem filtro, então texto,
 * barras e sprites ficam todos na mesma grade de pixels.
 */
export class BattleView {
  constructor(stage, uiCanvas) {
    this.stage = stage;
    this.ui = uiCanvas;
    this.t = 0;
    this.reset();
    this.reducedFx = false;
  }

  resize(w, h) {
    this.stage.size(w, h);
    this.w = this.stage.iw; this.h = this.stage.ih;
    this.ui.width = this.w; this.ui.height = this.h;
  }

  /** Começo de uma luta nova: zera o estado puramente visual. */
  reset() {
    this.vl = 2; this.shake = 0; this.hurtFlash = 0; this.bossHit = 0; this.bossAtk = 0; this.heroDor = 0;
    this.fim = null; this.flash = 0; this.ultimaBatida = -99;
  }

  /** Início da sequência final (chefe derrotado / herói caído). */
  comecarFim(venceu) {
    this.fim = { venceu, t: 0 };
    const b = this.stage.boss.position;
    if (venceu) { this.flash = 1; for (let i = 0; i < 3; i++) this.stage.burstAt(b.x, b.y, b.z, [0xffc300, 0xffffff, 0xff2f8e][i], 8 + i * 3); }
  }

  /** Reage aos acontecimentos da luta (fila `battle.events`) com partículas, anéis e tremidas. */
  onEvent(ev, battle) {
    const st = this.stage, red = this.reducedFx;
    switch (ev.tipo) {
      case 'dano':
        this.hurtFlash = 1; this.heroDor = 0.45; if (!red) this.shake = 0.28;
        st.ring(ev.lane, 0xff2f8e, 1);
        st.burstAt(laneX(ev.lane), 0.6, 0.1, 0xff2f8e, 3);
        break;
      case 'coleta':
        st.ring(ev.lane, 0xffc300, ev.perfeito ? 1.6 : 1);
        st.burstAt(laneX(ev.lane), 0.5, 0, 0xffc300, ev.perfeito ? 4.5 : 3.2);
        break;
      case 'esquiva':
        st.ring(ev.lane, 0x2be9ff, 0.8);
        break;
      case 'dissolver':
        st.burstAt(laneX(ev.lane ?? 2), 0.4, -SPAN * 0.4, 0xffffff, 4);
        break;
      case 'respostaInicio':
        this.flash = 0.6;
        break;
      case 'respostaNota':
        st.ring(battle.lane, ev.qualidade === 'errou' ? 0x8f88b8 : 0xffc300, ev.qualidade === 'perfeito' ? 2 : 1.2);
        if (ev.qualidade !== 'errou') st.burstAt(laneX(battle.lane), 1.2, -1, 0xffc300, 3);
        break;
      case 'respostaFim':
        if (ev.dano > 0) {
          this.bossHit = 1; if (!red) this.shake = 0.35;
          st.burstAt(st.boss.position.x, st.boss.position.y, st.boss.position.z, 0xffc300, 9);
        }
        break;
      case 'ataque':
        this.bossAtk = 0.3;
        break;
    }
  }

  render(battle, noteTypes, dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 3);
    this.bossHit = Math.max(0, this.bossHit - dt * 1.6);
    this.bossAtk = Math.max(0, this.bossAtk - dt);
    this.heroDor = Math.max(0, this.heroDor - dt);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    if (this.fim) this.fim.t += dt;
    const stage = this.stage, boss = battle.boss, nb = battle.nowBeat;
    const fx = battle.responsePhase || this.fim ? {} : battle.fxState;
    const red = this.reducedFx;
    // Pulso da batida (seção 2: "tudo pulsa com a música"): 1 no início de cada batida, decai até 0.
    const kick = nb >= 0 && !this.fim ? Math.pow(1 - (nb - Math.floor(nb)), 3) : 0;
    const batida = Math.floor(nb);
    if (batida !== this.ultimaBatida) { this.ultimaBatida = batida; stage.pintarTorre(batida % 2 ? 1 : 0); if (batida >= 0 && batida % 4 === 0) this.bossAtk = Math.max(this.bossAtk, 0.18); }

    // Pista visual suavizada: o herói e a câmera deslizam até a pista lógica.
    this.vl += (battle.lane - this.vl) * Math.min(1, dt * 22);

    const asp = this.w / this.h, fov = (asp < 1 ? 74 : 60);
    const tn = Math.tan(fov * Math.PI / 360), camZ = Math.max(4.4, 3.05 / (tn * asp));
    let sx = 0, sy = 0;
    const shk = (fx.quake && !red ? 0.35 : 0) + this.shake * 0.9 + (this.fim && this.fim.venceu && this.fim.t < 1.2 && !red ? 0.25 : 0);
    if (shk > 0) { sx = (Math.random() - 0.5) * shk; sy = (Math.random() - 0.5) * shk * 0.6; }
    stage.cam.fov = fov; stage.cam.aspect = asp; stage.cam.updateProjectionMatrix();
    const fxL = laneX(this.vl), camX = sx + fxL * 0.28;
    stage.cam.position.set(camX, 1.3 + camZ * 0.33 + sy, camZ);
    stage.cam.lookAt(fxL * 0.15, 0.6, -9);
    stage.cam.rotation.z = 0;
    const roll = (red ? 0.4 : 1) * ((fx.roll || 0) + (fx.quake ? Math.sin(this.t * 9) * 0.08 : 0));
    if (roll) stage.cam.rotateZ(roll);

    stage.animarCenario(this.t, kick, camX);
    // O piso corre na velocidade da música (uma "casa" de textura por batida).
    stage.pisoTex.offset.y = (nb * (SPAN / 4) / 1.05) % 1;

    const u = SPAN / 4, b0 = Math.ceil(nb);
    stage.beatLines.forEach((m, i) => {
      const bt = b0 + i, z = -(bt - nb) * u, down = bt % 4 === 0;
      m.position.set(0, 0.012, z); m.scale.set(1, down ? 3 : 1, down ? 1.6 : 1);
      m.material.opacity = down ? 0.7 : 0.25; m.material.color.set(down ? boss.cor : '#ffffff');
      m.visible = z > -SPAN - 2;
    });
    stage.pillars.forEach((m, i) => {
      const side = i % 2 ? 1 : -1, bt = Math.ceil(nb / 2) * 2 + Math.floor(i / 2) * 2, z = -(bt - nb) * u, h = (1.2 + (i % 4) * 0.4) * (1 + kick * 0.18);
      m.scale.set(1, h, 1); m.position.set(side * 3.3, h / 2, z); m.visible = z > -SPAN - 4 && z < 2;
    });
    stage.edgeMat.color.set(boss.cor).lerp(stage.white, kick * 0.6);
    stage.hl.position.x = laneX(this.vl);
    stage.hl.material.opacity = 0.08 + kick * 0.1;

    this._notas(battle, noteTypes, nb);
    this._aneis(dt);
    this._animarParticulas(dt);
    this._chefe(battle, kick);
    this._heroi(battle, nb, red);

    applyEffectsToDom(this._stageEl || (this._stageEl = document.getElementById('stage')), fx, red);
    stage.renderer.render(stage.scene, stage.cam);

    this._drawOverlay(battle, nb, fx);
  }

  _notas(battle, noteTypes, nb) {
    const stage = this.stage;
    stage.resetPools();
    const quadroMoeda = Math.floor(this.t * 8) % 4;
    for (const n of battle.notes) {
      if (n.judged && (n.len || 0) === 0) continue;
      const tipo = noteTypes.get(n.type);
      const z = -((n.beat - nb) / n.ap) * SPAN;
      if ((n.len || 0) > 0) {
        const zt = -((n.beat + n.len - nb) / n.ap) * SPAN, zh = Math.min(z, 1.5), ztt = Math.max(zt, -SPAN - 2);
        if (zh < ztt) continue;
        const m = stage.pool(tipo); m.position.set(laneX(n.lanes[0]), 0.1, (zh + ztt) / 2); m.scale.z = Math.max(0.1, zh - ztt);
        m.material.map.repeat.set(1, Math.max(1, (zh - ztt) * 1.5));
        continue;
      }
      if (z < -SPAN - 2 || z > 1.8) continue;
      const laneBase = n.lanes[0] + (n._laneOffsetVisual || 0);
      const m = stage.pool(tipo);
      const opac = n._opacidade ?? 1;
      if (m.material.opacity !== undefined) { m.material.opacity = opac; m.material.transparent = true; }
      if (tipo.pistas >= 5) { m.position.set(0, 0.12 + 0.04 * Math.sin(this.t * 20), z); m.material.map.repeat.set(5, 1); }
      else if (tipo.coletavel) {
        m.position.set(laneX(laneBase), 0.45 + Math.sin(this.t * 4 + n.beat) * 0.06, z);
        m.material.map = stage.noteTex(tipo, quadroMoeda);
        const sh = stage.poolShadow(); sh.position.set(laneX(laneBase), 0.014, z);
      } else if (tipo.pistas >= 2) {
        const a = laneX(n.lanes[0]), c = laneX(n.lanes[n.lanes.length - 1]);
        m.scale.set(c - a + 1.05 * 0.9, 0.24, 0.3); m.position.set((a + c) / 2, 0.13, z);
        m.material.map.repeat.set(n.lanes.length, 1);
      } else if (tipo.altura === 'alta') {
        m.position.set(laneX(laneBase), 0.66, z);
      } else {
        m.position.set(laneX(laneBase), 0.34 + Math.abs(Math.sin(this.t * 6 + n.beat * 3)) * 0.06, z);
        const sh = stage.poolShadow(); sh.position.set(laneX(laneBase), 0.014, z);
      }
    }
    stage.hidePoolLeftovers();
  }

  _aneis(dt) {
    for (const r of this.stage.rings) {
      if (!r.visible) continue;
      r.userData.t += dt * 2.6; const t = r.userData.t;
      if (t >= 1) { r.visible = false; continue; }
      const s = (1 + t * 1.8) * (r.userData.w > 1 ? r.userData.w * 0.7 : 1);
      r.scale.set(s, s, s); r.material.opacity = 1 - t;
    }
  }

  _animarParticulas(dt) {
    const stage = this.stage;
    for (const bu of stage.bursts) {
      const ud = bu.userData;
      if (ud.t >= 1) { bu.visible = false; continue; }
      ud.t = Math.min(1, ud.t + dt * 1.3);
      const a = bu.geometry.attributes.position, v = ud.vel;
      for (let i = 0; i < a.count; i++) {
        a.array[i * 3] += v[i * 3] * dt; a.array[i * 3 + 1] += v[i * 3 + 1] * dt; a.array[i * 3 + 2] += v[i * 3 + 2] * dt;
        v[i * 3 + 1] -= 9 * dt;
      }
      a.needsUpdate = true;
      bu.material.opacity = 1 - ud.t * ud.t;
    }
    // "Linhas de velocidade" correndo em direção à câmera.
    const sp = stage.speed.geometry.attributes.position, vel = (this.fim ? 3 : 14) * dt;
    for (let i = 0; i < sp.count; i++) {
      sp.array[i * 3 + 2] += vel;
      if (sp.array[i * 3 + 2] > 3) sp.array[i * 3 + 2] -= SPAN * 1.4;
    }
    sp.needsUpdate = true;
  }

  /** Chefe: respira no ritmo, ataca no começo de cada compasso, encolhe quando a Resposta acerta e cai no fim. */
  _chefe(battle, kick) {
    const stage = this.stage, boss = battle.boss, id = boss.sprite;
    let frame = Math.floor(Math.max(0, battle.nowBeat)) % 2 ? 'respira' : 'base', opts = {};
    if (this.bossAtk > 0) frame = 'atk';
    if (this.bossHit > 0) { frame = 'hurt'; if (Math.floor(this.t * 20) % 2 && this.bossHit > 0.5) opts = { tint: '#ffffff' }; }
    let afunda = 0, alpha = 1;
    if (this.fim && this.fim.venceu) {
      frame = 'hurt'; const t = this.fim.t;
      opts = t < 0.8 && Math.floor(t * 16) % 2 ? { tint: '#ffffff' } : { gray: Math.min(0.9, t * 0.8) };
      afunda = Math.max(0, t - 0.6) * 2.2; alpha = Math.max(0, 1 - Math.max(0, t - 1.1) * 1.6);
      if (Math.floor(t * 6) !== Math.floor((t - 0.016) * 6) && t < 1.4) stage.burstAt(stage.boss.position.x + (Math.random() - 0.5) * 4, stage.boss.position.y + (Math.random() - 0.5) * 3, stage.boss.position.z + 1, [0xffc300, 0xff2f8e, 0xffffff][Math.floor(Math.random() * 3)], 6);
    } else if (this.fim) frame = 'atk';
    stage.boss.material.map = stage.spriteTex(id, frame, opts);
    stage.boss.material.opacity = alpha;
    const img = stage.boss.material.map.image;
    const bw = 6, bh = bw * img.height / img.width, pulso = 1 + kick * 0.035, enc = 1 - this.bossHit * 0.12;
    stage.boss.scale.set(bw * pulso * enc, (bh / pulso) * enc, 1);
    const recuo = this.bossHit * 0.8;
    stage.boss.position.set(Math.sin(this.t * 1.3) * 0.4 + (Math.random() - 0.5) * this.bossHit * 0.4, 3.2 + bh * 0.5 + Math.sin(this.t * 2) * 0.15 - afunda, -SPAN - 2 - recuo);
  }

  _heroi(battle, nb, red) {
    const stage = this.stage;
    const hx = laneX(this.vl);
    const jp = battle.jump ? Math.min(1, battle.jt / 520) : 0;
    const lift = battle.jump ? (jp < 0.5 ? 1 - Math.pow(1 - 2 * jp, 2) : 1 - Math.pow(2 * jp - 1, 3)) : 0;
    let frame = Math.floor(nb * 2) % 2 ? 'passo' : 'base', opts = {};
    if (battle.jump) frame = 'pulo';
    if (battle.responsePhase) frame = Math.floor(nb * 2) % 2 ? 'toca' : 'base';
    if (this.heroDor > 0) { frame = 'dor'; if (Math.floor(this.t * 16) % 2) opts = { tint: '#ff2f8e' }; }
    if (battle.lento > 0 && !opts.tint) opts = { gray: 0.5 };
    let cai = 0;
    if (this.fim && !this.fim.venceu) { frame = 'dor'; opts = { gray: Math.min(0.8, this.fim.t) }; cai = Math.min(0.35, this.fim.t * 0.5); }
    stage.hero.material.map = stage.spriteTex('eco_costas', frame, opts);
    stage.hero.scale.set(1.05, 1.05 * 28 / 26, 1);
    stage.hero.visible = !(battle.inv > 0 && this.heroDor <= 0 && Math.floor(this.t * 20) % 2);
    stage.hero.position.set(hx, 0.56 + lift * 1.3 - cai, 0.15);
    stage.shadow.position.set(hx, 0.012, 0.15);
    stage.shadow.scale.setScalar(1 - lift * 0.45);
    // Rastro atrás do herói enquanto ele desliza entre pistas.
    const desliza = Math.abs(battle.lane - this.vl);
    stage.ghosts.forEach((g, i) => {
      g.visible = !red && desliza > 0.08;
      if (!g.visible) return;
      g.material.map = stage.hero.material.map;
      g.scale.copy(stage.hero.scale);
      g.position.set(laneX(this.vl + (this.vl - battle.lane) * (i + 1) * 0.35), stage.hero.position.y, 0.1 - i * 0.05);
      g.material.opacity = 0.3 - i * 0.12;
    });
  }

  _drawOverlay(battle, nb, fx) {
    const c = this.ui.getContext('2d'), W = this.w, H = this.h;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.imageSmoothingEnabled = false;
    c.font = FONT; c.textAlign = 'center'; c.textBaseline = 'top';

    if (fx.dark) this._apagao(c);
    if (this.hurtFlash > 0) {
      c.globalAlpha = 0.5 * this.hurtFlash; c.fillStyle = '#ff2f8e';
      const b = 6; c.fillRect(0, 0, W, b); c.fillRect(0, H - b, W, b); c.fillRect(0, 0, b, H); c.fillRect(W - b, 0, b, H);
      c.globalAlpha = 1;
    }
    if (this.flash > 0) { c.globalAlpha = this.flash * (this.reducedFx ? 0.3 : 0.7); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    if (this.fim) return;

    if (nb < 0) this._contagem(c, nb);
    if (battle.responsePhase) this._barraResposta(c, battle);
    else this._miniPauta(c, battle);
    if (battle.fala) this._balaoFala(c, battle);

    for (const fl of battle.floats) {
      c.globalAlpha = Math.max(0, 1 - fl.t);
      const y = Math.round(fl.at === 'b' ? H * 0.2 - fl.t * 8 : H * 0.7 - fl.t * 10);
      texto(c, fl.text, Math.round(W / 2 + (fl.at === 'b' ? 0 : (battle.lane - 2) * 14)), y, fl.col);
    }
    c.globalAlpha = 1;

    if (battle.combo >= 5) {
      c.textAlign = 'right';
      const pul = battle.combo % 10 === 0 ? 1 : 0;
      texto(c, `x${battle.combo}`, W - 6, 34 - pul, battle.combo >= 30 ? '#f5ff3d' : '#2be9ff');
      c.textAlign = 'center';
    }

    if (battle.banner) {
      const a = battle.banner.t < 0.15 ? battle.banner.t / 0.15 : Math.max(0, 1 - (battle.banner.t - 0.9) / 0.6);
      const y = Math.round(H * 0.42), entra = Math.round(Math.max(0, 0.15 - battle.banner.t) * W * 4);
      c.globalAlpha = a; c.fillStyle = '#0b0714'; c.fillRect(0, y - 6, W, 20);
      c.fillStyle = '#ff2f8e'; c.fillRect(0, y - 6, W, 1); c.fillRect(0, y + 13, W, 1);
      texto(c, battle.banner.text, W / 2 - entra, y, '#f5ff3d', '#ff2f8e');
      c.globalAlpha = 1;
    }
  }

  _contagem(c, nb) {
    const n = Math.ceil(-nb);
    if (n < 1 || n > 4) return;
    const f = 1 - (n + nb);
    const txt = n === 1 ? 'JÁ!' : String(n - 1);
    c.save();
    const esc = 3 + Math.round((1 - f) * 2);
    c.translate(Math.round(this.w / 2), Math.round(this.h * 0.58)); c.scale(esc, esc);
    c.globalAlpha = 1 - f * 0.7;
    texto(c, txt, 0, -4, '#fff', '#ff2f8e');
    c.restore();
  }

  /** Efeito "apagão" (seção 3.4): escuridão com um foco de luz em volta do herói. */
  _apagao(c) {
    const hero = this.stage.hero.position;
    const [x, y] = this.stage.toScreen(hero.x, hero.y, hero.z, this.w, this.h);
    const r = Math.min(this.w, this.h) * 0.22, max = this.reducedFx ? 0.8 : 0.96;
    // Escuridão em anéis de pixel (sem degradê suave, pra manter o visual 8-bit).
    for (let k = 3; k >= 0; k--) {
      c.globalAlpha = max * (k + 1) / 4;
      c.fillStyle = '#030208';
      c.beginPath(); c.rect(0, 0, this.w, this.h); c.arc(x, y, r * (0.6 + k * 0.35), 0, Math.PI * 2, true); c.fill();
    }
    c.globalAlpha = 1;
  }

  /** Mini-pauta (seção 4.1): a melodia que o jogador está construindo com as douradas. */
  _miniPauta(c, battle) {
    const notas = battle.melody.snapshot();
    const W = Math.min(96, this.w * 0.4), x0 = 8, y0 = Math.round(this.h * 0.2), gap = 3;
    c.fillStyle = 'rgba(8,5,26,0.8)'; c.fillRect(x0 - 4, y0 - 4, W + 8, gap * 4 + 16);
    c.fillStyle = '#3b3478'; c.fillRect(x0 - 4, y0 - 4, W + 8, 1); c.fillRect(x0 - 4, y0 + gap * 4 + 11, W + 8, 1);
    c.fillStyle = 'rgba(143,136,184,0.55)';
    for (let i = 0; i < 5; i++) c.fillRect(x0, y0 + i * gap, W, 1);
    c.textAlign = 'left';
    texto(c, notas.length ? `♪${notas.length}` : '♪ DOURADAS', x0, y0 + gap * 4 + 3, notas.length ? '#ffc300' : '#8f88b8');
    c.textAlign = 'center';
    if (!notas.length) return;
    const visiveis = notas.slice(-12), passo = W / 13, meio = passoNaPauta('B4');
    visiveis.forEach((n, i) => {
      const off = Math.max(-5, Math.min(5, passoNaPauta(n.nota) - meio));
      const x = Math.round(x0 + passo * (i + 1)), y = Math.round(y0 + 2 * gap - off * (gap / 2));
      const novo = i === visiveis.length - 1 && battle.nowBeat - n.beat < 0.5;
      c.fillStyle = novo ? '#fff' : '#ffc300';
      c.fillRect(x - 1, y - 1, 3, 2); c.fillRect(x + 1, y - 5, 1, 5);
    });
  }

  /** Barra de tempo da Resposta (seção 4.3): cada nota coletada passa pela zona de acerto. */
  _barraResposta(c, battle) {
    const fase = battle.responsePhase, W = this.w, y = Math.round(this.h * 0.6), ppb = Math.round(Math.min(56, W * 0.2)), cx = Math.round(W / 2);
    const t = battle.nowBeat - fase._inicioBeat;
    c.fillStyle = 'rgba(5,3,14,0.85)'; c.fillRect(0, y - 20, W, 44);
    c.fillStyle = '#3b3478'; c.fillRect(0, y - 9, W, 1); c.fillRect(0, y + 9, W, 1);
    c.fillStyle = 'rgba(245,255,61,0.2)'; c.fillRect(cx - Math.round(0.35 * ppb), y - 8, Math.round(0.7 * ppb), 17);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(cx - Math.round(0.12 * ppb), y - 8, Math.round(0.24 * ppb), 17);
    c.fillStyle = '#fff'; c.fillRect(cx, y - 11, 1, 23);

    fase.notas.forEach((n, i) => {
      const x = Math.round(cx + (n.janelaCentro - t) * ppb);
      if (x < -10 || x > W + 10) return;
      const resp = fase.respostas[i];
      c.globalAlpha = resp ? 0.5 : 1;
      c.fillStyle = '#000';
      for (let k = -6; k <= 6; k++) c.fillRect(x - (6 - Math.abs(k)) - 1, y + k, (6 - Math.abs(k)) * 2 + 3, 1);
      c.fillStyle = resp ? QUAL_COR[resp.qualidade] : '#ffc300';
      for (let k = -5; k <= 5; k++) c.fillRect(x - (5 - Math.abs(k)), y + k, (5 - Math.abs(k)) * 2 + 1, 1);
      c.fillStyle = '#fff'; c.fillRect(x - 2, y - 3, 2, 1);
      c.globalAlpha = 1;
    });
    texto(c, `RESPOSTA ${Math.min(fase.indiceAtual + 1, fase.notas.length)}/${fase.notas.length}`, cx, y - 18, '#ffc300');
    const atual = fase.notas[fase.indiceAtual];
    if (atual) texto(c, atual.nota, cx, y + 13, '#fff');
  }

  _balaoFala(c, battle) {
    const f = battle.fala, b = this.stage.boss.position;
    const [bx, by] = this.stage.toScreen(b.x, b.y - this.stage.boss.scale.y * 0.5, b.z, this.w, this.h);
    const txt = f.text.slice(0, Math.floor(f.t * 30));
    const a = f.t > 2.2 ? Math.max(0, 1 - (f.t - 2.2) / 0.4) : 1;
    const largura = Math.min(this.w - 8, Math.ceil(c.measureText(f.text).width) + 12);
    const x = Math.round(Math.max(4, Math.min(this.w - largura - 4, bx - largura / 2))), y = Math.round(Math.max(48, by + 4));
    c.globalAlpha = a;
    c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, largura + 2, 18);
    c.fillStyle = '#f4f0ff'; c.fillRect(x, y, largura, 16);
    c.fillStyle = battle.boss.cor; c.fillRect(x, y + 14, largura, 2);
    c.fillStyle = '#f4f0ff'; c.fillRect(Math.round(bx) - 2, y - 3, 5, 3); c.fillRect(Math.round(bx) - 1, y - 5, 3, 2);
    c.textAlign = 'left'; c.fillStyle = '#0b0714'; c.fillText(txt, x + 6, y + 4);
    c.textAlign = 'center'; c.globalAlpha = 1;
  }
}

