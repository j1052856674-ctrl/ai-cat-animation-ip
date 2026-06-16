#!/usr/bin/env node
/**
 * 每日热榜采集脚本（仅抖音）
 *
 * 用法:
 *   node collect-daily-hot.js --platform=douyin --limit=50
 */

const { execWithRetry, checkLogin, parseYamlOutput, saveResults } = require('./lib/utils');

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

async function main() {
  const args = process.argv.slice(2);

  const platform = args.find(arg => arg.startsWith('--platform'))?.split('=')[1] || 'douyin';
  const limit = parseInt(args.find(arg => arg.startsWith('--limit'))?.split('=')[1] || '50');

  console.log('========================================');
  console.log('  Competitor Intel - 每日热榜采集');
  console.log('========================================');
  console.log(`  平台: ${platform}`);
  console.log(`  数量: ${limit}`);
  console.log('========================================\n');

  const startTime = Date.now();

  try {
    const results = await dailyHotCollect(platform, limit);

    saveResults(results, {
      mode: 'daily-hot',
      platform,
      limit,
      collected: results.length,
      duration: Date.now() - startTime,
    });

  } catch (err) {
    console.error('[致命错误]', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[未捕获错误]', err);
  process.exit(1);
});
