import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/tutor' },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/tutor',
    name: 'Tutor',
    component: () => import('@/views/TutorView.vue'),
    meta: { title: 'AI智能导师', icon: 'ChatDotRound', roles: ['student'] }
  },
  {
    path: '/diagnosis',
    name: 'Diagnosis',
    component: () => import('@/views/DiagnosisView.vue'),
    meta: { title: '学习诊断', icon: 'DataAnalysis', roles: ['student', 'teacher'] }
  },
  {
    path: '/training',
    name: 'Training',
    component: () => import('@/views/TrainingView.vue'),
    meta: { title: '技能训练', icon: 'Cpu', roles: ['student'] }
  },
  {
    path: '/exam',
    name: 'Exam',
    component: () => import('@/views/ExamView.vue'),
    meta: { title: '考试辅导', icon: 'Document', roles: ['student'] }
  },
  {
    path: '/homework',
    name: 'Homework',
    component: () => import('@/views/HomeworkView.vue'),
    meta: { title: '我的作业', icon: 'Notebook', roles: ['student'] }
  },
  {
    path: '/teacher',
    name: 'Teacher',
    component: () => import('@/views/TeacherView.vue'),
    meta: { title: '教师平台', icon: 'School', roles: ['teacher'] }
  },
  { path: '/:pathMatch(.*)*', redirect: '/tutor' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '码途智辅'} · 码途智辅 AI 助教`
  const role = localStorage.getItem('mt_role') || ''

  // 公开页面
  if (to.meta.public) {
    // 已登录用户访问登录页 → 回到各自首页
    if (role === 'teacher') return next('/teacher')
    if (role === 'student') return next('/tutor')
    return next()
  }

  // 未登录 → 强制到登录页
  if (!role) return next('/login')

  // 角色权限控制：学生不能进入教师平台，教师不能进入学生专属页面
  const roles = to.meta.roles
  if (roles && !roles.includes(role)) {
    return next(role === 'teacher' ? '/teacher' : '/tutor')
  }

  next()
})

export default router
