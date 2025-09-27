import request from '@/utils/request'

// 服务器配置相关API

export function getServerConfigList(params) {
  return request({
    url: '/server-config/list',
    method: 'get',
    params,
  })
}

export function getServerConfigDetail(id) {
  return request({
    url: `/server-config/detail/${id}`,
    method: 'get',
  })
}

export function createServerConfig(data) {
  return request({
    url: '/server-config/create',
    method: 'post',
    data,
  })
}

export function updateServerConfig(id, data) {
  return request({
    url: `/server-config/update/${id}`,
    method: 'put',
    data,
  })
}

export function deleteServerConfig(id) {
  return request({
    url: `/server-config/delete/${id}`,
    method: 'delete',
  })
}

export function setDefaultServerConfig(data) {
  return request({
    url: '/server-config/set-default',
    method: 'post',
    data,
  })
}

// 配置码相关API

export function getConfigCodeList(params) {
  return request({
    url: '/config-code/list',
    method: 'get',
    params,
  })
}

export function generateConfigCode(data) {
  return request({
    url: '/config-code/generate',
    method: 'post',
    data,
  })
}

export function batchGenerateConfigCode(data) {
  return request({
    url: '/config-code/batch-generate',
    method: 'post',
    data,
  })
}

export function deleteConfigCode(id) {
  return request({
    url: `/config-code/delete/${id}`,
    method: 'delete',
  })
}

export function getConfigCodeStats() {
  return request({
    url: '/config-code/stats',
    method: 'get',
  })
}
