#!/usr/bin/env node
/**
 * Process OpenCLI competitor search results into Feishu Base records.
 */
const fs = require("fs");
const path = require("path");

const RESULT_DIR = "C:/Users/Administrator/AppData/Local/Temp/competitor-collection";
const OUTPUT_FILE = path.join(RESULT_DIR, "records.json");
const TOP20_FILE = path.join(RESULT_DIR, "top20.txt");

const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().slice(0, 10);
const TODAY_FMT = TODAY_STR.replace(/-/g, "/");
const TODAY_COMPACT = TODAY_STR.replace(/-/g, "");

const FILE_MAP = {
  "xhs_AI猫猫动画.json": ["小红书", "AI猫猫动画"],
  "xhs_AI猫咪.json": ["小红书", "AI猫咪"],
  "xhs_猫猫动画.json": ["小红书", "猫猫动画"],
  "xhs_可灵猫猫.json": ["小红书", "可灵 猫猫"],
  "xhs_即梦猫咪AI.json": ["小红书", "即梦 猫咪 AI"],
  "dy_AI猫猫动画.json": ["抖音", "AI猫猫动画"],
  "dy_AI猫咪剧情.json": ["抖音", "AI猫咪剧情"],
  "dy_猫猫动画.json": ["抖音", "猫猫动画"],
  "dy_可灵AI猫咪.json": ["抖音", "可灵AI 猫咪"],
  "dy_即梦猫.json": ["抖音", "即梦 猫"],
  "dy_AI治愈动画猫.json": ["抖音", "AI治愈动画 猫"],
  "dy_AI动画短片治愈.json": ["抖音", "AI动画短片 治愈"],
};

function parseLikes(val) {
  if (!val && val !== 0) return 0;
  const s = String(val).trim();
  if (s.includes("万")) {
    const num = parseFloat(s.replace("万", ""));
    return isNaN(num) ? 0 : Math.round(num * 10000);
  }
  const num = parseInt(s, 10);
  return isNaN(num) ? 0 : num;
}

function parsePublishedDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  return null;
}

function calcTimeWindow(pubDate) {
  if (!pubDate) return "参考(>30天)";
  const days = Math.floor((TODAY - pubDate) / (1000 * 60 * 60 * 24));
  if (days <= 7) return "热点(≤7天)";
  if (days <= 30) return "趋势(8-30天)";
  return "参考(>30天)";
}

function fmtDate(d) {
  if (!d) return "未知";
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
}

