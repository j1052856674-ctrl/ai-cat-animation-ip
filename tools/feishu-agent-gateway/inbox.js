#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { replyToMessage } = require('./server');
const { buildWorkerContext, listTasks, updateTaskByToken } = require('./remote-control');

const ROOT = path.resolve(__dirname, '..', '..');
const RUNTIME_DIR = path.join(__dirname, 'runtime');
const INBOX_PATH = path.join(RUNTIME_DIR, 'inbox.ndjson');
const STATE_PATH = path.join(RUNTIME_DIR, 'inbox-state.json');

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return fs.readFileSync(filePath, 'utf8')
    .replace(/\\n/g, '\n')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function readState() {
  if (!fs.existsSync(STATE_PATH)) {
    return { handled: {}, claimed: {} };
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  return {
    handled: state.handled || {},
    claimed: state.claimed || {},
  };
}

function writeState(state) {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function findInboxItem(messageId) {
  return readNdjson(INBOX_PATH).find((item) => item.messageId === messageId);
}

function getPending() {
  const state = readState();
  return readNdjson(INBOX_PATH).filter((item) => item.messageId && !state.handled[item.messageId]);
}

function getInboxStatus(messageId) {
  const state = readState();
  if (state.handled[messageId]) return 'handled';
  if (state.claimed[messageId]) return 'claimed';
  return 'pending';
}

function printPending(options = {}) {
  const items = options.all ? readNdjson(INBOX_PATH).filter((item) => item.messageId) : getPending();
  if (items.length === 0) {
    console.log(options.all ? 'No inbox items.' : 'No pending inbox items.');
    return;
  }

  for (const item of items) {
    console.log(JSON.stringify({
      time: item.time,
      messageId: item.messageId,
      chatId: item.chatId,
      senderId: item.senderId,
      text: item.text,
      status: getInboxStatus(item.messageId),
    }, null, 2));
  }
}

function markHandled(messageId, replyText) {
  const state = readState();
  state.handled[messageId] = {
    handledAt: new Date().toISOString(),
    replyText: replyText || '',
  };
  delete state.claimed[messageId];
  writeState(state);
}

function claimItem(messageId, assignee) {
  const item = findInboxItem(messageId);
  if (!item) {
    console.error(`Inbox item not found: ${messageId}`);
    process.exit(1);
  }

  const state = readState();
  if (state.handled[messageId]) {
    console.error(`Inbox item already handled: ${messageId}`);
    process.exit(1);
  }

  state.claimed[messageId] = {
    assignee: assignee || process.env.USERNAME || process.env.USER || 'codex',
    claimedAt: new Date().toISOString(),
  };
  writeState(state);
  console.log(`Claimed: ${messageId}`);
}

function contextCard(messageId) {
  const item = findInboxItem(messageId);
  if (!item) {
    console.error(`Inbox item not found: ${messageId}`);
    process.exit(1);
  }

  const state = readState();
  const claim = state.claimed[messageId];
  const handled = state.handled[messageId];
  const card = [
    '## Project Context',
    '- Project: ai-cat-animation-ip (cat animation content-ops IP)',
    '- Phase: Phase 2 Feishu Bot gateway; long-connection is the preferred transport',
    '- Architecture map: memory-hub/architecture-map.md',
    '- Current status: memory-hub/status/current-execution-status.md',
    '- Safety: gateway routes only allowlisted commands; natural language enters supervised inbox and must not run arbitrary shell, publish, delete, or batch collect automatically',
    '## Inbox Item',
    `- Message ID: ${item.messageId}`,
    `- Chat ID: ${item.chatId || ''}`,
    `- Sender ID: ${item.senderId || ''}`,
    `- Received At: ${item.time || ''}`,
    `- Status: ${handled ? 'handled' : claim ? 'claimed' : 'pending'}`,
    claim ? `- Claimed By: ${claim.assignee} at ${claim.claimedAt}` : '',
    '## Task',
    item.text || '',
  ].filter(Boolean).join('\n');

  console.log(card);
}

async function reply(messageId, text) {
  const item = findInboxItem(messageId);
  if (!item) {
    console.error(`Inbox item not found: ${messageId}`);
    process.exit(1);
  }

  const result = await replyToMessage(messageId, text);

  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(result.code || 1);
  }

  console.log(JSON.stringify({ ok: true, provider: result.provider, messageId }, null, 2));

  markHandled(messageId, text);
}

function printRemoteTasks(status) {
  const tasks = listTasks(status);
  if (tasks.length === 0) {
    console.log(status ? `No remote tasks with status: ${status}.` : 'No remote tasks.');
    return;
  }
  for (const task of tasks) {
    console.log(JSON.stringify({
      taskId: task.taskId,
      status: task.status,
      sourceMessageId: task.sourceMessageId,
      targetModule: task.targetModule,
      riskLevel: task.riskLevel,
      confirmToken: task.confirmToken,
      text: task.text,
    }, null, 2));
  }
}

function printRemoteContext(taskId) {
  const task = listTasks().find((item) => item.taskId === taskId);
  if (!task) {
    console.error(`Remote task not found: ${taskId}`);
    process.exit(1);
  }
  console.log(buildWorkerContext(task));
}

function approveRemote(token, action) {
  const result = updateTaskByToken(token, action, 'cli');
  console.log(result.reply);
}

function printUsage() {
  console.error('Usage: node inbox.js [list|list --all|claim <messageId> [assignee]|context <messageId>|reply <messageId> <reply text>|mark <messageId>|tasks [status]|task-context <taskId>|approve <token>|reject <token>]');
}

async function main() {
  const [command, messageId, ...rest] = process.argv.slice(2);

  if (!command || command === 'list') {
    printPending({ all: messageId === '--all' });
    return;
  }

  if (command === 'claim') {
    if (!messageId) {
      console.error('Usage: node inbox.js claim <messageId> [assignee]');
      process.exit(1);
    }
    claimItem(messageId, rest.join(' ').trim());
    return;
  }

  if (command === 'context') {
    if (!messageId) {
      console.error('Usage: node inbox.js context <messageId>');
      process.exit(1);
    }
    contextCard(messageId);
    return;
  }

  if (command === 'mark') {
    if (!messageId) {
      console.error('Usage: node inbox.js mark <messageId>');
      process.exit(1);
    }
    markHandled(messageId, '');
    console.log(`Marked handled: ${messageId}`);
    return;
  }

  if (command === 'reply') {
    const text = rest.join(' ').trim();
    if (!messageId || !text) {
      console.error('Usage: node inbox.js reply <messageId> <reply text>');
      process.exit(1);
    }
    await reply(messageId, text);
    return;
  }

  if (command === 'tasks') {
    printRemoteTasks(messageId || '');
    return;
  }

  if (command === 'task-context') {
    if (!messageId) {
      console.error('Usage: node inbox.js task-context <taskId>');
      process.exit(1);
    }
    printRemoteContext(messageId);
    return;
  }

  if (command === 'approve' || command === 'reject') {
    if (!messageId) {
      console.error(`Usage: node inbox.js ${command} <token>`);
      process.exit(1);
    }
    approveRemote(messageId, command === 'approve' ? 'approve' : 'reject');
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
