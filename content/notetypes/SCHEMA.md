# Schema de tipo de nota (`content/notetypes/*.json`)

Ver CACOFONIA-BIBLIA.md seção 3.1. Campos:

| campo         | tipo                 | obrigatório | notas |
|---------------|----------------------|-------------|-------|
| id            | string               | sim         | único, usado como nome do arquivo |
| nome          | string               | sim         | exibido no editor |
| forma         | enum                 | sim         | `esfera \| prisma \| losango \| placa \| anel \| customizado` — `customizado` usa a silhueta do movimento (bumerangue, fantasma, ímã, gelo, divisora; ver engine/render2d/noteArt.js) |
| pistas        | inteiro >= 1         | sim         | largura padrão em pistas (chart pode sobrescrever) |
| altura        | enum                 | sim         | `baixa` (pulável) \| `alta` (bloqueia pulo) |
| duracao       | número >= 0          | sim         | 0 = instantânea; >0 = padrão em batidas para notas longas |
| duracaoVariavel | boolean            | não         | se true, o chart pode sobrescrever `duracao` por instância |
| cor           | string (hex)         | sim         | acompanha o instrumento — nunca é o único diferenciador |
| instrumento   | string               | sim         | liga forma+som; ids livres (ex: `lead`,`brass`,`harm`,`arp`,`bass`,`kick`) |
| dano          | número >= 0          | sim         | escala com dificuldade de esquiva |
| tiqueDano     | objeto               | não         | `{ intervalo }` (segundos entre tiques) — obrigatório se `altura==='alta'` e a nota puder ter duração > 0. `dano` é aplicado a cada tique enquanto o jogador estiver na pista da nota ativa |
| avisoBatidas  | número \| "auto"     | sim         | "auto" = `base + (pistas-1)*fator + (ehParede?extra:0)` |
| movimento     | objeto               | sim         | `{ tipo, ...params }` — tipo é resolvido no registro de plugins de movimento |
| coletavel     | boolean              | não         | true para notas douradas (alimentam a melodia da Resposta) |
