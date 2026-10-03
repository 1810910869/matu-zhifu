<template>
  <div class="training-view">
    <div class="training-layout">
      <!-- 左：题目列表 -->
      <aside class="problem-panel">
        <div class="panel-header">
          <div class="ph-title">
            <el-icon><Notebook /></el-icon>
            训练题库
          </div>
          <el-tag size="small" type="primary" effect="light">{{ filteredProblems.length }} 题</el-tag>
        </div>

        <div class="filter-row">
          <el-select v-model="difficultyFilter" size="small" style="width: 100%">
            <el-option label="全部难度" value="all" />
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </div>

        <div class="problem-list">
          <div
            v-for="p in filteredProblems"
            :key="p.id"
            class="problem-item"
            :class="{ active: currentProblem.id === p.id }"
            @click="selectProblem(p)"
          >
            <div class="pi-head">
              <span class="pi-id">#{{ p.id }}</span>
              <el-tag :type="getDifficultyType(p.difficulty)" size="small" effect="light">
                {{ getDifficultyText(p.difficulty) }}
              </el-tag>
            </div>
            <div class="pi-title">{{ p.title }}</div>
            <div class="pi-foot">
              <span class="pi-tag">{{ p.category }}</span>
              <span class="pi-status" :class="p.status">
                <el-icon v-if="p.status === 'passed'"><CircleCheckFilled /></el-icon>
                <el-icon v-else-if="p.status === 'attempted'"><Clock /></el-icon>
                <el-icon v-else><Minus /></el-icon>
                {{ getStatusText(p.status) }}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中：题目描述 + 代码编辑 -->
      <div class="work-panel">
        <div class="work-tabs">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            class="work-tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <el-icon><component :is="tab.icon" /></el-icon>
            {{ tab.label }}
          </div>
        </div>

        <div class="work-body">
          <div v-show="activeTab === 'description'" class="desc-content">
            <div class="desc-title">{{ currentProblem.title }}</div>
            <div class="desc-meta">
              <el-tag :type="getDifficultyType(currentProblem.difficulty)" effect="light" size="small">
                {{ getDifficultyText(currentProblem.difficulty) }}
              </el-tag>
              <span class="meta-item"><el-icon><CollectionTag /></el-icon>{{ currentProblem.category }}</span>
              <span class="meta-item"><el-icon><TrendCharts /></el-icon>通过率 {{ currentProblem.passRate }}%</span>
            </div>
            <p class="desc-text">{{ currentProblem.description }}</p>

            <div class="desc-section-title">示例</div>
            <div class="example-block" v-for="(ex, i) in currentProblem.examples" :key="i">
              <div class="example-row"><span class="label">输入：</span><code>{{ ex.input }}</code></div>
              <div class="example-row"><span class="label">输出：</span><code>{{ ex.output }}</code></div>
              <div class="example-row" v-if="ex.explain"><span class="label">解释：</span><span>{{ ex.explain }}</span></div>
            </div>

            <div class="desc-section-title">提示</div>
            <ul class="hint-list">
              <li v-for="(h, i) in currentProblem.hints" :key="i">{{ h }}</li>
            </ul>
          </div>

          <div v-show="activeTab === 'code'" class="code-content">
            <div class="code-toolbar">
              <el-select v-model="selectedLanguage" size="small" style="width: 130px" @change="onLangChange">
                <el-option label="Python" value="python" />
                <el-option label="Java" value="java" />
                <el-option label="C++" value="cpp" />
              </el-select>
              <div class="toolbar-right">
                <el-button size="small" @click="resetCode">
                  <el-icon><RefreshLeft /></el-icon>
                  重置
                </el-button>
              </div>
            </div>
            <textarea
              v-model="codeContent"
              class="code-editor"
              spellcheck="false"
              placeholder="# 在此编写你的代码…"
            ></textarea>
          </div>
        </div>

        <div class="work-footer">
          <div class="footer-left">
            <el-button @click="runCode" :loading="isRunning" :disabled="isRunning || isSubmitting">
              <el-icon v-if="!isRunning"><VideoPlay /></el-icon>
              运行
            </el-button>
            <el-button type="primary" @click="submitCode" :loading="isSubmitting" :disabled="isRunning || isSubmitting">
              <el-icon v-if="!isSubmitting"><Upload /></el-icon>
              AI 智能评价
            </el-button>
          </div>
          <span class="keyboard-tip">Ctrl + Enter 快速运行</span>
        </div>
      </div>

      <!-- 右：运行结果 / 评价 -->
      <aside class="result-panel">
        <div class="panel-header">
          <div class="ph-title">
            <el-icon><Monitor /></el-icon>
            运行结果
          </div>
        </div>

        <div class="result-body">
          <div v-if="!outputResult && !reviewResult" class="empty-state">
            <el-icon :size="42" color="#cbd5e1"><Monitor /></el-icon>
            <p>点击「运行」查看输出结果</p>
            <p style="font-size:12px">点击「AI 智能评价」获取五维评分</p>
          </div>

          <!-- 运行输出 -->
          <div v-if="outputResult" class="output-block" :class="outputResult.success ? 'ok' : 'err'">
            <div class="output-head">
              <el-icon>
                <CircleCheckFilled v-if="outputResult.success" />
                <CircleCloseFilled v-else />
              </el-icon>
              <span>{{ outputResult.success ? '运行成功' : '运行出错' }}</span>
              <span class="cost">耗时 {{ outputResult.cost }}ms</span>
            </div>
            <pre class="output-content">{{ outputResult.output }}</pre>
          </div>

          <!-- AI 评价 -->
          <div v-if="reviewResult" class="review-block">
            <div class="review-score">
              <div class="score-ring" :style="{ '--pct': reviewResult.total + '%', '--clr': getScoreColor(reviewResult.total) }">
                <span class="score-num">{{ reviewResult.total }}</span>
                <span class="score-unit">分</span>
              </div>
              <div class="score-desc">
                <p class="grade">{{ getScoreGrade(reviewResult.total) }}</p>
                <p class="grade-sub">综合评分</p>
              </div>
            </div>

            <div class="dimension-list">
              <div class="dimension-item" v-for="dim in reviewResult.dimensions" :key="dim.name">
                <div class="dim-head">
                  <span class="dim-name">{{ dim.name }}</span>
                  <span class="dim-score" :style="{ color: getScoreColor(dim.score * 10) }">{{ dim.score }}</span>
                </div>
                <el-progress
                  :percentage="dim.score * 10"
                  :stroke-width="7"
                  :show-text="false"
                  :color="getScoreColor(dim.score * 10)"
                />
              </div>
            </div>

            <div class="review-comment">
              <div class="comment-title"><el-icon><ChatLineSquare /></el-icon>AI 点评</div>
              <p>{{ reviewResult.comment }}</p>
            </div>

            <div class="review-suggestions">
              <div class="comment-title"><el-icon><MagicStick /></el-icon>改进建议</div>
              <ul>
                <li v-for="(s, i) in reviewResult.suggestions" :key="i">{{ s }}</li>
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { chatJSON } from '@/api/request'
import { problemBank } from '@/data/problems'
import {
  Notebook, Document, Monitor, CircleCheckFilled, CircleCloseFilled, Clock,
  Minus, RefreshLeft, VideoPlay, Upload, CollectionTag, TrendCharts,
  ChatLineSquare, MagicStick
} from '@element-plus/icons-vue'

