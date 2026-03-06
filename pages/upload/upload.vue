<template>
  <view class="container">
    <view class="form">
      <!-- 标题 -->
      <view class="form-item">
        <text class="label">资源标题 *</text>
        <input
          v-model="form.title"
          class="input"
          placeholder="请输入资源标题"
          maxlength="50"
        />
      </view>

      <!-- 链接 -->
      <view class="form-item">
        <text class="label">资源链接 *</text>
        <input
          v-model="form.url"
          class="input"
          placeholder="请输入资源链接"
          type="url"
        />
      </view>

      <!-- 描述 -->
      <view class="form-item">
        <text class="label">资源描述</text>
        <textarea
          v-model="form.description"
          class="textarea"
          placeholder="请输入资源描述（选填）"
          maxlength="200"
        />
      </view>

      <!-- 广告数量 -->
      <view class="form-item">
        <text class="label">需要看的广告数量</text>
        <view class="ad-count-selector">
          <view
            v-for="count in [1, 2, 3]"
            :key="count"
            :class="['ad-count-btn', form.ad_count === count ? 'active' : '']"
            @click="form.ad_count = count"
          >
            {{ count }}个
          </view>
        </view>
        <text class="tip">用户需要观看{{ form.ad_count }}个广告才能获取链接</text>
      </view>

      <!-- 上传按钮 -->
      <button class="submit-btn" :loading="submitting" @click="onSubmit">
        {{ submitting ? '上传中...' : '上传资源' }}
      </button>
    </view>

    <!-- 底部导航 -->
    <view class="tab-bar">
      <view class="tab-item" @click="goToIndex">
        <text class="tab-icon">🏠</text>
        <text class="tab-text">首页</text>
      </view>
      <view class="tab-item active">
        <text class="tab-icon">➕</text>
        <text class="tab-text">上传</text>
      </view>
      <view class="tab-item" @click="goToProfile">
        <text class="tab-icon">👤</text>
        <text class="tab-text">我的</text>
      </view>
    </view>
  </view>
</template>

<script>
import { uploadResource } from '@/utils/index.js'
import { useUserStore } from '@/stores/user.js'

export default {
  data() {
    return {
      form: {
        title: '',
        url: '',
        description: '',
        ad_count: 1
      },
      submitting: false
    }
  },
  methods: {
    async onSubmit() {
      // 验证
      if (!this.form.title.trim()) {
        uni.showToast({
          title: '请输入资源标题',
          icon: 'none'
        })
        return
      }

      if (!this.form.url.trim()) {
        uni.showToast({
          title: '请输入资源链接',
          icon: 'none'
        })
        return
      }

      // 验证URL格式
      try {
        new URL(this.form.url.trim())
      } catch (e) {
        uni.showToast({
          title: '链接格式不正确',
          icon: 'none'
        })
        return
      }

      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      this.submitting = true

      try {
        const res = await uploadResource({
          title: this.form.title.trim(),
          url: this.form.url.trim(),
          description: this.form.description.trim(),
          ad_count: this.form.ad_count,
          nickname: userStore.nickname
        })

        if (res.success) {
          uni.showToast({
            title: '上传成功',
            icon: 'success'
          })

          // 清空表单
          this.form = {
            title: '',
            url: '',
            description: '',
            ad_count: 1
          }

          // 跳转到首页
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/index/index'
            })
          }, 1500)
        } else {
          uni.showToast({
            title: res.message || '上传失败',
            icon: 'none'
          })
        }
      } catch (e) {
        console.error('上传失败', e)
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    },
    goToIndex() {
      uni.switchTab({
        url: '/pages/index/index'
      })
    },
    goToProfile() {
      uni.navigateTo({
        url: '/pages/profile/profile'
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

.form {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.textarea {
  width: 100%;
  height: 160rpx;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.ad-count-selector {
  display: flex;
  gap: 20rpx;
}

.ad-count-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.ad-count-btn.active {
  background-color: #007AFF;
  color: #fff;
}

.tip {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #999;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #007AFF;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  margin-top: 40rpx;
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
