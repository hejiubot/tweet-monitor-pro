# Tweet Monitor Pro - 管理员手册

## 📊 用户管理

### **查看所有用户**

```bash
cat /root/.openclaw/skills/tweet-monitor-pro/users.json | jq .
```

---

### **手动充值**

```bash
node -e "
const skill = require('/root/.openclaw/workspace/tweet-monitor-pro/index.js');
skill.addCredits.execute({amount: 100}, {userId: 'target-user-id'})
  .then(r => console.log(r))
  .catch(console.error);
"
```

---

### **修改用户计划**

```bash
node -e "
const skill = require('/root/.openclaw/workspace/tweet-monitor-pro/index.js');
skill.upgradePlan.execute({plan: 'pro'}, {userId: 'target-user-id'})
  .then(r => console.log(r));
"
```

可用计划：`free`, `pro`, `business`

---

### **查看用户详情**

```bash
node -e "
const users = require('/root/.openclaw/skills/tweet-monitor-pro/users.json');
console.log(users['user-id-here']);
"
```

---

## 💰 收入统计（SkillPay）

如果启用了 SkillPay，登录 https://skillpay.me/dashboard 查看：
- 充值用户数
- 总充值金额
- 最近交易记录

你的收入 = 充值金额 × 95%（SkillPay 抽 5%）

---

## 📈 监控数据

### **ClawHub 后台**

访问 https://clawhub.com/dashboard/skills
- 下载量
- 活跃安装数
- 用户评分

### **GitHub Insights**

访问 https://github.com/hejiubot/tweet-monitor-pro
- Traffic → Views, Clones
- Insights → Community, Dependencies

---

## 🔄 版本更新流程

### **1. 本地修改代码**

编辑 `index.js` 或其他文件。

### **2. 递增版本号**

```bash
cd /root/.openclaw/workspace/tweet-monitor-pro
npm version patch  # 或 minor/major
```

这会更新 `package.json` 和生成 git tag。

### **3. 推送到 GitHub**

```bash
git push origin main --tags
```

### **4. 发布到 ClawHub**

```bash
clawhub publish
```

会自动创建新版本 release。

### **5. 更新 GitHub Release**

访问 https://github.com/hejiubot/tweet-monitor-pro/releases
编辑 `v1.1.0` 的 description，填写更新日志。

---

## 🐛 故障排查

### **问题：技能无法加载**

**检查：**
```bash
ls ~/.openclaw/skills/tweet-monitor-pro/
# 确保 index.js、package.json、node_modules 存在
```

**解决：**
```bash
cd ~/.openclaw/skills/tweet-monitor-pro
npm install
```

重启 OpenClaw。

---

### **问题：用户调用失败，返回 "Feature not allowed"**

原因：用户 plan 权限不足。

解决：升级用户计划到 `pro` 或 `business`。

---

### **问题：抓取推文失败，报错 Python 脚本**

检查 x-tweet-fetcher 是否已安装：
```bash
ls /root/.openclaw/workspace/skills/x-tweet-fetcher/scripts/fetch_tweet.py
```

如果不存在，需要先安装 x-tweet-fetcher 技能。

---

### **问题：SkillPay 充值链接返回 404**

原因：Skill ID 未配置或 Welcome Tokens 未开启。

解决：
1. 确认环境变量已设置：
   ```bash
   echo $TWEET_MONITOR_PRO_SKILL_ID
   ```
2. 在 SkillPay 面板开启 "Welcome Tokens"（10 tokens）
3. 或手动给用户充值

---

## 🔧 配置参考

### **环境变量**

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `TWEET_MONITOR_PRO_SKILL_ID` | ClawHub Skill ID | `k97f8tdg...` |
| `OPENCLAWSKILLS_TWEET_MONITOR_PRO_SKILL_ID` | 备用 Skill ID | |
| `SKILLPAY_API_KEY` | SkillPay API Key | `sk_xxxxx` |
| `SKILLPAY_SKILL_ID` | SkillPay Skill ID | `skill_xxxxx` |
| `USER_DB` | 用户数据库路径 | `/custom/path/users.json` |

---

## 📊 品牌资源

- **Logo**: 暂无，可使用 ClawHub 默认图标
- **颜色**: 蓝色主题 (#1DA1F2 Twitter 蓝)
- **字体**: 默认系统字体

---

## 📝 待办事项

- [ ] 创建 Twitter 官方账号 @TweetMonitorPro（可选）
- [ ] 设置用户反馈表单（Typeform 或 Google Forms）
- [ ] 准备 v1.1.0 功能列表
- [ ] 联系 OpenClaw 官方推荐（达到一定用户数后）

---

**祝生意兴隆！** 🚀
