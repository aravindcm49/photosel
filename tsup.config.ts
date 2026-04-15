import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['server/index.ts'],
  format: ['esm'],
  outDir: 'dist/server',
  splitting: false,
  sourcemap: true,
  external: ['vite', 'express', 'sharp', 'sirv'],
});
