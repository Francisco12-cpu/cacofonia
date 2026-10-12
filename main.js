import '@fontsource/press-start-2p/400.css';
import { loadNoteTypeRegistry } from './engine/notes/loadFromContent.js';
import { loadSongRegistry } from './engine/songs/loadFromContent.js';
import { loadBossRegistry } from './engine/bosses/loadFromContent.js';
import { createEffectRegistry } from './engine/effects/plugins.js';
import { InputManager } from './engine/input/InputManager.js';
import { sprite, spriteUrl } from './engine/render2d/sprites.js';
import { calcularNota, melhorNota } from './engine/battle/nota.js';
import { BattleController } from './game/battle/BattleController.js';
import { songComMelodiaDoJogador } from './game/editor/customSongs.js';
import { MenuBg } from './game/ui/menuBg.js';
import { criarTransicao } from './game/ui/transicao.js';
import { createWorld } from './game/world/World.js';
import { CHEFES } from './game/world/dados.js';
import { ler, gravar } from './game/storage.js';

const $ = (id) => document.getElementById(id);

// ---------- conteúdo ----------
const noteTypes = loadNoteTypeRegistry();
const effects = createEffectRegistry();
const songs = loadSongRegistry();
const bosses = loadBossRegistry({ songRegistry: songs, effectRegistry: effects });
/** Chefes na ordem da jornada (vila → floresta → cidadela), não na ordem dos arquivos. */
const ORDEM = CHEFES.map((c) => c.id);
const posicao = (id) => { const i = ORDEM.indexOf(id); return i < 0 ? ORDEM.length : i; };
const chefesEmOrdem = () => bosses.all().slice().sort((a, b) => posicao(a.id) - posicao(b.id));

// ---------- ajustes ----------
const PADRAO = { dificuldade: 'normal', reducedFx: false, vol: 80, crt: true, vibra: true };
const settings = { ...PADRAO, ...ler('cacofonia-set', {}) };
function saveSettings() { gravar('cacofonia-set', settings); }
function applyVolume() { Tone.getDestination().volume.value = settings.vol <= 0 ? -Infinity : 20 * Math.log10(settings.vol / 100); }
function applyCrt() { $('crt').classList.toggle('hidden', !settings.crt); }
applyCrt();

const RECORDES_KEY = 'cacofonia-recordes';
const recordes = ler(RECORDES_KEY, {});

// ---------- entrada ----------
const input = new InputManager();

// ---------- telas ----------
const SCREENS = ['sTitle', 'sAdv', 'sBossSelect', 'sSettings', 'sCredits', 'sPause', 'sWin', 'sLose', 'sErr', 'sEditor', 'sDialog', 'sWorldMenu', 'sDiary', 'sCharms'];
let telaAtual = null;
function itensDaTela() {
  if (!telaAtual) return [];
  return [...$(telaAtual).querySelectorAll('.opt, .row input')].filter((el) => el.offsetParent !== null && !el.closest('.hidden'));
}
function screen(id) {
  // Tira o foco do botão que abriu a tela: senão ESPAÇO/ENTER (pular/coletar) o "clicariam" de novo.
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  if (id === 'sSettings') preencherAjustes();
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
  telaAtual = id;
  if (id) {
    let i = 0;
    for (const o of $(id).querySelectorAll('.opt,.row')) o.style.setProperty('--d', i++);
    // Teclado/controle: já foca a primeira opção (no toque não, para não aparecer o realce).
    if (input.device() !== 'toque') {
      const primeiro = $(id).querySelector('.opt.primary:not(.hidden)') || itensDaTela()[0];
      if (primeiro && primeiro.offsetParent !== null) primeiro.focus({ preventScroll: true });
    }
  }
}
const transicao = criarTransicao($('trans'), { reduzido: () => settings.reducedFx });
const irPara = (id, antes) => transicao(() => { if (antes) antes(); if (id !== undefined) screen(id); });

$('tLogo').innerHTML = 'CACOFONIA'.split('').map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');

