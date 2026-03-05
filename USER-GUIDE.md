# Tweet Monitor Pro - 用户使用指南

## 📦 安装

1. 访问 ClawHub: https://clawhub.com/skills/tweet-monitor-pro
2. 点击 **"Install"** 或 **"安装"**
3. 确认安装到 OpenClaw

---

## 🚀 快速开始

### **1. 初始化用户**

```javascript
// 在 OpenClaw 中调用
const skill = require('tweet-monitor-pro');
await skill.init('your-user-id');
```

**返回：**
```json
{
  "success": true,
  "message": "用户已初始化 (free, 10 tokens)",
  "user": {
    "plan": "free",
    "balance": 10,
    "features": ["fetchTweet"]
  }
}
```

新用户自动获得 **10 tokens** 免费试用。

---

### **2. 抓取一条推文**

```javascript
await skill.fetchTweet.execute({
  url: 'https://x.com/elonmusk/status/123456789'
}, { userId: 'your-user-id' });
```

**成功返回：**
```json
{
  "success": true,
  "data": {
    "tweet": {
      "id": "123456789",
      "text": "Tweet content...",
      "author": { "username": "elonmusk", "name": "Elon Musk" },
      "metrics": { "likes": 1000, "retweets": 200, "replies": 50 },
      "media": [...]
    }
  },
  "user": { "plan": "free", "balance": 9 }
}
```

消耗 1 token。

---

### **3. 查询余额和状态**

```javascript
await skill.getQuota.execute({}, { userId: 'your-user-id' });
```

**返回：**
```json
{
  "success": true,
  "data": {
    "plan": "free",
    "balance": 9,
    "features": ["fetchTweet"],
    "allPlans": ["free", "pro", "business"]
  }
}
```

---

## 🔧 功能详解

### **fetchTweet - 抓取单条推文**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `url` | string | ✅ | 推文 URL（支持 x.com 和 twitter.com） |
| `textOnly` | boolean | ❌ | 仅返回文本（默认 false） |

**示例：**
```javascript
skill.fetchTweet.execute({
  url: 'https://x.com/user/status/123',
  textOnly: true
}, { userId });
```

---

### **fetchThread - 抓取推文+所有回复**

**权限：** Pro / Business 计划

```javascript
skill.fetchThread.execute({
  url: 'https://x.com/user/status/123'
}, { userId });
```

消耗 1 token。

> **注意：** 深度回复需要 Camofox 服务支持。如果未配置，会返回错误。

---

### **fetchTimeline - 抓取用户时间线**

**权限：** Pro / Business 计划

```javascript
skill.fetchTimeline.execute({
  username: 'elonmusk',
  limit: 50  // 默认 50，最大 200
}, { userId });
```

消耗 1 token（无论返回多少条推文）。

---

### **monitorUser - 监控用户新推文**

**权限：** Pro / Business 计划

```javascript
skill.monitorUser.execute({
  username: 'elonmusk',
  baselineFile: '/path/to/baseline.json'  // 可选，用于增量比较
}, { userId });
```

返回与之前扫到的差异。

---

### **upgradePlan - 升级计划**

```javascript
skill.upgradePlan.execute({
  plan: 'pro'  // 或 'business'
}, { userId });
```

升级后立即解锁对应功能。

---

### **addCredits - 充值（管理员）**

```javascript
skill.addCredits.execute({
  amount: 100  // 充值 100 tokens
}, { userId: 'target-user-id' });
```

仅管理员可用。

---

## 💰 计费说明

| 计划 | 功能 | 价格 | Token 数量 |
|------|------|------|-----------|
| **Free** | fetchTweet | 免费 | 10 (一次性) |
| **Pro** | 所有功能 | $1.9/月 | 1000 tokens/月 |
| **Business** | 所有功能 | $9.9/月 | 无限量 |

**消耗规则：**
- 每次 API 调用消耗 **1 token**
- 无论抓取 1 条还是 50 条，都只消耗 1 token
- 失败不扣 token

---

## ❓ 常见问题

### **Q: 余额不足怎么办？**
A: 联系管理员升级到 Pro/Business 计划，或充值 token。

### **Q: fetchThread 报错 Camofox？**
A: 需要先启动 Camofox 服务，并配置 `CAMEOFOX_ENABLED=true`。Pro/Business 用户可联系管理员开通。

### **Q: 支持哪些平台？**
A:
- ✅ X/Twitter（全部功能）
- ✅ 微博 (weibo.com)
- ✅ Bilibili (bilibili.com)
- ✅ CSDN (csdn.net)
- ✅ 微信公众号（需 Camofox）

### **Q: 如何导出数据？**
A: 技能返回的都是 JSON，可以直接保存到文件。如需批量导出，可编写脚本循环调用。

### **Q: 有配额限制吗？**
A: Free 计划 10 次后需升级。Pro 每月 1000 次，Business 不限。

---

## 📞 获取帮助

- **Issues**: https://github.com/hejiubot/tweet-monitor-pro/issues
- **文档**: https://github.com/hejiubot/tweet-monitor-pro/blob/main/README.md
- **更新日志**: CHANGELOG.md

---

**祝你使用愉快！** 🎉
