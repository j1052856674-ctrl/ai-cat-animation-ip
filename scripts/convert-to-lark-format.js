#!/usr/bin/env node
/**
 * Convert records.json from per-record format to lark-cli columnar format.
 */
const fs = require("fs");

const INPUT = "C:/Users/Administrator/AppData/Local/Temp/competitor-collection/records.json";
const OUTPUT = "C:/Users/Administrator/AppData/Local/Temp/competitor-collection/lark-batch.json";

const data = JSON.parse(fs.readFileSync(INPUT, "utf-8"));
const perRecordFields = data.records;

// Determine field order: add 样本ID as first field
const fieldOrder = [
  "样本ID", "平台", "搜索关键词", "标题", "完整链接", "作者",
  "点赞数", "收藏数", "评论数", "分享数",
  "发布时间", "采集时间", "时间窗口", "数据可信度",
  "内容形式", "叙事结构", "情绪调性", "视觉风格(工具)", "方向归类",
  "互动强度(1-5)", "IP可迁移性(1-5)", "制作可行性(1-5)"
];

// Build columnar format
const rows = perRecordFields.map((rec, idx) => {
  const fields = rec.fields;
  const sid = `CR-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${String(idx+1).padStart(3,"0")}`;
  return fieldOrder.map(fn => {
    if (fn === "样本ID") return sid;
    const val = fields[fn];
    return val !== undefined ? val : null;
  });
});

const batch = {
  fields: fieldOrder,
  rows: rows
};

fs.writeFileSync(OUTPUT, JSON.stringify(batch, null, 2), "utf-8");
console.log(`Converted ${rows.length} records to columnar format`);
console.log(`Output: ${OUTPUT}`);
