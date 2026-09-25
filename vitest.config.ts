import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include:
      process.env.RUN_INTEGRATION === '1'
        ? ['src/**/*.integration.test.ts']
        : ['src/**/*.test.ts'],
    exclude:
      process.env.RUN_INTEGRATION === '1'
        ? []
        : ['src/**/*.integration.test.ts'],
    environment: 'node',
  },
})
