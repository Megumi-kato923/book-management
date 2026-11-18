import axios from 'axios'
import { generateBooks } from '@/mock/books'

const STORAGE_KEY = 'bms_books_v3'
const ACCOUNT_KEY = 'bms_account_v1'
const PROFILE_KEY = 'bms_profile_v1'

// 演示账号库：初始 admin/123456，修改密码后写回，登录校验由此读取
function loadAccount() {
  const initial = { username: 'admin', password: '123456' }
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(initial))
  } catch (e) {
    console.warn('读取账号库失败，使用默认账号', e)
  }
  return initial
}

// 个人资料：与账号分离存储，编辑资料后刷新/重新登录仍保留
function loadProfile() {
  const initial = {
    name: '管理员',
    role: '系统管理员',
    bio: '负责图书管理系统的日常运维与数据维护，欢迎交流。'
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return { ...initial, ...JSON.parse(raw) }
  } catch (e) {
    console.warn('读取个人资料失败，使用默认资料', e)
  }
  return initial
}

// 从 localStorage 恢复数据，首次访问时用 Mock.js 生成
function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('读取本地缓存失败，使用初始数据', e)
  }
  const data = generateBooks()
  saveDB(data)
  return data
}

function saveDB(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('写入本地缓存失败', e)
  }
}

let db = loadDB()

function nextId() {
  const max = db.reduce((m, b) => Math.max(m, Number(b.id) || 0), 1000)
  return String(max + 1)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 自定义 adapter：把 axios 请求拦截到本地「数据库」，模拟后端接口
// 这样无需真实后端即可演示 axios 调用，build 后也能正常运行
async function mockAdapter(config) {
  await sleep(120)
  const method = (config.method || 'get').toUpperCase()
  // axios 在调用 adapter 前已把 baseURL(/api) 拼到 url 上，这里去掉前缀再匹配
  const url = (config.url || '').replace(/^\/api/, '')
  const params = config.params || {}
  let body = config.data
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch (e) {
      body = {}
    }
  }
  body = body || {}

  let result = null
  let code = 0
  let message = 'ok'

  if (method === 'POST' && url === '/login') {
    const { username, password } = body
    const account = loadAccount()
    if (username === account.username && password === account.password) {
      result = {
        token: 'bms-token-' + Date.now(),
        user: { username: account.username, ...loadProfile() }
      }
    } else {
      code = 401
      message = '用户名或密码错误'
    }
  } else if (method === 'POST' && url === '/logout') {
    result = true
  } else if (method === 'GET' && url === '/profile') {
    result = { username: loadAccount().username, ...loadProfile() }
  } else if (method === 'PUT' && url === '/profile') {
    const next = { ...loadProfile() }
    if (typeof body.name === 'string' && body.name.trim()) next.name = body.name.trim()
    if (typeof body.bio === 'string') next.bio = body.bio.trim()
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    } catch (e) {
      console.warn('保存个人资料失败', e)
    }
    result = { username: loadAccount().username, ...next }
  } else if (method === 'POST' && url === '/change-password') {
    const account = loadAccount()
    const { oldPassword, newPassword } = body
    if (oldPassword !== account.password) {
      code = 400
      message = '原密码不正确'
    } else if (!newPassword || String(newPassword).length < 6) {
      code = 400
      message = '新密码长度不能少于 6 位'
    } else {
      account.password = newPassword
      try {
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
      } catch (e) {
        console.warn('保存新密码失败', e)
      }
      result = true
    }
  } else if (method === 'GET' && url === '/books') {
    const { keyword = '', category = '', status = '', page = 1, pageSize = 8 } = params
    let list = [...db]
    if (keyword) {
      const kw = String(keyword).toLowerCase()
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(kw) ||
          b.author.toLowerCase().includes(kw) ||
          b.isbn.toLowerCase().includes(kw)
      )
    }
    if (category) list = list.filter((b) => b.category === category)
    if (status) list = list.filter((b) => b.status === status)
    const total = list.length
    const start = (Number(page) - 1) * Number(pageSize)
    result = { list: list.slice(start, start + Number(pageSize)), total }
  } else if (method === 'GET' && url.startsWith('/books/')) {
    const id = url.split('/')[2]
    result = db.find((b) => b.id === id) || null
  } else if (method === 'POST' && url === '/books') {
    const book = { ...body, id: nextId(), createdAt: new Date().toISOString().slice(0, 10) }
    db.unshift(book)
    saveDB(db)
    result = book
  } else if (method === 'PUT' && url.startsWith('/books/')) {
    const id = url.split('/')[2]
    const idx = db.findIndex((b) => b.id === id)
    if (idx !== -1) {
      db[idx] = { ...db[idx], ...body, id }
      saveDB(db)
      result = db[idx]
    }
  } else if (method === 'DELETE' && url.startsWith('/books/')) {
    const id = url.split('/')[2]
    db = db.filter((b) => b.id !== id)
    saveDB(db)
    result = true
  } else if (method === 'POST' && /\/books\/\d+\/borrow/.test(url)) {
    const id = url.split('/')[2]
    const book = db.find((b) => b.id === id)
    if (book) {
      book.status = 'borrowed'
      book.borrower = body.borrower || '当前用户'
      book.borrowDate = new Date().toISOString().slice(0, 10)
      saveDB(db)
    }
    result = book
  } else if (method === 'POST' && /\/books\/\d+\/return/.test(url)) {
    const id = url.split('/')[2]
    const book = db.find((b) => b.id === id)
    if (book) {
      book.status = 'available'
      book.borrower = ''
      book.borrowDate = ''
      saveDB(db)
    }
    result = book
  } else {
    result = null
  }

  return {
    data: { code, message, data: result },
    status: 200,
    statusText: 'OK',
    headers: {},
    config
  }
}

const request = axios.create({
  baseURL: '/api',
  timeout: 5000,
  adapter: mockAdapter
})

export default request
