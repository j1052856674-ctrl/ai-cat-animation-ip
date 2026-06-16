const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ============================================================
// 小红书 + 抖音 自动化采集测试
// 用法: node test-auto-collection.js
// ============================================================

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testXiaohongshu(browser) {
  console.log('\n' + '='.repeat(60));
  console.log('🍠 小红书测试');
  console.log('='.repeat(60));

  const page = await browser.newPage();

  try {
    // 打开小红书首页
    console.log('正在打开小红书...');
    await page.goto('https://www.xiaohongshu.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await delay(5000);

    // 截图看当前状态
    let screenshotPath = path.join(__dirname, 'xhs-home.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ 首页已截图: ${screenshotPath}`);

    // 检查是否登录
    const isLoggedIn = await page.evaluate(() => {
      // 检查是否有登录按钮或头像
      const loginBtn = document.querySelector('.login-btn, .login-button, .not-login');
      const avatar = document.querySelector('.avatar, .user-avatar');
      return {
        hasLoginButton: !!loginBtn,
        hasAvatar: !!avatar,
        title: document.title,
        url: window.location.href
      };
    });
    console.log('登录状态:', isLoggedIn);

    // 搜索关键词
    console.log('\n正在搜索 "猫动画"...');
    await page.goto('https://www.xiaohongshu.com/search_result?keyword=%E7%8C%AB%E5%8A%A8%E7%BB%93', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await delay(5000);

    screenshotPath = path.join(__dirname, 'xhs-search.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ 搜索结果已截图: ${screenshotPath}`);

    // 提取搜索结果数据
    const searchData = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('[data-note-id]');
      items.forEach((item, index) => {
        if (index < 3) {
          const title = item.textContent?.slice(0, 50) || '';
          const noteId = item.getAttribute('data-note-id');
          results.push({ index, title, noteId });
        }
      });
      return results;
    });
    console.log('搜索结果:', searchData);

    // 尝试点击第一个笔记
    const firstNote = await page.$('[data-note-id]');
    if (firstNote) {
      console.log('正在进入第一个笔记详情...');
      await firstNote.click();
      await delay(5000);

      screenshotPath = path.join(__dirname, 'xhs-detail.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ 笔记详情已截图: ${screenshotPath}`);

      // 提取详情页数据
      const detailData = await page.evaluate(() => {
        const data = {};

        // 标题
        data.title = document.querySelector('h1')?.textContent?.trim().slice(0, 50) || '';

        // 获取所有包含数字的元素
        const numberElements = Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const text = el.textContent?.trim();
            return text && /^[\d.]+[万w]?$/.test(text) && el.children.length === 0;
          })
          .map(el => el.textContent.trim())
          .slice(0, 20);
        data.numberElements = numberElements;

        // 获取所有包含"收藏""分享""评论"的元素
        const actionElements = Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const text = el.textContent?.trim();
            return text && (text.includes('收藏') || text.includes('分享') || text.includes('评论') || text.includes('点赞'));
          })
          .map(el => ({
            text: el.textContent.trim().slice(0, 100),
            tag: el.tagName
          }))
          .slice(0, 10);
        data.actionElements = actionElements;

        // 页面文本分析
        data.pageText = document.body.innerText.slice(0, 500);

        return data;
      });

      console.log('\n📋 笔记详情数据:');
      console.log('  标题:', detailData.title);
      console.log('  数字元素:', detailData.numberElements);
      console.log('  互动元素:', detailData.actionElements);

      // 分析
      console.log('\n🔍 分析:');
      const hasCollect = detailData.actionElements.some(e => e.text.includes('收藏'));
      const hasShare = detailData.actionElements.some(e => e.text.includes('分享'));
      console.log('  页面是否有"收藏":', hasCollect ? '✅ 是' : '❌ 否');
      console.log('  页面是否有"分享":', hasShare ? '✅ 是' : '❌ 否');

      return { searchData, detailData };
    }

  } catch (error) {
    console.error('小红书测试失败:', error.message);
    const errorPath = path.join(__dirname, 'xhs-error.png');
    await page.screenshot({ path: errorPath, fullPage: true });
    console.log(`❌ 错误截图: ${errorPath}`);
  } finally {
    await page.close();
  }
}

