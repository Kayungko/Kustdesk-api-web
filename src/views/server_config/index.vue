<template>
  <div class="server-config-container">
    <!-- 页头 -->
    <div class="page-header">
      <h2>{{ $t('ServerConfigManagement') }}</h2>
      <p class="page-description">{{ $t('ServerConfigManagementDesc') }}</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-section">
        <el-input
          v-model="searchForm.name"
          :placeholder="$t('SearchConfigName')"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.region"
          :placeholder="$t('SelectRegion')"
          clearable
          style="width: 150px; margin-left: 10px"
        >
          <el-option label="华东" value="east" />
          <el-option label="华北" value="north" />
          <el-option label="华南" value="south" />
          <el-option label="华西" value="west" />
        </el-select>
        <el-select
          v-model="searchForm.is_enabled"
          :placeholder="$t('SelectStatus')"
          clearable
          style="width: 120px; margin-left: 10px"
        >
          <el-option :label="$t('Enabled')" :value="true" />
          <el-option :label="$t('Disabled')" :value="false" />
        </el-select>
        <el-button type="primary" @click="handleSearch" style="margin-left: 10px">
          {{ $t('Search') }}
        </el-button>
        <el-button @click="handleReset">{{ $t('Reset') }}</el-button>
      </div>
      
      <div class="action-section">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          {{ $t('CreateServerConfig') }}
        </el-button>
      </div>
    </div>

    <!-- 配置列表 -->
    <div class="config-list">
      <el-table
        v-loading="loading"
        :data="configList"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column
          prop="name"
          :label="$t('ConfigName')"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="region"
          :label="$t('Region')"
          width="100"
        />
        <el-table-column
          :label="$t('ServerInfo')"
          min-width="200"
        >
          <template #default="{ row }">
            <div class="server-info">
              <div><strong>ID:</strong> {{ row.id_server }}</div>
              <div v-if="row.relay_server"><strong>Relay:</strong> {{ row.relay_server }}</div>
              <div v-if="row.api_server"><strong>API:</strong> {{ row.api_server }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('Status')"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag v-if="row.is_default" type="warning" size="small">
              {{ $t('Default') }}
            </el-tag>
            <el-tag 
              :type="row.is_enabled ? 'success' : 'danger'" 
              size="small"
              :style="{ marginLeft: row.is_default ? '5px' : '0' }"
            >
              {{ row.is_enabled ? $t('Enabled') : $t('Disabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="priority"
          :label="$t('Priority')"
          width="80"
          sortable="custom"
          align="center"
        />
        <el-table-column
          prop="created_at"
          :label="$t('CreatedAt')"
          width="160"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('Actions')"
          width="200"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleGenerateCode(row)"
            >
              {{ $t('GenerateCode') }}
            </el-button>
            <el-dropdown @command="(command) => handleMoreAction(command, row)">
              <el-button size="small">
                {{ $t('More') }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">{{ $t('Edit') }}</el-dropdown-item>
                  <el-dropdown-item 
                    command="setDefault" 
                    :disabled="row.is_default"
                  >
                    {{ $t('SetAsDefault') }}
                  </el-dropdown-item>
                  <el-dropdown-item 
                    command="delete" 
                    :disabled="row.is_default"
                  >
                    {{ $t('Delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <ServerConfigForm
        ref="serverConfigFormRef"
        :form-data="formData"
        :is-edit="isEdit"
        @submit="handleFormSubmit"
      />
    </el-dialog>

    <!-- 生成配置码对话框 -->
    <el-dialog
      v-model="codeDialogVisible"
      :title="$t('GenerateConfigCode')"
      width="500px"
    >
      <GenerateCodeForm
        ref="generateCodeFormRef"
        :server-config="selectedConfig"
        @success="handleCodeGenerated"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import {
  getServerConfigList,
  deleteServerConfig,
  setDefaultServerConfig
} from '@/api/server_config'
import { formatTime } from '@/utils/time'
import { T } from '@/utils/i18n'
import ServerConfigForm from './components/ServerConfigForm.vue'
import GenerateCodeForm from './components/GenerateCodeForm.vue'

const t = T

// 响应式数据
const loading = ref(false)
const configList = ref([])
const dialogVisible = ref(false)
const codeDialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({})
const selectedConfig = ref({})

// 搜索表单
const searchForm = reactive({
  name: '',
  region: '',
  is_enabled: null
})

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? t('EditServerConfig') : t('CreateServerConfig')
})

// 组件引用
const serverConfigFormRef = ref(null)
const generateCodeFormRef = ref(null)

// 方法
const fetchConfigList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size,
      ...searchForm
    }
    
    const response = await getServerConfigList(params)
    if (response.code === 200) {
      configList.value = response.data.list || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    ElMessage.error(t('LoadDataFailed'))
    console.error('Failed to fetch config list:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchConfigList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    region: '',
    is_enabled: null
  })
  handleSearch()
}

const handleCreate = () => {
  isEdit.value = false
  formData.value = {}
  dialogVisible.value = true
}

const handleMoreAction = async (command, row) => {
  switch (command) {
    case 'edit':
      handleEdit(row)
      break
    case 'setDefault':
      await handleSetDefault(row)
      break
    case 'delete':
      await handleDelete(row)
      break
  }
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleSetDefault = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('ConfirmSetDefaultConfig'),
      t('Warning'),
      {
        confirmButtonText: t('Confirm'),
        cancelButtonText: t('Cancel'),
        type: 'warning'
      }
    )

    await setDefaultServerConfig({ server_config_id: row.id })
    ElMessage.success(t('SetDefaultSuccess'))
    fetchConfigList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('SetDefaultFailed'))
    }
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('ConfirmDeleteConfig'),
      t('Warning'),
      {
        confirmButtonText: t('Confirm'),
        cancelButtonText: t('Cancel'),
        type: 'warning'
      }
    )

    await deleteServerConfig(row.id)
    ElMessage.success(t('DeleteSuccess'))
    fetchConfigList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('DeleteFailed'))
    }
  }
}

const handleGenerateCode = (row) => {
  selectedConfig.value = row
  codeDialogVisible.value = true
}

const handleFormSubmit = () => {
  ElMessage.success(t('OperationSuccess'))
  dialogVisible.value = false
  fetchConfigList()
}

const handleCodeGenerated = () => {
  codeDialogVisible.value = false
}

const handleDialogClose = () => {
  if (serverConfigFormRef.value) {
    serverConfigFormRef.value.resetForm()
  }
}

const handleSortChange = ({ column, prop, order }) => {
  // 处理排序
  console.log('Sort change:', { column, prop, order })
}

const handleSizeChange = (size) => {
  pagination.page_size = size
  pagination.page = 1
  fetchConfigList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchConfigList()
}

// 生命周期
onMounted(() => {
  fetchConfigList()
})
</script>

<style lang="scss" scoped>
.server-config-container {
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

.config-list {
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

.server-info {
  font-size: 12px;
  line-height: 1.4;
  
  div {
    margin-bottom: 2px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  strong {
    color: #409eff;
  }
}

.pagination-wrapper {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}
</style>
