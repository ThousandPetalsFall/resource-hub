// 工具函数 - 云函数调用封装
// 环境ID - 需要在 manifest.json 中配置
const CLOUD_ENV = 'env-00jy61kgq0gk'

// 调用云函数 - 微信版本
function callCloudFunctionWechat(name, data = {}) {
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

// 调用云函数 - 支付宝版本
function callCloudFunctionAlipay(name, data = {}) {
  return new Promise((resolve, reject) => {
    my.cloud.init({
      env: CLOUD_ENV
    })

    my.cloud.callFunction({
      name,
      data,
      success: (res) => {
        // 支付宝返回结果直接在 res.result，如果失败则是 { success: false }
        resolve(res.result || res)
      },
      fail: (err) => {
        console.error(`云函数 ${name} 调用失败`, err)
        reject(err)
      }
    })
  })
}

// 统一调用云函数
function callCloudFunction(name, data = {}) {
  // #ifdef MP-WEIXIN
  return callCloudFunctionWechat(name, data)
  // #endif

  // #ifdef MP-ALIPAY
  return callCloudFunctionAlipay(name, data)
  // #endif

  // #ifdef H5
  return Promise.resolve({ success: false, message: 'H5端暂不支持云函数' })
  // #endif
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
