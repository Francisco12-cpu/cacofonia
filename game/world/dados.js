/**
 * Dados da Aventura (mundo aberto), portados do protótipo: os 3 mundos com
 * seus mapas em texto, moradores, portais dos chefes, presentes (amuletos e
 * páginas do diário). Os textos que falavam do "rebater" antigo foram
 * atualizados para a mecânica Resposta (seção 4 da bíblia).
 *
 * Legenda dos mapas: '#' árvore/muro · '.' chão · ',' flores · '=' caminho ·
 * '~' água · 'R' telhado · 'H' parede · 'D' porta de casa · 'F' fonte ·
 * 'S' placa · 'm' cogumelo · 'g' engrenagem · 'W' estrada para outro mundo ·
 * 'E' ponto inicial · dígitos = portal de chefe (ver `portas`).
 */

/** Ordem dos chefes na Aventura e quem precisa ser libertado antes de cada um. */
export const CHEFES = [
  { id: 'maestro', mundo: 'vila', precisa: [] },
  { id: 'dj', mundo: 'vila', precisa: ['maestro'] },
  { id: 'fantasma', mundo: 'vila', precisa: ['dj'] },
  { id: 'zumbido', mundo: 'floresta', precisa: [] },
  { id: 'cisne', mundo: 'floresta', precisa: [] },
  { id: 'orgao', mundo: 'cidadela', precisa: [] },
  { id: 'colosso', mundo: 'cidadela', precisa: [] },
  { id: 'silencio', mundo: 'cidadela', precisa: ['orgao', 'colosso'], final: true }
];

export const QUEM = {
  narr: { nome: '', spr: null, voz: 0 },
  eco: { nome: 'ECO', spr: 'eco_d1', voz: 520 },
  clave: { nome: 'VÓ CLAVE', spr: 'clave', voz: 230 },
  bip: { nome: 'BIP', spr: 'bip', voz: 620 },
  sapo: { nome: 'SAPO SOPRO', spr: 'sapo', voz: 140 },
  placa: { nome: 'PLACA', spr: null, voz: 0 },
  coruja: { nome: 'CORUJA OITAVA', spr: 'coruja', voz: 300 },
  tuba: { nome: 'COGUMELO TUBA', spr: 'tuba', voz: 110 },
  robo: { nome: 'ROBÔ METRÔNOMO', spr: 'robo', voz: 700 },
  pistao: { nome: 'ENGENHEIRA PISTÃO', spr: 'pistao', voz: 380 },
  maestro: { nome: 'MAESTRO VÓRTICE', spr: 'maestro', voz: 180 },
  dj: { nome: 'DJ TAMBORIM', spr: 'dj', voz: 320 },
  fantasma: { nome: 'CANTORA FANTASMA', spr: 'fantasma', voz: 440 },
  zumbido: { nome: 'RAINHA ZUMBIDO', spr: 'zumbido', voz: 880 },
  cisne: { nome: 'CISNE DE CRISTAL', spr: 'cisne', voz: 560 },
  orgao: { nome: 'ÓRGÃO-MECÂNICO', spr: 'orgao', voz: 120 },
  colosso: { nome: 'COLOSSO DO DESTINO', spr: 'colosso', voz: 90 },
  silencio: { nome: 'O GRANDE SILÊNCIO', spr: 'silencio', voz: 60 }
};

export const DIARIO = {
  inicio: { t: 'O Grande Silêncio', x: 'A Vó Clave me deu este diário. Tenho que libertar os Guardiões da Música e recuperar as Notas-Semente.' },
  resposta: { t: 'Resposta', x: 'As notas DOURADAS são pedaços da melodia. Fico na pista delas e aperto COLETAR na hora certa: elas entram na minha pauta. De tempos em tempos vem a RESPOSTA: toco minha melodia de volta, apertando quando cada losango passa pelo centro. Melodia completa e no tempo = dano cheio no guardião.' },
  musica: { t: 'Ouvir para ver', x: 'Cada nota que chega em mim é uma nota da música. Nota longa vira feixe comprido. Nota repetida vem na mesma pista. Grave vem pela esquerda, agudo pela direita. Se conheço a música, sei o que vem.' },
  pulo: { t: 'Pulo', x: 'Pulando passo por cima de tudo que está no chão: notas baixas, ondas azuis e os feixes laranja. Só as PAREDES rosas não dá: tenho que sair da pista. O pulo só protege lá no alto.' },
  maestro: { t: 'Maestro Vórtice', x: 'A música dele acelera a cada volta. Depois da segunda volta a câmera começa a girar.' },
  dj: { t: 'DJ Tamborim', x: 'No DROP a tela pisca e treme, mas é só visual. Siga o bumbo.' },
  fantasma: { t: 'Cantora Fantasma', x: 'Ela apaga as luzes a cada 16 batidas. No escuro, a música é o mapa.' },
  zumbido: { t: 'Rainha Zumbido', x: 'Escalas descendo a pista inteira, uma nota por pista. No ENXAME as notas chegam bem mais rápido.' },
  cisne: { t: 'Cisne de Cristal', x: 'No REFLEXO a tela fica de cabeça pra baixo. Os controles continuam iguais.' },
  orgao: { t: 'Órgão-Mecânico', x: 'Notas longas viram feixes enormes. O VITRAL troca todas as cores, e da segunda volta em diante vem o ESPELHO: a tela vira de lado, mas os controles não.' },
  colosso: { t: 'Colosso do Destino', x: 'Sempre três curtas e um golpe forte. No TERREMOTO a pista treme.' },
  silencio: { t: 'O Grande Silêncio', x: 'Em alguns trechos a música some e as cores invertem. Preciso lembrar o ritmo sem ouvir.' },
  final: { t: 'Fim da jornada', x: 'O Silêncio não era o vilão que eu pensava. Ele só queria ser a pausa entre as notas.' }
};

