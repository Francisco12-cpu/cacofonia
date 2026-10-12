import * as Tone from 'tone';
import { loadNoteTypeRegistry } from './engine/notes/loadFromContent.js';
import { loadSongRegistry } from './engine/songs/loadFromContent.js';
import { loadBossRegistry } from './engine/bosses/loadFromContent.js';
import { createEffectRegistry } from './engine/effects/plugins.js';
import { createSynthRig } from './engine/audio/synths.js';
import { createSongPlayer } from './engine/audio/songPlayer.js';
import { createSfx } from './engine/audio/sfx.js';
import { InputManager } from './engine/input/InputManager.js';
import { getSpriteCache } from './engine/render2d/sprites.js';
import { Stage3D } from './game/battle/Stage3D.js';
import { BattleController } from './game/battle/BattleController.js';
import { BattleView } from './game/battle/BattleView.js';
import { openEditor } from './game/editor/Editor.js';
import { songComMelodiaDoJogador } from './game/editor/customSongs.js';

const $ = (id) => document.getElementById(id);

// ---------- conteúdo ----------
const noteTypes = loadNoteTypeRegistry();
const effects = createEffectRegistry();
const songs = loadSongRegistry();
const bosses = loadBossRegistry({ songRegistry: songs, effectRegistry: effects });

// ---------- ajustes ----------
function loadSettings() {
  try { return { dificuldade: 'normal', reducedFx: false, vol: 100, ...JSON.parse(localStorage.getItem('cacofonia-set') || '{}') }; }
  catch { return { dificuldade: 'normal', reducedFx: false, vol: 100 }; }
}
const settings = loadSettings();
function saveSettings() { localStorage.setItem('cacofonia-set', JSON.stringify(settings)); }
function applyVolume() { Tone.getDestination().volume.value = settings.vol <= 0 ? -Infinity : 20 * Math.log10(settings.vol / 100); }

// ---------- telas ----------
const SCREENS = ['sTitle', 'sBossSelect', 'sSettings', 'sCredits', 'sPause', 'sWin', 'sLose', 'sErr', 'sEditor', 'sDialog'];
function screen(id) {
  // Tira o foco do botão que abriu a tela: senão ESPAÇO/ENTER (pular/coletar) o "clicariam" de novo.
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
}

$('tLogo').innerHTML = 'CACOFONIA'.split('').map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');

// ---------- créditos ----------
$('creditsRoll').innerHTML = [
  '<p class="cr-h">CRIAÇÃO, DESIGN E DIREÇÃO</p><p class="cr-n">FRANCISCO AUDIR</p><p class="cr-s"><a href="https://instagram.com/filho.af" target="_blank" rel="noopener">@filho.af</a></p>',
  '<p class="cr-h">PROGRAMAÇÃO</p><p class="cr-n">Francisco Audir</p><p class="cr-s">com assistência do Claude (Anthropic)</p>',
  `<p class="cr-h">MÚSICA</p>${bosses.all().map((b) => `<p class="cr-s">${songs.get(b.musica).credito}</p>`).join('')}`,
  '<p class="cr-h">TECNOLOGIA</p><p class="cr-n">Tone.js · Three.js · Vite</p>',
  '<p class="cr-h">OBRIGADO POR JOGAR!</p><p class="cr-n">♪ ♪ ♪</p>'
].join('');

// ---------- áudio ----------
let synths = null, sfx = null, audioReady = false;
async function ensureAudio() {
  if (audioReady) return;
  await Tone.start();
  synths = createSynthRig();
  sfx = createSfx(synths);
  applyVolume();
  audioReady = true;
}

// ---------- entrada ----------
const input = new InputManager();

// ---------- fluxo: título ----------
$('tPlay').onclick = async () => { await ensureAudio(); renderBossList(); screen('sBossSelect'); };
$('tEdit').onclick = async () => { await ensureAudio(); openEditorScreen(); };
$('tCred').onclick = () => screen('sCredits');
$('crBack').onclick = () => screen('sTitle');
$('tSet').onclick = () => {
  $('sDiffV').textContent = settings.dificuldade.toUpperCase();
  $('sRed').checked = settings.reducedFx;
  $('sVol').value = settings.vol;
  screen('sSettings');
};
$('sBack').onclick = () => screen('sTitle');
const DIFFS = ['facil', 'normal', 'dificil'];
$('sDiff').onclick = () => { settings.dificuldade = DIFFS[(DIFFS.indexOf(settings.dificuldade) + 1) % DIFFS.length]; $('sDiffV').textContent = settings.dificuldade.toUpperCase(); saveSettings(); };
$('sRed').onchange = (e) => { settings.reducedFx = e.target.checked; saveSettings(); };
$('sVol').oninput = (e) => { settings.vol = +e.target.value; if (synths) applyVolume(); saveSettings(); };
$('bsBack').onclick = () => screen('sTitle');
$('errOk').onclick = () => screen('sTitle');

