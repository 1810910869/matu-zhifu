import axios from 'axios'

/* ============================================================
 * API 配置
 * 模式：'demo' = 演示模式（内置模拟数据，无需后端，默认）
 *      'zhipu' = 智谱 AI（公网可用）
 *      'ollama' = 本地 Ollama
 * ============================================================ */
import { API_MODE as ENV_API_MODE, apiConfig } from './request'

// 由 .env 驱动：VITE_API_MODE=api 时走真实接口，否则回退演示模式
export const API_MODE = ENV_API_MODE === 'api' ? 'zhipu' : 'demo'

// 密钥/地址统一从 .env 读取（见 src/api/request.js），不再硬编码
const ZHIPU_CONFIG = {
  apiKey: apiConfig.apiKey,
  baseURL: apiConfig.baseURL,
  model: apiConfig.model
}

const ollamaClient = axios.create({
  baseURL: '/api',
  timeout: 120000
})

/* ================ 演示模式回复库 ================ */
const demoResponses = {
  greeting: `你好！👋 我是**码途智辅 AI 编程导师**，很高兴见到你！

我可以帮你：
- 💬 解答编程问题
- 🐛 分析代码 Bug
- 💡 讲解知识点
- 📝 优化代码质量

有什么我可以帮你的吗？`,

  python_question: `这是一个很好的 Python 问题！让我来帮你解答。

**问题分析**
在 Python 中，这个问题通常涉及基础语法与数据结构的配合使用。

**解决方案**
\`\`\`python
# 示例：筛选并处理正数
def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item * 2)
    return result

# 更简洁的写法（列表推导式）
def process_data_v2(data):
    return [item * 2 for item in data if item > 0]
\`\`\`

**知识点延伸**
- 列表推导式可以显著简化循环逻辑
- 注意边界条件（空列表、None 输入）的处理
- 数据量大时可考虑生成器表达式以节省内存

还有什么不明白的地方吗？`,

  code_review: `好的，我来帮你从**五个维度**评价这段代码。

**👍 做得好的地方**
- 代码结构清晰，逻辑分明
- 变量命名比较规范

**💡 可以改进的地方**

| 维度 | 评分 | 说明 |
| --- | --- | --- |
| 正确性 | 7/10 | 主流程正确，边界条件可完善 |
| 效率 | 6/10 | 时间复杂度有优化空间 |
| 规范性 | 8/10 | 命名规范，注释可增加 |
| 可读性 | 7/10 | 结构清晰，部分函数可拆分 |
| 健壮性 | 5/10 | 缺少异常处理 |

**优化建议**
\`\`\`python
def improved_function(input_data):
    """函数功能说明，处理输入数据"""
    if not input_data:
        return []
    return [item for item in input_data if condition(item)]
\`\`\`

总体来说写得不错，继续加油！💪`,

  bug_fix: `我找到问题了！🐛

**问题定位**
代码中存在一个逻辑错误，导致程序运行异常。

**错误原因**
条件判断使用了赋值运算符 \`=\` 而不是比较运算符 \`==\`，这是常见的新手错误。

**修复方案**
\`\`\`python
# ❌ 错误写法
if x = 5:
    print("x等于5")

# ✅ 正确写法
if x == 5:
    print("x等于5")
\`\`\`

**知识点延伸**
- \`=\` 是赋值，\`==\` 是比较
- Python 中还有 \`is\` 运算符，用于比较对象身份
- 建议开启 IDE 的语法检查，可提前发现这类错误

改过来试试吧，有问题随时问我~ 😊`,

  learning_plan: `好的！我来帮你制定一个学习计划！📚

**你的当前水平**：入门级
**学习目标**：掌握 Python 基础
**预计时间**：4 周

**第一周：基础语法**
- 变量和数据类型
- 条件语句和循环
- 函数定义和调用

**第二周：数据结构**
- 列表、元组、字典
- 字符串操作
- 集合与推导式

**第三周：进阶特性**
- 面向对象基础
- 异常处理
- 文件操作

**第四周：实战项目**
- 小型项目练习
- 代码调试技巧
- 综合应用

**学习建议**
- 每天坚持练习 1-2 小时
- 多动手写代码，不要只看
- 遇到问题及时提问

加油！你一定可以的！💪`,

  default: `这是一个很好的问题！让我来帮你分析一下。

**问题分析**
这个问题涉及编程的基础概念，理解它对你的学习很有帮助。

**核心要点**
1. 首先理解问题的本质
2. 分析可能的解决方案
3. 选择最优的实现方式
4. 测试并验证结果

**示例代码**
\`\`\`python
def solution(data):
    # 处理逻辑
    result = process(data)
    return result
\`\`\`

**延伸思考**
- 有没有更高效的方法？
- 边界情况都考虑到了吗？
- 代码可读性怎么样？

希望对你有帮助！还有什么想了解的吗？😊`
}

