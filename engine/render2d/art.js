/**
 * Arte em texto de todos os personagens (formato: engine/render2d/pixelart.js).
 *
 * BOSS_ART: os 8 chefes redesenhados em 32×32 (antes 20×20), mantendo a
 * identidade de cada um — cores, chapéu, silhueta. Contorno externo e
 * sombreamento são automáticos; só o desenho "chapado" fica aqui. Quadros:
 * `atk` (ataque), `hurt` (tomou dano), e os genéricos `respira` / derrotado.
 *
 * HERO_ART: Eco em 24 px para a batalha (costas) e retratos (frente).
 * SMALL_ART: sprites pequenos do protótipo (mundo aberto: Eco andando e
 * moradores), que já trazem o próprio contorno.
 */

export const BOSS_ART = {
  maestro: {
    mirror: true,
    rows: [
      '................',
      '................',
      '........BBBBBBBB',
      '........BBBBBBBB',
      '........BBBBBBBB',
      '........BBBBBBBB',
      '........RRRRRRRR',
      '.....BBBBBBBBBBB',
      '......PPPPPPPPPP',
      '.....PPPPPPPPPPP',
      '.....PKKKPPPPPPP',
      '.....PYYKPPPPPPP',
      '.....PYYKPPPPPPP',
      '.....PPPPPPPPPPP',
      '.....PPPPWWWWWWW',
      '......PWWPPPPKKK',
      '.......PPPPPPPPP',
      '........WWWWWWWW',
      '.....RRRRRRWWWWr',
      '...RRRRRRRRWWWWr',
      '..RRRRRRRRRWWWWr',
      '.RRRQRRRRRRWWWWW',
      '.RRRQRRRRRRWWWWW',
      '.WWRQRRRRRRRWWWW',
      '.WW.QRRRRRRRRWWW',
      '....RRRRRRRRRRRR',
      '....RRRRRQRRRRRR',
      '...RRRR...BBBBB.',
      '..RRRR....BBBBB.',
      '..RRR.....BBBBB.',
      '.........KKKKKK.',
      '................'
    ],
    frames: {
      atk: [
        { x: 6, y: 11, rows: ['RR', 'RR'], mirror: true },
        { x: 13, y: 15, rows: ['KKK', 'Krr'], mirror: true },
        { x: 1, y: 23, rows: ['__', '__'] },
        { x: 0, y: 2, rows: ['..Y..', '..W..', '..W..', '..W..', '..W..', '..W..', '.WWW.', '.WWW.', '.RRR.', '.RRR.', '.RRR.', '.RRRR', '.RRRR', '..RRR', '..RRR', '...RR'] }
      ],
      hurt: [
        { x: 6, y: 10, rows: ['KKK', 'PPP', 'PPP'], mirror: true },
        { x: 6, y: 11, rows: ['KKK'], mirror: true },
        { x: 13, y: 15, rows: ['KKK', 'K..'], mirror: true }
      ]
    }
  },

  dj: {
    mirror: true,
    rows: [
      '................',
      '................',
      '........AAAAAAAA',
      '......AAAAAAAAAA',
      '.....AAAAAAAAAAA',
      '.....AAAAAAAAAAA',
      '...CCCFFFFFFFFFF',
      '..CCCCFFFFFFFFFF',
      '..CCCCKKKKKKKKKK',
      '..CCCCKCKKKKKFFF',
      '...CCCFFFFFFFFFF',
      '......FFFFFFFFFF',
      '......FFFFFRRRRR',
      '.......FFFFFFFFF',
      '........FFFFFFFF',
      '..........FFFFFF',
      '.....GGGGGGGGGGG',
      '...GGGGGGGGGGGGW',
      '..GGGGGGGYGGGGWW',
      '..GGgGGGGGYGGGWW',
      '.GGGgGGGGGGYYYYY',
      '.GGGgGGGGGGGGGWW',
      '.FFFgGGGGGGGGGWW',
      '.FF.gGGGGGGGGGWW',
      '....GGGGGGGGGGGG',
      '.....KKKKKKKKKYY',
      '.....NNNNNNNNNNN',
      '.....NNNNNN.....',
      '.....NNNNNN.....',
      '....WWWWWWW.....',
      '....RRRRRRR.....',
      '................'
    ],
    frames: {
      atk: [
        { x: 6, y: 8, rows: ['RRRRRRR', 'RYRRRRR'], mirror: true },
        { x: 11, y: 12, rows: ['KKKKK', '.Krrr'], mirror: true },
        { x: 0, y: 12, rows: ['.FF.', 'FFFF', 'FFFF', '.GG.', '.GGG', '.GGG', '..GG', '..GG', '..GG', '...G'] },
        { x: 1, y: 22, rows: ['___', '__'] }
      ],
      hurt: [
        { x: 6, y: 8, rows: ['KKKKKKK', 'KKKKKKK'], mirror: true },
        { x: 6, y: 9, rows: ['.W...W.'], mirror: true },
        { x: 11, y: 12, rows: ['FFFFF', '...KK'], mirror: true }
      ]
    }
  },

  fantasma: {
    mirror: true,
    rows: [
      '................',
      '..........LLLLLL',
      '........LLLLLLLL',
      '.......LLLLLLLLL',
      '......LLLSSSSSSS',
      '.....LLLSSSSSSSS',
      '.....LLSKKKSSSSS',
      '....LLLSKLLKSSSS',
      '....LLLSKLLKSSSS',
      '....LLLSSKKSSSSS',
      '....LLLSSSSSSSSS',
      '....LLLSSSSSSKKK',
      '....LLLSSSSSSKBB',
      '....LLLLSSSSSKKK',
      '...LLLLLLSSSSSSS',
      '...LLLLLIIIIIIII',
      '..LLLLIIIIIIIIII',
      '..LLLIIIIIIIIIII',
      '..LLIIIIIIIIIIII',
      '.SSLIIIIIIIIIIII',
      '.SS.IIIIIIIIIIII',
      '.S..IIIIIIIIIIII',
      '....IIIIIIIIIIII',
      '....IIIIIIIIIIII',
      '...IIIIIIIIIIIII',
      '...IIIIIIIIIIIII',
      '..IIIIIIIIIIIIII',
      '..IIII.IIIIIIIII',
      '..III...IIII.III',
      '..I......II...II',
      '................',
      '................'
    ],
    frames: {
      atk: [
        { x: 9, y: 7, rows: ['WW', 'WW'], mirror: true },
        { x: 13, y: 11, rows: ['KKK', 'KBB', 'KBB', 'KKK'], mirror: true },
        { x: 0, y: 14, rows: ['.SS', 'SSS', 'SS.', 'S..'] },
        { x: 1, y: 19, rows: ['___', '___', '_'] }
      ],
      hurt: [
        { x: 8, y: 6, rows: ['SSSS', 'KKKK', 'SSSS', 'SSSS'], mirror: true },
        { x: 13, y: 11, rows: ['SSS', 'SKK', 'SSS'], mirror: true }
      ]
    }
  },

  zumbido: {
    mirror: true,
    rows: [
      '................',
      '.....K.....U..U.',
      '......K....UUUUU',
      '.......K...URUUU',
      '........KYYYYYYY',
      '.......YYYYYYYYY',
      '......YYKKKKYYYY',
      '......YKKWWKKYYY',
      '......YKKKKKKYYY',
      '......YYKKKKYYYY',
      '.......YYYYYYRRR',
      '........YYYYYYYY',
      '.III.....KKKKKKK',
      'IIIII...YYYYYYYY',
      'IIIIII.YYYYYYYYY',
      'IIIIIIIKKKKKKKKK',
      'IIIIIIIYYYYYYYYY',
      '.IIIIIIKKKKKKKKK',
      '..IIIIYYYYYYYYYY',
      '...III.KKKKKKKKK',
      '.......YYYYYYYYY',
      '........KKKKKKKK',
      '........YYYYYYYY',
      '.........KKKKKKK',
      '..........YYYYYY',
      '...........KKKKK',
      '............YYYY',
      '.............KKK',
      '..............KK',
      '...............K',
      '................',
      '................'
    ],
    frames: {
      atk: [
        { x: 9, y: 7, rows: ['RR'], mirror: true },
        { x: 13, y: 10, rows: ['KKK', 'KRR'], mirror: true },
        { x: 0, y: 10, rows: ['..II', '.III', 'IIII'] }
      ],
      hurt: [
        { x: 8, y: 6, rows: ['YYYY', 'KKKK', 'YYYY', 'YYYY'], mirror: true },
        { x: 13, y: 10, rows: ['YYY'], mirror: true }
      ]
    }
  },

  cisne: {
    rows: [
      '..........I.I.I.................',
      '..........WWWW..................',
      '.........WWWWWW.................',
      '........KKWWWWWW................',
      '......OOKWKWWWW.................',
      '.....OOOKKWWWWW.................',
      '...........WWWW.................',
      '............WWW.................',
      '............WWWW................',
      '.............WWW................',
      '.............WWWW...............',
      '..............WWW...............',
      '..............WWW...............',
      '.............WWWW..........I....',
      '............WWWWW........IIII...',
      '...........WWWWWWW.....IIIIIII..',
      '.........WWWWWWWWWWIIIIIIIIII...',
      '.......WWWWWWWWWWWWWIIIIIIIII...',
      '......WWWWWWWWWWWWWWWIIIIIIII...',
      '.....WWWWWWWWWWWWWWWWWIIIIIII...',
      '....WWWWWWWWWWWWWWWWWWWIIIII....',
      '....WWWWWWWWWWWWWWWWWWWWIII.....',
      '....IWWWWWWWWWWWWWWWWWWWWW......',
      '.....IIWWWWWWWWWWWWWWWWWW.......',
      '......IIIIWWWWWWWWWWWWWI........',
      '........IIIIIIIIIIIIII..........',
      '..LLLLLLLLLLLLLLLLLLLLLLLLLLLL..',
      '.....LLLLLLLLLLLLLLLLLLLLLL.....',
      '........LLcLLLLLLLLLLcLLL.......',
      '...........LLLLLLLLLL...........',
      '................................',
      '................................'
    ],
    frames: {
      atk: [
        { x: 9, y: 4, rows: ['R'] },
        { x: 4, y: 4, rows: ['OO.', 'O__', '.OOO'] },
        { x: 20, y: 8, rows: ['......I', '.....II', '....III', '...IIII', '..IIIII', '.IIIIII'] }
      ],
      hurt: [
        { x: 8, y: 3, rows: ['KKK', 'KKK'] },
        { x: 9, y: 4, rows: ['K'] }
      ]
    }
  },

  orgao: {
    mirror: true,
    rows: [
      '.............SSS',
      '..........SS.SSS',
      '.......SS.SS.SSS',
      '....SS.SS.SS.SSS',
      '.SS.SS.SS.SS.SSS',
      '.SS.SS.SS.SS.SSS',
      '.SS.SS.SS.SS.SSS',
      '.KK.KK.KK.KK.KKK',
      '.SS.SS.SS.SS.SSS',
      '.SS.SS.SS.SS.SSS',
      'UUUUUUUUUUUUUUUU',
      'QQQQQQQQQQQQQQQQ',
      'QQQKKKKQQQQQQQQQ',
      'QQQKRRKQQQQQQQQQ',
      'QQQKRRKQQQQQQQQQ',
      'QQQKKKKQQQQQQQQQ',
      'QQQQQQQQQQQQQQQQ',
      'QQQQQKKKKKKKKKKK',
      'QQQQQKWKWKWKWKWK',
      'QQQQQKWKWKWKWKWK',
      'QQQQQKKKKKKKKKKK',
      'QQQQQQQQQQQQQQQQ',
      'UUUUUUUUUUUUUUUU',
      'mmmmmmmmmmmmmmmm',
      'mmmmmmmmmmmmmmmm',
      '.mmm............',
      '.mmm............',
      '.mmm............',
      'KKKKK...........',
      '................',
      '................',
      '................'
    ],
    frames: {
      atk: [
        { x: 4, y: 13, rows: ['YY', 'YY'], mirror: true },
        { x: 1, y: 7, rows: ['YY.YY.YY.YY.YYY'], mirror: true },
        { x: 5, y: 18, rows: ['KKKKKKKKKKK', 'KrrrrrrrrrrK'], mirror: true }
      ],
      hurt: [
        { x: 4, y: 13, rows: ['KK', 'KK'], mirror: true },
        { x: 3, y: 13, rows: ['K'], mirror: true }
      ]
    }
  },

  colosso: {
    mirror: true,
    rows: [
      '................',
      '................',
      '.........XXXXXXX',
      '........XXXXXXXX',
      '.......XXXXXXXXX',
      '.......XKKKXXXXX',
      '.......XKRRKXXXX',
      '.......XXKKXXXXX',
      '.......XXXXXXXXX',
      '.......XXXmmmmmm',
      '........XXXXXXXX',
      '...XXXXXXXXXXXXX',
      '.XXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXX',
      'XXXXmXXXXXXXXEEE',
      'XXXXmXXXXXXXEEOO',
      'XXXXmXXXXXXXEOYY',
      'XXXXmXXXXXXXEEOO',
      'XXXXXXXXXXXXXEEE',
      'MMMMXXXXXXXXXXXX',
      'MMMMMXXXXXXXXXXX',
      'MMMMM.XXXXXXXXXX',
      'MMMMM.XXXXXXXXXX',
      '.MMM..XXXXXXXXXX',
      '......XXXXXXX...',
      '......XXXXXXX...',
      '......XXXXXXX...',
      '......XXXXXXX...',
      '.....mmmmmmmm...',
      '................',
      '................',
      '................'
    ],
    frames: {
      atk: [
        { x: 9, y: 6, rows: ['YY'], mirror: true },
        { x: 12, y: 14, rows: ['.OOO', 'OYYY', 'OYWW', 'OYYY', '.OOO'], mirror: true },
        { x: 10, y: 9, rows: ['KKKKKK', 'KrrrrK'], mirror: true },
        { x: 0, y: 4, rows: ['.MMM.', 'MMMMM', 'MMMMM', 'MMMM.', '.XXX.', '.XXX.', '..XXX'] },
        { x: 0, y: 19, rows: ['XXXX', 'XXXXX', '_____', '_____', '____'] }
      ],
      hurt: [
        { x: 8, y: 5, rows: ['XXXX', 'KKKK', 'XXXX'], mirror: true },
        { x: 5, y: 12, rows: ['.K', 'K.', '.K', 'K.'], mirror: true }
      ]
    }
  },

  silencio: {
    mirror: true,
    rows: [
      '................',
      '..........ZZZZZZ',
      '........ZZZZZZZZ',
      '.......ZZZZZZZZZ',
      '......ZZZZZZZZZZ',
      '......ZZZWWWWWWW',
      '.....ZZZWWWWWWWW',
      '.....ZZWWKKKWWWW',
      '.....ZZWWKKKWWWW',
      '.....ZZWWWKWWWWW',
      '.....ZZWWWKWWWWW',
      '.....ZZZWWWWWWWW',
      '......ZZWWWWKKKK',
      '......ZZZWWWWWWW',
      '.....ZZZZZZZWWWW',
      '....ZZZZZZZZZZZZ',
      '...ZZZZZZZZZZZZZ',
      '..ZZZVZZZZZZZZZZ',
      '.ZZZZVZZZZZZZZZZ',
      '.ZZZVZZZZZZZZZZZ',
      'ZZZZVZZZZZZZZZZZ',
      'ZZZVZZZZZZZZZZZZ',
      'ZZVZZZZZZZZZZZZZ',
      '.ZZZZZZZVZZZZZZZ',
      '.ZZZZZZZVZZZZZZZ',
      '..ZZZZZZZVZZZZZZ',
      '..ZZZZ.ZZZVZZZZZ',
      '...ZZ...ZZZ.ZZZZ',
      '...Z.....Z...ZZZ',
      '...............Z',
      '................',
      '................'
    ],
    frames: {
      atk: [
        { x: 10, y: 7, rows: ['W', 'W'], mirror: true },
        { x: 12, y: 12, rows: ['KKKK', 'KZZZ', 'KKKK'], mirror: true },
        { x: 0, y: 14, rows: ['V....', 'VV...', '.VV..', '..VV.'], mirror: true }
      ],
      hurt: [
        { x: 9, y: 7, rows: ['WWW', 'KKK', 'WWW'], mirror: true },
        { x: 11, y: 4, rows: ['..K', '.K.', 'K..', '.K.', '..K'] }
      ]
    }
  }
};

