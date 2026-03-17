import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('features/minigame')) {
            return 'minigame';
          }
          if (id.includes('particle-system') || id.includes('engine-visualizer')) {
            return 'visual-fx';
          }
          if (id.includes('workers/')) {
            return 'workers';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'CET46 科学记忆引擎 Pro 1.0',
        short_name: 'CET46 引擎',
        description: '基于 FSRS 4.5 算法的科学记忆系统，支持 CET-4/6 词汇学习与多设备同步',
        theme_color: '#e2a053',
        background_color: '#f3c951',
        display: 'standalone'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  }
});
