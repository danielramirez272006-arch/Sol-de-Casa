import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ command }) => ({
  plugins: command === 'build' ? [react(), viteSingleFile()] : [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'recharts', 'read-excel-file/universal', 'write-excel-file/universal'],
  },
  test: { environment: 'node' },
}))
