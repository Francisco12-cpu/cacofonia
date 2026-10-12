import * as Tone from 'tone';
import { DRUM_PITCH } from './synths.js';
import { buildStepIndex } from './stepIndex.js';

export { buildStepIndex };

/**
 * Toca uma música do novo formato (content/songs) usando os sintetizadores
 * de engine/audio/synths.js. Baseado no `stepFn` do protótipo, mas lendo
 * trilhas de dados explícitas em vez de gerar harmonia/baixo/bateria em
 * tempo real.
 */
export function createSongPlayer(synths, song, opts = {}) {
  const idx = {
    melodia: buildStepIndex(song.trilhas.melodia),
    harmonia: buildStepIndex(song.trilhas.harmonia),
    baixo: buildStepIndex(song.trilhas.baixo),
    bateria: buildStepIndex(song.trilhas.bateria),
    arpejo: buildStepIndex(song.trilhas.arpejo)
  };
  const totalSteps = Math.max(1, Math.round(song.comprimentoBatidas * 4));
  const onBeat = opts.onBeat || null;
  const onSilenceChange = opts.onSilenceChange || null;
  const stepMul = opts.stepMul ?? 1;

  let abs = Math.round((opts.startStep || 0));
  let pre = (opts.countIn || 0) * 4;
  let silent = false;
  let repeatId = null;

  function durSec(beats) { return beats * 60 / Tone.Transport.bpm.value; }

  function tick(time) {
    if (pre > 0) {
      const k = pre--;
      if (k % 4 === 0) {
        synths.fx2.triggerAttackRelease(k === 4 ? 'C6' : 'G5', durSec(0.125), time);
        synths.hat.triggerAttackRelease(durSec(0.125), time, 1);
      }
      return;
    }
    const localStep = abs % totalSteps, loop = Math.floor(abs / totalSteps);
    const beat = localStep / 4;

    if (localStep === 0 && loop > 0 && song.bpmProgressao) {
      const novo = Math.min(song.bpmProgressao.maximo, song.bpm + song.bpmProgressao.porVolta * stepMul * loop);
      Tone.Transport.bpm.setValueAtTime(novo, time);
    }
    if (localStep === 0 && loop > 0 && song.trilhas.bateria.length) {
      synths.crash.triggerAttackRelease(durSec(0.25), time, 0.8);
    }

    const isSilentNow = !!song.silencioProcedural && loop >= 1 && Math.floor(beat / 16) % 3 === 2;
    if (isSilentNow !== silent) { silent = isSilentNow; if (onSilenceChange) onSilenceChange(silent, time); }

    if (onBeat && abs % 4 === 0) onBeat(beat, loop, time, abs);
    if (silent) { abs++; return; }

    for (const ev of idx.melodia.get(localStep) || []) synths.lead.triggerAttackRelease(ev.nota, durSec(ev.duracao), time);
    for (const ev of idx.harmonia.get(localStep) || []) synths.harm.triggerAttackRelease(ev.nota, durSec(ev.duracao), time);
    for (const ev of idx.arpejo.get(localStep) || []) synths.arp.triggerAttackRelease(ev.nota, durSec(ev.duracao), time);
    for (const ev of idx.baixo.get(localStep) || []) synths.bass.triggerAttackRelease(ev.nota, durSec(ev.duracao), time);
    for (const ev of idx.bateria.get(localStep) || []) {
      const voz = ev.voz;
      if (voz === 'kick' || voz === 'tom') synths[voz].triggerAttackRelease(DRUM_PITCH[voz], durSec(ev.duracao), time);
      else synths[voz].triggerAttackRelease(durSec(ev.duracao), time, voz === 'crash' ? 0.8 : 0.7);
    }
    abs++;
  }

  return {
    start(offsetSeconds = '+0.15') {
      repeatId = Tone.Transport.scheduleRepeat(tick, '16n', 0);
      Tone.Transport.bpm.value = song.bpm;
      Tone.Transport.start(offsetSeconds);
    },
    stop() {
      if (repeatId !== null) Tone.Transport.clear(repeatId);
      repeatId = null;
      Tone.Transport.stop();
      Tone.Transport.cancel(0);
      Tone.Transport.position = 0;
    },
    /**
     * Beat atual da música estimado a partir do relógio de áudio (equivalente
     * a `nowBeat()` do protótipo). Durante a contagem (`countIn`) é negativo,
     * então a batida 0 da música é sempre a batida 0 do gráfico de ataques.
     */
    nowBeat(latencySeconds = 0) {
      const ticks = Tone.Transport.getTicksAtTime(Math.max(0, Tone.now() - latencySeconds));
      return ticks / Tone.Transport.PPQ - (opts.countIn || 0);
    }
  };
}
