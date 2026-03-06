// 云函数: login
// 用户登录，获取或创建用户
exports.main = async (event, context) => {
  const cloud = require('wx-server-sdk')
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
  const db = cloud.database()
  const _ = db.command

  // 获取openid
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, message: '获取用户信息失败' }
  }

  try {
    // 查询用户是否存在
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()

    let user
    if (userRes.data && userRes.data.length > 0) {
      // 用户已存在，返回用户信息
      user = userRes.data[0]
    } else {
      // 创建新用户
      const now = Date.now()
      const result = await db.collection('users').add({
        data: {
          openid: openid,
          points: 0,
          ad_free_count: 0,
          total_ads_watched: 0,
          total_resources_uploaded: 0,
          create_time: now,
          update_time: now
        }
      })

      user = {
        _id: result.id,
        openid: openid,
        points: 0,
        ad_free_count: 0,
        total_ads_watched: 0,
        total_resources_uploaded: 0
      }
    }

    return {
      success: true,
      data: {
        openid: user.openid,
        points: user.points,
        ad_free_count: user.ad_free_count,
        total_ads_watched: user.total_ads_watched || 0,
        total_resources_uploaded: user.total_resources_uploaded || 0
      }
    }
  } catch (error) {
    console.error('登录失败', error)
    return { success: false, message: error.message || '登录失败' }
  }
}
