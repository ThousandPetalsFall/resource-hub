// 工具函数 - 云函数调用封装（微信小程序 + 支付宝云）
// 环境ID
const CLOUD_ENV = 'env-00jy61kgq0gk'

// 调用云函数
function callCloudFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.init({
      env: CLOUD_ENV
    })

    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        resolve(res.result || {})
      },
      fail: (err) => {
        console.error(`云函数 ${name} 调用失败`, err)
        reject(err)
      }
    })
  })
}

// 登录
export function login() {
  return callCloudFunction('login', {})
}

// 搜索资源
export function searchResources(params) {
  return callCloudFunction('searchResources', params)
}

// 上传资源
export function uploadResource(params) {
  return callCloudFunction('uploadResource', params)
}

// 获取资源链接
export function getResource(params) {
  return callCloudFunction('getResource', params)
}

// 看广告
export function watchAd(params) {
  return callCloudFunction('watchAd', params)
}

// 兑换免广告
export function exchangeAdFree(params) {
  return callCloudFunction('exchangeAdFree', params)
}

// 反馈失效链接
export function reportInvalid(params) {
  return callCloudFunction('reportInvalid', params)
}

// 获取用户信息
export function getUserInfo(params) {
  return callCloudFunction('getUserInfo', params)
}

// 获取资源详情
export function getResourceDetail(params) {
  return callCloudFunction('getResourceDetail', params)
}
