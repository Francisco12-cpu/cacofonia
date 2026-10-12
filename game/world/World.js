import { sprite } from '../../engine/render2d/sprites.js';
import { CHEFES, QUEM, DIARIO, AMULETOS, INTRO, FINAL, MUNDOS, INICIO, ANDA, PRESENTES, TEMAS, falasDe } from './dados.js';

/**
 * Aventura: o mundo aberto do protótipo (3 mundos, moradores, portais dos
 * chefes, amuletos e diário), portado para o novo motor. Desenha em baixa
 * resolução num canvas próprio; as lutas são abertas por `deps.lutar` e,
 * ao fim, `retomar()` devolve o jogador ao mundo.
 */
const SAVE_KEY = 'cacofonia-aventura';
const VEL = 80;

function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function createWorld(deps) {
  const { $, input, bosses, settings } = deps;
  const cv = $('world'), ctx = cv.getContext('2d');
  let W = 0, H = 0, PS = 2;
  let jogo = null;
  const S = { t: 0, pl: null, cam: null, poeira: [], conversa: null, banner: null, menu: false, trocando: false, ativo: false };
  const cacheMapa = {}, cacheArvore = {}, cacheLuz = {};

  // ---------- save ----------
  const novoJogo = () => ({ libertos: [], mundo: 'vila', x: INICIO.x, y: INICIO.y, amuletos: [], equip: [], diario: [], final: false });
  function carregar() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && Array.isArray(s.libertos) ? { ...novoJogo(), ...s } : null; } catch { return null; } }
  function salvar() { if (jogo) localStorage.setItem(SAVE_KEY, JSON.stringify(jogo)); }
  const libertos = () => new Set(jogo.libertos);
  const nivel = () => 1 + jogo.libertos.length;
  const hpMax = () => 100 + (nivel() - 1) * 10 + (jogo.equip.includes('fole') ? 20 : 0);
  const mundo = () => MUNDOS[jogo.mundo];
  const chefe = (id) => CHEFES.find((c) => c.id === id);
  const liberado = (id) => chefe(id).precisa.every((p) => jogo.libertos.includes(p));

  // ---------- tamanho ----------
  function redimensionar() {
    PS = Math.max(2, Math.floor(Math.min(window.innerWidth, window.innerHeight) / 190));
    W = Math.ceil(window.innerWidth / PS); H = Math.ceil(window.innerHeight / PS);
    cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false;
    for (const k in cacheLuz) delete cacheLuz[k];
  }
  window.addEventListener('resize', redimensionar);
  redimensionar();

  // ---------- desenho do mapa (pré-renderizado por mundo) ----------
  function mapaDe(id) {
    if (cacheMapa[id]) return cacheMapa[id];
    const m = MUNDOS[id], T = TEMAS[m.tema], c = document.createElement('canvas');
    c.width = m.cols * 16; c.height = m.lins * 16;
    const g = c.getContext('2d'), r = rng(id.length * 31);
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const chao = (X, Y) => { px(X, Y, 16, 16, T.g); if (m.tema === 'cidadela') { px(X, Y, 16, 1, T.g1); px(X, Y, 1, 16, T.g1); } else for (let i = 0; i < 7; i++) px(X + Math.floor(r() * 16), Y + Math.floor(r() * 16), 1, 2, r() < 0.5 ? T.g1 : T.g2); };
    let fonte = null; m.agua = []; m.arvores = [];
    for (let y = 0; y < m.lins; y++) for (let x = 0; x < m.cols; x++) {
      const ch = m.grade[y][x], X = x * 16, Y = y * 16;
      switch (ch) {
        case '~': m.agua.push([X, Y]); px(X, Y, 16, 16, T.water); px(X + ((x + y) % 2 ? 2 : 8), Y + 4, 6, 1, T.wave); px(X + ((x + y) % 2 ? 7 : 1), Y + 11, 6, 1, T.wave); if (m.grade[y - 1] && m.grade[y - 1][x] !== '~') px(X, Y, 16, 2, 'rgba(0,0,0,0.25)'); break;
        case '=': case 'W': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '9':
          px(X, Y, 16, 16, T.path);
          if (m.tema === 'cidadela') { px(X + 1, Y + 1, 1, 1, T.p1); px(X + 14, Y + 1, 1, 1, T.p1); px(X + 1, Y + 14, 1, 1, T.p1); px(X + 14, Y + 14, 1, 1, T.p1); px(X, Y + 15, 16, 1, T.p2); }
          else for (let i = 0; i < 5; i++) px(X + Math.floor(r() * 15), Y + Math.floor(r() * 15), 2, 1, r() < 0.5 ? T.p1 : T.p2);
          break;
        case 'R': px(X, Y, 16, 16, T.roof); for (let i = 3; i < 16; i += 4) px(X, Y + i, 16, 1, T.roofL); px(X, Y, 16, 1, 'rgba(255,255,255,0.25)'); break;
        case 'H': px(X, Y, 16, 16, T.wall); px(X + 4, Y, 1, 16, T.wallL); px(X + 11, Y, 1, 16, T.wallL); px(X + 5, Y + 4, 6, 6, T.win); px(X + 5, Y + 4, 6, 1, '#1b2a4a'); px(X + 6, Y + 5, 2, 2, 'rgba(255,255,255,0.5)'); px(X, Y, 16, 2, 'rgba(0,0,0,0.3)'); break;
        case 'D': px(X, Y, 16, 16, T.wall); px(X + 4, Y + 3, 8, 13, m.tema === 'cidadela' ? '#1a1c2a' : '#6b4226'); px(X + 10, Y + 9, 1, 1, '#f5ff3d'); px(X, Y, 16, 2, 'rgba(0,0,0,0.3)'); if (m.tema === 'cidadela') px(X + 3, Y + 2, 10, 1, '#2be9ff'); break;
        case '#':
          if (m.tema === 'cidadela') { px(X, Y, 16, 16, T.tree); for (let i = 0; i < 16; i += 4) px(X, Y + i, 16, 1, '#1a1c2a'); px(X + ((y % 2) ? 4 : 12), Y, 1, 16, '#1a1c2a'); px(X, Y, 16, 1, T.treeH); }
          else { chao(X, Y); px(X + 2, Y + 12, 13, 4, 'rgba(0,0,0,0.28)'); m.arvores.push([X, Y, (x * 7 + y * 3) % 3]); }
          break;
        case ',': chao(X, Y); px(X + 3, Y + 5, 2, 2, T.fl[0]); px(X + 10, Y + 9, 2, 2, T.fl[1]); px(X + 6, Y + 12, 2, 2, T.fl[2]); break;
        case 'm': chao(X, Y); px(X + 3, Y + 14, 10, 2, 'rgba(0,0,0,0.3)'); px(X + 3, Y + 4, 10, 5, '#e03a5a'); px(X + 2, Y + 6, 12, 3, '#e03a5a'); px(X + 5, Y + 5, 2, 2, '#fff'); px(X + 10, Y + 6, 2, 2, '#fff'); px(X + 6, Y + 9, 4, 6, '#f4e3c8'); break;
        case 'g': chao(X, Y); g.fillStyle = '#8a93a8'; g.beginPath(); g.arc(X + 8, Y + 8, 6, 0, 7); g.fill(); for (let a = 0; a < 8; a++) px(X + 7 + Math.round(Math.cos(a * 0.785) * 7), Y + 7 + Math.round(Math.sin(a * 0.785) * 7), 2, 2, '#8a93a8'); px(X + 6, Y + 6, 4, 4, T.g); break;
        case 'S': chao(X, Y); px(X + 7, Y + 8, 2, 8, '#5a3a24'); px(X + 2, Y + 2, 12, 7, '#b8935f'); px(X + 4, Y + 4, 8, 1, '#5a3a24'); px(X + 4, Y + 6, 6, 1, '#5a3a24'); break;
        case 'F': px(X, Y, 16, 16, T.path); if (!fonte) fonte = { X, Y }; break;
        default: chao(X, Y);
      }
    }
    if (fonte) { const { X, Y } = fonte; g.fillStyle = '#8b93a8'; g.beginPath(); g.arc(X + 16, Y + 16, 15, 0, 7); g.fill(); g.fillStyle = '#3a7bd5'; g.beginPath(); g.arc(X + 16, Y + 16, 11, 0, 7); g.fill(); g.fillStyle = '#c9d6ff'; g.fillRect(X + 14, Y + 10, 4, 10); g.fillRect(X + 12, Y + 9, 8, 2); }
    return (cacheMapa[id] = c);
  }

  function arvore(tema, v) {
    const k = tema + v; if (cacheArvore[k]) return cacheArvore[k];
    const T = TEMAS[tema], c = document.createElement('canvas'); c.width = 20; c.height = 26;
    const g = c.getContext('2d'), px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const escuro = tema === 'floresta' ? '#072414' : '#0c3a1d';
    px(8, 16, 4, 9, '#5a3a24'); px(9, 16, 1, 9, '#7a5234'); px(7, 24, 6, 1, '#3a2414');
    px(4, 3, 12, 13, escuro); px(2, 6, 16, 8, escuro); px(6, 1, 8, 17, escuro);
    px(5, 3, 10, 11, T.tree); px(3, 6, 14, 6, T.tree); px(7, 2, 6, 13, T.tree);
    px(6, 3, 5, 3, T.treeH); px(4, 6, 3, 3, T.treeH); px(9, 6, 2, 2, T.treeH); px(12, 4, 2, 2, T.treeH);
    if (v === 1) px(12, 10, 2, 2, tema === 'floresta' ? '#8fffff' : '#ff4a6a');
    if (v === 2) px(6, 11, 2, 2, tema === 'floresta' ? '#f5ff3d' : '#ff9ac1');
    return (cacheArvore[k] = c);
  }

  function luzDe(tema) {
    const k = tema + W + 'x' + H; if (cacheLuz[k]) return cacheLuz[k];
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), tint = TEMAS[tema].luz;
    const g1 = g.createLinearGradient(0, 0, 0, H); g1.addColorStop(0, `rgba(${tint},0.10)`); g1.addColorStop(0.5, `rgba(${tint},0)`); g.fillStyle = g1; g.fillRect(0, 0, W, H);
    const g2 = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, tema === 'cidadela' ? 'rgba(10,0,30,0.45)' : 'rgba(0,10,20,0.35)'); g.fillStyle = g2; g.fillRect(0, 0, W, H);
    return (cacheLuz[k] = c);
  }

  function texto(s, x, y, cor = '#fff', alinha = 'left') {
    ctx.font = "8px 'Press Start 2P', monospace"; ctx.textAlign = alinha; ctx.textBaseline = 'top';
    ctx.fillStyle = '#000'; ctx.fillText(s, x + 1, y + 1); ctx.fillStyle = cor; ctx.fillText(s, x, y);
  }
  const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

  // ---------- conversa (caixa de diálogo do mundo) ----------
  function conversar(linhas, aoFim) {
    S.conversa = { linhas, i: 0, n: 0, t: 0, pronto: false, aoFim };
    $('talk').classList.remove('hidden');
    mostrarLinha();
  }
  function mostrarLinha() {
    const [quem] = S.conversa.linhas[S.conversa.i], q = QUEM[quem] || QUEM.narr;
    $('tkName').textContent = q.nome; $('tkText').textContent = ''; $('tkNext').classList.add('hidden');
    const pc = $('tkPortrait'), g = pc.getContext('2d');
    pc.style.visibility = q.spr ? 'visible' : 'hidden';
    if (q.spr) { const s = sprite(q.spr); pc.width = s.width; pc.height = s.height; g.clearRect(0, 0, pc.width, pc.height); g.drawImage(s, 0, 0); }
    const chefeCor = bosses.has(quem) ? bosses.get(quem).cor : '#3b3478';
    $('tkName').style.color = bosses.has(quem) ? chefeCor : '#2be9ff';
    Object.assign(S.conversa, { n: 0, t: 0, pronto: false });
  }
  function avancar() {
    const d = S.conversa; if (!d) return;
    const linha = d.linhas[d.i][1];
    if (!d.pronto) { d.n = linha.length; $('tkText').textContent = linha; d.pronto = true; $('tkNext').classList.remove('hidden'); return; }
    d.i++;
    if (d.i >= d.linhas.length) { $('talk').classList.add('hidden'); S.conversa = null; if (d.aoFim) d.aoFim(); }
    else mostrarLinha();
  }
  function atualizarConversa(dt) {
    const d = S.conversa; if (!d || d.pronto) return;
    d.t += dt;
    const [quem, linha] = d.linhas[d.i], n = Math.min(linha.length, Math.floor(d.t / 0.035));
    if (n !== d.n) {
      d.n = n; $('tkText').textContent = linha.slice(0, n);
      const voz = (QUEM[quem] || QUEM.narr).voz;
      if (voz && n % 2 === 0 && linha[n - 1] && linha[n - 1] !== ' ') deps.som({ tipo: 'voz', freq: voz * (0.95 + Math.random() * 0.1) });
      if (n >= linha.length) { d.pronto = true; $('tkNext').classList.remove('hidden'); }
    }
  }
  $('talk').addEventListener('click', avancar);

  // ---------- movimento ----------
  const morador = () => mundo().moradores.filter((n) => !n.depois || jogo.libertos.includes(n.depois));
  const tile = (x, y) => (mundo().grade[y] && mundo().grade[y][x]) || '#';
  function bloqueado(x, y) {
    for (let i = 0; i < 4; i++) { const cx = x + (i & 1 ? 5 : -5), cy = y - (i & 2 ? 0 : 6); if (!ANDA.has(tile(Math.floor(cx / 16), Math.floor(cy / 16)))) return true; }
    for (const n of morador()) if (Math.abs(x - (n.x * 16 + 8)) < 11 && Math.abs(y - (n.y * 16 + 14)) < 7) return true;
    return false;
  }
  function tentar(dx, dy) {
    const p = S.pl;
    if (!bloqueado(p.px + dx, p.py + dy)) { p.px += dx; p.py += dy; return true; }
    // Desliza nos cantos em vez de travar.
    for (const o of [2, 4, 6]) for (const sg of [1, -1]) {
      const ox = dy ? o * sg : 0, oy = dx ? o * sg : 0;
      if (!bloqueado(p.px + dx + ox, p.py + dy + oy)) { p.px += dx + Math.sign(ox) * Math.min(Math.abs(ox), 1); p.py += dy + Math.sign(oy) * Math.min(Math.abs(oy), 1); return true; }
    }
    return false;
  }
  function empurrarDeVolta() { const p = S.pl; p.px = p.seguro.x * 16 + 8; p.py = p.seguro.y * 16 + 13; p.vx = p.vy = 0; }
  function poeira(x, y) { if (!settings.reducedFx && S.poeira.length < 24) S.poeira.push({ x, y, t: 0, vx: (Math.random() - 0.5) * 14 }); }

  function entrarNaPorta(id) {
    empurrarDeVolta();
    if (jogo.libertos.includes(id)) { conversar([['narr', 'O portal está calmo. O guardião já está em paz.']]); return; }
    if (!liberado(id)) {
      deps.blip('C3', 0.2);
      conversar([['narr', 'Uma força silenciosa bloqueia o caminho.'], ['narr', chefe(id).final ? 'Liberte o Órgão e o Colosso primeiro.' : 'Liberte o guardião anterior primeiro.']]);
      return;
    }
    jogo.x = S.pl.seguro.x; jogo.y = S.pl.seguro.y; salvar();
    S.ativo = false;
    deps.lutar(id, { amuletos: jogo.equip.slice(), hpExtra: (nivel() - 1) * 10 });
  }
  function checarEstrada(tx, ty) {
    const e = mundo().estradas.find((w) => w.x === tx && w.y === ty); if (!e) return;
    if (!e.precisa.every((j) => jogo.libertos.includes(j))) { empurrarDeVolta(); conversar([['narr', 'Uma névoa silenciosa fecha a estrada.'], ['narr', 'Liberte todos os guardiões desta região primeiro.']]); return; }
    S.trocando = true;
    deps.transicao(() => { jogo.mundo = e.para; jogo.x = e.tx; jogo.y = e.ty; salvar(); entrar(); }).then(() => { S.trocando = false; });
  }
  function moradorPerto() {
    const p = S.pl, fx = p.px + (p.dir === 'left' ? -8 : p.dir === 'right' ? 8 : 0), fy = p.py - 6 + (p.dir === 'up' ? -8 : p.dir === 'down' ? 8 : 0);
    let melhor = null, bd = 22;
    for (const n of morador()) { const d = Math.hypot(fx - (n.x * 16 + 8), fy - (n.y * 16 + 9)); if (d < bd) { bd = d; melhor = n; } }
    return melhor;
  }
  function placaPerto() {
    const p = S.pl, tx = Math.floor((p.px + (p.dir === 'left' ? -12 : p.dir === 'right' ? 12 : 0)) / 16), ty = Math.floor((p.py - 6 + (p.dir === 'up' ? -12 : p.dir === 'down' ? 10 : 0)) / 16);
    return tile(tx, ty) === 'S';
  }
  function livre(id) { const b = bosses.get(id); return (b.falas.posLibertacao || b.falas.vitoria || []).map((l) => [id, l]); }
  function darPresentes(id, fim) {
    const g = PRESENTES[id]; if (!g) { fim(); return; }
    const linhas = [];
    for (const d of g.diario || []) if (!jogo.diario.includes(d)) { jogo.diario.push(d); linhas.push(['narr', `DIÁRIO: nova página "${DIARIO[d].t}".`]); }
    const ok = (!g.precisa || g.precisa.every((c) => jogo.libertos.includes(c))) && (!g.algum || g.algum.some((c) => jogo.libertos.includes(c)));
    if (g.amuleto && ok && !jogo.amuletos.includes(g.amuleto)) {
      jogo.amuletos.push(g.amuleto); if (jogo.equip.length < 2) jogo.equip.push(g.amuleto);
      linhas.push(['narr', `VOCÊ RECEBEU: ${AMULETOS[g.amuleto].n}!`], ['narr', AMULETOS[g.amuleto].d + (jogo.equip.includes(g.amuleto) ? ' (equipado)' : ' Equipe no MENU.')]);
      deps.som({ tipo: 'vitoria' });
    }
    salvar();
    if (linhas.length) conversar(linhas, fim); else fim();
  }
  function agir() {
    if (S.conversa) { avancar(); return; }
    if (!S.ativo || S.menu || S.trocando) return;
    const n = moradorPerto();
    if (n) { deps.blip('C6', 0.04); conversar(falasDe(n.id, libertos(), livre), () => darPresentes(n.id, () => {})); return; }
    if (placaPerto() && mundo().placa) { deps.blip('C6', 0.04); conversar(mundo().placa); }
  }

  // A mesma tecla pode fechar o menu (ESC = voltar) e reabri-lo (ESC = pausa) no mesmo aperto: ignora por um instante.
  const recemFechado = () => performance.now() - (S.fechouEm || 0) < 250;
  for (const ev of ['collect', 'interact', 'confirm', 'jump']) input.on(ev, () => { if (S.ativo && !S.menu && !recemFechado()) agir(); });
  for (const ev of ['menu', 'pause']) input.on(ev, () => { if (S.ativo && !S.menu && !S.conversa && !S.trocando && !recemFechado()) abrirMenu(); });
  input.attachWorldTouch(cv, { onTap: () => { if (S.ativo) agir(); } });
  $('aBtn').onclick = () => agir();
  $('menuBtn').onclick = () => { if (S.ativo && !S.conversa) abrirMenu(); };

  // ---------- telas do mundo ----------
  function setUi(visivel) {
    for (const id of ['world', 'aBtn', 'menuBtn', 'wHud']) $(id).classList.toggle('hidden', !visivel);
    $('menuBg').classList.toggle('hidden', visivel);
    if (!visivel) $('talk').classList.add('hidden');
  }
  function atualizarHud() {
    $('wHud').innerHTML = `LV ${nivel()} · HP ${hpMax()}<br><span class="ouro">♪ ${jogo.libertos.length}/${CHEFES.length}</span>`;
  }
  function abrirMenu() {
    S.menu = true;
    jogo.x = S.pl.seguro.x; jogo.y = S.pl.seguro.y; salvar();
    $('wmInfo').textContent = `${mundo().nome} · LV ${nivel()} · HP ${hpMax()} · NOTAS ${jogo.libertos.length}/${CHEFES.length}`;
    $('wmDiaryN').textContent = `${jogo.diario.length} páginas`;
    $('wmCharmN').textContent = `${jogo.equip.length}/2`;
    deps.screen('sWorldMenu');
  }
  function fecharMenu() { S.menu = false; S.fechouEm = performance.now(); deps.screen(null); }
  function abrirDiario() {
    const L = $('diaryList'); L.innerHTML = '';
    if (!jogo.diario.length) L.innerHTML = '<div class="entry">Ainda vazio. Converse com as pessoas.</div>';
    for (const d of jogo.diario) {
      const e = document.createElement('div'); e.className = 'entry';
      const b = document.createElement('b'); b.textContent = DIARIO[d].t; e.append(b, document.createTextNode(DIARIO[d].x)); L.appendChild(e);
    }
    deps.screen('sDiary');
  }
  function abrirAmuletos() {
    const L = $('charmList'); L.innerHTML = '';
    if (!jogo.amuletos.length) L.innerHTML = '<div class="entry">Nenhum amuleto ainda. Os moradores podem te ajudar.</div>';
    for (const a of jogo.amuletos) {
      const b = document.createElement('button'); const on = jogo.equip.includes(a);
      b.className = 'opt' + (on ? ' on' : ''); b.style.flexDirection = 'column'; b.style.alignItems = 'flex-start';
      const t = document.createElement('span'); t.textContent = `${on ? '■' : '□'} ${AMULETOS[a].n}`;
      const d = document.createElement('small'); d.style.lineHeight = '1.8'; d.textContent = AMULETOS[a].d;
      b.append(t, d);
      b.onclick = () => { if (jogo.equip.includes(a)) jogo.equip = jogo.equip.filter((x) => x !== a); else { if (jogo.equip.length >= 2) jogo.equip.shift(); jogo.equip.push(a); } salvar(); atualizarHud(); abrirAmuletos(); };
      L.appendChild(b);
    }
    deps.screen('sCharms');
  }

  // ---------- ciclo ----------
  function entrar() {
    deps.screen(null); setUi(true);
    const p = S.pl = { px: jogo.x * 16 + 8, py: jogo.y * 16 + 13, vx: 0, vy: 0, dir: 'down', andando: false, dist: 0, ultimo: '', seguro: { x: jogo.x, y: jogo.y } };
    mapaDe(jogo.mundo);
    S.cam = null; S.ativo = true; S.menu = false;
    S.banner = { t: 0, texto: mundo().nome };
    deps.tocarMusica(jogo.final ? 'final' : mundo().musica);
    atualizarHud();
    return p;
  }

  function update(dt) {
    S.t += dt;
    atualizarConversa(dt);
    if (S.ativo && S.pl) { mover(dt); desenhar(dt); }
  }

  function mover(dt) {
    const p = S.pl, parado = S.conversa || S.trocando || S.menu;
    const iv = parado ? { x: 0, y: 0 } : input.getAxisWithGamepad();
    const k = Math.min(1, dt * (iv.x || iv.y ? 14 : 18));
    p.vx += (iv.x * VEL - p.vx) * k; p.vy += (iv.y * VEL - p.vy) * k;
    if (Math.abs(p.vx) < 0.5) p.vx = 0; if (Math.abs(p.vy) < 0.5) p.vy = 0;
    const sp = Math.hypot(p.vx, p.vy);
    if (p.vx && !tentar(p.vx * dt, 0)) p.vx *= 0.3;
    if (p.vy && !tentar(0, p.vy * dt)) p.vy *= 0.3;
    if (Math.abs(iv.x) > 0.2 || Math.abs(iv.y) > 0.2) { const nd = Math.abs(iv.x) > Math.abs(iv.y) ? (iv.x > 0 ? 'right' : 'left') : (iv.y > 0 ? 'down' : 'up'); if (nd !== p.dir && sp > 20) poeira(p.px, p.py); p.dir = nd; }
    const ld = p.dist; p.dist += sp * dt; if (sp > 30 && Math.floor(p.dist / 14) !== Math.floor(ld / 14)) poeira(p.px + (Math.random() - 0.5) * 4, p.py);
    p.andando = sp > 12;
    const tx = Math.floor(p.px / 16), ty = Math.floor((p.py - 3) / 16), chave = tx + ',' + ty;
    if (chave !== p.ultimo && !parado) {
      p.ultimo = chave; const t = tile(tx, ty);
      if (mundo().portas[t] !== undefined) entrarNaPorta(mundo().portas[t]);
      else if (t === 'W') checarEstrada(tx, ty);
      else p.seguro = { x: tx, y: ty };
    }
    if (S.banner) { S.banner.t += dt; if (S.banner.t > 2.5) S.banner = null; }
    for (const d of S.poeira) d.t += dt;
    S.poeira = S.poeira.filter((d) => d.t < 0.4);
  }

  function spriteHeroi() {
    const p = S.pl, f = (p.andando && Math.floor(p.dist / 9) % 2) ? 2 : 1;
    return p.dir === 'up' ? 'eco_u' + f : p.dir === 'down' ? 'eco_d' + f : 'eco_s' + f;
  }

  function desenhar(dt) {
    const m = mundo(), p = S.pl, mw = m.cols * 16, mh = m.lins * 16, T = TEMAS[m.tema], red = settings.reducedFx;
    let tx = p.px - W / 2 + p.vx * 0.25, ty = p.py - 8 - H / 2 + p.vy * 0.25;
    tx = mw <= W ? (mw - W) / 2 : clamp(tx, 0, mw - W); ty = mh <= H ? (mh - H) / 2 : clamp(ty, 0, mh - H);
    if (!S.cam) S.cam = { x: tx, y: ty };
    const kc = Math.min(1, dt * 7); S.cam.x += (tx - S.cam.x) * kc; S.cam.y += (ty - S.cam.y) * kc;
    const cx = Math.round(S.cam.x), cy = Math.round(S.cam.y);
    R(0, 0, W, H, T.tree); ctx.drawImage(mapaDe(jogo.mundo), -cx, -cy);
    const x0 = cx - 20, x1 = cx + W + 20, y0 = cy - 30, y1 = cy + H + 30;
    if (!red && m.agua) {
      ctx.fillStyle = T.wave;
      for (const [X, Y] of m.agua) {
        if (X < x0 || X > x1 || Y < y0 || Y > y1) continue;
        const o = ((S.t * 6 + X * 0.37 + Y * 0.21) % 16) | 0; ctx.fillRect(X - cx + o, Y - cy + ((X + Y) & 16 ? 3 : 9), 3, 1);
        if (((S.t * 2 + X + Y) | 0) % 9 === 0) { ctx.fillStyle = '#e8f6ff'; ctx.fillRect(X - cx + ((X * 7) % 13), Y - cy + ((Y * 5) % 12), 1, 1); ctx.fillStyle = T.wave; }
      }
    }
    // Portais dos chefes.
    for (const ch in m.posPortas) {
      const d = m.posPortas[ch], id = m.portas[ch], X = d.x * 16 - cx, Y = d.y * 16 - cy;
      if (X < -30 || X > W + 30 || Y < -40 || Y > H + 30) continue;
      const feito = jogo.libertos.includes(id), trancado = !liberado(id), cor = feito ? '#f5ff3d' : trancado ? '#555' : bosses.get(id).cor, fim = chefe(id).final;
      R(X - 2, Y - 14, 3, 30, fim ? '#fff' : '#6b78a8'); R(X + 15, Y - 14, 3, 30, fim ? '#fff' : '#6b78a8'); R(X - 2, Y - 16, 20, 3, fim ? '#fff' : '#6b78a8');
      for (let k = 0; k < 4; k++) { const ph = (S.t * 3 + k) % 4; ctx.globalAlpha = trancado ? 0.4 : 0.35 + 0.15 * k; R(X + 1 + ph, Y - 12 + ph * 2, 14 - ph * 2, 26 - ph * 3, cor); }
      if (!trancado && !feito) { ctx.globalAlpha = 0.12 + 0.08 * Math.sin(S.t * 3); ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(X + 8, Y + 14, 16, 6, 0, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (feito) texto('♪', X + 4, Y - 26, '#f5ff3d');
      else if (!trancado) { const s = sprite(bosses.get(id).sprite); ctx.globalAlpha = 0.5 + 0.2 * Math.sin(S.t * 4); ctx.drawImage(s, 0, 0, s.width, s.height, X + 1, Y - 10, 14, 14); ctx.globalAlpha = 1; }
    }
    for (const e of m.estradas) {
      const X = e.x * 16 - cx, Y = e.y * 16 - cy, aberta = e.precisa.every((j) => jogo.libertos.includes(j));
      for (let k = 0; k < 3; k++) { const r = 4 + ((S.t * 8 + k * 3) % 7); ctx.globalAlpha = aberta ? 0.6 - k * 0.15 : 0.25; ctx.strokeStyle = aberta ? '#8fffff' : '#666'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X + 8, Y + 8, r, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    // Tudo ordenado por profundidade: árvores, moradores, Eco.
    const ents = [];
    for (const a of m.arvores || []) if (a[0] >= x0 && a[0] <= x1 && a[1] >= y0 && a[1] <= y1) ents.push({ k: 0, y: a[1] + 14, a });
    for (const n of morador()) ents.push({ k: 1, y: n.y * 16 + 15, n });
    ents.push({ k: 2, y: p.py });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) {
      if (e.k === 0) { const balanco = red ? 0 : Math.round(Math.sin(S.t * 1.5 + e.a[0] * 0.05) * 0.6); ctx.drawImage(arvore(m.tema, e.a[2]), e.a[0] - 2 - cx + balanco, e.a[1] - 10 - cy); continue; }
      if (e.k === 1) {
        const n = e.n, ehChefe = !!n.spr, s = sprite(n.spr || n.id), esc = ehChefe ? 0.5 : 1;
        const sw = Math.round(s.width * esc), sh = Math.round(s.height * esc);
        const bob = Math.round(Math.sin(S.t * 3 + n.x) * 0.7), X = Math.round(n.x * 16 + 8 - sw / 2 - cx), Y = Math.round(n.y * 16 + 16 - sh - cy) + bob;
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(X + sw / 2, n.y * 16 + 15 - cy, sw / 2 - 1, 2, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        ctx.drawImage(s, X, Y, sw, sh);
        const g = PRESENTES[n.id];
        if (g && g.amuleto && !jogo.amuletos.includes(g.amuleto)) texto('✦', X + sw / 2 - 4, Y - 10 + Math.round(Math.sin(S.t * 4)), '#f5ff3d');
        continue;
      }
      const s = sprite(spriteHeroi()), passo = p.andando ? Math.abs(Math.sin(p.dist * 0.35)) : 0;
      const X = Math.round(p.px - s.width / 2 - cx), Y = Math.round(p.py - s.height - cy - passo * 1.5);
      ctx.globalAlpha = 0.38; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(p.px - cx, p.py - cy, 6 - passo, 2, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      if (p.dir === 'left') { ctx.save(); ctx.translate(X + s.width, Y); ctx.scale(-1, 1); ctx.drawImage(s, 0, 0); ctx.restore(); } else ctx.drawImage(s, X, Y);
    }
    for (const d of S.poeira) { ctx.globalAlpha = 0.5 * (1 - d.t / 0.4); R(d.x - cx + d.vx * d.t, d.y - cy - d.t * 10, 2, 2, '#e8e0d0'); }
    ctx.globalAlpha = 1;
    // Partículas do ambiente.
    if (!red) for (let i = 0; i < 14; i++) {
      const ph = S.t * 0.4 + i * 1.7;
      if (m.tema === 'vila') { const X = ((i * 97 + S.t * 14) % (W + 40)) - 20, Y = (i * 53 % H) + Math.sin(ph * 4) * 8; R(X, Y, 2, 1, i % 2 ? '#ff9ac1' : '#f5ff3d'); R(X + (Math.sin(ph * 20) > 0 ? 2 : -1), Y - 1, 1, 1, '#fff'); }
      else if (m.tema === 'floresta') { const X = (i * 71 + Math.sin(ph) * 20) % W, Y = ((i * 43 + S.t * 12) % (H + 20)) - 10; R(X, Y, 2, 1, i % 3 ? '#3de07a' : '#d4a017'); if (Math.sin(S.t * 2 + i) > 0.6) R((i * 131) % W, (i * 89) % H, 1, 1, '#f5ff3d'); }
      else { const X = (i * 83) % W, Y = H - ((i * 61 + S.t * 20) % (H + 10)); R(X + Math.sin(ph * 3) * 3, Y, 1, 2, i % 2 ? '#2be9ff' : '#ff2f8e'); }
    }
    ctx.drawImage(luzDe(m.tema), 0, 0);
    if (!S.conversa) {
      const n = moradorPerto();
      if (n) texto('!', n.x * 16 + 5 - cx, n.y * 16 - 16 - cy + Math.round(Math.sin(S.t * 6)), '#fff');
      else if (placaPerto()) texto('!', p.px - 3 - cx, p.py - 30 - cy, '#fff');
    }
    if (S.banner) {
      const t = S.banner.t, a = t < 0.3 ? t / 0.3 : Math.max(0, 1 - (t - 1.8) / 0.7), y = Math.round(H * 0.2), desliza = Math.round((1 - Math.min(1, t / 0.35)) * -40);
      ctx.globalAlpha = a; ctx.font = "8px 'Press Start 2P', monospace";
      const w = Math.ceil(ctx.measureText(S.banner.texto).width) + 20, x = Math.round(W / 2 - w / 2) + desliza;
      R(x - 2, y - 7, w + 4, 22, '#000'); R(x, y - 5, w, 18, '#140c2c'); R(x, y - 5, w, 1, '#f5ff3d'); R(x, y + 12, w, 1, '#f5ff3d');
      texto(S.banner.texto, W / 2 + desliza, y, '#fff', 'center'); ctx.globalAlpha = 1;
    }
  }

  // ---------- API ----------
  return {
    get ativo() { return S.ativo || S.menu; },
    temSave: () => !!carregar(),
    resumo() { const s = carregar(); return s ? `LV ${1 + s.libertos.length} · ♪${s.libertos.length}/${CHEFES.length}` : ''; },
    novoJogo(opts = {}) {
      jogo = novoJogo(); salvar();
      entrar();
      if (!opts.pularIntro) conversar(INTRO);
    },
    continuar() { jogo = carregar() || novoJogo(); entrar(); },
    /** Volta da luta; `libertado` = id do chefe vencido (ou null se perdeu/desistiu). */
    retomar(libertado) {
      if (!jogo) jogo = carregar() || novoJogo();
      entrar();
      if (!libertado || jogo.libertos.includes(libertado)) return;
      jogo.libertos.push(libertado);
      const b = bosses.get(libertado);
      const linhas = [['narr', `VOCÊ RECEBEU A NOTA-SEMENTE DE ${b.nome.toUpperCase()}!`], ['narr', `LV ${nivel()} · HP MÁXIMO ${hpMax()}`]];
      if (chefe(libertado).final) {
        jogo.final = true;
        if (!jogo.diario.includes('final')) jogo.diario.push('final');
        linhas.push(...FINAL);
      }
      salvar(); atualizarHud();
      deps.som({ tipo: 'vitoria' });
      conversar(linhas, () => { if (jogo.final) deps.tocarMusica('final'); });
    },
    esconder() { S.ativo = false; S.menu = false; setUi(false); },
    update,
    abrirMenu, fecharMenu, abrirDiario, abrirAmuletos,
    salvarESair() { salvar(); S.ativo = false; S.menu = false; setUi(false); deps.sair(); }
  };
}
