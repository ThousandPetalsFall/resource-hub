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

    // 只显示有效的资源
    query.is_valid = _.neq('false')

    const res = await db.collection('resources')
      .where(query)
      .orderBy('create_time', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: {
        list: res.data || [],
        page,
        pageSize,
        total: res.data ? res.data.length : 0
      }
    }
  } catch (error) {
    console.error('搜索失败', error)
    return { success: false, message: error.message || '搜索失败' }
  }
}
