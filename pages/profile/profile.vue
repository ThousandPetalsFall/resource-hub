<template>
  <view class="container">
    <!-- 用户信息 -->
    <view class="user-info" @click="handleLogin">
      <view class="avatar">
        <text>{{ isLoggedIn ? (nickname ? nickname[0] : '?') : '?' }}</text>
      </view>
      <view class="info">
        <text class="nickname">{{ isLoggedIn ? (nickname || '未设置昵称') : '点击登录' }}</text>
        <text class="points">积分: {{ points }} | 免广告: {{ ad_free_count }}次</text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats">
      <view class="stat-item">
        <text class="stat-value">{{ total_ads_watched }}</text>
        <text class="stat-label">累计看广告</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ total_resources_uploaded }}</text>
        <text class="stat-label">累计上传</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="watchAd">
        <text class="menu-icon">📺</text>
        <text class="menu-text">看广告赚积分</text>
        <text class="menu-arrow">></text>
      </view>

      <view class="menu-item" @click="exchangeAdFree">
        <text class="menu-icon">🎫</text>
        <text class="menu-text">兑换免广告 (100积分/次)</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <!-- 积分说明 -->
    <view class="info-section">
      <view class="info-title">积分规则</view>
      <view class="info-item">• 主动看广告：每天前3次 1.3 积分/次，之后 1 积分/次</view>
      <view class="info-item">• 反馈失效链接确认后：返还 30 积分</view>
      <view class="info-item">• 兑换免广告：100 积分 = 1 次</view>
    </view>

    <!-- 底部导航 -->
    <view class="tab-bar">
      <view class="tab-item" @click="goToIndex">
        <text class="tab-icon">🏠</text>
        <text class="tab-text">首页</text>
      </view>
      <view class="tab-item" @click="goToUpload">
        <text class="tab-icon">➕</text>
        <text class="tab-text">上传</text>
      </view>
      <view class="tab-item active">
        <text class="tab-icon">👤</text>
        <text class="tab-text">我的</text>
      </view>
    </view>
  </view>
</template>

<script>
import { useUserStore } from '@/stores/user.js'

export default {
  data() {
    return {
      adUnitId: '' // 需要在manifest中配置
    }
  },
  computed: {
    isLoggedIn() {
      const userStore = useUserStore()
      return userStore.isLoggedIn
    },
    points() {
      const userStore = useUserStore()
      return userStore.points
    },
    ad_free_count() {
      const userStore = useUserStore()
      return userStore.ad_free_count
    },
    nickname() {
      const userStore = useUserStore()
      return userStore.nickname
    },
    total_ads_watched() {
      const userStore = useUserStore()
      return userStore.total_ads_watched
    },
    total_resources_uploaded() {
      const userStore = useUserStore()
      return userStore.total_resources_uploaded
    }
  },
  onShow() {
    // 刷新用户数据
    const userStore = useUserStore()
    if (userStore.isLoggedIn) {
      userStore.fetchUserInfo()
    }
  },
  methods: {
    handleLogin() {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        userStore.login()
      }
    },
    async watchAd() {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      // #ifdef MP-WEIXIN
      if (!this.adUnitId) {
        uni.showToast({
          title: '请先配置广告ID',
          icon: 'none'
        })
        return
      }

      // 显示激励视频广告
      const ad = wx.createRewardedVideoAd({
        adUnitId: this.adUnitId
      })

      ad.onLoad(() => {
        console.log('广告加载成功')
      })

      ad.onError((err) => {
        console.error('广告加载失败', err)
        uni.showToast({
          title: '广告加载失败',
          icon: 'none'
        })
      })

      ad.onClose((res) => {
        if (res && res.isEnded) {
          // 广告播放完成，发放积分
          this.doWatchAd()
        } else {
          uni.showToast({
            title: '请完整观看广告',
            icon: 'none'
          })
        }
        ad.destroy()
      })

      ad.show().catch(() => {
        ad.load().then(() => ad.show())
      })
      // #endif

      // #ifdef H5
      // H5端直接看广告
      this.doWatchAd()
      // #endif
    },
    async doWatchAd() {
      const userStore = useUserStore()
      const adId = 'ad_' + Date.now()

      try {
        const res = await userStore.watchAd(adId)

        if (res.success) {
          uni.showToast({
            title: res.message || '获得积分',
            icon: 'success'
          })
        } else {
          uni.showToast({
            title: res.message || '看广告失败',
            icon: 'none'
          })
        }
      } catch (e) {
        console.error('看广告失败', e)
        uni.showToast({
          title: '看广告失败',
          icon: 'none'
        })
      }
    },
    async exchangeAdFree() {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      if (this.points < 100) {
        uni.showToast({
          title: '积分不足，需要100积分',
          icon: 'none'
        })
        return
      }

      uni.showModal({
        title: '兑换免广告',
        content: `确认消耗100积分兑换1次免广告？`,
        success: async (res) => {
          if (res.confirm) {
            const userStore = useUserStore()
            const result = await userStore.exchangeAdFree(1)

            if (result.success) {
              uni.showToast({
                title: result.message || '兑换成功',
                icon: 'success'
              })
            } else {
              uni.showToast({
                title: result.message || '兑换失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    goToIndex() {
      uni.switchTab({
        url: '/pages/index/index'
      })
    },
    goToUpload() {
      uni.navigateTo({
        url: '/pages/upload/upload'
      })
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.user-info {
  display: flex;
  align-items: center;
  background-color: #007AFF;
  padding: 40rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #fff;
  margin-right: 30rpx;
}

.info {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 36rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.points {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stats {
  display: flex;
  background-color: #fff;
  padding: 30rpx 0;
  margin-bottom: 20rpx;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1rpx solid #eee;
}

.stat-item:last-child {
  border-right: none;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.menu-list {
  background-color: #fff;
  margin: 0 20rpx;
  border-radius: 16rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}

.info-section {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}

.info-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.info-item {
  font-size: 24rpx;
  color: #666;
  line-height: 40rpx;
}

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background-color: #fff;
  padding: 20rpx 0;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tab-item.active .tab-text {
  color: #007AFF;
}

.tab-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.tab-text {
  font-size: 24rpx;
  color: #999;
}
</style>
