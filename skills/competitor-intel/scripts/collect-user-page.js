#!/usr/bin/env node
/**
 * 指定用户主页采集脚本
 *
 * 用法:
 *   node collect-user-page.js --platform=xiaohongshu --user-id="<user_id>" --limit=50
 *   node collect-user-page.js --platform=douyin --user-id="<sec_uid>" --limit=50
 */

const { execWithRetry, checkLogin, parseYamlOutput, saveResults } = require('./lib/utils');

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

async function main() {
  const args = process.argv.slice(2);

  const platform = args.find(arg => arg.startsWith('--platform'))?.split('=')[1] || 'xiaohongshu';
  const userId = args.find(arg => arg.startsWith('--user-id'))?.split('=')[1] || '';
  const limit = parseInt(args.find(arg => arg.startsWith('--limit'))?.split('=')[1] || '50');

  if (!userId) {
    console.error('[错误] 必须提供 --user-id 参数');
    console.error('用法: node collect-user-page.js --platform=<platform> --user-id="<id>" --limit=50');
    process.exit(1);
  }

  console.log('========================================');
  console.log('  Competitor Intel - 用户主页采集');
  console.log('========================================');
  console.log(`  平台: ${platform}`);
  console.log(`  用户ID: ${userId}`);
  console.log(`  数量: ${limit}`);
  console.log('========================================\n');

  const startTime = Date.now();

  try {
    const results = await userPageCollect(platform, userId, limit);

    saveResults(results, {
      mode: 'user-page',
      platform,
      user_id: userId,
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