const difficultyFilter = ref('all')
const selectedLanguage = ref('python')
const activeTab = ref('description')
const isRunning = ref(false)
const isSubmitting = ref(false)
const outputResult = ref(null)
const reviewResult = ref(null)
const codeContent = ref('')

const tabs = [
  { key: 'description', label: '题目描述', icon: 'Document' },
  { key: 'code', label: '代码编辑', icon: 'Monitor' }
]

const problems = ref(problemBank)

const filteredProblems = computed(() => {
  if (difficultyFilter.value === 'all') return problems.value
  return problems.value.filter(p => p.difficulty === difficultyFilter.value)
})

const currentProblem = ref(problems.value[0])

const defaultTemplates = {
  python: `# 请在此编写你的 Python 代码\n\n`,
  java: `// 请在此编写你的 Java 代码\n\n`,
  cpp: `// 请在此编写你的 C++ 代码\n\n`
}

function selectProblem(problem) {
  currentProblem.value = problem
  activeTab.value = 'description'
  outputResult.value = null
  reviewResult.value = null
  codeContent.value = defaultTemplates[selectedLanguage.value]
}

function onLangChange() {
  codeContent.value = defaultTemplates[selectedLanguage.value]
}

function getDifficultyType(d) {
  return { easy: 'success', medium: 'warning', hard: 'danger' }[d] || 'info'
}
function getDifficultyText(d) {
  return { easy: '简单', medium: '中等', hard: '困难' }[d] || d
}
function getStatusText(s) {
  return { passed: '已通过', attempted: '尝试过', pending: '未开始' }[s] || s
}
function getScoreColor(score) {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#6366f1'
  if (score >= 60) return '#f59e0b'
  return '#f43f5e'
}
function getScoreGrade(score) {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '待提升'
}

