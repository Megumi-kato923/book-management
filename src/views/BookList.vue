<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">图书管理</h2>
      <p class="page-desc">对图书进行查询、新增、编辑、删除与借阅操作。</p>
    </div>

    <el-card class="content-card" shadow="never">
      <template #header>
        <div class="toolbar">
          <el-input
            v-model="store.query.keyword"
            placeholder="搜索书名 / 作者 / ISBN"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="store.query.category" placeholder="全部分类" clearable style="width: 140px" @change="handleSearch">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
          <el-select v-model="store.query.status" placeholder="全部状态" clearable style="width: 130px" @change="handleSearch">
            <el-option label="在馆" value="available" />
            <el-option label="已借出" value="borrowed" />
          </el-select>
          <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>查询</el-button>
          <el-button @click="resetSearch"><el-icon><Refresh /></el-icon>重置</el-button>
          <div class="spacer"></div>
          <el-button type="success" @click="openCreate"><el-icon><Plus /></el-icon>新增图书</el-button>
        </div>
      </template>

      <el-table :data="pagedBooks" v-loading="store.loading" stripe border style="width: 100%">
        <el-table-column prop="title" label="书名" min-width="230" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="book-cell">
              <span class="book-cover" :style="{ background: row.cover }">{{ row.title.slice(0, 1) }}</span>
              <div>
                <div class="book-title">{{ row.title }}</div>
                <div class="book-isbn">ISBN: {{ row.isbn }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="100" />
        <el-table-column prop="category" label="分类" width="90">
          <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.category }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="publisher" label="出版社" min-width="150" show-overflow-tooltip />
        <el-table-column prop="price" label="价格" width="90">
          <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'available' ? 'success' : 'warning'" size="small">
              {{ row.status === 'available' ? '在馆' : '已借出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              link
              :type="row.status === 'available' ? 'warning' : 'success'"
              size="small"
              @click="toggleBorrow(row)"
            >{{ row.status === 'available' ? '借出' : '归还' }}</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="store.query.page"
          v-model:page-size="store.query.pageSize"
          :page-sizes="[8, 12, 20]"
          :total="store.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>

    <BookForm ref="formRef" v-model="formVisible" :book="currentBook" @success="store.fetchList" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { useBookStore } from '@/stores/book'
import { CATEGORIES } from '@/mock/books'
import BookForm from '@/components/BookForm.vue'

const store = useBookStore()
const categories = CATEGORIES
const formRef = ref(null)
const formVisible = ref(false)
const currentBook = ref(null)

// store 已取全量并按查询条件过滤，这里在前台做分页
const filtered = computed(() => store.books)
const pagedBooks = computed(() => {
  const start = (store.query.page - 1) * store.query.pageSize
  return filtered.value.slice(start, start + store.query.pageSize)
})

function handleSearch() {
  store.query.page = 1
  store.fetchList()
}
function resetSearch() {
  Object.assign(store.query, { keyword: '', category: '', status: '', page: 1 })
  store.fetchList()
}
function openCreate() {
  currentBook.value = null
  formVisible.value = true
  nextTick(() => formRef.value?.setBook(null))
}
function openEdit(book) {
  currentBook.value = { ...book }
  formVisible.value = true
  nextTick(() => formRef.value?.setBook(book))
}
async function toggleBorrow(row) {
  if (row.status === 'available') {
    let value
    try {
      const res = await ElMessageBox.prompt('请输入借阅人姓名', '借出图书', {
        confirmButtonText: '确认借出',
        cancelButtonText: '取消',
        inputValue: '张三',
        inputPattern: /\S+/,
        inputErrorMessage: '借阅人不能为空'
      })
      value = res.value
    } catch {
      // 取消借出
      return
    }
    await store.borrowBook(row.id, value)
    ElMessage.success('借出成功')
  } else {
    try {
      await ElMessageBox.confirm(`确认将《${row.title}》标记为已归还？`, '归还图书', { type: 'info' })
    } catch {
      // 取消归还
      return
    }
    await store.returnBook(row.id)
    ElMessage.success('归还成功')
  }
}
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除《${row.title}》？此操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    // 取消删除
    return
  }
  await store.removeBook(row.id)
  ElMessage.success('删除成功')
}

import { nextTick } from 'vue'
onMounted(() => store.fetchList())
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.spacer { flex: 1; }
.book-cell { display: flex; align-items: center; gap: 10px; }
.book-cover {
  width: 36px; height: 46px; border-radius: 4px; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 600; flex-shrink: 0;
}
.book-title { font-weight: 500; color: #303133; }
.book-isbn { font-size: 11px; color: #a0a6b5; margin-top: 2px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
