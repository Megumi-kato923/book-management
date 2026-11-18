<template>
  <div class="page-container dashboard-page">
    <section class="dashboard-hero">
      <div class="hero-copy">
        <div class="hero-meta">
          <span class="hero-pill">今日概览</span>
          <span>{{ todayLabel }}</span>
        </div>
        <h2>{{ greeting }}，{{ userStore.displayName }}</h2>
        <p>{{ summaryText }}</p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" :icon="Plus" @click="goTo('/books')">管理图书</el-button>
        <el-button :icon="Tickets" @click="goTo('/borrow')">查看借阅</el-button>
      </div>
    </section>

    <section class="stat-grid" v-loading="initialLoading">
      <article
        v-for="card in statCards"
        :key="card.label"
        class="stat-card"
        :style="{ '--stat-color': card.color, '--stat-soft': card.soft }"
      >
        <div class="stat-main">
          <div>
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-value">{{ card.value }}<small v-if="card.suffix">{{ card.suffix }}</small></div>
          </div>
          <div class="stat-icon">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
        </div>
        <div class="stat-foot">
          <span>{{ card.note }}</span>
          <span class="stat-indicator"></span>
        </div>
      </article>
    </section>

    <section class="chart-grid">
      <el-card class="content-card" shadow="never" v-loading="initialLoading">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-title">各分类图书数量</div>
              <div class="card-subtitle">按馆藏分类统计</div>
            </div>
            <el-tag type="primary" effect="plain" round>{{ totalCount }} 本</el-tag>
          </div>
        </template>
        <div ref="barChart" class="chart"></div>
      </el-card>

      <el-card class="content-card" shadow="never" v-loading="initialLoading">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-title">借阅状态分布</div>
              <div class="card-subtitle">在馆与借出占比</div>
            </div>
            <el-tag type="warning" effect="plain" round>{{ borrowRate }}% 借出率</el-tag>
          </div>
        </template>
        <div ref="pieChart" class="chart"></div>
      </el-card>
    </section>

    <el-card class="content-card recent-card" shadow="never" v-loading="initialLoading">
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-title">最近入库图书</div>
            <div class="card-subtitle">按入库日期展示最新 5 本</div>
          </div>
          <el-button text type="primary" @click="goTo('/books')">
            查看全部<el-icon class="header-arrow"><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>

      <div class="recent-table-wrap">
        <el-table :data="recentBooks" size="small" stripe>
          <el-table-column prop="title" label="书名" min-width="220" show-overflow-tooltip />
          <el-table-column prop="author" label="作者" width="130" />
          <el-table-column prop="category" label="分类" width="110">
            <template #default="{ row }">
              <el-tag type="info" effect="plain" size="small">{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="入库日期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'available' ? 'success' : 'warning'" size="small" effect="light">
                {{ row.status === 'available' ? '在馆' : '已借出' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="recentBooks.length" class="recent-mobile-list">
        <article v-for="book in recentBooks" :key="book.id" class="recent-mobile-item">
          <span class="book-cover" :style="{ background: book.cover || '#4f6ef7' }">{{ book.title.slice(0, 1) }}</span>
          <div class="mobile-book-main">
            <div class="mobile-book-title">{{ book.title }}</div>
            <div class="mobile-book-meta">{{ book.author }} · {{ book.category }}</div>
            <div class="mobile-book-meta">{{ book.createdAt }} 入库</div>
          </div>
          <el-tag :type="book.status === 'available' ? 'success' : 'warning'" size="small" effect="light">
            {{ book.status === 'available' ? '在馆' : '已借出' }}
          </el-tag>
        </article>
      </div>

      <el-empty v-if="!initialLoading && !recentBooks.length" description="暂无入库图书" :image-size="72" />
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowRight, CircleCheck, Collection, Files, Plus, Reading, Tickets
} from '@element-plus/icons-vue'
import { use, init } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useBookStore } from '@/stores/book'
import { useUserStore } from '@/stores/user'
import { CATEGORIES } from '@/mock/books'

use([BarChart, PieChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent, CanvasRenderer])

const router = useRouter()
const store = useBookStore()
const userStore = useUserStore()
const barChart = ref(null)
const pieChart = ref(null)
const initialLoading = ref(!store.books.length)
let barInstance = null
let pieInstance = null
let resizeObserver = null
let resizeFrame = 0
let compactCharts = false
let isUnmounted = false

const totalCount = computed(() => store.books.length)
const availableCount = computed(() => store.books.filter((book) => book.status === 'available').length)
const borrowedCount = computed(() => store.books.filter((book) => book.status === 'borrowed').length)
const categoryCount = computed(() => new Set(store.books.map((book) => book.category)).size)
const borrowRate = computed(() => totalCount.value ? Math.round((borrowedCount.value / totalCount.value) * 100) : 0)
const availableRate = computed(() => totalCount.value ? Math.round((availableCount.value / totalCount.value) * 100) : 0)
const averagePerCategory = computed(() => categoryCount.value ? (totalCount.value / categoryCount.value).toFixed(1) : '0')
const summaryText = computed(() => initialLoading.value
  ? '正在同步馆藏与借阅数据，请稍候…'
  : '当前馆藏 ' + totalCount.value + ' 本，其中 ' + availableCount.value + ' 本可借、' + borrowedCount.value + ' 本借出，系统数据已同步。')
const recentBooks = computed(() => [...store.books]
  .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  .slice(0, 5))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})
