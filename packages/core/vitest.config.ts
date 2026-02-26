import { defineConfig } from 'vitest/config'

/* biome-ignore lint/style/noDefaultExport: 名前付きエクスポートができないため */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globals: false,
  },
})
