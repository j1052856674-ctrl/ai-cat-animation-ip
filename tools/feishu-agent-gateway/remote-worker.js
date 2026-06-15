#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { buildWorkerContext, listTasks, setTaskStatus } = require('./remote-control');
const { replyToMessage } = require('./server');

const RUNTIME_DIR = path.join(__dirname, 'runtime');
const WORKER_LOG_PATH = path.join(RUNTIME_DIR, 'remote-worker.ndjson');

function appendWorkerLog(entry) {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.appendFileSync(WORKER_LOG_PATH, JSON.stringify({ time: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

function summarizeTask(task) {
  return {
    taskId: task.taskId,
    status: task.status,
    sourceMessageId: task.sourceMessageId,
    targetModule: task.targetModule,
    riskLevel: task.riskLevel,
    createdAt: task.createdAt,
    approvedAt: task.approvedAt,
    text: task.text,
  };
}

function printTasks(status) {
  const tasks = listTasks(status || '');
  if (tasks.length === 0) {
    console.log(status ? 'No remote tasks with status: ' + status + '.' : 'No remote tasks.');
    return;
  }
  for (const task of tasks) {
    console.log(JSON.stringify(summarizeTask(task), null, 2));
  }
}

function requireTask(taskId) {
  const task = listTasks().find((item) => item.taskId === taskId);
  if (!task) {
    throw new Error('Remote task not found: ' + taskId);
  }
  return task;
}

function printContext(taskId) {
  const task = requireTask(taskId);
  console.log(buildWorkerContext(task));
}

function buildHandoffText(task) {
  return [
    '????????' + task.taskId,
    '',
    '???handoff_ready',
    '?????' + task.targetModule,
    '?????' + (task.suggestedCommand || '?'),
    '?????' + task.riskLevel,
    '',
    '????? worker ??? Codex/Claude ???? Context Card?',
    '???????????????????????????????????',
    '?????? Codex/Claude ?? Context Card ????????????????',
  ].join('\n');
}

function buildCompletionText(task, text) {
  if (text) return text;
  return [
    '????????' + task.taskId,
    '',
    '???done',
    '?????' + task.targetModule,
    '????? worker ???????????',
  ].join('\n');
}

function buildFailureText(task, reason) {
  return [
    '?????????' + task.taskId,
    '',
    '???failed',
    '?????' + task.targetModule,
    '???' + (reason || '???????'),
  ].join('\n');
}

async function sendTaskReply(task, text) {
  if (!task.sourceMessageId) {
    return { ok: true, skipped: true, reason: 'missing sourceMessageId' };
  }
  return replyToMessage(task.sourceMessageId, text);
}

async function processTask(task, options = {}) {
  if (task.status !== 'approved') {
    throw new Error('Task is not approved: ' + task.taskId + ' (' + task.status + ')');
  }

  setTaskStatus(task.taskId, 'running', { startedAt: new Date().toISOString() });
  appendWorkerLog({ kind: 'task_started', taskId: task.taskId });

  const context = buildWorkerContext(task);
  const resultText = buildHandoffText(task);

  setTaskStatus(task.taskId, 'handoff_ready', {
    completedAt: new Date().toISOString(),
    workerResult: resultText,
    context,
  });
  appendWorkerLog({ kind: 'task_handoff_ready', taskId: task.taskId });

  if (options.reply !== false) {
    const replyResult = await sendTaskReply(task, resultText);
    appendWorkerLog({ kind: 'task_reply_sent', taskId: task.taskId, ok: replyResult.ok, provider: replyResult.provider || '', skipped: replyResult.skipped === true });
    if (!replyResult.ok) {
      throw new Error(JSON.stringify(replyResult));
    }
  }

  return { taskId: task.taskId, context, resultText };
}

async function processNext(options = {}) {
  const task = listTasks('approved')[0];
  if (!task) {
    console.log('No approved remote tasks.');
    return false;
  }
  const result = await processTask(task, options);
  console.log(result.context);
  return true;
}

async function watch(options = {}) {
  const intervalMs = Math.max(1, Number(options.intervalSeconds || 10)) * 1000;
  appendWorkerLog({ kind: 'watch_started', intervalMs, reply: options.reply !== false });
  do {
    try {
      await processNext(options);
    } catch (error) {
      appendWorkerLog({ kind: 'watch_error', error: error.message });
      console.error(error.stack || error.message);
    }
    if (options.once) break;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  } while (true);
}

async function completeTask(taskId, text, options = {}) {
  const task = requireTask(taskId);
  const replyText = buildCompletionText(task, text);
  setTaskStatus(task.taskId, 'done', { completedAt: new Date().toISOString(), finalReply: replyText });
  appendWorkerLog({ kind: 'task_completed', taskId: task.taskId });
  if (options.reply !== false) {
    const replyResult = await sendTaskReply(task, replyText);
    appendWorkerLog({ kind: 'task_complete_reply_sent', taskId: task.taskId, ok: replyResult.ok, provider: replyResult.provider || '', skipped: replyResult.skipped === true });
    if (!replyResult.ok) throw new Error(JSON.stringify(replyResult));
  }
  console.log('Completed: ' + task.taskId);
}

async function failTask(taskId, reason, options = {}) {
  const task = requireTask(taskId);
  const replyText = buildFailureText(task, reason);
  setTaskStatus(task.taskId, 'failed', { failedAt: new Date().toISOString(), failureReason: reason || '' });
  appendWorkerLog({ kind: 'task_failed', taskId: task.taskId, reason: reason || '' });
  if (options.reply !== false) {
    const replyResult = await sendTaskReply(task, replyText);
    appendWorkerLog({ kind: 'task_fail_reply_sent', taskId: task.taskId, ok: replyResult.ok, provider: replyResult.provider || '', skipped: replyResult.skipped === true });
    if (!replyResult.ok) throw new Error(JSON.stringify(replyResult));
  }
  console.log('Failed: ' + task.taskId);
}

function parseOptions(args) {
  const options = { reply: true, once: false, intervalSeconds: 10 };
  const rest = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--no-reply') options.reply = false;
    else if (arg === '--once') options.once = true;
    else if (arg === '--interval') {
      i += 1;
      options.intervalSeconds = Number(args[i] || 10);
    } else {
      rest.push(arg);
    }
  }
  return { options, rest };
}

function printUsage() {
  console.error('Usage: node remote-worker.js [list [status]|context <taskId>|next [--no-reply]|watch [--no-reply] [--once] [--interval seconds]|complete <taskId> <text> [--no-reply]|fail <taskId> <reason> [--no-reply]]');
}

async function main() {
  const [command, ...rawArgs] = process.argv.slice(2);
  const { options, rest } = parseOptions(rawArgs);
  if (!command || command === 'list') {
    printTasks(rest[0] || 'approved');
    return;
  }
  if (command === 'all') {
    printTasks('');
    return;
  }
  if (command === 'context') {
    if (!rest[0]) throw new Error('Usage: node remote-worker.js context <taskId>');
    printContext(rest[0]);
    return;
  }
  if (command === 'next') {
    await processNext(options);
    return;
  }
  if (command === 'watch') {
    await watch(options);
    return;
  }
  if (command === 'complete') {
    if (!rest[0]) throw new Error('Usage: node remote-worker.js complete <taskId> <text> [--no-reply]');
    await completeTask(rest[0], rest.slice(1).join(' ').trim(), options);
    return;
  }
  if (command === 'fail') {
    if (!rest[0]) throw new Error('Usage: node remote-worker.js fail <taskId> <reason> [--no-reply]');
    await failTask(rest[0], rest.slice(1).join(' ').trim(), options);
    return;
  }
  printUsage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