function getDemoResponse(prompt) {
  const p = (prompt || '').toLowerCase()
  const hasCode = p.includes('```') || p.includes('#include') || p.includes('def ') ||
    p.includes('function ') || p.includes('int main') || p.includes('public class')

  if (hasCode || p.includes('报错') || p.includes('错误') || p.includes('bug') || p.includes('异常')) {
    return demoResponses.bug_fix
  }
  if (p.includes('评价') || p.includes('代码质量') || p.includes('优化') || p.includes('review')) {
    return demoResponses.code_review
  }
  if (p.includes('学习计划') || p.includes('学习路径') || p.includes('怎么学') || p.includes('规划')) {
    return demoResponses.learning_plan
  }
  if (p.includes('递归') || p.includes('函数') || p.includes('python') || p.includes('讲解') || p.includes('原理')) {
    return demoResponses.python_question
  }
  return demoResponses.default
}

/* ================ 流式生成 ================ */
export async function generateStream(prompt, system = '', model = '', onStream) {
  if (API_MODE === 'demo') {
    const full = getDemoResponse(prompt)
    // 模拟逐字流式输出
    let acc = ''
    const step = Math.max(2, Math.ceil(full.length / 60))
    for (let i = 0; i < full.length; i += step) {
      acc = full.slice(0, i + step)
      if (onStream) onStream(acc, false)
      await new Promise(r => setTimeout(r, 18))
    }
    if (onStream) onStream(full, true)
    return full
  }

  if (API_MODE === 'zhipu') {
    // 智谱 AI 流式（带 60s 超时 + 可读错误，避免长时间“正在思考”卡死）
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)
    let resp
    try {
      resp = await fetch(`${ZHIPU_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ZHIPU_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          model: ZHIPU_CONFIG.model,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt }
          ],
          stream: true
        }),
        signal: controller.signal
      })
    } catch (e) {
      clearTimeout(timer)
      if (e && e.name === 'AbortError') throw new Error('AI 响应超时，请检查网络后重试')
      throw new Error('无法连接 AI 服务，请检查网络或代理配置')
    }
    if (!resp.ok) {
      clearTimeout(timer)
      const detail = await resp.text().catch(() => '')
      throw new Error(`智谱 API 请求失败：${resp.status} ${detail}`.trim())
    }
    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.trim().startsWith('data:'))
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
          } catch (e) { /* ignore */ }
        }
      }
    } finally {
      clearTimeout(timer)
    }
    if (onStream) onStream(full, true)
    return full
  }

  // ollama
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || 'qwen2.5:7b', prompt, system, stream: true })
  })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(l => l.trim())
    for (const line of lines) {
      try {
        const data = JSON.parse(line)
        if (data.response) {
          fullResponse += data.response
          if (onStream) onStream(fullResponse, false)
        }
        if (data.done && onStream) onStream(fullResponse, true)
      } catch (e) { /* ignore */ }
    }
  }
  return fullResponse
}

export async function generate(prompt, system = '', model = 'qwen2.5:7b') {
  if (API_MODE === 'demo') {
    await new Promise(r => setTimeout(r, 600))
    return { response: getDemoResponse(prompt) }
  }
  const response = await ollamaClient.post('/generate', { model, prompt, system, stream: false })
  return response.data
}

export async function getModels() {
  if (API_MODE !== 'ollama') return { models: [] }
  const response = await ollamaClient.get('/tags')
  return response.data
}

// 教育场景专用 Prompt 模板
export const PROMPT_TEMPLATES = {
  programmingTutor: `你是码途智辅，一名耐心专业的编程导师。用通俗易懂的语言回答学生问题，善于举例和循序渐进地引导。`,

  learningDiagnosis: `你是一名专业的学习诊断分析师。根据学生的学习数据，从知识掌握、能力水平、薄弱知识点、学习习惯、个性化建议五个维度输出诊断报告，用 Markdown 格式，条理清晰。`,

  codeReviewer: `你是一名资深代码评审专家。请从正确性、效率、规范性、可读性、健壮性五个维度（各 1-10 分）评价学生代码，给出评分表格与改进建议，用 Markdown 格式输出。`,

  examCoach: `你是一名专业的计算机考试辅导老师。根据学生水平和考试目标制定个性化备考计划，考虑当前水平、考试时间、内容范围、薄弱环节与艾宾浩斯遗忘曲线，输出备考策略、分阶段计划、每日任务、重点方向与注意事项，用 Markdown 格式。`
}

export default {
  generate,
  generateStream,
  getModels,
  PROMPT_TEMPLATES,
  API_MODE
}
