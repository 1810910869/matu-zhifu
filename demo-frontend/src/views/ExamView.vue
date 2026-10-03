<template>
  <div class="exam-view page-grid">
    <!-- 顶部概览 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon" style="background: var(--brand-gradient)">
          <el-icon :size="24"><Calendar /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">目标考试</p>
          <p class="card-value" style="font-size:16px">{{ formData.examName || '待选择' }}</p>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon" style="background: var(--sunset-gradient)">
          <el-icon :size="24"><AlarmClock /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">剩余天数</p>
          <p class="card-value">{{ daysLeft }} <span class="unit">天</span></p>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg,#3b82f6,#60a5fa)">
          <el-icon :size="24"><Timer /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">建议每日学习</p>
          <p class="card-value">{{ dailyHours }} <span class="unit">小时</span></p>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon" style="background: var(--success-gradient)">
          <el-icon :size="24"><TrendCharts /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">备考进度</p>
          <p class="card-value">--</p>
        </div>
      </div>
    </div>

    <!-- 常见目标考试 -->
    <div class="card">
      <div class="card-title">
        <el-icon class="icon"><Trophy /></el-icon>
        热门目标考试
      </div>
      <div class="exam-cards">
        <div
          v-for="exam in examOptions"
          :key="exam.name"
          class="exam-card"
          :class="{ active: selectedExam?.name === exam.name }"
          @click="selectExam(exam)"
        >
          <div class="exam-icon" :style="{ background: exam.bg }">
            <el-icon :size="22"><component :is="exam.icon" /></el-icon>
          </div>
          <div class="exam-info">
            <h4>{{ exam.name }}</h4>
            <p>{{ exam.desc }}</p>
            <div class="exam-tags">
              <el-tag size="small" effect="plain">{{ exam.level }}</el-tag>
              <el-tag size="small" type="warning" effect="light">{{ exam.competitive }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-row">
      <!-- 备考计划配置 -->
      <div class="card">
        <div class="card-title">
          <el-icon class="icon"><Setting /></el-icon>
          AI 备考计划生成
        </div>
        <el-form :model="formData" label-position="top" class="plan-form">
          <el-form-item label="目标考试">
            <el-input v-model="formData.examName" placeholder="如：全国计算机等级考试二级 Python" />
          </el-form-item>
          <div class="form-row">
            <el-form-item label="当前水平">
              <el-select v-model="formData.level" style="width: 100%">
                <el-option label="零基础" value="零基础" />
                <el-option label="入门" value="入门" />
                <el-option label="进阶" value="进阶" />
                <el-option label="熟练" value="熟练" />
              </el-select>
            </el-form-item>
            <el-form-item label="考试日期">
              <el-date-picker
                v-model="formData.examDate"
                type="date"
                placeholder="选择考试日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </div>
          <el-form-item label="每日可学习时长（小时）">
            <el-slider v-model="formData.hoursPerDay" :min="1" :max="8" :marks="{1:'1h',4:'4h',8:'8h'}" show-stops />
          </el-form-item>
          <el-form-item label="重点突破方向（可多选）">
            <el-checkbox-group v-model="formData.focusAreas">
              <el-checkbox label="基础语法" border size="small" />
              <el-checkbox label="算法与数据结构" border size="small" />
              <el-checkbox label="编程题实操" border size="small" />
              <el-checkbox label="错题巩固" border size="small" />
            </el-checkbox-group>
          </el-form-item>
          <el-button
            type="primary"
            class="generate-btn"
            :loading="isGenerating"
            :disabled="!formData.examName"
            @click="generatePlan"
          >
            <el-icon v-if="!isGenerating"><MagicStick /></el-icon>
            {{ isGenerating ? 'AI 正在规划中…' : '一键生成个性化备考计划' }}
          </el-button>
        </el-form>
      </div>

      <!-- 备考知识锦囊 -->
      <div class="card">
        <div class="card-title">
          <el-icon class="icon" style="color:var(--warning-color)"><Reading /></el-icon>
          备考知识锦囊
        </div>
        <div class="tips-list">
          <div class="tip-item" v-for="(tip, i) in studyTips" :key="i">
            <div class="tip-icon" :style="{ background: tip.bg }">
              <el-icon><component :is="tip.icon" /></el-icon>
            </div>
            <div class="tip-content">
              <h5>{{ tip.title }}</h5>
              <p>{{ tip.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI 生成的备考计划 -->
    <div v-if="studyPlan" class="card plan-result animate-in">
      <div class="card-title">
        <el-icon class="icon"><Document /></el-icon>
        {{ studyPlan.title }}
        <el-tag type="success" effect="light" style="margin-left:auto">
          <el-icon><CircleCheckFilled /></el-icon> AI 已生成
        </el-tag>
      </div>
      <div class="plan-summary">
        <div class="summary-item">
          <span class="si-label">总周期</span>
          <span class="si-value">{{ studyPlan.totalWeeks }} 周</span>
        </div>
        <div class="summary-item">
          <span class="si-label">每日时长</span>
          <span class="si-value">{{ studyPlan.hoursPerDay }} 小时</span>
        </div>
        <div class="summary-item">
          <span class="si-label">覆盖阶段</span>
          <span class="si-value">{{ studyPlan.phases.length }} 个</span>
        </div>
        <div class="summary-item">
          <span class="si-label">预计达成</span>
          <span class="si-value">{{ studyPlan.target }}</span>
        </div>
      </div>

      <div class="phase-list">
        <div
          v-for="(phase, index) in studyPlan.phases"
          :key="index"
          class="phase-item"
          :class="{ expanded: expandedPhases.includes(index) }"
        >
          <div class="phase-header" @click="togglePhase(index)">
            <div class="phase-badge" :style="{ background: phase.color }">{{ index + 1 }}</div>
            <div class="phase-title-group">
              <h4>{{ phase.name }}</h4>
              <span class="phase-duration">{{ phase.duration }}</span>
            </div>
            <el-icon class="phase-arrow"><ArrowRight /></el-icon>
          </div>
          <transition name="fade">
            <div class="phase-body" v-show="expandedPhases.includes(index)">
              <p class="phase-goal">{{ phase.goal }}</p>
              <div class="task-list">
                <div class="task-item" v-for="(task, ti) in phase.tasks" :key="ti">
                  <el-icon color="#6366f1"><Select /></el-icon>
                  <span>{{ task }}</span>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div class="plan-actions">
        <el-button @click="studyPlan = null">重新规划</el-button>
        <el-button type="primary" @click="downloadPlan">
          <el-icon><Download /></el-icon>
          下载备考计划
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { chatJSON } from '@/api/request'
import {
  Calendar, AlarmClock, Timer, TrendCharts, Trophy, Setting, MagicStick,
  Reading, Document, CircleCheckFilled, ArrowRight, Select, Download
} from '@element-plus/icons-vue'

const selectedExam = ref(null)
const isGenerating = ref(false)
const studyPlan = ref(null)
const expandedPhases = ref([0, 1, 2])

const formData = reactive({
  examName: '',
  level: '入门',
  examDate: '',
  hoursPerDay: 3,
  focusAreas: ['算法与数据结构', '编程题实操']
})

const examOptions = [
  { name: '全国计算机等级考试二级 Python', desc: '教育部主办，考查 Python 编程基础与应用', level: '二级', competitive: '热门', icon: 'Document', bg: 'linear-gradient(135deg,#6366f1,#818cf8)' },
  { name: '全国计算机等级考试二级 Java', desc: '面向 Java 语言程序设计能力认证', level: '二级', competitive: '热门', icon: 'Document', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
  { name: '蓝桥杯软件赛（Python 组）', desc: '全国性 IT 学科竞赛，算法能力大考', level: '竞赛', competitive: '高含金量', icon: 'Trophy', bg: 'linear-gradient(135deg,#10b981,#34d399)' },
  { name: '软件设计师（软考中级）', desc: '国家级软件工程职业资格认证', level: '中级', competitive: '高含金量', icon: 'Medal', bg: 'linear-gradient(135deg,#8b5cf6,#a78bfa)' }
]

const studyTips = [
  { title: '艾宾浩斯记忆曲线', content: '学习后 1 天、2 天、4 天、7 天、15 天是复习关键节点，科学安排复习避免遗忘。', icon: 'Histogram', bg: 'linear-gradient(135deg,#6366f1,#818cf8)' },
  { title: '费曼学习法', content: '用自己的话把知识点讲给别人听，讲不清楚的地方就是你没掌握的地方。', icon: 'ChatDotRound', bg: 'linear-gradient(135deg,#10b981,#34d399)' },
  { title: '刻意练习', content: '针对薄弱环节进行高强度的针对性练习，比泛泛刷题更有效。', icon: 'Aim', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
  { title: '错题复盘', content: '每道错题都要弄清楚错因，建立错题本，考前重点回顾。', icon: 'Notebook', bg: 'linear-gradient(135deg,#f43f5e,#fb7185)' }
]

const daysLeft = computed(() => {
  if (!formData.examDate) return '--'
  const diff = new Date(formData.examDate) - new Date()
  return Math.max(0, Math.ceil(diff / 86400000))
})

const dailyHours = computed(() => formData.hoursPerDay)

function selectExam(exam) {
  selectedExam.value = exam
  formData.examName = exam.name
}

function togglePhase(index) {
  const i = expandedPhases.value.indexOf(index)
  if (i > -1) expandedPhases.value.splice(i, 1)
  else expandedPhases.value.push(index)
}

async function generatePlan() {
  if (isGenerating.value) return
  if (!formData.examName) {
    ElMessage.warning('请先选择目标考试')
    return
  }
  isGenerating.value = true
  studyPlan.value = null
  expandedPhases.value = [0, 1, 2]
  const weeks = daysLeft.value === '--' ? 8 : Math.max(2, Math.ceil(daysLeft.value / 7))

  const system = '你是一位资深的职业资格考试备考规划师，擅长根据考生的目标考试、当前水平、每日可用时间、剩余天数与重点方向，制定具体、可执行、个性化的备考计划。'
  const prompt = `请为以下考生制定一份个性化备考计划，严格以 JSON 输出，不要任何多余解释：
目标考试：${formData.examName}
当前水平：${formData.level}
考试日期：${formData.examDate || '未设置'}
剩余天数：${daysLeft.value} 天
每日可学习时长：${formData.hoursPerDay} 小时
重点突破方向：${formData.focusAreas.join('、') || '核心考点'}
预计总周期：约 ${weeks} 周

返回 JSON（键名固定）：
{
  "title": "含考试名的计划标题",
  "target": "考生预计达成的目标",
  "phases": [
    { "name": "阶段名", "duration": "如 第 1-3 周", "goal": "该阶段目标", "tasks": ["具体任务1", "具体任务2", "具体任务3"] }
  ]
}
要求：phases 为 3-4 个阶段，逐层递进；tasks 要结合上述重点方向与每日时长，写得具体可执行；总时长与剩余天数相匹配。`

  let plan = null
  try {
    const res = await chatJSON(prompt, system, '', { timeout: 60000 })
    if (res && Array.isArray(res.phases) && res.phases.length) {
      const colors = [
        'linear-gradient(135deg,#6366f1,#818cf8)',
        'linear-gradient(135deg,#f59e0b,#fbbf24)',
        'linear-gradient(135deg,#10b981,#34d399)',
        'linear-gradient(135deg,#8b5cf6,#a78bfa)'
      ]
      plan = {
        title: res.title || `${formData.examName} · 个性化备考计划`,
        totalWeeks: weeks,
        hoursPerDay: formData.hoursPerDay,
        target: res.target || (formData.level === '零基础' ? '达到及格水平' : '冲刺优秀'),
        phases: res.phases.map((p, i) => ({
          name: p.name || `第 ${i + 1} 阶段`,
          duration: p.duration || '',
          color: colors[i % colors.length],
          goal: p.goal || '',
          tasks: Array.isArray(p.tasks) ? p.tasks : []
        }))
      }
    }
  } catch (e) {
    console.warn('AI 备考计划生成失败，回退本地模板', e)
  }

  if (!plan) {
    plan = buildLocalPlan(weeks)
    ElMessage.warning('AI 服务暂不可用，已生成本地参考计划')
  } else {
    ElMessage.success('AI 个性化备考计划生成成功')
  }

  studyPlan.value = plan
  isGenerating.value = false
}

// 本地兜底模板（AI 不可用时使用）
function buildLocalPlan(weeks) {
  return {
    title: `${formData.examName} · 个性化备考计划`,
    totalWeeks: weeks,
    hoursPerDay: formData.hoursPerDay,
    target: formData.level === '零基础' ? '达到及格水平' : formData.level === '入门' ? '达到良好水平' : '冲刺优秀',
    phases: [
      {
        name: '第一阶段：基础夯实',
        duration: `第 1-${Math.max(1, Math.ceil(weeks * 0.35))} 周`,
        color: 'linear-gradient(135deg,#6366f1,#818cf8)',
        goal: '系统梳理考试大纲知识点，建立完整的知识框架',
        tasks: [
          '第 1 周：通读考试大纲，学习基础语法与数据类型',
          '第 2 周：掌握流程控制、函数定义与调用',
          '第 3 周：学习常用数据结构（列表、字典、集合）'
        ]
      },
      {
        name: '第二阶段：专项强化',
        duration: `第 ${Math.ceil(weeks * 0.35) + 1}-${Math.ceil(weeks * 0.7)} 周`,
        color: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
        goal: '针对薄弱环节和重点题型进行专项训练',
        tasks: [
          `重点突破：${formData.focusAreas.join('、') || '核心考点'}`,
          '每天完成 2-3 道编程实操题，注重算法思维',
          '整理错题本，归纳常见错误类型'
        ]
      },
      {
        name: '第三阶段：真题冲刺',
        duration: `第 ${Math.ceil(weeks * 0.7) + 1}-${weeks} 周`,
        color: 'linear-gradient(135deg,#10b981,#34d399)',
        goal: '通过真题模拟查漏补缺，调整考试状态',
        tasks: [
          '限时完成近 5 年真题，模拟真实考试环境',
          '复盘错题，重点攻克反复出错的知识点',
          '考前调整作息，保持良好心态'
        ]
      }
    ]
  }
}

function downloadPlan() {
  if (!studyPlan.value) return
  const p = studyPlan.value
  const lines = [
    p.title,
    `生成日期：${new Date().toLocaleDateString('zh-CN')}`,
    `总周期：${p.totalWeeks} 周    每日时长：${p.hoursPerDay} 小时    预计达成：${p.target}`,
    '',
    `【当前水平】${formData.level}`,
    `【重点方向】${formData.focusAreas.join('、')}`,
    `【考试日期】${formData.examDate || '未设置'}`,
    ''
  ]
  p.phases.forEach((ph, i) => {
    lines.push(`【${ph.name}】${ph.duration}`)
    lines.push(`  目标：${ph.goal}`)
    ph.tasks.forEach(t => lines.push(`  - ${t}`))
    lines.push('')
  })
  lines.push('—— 本计划由码途智辅 AI 智能生成，请结合实际情况灵活调整')
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `备考计划_${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('备考计划已下载')
}
</script>

<style scoped lang="scss">
.exam-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.exam-card {
  display: flex; gap: 12px; padding: 16px; border-radius: 14px;
  border: 1.5px solid var(--border-color); background: var(--bg-secondary);
  cursor: pointer; transition: all .25s ease;
  &:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  &.active { border-color: var(--primary-color); background: var(--el-color-primary-light-9); box-shadow: 0 6px 18px rgba(99,102,241,.18); }
}
.exam-icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; color: #fff;
  box-shadow: var(--shadow-sm);
}
.exam-info h4 { font-size: 13.5px; margin: 0 0 5px; color: var(--text-primary); line-height: 1.4; }
.exam-info p { font-size: 11.5px; color: var(--text-secondary); margin: 0 0 8px; line-height: 1.5; }
.exam-tags { display: flex; gap: 6px; }

.plan-form :deep(.el-form-item) { margin-bottom: 16px; }
.plan-form :deep(.el-form-item__label) { font-size: 13px; color: var(--text-secondary); padding-bottom: 6px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.generate-btn { width: 100%; height: 44px; border-radius: 12px; font-weight: 600; box-shadow: var(--shadow-brand); margin-top: 4px; }

.tips-list { display: flex; flex-direction: column; gap: 14px; }
.tip-item { display: flex; gap: 13px; }
.tip-icon {
  width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.tip-content h5 { font-size: 13.5px; margin: 0 0 4px; color: var(--text-primary); }
.tip-content p { font-size: 12.5px; color: var(--text-secondary); margin: 0; line-height: 1.6; }

.plan-summary {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
  padding: 16px; background: var(--bg-secondary); border-radius: 14px; margin-bottom: 18px;
}
.summary-item { text-align: center; }
.si-label { display: block; font-size: 12px; color: var(--text-light); margin-bottom: 5px; }
.si-value { font-size: 16px; font-weight: 700; color: var(--text-primary); }

.phase-list { display: flex; flex-direction: column; gap: 12px; }
.phase-item {
  border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;
  transition: all .25s ease;
  &.expanded { border-color: var(--el-color-primary-light-5); box-shadow: var(--shadow-sm); }
}
.phase-header {
  display: flex; align-items: center; gap: 14px; padding: 15px 18px;
  cursor: pointer; background: var(--bg-secondary);
}
.phase-badge {
  width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 15px;
}
.phase-title-group { flex: 1; }
.phase-title-group h4 { font-size: 14.5px; margin: 0; color: var(--text-primary); }
.phase-duration { font-size: 12px; color: var(--text-light); }
.phase-arrow { transition: transform .25s ease; color: var(--text-light); }
.phase-item.expanded .phase-arrow { transform: rotate(90deg); color: var(--primary-color); }
.phase-body { padding: 16px 18px 18px; }
.phase-goal {
  font-size: 13px; color: var(--text-secondary); margin: 0 0 14px;
  padding: 10px 14px; background: var(--el-color-primary-light-9); border-radius: 10px;
  border-left: 3px solid var(--primary-color);
}
.task-list { display: flex; flex-direction: column; gap: 10px; }
.task-item {
  display: flex; align-items: flex-start; gap: 9px;
  font-size: 13px; color: var(--text-primary); line-height: 1.6;
}
.plan-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
</style>
