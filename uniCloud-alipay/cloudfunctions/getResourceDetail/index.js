// 云函数: getResourceDetail
// 获取资源详情
exports.main = async (event, context) => {
  const cloud = require('wx-server-sdk')
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
  const db = cloud.database()

  const { resource_id } = event

  if (!resource_id) {
    return { success: false, message: '资源ID不能为空' }
  }

  try {
    const resourceRes = await db.collection('resources').where({
      _id: resource_id
    }).get()

    if (!resourceRes.data || resourceRes.data.length === 0) {
      return { success: false, message: '资源不存在' }
    }

    const resource = resourceRes.data[0]

    return {
      success: true,
      data: {
        _id: resource._id,
        title: resource.title,
        description: resource.description || '',
        url: resource.url,
        ad_count: resource.ad_count || 1,
        uploader_openid: resource.uploader_openid,
        uploader_nickname: resource.uploader_nickname || '匿名用户',
        view_count: resource.view_count || 0,
        feedback_count: resource.feedback_count || 0,
        is_valid: resource.is_valid,
        create_time: resource.create_time
      }
    }
  } catch (error) {
    console.error('获取资源详情失败', error)
    return { success: false, message: error.message || '获取失败' }
  }
}
