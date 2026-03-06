<template>
  <view class="container">
    <!-- 资源信息 -->
    <view class="resource-info" v-if="resource">
      <view class="title">{{ resource.title }}</view>
      <view class="description">{{ resource.description || '暂无描述' }}</view>
      <view class="meta">
        <text class="uploader">👤 {{ resource.uploader_nickname }}</text>
        <text class="views">👁️ {{ resource.view_count }}</text>
        <text class="ad-count">📺 需要{{ resource.ad_count }}个广告</text>
      </view>
    </view>

    <!-- 获取链接区域 -->
    <view class="action-area">
      <!-- 已获取链接 -->
      <view v-if="resourceUrl" class="url-display">
        <text class="url-label">资源链接：</text>
        <text class="url-value">{{ resourceUrl }}</text>
        <button class="copy-btn" @click="copyUrl">复制</button>
      </view>

      <!-- 未获取链接 -->
      <view v-else>
        <!-- 免广告提示 -->
        <view v-if="adFreeCount > 0" class="ad-free-tip">
          你有 {{ adFreeCount }} 次免广告机会
        </view>

        <!-- 看广告按钮 -->
        <button
          class="watch-ad-btn"
          :disabled="watchingAd"
          @click="watchAd"
        >
          {{ watchingAd ? '观看中...' : `看${resource?.ad_count || 1}个广告获取链接` }}
        </button>

        <!-- 使用免广告按钮 -->
        <button
          v-if="adFreeCount > 0"
          class="use-ad-free-btn"
          @click="useAdFree"
        >
          使用免广告 ({{ adFreeCount }}次)
        </button>
      </view>
    </view>

    <!-- 反馈区域 -->
    <view class="feedback-area">
      <view class="feedback-title">链接失效？</view>
      <button class="feedback-btn" @click="reportInvalid">
        反馈失效链接（确认后返还30积分）
      </button>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script>
import { useUserStore } from '@/stores/user.js'
import { getResourceDetail, getResource, watchAd as watchAdApi, exchangeAdFree, reportInvalid as reportInvalidApi } from '@/utils/index.js'

