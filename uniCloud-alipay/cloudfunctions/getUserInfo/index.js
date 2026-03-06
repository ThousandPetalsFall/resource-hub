// 云函数: getUserInfo
// 获取用户信息
exports.main = async (event, context) => {
  const cloud = require('wx-server-sdk')
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
  const db = cloud.database()

  // 获取openid
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID || event.openid

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  try {
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()

    if (userRes.data && userRes.data.length > 0) {
      const user = userRes.data[0]
      return {
        success: true,
        data: {
          openid: user.openid,
          nickname: user.nickname || '',
          points: user.points || 0,
          ad_free_count: user.ad_free_count || 0,
          total_ads_watched: user.total_ads_watched || 0,
          total_resources_uploaded: user.total_resources_uploaded || 0
        }
      }
    } else {
      return { success: false, message: '用户不存在' }
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    return { success: false, message: error.message || '获取失败' }
  }
}
