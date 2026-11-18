<template>
  <el-container class="layout">
    <button
      v-if="isMobile && isMobileMenuOpen"
      class="sidebar-mask"
      type="button"
      aria-label="关闭导航菜单"
      @click="isMobileMenuOpen = false"
    ></button>

    <el-aside
      :width="asideWidth"
      class="aside"
      :class="{
        'is-collapsed': !isMobile && isCollapse,
        'is-mobile-open': isMobile && isMobileMenuOpen
      }"
    >
      <div class="logo">
        <div class="logo-icon"><el-icon><Reading /></el-icon></div>
        <span v-show="!isCollapse || isMobile" class="logo-text">图书管理系统</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isMenuCollapsed"
        :collapse-transition="false"
        router
        background-color="#1f2540"
        text-color="#c5c9d6"
        active-text-color="#ffffff"
        class="menu"
        @select="isMobileMenuOpen = false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <template #title>首页概览</template>
        </el-menu-item>
        <el-menu-item index="/books">
          <el-icon><Collection /></el-icon>
          <template #title>图书管理</template>
        </el-menu-item>
        <el-menu-item index="/borrow">
          <el-icon><Tickets /></el-icon>
          <template #title>借阅管理</template>
        </el-menu-item>
        <el-menu-item index="/about">
          <el-icon><InfoFilled /></el-icon>
          <template #title>技术说明</template>
        </el-menu-item>
      </el-menu>
      <div v-show="!isCollapse || isMobile" class="aside-footer">
        <span class="status-dot"></span>
        <span>系统运行正常</span>
      </div>
    </el-aside>

    <el-container class="main">
      <el-header class="header">
        <div class="header-left">
          <button
            class="icon-button"
            type="button"
            :aria-label="sidebarActionLabel"
            :title="sidebarActionLabel"
            :aria-expanded="isMobile ? isMobileMenuOpen : !isCollapse"
            @click="toggleSidebar"
          >
            <el-icon>
              <Expand v-if="showExpandIcon" />
              <Fold v-else />
            </el-icon>
          </button>
          <span class="breadcrumb">
            <span class="breadcrumb-home">首页</span>
            <span class="breadcrumb-divider">/</span>
            <strong>{{ route.meta.title }}</strong>
          </span>
        </div>
        <div class="header-right">
          <el-tag class="tech-tag" type="primary" size="small" effect="plain">
            Vue3 + Element Plus
          </el-tag>
          <el-dropdown @command="handleCommand" trigger="click">
            <button class="user-trigger" type="button" aria-label="打开用户菜单">
              <el-avatar :size="32" class="user-avatar">{{ avatarText }}</el-avatar>
              <span class="user-name">{{ userStore.displayName }}</span>
              <el-icon class="user-arrow"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人资料
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Reading, DataBoard, Collection, Tickets, InfoFilled, Expand, Fold,
  ArrowDown, User, SwitchButton
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)
const isMobile = ref(false)
const isMobileMenuOpen = ref(false)
let mediaQuery = null

const asideWidth = computed(() => (isMobile.value ? '230px' : isCollapse.value ? '64px' : '210px'))
const isMenuCollapsed = computed(() => !isMobile.value && isCollapse.value)
const showExpandIcon = computed(() => isMobile.value ? !isMobileMenuOpen.value : isCollapse.value)
const sidebarActionLabel = computed(() => isMobile.value
  ? (isMobileMenuOpen.value ? '收起导航菜单' : '展开导航菜单')
  : (isCollapse.value ? '展开侧边栏' : '收起侧边栏')
)
const avatarText = computed(() => (userStore.displayName || 'U').slice(0, 1).toUpperCase())

function syncViewport(event) {
  isMobile.value = event.matches
  if (!event.matches) {
    isMobileMenuOpen.value = false
  }
}

function toggleSidebar() {
  if (isMobile.value) {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
    return
  }
  isCollapse.value = !isCollapse.value
}

watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false
})

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  isMobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', syncViewport)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', syncViewport)
})

async function handleCommand(command) {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
    } catch {
      return
    }
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout {
  height: 100%;
  min-width: 0;
  position: relative;
}
.aside {
  background: #1f2540;
  transition: width 0.25s ease, transform 0.25s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 8px 0 24px rgba(15, 23, 42, 0.08);
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 20px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
  flex-shrink: 0;
}
.aside.is-collapsed .logo {
  justify-content: center;
  padding-left: 0;
}
.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #5b78ff, #405ee8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(79, 110, 247, 0.32);
}
.logo-text { font-size: 16px; font-weight: 650; letter-spacing: 0.02em; }
.menu {
  flex: 1;
  border-right: none;
  padding: 8px 0;
}
.menu :deep(.el-menu-item) {
  height: 46px;
  margin: 4px 10px;
  border-radius: 9px;
}
.menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
}
.menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #4f6ef7, #617df8) !important;
  box-shadow: 0 6px 16px rgba(79, 110, 247, 0.24);
}
.aside-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 20px 18px;
  color: #9299ad;
  font-size: 12px;
  white-space: nowrap;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #37c871;
  box-shadow: 0 0 0 4px rgba(55, 200, 113, 0.12);
}
.main {
  background: var(--app-bg);
  min-width: 0;
}
.header {
  height: 60px;
  background: rgba(255, 255, 255, 0.96);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 22px;
  box-shadow: 0 1px 0 rgba(31, 37, 64, 0.06);
  position: relative;
  z-index: 20;
}
.header-left,
.header-right {
  display: flex;
  align-items: center;
  min-width: 0;
}
.header-left { gap: 12px; }
.header-right { gap: 14px; }
.icon-button {
  width: 34px;
  height: 34px;
  border: 1px solid #e8ebf2;
  border-radius: 9px;
  background: #fff;
  color: #4b5368;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.18s, background-color 0.18s, color 0.18s;
}
.icon-button:hover {
  border-color: #c9d1ff;
  background: #f5f7ff;
  color: var(--el-color-primary);
}
.icon-button:focus-visible,
.user-trigger:focus-visible {
  outline: 3px solid rgba(79, 110, 247, 0.22);
  outline-offset: 2px;
}
.breadcrumb {
  color: #9096a6;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.breadcrumb strong { color: #4b5368; font-weight: 600; }
.breadcrumb-divider { margin: 0 7px; color: #c5cad4; }
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 4px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  cursor: pointer;
  color: inherit;
}
.user-trigger:hover { background: #f6f7fb; }
.user-avatar { background: linear-gradient(135deg, #5b78ff, #405ee8); flex-shrink: 0; }
.user-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: #30364a;
  white-space: nowrap;
}
.user-arrow { font-size: 12px; color: #909399; }
.content {
  padding: 0;
  overflow-y: auto;
}
.sidebar-mask { display: none; }

@media (max-width: 992px) {
  .tech-tag { display: none; }
}

@media (max-width: 768px) {
  .aside {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 120;
    transform: translateX(-100%);
    box-shadow: 16px 0 40px rgba(15, 23, 42, 0.24);
  }
  .aside.is-mobile-open { transform: translateX(0); }
  .sidebar-mask {
    display: block;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 230px;
    z-index: 110;
    width: auto;
    height: 100%;
    border: 0;
    background: rgba(15, 23, 42, 0.46);
    backdrop-filter: blur(2px);
  }
  .header { padding: 0 16px; }
  .header-right { gap: 8px; }
  .breadcrumb-home,
  .breadcrumb-divider { display: none; }
}

@media (max-width: 520px) {
  .user-name,
  .user-arrow { display: none; }
  .header-left { gap: 9px; }
  .breadcrumb { font-size: 12px; }
}
</style>
