// vite.con;qvt\nhq;vt;x\v;v,F,hhlFT,h\lwvf;f;hnfxh\;\t;qvfhqhxig.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // ★ ここを追加：ポートを3000に固定して、Googleの設定と一致させる
      port: 3000,
      strictPort: true, // 3000が使われていたらエラーにする（勝手に3001にならないように）

      hmr: process.env.DISABLE_HMR !== 'true',
      headers: {
        'Cross-Origin-Opener-Policy': 'unsafe-none',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      },
    },
  };
});