async function testDouyin(browser) {
  console.log('\n' + '='.repeat(60));
  console.log('🎵 抖音测试');
  console.log('='.repeat(60));

  const page = await browser.newPage();

  try {
    // 打开抖音
    console.log('正在打开抖音...');
    await page.goto('https://www.douyin.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await delay(5000);

    let screenshotPath = path.join(__dirname, 'douyin-home.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ 首页已截图: ${screenshotPath}`);

    // 检查登录状态
    const loginStatus = await page.evaluate(() => {
      return {
        title: document.title,
        hasLogin: !!document.querySelector('.avatar, .user-avatar, .logged-in'),
        url: window.location.href
      };
    });
    console.log('登录状态:', loginStatus);

    // 访问一个视频
    const videoUrl = 'https://www.douyin.com/video/7642497561103111013';
    console.log(`\n正在访问视频: ${videoUrl}`);
    await page.goto(videoUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await delay(5000);

    screenshotPath = path.join(__dirname, 'douyin-video.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ 视频详情已截图: ${screenshotPath}`);

    // 提取数据
    const videoData = await page.evaluate(() => {
      const data = {};

      // 标题
      data.title = document.querySelector('h1, .title')?.textContent?.trim().slice(0, 50) || '';

      // 作者
      data.author = document.querySelector('.author-name, .nickname')?.textContent?.trim().slice(0, 30) || '';

      // 获取所有包含数字的元素
      const numberElements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const text = el.textContent?.trim();
          return text && /^[\d.]+[万w]?$/.test(text) && el.children.length === 0;
        })
        .map(el => el.textContent.trim())
        .slice(0, 20);
      data.numberElements = numberElements;

      // 获取互动相关元素
      const actionElements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const text = el.textContent?.trim();
          return text && (text.includes('收藏') || text.includes('分享') || text.includes('评论') || text.includes('点赞'));
        })
        .map(el => ({
          text: el.textContent.trim().slice(0, 100),
          tag: el.tagName
        }))
        .slice(0, 10);
      data.actionElements = actionElements;

      data.pageText = document.body.innerText.slice(0, 500);

      return data;
    });

    console.log('\n📋 视频数据:');
    console.log('  标题:', videoData.title);
    console.log('  作者:', videoData.author);
    console.log('  数字元素:', videoData.numberElements);
    console.log('  互动元素:', videoData.actionElements);

    // 分析
    console.log('\n🔍 分析:');
    const hasCollect = videoData.actionElements.some(e => e.text.includes('收藏'));
    const hasShare = videoData.actionElements.some(e => e.text.includes('分享'));
    console.log('  页面是否有"收藏":', hasCollect ? '✅ 是' : '❌ 否');
    console.log('  页面是否有"分享":', hasShare ? '✅ 是' : '❌ 否');

    return videoData;

  } catch (error) {
    console.error('抖音测试失败:', error.message);
    const errorPath = path.join(__dirname, 'douyin-error.png');
    await page.screenshot({ path: errorPath, fullPage: true });
    console.log(`❌ 错误截图: ${errorPath}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 小红书 + 抖音 自动化采集测试');
  console.log('='.repeat(60));

  // 启动浏览器
  console.log('\n正在启动 Chrome...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--window-size=1280,800']
  });

  try {
    // 测试小红书
    const xhsResult = await testXiaohongshu(browser);

    // 测试抖音
    const douyinResult = await testDouyin(browser);

    // 生成最终报告
    const report = {
      timestamp: new Date().toISOString(),
      xiaohongshu: xhsResult,
      douyin: douyinResult
    };

    const reportPath = path.join(__dirname, 'auto-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 完整报告已保存: ${reportPath}`);

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    console.log('\n' + '='.repeat(60));
    console.log('✅ 测试完成，浏览器保持打开');
    console.log('你可以手动查看页面');
    console.log('按 Ctrl+C 结束脚本');
    console.log('='.repeat(60));

    // 保持运行
    await delay(100000);
    await browser.close();
  }
}

main().catch(console.error);
