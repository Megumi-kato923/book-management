import request from './request'

// 用户/认证接口封装
export const userApi = {
  login(data) {
    return request.post('/login', data)
  },
  logout() {
    return request.post('/logout')
  },
  getProfile() {
    return request.get('/profile')
  },
  updateProfile(data) {
    return request.put('/profile', data)
  },
  changePassword(data) {
    return request.post('/change-password', data)
  }
}
