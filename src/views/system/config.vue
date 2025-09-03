<template>
  <div class="page">
    <div class="search">
      <el-form :inline="true" ref="searchForm">
        <el-form-item>
          <el-button type="primary" @click="loadConfig">{{ T('Refresh') }}</el-button>
          <el-button type="success" @click="saveConfig" :loading="saving">{{ T('Save') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-content">
      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span>{{ T('AppConfig') }}</span>
          </div>
        </template>
        
        <el-form :model="configForm" label-width="200px" ref="configFormRef">
          <!-- 设备管理配置 -->
          <el-divider content-position="left">
            <el-icon><Monitor /></el-icon>
            {{ T('DeviceManagementConfig') }}
          </el-divider>
          
          <el-form-item :label="T('MaxConcurrentDevices')" prop="max_concurrent_devices">
            <el-input-number 
              v-model="configForm.max_concurrent_devices" 
              :min="0" 
              :max="100"
              :step="1"
              style="width: 200px;"
            />
            <div class="form-tip">
              {{ T('MaxConcurrentDevicesTip') }}
            </div>
          </el-form-item>
          
          <!-- 注册配置 -->
          <el-divider content-position="left">
            <el-icon><UserFilled /></el-icon>
            {{ T('UserRegistrationConfig') }}
          </el-divider>
          
          <el-form-item :label="T('EnableUserRegistration')" prop="register">
            <el-switch v-model="configForm.register" />
            <div class="form-tip">
              {{ T('EnableUserRegistrationTip') }}
            </div>
          </el-form-item>
          
          <el-form-item :label="T('DefaultRegistrationStatus')" prop="register_status">
            <el-select v-model="configForm.register_status" style="width: 200px;">
              <el-option :label="T('Enabled')" :value="1" />
              <el-option :label="T('Disabled')" :value="2" />
            </el-select>
            <div class="form-tip">
              {{ T('DefaultRegistrationStatusTip') }}
            </div>
          </el-form-item>
          
          <!-- 安全配置 -->
          <el-divider content-position="left">
            <el-icon><Lock /></el-icon>
            {{ T('SecurityConfig') }}
          </el-divider>
          
          <el-form-item :label="T('CaptchaThreshold')" prop="captcha_threshold">
            <el-input-number 
              v-model="configForm.captcha_threshold" 
              :min="-1" 
              :max="10"
              :step="1"
              style="width: 200px;"
            />
            <div class="form-tip">
              {{ T('CaptchaThresholdTip') }}
            </div>
          </el-form-item>
          
          <el-form-item :label="T('BanThreshold')" prop="ban_threshold">
            <el-input-number 
              v-model="configForm.ban_threshold" 
              :min="0" 
              :max="20"
              :step="1"
              style="width: 200px;"
            />
            <div class="form-tip">
              {{ T('BanThresholdTip') }}
            </div>
          </el-form-item>
          
          <el-form-item :label="T('DisablePasswordLogin')" prop="disable_pwd_login">
            <el-switch v-model="configForm.disable_pwd_login" />
            <div class="form-tip">
              {{ T('DisablePasswordLoginTip') }}
            </div>
          </el-form-item>
          
          <!-- Web客户端配置 -->
          <el-divider content-position="left">
            <el-icon><Monitor /></el-icon>
            {{ T('WebClientConfig') }}
          </el-divider>
          
          <el-form-item :label="T('EnableWebClient')" prop="web_client">
            <el-select v-model="configForm.web_client" style="width: 200px;">
              <el-option :label="T('Enabled')" :value="1" />
              <el-option :label="T('Disabled')" :value="0" />
            </el-select>
            <div class="form-tip">
              {{ T('EnableWebClientTip') }}
            </div>
          </el-form-item>
          
          <el-form-item :label="T('WebSSO')" prop="web_sso">
            <el-switch v-model="configForm.web_sso" />
            <div class="form-tip">
              {{ T('WebSSOTip') }}
            </div>
          </el-form-item>
          
          <!-- Token配置 -->
          <el-divider content-position="left">
            <el-icon><Ticket /></el-icon>
            {{ T('TokenConfig') }}
          </el-divider>
          
          <el-form-item :label="T('TokenExpire')" prop="token_expire">
            <el-input 
              v-model="configForm.token_expire" 
              style="width: 200px;"
              placeholder="例如: 168h"
            />
            <div class="form-tip">
              {{ T('TokenExpireTip') }}
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, UserFilled, Lock, Ticket } from '@element-plus/icons-vue'
import { T } from '@/utils/i18n'
import { getSystemConfig, updateSystemConfig } from '@/api/system'

const configForm = ref({
  max_concurrent_devices: 3,
  register: false,
  register_status: 1,
  captcha_threshold: 3,
  ban_threshold: 0,
  disable_pwd_login: false,
  web_client: 1,
  web_sso: true,
  token_expire: '168h'
})

const saving = ref(false)
const configFormRef = ref()

const loadConfig = async () => {
  try {
    const res = await getSystemConfig()
    if (res && res.data) {
      Object.assign(configForm.value, res.data)
    }
  } catch (error) {
    ElMessage.error(T('ConfigLoadFailed'))
  }
}

const saveConfig = async () => {
  if (saving.value) return
  
      try {
    await ElMessageBox.confirm(
      T('ConfigSaveConfirm'),
      T('ConfigSaveTitle'),
      {
        confirmButtonText: T('Save'),
        cancelButtonText: T('Cancel'),
        type: 'warning'
      }
    )
    
    saving.value = true
    await updateSystemConfig(configForm.value)
    ElMessage.success(T('ConfigSaveSuccess'))
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(T('ConfigSaveFailed'))
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.el-divider {
  margin: 30px 0 20px 0;
}

.el-divider .el-divider__text {
  font-weight: 600;
  color: #409eff;
}
</style>
