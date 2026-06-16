#!/usr/bin/env node
/**
 * Playwright 抖音精确字段提取（最终版）
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TEST_CASE = {
  url: 'https://www.douyin.com/video/7642497561103111013'
};

async function main() {
  console.log('🎵 Playwright 抖音精确提取测试\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  try {
    await page.goto(TEST_CASE.url, { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 精确提取
    const data = await page.evaluate(() => {
      const result = {
        title: '',
        author: '',
        likes: '',
        comments: '',
        shares: '',
        collects: '',
        published_at: '',
        extractedAt: new Date().toISOString()
      };

      // 1. 标题 - 从页面 title 或 h1 提取
      const titleMatch = document.title.match(/^(.*?)\s*-\s*抖音/);
      result.title = titleMatch ? titleMatch[1].trim() : document.title;

      // 2. 作者 - 从页面中找作者名
      const authorLinks = document.querySelectorAll('a[href*="/user/"]');
      for (const link of authorLinks) {
        if (link.textContent && link.textContent.trim()) {
          result.author = link.textContent.trim();
          break;
        }
      }

      // 3. 发布时间 - 找包含"发布时间"的元素
      const timeElements = document.querySelectorAll('*');
      for (const el of timeElements) {
        const text = el.textContent || '';
        if (text.includes('发布时间') && text.match(/\d{4}-\d{2}-\d{2}/)) {
          const match = text.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
          if (match) result.published_at = match[1];
        }
      }

      // 4. 互动数据 - 通过 DOM 结构找
      // 策略：找包含数字的元素，且旁边有"赞"、"评论"、"分享"、"收藏"字样
      const allElements = document.querySelectorAll('*');

      for (const el of allElements) {
        const text = el.textContent?.trim() || '';

        // 检查是否是数字（支持"万"）
        if (/^\d+$/.test(text) || /^\d+\.?\d*万$/.test(text)) {
          // 检查相邻元素
          const parent = el.parentElement;
          if (!parent) continue;

          const siblingText = parent.textContent || '';
          const nextSibling = el.nextElementSibling;
          const prevSibling = el.previousElementSibling;

          // 通过相邻元素判断类型
          const contextText = (nextSibling?.textContent || '') + (prevSibling?.textContent || '') + siblingText;

          if (contextText.includes('赞') && !result.likes) result.likes = text;
          if (contextText.includes('评论') && !result.comments) result.comments = text;
          if (contextText.includes('分享') && !result.shares) result.shares = text;
          if (contextText.includes('收藏') && !result.collects) result.collects = text;
        }
      }

      // 备用：直接扫描页面文本
      const bodyText = document.body.innerText;

      // 尝试正则提取
      const likeMatch = bodyText.match(/(\d+(?:\.\d+)?)[\s\n]*(?:赞|喜欢)/);
      const commentMatch = bodyText.match(/(\d+(?:\.\d+)?)[\s\n]*评论/);
      const shareMatch = bodyText.match(/(\d+(?:\.\d+)?)[\s\n]*分享/);
      const collectMatch = bodyText.match(/(\d+(?:\.\d+)?)[\s\n]*收藏/);

      if (!result.likes && likeMatch) result.likes = likeMatch[1];
      if (!result.comments && commentMatch) result.comments = commentMatch[1];
      if (!result.shares && shareMatch) result.shares = shareMatch[1];
      if (!result.collects && collectMatch) result.collects = collectMatch[1];

      return result;
    });

    console.log('📊 提取结果：');
    console.log(`  标题: ${data.title}`);
    console.log(`  作者: ${data.author}`);
    console.log(`  点赞: ${data.likes}`);
    console.log(`  评论: ${data.comments}`);
    console.log(`  分享: ${data.shares}`);
    console.log(`  收藏: ${data.collects}`);
    console.log(`  发布时间: ${data.published_at}`);
    console.log(`  提取时间: ${data.extractedAt}`);

    // 计算完整度
    const totalFields = 7;
    const filledFields = Object.entries(data).filter(([k, v]) => k !== 'extractedAt' && v).length;
    console.log(`\n  字段完整度: ${filledFields}/${totalFields} (${Math.round(filledFields/totalFields*100)}%)`);

    // 截图
    const screenshotPath = path.join(__dirname, 'playwright-douyin-final.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`\n  截图已保存: ${screenshotPath}`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
