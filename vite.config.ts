import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
export default defineConfig({
  root: 'apps/pwa',
  plugins: [
    react(),
    {
      name: 'smriva-private-offline-shell',
      writeBundle(options: { dir?: string }) {
        const output = resolve(options.dir ?? 'dist');
        copyFileSync(join(output, 'index.html'), join(output, 'app-shell.html'));
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icon.svg',
        'icon-192.png',
        'icon-512.png',
        'apple-touch-icon.png',
        'social-card.png',
        'lessons/*.json',
      ],
      manifest: {
        name: 'Smriva · Last-mile continuity',
        short_name: 'Smriva',
        description: 'Offline education records',
        theme_color: '#171d1b',
        background_color: '#171d1b',
        display: 'standalone',
        start_url: '/app/today',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}', 'government/*.{png,jpg,jpeg,webp}'],
        globIgnores: ['**/index.html', '**/site/**'],
        navigateFallback: '/app-shell.html',
        navigateFallbackDenylist: [/^\/api\//],
        navigateFallbackAllowlist: [
          /^(?:\/(?:\?|$)|\/about(?:\?|$)|\/app\/(?:today|children(?:\/[^/?]+)?|school|library|sync|conflicts|settings)(?:[/?]|$)|\/(?:admin|recover)(?:[/?]|$)|\/lab(?:[/?]|$))/,
        ],
        runtimeCaching: [
          {
            urlPattern: /\/lessons\/.*\.json$/,
            handler: 'CacheFirst',
            options: { cacheName: 'kuka-lessons' },
          },
        ],
      },
    }),
  ],
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:3001' } },
  build: {
    target: ['es2020', 'safari14.1'],
    cssTarget: 'safari14.1',
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/zod')) return 'validation';
          if (id.includes('node_modules/dexie')) return 'storage';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
        },
      },
    },
  },
  test: { include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 20000 },
} as any);
