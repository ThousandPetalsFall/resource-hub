<script>
import { useUserStore } from '@/stores/user.js'

export default {
  onLaunch: function() {
    console.log('App Launch')

    // #ifdef MP-WEIXIN
    // 初始化云开发
    wx.cloud.init({
      env: 'env-00jy61kgq0gk'
    })
    // #endif

    // #ifdef MP-ALIPAY
    my.cloud.init({
      env: 'env-00jy61kgq0gk'
    })
    // #endif

    // 检查登录状态
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      // 尝试从本地存储恢复
      const stored = uni.getStorageSync('userInfo')
      if (stored && stored.openid) {
        userStore.openid = stored.openid
        userStore.points = stored.points || 0
        userStore.ad_free_count = stored.ad_free_count || 0
        userStore.total_ads_watched = stored.total_ads_watched || 0
        userStore.total_resources_uploaded = stored.total_resources_uploaded || 0
        userStore.isLoggedIn = true
      }
    }
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style>
/* 每个页面公共css */
page {
  background-color: #f5f5f5;
  font-size: 28rpx;
  color: #333;
}

* {
  box-sizing: border-box;
}
</style>
