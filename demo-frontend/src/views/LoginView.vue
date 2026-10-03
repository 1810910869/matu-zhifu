<template>
  <div class="login-page">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>

    <div class="login-card">
      <div class="brand">
        <div class="brand-icon"><el-icon :size="30"><Cpu /></el-icon></div>
        <h1>码途智辅</h1>
        <p>基于生成式人工智能的高职计算机专业技能成长智能助教系统</p>
      </div>

      <div class="role-tabs">
        <button :class="{ active: role === 'student' }" @click="switchRole('student')">
          <el-icon><User /></el-icon> 学生登录
        </button>
        <button :class="{ active: role === 'teacher' }" @click="switchRole('teacher')">
          <el-icon><School /></el-icon> 教师登录
        </button>
      </div>

      <div class="login-form">
        <div class="field">
          <el-icon><User /></el-icon>
          <input v-model="form.username" :placeholder="role === 'teacher' ? '教师工号 / 姓名' : '学号 / 姓名'" @keyup.enter="handleLogin" />
        </div>
        <div class="field">
          <el-icon><Lock /></el-icon>
          <input v-model="form.password" type="password" placeholder="密码（演示环境可任意填写）" @keyup.enter="handleLogin" />
        </div>

        <button class="login-btn" @click="handleLogin">
          登 录<el-icon><Right /></el-icon>
        </button>

        <div class="quick-tip">
          <span v-if="role === 'student'">演示账号：张三 / 202401001</span>
          <span v-else>演示账号：李老师 / T2024001</span>
        </div>
      </div>

      <p class="tip">
        <el-icon><InfoFilled /></el-icon>
        学生登录后可接收教师发布的作业；教师登录后可进入教师平台。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { Cpu, User, School, Lock, Right, InfoFilled } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const role = ref('student')
const form = reactive({ username: '', password: '' })

function switchRole(r) {
  role.value = r
  form.username = ''
  form.password = ''
}

function handleLogin() {
  if (!form.username.trim()) {
    ElMessage.warning(role.value === 'teacher' ? '请输入教师工号或姓名' : '请输入学号或姓名')
    return
  }
  const name = form.username.trim()
  userStore.login({ role: role.value, name })
  ElMessage.success(`欢迎回来，${name}`)
  router.replace(role.value === 'teacher' ? '/teacher' : '/tutor')
}
</script>

<style scoped lang="scss">
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%);
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: .55;
}
.orb-1 {
  width: 420px; height: 420px;
  background: #6366f1;
  top: -120px; left: -80px;
  animation: float 12s ease-in-out infinite;
}
.orb-2 {
  width: 360px; height: 360px;
  background: #14b8a6;
  bottom: -120px; right: -60px;
  animation: float 15s ease-in-out infinite reverse;
}
@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(30px) translateX(20px); }
}

.login-card {
  position: relative;
  z-index: 2;
  width: 420px;
  padding: 40px 38px 30px;
  border-radius: 24px;
  background: rgba(255, 255, 255, .07);
  border: 1px solid rgba(255, 255, 255, .14);
  box-shadow: 0 30px 70px rgba(0, 0, 0, .45);
  backdrop-filter: blur(18px);
}

.brand {
  text-align: center;
  margin-bottom: 26px;
  .brand-icon {
    width: 62px; height: 62px;
    margin: 0 auto 14px;
    border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    background: linear-gradient(135deg, #6366f1, #14b8a6);
    box-shadow: 0 10px 26px rgba(99, 102, 241, .5);
  }
  h1 {
    font-size: 26px; margin: 0 0 8px; font-weight: 700;
    background: linear-gradient(135deg, #a5b4fc, #5eead4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  p { font-size: 12px; color: rgba(255, 255, 255, .55); margin: 0; line-height: 1.6; }
}

.role-tabs {
  display: flex;
  gap: 10px;
  padding: 5px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .06);
  margin-bottom: 22px;
  button {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 11px 0;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: rgba(255, 255, 255, .65);
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    transition: all .25s;
    &.active {
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: #fff;
      box-shadow: 0 6px 18px rgba(99, 102, 241, .5);
    }
  }
}

.login-form {
  .field {
    display: flex; align-items: center; gap: 10px;
    padding: 0 14px;
    margin-bottom: 14px;
    border-radius: 12px;
    background: rgba(255, 255, 255, .07);
    border: 1px solid rgba(255, 255, 255, .12);
    transition: border-color .2s;
    &:focus-within { border-color: #818cf8; }
    .el-icon { color: rgba(255, 255, 255, .5); }
    input {
      flex: 1;
      border: none; outline: none; background: transparent;
      padding: 14px 0;
      color: #fff; font-size: 14px;
      &::placeholder { color: rgba(255, 255, 255, .38); }
    }
  }
}

.login-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 8px;
  padding: 14px 0;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 15px; font-weight: 700; letter-spacing: 4px;
  cursor: pointer;
  background: linear-gradient(135deg, #6366f1, #14b8a6);
  box-shadow: 0 10px 26px rgba(99, 102, 241, .5);
  transition: transform .2s, box-shadow .2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(99, 102, 241, .6); }
}

.quick-tip {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, .5);
}

.tip {
  display: flex; align-items: flex-start; gap: 6px;
  margin: 22px 0 0;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, .1);
  font-size: 12px; line-height: 1.6;
  color: rgba(255, 255, 255, .45);
  .el-icon { margin-top: 2px; flex-shrink: 0; }
}
</style>
