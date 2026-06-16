#!/usr/bin/env node
/**
 * Playwright 抖音单条采集测试（修正版）
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ============================================================
// 测试配置
// ============================================================
const TEST_CASE = {
  platform: '抖音',
  url: 'https://www.douyin.com/video/7642497561103111013',
  expectedTitle: '别去责怪一只连疼都不会喊的小猫'
};

async function main() {
  console.log('='.repeat(60));
  console.log('Playwright 抖音采集测试（修正版）');
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    slowMo: 200
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    console.log(`打开页面: ${TEST_CASE.url}`);
    await page.goto(TEST_CASE.url, { timeout: 60000, waitUntil: 'domcontentloaded' });

    // 等待页面渲染
    await page.waitForTimeout(5000);

    // 截图
    const screenshotPath = path.join(__dirname, 'playwright-douyin-debug.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`截图已保存: ${screenshotPath}`);

    // 提取所有可见文本
    const pageData = await page.evaluate(() => {
      // 获取所有文本内容
      const allText = document.body.innerText;

      // 尝试从SSR数据中提取
      let ssrData = null;
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const text = script.textContent;
        if (text.includes('RENDER_DATA') || text.includes('SSR')) {
          ssrData = text.slice(0, 500);
          break;
        }
      }

      // 获取页面标题
      const title = document.title;

      // 获取所有可能包含数据的元素
      const possibleElements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const text = el.textContent?.trim();
          return text && (
            text.includes('赞') ||
            text.includes('评论') ||
            text.includes('分享') ||
            text.includes('收藏') ||
            text.match(/^\d+[\d万]+$/)  // 匹配数字格式
          );
        })
        .map(el => ({
          tag: el.tagName,
          class: el.className?.slice(0, 50),
          text: el.textContent.trim().slice(0, 100)
        }))
        .slice(0, 20);  // 只取前20个

      return {
        title,
        allTextPreview: allText.slice(0, 2000),
        ssrData,
        possibleElements
      };
    });

    console.log('\n提取结果：');
    console.log(`页面标题: ${pageData.title}`);
    console.log(`\n页面文本预览（前500字）：`);
    console.log(pageData.allTextPreview.slice(0, 500));

    if (pageData.ssrData) {
      console.log(`\nSSR数据: ${pageData.ssrData.slice(0, 200)}...`);
    }

    console.log(`\n可能包含数据的元素（${pageData.possibleElements.length}个）：`);
    for (const el of pageData.possibleElements) {
      console.log(`  [${el.tag}] ${el.class} -> "${el.text}"`);
    }

    // 保存完整报告
    const reportPath = path.join(__dirname, 'playwright-douyin-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      url: TEST_CASE.url,
      title: pageData.title,
      allText: pageData.allTextPreview,
      possibleElements: pageData.possibleElements
    }, null, 2));
    console.log(`\n详细报告已保存: ${reportPath}`);

  } catch (error) {
    console.error('采集失败:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
