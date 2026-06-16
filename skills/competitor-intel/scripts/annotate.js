#!/usr/bin/env node
/**
 * 搜索级标注脚本
 *
 * 从 OpenCLI 原始输出中推断维度，标注为 `待核验` 的维度需人类核验
 * ⚠️ 只做标注，不做分析（方向分析交给 topic-recommendation）
 *
 * 用法: node annotate.js <input.json> [output.json]
 * 输出: data/annotated/xxx-annotated.json
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 标注规则（从 tags/desc 推断，不做分析）
// ============================================================

const TAG_PATTERNS = {
  // 内容形式
  content_type: {
    '动画': ['#ai漫剧', '#ai短剧', '#动画'],
    '图文': ['#图文'],
    '实拍': ['#实拍', '#vlog'],
    '混剪': ['#混剪'],
    '配音': ['#配音', '#搞笑配音'],
  },

  // 叙事结构
  narrative_structure: {
    '猫vlog': ['#vlog', '#日常'],
    '猫Meme': ['#猫meme', '#meme'],
    'AI漫剧': ['#ai漫剧', '#ai短剧'],
    '情感短片': ['#情感', '#治愈'],
    '教程': ['#教程', '#攻略'],
    '搞笑片段': ['#搞笑', '#沙雕'],
  },

  // 情绪调性
  tone: {
    '治愈': ['#治愈', '#温暖'],
    '搞笑': ['#搞笑', '#沙雕', '#funny'],
    '萌': ['#萌', '#可爱'],
    '温暖': ['#温暖'],
    '社畜共鸣': ['#社畜', '#打工人', '#职场'],
  },

  // 视觉风格(工具)
  visual_tool: {
    '可灵AI': ['#可灵AI', '#可灵'],
    '即梦AI': ['#即梦AI', '#即梦'],
    'Midjourney': ['#midjourney', '#mj'],
  },

  // 角色类型
  character_type: {
    '固定橘猫': ['橘猫', '胖橘'],
    '固定其他猫': ['英短', '布偶', '美短'],
  },
};

// ============================================================
// 标注函数
// ============================================================

/**
 * 从标题和标签推断维度
 */
function inferDimension(item) {
  const text = `${item.title || ''} ${item.desc || ''} ${(item.tags || []).join(' ')}`;
  const result = {};

  for (const [dimension, patterns] of Object.entries(TAG_PATTERNS)) {
    let matched = false;

    for (const [value, keywords] of Object.entries(patterns)) {
      if (keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
        result[dimension] = value;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result[dimension] = '待核验';
    }
  }

  return result;
}

/**
 * 计算时间窗口
 *
 * search/daily-hot 模式：按时间窗口标记
 * user-page 模式：不限制，标记为"用户主页"
 */
function computeTimeWindow(item, mode) {
  // user-page 模式：不限制时间
  if (mode === 'user-page') {
    return { window: '用户主页', days_ago: null };
  }

  // daily-hot 模式：热榜数据无时间
  if (mode === 'daily-hot') {
    return { window: '热榜', days_ago: null };
  }

  // search 模式：按时间窗口标记
  const publishedAt = item.published_at;
  if (!publishedAt) return { window: '待核验', days_ago: null };

  try {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffMs = now - date;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let window;
    if (days <= 7) window = '热点';
    else if (days <= 30) window = '趋势';
    else window = '长尾'; // >30天标记为长尾，不丢弃

    return { window, days_ago: days };
  } catch {
    return { window: '待核验', days_ago: null };
  }
}

/**
 * 获取点赞数（兼容不同平台字段）
 */
function getLikes(item) {
  // 小红书：likes（字符串，如 "1.5万"）
  // 抖音：likes（数字）
  // 抖音 user-videos：digg_count
  const likesRaw = item.likes || item.digg_count || '0';
  const likesStr = String(likesRaw).replace(/万/g, '0000').replace(/[\s,]/g, '');
  return parseInt(likesStr) || 0;
}

// ============================================================
// 主程序
// ============================================================

function main() {
  const [inputFile, outputFile, ...rest] = process.argv.slice(2);

  // 解析参数
  const minLikesIndex = rest.indexOf('--min-likes');
  const minLikes = minLikesIndex !== -1 ? parseInt(rest[minLikesIndex + 1]) || 0 : 0;

  if (!inputFile) {
    console.error('用法: node annotate.js <input.json> [output.json] [--min-likes 100]');
    console.error('选项:');
    console.error('  --min-likes <number>  最小点赞数过滤（默认不过滤）');
    process.exit(1);
  }

  console.log('[读取] ' + inputFile);

  const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const items = raw.data || raw;
  const mode = raw.meta?.mode || 'search';

  console.log('[处理] 共 ' + items.length + ' 条样本');
  console.log('[模式] ' + mode);
  if (minLikes > 0) {
    console.log('[过滤] 最小点赞数: ' + minLikes);
  }

  // 去重（按完整链接）
  const seen = new Set();
  const uniqueItems = [];

  for (const item of items) {
    const key = item.url || (item.platform + '-' + item.title + '-' + item.author);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  console.log('[去重] 去除重复 ' + (items.length - uniqueItems.length) + ' 条，剩余 ' + uniqueItems.length + ' 条');

  // 标注（只做搜索级标注，不做分析）
  let annotated = uniqueItems.map(item => {
    const timeInfo = computeTimeWindow(item, mode);
    const annotations = inferDimension(item);
    const likes = getLikes(item);

    return {
      ...item,
      _likes: likes,
      _annotations: annotations,
      _time_window: timeInfo.window,
      _days_ago: timeInfo.days_ago,
    };
  });

  // 点赞过滤（可选）
  let filteredByLikes = 0;
  if (minLikes > 0) {
    const beforeCount = annotated.length;
    annotated = annotated.filter(item => item._likes >= minLikes);
    filteredByLikes = beforeCount - annotated.length;
    console.log('[过滤] 去除低赞(< ' + minLikes + ') ' + filteredByLikes + ' 条，剩余 ' + annotated.length + ' 条');
  }

  // 输出到 data/annotated/
  const output = {
    meta: {
      ...raw.meta,
      annotated_at: new Date().toISOString(),
      original_count: items.length,
      unique_count: uniqueItems.length,
      final_count: annotated.length,
      min_likes: minLikes > 0 ? minLikes : null,
      note: '只做搜索级标注，不做方向分析',
    },
    data: annotated,
  };

  // 默认输出到 data/annotated/
  let outPath;
  if (outputFile) {
    outPath = outputFile;
  } else {
    const baseName = path.basename(inputFile, '.json');
    const annotatedDir = path.join(__dirname, '..', '..', '..', 'data', 'annotated');
    if (!fs.existsSync(annotatedDir)) fs.mkdirSync(annotatedDir, { recursive: true });
    outPath = path.join(annotatedDir, baseName + '-annotated.json');
  }

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log('[完成] 标注结果: ' + outPath);
  console.log('[统计] 热点(≤7d): ' + annotated.filter(i => i._time_window === '热点').length + ' 条');
  console.log('[统计] 趋势(8-30d): ' + annotated.filter(i => i._time_window === '趋势').length + ' 条');
  console.log('[统计] 长尾(>30d): ' + annotated.filter(i => i._time_window === '长尾').length + ' 条');
  if (mode === 'user-page') {
    console.log('[统计] 用户主页: ' + annotated.filter(i => i._time_window === '用户主页').length + ' 条');
  }
  console.log('[说明] 方向分析请使用 topic-recommendation Skill');
}

main();
