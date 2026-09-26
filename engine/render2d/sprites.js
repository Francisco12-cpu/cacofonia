/**
 * Sprites em pixel art, portados 1:1 do protótipo (paleta + texto ASCII por
 * personagem + sombreamento automático). Identidade visual preservada —
 * nenhum sprite foi redesenhado nesta migração.
 */
const PAL = {
  K: '#0b0714', W: '#f4f0ff', C: '#2be9ff', P: '#e8b4ff', B: '#2a1b4a', Y: '#f5ff3d', R: '#ff2f8e', G: '#3de07a', g: '#1f8a47', O: '#ff8a2b', L: '#8fffff', S: '#c9d6ff', s: '#6b78a8',
  N: '#8a5a3a', V: '#6a3fb5', F: '#ffd0a8', A: '#ffb000', M: '#8a93a8', m: '#4a5068', Q: '#8b0f2a', X: '#6a6a7c', Z: '#2a1840', I: '#bfe9ff', U: '#d4a017', b: '#ff9ac1', r: '#e0304a', c: '#1a8fb0'
};
const ECO_HEAD = ['....KKKKKKKK....', '...KWWWWWWWWK...', '..KWWWWWWWWWWK..', '.KKWWWWWWWWWWKK.'];
const ECO_BODY = ['..KKWWWWWWWWKK..', '..KrrrrrrrrrrK..', '.KcKrrrrrrrrKcK.', '.KcKCCCCCCCCKcK.', '..KKCCCCCCCCKK..', '...KCCKKKKCCK...'];
export const SPR_TXT = {
  eco_d1: [...ECO_HEAD, 'KCKWWKWWWWKWWKCK', 'KCKWWKWWWWKWWKCK', 'KCKWWWWWWWWWWKCK', '.KKWWbWWWWbWWKK.', ...ECO_BODY, '...KNNK..KNNK...', '...KKKK..KKKK..'],
  eco_d2: [...ECO_HEAD, 'KCKWWKWWWWKWWKCK', 'KCKWWKWWWWKWWKCK', 'KCKWWWWWWWWWWKCK', '.KKWWbWWWWbWWKK.', ...ECO_BODY, '..KNNK....KNNK..', '..KKKK.....KKK..'],
  eco_u1: ['....KKKKKKKK....', '...KWCCCCCCWK...', '..KWWWWWWWWWWK..', '.KKWWWWWWWWWWKK.', 'KCKWWWWWWWWWWKCK', 'KCKWWWWWWWWWWKCK', 'KCKWWWWWWWWWWKCK', '.KKWWWWWWWWWWKK.', ...ECO_BODY, '...KNNK..KNNK...', '...KKKK..KKKK..'],
  eco_u2: ['....KKKKKKKK....', '...KWCCCCCCWK...', '..KWWWWWWWWWWK..', '.KKWWWWWWWWWWKK.', 'KCKWWWWWWWWWWKCK', 'KCKWWWWWWWWWWKCK', 'KCKWWWWWWWWWWKCK', '.KKWWWWWWWWWWKK.', ...ECO_BODY, '..KNNK....KNNK..', '..KKKK.....KKK..'],
  eco_s1: ['.....KKKKKK.....', '....KWWWWWWK....', '...KWWWWWWWWK...', '..KWWWWWWWWWWK..', '..KCCKWWWWKWWK..', '..KCCKWWWWKWWK..', '..KCCKWWWWWWWK..', '...KKWWWWWbWK...', '....KWWWWWWK....', '..rrKrrrrrrK....', '....KCCCCCCK....', '....KCKCCCCK....', '....KCCCCCCK....', '....KCCKKCCK....', '....KNNK.KNNK...', '....KKKK.KKKK..'],
  eco_s2: ['.....KKKKKK.....', '....KWWWWWWK....', '...KWWWWWWWWK...', '..KWWWWWWWWWWK..', '..KCCKWWWWKWWK..', '..KCCKWWWWKWWK..', '..KCCKWWWWWWWK..', '...KKWWWWWbWK...', '....KWWWWWWK....', '.rr.KrrrrrrK....', '....KCCCCCCK....', '....KCCCKCCK....', '....KCCCCCCK....', '....KCCKKCCK....', '.....KNNKNNK....', '.....KKKKKKK....'],
  clave: ['...VVVVVV...', '..VVVVVVVV..', '.VVFFFFFFVV.', '.VFKFFFFKFV.', '.VFFFFFFFFV.', '.VFWWWWWWFV.', '..VWWWWWWV..', '.VVVWWWWVVV.', '.VVVVWWVVVV.', '.VVVVVVVVVV.', '..VV....VV..', '..KK....KK..'],
  bip: ['....GGGG....', '...GGGGGG...', '..GGGGGGGGG.', '...FFFFFF...', '...FKFFKF...', '...FFFFFF...', '....FFFF....', '...OOOOOO...', '..FOOOOOOF..', '...OOOOOO...', '...NN..NN...', '...KK..KK..'],
  sapo: ['............', '..GG....GG..', '.GWKG..GWKG.', '.GGGGGGGGGG.', 'GGGGGGGGGGGG', 'GGRRRRRRRRGG', '.GGGGGGGGGG.', '..GgGGGGgG..', '.gg.GGGG.gg.', '............'],
  coruja: ['..N......N..', '..NNNNNNNN..', '.NNWWNNWWNN.', '.NWKWNNWKWN.', '.NNWWAAWWNN.', '.NNNNAANNNN.', '.NFFNNNNFFN.', '.NFFFNNFFFN.', '.NNFFFFFFNN.', '..NNNNNNNN..', '...AA..AA...', '............'],
  tuba: ['....RRRR....', '..RRWRRRRR..', '.RRRRRRWRRR.', 'RRWRRRRRRRRR', 'RRRRRWRRRWRR', '..FFFFFFFF..', '..FKFFFFKF..', '..FFFFFFFF..', '...FFRRFF...', '...FFFFFF...', '...FF..FF...', '...KK..KK..'],
  robo: ['.....KK.....', '.....KR.....', '..KKKKKKKK..', '..KMMMMMMK..', '..KMCMMCMK..', '..KMMMMMMK..', '..KMKKKKMK..', '..KKKKKKKK..', '.KMMMMMMMMK.', '.KMKYMMYKMK.', '..KMMKKMMK..', '..KK....KK..'],
  pistao: ['...OOOOOO...', '..OOOOOOOO..', '..KCCKKCCK..', '..FFFFFFFF..', '..FFFKKFFF..', '...FFFFFF...', '..BBBBBBBB..', '.FBBMBBMBBF.', '..BBBBBBBB..', '..BBBBBBBB..', '...NN..NN...', '...KK..KK..'],
  maestro: ['......KKKKKKKK......', '......KBBBBBBK......', '......KBBBBBBK......', '......KBRRRRBK......', '....KKKKKKKKKKKK....', '.....KPPPPPPPPK.....', '....KPPPPPPPPPPK....', '....KPYYPPPPYYPK....', '....KPYKPPPPKYPK....', '....KPPPPPPPPPPK....', '.....KPPWWWWPPK.....', '......KKPPPPKK......', '....KKRRRWWRRRKK....', '...KRRRRRWWRRRRRK...', '..KRRRRRRWWRRRRRRK..', '..KRRKRRRWWRRRKRRK..', '..KKK.KRRWWRRK.KKK..', '......KRRRRRRK......', '......KBBKKBBK......', '......KKK..KKK......'],
  dj: ['....................', '.....KKKKKKKKKK.....', '....KAAAAAAAAAAK....', '...KAAAAAAAAAAAAK...', '..KCKFFFFFFFFFFKCK..', '..KCKKKKKKKKKKKKCK..', '..KCKKKKFFKKKKKKCK..', '..KCKFFFFFFFFFFKCK..', '...K.KFFRRRRFFK.K...', '......KFFFFFFK......', '....KKGGGGGGGGKK....', '...KGGGGYYGGGGGGK...', '..KGGKGGYYGGGGKGGK..', '..KFFKGGGGGGGGKFFK..', '..KKK.KGGGGGGK.KKK..', '......KNNKKNNK......', '......KNNKKNNK......', '......KKK..KKK......', '....................', '....................'],
  fantasma: ['......KKKKKKKK......', '....KKSSSSSSSSKK....', '...KSSSSSSSSSSSSK...', '..KSSSSSSSSSSSSSSK..', '..KSSKKSSSSSSKKSSK..', '..KSSKLKSSSSKLKSSK..', '..KSSKKSSSSSSKKSSK..', '..KSSSSSSKKSSSSSSK..', '..KSSSSSKLLKSSSSSK..', '..KSSSSSSKKSSSSSSK..', '..KSSSSSSSSSSSSSSK..', '..KSsSSSSSSSSSSsSK..', '..KSSSSSSSSSSSSSSK..', '..KSsSSSSSSSSSSsSK..', '..KSSSSSSSSSSSSSSK..', '..KSSKSSSSKSSSSKSK..', '..KSK.KSSK.KSSK.KK..', '..KK...KK...KK......', '....................', '....................'],
  zumbido: ['....K..........K....', '.....K..U..U..K.....', '......KKUKKUKK......', '.....KYYYYYYYYK.....', '....KYYKKYYKKYYK....', '....KYKWKYYKWKYK....', '....KYYKKYYKKYYK....', '.....KYYYRRYYYK.....', '..KK..KKYYYYKK..KK..', '.KIIK.KKKKKKKK.KIIK.', 'KIIIIKYYYYYYYYKIIIIK', 'KIIIIKKKKKKKKKKIIIIK', '.KIIKKYYYYYYYYKKIIK.', '..KK.KKKKKKKKKK.KK..', '.....KYYYYYYYYK.....', '......KKKKKKKK......', '.......KYYYYK.......', '........KKKK........', '.........KK.........', '....................'],
  cisne: ['...........KKK......', '..........KIIIK.....', '..........KIKIK.....', '..........KIIIKOK...', '...........KIIKKK...', '...........KIIK.....', '...........KIIK.....', '..........KIIK......', '.........KIIK.......', '...KKKK..KIIK.......', '..KIIIIKKIIIK.......', '.KIIWIIIIIIIIKK.....', 'KIIWWIIIIIIIIIIK....', 'KIWWIIIIIIIIIIIIK...', 'KIIWIIIIIIIIIIIK....', '.KIIIIIIIIIIIIK.....', '..KKIIIIIIIIKK......', '....KKKKKKKK........', '..LLLLLLLLLLLLLL....', '....LLLLLLLLLL......'],
  orgao: ['...K..K..K..K..K....', '..KMKKMKKMKKMKKMK...', '..KMKKMKKMKKMKKMK...', '..KMKKMKKMKKMKKMK...', '..KMKKMKKMKKMKKMK...', '.KKKKKKKKKKKKKKKKK..', '.KQQQQQQQQQQQQQQQK..', '.KQKKKQQQQQQQKKKQK..', '.KQKRKQQQQQQQKRKQK..', '.KQKKKQQQQQQQKKKQK..', '.KQQQQQQMMMQQQQQQK..', '.KQQQQQMKKKMQQQQQK..', '.KQQQQQQMMMQQQQQQK..', '.KKKKKKKKKKKKKKKKK..', '.KWKWKWKWKWKWKWKWK..', '.KKKKKKKKKKKKKKKKK..', '.KmmmmmmmmmmmmmmmK..', '.KmK...........KmK..', '.KmK...........KmK..', '.KKK...........KKK..'],
  colosso: ['......KKKKKKKK......', '.....KXXXXXXXXK.....', '....KXXXXXXXXXXK....', '....KXKKXXXXKKXK....', '....KXKRKXXKRKXK....', '....KXXXXXXXXXXK....', '....KXXKKKKKKXXK....', '.....KXXXXXXXXK.....', '..KKKKKKKKKKKKKKKK..', '.KXXXXXXXXXXXXXXXXK.', 'KXXKXXXXXRRXXXXKXXK.', 'KXXKXXXXRRRRXXXKXXK.', 'KXXKXXXXXRRXXXXKXXK.', 'KMMKXXXXXXXXXXXKMMK.', 'KMMKKKKKKKKKKKKKMMK.', '.KK.KXXXXKXXXXK.KK..', '....KXXXXKXXXXK.....', '....KXXXKKKXXXK.....', '...KMMMMK.KMMMMK....', '...KKKKKK.KKKKKK....'],
  silencio: ['........KKKK........', '......KKZZZZKK......', '.....KZZZZZZZZK.....', '....KZZZZZZZZZZK....', '...KZZWWZZZZWWZZK...', '...KZZWKWZZWKWZZK...', '...KZZZWZZZZWZZZK...', '...KZZZZZZZZZZZZK...', '...KZZZZKKKKZZZZK...', '...KZZZKWWWWKZZZK...', '..KZZZZZKKKKZZZZZK..', '.KZZVZZZZZZZZZZVZZK.', 'KZZVZZZZZZZZZZZZVZZK', 'KZVZZZZZZZZZZZZZZVZK', 'KZZZZVZZZZZZZZVZZZZK', '.KZZZZZZVZZVZZZZZZK.', '..KZZKZZZZZZZZKZZK..', '...KK.KZZKKZZK.KK...', '......KK....KK......', '....................']
};

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

