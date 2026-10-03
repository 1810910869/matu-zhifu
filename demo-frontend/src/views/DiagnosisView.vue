<template>
  <div class="diagnosis-view page-grid">
    <!-- 顶部概览 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon" style="background: var(--brand-gradient)">
          <el-icon :size="24"><Trophy /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">综合能力等级</p>
          <p class="card-value">{{ profile.level.split(' ')[0] }} <span class="unit">{{ profile.level.split(' ')[1] }}</span></p>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg,#3b82f6,#60a5fa)">
          <el-icon :size="24"><Clock /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">本周学习时长</p>
          <p class="card-value">{{ profile.studyStats.thisWeekHours }} <span class="unit">小时</span></p>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon" style="background: var(--sunset-gradient)">
          <el-icon :size="24"><Edit /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">代码提交次数</p>
          <p class="card-value">{{ profile.studyStats.codeSubmissions }} <span class="unit">次</span></p>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon" style="background: var(--success-gradient)">
          <el-icon :size="24"><TrendCharts /></el-icon>
        </div>
        <div class="card-info">
          <p class="card-label">本周进步</p>
          <p class="card-value">+{{ profile.studyStats.progress }} <span class="unit">%</span></p>
        </div>
      </div>
    </div>

    <div class="content-row">
      <!-- 能力雷达 -->
      <div class="card">
        <div class="card-title">
          <el-icon class="icon"><Aim /></el-icon>
          五维能力画像
          <el-tooltip content="基于代码质量五维模型（正确性/效率/规范性/可读性/健壮性）评估" placement="top">
            <el-icon class="help"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div ref="radarChartRef" class="chart-box"></div>
      </div>

      <!-- 知识点掌握 -->
      <div class="card">
        <div class="card-title">
          <el-icon class="icon"><Histogram /></el-icon>
          知识点掌握度
        </div>
        <div ref="barChartRef" class="chart-box"></div>
      </div>
    </div>

    <div class="content-row">
      <!-- 薄弱知识点 -->
      <div class="card">
        <div class="card-title">
          <el-icon class="icon" style="color:var(--danger-color)"><Warning /></el-icon>
          薄弱知识点
          <el-tag type="danger" effect="light" size="small" style="margin-left:auto">重点突破</el-tag>
        </div>
        <div class="weak-list">
          <div class="weak-item" v-for="(point, index) in profile.weakPoints" :key="point.name">
            <div class="weak-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
            <div class="weak-info">
              <div class="weak-top">
                <span class="weak-name">{{ point.name }}</span>
                <span class="weak-trend" :class="point.trend">
                  <el-icon v-if="point.trend === 'up'"><Top /></el-icon>
                  <el-icon v-else-if="point.trend === 'down'"><Bottom /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                </span>
              </div>
              <div class="weak-bar">
                <div class="weak-progress" :style="{ width: point.mastery + '%', background: getMasteryColor(point.mastery) }"></div>
              </div>
            </div>
            <div class="weak-mastery">{{ point.mastery }}%</div>
            <el-button type="primary" link size="small" @click="goLearn(point.name)">去学习</el-button>
          </div>
        </div>
        <el-button class="report-btn" type="primary" plain @click="generateReport" :loading="isGeneratingReport">
          <el-icon><Document /></el-icon>
          生成完整学习诊断报告
        </el-button>
      </div>

      <!-- 学习路径 -->
      <div class="card">
        <div class="card-title">
          <el-icon class="icon" style="color:var(--warning-color)"><Guide /></el-icon>
          推荐学习路径
        </div>
        <div class="learning-path">
          <div class="path-step" v-for="(step, index) in learningPath" :key="index">
            <div class="step-marker">
              <div class="step-num">{{ index + 1 }}</div>
              <div class="step-line" v-if="index < learningPath.length - 1"></div>
            </div>
            <div class="step-body">
              <div class="step-name">{{ step.name }}</div>
              <div class="step-desc">{{ step.desc }}</div>
              <el-tag size="small" :type="step.tagType" effect="light">{{ step.duration }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习诊断报告对话框 -->
    <el-dialog v-model="reportDialogVisible" width="720px" class="report-dialog" :show-close="true">
      <template #header>
        <div class="dialog-header">
          <div class="header-icon"><el-icon :size="26"><DataAnalysis /></el-icon></div>
          <div class="header-text">
            <h3>学习诊断报告</h3>
            <p>码途智辅 · AI 智能生成 · {{ reportDate }}</p>
          </div>
        </div>
      </template>

      <div class="report-content" ref="reportContentRef">
        <div class="report-header">
          <div class="student-info">
            <el-avatar :size="54" class="student-avatar">{{ user.name.charAt(0) }}</el-avatar>
            <div class="student-detail">
              <h2>{{ user.name }}</h2>
              <p>{{ user.grade }}{{ user.major }}{{ user.class }} · 学号 {{ user.studentId }}</p>
            </div>
          </div>
          <div class="report-meta">
            <div class="meta-item">
              <span class="meta-label">综合等级</span>
              <el-tag type="success" effect="dark" size="large">{{ profile.level }}</el-tag>
            </div>
          </div>
        </div>

        <div class="ability-cards">
          <div class="ability-card" v-for="dim in profile.dimensions" :key="dim.name">
            <div class="ability-score" :style="{ color: getLevelColor(dim.score) }">{{ dim.score }}</div>
            <div class="ability-name">{{ dim.name }}</div>
            <div class="ability-level">{{ getLevelText(dim.score) }}</div>
          </div>
        </div>

        <div class="report-section">
          <div class="section-title">
            <el-icon color="#f43f5e"><Warning /></el-icon>
            <span>薄弱知识点</span>
          </div>
          <div class="weak-list compact">
            <div class="weak-item" v-for="(point, index) in profile.weakPoints" :key="point.name">
              <div class="weak-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
              <div class="weak-info">
                <div class="weak-name">{{ point.name }}</div>
                <div class="weak-bar">
                  <div class="weak-progress" :style="{ width: point.mastery + '%', background: getMasteryColor(point.mastery) }"></div>
                </div>
              </div>
              <div class="weak-mastery">{{ point.mastery }}%</div>
            </div>
          </div>
        </div>

        <div class="report-section">
          <div class="section-title">
            <el-icon color="#14b8a6"><CircleCheckFilled /></el-icon>
            <span>优势领域</span>
          </div>
          <div class="strength-list">
            <div class="strength-item" v-for="s in strengths" :key="s">
              <el-icon color="#14b8a6"><CircleCheckFilled /></el-icon>
              <span>{{ s }}</span>
            </div>
          </div>
        </div>

        <div class="report-section">
          <div class="section-title">
            <el-icon color="#6366f1"><TrendCharts /></el-icon>
            <span>提升建议</span>
          </div>
          <div class="goals-list">
            <div class="goal-item short-term">
              <div class="goal-badge">短期</div>
              <div class="goal-content"><h5>2周目标</h5><p>突破递归算法，掌握递归三要素，完成 10 道递归练习题，预计提升至 L5 水平</p></div>
            </div>
            <div class="goal-item mid-term">
              <div class="goal-badge">中期</div>
              <div class="goal-content"><h5>1个月目标</h5><p>补齐薄弱知识点，五维能力均衡发展，平均分达到 75 分以上</p></div>
            </div>
            <div class="goal-item long-term">
              <div class="goal-badge">长期</div>
              <div class="goal-content"><h5>3个月目标</h5><p>达到 L6 水平，具备独立开发小型项目的能力</p></div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reportDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="downloadReport" :loading="isDownloading">
            <el-icon><Download /></el-icon>
            下载报告
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { useUserStore } from '@/stores/user'
import {
  Trophy, Clock, Edit, TrendCharts, Aim, Histogram, Warning, Guide,
  Document, Download, QuestionFilled, Top, Bottom, Minus, CircleCheckFilled, DataAnalysis
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const user = userStore.userInfo
const profile = userStore.learningProfile

const reportDialogVisible = ref(false)
const isGeneratingReport = ref(false)
const isDownloading = ref(false)
const radarChartRef = ref(null)
const barChartRef = ref(null)
let radarChart = null
let barChart = null

const reportDate = new Date().toLocaleDateString('zh-CN')

const learningPath = ref([
  { name: '基础语法巩固', desc: '变量、运算符、输入输出', duration: '1 周', tagType: 'success' },
  { name: '流程控制强化', desc: '条件判断与循环结构', duration: '1 周', tagType: 'success' },
  { name: '函数与数据结构', desc: '函数定义、列表、字典操作', duration: '2 周', tagType: 'primary' },
  { name: '异常处理与文件', desc: '错误捕获、文件读写', duration: '1 周', tagType: 'primary' },
  { name: '递归与算法思维', desc: '递归三要素、常见算法', duration: '2 周', tagType: 'warning' },
  { name: '综合项目实战', desc: '小型项目开发实践', duration: '2 周', tagType: 'danger' }
])

const strengths = ref([
  '代码规范性（82分）— 优秀，代码风格良好',
  '正确性（75分）— 良好，逻辑思维清晰',
  '可读性（70分）— 中等，命名规范有待提升'
])

function getLevelColor(score) {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#6366f1'
  if (score >= 60) return '#f59e0b'
  return '#f43f5e'
}
function getLevelText(score) {
  if (score >= 85) return '优秀'
  if (score >= 75) return '良好'
  if (score >= 60) return '中等'
  return '待提升'
}
function getMasteryColor(m) {
  if (m >= 80) return 'linear-gradient(90deg,#10b981,#34d399)'
  if (m >= 60) return 'linear-gradient(90deg,#6366f1,#818cf8)'
  if (m >= 40) return 'linear-gradient(90deg,#f59e0b,#fbbf24)'
  return 'linear-gradient(90deg,#f43f5e,#fb7185)'
}

function initRadarChart() {
  radarChart = echarts.init(radarChartRef.value)
  radarChart.setOption({
    tooltip: {},
    radar: {
      indicator: profile.dimensions.map(d => ({ name: d.name, max: 100 })),
      radius: '68%',
      splitNumber: 4,
      axisName: { color: '#64748b', fontSize: 13, fontWeight: 500 },
      splitLine: { lineStyle: { color: '#e8ecf3' } },
      splitArea: { areaStyle: { color: ['#f8fafc', '#ffffff'] } },
      axisLine: { lineStyle: { color: '#e8ecf3' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: profile.dimensions.map(d => d.score),
        name: '当前能力',
        areaStyle: { color: 'rgba(99,102,241,0.22)' },
        lineStyle: { color: '#6366f1', width: 2.5 },
        itemStyle: { color: '#6366f1' },
        symbolSize: 6
      }],
      animationDuration: 900
    }]
  })
}

function initBarChart() {
  barChart = echarts.init(barChartRef.value)
  const entries = Object.entries(profile.knowledgeMastery)
  barChart.setOption({
    grid: { left: 10, right: 20, top: 20, bottom: 10, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'value', max: 100,
      splitLine: { lineStyle: { color: '#eef2f7' } },
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: {
      type: 'category',
      data: entries.map(e => e[0]).reverse(),
      axisLine: { lineStyle: { color: '#e8ecf3' } },
      axisLabel: { color: '#64748b', fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: entries.map(e => ({
        value: e[1],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: e[1] >= 70 ? '#10b981' : e[1] >= 50 ? '#6366f1' : '#f43f5e' },
            { offset: 1, color: e[1] >= 70 ? '#34d399' : e[1] >= 50 ? '#818cf8' : '#fb7185' }
          ]),
          borderRadius: [0, 6, 6, 0]
        }
      })).reverse(),
      barWidth: 13,
      label: { show: true, position: 'right', formatter: '{c}%', color: '#64748b', fontSize: 11 },
      animationDuration: 900
    }]
  })
}

