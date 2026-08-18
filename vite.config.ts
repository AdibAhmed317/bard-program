import os from 'node:os'
import path from 'node:path'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

const config = defineConfig({
  resolve: { tsconfigPaths: true },

  // The default cache dir (node_modules/.vite) lives on D:, which has Windows
  // Search indexing enabled and is covered by Defender real-time scanning. Vite
  // re-optimizes by renaming that whole directory, and on Windows that rename
  // fails with EPERM whenever a scanner holds a handle inside it — which then
  // cascades into "504 Outdated Optimize Dep" and a dead, unhydrated page.
  // Keeping the cache under the OS temp dir moves it off the indexed drive.
  cacheDir: path.join(os.tmpdir(), 'vite-bard-program'),

  // Pre-bundle everything the client pulls in, so the first optimize pass is
  // complete and no browser-triggered re-optimize (i.e. no rename) is needed.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      '@tanstack/react-router',
      '@tanstack/router-core',
      '@tanstack/history',
      'seroval',
      'lucide-react',
      'better-auth/react',
      'better-auth/client/plugins',
      'xlsx',
      'exceljs',
    ],
  },

  plugins: [devtools(), netlify(), tailwindcss(), tanstackStart(), viteReact()],
})

export default config
