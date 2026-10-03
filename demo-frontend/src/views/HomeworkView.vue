<template>
  <div class="homework-page">
    <div class="hw-header">
      <div class="hw-header-left">
        <div class="hw-icon"><el-icon :size="24"><Notebook /></el-icon></div>
        <div>
          <h2>我的作业</h2>
          <p>接收并完成教师发布的作业，AI 与教师将共同为你批改</p>
        </div>
      </div>
      <div class="hw-stats">
        <div class="stat">
          <span class="num">{{ assignments.length }}</span>
          <span class="label">作业总数</span>
        </div>
        <div class="stat">
          <span class="num pending">{{ pendingCount }}</span>
          <span class="label">待完成</span>
        </div>
        <div class="stat">
          <span class="num done">{{ doneCount }}</span>
          <span class="label">已完成</span>
        </div>
      </div>
    </div>

    <div v-if="assignments.length === 0" class="empty">
      <el-icon :size="46"><Notebook /></el-icon>
      <p>暂时没有收到新的作业</p>
    </div>

    <div v-else class="hw-list">
      <div v-for="a in assignments" :key="a.id" class="hw-card" :class="{ finished: a.done }">
        <div class="hw-card-top">
          <div class="hw-tag" :class="{ finished: a.done }">
            {{ a.done ? '已完成' : '待完成' }}
          </div>
          <span class="hw-deadline">截止 {{ a.deadline }}</span>
        </div>
        <h3 class="hw-title">{{ a.title }}</h3>
        <p class="hw-desc">{{ a.desc || '暂无补充说明' }}</p>
        <div class="hw-meta">
          <span><el-icon><Collection /></el-icon> {{ a.knowledge }}</span>
          <span><el-icon><Document /></el-icon> {{ a.count }} 题</span>
          <span><el-icon><UserFilled /></el-icon> {{ a.from }}</span>
        </div>
        <div class="hw-card-bottom">
          <span class="hw-time">发布于 {{ a.time }}</span>
          <el-button v-if="!a.done" type="primary" size="small" @click="goTraining(a)">
            <el-icon><EditPen /></el-icon> 去完成
          </el-button>
          <el-button v-else type="success" size="small" plain disabled>
            <el-icon><Select /></el-icon> 已提交
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Notebook, Collection, Document, UserFilled, EditPen, Select } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const assignments = computed(() => userStore.assignments)

const pendingCount = computed(() => assignments.value.filter(a => !a.done).length)
const doneCount = computed(() => assignments.value.filter(a => a.done).length)

function goTraining(a) {
  router.push('/training')
  userStore.finishAssignment(a.id)
}
</script>

<style scoped lang="scss">
.homework-page {
  max-width: 1080px;
  margin: 0 auto;
}

.hw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 26px;
  margin-bottom: 22px;
  border-radius: 18px;
  background: linear-gradient(135deg, #6366f1 0%, #14b8a6 100%);
  color: #fff;
  box-shadow: 0 12px 30px rgba(99, 102, 241, .35);
}
.hw-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  .hw-icon {
    width: 52px; height: 52px;
    border-radius: 15px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255, 255, 255, .2);
  }
  h2 { margin: 0 0 4px; font-size: 20px; }
  p { margin: 0; font-size: 12px; opacity: .85; }
}
.hw-stats {
  display: flex;
  gap: 26px;
  .stat {
    display: flex; flex-direction: column; align-items: center;
    .num { font-size: 24px; font-weight: 700; }
    .num.pending { color: #fde68a; }
    .num.done { color: #bbf7d0; }
    .label { font-size: 12px; opacity: .85; }
  }
}

.empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 70px 0;
  color: var(--text-muted, #94a3b8);
}

.hw-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.hw-card {
  padding: 20px 22px;
  border-radius: 16px;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #e5e7eb);
  box-shadow: 0 4px 16px rgba(15, 23, 42, .05);
  transition: transform .2s, box-shadow .2s;
  &:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15, 23, 42, .1); }
  &.finished { opacity: .78; }
}
.hw-card-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.hw-tag {
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 12px; font-weight: 600;
  color: #b45309;
  background: #fef3c7;
  &.finished { color: #047857; background: #d1fae5; }
}
.hw-deadline { font-size: 12px; color: #ef4444; font-weight: 600; }
.hw-title { margin: 0 0 8px; font-size: 16px; color: var(--text-primary, #1e293b); }
.hw-desc { margin: 0 0 14px; font-size: 13px; line-height: 1.6; color: var(--text-muted, #64748b); }
.hw-meta {
  display: flex; flex-wrap: wrap; gap: 14px;
  margin-bottom: 16px;
  span {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 12px; color: var(--text-muted, #64748b);
  }
}
.hw-card-bottom {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 14px;
  border-top: 1px dashed var(--border, #e5e7eb);
  .hw-time { font-size: 12px; color: var(--text-muted, #94a3b8); }
}

@media (max-width: 900px) {
  .hw-list { grid-template-columns: 1fr; }
}
</style>
