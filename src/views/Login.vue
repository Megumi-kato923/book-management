<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-icon"><el-icon><Reading /></el-icon></div>
        <h1 class="brand-title">图书管理系统</h1>
        <p class="brand-sub">WEB 前端高级应用 · 期末项目</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            size="large"
            placeholder="请输入用户名"
            clearable
          >
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            size="large"
            placeholder="请输入密码"
            show-password
            clearable
          >
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="userStore.loading"
            @click="handleLogin"
          >登 录</el-button>
        </el-form-item>
      </el-form>

      <div class="login-tip">
        <el-icon><InfoFilled /></el-icon>
        演示账号：<b>admin</b>　密码：<b>123456</b>
      </div>
    </div>
    <div class="login-footer">Vue 3 + Vite + Element Plus · 2026</div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Reading, User, Lock, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref(null)

const form = reactive({ username: 'admin', password: '123456' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功，欢迎回来')
    const redirect = route.query.redirect
    router.push(redirect || '/dashboard')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f2540 0%, #2d3a6d 55%, #4f6ef7 100%);
  position: relative;
}
.login-page::before,
.login-page::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}
.login-page::before { width: 360px; height: 360px; top: -120px; right: -80px; }
.login-page::after { width: 260px; height: 260px; bottom: -100px; left: -60px; }
.login-card {
  width: 420px;
  max-width: calc(100vw - 40px);
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  z-index: 1;
}
.login-brand { text-align: center; margin-bottom: 28px; }
.brand-icon {
  width: 60px; height: 60px; border-radius: 16px;
  background: #4f6ef7; color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 30px; margin-bottom: 14px;
}
.brand-title { font-size: 24px; font-weight: 600; color: #1f2540; margin: 0 0 6px; }
.brand-sub { font-size: 13px; color: #909399; margin: 0; }
.login-btn { width: 100%; }
.login-tip {
  margin-top: 6px; text-align: center; font-size: 12px; color: #909399;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.login-tip b { color: #4f6ef7; }
.login-footer {
  position: absolute; bottom: 24px; color: rgba(255, 255, 255, 0.55); font-size: 12px; z-index: 1;
}
</style>
