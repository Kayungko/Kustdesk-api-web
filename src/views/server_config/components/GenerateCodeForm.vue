<template>
  <div class="generate-code-form">
    <div class="server-info">
      <h4>{{ $t('SelectedServerConfig') }}</h4>
      <div class="info-item">
        <span class="label">{{ $t('ConfigName') }}:</span>
        <span class="value">{{ serverConfig.name }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ $t('Region') }}:</span>
        <span class="value">{{ serverConfig.region || '-' }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ $t('IdServer') }}:</span>
        <span class="value">{{ serverConfig.id_server }}</span>
      </div>
    </div>

    <el-divider />

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      size="default"
    >
      <el-form-item :label="$t('GenerationType')">
        <el-radio-group v-model="generateType">
          <el-radio label="single">{{ $t('SingleCode') }}</el-radio>
          <el-radio label="batch">{{ $t('BatchCodes') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item 
        v-if="generateType === 'batch'" 
        :label="$t('GenerateCount')" 
        prop="count"
      >
        <el-input-number
          v-model="form.count"
          :min="1"
          :max="100"
          controls-position="right"
          style="width: 150px"
        />
        <div class="form-tip">{{ $t('BatchCountTip') }}</div>
      </el-form-item>

      <el-form-item :label="$t('ExpirationTime')" prop="expires_at">
        <el-date-picker
          v-model="form.expires_at"
          type="datetime"
          :placeholder="$t('SelectExpirationTime')"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
        <div class="form-tip">{{ $t('ExpirationTimeTip') }}</div>
      </el-form-item>

      <el-form-item :label="$t('UsageLimit')" prop="max_usage">
        <el-input-number
          v-model="form.max_usage"
          :min="1"
          :max="10000"
          controls-position="right"
          style="width: 150px"
          :placeholder="$t('UnlimitedUsage')"
        />
        <div class="form-tip">{{ $t('UsageLimitTip') }}</div>
      </el-form-item>
    </el-form>

    <div class="form-actions">
      <el-button @click="handleCancel">{{ $t('Cancel') }}</el-button>
      <el-button 
        type="primary" 
        @click="handleGenerate" 
        :loading="generating"
      >
        {{ generateType === 'single' ? $t('GenerateCode') : $t('BatchGenerate') }}
      </el-button>
    </div>

    <!-- 生成结果 -->
    <div v-if="generatedCodes.length > 0" class="result-section">
      <el-divider />
      <h4>{{ $t('GeneratedCodes') }}</h4>
      
      <div class="result-actions">
        <el-button size="small" @click="copyAllCodes">
          {{ $t('CopyAllCodes') }}
        </el-button>
        <el-button size="small" @click="downloadCodes">
          {{ $t('DownloadCodes') }}
        </el-button>
      </div>

      <div class="codes-list">
        <div 
          v-for="(code, index) in generatedCodes" 
          :key="index"
          class="code-item"
        >
          <div class="code-text">{{ code.code }}</div>
          <div class="code-actions">
            <el-button size="small" text @click="copyCode(code.code)">
              {{ $t('Copy') }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="result-summary">
        <el-alert
          :title="$t('GenerateSuccess')"
          type="success"
          :description="generateSummaryText"
          show-icon
          :closable="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { generateConfigCode, batchGenerateConfigCode } from '@/api/server_config'
import { T } from '@/utils/i18n'

const t = T

// Props
const props = defineProps({
  serverConfig: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['success'])

// 响应式数据
const formRef = ref(null)
const generating = ref(false)
const generateType = ref('single')
const generatedCodes = ref([])

const form = reactive({
  count: 10,
  expires_at: null,
  max_usage: null
})

// 表单验证规则
const rules = reactive({
  count: [
    { required: true, message: t('GenerateCountRequired'), trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: t('GenerateCountRange'), trigger: 'blur' }
  ]
})

// 计算属性
const generateSummaryText = computed(() => {
  const count = generatedCodes.value.length
  const expiry = form.expires_at ? t('ExpiresAt', { time: form.expires_at }) : t('NeverExpires')
  const usage = form.max_usage ? t('MaxUsage', { count: form.max_usage }) : t('UnlimitedUsage')
  return t('GenerateSummary', { count, expiry, usage })
})

// 监听生成类型变化，重置表单
watch(generateType, () => {
  generatedCodes.value = []
})

// 方法
const handleGenerate = async () => {
  if (!formRef.value) return

  try {
    // 如果是批量生成，需要验证表单
    if (generateType.value === 'batch') {
      const valid = await formRef.value.validate()
      if (!valid) return
    }

    generating.value = true

    const requestData = {
      server_config_id: props.serverConfig.id,
      expires_at: form.expires_at,
      max_usage: form.max_usage
    }

    let response
    if (generateType.value === 'single') {
      response = await generateConfigCode(requestData)
      if (response.code === 200) {
        generatedCodes.value = [response.data]
      }
    } else {
      requestData.count = form.count
      response = await batchGenerateConfigCode(requestData)
      if (response.code === 200) {
        generatedCodes.value = response.data.config_codes || []
      }
    }

    ElMessage.success(t('GenerateSuccess'))
  } catch (error) {
    console.error('Generate error:', error)
    ElMessage.error(t('GenerateFailed'))
  } finally {
    generating.value = false
  }
}

const handleCancel = () => {
  emit('success')
}

const copyCode = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success(t('CopySuccess'))
  } catch (error) {
    // 降级处理
    const textArea = document.createElement('textarea')
    textArea.value = code
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success(t('CopySuccess'))
  }
}

const copyAllCodes = async () => {
  const allCodes = generatedCodes.value.map(item => item.code).join('\n')
  try {
    await navigator.clipboard.writeText(allCodes)
    ElMessage.success(t('CopyAllSuccess'))
  } catch (error) {
    const textArea = document.createElement('textarea')
    textArea.value = allCodes
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success(t('CopyAllSuccess'))
  }
}

const downloadCodes = () => {
  const content = generatedCodes.value.map((item, index) => {
    const expiry = form.expires_at || 'Never'
    const usage = form.max_usage || 'Unlimited'
    return `${index + 1}. ${item.code} (Expires: ${expiry}, Max Usage: ${usage})`
  }).join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `config-codes-${props.serverConfig.name}-${new Date().toISOString().slice(0, 10)}.txt`
  link.click()
  window.URL.revokeObjectURL(url)
  
  ElMessage.success(t('DownloadSuccess'))
}
</script>

<style lang="scss" scoped>
.generate-code-form {
  .server-info {
    background: #f8f9fa;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 16px;

    h4 {
      margin: 0 0 12px 0;
      color: #303133;
      font-size: 14px;
      font-weight: 500;
    }

    .info-item {
      display: flex;
      margin-bottom: 8px;
      font-size: 13px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: #606266;
        width: 80px;
        flex-shrink: 0;
      }

      .value {
        color: #303133;
        font-weight: 500;
      }
    }
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
  }

  .form-actions {
    text-align: right;
    padding-top: 20px;

    .el-button {
      margin-left: 10px;
    }
  }

  .result-section {
    margin-top: 20px;

    h4 {
      margin: 0 0 16px 0;
      color: #303133;
      font-size: 16px;
      font-weight: 500;
    }

    .result-actions {
      margin-bottom: 16px;

      .el-button {
        margin-right: 10px;
      }
    }

    .codes-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #dcdfe6;
      border-radius: 6px;
      margin-bottom: 16px;

      .code-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .code-text {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          color: #303133;
          background: #f5f7fa;
          padding: 4px 8px;
          border-radius: 4px;
          flex: 1;
          margin-right: 12px;
          word-break: break-all;
        }

        .code-actions {
          flex-shrink: 0;
        }
      }
    }

    .result-summary {
      :deep(.el-alert__description) {
        font-size: 13px;
        line-height: 1.5;
      }
    }
  }
}
</style>
