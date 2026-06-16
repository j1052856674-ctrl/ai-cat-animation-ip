#!/usr/bin/env node
/**
 * Playwright 抖音提取 - 简单版（从页面文本直接匹配）
 */

const { chromium } = require('playwright');

async function main() {
  console.log('🎵 Playwright 抖音简单提取\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.douyin.com/video/7642497561103111013', {
      timeout: 30000,
      waitUntil: 'domcontentloaded'
    });

    // 等待页面加载完成（视频数据出现）
    console.log('等待页面加载...');
    await page.waitForTimeout(5000);

    // 检查是否还在加载中
    let loadingText = await page.evaluate(() => document.body.innerText);
    if (loadingText.includes('视频数据加载中')) {
      console.log('视频还在加载，再等5秒...');
      await page.waitForTimeout(5000);
    }

    // 获取页面完整文本
    const text = await page.evaluate(() => document.body.innerText);

    console.log('页面文本片段（前1000字）：');
    console.log(text.slice(0, 1000));
    console.log('\n' + '='.repeat(60));

    // 用正则提取关键数据
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    console.log('\n📊 数据提取：');

    // 找发布时间
    const timeLine = lines.find(l => l.includes('发布时间'));
    if (timeLine) {
      const match = timeLine.match(/发布时间[：:]\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
      if (match) console.log(`  发布时间: ✅ ${match[1]}`);
    }

    // 找包含"赞"、"评论"、"分享"、"收藏"的行
    const interactionLines = lines.filter(l =>
      /赞|评论|分享|收藏/.test(l) && /\d+/.test(l)
    );

    console.log(`\n  找到 ${interactionLines.length} 条可能包含互动数据的行：\n`);
    for (const line of interactionLines.slice(0, 20)) {
      console.log(`    "${line}"`);
    }

    // 尝试更精确地提取
    console.log('\n📊 精确提取尝试：');

    // 找连续的数字+标签模式
    const patterns = [
      { name: '点赞', regex: /(\d+(?:\.\d+)?)\s*赞/ },
      { name: '评论', regex: /(\d+(?:\.\d+)?)\s*评论/ },
      { name: '分享', regex: /(\d+(?:\.\d+)?)\s*分享/ },
      { name: '收藏', regex: /(\d+(?:\.\d+)?)\s*收藏/ }
    ];

    for (const p of patterns) {
      const match = text.match(p.regex);
      if (match) {
        console.log(`  ${p.name}: ✅ ${match[1]}`);
      } else {
        console.log(`  ${p.name}: ❌ 未找到`);
      }
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
