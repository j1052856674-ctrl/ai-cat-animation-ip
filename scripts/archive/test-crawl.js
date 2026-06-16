#!/usr/bin/env node
/**
 * 单条数据采集测试脚本
 * 测试三种方案的数据完整性和质量
 */

const https = require('https');
const http = require('http');

// ============================================================
// 测试配置
// ============================================================
const TEST_CASE = {
  platform: '抖音',
  keyword: 'AI治愈动画 猫',
  videoId: '7642497561103111013'  // 你现有数据中的视频ID
};

// ============================================================
// 方案 A：Evil0ctal API（本地部署）
// ============================================================
async function testEvil0ctal(videoId) {
  return new Promise((resolve) => {
    console.log('\n【方案 A】Evil0ctal API（抖音视频详情）');
    console.log('请求：GET /api/douyin/web/fetch_one_video?aweme_id=' + videoId);

    // 如果本地部署了 Evil0ctal，可以取消下面注释
    // 这里先用模拟数据展示结构
    const mockData = {
      status: 'mock',
      note: '请先在本地运行: docker run -d -p 80:80 evil0ctal/douyin_tiktok_download_api',
      fields: {
        title: '视频标题',
        author: '作者',
        likes: '点赞数',
        comments: '评论数',
        shares: '分享数',
        plays: '播放数',
        published_at: '发布时间',
        url: '视频链接',
        cover: '封面图'
      }
    };

    console.log('预期返回字段：', Object.keys(mockData.fields));
    resolve({
      name: 'Evil0ctal API',
      available: false,
      reason: '需要本地部署 Docker',
      fields: Object.keys(mockData.fields).length,
      data: null
    });
  });
}

// ============================================================
// 方案 B：直接 HTTP 抓取（模拟现有方式）
// ============================================================
async function testDirectFetch(videoId) {
  console.log('\n【方案 B】直接 HTTP 抓取（模拟现有方式）');
  console.log('请求：GET https://www.douyin.com/video/' + videoId);

  return new Promise((resolve) => {
    const options = {
      hostname: 'www.douyin.com',
      port: 443,
      path: `/video/${videoId}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://www.douyin.com/',
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // 尝试提取关键数据
        const result = extractDataFromHTML(data, videoId);
        resolve({
          name: '直接 HTTP',
          available: result.success,
          statusCode: res.statusCode,
          dataSize: data.length,
          fields: result.fields,
          extracted: result.data,
          note: result.note
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        name: '直接 HTTP',
        available: false,
        reason: err.message,
        fields: 0,
        data: null
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: '直接 HTTP',
        available: false,
        reason: '请求超时',
        fields: 0,
        data: null
      });
    });

    req.end();
  });
}

// ============================================================
// 从 HTML 提取数据
// ============================================================
function extractDataFromHTML(html, videoId) {
  const result = {
    success: false,
    fields: [],
    data: {},
    note: ''
  };

  if (html.length < 1000) {
    result.note = '页面内容过少，可能被反爬拦截';
    return result;
  }

  // 尝试提取 SSR 数据
  const ssrMatch = html.match(/<script id="RENDER_DATA"[^>]*>([^<]+)<\/script>/);
  if (ssrMatch) {
    try {
      const decoded = decodeURIComponent(ssrMatch[1]);
      const data = JSON.parse(decoded);
      result.success = true;
      result.fields = Object.keys(data).slice(0, 5);
      result.data = { type: 'SSR_DATA', keys: Object.keys(data).slice(0, 5) };
      result.note = '找到 SSR 数据，大小约 ' + decoded.length + ' 字符';
    } catch {
      result.note = 'SSR 数据解析失败';
    }
  } else {
    // 尝试提取其他数据
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      result.data.title = titleMatch[1].trim();
    }

    // 尝试提取点赞数
    const likesMatch = html.match(/(\d+(?:\.\d+)?)\s*赞/);
    if (likesMatch) {
      result.data.likes = likesMatch[1];
      result.fields.push('likes');
    }

    result.note = '未找到 SSR，尝试正则提取基础字段';
  }

  return result;
}

// ============================================================
// 方案 C：TikHub API（付费参照）// ============================================================
async function testTikHub(videoId) {
  console.log('\n【方案 C】TikHub API（付费参照）');
  console('请求：GET /api/v1/douyin/video?url=https://www.douyin.com/video/' + videoId);

  // 这里需要 API Key，先展示结构
  return {
    name: 'TikHub API',
    available: false,
    reason: '需要 API Key（在环境变量设置）',
      console.error('请设置 TIKHUB_API_KEY');
      process.exit(1);
    }

    return {
      name: 'TikHub API',
      available: false,
      reason: '需要 API Key',
      fields: ['title', 'author', 'likes', 'comments', 'shares', 'plays', 'published_at', 'cover'],
      note: '可作为完整数据的参照基准'
    };
  }

// ============================================================
// 执行测试
// ============================================================
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 单条数据采集测试');
  console('测试目标：' + TEST_CASE.platform + ' | ' + TEST_CASE.keyword);
  console.log('视频ID：' + TEST_CASE.videoId);
  console('='.repeat(60));

  const results = [];

  // 测试方案 B（直接 HTTP）
  const resultB = await testDirectFetch(TEST_CASE.videoId);
  results.push(resultB);

  // 测试方案 A（Evil0ctal）
  const resultA = await testEvil0ctal(TEST_CASE.videoId);
  results.push(resultA);

  // 测试方案 C（TikHub）
  const resultC = await testTikHub(TEST_CASE.videoId);
  results.push(resultC);

  // 输出对比报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果对比');
  console('='.repeat(60));

  const table = results.map(r => ({
    '方案': r.name,
    '可用': r.available ? '✅' : '❌',
    '字段数': r.fields?.length || 0,
    '状态': r.reason || 'OK'
  }));

  console.table(table);

  // 推荐
  console.log('\n' + '='.repeat(60));
  console.log('💡 建议');
  console('='.repeat(60));

  if (resultB.available) {
    console.log('✅ 直接 HTTP 可用，但字段可能不完整');
    console('   建议：检查返回的 HTML 结构，看 SSR 数据是否加密');
  } else {
    console('❌ 直接 HTTP 不可用，可能原因：');
    console('   1. 需要 Cookie/Session');
    console('   2. 需要特定 Header');
    console('   3. 抖音反爬升级');
    console('   ');
    console('   下一步：尝试方案 A（Evil0ctal）或方案 C（TikHub）');
  }

  // 保存结果
  const fs = require('fs');
  const reportPath = './crawl-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    testCase: TEST_CASE,
    timestamp: new Date().toISOString(),
    results
  }, null, 2));

  console.log('\n📄 详细报告已保存至：' + reportPath);
}

runTests().catch(console.error);
