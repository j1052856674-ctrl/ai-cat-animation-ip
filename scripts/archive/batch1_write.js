const { execSync } = require('child_process');
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('content/round2_samples.json', 'utf8'));
const fields = ['样本ID','收藏数','时间窗口','数据可信度','评论数','点赞数','作者','分享数','发布时间','完整链接','平台','标题','搜索关键词'];

const chunk = data.slice(0, 25);
const rows = chunk.map(r => fields.map(f => r[f] !== undefined ? r[f] : null));
const batch = { fields, rows };

const outPath = process.env.TEMP + '/r2_b1.json';
fs.writeFileSync(outPath, JSON.stringify(batch));

const cmd = 'cat "' + outPath + '" | lark-cli base +record-batch-create --base-token MCwibHumUasGTJsQAtRcicDInph --table-id tblU23Fw2FnTjIIQ --json "$(cat)"';
try {
  const r = execSync(cmd, { encoding: 'utf8', shell: 'bash', timeout: 60000 });
  const parsed = JSON.parse(r);
  console.log('OK:', parsed.ok, '-', parsed.data?.record_id_list?.length || 0, 'records');
} catch(e) {
  console.log('FAIL:', (e.stderr || e.message).substring(0, 400));
}
