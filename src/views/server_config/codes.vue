<template>
  <div class="config-codes-container">
    <!-- 页头 -->
    <div class="page-header">
      <h2>{{ $t('ConfigCodeManagement') }}</h2>
      <p class="page-description">{{ $t('ConfigCodeManagementDesc') }}</p>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.total_codes || 0 }}</div>
            <div class="stat-label">{{ $t('TotalCodes') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card active">
            <div class="stat-number">{{ stats.active_codes || 0 }}</div>
            <div class="stat-label">{{ $t('ActiveCodes') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card expired">
            <div class="stat-number">{{ stats.expired_codes || 0 }}</div>
            <div class="stat-label">{{ $t('ExpiredCodes') }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card usage">
            <div class="stat-number">{{ stats.total_usage || 0 }}</div>
            <div class="stat-label">{{ $t('TotalUsage') }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-section">
        <el-input
          v-model="searchForm.code"
          :placeholder="$t('SearchConfigCode')"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.server_config_id"
          :placeholder="$t('SelectServerConfig')"
          clearable
          style="width: 200px; margin-left: 10px"
        >
          <el-option
            v-for="config in serverConfigs"
            :key="config.id"
            :label="config.name"
            :value="config.id"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch" style="margin-left: 10px">
          {{ $t('Search') }}
        </el-button>
        <el-button @click="handleReset">{{ $t('Reset') }}</el-button>
      </div>
      
      <div class="action-section">
        <el-button @click="refreshStats">
          <el-icon><Refresh /></el-icon>
          {{ $t('RefreshStats') }}
        </el-button>
      </div>
    </div>

    <!-- 配置码列表 -->
    <div class="codes-list">
      <el-table
        v-loading="loading"
        :data="codesList"
        style="width: 100%"
      >
        <el-table-column
          prop="code"
          :label="$t('ConfigCode')"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="code-cell">
              <span class="code-text">{{ row.code }}</span>
              <el-button
                size="small"
                text
                @click="copyCode(row.code)"
                class="copy-btn"
              >
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column
          :label="$t('ServerConfig')"
          width="150"
        >
          <template #default="{ row }">
            <div v-if="row.server_config">
              <div class="config-name">{{ row.server_config.name }}</div>
              <div class="config-region">{{ row.server_config.region || '-' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('Usage')"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <div class="usage-info">
              <div class="usage-count">{{ row.usage_count }}</div>
              <div class="usage-limit">
                / {{ row.max_usage || '∞' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('Status')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row)"
              size="small"
            >
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('ExpiresAt')"
          width="160"
        >
          <template #default="{ row }">
            {{ row.expires_at ? formatTime(row.expires_at) : $t('NeverExpires') }}
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('Creator')"
          width="120"
        >
          <template #default="{ row }">
            {{ row.creator ? row.creator.username : '-' }}
          </template>
        </el-table-column>

        <el-table-column
          prop="created_at"
          :label="$t('CreatedAt')"
          width="160"
        >
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('Actions')"
          width="100"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              {{ $t('Delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, DocumentCopy } from '@element-plus/icons-vue'
import {
  getConfigCodeList,
  deleteConfigCode,
  getConfigCodeStats,
  getServerConfigList
} from '@/api/server_config'
import { formatTime } from '@/utils/time'
import { T } from '@/utils/i18n'

const t = T

// 响应式数据
const loading = ref(false)
const codesList = ref([])
const serverConfigs = ref([])
const stats = ref({})

// 搜索表单
const searchForm = reactive({
  code: '',
  server_config_id: null
})

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 方法
const fetchCodesList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size,
      ...searchForm
    }
    
    const response = await getConfigCodeList(params)
    if (response.code === 200) {
      codesList.value = response.data.list || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    ElMessage.error(t('LoadDataFailed'))
    console.error('Failed to fetch codes list:', error)
  } finally {
    loading.value = false
  }
}

const fetchServerConfigs = async () => {
  try {
    const response = await getServerConfigList({ page: 1, page_size: 1000 })
    if (response.code === 200) {
      serverConfigs.value = response.data.list || []
    }
  } catch (error) {
    console.error('Failed to fetch server configs:', error)
  }
}

const fetchStats = async () => {
  try {
    const response = await getConfigCodeStats()
    if (response.code === 200) {
      stats.value = response.data || {}
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

const refreshStats = () => {
  fetchStats()
  fetchCodesList()
}

const handleSearch = () => {
  pagination.page = 1
  fetchCodesList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    code: '',
    server_config_id: null
  })
  handleSearch()
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('ConfirmDeleteConfigCode'),
      t('Warning'),
      {
        confirmButtonText: t('Confirm'),
        cancelButtonText: t('Cancel'),
        type: 'warning'
      }
    )

    await deleteConfigCode(row.id)
    ElMessage.success(t('DeleteSuccess'))
    fetchCodesList()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('DeleteFailed'))
    }
  }
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

const getStatusType = (row) => {
  const now = new Date()
  const expiresAt = row.expires_at ? new Date(row.expires_at) : null
  const isExpired = expiresAt && now > expiresAt
  const isMaxUsed = row.max_usage && row.usage_count >= row.max_usage

  if (isExpired || isMaxUsed) {
    return 'danger'
  }
  
  return 'success'
}

const getStatusText = (row) => {
  const now = new Date()
  const expiresAt = row.expires_at ? new Date(row.expires_at) : null
  const isExpired = expiresAt && now > expiresAt
  const isMaxUsed = row.max_usage && row.usage_count >= row.max_usage

  if (isExpired) {
    return t('Expired')
  }
  
  if (isMaxUsed) {
    return t('ExceededLimit')
  }
  
  return t('Active')
}

const handleSizeChange = (size) => {
  pagination.page_size = size
  pagination.page = 1
  fetchCodesList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchCodesList()
}

// 生命周期
onMounted(() => {
  fetchStats()
  fetchServerConfigs()
  fetchCodesList()
})
</script>

<style lang="scss" scoped>
.config-codes-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  
  h2 {
    margin: 0 0 8px 0;
    color: #303133;
    font-size: 20px;
    font-weight: 500;
  }
  
  .page-description {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }
}

.stats-section {
  margin-bottom: 20px;

  .stat-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    border: 1px solid #ebeef5;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

    &.active {
      border-color: #67c23a;
      background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
      color: white;
    }

    &.expired {
      border-color: #f56c6c;
      background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
      color: white;
    }

    &.usage {
      border-color: #409eff;
      background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
      color: white;
    }

    .stat-number {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  
  .search-section {
    display: flex;
    align-items: center;
  }
}

.codes-list {
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

.code-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .code-text {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    background: #f5f7fa;
    padding: 4px 8px;
    border-radius: 4px;
    flex: 1;
    margin-right: 8px;
    word-break: break-all;
  }

  .copy-btn {
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .copy-btn {
    opacity: 1;
  }
}

.config-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.config-region {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
}

.usage-info {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;

  .usage-count {
    font-weight: bold;
    color: #409eff;
  }

  .usage-limit {
    color: #909399;
    font-size: 12px;
  }
}

.pagination-wrapper {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}
</style>