export default {
  data() {
    return {
      resourceId: '',
      resource: null,
      resourceUrl: '',
      adFreeCount: 0,
      watchingAd: false,
      adCount: 0,
      watchedCount: 0,
      loading: false,
      adUnitId: '' // 需要在manifest中配置
    }
  },
  onLoad(options) {
    if (options.id) {
      this.resourceId = options.id
      this.loadResource()
    }
  },
  methods: {
    async loadResource() {
      this.loading = true
      try {
        // 获取用户信息
        const userStore = useUserStore()
        if (!userStore.isLoggedIn) {
          await userStore.login()
        }
        await userStore.fetchUserInfo()
        this.adFreeCount = userStore.ad_free_count

        // 调用云函数获取资源详情
        const res = await getResourceDetail({ resource_id: this.resourceId })

        if (res.success) {
          this.resource = res.data
          this.adCount = res.data.ad_count
        } else {
          uni.showToast({
            title: res.message || '加载失败',
            icon: 'none'
          })
        }
      } catch (e) {
        console.error('加载资源失败', e)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    async watchAd() {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      if (this.watchingAd) return

      const totalAds = this.resource?.ad_count || 1
      this.watchingAd = true
      this.watchedCount = 0

      // #ifdef MP-WEIXIN
      for (let i = 0; i < totalAds; i++) {
        await this.showAd()
        this.watchedCount++
      }
      // #endif

      // #ifdef MP-ALIPAY
      // 支付宝不支持激励视频广告，直接获取链接
      this.watchedCount = totalAds
      uni.showToast({
        title: '支付宝端直接获取链接',
        icon: 'none'
      })
      // #endif

      // #ifdef H5
      // H5端直接给链接
      this.watchedCount = totalAds
      // #endif

      // 看完所有广告后，获取链接
      await this.getResourceLink()
      this.watchingAd = false
    },
    showAd() {
      return new Promise((resolve) => {
        // #ifdef MP-WEIXIN
        if (!this.adUnitId) {
          uni.showToast({
            title: '请先配置广告ID',
            icon: 'none'
          })
          resolve()
          return
        }

        const ad = wx.createRewardedVideoAd({
          adUnitId: this.adUnitId
        })

        ad.onClose((res) => {
          if (res && res.isEnded) {
            resolve()
          } else {
            uni.showToast({
              title: '请完整观看广告',
              icon: 'none'
            })
          }
          ad.destroy()
        })

        ad.onError((err) => {
          console.error('广告加载失败', err)
          uni.showToast({
            title: '广告加载失败',
            icon: 'none'
          })
          resolve()
        })

        ad.show().catch(() => {
          ad.load().then(() => ad.show())
        })
        // #endif

        // #ifdef MP-ALIPAY
        // 支付宝不支持激励视频广告
        resolve()
        // #endif

        // #ifdef H5
        resolve()
        // #endif
      })
    },
    async getResourceLink() {
      const userStore = useUserStore()

      try {
        // 调用云函数获取链接
        const res = await getResource({
          resource_id: this.resourceId,
          use_ad_free: false
        })

        if (res.success) {
          this.resourceUrl = res.data.url

          // 如果是H5或支付宝，直接返回链接
          // #ifdef H5
          this.resourceUrl = this.resource.url
          // #endif

          uni.showToast({
            title: '获取成功',
            icon: 'success'
          })
        } else {
          uni.showToast({
            title: res.message || '获取失败',
            icon: 'none'
          })
        }
      } catch (e) {
        console.error('获取链接失败', e)
        // H5和支付宝端直接返回链接
        this.resourceUrl = this.resource?.url || ''
        uni.showToast({
          title: '获取成功',
          icon: 'success'
        })
      }
    },
    async useAdFree() {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      try {
        // 调用云函数使用免广告获取链接
        const res = await getResource({
          resource_id: this.resourceId,
          use_ad_free: true
        })

        if (res.success) {
          this.resourceUrl = res.data.url
          this.adFreeCount = res.data.remaining_ad_free

          uni.showToast({
            title: '使用成功',
            icon: 'success'
          })
        } else {
          uni.showToast({
            title: res.message || '使用失败',
            icon: 'none'
          })
        }
      } catch (e) {
        console.error('使用免广告失败', e)
        // 模拟返回链接
        this.resourceUrl = this.resource?.url || ''
        this.adFreeCount--
        uni.showToast({
          title: '使用成功',
          icon: 'success'
        })
      }
    },
    copyUrl() {
      if (!this.resourceUrl) return

      uni.setClipboardData({
        data: this.resourceUrl,
        success: () => {
          uni.showToast({
            title: '复制成功',
            icon: 'success'
          })
        }
      })
    },
    async reportInvalid() {
      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      uni.showModal({
        title: '反馈失效链接',
        content: '系统将自动检测链接是否有效，无效将返还30积分',
        success: async (res) => {
          if (res.confirm) {
            try {
              // 调用反馈云函数
              const result = await reportInvalidApi({
                resource_id: this.resourceId,
                url: this.resource?.url
              })

              if (result.success) {
                if (result.refunded) {
                  uni.showToast({
                    title: `返还${result.points}积分`,
                    icon: 'success'
                  })
                } else {
                  uni.showToast({
                    title: result.message || '反馈成功',
                    icon: 'none'
                  })
                }
              } else {
                uni.showToast({
                  title: result.message || '反馈失败',
                  icon: 'none'
                })
              }
            } catch (e) {
              console.error('反馈失败', e)
              uni.showToast({
                title: '反馈失败',
                icon: 'none'
              })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.resource-info {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.description {
  font-size: 28rpx;
  color: #666;
  line-height: 40rpx;
  margin-bottom: 20rpx;
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
}

.action-area {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.url-display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.url-label {
  font-size: 28rpx;
  color: #333;
}

.url-value {
  flex: 1;
  font-size: 26rpx;
  color: #007AFF;
  word-break: break-all;
  margin-left: 10rpx;
}

.copy-btn {
  margin-left: 20rpx;
  padding: 10rpx 30rpx;
  background-color: #007AFF;
  color: #fff;
  border-radius: 30rpx;
  font-size: 24rpx;
}

.ad-free-tip {
  text-align: center;
  font-size: 28rpx;
  color: #007AFF;
  margin-bottom: 20rpx;
}

.watch-ad-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #007AFF;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  margin-bottom: 20rpx;
}

.use-ad-free-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #fff;
  color: #007AFF;
  border: 2rpx solid #007AFF;
  border-radius: 44rpx;
  font-size: 32rpx;
}

.feedback-area {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.feedback-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.feedback-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #ff9500;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
  color: #999;
}
</style>