function renderBossList() {
  const list = $('bossList'); list.innerHTML = '';
  const { SPR } = getSpriteCache();
  for (const boss of bosses.all()) {
    const b = document.createElement('button');
    b.className = 'opt boss-opt';
    b.style.setProperty('--boss', boss.cor);
    const img = document.createElement('img');
    img.className = 'boss-ico'; img.alt = ''; img.src = SPR[boss.sprite].toDataURL();
    const nome = document.createElement('span'); nome.textContent = boss.nome;
    const hp = document.createElement('small'); hp.textContent = `HP ${boss.hpMax}`;
    b.append(img, nome, hp);
    b.onclick = () => showIntro(boss.id);
    list.appendChild(b);
  }
}

// ---------- diálogo de entrada (falas.intro) ----------
let dialog = null;
function showIntro(bossId, chart = null) {
  const boss = bosses.get(bossId);
  const linhas = boss.falas.intro || [];
  if (!linhas.length) { startBattle(bossId, chart); return; }
  const { SPR } = getSpriteCache();
  const pc = $('dPortrait'), px = pc.getContext('2d'), spr = SPR[boss.sprite];
  pc.width = spr.width; pc.height = spr.height;
  px.clearRect(0, 0, pc.width, pc.height); px.drawImage(spr, 0, 0);
  $('dName').textContent = boss.nome;
  $('dName').style.color = boss.cor;
  $('sDialog').style.setProperty('--boss', boss.cor);
  dialog = { bossId, chart, linhas, i: 0, t: 0 };
  gameState = 'dialog';
  screen('sDialog');
  drawDialog();
}
function drawDialog() {
  const txt = dialog.linhas[dialog.i];
  const n = Math.min(txt.length, Math.floor(dialog.t * 45));
  $('dText').textContent = txt.slice(0, n);
  $('dNext').classList.toggle('hidden', n < txt.length);
}
function advanceDialog() {
  if (!dialog) return;
  const txt = dialog.linhas[dialog.i];
  if (Math.floor(dialog.t * 45) < txt.length) { dialog.t = 999; drawDialog(); return; }
  if (synths) synths.voice.triggerAttackRelease('C5', 0.03);
  dialog.i++; dialog.t = 0;
  if (dialog.i >= dialog.linhas.length) { const { bossId, chart } = dialog; dialog = null; startBattle(bossId, chart); return; }
  drawDialog();
}
$('sDialog').onclick = advanceDialog;
$('dSkip').onclick = (e) => { e.stopPropagation(); if (!dialog) return; const { bossId, chart } = dialog; dialog = null; startBattle(bossId, chart); };
for (const acao of ['collect', 'jump']) input.on(acao, () => { if (gameState === 'dialog') advanceDialog(); });

// ---------- batalha ----------
let stage = null, view = null, battle = null, player = null, offInput = [];
/** De onde a luta foi aberta — o editor ("TESTAR") volta para o editor ao fim. */
let origem = 'menu', ultimoChart = null;

const HINTS = {
  teclado: '← → troca de pista · ESPAÇO pula · ↓ desce rápido · E coleta/responde · ESC pausa',
  toque: 'deslize ← → troca de pista · ↑ pula · ↓ desce · botão redondo coleta/responde',
  controle: 'D-PAD ← → pista · A pula · B desce · X/RT coleta/responde · START pausa'
};

function setBattleUi(visivel) {
  for (const id of ['stage', 'hud', 'atkBtn', 'hint', 'deviceIcon']) $(id).classList.toggle('hidden', !visivel);
}

function startBattle(bossId, chart = null) {
  const boss = bosses.get(bossId);
  const song = songComMelodiaDoJogador(songs.get(boss.musica));
  if (!stage) {
    try { stage = new Stage3D($('gl')); } catch (e) { console.error(e); screen('sErr'); return; }
    view = new BattleView(stage, $('ui'));
  }
  stage.buildStageFor(boss);
  resizeStage();
  view.reset();
  view.reducedFx = settings.reducedFx;

  ultimoChart = chart;
  battle = new BattleController({
    boss, song, noteTypes, effects, chart: chart || undefined, dificuldade: settings.dificuldade,
  });

  bindBattleInput();
  screen(null);
  setBattleUi(true);
  $('bLbl').textContent = boss.nome;
  $('bFill').style.background = boss.cor;
  lastDevice = null;

  if (player) player.stop();
  player = createSongPlayer(synths, song, { countIn: 4 });
  player.start();
  paused = false;
  gameState = 'battle';
}

let battleTouchAttached = false;
function bindBattleInput() {
  for (const off of offInput) off();
  offInput = [
    input.on('moveLeft', () => gameState === 'battle' && !paused && battle.moveLane(-1)),
    input.on('moveRight', () => gameState === 'battle' && !paused && battle.moveLane(1)),
    input.on('jump', () => gameState === 'battle' && !paused && battle.doJump()),
    input.on('dive', () => gameState === 'battle' && !paused && battle.doDive()),
    input.on('collect', () => gameState === 'battle' && !paused && battle.doCollect()),
    input.on('pause', () => togglePause())
  ];
  if (!battleTouchAttached) { input.attachBattleTouch($('stage')); battleTouchAttached = true; }
  $('atkBtn').onpointerdown = (e) => { e.preventDefault(); if (!paused) battle.doCollect(); };
}

