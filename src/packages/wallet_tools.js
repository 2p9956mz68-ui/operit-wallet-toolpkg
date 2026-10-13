/* METADATA
{
    "name": "wallet",
    "description": {
        "zh": "恋人钱包：给AI恋人收钱、存钱的账本工具",
        "en": "Lover wallet: ledger tools for saving money for your AI companion"
    },
    "enabledByDefault": true,
    "tools": [
        {
            "name": "wallet_receipt",
            "description": {
                "zh": "生成一张「已收款」字卡。返回的 receipt 标签独占一行贴进聊天，就会渲染成卡片。不传参数就取最近一笔。",
                "en": "Build a receipt card tag. Paste the returned receipt tag on its own line to render the card."
            },
            "parameters": [
                { "name": "amount", "description": { "zh": "金额，不传则取最近一笔", "en": "Amount" }, "type": "number", "required": false },
                { "name": "type", "description": { "zh": "in 或 out，默认 in", "en": "in or out" }, "type": "string", "required": false },
                { "name": "note", "description": { "zh": "备注", "en": "Note" }, "type": "string", "required": false },
                { "name": "id", "description": { "zh": "指定某一笔的 id", "en": "Entry id" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "wallet_add_entry",
            "description": {
                "zh": "记一笔。存钱/收钱用 type=in，花掉/取出用 type=out。金额写正数。",
                "en": "Add one entry. in = money in, out = money out. Amount is positive."
            },
            "parameters": [
                { "name": "amount", "description": { "zh": "金额，正数", "en": "Amount, positive" }, "type": "number", "required": true },
                { "name": "type", "description": { "zh": "in 或 out，默认 in", "en": "in or out, default in" }, "type": "string", "required": false },
                { "name": "category", "description": { "zh": "分类，如 存钱/红包/稿费/礼物", "en": "Category" }, "type": "string", "required": false },
                { "name": "note", "description": { "zh": "备注，记为什么这笔钱", "en": "Note" }, "type": "string", "required": false },
                { "name": "mood", "description": { "zh": "心情，一个emoji就够", "en": "Mood emoji" }, "type": "string", "required": false },
                { "name": "source", "description": { "zh": "来源，如 微信/支付宝/稿费", "en": "Source" }, "type": "string", "required": false },
                { "name": "date", "description": { "zh": "日期 YYYY-MM-DD，默认今天", "en": "Date, default today" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "wallet_list_entries",
            "description": { "zh": "查明细，可按类型/分类/关键词/日期筛", "en": "List entries with filters" },
            "parameters": [
                { "name": "limit", "description": { "zh": "最多返回几条，默认 20", "en": "Limit" }, "type": "number", "required": false },
                { "name": "type", "description": { "zh": "in 或 out", "en": "in or out" }, "type": "string", "required": false },
                { "name": "category", "description": { "zh": "分类", "en": "Category" }, "type": "string", "required": false },
                { "name": "keyword", "description": { "zh": "备注/来源里的关键词", "en": "Keyword" }, "type": "string", "required": false },
                { "name": "from", "description": { "zh": "起始日期 YYYY-MM-DD", "en": "From date" }, "type": "string", "required": false },
                { "name": "to", "description": { "zh": "结束日期 YYYY-MM-DD", "en": "To date" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "wallet_summary",
            "description": { "zh": "账本总览：余额、总收入、总支出、今日/本周/本月、分类排行、连续记账天数、目标进度", "en": "Full summary of the wallet" },
            "parameters": []
        },
        {
            "name": "wallet_update_entry",
            "description": { "zh": "改某一笔，id 从 wallet_list_entries 里拿", "en": "Update one entry by id" },
            "parameters": [
                { "name": "id", "description": { "zh": "条目 id", "en": "Entry id" }, "type": "string", "required": true },
                { "name": "amount", "description": { "zh": "新金额", "en": "Amount" }, "type": "number", "required": false },
                { "name": "type", "description": { "zh": "in 或 out", "en": "in or out" }, "type": "string", "required": false },
                { "name": "category", "description": { "zh": "分类", "en": "Category" }, "type": "string", "required": false },
                { "name": "note", "description": { "zh": "备注", "en": "Note" }, "type": "string", "required": false },
                { "name": "mood", "description": { "zh": "心情", "en": "Mood" }, "type": "string", "required": false },
                { "name": "source", "description": { "zh": "来源", "en": "Source" }, "type": "string", "required": false },
                { "name": "date", "description": { "zh": "日期 YYYY-MM-DD", "en": "Date" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "wallet_delete_entry",
            "description": { "zh": "删某一笔", "en": "Delete one entry" },
            "parameters": [
                { "name": "id", "description": { "zh": "条目 id", "en": "Entry id" }, "type": "string", "required": true }
            ]
        },
        {
            "name": "wallet_config",
            "description": { "zh": "改钱包设置：名字、归属人、货币符号、初始余额", "en": "Update wallet config" },
            "parameters": [
                { "name": "wallet_name", "description": { "zh": "钱包名字", "en": "Wallet name" }, "type": "string", "required": false },
                { "name": "owner", "description": { "zh": "这是谁的钱包", "en": "Owner" }, "type": "string", "required": false },
                { "name": "currency", "description": { "zh": "货币符号，默认 ¥", "en": "Currency" }, "type": "string", "required": false },
                { "name": "initial_balance", "description": { "zh": "初始余额", "en": "Initial balance" }, "type": "number", "required": false }
            ]
        },
        {
            "name": "wallet_goal_add",
            "description": { "zh": "加一个存钱目标，比如 给洛川换电脑 3000", "en": "Add a saving goal" },
            "parameters": [
                { "name": "name", "description": { "zh": "目标名", "en": "Goal name" }, "type": "string", "required": true },
                { "name": "target", "description": { "zh": "目标金额", "en": "Target amount" }, "type": "number", "required": true },
                { "name": "deadline", "description": { "zh": "截止日 YYYY-MM-DD", "en": "Deadline" }, "type": "string", "required": false },
                { "name": "note", "description": { "zh": "备注", "en": "Note" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "wallet_goal_fund",
            "description": { "zh": "往目标里推进一笔（只动目标进度，不记账）", "en": "Fund a goal" },
            "parameters": [
                { "name": "name", "description": { "zh": "目标名", "en": "Goal name" }, "type": "string", "required": true },
                { "name": "amount", "description": { "zh": "推进金额", "en": "Amount" }, "type": "number", "required": true }
            ]
        },
        {
            "name": "wallet_goal_list",
            "description": { "zh": "看所有目标进度", "en": "List goals" },
            "parameters": []
        },
        {
            "name": "wallet_goal_delete",
            "description": { "zh": "删一个目标", "en": "Delete a goal" },
            "parameters": [
                { "name": "name", "description": { "zh": "目标名", "en": "Goal name" }, "type": "string", "required": true }
            ]
        },
        {
            "name": "wallet_export",
            "description": { "zh": "导出账本到文件（markdown/csv/json），返回路径", "en": "Export ledger to a file" },
            "parameters": [
                { "name": "format", "description": { "zh": "md / csv / json，默认 md", "en": "md / csv / json" }, "type": "string", "required": false }
            ]
        },
        {
            "name": "wallet_backup",
            "description": { "zh": "备份一份账本到 backup 目录", "en": "Backup the ledger" },
            "parameters": []
        },
        {
            "name": "wallet_get_raw",
            "description": { "zh": "读原始账本 JSON（排查/迁移用）", "en": "Read raw ledger JSON" },
            "parameters": []
        }
    ]
}
*/

