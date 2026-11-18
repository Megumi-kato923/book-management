import { defineStore } from 'pinia'
import { userApi } from '@/api/user'

const USER_KEY = 'bms_user_v1'

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('读取登录状态失败', e)
  }
  return null
}

export const useUserStore = defineStore('user', {
  state: () => {
    const saved = loadUser()
    return {
      token: saved?.token || '',
      user: saved?.user || null,
      loading: false
    }
  },
  getters: {
    isLogged: (s) => !!s.token,
    displayName: (s) => s.user?.name || s.user?.username || ''
  },
  actions: {
    persist() {
      localStorage.setItem(USER_KEY, JSON.stringify({ token: this.token, user: this.user }))
    },
    async login(username, password) {
      this.loading = true
      try {
        const res = await userApi.login({ username, password })
        const payload = res.data
        if (payload.code !== 0) {
          throw new Error(payload.message || '登录失败')
        }
        this.token = payload.data.token
        this.user = payload.data.user
        this.persist()
        return true
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        await userApi.logout()
      } finally {
        this.token = ''
        this.user = null
        localStorage.removeItem(USER_KEY)
      }
    },
    // 拉取最新资料（用于进入个人资料页时同步，避免其他标签页改过不同步）
    async fetchProfile() {
      const res = await userApi.getProfile()
      const payload = res.data
      if (payload.code !== 0) {
        throw new Error(payload.message || '获取资料失败')
      }
      this.user = { ...(this.user || {}), ...payload.data }
      this.persist()
      return this.user
    },
    // 更新姓名与简介，成功后同步本地登录态
    async updateProfile(patch) {
      const res = await userApi.updateProfile(patch)
      const payload = res.data
      if (payload.code !== 0) {
        throw new Error(payload.message || '保存失败')
      }
      this.user = { ...(this.user || {}), ...payload.data }
      this.persist()
      return this.user
    },
    // 修改密码：校验原密码由模拟接口完成
    async changePassword(oldPassword, newPassword) {
      const res = await userApi.changePassword({ oldPassword, newPassword })
      const payload = res.data
      if (payload.code !== 0) {
        throw new Error(payload.message || '修改密码失败')
      }
      return true
    }
  }
})
