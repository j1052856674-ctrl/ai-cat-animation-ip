#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const RUNTIME_DIR = path.join(__dirname, 'runtime');
const TASK_LOG_PATH = path.join(RUNTIME_DIR, 'remote-tasks.ndjson');
const TASK_STATE_PATH = path.join(RUNTIME_DIR, 'remote-task-state.json');

const INTENTS = [
  { id: 'topic', targetModule: '02-topic', commands: ['/选题'], keywords: ['选题', '题目', '小红书选题', '下一条拍什么'], riskLevel: 'low' },
  { id: 'script', targetModule: '03-script', commands: ['/脚本'], keywords: ['脚本', '写脚本', '短视频大纲', '怎么拍'], riskLevel: 'low' },
  { id: 'cover', targetModule: '04-cover', commands: ['/封面'], keywords: ['封面', '标题', '视觉包'], riskLevel: 'low' },
  { id: 'review', targetModule: '05-review', commands: ['/复盘'], keywords: ['复盘', '分析数据', '数据分析'], riskLevel: 'low' },
  { id: 'strategy', targetModule: '01-strategy', commands: ['/策略'], keywords: ['策略', '定位', '调整方向'], riskLevel: 'medium' },
  { id: 'competitor-data', targetModule: '00-competitor-data', commands: ['/采集'], keywords: ['采集', '竞品', '竞品调研'], riskLevel: 'medium' },
  { id: 'chain', targetModule: 'chain: 02-topic -> 03-script -> 04-cover', commands: ['/一条龙'], keywords: ['一条龙', '完整方案', '从选题开始'], riskLevel: 'medium' },
  { id: 'onboarding', targetModule: '06-onboarding', commands: ['/新手启动'], keywords: ['新手启动', '第一次使用', '环境检查'], riskLevel: 'low' },
];

const HIGH_RISK_PATTERNS = [
  /删除|清空|覆盖|重置|reset|delete|remove/i,
  /发布|发出去|上传|push|commit/i,
  /批量|抓取\s*\d+|采集\s*\d+/i,
  /shell|powershell|cmd|终端|执行命令/i,
  /密钥|密码|secret|token|私钥/i,
];