export const AMULETOS = {
  tenis: { n: 'TÊNIS DO BIP', d: 'Pulo mais longo: protege por mais tempo no ar.' },
  fole: { n: 'FÔLEGO DO SAPO', d: '+20 de HP máximo.' },
  cha: { n: 'CHÁ DA VÓ', d: 'Recupera 12 HP toda vez que a música do chefe recomeça.' },
  oculos: { n: 'ÓCULOS DA CORUJA', d: 'As notas aparecem um pouco mais cedo.' },
  esporo: { n: 'ESPORO DA TUBA', d: 'Uma vez por luta, você levanta com 40% de HP.' },
  metro: { n: 'METRÔNOMO', d: 'O chefe acelera só metade do normal.' },
  luva: { n: 'LUVA DE ECO', d: 'Zona de acerto da Resposta maior e +25% de dano.' }
};

export const INTRO = [
  ['narr', 'Em Ecolândia, tudo cantava. O vento, a água, até as pedras.'],
  ['narr', 'Até o dia em que o Grande Silêncio chegou.'],
  ['narr', 'Ele corrompeu os Guardiões da Música e roubou as Notas-Semente.'],
  ['narr', 'Você é Eco. Pequeno, mas com o ouvido mais afinado do mundo.'],
  ['narr', 'A Vó Clave está te esperando. Ande até ela e aperte AÇÃO para conversar.']
];

export const FINAL = [
  ['narr', 'A última Nota-Semente brilhou, e Ecolândia inteira voltou a cantar.'],
  ['narr', 'O vento, a água, até as pedras.'],
  ['narr', 'E entre uma nota e outra, uma pausa tranquila: o Silêncio, finalmente em paz.'],
  ['narr', 'FIM. Obrigado por jogar CACOFONIA!']
];

