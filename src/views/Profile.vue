<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">个人资料</h2>
      <p class="page-desc">查看和管理您的账号信息、个人资料与登录密码。</p>
    </div>

    <!-- 用户概览横幅 -->
    <el-card class="profile-hero" shadow="never">
      <div class="hero-bg"></div>
      <div class="hero-body">
        <el-avatar :size="84" class="hero-avatar">{{ avatarText }}</el-avatar>
        <div class="hero-info">
          <div class="hero-name-row">
            <h3>{{ user.name || user.username }}</h3>
            <el-tag type="primary" size="small" effect="dark">{{ user.role || '普通用户' }}</el-tag>
          </div>
          <p class="hero-bio">{{ user.bio || '这个人很懒，还没有填写个人简介。' }}</p>
          <div class="hero-meta">
            <span><el-icon><User /></el-icon> 账号 {{ user.username || '-' }}</span>
            <span><el-icon><Clock /></el-icon> 本次登录 {{ loginTime }}</span>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat" v-for="s in stats" :key="s.label">
            <div class="hero-stat-value" :style="{ color: s.color }">{{ s.value }}</div>
            <div class="hero-stat-label">
              <el-icon :style="{ color: s.color }"><component :is="s.icon" /></el-icon>
              {{ s.label }}
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :xs="24" :md="10">
        <el-card class="content-card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon><Postcard /></el-icon> 基本信息</div>
          </template>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">用户名</span>
              <span class="info-value">{{ user.username || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">姓名</span>
              <span class="info-value">{{ user.name || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">角色</span>
              <span class="info-value">{{ user.role || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">账号状态</span>
              <span class="info-value"><el-tag type="success" size="small" effect="plain">正常</el-tag></span>
            </div>
            <div class="info-row">
              <span class="info-label">本次登录</span>
              <span class="info-value">{{ loginTime }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="content-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title"><el-icon><InfoFilled /></el-icon> 账号说明</div>
          </template>
          <p class="tip-text">
            本项目为课程演示系统，账号数据保存在当前浏览器中。修改密码后立即生效，
            下次登录需使用新密码；个人资料修改后刷新页面依然保留。
          </p>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="14">
        <el-card class="content-card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon><EditPen /></el-icon> 编辑资料</div>
          </template>
          <el-form ref="profileRef" :model="profileForm" :rules="profileRules" label-width="90px">
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="profileForm.name"
                maxlength="20"
                show-word-limit
                placeholder="请输入姓名"
              />
            </el-form-item>
            <el-form-item label="个人简介" prop="bio">
              <el-input
                v-model="profileForm.bio"
                type="textarea"
                :rows="4"
                maxlength="120"
                show-word-limit
                resize="none"
                placeholder="介绍一下自己吧"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="saveProfile">保存修改</el-button>
              <el-button @click="syncProfileForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="content-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title"><el-icon><Key /></el-icon> 修改密码</div>
          </template>
          <el-form ref="pwdRef" :model="pwdForm" :rules="pwdRules" label-width="100px">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="pwdForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入当前密码"
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="pwdForm.newPassword"
                type="password"
                show-password
                placeholder="至少 6 位"
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="pwdForm.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入新密码"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="changing" @click="changePwd">确认修改</el-button>
              <el-button @click="resetPwd">清空</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User, Clock, Postcard, InfoFilled, EditPen, Key,
  Collection, Reading, CircleCheck
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useBookStore } from '@/stores/book'

const userStore = useUserStore()
const bookStore = useBookStore()

const user = computed(() => userStore.user || {})
const avatarText = computed(() => (userStore.displayName || 'U').slice(0, 1).toUpperCase())
const loginTime = computed(() => {
  const ts = Number(String(userStore.token || '').split('-').pop())
  if (!Number.isFinite(ts) || ts < 1e12) return '-'
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
})
const stats = computed(() => {
  const books = bookStore.books || []
  return [
    { label: '在管图书', value: books.length, color: '#4f6ef7', icon: Collection },
    { label: '借出中', value: books.filter((b) => b.status === 'borrowed').length, color: '#f0a020', icon: Reading },
    { label: '在馆可借', value: books.filter((b) => b.status === 'available').length, color: '#18a058', icon: CircleCheck }
  ]
})

// 编辑资料
const profileRef = ref(null)
const profileForm = reactive({ name: '', bio: '' })
const profileRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}
const saving = ref(false)

function syncProfileForm() {
  profileForm.name = user.value.name || ''
  profileForm.bio = user.value.bio || ''
}

async function saveProfile() {
  const valid = await profileRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await userStore.updateProfile({
      name: profileForm.name.trim(),
      bio: profileForm.bio.trim()
    })
    ElMessage.success('个人资料已保存')
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 修改密码
const pwdRef = ref(null)
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}
const changing = ref(false)

function resetPwd() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdRef.value?.clearValidate()
}

async function changePwd() {
  const valid = await pwdRef.value.validate().catch(() => false)
  if (!valid) return
  changing.value = true
  try {
    await userStore.changePassword(pwdForm.oldPassword, pwdForm.newPassword)
    ElMessage.success('密码修改成功，下次登录请使用新密码')
    resetPwd()
  } catch (e) {
    ElMessage.error(e.message || '修改密码失败')
  } finally {
    changing.value = false
  }
}

onMounted(async () => {
  syncProfileForm()
  try {
    await userStore.fetchProfile()
    syncProfileForm()
  } catch (e) {
    // 资料读取失败时保留登录态中已有的信息
  }
  if (!bookStore.books || !bookStore.books.length) {
    try {
      await bookStore.fetchList()
    } catch (e) {
      // 统计失败不影响资料编辑
    }
  }
})
</script>

<style scoped>
.card-title { font-weight: 600; color: #1f2540; display: flex; align-items: center; gap: 6px; }

.profile-hero { border-radius: 14px; border: none; overflow: hidden; }
.profile-hero :deep(.el-card__body) { padding: 0; }
.hero-bg { height: 96px; background: linear-gradient(120deg, #1f2540 0%, #3a53b8 58%, #4f6ef7 100%); }
.hero-body {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  margin-top: -42px;
  padding: 0 24px 22px;
}
.hero-avatar {
  border: 4px solid #fff;
  background: #4f6ef7;
  color: #fff;
  font-size: 30px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(31, 37, 64, 0.15);
}
.hero-info { flex: 1; min-width: 0; padding-top: 44px; padding-bottom: 2px; }
.hero-name-row { display: flex; align-items: center; gap: 10px; }
.hero-name-row h3 { margin: 0; font-size: 20px; color: #1f2540; }
.hero-bio { margin: 6px 0 8px; font-size: 13px; color: #606266; }
.hero-meta { display: flex; flex-wrap: wrap; gap: 18px; font-size: 12px; color: #909399; }
.hero-meta span { display: inline-flex; align-items: center; gap: 4px; }
.hero-stats { display: flex; gap: 28px; margin-left: auto; padding-bottom: 2px; }
.hero-stat { text-align: center; }
.hero-stat-value { font-size: 24px; font-weight: 600; line-height: 1.2; }
.hero-stat-label {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.info-list { display: flex; flex-direction: column; }
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px dashed #eef0f5;
  font-size: 13px;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #909399; flex-shrink: 0; }
.info-value { color: #303133; font-weight: 500; text-align: right; }
.tip-text { font-size: 13px; color: #606266; line-height: 1.9; margin: 0; }

@media (max-width: 900px) {
  .hero-body { flex-wrap: wrap; }
  .hero-stats { margin-left: 0; width: 100%; justify-content: flex-start; }
}
</style>
