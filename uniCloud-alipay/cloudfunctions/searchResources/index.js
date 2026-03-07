// 云函数: searchResources
// 搜索资源
exports.main = async (event, context) => {
  const cloud = require('wx-server-sdk')
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
  const db = cloud.database()
  const _ = db.command

  const { keyword, page = 1, pageSize = 20 } = event

  try {
    let query = {}

    // 如果有关键词，进行模糊搜索
    if (keyword && keyword.trim()) {
      query = {
        title: new RegExp(keyword.trim(), 'i')
      }
    }

    // 只显示有效的资源（is_valid 为 null 或不为 'false'）
    query.is_valid = _.or(_.eq(null), _.neq('false'))

    const res = await db.collection('resources')
      .where(query)
      .orderBy('create_time', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 过滤掉 URL 等敏感信息
    const list = (res.data || []).map(item => ({
      _id: item._id,
      title: item.title,
      description: item.description,
      ad_count: item.ad_count || 1,
      uploader_nickname: item.uploader_nickname,
      view_count: item.view_count || 0,
      feedback_count: item.feedback_count || 0,
      is_valid: item.is_valid,
      create_time: item.create_time
    }))

    return {
      success: true,
      data: {
        list,
        page,
        pageSize,
        total: list.length
      }
    }
  } catch (error) {
    console.error('搜索失败', error)
    return { success: false, message: error.message || '搜索失败' }
  }
}