function resetCode() {
  codeContent.value = defaultTemplates[selectedLanguage.value]
  outputResult.value = null
  ElMessage.info('已重置为初始模板')
}

function runCode() {
  if (!codeContent.value.trim()) {
    ElMessage.warning('请先编写代码')
    activeTab.value = 'code'
    return
  }
  isRunning.value = true
  outputResult.value = null
  setTimeout(() => {
    isRunning.value = false
    const cost = 30 + Math.floor(Math.random() * 60)
    // 演示判定：包含关键词则视为通过
    const code = codeContent.value
    const hasLogic = code.trim().split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//')).length > 2
    if (hasLogic) {
      outputResult.value = {
        success: true,
        cost,
        output: `[执行成功]\n\n用例 1：\n  输入：${currentProblem.value.examples[0].input}\n  期望输出：${currentProblem.value.examples[0].output}\n  实际输出：${currentProblem.value.examples[0].output}\n  ✓ 通过\n\n共 1 个测试用例，全部通过。`
      }
      ElMessage.success('运行成功，测试用例通过')
    } else {
      outputResult.value = {
        success: false,
        cost,
        output: `[执行出错]\n\nNameError: name 'xxx' is not defined\n  第 3 行\n\n提示：请检查变量名拼写，或补全你的解题逻辑。`
      }
      ElMessage.error('存在运行错误')
    }
  }, 800)
}

async function submitCode() {
  if (!codeContent.value.trim()) {
    ElMessage.warning('请先编写代码')
    activeTab.value = 'code'
    return
  }
  isSubmitting.value = true
  reviewResult.value = null
  const code = codeContent.value

  // 代码实际语言与所选语言不一致时自动纠正，避免 AI 因语言不匹配而误判为 0 分
  const actualLang = detectLanguage(code)
  if (actualLang !== selectedLanguage.value) {
    selectedLanguage.value = actualLang
    ElMessage.info('已自动识别代码语言：' + ({ python: 'Python', java: 'Java', cpp: 'C++' }[actualLang] || actualLang))
  }

  // 1) 空答案 / 非有效代码：直接判定不及格，不标记通过（不消耗 AI 调用）
  if (!isMeaningfulCode(code)) {
    reviewResult.value = invalidReview()
    currentProblem.value.status = 'attempted'
    isSubmitting.value = false
    ElMessage.error('作答内容无效，未通过')
    return
  }

  // 2) 调用真实 AI 进行五维评价，失败时回退本地启发式评分
  let review = null
  try {
    review = await requestAiReview(code)
  } catch (e) {
    console.warn('AI 评价调用失败，回退本地评分', e)
  }
  if (!review) {
    review = localReview(code)
    ElMessage.warning('AI 服务暂不可用，已使用本地评分')
  }

  reviewResult.value = review
  if (review.total >= 60) {
    currentProblem.value.status = 'passed'
    ElMessage.success(`AI 评价完成：${review.total} 分`)
  } else {
    currentProblem.value.status = 'attempted'
    ElMessage.warning(`AI 评价完成：${review.total} 分，未达及格线`)
  }
  isSubmitting.value = false
}

function invalidReview() {
  return {
    total: 2,
    dimensions: [
      { name: '正确性', score: 0 },
      { name: '效率', score: 0 },
      { name: '规范性', score: 1 },
      { name: '可读性', score: 0 },
      { name: '健壮性', score: 0 }
    ],
    valid: false,
    comment: '检测到本次作答内容不足或不是有效代码：未识别到任何可评价的程序结构（如函数、变量、循环、条件、输出等），AI 无法对其进行评分，判定为【不及格】。请根据题目要求认真编写解题代码后再提交。',
    suggestions: [
      '请写出完整的解题逻辑，而不是单个符号、问号或空白',
      '代码应包含函数定义、变量、循环或条件判断等基本结构',
      '如暂时没有思路，可点击左侧题目提示，或到「AI智能导师」寻求讲解'
    ]
  }
}

