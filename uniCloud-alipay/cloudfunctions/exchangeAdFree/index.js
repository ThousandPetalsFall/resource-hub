// 云函数: exchangeAdFree
// 兑换免广告次数（100积分 = 1次）
exports.main = async (event, context) => {
  const cloud = require('wx-server-sdk')
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
  const db = cloud.database()
  const _ = db.command

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { count = 1 } = event

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  // 兑换数量必须是正整数
  const exchangeCount = Math.max(1, parseInt(count) || 1)
  const cost = exchangeCount * 100 // 每次100积分

  try {
    // 获取用户信息
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()

    if (!userRes.data || userRes.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userRes.data[0]

    // 检查积分是否足够
    if (user.points < cost) {
      return {
        success: false,
        message: `积分不足，需要${cost}积分，当前${user.points}积分`,
        code: 'POINTS_NOT_ENOUGH'
      }
    }

    // 扣除积分，增加免广告次数
    await db.collection('users').where({
      openid: openid
    }).update({
      points: _.inc(-cost),
      ad_free_count: _.inc(exchangeCount),
      update_time: Date.now()
    })

    // 记录兑换
    await db.collection('ad_logs').add({
      data: {
        user_openid: openid,
        ad_id: '',
        type: 'exchange',
        points: -cost,
        ad_free_count: exchangeCount,
        reason: `兑换${exchangeCount}次免广告`,
        create_time: Date.now()
      }
    })

    // 获取更新后的用户信息
    const updatedUser = await db.collection('users').where({ openid }).get()

    return {
      success: true,
      data: {
        cost: cost,
        exchanged: exchangeCount,
        remaining_points: updatedUser.data[0].points,
        ad_free_count: updatedUser.data[0].ad_free_count
      },
      message: `成功兑换${exchangeCount}次免广告`
    }
  } catch (error) {
    console.error('兑换失败', error)
    return { success: false, message: error.message || '兑换失败' }
  }
}
