#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const gatewayDir = path.resolve(__dirname, '..');
const runtimeDir = path.join(gatewayDir, 'runtime');
const tmpConfig = path.join(runtimeDir, 'remote-control-test.config.json');
fs.mkdirSync(runtimeDir, { recursive: true });
fs.writeFileSync(tmpConfig, JSON.stringify({
  replyMode: 'dry-run',
  replyProvider: 'sdk',
  appId: 'test-app',
  appSecret: 'test-secret',
}, null, 2) + '\n', 'utf8');
process.env.FEISHU_AGENT_GATEWAY_CONFIG = tmpConfig;

const { handleEvent } = require('../server');
const { listTasks, TASK_STATE_PATH } = require('../remote-control');

function payload(messageId, text) {
  return {
    schema: '2.0',
    header: { event_type: 'im.message.receive_v1' },
    event: {
      sender: { sender_id: { open_id: 'ou_test' } },
      message: {
        message_id: messageId,
        chat_id: 'oc_test',
        content: JSON.stringify({ text }),
      },
    },
  };
}

function cleanup(taskId) {
  if (fs.existsSync(TASK_STATE_PATH)) {
    const state = JSON.parse(fs.readFileSync(TASK_STATE_PATH, 'utf8'));
    if (taskId && state.tasks) delete state.tasks[taskId];
    for (const [token, id] of Object.entries(state.tokens || {})) {
      if (id === taskId || !state.tasks[id]) delete state.tokens[token];
    }
    fs.writeFileSync(TASK_STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
  }
  if (fs.existsSync(tmpConfig)) fs.unlinkSync(tmpConfig);
}

(async () => {
  let taskId = '';
  try {
    const messageId = 'om_remote_control_test_' + Date.now();
    const first = await handleEvent(payload(messageId, 'remote control test topic task'));
    if (first.routeId !== 'inbox') throw new Error('expected inbox route');
    if (first.result.dryRun !== true) throw new Error('expected dry-run draft reply');

    const task = listTasks().find((item) => item.sourceMessageId === messageId);
    if (!task) throw new Error('draft task not found');
    taskId = task.taskId;

    const second = await handleEvent(payload(messageId + '_approve', 'approve ' + task.confirmToken));
    if (second.routeId !== 'remote-approve') throw new Error('expected remote-approve route');
    if (second.result.dryRun !== true) throw new Error('expected dry-run approval reply');

    const approved = listTasks('approved').find((item) => item.taskId === task.taskId);
    if (!approved) throw new Error('approved task not found');

    const worker = childProcess.spawnSync(process.execPath, ['remote-worker.js', 'next', '--no-reply'], {
      cwd: gatewayDir,
      env: { ...process.env, FEISHU_AGENT_GATEWAY_CONFIG: tmpConfig },
      encoding: 'utf8',
    });
    if (worker.status !== 0) {
      throw new Error('remote-worker failed: ' + (worker.stderr || worker.stdout));
    }

    const handoff = listTasks('handoff_ready').find((item) => item.taskId === task.taskId);
    if (!handoff || !handoff.context) throw new Error('handoff_ready task not found');

    console.log(JSON.stringify({
      ok: true,
      taskId: task.taskId,
      route: first.routeId,
      approvalRoute: second.routeId,
      workerStatus: handoff.status,
    }, null, 2));
  } finally {
    cleanup(taskId);
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});