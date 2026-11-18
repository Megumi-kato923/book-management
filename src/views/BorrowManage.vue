<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">借阅管理</h2>
      <p class="page-desc">查看当前已借出的图书，办理归还手续。</p>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="8">
        <el-card class="stat-card" shadow="never">
          <div class="stat-row">
            <div class="stat-icon" style="background:#f0a020"><el-icon><Tickets /></el-icon></div>
            <div><div class="stat-value">{{ borrowedBooks.length }}</div><div class="stat-label">当前借出</div></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card" shadow="never">
          <div class="stat-row">
            <div class="stat-icon" style="background:#18a058"><el-icon><CircleCheck /></el-icon></div>
            <div><div class="stat-value">{{ store.books.length - borrowedBooks.length }}</div><div class="stat-label">在馆可借</div></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card" shadow="never">
          <div class="stat-row">
            <div class="stat-icon" style="background:#4f6ef7"><el-icon><Collection /></el-icon></div>
            <div><div class="stat-value">{{ store.books.length }}</div><div class="stat-label">馆藏总数</div></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="content-card" shadow="never">
      <template #header><div class="card-title">借出记录</div></template>
      <el-table :data="borrowedBooks" v-loading="store.loading" stripe border>
        <el-table-column prop="title" label="书名" min-width="220" show-overflow-tooltip />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="borrower" label="借阅人" width="110">
          <template #default="{ row }"><el-tag size="small" type="warning" effect="plain">{{ row.borrower }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="borrowDate" label="借出日期" width="130" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleReturn(row)">办理归还</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无借出记录" /></template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Tickets, CircleCheck, Collection } from '@element-plus/icons-vue'
import { useBookStore } from '@/stores/book'

const store = useBookStore()
const borrowedBooks = computed(() => store.books.filter((b) => b.status === 'borrowed'))

async function handleReturn(row) {
  try {
    await ElMessageBox.confirm(`确认《${row.title}》已归还？`, '归还确认', { type: 'info' })
  } catch {
    // 用户点击取消 / 关闭，直接返回，不执行归还
    return
  }
  await store.returnBook(row.id)
  ElMessage.success('归还成功')
}

onMounted(() => {
  if (!store.books.length) store.fetchList()
})
</script>

<style scoped>
.stat-row { display: flex; align-items: center; gap: 16px; }
.stat-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 26px; color: #fff; }
.stat-value { font-size: 28px; font-weight: 600; color: #1f2540; line-height: 1.2; }
.stat-label { font-size: 13px; color: #909399; }
.card-title { font-weight: 600; color: #1f2540; }
</style>
