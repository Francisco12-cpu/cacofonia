import { buildChoreographyFromMelody } from '../../engine/battle/choreography.js';
import { createSongPlayer } from '../../engine/audio/songPlayer.js';
import { notaNaEscala } from '../../engine/songs/schema.js';
import { carregarMelodias, salvarMelodia, songComMelodiaDoJogador, notaDeMelodiaValida } from './customSongs.js';
import { ler, gravar } from '../storage.js';

const CHARTS_KEY = 'cacofonia-charts';
function loadCharts() { const c = ler(CHARTS_KEY, {}); return c && typeof c === 'object' ? c : {}; }
function saveCharts(charts) { gravar(CHARTS_KEY, charts); }

const NOMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function alturaDe(nota) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(nota);
  return NI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3]) * 12;
}
function nomeDe(altura) { return NOMES[((altura % 12) + 12) % 12] + Math.floor(altura / 12); }

let abortAnterior = null;
let ultimoBossIdx = 0; // volta ao mesmo chefe depois de "TESTAR"

/**
 * Editor de coreografia + composição (seção 5). Duas áreas:
 *  - Piano roll da melodia (faixa de cima): tocar numa linha ADICIONA uma
 *    nota à melodia (só alturas dentro do tom/escala — trava de escala) e já
 *    toca o som; tocar numa nota existente apaga. A melodia vai para a
 *    música final da batalha (game/editor/customSongs.js).
 *  - Coreografia (5 pistas de baixo): associa um tipo de nota (da tabela
 *    orientada a dados) a cada posição — o que decide o que aparece na
 *    batalha. Testar a luta direto do editor e exportar/importar em JSON
 *    são mantidos do protótipo, adaptados ao novo esquema.
 */
