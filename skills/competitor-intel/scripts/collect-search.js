#!/usr/bin/env node
/**
 * 关键词搜索采集脚本
 *
 * 用法:
 *   node collect-search.js --platform=xiaohongshu --keyword="AI猫" --limit=20
 *   node collect-search.js --platform=douyin --keyword="AI猫" --limit=20
 */

const { execWithRetry, checkLogin, parseYamlOutput, saveResults } = require('./lib/utils');

const CONFIG = {
  DELAY_BETWEEN_REQUESTS: 3000,
  DELAY_LONG: 30000,
  BATCH_SIZE: 10,
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchCollect(platform, keyword, limit) {
  console.log(`\n[模式:search] ${platform}: "${keyword}" (limit=${limit})`);

  const isLoggedIn = await checkLogin(platform);
  if (!isLoggedIn) {
    console.warn(`[警告] ${platform} 未登录，部分字段可能缺失`);
  }

  const results = [];
  let page = 0;

  while (results.length < limit) {
    const currentLimit = Math.min(CONFIG.BATCH_SIZE, limit - results.length);
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
      await sleep(10000);
      if (page >= 3) {
        console.warn('[警告] 连续多次失败，提前退出');
        break;
      }
    }
  }

  console.log(`[完成] 搜索采集结束，共 ${results.length} 条`);
  return results;
}

async function main() {
  const args = process.argv.slice(2);

  const platform = args.find(arg => arg.startsWith('--platform'))?.split('=')[1] || 'xiaohongshu';
  const keyword = args.find(arg => arg.startsWith('--keyword'))?.split('=')[1] || 'AI猫';
  const limit = parseInt(args.find(arg => arg.startsWith('--limit'))?.split('=')[1] || '20');

  console.log('========================================');
  console.log('  Competitor Intel - 关键词搜索采集');
  console.log('========================================');
  console.log(`  平台: ${platform}`);
  console.log(`  关键词: ${keyword}`);
  console.log(`  数量: ${limit}`);
  console.log('========================================\n');

  const startTime = Date.now();

  try {
    const results = await searchCollect(platform, keyword, limit);

    saveResults(results, {
      mode: 'search',
      platform,
      keyword,
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
