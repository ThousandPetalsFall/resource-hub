// 云函数: reportInvalid
// 用户反馈链接失效，系统检测确认后返还30积分（3元）
exports.main = async (event, context) => {
  const cloud = require('wx-server-sdk')
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
  const db = cloud.database()
  const _ = db.command

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { resource_id, url } = event

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  if (!url) {
    return { success: false, message: 'URL不能为空' }
  }

  try {
    // 防重复举报检查：检查同一用户是否已举报过同一资源
    const existingReport = await db.collection('feedbacks').where({
      resource_id: resource_id,
      reporter_openid: openid
    }).get()

    if (existingReport.data && existingReport.data.length > 0) {
      return { success: false, message: '你已举报过该资源' }
    }

    // 调用检测函数
    const checkRes = await cloud.callFunction({
      name: 'checkUrlContent',
      data: { url: url }
    })

    const isValid = checkRes.result?.valid

    // 记录反馈
    await db.collection('feedbacks').add({
      data: {
        resource_id: resource_id,
        resource_url: url,
        reporter_openid: openid,
        is_valid: isValid,
        status: isValid ? 'valid' : 'invalid',
        checked_at: Date.now(),
        create_time: Date.now()
      }
    })

    // 更新资源的反馈次数和有效性
    const updateData = {
      feedback_count: _.inc(1),
      update_time: Date.now()
    }
    if (isValid === false) {
      updateData.is_valid = 'false'
    }

    await db.collection('resources').where({ _id: resource_id }).update(updateData)

    // 如果无效，返还30积分
    if (isValid === false) {
      const usersRes = await db.collection('users').where({
        openid: openid
      }).get()

      if (usersRes.data && usersRes.data.length > 0) {
        await db.collection('users').where({
          openid: openid
        }).update({
          points: _.inc(30),
          update_time: Date.now()
        })

        // 记录积分变动
        await db.collection('ad_logs').add({
          data: {
            user_openid: openid,
            ad_id: '',
            type: 'refund',
            points: 30,
            ad_free_count: 0,
            reason: '反馈失效链接返还积分',
            resource_id: resource_id,
            create_time: Date.now()
          }
        })

        return {
          success: true,
          refunded: true,
          points: 30,
          message: '链接无效，返还30积分'
        }
      }
    }

    return {
      success: true,
      refunded: false,
      message: isValid ? '链接有效，无需返还' : '检测失败'
    }
  } catch (error) {
    console.error('反馈处理失败', error)
    return { success: false, message: error.message || '处理失败' }
  }
}
