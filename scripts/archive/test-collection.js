const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================================
// 小红书 + 抖音 采集测试脚本
// 用法: node test-collection.js
// ============================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function testXiaohongshu(browser) {
  console.log('\n' + '='.repeat(60));
  console.log('🍠 小红书测试');
  console.log('='.repeat(60));

  const page = await browser.newPage();

  // 步骤 1: 打开小红书首页
  console.log('正在打开小红书首页...');
  await page.goto('https://www.xiaohongshu.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // 步骤 2: 提示用户登录
  console.log('\n⚠️ 请在浏览器中登录小红书（如果还没登录的话）');
  console.log('登录完成后，在本终端按 Enter 继续...');
  await ask('');

  // 步骤 3: 搜索关键词测试
  console.log('正在搜索 "猫动画"...');
  await page.goto('https://www.xiaohongshu.com/search_result?keyword=猫动画', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(5000);

  // 截图保存
  const searchScreenshot = path.join(__dirname, 'xhs-search-result.png');
  await page.screenshot({ path: searchScreenshot, fullPage: true });
  console.log(`✅ 搜索结果已截图: ${searchScreenshot}`);

  // 步骤 4: 尝试提取搜索结果数据
  const searchData = await page.evaluate(() => {
    const results = [];
    // 小红书搜索结果通常在 data-note-id 属性或特定 class 中
    const items = document.querySelectorAll('[data-note-id], .note-item, .search-note-item, .feeds-item');
    items.forEach((item, index) => {
      if (index < 5) { // 只取前5条
        const title = item.querySelector('.title, .note-title, h3, .content')?.textContent?.trim() || '';
        const author = item.querySelector('.author, .username, .author-name')?.textContent?.trim() || '';
        const likes = item.querySelector('.like-count, .count, .liked')?.textContent?.trim() || '';
        results.push({ index, title: title.slice(0, 50), author: author.slice(0, 30), likes });
      }
    });
    return results;
  });

  console.log('\n📊 搜索结果提取（前5条）:');
  if (searchData.length === 0) {
    console.log('  未能提取到结构化数据，可能页面是动态加载的');
  } else {
    searchData.forEach(item => {
      console.log(`  [${item.index}] ${item.title} | ${item.author} | 👍${item.likes}`);
    });
  }

  // 步骤 5: 点击第一个笔记，进入详情页
  console.log('\n正在尝试进入第一个笔记详情页...');
  const firstNote = await page.$('[data-note-id], .note-item, .feeds-item');
  if (firstNote) {
    await firstNote.click();
    await page.waitForTimeout(5000);

    // 截图详情页
    const detailScreenshot = path.join(__dirname, 'xhs-note-detail.png');
    await page.screenshot({ path: detailScreenshot, fullPage: true });
    console.log(`✅ 笔记详情已截图: ${detailScreenshot}`);

    // 尝试提取详情页数据
    const detailData = await page.evaluate(() => {
      const data = {};

      // 标题
      data.title = document.querySelector('h1, .title, .note-title')?.textContent?.trim() || '';

      // 作者
      data.author = document.querySelector('.author-name, .nickname')?.textContent?.trim() || '';

      // 点赞
      data.likes = document.querySelector('.like-count, .count')?.textContent?.trim() || '';

      // 收藏（关键测试）
      data.collects = document.querySelector('.collect-count, .collection-count, .star-count')?.textContent?.trim() || '';

      // 评论
      data.comments = document.querySelector('.comment-count')?.textContent?.trim() || '';

      // 分享
      data.shares = document.querySelector('.share-count')?.textContent?.trim() || '';

      // 发布时间
      data.time = document.querySelector('.date, .publish-time, time')?.textContent?.trim() || '';

      // 获取页面所有文本，用于分析
      data.allText = document.body.innerText.slice(0, 2000);

      return data;
    });

    console.log('\n📋 笔记详情数据:');
    console.log(`  标题: ${detailData.title || '未找到'}`);
    console.log(`  作者: ${detailData.author || '未找到'}`);
    console.log(`  点赞: ${detailData.likes || '未找到'}`);
    console.log(`  收藏: ${detailData.collects || '未找到'} ← 关键字段`);
    console.log(`  评论: ${detailData.comments || '未找到'}`);
    console.log(`  分享: ${detailData.shares || '未找到'} ← 关键字段`);
    console.log(`  时间: ${detailData.time || '未找到'}`);

    // 分析原因
    console.log('\n🔍 分析:');
    if (!detailData.collects) {
      console.log('  ❌ 收藏数未找到 - 可能原因:');
      console.log('     1. 选择器不匹配（页面用 obfuscated class）');
      console.log('     2. 数据是动态加载的，需要等待');
      console.log('     3. 需要登录才能看到收藏数');
    }
    if (!detailData.shares) {
      console.log('  ❌ 分享数未找到 - 可能原因同上');
    }

    // 保存完整数据
    const reportPath = path.join(__dirname, 'xhs-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      searchData,
      detailData: {
        ...detailData,
        allText: detailData.allText.slice(0, 500) + '...'
      },
      timestamp: new Date().toISOString(),
      url: page.url()
    }, null, 2));
    console.log(`\n📄 完整报告已保存: ${reportPath}`);

  } else {
    console.log('❌ 无法找到可点击的笔记');
  }

  await page.close();
}