// ---------- créditos ----------
$('creditsRoll').innerHTML = [
  '<p class="cr-h">CRIAÇÃO, DESIGN E DIREÇÃO</p><p class="cr-n">FRANCISCO AUDIR</p><p class="cr-s"><a href="https://instagram.com/filho.af" target="_blank" rel="noopener">@filho.af</a></p>',
  '<p class="cr-h">PROGRAMAÇÃO</p><p class="cr-n">Francisco Audir</p><p class="cr-s">com assistência do Claude (Anthropic)</p>',
  `<p class="cr-h">MÚSICA</p>${songs.all().map((s) => `<p class="cr-s">${s.credito}</p>`).join('')}`,
  '<p class="cr-h">FONTE</p><p class="cr-s">Press Start 2P — CodeMan38 (SIL Open Font License)</p>',
  '<p class="cr-h">TECNOLOGIA</p><p class="cr-n">Tone.js · Three.js · Vite</p>',
  '<p class="cr-h">OBRIGADO POR JOGAR!</p><p class="cr-n">♪ ♪ ♪</p>'
].join('');

// ---------- áudio ----------
/** Tone.js (o maior pedaço do bundle) só é baixado no primeiro toque — o título abre bem mais rápido. */
let Tone = null, createSongPlayer = null;
let synths = null, sfx = null, audioReady = false, audioPromise = null;
function ensureAudio() {
  // Guarda a promessa: dois toques rápidos ("clique + Enter") criavam dois conjuntos de sintetizadores.
  audioPromise ??= (async () => {
    const [tone, synthMod, playerMod, sfxMod] = await Promise.all([
      import('tone'), import('./engine/audio/synths.js'), import('./engine/audio/songPlayer.js'), import('./engine/audio/sfx.js')
    ]);
    Tone = tone; createSongPlayer = playerMod.createSongPlayer;
    await Tone.start();
    synths = synthMod.createSynthRig();
    sfx = sfxMod.createSfx(synths);
    applyVolume();
    audioReady = true;
  })().catch((e) => { audioPromise = null; throw e; });
  return audioPromise;
}
const blip = (nota = 'E6', dur = 0.02) => { if (synths) synths.fx.triggerAttackRelease(nota, dur, Tone.now() + 0.005); };

/** Música dos menus e do mundo (a batalha tem o próprio player). */
let musica = null;
function tocarMusica(id, opts = {}) {
  if (!audioReady || !songs.has(id)) return;
  if (musica && musica.id === id) return;
  pararMusica();
  const song = songs.get(id);
  musica = { id, bpm: song.bpm, player: createSongPlayer(synths, song, opts) };
  musica.player.start();
}
function pararMusica() { if (musica) { musica.player.stop(); musica = null; } }

// ---------- navegação de menu (teclado e controle) ----------
function navegar(d) {
  const itens = itensDaTela(); if (!itens.length) return;
  const atual = itens.indexOf(document.activeElement);
  const prox = itens[(atual + d + itens.length) % itens.length];
  prox.focus(); prox.scrollIntoView({ block: 'nearest' }); blip();
}
const emMenu = () => !!telaAtual && telaAtual !== 'sEditor' && telaAtual !== 'sDialog' && $('trans').classList.contains('hidden');
input.on('navUp', () => { if (emMenu()) navegar(-1); });
input.on('navDown', () => { if (emMenu()) navegar(1); });
for (const [ev, d] of [['navLeft', -1], ['navRight', 1]]) input.on(ev, () => {
  const el = document.activeElement;
  if (emMenu() && el && el.type === 'range') { el.value = +el.value + d * 10; el.dispatchEvent(new Event('input')); }
});
input.on('confirm', () => { if (emMenu() && itensDaTela().includes(document.activeElement)) document.activeElement.click(); });
input.on('back', () => {
  if (!emMenu() || telaAtual === 'sTitle') return;
  const alvo = $(telaAtual).dataset.back; if (alvo) $(alvo).click();
});
document.addEventListener('pointerover', (e) => { const o = e.target.closest && e.target.closest('.opt'); if (o && o !== document.activeElement) blip('E6', 0.015); });
document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.opt')) blip('C6', 0.03); }, true);

// ---------- título ----------
async function comecar() {
  await ensureAudio();
  $('tPress').classList.add('hidden'); $('tMain').classList.remove('hidden');
  tocarMusica('titulo');
  atualizarTitulo();
  screen('sTitle');
}
const aguardandoInicio = () => telaAtual === 'sTitle' && !$('tPress').classList.contains('hidden');
$('tPress').onclick = comecar;
input.on('confirm', () => { if (aguardandoInicio()) comecar(); });
window.addEventListener('keydown', (e) => { if (aguardandoInicio() && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); comecar(); } });

