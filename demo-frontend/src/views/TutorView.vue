<template>
  <div class="tutor-view">
    <!-- 左侧会话栏 -->
    <aside class="session-panel">
      <el-button type="primary" class="new-chat-btn" @click="newConversation">
        <el-icon><Plus /></el-icon>
        新建对话
      </el-button>
      <div class="session-label">历史会话</div>
      <div class="session-list">
        <div
          v-for="s in sessions"
          :key="s.id"
          class="session-item"
          :class="{ active: s.id === activeSessionId }"
          @click="switchSession(s)"
        >
          <el-icon><ChatLineRound /></el-icon>
          <div class="session-info">
            <span class="session-title">{{ s.title }}</span>
            <span class="session-time">{{ s.time }}</span>
          </div>
          <el-icon class="del" @click.stop="removeSession(s.id)"><Delete /></el-icon>
        </div>
      </div>
      <div class="session-tip">
        <el-icon><Lock /></el-icon>
        <span>数据本地存储 · 隐私安全</span>
      </div>
    </aside>

    <!-- 主对话区 -->
    <div class="chat-container">
      <!-- 快捷功能区 -->
      <div class="quick-actions" v-if="messages.length === 0">
        <div class="hero-avatar">
          <el-icon :size="34"><Cpu /></el-icon>
        </div>
        <h3>你好{{ userName }}，我是你的 AI 编程导师 👋</h3>
        <p class="subtitle">基于 {{ modelLabel }} 大模型驱动，随时为你解答编程问题</p>
        <div class="quick-cards">
          <div class="quick-card" v-for="q in quickCards" :key="q.type" @click="quickAsk(q.type)">
            <div class="qc-icon" :style="{ background: q.bg }">
              <el-icon :size="22"><component :is="q.icon" /></el-icon>
            </div>
            <h4>{{ q.title }}</h4>
            <p>{{ q.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="messages" ref="messagesRef">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message-item"
          :class="msg.role"
        >
          <div class="message-avatar">
            <el-avatar :size="38" v-if="msg.role === 'user'" class="ua">{{ userName }}</el-avatar>
            <div class="ai-avatar" v-else>
              <el-icon :size="20"><Cpu /></el-icon>
            </div>
          </div>
          <div class="message-content">
            <div class="message-meta">
              <span class="sender">{{ msg.role === 'user' ? '我' : '码途智辅 AI' }}</span>
              <span class="message-time">{{ msg.time }}</span>
            </div>
            <div class="message-bubble">
              <div v-if="msg.loading" class="thinking-indicator">
                <span>AI 正在思考</span>
                <span class="thinking-dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </span>
              </div>
              <div class="message-text markdown-body" v-else v-html="renderMarkdown(msg.content)"></div>
            </div>
            <div class="message-actions" v-if="msg.role === 'assistant' && !msg.loading && msg.content">
              <el-tooltip content="复制回答" placement="top">
                <el-icon class="act" @click="copyText(msg.content)"><CopyDocument /></el-icon>
              </el-tooltip>
              <el-tooltip content="重新生成" placement="top">
                <el-icon class="act" @click="regenerate(index)"><Refresh /></el-icon>
              </el-tooltip>
              <el-tooltip content="有帮助" placement="top">
                <el-icon class="act" :class="{ liked: msg.liked }" @click="msg.liked = !msg.liked"><Star /></el-icon>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <div class="input-wrapper">
          <div class="code-preview" v-if="codeContent" @click="openCodeDialog">
            <div class="code-preview-header">
              <el-icon><EditPen /></el-icon>
              <span>已添加代码（{{ codeLanguage }}）</span>
              <el-tag size="small" type="success" effect="light">点击编辑</el-tag>
              <el-icon class="rm" @click.stop="clearCode"><Close /></el-icon>
            </div>
            <div class="code-preview-content">
              {{ codeContent.substring(0, 120) }}{{ codeContent.length > 120 ? '…' : '' }}
            </div>
          </div>

          <div class="input-row">
            <div class="input-left">
              <el-tooltip content="添加代码/错误信息" placement="top">
                <el-button class="add-code-btn" text @click="openCodeDialog">
                  <el-icon :size="18"><Plus /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
            <el-input
              v-model="inputMessage"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 5 }"
              resize="none"
              placeholder="输入你的问题，Enter 发送，Shift+Enter 换行…"
              @keydown.enter.exact.prevent="sendMessage"
              class="message-input"
              :disabled="isLoading"
            />
            <el-button
              type="primary"
              class="send-btn"
              @click="sendMessage"
              :disabled="(!inputMessage.trim() && !codeContent) || isLoading"
              :loading="isLoading"
              circle
            >
              <el-icon v-if="!isLoading" :size="18"><Promotion /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="input-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>AI 回答由大模型生成，仅供参考；关键结论请自行验证</span>
        </div>
      </div>
    </div>

    <!-- 代码输入对话框 -->
    <el-dialog v-model="codeDialogVisible" title="添加代码 / 错误信息" width="640px" class="code-dialog">
      <div class="code-dialog-content">
        <div class="code-lang-select">
          <span class="lang-label">选择语言</span>
          <el-select v-model="codeLanguage" style="width: 160px">
            <el-option label="Python" value="python" />
            <el-option label="Java" value="java" />
            <el-option label="C++" value="cpp" />
            <el-option label="JavaScript" value="javascript" />
            <el-option label="C#" value="csharp" />
            <el-option label="PHP" value="php" />
            <el-option label="其他" value="other" />
          </el-select>
        </div>
        <textarea
          v-model="codeContent"
          placeholder="在此粘贴你的代码或错误信息…"
          class="code-textarea-large"
          rows="12"
          spellcheck="false"
        ></textarea>
        <div class="code-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>添加代码后，AI 可以更准确地帮你定位与修复问题</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="clearCode">清空</el-button>
        <el-button type="primary" @click="confirmCode">
          <el-icon><Check /></el-icon>
          确认添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { generateStream, PROMPT_TEMPLATES } from '@/api/ollama'
import { apiConfig, modelLabel } from '@/api/request'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import {
  Warning, Reading, EditPen, Guide, Cpu, Plus, Promotion,
  InfoFilled, Check, ChatLineRound, Delete, Close, CopyDocument,
  Refresh, Star, Lock
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const userName = userStore.userInfo.name.charAt(0)

// 当前实际使用的模型名（来自 .env 的 VITE_API_MODEL，如 智谱 GLM-4）

const messages = ref([])
const inputMessage = ref('')
const codeContent = ref('')
const codeLanguage = ref('python')
const codeDialogVisible = ref(false)
const isLoading = ref(false)
const messagesRef = ref(null)

// 会话管理（含历史消息 + 本地持久化，点进去可回看）
const SESSION_KEY = 'mt_sessions'
const defaultSessions = [
  {
    id: 's1', title: 'Python 递归函数怎么写', time: '今天 10:24',
    messages: [
      { role: 'user', content: 'Python 递归函数怎么写？能给我讲讲原理吗？', time: '10:24' },
      { role: 'assistant', content: '递归函数就是**函数自己调用自己**，用“把大问题拆成同类的小问题”的方式求解。\n\n**两个必要条件**：\n1. 递推关系：把问题规模不断缩小\n2. 终止条件：避免无限递归导致栈溢出\n\n```python\ndef factorial(n):\n    if n <= 1:              # 终止条件\n        return 1\n    return n * factorial(n - 1)   # 递推：规模 -1\n\nprint(factorial(5))   # 输出 120\n```\n\n**要点**：一定要写终止条件，否则会抛出 `RecursionError`。你可以试着把递归改成循环，对比两者效率。', time: '10:25' }
    ]
  },
  {
    id: 's2', title: '帮我看看这段代码的 Bug', time: '昨天 16:40',
    messages: [
      { role: 'user', content: '下面这段代码报错了，帮我看看问题在哪？\n\n```python\nnums = [1, 2, 3]\nfor i in range(len(nums)):\n    print(nums[i + 1])\n```', time: '16:40' },
      { role: 'assistant', content: '问题在于 **下标越界（IndexError）**：循环变量 `i` 最大取到 `len(nums) - 1 = 2`，但 `nums[i + 1]` 会访问 `nums[3]`，已超出列表范围。\n\n**修复方案一**（缩小循环范围）：\n```python\nnums = [1, 2, 3]\nfor i in range(len(nums) - 1):\n    print(nums[i + 1])\n```\n\n**修复方案二**（更 Pythonic）：\n```python\nfor n in nums[1:]:\n    print(n)\n```\n\n记住：访问下标前先确认范围，`0 <= index < len(list)`。', time: '16:41' }
    ]
  },
  {
    id: 's3', title: '学习路径规划咨询', time: '3天前',
    messages: [
      { role: 'user', content: '我是计算机专业大一新生，想系统学习编程，有推荐的学习路径吗？', time: '09-27' },
      { role: 'assistant', content: '给你一份循序渐进的学习路径 👇\n\n**第一阶段 · 打基础（1-2 个月）**\n- 变量、数据类型、运算符\n- 流程控制（if / for / while）\n\n**第二阶段 · 核心能力（2-3 个月）**\n- 函数与模块化\n- 列表、字典、字符串处理\n- 文件读写与异常处理\n\n**第三阶段 · 进阶（3-4 个月）**\n- 面向对象编程\n- 常用算法与数据结构\n- 项目实战（爬虫 / 小工具）\n\n建议每天坚持敲代码 1 小时以上，每学一个知识点都用小练习巩固。需要我针对某个阶段出一套练习吗？', time: '09-27' }
    ]
  }
]

function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(defaultSessions))
}

