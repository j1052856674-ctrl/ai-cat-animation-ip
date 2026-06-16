/**
 * competitor-intel 公共工具函数
 */

const { exec } = require('child_process');
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * 延迟
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 执行命令（带超时）
 */
function execWithTimeout(command, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    exec(command, {
      timeout: timeout,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;

      if (error && error.signal !== 'SIGTERM') {
        reject(new Error(`命令退出码 ${error.code}, stderr: ${stderr}`));
      } else {
        resolve({ stdout, stderr, duration });
      }
    });
  });
}

/**
 * 执行命令（带重试）
 */
async function execWithRetry(command, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await execWithTimeout(command);
    } catch (err) {
      lastError = err;
      console.warn(`[警告] 第 ${i + 1}/${maxRetries} 次尝试失败: ${err.message}`);
      if (i < maxRetries - 1) {
        console.log(`[等待] 5000ms 后重试...`);
        await sleep(5000);
      }
    }
  }
  throw new Error(`重试 ${maxRetries} 次后仍然失败: ${lastError.message}`);
}

/**
 * 检查登录态
 */
async function checkLogin(platform) {
  console.log(`[检测] 检查 ${platform} 登录态...`);
  try {
    const { stdout } = await execWithTimeout(
      `opencli ${platform} whoami -f yaml`, 15000
    );
    if (stdout.includes('nickname') || stdout.includes('username')) {
      console.log(`[OK] ${platform} 已登录`);
      return true;
    }
    console.warn(`[警告] ${platform} 登录态异常`);
    return false;
  } catch (err) {
    console.error(`[错误] ${platform} 登录检测失败:`, err.message);
    return false;
  }
}

/**
 * 解析 YAML 输出
 */
function parseYamlOutput(stdout) {
  try {
    const yamlContent = stdout.split('\n').filter(line => {
      return !line.includes('[@jackwener/opencli]') &&
             !line.includes('module loading') &&
             !line.includes('access');
    }).join('\n');

    const data = yaml.load(yamlContent);

    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data];
    return [];
  } catch (err) {
    console.warn(`[警告] YAML 解析失败: ${err.message}`);
    return [];
  }
}

/**
 * 保存结果
 */
function saveResults(results, meta) {
  const fs = require('fs');
  const path = require('path');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const RAW_DIR = path.join(__dirname, '..', '..', '..', 'data', 'raw');

  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }

  const outputFile = path.join(RAW_DIR, `${meta.mode}-${meta.platform}-${meta.keyword || meta.user_id}-${timestamp}.json`);

  const output = {
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
      data_dir: path.join(__dirname, '..', '..', '..', 'data'),
    },
    data: results,
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`[完成] 数据已保存: ${outputFile}`);

  return outputFile;
}

module.exports = {
  sleep,
  execWithTimeout,
  execWithRetry,
  checkLogin,
  parseYamlOutput,
  saveResults,
};
