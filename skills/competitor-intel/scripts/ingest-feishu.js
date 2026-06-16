#!/usr/bin/env node
/**
 * 飞书入库脚本
 *
 * 将标注后的数据批量写入飞书多维表格
 *
 * 用法: node ingest-feishu.js <annotated.json> --app-token <token> --table-id <id>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  BATCH_SIZE: 50,           // 每批写入条数
  DELAY_BETWEEN_BATCHES: 2000,  // 批次间间隔
  MAX_RETRIES: 3,
};

// ============================================================
// 工具函数
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 执行 lark-cli 命令
 */
function execLark(command) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, stdout: result };
  } catch (err) {
    return { success: false, error: err.stderr || err.message };
  }
}

// ============================================================
// 数据转换
// ============================================================

/**
 * 将标注数据转换为飞书记录格式
 */
function convertToFeishuRecord(item) {
  const annotations = item._annotations || {};

  return {
    fields: {
      // 基础字段
      '样本ID': `CR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`,
      '平台': item.platform || '未知',
      '搜索关键词': item.keyword || '',
      '标题': (item.title || '').substring(0, 60),
      '完整链接': item.url || '',
      '封面链接': item.cover || '',
      '作者': item.author || '未知',
      '点赞数': parseInt(item.likes) || 0,
      '收藏数': parseInt(item.collects) || 0,
      '评论数': parseInt(item.comments) || 0,
      '发布时间': item.published_at || '',

      // 搜索级标注（采集时推断）
      '内容形式': annotations.content_type || '待核验',
      '叙事结构': annotations.narrative_structure || '待核验',
      '情绪调性': annotations.tone || '待核验',
      '视觉风格(工具)': annotations.visual_tool || '待核验',
      '角色类型': annotations.character_type || '待核验',

      // 时间窗口
      '时间窗口': item._time_window || '待核验',

      // 人类核验字段（留空）
      '节奏类型': '',
      '钩子策略': '',
      '视觉风格确认': '',
      '角色一致性': '',
      '互动风格': '',
      '对标判定': '待判断',
    }
  };
}

// ============================================================
// 飞书写入
// ============================================================

/**
 * 批量写入飞书
 */
async function ingestToFeishu(records, appToken, tableId) {
  console.log(`[飞书] 准备写入 ${records.length} 条记录`);

  // 检查 lark-cli 状态
  console.log('[飞书] 检查登录状态...');
  const authResult = execLark('lark-cli auth status');
  if (!authResult.success) {
    console.error('[错误] lark-cli 未登录或未配置');
    console.error('[提示] 请先运行: lark-cli config init --new');
    return false;
  }

  // 分批次写入
  const batches = [];
  for (let i = 0; i < records.length; i += CONFIG.BATCH_SIZE) {
    batches.push(records.slice(i, i + CONFIG.BATCH_SIZE));
  }

  console.log(`[飞书] 分为 ${batches.length} 批次写入`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`[飞书] 写入第 ${i + 1}/${batches.length} 批 (${batch.length} 条)...`);

    const payload = {
      records: batch.map(convertToFeishuRecord)
    };

    // 写入临时文件
    const tempFile = path.join(__dirname, '..', 'output', `feishu-batch-${i}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2));

    // 重试机制
    let retries = 0;
    let batchSuccess = false;

    while (retries < CONFIG.MAX_RETRIES && !batchSuccess) {
      const result = execLark(
        `lark-cli base +record-batch-create --app-token ${appToken} --table-id ${tableId} --records @${tempFile}`
      );

      if (result.success) {
        console.log(`[飞书] 第 ${i + 1} 批写入成功`);
        successCount += batch.length;
        batchSuccess = true;
      } else {
        retries++;
        console.warn(`[警告] 第 ${i + 1} 批写入失败 (${retries}/${CONFIG.MAX_RETRIES}): ${result.error}`);
        if (retries < CONFIG.MAX_RETRIES) {
          console.log(`[等待] ${CONFIG.DELAY_BETWEEN_BATCHES}ms 后重试...`);
          await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
        }
      }
    }

    if (!batchSuccess) {
      console.error(`[错误] 第 ${i + 1} 批最终写入失败`);
      failCount += batch.length;
    }

    // 批次间隔
    if (i < batches.length - 1) {
      await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
    }
  }

  console.log(`\n[完成] 写入统计:`);
  console.log(`  成功: ${successCount} 条`);
  console.log(`  失败: ${failCount} 条`);

  return failCount === 0;
}

// ============================================================
// 主程序
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const inputFile = args[0];
  const appToken = args.find(arg => arg.startsWith('--app-token'))?.split('=')[1];
  const tableId = args.find(arg => arg.startsWith('--table-id'))?.split('=')[1];

  if (!inputFile || !appToken || !tableId) {
    console.error('用法: node ingest-feishu.js <annotated.json> --app-token=<token> --table-id=<id>');
    process.exit(1);
  }

  console.log('[读取] 加载标注数据...');
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const records = data.data || [];

  console.log(`[统计] 共 ${records.length} 条记录待入库`);

  const success = await ingestToFeishu(records, appToken, tableId);

  if (success) {
    console.log('[完成] 全部写入成功');
  } else {
    console.warn('[警告] 部分写入失败');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[错误]', err.message);
  process.exit(1);
});
