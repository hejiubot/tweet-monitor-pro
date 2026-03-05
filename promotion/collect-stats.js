#!/usr/bin/env node
/**
 * 数据收集脚本
 * 收集 GitHub、ClawHub、SkillPay 的关键指标
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// === 配置 ===
const GITHUB_REPO = 'hejiubot/tweet-monitor-pro';
const CLAWHUB_SKILL_ID = process.env.CLAWHUB_SKILL_ID || 'k97f8tdg1cvjjjcevwy8mjmw6n82av75';
const SKILLPAY_API_KEY = process.env.SKILLPAY_API_KEY;
const SKILLPAY_SKILL_ID = process.env.SKILLPAY_SKILL_ID;

const DATA_DIR = path.join(__dirname, '../data');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// === 获取 GitHub 数据 ===
async function fetchGitHubStats() {
  try {
    const [traffic, stargazers] = await Promise.all([
      axios.get(`https://api.github.com/repos/${GITHUB_REPO}/traffic/views`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        params: { per: 'day' }
      }),
      axios.get(`https://api.github.com/repos/${GITHUB_REPO}/stargazers`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        params: { per_page: 1 }
      })
    ]);
    
    const views = traffic.data.views || [];
    const latestViews = views[views.length - 1] || { count: 0, uniques: 0 };
    
    return {
      stars: parseInt(stargazers.headers.link?.match(/per_page=1&page=(\d+)/)?.[1] || '0'),
      views: latestViews.count,
      unique_visitors: latestViews.uniques
    };
  } catch (error) {
    console.error('GitHub API error:', error.message);
    return { stars: 0, views: 0, unique_visitors: 0 };
  }
}

// === 获取 SkillPay 数据（如果有）===
async function fetchSkillPayStats() {
  if (!SKILLPAY_API_KEY || !SKILLPAY_SKILL_ID) {
    return { enabled: false };
  }
  
  try {
    // 获取最近交易
    const resp = await axios.get('https://skillpay.me/api/v1/transactions', {
      headers: { 'X-API-Key': SKILLPAY_API_KEY },
      params: { skill_id: SKILLPAY_SKILL_ID, limit: 100 }
    });
    
    const transactions = resp.data.transactions || [];
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const uniqueUsers = new Set(transactions.map(t => t.user_id)).size;
    
    return {
      enabled: true,
      total_revenue: totalRevenue,
      transactions_count: transactions.length,
      paying_users: uniqueUsers
    };
  } catch (error) {
    console.error('SkillPay API error:', error.message);
    return { enabled: false, error: error.message };
  }
}

// === 获取本地用户数据 ===
function fetchLocalStats() {
  const usersPath = path.join(__dirname, '../users.json');
  let totalUsers = 0;
  let totalCreditsConsumed = 0;
  let plans = { free: 0, pro: 0, business: 0 };
  
  try {
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      totalUsers = Object.keys(users).length;
      
      for (const user of Object.values(users)) {
        plans[user.plan] = (plans[user.plan] || 0) + 1;
        // 计算消耗的 credits（初始10 + 添加的 - 当前余额）
        if (user.initialBalance && user.balance !== undefined) {
          totalCreditsConsumed += (user.initialBalance - user.balance);
        }
      }
    }
  } catch (e) {
    console.error('Local users read error:', e.message);
  }
  
  return { totalUsers, totalCreditsConsumed, plans };
}

// === 保存统计数据 ===
function saveStats(stats) {
  let history = [];
  try {
    if (fs.existsSync(STATS_FILE)) {
      history = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
    }
  } catch (e) {}
  
  // 添加今日数据
  const today = new Date().toISOString().split('T')[0];
  const existingIndex = history.findIndex(d => d.date === today);
  
  const newEntry = {
    date: today,
    timestamp: Date.now(),
    ...stats
  };
  
  if (existingIndex >= 0) {
    history[existingIndex] = newEntry;
  } else {
    history.push(newEntry);
  }
  
  // 保留最多 90 天历史
  if (history.length > 90) {
    history = history.slice(-90);
  }
  
  fs.writeFileSync(STATS_FILE, JSON.stringify(history, null, 2));
  console.log(`📊 统计数据已保存: ${STATS_FILE}`);
}

// === 生成简洁报告 ===
function generateReport(stats) {
  const lines = [
    '=== Tweet Monitor Pro - 每日数据报告 ===',
    `日期: ${new Date().toLocaleDateString('zh-CN')}`,
    '',
    '📦 GitHub',
    `  ⭐ Stars: ${stats.github.stars}`,
    `  👀 Views: ${stats.github.views}`,
    `  👤 Visitors: ${stats.github.unique_visitors}`,
    '',
    '👥 本地用户',
    `  总用户数: ${stats.local.totalUsers}`,
    `  计划分布: Free=${stats.local.plans.free}, Pro=${stats.local.plans.pro}, Business=${stats.local.plans.business}`,
    `  累计消耗: ${stats.local.totalCreditsConsumed} credits`,
    ''
  ];
  
  if (stats.skillpay.enabled) {
    lines.push(
      '💰 SkillPay',
      `  总收入: $${stats.skillpay.total_revenue.toFixed(2)}`,
      `  付费用户: ${stats.skillpay.paying_users}`,
      `  交易数: ${stats.skillpay.transactions_count}`
    );
  }
  
  lines.push('');
  return lines.join('\n');
}

// === 主逻辑 ===
async function main() {
  console.log('📈 开始收集统计数据...');
  
  const [github, local, skillpay] = await Promise.all([
    fetchGitHubStats(),
    Promise.resolve(fetchLocalStats()),
    fetchSkillPayStats()
  ]);
  
  const stats = { github, local, skillpay };
  
  // 保存
  saveStats(stats);
  
  // 输出报告
  const report = generateReport(stats);
  console.log(report);
  
  // 可选：发送到监控 Webhook
  if (process.env.WEBHOOK_URL) {
    try {
      await axios.post(process.env.WEBHOOK_URL, { stats, report });
      console.log('📡 已发送到 Webhook');
    } catch (e) {
      console.error('Webhook 发送失败:', e.message);
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, generateReport };
