import * as THREE from 'three';
import { sprite } from '../../engine/render2d/sprites.js';
import { noteIcon, faisca } from '../../engine/render2d/noteArt.js';
import { PALETTE, ramp, snapToPalette } from '../../engine/render2d/palette.js';
import { cenario, CAMADAS } from './backdrops.js';

export const SPAN = 22, LANES = 5, LW = 1.05;
export const laneX = (l) => (l - 2) * LW;

/** Altura-alvo da imagem em pixels "de jogo": a cena 3D é desenhada nessa resolução e ampliada sem filtro, pra combinar com os sprites. */
const ALTURA_PIXEL = 240;

function tex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function canvasDe({ w, h, data }) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0);
  return c;
}

/** Ladrilho do piso da pista: faixas por pista, com o tom do chefe. */
function pisoCanvas(cor) {
  const R = ramp(snapToPalette(cor));
  const c = document.createElement('canvas'); c.width = 80; c.height = 16;
  const x = c.getContext('2d');
  x.fillStyle = '#07050f'; x.fillRect(0, 0, 80, 16);
  for (let l = 0; l < 5; l++) {
    x.fillStyle = l % 2 ? '#0c0819' : '#0a0716'; x.fillRect(l * 16 + 1, 0, 14, 16);
    x.fillStyle = '#140e28'; x.fillRect(l * 16 + 1, 0, 14, 1);
    x.fillStyle = R.funda; x.fillRect(l * 16 + 7, 8, 2, 1);
  }
  x.fillStyle = R.sombra; for (let l = 0; l <= 5; l++) x.fillRect(Math.min(79, l * 16), 0, 1, 16);
  return c;
}

