import * as Tone from 'tone';
import { loadNoteTypeRegistry } from './engine/notes/loadFromContent.js';
import { loadSongRegistry } from './engine/songs/loadFromContent.js';
import { loadBossRegistry } from './engine/bosses/loadFromContent.js';
import { createEffectRegistry } from './engine/effects/plugins.js';
import { createSynthRig } from './engine/audio/synths.js';
import { createSongPlayer } from './engine/audio/songPlayer.js';
import { InputManager } from './engine/input/InputManager.js';
import { Stage3D } from './game/battle/Stage3D.js';
import { BattleController } from './game/battle/BattleController.js';
import { BattleView } from './game/battle/BattleView.js';
import { openEditor } from './game/editor/Editor.js';

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

// ---------- telas ----------
const SCREENS = ['sTitle', 'sBossSelect', 'sSettings', 'sCredits', 'sPause', 'sWin', 'sLose', 'sErr', 'sEditor'];
function screen(id) { for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id); }

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
let synths = null, audioReady = false;
async function ensureAudio() {
  if (audioReady) return;
  await Tone.start();
  synths = createSynthRig();
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
$('sVol').oninput = (e) => { settings.vol = +e.target.value; if (synths) Tone.getDestination().volume.value = settings.vol <= 0 ? -Infinity : 20 * Math.log10(settings.vol / 100); saveSettings(); };
$('bsBack').onclick = () => screen('sTitle');
$('errOk').onclick = () => screen('sTitle');

function renderBossList() {
  const list = $('bossList'); list.innerHTML = '';
  for (const boss of bosses.all()) {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<span>${boss.nome}</span><small>HP ${boss.hpMax}</small>`;
    b.onclick = () => startBattle(boss.id);
    list.appendChild(b);
  }
}

// ---------- batalha ----------
let stage = null, view = null, battle = null, player = null, offInput = [];

function startBattle(bossId) {
  const boss = bosses.get(bossId);
  const song = songs.get(boss.musica);
  if (!stage) {
    try { stage = new Stage3D($('gl')); } catch (e) { console.error(e); screen('sErr'); return; }
    view = new BattleView(stage, $('ui'));
  }
  stage.buildStageFor(boss);
  resizeStage();

  battle = new BattleController({
    boss, song, noteTypes, effects, dificuldade: settings.dificuldade,
    onWin: () => onBattleEnd(true), onLose: () => onBattleEnd(false)
  });

  bindBattleInput();
  screen(null);
  document.getElementById('stage').classList.remove('hidden');
  $('hud').classList.remove('hidden'); $('atkBtn').classList.remove('hidden'); $('hint').classList.remove('hidden'); $('deviceIcon').classList.remove('hidden');
  $('bLbl').textContent = boss.nome;
  $('hint').textContent = '← → troca de pista · ESPAÇO pula · ↓ desce rápido · E coleta/responde · ESC pausa';

  player = createSongPlayer(synths, song, { onBeat: () => {} });
  player.start();
  gameState = 'battle';
}

let battleTouchAttached = false;
function bindBattleInput() {
  for (const off of offInput) off();
  offInput = [
    input.on('moveLeft', () => battle && battle.moveLane(-1)),
    input.on('moveRight', () => battle && battle.moveLane(1)),
    input.on('jump', () => battle && battle.doJump()),
    input.on('dive', () => battle && battle.doDive()),
    input.on('collect', () => battle && battle.doCollect()),
    input.on('pause', () => togglePause())
  ];
  if (!battleTouchAttached) { input.attachBattleTouch(document.getElementById('stage')); battleTouchAttached = true; }
  $('atkBtn').onpointerdown = (e) => { e.preventDefault(); battle && battle.doCollect(); };
}

function resizeStage() {
  const w = window.innerWidth, h = window.innerHeight;
  $('gl').width = w; $('gl').height = h; $('ui').width = w; $('ui').height = h;
  if (view) view.resize(w, h);
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
$('pQuit').onclick = () => { paused = false; if (player) player.stop(); screen('sBossSelect'); renderBossList(); gameState = 'menu'; document.getElementById('stage').classList.add('hidden'); $('hud').classList.add('hidden'); $('atkBtn').classList.add('hidden'); $('hint').classList.add('hidden'); $('deviceIcon').classList.add('hidden'); };

function onBattleEnd(venceu) {
  if (player) player.stop();
  document.getElementById('stage').classList.add('hidden');
  $('hud').classList.add('hidden'); $('atkBtn').classList.add('hidden'); $('hint').classList.add('hidden'); $('deviceIcon').classList.add('hidden');
  gameState = 'menu';
  if (venceu) {
    $('wC').textContent = battle.maxCombo; $('wDouradas').textContent = battle.melody.tamanho;
    screen('sWin');
  } else {
    screen('sLose');
  }
}
$('winOk').onclick = () => { screen('sBossSelect'); renderBossList(); };
$('lRetry').onclick = () => { const id = battle.boss.id; screen(null); startBattle(id); };
$('lMap').onclick = () => { screen('sBossSelect'); renderBossList(); };

// ---------- editor ----------
function openEditorScreen() {
  gameState = 'editor';
  screen('sEditor');
  openEditor({ $, songs, bosses, noteTypes, effects, synths, onExit: () => { gameState = 'menu'; screen('sTitle'); }, onTest: (bossId, chart) => { screen(null); startBattleWithChart(bossId, chart); } });
}

function startBattleWithChart(bossId, chart) {
  startBattle(bossId);
  battle.setChart(chart);
}

// ---------- laço principal ----------
let gameState = 'menu';
let lastTs = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000);
  lastTs = ts;
  input.pollGamepad();
  if (gameState === 'battle' && battle && !paused) {
    const nb = player.nowBeat();
    battle.update(nb, dt);
    view.render(battle, noteTypes, dt);
    updateHud();
    if (battle.over) onBattleEnd(battle.vencedor);
  }
  requestAnimationFrame(frame);
}
function updateHud() {
  $('pFill').style.width = (battle.hp / battle.maxHp * 100) + '%';
  $('pNum').textContent = `${battle.hp}/${battle.maxHp}`;
  $('bFill').style.width = (battle.bhp / battle.bmax * 100) + '%';
  $('bFill').style.background = battle.boss.cor;
  $('bNum').textContent = String(battle.bhp);
  const collecting = battle.notes.some((n) => !n.judged && noteTypes.get(n.type).coletavel && n.lanes.includes(battle.lane) && Math.abs(battle.nowBeat - n.beat) < 0.3);
  $('atkBtn').classList.toggle('now', collecting || !!battle.responsePhase);
  $('atkBtn').textContent = battle.responsePhase ? 'RESPONDER' : (collecting ? 'AGORA!' : 'COLETAR');
  const DEVICE_LABEL = { teclado: '⌨ TECLADO', toque: '👆 TOQUE', controle: '🎮 CONTROLE' };
  $('deviceIcon').textContent = DEVICE_LABEL[input.device()] || '';
}

resizeStage();
screen('sTitle');
requestAnimationFrame(frame);
