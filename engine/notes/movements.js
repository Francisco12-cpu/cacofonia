/**
 * Plugins de movimento (seção 3.1 da bíblia). Cada plugin recebe o progresso
 * `p` da nota no trajeto — 0 = acabou de nascer (longe), 1 = instante do
 * acerto — e devolve um deslocamento lateral (em unidades de pista) somado
 * à pista-base da nota. `reto` e `zigzag` são os dois usados pelos 8 chefes
 * migrados do protótipo (todo o resto do movimento "estranho" de lá era, na
 * verdade, sempre reto — só a forma/cor mudava por tipo).
 *
 * `bumerangue`, `fantasma`, `ima`, `gelo` e `divisora` são os movimentos
 * "sugeridos" da seção 3.1: o plugin em si já funciona (matemática pura,
 * testada), mas o motor de batalha (game/battle) ainda só liga a saída
 * `laneOffset` — os efeitos extras (`intangivel`, `puxaJogador`,
 * `lentidaoAoAtingir`, `divideEm`) ficam registrados na interface para o
 * próximo passo de implementação, já que nenhum dos 8 chefes atuais os usa.
 */

function reto() {
  return { laneOffset: 0 };
}

function zigzag(p, def, seed) {
  const freq = (def.ciclosPorTrajeto ?? 1.75) * 2 * Math.PI;
  const amp = def.amplitudePistas ?? 1.3;
  return { laneOffset: Math.sin(p * freq + seed) * (1 - p) * amp };
}

function bumerangue(p, def) {
  const amp = def.amplitudePistas ?? 1;
  const triangular = 1 - Math.abs(p * 2 - 1); // sobe até p=0.5, volta à pista de origem em p=1
  return { laneOffset: triangular * amp };
}

function fantasma(p, def) {
  const [de, ate] = def.janelaInvisivel ?? [0.35, 0.65];
  const intangivel = p >= de && p <= ate;
  return { laneOffset: 0, intangivel, opacidade: intangivel ? 0 : 1 };
}

function ima(p, def) {
  const ativarEm = def.ativarEm ?? 0.8;
  return { laneOffset: 0, puxaJogador: p >= ativarEm ? (def.direcaoPistas ?? 1) : 0 };
}

function gelo(p, def) {
  return { laneOffset: 0, lentidaoAoAtingir: p >= (def.ativarEm ?? 0.95) ? (def.fatorLentidao ?? 0.5) : 0 };
}

function divisora(p, def) {
  const ponto = def.pontoDivisao ?? 0.5;
  return { laneOffset: 0, divideEm: p >= ponto ? (def.pistasAlvo ?? null) : null };
}

const MOVEMENTS = { reto, zigzag, bumerangue, fantasma, ima, gelo, divisora };

export function createMovementRegistry(extra = {}) {
  const all = { ...MOVEMENTS, ...extra };
  return {
    apply(movimentoDef, progress, seed = 0) {
      const plugin = all[movimentoDef.tipo];
      if (!plugin) throw new Error(`Movimento desconhecido: ${movimentoDef.tipo}`);
      return plugin(progress, movimentoDef, seed);
    },
    has(tipo) { return tipo in all; },
    tipos() { return Object.keys(all); }
  };
}
