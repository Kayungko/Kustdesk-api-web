<template>
  <div class="form-card">
    <el-form ref="root" label-width="120px" :model="form" :rules="rules">
      <el-form-item :label="T('Username')" prop="username">
        <el-input v-model="form.username"></el-input>
      </el-form-item>
      <el-form-item :label="T('Email')" prop="email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item :label="T('Nickname')" prop="nickname">
        <el-input v-model="form.nickname"></el-input>
      </el-form-item>
      <el-form-item :label="T('Group')" prop="group_id">
        <el-select v-model="form.group_id">
          <el-option
              v-for="item in groupsList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="T('IsAdmin')" prop="is_admin">
        <el-switch v-model="form.is_admin"
                   :active-value="true"
                   :inactive-value="false"
        ></el-switch>
      </el-form-item>
      <el-form-item :label="T('Status')" prop="status">
        <el-switch v-model="form.status"
                   :active-value="ENABLE_STATUS"
                   :inactive-value="DISABLE_STATUS"
        ></el-switch>
      </el-form-item>

      <!-- 新增：账户时间管理 -->
      <el-form-item :label="T('AccountStartTime')" prop="account_start_time">
        <el-date-picker
          v-model="form.account_start_time"
          type="datetime"
          :placeholder="T('SelectStartTime')"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          clearable
        />
        <div class="form-tip">{{ T('AccountStartTimeTip') }}</div>
      </el-form-item>

      <el-form-item :label="T('AccountEndTime')" prop="account_end_time">
        <el-date-picker
          v-model="form.account_end_time"
          type="datetime"
          :placeholder="T('SelectEndTime')"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          clearable
        />
        <div class="form-tip">{{ T('AccountEndTimeTip') }}</div>
      </el-form-item>

      <!-- 新增：个人设备数量限制 -->
      <el-form-item :label="T('MaxDevices')" prop="max_devices">
        <el-input-number
          v-model="form.max_devices"
          :min="0"
          :max="100"
          :step="1"
          :placeholder="T('UseGlobalSetting')"
          clearable
        />
        <div class="form-tip">
          {{ T('MaxDevicesTip') }}
          <br/>
          {{ T('MaxDevicesTip2') }}
        </div>
      </el-form-item>

      <el-form-item :label="T('Remark')" prop="remark">
          <el-input v-model="form.remark"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="cancel">{{ T('Cancel') }}</el-button>
        <el-button @click="submit" type="primary">{{ T('Submit') }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
  import { useRoute } from 'vue-router'
  import { useGetDetail, useSubmit } from '@/views/user/composables/edit'
  import { ENABLE_STATUS, DISABLE_STATUS } from '@/utils/common_options'
  import { T } from '@/utils/i18n'

  const route = useRoute()
  const { form, item, getDetail, groupsList } = useGetDetail(route.params.id)

  const { root, rules, validate, submit, cancel } = useSubmit(form, route.params.id)

</script>

<style lang="scss" scoped>
.form-card {
}
</style>