async function testDouyin(browser) {
  console.log('\n' + '='.repeat(60));
  console.log('🎵 抖音测试');
  console.log('='.repeat(60));

  const page = await browser.newPage();

  // 步骤 1: 打开抖音首页
  console.log('正在打开抖音...');
  await page.goto('https://www.douyin.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // 步骤 2: 提示用户登录
  console.log('\n⚠️ 请在浏览器中登录抖音（如果还没登录的话）');
  console.log('登录完成后，在本终端按 Enter 继续...');
  await ask('');

  // 步骤 3: 访问一个已知的视频
  const testVideoUrl = 'https://www.douyin.com/video/7642497561103111013';
  console.log(`\n正在访问视频: ${testVideoUrl}`);
  await page.goto(testVideoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // 截图
  const screenshotPath = path.join(__dirname, 'douyin-video-detail.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✅ 视频详情已截图: ${screenshotPath}`);

  // 提取数据
  const videoData = await page.evaluate(() => {
    const data = {};

    // 标题
    data.title = document.querySelector('h1, .title, .video-title')?.textContent?.trim() || '';

    // 作者
    data.author = document.querySelector('.author-name, .nickname, [data-e2e="video-author"]')?.textContent?.trim() || '';

    // 获取页面所有可能的数字和标签
    const allElements = Array.from(document.querySelectorAll('*'));
    const candidates = allElements
      .filter(el => {
        const text = el.textContent?.trim();
        return text && (text.includes('赞') || text.includes('评论') || text.includes('分享') || text.includes('收藏'));
      })
      .map(el => ({
        tag: el.tagName,
        text: el.textContent.trim()
      }))
      .slice(0, 10);

    data.candidates = candidates;

    // 点赞
    data.likes = document.querySelector('.like-count, [data-e2e="like-count"], .count')?.textContent?.trim() || '';

    // 评论
    data.comments = document.querySelector('.comment-count, [data-e2e="comment-count"]')?.textContent?.trim() || '';

    // 分享
    data.shares = document.querySelector('.share-count, [data-e2e="share-count"]')?.textContent?.trim() || '';

    // 收藏（关键测试）
    data.collects = document.querySelector('.collect-count, .collection-count, .star-count')?.textContent?.trim() || '';

    // 发布时间
    data.publishedAt = document.querySelector('.publish-time, .date, time')?.textContent?.trim() || '';

    // 获取页面文本用于分析
    data.allText = document.body.innerText.slice(0, 2000);

    return data;
  });

  console.log('\n📋 视频数据:');
  console.log(`  标题: ${videoData.title || '未找到'}`);
  console.log(`  作者: ${videoData.author || '未找到'}`);
  console.log(`  点赞: ${videoData.likes || '未找到'}`);
  console.log(`  评论: ${videoData.comments || '未找到'}`);
  console.log(`  分享: ${videoData.shares || '未找到'} ← 关键字段`);
  console.log(`  收藏: ${videoData.collects || '未找到'} ← 关键字段`);
  console.log(`  发布时间: ${videoData.publishedAt || '未找到'}`);

  console.log('\n📊 页面中找到的候选元素:');
  if (videoData.candidates.length === 0) {
    console.log('  未找到包含 赞/评论/分享/收藏 的元素');
  } else {
    videoData.candidates.forEach((item, i) => {
      console.log(`  [${i}] ${item.tag}: "${item.text}"`);
    });
  }

  // 分析原因
  console.log('\n🔍 分析:');
  if (!videoData.shares) {
    console.log('  ❌ 分享数未找到 - 可能原因:');
    console.log('     1. 抖音用 obfuscated class names（如 oVE17FOy）');
    console.log('     2. 数据从 API 动态加载，不在 DOM 中');
    console.log('     3. 需要特定的请求头或 cookie');
  }
  if (!videoData.collects) {
    console.log('  ❌ 收藏数未找到 - 可能原因同上');
  }

  // 保存报告
  const reportPath = path.join(__dirname, 'douyin-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    ...videoData,
    allText: videoData.allText?.slice(0, 500) + '...',
    timestamp: new Date().toISOString(),
    url: page.url()
  }, null, 2));
  console.log(`\n📄 完整报告已保存: ${reportPath}`);

  await page.close();
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 小红书 + 抖音 采集测试');
  console.log('='.repeat(60));
  console.log('\n这个脚本会:');
  console.log('1. 启动 Chrome 浏览器');
  console.log('2. 打开小红书/抖音，让你手动登录');
  console.log('3. 测试能否提取收藏数、分享数等关键字段');
  console.log('4. 截图保存并分析原因\n');

  // 启动浏览器
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    slowMo: 100,
    args: ['--window-size=1280,800']
  });

  try {
    // 测试小红书
    await testXiaohongshu(browser);

    // 测试抖音
    await testDouyin(browser);

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    console.log('\n' + '='.repeat(60));
    console.log('✅ 测试完成，浏览器保持打开，你可以手动查看');
    console.log('按 Ctrl+C 结束脚本');
    console.log('='.repeat(60));

    // 等待用户按键
    await ask('\n测试完成，按 Enter 关闭浏览器...');
    await browser.close();
    rl.close();
  }
}

main().catch(err => {
  console.error('脚本错误:', err);
  rl.close();
  process.exit(1);
});
