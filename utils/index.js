// 工具函数 - 云函数调用封装
import { useUserStore } from '@/stores/user.js'

// 环境ID - 需要在 manifest.json 中配置
const CLOUD_ENV = 'env-00jy61kgq0gk'

// 调用云函数
function callCloudFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
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
    // #endif

    // #ifdef H5
    // H5端模拟
    console.log(`[H5模拟] 调用云函数 ${name}`, data)
    resolve({ success: false, message: 'H5端暂不支持云函数' })
    // #endif

    // #ifdef MP-ALIPAY
    my.cloud.init({
      env: CLOUD_ENV
    })

    my.cloud.callFunction({
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
    // #endif
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
