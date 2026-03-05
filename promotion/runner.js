#!/usr/bin/env node
/**
 * Tweet Monitor Pro - 自动化推广主调度器
 * 
 * 功能：定时执行多平台推广 + 数据收集 + 自动报告
 * 
 * 配置环境变量（建议在 ~/.bashrc 或部署时设置）:
 * 
 *   # Twitter API (可选)
 *   export TWITTER_BEARER="your_bearer_token"
 *   export TWITTER_USER_ID="your_user_id"
 *   
 *   # Discord Bot (可选)
 *   export DISCORD_BOT_TOKEN="your_bot_token"
 *   export DISCORD_CHANNEL_ID="channel_id"
 *   
 *   # Reddit (可选)
 *   export REDDIT_USERNAME="your_username"
 *   export REDDIT_PASSWORD="your_password"
 *   export REDDIT_CLIENT_ID="your_client_id"
 *   export REDDIT_CLIENT_SECRET="your_client_secret"
 *   
 *   # V2EX (可选)
 *   export V2EX_USERNAME="your_username"
 *   export V2EX_PASSWORD="your_password"
 *   
 *   # ClawHub & SkillPay
 *   export CLAWHUB_SKILL_ID="k97f8tdg..."
 *   export SKILLPAY_API_KEY="sk_..."
 *   export SKILLPAY_SKILL_ID="skill_..."
 *   
 *   # Webhook (可选，用于聚合数据)
 *   export WEBHOOK_URL="https://your-webhook.com/collect"
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// === 路径 ===
const PROMO_DIR = path.join(__dirname, 'promotion');
const AUTO_DEPLOY = path.join(PROMO_DIR, 'auto-deploy.js');
const COLLECT_STATS = path.join(PROMO_DIR, 'collect-stats.js');
const AUTO_TWEET = path.join(PROMO_DIR, 'auto-tweet.js');
const AUTO_DISCORD = path.join(PROMO_DIR, 'auto-discord.js');
const AUTO_REDDIT = path.join(PROMO_DIR, 'auto-reddit.js');
const AUTO_V2EX = path.join(PROMO_DIR, 'auto-v2ex.js');

// === 任务定义 ===
const TASKS = {
  // 每小时执行：数据收集
  'collect-stats': {
    script: COLLECT_STATS,
    schedule: '0 * * * *',  // 每小时 0 分
    description: '收集 GitHub、本地用户、SkillPay 统计数据'
  },
  
  // 每天 9am：Twitter 推广
  'tweet-promo-9am': {
    script: AUTO_TWEET,
    schedule: '0 9 * * *',
    description: 'Twitter 早间推广'
  },
  
  // 每天 4pm：Twitter 推广
  'tweet-promo-4pm': {
    script: AUTO_TWEET,
    schedule: '0 16 * * *',
    description: 'Twitter 下午推广'
  },
  
  // 每天 10am：Discord 推广
  'discord-promo': {
    script: AUTO_DISCORD,
    schedule: '0 10 * * *',
    description: 'Discord 频道推广'
  },
  
  // 每周一 11am：Reddit 推广
  'reddit-promo': {
    script: AUTO_REDDIT,
    schedule: '0 11 * * 1',  // 周一
    description: 'Reddit 开源社区推广'
  },
  
  // 每周三 2pm：V2EX 推广
  'v2ex-promo': {
    script: AUTO_V2EX,
    schedule: '0 14 * * 3',  // 周三
    description: 'V2EX 开源项目推广'
  },
  
  // 每周日 8pm：部署检查（可选）
  'weekly-deploy-check': {
    script: AUTO_DEPLOY,
    schedule: '0 20 * * 0',  // 周日
    description: '检查是否有新版本需要发布',
    args: '--dry-run'  // 预览模式
  }
};

// === 检查任务是否需要执行 ===
function shouldRunTask(taskName) {
  const historyFile = path.join(__dirname, 'task-history.json');
  
  try {
    const history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    const lastRun = history[taskName] || 0;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // 至少间隔 23 小时才能再次运行
    return (now - lastRun) > oneDay;
  } catch (e) {
    return true; // 第一次运行
  }
}

// === 记录任务执行 ===
function recordTaskRun(taskName) {
  const historyFile = path.join(__dirname, 'task-history.json');
  
  let history = {};
  try {
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    }
  } catch (e) {}
  
  history[taskName] = Date.now();
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// === 主调度器 ===
async function main() {
  console.log(`🔄 Tweet Monitor Pro - 自动化推广调度器`);
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('');
  
  // 如果传入了具体任务名，直接执行
  if (process.argv[2]) {
    const taskName = process.argv[2];
    const task = TASKS[taskName];
    if (task) {
      console.log(`▶️  执行任务: ${taskName} - ${task.description}`);
      try {
        const result = execSync(`node "${task.script}" ${task.args || ''}`, { encoding: 'utf-8' });
        console.log(result);
        recordTaskRun(taskName);
      } catch (error) {
        console.error(`❌ 任务失败: ${error.message}`);
      }
      return;
    } else {
      console.error(`未知任务: ${taskName}`);
      console.log(`可用任务: ${Object.keys(TASKS).join(', ')}`);
      process.exit(1);
    }
  }
  
  // 否则，检查所有定时任务
  console.log('⏰ 检查定时任务...\n');
  
  const now = new Date();
  const currentMinute = now.getMinutes();
  const currentHour = now.getHours();
  const dayOfWeek = now.getDay(); // 0=Sunday
  
  for (const [name, task] of Object.entries(TASKS)) {
    // 解析 cron (简单实现：只看小时和分钟)
    const [min, hour, dom, mon, dow] = task.schedule.split(' ');
    
    const shouldRun = 
      (parseInt(min) === currentMinute) &&
      (parseInt(hour) === currentHour) &&
      (dom === '*' || parseInt(dom) === now.getDate()) &&
      (mon === '*' || parseInt(mon) === (now.getMonth() + 1)) &&
      (dow === '*' || parseInt(dow) === dayOfWeek);
    
    if (shouldRun && shouldRunTask(name)) {
      console.log(`⏰ 触发: ${name} - ${task.description}`);
      try {
        execSync(`node "${task.script}" ${task.args || ''}`, { stdio: 'inherit' });
        recordTaskRun(name);
      } catch (error) {
        console.error(`❌ 任务 ${name} 失败: ${error.message}`);
      }
    }
  }
  
  console.log('\n✅ 调度检查完成');
}

// === 帮助信息 ===
function printHelp() {
  console.log(`Tweet Monitor Pro - 自动化推广调度器

用法:
  node runner.js [task-name]    # 立即执行指定任务
  node runner.js                # 检查所有定时任务

任务列表:
${Object.entries(TASKS).map(([name, t]) => `  ${name.padEnd(25)} ${t.description}`).join('\n')}

环境变量配置:
  参考 ./promotion/ 目录下各脚本的注释

安装为系统定时任务 (crontab -e):
  # 每小时运行调度器
  0 * * * * cd /root/.openclaw/workspace/tweet-monitor-pro && node promotion/runner.js >> /var/log/tweet-monitor-pro-cron.log 2>&1

`);
}

// === 入口 ===
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
  } else {
    main().catch(console.error);
  }
}

module.exports = { TASKS, main };
