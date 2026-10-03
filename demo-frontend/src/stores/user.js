import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ROLE_KEY = 'mt_role'
const ASSIGN_KEY = 'mt_assignments'

export const useUserStore = defineStore('user', () => {
  // 当前登录角色：'' 未登录 / 'student' 学生 / 'teacher' 教师
  const role = ref(localStorage.getItem(ROLE_KEY) || '')
  const isLoggedIn = computed(() => !!role.value)
  const isStudent = computed(() => role.value === 'student')
  const isTeacher = computed(() => role.value === 'teacher')

  // 学生 / 教师 默认资料
  const defaultStudent = {
    id: 1,
    name: '张三',
    studentId: '202401001',
    major: '计算机应用技术',
    grade: '2024级',
    class: '1班',
    avatar: '',
    level: 'L4',
    totalStudyTime: 128,
    totalCodeLines: 3560,
    correctRate: 68,
    streakDays: 12,
    ranking: 15
  }
  const defaultTeacher = {
    id: 100,
    name: '李老师',
    teacherId: 'T2024001',
    major: '计算机应用技术教研室',
    grade: '',
    class: '',
    avatar: '',
    level: '讲师',
    totalStudyTime: 0,
    totalCodeLines: 0,
    correctRate: 0,
    streakDays: 0,
    ranking: 0
  }

  // 当前用户信息（随登录角色切换）
  const userInfo = ref(role.value === 'teacher' ? { ...defaultTeacher } : { ...defaultStudent })

  // 学习画像数据
  const learningProfile = ref({
    overallScore: 68,
    level: 'L4 初级偏上',
    dimensions: [
      { name: '正确性', score: 75, max: 100 },
      { name: '效率', score: 60, max: 100 },
      { name: '规范性', score: 82, max: 100 },
      { name: '可读性', score: 70, max: 100 },
      { name: '健壮性', score: 55, max: 100 }
    ],
    weakPoints: [
      { name: '递归算法', mastery: 35, trend: 'up' },
      { name: '异常处理', mastery: 42, trend: 'stable' },
      { name: '列表操作', mastery: 55, trend: 'up' },
      { name: '函数参数', mastery: 58, trend: 'down' },
      { name: '循环嵌套', mastery: 62, trend: 'up' }
    ],
    studyStats: {
      thisWeekHours: 8.5,
      codeSubmissions: 23,
      correctRate: 68,
      progress: 12
    },
    knowledgeMastery: {
      '基础语法': 85,
      '数据类型': 78,
      '流程控制': 72,
      '函数': 65,
      '列表与元组': 58,
      '字典与集合': 52,
      '面向对象': 40,
      '异常处理': 42,
      '文件操作': 35,
      '递归': 35
    }
  })

  // 班级数据（教师端）
  const classData = ref({
    className: '2024级计算机应用技术1班',
    studentCount: 45,
    activeRate: 82,
    avgStudyTime: 6.8,
    avgCorrectRate: 72,
    progress: 65,
    students: [
      { id: 1, name: '张三', score: 68, rank: 15, trend: 'up', risk: 'normal' },
      { id: 2, name: '李四', score: 35, rank: 45, trend: 'down', risk: 'high' },
      { id: 3, name: '王五', score: 52, rank: 32, trend: 'down', risk: 'medium' },
      { id: 4, name: '赵六', score: 92, rank: 1, trend: 'up', risk: 'low' },
      { id: 5, name: '钱七', score: 78, rank: 8, trend: 'up', risk: 'normal' },
      { id: 6, name: '孙八', score: 45, rank: 38, trend: 'stable', risk: 'medium' },
      { id: 7, name: '周九', score: 85, rank: 3, trend: 'up', risk: 'low' },
      { id: 8, name: '吴十', score: 60, rank: 22, trend: 'stable', risk: 'normal' }
    ],
    knowledgeHeatmap: [
      { knowledge: '基础语法', avgMastery: 82, lowStudents: 3 },
      { knowledge: '数据类型', avgMastery: 75, lowStudents: 5 },
      { knowledge: '流程控制', avgMastery: 70, lowStudents: 8 },
      { knowledge: '函数', avgMastery: 62, lowStudents: 12 },
      { knowledge: '列表操作', avgMastery: 55, lowStudents: 18 },
      { knowledge: '递归算法', avgMastery: 45, lowStudents: 25 }
    ],
    teachingSuggestions: [
      '递归算法班级平均掌握度仅45%，建议下节课重点复习，增加实操练习',
      '有3名学生明显落后，建议安排课后辅导或结对学习',
      '班级整体编程规范较好，可适当减少这方面的强调',
      '学生对项目实战兴趣浓厚，建议增加项目式教学比重'
    ]
  })

  // ============ 消息通知 ============
  const notifications = ref([
    { id: 1, title: '作业批改完成', desc: '李老师已批改你的《循环结构专项练习》，得分 78 分', time: '10 分钟前', read: false },
    { id: 2, title: '学习预警', desc: '「递归算法」掌握度偏低，建议尽快安排专项训练', time: '1 小时前', read: false },
    { id: 3, title: '新作业发布', desc: '李老师发布了新作业《函数与递归实战》，请在截止前完成', time: '昨天 18:30', read: false },
    { id: 4, title: '系统更新', desc: 'AI 导师已升级至智谱 GLM-4 大模型，回答更精准', time: '2 天前', read: true }
  ])
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
  function markAllRead() {
    notifications.value.forEach(n => { n.read = true })
  }
  function readNotification(id) {
    const n = notifications.value.find(x => x.id === id)
    if (n) n.read = true
  }

  // ============ 作业（教师发布 → 学生接收） ============
  function loadAssignments() {
    try {
      const raw = localStorage.getItem(ASSIGN_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) { /* ignore */ }
    return [
      { id: 1, title: '循环结构专项练习', knowledge: '流程控制', deadline: '2026-10-08', count: 5, desc: '完成 5 道循环结构题目，注意边界处理', from: '李老师', time: '09-28', done: false },
      { id: 2, title: '函数与递归实战', knowledge: '递归算法', deadline: '2026-10-10', count: 5, desc: '递归三要素实战，要求写出注释', from: '李老师', time: '09-30', done: false }
    ]
  }
  const assignments = ref(loadAssignments())

  function persistAssignments() {
    try { localStorage.setItem(ASSIGN_KEY, JSON.stringify(assignments.value)) } catch (e) { /* ignore */ }
  }

  // 教师发布作业
  function publishAssignment(payload) {
    assignments.value.unshift({
      id: Date.now(),
      title: payload.title,
      knowledge: payload.knowledge || '综合',
      deadline: payload.deadline || '待定',
      count: payload.count || 5,
      desc: payload.desc || '',
      from: userInfo.value.name,
      time: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      done: false
    })
    persistAssignments()
    notifications.value.unshift({
      id: Date.now() + 1,
      title: '新作业发布',
      desc: `${payload.title} 已发布，请在截止前完成`,
      time: '刚刚',
      read: false
    })
  }

  // 学生标记作业完成
  function finishAssignment(id) {
    const a = assignments.value.find(x => x.id === id)
    if (a) { a.done = true; persistAssignments() }
  }

  // 用户列表（教师端管理用，演示账号）
  function updateUserInfo(info) {
    userInfo.value = { ...userInfo.value, ...info }
  }

  function login({ role: r, name }) {
    role.value = r
    localStorage.setItem(ROLE_KEY, r)
    const base = r === 'teacher' ? defaultTeacher : defaultStudent
    // 原地合并，保持对象引用不变，组件已捕获的 userInfo 才能响应更新
    Object.assign(userInfo.value, base, { name: name || base.name })
  }

  function logout() {
    role.value = ''
    localStorage.removeItem(ROLE_KEY)
  }

  return {
    role,
    isLoggedIn,
    isStudent,
    isTeacher,
    userInfo,
    learningProfile,
    classData,
    notifications,
    unreadCount,
    markAllRead,
    readNotification,
    assignments,
    publishAssignment,
    finishAssignment,
    updateUserInfo,
    login,
    logout
  }
})