function atualizarTitulo() { $('tAdvInfo').textContent = mundo.temSave() ? mundo.resumo() : 'NOVO'; }
function voltarAoTitulo() {
  gameState = 'menu'; origem = 'menu';
  menuBg.destaque('#ff2f8e'); tocarMusica('titulo'); atualizarTitulo();
  $('menuBg').classList.remove('hidden');
  screen('sTitle');
}

$('tAdv').onclick = () => {
  if (!mundo.temSave()) { irPara(undefined, () => mundo.novoJogo()); return; }
  $('advInfo').textContent = mundo.resumo();
  screen('sAdv');
};
$('advCont').onclick = () => irPara(undefined, () => mundo.continuar());
$('advNew').onclick = () => irPara(undefined, () => mundo.novoJogo());
$('advBack').onclick = () => screen('sTitle');
$('tPlay').onclick = () => { renderBossList(); screen('sBossSelect'); };
$('tEdit').onclick = () => irPara(undefined, openEditorScreen);
$('tCred').onclick = () => screen('sCredits');
$('crBack').onclick = () => screen('sTitle');
function preencherAjustes() {
  $('sDiffV').textContent = settings.dificuldade.toUpperCase();
  $('sRed').checked = settings.reducedFx; $('sCrt').checked = settings.crt; $('sVib').checked = settings.vibra;
  $('sVol').value = settings.vol;
}
$('tSet').onclick = () => screen('sSettings');
$('sBack').onclick = () => screen('sTitle');
const DIFFS = ['facil', 'normal', 'dificil'];
$('sDiff').onclick = () => { settings.dificuldade = DIFFS[(DIFFS.indexOf(settings.dificuldade) + 1) % DIFFS.length]; $('sDiffV').textContent = settings.dificuldade.toUpperCase(); saveSettings(); };
$('sRed').onchange = (e) => { settings.reducedFx = e.target.checked; menuBg.reduzido = settings.reducedFx; saveSettings(); };
$('sCrt').onchange = (e) => { settings.crt = e.target.checked; applyCrt(); saveSettings(); };
$('sVib').onchange = (e) => { settings.vibra = e.target.checked; if (settings.vibra && navigator.vibrate) navigator.vibrate(40); saveSettings(); };
$('sVol').oninput = (e) => { settings.vol = +e.target.value; if (synths) applyVolume(); };
$('sVol').onchange = () => saveSettings(); // salva ao soltar, não a cada passo do arraste
$('sFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); };
$('bsBack').onclick = () => { menuBg.destaque('#ff2f8e'); tocarMusica('titulo'); screen('sTitle'); };
$('errOk').onclick = () => voltarAoTitulo();

// ---------- seleção de chefe ----------
const TIER = { 1: '★', 2: '★★', 3: '★★★' };
const EFEITO_NOME = { 'camera-giro': 'CÂMERA GIRA', apagao: 'APAGÃO', espelho: 'ESPELHO', reflexo: 'REFLEXO', terremoto: 'TERREMOTO', 'drop-flash': 'DROP', 'avanco-rapido': 'ENXAME', vitral: 'VITRAL', silencio: 'SILÊNCIO' };
let previa = null;
function mostrarCartao(boss) {
  const pc = $('bcPortrait'), spr = sprite(boss.sprite);
  pc.width = spr.width; pc.height = spr.height;
  pc.getContext('2d').clearRect(0, 0, pc.width, pc.height); pc.getContext('2d').drawImage(spr, 0, 0);
  $('bossCard').style.setProperty('--boss', boss.cor);
  $('bcName').textContent = boss.nome.toUpperCase();
  const song = songs.get(boss.musica);
  $('bcInfo').innerHTML = `HP <b>${boss.hpMax}</b> · NÍVEL <b>${TIER[boss.tier] || boss.tier}</b><br>EFEITO: <b>${boss.efeitosEspeciais.map((e) => EFEITO_NOME[e.tipo] || e.tipo).join(' + ')}</b><br>${song.bpm} BPM${song.bpmProgressao ? ' (acelera)' : ''}<br>RECORDE: <b>${recordes[boss.id] || '—'}</b>`;
  menuBg.destaque(boss.cor);
  clearTimeout(previa);
  previa = setTimeout(() => { if (telaAtual === 'sBossSelect') tocarMusica(boss.musica); }, 260);
}
function renderBossList() {
  const list = $('bossList'); list.innerHTML = '';
  for (const boss of chefesEmOrdem()) {
    const b = document.createElement('button');
    b.className = 'opt boss-opt';
    b.style.setProperty('--boss', boss.cor);
    const img = document.createElement('img');
    img.className = 'boss-ico'; img.alt = ''; img.src = spriteUrl(boss.sprite);
    const nome = document.createElement('span'); nome.textContent = boss.nome;
    const rank = document.createElement('b'); rank.className = `rank ${recordes[boss.id] || ''}`; rank.textContent = recordes[boss.id] || '·';
    b.append(img, nome, rank);
    b.onclick = () => { origem = 'menu'; irPara(undefined, () => showIntro(boss.id)); };
    b.onfocus = () => mostrarCartao(boss);
    b.onpointerenter = () => mostrarCartao(boss);
    list.appendChild(b);
  }
  mostrarCartao(chefesEmOrdem()[0]);
}

// ---------- diálogo de entrada (falas.intro) ----------
let dialog = null;
function showIntro(bossId, chart = null, extras = {}) {
  const boss = bosses.get(bossId);
  const linhas = boss.falas.intro || [];
  if (!linhas.length) { startBattle(bossId, chart, extras); return; }
  pararMusica();
  const pc = $('dPortrait'), spr = sprite(boss.sprite);
  pc.width = spr.width; pc.height = spr.height;
  $('dName').textContent = boss.nome.toUpperCase();
  $('dName').style.color = boss.cor;
  $('sDialog').style.setProperty('--boss', boss.cor);
  $('menuBg').classList.remove('hidden');
  menuBg.destaque(boss.cor);
  dialog = { bossId, chart, extras, linhas, i: 0, t: 0, boss, n: 0 };
  gameState = 'dialog';
  screen('sDialog');
  drawDialog();
}
function drawDialog() {
  const d = dialog, txt = d.linhas[d.i];
  const n = Math.min(txt.length, Math.floor(d.t * 40));
  if (n !== d.n) { d.n = n; if (synths && n % 2 === 0 && txt[n - 1] && txt[n - 1] !== ' ') synths.voice.triggerAttackRelease(300 + (d.boss.id.length * 47) % 500, 0.03); }
  $('dText').textContent = txt.slice(0, n);
  $('dNext').classList.toggle('hidden', n < txt.length);
  const pc = $('dPortrait'), ctx = pc.getContext('2d');
  ctx.clearRect(0, 0, pc.width, pc.height);
  ctx.drawImage(sprite(d.boss.sprite, n < txt.length && Math.floor(d.t * 8) % 2 ? 'atk' : 'base'), 0, 0);
}
function iniciarLutaDoDialogo() { const { bossId, chart, extras } = dialog; dialog = null; transicao(() => startBattle(bossId, chart, extras)); }
function advanceDialog() {
  if (!dialog) return;
  const txt = dialog.linhas[dialog.i];
  if (Math.floor(dialog.t * 40) < txt.length) { dialog.t = 999; drawDialog(); return; }
  dialog.i++; dialog.t = 0; dialog.n = 0;
  if (dialog.i >= dialog.linhas.length) { iniciarLutaDoDialogo(); return; }
  drawDialog();
}
$('sDialog').onclick = advanceDialog;
$('dSkip').onclick = (e) => { e.stopPropagation(); if (dialog) iniciarLutaDoDialogo(); };
for (const acao of ['collect', 'jump']) input.on(acao, () => { if (gameState === 'dialog') advanceDialog(); });

// ---------- batalha ----------
let stage = null, view = null, battle = null, player = null, offInput = [];
let BattleView = null, Stage3D = null;
/** De onde a luta foi aberta: 'menu' (batalha livre), 'editor' (TESTAR) ou 'aventura' (mundo). */
let origem = 'menu', ultimaLuta = null;

const HINTS = {
  teclado: '<span class="kc">←</span><span class="kc">→</span> PISTA · <span class="kc">ESPAÇO</span> PULA · <span class="kc">↓</span> DESCE · <span class="kc">E</span> COLETA/RESPONDE · <span class="kc">ESC</span> PAUSA',
  toque: 'DESLIZE ⇆ PISTA · ⇡ PULA · ⇣ DESCE · BOTÃO VERDE COLETA/RESPONDE',
  controle: '<span class="gb gX">←</span><span class="gb gX">→</span> D-PAD · <span class="gb gA">A</span> PULA · <span class="gb gB">B</span> DESCE · <span class="gb gY">X</span> COLETA · <span class="gb gS">START</span> PAUSA'
};
const DEVICE = { teclado: ['teclado', 'TECLADO'], toque: ['toque', 'TOQUE'], controle: ['controle', 'CONTROLE'] };

function setBattleUi(visivel) {
  for (const id of ['stage', 'pauseBtn', 'atkBtn', 'hint', 'deviceIcon']) $(id).classList.toggle('hidden', !visivel);
  $('menuBg').classList.toggle('hidden', visivel);
}

/** O palco 3D (Three.js) só é carregado na primeira luta — o título abre bem mais rápido. */
async function carregarPalco() {
  if (stage) return true;
  ({ Stage3D } = await import('./game/battle/Stage3D.js'));
  ({ BattleView } = await import('./game/battle/BattleView.js'));
  try { stage = new Stage3D($('gl')); } catch (e) { console.error(e); return false; }
  view = new BattleView(stage, $('ui'));
  return true;
}

async function startBattle(bossId, chart = null, extras = {}) {
  await ensureAudio();
  if (!(await carregarPalco())) { screen('sErr'); return; }
  pararMusica();
  mundo.esconder();
  const boss = bosses.get(bossId);
  const song = songComMelodiaDoJogador(songs.get(boss.musica));
  stage.buildStageFor(boss);
  resizeStage();
  view.reset();
  view.reducedFx = settings.reducedFx;

  ultimaLuta = { bossId, chart, extras };
  battle = new BattleController({
    boss, song, noteTypes, effects, chart: chart || undefined, dificuldade: settings.dificuldade,
    amuletos: extras.amuletos || [], hpExtra: extras.hpExtra || 0
  });

  bindBattleInput();
  screen(null);
  setBattleUi(true);
  lastDevice = null; tempoNaLuta = 0;
  $('hint').classList.remove('fade');

  if (player) player.stop();
  player = createSongPlayer(synths, song, { countIn: 4, stepMul: battle.multiplicadorAceleracao() });
  player.start();
  paused = false;
  gameState = 'battle';
}

let battleTouchAttached = false;
function bindBattleInput() {
  for (const off of offInput) off();
  const ativo = () => gameState === 'battle' && !paused && battle && !battle.over;
  offInput = [
    input.on('moveLeft', () => ativo() && battle.moveLane(-1)),
    input.on('moveRight', () => ativo() && battle.moveLane(1)),
    input.on('jump', () => ativo() && battle.doJump()),
    input.on('dive', () => ativo() && battle.doDive()),
    input.on('collect', () => ativo() && battle.doCollect()),
    input.on('pause', () => togglePause())
  ];
  if (!battleTouchAttached) { input.attachBattleTouch($('stage')); battleTouchAttached = true; }
  $('atkBtn').onpointerdown = (e) => { e.preventDefault(); if (ativo()) battle.doCollect(); };
}

function resizeStage() { if (view) view.resize(window.innerWidth, window.innerHeight); }
window.addEventListener('resize', resizeStage);

let paused = false;
function togglePause() {
  if (gameState !== 'battle' || !battle || battle.over) return;
  if (telaAtual && telaAtual !== 'sPause') return;
  paused = !paused;
  if (paused) { Tone.Transport.pause(); screen('sPause'); } else { Tone.Transport.start('+0.1'); screen(null); }
}
$('pRes').onclick = togglePause;
// Aba escondida: o navegador para os quadros, mas a música seguia — na volta, todas as notas acertavam de uma vez.
document.addEventListener('visibilitychange', () => { if (document.hidden && gameState === 'battle' && !paused) togglePause(); });
$('pauseBtn').onclick = togglePause;
$('pRetry').onclick = () => { paused = false; if (player) player.stop(); const l = ultimaLuta; transicao(() => startBattle(l.bossId, l.chart, l.extras)); };
$('pQuit').onclick = () => { paused = false; if (player) player.stop(); transicao(() => { setBattleUi(false); voltarDaLuta(false); }); };

function voltarDaLuta(venceu) {
  gameState = 'menu';
  if (origem === 'editor') { openEditorScreen(); return; }
  if (origem === 'aventura') { screen(null); mundo.retomar(venceu ? ultimaLuta.bossId : null); return; }
  renderBossList(); screen('sBossSelect');
}

const DICAS = [
  'Notas graves vêm pela esquerda, agudas pela direita. Ouça antes de ver.',
  'O pulo só protege lá no alto: pule no tempo, não antes.',
  'PAREDES rosas não dá pra pular. Saia da pista!',
  'Colete as DOURADAS: sem melodia, sem Resposta — e sem dano no chefe.',
  'Na Resposta, aperte quando o losango passar pelo centro.',
  'Dá pra deixar o jogo mais fácil em AJUSTES › DIFICULDADE.',
  'Nota longa machuca enquanto você fica nela. Saia logo!'
];

function countUp(el, to, sufixo = '') {
  const t0 = performance.now();
  const f = () => { const k = Math.min(1, (performance.now() - t0) / 800); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + sufixo; if (k < 1) requestAnimationFrame(f); };
  f();
}

let resultado = null;
function onBattleEnd(venceu) {
  if (gameState !== 'battle') return;
  if (player) player.stop();
  gameState = 'resultado';
  const b = battle;
  transicao(() => {
    setBattleUi(false);
    menuBg.destaque(b.boss.cor);
    if (venceu) {
      const nota = calcularNota(b);
      const antes = recordes[b.boss.id];
      const novo = melhorNota(antes, nota.letra);
      const bateu = novo !== antes;
      if (bateu) { recordes[b.boss.id] = novo; gravar(RECORDES_KEY, recordes); }
      $('wGrade').textContent = nota.letra; $('wGrade').className = `grade ${nota.letra}`;
      $('wRecord').classList.toggle('hidden', !bateu || !antes);
      countUp($('wC'), b.maxCombo); countUp($('wDouradas'), b.stats.douradasColetadas);
      countUp($('wPrec'), Math.round(nota.precisao * 100), '%'); countUp($('wVida'), Math.round(nota.vida * 100), '%');
      const falas = b.boss.falas.vitoria || [];
      $('wFala').textContent = falas.length ? `"${falas.join(' ')}"` : '';
      $('wFala').style.color = b.boss.cor;
      resultado = { canvas: $('wPortrait'), id: b.boss.sprite, venceu: true, t: 0 };
      screen('sWin');
      tocarMusica('final');
    } else {
      $('lDica').textContent = 'DICA: ' + DICAS[Math.floor(Math.random() * DICAS.length)];
      resultado = { canvas: $('lPortrait'), id: 'eco_frente', venceu: false, t: 0 };
      screen('sLose');
    }
  });
}
$('winOk').onclick = () => { resultado = null; transicao(() => voltarDaLuta(true)); };
$('lRetry').onclick = () => { resultado = null; const l = ultimaLuta; transicao(() => startBattle(l.bossId, l.chart, l.extras)); };
$('lMap').onclick = () => { resultado = null; transicao(() => voltarDaLuta(false)); };

function desenharResultado(dt) {
  const r = resultado; r.t += dt;
  const frame = r.venceu ? (Math.floor(r.t * 2) % 2 ? 'respira' : 'base') : 'triste';
  const spr = sprite(r.id, frame);
  const c = r.canvas, ctx = c.getContext('2d');
  if (c.width !== spr.width + 8) { c.width = spr.width + 8; c.height = spr.height + 8; }
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(spr, 4, 4 + (r.venceu ? Math.round(Math.sin(r.t * 3)) : 0));
  if (r.venceu && !settings.reducedFx) {
    // Brilhos de "libertado" em volta do chefe.
    for (let i = 0; i < 6; i++) {
      const a = r.t * 1.5 + i * 1.05, x = Math.round(c.width / 2 + Math.cos(a) * (c.width / 2 - 2)), y = Math.round(c.height / 2 + Math.sin(a * 1.3) * (c.height / 2 - 2));
      ctx.fillStyle = i % 2 ? '#f5ff3d' : '#fff';
      ctx.fillRect(x, y - 1, 1, 3); ctx.fillRect(x - 1, y, 3, 1);
    }
  }
}

// ---------- editor ----------
async function openEditorScreen() {
  origem = 'menu';
  gameState = 'editor';
  pararMusica();
  screen('sEditor');
  const { openEditor } = await import('./game/editor/Editor.js');
  openEditor({
    $, songs, bosses, noteTypes, effects, synths, lista: chefesEmOrdem(),
    onExit: () => transicao(voltarAoTitulo),
    onTest: (bossId, chart) => { origem = 'editor'; transicao(() => startBattle(bossId, chart)); }
  });
}

// ---------- aventura (mundo aberto) ----------
const mundo = createWorld({
  $, input, bosses, songs, settings, screen, transicao,
  tocarMusica, pararMusica, som: (ev) => sfx && sfx.handle(ev), blip,
  lutar: (bossId, extras) => { origem = 'aventura'; transicao(() => showIntro(bossId, null, extras)); },
  sair: () => transicao(voltarAoTitulo)
});
$('wmBack').onclick = () => mundo.fecharMenu();
$('wmTitle').onclick = () => mundo.salvarESair();
$('wmDiary').onclick = () => mundo.abrirDiario();
$('wmCharms').onclick = () => mundo.abrirAmuletos();
$('dyBack').onclick = () => mundo.abrirMenu();
$('chBack').onclick = () => mundo.abrirMenu();

// ---------- laço principal ----------
const menuBg = new MenuBg($('menuBg'));
menuBg.reduzido = settings.reducedFx;
let gameState = 'menu';
let lastTs = 0, lastDevice = null, tempoNaLuta = 0;
function frame(ts) {
  // Agenda o próximo quadro antes: um erro aqui dentro congelava o jogo inteiro para sempre.
  requestAnimationFrame(frame);
  try { passo(ts); } catch (e) { console.error(e); }
}
function passo(ts) {
  const dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000);
  lastTs = ts;
  input.pollGamepad();
  if (gameState === 'dialog' && dialog) { dialog.t += dt; drawDialog(); }
  if (resultado) desenharResultado(dt);
  if (mundo.ativo) mundo.update(dt);
  else if (!$('menuBg').classList.contains('hidden')) {
    const kick = menuBg.render(dt, musica ? musica.player.nowBeat() : null, musica ? musica.bpm : 112);
    document.documentElement.style.setProperty('--b', kick.toFixed(2));
  }
  if (gameState === 'battle' && battle && !paused) {
    tempoNaLuta += dt;
    battle.update(player.nowBeat(), dt);
    for (const ev of battle.events) {
      if (sfx) sfx.handle(ev);
      view.onEvent(ev, battle);
      if (ev.tipo === 'dano' && settings.vibra && navigator.vibrate) navigator.vibrate(50);
    }
    battle.events.length = 0;
    view.render(battle, noteTypes, dt);
    updateHud();
    if (battle.over) {
      // Sequência final: o chefe pisca, perde a cor e afunda (ou Eco cai) antes da tela de resultado.
      if (!view.fim) { if (player) player.stop(); view.comecarFim(battle.vencedor); if (sfx) sfx.handle({ tipo: battle.vencedor ? 'vitoria' : 'derrota' }); }
      if (view.fim.t > (battle.vencedor ? 2.2 : 1.4)) onBattleEnd(battle.vencedor);
    }
  }
}
function updateHud() {
  const collecting = battle.podeColetar;
  $('atkBtn').classList.toggle('now', collecting || !!battle.responsePhase);
  const rotulo = battle.responsePhase ? 'RESPONDER' : (collecting ? 'AGORA!' : 'COLETAR');
  if ($('atkBtn').textContent !== rotulo) $('atkBtn').textContent = rotulo;
  if (tempoNaLuta > 8) $('hint').classList.add('fade');
  const dev = input.device();
  if (dev !== lastDevice) {
    lastDevice = dev;
    const [icone, nome] = DEVICE[dev] || DEVICE.teclado;
    $('deviceImg').src = spriteUrl(icone);
    $('deviceTxt').textContent = nome;
    $('hint').innerHTML = HINTS[dev] || HINTS.teclado;
  }
}

resizeStage();
screen('sTitle');
requestAnimationFrame(frame);

// Atalhos de desenvolvimento: ?demo=<chefe> abre a luta direto; ?tela=<id> abre uma tela (útil para testar e tirar prints).
const params = new URLSearchParams(location.search);
const demo = params.get('demo');
if (demo && bosses.has(demo)) ensureAudio().then(() => startBattle(demo));
const telaDemo = params.get('tela');
if (telaDemo) ensureAudio().then(async () => {
  await comecar();
  if (telaDemo === 'chefes') { renderBossList(); screen('sBossSelect'); }
  else if (telaDemo === 'mundo') mundo.novoJogo({ pularIntro: true });
  else if (SCREENS.includes(telaDemo)) screen(telaDemo);
});
