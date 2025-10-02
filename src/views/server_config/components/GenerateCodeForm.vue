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

      <!-- 分享方式 -->
      <el-divider />
      <h4>{{ $t('ShareMethods') }}</h4>
      <div class="share-section">
        <div class="share-buttons">
          <el-button @click="shareViaEmail" :icon="Message">
            {{ $t('SendByEmail') }}
          </el-button>
          <el-button @click="shareViaQR" :icon="QrCode">
            {{ $t('ShowQRCode') }}
          </el-button>
          <el-button @click="printCodes" :icon="Printer">
            {{ $t('PrintCodes') }}
          </el-button>
        </div>
      </div>

      <!-- 安全提示 -->
      <div class="security-tips">
        <el-alert
          type="warning"
          :closable="false"
          show-icon
        >
          <template #title>
            <strong>{{ $t('SecurityTips') }}</strong>
          </template>
          <ul class="tips-list">
            <li>{{ $t('CodeOnlyContainsServerInfo') }}</li>
            <li>{{ $t('SendViaSafeChannel') }}</li>
            <li>{{ $t('UserNeedsToLogin') }}</li>
          </ul>
        </el-alert>
      </div>
    </div>

    <!-- 二维码对话框 -->
    <el-dialog
      v-model="qrDialogVisible"
      :title="$t('ConfigCodeQRCode')"
      width="400px"
    >
      <div class="qr-code-container">
        <div ref="qrCodeRef" class="qr-code"></div>
        <div class="qr-tip">
          {{ $t('ScanQRCodeToGetConfig') }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Message, QrCode, Printer } from '@element-plus/icons-vue'
import { generateConfigCode, batchGenerateConfigCode } from '@/api/server_config'
import { T } from '@/utils/i18n'
import QRCode from 'qrcode'

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
const qrDialogVisible = ref(false)
const qrCodeRef = ref(null)

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

// 邮件分享
const shareViaEmail = () => {
  if (generatedCodes.value.length === 0) return
  
  const codes = generatedCodes.value.map(item => item.code).join('\n')
  const subject = `RustDesk ${t('ConfigCode')} - ${props.serverConfig.name}`
  const body = `${t('ServerConfig')}: ${props.serverConfig.name}\n\n${t('ConfigCodes')}:\n${codes}\n\n${t('Expiry')}: ${form.expires_at || t('NeverExpires')}\n${t('MaxUsage')}: ${form.max_usage || t('Unlimited')}\n\n${t('SecurityTips')}:\n- ${t('CodeOnlyContainsServerInfo')}\n- ${t('UserNeedsToLogin')}`
  
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = mailtoLink
}

// 显示二维码
const shareViaQR = async () => {
  if (generatedCodes.value.length === 0) return
  
  qrDialogVisible.value = true
  
  await nextTick()
  
  try {
    // 如果有多个配置码，显示第一个
    const code = generatedCodes.value[0].code
    
    // 清空之前的二维码
    if (qrCodeRef.value) {
      qrCodeRef.value.innerHTML = ''
      
      // 生成新的二维码
      const canvas = document.createElement('canvas')
      qrCodeRef.value.appendChild(canvas)
      
      await QRCode.toCanvas(canvas, code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    }
  } catch (error) {
    console.error('QR Code generation error:', error)
    ElMessage.error(t('QRCodeGenerationFailed'))
  }
}

// 打印配置码
const printCodes = () => {
  if (generatedCodes.value.length === 0) return
  
  const printWindow = window.open('', '_blank')
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${t('ConfigCodes')} - ${props.serverConfig.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          line-height: 1.6;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #2C8CFF;
          padding-bottom: 10px;
        }
        .info {
          background: #f5f7fa;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .info p {
          margin: 5px 0;
        }
        .code-list {
          margin: 20px 0;
        }
        .code-item {
          background: #fff;
          border: 1px solid #ddd;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
          word-break: break-all;
          font-family: 'Courier New', monospace;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${t('RustDesk')} ${t('ConfigCodes')}</h1>
      
      <div class="info">
        <p><strong>${t('ServerConfig')}:</strong> ${props.serverConfig.name}</p>
        <p><strong>${t('GeneratedTime')}:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>${t('Expiry')}:</strong> ${form.expires_at || t('NeverExpires')}</p>
        <p><strong>${t('MaxUsage')}:</strong> ${form.max_usage || t('Unlimited')}</p>
      </div>
      
      <div class="code-list">
        <h3>${t('ConfigCodes')}:</h3>
        ${generatedCodes.value.map((item, index) => `
          <div class="code-item">
            <strong>${index + 1}.</strong> ${item.code}
          </div>
        `).join('')}
      </div>
      
      <div class="footer">
        <p><strong>${t('SecurityTips')}:</strong></p>
        <ul>
          <li>${t('CodeOnlyContainsServerInfo')}</li>
          <li>${t('SendViaSafeChannel')}</li>
          <li>${t('UserNeedsToLogin')}</li>
        </ul>
        <p>${t('GeneratedBy')}: ${props.serverConfig.name} | ${new Date().toLocaleString()}</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `
  
  printWindow.document.write(content)
  printWindow.document.close()
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

  .share-section {
    margin: 16px 0;

    .share-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      .el-button {
        flex: 1;
        min-width: 120px;
      }
    }
  }

  .security-tips {
    margin-top: 16px;

    .tips-list {
      margin: 8px 0 0 0;
      padding-left: 20px;
      
      li {
        margin: 4px 0;
        line-height: 1.5;
      }
    }
  }
}

.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;

  .qr-code {
    margin-bottom: 16px;
    
    canvas {
      display: block;
    }
  }

  .qr-tip {
    text-align: center;
    color: #606266;
    font-size: 14px;
  }
}
}
</style>
