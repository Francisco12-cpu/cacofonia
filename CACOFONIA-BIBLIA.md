# CACOFONIA — Bíblia do Projeto

**Criador:** Francisco Audir ([@filho.af](https://instagram.com/filho.af))
**Repositório:** `cacofonia`

Este documento existe para qualquer IA (ou pessoa) entender o jogo inteiro sem precisar perguntar. Leia isto antes de mexer em qualquer parte do projeto. Ele é a fonte da verdade — se o código e este documento discordarem, pare e pergunte ao Francisco antes de decidir qual está certo.

---

## 1. O que é o jogo

Cacofonia é um RPG de ritmo em pixel art + 3D. O jogador é um herói que enfrenta chefes musicais em batalhas de 5 pistas: desviar (ou pular) das notas que o chefe lança, e devolver dano tocando de volta a melodia que conseguiu capturar.

**Referências assumidas, não escondidas:** Everhood/Everhood 2 (batalha de ritmo ao contrário), Undertale (RPG, diálogo, escolha de poupar), Friday Night Funkin' (a música nasce das notas, não o contrário). O jogo não usa nome, personagens, sprites, sons ou músicas de nenhum desses — só a ideia geral de "desviar de notas em 3D/pseudo-3D com RPG por trás".

**Nome:** Cacofonia — o oposto de sinfonia. Nunca usar "Everhood" ou variações dele em nome, marca, textos ou arquivos.

**Estado atual:** existe um protótipo funcional de uma versão anterior (nome de código antigo "everbeat"), num arquivo único `everbeat-codigo-fonte.html`, com mundo aberto, 8 chefes, editor de coreografia simples e sistema de áudio em Tone.js + visual em Three.js/Canvas. Esse protótipo é o ponto de partida: **não jogar fora**, migrar e evoluir.

---

## 2. Visão de design

- **Estilo visual:** pixel art (personagens, chefes, mundo) misturada com 3D leve (Three.js) na batalha — pista, notas e cenário em 3D low-poly; personagens em sprites 2D dentro do mundo 3D (billboards). Menu e UI em estilo **futurista neon** (já definido e aprovado — não mudar a linguagem visual, só melhorar a execução): fonte pixelada, painéis escuros com borda roxa/ciano, glow, animações que reagem à música.
- **Tudo pulsa com a música.** A pista, os prédios do menu, o chefe, os botões — sempre que possível, sincronizado com a batida.
- **Leve e sem instalar nada:** roda no navegador, precisa ficar rápido em celular.
- **O jogador deve conseguir criar qualquer música e qualquer chefe pelo editor**, sem programar.

---

## 3. Arquitetura de conteúdo — tudo é dado (JSON), nada é hardcoded

Esta é a mudança mais importante desta fase: **notas, sons, chefes e músicas deixam de ser código e viram arquivos de dados.** O motor lê esses dados; ele não sabe de antemão quantos tipos de nota existem ou como cada chefe se comporta.

### 3.1 Tipo de nota (`content/notetypes/*.json`)

Cada tipo de nota é uma ficha própria. Campos mínimos:

```json
{
  "id": "parede",
  "nome": "Parede",
  "forma": "prisma",          // prisma | esfera | losango | placa | anel | customizado(ref a um modelo)
  "pistas": 1,                 // quantas pistas ocupa (1, 3, 4, 5...)
  "altura": "alta",            // "baixa" (dá pra pular) | "alta" (não dá)
  "duracao": 0,                 // 0 = instantânea; >0 = nota longa (feixe), em batidas
  "cor": "#ff2f8e",
  "instrumento": "brass",       // liga ao som E à forma (nunca só à cor — acessibilidade)
  "dano": 12,
  "avisoBatidas": "auto",       // "auto" = calculado pela largura (nota mais larga avisa mais cedo)
  "movimento": { "tipo": "reto" }  // reto | zigzag | bumerangue | divisora | fantasma | ima | gelo | customizado
}
```

- **Regra de aviso:** quanto mais pistas a nota ocupa ou mais perigosa (parede, longa+parede), mais cedo ela precisa aparecer. Fórmula simples: `aviso = base + (pistas-1)*fator + (ehParede ? extra : 0)`.
- **Regra de acessibilidade:** instrumento define forma E cor juntos. Nunca usar só cor para diferenciar perigo.
- **Dano escala com dificuldade de esquiva**, não é fixo por capricho: nota de 4 pistas dói mais que nota de 1 pista, como regra geral (o autor do jogo confirmou essa lógica).
- Tipos de movimento customizados adicionais sugeridos (implementar como plugins de movimento, não como casos especiais no código da batalha): zigue-zague configurável (amplitude, nº de pistas, velocidade), bumerangue (passa e volta), divisora (se parte em duas no meio do caminho), fantasma (some e reaparece perto do jogador), ímã (puxa o jogador uma pista), gelo (lentidão temporária), onda (pista inteira, só pulando).

### 3.2 Correção de bug obrigatória: dano de nota longa

**Bug atual:** notas longas com colisão contínua (tipo "parede longa") só causam dano uma vez (num flag `hurt` que vira `true` e nunca mais dispara), então o jogador toma dano só ao entrar e não enquanto permanece nela.

**Correção exigida:** dano por **tique de tempo** (ex.: a cada 0.35s de batida real, não de frame) enquanto o jogador estiver na pista da nota ativa. Isso vale para qualquer nota com `duracao > 0` e altura "alta".

### 3.3 Música (`content/songs/*.json`)

A música deixa de ser uma partitura fixa tocada por cima; ela é **construída a partir das notas do editor**. Estrutura mínima:

```json
{
  "id": "tema-maestro",
  "bpm": 100,
  "compasso": "4/4",
  "tom": "Am",
  "escala": "menor natural",
  "trilhas": {
    "melodia":  [ { "pos": 0, "nota": "A4", "duracao": 0.5 }, ... ],
    "harmonia": [ ... ],
    "baixo":    [ ... ],
    "bateria":  [ ... ]
  },
  "secoes": [ { "nome": "abertura", "compassos": 4 }, { "nome": "drop", "compassos": 8 } ]
}
```

- Toda nota colocada no editor **pertence a uma trilha e a um instrumento**, e o motor de áudio toca exatamente essas notas — não uma trilha decorativa separada de que "combina mais ou menos".
- **Trava de escala:** o editor só deixa colocar notas que pertencem ao tom/escala escolhidos, pra nunca desafinar.
- A coreografia de ataques (o que aparece na tela) é **derivada da trilha de melodia** (e opcionalmente de outras trilhas, como a bateria virando ondas de choque), usando a tabela de tipos de nota da seção 3.1. Notas "de enfeite" (ataques que não são da melodia, mas usam notas da mesma escala) são permitidas e não quebram a harmonia.
- Deve ser possível, em teoria, recriar qualquer música real dentro dessas regras (dentro do que a escala/tom permitir).

### 3.4 Chefe (`content/bosses/*.json`)

```json
{
  "id": "maestro",
  "nome": "Maestro Vórtice",
  "musica": "tema-maestro",
  "hpMax": 320,
  "sprite": "maestro.png",
  "efeitosEspeciais": [ { "tipo": "camera-giro", "aPartirDaVolta": 2 } ],
  "janelasDeAtaque": [ { "batida": 24 }, { "batida": 56 } ],
  "falas": { "intro": [...], "vitoria": [...], "derrota": [...] }
}
```

- **Efeitos especiais são um sistema plugável no motor de batalha**, não código exclusivo por chefe: espelho, apagão, câmera invertida, tela girando, terremoto, silêncio, etc. são "hooks" que qualquer chefe pode ligar, com parâmetros (quando começa, intensidade). Criar um chefe novo não deve exigir escrever uma função nova no motor, só configurar quais hooks ele usa.
- **Janelas de ataque em pontos fixos definidos por cada chefe** (decisão confirmada) — não dinâmico por quantidade de notas coletadas, nem aleatório.

### 3.5 Migração dos chefes existentes

**Manter e melhorar todos os 8 chefes atuais** sob esse novo sistema (decisão confirmada): Maestro Vórtice, DJ Tamborim, Cantora Fantasma, Rainha Zumbido, Cisne de Cristal, Órgão-Mecânico, Colosso do Destino e O Grande Silêncio, com suas músicas (arranjos 8-bit de obras em domínio público — Grieg, Mozart, Beethoven, Bach etc., mantendo a nota de crédito). Cada um vira um arquivo de conteúdo (chefe + música + efeitos) no novo formato, sem perder o que já funciona (identidade visual, falas, efeito especial de cada um).

---

## 4. O ataque — "Resposta" (mecânica própria, não é o rebater do Everhood)

Fluxo confirmado pelo autor:

1. **Durante a luta normal** (sem pausar nada), certas notas vêm **douradas**. O jogador as "coleta" tocando-as no tempo certo (como as notas comuns, mas em vez de dano, elas se somam a uma **melodia em construção**, mostrada numa mini-pauta na tela).
2. Em **pontos fixos que o chefe define** (`janelasDeAtaque`), a luta entra numa **fase de resposta**: o jogo mostra que agora é a vez do jogador "tocar de volta" a melodia que coletou.
3. Nessa fase, aparece **uma barra de tempo por nota da melodia coletada** (como o sistema antigo de contra-ataque, com zona de acerto): o jogador aperta no momento certo para cada nota da sua própria melodia. Acertar bem no centro = **perfeito** (mais dano); acertar dentro da zona = bom; errar o tempo = a nota sai "desafinada".
4. **Qualidade do resultado:**
   - Melodia completa, na ordem certa e bem cronometrada → dano cheio.
   - Melodia incompleta (faltou coletar alguma nota) → dano reduzido, proporcional ao que foi coletado.
   - Melodia fora de ordem ou muito desafinada → sai ruim, pouco ou nenhum dano.
5. Fica a critério da implementação (e de teste) se o chefe reage visivelmente quando a resposta acerta (se encolhe, erra o próprio compasso por um instante) — isso é desejável, mas não bloqueante.

Isso substitui o "rebater notas douradas uma a uma" de versões anteriores. A diferença chave: aqui você **constrói** uma melodia ao longo da luta e **a executa** de volta, em vez de apenas devolver notas individuais.

---

## 5. Editor

O editor deixa de ser "arrastar notas por cima de uma música pronta" e passa a ser **o compositor real**: um piano roll / trilhas por instrumento, onde:

- Cada trilha (melodia, harmonia, baixo, bateria) tem seu instrumento.
- Colocar uma nota numa trilha **toca aquele som, na hora, na música final**.
- Trava de escala/tom evita nota desafinada.
- Cada tipo de nota do jogo (seção 3.1) pode ser associado a posições da trilha de melodia (ou de outra trilha, como bateria virando "onda"), controlando o que aparece na batalha.
- Deve ser possível testar a luta direto do editor (recurso que já existe no protótipo — manter).
- Exportar/importar em JSON (já existe no protótipo — manter e adaptar ao novo esquema).

---

## 6. Tecnologia

- **Build:** Vite (`vite-plugin-singlefile` ou similar para gerar um HTML final único, se ainda for esse o formato de distribuição desejado — a decidir/confirmar antes de finalizar o build, mas o **desenvolvimento** passa a ser em múltiplos arquivos).
- **Áudio:** Tone.js.
- **3D:** Three.js.
- **Sem dependências pesadas de motor de jogo** (nada de Phaser/Unity) — o objetivo é leveza.
- **Controles:** detectar e suportar toque (celular), mouse+teclado e controle (Gamepad API), mostrando os ícones certos para cada um.
- **Organização de pastas sugerida** (ajustável pela IA ao implementar):

```
cacofonia/
  engine/        # relógio de música, entrada, áudio, render 2D, render 3D, registro de tipos de nota
  game/          # mundo aberto, batalha, diálogo, itens, editor
  content/
    notetypes/
    songs/
    bosses/
    maps/
  assets/        # sprites, fontes
  editor/
```

---

## 7. Fora de escopo nesta fase (fica para depois)

- História nova, cutscenes, novos personagens de mundo, novos NPCs.
- Novos mundos além dos 3 já existentes.
- Publicação/loja/monetização.

O objetivo desta fase é ter um **motor de testes**: todos os chefes atuais rodando no novo sistema orientado a dados, editor funcional de verdade, ataque novo funcionando, para o autor testar habilidade e equilíbrio antes de vestir tudo com história.

---

## 8. Decisões já fechadas (não reabrir sem o autor pedir)

- Nome do jogo: **Cacofonia**.
- Nome do repositório: **cacofonia**.
- Mecânica de ataque: coleta + resposta com barra de tempo por nota (seção 4).
- Janelas de ataque em pontos fixos por chefe.
- Manter todos os 8 chefes atuais, migrados e melhorados.
- Migrar já para Vite/múltiplos arquivos.
- Estilo visual futurista neon do menu atual: manter a linguagem, só refinar.
- Repositório já conectado ao GitHub do autor; usar Git normalmente.
