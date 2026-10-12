/**
 * localStorage pode falhar (cota cheia, modo privado do Safari, armazenamento
 * desligado). Nesses casos o jogo continua normalmente — só não salva.
 */
export function ler(chave, padrao) {
  try {
    const s = localStorage.getItem(chave);
    return s === null ? padrao : JSON.parse(s);
  } catch { return padrao; }
}

export function gravar(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch (e) { console.warn(`Não consegui salvar "${chave}":`, e); return false; }
}
