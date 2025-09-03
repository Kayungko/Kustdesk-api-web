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
            设备管理配置
          </el-divider>
          
          <el-form-item label="最大并发设备数" prop="max_concurrent_devices">
            <el-input-number 
              v-model="configForm.max_concurrent_devices" 
              :min="0" 
              :max="100"
              :step="1"
              style="width: 200px;"
            />
            <div class="form-tip">
              设置为 0 表示无限制，大于 0 表示每个用户最多可同时登录的设备数量
            </div>
          </el-form-item>
          
          <!-- 注册配置 -->
          <el-divider content-position="left">
            <el-icon><UserFilled /></el-icon>
            用户注册配置
          </el-divider>
          
          <el-form-item label="开启用户注册" prop="register">
            <el-switch v-model="configForm.register" />
            <div class="form-tip">
              是否允许新用户注册账户
            </div>
          </el-form-item>
          
          <el-form-item label="注册用户默认状态" prop="register_status">
            <el-select v-model="configForm.register_status" style="width: 200px;">
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="2" />
            </el-select>
            <div class="form-tip">
              新注册用户的默认状态
            </div>
          </el-form-item>
          
          <!-- 安全配置 -->
          <el-divider content-position="left">
            <el-icon><Lock /></el-icon>
            安全配置
          </el-divider>
          
          <el-form-item label="验证码阈值" prop="captcha_threshold">
            <el-input-number 
              v-model="configForm.captcha_threshold" 
              :min="-1" 
              :max="10"
              :step="1"
              style="width: 200px;"
            />
            <div class="form-tip">
              -1:禁用验证码, 0:总是显示, >0:失败次数达到阈值后显示
            </div>
          </el-form-item>
          
          <el-form-item label="封禁阈值" prop="ban_threshold">
            <el-input-number 
              v-model="configForm.ban_threshold" 
              :min="0" 
              :max="20"
              :step="1"
              style="width: 200px;"
            />
            <div class="form-tip">
              0:禁用封禁, >0:失败次数达到阈值后临时封禁IP
            </div>
          </el-form-item>
          
          <el-form-item label="禁用密码登录" prop="disable_pwd_login">
            <el-switch v-model="configForm.disable_pwd_login" />
            <div class="form-tip">
              启用后只能通过OAuth登录
            </div>
          </el-form-item>
          
          <!-- Web客户端配置 -->
          <el-divider content-position="left">
            <el-icon><Monitor /></el-icon>
            Web客户端配置
          </el-divider>
          
          <el-form-item label="启用Web客户端" prop="web_client">
            <el-select v-model="configForm.web_client" style="width: 200px;">
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
            <div class="form-tip">
              是否启用Web客户端功能
            </div>
          </el-form-item>
          
          <el-form-item label="Web单点登录" prop="web_sso">
            <el-switch v-model="configForm.web_sso" />
            <div class="form-tip">
              是否启用Web认证单点登录
            </div>
          </el-form-item>
          
          <!-- Token配置 -->
          <el-divider content-position="left">
            <el-icon><Ticket /></el-icon>
            Token配置
          </el-divider>
          
          <el-form-item label="Token过期时间" prop="token_expire">
            <el-input 
              v-model="configForm.token_expire" 
              style="width: 200px;"
              placeholder="例如: 168h"
            />
            <div class="form-tip">
              Token的有效期，格式：数字+单位(h=小时,m=分钟)，例如：168h
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
    ElMessage.error('加载配置失败')
  }
}

const saveConfig = async () => {
  if (saving.value) return
  
  try {
    await ElMessageBox.confirm(
      '确认保存这些配置更改吗？某些配置可能需要重启服务后生效。',
      '确认保存',
      {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    saving.value = true
    await updateSystemConfig(configForm.value)
    ElMessage.success('配置保存成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('保存配置失败')
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
