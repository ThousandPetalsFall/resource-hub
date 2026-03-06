<template>
  <view class="container">
    <!-- 搜索栏 -->
    <view class="search-header">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="输入关键词搜索..."
          confirm-type="search"
          @confirm="onSearch"
        />
        <text v-if="keyword" class="clear-icon" @click="clearKeyword">✕</text>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>

    <!-- 搜索结果 -->
    <scroll-view
      class="result-list"
      scroll-y
      @scrolltolower="onLoadMore"
    >
      <view v-if="loading" class="loading">
        <text>搜索中...</text>
      </view>

      <view v-else-if="resourceList.length === 0 && hasSearched" class="empty">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">未找到相关资源</text>
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

      <view v-if="noMore && resourceList.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { searchResources } from '@/utils/index.js'

export default {
  data() {
    return {
      keyword: '',
      resourceList: [],
      page: 1,
      pageSize: 20,
      loading: false,
      loadingMore: false,
      noMore: false,
      hasSearched: false
    }
  },
  methods: {
    async onSearch() {
      if (!this.keyword.trim()) {
        return
      }

      this.page = 1
      this.noMore = false
      this.hasSearched = true
      this.loading = true

      try {
        const res = await searchResources({
          keyword: this.keyword.trim(),
          page: this.page,
          pageSize: this.pageSize
        })

        if (res.success) {
          this.resourceList = res.data.list
          if (res.data.list.length < this.pageSize) {
            this.noMore = true
          }
        }
      } catch (e) {
        console.error('搜索失败', e)
        uni.showToast({
          title: '搜索失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    async onLoadMore() {
      if (this.noMore || this.loadingMore || !this.keyword.trim()) {
        return
      }

      this.loadingMore = true
      this.page++

      try {
        const res = await searchResources({
          keyword: this.keyword.trim(),
          page: this.page,
          pageSize: this.pageSize
        })

        if (res.success) {
          this.resourceList = [...this.resourceList, ...res.data.list]
          if (res.data.list.length < this.pageSize) {
            this.noMore = true
          }
        }
      } catch (e) {
        this.page--
      } finally {
        this.loadingMore = false
      }
    },
    clearKeyword() {
      this.keyword = ''
      this.resourceList = []
      this.hasSearched = false
    },
    goToResource(id) {
      uni.navigateTo({
        url: `/pages/resource/resource?id=${id}`
      })
    },
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.search-header {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 20rpx;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 16rpx 24rpx;
  border-radius: 50rpx;
}

.search-icon {
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
}

.clear-icon {
  padding: 10rpx;
  color: #999;
}

.cancel-btn {
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #007AFF;
}

.result-list {
  height: calc(100vh - 100rpx);
  padding: 20rpx;
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
</style>
