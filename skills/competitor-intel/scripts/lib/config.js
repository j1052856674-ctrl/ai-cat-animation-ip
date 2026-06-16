/**
 * competitor-intel 公共配置
 */

const path = require('path');

const CONFIG = {
  // 延迟配置
  DELAY_BETWEEN_REQUESTS: 3000,
  DELAY_AFTER_ERROR: 10000,
  DELAY_LONG: 30000,

  // 超时配置
  COMMAND_TIMEOUT: 60000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,

  // 数据目录
  DATA_DIR: path.join(__dirname, '..', '..', '..', 'data'),
  RAW_DIR: path.join(__dirname, '..', '..', '..', 'data', 'raw'),
  COVER_DIR: path.join(__dirname, '..', '..', '..', 'data', 'covers'),
};

module.exports = CONFIG;
