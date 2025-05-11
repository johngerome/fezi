import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Reverted to false
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  tsconfig: './tsconfig.json',
  outExtension: ({ format }) => ({
    js: format === 'cjs' ? '.cjs' : '.js',
  }),
});