function hasAny(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function inferContentForm(title, desc, tagsStr) {
  const text = `${title} ${desc} ${tagsStr}`.toLowerCase();
  if (hasAny(text, ["短剧","剧情","故事","连续","剧集","集","总裁"])) return "短剧/剧情";
  if (hasAny(text, ["教程","教学","制作","方法","技巧","步骤"])) return "教程/教学";
  if (hasAny(text, ["混剪","合集","推荐","盘点"])) return "混剪/合集";
  if (hasAny(text, ["跳舞","舞蹈","唱","音乐","mv"])) return "歌舞/音乐";
  if (hasAny(text, ["搞笑","萌","可爱","治愈","日常"])) return "萌宠日常";
  return "动画短片";
}

function inferNarrativeType(title, desc, tagsStr) {
  const text = `${title} ${desc} ${tagsStr}`.toLowerCase();
  if (hasAny(text, ["教程","教学","步骤","方法","如何","怎么"])) return "教程式";
  if (hasAny(text, ["第一集","第二集","第三集","第四集","第五集","剧集","连续"])) return "连续剧";
  if (hasAny(text, ["故事","剧情","短剧","总裁"])) return "故事型";
  if (hasAny(text, ["日常","vlog","记录"])) return "日常记录";
  return "片断式";
}

function inferEmotionalTone(title, desc, tagsStr) {
  const text = `${title} ${desc} ${tagsStr}`.toLowerCase();
  if (hasAny(text, ["治愈","温暖","温馨","可爱","萌","软萌","甜甜"])) return "治愈温暖";
  if (hasAny(text, ["搞笑","幽默","沙雕","好笑","有趣"])) return "搞笑幽默";
  if (hasAny(text, ["惊悚","恐怖","悬疑","诡异","害怕"])) return "悬疑惊悚";
  if (hasAny(text, ["感动","感人","泪目","催泪","emo"])) return "感动催泪";
  if (hasAny(text, ["酷炫","帅气","燃","热血"])) return "酷炫热血";
  return "轻松日常";
}

function inferVisualTool(title, desc, tagsStr) {
  const text = `${title} ${desc} ${tagsStr}`.toLowerCase();
  const tools = [];
  if (hasAny(text, ["可灵","kling"])) tools.push("可灵AI");
  if (hasAny(text, ["即梦","jimeng"])) tools.push("即梦AI");
  if (hasAny(text, ["sora"])) tools.push("Sora");
  if (hasAny(text, ["runway"])) tools.push("Runway");
  if (hasAny(text, ["pika"])) tools.push("Pika");
  if (hasAny(text, ["midjourney","mj"])) tools.push("Midjourney");
  if (hasAny(text, ["stable diffusion","sd"])) tools.push("Stable Diffusion");
  if (hasAny(text, ["comfyui"])) tools.push("ComfyUI");
  if (hasAny(text, ["ai","人工智能"])) {
    if (tools.length === 0) tools.push("AI生成(未具名)");
  }
  return tools.length > 0 ? tools.join("、") : "未知";
}

function inferCharacterType(title, desc, tagsStr) {
  const text = `${title} ${desc} ${tagsStr}`.toLowerCase();
  const types = [];
  if (hasAny(text, ["橘猫","胖橘","橘子"])) types.push("橘猫");
  if (hasAny(text, ["黑猫","小黑"])) types.push("黑猫");
  if (hasAny(text, ["白猫","小白"])) types.push("白猫");
  if (hasAny(text, ["三花","花猫"])) types.push("花猫");
  if (types.length === 0 && hasAny(text, ["猫","猫咪","喵"])) types.push("猫(通用)");
  return types.length > 0 ? types.join("、") : "猫(通用)";
}

function inferDirection(title, desc, tagsStr) {
  const text = `${title} ${desc} ${tagsStr}`.toLowerCase();
  if (hasAny(text, ["短剧","剧集","连续","总裁","剧情","故事"])) return "剧情向";
  if (hasAny(text, ["教程","教学","制作"])) return "教程向";
  if (hasAny(text, ["搞笑","沙雕","幽默","有趣"])) return "搞笑向";
  if (hasAny(text, ["治愈","温暖","温馨"])) return "治愈向";
  if (hasAny(text, ["萌","可爱","卖萌"])) return "萌宠向";
  if (hasAny(text, ["跳舞","舞蹈","唱","音乐"])) return "歌舞向";
  return "综合向";
}

function calcInteraction(likes, comments, shares, collects) {
  const score = likes + comments * 3 + shares * 2 + collects * 2;
  if (score >= 10000) return 5;
  if (score >= 5000) return 4;
  if (score >= 1000) return 3;
  if (score >= 100) return 2;
  return 1;
}

function calcIPMigratability(title, desc, tagsStr, likes) {
  const text = `${title} ${desc} ${tagsStr}`.toLowerCase();
  let score = 2;
  if (hasAny(text, ["角色","人设","形象","固定","系列","剧集"])) score += 1;
  if (hasAny(text, ["第一集","第二集","第三集","第四集","第五集"])) score += 1;
  if (hasAny(text, ["原创","自制","原创动画"])) score += 1;
  if (likes > 5000) score += 1;
  return Math.min(score, 5);
}

function calcFeasibility(title, desc, tagsStr) {
  const text = `${title} ${desc} ${tagsStr}`.toLowerCase();
  let score = 3;
  if (hasAny(text, ["可灵","即梦","简单","快速","一键"])) score += 1;
  if (hasAny(text, ["图片","漫画","插画","静态"])) score += 1;
  if (hasAny(text, ["复杂","精细","高难度","3d"])) score -= 1;
  return Math.max(1, Math.min(score, 5));
}

function isIrrelevant(fields) {
  const title = (fields["标题"] || "").toLowerCase();
  return !["猫","猫咪","喵","橘","咪"].some(kw => title.includes(kw));
}

// ============= Main =============

console.log("=".repeat(60));
console.log("Step 1: Loading raw results...");
console.log("=".repeat(60));

const allItems = [];
for (const [filename, [platform, keyword]] of Object.entries(FILE_MAP)) {
  const filepath = path.join(RESULT_DIR, filename);
  if (!fs.existsSync(filepath) || fs.statSync(filepath).size === 0) {
    console.log(`  [SKIP] ${filename}: empty or missing`);
    continue;
  }
  try {
    const raw = fs.readFileSync(filepath, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      console.log(`  [WARN] ${filename}: not a list`);
      continue;
    }
    for (const item of data) {
      item._platform = platform;
      item._keyword = keyword;
      item._file = filename;
      allItems.push(item);
    }
    console.log(`  [LOAD] ${filename}: ${data.length} items`);
  } catch (e) {
    console.log(`  [ERROR] ${filename}: ${e.message}`);
  }
}
console.log(`\nTotal raw items loaded: ${allItems.length}`);

console.log("\n" + "=".repeat(60));
console.log("Step 2: Extracting fields...");
console.log("=".repeat(60));

const records = [];
for (const raw of allItems) {
  try {
    const platform = raw._platform;
    const keyword = raw._keyword;

    let title;
    if (platform === "小红书") {
      title = raw.title || "";
    } else {
      title = raw.desc || "";
      if (title.includes("#")) title = title.split("#")[0].trim();
    }
    if (title.length > 60) title = title.slice(0, 57) + "...";

    const url = raw.url || "";
    const author = raw.author || "";
    const likes = parseLikes(raw.likes);
    const comments = parseInt(raw.comments || 0, 10) || 0;
    const shares = parseInt(raw.shares || 0, 10) || 0;
    const collects = parseInt(raw.collects || 0, 10) || 0;

    const pubDate = parsePublishedDate(raw.published_at);
    const pubDateStr = fmtDate(pubDate);
    const timeWindow = calcTimeWindow(pubDate);

    const desc = raw.desc || "";
    const tagsStr = [...(desc.matchAll(/#(\w+\S*)/g) || [])].map(m => m[1]).join(" ") || "";

    const contentForm = inferContentForm(title, desc, tagsStr);
    const narrativeType = inferNarrativeType(title, desc, tagsStr);
    const emotionalTone = inferEmotionalTone(title, desc, tagsStr);
    const visualTool = inferVisualTool(title, desc, tagsStr);
    const characterType = inferCharacterType(title, desc, tagsStr);
    const directionType = inferDirection(title, desc, tagsStr);

    const interaction = calcInteraction(likes, comments, shares, collects);
    const ipMigratability = calcIPMigratability(title, desc, tagsStr, likes);
    const feasibility = calcFeasibility(title, desc, tagsStr);

    records.push({
      "平台": platform === "小红书" ? "小红书" : "抖音",
      "搜索关键词": keyword,
      "标题": title,
      "完整链接": url,
      "作者": author,
      "点赞数": likes,
      "收藏数": collects,
      "评论数": comments,
      "分享数": shares,
      "发布时间": pubDateStr,
      "采集时间": TODAY_FMT,
      "时间窗口": timeWindow,
      "数据可信度": "OpenCLI",
      "内容形式": contentForm,
      "叙事结构": narrativeType,
      "情绪调性": emotionalTone,
      "视觉风格(工具)": visualTool,
      "方向归类": directionType,
      "互动强度(1-5)": interaction,
      "IP可迁移性(1-5)": ipMigratability,
      "制作可行性(1-5)": feasibility,
      _url: url,
      _author: author,
      _keyword: keyword,
      _likes: likes,
      _comments: comments,
    });
  } catch (e) {
    console.log(`  [ERROR] extracting: ${e.message}`);
  }
}
console.log(`Total extracted records: ${records.length}`);

console.log("\n" + "=".repeat(60));
console.log("Step 3: Dedup & Filter...");
console.log("=".repeat(60));

const seenUrls = new Set();
const authorKeywordCount = {};
const filtered = [];

for (const rec of records) {
  const url = rec._url;
  const author = rec._author;
  const keyword = rec._keyword;

  if (url && seenUrls.has(url)) continue;
  if (isIrrelevant(rec)) continue;

  const akKey = `${author}|||${keyword}`;
  if ((authorKeywordCount[akKey] || 0) >= 3) continue;

  seenUrls.add(url);
  authorKeywordCount[akKey] = (authorKeywordCount[akKey] || 0) + 1;
  filtered.push(rec);
}
console.log(`After dedup & filter: ${filtered.length}`);

console.log("\n" + "=".repeat(60));
console.log("Step 4: Assigning sample IDs...");
console.log("=".repeat(60));

for (let i = 0; i < filtered.length; i++) {
  filtered[i]["样本ID"] = `CR-${TODAY_COMPACT}-${String(i+1).padStart(3,"0")}`;
}

// Build lark-cli records
const feishuRecords = filtered.map(rec => {
  const fields = {};
  for (const [k, v] of Object.entries(rec)) {
    if (!k.startsWith("_") && k !== "样本ID") fields[k] = v;
  }
  return { fields };
});

const output = { records: feishuRecords };
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");
console.log(`Records written to: ${OUTPUT_FILE}`);
console.log(`Total records for Feishu: ${feishuRecords.length}`);

// Top 20
console.log("\n" + "=".repeat(60));
console.log("Step 5: Top 20 by interaction (likes + comments*3)...");
console.log("=".repeat(60));

const sorted = [...filtered].sort((a,b) => (b._likes + b._comments*3) - (a._likes + a._comments*3));
const top20 = sorted.slice(0, 20);

let top20Text = "排名  样本ID              标题                                                         平台     点赞数  链接\n";
top20Text += "-".repeat(150) + "\n";
for (let i = 0; i < top20.length; i++) {
  const r = top20[i];
  const sid = r["样本ID"] || "?";
  const title = (r["标题"] || "").slice(0, 60);
  const platform = r["平台"];
  const likes = String(r._likes);
  const url = r._url || "";
  top20Text += `${String(i+1).padStart(2)}. ${sid}  ${title.padEnd(60)} ${platform}  ${likes.padStart(8)}  ${url}\n`;
}
fs.writeFileSync(TOP20_FILE, top20Text, "utf-8");
console.log(`Top 20 written to: ${TOP20_FILE}`);

for (let i = 0; i < top20.length; i++) {
  const r = top20[i];
  console.log(`  ${String(i+1).padStart(2)}. ${r["样本ID"]} | ${r["平台"]} | ${String(r._likes).padStart(6)}赞 | ${(r["标题"]||"").slice(0,40)} | ${r._url}`);
}

const xhsCount = filtered.filter(r => r["平台"] === "小红书").length;
const dyCount = filtered.filter(r => r["平台"] === "抖音").length;
console.log(`\n  Platform breakdown: 小红书=${xhsCount}, 抖音=${dyCount}`);
