const { spawn } = require('child_process');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('content/round2_samples.json', 'utf8'));
const fields = ['样本ID', '收藏数', '时间窗口', '数据可信度', '评论数', '点赞数', '作者', '分享数', '发布时间', '完整链接', '平台', '标题', '搜索关键词'];

async function writeBatch(chunk, batchNum) {
  const rows = chunk.map(r => fields.map(f => r[f] !== undefined ? r[f] : null));
  const json = JSON.stringify({ fields, rows });

  return new Promise((resolve, reject) => {
    const child = spawn('lark-cli', [
      'base', '+record-batch-create',
      '--base-token', 'MCwibHumUasGTJsQAtRcicDInph',
      '--table-id', 'tblU23Fw2FnTjIIQ',
      '--json', json,
    ], { stdio: ['pipe', 'pipe', 'pipe'], shell: true });

    let out = '', err = '';
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    child.on('close', code => {
      if (code === 0) resolve(out);
      else reject(new Error(err || out));
    });
  });
}

(async () => {
  const CHUNK = 10;
  let success = 0, fail = 0;
  for (let i = 0; i < data.length; i += CHUNK) {
    const num = Math.floor(i / CHUNK) + 1;
    try {
      const r = await writeBatch(data.slice(i, i + CHUNK), num);
      const parsed = JSON.parse(r);
      console.log(`Batch ${num}: OK - ${parsed.data?.record_id_list?.length || 0} records`);
      success++;
    } catch (e) {
      console.log(`Batch ${num}: FAIL - ${e.message.substring(0, 200)}`);
      fail++;
    }
  }
  console.log(`DONE: ${success} success, ${fail} fail`);
})();
