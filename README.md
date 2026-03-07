# ResourceHub 资源分享平台

基于 uniapp + 支付宝云开发的资源共享小程序，支持微信小程序端。

## 功能特性

### 核心功能
- **资源上传**: 用户可以上传资源链接、名称和描述
- **资源搜索**: 支持关键词模糊搜索资源
- **广告解锁**: 看1-3个广告获取资源链接
- **失效反馈**: 用户可反馈失效链接，系统自动检测确认后返还积分

### 积分系统
- 主动看广告赚积分（每天前3次 **13积分**/次，之后10积分/次）
- 反馈失效链接确认后返还 **30积分**
- **100积分** 兑换 1次免广告机会
- 免广告次数可直接获取链接，无需看广告

## 项目结构

```
resource-hub/
├── uniCloud-alipay/
│   ├── cloudfunctions/     # 云函数
│   │   ├── login/          # 登录获取openid
│   │   ├── getUserInfo/   # 获取用户信息
│   │   ├── watchAd/       # 看广告获取积分
│   │   ├── checkUrlContent/# 检测URL有效性
│   │   ├── reportInvalid/  # 反馈失效链接
│   │   ├── searchResources/# 搜索资源
│   │   ├── uploadResource/ # 上传资源
│   │   ├── getResource/    # 获取资源链接
│   │   ├── getResourceDetail/# 获取资源详情
│   │   └── exchangeAdFree/ # 兑换免广告
│   └── database/          # 数据库结构
├── pages/
│   ├── index/             # 首页（资源列表）
│   ├── search/            # 搜索页
│   ├── upload/            # 上传页
│   ├── profile/           # 个人中心
│   └── resource/          # 资源详情
├── stores/user.js         # 状态管理
├── utils/index.js         # 云函数封装
├── App.vue                # 应用入口
├── main.js                # 入口文件
├── manifest.json          # 应用配置
├── pages.json             # 页面配置
└── README.md             # 项目文档
```

## 快速开始

### 1. 安装依赖

```bash
# 无需安装额外依赖，使用 HBuilderX 打开即可
```

### 2. 配置微信小程序

在 `manifest.json` 中修改：
```json
"mp-weixin": {
  "appid": "你的微信小程序AppID"
}
```

在代码中配置广告ID（pages/resource/resource.vue）：
```javascript
adUnitId: '你的激励视频广告位ID'
```

### 3. 配置云开发环境

在 `App.vue` 中修改：
```javascript
wx.cloud.init({
  env: '你的云环境ID'
})
```

在 `utils/index.js` 中修改：
```javascript
const CLOUD_ENV = '你的云环境ID'
```

### 4. 上传云函数

在 HBuilderX 中：
1. 右键 `uniCloud-alipay/cloudfunctions` 文件夹
2. 选择「上传部署」
3. 依次上传每个云函数

### 5. 创建数据库集合

在支付宝云控制台创建以下集合：

| 集合名 | 用途 |
|--------|------|
| users | 用户积分/免广告次数 |
| resources | 资源信息 |
| feedbacks | 反馈记录 |
| ad_logs | 广告观看日志 |

### 6. 运行项目

在 HBuilderX 中运行到微信开发者工具。

---

## API 文档

### 1. login - 用户登录

获取或创建用户，自动生成 openid。

**请求参数**：无

**返回示例**：
```json
{
  "success": true,
  "data": {
    "openid": "oXXXX",
    "points": 0,
    "ad_free_count": 0,
    "total_ads_watched": 0,
    "total_resources_uploaded": 0
  }
}
```

---

### 2. getUserInfo - 获取用户信息

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| openid | string | 否 | 用户openid，云函数自动获取 |

**返回示例**：
```json
{
  "success": true,
  "data": {
    "openid": "oXXXX",
    "nickname": "用户昵称",
    "points": 100,
    "ad_free_count": 2,
    "total_ads_watched": 50,
    "total_resources_uploaded": 5
  }
}
```

---

### 3. watchAd - 看广告获取积分

规则：每天前3次13积分，之后10积分。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| adId | string | 否 | 广告ID，用于防刷 |
| resource_id | string | 否 | 资源ID，记录看广告对应的资源 |