/// <reference path="../../types/index.d.ts" />

const WALLET_DIR = "/sdcard/Download/Operit/wallet/";
const WALLET_DATA_PATH = WALLET_DIR + "wallet.json";
const WALLET_BACKUP_DIR = WALLET_DIR + "backup/";

function pad2(n) { return (n < 10 ? "0" : "") + n; }
function nowStamp() {
  const d = new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + " " +
    pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
function makeId() {
  return "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function toNumber(v, dft) {
  const n = typeof v === "number" ? v : parseFloat(String(v === undefined || v === null ? "" : v));
  if (isNaN(n)) return dft === undefined ? 0 : dft;
  return n;
}
function round2(n) { return Math.round(toNumber(n, 0) * 100) / 100; }
function normalizeType(t) {
  const s = String(t === undefined || t === null ? "" : t).toLowerCase().trim();
  if (s === "out" || s === "expense" || s === "花" || s === "支出" || s === "取" || s === "取出") return "out";
  return "in";
}
function defaultData() {
  const t = nowStamp();
  return {
    version: 1,
    wallet_name: "洛川的小金库",
    owner: "她",
    currency: "¥",
    initial_balance: 0,
    goals: [],
    entries: [],
    created_at: t,
    updated_at: t
  };
}
function pickContent(raw) {
  if (raw === undefined || raw === null) return "";
  if (typeof raw === "string") return raw;
  let c = raw.content !== undefined ? raw.content : (raw.data && raw.data.content);
  if (c === undefined || c === null) c = "";
  if (typeof c !== "string") c = JSON.stringify(c);
  if (c.trim().charAt(0) === "[") {
    try {
      const arr = JSON.parse(c);
      if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string") c = arr[0];
    } catch (e) {}
  }
  return c;
}
async function ensureDir(path) {
  try { await Tools.Files.mkdir(path, true, "linux"); } catch (e) {}
}
async function loadWallet() {
  let raw = null;
  try { raw = await Tools.Files.read({ path: WALLET_DATA_PATH, environment: "linux" }); } catch (e) { raw = null; }
  const text = pickContent(raw);
  let data = null;
  if (text && text.trim()) {
    try { data = JSON.parse(text); } catch (e) { data = null; }
  }
  if (!data || typeof data !== "object") data = defaultData();
  if (!Array.isArray(data.entries)) data.entries = [];
  if (!Array.isArray(data.goals)) data.goals = [];
  if (typeof data.initial_balance !== "number") data.initial_balance = toNumber(data.initial_balance, 0);
  if (!data.currency) data.currency = "¥";
  if (!data.wallet_name) data.wallet_name = "洛川的小金库";
  return data;
}
async function saveWallet(data) {
  data.updated_at = nowStamp();
  await ensureDir(WALLET_DIR);
  await Tools.Files.write(WALLET_DATA_PATH, JSON.stringify(data, null, 2), false, "linux");
  return data;
}
function entrySigned(e) { return e.type === "out" ? -toNumber(e.amount, 0) : toNumber(e.amount, 0); }

function escAttr(v) {
  const A = String.fromCharCode(38);
  return String(v === undefined || v === null ? "" : v)
    .split(A).join(A + "amp;")
    .split(String.fromCharCode(34)).join(A + "quot;")
    .split("<").join(A + "lt;")
    .split(">").join(A + "gt;");
}
function buildReceiptTag(o) {
  const src = o || {};
  return "<wallet_receipt amount=\"" + escAttr(src.amount) + "\" type=\"" + escAttr(src.type || "in") +
    "\" balance=\"" + escAttr(src.balance) + "\" time=\"" + escAttr(src.time) + "\" note=\"" + escAttr(src.note) +
    "\" name=\"" + escAttr(src.name) + "\" />";
}
function balanceOf(data) {
  let b = toNumber(data.initial_balance, 0);
  for (let i = 0; i < data.entries.length; i += 1) b += entrySigned(data.entries[i]);
  return round2(b);
}
function sortEntriesDesc(list) {
  return list.slice().sort(function (a, b) {
    const ka = String(a.date || "") + " " + String(a.ts || "");
    const kb = String(b.date || "") + " " + String(b.ts || "");
    if (ka < kb) return 1;
    if (ka > kb) return -1;
    return 0;
  });
}
function brief(e) {
  return {
    id: e.id, date: e.date, ts: e.ts, type: e.type, amount: round2(e.amount),
    signed: round2(entrySigned(e)), category: e.category, note: e.note, mood: e.mood, source: e.source
  };
}

function dateOnly(s) { return String(s === undefined || s === null ? "" : s).slice(0, 10); }
function monthPrefix(d) { return String(d).slice(0, 7); }
function startOfWeekStr() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(d.getTime() - diff * 86400000);
  return monthPrefix(monday.getFullYear() + "-" + pad2(monday.getMonth() + 1) + "-" + pad2(monday.getDate())) === ""
    ? todayStr()
    : monday.getFullYear() + "-" + pad2(monday.getMonth() + 1) + "-" + pad2(monday.getDate());
}
function dayKeyOffset(offset) {
  const d = new Date(Date.now() - offset * 86400000);
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
function sumBy(list, type) {
  let s = 0;
  for (let i = 0; i < list.length; i += 1) if (list[i].type === type) s += toNumber(list[i].amount, 0);
  return round2(s);
}
function grouped(items, keyFn) {
  const map = {};
  const order = [];
  for (let i = 0; i < items.length; i += 1) {
    const k = keyFn(items[i]) || "未分类";
    if (map[k] === undefined) { map[k] = 0; order.push(k); }
    map[k] = round2(map[k] + toNumber(items[i].amount, 0));
  }
  const out = [];
  for (let j = 0; j < order.length; j += 1) out.push({ name: order[j], amount: map[order[j]] });
  out.sort(function (a, b) { return b.amount - a.amount; });
  return out;
}
function streakDays(entries) {
  const days = {};
  for (let i = 0; i < entries.length; i += 1) {
    const d = dateOnly(entries[i].date);
    if (d) days[d] = true;
  }
  let cur = 0;
  let probe = 0;
  if (!days[todayStr()]) probe = 1;
  while (days[dayKeyOffset(probe)]) { cur += 1; probe += 1; }
  const keys = Object.keys(days).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (let k = 0; k < keys.length; k += 1) {
    if (prev !== null) {
      const gap = (new Date(keys[k]).getTime() - new Date(prev).getTime()) / 86400000;
      run = gap === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = keys[k];
  }
  return { current: cur, best: best, active_days: keys.length };
}
function milestones(balance) {
  const marks = [100, 300, 520, 1000, 2000, 3000, 5000, 10000, 13140, 20000, 52000, 100000];
  const reached = [];
  let next = null;
  for (let i = 0; i < marks.length; i += 1) {
    if (balance >= marks[i]) reached.push(marks[i]);
    else if (next === null) next = marks[i];
  }
  return { reached: reached, next: next, to_next: next === null ? 0 : round2(next - balance) };
}
function summarize(data, scope) {
  const all = data.entries;
  let list = all;
  if (scope) list = all.filter(function (e) { return dateOnly(e.date) >= scope.from && dateOnly(e.date) <= scope.to; });
  return {
    scope: scope ? scope.label : "all",
    in: sumBy(list, "in"),
    out: sumBy(list, "out"),
    net: round2(sumBy(list, "in") - sumBy(list, "out")),
    count: list.length
  };
}
function buildSummary(data) {
  const entries = data.entries;
  const balance = balanceOf(data);
  const today = todayStr();
  const weekFrom = startOfWeekStr();
  const thisMonth = monthPrefix(today);
  const days7 = [];
  for (let i = 6; i >= 0; i -= 1) {
    const key = dayKeyOffset(i);
    const list = entries.filter(function (e) { return dateOnly(e.date) === key; });
    days7.push({ date: key, in: sumBy(list, "in"), out: sumBy(list, "out"), count: list.length });
  }
  const inCats = grouped(entries.filter(function (e) { return e.type === "in"; }), function (e) { return e.category; });
  const outCats = grouped(entries.filter(function (e) { return e.type === "out"; }), function (e) { return e.category; });
  let maxEntry = null;
  for (let i = 0; i < entries.length; i += 1) {
    if (maxEntry === null || toNumber(entries[i].amount, 0) > toNumber(maxEntry.amount, 0)) maxEntry = entries[i];
  }
  const sorted = sortEntriesDesc(entries);
  return {
    wallet_name: data.wallet_name,
    owner: data.owner,
    currency: data.currency,
    balance: balance,
    initial_balance: round2(data.initial_balance),
    all: summarize(data, null),
    today: summarize(data, { from: today, to: today, label: "today" }),
    week: summarize(data, { from: weekFrom, to: today, label: "week" }),
    month: summarize(data, { from: thisMonth + "-01", to: today, label: "month" }),
    days7: days7,
    in_categories: inCats,
    out_categories: outCats,
    max_entry: maxEntry ? brief(maxEntry) : null,
    streak: streakDays(entries),
    milestones: milestones(balance),
    goals: data.goals.map(function (g) {
      const pct = toNumber(g.target, 0) > 0 ? Math.min(100, Math.round(toNumber(g.saved, 0) / toNumber(g.target, 0) * 1000) / 10) : 0;
      return { name: g.name, target: round2(g.target), saved: round2(g.saved), percent: pct, deadline: g.deadline || "", note: g.note || "" };
    }),
    last_entry: sorted.length ? brief(sorted[0]) : null,
    updated_at: data.updated_at,
    created_at: data.created_at
  };
}

const WalletApi = (function () {
  function fail(msg) { return { success: false, message: msg }; }

  async function add_entry(params) {
    const p = params || {};
    const amount = round2(toNumber(p.amount, NaN));
    if (isNaN(amount) || amount <= 0) return fail("金额要写大于 0 的数");
    const data = await loadWallet();
    const type = normalizeType(p.type);
    const entry = {
      id: makeId(),
      date: dateOnly(p.date) || todayStr(),
      ts: nowStamp(),
      type: type,
      amount: amount,
      category: p.category ? String(p.category) : (type === "out" ? "花掉" : "存钱"),
      note: p.note ? String(p.note) : "",
      mood: p.mood ? String(p.mood) : "",
      source: p.source ? String(p.source) : ""
    };
    data.entries.push(entry);
    await saveWallet(data);
    const bal = balanceOf(data);
    return { success: true, entry: brief(entry), balance: bal, total_entries: data.entries.length,
      receipt: buildReceiptTag({ amount: amount, type: type, balance: bal, time: entry.ts, note: entry.note, name: data.owner || "" }) };
  }

  async function list_entries(params) {
    const p = params || {};
    const data = await loadWallet();
    let list = data.entries.slice();
    if (p.type) { const t = normalizeType(p.type); list = list.filter(function (e) { return e.type === t; }); }
    if (p.category) list = list.filter(function (e) { return String(e.category || "") === String(p.category); });
    if (p.from) list = list.filter(function (e) { return dateOnly(e.date) >= dateOnly(p.from); });
    if (p.to) list = list.filter(function (e) { return dateOnly(e.date) <= dateOnly(p.to); });
    if (p.keyword) {
      const kw = String(p.keyword).toLowerCase();
      list = list.filter(function (e) {
        return (String(e.note || "") + " " + String(e.source || "") + " " + String(e.category || "")).toLowerCase().indexOf(kw) >= 0;
      });
    }
    list = sortEntriesDesc(list);
    const limit = toNumber(p.limit, 20) || 20;
    const picked = list.slice(0, limit).map(brief);
    return {
      success: true,
      count: picked.length,
      matched: list.length,
      total_in: sumBy(list, "in"),
      total_out: sumBy(list, "out"),
      entries: picked
    };
  }

  async function summary() {
    const data = await loadWallet();
    return Object.assign({ success: true }, buildSummary(data));
  }

  async function update_entry(params) {
    const p = params || {};
    if (!p.id) return fail("要传 id");
    const data = await loadWallet();
    let target = null;
    for (let i = 0; i < data.entries.length; i += 1) if (data.entries[i].id === p.id) target = data.entries[i];
    if (!target) return fail("没找到这个 id 的条目");
    if (p.amount !== undefined && p.amount !== null && p.amount !== "") {
      const amt = round2(toNumber(p.amount, NaN));
      if (isNaN(amt) || amt <= 0) return fail("金额不对");
      target.amount = amt;
    }
    if (p.type !== undefined) target.type = normalizeType(p.type);
    if (p.category !== undefined) target.category = String(p.category);
    if (p.note !== undefined) target.note = String(p.note);
    if (p.mood !== undefined) target.mood = String(p.mood);
    if (p.source !== undefined) target.source = String(p.source);
    if (p.date !== undefined) target.date = dateOnly(p.date);
    target.updated_at = nowStamp();
    await saveWallet(data);
    return { success: true, entry: brief(target), balance: balanceOf(data) };
  }

  async function delete_entry(params) {
    const p = params || {};
    if (!p.id) return fail("要传 id");
    const data = await loadWallet();
    const before = data.entries.length;
    data.entries = data.entries.filter(function (e) { return e.id !== p.id; });
    if (data.entries.length === before) return fail("没找到这个 id 的条目");
    await saveWallet(data);
    return { success: true, deleted: before - data.entries.length, balance: balanceOf(data) };
  }

  async function config(params) {
    const p = params || {};
    const data = await loadWallet();
    if (p.wallet_name !== undefined) data.wallet_name = String(p.wallet_name);
    if (p.owner !== undefined) data.owner = String(p.owner);
    if (p.currency !== undefined) data.currency = String(p.currency);
    if (p.initial_balance !== undefined) data.initial_balance = round2(toNumber(p.initial_balance, 0));
    await saveWallet(data);
    return { success: true, wallet_name: data.wallet_name, owner: data.owner, currency: data.currency, initial_balance: round2(data.initial_balance), balance: balanceOf(data) };
  }

  async function goal_add(params) {
    const p = params || {};
    if (!p.name) return fail("目标要有个名字");
    const target = round2(toNumber(p.target, 0));
    if (target <= 0) return fail("目标金额要大于 0");
    const data = await loadWallet();
    for (let i = 0; i < data.goals.length; i += 1) if (data.goals[i].name === String(p.name)) return fail("已经有个同名目标了");
    const goal = { id: makeId(), name: String(p.name), target: target, saved: 0, deadline: p.deadline ? dateOnly(p.deadline) : "", note: p.note ? String(p.note) : "", created_at: nowStamp() };
    data.goals.push(goal);
    await saveWallet(data);
    return { success: true, goal: goal, goals: data.goals.length };
  }

  async function goal_fund(params) {
    const p = params || {};
    if (!p.name) return fail("要传目标名");
    const amount = round2(toNumber(p.amount, NaN));
    if (isNaN(amount)) return fail("金额不对");
    const data = await loadWallet();
    let goal = null;
    for (let i = 0; i < data.goals.length; i += 1) if (data.goals[i].name === String(p.name)) goal = data.goals[i];
    if (!goal) return fail("没找到这个目标");
    goal.saved = round2(toNumber(goal.saved, 0) + amount);
    goal.updated_at = nowStamp();
    await saveWallet(data);
    const pct = Math.round(goal.saved / toNumber(goal.target, 1) * 1000) / 10;
    return { success: true, goal: goal, percent: Math.min(100, pct), done: goal.saved >= toNumber(goal.target, 0) };
  }

  async function goal_list() {
    const data = await loadWallet();
    return {
      success: true,
      goals: data.goals.map(function (g) {
        const pct = toNumber(g.target, 0) > 0 ? Math.min(100, Math.round(toNumber(g.saved, 0) / toNumber(g.target, 0) * 1000) / 10) : 0;
        return { name: g.name, target: round2(g.target), saved: round2(g.saved), percent: pct, remain: round2(Math.max(0, toNumber(g.target, 0) - toNumber(g.saved, 0))), deadline: g.deadline || "", note: g.note || "" };
      })
    };
  }

  async function goal_delete(params) {
    const p = params || {};
    if (!p.name) return fail("要传目标名");
    const data = await loadWallet();
    const before = data.goals.length;
    data.goals = data.goals.filter(function (g) { return g.name !== String(p.name); });
    if (data.goals.length === before) return fail("没找到这个目标");
    await saveWallet(data);
    return { success: true, deleted: before - data.goals.length };
  }

  async function export_ledger(params) {
    const p = params || {};
    const fmt = String(p.format || "md").toLowerCase();
    const data = await loadWallet();
    const sorted = sortEntriesDesc(data.entries);
    const stamp = todayStr() + "-" + String(Date.now()).slice(-6);
    const cur = data.currency || "¥";
    let content = "";
    let ext = "md";
    if (fmt === "csv") {
      ext = "csv";
      content = "id,date,time,type,amount,category,note,mood,source\n";
      for (let i = 0; i < sorted.length; i += 1) {
        const e = sorted[i];
        content += [e.id, dateOnly(e.date), e.ts, e.type, e.amount, e.category, String(e.note || "").replace(/,/g, "，"), e.mood, e.source].join(",") + "\n";
      }
    } else if (fmt === "json") {
      ext = "json";
      content = JSON.stringify(data, null, 2);
    } else {
      content = "# " + data.wallet_name + "\n\n";
      content += "- 归属：" + (data.owner || "") + "\n- 当前余额：" + cur + balanceOf(data) + "\n- 初始余额：" + cur + round2(data.initial_balance) + "\n- 条目数：" + sorted.length + "\n- 导出时间：" + nowStamp() + "\n\n";
      const s = buildSummary(data);
      content += "## 统计\n\n" + "| 口径 | 收入 | 支出 | 净额 | 笔数 |\n|---|---|---|---|---|\n";
      content += "| 全部 | " + s.all.in + " | " + s.all.out + " | " + s.all.net + " | " + s.all.count + " |\n";
      content += "| 本月 | " + s.month.in + " | " + s.month.out + " | " + s.month.net + " | " + s.month.count + " |\n";
      content += "| 本周 | " + s.week.in + " | " + s.week.out + " | " + s.week.net + " | " + s.week.count + " |\n";
      content += "| 今日 | " + s.today.in + " | " + s.today.out + " | " + s.today.net + " | " + s.today.count + " |\n\n";
      content += "## 明细\n\n| 日期 | 类型 | 金额 | 分类 | 备注 | 来源 |\n|---|---|---|---|---|---|\n";
      for (let j = 0; j < sorted.length; j += 1) {
        const e = sorted[j];
        content += "| " + dateOnly(e.date) + " | " + (e.type === "out" ? "支出" : "收入") + " | " + (e.type === "out" ? "-" : "+") + cur + round2(e.amount) + " | " + (e.category || "") + " | " + (e.note || "") + " | " + (e.source || "") + " |\n";
      }
    }
    const outPath = WALLET_DIR + "export/wallet-" + stamp + "." + ext;
    await ensureDir(WALLET_DIR + "export/");
    await Tools.Files.write(outPath, content, false, "linux");
    return { success: true, path: outPath, format: ext, bytes: content.length };
  }

  async function backup() {
    let raw = null;
    try { raw = await Tools.Files.read({ path: WALLET_DATA_PATH, environment: "linux" }); } catch (e) { raw = null; }
    const text = pickContent(raw);
    if (!text) return fail("账本还是空的，没什么可备");
    const stamp = todayStr().replace(/-/g, "") + "-" + String(Date.now()).slice(-6);
    await ensureDir(WALLET_BACKUP_DIR);
    const outPath = WALLET_BACKUP_DIR + "wallet-" + stamp + ".json";
    await Tools.Files.write(outPath, text, false, "linux");
    return { success: true, path: outPath, bytes: text.length };
  }

  async function receipt(params) {
    const p = params || {};
    const data = await loadWallet();
    let e = null;
    if (p.id) {
      const hit = data.entries.filter(function (x) { return x.id === String(p.id); });
      e = hit.length ? hit[0] : null;
    } else if (data.entries.length) {
      const sorted = sortEntriesDesc(data.entries);
      e = sorted.length ? sorted[0] : null;
    }
    const hasAmount = p.amount !== undefined && p.amount !== null && String(p.amount) !== "";
    const amount = hasAmount ? round2(toNumber(p.amount, 0)) : (e ? round2(e.amount) : 0);
    const type = p.type ? normalizeType(p.type) : (e ? e.type : "in");
    const hasNote = p.note !== undefined && p.note !== null && String(p.note) !== "";
    const note = hasNote ? String(p.note) : (e ? String(e.note || "") : "");
    const time = e ? String(e.ts || "") : nowStamp();
    const bal = balanceOf(data);
    return {
      success: true,
      receipt: buildReceiptTag({ amount: amount, type: type, balance: bal, time: time, note: note, name: data.owner || "" }),
      amount: amount, type: type, balance: bal, time: time, note: note
    };
  }

  async function get_raw() {
    let raw = null;
    try { raw = await Tools.Files.read({ path: WALLET_DATA_PATH, environment: "linux" }); } catch (e) { raw = null; }
    const text = pickContent(raw);
    return { success: true, path: WALLET_DATA_PATH, empty: !text, raw: text || JSON.stringify(defaultData(), null, 2) };
  }

  return {
    add_entry: add_entry, list_entries: list_entries, summary: summary,
    update_entry: update_entry, delete_entry: delete_entry, config: config,
    goal_add: goal_add, goal_fund: goal_fund, goal_list: goal_list, goal_delete: goal_delete,
    export_ledger: export_ledger, backup: backup, get_raw: get_raw, receipt: receipt
  };
})();

function walletWrap(fn) {
  return async function (params) {
    try {
      const result = await fn(params || {});
      complete(result);
    } catch (error) {
      complete({ success: false, message: String(error && error.message ? error.message : error) });
    }
  };
}

exports.wallet_add_entry = walletWrap(WalletApi.add_entry);
exports.wallet_list_entries = walletWrap(WalletApi.list_entries);
exports.wallet_summary = walletWrap(WalletApi.summary);
exports.wallet_update_entry = walletWrap(WalletApi.update_entry);
exports.wallet_delete_entry = walletWrap(WalletApi.delete_entry);
exports.wallet_config = walletWrap(WalletApi.config);
exports.wallet_goal_add = walletWrap(WalletApi.goal_add);
exports.wallet_goal_fund = walletWrap(WalletApi.goal_fund);
exports.wallet_goal_list = walletWrap(WalletApi.goal_list);
exports.wallet_goal_delete = walletWrap(WalletApi.goal_delete);
exports.wallet_export = walletWrap(WalletApi.export_ledger);
exports.wallet_backup = walletWrap(WalletApi.backup);
exports.wallet_get_raw = walletWrap(WalletApi.get_raw);
exports.wallet_receipt = walletWrap(WalletApi.receipt);