export const MUNDOS = {
  vila: {
    nome: 'ECOLÂNDIA', tema: 'vila', musica: 'vila', portas: { 1: 'maestro', 2: 'dj', 3: 'fantasma' },
    mapa: ['################################', '###############.3.##############', '###############.=.##############', '###.1.,.......,.=.,.......2.,###', '###.=...........=.........=....#', '###.===========.=.=========....#', '###............===.............#', '##..,...~~~~....=....~~~~...,..#', '##.....~~~~~~...=...~~~~~~.....#', '##......~~~~....=....~~~~......#', '##..RRRR........=........RRRR..#', '##..HHDH.....,..=..,.....HDHH..#', '##....=.........=..........====W', '##....=====.....=....=======...#', '##........======FF=====........#', '##..,..........=FF.=.......,...#', '##..RRRR.......=...=.....,.....#', '##..HDHH.......=...=.....S.....#', '##....==========...==========..#', '##..............E..............#', '###...,.......,.......,......###', '################################'],
    estradas: [{ x: 31, y: 12, para: 'floresta', tx: 1, ty: 10, precisa: ['maestro', 'dj', 'fantasma'] }],
    moradores: [{ id: 'clave', x: 9, y: 19 }, { id: 'bip', x: 21, y: 12 }, { id: 'sapo', x: 12, y: 9 }, { id: 'l-maestro', x: 5, y: 5, spr: 'maestro', depois: 'maestro' }, { id: 'l-dj', x: 27, y: 5, spr: 'dj', depois: 'dj' }, { id: 'l-fantasma', x: 18, y: 3, spr: 'fantasma', depois: 'fantasma' }],
    placa: [['placa', 'Norte: Cantora Fantasma.'], ['placa', 'Oeste: Maestro Vórtice. Leste: DJ Tamborim.'], ['placa', 'Estrada leste: Floresta Sussurro.']]
  },
  floresta: {
    nome: 'FLORESTA SUSSURRO', tema: 'floresta', musica: 'floresta', portas: { 4: 'zumbido', 5: 'cisne' },
    mapa: ['############################', '####...m.....###...,...m.###', '###...4.....#####.....5..###', '###...=.....#~~~#.....=...##', '##....=......~~~......=....#', '##....=======~~~=======....#', '#.m..........~~~.......m...#', '#......#.....===.....#.....#', '#..#.........=.=.......,...#', '#.......m....=.=...........#', 'W============...===========W', '#....,.......=.=......m....#', '#..#.........=.=.......#...#', '#......m.....===...........#', '#..,..............#...m..,.#', '##......#..................#', '###..m.........,.......m..##', '############################'],
    estradas: [{ x: 0, y: 10, para: 'vila', tx: 30, ty: 12, precisa: [] }, { x: 27, y: 10, para: 'cidadela', tx: 1, ty: 10, precisa: ['zumbido', 'cisne'] }],
    moradores: [{ id: 'coruja', x: 9, y: 6 }, { id: 'tuba', x: 20, y: 11 }, { id: 'l-zumbido', x: 8, y: 3, spr: 'zumbido', depois: 'zumbido' }, { id: 'l-cisne', x: 24, y: 3, spr: 'cisne', depois: 'cisne' }]
  },
  cidadela: {
    nome: 'CIDADELA DAS ENGRENAGENS', tema: 'cidadela', musica: 'cidadela', portas: { 6: 'orgao', 7: 'colosso', 9: 'silencio' },
    mapa: ['############################', '###.........######........##', '###..6......##.9.##...7...##', '###..=......##.=.##...=...##', '##...=.........=......=....#', '##...=====================.#', '#.....g........=.......g...#', '#..RRRR........=.....RRRR..#', '#..HDHH...~~~..=.....HHDH..#', '#....=....~~~..=.......=...#', 'W=========================.#', '#.....,.......=.......,....#', '#..g.....RRRR.=...g........#', '#........HHDH.=.......~~~..#', '#...,.......=.=.......~~~..#', '##..........===............#', '###.....,..........,......##', '############################'],
    estradas: [{ x: 0, y: 10, para: 'floresta', tx: 26, ty: 10, precisa: [] }],
    moradores: [{ id: 'robo', x: 8, y: 4 }, { id: 'pistao', x: 18, y: 9 }, { id: 'l-orgao', x: 7, y: 3, spr: 'orgao', depois: 'orgao' }, { id: 'l-colosso', x: 24, y: 3, spr: 'colosso', depois: 'colosso' }]
  }
};
for (const m of Object.values(MUNDOS)) {
  m.cols = Math.max(...m.mapa.map((r) => r.length)); m.lins = m.mapa.length;
  m.grade = m.mapa.map((r) => r.padEnd(m.cols, '#').split(''));
  m.posPortas = {};
  m.grade.forEach((lin, y) => lin.forEach((c, x) => { if (m.portas[c] !== undefined) m.posPortas[c] = { x, y }; }));
}
export const INICIO = { x: 16, y: 19 };
export const ANDA = new Set(['.', ',', '=', 'E', 'W', '1', '2', '3', '4', '5', '6', '7', '9']);

/** Presentes dos moradores: amuleto e páginas do diário (com condição de quais chefes já foram libertados). */
export const PRESENTES = {
  bip: { amuleto: 'tenis', diario: ['pulo'] },
  sapo: { amuleto: 'fole', precisa: ['maestro'] },
  clave: { amuleto: 'cha', precisa: ['maestro', 'dj', 'fantasma'], diario: ['inicio', 'resposta', 'musica'] },
  coruja: { amuleto: 'oculos', diario: ['zumbido', 'cisne'] },
  tuba: { amuleto: 'esporo', algum: ['zumbido', 'cisne'] },
  robo: { amuleto: 'metro', diario: ['silencio'] },
  pistao: { amuleto: 'luva', diario: ['orgao', 'colosso'] }
};