function resizeStage() {
  if (view) view.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resizeStage);

let paused = false;
function togglePause() {
  if (gameState !== 'battle' || !battle || battle.over) return;
  paused = !paused;
  if (paused) { Tone.Transport.pause(); screen('sPause'); } else { Tone.Transport.start('+0.1'); screen(null); }
}
$('pRes').onclick = togglePause;
$('pauseBtn').onclick = togglePause;
$('pQuit').onclick = () => { paused = false; if (player) player.stop(); setBattleUi(false); voltarDaLuta(); };

function voltarDaLuta() {
  if (origem === 'editor') { openEditorScreen(); return; }
  gameState = 'menu';
  renderBossList(); screen('sBossSelect');
}

function onBattleEnd(venceu) {
  if (gameState !== 'battle') return;
  if (player) player.stop();
  setBattleUi(false);
  gameState = 'menu';
  if (venceu) {
    $('wC').textContent = battle.maxCombo; $('wDouradas').textContent = battle.melody.tamanho;
    const falas = battle.boss.falas.vitoria || [];
    $('wFala').textContent = falas.length ? `"${falas.join(' ')}"` : '';
    $('wFala').style.color = battle.boss.cor;
    screen('sWin');
  } else {
    screen('sLose');
  }
}
$('winOk').onclick = voltarDaLuta;
$('lRetry').onclick = () => { const id = battle.boss.id; screen(null); startBattle(id, ultimoChart); };
$('lMap').onclick = voltarDaLuta;

// ---------- editor ----------
function openEditorScreen() {
  origem = 'menu';
  gameState = 'editor';
  screen('sEditor');
  openEditor({
    $, songs, bosses, noteTypes, effects, synths,
    onExit: () => { gameState = 'menu'; screen('sTitle'); },
    onTest: (bossId, chart) => { origem = 'editor'; screen(null); startBattle(bossId, chart); }
  });
}

// ---------- laço principal ----------
let gameState = 'menu';
let lastTs = 0, lastDevice = null;
function frame(ts) {
  const dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000);
  lastTs = ts;
  input.pollGamepad();
  if (gameState === 'dialog' && dialog) { dialog.t += dt; drawDialog(); }
  if (gameState === 'battle' && battle && !paused) {
    battle.update(player.nowBeat(), dt);
    for (const ev of battle.events) { if (sfx) sfx.handle(ev); view.onEvent(ev, battle); }
    battle.events.length = 0;
    view.render(battle, noteTypes, dt);
    updateHud();
    if (battle.over) {
      // Sequência final: o chefe pisca, perde a cor e afunda (ou Eco cai) antes da tela de resultado.
      if (!view.fim) { if (player) player.stop(); view.comecarFim(battle.vencedor); if (sfx) sfx.handle({ tipo: battle.vencedor ? 'vitoria' : 'derrota' }); }
      if (view.fim.t > (battle.vencedor ? 2.2 : 1.4)) onBattleEnd(battle.vencedor);
    }
  }
  requestAnimationFrame(frame);
}
function updateHud() {
  $('pFill').style.width = (battle.hp / battle.maxHp * 100) + '%';
  $('pNum').textContent = `${battle.hp}/${battle.maxHp}`;
  $('bFill').style.width = (battle.bhp / battle.bmax * 100) + '%';
  $('bNum').textContent = String(battle.bhp);
  const collecting = battle.notes.some((n) => !n.judged && noteTypes.get(n.type).coletavel && n.lanes.includes(battle.lane) && Math.abs(battle.nowBeat - n.beat) < 0.3);
  $('atkBtn').classList.toggle('now', collecting || !!battle.responsePhase);
  $('atkBtn').textContent = battle.responsePhase ? 'RESPONDER' : (collecting ? 'AGORA!' : 'COLETAR');
  const dev = input.device();
  if (dev !== lastDevice) {
    lastDevice = dev;
    const DEVICE_LABEL = { teclado: '⌨ TECLADO', toque: '👆 TOQUE', controle: '🎮 CONTROLE' };
    $('deviceIcon').textContent = DEVICE_LABEL[dev] || '';
    $('hint').textContent = HINTS[dev] || HINTS.teclado;
  }
}

resizeStage();
screen('sTitle');
requestAnimationFrame(frame);

// Atalho de desenvolvimento: ?demo=<chefe> abre a luta direto (útil para testar e tirar prints).
const demo = new URLSearchParams(location.search).get('demo');
if (demo && bosses.has(demo)) ensureAudio().then(() => startBattle(demo));
