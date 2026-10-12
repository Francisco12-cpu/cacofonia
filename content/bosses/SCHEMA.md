# Schema de chefe (`content/bosses/*.json`)

Ver CACOFONIA-BIBLIA.md seções 3.4 e 3.5.

```jsonc
{
  "id": "maestro",
  "nome": "Maestro Vórtice",
  "musica": "maestro",       // id em content/songs/
  "hpMax": 440,
  "tier": 1,                  // multiplicador de dificuldade (1/2/3), como no protótipo
  "final": false,
  "cor": "#ff2f8e",
  "sprite": "maestro",        // id do sprite em engine/render2d/art.js (BOSS_ART, 32×32, quadros atk/hurt)
  "cenario": { "sky": "#1a0626", "bg": "stars" },
  "efeitosEspeciais": [
    { "tipo": "camera-giro", "aPartirDaVolta": 2 }
  ],
  "janelasDeAtaque": [ { "batida": 24 }, { "batida": 56 } ], // pontos fixos (seção 4) — 3/4 da volta 1 e da volta 2
  "falas": {
    "intro": ["...QUEM OUSA ENTRAR NO MEU SALÃO?", "..."],
    "vitoria": ["Minha batuta... está leve de novo.", "..."],
    "provocacoes": ["Hmph. Um acerto de sorte.", "..."],
    "posLibertacao": ["Eu estava preso num compasso sem fim.", "..."]
  }
}
```

- `efeitosEspeciais[].tipo` referencia um plugin registrado em `engine/effects/plugins.js` — nenhum efeito é código exclusivo do chefe (seção 3.4).
- `janelasDeAtaque` são pontos fixos em batidas (não dinâmicos por quantidade de notas coletadas), conforme decisão fechada da seção 8.
- `falas.derrota` não existe por chefe no protótipo (a mensagem de derrota é genérica, sorteada entre dicas). Fica de fora por agora — pode ser adicionado depois sem quebrar o schema.
