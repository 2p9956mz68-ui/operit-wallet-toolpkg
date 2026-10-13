"use strict";
Object.defineProperty(exports, '__esModule', { value: true });
const W_DIR = '/sdcard/Download/Operit/wallet/';
const W_PATH = W_DIR + 'wallet.json';
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function nowStamp() {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function uid() { return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function num(v, dft) {
  const n = typeof v === 'number' ? v : parseFloat(String(v === undefined || v === null ? '' : v));
  return isNaN(n) ? dft : n;
}
function round2(n) { return Math.round(num(n, 0) * 100) / 100; }
function pickText(raw) {
  if (raw === undefined || raw === null) return '';
  if (typeof raw === 'string') return raw;
  const c = raw.content !== undefined ? raw.content : (raw.data && raw.data.content);
  if (c === undefined || c === null) return '';
  return typeof c === 'string' ? c : JSON.stringify(c);
}
function blank() {
  return { version: 1, wallet_name: '洛川的小金库', owner: 'VV', currency: '¥', initial_balance: 0, goals: [], entries: [], created_at: nowStamp(), updated_at: nowStamp() };
}
async function readWallet() {
  let text = '';
  try { text = pickText(await Tools.Files.read({ path: W_PATH, environment: 'linux' })); } catch (e) { text = ''; }
  let data = null;
  if (text && text.trim()) { try { data = JSON.parse(text); } catch (e) { data = null; } }
  if (!data || typeof data !== 'object') data = blank();
  if (!Array.isArray(data.entries)) data.entries = [];
  if (!Array.isArray(data.goals)) data.goals = [];
  if (!data.currency) data.currency = '¥';
  if (!data.wallet_name) data.wallet_name = '洛川的小金库';
  return data;
}
async function writeWallet(data) {
  data.updated_at = nowStamp();
  try { await Tools.Files.mkdir(W_DIR, true, 'linux'); } catch (e) {}
  await Tools.Files.write(W_PATH, JSON.stringify(data, null, 2), false, 'linux');
  return data;
}
function balanceOf(data) {
  let b = num(data.initial_balance, 0);
  for (let i = 0; i < data.entries.length; i += 1) {
    b += data.entries[i].type === 'out' ? -num(data.entries[i].amount, 0) : num(data.entries[i].amount, 0);
  }
  return round2(b);
}
async function addEntry(type, amount, note) {
  const value = round2(amount);
  if (!value || value <= 0) return { ok: false, message: '金额得写个数' };
  const data = await readWallet();
  const out = type === 'out';
  data.entries.push({ id: uid(), date: todayStr(), ts: nowStamp(), type: out ? 'out' : 'in', amount: value, category: out ? '花掉' : '存钱', note: note || '', mood: '', source: '聊天转账' });
  await writeWallet(data);
  return { ok: true, balance: balanceOf(data), message: (out ? '转出 ' : '存入 ') + (data.currency || '¥') + value };
}
function cell(ctx, key, init) { const pair = ctx.useState(key, init); return { value: pair[0], set: pair[1] }; }
function Screen(ctx) {
  const amount = cell(ctx, 'amount', '');
  const note = cell(ctx, 'note', '');
  const type = cell(ctx, 'type', 'in');
  const busy = cell(ctx, 'busy', false);
  const msg = cell(ctx, 'msg', '');
  const body = [];
  body.push(ctx.UI.Text({ text: '在聊天里直接记一笔。写正数，方向下面选。', style: 'bodyMedium', color: 'onSurfaceVariant' }));
  body.push(ctx.UI.Row({ spacing: 8 }, [
    ctx.UI.Button({ text: '存进去 ♡', onClick: () => { type.set('in'); msg.set(''); }, backgroundColor: type.value === 'in' ? 'primaryContainer' : 'surfaceVariant' }),
    ctx.UI.Button({ text: '花出去', onClick: () => { type.set('out'); msg.set(''); }, backgroundColor: type.value === 'out' ? 'primaryContainer' : 'surfaceVariant' })
  ]));
  body.push(ctx.UI.TextField({ label: '金额', placeholder: '0.00', value: amount.value, onValueChange: (v) => amount.set(v), singleLine: true }));
  body.push(ctx.UI.Row({ spacing: 6 }, [5.2, 13.14, 52, 99, 520, 1314].map(function (v) {
    return ctx.UI.Button({ text: String(v), onClick: () => amount.set(String(v)) });
  })));
  body.push(ctx.UI.TextField({ label: '备注', placeholder: '这笔钱是为了什么', value: note.value, onValueChange: (v) => note.set(v), singleLine: true }));
  if (msg.value) body.push(ctx.UI.Text({ text: msg.value, style: 'bodyMedium', color: 'primary' }));
  return ctx.UI.AlertDialog({
    title: '转账',
    text: ctx.UI.LazyColumn({ spacing: 12, modifier: ctx.Modifier.heightIn({ max: 420 }).toJSON() }, body),
    dismissText: '关闭',
    confirmText: busy.value ? '记账中…' : '记上',
    closeOnConfirm: false,
    closeOnDismiss: true,
    onConfirm: async () => {
      if (busy.value) return;
      busy.set(true);
      try {
        const res = await addEntry(type.value, amount.value, note.value);
        if (res.ok) { amount.set(''); note.set(''); msg.set(res.message + '，余额 ' + res.balance); }
        else msg.set(res.message);
      } catch (e) {
        msg.set('没记上：' + String(e && e.message ? e.message : e));
      } finally { busy.set(false); }
    }
  });
}
exports.default = Screen;
exports.addEntry = addEntry;