const todayLabel = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(new Date())

const statCards = computed(() => {
  const loading = initialLoading.value
  return [
  {
    label: '图书总数',
    value: loading ? '—' : totalCount.value,
    note: loading ? '正在统计' : '覆盖 ' + categoryCount.value + ' 个分类',
    icon: Collection,
    color: '#4f6ef7',
    soft: 'rgba(79, 110, 247, 0.12)'
  },
  {
    label: '在馆图书',
    value: loading ? '—' : availableCount.value,
    note: loading ? '正在统计' : '可借率 ' + availableRate.value + '%',
    icon: CircleCheck,
    color: '#18a058',
    soft: 'rgba(24, 160, 88, 0.12)'
  },
  {
    label: '已借出',
    value: loading ? '—' : borrowedCount.value,
    note: loading ? '正在统计' : (borrowedCount.value ? borrowedCount.value + ' 本正在借阅中' : '当前无借出图书'),
    icon: Reading,
    color: '#f0a020',
    soft: 'rgba(240, 160, 32, 0.14)'
  },
  {
    label: '图书分类',
    value: loading ? '—' : categoryCount.value,
    note: loading ? '正在统计' : '平均每类 ' + averagePerCategory.value + ' 本',
    icon: Files,
    color: '#d94b94',
    soft: 'rgba(217, 75, 148, 0.12)'
  }
  ]
})

function goTo(path) {
  router.push(path)
}

function barOption(isCompact) {
  return {
    animationDuration: 600,
    grid: { left: 8, right: 12, top: 26, bottom: isCompact ? 54 : 14, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(79, 110, 247, 0.06)' } },
      backgroundColor: '#1f2540',
      borderWidth: 0,
      padding: [9, 12],
      textStyle: { color: '#ffffff', fontSize: 12 },
      formatter: (params) => {
        const item = params[0]
        return '<div style="font-weight:600;margin-bottom:4px">' + item.axisValue + '</div>' +
          item.marker + ' 图书数量：' + item.value + ' 本'
      }
    },
    xAxis: {
      type: 'category',
      data: CATEGORIES,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e8ebf2' } },
      axisLabel: {
        color: '#7c8496',
        interval: 0,
        rotate: isCompact ? 34 : 0,
        fontSize: isCompact ? 10 : 12,
        margin: 12
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#8b92a4' },
      splitLine: { lineStyle: { color: '#eef1f7', type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: CATEGORIES.map((category) => store.books.filter((book) => book.category === category).length),
      barMaxWidth: 38,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#6c86ff' },
            { offset: 1, color: '#4f6ef7' }
          ]
        }
      },
      emphasis: { itemStyle: { color: '#3e5ce7' } }
    }]
  }
}

