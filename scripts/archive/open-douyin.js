const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--window-size=1280,800']
  });

  const page = await browser.newPage();

  // 打开抖音视频页
  console.log('正在打开抖音...');
  await page.goto('https://www.douyin.com/video/7651104311321629937', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  console.log('已打开抖音视频页，等待加载...');
  await page.waitForTimeout(5000);

  // 截图
  const screenshotPath = path.join(__dirname, 'douyin-opened.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`截图已保存: ${screenshotPath}`);

  // 保持浏览器打开
  console.log('浏览器保持打开，你可以手动查看');
  console.log('按 Ctrl+C 结束脚本');

  // 等待用户结束
  process.on('SIGINT', async () => {
    console.log('关闭浏览器...');
    await browser.close();
    process.exit(0);
  });

  // 无限等待
  await new Promise(() => {});
})();
