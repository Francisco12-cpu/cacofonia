import * as Tone from 'tone';

/**
 * Fábrica de sintetizadores (chiptune arranjado), portada do protótipo.
 * Chaveada pelo campo `instrumento` dos tipos de nota e pelas vozes de
 * bateria (`voz` na trilha "bateria"), em vez de um objeto `A` fixo no
 * código do jogo.
 */
export function createSynthRig() {
  const dest = Tone.getDestination();
  dest.chain(new Tone.Compressor(-18, 3), new Tone.Gain(2), new Tone.Limiter(-0.5));

  const hp = new Tone.Filter(6500, 'highpass').toDestination();
  const sn = new Tone.Filter(1800, 'bandpass').toDestination();
  const cr = new Tone.Filter(5000, 'highpass').toDestination();
  const echo = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.22, wet: 0.16 }).toDestination();
  const vib = new Tone.Vibrato({ frequency: 5.5, depth: 0.06 }).connect(echo);
  const panL = new Tone.Panner(-0.45).toDestination();
  const panR = new Tone.Panner(0.35).toDestination();
  const hpR = new Tone.Filter(6500, 'highpass').connect(new Tone.Panner(0.25).toDestination());

  const syn = (osc, env, out) => new Tone.Synth({ oscillator: osc, envelope: env }).connect(out || dest);

  const A = {
    ohat: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.16, sustain: 0 } }).connect(hpR),
    tom: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 3, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).toDestination(),
    lead: syn({ type: 'pulse', width: 0.25 }, { attack: 0.002, decay: 0.08, sustain: 0.6, release: 0.06 }, vib),
    harm: syn({ type: 'pulse', width: 0.5 }, { attack: 0.002, decay: 0.1, sustain: 0.35, release: 0.05 }, panR),
    arp: syn({ type: 'pulse', width: 0.125 }, { attack: 0.001, decay: 0.06, sustain: 0.15, release: 0.02 }, panL),
    bass: syn({ type: 'triangle' }, { attack: 0.002, decay: 0.1, sustain: 0.85, release: 0.04 }),
    kick: new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 6, envelope: { attack: 0.001, decay: 0.22, sustain: 0 } }).toDestination(),
    snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.11, sustain: 0 } }).connect(sn),
    hat: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0 } }).connect(hpR),
    crash: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.9, sustain: 0 } }).connect(cr),
    brass: syn({ type: 'sawtooth' }, { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.08 }),
    voice: syn({ type: 'square' }, { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 }),
    fx: syn({ type: 'pulse', width: 0.5 }, { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.05 }),
    fx2: syn({ type: 'triangle' }, { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 }),
    hurt: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.25, sustain: 0 } }).toDestination()
  };
  A.fft = new Tone.FFT(32);
  dest.connect(A.fft);

  const V = { ohat: -22, tom: -6, lead: -5, harm: -15, arp: -19, bass: -3, kick: -2, snare: -9, hat: -17, crash: -15, voice: -14, fx: -8, fx2: -6, hurt: -4, brass: -8 };
  for (const k in V) A[k].volume.value = V[k];

  return A;
}

/** Ids de instrumento usados pelos tipos de nota (content/notetypes) e pela bateria. */
export const DRUM_PITCH = { kick: 'C1', tom: 'G2' };