const sessions = ref(loadSessions())
const activeSessionId = ref(sessions.value[0]?.id || 's1')

// 会话变更自动写入本地存储
watch(sessions, (val) => {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(val)) } catch (e) { /* ignore */ }
}, { deep: true })

const quickCards = [
  { type: 'bug', title: '代码 Bug 分析', desc: '上传报错代码，帮你定位问题', icon: 'Warning', bg: 'linear-gradient(135deg,#f43f5e,#fb7185)' },
  { type: 'explain', title: '知识点讲解', desc: '不懂的概念，我来给你讲明白', icon: 'Reading', bg: 'linear-gradient(135deg,#10b981,#14b8a6)' },
  { type: 'code', title: '代码优化建议', desc: '让你的代码更规范、更高效', icon: 'EditPen', bg: 'linear-gradient(135deg,#6366f1,#818cf8)' },
  { type: 'learn', title: '学习指导规划', desc: '不知道学什么？给你规划路径', icon: 'Guide', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }
]

marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(code, { language: lang }).value } catch (e) {}
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
}

function getCurrentTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function newConversation() {
  const id = 's' + Date.now()
  sessions.value.unshift({ id, title: '新的对话', time: '刚刚', messages: [] })
  activeSessionId.value = id
  messages.value = []
}

