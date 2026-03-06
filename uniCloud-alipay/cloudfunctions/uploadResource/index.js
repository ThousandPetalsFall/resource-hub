// 云函数: uploadResource
// 用户上传资源
exports.main = async (event, context) => {
  const cloud = require('wx-server-sdk')
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
  const db = cloud.database()
  const _ = db.command

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { title, description, url, ad_count, nickname } = event

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  if (!title || !url) {
    return { success: false, message: '标题和链接不能为空' }
  }

  // URL格式验证
  try {
    new URL(url)
  } catch (e) {
    return { success: false, message: '链接格式不正确' }
  }

  // 广告数量必须是1-3
  const adCount = Math.min(3, Math.max(1, parseInt(ad_count) || 1))

  try {
    const now = Date.now()

    // 创建资源
    const result = await db.collection('resources').add({
      data: {
        title: title.trim(),
        description: description || '',
        url: url.trim(),
        ad_count: adCount,
        uploader_openid: openid,
        uploader_nickname: nickname || '匿名用户',
        view_count: 0,
        feedback_count: 0,
        is_valid: null,
        create_time: now,
        update_time: now
      }
    })

    // 更新用户的上传数量
    await db.collection('users').where({
      openid: openid
    }).update({
      total_resources_uploaded: _.inc(1),
      update_time: now
    })

    return {
      success: true,
      data: {
        resource_id: result.id
      },
      message: '上传成功'
    }
  } catch (error) {
    console.error('上传失败', error)
    return { success: false, message: error.message || '上传失败' }
  }
}
