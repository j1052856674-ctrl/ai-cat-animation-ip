// round2_process.js — parse YAML search results, filter, annotate, output Feishu JSON
const fs = require('fs');
const path = require('path');

const TODAY = new Date('2026-06-15');
const CUTOFF = new Date(TODAY.getTime() - 30 * 86400000);

// Parse a simple YAML file (opencli format: array of records with indented fields)
function parseYAML(text) {
  const records = [];
  let current = null;
  for (const line of text.split('\n')) {
    if (/^- rank:/.test(line)) {
      if (current) records.push(current);
      current = {};
    } else if (current && /^  (\w[\w_]*):\s*(.*)/.test(line)) {
      const m = line.match(/^  (\w[\w_]*):\s*(.*)/);
      let key = m[1], val = m[2].trim();
      // Remove surrounding quotes
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      } else if (val.startsWith('>')) {
        val = val.replace(/^>-\s*/, '').trim();
      }
      current[key] = val;
    }
  }
  if (current) records.push(current);
  return records;
}

// Time window classification
function timeWindow(dateStr) {
  if (!dateStr || dateStr === 'null') return '待核验';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '待核验';
  const diff = Math.floor((TODAY - d) / 86400000);
  if (diff <= 7) return '热点';
  if (diff <= 30) return '趋势';
  return 'DISCARD';
}

// Annotation heuristics from desc/title/author
function annotate(record, platform, keyword) {
  const desc = (record.desc || '').toLowerCase();
  const title = (record.title || '').toLowerCase();
  const author = (record.author || '').toLowerCase();
  const combined = desc + ' ' + title + ' ' + author;

  return {
    content_form: desc.includes('#动画') || desc.includes('#ai漫剧') ? '动画' :
                  desc.includes('#图文') ? '图文' :
                  desc.includes('#vlog') || desc.includes('#实拍') ? '实拍' :
                  desc.includes('#混剪') ? '混剪' :
                  desc.includes('#配音') ? '配音' : '无法判断',

    narrative: desc.includes('#vlog') || desc.includes('#猫vlog') ? '猫vlog' :
               desc.includes('#meme') || desc.includes('#猫meme') ? '猫Meme' :
               desc.includes('#ai漫剧') || desc.includes('#剧情') || desc.includes('#ai猫剧情') ? 'AI漫剧' :
               desc.includes('#教程') ? '教程' :
               desc.includes('#搞笑') ? '搞笑片段' :
               desc.includes('#短片') ? '情感短片' : '无法判断',

    emotion: desc.includes('#治愈') || desc.includes('#暖心') ? '治愈' :
             desc.includes('#搞笑') || desc.includes('#沙雕') || desc.includes('#反转') ? '搞笑' :
             desc.includes('#萌') || desc.includes('#可爱') ? '萌' :
             desc.includes('#打工') || desc.includes('#社畜') || desc.includes('#职场') ? '社畜共鸣' :
             desc.includes('#温暖') || desc.includes('#感人') ? '温暖' : '无法判断',

    visual_style: desc.includes('#可灵') ? '可灵AI' :
                  desc.includes('#即梦') ? '即梦AI' :
                  desc.includes('#midjourney') || desc.includes('#mj') ? 'Midjourney' :
                  desc.includes('#ai') || desc.includes('#aigc') ? '其他' : '待核验',

    role_type: combined.includes('橘猫') || combined.includes('胖橘') || combined.includes('小橘') || combined.includes('🍊') ? '固定橘猫' :
              (combined.includes('猫') || combined.includes('猫咪') || combined.includes('小猫')) ? '固定其他猫' :
              combined.includes('剧场') || combined.includes('角色') ? '系列化角色群' : '待核验'
  };
}

// Engagement score 1-5
function scoreEngagement(likes) {
  const l = parseInt(likes) || 0;
  if (l > 50000) return 5;
  if (l > 10000) return 4;
  if (l > 1000) return 3;
  if (l > 100) return 2;
  return 1;
}