/** Desenha um sprite num canvas a partir do texto ASCII, com sombreamento automático nas bordas (ou um tint sólido, usado no "flash de acerto"). */
export function makeSprite(rows, tint) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const grid = rows.map((r) => r.padEnd(w, '.'));
  const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && grid[j][i] !== '.' && grid[j][i] !== 'K' && PAL[grid[j][i]];
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const ch = grid[j][i];
      if (ch === '.' || !PAL[ch]) continue;
      if (tint) { x.fillStyle = tint; x.fillRect(i, j, 1, 1); continue; }
      let [r, g, b] = hexRgb(PAL[ch]);
      if (ch !== 'K') {
        let k = 1;
        if (!solid(i, j - 1)) k += 0.18;
        if (!solid(i - 1, j)) k += 0.08;
        if (!solid(i, j + 1)) k -= 0.24;
        if (!solid(i + 1, j)) k -= 0.1;
        r = clamp(r * k, 0, 255); g = clamp(g * k, 0, 255); b = clamp(b * k, 0, 255);
      }
      x.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      x.fillRect(i, j, 1, 1);
    }
  }
  return c;
}

let cache = null, cacheW = null;
export function getSpriteCache() {
  if (!cache) {
    cache = {}; cacheW = {};
    for (const k in SPR_TXT) { cache[k] = makeSprite(SPR_TXT[k]); cacheW[k] = makeSprite(SPR_TXT[k], '#ffffff'); }
  }
  return { SPR: cache, SPR_W: cacheW };
}
