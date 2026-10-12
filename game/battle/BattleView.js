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

const FONT = "'Press Start 2P', monospace";
const NI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const QUAL_COR = { perfeito: '#ffffff', bom: '#ffc300', errou: '#8f88b8' };

/** Posição diatônica (linha/espaço da pauta) de uma nota tipo "C#5" — para a mini-pauta. */
function passoNaPauta(nota) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(nota || '');
  if (!m) return 0;
  return 'CDEFGAB'.indexOf(m[1]) + (+m[3]) * 7;
}

/**
 * Desenha um quadro da batalha: câmera (com giro/terremoto), notas (posição
 * calculada a partir do gráfico + deslocamento do plugin de movimento),
 * chefe, herói, partículas e overlay 2D (textos, apagão, barra da Resposta,
 * mini-pauta). Porta o `drawBattle` do protótipo, lendo forma/cor dos tipos
 * de nota em vez de um switch fixo.
 */
export class BattleView {
  constructor(stage, uiCanvas) {
    this.stage = stage;
    this.ui = uiCanvas;
    this.t = 0;
    this.shake = 0;
    this.hurtFlash = 0;
    this.bossHit = 0;
    this.vl = 2;
    this.reducedFx = false;
  }

  resize(w, h) { this.w = w; this.h = h; this.stage.size(w, h); }

  /** Começo de uma luta nova: zera o estado puramente visual. */
  reset() { this.vl = 2; this.shake = 0; this.hurtFlash = 0; this.bossHit = 0; }

  /** Reage aos acontecimentos da luta (fila `battle.events`) com partículas, anéis e tremidas. */
  onEvent(ev, battle) {
    const st = this.stage, red = this.reducedFx;
    switch (ev.tipo) {
      case 'dano':
        this.hurtFlash = 1; if (!red) this.shake = 0.28;
        st.ring(ev.lane, 0xff2f8e, 1);
        break;
      case 'coleta':
        st.ring(ev.lane, 0xffc300, ev.perfeito ? 1.6 : 1);
        st.burstAt(laneX(ev.lane), 0.5, 0, 0xffc300, 3.2);
        break;
      case 'esquiva':
        st.ring(ev.lane, 0x2be9ff, 0.8);
        break;
      case 'dissolver':
        st.burstAt(laneX(ev.lane ?? 2), 0.4, -SPAN * 0.4, 0xffffff, 4);
        break;
      case 'respostaNota':
        st.ring(battle.lane, ev.qualidade === 'errou' ? 0x8f88b8 : 0xffc300, ev.qualidade === 'perfeito' ? 2 : 1.2);
        break;
      case 'respostaFim':
        if (ev.dano > 0) {
          this.bossHit = 1; if (!red) this.shake = 0.35;
          st.burstAt(st.boss.position.x, st.boss.position.y, st.boss.position.z, 0xffc300, 9);
        }
        break;
    }
  }

  render(battle, noteTypes, dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 3);
    this.bossHit = Math.max(0, this.bossHit - dt * 2.2);
    const stage = this.stage, boss = battle.boss, nb = battle.nowBeat;
    const fx = battle.responsePhase ? {} : battle.fxState;
    const red = this.reducedFx;
    // Pulso da batida (seção 2: "tudo pulsa com a música"): 1 no início de cada batida, decai até 0.
    const kick = nb >= 0 ? Math.pow(1 - (nb - Math.floor(nb)), 3) : 0;

    // Pista visual suavizada: o herói e a câmera deslizam até a pista lógica.
    this.vl += (battle.lane - this.vl) * Math.min(1, dt * 22);

    const asp = this.w / this.h, fov = (asp < 1 ? 74 : 60);
    const tn = Math.tan(fov * Math.PI / 360), camZ = Math.max(4.4, 3.05 / (tn * asp));
    let sx = 0, sy = 0;
    const shk = (fx.quake && !red ? 0.35 : 0) + this.shake * 0.9;
    if (shk > 0) { sx = (Math.random() - 0.5) * shk; sy = (Math.random() - 0.5) * shk * 0.6; }
    stage.cam.fov = fov; stage.cam.aspect = asp; stage.cam.updateProjectionMatrix();
    const fxL = laneX(this.vl);
    stage.cam.position.set(sx + fxL * 0.28, 1.3 + camZ * 0.33 + sy, camZ);
    stage.cam.lookAt(fxL * 0.15, 0.6, -9);
    stage.cam.rotation.z = 0;
    const roll = (red ? 0.4 : 1) * ((fx.roll || 0) + (fx.quake ? Math.sin(this.t * 9) * 0.08 : 0));
    if (roll) stage.cam.rotateZ(roll);

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

