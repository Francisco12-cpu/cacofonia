/**
 * Transição entre telas: blocos de pixel cobrem a tela em diagonal, a troca
 * acontece por baixo e os blocos se desfazem. Com "efeitos reduzidos" vira
 * um esmaecer rápido.
 */
export function criarTransicao(canvas, { reduzido = () => false } = {}) {
  const ctx = canvas.getContext('2d');
  let ocupado = false;

  function grade() {
    const lado = 24;
    canvas.width = Math.ceil(window.innerWidth / lado); canvas.height = Math.ceil(window.innerHeight / lado);
    return { cols: canvas.width, lins: canvas.height };
  }

  function animar(dur, desenhar) {
    return new Promise((ok) => {
      const t0 = performance.now();
      const passo = (agora) => {
        const k = Math.min(1, (agora - t0) / dur);
        desenhar(k);
        if (k < 1) requestAnimationFrame(passo); else ok();
      };
      requestAnimationFrame(passo);
    });
  }

  function blocos(k, cobrindo, g) {
    ctx.clearRect(0, 0, g.cols, g.lins);
    const total = g.cols + g.lins;
    ctx.fillStyle = '#05030e';
    for (let y = 0; y < g.lins; y++) for (let x = 0; x < g.cols; x++) {
      const ordem = (x + y + ((x * 7 + y * 13) % 5) * 0.6) / (total + 3);
      if (cobrindo ? ordem < k : ordem >= k) ctx.fillRect(x, y, 1, 1);
    }
    // Frente da onda em neon.
    ctx.fillStyle = '#ff2f8e';
    for (let y = 0; y < g.lins; y++) for (let x = 0; x < g.cols; x++) {
      const ordem = (x + y + ((x * 7 + y * 13) % 5) * 0.6) / (total + 3);
      if (Math.abs(ordem - k) < 0.025) ctx.fillRect(x, y, 1, 1);
    }
  }

  /** Cobre a tela, executa `trocar()` e descobre. Chamadas durante uma transição executam direto. */
  return async function transicao(trocar) {
    if (ocupado) { await trocar(); return; }
    ocupado = true;
    canvas.classList.remove('hidden');
    try {
      if (reduzido()) {
        canvas.width = 1; canvas.height = 1;
        await animar(110, (k) => { ctx.clearRect(0, 0, 1, 1); ctx.globalAlpha = k; ctx.fillStyle = '#05030e'; ctx.fillRect(0, 0, 1, 1); ctx.globalAlpha = 1; });
        await trocar();
        await animar(130, (k) => { ctx.clearRect(0, 0, 1, 1); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#05030e'; ctx.fillRect(0, 0, 1, 1); ctx.globalAlpha = 1; });
      } else {
        const g = grade();
        await animar(220, (k) => blocos(k, true, g));
        await trocar();
        await animar(240, (k) => blocos(k, false, g));
      }
    } finally {
      canvas.classList.add('hidden');
      ocupado = false;
    }
  };
}
