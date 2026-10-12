/**
 * Nota final da luta (S/A/B/C/D) — mostrada na tela de vitória e guardada
 * como recorde por chefe. Mistura três coisas que o jogo quer ensinar:
 * sobreviver (vida que sobrou), ouvir (douradas coletadas) e responder no
 * tempo (precisão da fase de Resposta).
 */
export function calcularNota({ hp, maxHp, stats }) {
  const vida = maxHp > 0 ? Math.max(0, hp) / maxHp : 0;
  const coleta = stats.douradasVistas > 0 ? stats.douradasColetadas / stats.douradasVistas : 0;
  const precisao = stats.respostaNotas > 0 ? stats.respostaPontos / stats.respostaNotas : 0;
  const pontos = vida * 0.35 + coleta * 0.3 + precisao * 0.35;
  const letra = pontos >= 0.9 ? 'S' : pontos >= 0.75 ? 'A' : pontos >= 0.6 ? 'B' : pontos >= 0.4 ? 'C' : 'D';
  return { letra, pontos, vida, coleta, precisao };
}

const ORDEM = ['D', 'C', 'B', 'A', 'S'];
/** A melhor de duas letras (para o recorde). */
export function melhorNota(a, b) {
  if (!a) return b; if (!b) return a;
  return ORDEM.indexOf(a) >= ORDEM.indexOf(b) ? a : b;
}