    stage.resetPools();
    for (const n of battle.notes) {
      if (n.judged && (n.len || 0) === 0) continue;
      const tipo = noteTypes.get(n.type);
      const z = -((n.beat - nb) / n.ap) * SPAN;
      if ((n.len || 0) > 0) {
        const zt = -((n.beat + n.len - nb) / n.ap) * SPAN, zh = Math.min(z, 1.5), ztt = Math.max(zt, -SPAN - 2);
        if (zh < ztt) continue;
        const m = stage.pool(tipo); m.position.set(laneX(n.lanes[0]), 0.12, (zh + ztt) / 2); m.scale.z = Math.max(0.1, zh - ztt);
        continue;
      }
      if (z < -SPAN - 2 || z > 1.8) continue;
      const laneBase = n.lanes[0] + (n._laneOffsetVisual || 0);
      const m = stage.pool(tipo);
      if (tipo.pistas >= 5) { m.position.set(0, 0.12 + 0.04 * Math.sin(this.t * 20), z); }
      else if (tipo.coletavel) {
        m.position.set(laneX(laneBase), 0.4 + Math.sin(this.t * 4 + n.beat) * 0.06, z);
        m.children[0].rotation.y = this.t * 5;
        m.children[1].material.color.setHex(n.judged ? 0x777777 : 0xffffff);
        m.children[1].rotation.set(0, 0, this.t * 2);
        const sh = stage.poolShadow(); sh.position.set(laneX(laneBase), 0.014, z);
      } else if (tipo.pistas >= 2) {
        const a = laneX(n.lanes[0]), c = laneX(n.lanes[n.lanes.length - 1]);
        m.scale.set(c - a + 1.05 * 0.9, 0.24, 0.3); m.position.set((a + c) / 2, 0.13, z);
      } else if (tipo.altura === 'alta') {
        m.position.set(laneX(laneBase), 0.68, z);
      } else {
        m.position.set(laneX(laneBase), 0.32, z); m.rotation.set(this.t * 2, this.t * 3, 0);
        const sh = stage.poolShadow(); sh.position.set(laneX(laneBase), 0.014, z);
      }
    }
    stage.hidePoolLeftovers();

    stage.rings.forEach((r) => {
      if (!r.visible) return;
      r.userData.t += dt * 2.6; const t = r.userData.t;
      if (t >= 1) { r.visible = false; return; }
      const s = (1 + t * 1.8) * (r.userData.w > 1 ? r.userData.w * 0.7 : 1);
      r.scale.set(s, s, s); r.material.opacity = 1 - t;
    });
    this._animarParticulas(dt, nb);

    const SPR = stage.SPR[boss.sprite];
    const bw = 7, bh = 7 * SPR.height / SPR.width, pulso = 1 + kick * 0.035;
    stage.boss.material.map = this.bossHit > 0 && Math.floor(this.t * 24) % 2 ? stage.bossTexW[boss.id] : stage.bossTex[boss.id];
    stage.boss.scale.set(bw * pulso, bh / pulso, 1);
    const recuo = this.bossHit * 0.8;
    stage.boss.position.set(Math.sin(this.t * 1.3) * 0.4 + (Math.random() - 0.5) * this.bossHit * 0.4, 3.4 + bh * 0.5 + Math.sin(this.t * 2) * 0.15, -SPAN - 2 - recuo);

    const hx = laneX(this.vl);
    const jp = battle.jump ? Math.min(1, battle.jt / 520) : 0;
    const lift = battle.jump ? (jp < 0.5 ? 1 - Math.pow(1 - 2 * jp, 2) : 1 - Math.pow(2 * jp - 1, 3)) : 0;
    stage.hero.material.map = (Math.floor(nb * 2) % 2) ? stage.heroTex2 : stage.heroTex;
    stage.hero.visible = !(battle.inv > 0 && Math.floor(this.t * 20) % 2);
    stage.hero.position.set(hx, 0.5 + lift * 1.3, 0.15);
    stage.shadow.position.set(hx, 0.012, 0.15);
    stage.shadow.scale.setScalar(1 - lift * 0.45);
    // Rastro (ghosts) atrás do herói enquanto ele desliza entre pistas.
    const desliza = Math.abs(battle.lane - this.vl);
    stage.ghosts.forEach((g, i) => {
      g.visible = !red && desliza > 0.08;
      if (!g.visible) return;
      g.material.map = stage.hero.material.map;
      g.position.set(laneX(this.vl + (this.vl - battle.lane) * (i + 1) * 0.35), stage.hero.position.y, 0.1 - i * 0.05);
      g.material.opacity = 0.3 - i * 0.12;
    });

    applyEffectsToDom(this._stageEl || (this._stageEl = document.getElementById('stage')), fx, red);
    stage.renderer.render(stage.scene, stage.cam);

