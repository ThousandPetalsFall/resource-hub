// 云函数: getResource
// 获取资源链接（看广告或使用免广告次数）
exports.main = async (event, context) => {
  const cloud = require('wx-server-sdk')
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
  const db = cloud.database()
  const _ = db.command

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { resource_id, use_ad_free } = event

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  if (!resource_id) {
    return { success: false, message: '资源ID不能为空' }
  }

  try {
    // 获取资源信息
    const resourceRes = await db.collection('resources').where({
      _id: resource_id
    }).get()

    if (!resourceRes.data || resourceRes.data.length === 0) {
      return { success: false, message: '资源不存在' }
    }

    const resource = resourceRes.data[0]

    // 增加查看次数
    await db.collection('resources').where({
      _id: resource_id
    }).update({
      view_count: _.inc(1),
      update_time: Date.now()
    })

    // 获取用户信息
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()

    if (!userRes.data || userRes.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userRes.data[0]
    const adCount = resource.ad_count || 1

    // 检查是否使用免广告
    if (use_ad_free) {
      if (user.ad_free_count > 0) {
        // 使用免广告次数
        await db.collection('users').where({
          openid: openid
        }).update({
          ad_free_count: _.inc(-1),
          update_time: Date.now()
        })

        // 记录使用
        await db.collection('ad_logs').add({
          data: {
            user_openid: openid,
            ad_id: '',
            type: 'use',
            points: 0,
            ad_free_count: -1,
            reason: '使用免广告次数获取链接',
            resource_id: resource_id,
            create_time: Date.now()
          }
        })

        return {
          success: true,
          data: {
            url: resource.url,
            ad_count: adCount,
            used_ad_free: true,
            remaining_ad_free: user.ad_free_count - 1
          },
          message: '使用免广告次数成功'
        }
      } else {
        return { success: false, message: '免广告次数不足', code: 'AD_FREE_NOT_ENOUGH' }
      }
    }

    // 检查用户已观看该资源的广告次数
    const watchedAdsRes = await db.collection('ad_logs').where({
      user_openid: openid,
      type: 'earn',
      resource_id: resource_id
    }).get()

    const watchedCount = watchedAdsRes.data ? watchedAdsRes.data.length : 0
    const remainingAds = adCount - watchedCount

    // 如果已看完所有广告，返回链接
    if (watchedCount >= adCount) {
      return {
        success: true,
        data: {
          url: resource.url,
          ad_count: adCount,
          used_ad_free: false,
          watched_count: watchedCount,
          already_watched: true
        },
        message: '获取成功'
      }
    }

    // 返回需要继续看广告的数量
    return {
      success: true,
      data: {
        url: null,
        ad_count: adCount,
        watched_count: watchedCount,
        remaining_ads: remainingAds,
        used_ad_free: false,
        points: user.points,
        ad_free_count: user.ad_free_count
      },
      message: `还需观看${remainingAds}个广告，已观看${watchedCount}个`
    }
  } catch (error) {
    console.error('获取资源失败', error)
    return { success: false, message: error.message || '获取失败' }
  }
}
