import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2020',
    assetsInlineLimit: 0
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js']
  }
});
