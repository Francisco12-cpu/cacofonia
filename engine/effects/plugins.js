/**
 * Plugins de efeito especial (seção 3.4 da bíblia). Cada chefe liga esses
 * hooks pelo próprio arquivo de conteúdo (`efeitosEspeciais`), com
 * parâmetros — nenhum efeito é código exclusivo de um chefe. Migrados 1:1
 * do comportamento visual do protótipo (função `fx` de cada chefe).
 */

function windowedFlag(nowBeat, loop, p, key) {
  const from = p.aPartirDaVolta ?? 1;
  const periodo = p.periodoBatidas ?? 32;
  const inicioFracao = p.inicioFracao ?? 0.75;
  const ativo = loop >= from && (nowBeat % periodo) >= periodo * inicioFracao;
  return { [key]: ativo };
}

export const EFFECT_PLUGINS = {
  'camera-giro': (nowBeat, loop, p) => {
    const from = p.aPartirDaVolta ?? 2;
    if (loop < from) return { roll: 0 };
    const amp = p.amplitude ?? 0.14;
    const max = p.maxMultiplicador ?? 3;
    return { roll: Math.sin(nowBeat * Math.PI / 8) * amp * Math.min(max, loop - from + 1) };
  },

  apagao: (nowBeat, loop, p) => {
    const from = p.aPartirDaVolta ?? 1;
    const periodo = p.periodoBatidas ?? 16;
    if (loop < from) return { dark: false };
    return { dark: Math.floor(nowBeat / periodo) % 2 === 1 };
  },

  espelho: (nowBeat, loop, p) => windowedFlag(nowBeat, loop, p, 'mirror'),
  reflexo: (nowBeat, loop, p) => windowedFlag(nowBeat, loop, p, 'flipY'),
  terremoto: (nowBeat, loop, p) => windowedFlag(nowBeat, loop, p, 'quake'),
  'drop-flash': (nowBeat, loop, p) => windowedFlag(nowBeat, loop, p, 'drop'),
  'avanco-rapido': (nowBeat, loop, p) => windowedFlag(nowBeat, loop, p, 'fast'),

  vitral: (nowBeat, loop, p) => {
    const from = p.aPartirDaVolta ?? 1;
    const periodo = p.periodoBatidas ?? 32;
    const inicioFracao = p.inicioFracao ?? 0.5;
    if (loop < from || (nowBeat % periodo) < periodo * inicioFracao) return { hue: 0 };
    const passo = p.passoGraus ?? 30;
    const vel = p.velocidade ?? 2;
    return { hue: (Math.floor(nowBeat * vel) * passo) % 360 };
  },

  silencio: (nowBeat, loop, p) => {
    const from = p.aPartirDaVolta ?? 1;
    const periodo = p.periodoBatidas ?? 16;
    const moduloCiclos = p.moduloCiclos ?? 3;
    const fase = p.faseSilenciosa ?? 2;
    const sil = loop >= from && Math.floor(nowBeat / periodo) % moduloCiclos === fase;
    const out = { invert: sil };
    if (sil && p.espelharAPartirDaVolta !== undefined && loop >= p.espelharAPartirDaVolta) out.mirror = true;
    return out;
  }
};

export function createEffectRegistry(extra = {}) {
  const all = { ...EFFECT_PLUGINS, ...extra };
  return {
    has(tipo) { return tipo in all; },
    tipos() { return Object.keys(all); },
    /** Combina todos os efeitos ligados de um chefe num único estado visual, como o fxAt() do protótipo. */
    evaluate(instancias, nowBeat, loop) {
      const out = {};
      for (const inst of instancias || []) {
        const plugin = all[inst.tipo];
        if (!plugin) throw new Error(`Efeito especial desconhecido: ${inst.tipo}`);
        Object.assign(out, plugin(nowBeat, loop, inst));
      }
      return out;
    }
  };
}
