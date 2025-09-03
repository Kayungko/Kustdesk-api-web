<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <el-form inline label-width="80px">
        <el-form-item :label="T('Username')">
          <el-input v-model="listQuery.username"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
          <el-button type="danger" @click="toAdd">{{ T('Add') }}</el-button>
          <el-button type="success" @click="toExport">{{ T('Export') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="list-body" shadow="hover">
      <el-table :data="listRes.list" v-loading="listRes.loading" border>
        <el-table-column prop="id" label="ID" align="center"></el-table-column>
        <el-table-column prop="username" :label="T('Username')" align="center"/>
        <el-table-column prop="email" :label="T('Email')" align="center"/>
        <el-table-column prop="nickname" :label="T('Nickname')" align="center"/>
        <el-table-column :label="T('Group')" align="center">
          <template #default="{row}">
            <span v-if="row.group_id"> <el-tag>{{ listRes.groups?.find(g => g.id === row.group_id)?.name }} </el-tag> </span>
            <span v-else> - </span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')" align="center">
          <template #default="{row}">
            <el-switch v-model="row.status"
                       :active-value="ENABLE_STATUS"
                       :inactive-value="DISABLE_STATUS"
                       @change="changeStatus(row)"
            ></el-switch>
          </template>
        </el-table-column>
        
        <!-- 新增：账户有效期显示 -->
        <el-table-column :label="T('AccountValidity')" align="center" width="200">
          <template #default="{row}">
            <div v-if="row.account_start_time || row.account_end_time">
              <div v-if="row.account_start_time" class="validity-item">
                <el-tag size="small" type="info">{{ T('Start') }}: {{ formatDateTime(row.account_start_time) }}</el-tag>
              </div>
              <div v-if="row.account_end_time" class="validity-item">
                <el-tag size="small" :type="isAccountExpired(row.account_end_time) ? 'danger' : 'success'">
                  {{ T('End') }}: {{ formatDateTime(row.account_end_time) }}
                </el-tag>
              </div>
              <div v-if="isAccountExpired(row.account_end_time)" class="expired-warning">
                <el-tag size="small" type="danger">{{ T('AccountExpired') }}</el-tag>
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="remark" :label="T('Remark')" align="center"/>
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center"/>
        <el-table-column prop="updated_at" :label="T('UpdatedAt')" align="center"/>
        <el-table-column :label="T('Actions')" align="center" width="750">
          <template #default="{row}">
            <el-button @click="toTag(row)">{{ T('UserTags') }}</el-button>
            <el-button @click="toAddressBook(row)">{{ T('UserAddressBook') }}</el-button>
            <el-button @click="toEdit(row)">{{ T('Edit') }}</el-button>
            <el-button type="warning" @click="changePass(row)">{{ T('ResetPassword') }}</el-button>
            <!-- 新增：设备管理按钮 -->
            <el-button type="info" @click="viewDevices(row)">{{ T('ViewDevices') }}</el-button>
            <el-button type="danger" @click="remove(row)">{{ T('Delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card class="list-page" shadow="hover">
      <el-pagination background
                     layout="prev, pager, next, sizes, jumper"
                     :page-sizes="[10,20,50,100]"
                     v-model:page-size="listQuery.page_size"
                     v-model:current-page="listQuery.page"
                     :total="listRes.total">
      </el-pagination>
    </el-card>

    <!-- 新增：设备管理对话框 -->
    <el-dialog v-model="devicesDialogVisible" :title="T('UserDeviceManagement')" width="80%" top="5vh">
      <template #header>
        <span>{{ T('UserDeviceManagement') }} - {{ currentUser?.username }}</span>
      </template>
      <div v-loading="devicesLoading">
        <el-table :data="currentUserDevices" border>
          <el-table-column prop="id" label="Token ID" width="80" align="center"/>
          <el-table-column :label="T('TokenPreview')" width="200" align="center">
            <template #default="{row}">
              <code>{{ row.token ? row.token.substring(0, 16) + '...' : '-' }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="T('DeviceStatus')" width="120" align="center">
            <template #default="{row}">
              <el-tag :type="getDeviceStatus(row).type">{{ getDeviceStatus(row).text }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="T('LastActiveTime')" width="150" align="center">
            <template #default="{row}">
              {{ formatLastActive(row.last_active_at) }}
            </template>
          </el-table-column>
          <el-table-column :label="T('ExpirationTime')" width="200" align="center">
            <template #default="{row}">
              <el-tag :type="row.expired_at && row.expired_at < Date.now()/1000 ? 'danger' : 'success'">
                {{ row.expired_at ? new Date(row.expired_at * 1000).toLocaleString() : '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="T('CreatedTime')" width="200" align="center">
            <template #default="{row}">
              {{ row.created_at ? new Date(row.created_at).toLocaleString() : '-' }}
            </template>
          </el-table-column>
          <el-table-column :label="T('Actions')" width="150" align="center" fixed="right">
            <template #default="{row}">
              <el-button type="danger" size="small" @click="logoutDevice(row)">
                {{ T('ForceLogout') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 设备统计信息 -->
        <div class="device-stats" style="margin-top: 20px;">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic :title="T('TotalDevices')" :value="currentUserDevices.length" />
            </el-col>
            <el-col :span="6">
              <el-statistic :title="T('OnlineDevices')" 
                          :value="currentUserDevices.filter(d => getDeviceStatus(d).type === 'success').length" />
            </el-col>
            <el-col :span="6">
              <el-statistic :title="T('ExpiredDevices')" 
                          :value="currentUserDevices.filter(d => d.expired_at && d.expired_at < Date.now()/1000).length" />
            </el-col>
            <el-col :span="6">
              <el-statistic :title="T('RecentlyActiveDevices')" 
                          :value="currentUserDevices.filter(d => getDeviceStatus(d).type === 'warning').length" />
            </el-col>
          </el-row>
          
          <!-- 设备数量限制信息 -->
          <el-row :gutter="20" style="margin-top: 20px;" v-if="deviceLimitInfo">
            <el-col :span="6">
              <el-statistic title="设备限制" :value="`${currentUserDevices.length}/${deviceLimitInfo.limit}`" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="可用槽位" :value="Math.max(0, deviceLimitInfo.limit - currentUserDevices.length)" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="最大允许" :value="deviceLimitInfo.limit" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="使用率" :value="`${Math.round((currentUserDevices.length / deviceLimitInfo.limit) * 100)}%`" />
            </el-col>
          </el-row>
          
          <!-- 设备限制类型说明 -->
          <el-row style="margin-top: 10px;" v-if="deviceLimitInfo">
            <el-col :span="24">
              <el-tag 
                :type="deviceLimitInfo.is_personal ? 'success' : 'info'"
                size="small"
              >
                {{ deviceLimitInfo.is_personal ? '个人限制' : '全局限制' }}
              </el-tag>
              <span style="margin-left: 10px; font-size: 12px; color: #909399;">
                {{ deviceLimitInfo.is_personal ? 
                  `用户个人设置：最多 ${deviceLimitInfo.limit} 个设备` : 
                  `系统全局设置：最多 ${deviceLimitInfo.limit} 个设备` 
                }}
              </span>
            </el-col>
          </el-row>
          
          <!-- 设备数量超限警告 -->
          <el-alert
            v-if="deviceLimitInfo && currentUserDevices.length >= deviceLimitInfo.limit"
            title="设备数量已达限制"
            type="warning"
            :closable="false"
            show-icon
            style="margin-top: 20px;"
          >
            <template #default>
              用户已达到最大设备数量限制 ({{ deviceLimitInfo.limit }}个)，新设备无法登录。
              <el-button type="primary" size="small" style="margin-left: 10px;" @click="showDeviceLimitHelp">
                了解更多
              </el-button>
            </template>
          </el-alert>
          
          <!-- 设备数量接近限制提醒 -->
          <el-alert
            v-if="deviceLimitInfo && currentUserDevices.length >= deviceLimitInfo.limit * 0.8 && currentUserDevices.length < deviceLimitInfo.limit"
            title="设备数量接近限制"
            type="info"
            :closable="false"
            show-icon
            style="margin-top: 20px;"
          >
            <template #default>
              当前已使用 {{ currentUserDevices.length }} 个设备槽位，还剩 {{ deviceLimitInfo.limit - currentUserDevices.length }} 个可用。
            </template>
          </el-alert>
        </div>
      </div>
      <template #footer>
        <el-button @click="devicesDialogVisible = false">{{ T('Close') }}</el-button>
        <el-button type="primary" @click="loadUserDevices(currentUser?.id)">{{ T('Refresh') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { useRepositories, useDel, useToEditOrAdd, useChangePwd } from '@/views/user/composables'
  import { T } from '@/utils/i18n'
  import { DISABLE_STATUS, ENABLE_STATUS } from '@/utils/common_options'
  import { update, getUserDevices, forceLogoutDevice } from '@/api/user'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { onMounted, watch, ref } from 'vue'
  
  //列表
  const {
    listRes,
    listQuery,
    handlerQuery,
    getList,
    getGroups,
    toExport,
  } = useRepositories()

  onMounted(getGroups)
  onMounted(getList)

  watch(() => listQuery.page, getList)
  watch(() => listQuery.page_size, handlerQuery)

  const { toEdit, toAdd, toAddressBook, toTag } = useToEditOrAdd()

  const { changePass } = useChangePwd()

  //删除
  const { del } = useDel()
  const remove = async (row) => {
    const res = await del(row.id)
    if (res) {
      getList(listQuery)
    }
  }

  const changeStatus = async (row) => {
    const res = await update(row).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList(listQuery)
    }
  }

  // 新增：账户有效期相关函数
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-'
    return new Date(dateTimeStr).toLocaleString()
  }

  const isAccountExpired = (endTime) => {
    if (!endTime) return false
    return new Date(endTime) < new Date()
  }

  // 新增：设备管理相关函数
  const devicesDialogVisible = ref(false)
  const currentUserDevices = ref([])
  const currentUser = ref(null)
  const devicesLoading = ref(false)
  const deviceLimitInfo = ref(null) // 新增：设备数量限制信息

  const viewDevices = async (row) => {
    currentUser.value = row
    devicesDialogVisible.value = true
    await loadUserDevices(row.id)
    // 尝试获取设备数量限制信息
    try {
      const res = await getUserDevices(row.id, true) // 第二个参数为 true 表示获取限制信息
      if (res && res.data) {
        deviceLimitInfo.value = res.data
      }
    } catch (error) {
      console.error('Failed to load device limit info:', error)
    }
  }

  const loadUserDevices = async (userId) => {
    devicesLoading.value = true
    try {
      const res = await getUserDevices(userId)
      if (res && res.data) {
        currentUserDevices.value = res.data
      }
    } catch (error) {
      ElMessage.error(T('FailedToLoadDevices'))
    } finally {
      devicesLoading.value = false
    }
  }

  const logoutDevice = async (device) => {
    try {
      const confirm = await ElMessageBox.confirm(
        T('ConfirmLogoutDevice'),
        T('Confirm'),
        {
          confirmButtonText: T('Confirm'),
          cancelButtonText: T('Cancel'),
          type: 'warning'
        }
      )
      
      if (confirm) {
        await forceLogoutDevice({
          user_id: currentUser.value.id,
          token_id: device.id
        })
        ElMessage.success(T('DeviceLoggedOut'))
        await loadUserDevices(currentUser.value.id)
      }
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error(T('FailedToLogoutDevice'))
      }
    }
  }

  const getDeviceStatus = (device) => {
    const now = Math.floor(Date.now() / 1000)
    if (device.expired_at && device.expired_at < now) {
      return { type: 'danger', text: T('Expired') }
    }
    if (device.last_active_at) {
      const lastActive = device.last_active_at
      const diff = now - lastActive
      if (diff < 300) { // 5分钟内
        return { type: 'success', text: T('Online') }
      } else if (diff < 3600) { // 1小时内
        return { type: 'warning', text: T('RecentlyActive') }
      } else {
        return { type: 'info', text: T('Offline') }
      }
    }
    return { type: 'info', text: T('Unknown') }
  }

  const formatLastActive = (timestamp) => {
    if (!timestamp) return '-'
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp
    
    if (diff < 60) return T('JustNow')
    if (diff < 3600) return `${Math.floor(diff / 60)}${T('MinutesAgo')}`
    if (diff < 86400) return `${Math.floor(diff / 3600)}${T('HoursAgo')}`
    return `${Math.floor(diff / 86400)}${T('DaysAgo')}`
  }

  // 新增：显示设备数量限制帮助信息
  const showDeviceLimitHelp = () => {
    ElMessageBox.info(
      `设备数量限制是指用户可以同时登录的设备数量。\n\n` +
      `1. 个人限制：用户可以在个人设置中调整，最多 ${deviceLimitInfo.value?.limit || 'N/A'} 个设备。\n` +
      `2. 全局限制：系统可以在配置文件中设置，最多 ${deviceLimitInfo.value?.limit || 'N/A'} 个设备。\n\n` +
      `当用户达到个人限制或全局限制时，新设备将无法登录。`
    )
  }

</script>

<style scoped>
.validity-item {
  margin-bottom: 4px;
}
.expired-warning {
  margin-top: 4px;
}
.device-stats {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