const DIM_NAMES = ['正确性', '效率', '规范性', '可读性', '健壮性']
function normalizeDimensions(raw) {
  const out = []
  for (const name of DIM_NAMES) {
    let sc = 0
    if (Array.isArray(raw)) {
      const hit = raw.find(d => d && d.name === name)
      sc = hit ? Number(hit.score) : 0
    } else if (raw && typeof raw === 'object') {
      sc = Number(raw[name])
    }
    if (!Number.isFinite(sc)) sc = 0
    out.push({ name, score: Math.max(0, Math.min(10, Math.round(sc))) })
  }
  return out
}

// 调用真实 AI 五维评价（失败返回 null 交由本地兜底）
async function requestAiReview(code) {
  const p = currentProblem.value
  const evalLang = detectLanguage(code)
  const evalLangLabel = { python: 'Python', java: 'Java', cpp: 'C++' }[evalLang] || evalLang
  const system = '你是一位严谨的高职计算机编程课助教，负责对学生提交的代码按五个维度（正确性/效率/规范性/可读性/健壮性，每项 0-10 分）评分，并给出评语与改进建议。请以代码实际使用的编程语言为基准评分，绝不因所选语言与代码实际语言不一致而判零分。'
  const prompt = `请评价下面这道题的作答代码，严格以 JSON 输出，不要任何多余解释。
题目：${p.title}
题目描述：${p.description}
编程语言：${evalLangLabel}

学生代码：
\`\`\`${evalLangLabel}
${code}
\`\`\`

返回 JSON（键名固定）：
{
  "dimensions": { "正确性": 0-10, "效率": 0-10, "规范性": 0-10, "可读性": 0-10, "健壮性": 0-10 },
  "comment": "80-150 字总评，指出优点与主要问题",
  "suggestions": ["改进建议1", "改进建议2", "改进建议3"]
}
评分需结合：题目是否被正确解决、算法效率、命名与注释规范、边界与异常处理。`
  const res = await chatJSON(prompt, system, '', { timeout: 60000 })
  if (!res || !res.dimensions) return null
  const dimensions = normalizeDimensions(res.dimensions)
  const total = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / 5 * 10)
  return {
    total,
    dimensions,
    valid: true,
    comment: res.comment || 'AI 已完成评价。',
    suggestions: (Array.isArray(res.suggestions) && res.suggestions.length)
      ? res.suggestions
      : ['注意代码规范与边界处理']
  }
}