function pieOption(isCompact) {
  return {
    animationDuration: 700,
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1f2540',
      borderWidth: 0,
      padding: [9, 12],
      textStyle: { color: '#ffffff', fontSize: 12 },
      formatter: '{b}<br/>{c} 本（{d}%）'
    },
    title: {
      text: borrowRate.value + '%',
      subtext: '借出率',
      left: 'center',
      top: isCompact ? '31%' : '33%',
      textStyle: { color: '#1f2540', fontSize: 24, fontWeight: 700 },
      subtextStyle: { color: '#9096a6', fontSize: 12, lineHeight: 20 }
    },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 22,
      textStyle: { color: '#7c8496', fontSize: 12 }
    },
    series: [{
      type: 'pie',
      radius: isCompact ? ['48%', '70%'] : ['52%', '72%'],
      center: ['50%', '43%'],
      avoidLabelOverlap: true,
      stillShowZeroSum: false,
      itemStyle: { borderColor: '#ffffff', borderWidth: 3, borderRadius: 8 },
      label: { show: false },
      emphasis: { scaleSize: 6 },
      data: [
        { value: availableCount.value, name: '在馆', itemStyle: { color: '#18a058' } },
        { value: borrowedCount.value, name: '已借出', itemStyle: { color: '#f0a020' } }
      ]
    }]
  }
}

function renderCharts() {
  if (!barChart.value || !pieChart.value) return
  const nextCompact = barChart.value.clientWidth < 520
  compactCharts = nextCompact
  if (!barInstance) barInstance = init(barChart.value)
  if (!pieInstance) pieInstance = init(pieChart.value)
  barInstance.setOption(barOption(nextCompact), true)
  pieInstance.setOption(pieOption(nextCompact), true)
}

function queueChartResize() {
  window.cancelAnimationFrame(resizeFrame)
  resizeFrame = window.requestAnimationFrame(() => {
    if (!barChart.value) return
    const nextCompact = barChart.value.clientWidth < 520
    if (nextCompact !== compactCharts) {
      renderCharts()
      return
    }
    barInstance?.resize()
    pieInstance?.resize()
  })
}

async function loadDashboard() {
  if (store.books.length) return
  try {
    await store.fetchList()
  } catch {
    if (!isUnmounted) ElMessage.error('仪表盘数据加载失败，请稍后重试')
  }
}

watch(() => store.books, async () => {
  await nextTick()
  renderCharts()
}, { deep: true })

onMounted(async () => {
  window.addEventListener('resize', queueChartResize)
  await loadDashboard()
  if (isUnmounted) return
  initialLoading.value = false
  await nextTick()
  renderCharts()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(queueChartResize)
    if (barChart.value) resizeObserver.observe(barChart.value)
    if (pieChart.value) resizeObserver.observe(pieChart.value)
  }
})

onBeforeUnmount(() => {
  isUnmounted = true
  window.removeEventListener('resize', queueChartResize)
  window.cancelAnimationFrame(resizeFrame)
  resizeObserver?.disconnect()
  barInstance?.dispose()
  pieInstance?.dispose()
  barInstance = null
  pieInstance = null
})
</script>

