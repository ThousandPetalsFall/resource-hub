// 云函数: checkUrlContent
// 检测URL是否包含有效内容
// 返回 true 表示有效，false 表示无效
exports.main = async (event, context) => {
  const url = event.url
  if (!url) {
    return { valid: false, message: 'URL不能为空' }
  }

  // 简单的URL格式验证
  try {
    new URL(url)
  } catch (e) {
    return { valid: false, message: 'URL格式不正确' }
  }

  // 重试辅助函数
  async function fetchWithRetry(fetchFn, maxRetries = 2, delayMs = 1000) {
    let lastError
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fetchFn()
      } catch (error) {
        lastError = error
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
    }
    throw lastError
  }

  try {
    // 使用原生fetch请求检测URL，带重试机制
    const res = await fetchWithRetry(async () => {
      return await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      })
    }, 2, 1000)

    // 检查响应状态码
    const statusCode = res.status
    if (statusCode >= 400) {
      return { valid: false, message: `HTTP错误: ${statusCode}` }
    }

    // 获取响应文本
    const content = await res.text()

    // 检查响应内容长度
    if (!content || content.length < 100) {
      return { valid: false, message: '内容过少或为空' }
    }

    // 检查是否包含常见的内容标识
    const hasContent = /<html|<body|<div|<p|<article|content|text|<!DOCTYPE/i.test(content)

    if (!hasContent) {
      return { valid: false, message: '未检测到有效内容' }
    }

    return { valid: true, message: 'URL有效' }
  } catch (error) {
    console.error('URL检测失败', error)
    return { valid: false, message: error.message || '检测失败' }
  }
}