/** Eco em 24 px: costas (batalha) e frente (retratos, vitória). */
const ECO_COSTAS = [
  '............',
  '........WWWW',
  '......WWCCCC',
  '.....WWWWCCC',
  '....WWWWWWWW',
  '...WWWWWWWWW',
  '..CWWWWWWWWW',
  '.CCWWWWWWWWW',
  '.CCWWWWWWWWW',
  '.CCWWWWWWWWW',
  '..CWWWWWWWWW',
  '...WWWWWWWWW',
  '....WWWWWWWW',
  '.....rrrrrrr',
  '....rrrrrrrr',
  '....CCCCCCCC',
  '...CCCCCCCCC',
  '..cCCCCCCCCC',
  '..cCCCCCCCCC',
  '..ccCCCCCCCC',
  '..WW.CCCCCCC',
  '.....CCCCCCC',
  '......CCC...',
  '......CCC...',
  '.....NNNN...',
  '............'
];
const ECO_FRENTE = ECO_COSTAS.map((r, i) => (
  i === 7 ? '.CCWWWKKWWWW' : i === 8 ? '.CCWWWKKWWWW' : i === 10 ? '..CWbbWWWWWW' : i === 11 ? '...WWWWWWKKK' : r
));

export const HERO_ARTS = {
  eco_costas: {
    mirror: true, rows: ECO_COSTAS,
    frames: {
      passo: [{ x: 6, y: 22, rows: ['CCC.', 'CCC.', 'NNNN', '____'] }, { x: 14, y: 22, rows: ['.___', '.CCC', '.NNN'] }],
      pulo: [
        { x: 2, y: 13, rows: ['WW.', 'cc.', 'cc.', 'c..', '__.', '___', '___'] },
        { x: 19, y: 13, rows: ['.WW', '.cc', '.cc', '..c', '.__', '___', '___'] },
        { x: 5, y: 21, rows: ['.CCCCCCCCCCCCC.', '.NNN.......NNN.', '_______________', '_______________'] }
      ],
      dor: [
        { x: 0, y: 15, rows: ['WW.', 'ccc'] }, { x: 21, y: 15, rows: ['.WW', 'ccc'] },
        { x: 2, y: 19, rows: ['___', '___'] }, { x: 19, y: 19, rows: ['___', '___'] }
      ],
      toca: [
        { x: 0, y: 4, rows: ['..rr', '.rrr', 'rrr.', 'rr..'] },
        { x: 3, y: 17, rows: ['.WW', 'cc.', '_'] }
      ]
    }
  },
  eco_frente: {
    mirror: true, rows: ECO_FRENTE,
    frames: {
      viva: [
        { x: 0, y: 11, rows: ['WW..', 'cc..', 'cc..', '.cc.', '..cc', '___c', '___'] },
        { x: 20, y: 11, rows: ['..WW', '..cc', '..cc', '.cc.', 'cc..', 'c___', '.___'] },
        { x: 9, y: 11, rows: ['KKKKKK', '.rrrr.'] }
      ],
      triste: [
        { x: 6, y: 7, rows: ['WWWW', 'KKWW'], mirror: true },
        { x: 9, y: 11, rows: ['WKKKKW'] }
      ]
    }
  }
};

