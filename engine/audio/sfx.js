import * as Tone from 'tone';

/**
 * Efeitos sonoros da batalha, disparados pela fila de eventos do
 * BattleController. A nota dourada coletada soa com a própria altura da
 * melodia, e na fase de Resposta cada aperto toca a nota da melodia do
 * jogador — desafinada (um semitom abaixo) quando o tempo erra (seção 4.3).
 */
export function createSfx(synths) {
  const agora = () => Tone.now() + 0.01;
  return {
    handle(ev) {
      switch (ev.tipo) {
        case 'dano':
          synths.hurt.triggerAttackRelease(0.18, agora());
          break;
        case 'coleta':
          synths.fx.triggerAttackRelease(Tone.Frequency(ev.nota).transpose(12).toFrequency(), 0.09, agora());
          break;
        case 'respostaInicio':
          synths.fx2.triggerAttackRelease('G5', 0.1, agora());
          synths.fx2.triggerAttackRelease('C6', 0.14, agora() + 0.12);
          break;
        case 'respostaNota': {
          const f = Tone.Frequency(ev.nota);
          if (ev.qualidade === 'errou') synths.voice.triggerAttackRelease(f.transpose(-1).toFrequency() * 1.02, 0.18, agora());
          else synths.lead.triggerAttackRelease(f.toFrequency(), ev.qualidade === 'perfeito' ? 0.3 : 0.2, agora());
          break;
        }
        case 'vitoria':
          ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].forEach((n, i) => synths.fx.triggerAttackRelease(n, 0.09, agora() + i * 0.1));
          break;
        case 'derrota':
          ['E4', 'D#4', 'D4', 'C#4'].forEach((n, i) => synths.fx2.triggerAttackRelease(n, 0.16, agora() + i * 0.18));
          break;
        case 'respostaFim':
          if (ev.dano > 0) synths.crash.triggerAttackRelease(0.4, agora(), 0.9);
          break;
      }
    }
  };
}
