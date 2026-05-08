import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 自定义插件：移除 CSP meta 标签（在 file:// 协议下会阻止脚本执行）
const removeCSP = () => ({
  name: 'remove-csp',
  transformIndexHtml(html) {
    return html.replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '');
  }
});

export default defineConfig({
  // GitHub Pages 基础路径
  base: '/CET46/',
  
  // 单文件打包配置
  build: {
    emptyOutDir: true,
    target: 'es2022', // 支持顶层 await
    assetsInlineLimit: 100000000, // 将所有资源强制内联
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    brotliSize: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // 将动态 import() 也打包进来
        manualChunks: undefined, // 禁用代码分割，打包成单一文件
      }
    },
    sourcemap: false,
    minify: 'esbuild',
    esbuild: {
      drop: ['debugger']
    }
  },
  plugins: [
    viteSingleFile(),
    removeCSP()
  ],
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  }
});
