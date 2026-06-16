#!/usr/bin/env node
/**
 * competitor-intel 采集脚本
 *
 * 支持 3 种采集模式：
 * 1. search       — 关键词搜索（默认）
 * 2. daily-hot    — 每日热榜（抖音 hashtag hot）
 * 3. user-page    — 指定用户主页
 *
 * 用法:
 *   node collect.js --mode=search --platform=xiaohongshu --keyword="AI猫" --limit=20
 *   node collect.js --mode=daily-hot --platform=douyin --limit=50
 *   node collect.js --mode=user-page --platform=douyin --user-id="<sec_uid>" --limit=20
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================
// 配置
// ============================================================
const CONFIG = {
  DELAY_BETWEEN_REQUESTS: 3000,
  DELAY_AFTER_ERROR: 10000,
  DELAY_LONG: 30000,
  COMMAND_TIMEOUT: 60000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,

  // 数据目录
  DATA_DIR: path.join(__dirname, '..', '..', '..', 'data'),
  RAW_DIR: path.join(__dirname, '..', '..', '..', 'data', 'raw'),
  COVER_DIR: path.join(__dirname, '..', '..', '..', 'data', 'covers'),
};

// 确保目录存在
[CONFIG.RAW_DIR, CONFIG.COVER_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============================================================
// 工具函数
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function execWithTimeout(command, timeout = CONFIG.COMMAND_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const { exec } = require('child_process');

    exec(command, {
      timeout: timeout,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;

      if (error && error.signal !== 'SIGTERM') {
        reject(new Error(`命令退出码 ${error.code}, stderr: ${stderr}`));
      } else {
        resolve({ stdout, stderr, duration });
      }
    });
  });
}

async function execWithRetry(command, maxRetries = CONFIG.MAX_RETRIES) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await execWithTimeout(command);
    } catch (err) {
      lastError = err;
      console.warn(`[警告] 第 ${i + 1}/${maxRetries} 次尝试失败: ${err.message}`);
      if (i < maxRetries - 1) {
        console.log(`[等待] ${CONFIG.RETRY_DELAY}ms 后重试...`);
        await sleep(CONFIG.RETRY_DELAY);
      }
    }
  }
  throw new Error(`重试 ${maxRetries} 次后仍然失败: ${lastError.message}`);
}

// ============================================================
// 登录态检测
// ============================================================

async function checkLogin(platform) {
  console.log(`[检测] 检查 ${platform} 登录态...`);
  try {
    const { stdout } = await execWithTimeout(
      `opencli ${platform} whoami -f yaml`, 15000
    );
    if (stdout.includes('nickname') || stdout.includes('username')) {
      console.log(`[OK] ${platform} 已登录`);
      return true;
    }
    console.warn(`[警告] ${platform} 登录态异常`);
    return false;
  } catch (err) {
    console.error(`[错误] ${platform} 登录检测失败:`, err.message);
    return false;
  }
}

// ============================================================
// YAML 解析
// ============================================================

function parseYamlOutput(stdout) {
  try {
    const yamlContent = stdout.split('\n').filter(line => {
      return !line.includes('[@jackwener/opencli]') &&
             !line.includes('module loading') &&
             !line.includes('access');
    }).join('\n');

    const yaml = require('js-yaml');
    const data = yaml.load(yamlContent);

    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data];
    return [];
  } catch (err) {
    console.warn(`[警告] YAML 解析失败: ${err.message}`);
    return [];
  }
}

// ============================================================
// 采集模式 1: 关键词搜索
// ============================================================

async function searchCollect(platform, keyword, limit) {
  console.log(`\n[模式:search] ${platform}: "${keyword}" (limit=${limit})`);

  const isLoggedIn = await checkLogin(platform);
  if (!isLoggedIn) {
    console.warn(`[警告] ${platform} 未登录，部分字段可能缺失`);
  }

  const results = [];
  let page = 0;
  const batchSize = 10;

  while (results.length < limit) {
    const currentLimit = Math.min(batchSize, limit - results.length);
    console.log(`[进度] 采集第 ${page + 1} 批 (${currentLimit} 条)... [${results.length}/${limit}]`);

    try {
      const { stdout, duration } = await execWithRetry(
        `opencli ${platform} search "${keyword}" --limit ${currentLimit} -f yaml`
      );
      console.log(`[耗时] ${duration}ms`);

      const items = parseYamlOutput(stdout);
      if (!items || items.length === 0) {
        console.warn('[警告] 本批次无数据');
        break;
      }

      for (const item of items) {
        item._source = 'search';
        item._keyword = keyword;
        results.push(item);
      }

      page++;
      if (page % 2 === 0) {
        console.log(`[休息] 已采集 ${results.length} 条，休息 ${CONFIG.DELAY_LONG}ms...`);
        await sleep(CONFIG.DELAY_LONG);
      } else {
        await sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
      }

    } catch (err) {
      console.error(`[错误] 采集失败: ${err.message}`);
      await sleep(CONFIG.DELAY_AFTER_ERROR);
      if (page >= 3) {
        console.warn('[警告] 连续多次失败，提前退出');
        break;
      }
    }
  }

  console.log(`[完成] 搜索采集结束，共 ${results.length} 条`);
  return results;
}

// ============================================================
// 采集模式 2: 每日热榜（仅抖音）
// ============================================================

async function dailyHotCollect(platform, limit) {
  console.log(`\n[模式:daily-hot] ${platform}: 热榜采集 (limit=${limit})`);

  if (platform !== 'douyin') {
    console.warn('[警告] 每日热榜目前仅支持抖音；小红书 feed 意义不大，暂不实现');
    return [];
  }

  const isLoggedIn = await checkLogin(platform);
  if (!isLoggedIn) {
    console.warn('[警告] 抖音未登录');
  }

  const results = [];

  try {
    console.log('[采集] 获取抖音热榜话题...');
    const { stdout, duration } = await execWithRetry(
      `opencli douyin hashtag hot --limit ${limit} -f yaml`
    );
    console.log(`[耗时] ${duration}ms`);

    const items = parseYamlOutput(stdout);
    if (!items || items.length === 0) {
      console.warn('[警告] 热榜无数据');
      return [];
    }

    for (const item of items) {
      item._source = 'daily-hot';
      item._collected_at = new Date().toISOString();
      results.push(item);
    }

    console.log(`[完成] 热榜采集结束，共 ${results.length} 条`);
  } catch (err) {
    console.error(`[错误] 热榜采集失败: ${err.message}`);
  }

  return results;
}

// ============================================================
// 采集模式 3: 指定用户主页
// ============================================================

async function userPageCollect(platform, userId, limit) {
  console.log(`\n[模式:user-page] ${platform}: 用户 "${userId}" (limit=${limit})`);

  const isLoggedIn = await checkLogin(platform);
  if (!isLoggedIn) {
    console.warn(`[警告] ${platform} 未登录`);
  }

  const results = [];

  try {
    let command;
    if (platform === 'douyin') {
      command = `opencli douyin user-videos "${userId}" --limit ${limit} -f yaml`;
    } else if (platform === 'xiaohongshu') {
      command = `opencli xiaohongshu user "${userId}" --limit ${limit} -f yaml`;
    } else {
      console.error(`[错误] 不支持的平台: ${platform}`);
      return [];
    }

    const { stdout, duration } = await execWithRetry(command);
    console.log(`[耗时] ${duration}ms`);

    const items = parseYamlOutput(stdout);
    if (!items || items.length === 0) {
      console.warn('[警告] 用户主页无数据');
      return [];
    }

    for (const item of items) {
      item._source = 'user-page';
      item._user_id = userId;
      results.push(item);
    }

    console.log(`[完成] 用户主页采集结束，共 ${results.length} 条`);
  } catch (err) {
    console.error(`[错误] 用户主页采集失败: ${err.message}`);
  }

  return results;
}

// ============================================================
// 主程序
// ============================================================

async function main() {
  const args = process.argv.slice(2);

  // 解析参数
  const mode = args.find(arg => arg.startsWith('--mode'))?.split('=')[1] || 'search';
  const platform = args.find(arg => arg.startsWith('--platform'))?.split('=')[1] || 'xiaohongshu';
  const keyword = args.find(arg => arg.startsWith('--keyword'))?.split('=')[1] || 'AI猫';
  const userId = args.find(arg => arg.startsWith('--user-id'))?.split('=')[1] || '';
  const limit = parseInt(args.find(arg => arg.startsWith('--limit'))?.split('=')[1] || '20');

  console.log('========================================');
  console.log('  Competitor Intel 采集器');
  console.log('========================================');
  console.log(`  模式: ${mode}`);
  console.log(`  平台: ${platform}`);
  console.log(`  数量: ${limit}`);
  if (mode === 'search') console.log(`  关键词: ${keyword}`);
  if (mode === 'user-page') console.log(`  用户ID: ${userId}`);
  console.log('========================================\n');

  const startTime = Date.now();
  let results = [];

  try {
    switch (mode) {
      case 'search':
        results = await searchCollect(platform, keyword, limit);
        break;
      case 'daily-hot':
        results = await dailyHotCollect(platform, limit);
        break;
      case 'user-page':
        if (!userId) {
          console.error('[错误] user-page 模式需要 --user-id 参数');
          process.exit(1);
        }
        results = await userPageCollect(platform, userId, limit);
        break;
      default:
        console.error(`[错误] 未知模式: ${mode}`);
        console.error('支持模式: search, daily-hot, user-page');
        process.exit(1);
    }

    // 保存结果到 data/raw/
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(CONFIG.RAW_DIR, `${mode}-${platform}-${keyword || userId}-${timestamp}.json`);

    const output = {
      meta: {
        mode,
        platform,
        keyword: keyword || null,
        user_id: userId || null,
        limit,
        collected: results.length,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        data_dir: CONFIG.DATA_DIR,
      },
      data: results,
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

    console.log(`\n[完成] 数据已保存: ${outputFile}`);
    console.log(`[统计] 共采集 ${results.length} 条，耗时 ${(Date.now() - startTime) / 1000}s`);
    console.log(`[目录] 原始数据: ${CONFIG.RAW_DIR}`);

  } catch (err) {
    console.error('[致命错误]', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[未捕获错误]', err);
  process.exit(1);
});