// === MAIN ===
const TMP = process.env.TEMP || '/tmp';
const files = [
  { path: path.join(TMP, 'r2_douyin_01.yml'), platform: '抖音', keyword: 'AI治愈动画 猫' },
  { path: path.join(TMP, 'r2_douyin_02.yml'), platform: '抖音', keyword: '即梦 猫' },
  { path: path.join(TMP, 'r2_douyin_03.yml'), platform: '抖音', keyword: 'AI猫咪剧情' },
  { path: path.join(TMP, 'r2_douyin_04.yml'), platform: '抖音', keyword: '猫咪小剧场' },
  { path: path.join(TMP, 'r2_douyin_05.yml'), platform: '抖音', keyword: '治愈猫咪' },
  { path: path.join(TMP, 'r2_douyin_06.yml'), platform: '抖音', keyword: '猫咪日常' },
  { path: path.join(TMP, 'r2_douyin_07.yml'), platform: '抖音', keyword: '打工猫' },
  { path: path.join(TMP, 'r2_xhs_01.yml'), platform: '小红书', keyword: '猫猫动画' },
  { path: path.join(TMP, 'r2_xhs_02.yml'), platform: '小红书', keyword: '治愈猫咪' },
  { path: path.join(TMP, 'r2_xhs_03.yml'), platform: '小红书', keyword: '猫咪日常' },
];

const allRecords = [];
const logEntries = [];
let sampleIdx = 1;

for (const f of files) {
  let raw = 0, kept = 0, discarded = 0;
  try {
    const text = fs.readFileSync(f.path, 'utf-8');
    const records = parseYAML(text);
    raw = records.length;

    for (const rec of records) {
      const pubDate = rec.published_at;
      const tw = timeWindow(pubDate);

      if (tw === 'DISCARD') {
        discarded++;
        continue;
      }

      kept++;
      const annotation = annotate(rec, f.platform, f.keyword);
      const title = (rec.title || rec.desc || '').substring(0, 60);
      const likes = parseInt(rec.likes) || 0;

      const sample = {
        '样本ID': `CR-20260615-${String(sampleIdx++).padStart(3, '0')}`,
        '平台': f.platform,
        '搜索关键词': f.keyword,
        '标题': title,
        '完整链接': rec.url || '',
        '作者': rec.author || '未知',
        '点赞数': likes,
        '收藏数': parseInt(rec.collects || rec.collections || 0) || 0,
        '分享数': parseInt(rec.shares || 0) || 0,
        '评论数': parseInt(rec.comments || 0) || 0,
        '发布时间': pubDate || '',
        '时间窗口': tw,
        'cover_url': rec.image_url || '',
        '内容形式': annotation.content_form,
        '叙事结构': annotation.narrative,
        '情绪调性': annotation.emotion,
        '视觉风格(工具)': annotation.visual_style,
        '角色类型': annotation.role_type,
        '数据可信度': f.platform === '抖音' ? 'OpenCLI-缺发布时间' : 'OpenCLI',
        '互动强度': scoreEngagement(likes),
        'IP可迁移性': 3,
        '制作可行性': 3,
        '节奏类型': '待核验',
        '钩子策略': '待核验',
        '视觉风格确认': '待核验',
        '角色一致性': '待核验',
        '互动风格': '待核验',
        '对标判定': '待核验',
      };
      allRecords.push(sample);
    }
  } catch (e) {
    console.error(`Error processing ${f.keyword} (${f.platform}): ${e.message}`);
  }
  logEntries.push({
    keyword: f.keyword,
    platform: f.platform,
    raw,
    after_time_filter: kept,
    after_dedup: kept,
    final: kept,
    discarded_by_time: discarded,
  });
  console.log(`${f.platform.padEnd(8)} ${f.keyword.padEnd(20)} raw=${raw} kept=${kept} discarded=${discarded}`);
}

// Dedup by url
const seen = new Set();
const deduped = allRecords.filter(r => {
  const key = r['平台'] + '|' + r['完整链接'];
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
console.log(`\nDedup: ${allRecords.length} -> ${deduped.length} (removed ${allRecords.length - deduped.length} duplicates)`);

// Write Feishu JSON
const outPath = path.join(TMP, 'round2_feishu.json');
fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2), 'utf-8');
console.log(`\nFeishu JSON written: ${outPath} (${deduped.length} records)`);

// Write log
const logPath = path.join(__dirname || '.', '..', 'content', 'collection-logs', '20260615-round2.jsonl');
const logDir = path.dirname(logPath);
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logLine = JSON.stringify({
  timestamp: new Date().toISOString(),
  total_raw: allRecords.length,
  total_after_filter: deduped.length,
  total_ingested: deduped.length,
  keywords: logEntries,
}) + '\n';
fs.appendFileSync(logPath, logLine, 'utf-8');
console.log(`Log written: ${logPath}`);
console.log('\nDONE');
