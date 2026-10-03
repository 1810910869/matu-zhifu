<template>
  <!-- 登录页独立全屏，不显示主框架 -->
  <router-view v-if="isLoginPage" />
  <div class="app-container" v-else>
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="logo">
        <div class="logo-icon">
          <el-icon :size="26"><Cpu /></el-icon>
        </div>
        <div class="logo-text" v-show="!sidebarCollapsed">
          <h2>码途智辅</h2>
          <p>AI 智能助教系统</p>
        </div>
      </div>

      <nav class="nav-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
        >
          <el-icon :size="19">
            <component :is="item.icon" />
          </el-icon>
          <span v-show="!sidebarCollapsed">{{ item.title }}</span>
          <span class="nav-glow"></span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <el-avatar :size="40" class="user-avatar">
            {{ userInfo.name.charAt(0) }}
          </el-avatar>
          <div class="user-detail" v-show="!sidebarCollapsed">
            <p class="user-name">{{ userInfo.name }}</p>
            <p class="user-level">能力等级 {{ userInfo.level }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" :size="20" @click="sidebarCollapsed = !sidebarCollapsed">
            <Fold v-if="!sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <div>
            <h1 class="page-title">{{ currentPageTitle }}</h1>
            <p class="page-subtitle">{{ currentPageSubtitle }}</p>
          </div>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleSwitchModel" popper-class="model-popper">
            <el-tag :type="tagType" effect="light" round class="model-tag model-tag-clickable">
              <span class="dot-pulse"></span>
              {{ tagText }}
              <el-icon class="model-tag-arrow"><ArrowDown /></el-icon>
            </el-tag>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled class="model-menu-title">一键切换 AI 模型</el-dropdown-item>
                <el-dropdown-item
                  v-for="m in MODEL_PROVIDERS"
                  :key="m.id"
                  :command="m.id"
                  :class="{ 'is-active-model': m.id === activeModelId }"
                >
                  <span class="model-dot" :class="'model-dot-' + m.id"></span>
                  <div class="model-opt">
                    <div class="model-opt-name">{{ m.name }}</div>
                    <div class="model-opt-desc">{{ m.vendor }} · {{ m.desc }}</div>
                  </div>
                  <el-icon v-if="m.id === activeModelId" class="model-check"><Check /></el-icon>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-popover placement="bottom-end" :width="360" trigger="click" popper-class="notify-popper">
            <template #reference>
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="bell-badge">
                <el-button circle>
                  <el-icon><Bell /></el-icon>
                </el-button>
              </el-badge>
            </template>
            <div class="notify-panel">
              <div class="notify-head">
                <span>消息通知 <em v-if="unreadCount">({{ unreadCount }} 条未读)</em></span>
                <el-button link type="primary" size="small" @click="handleMarkAllRead">全部已读</el-button>
              </div>
              <div class="notify-list">
                <div
                  v-for="n in notifications"
                  :key="n.id"
                  class="notify-item"
                  :class="{ unread: !n.read }"
                  @click="handleRead(n.id)"
                >
                  <span class="notify-dot"></span>
                  <div class="notify-body">
                    <p class="notify-title">{{ n.title }}</p>
                    <p class="notify-desc">{{ n.desc }}</p>
                    <p class="notify-time">{{ n.time }}</p>
                  </div>
                </div>
              </div>
              <div v-if="notifications.length === 0" class="notify-empty">暂无消息</div>
            </div>
          </el-popover>

          <el-dropdown trigger="click" @command="handleCommand">
            <div class="header-user">
              <el-avatar :size="36" class="header-avatar">{{ userInfo.name.charAt(0) }}</el-avatar>
              <div class="header-user-meta">
                <span class="header-user-name">{{ userInfo.name }}</span>
                <span class="header-user-role">{{ userStore.isTeacher ? '教师' : '学生' }}</span>
              </div>
              <el-icon class="header-user-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>{{ userInfo.name }} · {{ userStore.isTeacher ? '教师' : '学生' }}</el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <div class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { API_MODE } from '@/api/ollama'
import { apiConfig, modelLabel } from '@/api/request'
import { MODEL_PROVIDERS, activeModelId, activeProvider, switchModel } from '@/api/models'
import { Cpu, Bell, Fold, Expand, ArrowDown, SwitchButton, Check } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const userInfo = userStore.userInfo
const sidebarCollapsed = ref(false)
const isLoginPage = computed(() => route.path === '/login')

// 消息通知
const notifications = userStore.notifications
const unreadCount = userStore.unreadCount
function handleMarkAllRead() {
  userStore.markAllRead()
}
function handleRead(id) {
  userStore.readNotification(id)
}

// 账号菜单
function handleCommand(command) {
  if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  }
}

const tagType = computed(() => activeProvider.value.tagType)

const tagText = computed(() => `${modelLabel.value} 驱动`)

// 多模型一键切换
function handleSwitchModel(id) {
  if (id === activeModelId.value) return
  if (switchModel(id)) {
    const p = MODEL_PROVIDERS.find((m) => m.id === id)
    ElMessage.success(`已切换至 ${p ? p.name : id}`)
  }
}

const studentMenu = [
  { path: '/tutor', title: 'AI智能导师', icon: 'ChatDotRound' },
  { path: '/diagnosis', title: '学习诊断', icon: 'DataAnalysis' },
  { path: '/training', title: '技能训练', icon: 'Cpu' },
  { path: '/exam', title: '考试辅导', icon: 'Document' },
  { path: '/homework', title: '我的作业', icon: 'Notebook' }
]
const teacherMenu = [
  { path: '/teacher', title: '教师平台', icon: 'School' },
  { path: '/diagnosis', title: '学习诊断', icon: 'DataAnalysis' }
]
// 依据登录角色显示菜单：学生看不到教师平台，教师看到教学管理
const menuItems = computed(() => (userStore.isTeacher ? teacherMenu : studentMenu))

