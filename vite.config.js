import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/cacofonia/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2020',
    assetsInlineLimit: 0,
    // Three.js já vai num pedaço separado, carregado só na 1ª luta; o resto (Tone.js + jogo) fica em ~580 kB.
    chunkSizeWarningLimit: 700
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Os testes não compartilham estado mutável entre arquivos: reaproveitar os workers poupa ~1,7 s.
    isolate: false
  }
});