    this._drawOverlay(battle, nb, fx);
  }

  _animarParticulas(dt, nb) {
    const stage = this.stage;
    const bu = stage.burst, ud = bu.userData;
    if (ud.t < 1) {
      ud.t = Math.min(1, ud.t + dt * 1.3);
      const a = bu.geometry.attributes.position, v = ud.vel;
      for (let i = 0; i < a.count; i++) {
        a.array[i * 3] += v[i * 3] * dt; a.array[i * 3 + 1] += v[i * 3 + 1] * dt; a.array[i * 3 + 2] += v[i * 3 + 2] * dt;
        v[i * 3 + 1] -= 9 * dt;
      }
      a.needsUpdate = true;
      bu.material.opacity = 1 - ud.t;
      bu.visible = true;
    } else bu.visible = false;

    // "Linhas de velocidade" correndo em direção à câmera, mais rápidas com o andamento.
    const sp = stage.speed.geometry.attributes.position, vel = 14 * dt;
    for (let i = 0; i < sp.count; i++) {
      sp.array[i * 3 + 2] += vel;
      if (sp.array[i * 3 + 2] > 3) sp.array[i * 3 + 2] -= SPAN * 1.4;
    }
    sp.needsUpdate = true;
  }

  _drawOverlay(battle, nb, fx) {
    const c = this.ui.getContext('2d'), W = this.w, H = this.h;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.imageSmoothingEnabled = false;
    c.textAlign = 'center'; c.textBaseline = 'top';

    if (fx.dark) this._apagao(c, battle);
    if (this.hurtFlash > 0) {
      const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(255,47,142,0)'); g.addColorStop(1, `rgba(255,47,142,${0.45 * this.hurtFlash})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }

    if (nb < 0) this._contagem(c, nb);
    if (battle.responsePhase) this._barraResposta(c, battle);
    else this._miniPauta(c, battle);
    if (battle.fala) this._balaoFala(c, battle);

    c.font = `10px ${FONT}`;
    for (const fl of battle.floats) {
      c.globalAlpha = Math.max(0, 1 - fl.t);
      const y = fl.at === 'b' ? H * 0.18 - fl.t * 16 : H * 0.75 - fl.t * 18;
      c.fillStyle = '#000'; c.fillText(fl.text, W / 2 + (fl.at === 'b' ? 0 : (battle.lane - 2) * 20) + 2, y + 2);
      c.fillStyle = fl.col; c.fillText(fl.text, W / 2 + (fl.at === 'b' ? 0 : (battle.lane - 2) * 20), y);
    }
    c.globalAlpha = 1;

    if (battle.combo >= 5) {
      c.font = `8px ${FONT}`; c.textAlign = 'right';
      c.fillStyle = battle.combo >= 30 ? '#f5ff3d' : '#2be9ff';
      c.fillText(`COMBO ×${battle.combo}`, W - 12, 64);
      c.textAlign = 'center';
    }

    if (battle.banner) {
      const a = battle.banner.t < 0.2 ? battle.banner.t / 0.2 : Math.max(0, 1 - (battle.banner.t - 0.9) / 0.6);
      const esc = 1 + Math.max(0, 0.2 - battle.banner.t) * 2;
      c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, H * 0.45 - 10, W, 36);
      c.font = `${Math.round(14 * esc)}px ${FONT}`;
      c.fillStyle = '#ff2f8e'; c.fillText(battle.banner.text, W / 2 + 2, H * 0.45);
      c.fillStyle = '#f5ff3d'; c.fillText(battle.banner.text, W / 2, H * 0.45);
      c.globalAlpha = 1;
    }
  }

  _contagem(c, nb) {
    const n = Math.ceil(-nb);
    if (n < 1 || n > 4) return;
    const f = 1 - (n + nb); // 0 -> 1 dentro da batida
    c.globalAlpha = 1 - f * 0.7;
    c.font = `${Math.round(40 + (1 - f) * 20)}px ${FONT}`;
    const txt = n === 1 ? 'JÁ!' : String(n - 1);
    c.fillStyle = '#ff2f8e'; c.fillText(txt, this.w / 2 + 3, this.h * 0.38);
    c.fillStyle = '#fff'; c.fillText(txt, this.w / 2, this.h * 0.38);
    c.globalAlpha = 1;
  }

  /** Efeito "apagão" (seção 3.4): escuridão com um foco de luz em volta do herói. */
  _apagao(c, battle) {
    const hero = this.stage.hero.position;
    const [x, y] = this.stage.toScreen(hero.x, hero.y, hero.z, this.w, this.h);
    const r = Math.min(this.w, this.h) * 0.22;
    const g = c.createRadialGradient(x, y, r * 0.35, x, y, r * 1.6);
    const max = this.reducedFx ? 0.8 : 0.96;
    g.addColorStop(0, 'rgba(3,2,8,0)'); g.addColorStop(1, `rgba(3,2,8,${max})`);
    c.fillStyle = g; c.fillRect(0, 0, this.w, this.h);
  }

  /** Mini-pauta (seção 4.1): a melodia que o jogador está construindo com as douradas. */
  _miniPauta(c, battle) {
    const notas = battle.melody.snapshot();
    const W = Math.min(220, this.w * 0.5), x0 = (this.w - W) / 2, y0 = 52, gap = 4;
    c.fillStyle = 'rgba(8,5,26,0.72)'; c.fillRect(x0 - 8, y0 - 10, W + 16, gap * 4 + 22);
    c.strokeStyle = 'rgba(143,136,184,0.6)'; c.lineWidth = 1;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x0, y0 + i * gap + 0.5); c.lineTo(x0 + W, y0 + i * gap + 0.5); c.stroke(); }
    c.font = `6px ${FONT}`; c.textAlign = 'left'; c.fillStyle = '#8f88b8';
    c.fillText(notas.length ? `MELODIA ${notas.length}` : 'COLETE DOURADAS', x0, y0 + gap * 4 + 4);
    c.textAlign = 'center';
    if (!notas.length) return;
    const visiveis = notas.slice(-16), passo = W / 17;
    const meio = passoNaPauta('B4'); // linha do meio da clave de sol
    visiveis.forEach((n, i) => {
      const off = Math.max(-6, Math.min(6, passoNaPauta(n.nota) - meio));
      const x = x0 + passo * (i + 1), y = y0 + 2 * gap - off * (gap / 2);
      const novo = i === visiveis.length - 1 && battle.nowBeat - n.beat < 0.5;
      c.fillStyle = novo ? '#fff' : '#ffc300';
      c.fillRect(Math.round(x - 2), Math.round(y - 2), 5, 4);
    });
  }

  /** Barra de tempo da Resposta (seção 4.3): cada nota coletada passa pela zona de acerto. */
  _barraResposta(c, battle) {
    const fase = battle.responsePhase, W = this.w, y = this.h * 0.62, ppb = Math.min(110, W * 0.22), cx = W / 2;
    const t = battle.nowBeat - fase._inicioBeat;
    c.fillStyle = 'rgba(5,3,14,0.82)'; c.fillRect(0, y - 34, W, 78);
    c.fillStyle = 'rgba(245,255,61,0.18)'; c.fillRect(cx - 0.35 * ppb, y - 14, 0.7 * ppb, 28);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(cx - 0.12 * ppb, y - 14, 0.24 * ppb, 28);
    c.fillStyle = '#fff'; c.fillRect(cx - 1, y - 18, 2, 36);
    c.strokeStyle = '#3b3478'; c.lineWidth = 2; c.strokeRect(0, y - 14, W, 28);

    c.font = `7px ${FONT}`;
    fase.notas.forEach((n, i) => {
      const x = cx + (n.janelaCentro - t) * ppb;
      if (x < -20 || x > W + 20) return;
      const resp = fase.respostas[i];
      const cor = resp ? QUAL_COR[resp.qualidade] : '#ffc300';
      c.globalAlpha = resp ? 0.55 : 1;
      c.fillStyle = cor;
      c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 9, y); c.lineTo(x, y + 9); c.lineTo(x - 9, y); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.fillText(n.nota, x, y + 14);
      c.globalAlpha = 1;
    });

    c.font = `8px ${FONT}`; c.fillStyle = '#ffc300';
    c.fillText(`RESPOSTA ${Math.min(fase.indiceAtual + 1, fase.notas.length)}/${fase.notas.length}`, cx, y - 28);
  }

  _balaoFala(c, battle) {
    const f = battle.fala, b = this.stage.boss.position;
    const [bx, by] = this.stage.toScreen(b.x, b.y - this.stage.boss.scale.y * 0.5, b.z, this.w, this.h);
    const txt = f.text.slice(0, Math.floor(f.t * 40));
    const a = f.t > 2.2 ? Math.max(0, 1 - (f.t - 2.2) / 0.4) : 1;
    c.font = `7px ${FONT}`;
    const largura = Math.min(this.w - 20, c.measureText(f.text).width + 20);
    const x = Math.max(10, Math.min(this.w - largura - 10, bx - largura / 2)), y = Math.max(78, by + 6);
    c.globalAlpha = a;
    c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, largura + 4, 26);
    c.fillStyle = '#f4f0ff'; c.fillRect(x, y, largura, 22);
    c.fillStyle = battle.boss.cor; c.fillRect(x, y + 20, largura, 2);
    c.fillStyle = '#0b0714'; c.textAlign = 'left'; c.fillText(txt, x + 10, y + 8);
    c.textAlign = 'center'; c.globalAlpha = 1;
  }
}
