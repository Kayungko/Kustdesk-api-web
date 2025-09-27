<template>
  <div class="server-config-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      size="default"
    >
      <el-form-item :label="$t('ConfigName')" prop="name">
        <el-input
          v-model="form.name"
          :placeholder="$t('EnterConfigName')"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item :label="$t('Description')" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :placeholder="$t('EnterDescription')"
          :rows="3"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item :label="$t('Region')" prop="region">
        <el-select
          v-model="form.region"
          :placeholder="$t('SelectRegion')"
          style="width: 100%"
          allow-create
          filterable
        >
          <el-option label="华东" value="east" />
          <el-option label="华北" value="north" />
          <el-option label="华南" value="south" />
          <el-option label="华西" value="west" />
          <el-option label="海外" value="overseas" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">{{ $t('ServerSettings') }}</el-divider>

      <el-form-item :label="$t('IdServer')" prop="id_server">
        <el-input
          v-model="form.id_server"
          :placeholder="$t('EnterIdServer')"
          maxlength="255"
        >
          <template #append>:21116</template>
        </el-input>
        <div class="form-tip">{{ $t('IdServerTip') }}</div>
      </el-form-item>

      <el-form-item :label="$t('RelayServer')" prop="relay_server">
        <el-input
          v-model="form.relay_server"
          :placeholder="$t('EnterRelayServer')"
          maxlength="255"
        >
          <template #append>:21117</template>
        </el-input>
        <div class="form-tip">{{ $t('RelayServerTip') }}</div>
      </el-form-item>

      <el-form-item :label="$t('ApiServer')" prop="api_server">
        <el-input
          v-model="form.api_server"
          :placeholder="$t('EnterApiServer')"
          maxlength="255"
        />
        <div class="form-tip">{{ $t('ApiServerTip') }}</div>
      </el-form-item>

      <el-form-item :label="$t('ServerKey')" prop="key">
        <el-input
          v-model="form.key"
          type="textarea"
          :placeholder="$t('EnterServerKey')"
          :rows="3"
          maxlength="500"
          show-word-limit
        />
        <div class="form-tip">{{ $t('ServerKeyTip') }}</div>
      </el-form-item>

      <el-divider content-position="left">{{ $t('ConfigSettings') }}</el-divider>

      <el-form-item :label="$t('Priority')" prop="priority">
        <el-input-number
          v-model="form.priority"
          :min="0"
          :max="9999"
          controls-position="right"
          style="width: 150px"
        />
        <div class="form-tip">{{ $t('PriorityTip') }}</div>
      </el-form-item>

      <el-form-item :label="$t('Status')" prop="is_enabled">
        <el-switch
          v-model="form.is_enabled"
          :active-text="$t('Enabled')"
          :inactive-text="$t('Disabled')"
        />
      </el-form-item>

      <el-form-item :label="$t('SetAsDefault')" prop="is_default">
        <el-switch
          v-model="form.is_default"
          :active-text="$t('Yes')"
          :inactive-text="$t('No')"
        />
        <div class="form-tip">{{ $t('DefaultConfigTip') }}</div>
      </el-form-item>
    </el-form>

    <div class="form-actions">
      <el-button @click="handleCancel">{{ $t('Cancel') }}</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        {{ $t('Submit') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { createServerConfig, updateServerConfig } from '@/api/server_config'
import { T } from '@/utils/i18n'

const t = T

// Props
const props = defineProps({
  formData: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['submit'])

// 响应式数据
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  name: '',
  description: '',
  region: '',
  id_server: '',
  relay_server: '',
  api_server: '',
  key: '',
  priority: 0,
  is_enabled: true,
  is_default: false
})

// 表单验证规则
const rules = reactive({
  name: [
    { required: true, message: t('ConfigNameRequired'), trigger: 'blur' },
    { min: 1, max: 100, message: t('ConfigNameLength'), trigger: 'blur' }
  ],
  description: [
    { max: 500, message: t('DescriptionLength'), trigger: 'blur' }
  ],
  region: [
    { max: 50, message: t('RegionLength'), trigger: 'blur' }
  ],
  id_server: [
    { required: true, message: t('IdServerRequired'), trigger: 'blur' },
    { max: 255, message: t('IdServerLength'), trigger: 'blur' }
  ],
  relay_server: [
    { max: 255, message: t('RelayServerLength'), trigger: 'blur' }
  ],
  api_server: [
    { max: 255, message: t('ApiServerLength'), trigger: 'blur' },
    {
      pattern: /^(https?:\/\/|$)/,
      message: t('ApiServerFormat'),
      trigger: 'blur'
    }
  ],
  key: [
    { max: 500, message: t('ServerKeyLength'), trigger: 'blur' }
  ],
  priority: [
    { type: 'number', min: 0, max: 9999, message: t('PriorityRange'), trigger: 'blur' }
  ]
})

// 监听 formData 变化
watch(
  () => props.formData,
  (newData) => {
    if (newData && Object.keys(newData).length > 0) {
      Object.assign(form, {
        name: newData.name || '',
        description: newData.description || '',
        region: newData.region || '',
        id_server: newData.id_server || '',
        relay_server: newData.relay_server || '',
        api_server: newData.api_server || '',
        key: newData.key || '',
        priority: newData.priority || 0,
        is_enabled: newData.is_enabled !== undefined ? newData.is_enabled : true,
        is_default: newData.is_default !== undefined ? newData.is_default : false
      })
    }
  },
  { immediate: true, deep: true }
)

// 方法
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    submitting.value = true

    const submitData = { ...form }
    
    if (props.isEdit) {
      await updateServerConfig(props.formData.id, submitData)
      ElMessage.success(t('UpdateSuccess'))
    } else {
      await createServerConfig(submitData)
      ElMessage.success(t('CreateSuccess'))
    }

    emit('submit')
  } catch (error) {
    console.error('Submit error:', error)
    ElMessage.error(t('OperationFailed'))
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  resetForm()
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    name: '',
    description: '',
    region: '',
    id_server: '',
    relay_server: '',
    api_server: '',
    key: '',
    priority: 0,
    is_enabled: true,
    is_default: false
  })
}

// 暴露方法
defineExpose({
  resetForm
})
</script>

<style lang="scss" scoped>
.server-config-form {
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
  }

  .form-actions {
    text-align: right;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
    margin-top: 20px;

    .el-button {
      margin-left: 10px;
    }
  }

  :deep(.el-divider__text) {
    font-weight: 500;
    color: #303133;
  }

  :deep(.el-input-group__append) {
    color: #909399;
    background-color: #f5f7fa;
  }
}
</style>
