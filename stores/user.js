// 用户状态管理
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    openid: '',
    nickname: '',
    points: 0,
    ad_free_count: 0,
    total_ads_watched: 0,
    total_resources_uploaded: 0,
    isLoggedIn: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.openid
  },

  actions: {
    // 登录
    async login() {
      try {
        // 微信小程序登录
        const loginRes = await new Promise((resolve, reject) => {
          wx.login({
            success: resolve,
            fail: reject
          })
        })

        // 调用云函数登录
        const result = await wx.cloud.callFunction({
          name: 'login',
          data: { code: loginRes.code }
        })

        if (result.result && result.result.success) {
          const userData = result.result.data
          this.openid = userData.openid
          this.points = userData.points || 0
          this.ad_free_count = userData.ad_free_count || 0
          this.total_ads_watched = userData.total_ads_watched || 0
          this.total_resources_uploaded = userData.total_resources_uploaded || 0
          this.isLoggedIn = true

          // 保存到本地存储
          uni.setStorageSync('userInfo', {
            openid: this.openid,
            points: this.points,
            ad_free_count: this.ad_free_count,
            total_ads_watched: this.total_ads_watched,
            total_resources_uploaded: this.total_resources_uploaded
          })

          return { success: true }
        } else {
          return { success: false, message: result.result?.message || '登录失败' }
        }
      } catch (e) {
        console.error('登录失败', e)
        return { success: false, message: e.message || '登录失败' }
      }
    },

    // 获取用户信息
    async fetchUserInfo() {
      if (!this.openid) {
        // 尝试从本地存储恢复
        const stored = uni.getStorageSync('userInfo')
        if (stored && stored.openid) {
          this.openid = stored.openid
          this.points = stored.points || 0
          this.ad_free_count = stored.ad_free_count || 0
          this.total_ads_watched = stored.total_ads_watched || 0
          this.total_resources_uploaded = stored.total_resources_uploaded || 0
          this.isLoggedIn = true
        } else {
          // 需要登录
          return { success: false, message: '未登录' }
        }
      }

      try {
        const result = await wx.cloud.callFunction({
          name: 'getUserInfo',
          data: { openid: this.openid }
        })

        if (result.result && result.result.success) {
          const userData = result.result.data
          this.points = userData.points || 0
          this.ad_free_count = userData.ad_free_count || 0
          this.nickname = userData.nickname || ''
        }

        return { success: true }
      } catch (e) {
        console.error('获取用户信息失败', e)
        return { success: false, message: e.message }
      }
    },

    // 看广告获取积分
    async watchAd(adId) {
      if (!this.isLoggedIn) {
        await this.login()
      }

      try {
        const result = await wx.cloud.callFunction({
          name: 'watchAd',
          data: { adId }
        })

        if (result.result && result.result.success) {
          this.points = result.result.data.totalPoints
          // 更新本地存储
          uni.setStorageSync('userInfo', {
            openid: this.openid,
            points: this.points,
            ad_free_count: this.ad_free_count,
            total_ads_watched: this.total_ads_watched,
            total_resources_uploaded: this.total_resources_uploaded
          })
          return result.result
        } else {
          return result.result || { success: false, message: '看广告失败' }
        }
      } catch (e) {
        console.error('看广告失败', e)
        return { success: false, message: e.message }
      }
    },

    // 兑换免广告次数
    async exchangeAdFree(count = 1) {
      if (!this.isLoggedIn) {
        await this.login()
      }

      try {
        const result = await wx.cloud.callFunction({
          name: 'exchangeAdFree',
          data: { count }
        })

        if (result.result && result.result.success) {
          this.points = result.result.data.remaining_points
          this.ad_free_count = result.result.data.ad_free_count
          return result.result
        } else {
          return result.result || { success: false, message: '兑换失败' }
        }
      } catch (e) {
        console.error('兑换失败', e)
        return { success: false, message: e.message }
      }
    },

    // 登出
    logout() {
      this.openid = ''
      this.nickname = ''
      this.points = 0
      this.ad_free_count = 0
      this.total_ads_watched = 0
      this.total_resources_uploaded = 0
      this.isLoggedIn = false
      uni.removeStorageSync('userInfo')
    }
  }
})
