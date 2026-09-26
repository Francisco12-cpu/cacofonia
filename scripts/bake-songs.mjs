/**
 * Assa (bake) as 8 músicas de chefe do protótipo para o novo formato de
 * dados (content/songs/*.json, ver seção 3.3 da bíblia). No protótipo,
 * harmonia/baixo/bateria eram geradas em tempo real a cada passo de 16 avos
 * (stepFn); aqui essa mesma lógica roda uma vez, para a primeira volta, e o
 * resultado vira notas explícitas por trilha — exatamente o que a bíblia
 * pede ("o motor toca exatamente essas notas, não uma trilha decorativa").
 *
 * Uso: node scripts/bake-songs.mjs   (ou: npm run bake:content)
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SONGS, DRUMS, CREDITOS, fromMidi } from './prototype-music-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../content/songs');

function chordAt(s, pos) {
  const ci = Math.floor(pos / s.ch.u);
  return s.chords[ci % s.chords.length];
}

function bakeMelodia(s) {
  return s.ev.map((e) => ({ pos: round4(e.pos), nota: e.note, duracao: e.dur }));
}

function bakeHarmonia(s) {
  if (s.harmFrom > 0) return []; // só toca a partir de uma volta que não é a assada (volta 0)
  const out = [];
  for (const e of s.ev) {
    const c = chordAt(s, e.pos);
    const mid = e.midi;
    let h = null;
    for (let o = -2; o <= 1; o++) {
      for (const iv of c.tri) {
        const m = c.pc + iv + 12 * (Math.floor(mid / 12) + o);
        if (m <= mid - 3 && m >= mid - 9 && (h === null || m > h)) h = m;
      }
    }
    if (h !== null) out.push({ pos: round4(e.pos), nota: fromMidi(h), duracao: e.dur });
  }
  return out;
}

function bakeArpejo(s) {
  if (s.arpFrom > 0) return [];
  const out = [];
  const totalSteps = Math.round(s.L * 4);
  for (let abs = 0; abs < totalSteps; abs++) {
    if (s.arpSlow && abs % 2 !== 0) continue;
    const beat = abs / 4;
    const c = chordAt(s, beat);
    const k = s.arpSlow ? Math.floor(abs / 2) % 4 : abs % 4;
    const semitom = [0, 1, 2, 1][k];
    const nota = fromMidi(60 + c.pc + c.tri[semitom] + (c.pc > 7 ? -12 : 0) + 12);
    out.push({ pos: round4(beat), nota, duracao: 0.125 });
  }
  return out;
}

function bakeBaixo(s) {
  const out = [];
  const totalSteps = Math.round(s.L * 4);
  for (let abs = 0; abs < totalSteps; abs++) {
    const beat = abs / 4;
    const ci = Math.floor(beat / s.ch.u);
    const c = s.chords[ci % s.chords.length];
    const si = Math.round((beat - ci * s.ch.u) * 4);
    const root = 36 + c.pc + (c.pc >= 9 ? -12 : 0);
    switch (s.bass) {
      case 'oct':
        if (si % 2 === 0) out.push({ pos: round4(beat), nota: fromMidi(root + ((si / 2) % 2 ? 12 : 0)), duracao: 0.25 });
        break;
      case 'gallop':
        if ([0, 2, 3].includes(abs % 4)) out.push({ pos: round4(beat), nota: fromMidi(root), duracao: 0.125 });
        break;
      case 'oompah':
        if (si === 0) out.push({ pos: round4(beat), nota: fromMidi(root), duracao: 0.5 });
        else if (si === Math.round(s.ch.u * 2)) out.push({ pos: round4(beat), nota: fromMidi(root + 7), duracao: 0.5 });
        break;
      case 'hold':
        if (si === 0) out.push({ pos: round4(beat), nota: fromMidi(root), duracao: s.ch.u });
        break;
      case 'walk':
        if (si % 4 === 0) out.push({ pos: round4(beat), nota: fromMidi(root + [0, c.tri[1], 7, c.tri[1]][(si / 4) % 4]), duracao: 0.5 });
        break;
    }
  }
  return out;
}

function bakeBateria(s) {
  const out = [];
  const usaBateria = !(s.drumsFrom && s.drumsFrom > 0); // volta 0 usa 'none' se drumsFrom exigir volta posterior
  const d = usaBateria ? DRUMS[s.drums] : DRUMS.none;
  const totalSteps = Math.round(s.L * 4);
  for (let abs = 0; abs < totalSteps; abs++) {
    const beat = abs / 4, b16 = abs % 16, bar = Math.floor(abs / 16);
    const fill = s.fills && bar % 8 === 7 && b16 >= 8;
    if (d.k.includes(b16)) out.push({ pos: round4(beat), voz: 'kick', duracao: 0.25 });
    if (fill) {
      if (b16 >= 12 && bar % 16 === 15) out.push({ pos: round4(beat), voz: 'tom', duracao: 0.25 });
      else if (b16 % (b16 >= 12 ? 1 : 2) === 0) out.push({ pos: round4(beat), voz: 'snare', duracao: 0.25 });
    } else if (d.s.includes(b16)) {
      out.push({ pos: round4(beat), voz: 'snare', duracao: 0.25 });
    }
    if (d.h.includes(b16)) out.push({ pos: round4(beat), voz: 'hat', duracao: 0.125 });
  }
  return out;
}

function round4(n) { return Math.round(n * 10000) / 10000; }

function tomEEscala(s) {
  const tom = s.ch.s[0];
  const escala = /m$/.test(tom) ? 'menor natural' : 'maior';
  return { tom, escala };
}

let bakedCount = 0;
for (const id in SONGS) {
  const s = SONGS[id];
  const { tom, escala } = tomEEscala(s);
  const doc = {
    id,
    bpm: s.bpm,
    ...(s.bpmStep ? { bpmProgressao: { porVolta: s.bpmStep, maximo: s.bpmMax } } : {}),
    compasso: '4/4',
    tom,
    escala,
    silencioProcedural: !!s.silent,
    credito: CREDITOS[id],
    trilhas: {
      melodia: bakeMelodia(s),
      harmonia: bakeHarmonia(s),
      baixo: bakeBaixo(s),
      bateria: bakeBateria(s),
      arpejo: bakeArpejo(s)
    },
    secoes: [{ nome: 'volta-1', compassos: Math.round(s.L / 4) }]
  };
  writeFileSync(join(outDir, `${id}.json`), JSON.stringify(doc, null, 2) + '\n', 'utf8');
  bakedCount++;
  console.log(`assado: ${id} (${doc.trilhas.melodia.length} notas de melodia, L=${s.L} batidas)`);
}
console.log(`\n${bakedCount} músicas assadas em ${outDir}`);