function switchSession(s) {
  activeSessionId.value = s.id
  messages.value = s.messages
  scrollToBottom()
}

function removeSession(id) {
  const idx = sessions.value.findIndex(s => s.id === id)
  if (idx === -1) return
  sessions.value.splice(idx, 1)
  if (activeSessionId.value === id) {
    if (sessions.value.length) {
      activeSessionId.value = sessions.value[0].id
      messages.value = sessions.value[0].messages
    } else {
      messages.value = []
    }
  }
  ElMessage.success('已删除会话')
}

function quickAsk(type) {
  const map = {
    bug: '我有一段代码运行报错了，能帮我分析一下原因并给出修复方案吗？',
    explain: '能帮我详细讲解一下 Python 中递归函数的原理吗？最好举个例子。',
    code: '帮我看看代码质量如何？从正确性、效率、规范性、可读性、健壮性五个方面评价一下。',
    learn: '我现在是编程入门水平，想系统学习 Python，能帮我制定一份学习计划吗？'
  }
  inputMessage.value = map[type] || ''
  if (type === 'bug' || type === 'code') openCodeDialog()
}

function openCodeDialog() { codeDialogVisible.value = true }
function confirmCode() {
  if (!codeContent.value.trim()) {
    ElMessage.warning('请先粘贴代码或错误信息')
    return
  }
  codeDialogVisible.value = false
  ElMessage.success('代码已添加')
}
function clearCode() {
  codeContent.value = ''
  codeDialogVisible.value = false
}

async function sendMessage() {
  if (isLoading.value) return
  const text = inputMessage.value.trim()
  if (!text && !codeContent.value) return

  let fullPrompt = text
  if (codeContent.value) {
    fullPrompt += `\n\n【代码/错误信息（${codeLanguage.value}）】\n\`\`\`${codeLanguage.value}\n${codeContent.value}\n\`\`\``
  }

  messages.value.push({ role: 'user', content: fullPrompt, time: getCurrentTime() })
  inputMessage.value = ''
  const savedCode = codeContent.value
  codeContent.value = ''
  isLoading.value = true
  scrollToBottom()

  const aiMsg = { role: 'assistant', content: '', time: getCurrentTime(), loading: true }
  messages.value.push(aiMsg)
  scrollToBottom()

  try {
    await generateStream(
      fullPrompt,
      PROMPT_TEMPLATES.programmingTutor,
      '',
      (partial, done) => {
        aiMsg.loading = false
        aiMsg.content = partial
        if (done) {
          aiMsg.time = getCurrentTime()
          isLoading.value = false
          // 更新会话标题
          const cur = sessions.value.find(s => s.id === activeSessionId.value)
          if (cur && cur.messages.length <= 1) {
            cur.title = text.slice(0, 16) || '代码分析'
            cur.time = '刚刚'
          }
          const idx = sessions.value.findIndex(s => s.id === activeSessionId.value)
          if (idx > -1) sessions.value[idx].messages = messages.value
        }
        scrollToBottom()
      }
    )
  } catch (e) {
    aiMsg.loading = false
    aiMsg.content = `抱歉，AI 服务暂时不可用：${e?.message || '请稍后重试'}`
    isLoading.value = false
    ElMessage.error(e?.message || 'AI 调用失败')
  }
  // 恢复用户未添加的代码
  if (savedCode) codeContent.value = ''
}

