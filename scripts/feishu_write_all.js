const { execSync } = require('child_process');
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('content/round2_samples.json', 'utf8'));
const fields = ['样本ID','收藏数','时间窗口','数据可信度','评论数','点赞数','作者','分享数','发布时间','完整链接','平台','标题','搜索关键词'];

// Fix select field values to match Feishu table options
const fixed = data.map(r => ({
  ...r,
  // 时间窗口 must be: 热点(≤7天) | 趋势(8-30天) | 参考(>30天)
  '时间窗口': r['时间窗口'] === '热点' ? '热点(≤7天)' :
              r['时间窗口'] === '趋势' ? '趋势(8-30天)' : '参考(>30天)',
  // 数据可信度 must be: OpenCLI | 待核验 | Chrome核验 | 人类已确认
  '数据可信度': r['数据可信度'] && r['数据可信度'] !== 'OpenCLI-缺发布时间' ? r['数据可信度'] : 'OpenCLI',
}));

const CHUNK = 25;
for (let start = 0; start < fixed.length; start += CHUNK) {
  const chunk = fixed.slice(start, start + CHUNK);
  const rows = chunk.map(r => fields.map(f => r[f] !== undefined ? r[f] : null));
  const batch = { fields, rows };
  const tmpPath = process.env.TEMP + '\\r2_b' + (Math.floor(start/CHUNK)+1) + '.json';
  fs.writeFileSync(tmpPath, JSON.stringify(batch));

  const cmd = 'cat "' + tmpPath.replace(/\\/g, '/') + '" | lark-cli base +record-batch-create --base-token MCwibHumUasGTJsQAtRcicDInph --table-id tblU23Fw2FnTjIIQ --json "$(cat)"';
  try {
    const r = execSync(cmd, { encoding: 'utf8', shell: 'bash', timeout: 60000 });
    const parsed = JSON.parse(r);
    const count = parsed.data?.record_id_list?.length || 0;
    console.log('Batch ' + (Math.floor(start/CHUNK)+1) + '/3: OK - ' + count + ' records');
  } catch(e) {
    const err = e.stderr || e.message || '';
    console.log('Batch ' + (Math.floor(start/CHUNK)+1) + '/3: FAIL - ' + err.substring(0, 400));
  }
}
console.log('DONE');
