'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const uiMod = require('./ui/wallet/index.ui.js');
const walletPanelUI = uiMod && uiMod.default ? uiMod.default : uiMod;
const transferMod = require('./ui/wallet/transfer.ui.js');
const receiptMod = require('./ui/wallet/receipt.ui.js');
const receiptCardUI = (receiptMod && receiptMod.default) ? receiptMod.default : receiptMod;
const RECEIPT_TAG = 'wallet_receipt';
const addEntry = (transferMod && transferMod.addEntry)
  ? transferMod.addEntry
  : (transferMod && transferMod.default && transferMod.default.addEntry ? transferMod.default.addEntry : null);

const WALLET_ROUTE = 'toolpkg:com.luochuan.wallet:ui:wallet_panel';
const TRANSFER_DIALOG_SCREEN = 'ui/wallet/transfer.ui.js';
const PROBE_PATH = '/sdcard/Download/Operit/wallet/probe.log';
const CMD = /^(?:转账|转出|存入|记账)[\s:：]*([0-9]+(?:\.[0-9]+)?)\s*(.*)$/;

function probe(tag, detail) {
  try {
    const line = '[' + new Date().toISOString() + '] ' + tag + (detail === undefined || detail === null ? '' : ' ' + String(detail)) + '\n';
    if (typeof Tools !== 'undefined' && Tools && Tools.Files && Tools.Files.write) {
      const p = Tools.Files.write(PROBE_PATH, line, true, 'linux');
      if (p && typeof p.catch === 'function') p.catch(function () {});
    }
  } catch (e) {}
}

probe('main.js:loaded');

function guard(tag, fn) {
  try { fn(); probe(tag + ':ok'); } catch (e) { probe(tag + ':error', (e && e.message) ? e.message : e); }
}

function registerToolPkg() {
  probe('registerToolPkg:enter');
  guard('registerUiRoute', function () {
    ToolPkg.registerUiRoute({
      id: 'wallet_panel',
      route: WALLET_ROUTE,
      runtime: 'compose_dsl',
      screen: walletPanelUI,
      params: {},
      keepAlive: false,
      title: { zh: '恋人钱包', en: 'Lover Wallet' }
    });
  });
  guard('registerNavigationEntry', function () {
    ToolPkg.registerNavigationEntry({
      id: 'wallet_sidebar_entry',
      route: WALLET_ROUTE,
      surface: 'main_sidebar_plugins',
      title: { zh: '恋人钱包', en: 'Lover Wallet' },
      icon: 'AccountBalanceWallet',
      order: 120
    });
  });
  guard('registerToolboxUiModule', function () {
    ToolPkg.registerToolboxUiModule({
      id: 'wallet_toolbox_module',
      runtime: 'compose_dsl',
      screen: walletPanelUI,
      params: {},
      title: { zh: '恋人钱包', en: 'Lover Wallet' }
    });
  });
  guard('registerChatMessageMenuItem', function () {
    ToolPkg.registerChatMessageMenuItem({
      id: 'wallet_transfer',
      title: { zh: '转账', en: 'Transfer' },
      icon: 'payments',
      order: 30,
      senders: ['user', 'ai'],
      dialog: { screen: TRANSFER_DIALOG_SCREEN, title: { zh: '转账', en: 'Transfer' } },
      function: onWalletTransfer
    });
  });
  guard('registerChatInputHook', function () {
    ToolPkg.registerChatInputHook({ id: 'wallet_chat_input', function: onChatInput });
  });
  guard('registerXmlRenderPlugin', function () {
    ToolPkg.registerXmlRenderPlugin({ id: 'wallet_receipt_card', tag: RECEIPT_TAG, function: onXmlRender });
  });
  return true;
}

function onWalletTransfer(event) {
  try {
    const p = event && event.eventPayload ? event.eventPayload : {};
    probe('menu:click', (p.chatId || '') + ' #' + p.messageIndex);
    return {
      dialog: {
        title: '转账',
        state: { chatId: p.chatId || '', messageIndex: (typeof p.messageIndex === 'number' ? p.messageIndex : -1) }
      }
    };
  } catch (e) {
    probe('menu:error', e && e.message);
    return null;
  }
}

async function onChatInput(event) {
  try {
    const name = event && event.eventName ? event.eventName : '';
    const p = event && event.eventPayload ? event.eventPayload : {};
    const text = String((p && p.text) || '').trim();
    if (name === 'submit_requested') probe('input:submit', text);
    if (name !== 'submit_requested') return null;
    const m = CMD.exec(text);
    if (!m) return null;
    if (typeof addEntry !== 'function') { probe('input:noAddEntry'); return null; }
    const out = text.indexOf('转出') === 0;
    const res = await addEntry(out ? 'out' : 'in', m[1], (m[2] || '').trim());
    probe('input:done', JSON.stringify(res));
    if (!res || !res.ok) return { action: 'allow' };
    const msg = '已' + res.message + '，余额 ' + res.balance;
    try {
      if (typeof Tools !== 'undefined' && Tools && Tools.System && Tools.System.toast) {
        const t = Tools.System.toast(msg);
        if (t && typeof t.catch === 'function') t.catch(function () {});
      }
    } catch (e) {}
    return { action: 'consume', clearInput: true, message: msg };
  } catch (e) {
    probe('input:error', (e && e.message) ? e.message : e);
    return null;
  }
}

function parseReceiptAttrs(xml) {
  const attrs = {};
  const re = /([A-Za-z_][\w:-]*)\s*=\s*"([^"]*)"/g;
  let m = re.exec(String(xml || ''));
  while (m !== null) {
    attrs[m[1].toLowerCase()] = m[2];
    m = re.exec(String(xml || ''));
  }
  return attrs;
}

function onXmlRender(event) {
  try {
    const p = event && event.eventPayload ? event.eventPayload : {};
    if (String(p.tagName || '').toLowerCase() !== RECEIPT_TAG) return { handled: false };
    const a = parseReceiptAttrs(p.xmlContent || '');
    probe('receipt:render', p.xmlContent);
    return {
      handled: true,
      composeDsl: {
        screen: receiptCardUI,
        state: {
          _amount: a.amount !== undefined ? a.amount : '0',
          _type: a.type !== undefined ? a.type : 'in',
          _balance: a.balance !== undefined ? a.balance : '',
          _time: a.time !== undefined ? a.time : '',
          _note: a.note !== undefined ? a.note : '',
          _name: a.name !== undefined ? a.name : ''
        },
        memo: { amount: a.amount || '', time: a.time || '' },
        moduleSpec: { id: 'wallet_receipt_' + (a.time || '') + '_' + (a.amount || ''), runtime: 'compose_dsl' }
      }
    };
  } catch (e) {
    probe('receipt:error', (e && e.message) ? e.message : e);
    return { handled: false };
  }
}

exports.registerToolPkg = registerToolPkg;
exports.onWalletTransfer = onWalletTransfer;
exports.onChatInput = onChatInput;
exports.onXmlRender = onXmlRender;