/** Palco 3D da batalha (Three.js) com cenário, notas, chefe e herói em pixel art. */
export class Stage3D {
  constructor(glCanvas) {
    const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(62, 1, 0.1, 160);
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(3, 6, 4); scene.add(dl);

    const zc = -SPAN / 2 + 1;
    const pisoTex = tex(pisoCanvas('#ff2f8e'));
    pisoTex.wrapS = pisoTex.wrapT = THREE.RepeatWrapping;
    pisoTex.repeat.set(1, (SPAN + 10) / 1.05);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(5.25, SPAN + 10), new THREE.MeshBasicMaterial({ map: pisoTex }));
    floor.rotation.x = -Math.PI / 2; floor.position.z = zc - 1; scene.add(floor);

    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xff2f8e });
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, SPAN + 10), edgeMat);
      e.position.set(sx * 2.68, 0.05, zc - 1); scene.add(e);
    }
    const linhaJulg = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.03, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    linhaJulg.position.y = 0.01; scene.add(linhaJulg);
    const hl = new THREE.Mesh(new THREE.PlaneGeometry(LW * 0.96, 7), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false }));
    hl.rotation.x = -Math.PI / 2; hl.position.set(0, 0.004, -3.3); scene.add(hl);

    const beatLines = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(5.25, 0.012, 0.07), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
      scene.add(m); beatLines.push(m);
    }
    // Colunas laterais em pixel art: torres com janelinhas que acendem no ritmo.
    const torreCv = document.createElement('canvas'); torreCv.width = 8; torreCv.height = 16;
    const torreTex = tex(torreCv);
    const pillarMat = new THREE.MeshBasicMaterial({ map: torreTex });
    const pillars = [];
    for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1, 0.42), pillarMat); scene.add(m); pillars.push(m); }

    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false });
    const disco = new THREE.CircleGeometry(0.26, 8);
    const notesGroup = new THREE.Group(); scene.add(notesGroup);

    const boss = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, fog: false, alphaTest: 0.5 })); scene.add(boss);
    const hero = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, fog: false, alphaTest: 0.5 })); scene.add(hero);
    const ghosts = [0, 1].map(() => {
      const g = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: 0.3, fog: false, color: 0x8fffff, depthWrite: false }));
      g.visible = false; scene.add(g); return g;
    });

    const faiscaTex = tex(canvasDe(faisca()));
    const spN = 70, spPos = new Float32Array(spN * 3);
    for (let i = 0; i < spN; i++) { spPos[i * 3] = (Math.random() < 0.5 ? -1 : 1) * (3.2 + Math.random() * 4); spPos[i * 3 + 1] = Math.random() * 4; spPos[i * 3 + 2] = -Math.random() * SPAN * 1.4; }
    const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
    const speed = new THREE.Points(spGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.55, map: faiscaTex, alphaTest: 0.5 })); scene.add(speed);

    // Explosões de faíscas: várias ao mesmo tempo (antes só existia uma, e uma apagava a outra).
    const bursts = [];
    for (let k = 0; k < 6; k++) {
      const n = 28, geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, transparent: true, map: faiscaTex, alphaTest: 0.3, depthWrite: false }));
      pts.userData = { t: 1, vel: new Float32Array(n * 3) }; pts.visible = false; scene.add(pts); bursts.push(pts);
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 10), shadowMat.clone());
    shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
    const rings = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.visible = false; m.userData = { t: 1 }; scene.add(m); rings.push(m);
    }

    Object.assign(this, {
      renderer, scene, cam, floor, pisoTex, edgeMat, torreCv, torreTex, hl, beatLines, pillars, notesGroup, boss, hero, ghosts,
      speed, bursts, shadow, shadowMat, disco, rings, pools: {}, texCache: new Map(), noteTexCache: new Map(), camadas: [],
      white: new THREE.Color(0xffffff), iw: 1, ih: 1, escala: 1
    });
  }

  /** Ajusta a resolução interna (baixa) mantendo o aspecto da tela. */
  size(w, h) {
    this.escala = Math.max(2, Math.floor(Math.min(h, w * 0.75) / ALTURA_PIXEL));
    this.iw = Math.max(1, Math.ceil(w / this.escala)); this.ih = Math.max(1, Math.ceil(h / this.escala));
    this.renderer.setSize(this.iw, this.ih, false);
  }

  /** Textura (com cache) de um quadro de sprite. */
  spriteTex(id, frame = 'base', opts = {}) {
    const k = `${id}|${frame}|${opts.tint || ''}|${opts.gray || 0}`;
    if (!this.texCache.has(k)) this.texCache.set(k, tex(sprite(id, frame, opts)));
    return this.texCache.get(k);
  }

  noteTex(tipo, quadro = 0) {
    const k = `${tipo.id}|${quadro}`;
    if (!this.noteTexCache.has(k)) {
      const t = tex(canvasDe(noteIcon(tipo, quadro)));
      if (tipo.pistas >= 2 || tipo.forma === 'placa' || tipo.duracaoVariavel) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
      this.noteTexCache.set(k, t);
    }
    return this.noteTexCache.get(k);
  }

  /** Um objeto por nota, reaproveitado em pool (evita criar/destruir geometria todo quadro). */
  pool(noteType) {
    const p = this.pools[noteType.id] || (this.pools[noteType.id] = { list: [], i: 0 });
    if (p.i < p.list.length) { const m = p.list[p.i++]; m.visible = true; return m; }
    let m;
    const placa = noteType.pistas >= 2 || noteType.forma === 'placa' || noteType.duracaoVariavel;
    if (placa) {
      const map = this.noteTex(noteType).clone(); map.needsUpdate = true;
      m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ map, emissive: new THREE.Color(snapToPalette(noteType.cor)), emissiveIntensity: 0.25 }));
      if (noteType.pistas >= 5) m.scale.set(5.25, 0.22, 0.32);
      else if (noteType.duracaoVariavel) m.scale.set(0.6, 0.18, 1);
      m.userData.placa = true;
    } else {
      m = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.noteTex(noteType), transparent: true, alphaTest: 0.5 }));
      if (noteType.coletavel) m.scale.set(0.62, 0.62, 1);
      else if (noteType.forma === 'prisma' && noteType.altura === 'alta') m.scale.set(0.95, 1.3, 1);
      else if (noteType.forma === 'losango') m.scale.set(0.6, 0.68, 1);
      else m.scale.set(0.6, 0.6, 1);
    }
    this.notesGroup.add(m); p.list.push(m); p.i++; return m;
  }

  poolShadow() {
    const p = this.pools.__shadow || (this.pools.__shadow = { list: [], i: 0 });
    if (p.i < p.list.length) { const m = p.list[p.i++]; m.visible = true; return m; }
    const m = new THREE.Mesh(this.disco, this.shadowMat);
    m.rotation.x = -Math.PI / 2; this.notesGroup.add(m); p.list.push(m); p.i++; return m;
  }

  resetPools() { for (const k in this.pools) this.pools[k].i = 0; }
  hidePoolLeftovers() { for (const k in this.pools) { const p = this.pools[k]; for (let i = p.i; i < p.list.length; i++) p.list[i].visible = false; } }

  buildStageFor(boss) {
    const s = this.scene, col = new THREE.Color(boss.cor), sky = new THREE.Color(boss.cenario.sky);
    s.background = sky.clone(); s.fog = new THREE.Fog(sky.getHex(), 16, 44);
    this.edgeMat.color.copy(col);
    this.pisoTex.image = pisoCanvas(boss.cor); this.pisoTex.needsUpdate = true;
    this.corChefe = boss.cor;
    this.pintarTorre(0);

    for (const c of this.camadas) { s.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh.material.map.dispose(); c.mesh.material.dispose(); }
    this.camadas = [];
    const cen = cenario(boss.cenario.bg);
    for (const nome of ['longe', 'meio', 'perto']) {
      const spec = CAMADAS[nome], camada = cen[nome];
      const cv = document.createElement('canvas'); cv.width = spec.w; cv.height = spec.h;
      const ctx = cv.getContext('2d');
      camada.pintar(ctx, spec.w, spec.h, 0, 0, boss.cor);
      const map = tex(cv);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(spec.mundoW, spec.mundoH), new THREE.MeshBasicMaterial({ map, transparent: true, fog: false, depthWrite: false, alphaTest: 0.02 }));
      mesh.position.set(0, spec.y, spec.z); mesh.renderOrder = -10;
      s.add(mesh);
      this.camadas.push({ nome, spec, camada, ctx, cv, mesh, ultimo: 0 });
    }
  }

  /** Redesenha as camadas animadas do cenário (~15 vezes por segundo) e aplica o parallax. */
  animarCenario(t, kick, camX) {
    for (const c of this.camadas) {
      c.mesh.position.x = -camX * (c.nome === 'longe' ? 0.9 : c.nome === 'meio' ? 0.6 : 0.3);
      if (!c.camada.animada || t - c.ultimo < 1 / 15) continue;
      c.ultimo = t;
      c.ctx.clearRect(0, 0, c.spec.w, c.spec.h);
      c.camada.pintar(c.ctx, c.spec.w, c.spec.h, t, kick, this.corChefe);
      c.mesh.material.map.needsUpdate = true;
    }
  }

  /** Torres laterais: janelas acendem conforme o pulso da batida. */
  pintarTorre(kick) {
    const x = this.torreCv.getContext('2d'), R = ramp(snapToPalette(this.corChefe || '#ff2f8e'));
    x.fillStyle = '#1a1530'; x.fillRect(0, 0, 8, 16);
    x.fillStyle = '#2a2448'; x.fillRect(0, 0, 1, 16);
    for (let j = 1; j < 16; j += 3) for (let i = 2; i < 7; i += 3) {
      x.fillStyle = (j / 3 + i) % 2 < 1 || kick > 0.5 ? R.luz : PALETTE.Z; x.fillRect(i, j, 2, 2);
    }
    this.torreTex.needsUpdate = true;
  }

  ring(lane, colorHex, widthLanes) {
    const r = this.rings.find((m) => !m.visible) || this.rings[0];
    r.visible = true; r.userData.t = 0; r.userData.w = widthLanes || 1;
    r.material.color.setHex(colorHex); r.position.set(laneX(lane), 0.03, 0);
  }

  burstAt(x, y, z, colorHex, sp) {
    const bu = this.bursts.find((b) => b.userData.t >= 1) || this.bursts.reduce((a, b) => (b.userData.t > a.userData.t ? b : a));
    const a = bu.geometry.attributes.position, v = bu.userData.vel;
    for (let i = 0; i < a.count; i++) {
      a.array[i * 3] = x; a.array[i * 3 + 1] = y; a.array[i * 3 + 2] = z;
      const th = Math.random() * 6.28, ph = Math.random() * 3.14, k = sp * (0.4 + Math.random() * 0.6);
      v[i * 3] = Math.cos(th) * Math.sin(ph) * k; v[i * 3 + 1] = Math.abs(Math.cos(ph)) * k * 1.2; v[i * 3 + 2] = Math.sin(th) * Math.sin(ph) * k;
    }
    a.needsUpdate = true; bu.material.color.setHex(colorHex); bu.userData.t = 0; bu.visible = true;
  }

  toScreen(x, y, z, w, h) {
    const v = new THREE.Vector3(x, y, z).project(this.cam);
    return [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h];
  }
}
