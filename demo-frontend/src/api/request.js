import axios from 'axios'

/* ============================================================
 * 码途智辅 · 统一 AI 请求模块
 * 所有模型调用统一从这里走，密钥/地址从 .env 读取，不散落在业务代码里。
 *
 * .env 变量：
 *   VITE_API_MODE      demo | api
 *   VITE_API_BASE_URL  接口基地址
 *   VITE_API_KEY       API 密钥
 *   VITE_API_MODEL     模型名
 * ============================================================ */

import { computed } from 'vue'
import { activeProvider } from './models'

const env = (import.meta && import.meta.env) ? import.meta.env : {}

export const API_MODE = env.VITE_API_MODE || 'demo'

// 当前激活模型（智谱 GLM-4 / 豆包 Doubao / 本地 Qwen）——
// 由 src/api/models.js 的「多模型一键切换」驱动，切换后实时生效。
export const apiConfig = {
  get baseURL() { return (activeProvider.value.baseURL || '').replace(/\/+$/, '') },
  get apiKey() { return activeProvider.value.apiKey || '' },
  get model() { return activeProvider.value.model || '' }
}

// 面向界面展示的友好模型名（随切换实时变化，如 智谱 GLM-4）
export const modelLabel = computed(() => activeProvider.value.name)

export const isApiMode = () => API_MODE === 'api'

/** 是否已具备真实调用所需的配置 */
export const isApiReady = () => isApiMode() && !!apiConfig.apiKey && !!apiConfig.baseURL

const http = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: 60000
})

http.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers || {}
  if (apiConfig.apiKey) cfg.headers.Authorization = `Bearer ${apiConfig.apiKey}`
  cfg.headers['Content-Type'] = 'application/json'
  return cfg
})

function buildMessages(prompt, system) {
  const messages = []
  if (system) messages.push({ role: 'system', content: system })
  messages.push({ role: 'user', content: prompt })
  return messages
}

/** 非流式对话，返回纯文本。options.timeout 控制单次请求超时（毫秒）。 */
export async function chat(prompt, system = '', model = '', options = {}) {
  const { timeout = 45000 } = options
  // 每次调用都按当前激活模型刷新基地址，保证「一键切换」后立即走新模型
  http.defaults.baseURL = apiConfig.baseURL
  const { data } = await http.post('/chat/completions', {
    model: model || apiConfig.model,
    messages: buildMessages(prompt, system),
    stream: false
  }, { timeout })
  return data?.choices?.[0]?.message?.content || ''
}

/**
 * 流式对话（SSE）
 * @param {string} prompt   用户输入
 * @param {string} system   系统提示词
 * @param {string} model    模型名（留空用默认）
 * @param {(partial: string, done: boolean) => void} onStream  逐步回调
 * @param {{timeout?: number}} options  超时（毫秒），默认 60s，超时会中断并抛出可读错误
 * @returns {Promise<string>} 完整回复
 */
export async function chatStream(prompt, system = '', model = '', onStream, options = {}) {
  const { timeout = 60000 } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  let resp
  try {
    resp = await fetch(`${apiConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiConfig.apiKey ? { Authorization: `Bearer ${apiConfig.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: model || apiConfig.model,
        messages: buildMessages(prompt, system),
        stream: true
      }),
      signal: controller.signal
    })
  } catch (e) {
    clearTimeout(timer)
    if (e && e.name === 'AbortError') {
      throw new Error('AI 响应超时，请检查网络后重试')
    }
    throw new Error('无法连接 AI 服务，请检查网络或代理配置')
  }

  if (!resp.ok) {
    clearTimeout(timer)
    const detail = await resp.text().catch(() => '')
    throw new Error(`AI 接口请求失败：${resp.status} ${resp.statusText} ${detail}`.trim())
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter((l) => l.trim().startsWith('data:'))
      for (const line of lines) {
        const data = line.replace(/^data:\s*/, '').trim()
        if (data === '[DONE]') {
          if (onStream) onStream(full, true)
          continue
        }
        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) {
            full += delta
            if (onStream) onStream(full, false)
          }
        } catch (e) {
          /* 忽略不完整分片 */
        }
      }
    }
  } finally {
    clearTimeout(timer)
  }

  if (onStream) onStream(full, true)
  return full
}

/**
 * 请求并尝试解析 JSON 结果（用于技能评价、备考计划等结构化场景）。
 * 会自动剥离 ```json 代码围栏；解析失败时返回 null 交给调用方兜底。
 */
export async function chatJSON(prompt, system = '', model = '', options = {}) {
  const raw = await chat(prompt, system, model, options)
  return safeParseJSON(raw)
}

export function safeParseJSON(text) {
  if (!text) return null
  let t = String(text).trim()
  // 去掉 ```json ... ``` 或 ``` ... ``` 围栏
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  // 截取第一个 { 到最后一个 }
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    t = t.slice(start, end + 1)
  }
  try {
    return JSON.parse(t)
  } catch (e) {
    return null
  }
}

export default {
  API_MODE,
  apiConfig,
  modelLabel,
  isApiMode,
  isApiReady,
  chat,
  chatStream,
  chatJSON,
  safeParseJSON
}