**返回示例**：
```json
{
  "success": true,
  "data": {
    "points": 13,
    "todayCount": 1,
    "totalPoints": 113
  },
  "message": "获得 13 积分"
}
```

---

### 4. searchResources - 搜索资源

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词 |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

**返回示例**：
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "_id": "xxx",
        "title": "资源标题",
        "description": "资源描述",
        "url": "https://...",
        "ad_count": 1,
        "uploader_nickname": "上传者",
        "view_count": 100
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

---

### 5. uploadResource - 上传资源

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 资源标题 |
| url | string | 是 | 资源链接 |
| description | string | 否 | 资源描述 |
| ad_count | number | 否 | 需要看的广告数量1-3，默认1 |
| nickname | string | 否 | 上传者昵称 |

**返回示例**：
```json
{
  "success": true,
  "data": {
    "resource_id": "xxx"
  },
  "message": "上传成功"
}
```

---

### 6. getResourceDetail - 获取资源详情

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resource_id | string | 是 | 资源ID |

**返回示例**：
```json
{
  "success": true,
  "data": {
    "_id": "xxx",
    "title": "资源标题",
    "description": "资源描述",
    "url": "https://...",
    "ad_count": 1,
    "uploader_nickname": "上传者",
    "view_count": 100,
    "feedback_count": 0,
    "create_time": 1234567890
  }
}
```

---

### 7. getResource - 获取资源链接

获取资源链接，需要看广告或使用免广告次数。看满所需广告数量后返回链接。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resource_id | string | 是 | 资源ID |
| use_ad_free | boolean | 否 | 是否使用免广告，默认false |

**返回示例（未看完广告）**：
```json
{
  "success": true,
  "data": {
    "url": null,
    "ad_count": 2,
    "watched_count": 0,
    "remaining_ads": 2,
    "used_ad_free": false
  },
  "message": "还需观看2个广告，已观看0个"
}
```

**返回示例（已看完广告/使用免广告）**：
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "ad_count": 2,
    "used_ad_free": false,
    "already_watched": true
  },
  "message": "获取成功"
}
```

---

### 8. exchangeAdFree - 兑换免广告次数

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| count | number | 否 | 兑换次数，默认1（100积分/次） |

**返回示例**：
```json
{
  "success": true,
  "data": {
    "cost": 100,
    "exchanged": 1,
    "remaining_points": 50,
    "ad_free_count": 3
  },
  "message": "成功兑换1次免广告"
}
```

---

### 9. reportInvalid - 反馈失效链接

系统自动检测链接是否有效，无效返还30积分。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resource_id | string | 是 | 资源ID |
| url | string | 是 | 资源链接 |

**返回示例**：
```json
{
  "success": true,
  "refunded": true,
  "points": 30,
  "message": "链接无效，返还30积分"
}
```

---

### 10. checkUrlContent - 检测URL有效性

检测URL是否包含有效内容（云函数内部调用）。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | 要检测的URL |

**返回示例**：
```json
{
  "valid": true,
  "message": "URL有效"
}
```

---

## 积分规则详解

| 场景 | 积分变化 | 备注 |
|------|---------|------|
| 主动看广告(每日1-3次) | +13 | 每日刷新 |
| 主动看广告(第4次起) | +10 | 每日刷新 |
| 反馈失效链接确认 | +30 | 需系统检测确认 |
| 兑换免广告 | -100 | 获得1次免广告 |
| 使用免广告 | -1次 | 直接获取链接 |

---

## 业务流程图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  用户上传   │ ──▶ │  资源展示   │ ──▶ │  用户搜索   │
│  链接/名称  │     │  列表页    │     │  关键词    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  反馈失效   │ ◀── │  看广告获取 │ ◀── │  资源详情   │
│  返还积分   │     │  链接      │     │  页面      │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 广告配置

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 前往「流量主」→「广告位管理」
3. 创建「激励视频广告」广告位
4. 获取广告位ID填入代码

---

## 技术栈

- **前端框架**: uniapp + Vue 3
- **状态管理**: Pinia
- **后端**: 支付宝云开发（云函数 + 云数据库）
- **运行平台**: 微信小程序

---

## 许可证

MIT License