function ensureRuntimeDir() {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function readState() {
  const state = readJson(TASK_STATE_PATH, { tasks: {}, tokens: {} });
  return { tasks: state.tasks || {}, tokens: state.tokens || {} };
}

function writeState(state) {
  ensureRuntimeDir();
  fs.writeFileSync(TASK_STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function appendTaskLog(entry) {
  ensureRuntimeDir();
  fs.appendFileSync(TASK_LOG_PATH, JSON.stringify({ time: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

function readTaskLog() {
  if (!fs.existsSync(TASK_LOG_PATH)) return [];
  return fs.readFileSync(TASK_LOG_PATH, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function makeTaskId(messageId, text) {
  return 'rt_' + crypto.createHash('sha1').update(messageId + '\n' + text).digest('hex').slice(0, 12);
}

function makeConfirmToken(taskId, text) {
  return crypto.createHash('sha1').update(taskId + '\n' + text).digest('hex').slice(0, 6).toUpperCase();
}

function classifyIntent(text) {
  const normalized = String(text || '').trim();
  const highRisk = HIGH_RISK_PATTERNS.some((pattern) => pattern.test(normalized));
  const matched = INTENTS.find((intent) => intent.keywords.some((keyword) => normalized.includes(keyword)));
  if (!matched) {
    return {
      id: 'general',
      targetModule: 'supervised-inbox',
      suggestedCommand: '',
      riskLevel: highRisk ? 'high' : 'low',
      summary: '普通自然语言任务，进入 Codex/Claude 远程协作 inbox，由本机 worker 或人工接管。',
    };
  }

  return {
    id: matched.id,
    targetModule: matched.targetModule,
    suggestedCommand: matched.commands[0],
    riskLevel: highRisk ? 'high' : matched.riskLevel,
    summary: '疑似 ' + matched.targetModule + ' 任务，可在确认后进入受控执行队列。',
  };
}

function createRemoteTaskDraft(input) {
  const text = String(input.text || '').trim();
  const messageId = input.messageId || '';
  const taskId = makeTaskId(messageId, text);
  const state = readState();
  const existing = state.tasks[taskId];
  if (existing) return existing;

  const intent = classifyIntent(text);
  const confirmToken = makeConfirmToken(taskId, text);
  const task = {
    taskId,
    sourceMessageId: messageId,
    chatId: input.chatId || '',
    senderId: input.senderId || '',
    text,
    intentId: intent.id,
    targetModule: intent.targetModule,
    suggestedCommand: intent.suggestedCommand,
    riskLevel: intent.riskLevel,
    summary: intent.summary,
    confirmToken,
    status: 'awaiting_approval',
    createdAt: new Date().toISOString(),
    approvedAt: '',
    rejectedAt: '',
    completedAt: '',
  };

  state.tasks[taskId] = task;
  state.tokens[confirmToken] = taskId;
  writeState(state);
  appendTaskLog({ kind: 'draft_created', task });
  return task;
}

function buildRemoteTaskReply(task) {
  const highRiskLine = task.riskLevel === 'high'
    ? '风险：检测到高风险意图；即使确认，也只会进入人工复核，不会自动执行。'
    : '风险：' + task.riskLevel + '；确认前不会执行。';
  return [
    '已生成远程协作任务草案。',
    '',
    '任务：' + task.text,
    '目标：' + task.targetModule,
    task.suggestedCommand ? '建议命令：' + task.suggestedCommand : '建议命令：无，作为普通协作任务处理。',
    highRiskLine,
    '',
    '安全边界：不会自动发布、删除、批量采集、执行任意 shell 或读取/输出密钥。',
    '确认执行请回复：确认 ' + task.confirmToken,
    '取消请回复：取消 ' + task.confirmToken,
  ].join('\n');
}

function updateTaskByToken(token, action, actorMessageId) {
  const normalizedToken = String(token || '').trim().toUpperCase();
  const state = readState();
  const taskId = state.tokens[normalizedToken];
  if (!taskId || !state.tasks[taskId]) {
    return { ok: false, reply: '未找到确认码：' + normalizedToken };
  }

  const task = state.tasks[taskId];
  if (!['awaiting_approval', 'approved'].includes(task.status)) {
    return { ok: false, task, reply: '任务 ' + task.taskId + ' 当前状态为 ' + task.status + '，不能重复操作。' };
  }

  if (action === 'approve') {
    task.status = task.riskLevel === 'high' ? 'needs_manual_review' : 'approved';
    task.approvedAt = new Date().toISOString();
    task.approvalMessageId = actorMessageId || '';
    state.tasks[taskId] = task;
    writeState(state);
    appendTaskLog({ kind: 'task_approved', taskId, status: task.status, actorMessageId: actorMessageId || '' });
    return {
      ok: true,
      task,
      reply: task.status === 'approved'
        ? '已确认：' + task.taskId + '\n任务已进入 approved 队列，等待本机 Codex/Claude worker 处理。'
        : '已收到确认：' + task.taskId + '\n但该任务包含高风险意图，已转入人工复核，不会自动执行。',
    };
  }

  task.status = 'rejected';
  task.rejectedAt = new Date().toISOString();
  task.rejectionMessageId = actorMessageId || '';
  state.tasks[taskId] = task;
  writeState(state);
  appendTaskLog({ kind: 'task_rejected', taskId, actorMessageId: actorMessageId || '' });
  return { ok: true, task, reply: '已取消：' + task.taskId };
}

function parseApprovalCommand(text) {
  const match = String(text || '').trim().match(/^(确认|同意|approve|取消|拒绝|reject)\s+([A-Za-z0-9_-]{4,12})$/i);
  if (!match) return null;
  const verb = match[1].toLowerCase();
  return {
    action: ['取消', '拒绝', 'reject'].includes(verb) ? 'reject' : 'approve',
    token: match[2].toUpperCase(),
  };
}

function handleRemoteControlCommand(text, context = {}) {
  const parsed = parseApprovalCommand(text);
  if (!parsed) return null;
  const result = updateTaskByToken(parsed.token, parsed.action, context.messageId || '');
  return {
    routeId: parsed.action === 'approve' ? 'remote-approve' : 'remote-reject',
    reply: result.reply,
    result,
  };
}

function listTasks(status) {
  const state = readState();
  return Object.values(state.tasks)
    .filter((task) => !status || task.status === status)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

function setTaskStatus(taskId, status, fields = {}) {
  const state = readState();
  const task = state.tasks[taskId];
  if (!task) throw new Error('Remote task not found: ' + taskId);
  Object.assign(task, fields, { status });
  state.tasks[taskId] = task;
  writeState(state);
  appendTaskLog({ kind: 'task_status_changed', taskId, status, fields });
  return task;
}

function buildWorkerContext(task) {
  return [
    '## Project Context',
    '- Project: ai-cat-animation-ip (cat animation content-ops IP)',
    '- Phase: Feishu remote control bridge with human approval',
    '- Architecture map: memory-hub/architecture-map.md',
    '- Current status: memory-hub/status/current-execution-status.md',
    '- Safety: execute only approved low/medium-risk tasks; do not publish, delete, batch collect, run arbitrary shell, or expose secrets without explicit extra confirmation.',
    '## Approved Remote Task',
    '- Task ID: ' + task.taskId,
    '- Source Message ID: ' + task.sourceMessageId,
    '- Target Module: ' + task.targetModule,
    '- Suggested Command: ' + (task.suggestedCommand || 'none'),
    '- Risk Level: ' + task.riskLevel,
    '## User Request',
    task.text,
  ].join('\n');
}

module.exports = {
  TASK_LOG_PATH,
  TASK_STATE_PATH,
  buildRemoteTaskReply,
  buildWorkerContext,
  createRemoteTaskDraft,
  handleRemoteControlCommand,
  listTasks,
  readTaskLog,
  readState,
  setTaskStatus,
  updateTaskByToken,
};