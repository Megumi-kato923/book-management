import Mock from 'mockjs'

const { Random } = Mock

const CATEGORIES = ['计算机', '文学', '历史', '科学', '经济', '艺术', '教育', '生活']

// 书名 / 分类 / 作者一一对应；作者均为与该书真实匹配的教材作者或名著作者
const SEED_BOOKS = [
  { title: 'Vue.js 前端开发实战', category: '计算机', author: '黑马程序员' },
  { title: '数据结构与算法', category: '计算机', author: '严蔚敏' },
  { title: '计算机网络', category: '计算机', author: '谢希仁' },
  { title: '数据库系统原理', category: '计算机', author: '王珊' },
  { title: '人工智能导论', category: '计算机', author: '李德毅' },
  { title: 'Python 编程基础', category: '计算机', author: '董付国' },
  { title: '文学经典导读', category: '文学', author: '朱自清' },
  { title: '围城', category: '文学', author: '钱钟书' },
  { title: '鲁迅小说集', category: '文学', author: '鲁迅' },
  { title: '中国近现代史纲要', category: '历史', author: '徐蓝' },
  { title: '世界史纲', category: '历史', author: '吴于廑' },
  { title: '大学物理学', category: '科学', author: '张三慧' },
  { title: '线性代数及其应用', category: '科学', author: '李永乐' },
  { title: '经济学原理', category: '经济', author: '曼昆' },
  { title: '管理学基础', category: '经济', author: '周三多' },
  { title: '摄影艺术教程', category: '艺术', author: '张益福' },
  { title: '音乐鉴赏', category: '艺术', author: '王次炤' },
  { title: '大学英语', category: '教育', author: '李荫华' },
  { title: '心理学与生活', category: '生活', author: '津巴多' },
  { title: '健康饮食指南', category: '生活', author: '范志红' }
]

const PUBLISHERS = ['人民邮电出版社', '机械工业出版社', '电子工业出版社', '清华大学出版社', '北京大学出版社']

let seed = 1000

// 生成 [start, end] 之间的随机日期字符串 YYYY-MM-DD
function randomDate(start, end) {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const d = new Date(s + Math.random() * (e - s))
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function createBook(item) {
  seed += 1
  const status = Random.pick(['available', 'available', 'available', 'borrowed'])
  const borrowDate = status === 'borrowed' ? randomDate('2026-09-01', '2026-11-18') : ''
  return {
    id: String(seed),
    isbn: `978-7-${Random.integer(10000000, 99999999)}`,
    title: item.title,
    author: item.author,
    publisher: Random.pick(PUBLISHERS),
    category: item.category,
    price: Random.float(29, 128, 1, 2),
    description: Random.pick([
      '本书内容详实，条理清晰，适合作为课程教材与自学参考。',
      '系统讲解核心知识，配有大量实例，帮助读者快速上手。',
      '经典著作，深入剖析原理，兼具理论深度与实用价值。',
      '面向初学者与进阶读者，案例丰富，通俗易懂。'
    ]),
    cover: Random.pick(['#5b6ef5', '#f0a020', '#18a058', '#e0529c', '#409eff', '#8a63d2']),
    status,
    borrower: status === 'borrowed' ? Random.pick(['张三', '李四', '王五', '赵六', '孙七']) : '',
    borrowDate,
    createdAt: randomDate('2025-01-01', '2026-10-31')
  }
}

// 用 Mock.js 生成 20 条初始模拟数据
export function generateBooks() {
  return SEED_BOOKS.map(createBook)
}

export { CATEGORIES }
