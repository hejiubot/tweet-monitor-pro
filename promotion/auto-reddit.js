#!/usr/bin/env node
/**
 * 自动化 Reddit 推广脚本
 * 支持：r/selfhosted, r/SideProject, r/OpenClaw（如果存在）
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// === 配置 ===
const REDDIT_USERNAME = process.env.REDDIT_USERNAME;
const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD;
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

const TARGET_SUBREDDITS = ['selfhosted', 'SideProject', 'OpenClaw'];
const POST_TITLE = `[Launch] Tweet Monitor Pro - Fetch X/Twitter without API keys`;
const POST_BODY = `I just launched **Tweet Monitor Pro** for OpenClaw!

**What it does:**
- Fetch X/Twitter tweets, replies, timelines
- Supports Chinese platforms: Weibo, Bilibili, CSDN
- No login, no API keys required

**Pricing:**
- Free: 10 calls
- Pro: $1.9 one-time (1000 tokens)
- Business: $9.9 one-time (10,000 tokens)

**Install:** \`openclaw skills install tweet-monitor-pro\`

**GitHub:** https://github.com/hejiubot/tweet-monitor-pro

Happy to answer questions! Feedback welcome.`;

// === 获取 OAuth2 token ===
async function getAccessToken() {
  const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
  
  try {
    const resp = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      `grant_type=password&username=${REDDIT_USERNAME}&password=${REDDIT_PASSWORD}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return resp.data.access_token;
  } catch (error) {
    console.error('Reddit auth failed:', error.response?.data || error.message);
    return null;
  }
}

// === 发布帖子 ===
async function submitPost(subreddit, title, body, accessToken) {
  try {
    const resp = await axios.post(
      `https://oauth.reddit.com/api/submit`,
      new URLSearchParams({
        sr: subreddit,
        title: title,
        text: body,
        kind: 'self'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return { success: true, data: resp.data };
  } catch (error) {
    if (error.response?.status === 409) {
      return { success: false, error: 'duplicate', message: 'Already posted in this subreddit' };
    }
    console.error('Reddit post failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// === 检查用户是否已发过 ===
function hasPostedBefore(subreddit) {
  const historyFile = path.join(__dirname, 'reddit-post-history.json');
  try {
    if (fs.existsSync(historyFile)) {
      const history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      return history[subreddit]?.includes(POST_TITLE.substring(0, 50));
    }
  } catch (e) {}
  return false;
}

// === 记录已发帖 ===
function recordPosted(subreddit, postId) {
  const historyFile = path.join(__dirname, 'reddit-post-history.json');
  let history = {};
  try {
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    }
  } catch (e) {}
  
  if (!history[subreddit]) history[subreddit] = [];
  history[subreddit].push(POST_TITLE.substring(0, 50));
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// === 主逻辑 ===
async function main() {
  console.log('📱 开始 Reddit 推广...');
  
  const token = await getAccessToken();
  if (!token) {
    console.error('❌ 无法获取 Reddit access token');
    return;
  }
  
  console.log('✅ 已获取 access token');
  
  for (const subreddit of TARGET_SUBREDDITS) {
    console.log(`\n📌 处理 r/${subreddit}...`);
    
    if (hasPostedBefore(subreddit)) {
      console.log(`⏭️  跳过（已发过）`);
      continue;
    }
    
    const result = await submitPost(subreddit, POST_TITLE, POST_BODY, token);
    
    if (result.success) {
      console.log(`✅ 发布成功: https://reddit.com/r/${subreddit}/comments/${result.data.json.data.id}`);
      recordPosted(subreddit, result.data.json.data.id);
    } else if (result.error === 'duplicate') {
      console.log(`⚠️  已发过`);
      recordPosted(subreddit, 'duplicate');
    } else {
      console.error(`❌ 失败: ${result.error}`);
    }
  }
  
  console.log('\n✅ 完成');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
