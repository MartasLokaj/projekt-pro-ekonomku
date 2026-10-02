/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { puzzleManifestPlugin } from './scripts/puzzleManifestPlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths: the built site works from any sub-folder or static host.
  base: './',
  plugins: [react(), puzzleManifestPlugin()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
