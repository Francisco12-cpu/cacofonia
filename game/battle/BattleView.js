import * as THREE from 'three';
import { SPAN, laneX } from './Stage3D.js';

const NCOL_FALLBACK = 0xffffff;

/** Aplica os efeitos visuais (seção 3.4) ao contêiner da cena via CSS — câmera/tela, não o palco 3D em si. */
export function applyEffectsToDom(stageEl, fx, reducedFx) {
  const filt = [];
  if (fx.invert) filt.push(reducedFx ? 'brightness(0.5)' : 'invert(1)');
  if (fx.hue && !reducedFx) filt.push(`hue-rotate(${fx.hue}deg)`);
  if (fx.drop && !reducedFx && Math.floor(performance.now() / 125) % 2) filt.push('grayscale(1) contrast(1.4)');
  stageEl.style.filter = filt.join(' ') || 'none';
  stageEl.style.transform = `scale(${fx.mirror ? -1 : 1},${fx.flipY ? -1 : 1})`;
}

/**
 * Desenha um quadro da batalha: câmera (com giro/terremoto), notas (posição
 * calculada a partir do gráfico + deslocamento do plugin de movimento),
 * chefe, herói, partículas e overlay 2D (textos, apagão). Porta o `drawBattle`
 * do protótipo, lendo forma/cor dos tipos de nota em vez de um switch fixo.
 */
export class BattleView {
  constructor(stage, uiCanvas) {
    this.stage = stage;
    this.ui = uiCanvas;
    this.t = 0;
    this.kick = 0;
    this.shake = 0;
  }

  resize(w, h) { this.w = w; this.h = h; this.stage.size(w, h); }

  render(battle, noteTypes, dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt);
    const stage = this.stage, boss = battle.boss, nb = battle.nowBeat;
    const fx = battle.responsePhase ? {} : battle.fxState;
    const asp = this.w / this.h, fov = (asp < 1 ? 74 : 60);
    const tn = Math.tan((asp < 1 ? 74 : 60) * Math.PI / 360), camZ = Math.max(4.4, 3.05 / (tn * asp));
    let sx = 0, sy = 0;
    const quake = fx.quake ? 0.35 : 0, shk = quake;
    if (shk > 0) { sx = (Math.random() - 0.5) * shk; sy = (Math.random() - 0.5) * shk * 0.6; }
    stage.cam.fov = fov; stage.cam.aspect = asp; stage.cam.updateProjectionMatrix();
    const fxL = laneX(battle.vl ?? battle.lane);
    stage.cam.position.set(sx + fxL * 0.28, 1.3 + camZ * 0.33 + sy, camZ);
    stage.cam.lookAt(fxL * 0.15, 0.6, -9);
    stage.cam.rotation.z = 0;
    const roll = (fx.roll || 0) + (fx.quake ? Math.sin(this.t * 9) * 0.08 : 0);
    if (roll) stage.cam.rotateZ(roll);

    const u = SPAN / 4, b0 = Math.ceil(nb);
    stage.beatLines.forEach((m, i) => {
      const bt = b0 + i, z = -(bt - nb) * u, down = bt % 4 === 0;
      m.position.set(0, 0.012, z); m.scale.set(1, down ? 3 : 1, down ? 1.6 : 1);
      m.material.opacity = down ? 0.7 : 0.25; m.material.color.set(down ? boss.cor : '#ffffff');
      m.visible = z > -SPAN - 2;
    });
    stage.pillars.forEach((m, i) => {
      const side = i % 2 ? 1 : -1, bt = Math.ceil(nb / 2) * 2 + Math.floor(i / 2) * 2, z = -(bt - nb) * u, h = 1.2 + (i % 4) * 0.4;
      m.scale.set(1, h, 1); m.position.set(side * 3.3, h / 2, z); m.visible = z > -SPAN - 4 && z < 2;
    });
    stage.hl.position.x = laneX(battle.lane);

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
        m.position.set(laneX(laneBase), 0.4, z);
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

    const SPR = stage.SPR[boss.sprite], SPR_W = stage.SPR_W[boss.sprite];
    const bw = 7, bh = 7 * SPR.height / SPR.width;
    stage.boss.material.map = stage.bossTex[boss.id];
    stage.boss.scale.set(bw, bh, 1);
    stage.boss.position.set(Math.sin(this.t * 1.3) * 0.4, 3.4 + bh * 0.5 + Math.sin(this.t * 2) * 0.15, -SPAN - 2);

    const hx = laneX(battle.vl ?? battle.lane);
    const jp = battle.jump ? Math.min(1, battle.jt / 520) : 0;
    const lift = battle.jump ? (jp < 0.5 ? 1 - Math.pow(1 - 2 * jp, 2) : 1 - Math.pow(2 * jp - 1, 3)) : 0;
    stage.hero.material.map = (Math.floor(nb * 2) % 2) ? stage.heroTex2 : stage.heroTex;
    stage.hero.visible = !(battle.inv > 0 && Math.floor(this.t * 20) % 2);
    stage.hero.position.set(hx, 0.5 + lift * 1.3, 0.15);
    stage.shadow.position.set(hx, 0.012, 0.15);

    applyEffectsToDom(this._stageEl || (this._stageEl = document.getElementById('stage')), fx, false);
    stage.renderer.render(stage.scene, stage.cam);

    this._drawOverlay(battle, nb);
  }

  _drawOverlay(battle, nb) {
    const c = this.ui.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.w, this.h); c.imageSmoothingEnabled = false;
    c.font = "10px 'Press Start 2P', monospace"; c.textAlign = 'center'; c.textBaseline = 'top';

    if (battle.responsePhase) {
      const atual = notaAtualSafe(battle.responsePhase);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, this.h * 0.4, this.w, 60);
      c.fillStyle = '#ffc300';
      c.fillText(`RESPOSTA — nota ${battle.responsePhase.indiceAtual + 1}/${battle.responsePhase.notas.length}${atual ? ' (' + atual.nota + ')' : ''}`, this.w / 2, this.h * 0.4 + 10);
      c.fillStyle = '#fff';
      c.fillText('aperte no tempo (E / botão de coleta)', this.w / 2, this.h * 0.4 + 30);
    }

    for (const fl of battle.floats) {
      c.globalAlpha = Math.max(0, 1 - fl.t);
      const y = fl.at === 'b' ? this.h * 0.18 - fl.t * 16 : this.h * 0.75 - fl.t * 18;
      c.fillStyle = fl.col; c.fillText(fl.text, this.w / 2 + (fl.at === 'b' ? 0 : (battle.lane - 2) * 20), y);
    }
    c.globalAlpha = 1;

    if (battle.banner) {
      const a = battle.banner.t < 0.2 ? battle.banner.t / 0.2 : Math.max(0, 1 - (battle.banner.t - 0.9) / 0.6);
      c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, this.h * 0.45 - 8, this.w, 32);
      c.fillStyle = '#f5ff3d'; c.fillText(battle.banner.text, this.w / 2, this.h * 0.45);
      c.globalAlpha = 1;
    }
  }
}

function notaAtualSafe(fase) {
  return fase.indiceAtual < fase.notas.length ? fase.notas[fase.indiceAtual] : null;
}
