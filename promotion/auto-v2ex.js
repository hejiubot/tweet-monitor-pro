#!/usr/bin/env node
/**
 * 自动化 V2EX 推广脚本
 * 发布到 V2EX 开源项目板块
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// === 配置 ===
const V2EX_USERNAME = process.env.V2EX_USERNAME;
const V2EX_PASSWORD = process.env.V2EX_PASSWORD;

const TARGET_NODE = 'opensource'; // 开源项目板块
const POST_TITLE = `[开源] Tweet Monitor Pro - 无需 API 抓取 X/Twitter 推文的 OpenClaw 技能`;
const POST_BODY = `我开发了一个 OpenClaw 商业技能：**Tweet Monitor Pro**

**功能：**
- 抓取 X/Twitter 推文、回复、用户时间线
- 支持中文平台：微博、Bilibili、CSDN
- 无需登录，无需 API 密钥

**定价：**
- Free: 10 次免费试用
- Pro: $1.9 一次性（1000 次调用）
- Business: $9.9 一次性（10000 次调用）

**安装：**
\`openclaw skills install tweet-monitor-pro\`

**GitHub：** https://github.com/hejiubot/tweet-monitor-pro

**ClawHub：** https://clawhub.com/skills/tweet-monitor-pro

欢迎试用、反馈、Star 🌟`;

// === 模拟登录 ===
async function loginV2EX() {
  const loginUrl = 'https://v2ex.com/signin';
  
  try {
    // 1. 获取登录页面，提取隐藏字段
    const loginPage = await axios.get(loginUrl);
    const $ = cheerio.load(loginPage.data);
    const once = $('input[name=once]').val();
    const ua = $('input[name=ua]').val();
    
    // 2. 提交登录
    const resp = await axios.post(
      loginUrl,
      new URLSearchParams({
        u: V2EX_USERNAME,
        p: V2EX_PASSWORD,
        once: once,
        ua: ua,
        next: '/'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; TweetMonitorPro/1.0)',
          'Referer': loginUrl
        },
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: status => status < 400 || status === 302
      }
    );
    
    // 3. 提取 session cookie
    const cookies = resp.headers['set-cookie'];
    const sessionMatch = cookies.find(c => c.startsWith('V2EX_SETKEY='));
    if (!sessionMatch) {
      console.error('登录失败：未获取到 session');
      return null;
    }
    
    const sessionCookie = sessionMatch.split(';')[0];
    console.log('✅ 登录成功');
    return sessionCookie;
  } catch (error) {
    console.error('V2EX 登录失败:', error.response?.status, error.message);
    return null;
  }
}

// === 获取 once 值（发帖用）===
async function getOnceForNewTopic(sessionCookie) {
  try {
    const resp = await axios.get(`https://v2ex.com/go/${TARGET_NODE}`, {
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (compatible; TweetMonitorPro/1.0)'
      }
    });
    
    const $ = cheerio.load(resp.data);
    const once = $('input[name=once]').val();
    return once;
  } catch (error) {
    console.error('获取 once 失败:', error.message);
    return null;
  }
}

// === 发帖 ===
async function createTopic(sessionCookie, once, title, body) {
  try {
    const resp = await axios.post(
      'https://v2ex.com/new',
      new URLSearchParams({
        node_name: TARGET_NODE,
        title: title,
        content: body,
        once: once
      }),
      {
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; TweetMonitorPro/1.0)',
          'Referer': `https://v2ex.com/go/${TARGET_NODE}`
        },
        maxRedirects: 0,
        validateStatus: status => status < 400 || status === 302
      }
    );
    
    // 重定向到新帖子
    const location = resp.headers.location;
    if (location && location.startsWith('/t/')) {
      const topicId = location.split('/')[2];
      return { success: true, url: `https://v2ex.com${location}`, id: topicId };
    }
    
    return { success: false, error: 'Unknown response' };
  } catch (error) {
    console.error('发帖失败:', error.response?.status, error.message);
    return { success: false, error: error.message };
  }
}

// === 记录发帖历史 ===
function markPosted() {
  const historyFile = path.join(__dirname, 'v2ex-post-history.json');
  const today = new Date().toISOString().split('T')[0];
  
  let history = {};
  if (fs.existsSync(historyFile)) {
    history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
  }
  
  history[today] = true;
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  console.log(`📝 记录今日发帖: ${today}`);
}

function hasPostedToday() {
  const historyFile = path.join(__dirname, 'v2ex-post-history.json');
  if (!fs.existsSync(historyFile)) return false;
  
  const history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
  const today = new Date().toISOString().split('T')[0];
  return history[today] === true;
}

// === 主逻辑 ===
async function main() {
  console.log('🌐 开始 V2EX 推广...');
  
  if (!V2EX_USERNAME || !V2EX_PASSWORD) {
    console.error('❌ 需要环境变量 V2EX_USERNAME 和 V2EX_PASSWORD');
    return;
  }
  
  if (hasPostedToday()) {
    console.log('⏭️  今天已发过，跳过');
    return;
  }
  
  const session = await loginV2EX();
  if (!session) return;
  
  const once = await getOnceForNewTopic(session);
  if (!once) {
    console.error('❌ 无法获取 once 值');
    return;
  }
  
  console.log('📤 发布到 V2EX...');
  const result = await createTopic(session, once, POST_TITLE, POST_BODY);
  
  if (result.success) {
    console.log(`✅ 发布成功: ${result.url}`);
    markPosted();
  } else {
    console.error(`❌ 发布失败: ${result.error}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
