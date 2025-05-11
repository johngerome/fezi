import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disable tsup DTS, tsc -b will handle declarations
  splitting: false,
  sourcemap: true,
  clean: false, // Do not clean dist, as tsc -b populates it first
  minify: false,
  treeshake: true,
  tsconfig: './tsconfig.json',
  external: ['@fezi/client', '@tanstack/react-query'],
  outExtension: ({ format }) => ({
    js: format === 'cjs' ? '.cjs' : '.js',
  }),
});
