const { execSync } = require('child_process');
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('content/round2_samples.json', 'utf8'));
const LARK = '/c/Users/Administrator/AppData/Roaming/npm/lark-cli';

// All writable fields matching table
const fields = ['样本ID', '收藏数', '时间窗口', '数据可信度', '评论数', '点赞数', '作者', '分享数', '发布时间', '完整链接', '平台', '标题', '搜索关键词'];

// Write in chunks of 10
const CHUNK = 10;
for (let start = 0; start < data.length; start += CHUNK) {
  const chunk = data.slice(start, start + CHUNK);
  const rows = chunk.map(r => fields.map(f => r[f] !== undefined ? r[f] : null));
  const batch = { fields, rows };
  const json = JSON.stringify(batch).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const cmd = `"${LARK}" base +record-batch-create --base-token MCwibHumUasGTJsQAtRcicDInph --table-id tblU23Fw2FnTjIIQ --json "${json}"`;
  try {
    const r = execSync(cmd, { encoding: 'utf8', timeout: 60000, shell: 'bash' });
    console.log(`Chunk ${Math.floor(start/CHUNK)+1}: OK - ${JSON.parse(r).data?.record_id_list?.length || 0} records`);
  } catch(e) {
    console.log(`Chunk ${Math.floor(start/CHUNK)+1}: FAIL - ${(e.stderr || e.message).substring(0, 300)}`);
  }
}
console.log('DONE');
