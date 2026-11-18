<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑图书' : '新增图书'"
    width="560px"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="书名" prop="title">
            <el-input v-model="form.title" placeholder="请输入图书名称" maxlength="40" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="作者" prop="author">
            <el-input v-model="form.author" placeholder="请输入作者" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分类" prop="category">
            <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出版社" prop="publisher">
            <el-input v-model="form.publisher" placeholder="请输入出版社" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="价格" prop="price">
            <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="ISBN" prop="isbn">
            <el-input v-model="form.isbn" placeholder="请输入 ISBN 编号" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="简介" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入图书简介" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CATEGORIES } from '@/mock/books'
import { useBookStore } from '@/stores/book'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  book: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'success'])

const store = useBookStore()
const categories = CATEGORIES
const formRef = ref(null)
const submitting = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})
const isEdit = computed(() => !!props.book)

const emptyForm = () => ({
  title: '', author: '', category: '计算机', publisher: '',
  price: 39.9, isbn: '', description: ''
})
const form = reactive(emptyForm())

const rules = {
  title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

function setBook(book) {
  Object.assign(form, emptyForm(), book || {})
}

async function submit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await store.updateBook(props.book.id, { ...form })
      ElMessage.success('修改成功')
    } else {
      await store.createBook({ ...form, status: 'available', cover: '#4f6ef7' })
      ElMessage.success('新增成功')
    }
    emit('success')
    visible.value = false
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  Object.assign(form, emptyForm())
  formRef.value?.clearValidate()
}

defineExpose({ setBook })
</script>
