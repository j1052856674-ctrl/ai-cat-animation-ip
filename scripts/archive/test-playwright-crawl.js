#!/usr/bin/env node
/**
 * Playwright 单条采集测试
 * 同时测试抖音 + 小红书
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ============================================================
// 测试配置
// ============================================================
const TEST_CASES = [
  {
    platform: '抖音',
    name: 'AI治愈动画 猫（现有数据）',
    url: 'https://www.douyin.com/video/7642497561103111013',
    expectedFields: ['标题', '作者', '点赞', '评论', '分享', '发布时间'],
    expectedTitle: '别去责怪你家的小猫咯，给点包容 给点爱',
    expectedAuthor: '可心养猫记',
    expectedLikes: 119
  },
  {
    platform: '小红书',
    name: '公开测试笔记',
    url: 'https://www.xiaohongshu.com/explore/65e8c9df0000000026035d9a6',
    expectedFields: ['标题', '作者', '点赞', '收藏', '发布时间'],
    expectedTitle: '待测试',
    expectedAuthor: '待测试',
    expectedLikes: '待测试'
  }
];

// ============================================================
// 辅助函数
// ============================================================
async function capturePage(page, name) {
  const screenshotPath = path.join(__dirname, `playwright-test-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`  截图已保存: ${screenshotPath}`);
  return screenshotPath;
}

// ============================================================
// 抖音采集
// ============================================================
async function testDouyin(browser) {
  console.log('\n' + '='.repeat(60));
  console.log('测试抖音采集');
  console.log('='.repeat(60));

  const testCase = TEST_CASES[0];
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log(`  打开页面: ${testCase.url}`);
    await page.goto(testCase.url, { timeout: 60000, waitUntil: 'domcontentloaded' });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 尝试提取字段
    const result = await page.evaluate(() => {
      const data = {};

      // 标题
      const titleEl = document.querySelector('h1[class*="title"], .title, [data-e2e="video-title"], .video-info-container h1');
      data.title = titleEl?.textContent?.trim() || '未找到';

      // 作者
      const authorEl = document.querySelector('[class*="author"], .avatar-name, .user-name, a[href*="/user/"]');
      data.author = authorEl?.textContent?.trim() || '未找到';

      // 点赞数
      const likeEl = document.querySelector('[class*="like"], [class*="zan"], .count[title]');
      data.likes = likeEl?.textContent?.trim() || '未找到';

      // 评论数
      const commentEl = document.querySelector('[class*="comment"], [class*="pinglun"]');
      data.comments = commentEl?.textContent?.trim() || '未找到';

      // 发布时间
      const timeEl = document.querySelector('[class*="time"], [class*="date"], .publish-time');
      data.published_at = timeEl?.textContent?.trim() || '未找到';

      // 分享数
      const shareEl = document.querySelector('[class*="share"], [class*="fenxiang"]');
      data.shares = shareEl?.textContent?.trim() || '未找到';

      return data;
    });

    console.log('  提取结果：');
    console.log(`    标题: ${result.title.slice(0, 50)}`);
    console.log(`    作者: ${result.author}`);
    console.log(`    点赞: ${result.likes}`);
    console.log(`    评论: ${result.comments}`);
    console.log(`    分享: ${result.shares}`);
    console.log(`    发布时间: ${result.published_at}`);

    // 截图
    const screenshot = await capturePage(page, 'douyin');

    return {
      platform: '抖音',
      url: testCase.url,
      fields: result,
      screenshot
    };

  } catch (error) {
    console.error(`  抖音采集失败: ${error.message}`);
    return { platform: '抖音', error: error.message };
  } finally {
    await context.close();
  }
}

// ============================================================
// 小红书采集
// ============================================================
async function testXiaohongshu(browser) {
  console.log('\n' + '='.repeat(60));
  console.log('测试小红书采集');
  console.log('='.repeat(60));

  const testCase = TEST_CASES[1];
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log(`  打开页面: ${testCase.url}`);
    await page.goto(testCase.url, { timeout: 60000, waitUntil: 'domcontentloaded' });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 尝试提取字段
    const result = await page.evaluate(() => {
      const data = {};

      // 标题
      const titleEl = document.querySelector('#detail-title, .title, h1[class*="title"]');
      data.title = titleEl?.textContent?.trim() || '未找到';

      // 作者
      const authorEl = document.querySelector('.author-name, .nickname, a[href*="/user/profile"]');
      data.author = authorEl?.textContent?.trim() || '未找到';

      // 点赞数
      const likeEl = document.querySelector('.like-count, .count[title], [class*="like"] .count');
      data.likes = likeEl?.textContent?.trim() || '未找到';

      // 收藏数
      const collectEl = document.querySelector('.collect-count, [class*="collect"] .count');
      data.collects = collectEl?.textContent?.trim() || '未找到';

      // 评论数
      const commentEl = document.querySelector('.comment-count, [class*="comment"] .count');
      data.comments = commentEl?.textContent?.trim() || '未找到';

      // 发布时间
      const timeEl = document.querySelector('.date, .publish-time, time, [class*="time"]');
      data.published_at = timeEl?.textContent?.trim() || '未找到';

      return data;
    });

    console.log('  提取结果：');
    console.log(`    标题: ${result.title.slice(0, 50)}`);
    console.log(`    作者: ${result.author}`);
    console.log(`    点赞: ${result.likes}`);
    console.log(`    收藏: ${result.collects}`);
    console.log(`    评论: ${result.comments}`);
    console.log(`    发布时间: ${result.published_at}`);

    // 截图
    const screenshot = await capturePage(page, 'xiaohongshu');

    return {
      platform: '小红书',
      url: testCase.url,
      fields: result,
      screenshot
    };

  } catch (error) {
    console.error(`  小红书采集失败: ${error.message}`);
    return { platform: '小红书', error: error.message };
  } finally {
    await context.close();
  }
}

// ============================================================
// 主函数
// ============================================================
async function main() {
  console.log('='.repeat(60));
  console.log('Playwright 单条采集测试');
  console.log('测试内容：抖音 + 小红书（不登录）');
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    channel: 'chrome',  // 使用系统 Chrome
    headless: false,    // 有头模式，方便观察
    slowMo: 500
  });
  console.log('浏览器已启动');

  const results = [];

  // 测试抖音
  const douyinResult = await testDouyin(browser);
  results.push(douyinResult);

  // 测试小红书
  const xhsResult = await testXiaohongshu(browser);
  results.push(xhsResult);

  // 关闭浏览器
  await browser.close();

  // 输出对比报告
  console.log('\n' + '='.repeat(60));
  console.log('测试对比报告');
  console.log('='.repeat(60));

  for (const r of results) {
    if (r.error) {
      console.log(`\n${r.platform}: ${r.error}`);
      continue;
    }

    console.log(`\n${r.platform} (${r.url})`);
    console.log('  提取字段：');
    const fields = r.fields;
    console.log(`    标题: ${fields.title ? '✅' : '❌'} ${(fields.title || '').slice(0, 40)}`);
    console.log(`    作者: ${fields.author ? '✅' : '❌'} ${fields.author}`);
    console.log(`    点赞: ${fields.likes ? '✅' : '❌'} ${fields.likes}`);
    console.log(`    评论: ${fields.comments ? '✅' : '❌'} ${fields.comments}`);
    if (fields.shares !== undefined) console.log(`    分享: ${fields.shares ? '✅' : '❌'} ${fields.shares}`);
    if (fields.collects !== undefined) console.log(`    收藏: ${fields.collects ? '✅' : '❌'} ${fields.collects}`);
    console.log(`    发布时间: ${fields.published_at ? '✅' : '❌'} ${fields.published_at}`);
    console.log(`    截图: ${r.screenshot}`);
  }

  // 保存结果
  const reportPath = path.join(__dirname, 'playwright-test-result.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n详细报告已保存至: ${reportPath}`);
}

main().catch(console.error);
