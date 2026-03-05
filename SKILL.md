---
name: Tweet Monitor Pro
description: Fetch X/Twitter tweets, replies, and timelines without login or API keys. Also supports Chinese platforms (Weibo, Bilibili, CSDN, WeChat).
---

# Tweet Monitor Pro

Commercial X/Twitter scraping skill for OpenClaw. No login, no API keys required.

## Features

✅ **Zero-dependency basics**: Fetch single tweets without Camofox  
✅ **Advanced features**: Reply threads, user timelines, Google search (requires Camofox)  
✅ **Chinese platforms**: Weibo, Bilibili, CSDN, WeChat Articles (some without Camofox)  
✅ **Quota management**: Subscription-based usage limits  
✅ **SkillPay ready**: Optional integration for automatic billing

---

## Subscription Plans

| Plan | Price/Month | Quota | Features |
|------|-------------|-------|----------|
| Free | $0 | 10 calls | Single tweet fetch |
| Pro | $1.9 | 1,000 calls | All basic + timelines + replies + search |
| Business | $9.9 | Unlimited | Everything + API access + priority support |

---

## Quick Start

### 1. Install

```bash
# From ClawHub
openclaw skills install tweet-monitor-pro

# Or manual
cp -r tweet-monitor-pro ~/.openclaw/skills/
```

### 2. (Optional) Start Camofox for Advanced Features

```bash
openclaw plugins install @askjo/camofox-browser
# or manually: git clone https://github.com/jo-inc/camofox-browser && npm install && npm start
```

### 3. Use

```javascript
// Fetch single tweet
const result = await agent.execute('tweet-monitor-pro.fetchTweet', {
  url: 'https://x.com/user/status/123456'
});
console.log(result.data.tweet.text);

// Fetch thread (replies)
const thread = await agent.execute('tweet-monitor-pro.fetchThread', {
  url: 'https://x.com/user/status/123456'
});
console.log(thread.data.replies);

// Fetch user timeline
const timeline = await agent.execute('tweet-monitor-pro.fetchTimeline', {
  username: 'elonmusk',
  limit: 50
});

// Check quota
const quota = await agent.execute('tweet-monitor-pro.getQuota', {});
console.log(`${quota.data.used}/${quota.data.limit} calls used`);

// Upgrade plan
await agent.execute('tweet-monitor-pro.upgradePlan', { plan: 'pro' });
```

---

## Tools

| Tool | Description | Quota Cost | Plan Required |
|------|-------------|------------|---------------|
| `fetchTweet` | Fetch single tweet (content + stats) | 1 call | Free+ |
| `fetchThread` | Fetch tweet + all replies (nested) | 3 calls | Pro+ |
| `fetchTimeline` | Fetch user timeline (max 300) | 1 per 50 tweets | Pro+ |
| `monitorUser` | Incremental monitor for new mentions | 1 per check | Pro+ |
| `getQuota` | Check remaining quota | 0 | All |
| `upgradePlan` | Upgrade subscription plan | 0 | All |

---

## Commercial Integration

### SkillPay.me Integration (Automatic Billing)

1. Create your skill on [SkillPay.me](https://skillpay.me)
2. Get API key and skill ID
3. Set environment variables on the OpenClaw host:

```bash
export SKILLPAY_API_KEY="your_api_key"
export SKILLPAY_SKILL_ID="your_skill_id"
```

The skill will automatically:
- Report usage for each API call
- Create subscription records when users upgrade
- Enable automated revenue collection in crypto (BNB Chain USDT)

**Billing model** (SkillPay):
- **Rate**: 1 USDT = 1000 API calls (across all features)
- **Feature multipliers**:
  - `fetchTweet`: 1 unit per call
  - `fetchThread`: 3 units per call (3× fetchTweet)
  - `fetchTimeline`: 1 unit per 50 tweets
  - `monitorUser`: 1 unit per check

Your ClawHub pricing:
- Pro: $1.9/month for 1000 calls → 1.9 USDT revenue
- Business: $9.9/month unlimited → 9.9 USDT revenue

**Without SkillPay**: You manage billing manually (users contact you for upgrades).  
**With SkillPay**: Fully automated, users pay via Stripe/crypto, you receive USDT on BNB Chain (5% platform fee).

---

## Technical Details

- **Basic fetching**: Uses FxTwitter public endpoint (no authentication)
- **Advanced fetching**: Camofox + Nitter (bypasses Cloudflare)
- **Chinese platforms**: Camofox renders JS + custom parsers
- **Output format**: Standard JSON (text, stats, media URLs)
- **Storage**: Local JSON file (`quotas.json`) for user quotas. For production, consider Redis or database.

---

## Deployment Checklist

- [x] Skill packaged and published to ClawHub
- [ ] GitHub repository created (https://github.com/HEJIUBOT/tweet-monitor-pro)
- [ ] SkillPay.me skill created and API keys configured
- [ ] Camofox server deployed (for advanced features)
- [ ] Web frontend for user signup/billing (optional but recommended)

---

## FAQ

**Q: Why can't I fetch some tweets?**  
A: Protected accounts or X restrictions. Public accounts usually work.

**Q: What is Camofox?**  
A: An anti-detection browser service running on localhost:9377. Used to bypass Cloudflare and JavaScript challenges for advanced features (timelines, replies).

**Q: What happens when my quota runs out?**  
A: Upgrade to Pro/Business or wait for monthly reset (Free plan resets on 1st of each month).

**Q: Can I do bulk fetching?**  
A: Business plan supports bulk operations via API. For Pro, call multiple times within quota.

**Q: How do I get paid?**  
A: With SkillPay integration, revenue is automatically deposited to your BNB Chain wallet. Without SkillPay, you handle billing manually.

---

## License

MIT - Commercial use allowed.

---

## Support

For issues and feature requests, please open an issue on GitHub: https://github.com/HEJIUBOT/tweet-monitor-pro/issues
