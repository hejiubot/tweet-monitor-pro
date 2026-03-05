# 🚀 Tweet Monitor Pro - 自动化推广系统

## 📦 组件

```
promotion/
├── runner.js              # 主调度器（定时任务入口）
├── auto-tweet.js          # Twitter 自动发布
├── auto-discord.js        # Discord 自动发布
├── auto-reddit.js         # Reddit 自动发布
├── auto-v2ex.js           # V2EX 自动发布（中文）
├── auto-deploy.js         # 自动化部署（版本发布）
├── collect-stats.js       # 数据收集（GitHub/本地/SkillPay）
├── env.example            # 环境变量模板
└── task-history.json      # 任务执行历史（自动生成）
```

---

## ⚙️ 快速设置

### **1. 环境变量配置**

复制 `env.example` 为 `.env`，填入你的 API 凭证：

```bash
cd /root/.openclaw/workspace/tweet-monitor-pro
cp promotion/env.example promotion/.env
```

编辑 `.env`：

```bash
# Twitter API (optional - 需申请 Twitter Developer)
TWITTER_BEARER="your_bearer_token"
TWITTER_USER_ID="your_user_id"

# Discord Bot Token (optional)
DISCORD_BOT_TOKEN="your_bot_token"
DISCORD_CHANNEL_ID="your_channel_id"

# Reddit API (optional - 需创建 Reddit App)
REDDIT_USERNAME="your_username"
REDDIT_PASSWORD="your_password"
REDDIT_CLIENT_ID="your_client_id"
REDDIT_CLIENT_SECRET="your_client_secret"

# V2EX (optional)
V2EX_USERNAME="your_username"
V2EX_PASSWORD="your_password"

# ClawHub & SkillPay
CLAWHUB_SKILL_ID="k97f8tdg1cvjjjcevwy8mjmw6n82av75"
SKILLPAY_API_KEY="sk_..."
SKILLPAY_SKILL_ID="skill_..."
```

---

### **2. 安装依赖**

```bash
cd /root/.openclaw/workspace/tweet-monitor-pro
npm install axios cheerio
```

---

### **3. 立即测试**

测试单平台推广：

```bash
# 测试 Twitter
node promotion/auto-tweet.js

# 测试 Discord
node promotion/auto-discord.js

# 测试 Reddit (需配置)
node promotion/auto-reddit.js

# 测试 V2EX (需配置)
node promotion/auto-v2ex.js

# 测试数据收集
node promotion/collect-stats.js

# 查看部署预览（不实际发布）
node promotion/auto-deploy.js --dry-run
```

---

### **4. 设置定时任务（Cron）**

编辑 crontab：

```bash
crontab -e
```

添加以下行（每小时运行调度器）：

```
0 * * * * cd /root/.openclaw/workspace/tweet-monitor-pro && /usr/bin/node promotion/runner.js >> /var/log/tweet-monitor-promo.log 2>&1
```

保存后，cron 每小时自动检查并触发对应任务。

---

## 📋 任务时间表

| 任务 | 时间 | 频率 | 平台 |
|------|------|------|------|
| `tweet-promo-9am` | 09:00 每天 | 每天 | Twitter |
| `tweet-promo-4pm` | 16:00 每天 | 每天 | Twitter |
| `discord-promo` | 10:00 每天 | 每天 | Discord |
| `reddit-promo` | 11:00 每周一 | 每周 | Reddit |
| `v2ex-promo` | 14:00 每周三 | 每周 | V2EX |
| `collect-stats` | 每小时 0 分 | 每小时 | 数据收集 |
| `weekly-deploy-check` | 20:00 每周日 | 每周 | 部署检查 |

---

## 📊 数据收集

`collect-stats.js` 自动收集：

- **GitHub**: Stars, Views, Visitors（通过 GitHub API）
- **本地**: 用户数、计划分布、消耗 credits
- **SkillPay**: 收入、付费用户、交易数（如启用）

数据存储：`data/stats.json`（按日累积，保留 90 天）

报告生成：
```bash
node promotion/collect-stats.js
```

输出示例：
```
=== Tweet Monitor Pro - 每日数据报告 ===
日期: 2026-03-05

📦 GitHub
  ⭐ Stars: 5
  👀 Views: 120
  👤 Visitors: 45

👥 本地用户
  总用户数: 23
  计划分布: Free=15, Pro=6, Business=2
  累计消耗: 156 credits

💰 SkillPay
  总收入: $18.50
  付费用户: 3
  交易数: 8
```

---

## 🚀 手动发布新版本

```bash
# 1. 递增版本号（patch/minor/major）
node promotion/auto-deploy.js patch

# 自动执行：
# - 递增 version
# - git commit + tag + push
# - clawhub publish
# - 创建 GitHub Release (如 gh 可用)
```

---

## 🔐 API 凭证申请指南

### **Twitter API**

1. 访问 https://developer.twitter.com
2. 创建 Project + App
3. 获取 **Bearer Token** 和 **User ID**
4. 添加到 `.env`

### **Discord Bot**

1. 访问 https://discord.com/developers/applications
2. 创建 Bot，复制 Token
3. 邀请 Bot 到服务器（需要 `Send Messages` 权限）
4. 获取 Channel ID（右键复制）
5. 添加到 `.env`

### **Reddit API**

1. 访问 https://www.reddit.com/prefs/apps
2. Create App → script 类型
3. 获取 `client_id`（在 app 上方），`client_secret`
4. 添加到 `.env`

### **V2EX**

使用用户名/密码直接登录（无 OAuth）。添加到 `.env`。

---

## 📈 监控日志

```
# 查看最近日志
tail -f /var/log/tweet-monitor-promo.log

# 查看任务历史
cat data/task-history.json | jq .
```

---

## 🐛 故障排查

### **任务不执行**

- 确认 cron 已安装并运行：`systemctl status cron` 或 `crontab -l`
- 检查日志文件权限
- 确认 `node` 路径：`/usr/bin/node`（通过 `which node` 查看）

### **API 调用失败**

- 检查 `.env` 配置是否加载：`echo $TWITTER_BEARER`
- 确认 API 配额未超限
- 查看错误日志

### **GitHub Rate Limit**

GitHub API 未认证时每小时 60 次限制。使用 `GITHUB_TOKEN` 环境变量提升配额：

```bash
export GITHUB_TOKEN="ghp_..."
```

---

## 🎯 优化建议

1. **A/B 测试文案**：在 `auto-tweet.js` 中修改 `PROMO_TWEETS`，测试不同标题
2. **多账号轮转**：如果平台限制，可配置多个账号轮流发
3. **数据看板**：可将 `data/stats.json` 导入 Grafana/DataStudio
4. **用户反馈自动收集**：监听 GitHub Issues、Discord 消息，摘要发送到 Telegram/Email

---

## 📝 License

MIT © Hejiubot

---

**开始自动化赚钱！** 🚀
