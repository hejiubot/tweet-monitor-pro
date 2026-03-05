#!/usr/bin/env node
/**
 * 自动化 Twitter 推广脚本
 * 功能：定时发布推文、回复互动、监控互动数据
 */

const axios = require('axios');

// === 配置 ===
const TWITTER_BEARER = process.env.TWITTER_BEARER; // Twitter API v2 Bearer Token
const TWITTER_USER_ID = process.env.TWITTER_USER_ID; // 你的 Twitter 用户 ID
const PROMO_TWEETS = [
  {
    text: `🚀 Tweet Monitor Pro for OpenClaw is LIVE!

✅ No API keys needed
✅ Fetch tweets, replies, timelines
✅ Supports Weibo, Bilibili

Free: 10 calls
Pro: $1.9/mo (1000 calls)
Business: $9.9/mo (unlimited)

🔗 https://clawhub.com/skills/tweet-monitor-pro

#OpenClaw #Twitter #SaaS`,
    scheduled: "09:00" // 每天 9am 发
  },
  {
    text: `💡 Tip: Need to fetch X/Twitter data without API limits?

Try Tweet Monitor Pro — works with OpenClaw, no login required.

👉 https://clawhub.com/skills/tweet-monitor-pro

#OpenClaw #Automation`,
    scheduled: "16:00" // 每天 4pm 发
  }
];

// === 发布推文 ===
async function postTweet(text) {
  if (!TWITTER_BEARER) {
    console.error('TWITTER_BEARER not set');
    return { success: false, error: 'Missing credentials' };
  }

  try {
    const resp = await axios.post(
      'https://api.twitter.com/2/tweets',
      { text },
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, data: resp.data };
  } catch (error) {
    console.error('Tweet failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// === 检查是否已发过（避免重复） ===
async function getRecentTweets(count = 10) {
  if (!TWITTER_BEARER) return [];

  try {
    const resp = await axios.get(
      `https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets`,
      {
        params: { max_results: count },
        headers: { 'Authorization': `Bearer ${TWITTER_BEARER}` }
      }
    );
    return resp.data.data || [];
  } catch (error) {
    console.error('Fetch tweets failed:', error.message);
    return [];
  }
}

// === 主逻辑 ===
async function main() {
  console.log('🚀 开始 Twitter 推广自动化...');
  
  // 获取最近推文
  const recent = await getRecentTweets(20);
  const recentTexts = recent.map(t => t.text).join('\n');
  
  // 检查哪些需要发
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  for (const promo of PROMO_TWEETS) {
    // 检查时间匹配
    if (promo.scheduled !== currentTime) continue;
    
    // 检查是否已发过（简单去重）
    if (recentTexts.includes(promo.text.substring(0, 30))) {
      console.log(`⏰ 跳过（已发过）: ${promo.text.substring(0, 40)}...`);
      continue;
    }
    
    // 发布
    console.log(`📤 发布推文: ${promo.text.substring(0, 50)}...`);
    const result = await postTweet(promo.text);
    
    if (result.success) {
      console.log(`✅ 发布成功: https://twitter.com/i/web/status/${result.data.id}`);
    } else {
      console.error(`❌ 发布失败: ${result.error}`);
    }
  }
  
  console.log('✅ 完成');
}

// 命令行运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { postTweet, getRecentTweets, main };
