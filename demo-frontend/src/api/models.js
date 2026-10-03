/* ============================================================
 * 多模型一键切换 —— 模型注册表
 * 支持：智谱 GLM-4（云端）/ 豆包 Doubao（云端）/ 本地 Qwen（Ollama 私有化）
 * 切换后立即生效：所有 AI 页面（导师/诊断/训练/考试辅导）统一走当前模型，
 * 顶栏徽标同步更新，选择结果通过 localStorage 持久化。
 * ============================================================ */
import { ref, computed } from 'vue'

const env = (import.meta && import.meta.env) ? import.meta.env : {}

export const MODEL_PROVIDERS = [
  {
    id: 'zhipu',
    name: '智谱 GLM-4',
    vendor: '智谱 AI',
    desc: '云端旗舰大模型，推理稳定、响应快',
    baseURL: env.VITE_ZHIPU_BASE_URL || '/ai/api/paas/v4',
    model: env.VITE_ZHIPU_MODEL || 'glm-4',
    apiKey: env.VITE_ZHIPU_KEY || env.VITE_API_KEY || '',
    tagType: 'success'
  },
  {
    id: 'doubao',
    name: '豆包 Doubao',
    vendor: '字节跳动',
    desc: '豆包大模型，长文本理解与生成',
    baseURL: env.VITE_DOUBAO_BASE_URL || '/db/api/v3',
    model: env.VITE_DOUBAO_MODEL || 'doubao-pro-32k',
    apiKey: env.VITE_DOUBAO_KEY || '',
    tagType: 'primary'
  },
  {
    id: 'qwen',
    name: '本地 Qwen2.5',
    vendor: '本地 Ollama',
    desc: '内网私有化部署，数据不出库',
    baseURL: env.VITE_QWEN_BASE_URL || '/api/v1',
    model: env.VITE_QWEN_MODEL || 'qwen2.5:7b',
    apiKey: env.VITE_QWEN_KEY || 'ollama',
    tagType: 'info'
  }
]

const STORAGE_KEY = 'mt_active_model'

function initialId () {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && MODEL_PROVIDERS.some((p) => p.id === saved)) return saved
  } catch (e) { /* ignore */ }
  return MODEL_PROVIDERS[0].id
}

// 当前激活的模型 id（响应式，切换后全站即时更新）
export const activeModelId = ref(initialId())

// 当前激活的模型对象
export const activeProvider = computed(
  () => MODEL_PROVIDERS.find((p) => p.id === activeModelId.value) || MODEL_PROVIDERS[0]
)

export function getProvider (id = activeModelId.value) {
  return MODEL_PROVIDERS.find((p) => p.id === id) || MODEL_PROVIDERS[0]
}

// 一键切换：写入响应式状态 + 持久化
export function switchModel (id) {
  if (!MODEL_PROVIDERS.some((p) => p.id === id)) return false
  activeModelId.value = id
  try { localStorage.setItem(STORAGE_KEY, id) } catch (e) { /* ignore */ }
  return true
}

// 是否已完成该模型的密钥/地址配置
export function providerConfigured (p = activeProvider.value) {
  return !!(p && p.baseURL && p.model)
}