function copyText(text) {
  navigator.clipboard?.writeText(text).then(
    () => ElMessage.success('已复制到剪贴板'),
    () => ElMessage.warning('复制失败，请手动选择')
  )
}

function regenerate(index) {
  // 找到该回答对应的用户提问
  for (let i = index - 1; i >= 0; i--) {
    if (messages.value[i].role === 'user') {
      messages.value.splice(index, 1)
      const q = messages.value[i].content
      messages.value.splice(i, 1)
      inputMessage.value = ''
      isLoading.value = false
      // 直接重发
      const tmp = q
      inputMessage.value = tmp
      sendMessage()
      return
    }
  }
}

onMounted(() => {
  if (sessions.value.length) {
    messages.value = sessions.value[0].messages
  }
})
</script>

<style scoped lang="scss">
.tutor-view {
  display: flex;
  gap: 18px;
  height: calc(100vh - 136px);
}

/* ========== 左侧会话栏 ========== */
.session-panel {
  width: 244px;
  flex-shrink: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  display: flex;
  flex-direction: column;
}
.new-chat-btn {
  width: 100%;
  height: 42px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: var(--shadow-brand);
}
.session-label {
  font-size: 12px;
  color: var(--text-light);
  margin: 18px 0 8px;
  font-weight: 600;
  letter-spacing: .5px;
}
.session-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.session-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all .2s ease;
  position: relative;

  .session-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .session-title {
    font-size: 13px; color: var(--text-primary); font-weight: 500;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .session-time { font-size: 11px; color: var(--text-light); margin-top: 2px; }
  .del { opacity: 0; font-size: 14px; transition: opacity .2s; }
  &:hover { background: var(--bg-secondary); .del { opacity: .6; } }
  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--primary-color);
    .session-title { color: var(--primary-color); font-weight: 600; }
  }
}
.session-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-light);
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  margin-top: 10px;
}

/* ========== 对话区 ========== */
.chat-container {
  flex: 1;
  min-width: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.quick-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;

  .hero-avatar {
    width: 78px; height: 78px; border-radius: 24px;
    background: var(--brand-gradient);
    display: flex; align-items: center; justify-content: center;
    color: #fff; margin-bottom: 18px;
    box-shadow: 0 14px 34px rgba(99,102,241,.35);
    animation: slideUp .5s ease both;
  }
  h3 { font-size: 22px; margin: 0 0 8px; color: var(--text-primary); }
  .subtitle { font-size: 13.5px; color: var(--text-secondary); margin-bottom: 30px; }
}
.quick-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  width: 100%;
  max-width: 620px;
}
.quick-card {
  padding: 18px;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all .28s ease;

  .qc-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; margin-bottom: 12px;
    box-shadow: var(--shadow-sm);
  }
  h4 { font-size: 15px; margin: 0 0 5px; color: var(--text-primary); }
  p { font-size: 12.5px; color: var(--text-secondary); margin: 0; }
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--el-color-primary-light-5);
    background: var(--bg-primary);
  }
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 26px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.message-item {
  display: flex;
  gap: 13px;
  animation: slideUp .35s ease both;

  &.user { flex-direction: row-reverse; }
}
.message-avatar { flex-shrink: 0; }
.ua { background: var(--brand-gradient); color: #fff; font-weight: 600; }
.ai-avatar {
  width: 38px; height: 38px; border-radius: 12px;
  background: var(--brand-gradient);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  box-shadow: 0 6px 16px rgba(99,102,241,.3);
}
.message-content { max-width: 76%; display: flex; flex-direction: column; }
.message-item.user .message-content { align-items: flex-end; }
.message-meta {
  display: flex; align-items: center; gap: 8px;
  font-size: 11.5px; color: var(--text-light); margin-bottom: 6px;
}
.sender { font-weight: 600; color: var(--text-secondary); }
.message-bubble {
  padding: 13px 17px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}
.message-item.assistant .message-bubble {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-top-left-radius: 4px;
  color: var(--text-primary);
}
.message-item.user .message-bubble {
  background: var(--brand-gradient);
  color: #fff;
  border-top-right-radius: 4px;
  box-shadow: var(--shadow-brand);
}

.message-actions {
  display: flex; gap: 12px; margin-top: 8px;
  .act {
    font-size: 15px; color: var(--text-light); cursor: pointer;
    transition: color .2s;
    &:hover { color: var(--primary-color); }
    &.liked { color: #f59e0b; }
  }
}

.thinking-indicator {
  display: flex; align-items: center; gap: 8px;
  color: var(--text-secondary); font-size: 13px;
}
.thinking-dots { display: inline-flex; gap: 4px; }
.thinking-dots .dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--primary-color);
  animation: pulse 1.2s ease-in-out infinite;
}
.thinking-dots .dot:nth-child(2) { animation-delay: .2s; }
.thinking-dots .dot:nth-child(3) { animation-delay: .4s; }