const pageSubtitles = {
  '/tutor': '7×24 小时专属编程教练，随时解答你的编程疑问',
  '/diagnosis': 'AI 智能分析学习情况，精准定位薄弱环节',
  '/training': '个性化编程训练，五维十级能力评价',
  '/exam': '智能备考助手，个性化复习计划',
  '/teacher': '数据驱动的智能教学管理平台'
}

const currentPageTitle = computed(() => route.meta.title || '码途智辅')
const currentPageSubtitle = computed(() => pageSubtitles[route.path] || '')
</script>

<style scoped lang="scss">
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ============ 侧边栏 ============ */
.sidebar {
  width: 236px;
  background: linear-gradient(180deg, #1a1f36 0%, #0f172a 100%);
  display: flex;
  flex-direction: column;
  color: #fff;
  flex-shrink: 0;
  transition: width .3s cubic-bezier(.4, 0, .2, 1);
  position: relative;
  z-index: 10;
}
.sidebar.collapsed { width: 76px; }

.logo {
  padding: 22px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);

  .logo-icon {
    width: 44px;
    height: 44px;
    background: var(--brand-gradient);
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 6px 18px rgba(99, 102, 241, .45);
  }
  .logo-text {
    h2 {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, #a5b4fc 0%, #5eead4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    }
    p {
      font-size: 11px;
      color: rgba(255, 255, 255, .45);
      margin: 2px 0 0;
      white-space: nowrap;
    }
  }
}

.nav-menu {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 16px;
  border-radius: 12px;
  color: rgba(255, 255, 255, .62);
  font-size: 14.5px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  transition: all .25s ease;
  white-space: nowrap;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, .06);
  }

  &.active {
    color: #fff;
    background: linear-gradient(135deg, rgba(99, 102, 241, .9) 0%, rgba(79, 70, 229, .75) 100%);
    box-shadow: 0 8px 20px rgba(99, 102, 241, .35);

    .nav-glow {
      position: absolute;
      left: 0; top: 20%; bottom: 20%;
      width: 3px;
      border-radius: 3px;
      background: #5eead4;
    }
  }
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, .08);

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .user-avatar {
    background: var(--brand-gradient);
    color: #fff;
    font-weight: 600;
    flex-shrink: 0;
  }
  .user-name { font-size: 14px; font-weight: 600; margin: 0; }
  .user-level { font-size: 11px; color: rgba(255, 255, 255, .45); margin: 2px 0 0; white-space: nowrap; }
}

/* ============ 主区域 ============ */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background:
    radial-gradient(1000px 500px at 100% 0%, rgba(99, 102, 241, .06), transparent 60%),
    radial-gradient(800px 400px at 0% 100%, rgba(20, 184, 166, .05), transparent 60%),
    var(--bg-app);
}

.header {
  height: 74px;
  flex-shrink: 0;
  padding: 0 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, .82);
  backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--border-color);
  position: relative;
  z-index: 5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;

  .collapse-btn {
    cursor: pointer;
    color: var(--text-secondary);
    padding: 8px;
    border-radius: 8px;
    transition: all .2s ease;
    &:hover { background: var(--bg-tertiary); color: var(--primary-color); }
  }
}

.page-title { font-size: 19px; font-weight: 700; margin: 0; color: var(--text-primary); }
.page-subtitle { font-size: 12.5px; color: var(--text-secondary); margin: 3px 0 0; }

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.model-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 500;
  padding: 0 14px;
  height: 32px;

  .dot-pulse {
    width: 7px; height: 7px; border-radius: 50%;
    background: currentColor;
    animation: pulse 1.8s ease-in-out infinite;
  }
}

.model-tag-clickable {
  cursor: pointer;
  user-select: none;
  transition: filter .2s, box-shadow .2s;
  &:hover { filter: brightness(0.97); box-shadow: 0 2px 8px rgba(0, 0, 0, .08); }
  .model-tag-arrow { font-size: 12px; margin-left: 1px; transition: transform .2s; }
}

.header-avatar {
  background: var(--brand-gradient);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 22px 26px 40px;
}

/* ============ 顶栏账号 ============ */
.header-user {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 10px 4px 4px;
  border-radius: 30px;
  cursor: pointer;
  transition: background .2s;
  outline: none;
  &:hover { background: var(--bg-tertiary); }

  .header-user-meta {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
  .header-user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .header-user-role { font-size: 11px; color: var(--text-secondary); }
  .header-user-arrow { color: var(--text-secondary); font-size: 13px; }
}
</style>

<!-- 多模型一键切换下拉（弹层挂在 body 下，需非 scoped 样式） -->
<style lang="scss">
.model-popper.el-popper {
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 10px 32px rgba(15, 23, 42, .14);
  .el-dropdown-menu { padding: 4px; }
  .el-dropdown-menu__item {
    border-radius: 8px;
    padding: 9px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    &.is-active-model { color: var(--el-color-primary); font-weight: 600; }
    &:hover { background: var(--el-fill-color-light); }
  }
  .model-menu-title {
    font-size: 12px;
    color: var(--text-secondary);
    cursor: default;
    padding-bottom: 2px;
  }
  .model-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
  .model-dot-zhipu { background: #10b981; }
  .model-dot-doubao { background: #3b82f6; }
  .model-dot-qwen { background: #8b5cf6; }
  .model-opt { flex: 1; line-height: 1.25; }
  .model-opt-name { font-size: 13.5px; }
  .model-opt-desc { font-size: 11px; color: var(--text-secondary); font-weight: 400; }
  .model-check { color: var(--el-color-primary); font-size: 14px; }
}
</style>
