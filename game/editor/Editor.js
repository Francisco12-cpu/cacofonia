import { buildChoreographyFromMelody } from '../../engine/battle/choreography.js';
import { createSongPlayer } from '../../engine/audio/songPlayer.js';

const CHARTS_KEY = 'cacofonia-charts';
function loadCharts() { try { return JSON.parse(localStorage.getItem(CHARTS_KEY) || '{}'); } catch { return {}; } }
function saveCharts(charts) { localStorage.setItem(CHARTS_KEY, JSON.stringify(charts)); }

/**
 * Editor de coreografia + composição (seção 5). Duas ferramentas:
 *  - Trilha de melodia (tira de cima): tocar nela ADICIONA uma nota nova à
 *    melodia-fonte (com trava de escala) e já toca o som — "colocar uma
 *    nota na música-fonte já toca aquele som na música final".
 *  - Coreografia (5 pistas de baixo): associa um tipo de nota (da tabela
 *    orientada a dados) a cada posição — o que decide o que aparece na
 *    batalha. Testar a luta direto do editor e exportar/importar em JSON
 *    são mantidos do protótipo, adaptados ao novo esquema.
 */
export function openEditor({ $, songs, bosses, noteTypes, effects, synths, onExit, onTest }) {
  const charts = loadCharts();
  const bossList = bosses.all();
  const state = { bossIdx: 0, scroll: 0, ppb: 46, tool: noteTypes.ids()[0], playing: false, ev: [] };

  const cv = $('edCv');
  const ctx = cv.getContext('2d');

  function currentBoss() { return bossList[state.bossIdx]; }
  function currentSong() { return songs.get(currentBoss().musica); }

  function load() {
    const boss = currentBoss();
    const custom = charts[boss.id];
    state.ev = (custom || buildChoreographyFromMelody(currentSong(), noteTypes)).map((o) => ({ ...o, lanes: o.lanes.slice() }));
    state.custom = !!custom;
    labels();
    draw();
  }

  function persistChart() {
    charts[currentBoss().id] = state.ev.map((o) => ({ beat: o.beat, lanes: o.lanes, type: o.type, len: o.len, nota: o.nota }));
    state.custom = true;
    saveCharts(charts);
    labels();
  }

  function labels() {
    $('edBoss').textContent = currentBoss().nome;
    $('edTrack').textContent = 'MELODIA';
    $('edTool').textContent = 'FERRAMENTA: ' + noteTypes.get(state.tool).nome.toUpperCase();
    $('edTool').style.borderColor = noteTypes.get(state.tool).cor;
    $('edPlay').textContent = state.playing ? '■ PARAR' : '▶ OUVIR';
  }

  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function geo() {
    const w = cv.clientWidth, h = cv.clientHeight, top = Math.round(h * 0.3);
    return { w, h, top, lh: (h - top - 6) / 5, x0: 34 };
  }
  function beatX(g, b) { return g.x0 + (b - state.scroll) * state.ppb; }

  function draw() {
    const g = geo(); if (!g.w) return;
    const song = currentSong(), L = song.comprimentoBatidas;
    ctx.fillStyle = '#0b0714'; ctx.fillRect(0, 0, g.w, g.h);
    ctx.fillStyle = '#120c24'; ctx.fillRect(0, 0, g.w, g.top);

    for (let q = Math.floor(state.scroll * 4) / 4; q <= Math.min(L, state.scroll + (g.w - g.x0) / state.ppb + 1); q += 0.25) {
      const x = Math.round(beatX(g, q)) + 0.5, bar = Number.isInteger(q / 4), beat = Number.isInteger(q);
      ctx.strokeStyle = bar ? '#5a5090' : beat ? '#2e2850' : '#1a1530'; ctx.lineWidth = bar ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, g.h); ctx.stroke();
    }

    const melodia = song.trilhas.melodia;
    const pitches = [...new Set(melodia.map((e) => e.nota))];
    for (const e of melodia) {
      const x = beatX(g, e.pos); if (x > g.w || x < -60) continue;
      const y = g.top - 8 - (pitches.indexOf(e.nota) / Math.max(1, pitches.length - 1)) * (g.top - 22);
      ctx.fillStyle = '#8f88b8'; ctx.fillRect(x, y - 3, Math.max(3, e.duracao * state.ppb - 2), 5);
    }

    for (let l = 0; l < 5; l++) {
      const y = g.top + l * g.lh;
      ctx.fillStyle = l % 2 ? '#0f0a1e' : '#140e28'; ctx.fillRect(g.x0, y, g.w, g.lh);
      ctx.fillStyle = '#8f88b8'; ctx.font = "7px 'Press Start 2P', monospace"; ctx.fillText(String(l + 1), 10, y + g.lh / 2 + 3);
    }
    for (const o of state.ev) {
      const x = beatX(g, o.beat); if (x > g.w + 60 || x < -200) continue;
      const tipo = noteTypes.get(o.type);
      ctx.fillStyle = tipo.cor;
      const l0 = Math.min(...o.lanes), l1 = Math.max(...o.lanes), y = g.top + l0 * g.lh + 3, hh = (l1 - l0 + 1) * g.lh - 6;
      const w = (o.len && o.len > 0) ? Math.max(8, o.len * state.ppb) : Math.max(8, state.ppb * 0.22);
      if (tipo.coletavel) { ctx.beginPath(); ctx.arc(x + w / 2, y + hh / 2, Math.min(w, hh) / 2 + 2, 0, 7); ctx.fill(); }
      else ctx.fillRect(x, y, w, hh);
      if (tipo.altura === 'alta') { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, 2); }
    }
  }

  function playStop() {
    state.playing = !state.playing;
    if (state.playing) {
      state._player = createSongPlayer(synths, currentSong(), {});
      state._player.start();
    } else if (state._player) { state._player.stop(); state._player = null; }
    labels();
  }

  cv.addEventListener('pointerdown', (e) => {
    edP = { x: e.clientX, y: e.clientY, s: state.scroll, drag: false };
    cv.setPointerCapture(e.pointerId);
  });
  let edP = null;
  cv.addEventListener('pointermove', (e) => {
    if (!edP) return;
    const dx = e.clientX - edP.x;
    if (Math.abs(dx) > 8) edP.drag = true;
    if (edP.drag) { state.scroll = Math.max(0, Math.min(currentSong().comprimentoBatidas, edP.s - dx / state.ppb)); draw(); }
  });
  cv.addEventListener('pointerup', (e) => {
    if (!edP) return;
    const wasDrag = edP.drag; edP = null;
    if (wasDrag) return;
    const r = cv.getBoundingClientRect(), g = geo(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (y < g.top || x < g.x0) return;
    const song = currentSong(), L = song.comprimentoBatidas;
    const beat = Math.round((state.scroll + (x - g.x0) / state.ppb) * 4) / 4;
    if (beat < 0 || beat >= L) return;
    const lane = Math.max(0, Math.min(4, Math.floor((y - g.top) / g.lh)));
    const i = state.ev.findIndex((o) => Math.abs(o.beat - beat) < 0.01 && o.lanes.includes(lane));
    if (i >= 0) {
      if (state.ev[i].type === state.tool) state.ev.splice(i, 1);
      else state.ev[i] = { ...state.ev[i], type: state.tool, lanes: [lane], len: noteTypes.get(state.tool).duracaoVariavel ? 1 : 0 };
    } else {
      state.ev.push({ beat, lanes: [lane], type: state.tool, len: noteTypes.get(state.tool).duracaoVariavel ? 1 : 0 });
      synths.fx.triggerAttackRelease('C6', 0.05);
    }
    state.ev.sort((a, b) => a.beat - b.beat);
    persistChart();
    draw();
  });
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.scroll = Math.max(0, Math.min(currentSong().comprimentoBatidas, state.scroll + (e.deltaY + e.deltaX) / state.ppb));
    draw();
  }, { passive: false });

  $('edBoss').onclick = () => { state.bossIdx = (state.bossIdx + 1) % bossList.length; state.scroll = 0; if (state.playing) playStop(); load(); };
  $('edTool').onclick = () => { const ids = noteTypes.ids(); state.tool = ids[(ids.indexOf(state.tool) + 1) % ids.length]; labels(); };
  $('edPlay').onclick = playStop;
  $('edClear').onclick = () => { state.ev = []; persistChart(); draw(); };
  $('edTest').onclick = () => { persistChart(); if (state.playing) playStop(); onTest(currentBoss().id, state.ev.map((o) => ({ ...o, lanes: o.lanes.slice() }))); };
  $('edExp').onclick = () => {
    const data = JSON.stringify({ boss: currentBoss().id, chart: state.ev });
    if (navigator.clipboard) navigator.clipboard.writeText(data).then(() => alert('Coreografia copiada!'), () => prompt('Copie:', data));
    else prompt('Copie:', data);
  };
  $('edImp').onclick = () => {
    const t = prompt('Cole aqui a coreografia exportada:'); if (!t) return;
    try {
      const d = JSON.parse(t);
      const idx = bossList.findIndex((b) => b.id === d.boss);
      if (idx < 0 || !Array.isArray(d.chart)) throw new Error('formato inválido');
      state.bossIdx = idx; charts[d.boss] = d.chart; saveCharts(charts); load();
    } catch { alert('Não consegui ler essa coreografia.'); }
  };
  $('edExit').onclick = () => { if (state.playing) playStop(); onExit(); };
  window.addEventListener('resize', onResize);
  function onResize() { size(); draw(); }

  requestAnimationFrame(() => { size(); load(); });
}