function goLearn(pointName) {
  ElMessage.success(`正在为你打开「${pointName}」相关学习资源…`)
  router.push('/training')
}

function generateReport() {
  isGeneratingReport.value = true
  setTimeout(() => {
    isGeneratingReport.value = false
    reportDialogVisible.value = true
    ElMessage.success('诊断报告已生成')
  }, 700)
}

function downloadReport() {
  isDownloading.value = true
  setTimeout(() => {
    isDownloading.value = false
    // 生成文本报告下载
    const lines = [
      `码途智辅 · 学习诊断报告`,
      `生成日期：${reportDate}`,
      `学生：${user.name}（${user.studentId}）`,
      `专业：${user.major} ${user.grade}${user.class}`,
      ``,
      `综合等级：${profile.level}`,
      ``,
      `【五维能力】`,
      ...profile.dimensions.map(d => `  ${d.name}：${d.score} 分（${getLevelText(d.score)}）`),
      ``,
      `【薄弱知识点】`,
      ...profile.weakPoints.map(p => `  ${p.name}：掌握度 ${p.mastery}%`),
      ``,
      `【优势领域】`,
      ...strengths.value.map(s => `  ${s}`),
      ``,
      `【推荐学习路径】`,
      ...learningPath.value.map((s, i) => `  ${i + 1}. ${s.name}（${s.duration}）：${s.desc}`),
      ``,
      `【提升建议】`,
      `  2周目标：突破递归算法，掌握递归三要素，完成10道递归练习题`,
      `  1个月目标：补齐薄弱知识点，五维能力均衡发展，平均分达到75分以上`,
      `  3个月目标：达到L6水平，具备独立开发小型项目的能力`,
      ``,
      `—— 本报告由码途智辅 AI 智能生成，仅供学习参考`
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `学习诊断报告_${user.name}_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('报告已下载')
  }, 800)
}

function handleResize() {
  radarChart?.resize()
  barChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initRadarChart()
    initBarChart()
  })
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped lang="scss">
.chart-box { height: 300px; width: 100%; }
.card-title .help { color: var(--text-light); font-size: 14px; cursor: help; }

/* 薄弱点 */
.weak-list { display: flex; flex-direction: column; gap: 14px; }
.weak-list.compact { gap: 10px; }
.weak-item {
  display: flex;
  align-items: center;
  gap: 12px;
  .weak-rank {
    width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff;
    background: var(--text-light);
  }
  .rank-1 { background: linear-gradient(135deg,#f43f5e,#fb7185); }
  .rank-2 { background: linear-gradient(135deg,#f97316,#fb923c); }
  .rank-3 { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
  .weak-info { flex: 1; min-width: 0; }
  .weak-top { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
  .weak-name { font-size: 13.5px; font-weight: 500; color: var(--text-primary); }
  .weak-trend {
    font-size: 12px;
    &.up { color: #10b981; }
    &.down { color: #f43f5e; }
    &.stable { color: var(--text-light); }
  }
  .weak-bar {
    height: 7px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;
  }
  .weak-progress { height: 100%; border-radius: 4px; transition: width .8s ease; }
  .weak-mastery { font-size: 13px; font-weight: 700; color: var(--text-primary); width: 42px; text-align: right; }
}
.report-btn { width: 100%; margin-top: 18px; height: 40px; border-radius: 10px; }

/* 学习路径 */
.learning-path { display: flex; flex-direction: column; }
.path-step { display: flex; gap: 14px; }
.step-marker { display: flex; flex-direction: column; align-items: center; }
.step-num {
  width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--brand-gradient); color: #fff; font-size: 14px; font-weight: 700;
  box-shadow: 0 4px 12px rgba(99,102,241,.28);
}
.step-line { flex: 1; width: 2px; background: var(--border-color); margin: 4px 0; min-height: 20px; }
.step-body { flex: 1; padding-bottom: 16px; }
.step-name { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 3px; }
.step-desc { font-size: 12.5px; color: var(--text-secondary); margin-bottom: 7px; }

/* 报告对话框 */
.dialog-header { display: flex; align-items: center; gap: 14px; }
.header-icon {
  width: 48px; height: 48px; border-radius: 14px;
  background: var(--brand-gradient); color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.header-text h3 { margin: 0; font-size: 17px; }
.header-text p { margin: 2px 0 0; font-size: 12px; color: var(--text-secondary); }

.report-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; background: var(--bg-secondary); border-radius: 14px; margin-bottom: 16px;
}
.student-info { display: flex; align-items: center; gap: 14px; }
.student-avatar { background: var(--brand-gradient); color: #fff; font-weight: 700; font-size: 22px; }
.student-detail h2 { margin: 0; font-size: 18px; }
.student-detail p { margin: 3px 0 0; font-size: 12.5px; color: var(--text-secondary); }

.ability-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 18px; }
.ability-card {
  text-align: center; padding: 14px 8px; border-radius: 12px;
  background: var(--bg-secondary); border: 1px solid var(--border-color);
}
.ability-score { font-size: 24px; font-weight: 800; line-height: 1; }
.ability-name { font-size: 12.5px; color: var(--text-primary); margin-top: 6px; font-weight: 500; }
.ability-level { font-size: 11px; color: var(--text-light); margin-top: 3px; }

.report-section { margin-bottom: 18px; }
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14.5px; font-weight: 600; margin-bottom: 12px;
}
.strength-list { display: flex; flex-direction: column; gap: 9px; }
.strength-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 13.5px; color: var(--text-secondary);
  padding: 9px 12px; background: rgba(16,185,129,.06); border-radius: 10px;
}
.goals-list { display: flex; flex-direction: column; gap: 10px; }
.goal-item { display: flex; gap: 12px; padding: 12px; border-radius: 12px; background: var(--bg-secondary); }
.goal-badge {
  flex-shrink: 0; padding: 4px 12px; border-radius: 8px;
  font-size: 12px; font-weight: 600; color: #fff; height: fit-content;
}
.short-term .goal-badge { background: linear-gradient(135deg,#10b981,#14b8a6); }
.mid-term .goal-badge { background: linear-gradient(135deg,#6366f1,#818cf8); }
.long-term .goal-badge { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
.goal-content h5 { margin: 0 0 4px; font-size: 13.5px; }
.goal-content p { margin: 0; font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; }
</style>
