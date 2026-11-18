import { defineStore } from 'pinia'
import { bookApi } from '@/api/book'

export const useBookStore = defineStore('book', {
  state: () => ({
    books: [],
    total: 0,
    loading: false,
    query: {
      keyword: '',
      category: '',
      status: '',
      page: 1,
      pageSize: 8
    }
  }),
  getters: {
    availableCount: (s) => s.books.filter((b) => b.status === 'available').length,
    borrowedCount: (s) => s.books.filter((b) => b.status === 'borrowed').length
  },
  actions: {
    async fetchList() {
      this.loading = true
      try {
        // 统计用大 pageSize 一次取全量，分页展示在组件内做
        const res = await bookApi.getList({ ...this.query, pageSize: 9999 })
        // 后端统一返回 { code, message, data }，列表在 res.data 中
        const payload = res.data
        this.books = payload.data.list
        this.total = payload.data.total
      } finally {
        this.loading = false
      }
    },
    async createBook(payload) {
      await bookApi.create(payload)
      await this.fetchList()
    },
    async updateBook(id, payload) {
      await bookApi.update(id, payload)
      await this.fetchList()
    },
    async removeBook(id) {
      await bookApi.remove(id)
      await this.fetchList()
    },
    async borrowBook(id, borrower) {
      await bookApi.borrow(id, borrower)
      await this.fetchList()
    },
    async returnBook(id) {
      await bookApi.returnBook(id)
      await this.fetchList()
    }
  }
})
