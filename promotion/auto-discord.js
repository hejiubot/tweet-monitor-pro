#!/usr/bin/env node
/**
 * 自动化 Discord 推广脚本
 * 功能：在指定频道发布推广消息、回复用户问题
 */

const axios = require('axios');

// === 配置 ===
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN; // Discord Bot Token
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID; // 目标频道 ID
const PROMO_MESSAGES = [
  `🚀 **Tweet Monitor Pro** 已发布！

👉 无需 API 密钥，抓取 X/Twitter 推文
👉 支持微博、Bilibili 等中文平台
👉 定价：Free (10次) / Pro ($1.9/1000次) / Business ($9.9/无限)

🔗 https://clawhub.com/skills/tweet-monitor-pro

${Math.random() > 0.5 ? '新用户赠送 10 次免费试用！' : '限时优惠，Pro 计划仅需 $1.9/月'}`,
  
  `💡 小技巧：用 Tweet Monitor Pro 快速抓取推文回复，做竞品分析超方便！

安装：\`openclaw skills install tweet-monitor-pro\`

教程：https://github.com/hejiubot/tweet-monitor-pro/blob/main/README.md`
];

// === 发送消息 ===
async function sendMessage(content) {
  if (!DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
    console.error('Missing DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID');
    return { success: false, error: 'Missing config' };
  }

  try {
    const resp = await axios.post(
      `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`,
      { content, allowed_mentions: { parse: [] } },
      {
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, data: resp.data };
  } catch (error) {
    console.error('Discord send failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// === 主逻辑 ===
async function main() {
  console.log('🤖 开始 Discord 推广...');
  
  // 随机选一条消息
  const msg = PROMO_MESSAGES[Math.floor(Math.random() * PROMO_MESSAGES.length)];
  
  console.log(`📤 发送到频道 ${DISCORD_CHANNEL_ID}...`);
  const result = await sendMessage(msg);
  
  if (result.success) {
    console.log(`✅ 发送成功: https://discord.com/channels/@me/${DISCORD_CHANNEL_ID}/${result.data.id}`);
  } else {
    console.error(`❌ 发送失败: ${result.error}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { sendMessage, main };
