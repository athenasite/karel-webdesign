import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ command }) => {
  const isDev = command === 'serve';
  

  // [Athena 3.0] Editor plugin logic removed for production stability
  return {
    // Gebruik relatieve paden voor maximale compatibiliteit (Dock & GitHub Pages)
    base: './', // [Athena 3.0] Forced relative base 
    plugins: [
      react(),
      tailwindcss(),
      null
    ].filter(Boolean),
    server: {
      cors: true,
      host: true,
      port: parseInt(process.env.PORT) || 6001,
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
