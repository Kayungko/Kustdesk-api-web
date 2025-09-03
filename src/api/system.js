import request from '@/utils/request'

// 获取系统配置
export function getSystemConfig () {
  return request({
    url: '/system/config',
    method: 'get',
  })
}

// 更新系统配置
export function updateSystemConfig (data) {
  return request({
    url: '/system/config',
    method: 'put',
    data,
  })
}

// 获取系统状态
export function getSystemStatus () {
  return request({
    url: '/system/status',
    method: 'get',
  })
}

// 获取用户统计信息
export function getUserStatistics () {
  return request({
    url: '/system/statistics/users',
    method: 'get',
  })
}

// 获取设备统计信息
export function getDeviceStatistics () {
  return request({
    url: '/system/statistics/devices',
    method: 'get',
  })
}