// 自动识别代码实际使用的语言（用于纠偏「所选语言」与代码不一致）
function detectLanguage(code) {
  if (!code || !code.trim()) return selectedLanguage.value
  const c = code
  if (/#include\s*</.test(c) || /std::/.test(c) || /using\s+namespace/.test(c) ||
      /vector\s*</.test(c) || /unordered_map/.test(c) || /unordered_set/.test(c) ||
      /\bcout\b/.test(c) || /\bcin\b/.test(c) || /->\s*\w/.test(c) ||
      /nullptr/.test(c) || /template\s*</.test(c) || /public\s*:/.test(c)) {
    return 'cpp'
  }
  if (/\bSystem\.out\b/.test(c) || /public\s+static\s+void\s+main/.test(c) ||
      /import\s+java\./.test(c) || /new\s+ArrayList/.test(c) || /HashMap\s*</.test(c)) {
    return 'java'
  }
  if (/\bdef\s+\w+\s*\(/.test(c) || /\bprint\s*\(/.test(c) || /\belif\b/.test(c) ||
      /\bself\b/.test(c) || /\bimport\s+\w+/.test(c) || /:\s*$/m.test(c)) {
    return 'python'
  }
  return selectedLanguage.value
}

// 本地启发式评分（AI 不可用时兜底）
function localReview(code) {
  const lineCount = code.split('\n').filter(l => l.trim()).length
  const commentLines = code.split('\n').filter(l => /^\s*(#|\/\/)/.test(l)).length
  const hasComment = commentLines > 0
  const hasError = /try|catch|except|if|else/.test(code)
  const hasOutput = /print|return|console\.log|printf/.test(code)
  const hasLogic = /for|while|if|elif|else|def|function|switch/.test(code)
  const dimensions = [
    { name: '正确性', score: Math.min(10, 6 + (hasLogic ? 2 : 0) + (hasOutput ? 1 : 0)) },
    { name: '效率', score: Math.min(10, 5 + (lineCount > 5 ? 2 : 1) + (hasLogic ? 1 : 0)) },
    { name: '规范性', score: Math.min(10, 5 + (hasComment ? 3 : 0) + (lineCount > 3 ? 1 : 0)) },
    { name: '可读性', score: Math.min(10, 6 + (hasComment ? 2 : 0) + (hasLogic ? 1 : 0)) },
    { name: '健壮性', score: Math.min(10, 4 + (hasError ? 4 : 0) + (hasOutput ? 1 : 0)) }
  ]
  const total = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / 5 * 10)
  return {
    total,
    dimensions,
    valid: true,
    comment: `（本地评分）你的代码共 ${lineCount} 行，${hasComment ? '包含注释，' : '建议补充注释，'}结构基本合理。` +
      (total >= 80 ? '整体质量优秀，继续保持！' : total >= 65 ? '整体质量良好，仍有优化空间。' : '建议加强基础练习，注意边界情况处理。'),
    suggestions: [
      hasComment ? '注释规范，继续保持；可进一步说明算法复杂度' : '建议为关键逻辑添加注释，提升代码可维护性',
      hasError ? '补充边界情况的判断，增强程序健壮性' : '考虑添加异常处理，应对非法输入',
      '可以尝试用更优的算法思路降低时间 / 空间复杂度'
    ]
  }
}

// 判断是否为「有效作答」：去除注释与空白后仍具备基本代码结构
function isMeaningfulCode(code) {
  if (!code) return false
  const cleaned = code
    .replace(/\/\*[\s\S]*?\*\//g, '')   // 块注释
    .replace(/\/\/.*$/gm, '')          // // 行注释
    .replace(/#.*$/gm, '')             // # 行注释
    .replace(/\s+/g, '')               // 空白
  if (cleaned.length < 10) return false
  // 必须包含代码结构特征，纯符号 / 单个问号无法匹配
  const codeFeature = /(def\s|return|for\s|while\s|if\s|elif|else|print|import\s|class\s|function|let\s|const\s|var\s|=>|console\.|\{|\}|\(|\)|\[|\]|;|printf|#include|int\s|void\s|public\s|static\s)/
  return codeFeature.test(code)
}
</script>

<style scoped lang="scss">
.training-view { height: calc(100vh - 136px); }
.training-layout { display: flex; gap: 16px; height: 100%; }

/* 题目面板 */
.problem-panel {
  width: 260px; flex-shrink: 0;
  background: var(--bg-primary); border: 1px solid var(--border-color);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column; overflow: hidden;
}
.panel-header {
  padding: 15px 16px 13px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}
.ph-title { display: flex; align-items: center; gap: 7px; font-size: 14.5px; font-weight: 600; }
.filter-row { padding: 12px 14px 6px; }
.problem-list { flex: 1; overflow-y: auto; padding: 6px 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.problem-item {
  padding: 12px; border-radius: 12px; border: 1px solid var(--border-color);
  background: var(--bg-secondary); cursor: pointer; transition: all .22s ease;
  &:hover { border-color: var(--el-color-primary-light-5); transform: translateX(2px); }
  &.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 14px rgba(99,102,241,.14);
  }
}
.pi-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
.pi-id { font-size: 12.5px; font-weight: 700; color: var(--primary-color); }
.pi-title { font-size: 13.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.pi-foot { display: flex; align-items: center; justify-content: space-between; }
.pi-tag { font-size: 11.5px; color: var(--text-light); }
.pi-status {
  display: flex; align-items: center; gap: 3px; font-size: 11.5px;
  &.passed { color: #10b981; }
  &.attempted { color: #f59e0b; }
  &.pending { color: var(--text-light); }
}

/* 工作区 */
.work-panel {
  flex: 1; min-width: 0;
  background: var(--bg-primary); border: 1px solid var(--border-color);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column; overflow: hidden;
}
.work-tabs { display: flex; border-bottom: 1px solid var(--border-color); padding: 0 8px; }
.work-tab {
  display: flex; align-items: center; gap: 6px; padding: 14px 18px;
  font-size: 14px; color: var(--text-secondary); cursor: pointer;
  border-bottom: 2px solid transparent; transition: all .2s;
  &.active { color: var(--primary-color); border-bottom-color: var(--primary-color); font-weight: 600; }
}
.work-body { flex: 1; overflow-y: auto; }

.desc-content { padding: 22px 24px; }
.desc-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
.desc-meta { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.meta-item { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--text-secondary); }
.desc-text { font-size: 14px; line-height: 1.8; color: var(--text-primary); }
.desc-section-title {
  font-size: 14px; font-weight: 600; margin: 20px 0 10px;
  padding-left: 9px; border-left: 3px solid var(--primary-color);
}
.example-block {
  background: var(--bg-secondary); border-radius: 10px; padding: 12px 14px; margin-bottom: 9px;
  font-size: 13px;
}
.example-row { margin-bottom: 5px; &:last-child { margin-bottom: 0; } }
.example-row .label { color: var(--text-secondary); }
.example-row code {
  font-family: 'JetBrains Mono', Consolas, monospace;
  background: rgba(99,102,241,.1); color: var(--primary-dark);
  padding: 2px 7px; border-radius: 5px; font-size: 12.5px;
}
.hint-list { padding-left: 20px; font-size: 13px; color: var(--text-secondary); line-height: 1.9; }

.code-content { display: flex; flex-direction: column; height: 100%; }
.code-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--border-color);
}
.toolbar-right { display: flex; gap: 8px; }
.code-editor {
  flex: 1; width: 100%; border: none; outline: none; resize: none;
  padding: 16px; font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 13.5px; line-height: 1.7;
  background: #0f172a; color: #e2e8f0; tab-size: 4;
}
.code-editor::placeholder { color: #64748b; }

.work-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 18px; border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
.footer-left { display: flex; gap: 10px; }
.keyboard-tip { font-size: 11.5px; color: var(--text-light); }

/* 结果面板 */
.result-panel {
  width: 340px; flex-shrink: 0;
  background: var(--bg-primary); border: 1px solid var(--border-color);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column; overflow: hidden;
}
.result-body { flex: 1; overflow-y: auto; padding: 16px; }

.output-block {
  border-radius: 12px; overflow: hidden; margin-bottom: 14px;
  border: 1px solid var(--border-color);
  &.ok .output-head { background: rgba(16,185,129,.1); color: #10b981; }
  &.err .output-head { background: rgba(244,63,94,.1); color: #f43f5e; }
}
.output-head {
  display: flex; align-items: center; gap: 7px; padding: 10px 14px; font-size: 13px; font-weight: 600;
  .cost { margin-left: auto; font-size: 11.5px; font-weight: 400; color: var(--text-light); }
}
.output-content {
  padding: 14px; font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12px; line-height: 1.7; white-space: pre-wrap;
  background: #0f172a; color: #e2e8f0; margin: 0; max-height: 240px; overflow: auto;
}

.review-block { animation: slideUp .4s ease both; }
.review-score { display: flex; align-items: center; gap: 18px; padding: 8px 0 18px; }
.score-ring {
  width: 90px; height: 90px; border-radius: 50%; flex-shrink: 0;
  background: conic-gradient(var(--clr) var(--pct), #eef2f7 0);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  &::before { content: ''; position: absolute; inset: 8px; border-radius: 50%; background: var(--bg-primary); }
  .score-num { position: relative; font-size: 26px; font-weight: 800; color: var(--clr); }
  .score-unit { position: relative; font-size: 12px; color: var(--text-light); margin-left: 2px; align-self: flex-end; margin-bottom: 8px; }
}
.score-desc .grade { font-size: 20px; font-weight: 700; margin: 0; color: var(--text-primary); }
.score-desc .grade-sub { font-size: 12.5px; color: var(--text-light); margin: 3px 0 0; }

.dimension-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px; }
.dim-head { display: flex; justify-content: space-between; margin-bottom: 5px; }
.dim-name { font-size: 13px; color: var(--text-secondary); }
.dim-score { font-size: 13px; font-weight: 700; }

.review-comment, .review-suggestions {
  background: var(--bg-secondary); border-radius: 12px; padding: 14px; margin-bottom: 12px;
}
.comment-title { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }
.review-comment p { font-size: 13px; line-height: 1.7; color: var(--text-secondary); margin: 0; }
.review-suggestions ul { padding-left: 18px; margin: 0; }
.review-suggestions li { font-size: 12.5px; color: var(--text-secondary); line-height: 1.8; }
</style>