/* ========== 输入区 ========== */
.input-area { padding: 14px 22px 16px; border-top: 1px solid var(--border-color); }
.input-wrapper {
  border: 1.5px solid var(--border-color);
  border-radius: 16px;
  padding: 8px 10px;
  background: var(--bg-secondary);
  transition: border-color .2s, box-shadow .2s;
  &:focus-within {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
    background: var(--bg-primary);
  }
}
.code-preview {
  background: #0f172a;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  position: relative;

  .code-preview-header {
    display: flex; align-items: center; gap: 8px;
    color: #cbd5e1; font-size: 12px; margin-bottom: 6px;
    .rm { margin-left: auto; cursor: pointer; &:hover { color: #f43f5e; } }
  }
  .code-preview-content {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 12px; color: #94a3b8;
    white-space: pre-wrap; word-break: break-all;
  }
}
.input-row { display: flex; align-items: flex-end; gap: 8px; }
.input-left { flex-shrink: 0; }
.add-code-btn {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--bg-tertiary); color: var(--text-secondary);
  &:hover { color: var(--primary-color); background: var(--el-color-primary-light-9); }
}
.message-input {
  flex: 1;
  :deep(.el-textarea__inner) {
    border: none; background: transparent; box-shadow: none;
    padding: 8px 4px; font-size: 14px; resize: none;
  }
}
.send-btn {
  width: 42px; height: 42px; flex-shrink: 0;
  box-shadow: var(--shadow-brand);
}
.input-tip {
  display: flex; align-items: center; gap: 6px;
  font-size: 11.5px; color: var(--text-light);
  margin-top: 9px; justify-content: center;
}

/* ========== 代码对话框 ========== */
.code-lang-select { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.lang-label { font-size: 13px; color: var(--text-secondary); }
.code-textarea-large {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 12px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  background: #0f172a;
  color: #e2e8f0;
  &:focus { border-color: var(--el-color-primary-light-5); }
}
.code-tip {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--text-light); margin-top: 10px;
}

/* markdown */
.markdown-body {
  :deep(pre) {
    background: #0f172a;
    color: #e2e8f0;            /* 深色底配浅色文字，保证可读 */
    padding: 12px 14px;
    border-radius: 10px;
    overflow-x: auto;
    margin: 8px 0;
    line-height: 1.6;
  }
  :deep(pre code) {
    color: #e2e8f0;            /* 代码块：深色底配浅色文字 */
    background: transparent;
    padding: 0;
  }
  /* 行内代码：位于浅色气泡上，必须用深色文字+浅灰底，避免“看不见” */
  :deep(code) {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 12.5px;
    color: #6366f1;
    background: rgba(99, 102, 241, .12);
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 600;
  }
  /* 用户气泡为深色底，行内代码改用浅色以保持对比 */
  :deep(.message-item.user .message-bubble code) {
    color: #fde68a;
    background: rgba(255, 255, 255, .22);
  }
  /* highlight.js 主题容器兜底 */
  :deep(.hljs) {
    color: #e2e8f0;
    background: transparent;
  }
  :deep(p) { margin: 6px 0; }
  :deep(ul), :deep(ol) { padding-left: 20px; margin: 6px 0; }
  :deep(h1), :deep(h2), :deep(h3) { margin: 10px 0 6px; }
  :deep(table) { border-collapse: collapse; margin: 8px 0; width: 100%; }
  :deep(th), :deep(td) { border: 1px solid var(--border-color); padding: 6px 10px; font-size: 13px; }
}
</style>
