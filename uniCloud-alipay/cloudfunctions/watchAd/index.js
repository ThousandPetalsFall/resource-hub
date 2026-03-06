// 云函数: watchAd
// 用户看广告获取积分
// 规则：每天前3次13积分（1.3），之后10积分（1.0）
// 使用整数避免浮点数精度问题
exports.main = async (event, context) => {
  const cloud = require('wx-server-sdk')
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
  const db = cloud.database()
  const _ = db.command

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const adId = event.adId // 广告ID，用于防刷

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  // 获取今天的开始时间
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()

  try {
    // 防刷检查：检查最近30秒内是否有相同的广告ID
    if (adId) {
      const recentCheck = await db.collection('ad_logs').where({
        user_openid: openid,
        ad_id: adId,
        type: 'earn',
        create_time: _.gte(Date.now() - 30000)
      }).get()

      if (recentCheck.data && recentCheck.data.length > 0) {
        return { success: false, message: '请勿重复观看相同广告' }
      }
    }

    // 查询今天看广告次数
    const adLogsRes = await db.collection('ad_logs').where({
      user_openid: openid,
      type: 'earn',
      create_time: _.gte(todayStart)
    }).get()

    const todayCount = adLogsRes.data ? adLogsRes.data.length : 0

    // 计算积分：前3次13积分（1.3），之后10积分（1.0）
    let points = 0
    if (todayCount < 3) {
      points = 13
    } else {
      points = 10
    }

    // 更新用户积分
    const usersRes = await db.collection('users').where({
      openid: openid
    }).get()

    if (usersRes.data && usersRes.data.length > 0) {
      await db.collection('users').where({
        openid: openid
      }).update({
        points: _.inc(points),
        total_ads_watched: _.inc(1),
        update_time: Date.now()
      })

      // 记录广告观看日志
      await db.collection('ad_logs').add({
        data: {
          user_openid: openid,
          ad_id: adId || '',
          type: 'earn',
          points: points,
          ad_free_count: 0,
          reason: `看广告获得${points / 10}积分`,
          create_time: Date.now()
        }
      })

      // 获取更新后的用户信息
      const updatedUser = await db.collection('users').where({ openid }).get()

      return {
        success: true,
        data: {
          points: points,
          todayCount: todayCount + 1,
          totalPoints: updatedUser.data[0].points
        },
        message: `获得 ${points / 10} 积分`
      }
    } else {
      return { success: false, message: '用户不存在' }
    }
  } catch (error) {
    console.error('看广告失败', error)
    return { success: false, message: error.message || '处理失败' }
  }
}