const ECO_HEAD = ['....KKKKKKKK....', '...KWWWWWWWWK...', '..KWWWWWWWWWWK..', '.KKWWWWWWWWWWKK.'];
const ECO_BODY = ['..KKWWWWWWWWKK..', '..KrrrrrrrrrrK..', '.KcKrrrrrrrrKcK.', '.KcKCCCCCCCCKcK.', '..KKCCCCCCCCKK..', '...KCCKKKKCCK...'];

/** Sprites pequenos do protótipo (mundo aberto), com contorno próprio. */
export const SMALL_ART = {
  eco_d1: [...ECO_HEAD, 'KCKWWKWWWWKWWKCK', 'KCKWWKWWWWKWWKCK', 'KCKWWWWWWWWWWKCK', '.KKWWbWWWWbWWKK.', ...ECO_BODY, '...KNNK..KNNK...', '...KKKK..KKKK...'],
  eco_d2: [...ECO_HEAD, 'KCKWWKWWWWKWWKCK', 'KCKWWKWWWWKWWKCK', 'KCKWWWWWWWWWWKCK', '.KKWWbWWWWbWWKK.', ...ECO_BODY, '..KNNK....KNNK..', '..KKKK.....KKK..'],
  eco_u1: ['....KKKKKKKK....', '...KWCCCCCCWK...', '..KWWWWWWWWWWK..', '.KKWWWWWWWWWWKK.', 'KCKWWWWWWWWWWKCK', 'KCKWWWWWWWWWWKCK', 'KCKWWWWWWWWWWKCK', '.KKWWWWWWWWWWKK.', ...ECO_BODY, '...KNNK..KNNK...', '...KKKK..KKKK...'],
  eco_u2: ['....KKKKKKKK....', '...KWCCCCCCWK...', '..KWWWWWWWWWWK..', '.KKWWWWWWWWWWKK.', 'KCKWWWWWWWWWWKCK', 'KCKWWWWWWWWWWKCK', 'KCKWWWWWWWWWWKCK', '.KKWWWWWWWWWWKK.', ...ECO_BODY, '..KNNK....KNNK..', '..KKKK.....KKK..'],
  eco_s1: ['.....KKKKKK.....', '....KWWWWWWK....', '...KWWWWWWWWK...', '..KWWWWWWWWWWK..', '..KCCKWWWWKWWK..', '..KCCKWWWWKWWK..', '..KCCKWWWWWWWK..', '...KKWWWWWbWK...', '....KWWWWWWK....', '..rrKrrrrrrK....', '....KCCCCCCK....', '....KCKCCCCK....', '....KCCCCCCK....', '....KCCKKCCK....', '....KNNK.KNNK...', '....KKKK.KKKK...'],
  eco_s2: ['.....KKKKKK.....', '....KWWWWWWK....', '...KWWWWWWWWK...', '..KWWWWWWWWWWK..', '..KCCKWWWWKWWK..', '..KCCKWWWWKWWK..', '..KCCKWWWWWWWK..', '...KKWWWWWbWK...', '....KWWWWWWK....', '.rr.KrrrrrrK....', '....KCCCCCCK....', '....KCCCKCCK....', '....KCCCCCCK....', '....KCCKKCCK....', '.....KNNKNNK....', '.....KKKKKKK....'],
  clave: ['...VVVVVV...', '..VVVVVVVV..', '.VVFFFFFFVV.', '.VFKFFFFKFV.', '.VFFFFFFFFV.', '.VFWWWWWWFV.', '..VWWWWWWV..', '.VVVWWWWVVV.', '.VVVVWWVVVV.', '.VVVVVVVVVV.', '..VV....VV..', '..KK....KK..'],
  bip: ['....GGGG....', '...GGGGGG...', '..GGGGGGGGG.', '...FFFFFF...', '...FKFFKF...', '...FFFFFF...', '....FFFF....', '...OOOOOO...', '..FOOOOOOF..', '...OOOOOO...', '...NN..NN...', '...KK..KK...'],
  sapo: ['............', '..GG....GG..', '.GWKG..GWKG.', '.GGGGGGGGGG.', 'GGGGGGGGGGGG', 'GGRRRRRRRRGG', '.GGGGGGGGGG.', '..GgGGGGgG..', '.gg.GGGG.gg.', '............'],
  coruja: ['..N......N..', '..NNNNNNNN..', '.NNWWNNWWNN.', '.NWKWNNWKWN.', '.NNWWAAWWNN.', '.NNNNAANNNN.', '.NFFNNNNFFN.', '.NFFFNNFFFN.', '.NNFFFFFFNN.', '..NNNNNNNN..', '...AA..AA...', '............'],
  tuba: ['....RRRR....', '..RRWRRRRR..', '.RRRRRRWRRR.', 'RRWRRRRRRRRR', 'RRRRRWRRRWRR', '..FFFFFFFF..', '..FKFFFFKF..', '..FFFFFFFF..', '...FFRRFF...', '...FFFFFF...', '...FF..FF...', '...KK..KK...'],
  robo: ['.....KK.....', '.....KR.....', '..KKKKKKKK..', '..KMMMMMMK..', '..KMCMMCMK..', '..KMMMMMMK..', '..KMKKKKMK..', '..KKKKKKKK..', '.KMMMMMMMMK.', '.KMKYMMYKMK.', '..KMMKKMMK..', '..KK....KK..'],
  pistao: ['...OOOOOO...', '..OOOOOOOO..', '..KCCKKCCK..', '..FFFFFFFF..', '..FFFKKFFF..', '...FFFFFF...', '..BBBBBBBB..', '.FBBMBBMBBF.', '..BBBBBBBB..', '..BBBBBBBB..', '...NN..NN...', '...KK..KK...']
};

/** Ícones de dispositivo para as dicas de controle (seção 6: "os ícones certos para cada um"). */
export const ICON_ART = {
  teclado: [
    'KKKKKKKKKKKKK',
    'KMSMSMSMSMSMK',
    'KMMMMMMMMMMMK',
    'KMSMSMSMSMSMK',
    'KMMMMMMMMMMMK',
    'KMMSSSSSSSMMK',
    'KKKKKKKKKKKKK'
  ],
  controle: [
    '..KKKKKKKKK..',
    '.KmmmmmmmmmK.',
    'KmmSmmmmmGmmK',
    'KmSSSmmmRmCmK',
    'KmmSmmmmmYmmK',
    'KmmmmKKKmmmmK',
    '.KmmK...KmmK.',
    '..KK.....KK..'
  ],
  toque: [
    '...KK.....',
    '..KFFK....',
    '..KFFK....',
    '..KFFKKKK.',
    '..KFFFFFFK',
    'KKKFFFFFFK',
    'KFFFFFFFFK',
    'KFFFFFFFFK',
    '.KFFFFFFK.',
    '..KFFFFK..',
    '..KKKKKK..'
  ]
};
