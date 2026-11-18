<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">技术说明</h2>
      <p class="page-desc">本项目《基于 Vite + Element Plus 的图书管理系统》所用技术与实现说明。</p>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :md="12" v-for="group in techGroups" :key="group.title">
        <el-card class="content-card" shadow="never" style="margin-bottom: 16px">
          <template #header>
            <div class="card-title"><el-icon :style="{ color: group.color }"><component :is="group.icon" /></el-icon> {{ group.title }}</div>
          </template>
          <div v-for="item in group.items" :key="item.name" class="tech-item">
            <span class="tech-name">{{ item.name }}</span>
            <span class="tech-version">{{ item.version }}</span>
            <span class="tech-desc">{{ item.desc }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="content-card" shadow="never">
      <template #header><div class="card-title">项目结构</div></template>
      <pre class="tree">{{ tree }}</pre>
    </el-card>
  </div>
</template>

<script setup>
import { Grid, Brush, Connection, Setting } from '@element-plus/icons-vue'

const techGroups = [
  {
    title: '核心框架', icon: Grid, color: '#4f6ef7',
    items: [
      { name: 'Vue 3', version: '^3.5', desc: 'Composition API + <script setup> 语法' },
      { name: 'Vite', version: '^6.0', desc: '前端构建工具，快速热更新' },
      { name: 'Vue Router', version: '^4.5', desc: '页面路由与导航' }
    ]
  },
  {
    title: '界面与状态', icon: Brush, color: '#e0529c',
    items: [
      { name: 'Element Plus', version: '^2.9', desc: 'UI 组件库（表格/表单/弹窗等）' },
      { name: 'Pinia', version: '^2.3', desc: '状态管理，集中管理图书数据' },
      { name: 'ECharts', version: '^5.5', desc: '首页统计图表' }
    ]
  },
  {
    title: '数据与网络', icon: Connection, color: '#18a058',
    items: [
      { name: 'Axios', version: '^1.7', desc: 'HTTP 请求封装，统一接口调用' },
      { name: 'Mock.js', version: '^1.1', desc: '生成初始模拟图书数据' },
      { name: 'localStorage', version: '浏览器', desc: '数据持久化，刷新不丢失' }
    ]
  },
  {
    title: '功能实现', icon: Setting, color: '#f0a020',
    items: [
      { name: '登录鉴权', version: '完成', desc: '登录页、路由守卫、状态持久化' },
      { name: '个人资料', version: '完成', desc: '资料编辑、修改密码、登录校验' },
      { name: '图书管理', version: '完成', desc: '增删改查、搜索、筛选、分页' },
      { name: '借阅管理', version: '完成', desc: '借出登记、归还、状态流转' },
      { name: '数据可视化', version: '完成', desc: '分类柱状图、借阅饼图' }
    ]
  }
]

const tree = `book-management/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js            # 应用入口
    ├── App.vue
    ├── api/
    │   ├── request.js     # Axios 实例 + 模拟接口
    │   ├── book.js        # 图书接口封装
    │   └── user.js        # 用户接口封装
    ├── mock/books.js      # Mock.js 数据
    ├── stores/
    │   ├── book.js        # 图书状态管理
    │   └── user.js        # 用户登录状态
    ├── router/index.js    # 路由配置 + 登录守卫
    ├── layout/MainLayout.vue
    ├── components/BookForm.vue
    ├── views/
    │   ├── Login.vue      # 登录页
    │   ├── Dashboard.vue  # 首页概览
    │   ├── BookList.vue   # 图书管理
    │   ├── BorrowManage.vue # 借阅管理
    │   ├── About.vue      # 技术说明
    │   └── Profile.vue    # 个人资料
    └── styles/index.css`
</script>

<style scoped>
.card-title { font-weight: 600; color: #1f2540; display: flex; align-items: center; gap: 6px; }
.tech-item { display: flex; align-items: baseline; gap: 10px; padding: 8px 0; border-bottom: 1px dashed #eef0f5; font-size: 13px; }
.tech-item:last-child { border-bottom: none; }
.tech-name { font-weight: 600; color: #303133; min-width: 100px; }
.tech-version { color: #4f6ef7; font-size: 12px; min-width: 56px; }
.tech-desc { color: #909399; flex: 1; }
.tree { background: #1f2540; color: #c8d0e0; padding: 18px; border-radius: 10px; font-size: 12px; line-height: 1.7; overflow: auto; font-family: Consolas, Monaco, monospace; }
</style>
