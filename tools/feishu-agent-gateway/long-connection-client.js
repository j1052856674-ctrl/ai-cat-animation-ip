#!/usr/bin/env node
'use strict';

const Lark = require('@larksuiteoapi/node-sdk');
const {
  appendEventLog,
  config,
  extractText,
  getChatId,
  getMessageId,
  getSenderId,
  handleEvent,
  normalizeCommandText,
} = require('./server');

function requireConfigValue(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}. Set it in config.json or the matching environment variable.`);
  }
}

const appId = config.appId || process.env.FEISHU_APP_ID;
const appSecret = config.appSecret || process.env.FEISHU_APP_SECRET;
requireConfigValue('appId / FEISHU_APP_ID', appId);
requireConfigValue('appSecret / FEISHU_APP_SECRET', appSecret);

const wsClient = new Lark.WSClient({
  appId,
  appSecret,
  loggerLevel: Lark.LoggerLevel.info,
});

function toGatewayPayload(eventType, data) {
  if (data && data.header && data.event) {
    return data;
  }

  return {
    schema: '2.0',
    header: {
      event_type: eventType,
      event_id: data?.event_id || '',
    },
    event: data || {},
  };
}

function dispatchGatewayEvent(eventType, data) {
  const payload = toGatewayPayload(eventType, data);
  const baseLog = {
    transport: 'websocket',
    eventType,
    messageId: getMessageId(payload),
    chatId: getChatId(payload),
    senderId: getSenderId(payload),
    text: normalizeCommandText(extractText(payload)),
  };

  appendEventLog({ kind: 'ws_event_received', ...baseLog });

  // Feishu long-connection handlers should return quickly; send replies out of band.
  setImmediate(async () => {
    try {
      const result = await handleEvent(payload);
      appendEventLog({
        kind: 'ws_event',
        ...baseLog,
        routeId: result.routeId,
        dryRun: result.result?.dryRun === true,
        replyProvider: result.result?.provider || '',
        fallbackFrom: result.result?.fallbackFrom || '',
        fallbackReason: result.result?.fallbackReason || '',
        replyCode: result.result?.code,
        replyTimedOut: result.result?.timedOut === true,
        replyError: result.result?.error || '',
        replyStderr: result.result?.stderr || '',
      });
    } catch (error) {
      appendEventLog({ kind: 'ws_event_error', ...baseLog, error: error.message });
    }
  });

  return { ok: true, accepted: true };
}

const eventDispatcher = new Lark.EventDispatcher({}).register({
  'im.message.receive_v1': async (data) => dispatchGatewayEvent('im.message.receive_v1', data),
});

wsClient.start({ eventDispatcher });

console.log('feishu-agent-gateway long-connection client starting');
console.log(`replyMode=${config.replyMode}`);
console.log('transport=websocket');