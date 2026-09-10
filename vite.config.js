import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';

const isFileBuild = process.env.npm_lifecycle_event === 'build:file';
const isVercelBuild = process.env.npm_lifecycle_event === 'vercel-build';

// file:// 构建专用 CSP：放宽 'self' 到 file: 允许本地文件加载，保留安全约束
// 与 Web 版相比：增加 file: data: 到 default-src/img-src；script-src 仍限 self+file
const FILE_FRIENDLY_CSP = "default-src 'self' file: data:; script-src 'self' file:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://at.alicdn.com; img-src 'self' data: file:; connect-src 'self' https: http: file:; font-src 'self' data: https://fonts.gstatic.com https://at.alicdn.com; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';";

const replaceCSPForFile = () => ({
  name: 'replace-csp-for-file',
  transformIndexHtml(html) {
    // 用 file:// 友好的 CSP 替换原 CSP，而非完全移除（保持纵深防御）
    return html.replace(
      /<meta[^>]*http-equiv="Content-Security-Policy"[^>]*content="([^"]*)"[^>]*\/?>/gi,
      `<meta http-equiv="Content-Security-Policy" content="${FILE_FRIENDLY_CSP}" />`
    );
  }
});

const replaceThemeForFile = () => ({
  name: 'replace-theme-for-file',
  transformIndexHtml(html) {
    return html.replace('./css/theme-stardew.css', './css/theme-stardew-lite.css');
  }
});

export default defineConfig({
  base: isFileBuild ? './' : '/CET46/',

  define: {
    __CET46_FILE_BUILD__: JSON.stringify(isFileBuild),
  },

  build: isFileBuild ? {
    // file:/// 构建：单文件，适合离线/Electron
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    brotliSize: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      }
    },
    sourcemap: false,
    minify: 'esbuild',
    esbuild: { drop: ['debugger'] }
  } : {
    // Web 构建：多文件，代码分割，适合 Vercel/Pages
    emptyOutDir: true,
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    esbuild: { drop: ['debugger'] },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('default_vocab')) return 'vocab-data';
          if (id.includes('js/workers/')) return 'workers';
          if (id.includes('js/features/settings')) return 'settings-feat';
          if (id.includes('js/features/webdav')) return 'webdav-feat';
          if (id.includes('js/features/minigame')) return 'minigame-feat';
          if (id.includes('js/features/engine-visualizer')) return 'visualizer-feat';
        }
      }
    }
  },

  plugins: [
    ViteImageOptimizer({
      png: { quality: 70, compressionLevel: 9 },
      jpg: { quality: 70 },
      jpeg: { quality: 70 },
      svg: { multipass: true },
      webp: { quality: 70 },
    }),
    isFileBuild && viteSingleFile({ removeViteModuleLoader: true }),
    isFileBuild && replaceCSPForFile(),
    isFileBuild && replaceThemeForFile(),
    !isFileBuild && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: '46英语 2.0.2',
        short_name: '46英语',
        description: '基于FSRS 4.5算法的科学记忆系统',
        theme_color: '#e2a053',
        background_color: '#f3c951',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: 'icons/icon-512-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        // 第二阶段优化：装饰性 PNG 改为运行时缓存，避免首装 precache 直接膨胀到数 MB。
        globPatterns: ['**/*.{js,css,html,svg,json}'],
        // 升级自愈：新 SW 激活时自动清理旧 precache 缓存，避免旧 JS 残留导致模块加载错误
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\.(?:mp3|wav|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cet46-audio-cache-v1',
              expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
              rangeRequests: true
            }
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' && url.origin === self.location.origin,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cet46-image-cache-v1',
              expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          }
        ]
      }
    })
  ].filter(Boolean),

  server: {
    port: 3001,
    open: true,
    strictPort: false,
    hmr: true
  },
  preview: {
    port: 4173
  }
});
