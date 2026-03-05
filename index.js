#!/usr/bin/env node
/**
 * Tweet Monitor Pro - Local Quota Version (without SkillPay)
 * 商业化版 X 推文抓取工具
 * 计费：1 token = 1 次调用，新用户送 10 tokens
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 用户计划定义（功能解锁）
const PLANS = {
  free: { 
    features: ['fetchTweet'],
    description: 'Free tier - 10 tokens welcome'
  },
  pro: { 
    features: ['fetchTweet', 'fetchThread', 'fetchTimeline', 'monitorUser'],
    description: 'Pro plan - full access'
  },
  business: { 
    features: ['*'],  // 所有功能
    description: 'Business plan - everything unlimited'
  }
};

// 用户数据库（本地 JSON）
const USER_DB = process.env.USER_DB || path.join(__dirname, 'users.json');

function loadUsers() {
  try {
    if (fs.existsSync(USER_DB)) {
      return JSON.parse(fs.readFileSync(USER_DB, 'utf-8'));
    }
  } catch (e) {
    console.error('Users DB error:', e.message);
  }
  return {};
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USER_DB, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Save users failed:', e.message);
  }
}

// 获取用户信息（首次自动初始化，送 10 tokens）
function getUser(userId) {
  const users = loadUsers();
  if (!users[userId]) {
    users[userId] = {
      plan: 'free',
      createdAt: new Date().toISOString(),
      balance: 10,  // 新用户送 10 tokens
      totalCharged: 0
    };
    saveUsers(users);
  }
  return users[userId];
}

// 检查功能权限
function checkFeatureAccess(plan, feature) {
  const planInfo = PLANS[plan];
  if (!planInfo) return false;
  if (planInfo.features.includes('*')) return true;
  return planInfo.features.includes(feature);
}

// 扣减 token（失败返回 false）
function consumeToken(userId) {
  const users = loadUsers();
  const user = users[userId] || getUser(userId);
  
  if (user.balance <= 0) {
    return { ok: false, balance: user.balance };
  }
  
  user.balance--;
  users[userId] = user;
  saveUsers(users);
  
  return { ok: true, balance: user.balance };
}

// 主工具：抓取推文
function fetchTweet(url, options = {}) {
  const scriptPath = '/root/.openclaw/workspace/skills/x-tweet-fetcher/scripts/fetch_tweet.py';
  const args = ['python3', scriptPath, '--url', url];
  
  if (options.replies) args.push('--replies');
  if (options.textOnly) args.push('--text-only');
  if (options.pretty) args.push('--pretty');
  
  try {
    const output = execSync(args.join(' '), { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`抓取失败: ${error.message}`);
  }
}

// 工具：抓取用户时间线
function fetchTimeline(username, limit = 50) {
  const scriptPath = '/root/.openclaw/workspace/skills/x-tweet-fetcher/scripts/fetch_tweet.py';
  const args = ['python3', scriptPath, '--user', username, '--limit', String(limit)];
  
  try {
    const output = execSync(args.join(' '), { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`抓取时间线失败: ${error.message}`);
  }
}

// 工具：监控用户（增量）
function monitorUser(username, baselineFile) {
  const scriptPath = '/root/.openclaw/workspace/skills/x-tweet-fetcher/scripts/fetch_tweet.py';
  const args = ['python3', scriptPath, '--monitor', username];
  
  if (baselineFile) {
    args.push('--baseline', baselineFile);
  }
  
  try {
    const output = execSync(args.join(' '), { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`监控失败: ${error.message}`);
  }
}

// 升级计划
function upgradePlan(userId, newPlan) {
  if (!PLANS[newPlan]) {
    throw new Error(`无效的计划: ${newPlan}。可用: ${Object.keys(PLANS).join(', ')}`);
  }
  
  const users = loadUsers();
  if (!users[userId]) {
    users[userId] = { plan: 'free', balance: 0, createdAt: new Date().toISOString() };
  }
  
  users[userId].plan = newPlan;
  users[userId].upgradedAt = new Date().toISOString();
  saveUsers(users);
  
  return users[userId];
}

// 充值（模拟 SkillPay 充值，用于测试或手动加 token）
function addCredits(userId, amount) {
  const users = loadUsers();
  const user = users[userId] || getUser(userId);
  user.balance += amount;
  user.totalCharged += amount;
  users[userId] = user;
  saveUsers(users);
  return { success: true, balance: user.balance, added: amount };
}

// 导出工具函数
module.exports = {
  name: 'tweet-monitor-pro',
  version: '1.0.0',
  
  // 初始化
  init: async (userId) => {
    const user = getUser(userId);
    return {
      success: true,
      message: `用户已初始化 (${user.plan}, ${user.balance} tokens)`,
      user: { 
        plan: user.plan, 
        balance: user.balance,
        features: PLANS[user.plan].features
      }
    };
  },
  
  // 抓取单条推文
  fetchTweet: {
    description: '抓取单条 X/Twitter 推文内容、统计和媒体',
    parameters: {
      url: { type: 'string', required: true, description: '推文 URL' },
      textOnly: { type: 'boolean', default: false, description: '仅返回文本' }
    },
    async execute(params, context) {
      const userId = context.userId || 'anonymous';
      const user = getUser(userId);
      
      // 检查功能权限
      if (!checkFeatureAccess(user.plan, 'fetchTweet')) {
        return {
          success: false,
          error: `fetchTweet 需要 Pro 或 Business 计划。当前：${user.plan}`,
          user: { plan: user.plan, balance: user.balance }
        };
      }
      
      // 扣减 token
      const charge = consumeToken(userId);
      if (!charge.ok) {
        return {
          success: false,
          error: 'insufficient_balance',
          message: '余额不足，请充值获得更多 tokens。',
          user: { plan: user.plan, balance: charge.balance }
        };
      }
      
      // 执行抓取
      try {
        const result = fetchTweet(params.url, {
          textOnly: params.textOnly,
          replies: false
        });
        
        return {
          success: true,
          data: result,
          user: { plan: user.plan, balance: charge.balance }
        };
      } catch (error) {
        // 失败退还 token
        const users = loadUsers();
        if (users[userId]) users[userId].balance++;
        saveUsers(users);
        return {
          success: false,
          error: error.message,
          user: { plan: user.plan, balance: users[userId] ? users[userId].balance : 0 }
        };
      }
    }
  },
  
  // 查询余额和状态
  getQuota: {
    description: '查询当前账户余额和计划',
    parameters: {},
    async execute(params, context) {
      const userId = context.userId || 'anonymous';
      const user = getUser(userId);
      
      return {
        success: true,
        data: {
          plan: user.plan,
          balance: user.balance,
          features: PLANS[user.plan].features,
          allPlans: Object.keys(PLANS)
        }
      };
    }
  },
  
  // 充值（管理员或用户自费）
  addCredits: {
    description: '为用户添加 tokens（管理员功能）',
    parameters: {
      amount: { type: 'number', required: true, description: '充值数量' }
    },
    async execute(params, context) {
      const userId = context.userId || 'anonymous';
      try {
        const result = addCredits(userId, params.amount);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },
  
  // 升级计划
  upgradePlan: {
    description: '升级用户订阅计划',
    parameters: {
      plan: { type: 'string', required: true, enum: ['pro', 'business'], description: '新计划' }
    },
    async execute(params, context) {
      const userId = context.userId || 'anonymous';
      try {
        const newUser = upgradePlan(userId, params.plan);
        return {
          success: true,
          data: {
            message: `已升级到 ${newUser.plan} 计划`,
            plan: newUser.plan,
            balance: newUser.balance
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },
  
  // 🔒 Pro/Business 功能
  
  fetchThread: {
    description: '抓取推文及其所有回复（包括嵌套）- 仅 Pro/Business',
    parameters: {
      url: { type: 'string', required: true, description: '推文 URL' }
    },
    async execute(params, context) {
      const userId = context.userId || 'anonymous';
      const user = getUser(userId);
      
      if (!checkFeatureAccess(user.plan, 'fetchThread')) {
        return {
          success: false,
          error: `fetchThread 需要 Pro 或 Business 计划。当前：${user.plan}`,
          user: { plan: user.plan, balance: user.balance }
        };
      }
      
      const charge = consumeToken(userId);
      if (!charge.ok) {
        return { success: false, error: 'insufficient_balance', user: { plan: user.plan, balance: charge.balance } };
      }
      
      try {
        const result = fetchTweet(params.url, { replies: true, textOnly: false });
        return { success: true, data: result, user: { plan: user.plan, balance: charge.balance } };
      } catch (error) {
        // 退还 token
        const users = loadUsers();
        if (users[userId]) users[userId].balance++;
        saveUsers(users);
        if (error.message.includes('Camofox')) {
          return { success: false, error: '高级功能需要 Camofox 服务。启动后重试。' };
        }
        return { success: false, error: error.message, user: { plan: user.plan, balance: users[userId] ? users[userId].balance : 0 } };
      }
    }
  },
  
  fetchTimeline: {
    description: '抓取用户的最近推文 - 仅 Pro/Business',
    parameters: {
      username: { type: 'string', required: true, description: '用户名' },
      limit: { type: 'number', default: 50, description: '最大数量' }
    },
    async execute(params, context) {
      const userId = context.userId || 'anonymous';
      const user = getUser(userId);
      
      if (!checkFeatureAccess(user.plan, 'fetchTimeline')) {
        return {
          success: false,
          error: `fetchTimeline 需要 Pro 或 Business 计划。当前：${user.plan}`,
          user: { plan: user.plan, balance: user.balance }
        };
      }
      
      const charge = consumeToken(userId);
      if (!charge.ok) {
        return { success: false, error: 'insufficient_balance', user: { plan: user.plan, balance: charge.balance } };
      }
      
      try {
        const result = fetchTimeline(params.username, params.limit);
        return { success: true, data: result, user: { plan: user.plan, balance: charge.balance } };
      } catch (error) {
        const users = loadUsers();
        if (users[userId]) users[userId].balance++;
        saveUsers(users);
        return { success: false, error: error.message, user: { plan: user.plan, balance: users[userId] ? users[userId].balance : 0 } };
      }
    }
  },
  
  monitorUser: {
    description: '监控用户新推文（增量）- 仅 Pro/Business',
    parameters: {
      username: { type: 'string', required: true, description: '用户名' },
      baselineFile: { type: 'string', description: '基线文件路径' }
    },
    async execute(params, context) {
      const userId = context.userId || 'anonymous';
      const user = getUser(userId);
      
      if (!checkFeatureAccess(user.plan, 'monitorUser')) {
        return {
          success: false,
          error: `monitorUser 需要 Pro 或 Business 计划。当前：${user.plan}`,
          user: { plan: user.plan, balance: user.balance }
        };
      }
      
      const charge = consumeToken(userId);
      if (!charge.ok) {
        return { success: false, error: 'insufficient_balance', user: { plan: user.plan, balance: charge.balance } };
      }
      
      try {
        const result = monitorUser(params.username, params.baselineFile);
        return { success: true, data: result, user: { plan: user.plan, balance: charge.balance } };
      } catch (error) {
        const users = loadUsers();
        if (users[userId]) users[userId].balance++;
        saveUsers(users);
        return { success: false, error: error.message, user: { plan: user.plan, balance: users[userId] ? users[userId].balance : 0 } };
      }
    }
  }
};