<style scoped>
.dashboard-page {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px 28px 32px;
}
.dashboard-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
  padding: 23px 26px;
  border: 1px solid rgba(79, 110, 247, 0.12);
  border-radius: 16px;
  background:
    radial-gradient(circle at 88% 18%, rgba(79, 110, 247, 0.15), transparent 28%),
    linear-gradient(120deg, #ffffff 0%, #f7f9ff 62%, #eef2ff 100%);
  box-shadow: 0 8px 28px rgba(31, 37, 64, 0.06);
}
.dashboard-hero::after {
  content: '';
  position: absolute;
  right: -56px;
  bottom: -88px;
  width: 210px;
  height: 210px;
  border: 28px solid rgba(79, 110, 247, 0.06);
  border-radius: 50%;
  pointer-events: none;
}
.hero-copy { position: relative; z-index: 1; min-width: 0; }
.hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 9px;
  color: #8a91a4;
  font-size: 12px;
}
.hero-pill {
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(79, 110, 247, 0.1);
  color: #4f6ef7;
  font-weight: 600;
}
.hero-copy h2 {
  margin: 0 0 7px;
  color: #1f2540;
  font-size: clamp(22px, 2.2vw, 28px);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.hero-copy p {
  max-width: 720px;
  margin: 0;
  color: #737b8f;
  font-size: 13px;
  line-height: 1.7;
}
.hero-actions {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  min-height: 126px;
}
.stat-card {
  position: relative;
  overflow: hidden;
  padding: 18px;
  border: 1px solid rgba(31, 37, 64, 0.055);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 4px 18px rgba(31, 37, 64, 0.055);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stat-card::after {
  content: '';
  position: absolute;
  right: -18px;
  bottom: -26px;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--stat-soft);
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(31, 37, 64, 0.09);
}
.stat-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}
.stat-label { margin-bottom: 5px; color: #8b92a4; font-size: 13px; }
.stat-value {
  color: #1f2540;
  font-size: 30px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.stat-value small { margin-left: 3px; font-size: 13px; font-weight: 500; color: #9096a6; }
.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--stat-soft);
  background: var(--stat-soft);
  color: var(--stat-color);
  font-size: 23px;
}
.stat-foot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px solid #f0f2f7;
  color: #7c8496;
  font-size: 12px;
}
.stat-indicator {
  width: 24px;
  height: 4px;
  border-radius: 999px;
  background: var(--stat-color);
  opacity: 0.7;
}
.chart-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 1fr);
  gap: 16px;
  margin-top: 16px;
}
.content-card {
  border: 1px solid rgba(31, 37, 64, 0.055);
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(31, 37, 64, 0.05);
}
.content-card :deep(.el-card__header) {
  padding: 15px 18px;
  border-bottom: 1px solid #f0f2f7;
}
.content-card :deep(.el-card__body) { padding: 14px 18px 16px; }
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.card-title { color: #1f2540; font-size: 15px; font-weight: 650; }
.card-subtitle { margin-top: 3px; color: #9aa0af; font-size: 12px; }
.chart { width: 100%; height: 286px; }
.recent-card { margin-top: 16px; }
.header-arrow { margin-left: 4px; }
.recent-mobile-list { display: none; }
.recent-mobile-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 2px;
  border-bottom: 1px solid #f0f2f7;
}
.recent-mobile-item:last-child { border-bottom: 0; }
.book-cover {
  width: 38px;
  height: 46px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
}
.mobile-book-main { flex: 1; min-width: 0; }
.mobile-book-title {
  overflow: hidden;
  color: #30364a;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-book-meta { margin-top: 3px; color: #9aa0af; font-size: 11px; }

@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .chart-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 768px) {
  .dashboard-page { padding: 18px 16px 26px; }
  .dashboard-hero { padding: 20px; }
  .chart { height: 260px; }
}
@media (max-width: 680px) {
  .recent-table-wrap { display: none; }
  .recent-mobile-list { display: block; }
}
@media (max-width: 560px) {
  .dashboard-hero {
    align-items: stretch;
    flex-direction: column;
    gap: 17px;
  }
  .hero-actions { width: 100%; }
  .hero-actions :deep(.el-button) { flex: 1; margin-left: 0; }
  .stat-grid { gap: 12px; }
  .stat-card { padding: 16px; }
  .card-header { align-items: flex-start; }
}
@media (max-width: 460px) {
  .hero-meta { gap: 8px; font-size: 11px; }
  .stat-card { padding: 14px; }
  .stat-main { gap: 8px; }
  .stat-icon { width: 40px; height: 40px; font-size: 20px; }
  .stat-value { font-size: 26px; }
  .stat-foot { font-size: 11px; }
  .stat-indicator { display: none; }
  .chart { height: 240px; }
  .content-card :deep(.el-card__body) { padding: 12px 14px 14px; }
}
@media (max-width: 360px) {
  .stat-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
