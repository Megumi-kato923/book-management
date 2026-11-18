import request from './request'

// 图书接口封装
export const bookApi = {
  getList(params) {
    return request.get('/books', { params })
  },
  getById(id) {
    return request.get(`/books/${id}`)
  },
  create(data) {
    return request.post('/books', data)
  },
  update(id, data) {
    return request.put(`/books/${id}`, data)
  },
  remove(id) {
    return request.delete(`/books/${id}`)
  },
  borrow(id, borrower) {
    return request.post(`/books/${id}/borrow`, { borrower })
  },
  returnBook(id) {
    return request.post(`/books/${id}/return`)
  }
}
