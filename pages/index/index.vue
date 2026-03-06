<template>
  <view class="container">
    <!-- 顶部搜索栏 -->
    <view class="search-bar" @click="goToSearch">
      <text class="search-icon">🔍</text>
      <text class="search-placeholder">搜索资源...</text>
    </view>

    <!-- 资源列表 -->
    <scroll-view
      class="resource-list"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view v-if="loading && resourceList.length === 0" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="resourceList.length === 0" class="empty">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无资源，快去上传吧</text>
      </view>

      <view
        v-for="item in resourceList"
        :key="item._id"
        class="resource-card"
        @click="goToResource(item._id)"
      >
        <view class="resource-title">{{ item.title }}</view>
        <view class="resource-desc">{{ item.description || '暂无描述' }}</view>
        <view class="resource-info">
          <text class="uploader">👤 {{ item.uploader_nickname }}</text>
          <text class="ad-count">📺 {{ item.ad_count }}个广告</text>
          <text class="views">👁️ {{ item.view_count }}</text>
        </view>
      </view>

      <view v-if="loadingMore" class="loading-more">
        <text>加载中...</text>
      </view>

      <view v-if="noMore" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 底部导航 -->
    <view class="tab-bar">
      <view class="tab-item active">
        <text class="tab-icon">🏠</text>
        <text class="tab-text">首页</text>
      </view>
      <view class="tab-item" @click="goToUpload">
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
import { searchResources } from '@/utils/index.js'

export default {
  data() {
    return {
      resourceList: [],
      page: 1,
      pageSize: 20,
      loading: false,
      loadingMore: false,
      refreshing: false,
      noMore: false
    }
  },
  onLoad() {
    this.loadResources()
  },
  onShow() {
    // 每次显示页面时刷新
    this.page = 1
    this.noMore = false
    this.loadResources()
  },
  methods: {
    async loadResources(loadMore = false) {
      if (loadMore) {
        this.loadingMore = true
      } else {
        this.loading = true
      }

      try {
        const res = await searchResources({
          keyword: '',
          page: this.page,
          pageSize: this.pageSize
        })

        if (res.success) {
          if (loadMore) {
            this.resourceList = [...this.resourceList, ...res.data.list]
          } else {
            this.resourceList = res.data.list
          }

          if (res.data.list.length < this.pageSize) {
            this.noMore = true
          }
        }
      } catch (e) {
        console.error('加载资源失败', e)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        this.loadingMore = false
        this.refreshing = false
      }
    },
    onRefresh() {
      this.refreshing = true
      this.page = 1
      this.noMore = false
      this.loadResources()
    },
    onLoadMore() {
      if (!this.noMore && !this.loadingMore) {
        this.page++
        this.loadResources(true)
      }
    },
    goToSearch() {
      uni.navigateTo({
        url: '/pages/search/search'
      })
    },
    goToResource(id) {
      uni.navigateTo({
        url: `/pages/resource/resource?id=${id}`
      })
    },
    goToUpload() {
      uni.navigateTo({
        url: '/pages/upload/upload'
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
  padding-bottom: 100rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: #fff;
  margin: 20rpx;
  padding: 20rpx 30rpx;
  border-radius: 50rpx;
}

.search-icon {
  margin-right: 20rpx;
}

.search-placeholder {
  color: #999;
  font-size: 28rpx;
}

.resource-list {
  height: calc(100vh - 200rpx);
  padding: 0 20rpx;
}

.loading, .empty, .loading-more, .no-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
  color: #999;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
}

.resource-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.resource-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.resource-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 20rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.resource-info {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
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
