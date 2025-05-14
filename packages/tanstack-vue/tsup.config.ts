import { defineConfig, type Format } from 'tsup';

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
  external: ['@fezi/client', '@tanstack/vue-query', 'vue'],
  outExtension: ({ format }: { format: Format }) => {
    let jsExtension = '.js';
    if (format === 'cjs') {
      jsExtension = '.cjs';
    }
    // We don't strictly need dts mapping here since dts: false,
    // but aligning with a more complete factory signature.
    return {
      js: jsExtension,
    };
  },
});
