import * as THREE from 'three';
import { getSpriteCache, makeSprite, SPR_TXT } from '../../engine/render2d/sprites.js';

export const SPAN = 22, LANES = 5, LW = 1.05;
export const laneX = (l) => (l - 2) * LW;

function tex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}

/** Palco 3D da batalha (Three.js) + sprites pixel art em billboard — portado do protótipo, com formas/cores lidas dos tipos de nota em vez de um switch fixo. */
export class Stage3D {
  constructor(glCanvas) {
    const { SPR, SPR_W } = getSpriteCache();
    this.SPR = SPR; this.SPR_W = SPR_W;
    const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(1);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(62, 1, 0.1, 140);
    scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(3, 6, 4); scene.add(dl);

    const zc = -SPAN / 2 + 1;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(5.5, SPAN + 10), new THREE.MeshBasicMaterial({ color: 0x07050f }));
    floor.rotation.x = -Math.PI / 2; floor.position.z = zc - 1; scene.add(floor);

    const laneMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
    for (let i = 0; i <= 5; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, SPAN + 10), laneMat);
      m.position.set((i - 2.5) * LW, 0.006, zc - 1); scene.add(m);
    }
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xff2f8e });
    const edges = [-1, 1].map((sx) => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, SPAN + 10), edgeMat);
      e.position.set(sx * 2.78, 0.04, zc - 1); scene.add(e); return e;
    });
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.03, 0.07), new THREE.MeshBasicMaterial({ color: 0xffffff })));
    const hl = new THREE.Mesh(new THREE.PlaneGeometry(LW * 0.96, 7), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 }));
    hl.rotation.x = -Math.PI / 2; hl.position.set(0, 0.004, -3.3); scene.add(hl);

    const beatLines = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.012, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
      scene.add(m); beatLines.push(m);
    }
    const pillarMat = new THREE.MeshPhongMaterial({ color: 0x3a3a55, flatShading: true, emissive: 0x110011 });
    const pillars = [];
    for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.4), pillarMat); scene.add(m); pillars.push(m); }

    const G = {
      esfera: new THREE.IcosahedronGeometry(0.27, 0),
      losango: new THREE.TetrahedronGeometry(0.34, 0),
      prisma: new THREE.BoxGeometry(1, 1, 1),
      placa: new THREE.BoxGeometry(1, 1, 1),
      anelNucleo: new THREE.OctahedronGeometry(0.34, 0),
      anel: new THREE.TorusGeometry(0.56, 0.075, 4, 18),
      disco: new THREE.CircleGeometry(0.26, 10)
    };
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false });
    const notesGroup = new THREE.Group(); scene.add(notesGroup);
    const boss = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, fog: false })); scene.add(boss);
    const heroTex = tex(makeSprite(SPR_TXT.eco_u1)), heroTex2 = tex(makeSprite(SPR_TXT.eco_u2));
    const hero = new THREE.Sprite(new THREE.SpriteMaterial({ map: heroTex, transparent: true, fog: false })); scene.add(hero);
    const ghosts = [0, 1].map(() => {
      const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: heroTex, transparent: true, opacity: 0.3, fog: false, color: 0x8fffff }));
      g.visible = false; scene.add(g); return g;
    });
    const spN = 70, spPos = new Float32Array(spN * 3);
    for (let i = 0; i < spN; i++) { spPos[i * 3] = (Math.random() < 0.5 ? -1 : 1) * (3.2 + Math.random() * 4); spPos[i * 3 + 1] = Math.random() * 4; spPos[i * 3 + 2] = -Math.random() * SPAN * 1.4; }
    const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
    const speed = new THREE.Points(spGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: false, transparent: true, opacity: 0.6 })); scene.add(speed);
    const bN = 40, bPos = new Float32Array(bN * 3), bVel = new Float32Array(bN * 3), bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
    const burst = new THREE.Points(bGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true }));
    burst.userData = { t: 1, vel: bVel }; scene.add(burst);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 10), shadowMat.clone());
    shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
    const rings = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.visible = false; m.userData = { t: 1 }; scene.add(m); rings.push(m);
    }

    Object.assign(this, {
      renderer, scene, cam, edgeMat, pillarMat, hl, beatLines, pillars, notesGroup, boss, hero, heroTex, heroTex2, ghosts,
      speed, burst, shadow, rings, G, materialCache: new Map(), pools: {}, bossTex: {}, bossTexW: {}, bg: null,
      white: new THREE.Color(0xffffff)
    });
  }

  size(w, h) { this.renderer.setSize(w, h, false); }

  materialFor(cor) {
    const key = cor;
    if (!this.materialCache.has(key)) {
      this.materialCache.set(key, new THREE.MeshPhongMaterial({ color: cor, flatShading: true, shininess: 0, emissive: cor, emissiveIntensity: 0.25 }));
    }
    return this.materialCache.get(key);
  }

  /** Uma malha por tipo de nota, reaproveitando pool (evita criar/destruir geometria todo quadro). */
  pool(noteType) {
    const p = this.pools[noteType.id] || (this.pools[noteType.id] = { list: [], i: 0 });
    if (p.i < p.list.length) { const m = p.list[p.i++]; m.visible = true; return m; }
    let m;
    const cor = parseInt(noteType.cor.slice(1), 16);
    if (noteType.coletavel) {
      m = new THREE.Group();
      m.add(new THREE.Mesh(this.G.anelNucleo, this.materialFor(cor)));
      m.add(new THREE.Mesh(this.G.anel, new THREE.MeshBasicMaterial({ color: 0xffffff })));
    } else if (noteType.pistas >= 5) {
      m = new THREE.Group();
      const bar = new THREE.Mesh(this.G.placa, new THREE.MeshBasicMaterial({ color: cor })); bar.scale.set(5.6, 0.22, 0.3); m.add(bar);
      const top = new THREE.Mesh(this.G.placa, new THREE.MeshBasicMaterial({ color: 0xffffff })); top.scale.set(5.6, 0.05, 0.32); top.position.y = 0.13; m.add(top);
    } else if (noteType.forma === 'prisma' && noteType.altura === 'alta' && !noteType.duracaoVariavel) {
      m = new THREE.Mesh(this.G.prisma, this.materialFor(cor)); m.scale.set(0.9, 1.35, 0.24);
    } else if (noteType.duracaoVariavel) {
      m = new THREE.Mesh(this.G.prisma, this.materialFor(cor)); m.scale.set(0.55, 0.2, 1);
    } else if (noteType.forma === 'placa') {
      m = new THREE.Mesh(this.G.placa, this.materialFor(cor));
    } else if (noteType.forma === 'losango') {
      m = new THREE.Mesh(this.G.losango, this.materialFor(cor));
    } else {
      m = new THREE.Mesh(this.G.esfera, this.materialFor(cor));
    }
    this.notesGroup.add(m); p.list.push(m); p.i++; return m;
  }

  poolShadow() {
    const p = this.pools.__shadow || (this.pools.__shadow = { list: [], i: 0 });
    if (p.i < p.list.length) { const m = p.list[p.i++]; m.visible = true; return m; }
    const m = new THREE.Mesh(this.G.disco, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 }));
    m.rotation.x = -Math.PI / 2; this.notesGroup.add(m); p.list.push(m); p.i++; return m;
  }

  resetPools() { for (const k in this.pools) this.pools[k].i = 0; }
  hidePoolLeftovers() { for (const k in this.pools) { const p = this.pools[k]; for (let i = p.i; i < p.list.length; i++) p.list[i].visible = false; } }

  buildStageFor(boss) {
    const s = this.scene, col = new THREE.Color(boss.cor), sky = new THREE.Color(boss.cenario.sky);
    s.background = sky.clone(); s.fog = new THREE.Fog(sky.getHex(), 14, 40);
    this.edgeMat.color.copy(col); this.pillarMat.emissive.copy(col).multiplyScalar(0.25);
    if (!this.bossTex[boss.id]) { this.bossTex[boss.id] = tex(this.SPR[boss.sprite]); this.bossTexW[boss.id] = tex(this.SPR_W[boss.sprite]); }
    this.boss.material.map = this.bossTex[boss.id]; this.boss.material.needsUpdate = true;
    if (this.bg) { s.remove(this.bg); this.bg.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    const g = new THREE.Group(), Z = -SPAN - 4; g.userData = { kind: boss.cenario.bg, items: [] };
    const add = (m) => { g.add(m); g.userData.items.push(m); return m; };
    switch (boss.cenario.bg) {
      case 'stars': case 'void': {
        const n = boss.cenario.bg === 'void' ? 500 : 400, pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 60; pos[i * 3 + 1] = Math.random() * 25 - 3; pos[i * 3 + 2] = -Math.random() * 70 - 8; }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: boss.cenario.bg === 'void' ? 0x999999 : 0xff9ad0, size: 1.5, sizeAttenuation: false, fog: false }));
        add(pts); g.userData.pts = pts;
        if (boss.cenario.bg === 'stars') for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(5 + i * 2.2, 0.06, 4, 40), new THREE.MeshBasicMaterial({ color: col, wireframe: true, fog: false })); t.position.set(0, 3.5, Z); add(t); }
        break;
      }
      case 'eq': for (let i = 0; i < 20; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1, 0.6), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(i / 20, 0.9, 0.55), fog: false })); m.position.set((i - 9.5) * 1.5, 0, Z - 3); add(m); } break;
      case 'fog': for (let i = 0; i < 10; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x8fffff, transparent: true, opacity: 0.07, fog: false })); m.scale.set(14, 7, 1); m.position.set((Math.random() - 0.5) * 30, 1 + Math.random() * 6, -8 - Math.random() * 25); add(m); } break;
      case 'hive': for (let y = 0; y < 6; y++) for (let x = -6; x <= 6; x++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.2, 6), new THREE.MeshPhongMaterial({ color: 0xb08a00, flatShading: true, emissive: 0x302000 })); m.rotation.x = Math.PI / 2; m.position.set(x * 1.55 + (y % 2) * 0.78, y * 1.35 - 0.5, Z - 4); add(m); } break;
      case 'lake': { for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(30, 60), new THREE.MeshBasicMaterial({ color: 0x0a2a5a })); w.rotation.x = -Math.PI / 2; w.position.set(sx * 18, -0.05, -20); add(w); } const moon = new THREE.Mesh(new THREE.CircleGeometry(3, 20), new THREE.MeshBasicMaterial({ color: 0xe8f4ff, fog: false })); moon.position.set(9, 11, Z - 10); add(moon); break; }
      case 'pipes': for (let i = 0; i < 15; i++) { const d = Math.abs(i - 7), h = 11 - d * 1.1; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, h, 8), new THREE.MeshPhongMaterial({ color: 0x6a7088, flatShading: true, emissive: 0x000000 })); m.position.set((i - 7) * 1.2, h / 2 - 0.5, Z - 2); add(m); } break;
      case 'sun': { const sun = new THREE.Mesh(new THREE.CircleGeometry(11, 32), new THREE.MeshBasicMaterial({ color: 0xff6a00, fog: false })); sun.position.set(0, 0, Z - 14); add(sun); for (let i = 0; i < 7; i++) { const bar = new THREE.Mesh(new THREE.PlaneGeometry(24, 0.5 + i * 0.18), new THREE.MeshBasicMaterial({ color: boss.cenario.sky, fog: false })); bar.position.set(0, -1 + i * 1.4, Z - 13.9); add(bar); } break; }
    }
    s.add(g); this.bg = g;
  }

  ring(lane, colorHex, widthLanes) {
    const r = this.rings.find((m) => !m.visible) || this.rings[0];
    r.visible = true; r.userData.t = 0; r.userData.w = widthLanes || 1;
    r.material.color.setHex(colorHex); r.position.set(laneX(lane), 0.03, 0);
  }

  burstAt(x, y, z, colorHex, sp) {
    const bu = this.burst, a = bu.geometry.attributes.position, v = bu.userData.vel;
    for (let i = 0; i < a.count; i++) {
      a.array[i * 3] = x; a.array[i * 3 + 1] = y; a.array[i * 3 + 2] = z;
      const th = Math.random() * 6.28, ph = Math.random() * 3.14;
      v[i * 3] = Math.cos(th) * Math.sin(ph) * sp; v[i * 3 + 1] = Math.abs(Math.cos(ph)) * sp * 1.2; v[i * 3 + 2] = Math.sin(th) * Math.sin(ph) * sp;
    }
    a.needsUpdate = true; bu.material.color.setHex(colorHex); bu.userData.t = 0;
  }

  toScreen(x, y, z, w, h) {
    const v = new THREE.Vector3(x, y, z).project(this.cam);
    return [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h];
  }
}