export function openEditor({ $, songs, bosses, noteTypes, synths, lista, onExit, onTest }) {
  // Reabrir o editor não pode acumular ouvintes (antes, cada abertura somava
  // mais um, e um toque punha e tirava a mesma nota).
  if (abortAnterior) abortAnterior.abort();
  const abort = new AbortController(); abortAnterior = abort;
  const sinal = { signal: abort.signal };

  const charts = loadCharts();
  const bossList = lista || bosses.all();
  const state = { bossIdx: Math.min(ultimoBossIdx, bossList.length - 1), scroll: 0, ppb: 46, tool: noteTypes.ids()[0], playing: false, ev: [], melodia: [], linhas: [] };

  /** Evento de coreografia bem formado: um tipo inválido derrubaria o editor e a luta (noteTypes.get lança erro). */
  const eventoValido = (o) => !!o && Number.isFinite(o.beat) && o.beat >= 0 && noteTypes.has(o.type)
    && Array.isArray(o.lanes) && o.lanes.length > 0 && o.lanes.every((l) => Number.isInteger(l) && l >= 0 && l <= 4)
    && (o.len === undefined || (Number.isFinite(o.len) && o.len >= 0));

  const cv = $('edCv');
  const ctx = cv.getContext('2d');

  function currentBoss() { return bossList[state.bossIdx]; }
  function songOriginal() { return songs.get(currentBoss().musica); }
  function currentSong() { return { ...songOriginal(), trilhas: { ...songOriginal().trilhas, melodia: state.melodia } }; }

  function load() {
    ultimoBossIdx = state.bossIdx;
    const boss = currentBoss();
    state.melodia = songComMelodiaDoJogador(songOriginal()).trilhas.melodia.map((e) => ({ ...e }));
    // Coreografia salva corrompida (ex.: importada de uma versão antiga) é ignorada em vez de travar o editor.
    const custom = Array.isArray(charts[boss.id]) && charts[boss.id].every(eventoValido) ? charts[boss.id] : null;
    state.ev = (custom || buildChoreographyFromMelody(currentSong(), noteTypes)).map((o) => ({ ...o, lanes: o.lanes.slice() }));
    state.custom = !!custom;
    montarLinhas();
    labels();
    draw();
  }

  /** Linhas do piano roll: as alturas da escala no alcance da melodia (+ qualquer nota cromática que já exista). */
  function montarLinhas() {
    const song = songOriginal();
    const alturas = [...songOriginal().trilhas.melodia, ...state.melodia].map((e) => alturaDe(e.nota));
    const lo = Math.min(...alturas) - 2, hi = Math.max(...alturas) + 2;
    const presentes = new Set(state.melodia.map((e) => alturaDe(e.nota)));
    state.linhas = [];
    for (let a = hi; a >= lo; a--) {
      const naEscala = notaNaEscala(nomeDe(a), song.tom, song.escala);
      if (naEscala || presentes.has(a)) state.linhas.push({ altura: a, nome: nomeDe(a), naEscala });
    }
  }

  function persistChart() {
    charts[currentBoss().id] = state.ev.map((o) => ({ beat: o.beat, lanes: o.lanes, type: o.type, len: o.len, nota: o.nota }));
    state.custom = true;
    saveCharts(charts);
    labels();
  }

  function persistMelodia() {
    state.melodia.sort((a, b) => a.pos - b.pos);
    salvarMelodia(songOriginal().id, state.melodia);
    // Coreografia ainda não editada à mão acompanha a melodia automaticamente.
    if (!state.custom) state.ev = buildChoreographyFromMelody(currentSong(), noteTypes);
    labels();
  }

  function labels() {
    const song = songOriginal();
    $('edBoss').textContent = currentBoss().nome;
    $('edTrack').textContent = 'GERAR DA MELODIA';
    $('edTool').textContent = 'FERRAMENTA: ' + noteTypes.get(state.tool).nome.toUpperCase();
    $('edTool').style.borderColor = noteTypes.get(state.tool).cor;
    $('edPlay').textContent = state.playing ? '■ PARAR' : '▶ OUVIR';
    $('edInfo').textContent = `${song.tom} ${song.escala.toUpperCase()} · ${song.bpm} BPM${carregarMelodias()[song.id] ? ' · MELODIA SUA' : ''}${state.custom ? ' · COREOGRAFIA SUA' : ''}`;
  }

  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function geo() {
    const w = cv.clientWidth, h = cv.clientHeight, top = Math.round(h * 0.42);
    return { w, h, top, lh: (h - top - 6) / 5, x0: 34, rh: (top - 4) / Math.max(1, state.linhas.length) };
  }
  function beatX(g, b) { return g.x0 + (b - state.scroll) * state.ppb; }

  function draw() {
    const g = geo(); if (!g.w) return;
    const song = songOriginal(), L = song.comprimentoBatidas;
    ctx.fillStyle = '#0b0714'; ctx.fillRect(0, 0, g.w, g.h);

    // Piano roll: linhas por altura (fora da escala = mais escuras, só para apagar).
    ctx.font = "6px 'Press Start 2P', monospace"; ctx.textBaseline = 'middle';
    state.linhas.forEach((ln, i) => {
      const y = 2 + i * g.rh;
      ctx.fillStyle = !ln.naEscala ? '#07040e' : ln.altura % 12 === alturaDe(song.tom.replace('m', '') + '0') % 12 ? '#1d1440' : i % 2 ? '#120c24' : '#150f2c';
      ctx.fillRect(g.x0, y, g.w, g.rh);
      if (g.rh >= 7) { ctx.fillStyle = ln.naEscala ? '#8f88b8' : '#4a4466'; ctx.fillText(ln.nome, 2, y + g.rh / 2); }
    });

    for (let q = Math.floor(state.scroll * 4) / 4; q <= Math.min(L, state.scroll + (g.w - g.x0) / state.ppb + 1); q += 0.25) {
      const x = Math.round(beatX(g, q)) + 0.5, bar = Number.isInteger(q / 4), beat = Number.isInteger(q);
      ctx.strokeStyle = bar ? '#5a5090' : beat ? '#2e2850' : '#1a1530'; ctx.lineWidth = bar ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, g.h); ctx.stroke();
    }
    // Fim da volta.
    const xf = beatX(g, L); if (xf < g.w) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(xf, 0, g.w - xf, g.h); }

    for (const e of state.melodia) {
      const x = beatX(g, e.pos); if (x > g.w || x < -60) continue;
      const i = state.linhas.findIndex((ln) => ln.altura === alturaDe(e.nota)); if (i < 0) continue;
      const y = 2 + i * g.rh;
      ctx.fillStyle = '#000'; ctx.fillRect(x, y + 1, Math.max(4, e.duracao * state.ppb - 1), Math.max(3, g.rh - 1));
      ctx.fillStyle = '#ffc300'; ctx.fillRect(x + 1, y + 1, Math.max(3, e.duracao * state.ppb - 3), Math.max(2, g.rh - 3));
    }

    ctx.fillStyle = '#2be9ff'; ctx.fillRect(0, g.top - 2, g.w, 2);
    for (let l = 0; l < 5; l++) {
      const y = g.top + l * g.lh;
      ctx.fillStyle = l % 2 ? 'rgba(15,10,30,0.85)' : 'rgba(20,14,40,0.85)'; ctx.fillRect(g.x0, y, g.w, g.lh);
      ctx.fillStyle = '#8f88b8'; ctx.font = "7px 'Press Start 2P', monospace"; ctx.fillText(String(l + 1), 10, y + g.lh / 2);
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

    if (state.playing && state._player) {
      const b = ((state._player.nowBeat() % L) + L) % L, x = Math.round(beatX(g, b));
      ctx.fillStyle = '#f5ff3d'; ctx.fillRect(x - 1, 0, 2, g.h);
    }
  }

  function playStop() {
    state.playing = !state.playing;
    if (state.playing) {
      state._player = createSongPlayer(synths, currentSong(), {});
      state._player.start();
      const loop = () => {
        if (!state.playing || abort.signal.aborted) return;
        const g = geo(), L = songOriginal().comprimentoBatidas;
        const b = ((state._player.nowBeat() % L) + L) % L, vis = (g.w - g.x0) / state.ppb;
        if (b < state.scroll || b > state.scroll + vis * 0.85) state.scroll = Math.max(0, b - vis * 0.1);
        draw(); requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } else if (state._player) { state._player.stop(); state._player = null; }
    labels(); draw();
  }

  function tocarMelodia(x, y, g) {
    const beat = Math.round((state.scroll + (x - g.x0) / state.ppb) * 4) / 4;
    if (beat < 0 || beat >= songOriginal().comprimentoBatidas) return;
    const ln = state.linhas[Math.floor((y - 2) / g.rh)]; if (!ln) return;
    const i = state.melodia.findIndex((e) => alturaDe(e.nota) === ln.altura && beat >= e.pos - 0.01 && beat < e.pos + e.duracao - 0.01);
    if (i >= 0) state.melodia.splice(i, 1);
    else {
      if (!ln.naEscala) return; // trava de escala (seção 3.3)
      state.melodia.push({ pos: beat, nota: ln.nome, duracao: 0.5 });
      synths.lead.triggerAttackRelease(ln.nome, 0.25);
    }
    persistMelodia();
    draw();
  }

  function tocarCoreografia(x, y, g) {
    const L = songOriginal().comprimentoBatidas;
    const beat = Math.round((state.scroll + (x - g.x0) / state.ppb) * 4) / 4;
    if (beat < 0 || beat >= L) return;
    const lane = Math.max(0, Math.min(4, Math.floor((y - g.top) / g.lh)));
    const i = state.ev.findIndex((o) => Math.abs(o.beat - beat) < 0.01 && o.lanes.includes(lane));
    if (i >= 0) {
      if (state.ev[i].type === state.tool) state.ev.splice(i, 1);
      else state.ev[i] = { ...state.ev[i], type: state.tool, lanes: [lane], len: noteTypes.get(state.tool).duracaoVariavel ? 1 : 0 };
    } else {
      const nota = state.melodia.find((e) => Math.abs(e.pos - beat) < 0.01)?.nota;
      state.ev.push({ beat, lanes: [lane], type: state.tool, len: noteTypes.get(state.tool).duracaoVariavel ? 1 : 0, ...(nota ? { nota } : {}) });
      synths.fx.triggerAttackRelease('C6', 0.05);
    }
    state.ev.sort((a, b) => a.beat - b.beat);
    persistChart();
    draw();
  }

  let edP = null;
  cv.addEventListener('pointerdown', (e) => {
    edP = { x: e.clientX, y: e.clientY, s: state.scroll, drag: false };
    cv.setPointerCapture(e.pointerId);
  }, sinal);
  cv.addEventListener('pointermove', (e) => {
    if (!edP) return;
    const dx = e.clientX - edP.x;
    if (Math.abs(dx) > 8) edP.drag = true;
    if (edP.drag) { state.scroll = Math.max(0, Math.min(songOriginal().comprimentoBatidas, edP.s - dx / state.ppb)); draw(); }
  }, sinal);
  cv.addEventListener('pointerup', (e) => {
    if (!edP) return;
    const wasDrag = edP.drag; edP = null;
    if (wasDrag) return;
    const r = cv.getBoundingClientRect(), g = geo(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < g.x0) return;
    if (y < g.top - 2) tocarMelodia(x, y, g); else tocarCoreografia(x, y, g);
  }, sinal);
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey) { state.ppb = Math.max(18, Math.min(120, state.ppb * (e.deltaY < 0 ? 1.1 : 0.9))); draw(); return; }
    state.scroll = Math.max(0, Math.min(songOriginal().comprimentoBatidas, state.scroll + (e.deltaY + e.deltaX) / state.ppb));
    draw();
  }, { passive: false, signal: abort.signal });

  $('edBoss').onclick = () => { state.bossIdx = (state.bossIdx + 1) % bossList.length; state.scroll = 0; if (state.playing) playStop(); load(); };
  $('edTool').onclick = () => { const ids = noteTypes.ids(); state.tool = ids[(ids.indexOf(state.tool) + 1) % ids.length]; labels(); };
  $('edTrack').onclick = () => { state.ev = buildChoreographyFromMelody(currentSong(), noteTypes); persistChart(); draw(); };
  $('edPlay').onclick = playStop;
  $('edClear').onclick = () => { state.ev = []; persistChart(); draw(); };
  $('edReset').onclick = () => {
    if (!confirm('Voltar a melodia e a coreografia deste chefe para as originais?')) return;
    if (state.playing) playStop();
    salvarMelodia(songOriginal().id, null);
    delete charts[currentBoss().id]; saveCharts(charts);
    load();
  };
  $('edTest').onclick = () => { persistChart(); if (state.playing) playStop(); onTest(currentBoss().id, state.ev.map((o) => ({ ...o, lanes: o.lanes.slice() }))); };
  $('edExp').onclick = () => {
    const data = JSON.stringify({ boss: currentBoss().id, chart: state.ev, melodia: state.melodia });
    if (navigator.clipboard) navigator.clipboard.writeText(data).then(() => alert('Coreografia copiada!'), () => prompt('Copie:', data));
    else prompt('Copie:', data);
  };
  $('edImp').onclick = () => {
    const t = prompt('Cole aqui a coreografia exportada:'); if (!t) return;
    try {
      const d = JSON.parse(t);
      const idx = bossList.findIndex((b) => b.id === d.boss);
      if (idx < 0 || !Array.isArray(d.chart) || !d.chart.every(eventoValido)) throw new Error('formato inválido');
      if (d.melodia !== undefined && (!Array.isArray(d.melodia) || !d.melodia.every(notaDeMelodiaValida))) throw new Error('melodia inválida');
      if (state.playing) playStop();
      state.bossIdx = idx;
      charts[d.boss] = d.chart.map((o) => ({ beat: o.beat, lanes: o.lanes.slice(), type: o.type, len: o.len || 0, ...(typeof o.nota === 'string' ? { nota: o.nota } : {}) }));
      saveCharts(charts);
      if (Array.isArray(d.melodia)) salvarMelodia(songs.get(bossList[idx].musica).id, d.melodia);
      load();
    } catch { alert('Não consegui ler essa coreografia.'); }
  };
  $('edExit').onclick = () => { if (state.playing) playStop(); abort.abort(); onExit(); };
  window.addEventListener('resize', () => { size(); draw(); }, sinal);

  requestAnimationFrame(() => { size(); load(); });
}
