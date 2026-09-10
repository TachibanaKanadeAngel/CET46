import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      include: ['js/**/*.js', 'js/**/*.ts'],
      exclude: [
        'js/data/default_vocab.js',
        'js/workers/**',
        'node_modules',
        'tests'
      ],
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'js')
    }
  }
});
