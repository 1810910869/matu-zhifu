import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// AI 接口上游（多模型一键切换）
const AI_UPSTREAM = 'https://open.bigmodel.cn' // 智谱 GLM 开放平台
const DOUBAO_UPSTREAM = 'https://ark.cn-beijing.volces.com' // 豆包（火山方舟）
const OLLAMA_UPSTREAM = 'http://localhost:11434' // 本地 Qwen（Ollama）

// 统一的代理规则：浏览器请求同源的 /ai/*、/db/*、/api/*，
// 由本地服务器转发到上游，从而绕开浏览器跨域（CORS）限制。
const aiProxy = {
  '/ai': {
    target: AI_UPSTREAM,
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/ai/, '')
  },
  '/db': {
    target: DOUBAO_UPSTREAM,
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/db/, '')
  },
  '/api': {
    target: OLLAMA_UPSTREAM,
    changeOrigin: true
  }
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    assetsDir: '', // 静态资源直接放在根目录，不放在assets文件夹
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      ...aiProxy
    }
  },
  // 预览已构建产物时同样带上代理：先 npm run build，再 npm run preview
  preview: {
    port: 4173,
    proxy: {
      ...aiProxy
    }
  }
})
