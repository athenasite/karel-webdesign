import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ command }) => {
  const isDev = command === 'serve';
  const isProd = command === 'build';
  let athenaEditorPlugin = null; // [Athena 3.0 Vault Hardened]

  return {
    // Gebruik relatieve paden voor maximale compatibiliteit (Dock & GitHub Pages)
    base: './', 
    plugins: [
      react(),
      tailwindcss(),
      athenaEditorPlugin ? athenaEditorPlugin() : null
    ].filter(Boolean),
    server: {
      cors: true,
      host: true,
      port: parseInt(process.env.PORT) || 6105,
      allowedHosts: true,
      watch: {
          // src/data wordt niet genegeerd voor HMR
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  }
})
