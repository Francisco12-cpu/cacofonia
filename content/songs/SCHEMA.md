# Schema de música (`content/songs/*.json`)

Ver CACOFONIA-BIBLIA.md seção 3.3.

```jsonc
{
  "id": "maestro",
  "bpm": 100,
  "bpmProgressao": { "porVolta": 8, "maximo": 180 }, // opcional: aceleração do chefe a cada volta
  "compasso": "4/4",
  "tom": "Am",
  "escala": "menor natural",
  "credito": "Edvard Grieg — ... domínio público, arranjo 8-bit original.",
  "trilhas": {
    "melodia":  [ { "pos": 0, "nota": "A4", "duracao": 0.5 }, ... ],
    "harmonia": [ ... ],
    "baixo":    [ ... ],
    "bateria":  [ { "pos": 0, "voz": "kick", "duracao": 0.25 }, ... ],
    "arpejo":   [ ... ] // opcional — quinta trilha do protótipo, mantida para não perder o som original
  },
  "secoes": [ { "nome": "volta-1", "compassos": 8 } ]
}
```

- `pos` e `duracao` são em **batidas** (1 batida = 1 semínima), não em segundos — o motor de áudio (Tone.js) converte para tempo real usando `bpm`.
- `trilhas.melodia` é a fonte da coreografia de ataques (seção 3.1/3.3): cada nota da melodia vira um ataque via a tabela de tipos de nota.
- `trilhas.bateria` usa `voz` (nome do instrumento de percussão: `kick`, `snare`, `hat`, `ohat`, `crash`, `tom`) em vez de `nota`, já que não tem afinação.
- `tom`/`escala` travam o que o editor deixa colocar em `melodia`/`harmonia`/`arpejo` (nunca em `bateria`).
- As 8 músicas migradas foram assadas (baked) a partir da lógica procedural do protótipo por `scripts/bake-songs.mjs` — harmonia/baixo/bateria eram geradas em tempo real ali; aqui já vêm como notas explícitas por trilha, exatamente como a seção 3.3 pede ("o motor de áudio toca exatamente essas notas, não uma trilha decorativa separada").