/** Falas de cada morador conforme o progresso. `livre(id)` devolve as falas do guardião libertado. */
export function falasDe(id, libertos, livre) {
  const L = (c) => libertos.has(c), todos = (a) => a.every(L);
  switch (id) {
    case 'clave':
      if (!L('maestro')) return [['clave', 'Eco! Graças ao ritmo, você acordou.'], ['clave', 'Tome este diário. Anote tudo o que aprender.'], ['clave', 'Os Guardiões perderam o juízo. O Maestro Vórtice está no portal a oeste.'], ['clave', 'Guardiões só se ferem com a própria música: colete as notas DOURADAS e devolva a melodia na RESPOSTA.']];
      if (!L('dj')) return [['clave', 'Você libertou o Maestro! Escuta só o vento...'], ['clave', 'O DJ Tamborim guarda o portal a leste. Cuidado com o DROP.']];
      if (!L('fantasma')) return [['clave', 'Só falta a Cantora Fantasma, no portal do norte.'], ['clave', 'Ela apaga as luzes. Confie nos seus ouvidos.']];
      if (!L('silencio')) return [['clave', 'Os três guardiões da vila estão livres!'], ['clave', 'Tome este chá. Ele te dá forças toda vez que a música recomeça.'], ['clave', 'O Grande Silêncio fugiu pela estrada leste, rumo à Floresta Sussurro.']];
      return [['clave', 'Você salvou o mundo inteiro, pequeno. Escuta como tudo canta!']];
    case 'bip': return [['bip', 'Oi, Eco! Toma meu tênis, ele te deixa mais tempo no ar!'], ['bip', 'Mas lembra: o pulo só protege lá no alto. Pula na hora, não antes.']];
    case 'sapo': return L('maestro') ? [['sapo', 'CROAC! Ouvi o Maestro tocar de novo e meu fôlego voltou!'], ['sapo', 'Leva um pouco dele com você. Croac!']] : [['sapo', 'Croac. Antes do Silêncio eu era barítono.'], ['sapo', 'Liberte o Maestro e talvez meu fôlego volte...']];
    case 'coruja': return todos(['zumbido', 'cisne']) ? [['coruja', 'Huu. A trilha a leste está aberta. A Cidadela te espera.']]
      : [['coruja', 'Huu. O Silêncio passou por aqui voando baixo.'], ['coruja', 'Leve meus óculos. Eles veem o perigo antes de ele chegar.'], ['coruja', 'A Rainha e o Cisne guardam esta floresta. Anotei o jeito deles no seu diário.']];
    case 'tuba': return (L('zumbido') || L('cisne')) ? [['tuba', 'Pooom! Você já libertou um guardião!'], ['tuba', 'Toma meu esporo. Se cair numa luta, ele te levanta uma vez.']] : [['tuba', 'Pooom. Eu sou a tuba da floresta.'], ['tuba', 'Liberte um guardião daqui e eu te dou um presente.']];
    case 'robo': return todos(['orgao', 'colosso']) ? [['robo', 'TIC. TAC. PORTÃO DO TOPO ABERTO. BOA SORTE, UNIDADE ECO.']]
      : [['robo', 'TIC. TAC. O GRANDE SILÊNCIO ESTÁ NO TOPO DA CIDADELA.'], ['robo', 'LEVE MEU METRÔNOMO. OS CHEFES ACELERAM MENOS COM ELE.'], ['robo', 'O PORTÃO SÓ ABRE COM AS NOTAS DO ÓRGÃO E DO COLOSSO.']];
    case 'pistao': return [['pistao', 'Fiz uma luva que devolve som com mais força. É sua!'], ['pistao', 'O Colosso sempre bate igual: três curtas e um golpe. Anotei no seu diário.']];
    default: return livre(id.slice(2));
  }
}

export const TEMAS = {
  vila: { g: '#2f7d3f', g1: '#3b9450', g2: '#276a35', tree: '#14532d', treeH: '#22a052', path: '#9c7a4f', p1: '#b8935f', p2: '#7d5f3b', water: '#1d4e9e', wave: '#3a7bd5', roof: '#a8324a', roofL: '#7a2034', wall: '#e8d3a8', wallL: '#c9ad7c', win: '#3a6fb0', fl: ['#ff7ab8', '#f5ff3d', '#e8b4ff'], luz: '255,220,140' },
  floresta: { g: '#1d4a2c', g1: '#28603a', g2: '#163b23', tree: '#0b2e18', treeH: '#1f7a3f', path: '#6b5234', p1: '#80653f', p2: '#4f3c25', water: '#16433f', wave: '#2f7f76', roof: '#6b3fa0', roofL: '#4a2a70', wall: '#b8a27c', wallL: '#8f7a58', win: '#8fffff', fl: ['#8fffff', '#b066ff', '#f5ff3d'], luz: '80,255,200' },
  cidadela: { g: '#3a3f52', g1: '#2c3040', g2: '#454b62', tree: '#23263a', treeH: '#4a5068', path: '#5a6178', p1: '#8a93a8', p2: '#474d62', water: '#2b1a5e', wave: '#b066ff', roof: '#2a2f45', roofL: '#ff2f8e', wall: '#3a3f52', wallL: '#2c3040', win: '#f5ff3d', fl: ['#2be9ff', '#ff2f8e', '#f5ff3d'], luz: '176,102,255' }
};
