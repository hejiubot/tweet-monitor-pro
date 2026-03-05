#!/usr/bin/env node
/**
 * 自动化部署脚本
 * 发布新版本到 GitHub + ClawHub
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// === 配置 ===
const SKILL_DIR = process.env.SKILL_DIR || path.join(__dirname, '..');
const GITHUB_REPO = 'hejiubot/tweet-monitor-pro';
const CLAWHUB_SKILL_ID = process.env.CLAWHUB_SKILL_ID || 'k97f8tdg1cvjjjcevwy8mjmw6n82av75';

// === 工具函数 ===
function run(cmd, cwd = SKILL_DIR) {
  try {
    const output = execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' });
    return { ok: true, output: output.trim() };
  } catch (error) {
    return { ok: false, error: error.message, output: error.stdout || '' };
  }
}

// === 步骤 1: 递增版本号 ===
function bumpVersion(type = 'patch') {
  const pkgPath = path.join(SKILL_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  let newVersion;
  
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
  }
  
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  
  console.log(`📦 版本升级: ${pkg.version} → ${newVersion}`);
  return newVersion;
}

// === 步骤 2: Git 提交和打 Tag ===
function gitRelease(version) {
  console.log('📤 Git 发布...');
  
  // Commit
  const commitResult = run('git add -A && git commit -m "Release v' + version + '"');
  if (!commitResult.ok) {
    console.error('Git commit failed:', commitResult.error);
    return false;
  }
  
  // Tag
  const tagResult = run(`git tag -a v${version} -m "Release v${version}"`);
  if (!tagResult.ok) {
    console.error('Git tag failed:', tagResult.error);
    return false;
  }
  
  // Push
  const pushResult = run('git push origin main --tags');
  if (!pushResult.ok) {
    console.error('Git push failed:', pushResult.error);
    return false;
  }
  
  console.log(`✅ Git 发布完成: v${version}`);
  return true;
}

// === 步骤 3: 发布到 ClawHub ===
function clawhubPublish() {
  console.log('🚀 发布到 ClawHub...');
  
  // 检查 clawhub CLI
  const which = run('which clawhub');
  if (!which.ok) {
    console.error('❌ clawhub CLI 未安装');
    console.log('安装: npm i -g @openclaw/clawhub');
    return false;
  }
  
  const result = run('clawhub publish', SKILL_DIR);
  if (!result.ok) {
    console.error('ClawHub 发布失败:', result.error);
    console.log('输出:', result.output);
    return false;
  }
  
  console.log('✅ ClawHub 发布成功');
  console.log('📦 Skill ID:', CLAWHUB_SKILL_ID);
  return true;
}

// === 步骤 4: 创建 GitHub Release（可选）===
function createGithubRelease(version) {
  console.log('📦 创建 GitHub Release...');
  
  // 生成 release notes
  const changelog = `## v${version}

Features and fixes in this release.

### Added
- New features

### Changed
- Improvements

### Fixed
- Bug fixes

For detailed changelog, see commit history.`;
  
  // 使用 GitHub CLI (gh)
  const ghCheck = run('which gh');
  if (ghCheck.ok) {
    const result = run(`gh release create v${version} --notes "${changelog.replace(/"/g, '\\"')}" --latest`);
    if (result.ok) {
      console.log('✅ GitHub Release 创建成功');
      return true;
    }
  }
  
  console.log('⚠️  跳过 GitHub Release（gh 未安装或失败）');
  console.log('手动创建: https://github.com/' + GITHUB_REPO + '/releases/new');
  return false;
}

// === 主逻辑 ===
function main() {
  console.log('🚀 开始自动化部署...\n');
  
  // 询问版本号类型
  const type = process.argv[2] || 'patch'; // patch, minor, major
  
  console.log(`📋 部署计划:`);
  console.log(`  1. 递增版本号 (${type})`);
  console.log(`  2. Git commit + tag`);
  console.log(`  3. Push 到 GitHub`);
  console.log(`  4. 发布到 ClawHub`);
  console.log(`  5. 创建 GitHub Release (可选)`);
  console.log('');
  
  const confirm = process.env.DEPLOY_CONFIRM || 'yes';
  if (confirm !== 'yes' && process.env.NODE_ENV !== 'production') {
    console.log('⚠️  需要确认，设置 DEPLOY_CONFIRM=yes 继续');
    return;
  }
  
  // 执行步骤
  const version = bumpVersion(type);
  
  if (!gitRelease(version)) {
    console.error('❌ 部署失败');
    process.exit(1);
  }
  
  clawhubPublish();
  createGithubRelease(version);
  
  console.log('\n🎉 部署完成！');
  console.log(`版本: v${version}`);
  console.log(`ClawHub: https://clawhub.com/skills/tweet-monitor-pro`);
  console.log(`GitHub: https://github.com/${GITHUB_REPO}/releases/tag/v${version}`);
}

if (require.main === module) {
  main();
}

module.exports = { main, bumpVersion, gitRelease, clawhubPublish };
