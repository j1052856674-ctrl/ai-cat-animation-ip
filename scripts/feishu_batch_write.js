// Run batch Feishu writes - use execSync with proper escaping
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LARK_CLI = '/c/Users/Administrator/AppData/Roaming/npm/lark-cli';

for (let i = 1; i <= 3; i++) {
  const jsonPath = path.join(__dirname, '..', 'content', `round2_batch_${i}.json`);
  const jsonStr = JSON.stringify(JSON.parse(fs.readFileSync(jsonPath, 'utf8'))).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const cmd = `"${LARK_CLI}" base +record-batch-create --base-token MCwibHumUasGTJsQAtRcicDInph --table-id tblU23Fw2FnTjIIQ --json "${jsonStr}"`;

  try {
    const result = execSync(cmd, { encoding: 'utf8', timeout: 60000, shell: 'bash' });
    const r = JSON.parse(result);
    console.log(`Batch ${i}: OK - ${r.data?.record_id_list?.length || 0} records created`);
  } catch (e) {
    const err = e.stderr || e.stdout || e.message;
    console.log(`Batch ${i}: FAIL - ${err.substring(0, 300)}`);
  }
}
console.log('DONE');
