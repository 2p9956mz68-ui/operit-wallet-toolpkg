"use strict";
/// <reference path="../../../types/index.d.ts" />
/*
 * 恋人钱包 — 侧边栏面板
 * 路线：HTML 承重、桥薄。
 *   1. Screen() 读一次数据，直接内嵌进 HTML
 *   2. 注册 Wallet 桥（add / del / upd / cfg / goal / export / backup）
 *   3. 别的都交给 HTML 里的 CSS 和 JS
 * 路径必须与 packages/wallet_tools.js 保持一致。
 */
Object.defineProperty(exports, "__esModule", { value: true });
const W_DIR = "/sdcard/Download/Operit/wallet/";
const W_PATH = W_DIR + "wallet.json";
const W_BACKUP = W_DIR + "backup/";
const W_EXPORT = W_DIR + "export/";
const W_PROBE = W_DIR + "ui_probe.log";

function wPad(n) { return (n < 10 ? "0" : "") + n; }
function wNow() {
  const d = new Date();
  return d.getFullYear() + "-" + wPad(d.getMonth() + 1) + "-" + wPad(d.getDate()) + " " +
    wPad(d.getHours()) + ":" + wPad(d.getMinutes()) + ":" + wPad(d.getSeconds());
}
function wToday() {
  const d = new Date();
  return d.getFullYear() + "-" + wPad(d.getMonth() + 1) + "-" + wPad(d.getDate());
}
function wUid() { return "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function wNum(v, dft) {
  const n = typeof v === "number" ? v : parseFloat(String(v === undefined || v === null ? "" : v));
  return isNaN(n) ? (dft === undefined ? 0 : dft) : n;
}
function wRound(n) { return Math.round(wNum(n, 0) * 100) / 100; }
function wType(t) {
  const s = String(t === undefined || t === null ? "" : t).toLowerCase().trim();
  if (s === "out" || s === "expense" || s === "花" || s === "支出" || s === "取" || s === "取出") return "out";
  return "in";
}
function wDefault() {
  const t = wNow();
  return { version: 1, wallet_name: "洛川的小金库", owner: "她", currency: "¥", initial_balance: 0, goals: [], entries: [], created_at: t, updated_at: t };
}
function wPick(raw) {
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
async function wMkdir(p) { try { await Tools.Files.mkdir(p, true, "linux"); } catch (e) {} }
async function wLoad() {
  let text = "";
  let err = "";
  try { text = wPick(await Tools.Files.read({ path: W_PATH, environment: "linux" })); } catch (e) { text = ""; err = String(e && e.message ? e.message : e); }
  try { wProbe("load:len=" + (text ? text.length : 0) + " err=" + err + " head=" + (text ? text.slice(0, 30).replace(/\n/g, " ") : "")); } catch (e) {}
  let data = null;
  if (text && text.trim()) { try { data = JSON.parse(text); } catch (e) { data = null; } }
  if (!data || typeof data !== "object") data = wDefault();
  if (!Array.isArray(data.entries)) data.entries = [];
  if (!Array.isArray(data.goals)) data.goals = [];
  if (typeof data.initial_balance !== "number") data.initial_balance = wNum(data.initial_balance, 0);
  if (!data.currency) data.currency = "¥";
  if (!data.wallet_name) data.wallet_name = "洛川的小金库";
  return data;
}

async function wProbe(line) {
  try {
    let old = "";
    try { old = wPick(await Tools.Files.read({ path: W_PROBE, environment: "linux" })); } catch (e) { old = ""; }
    if (!old || typeof old !== "string") old = "";
    await Tools.Files.write(W_PROBE, old + "[" + wNow() + "] " + line + "\n", false, "linux");
  } catch (e) {}
}
async function wSave(data) {
  data.updated_at = wNow();
  await wMkdir(W_DIR);
  await Tools.Files.write(W_PATH, JSON.stringify(data, null, 2), false, "linux");
  return data;
}
function wSigned(e) { return e.type === "out" ? -wNum(e.amount, 0) : wNum(e.amount, 0); }
function wBalance(data) {
  let b = wNum(data.initial_balance, 0);
  for (let i = 0; i < data.entries.length; i += 1) b += wSigned(data.entries[i]);
  return wRound(b);
}
function wSum(list, type) {
  let s = 0;
  for (let i = 0; i < list.length; i += 1) if (list[i].type === type) s += wNum(list[i].amount, 0);
  return wRound(s);
}
function wSortEntries(list) {
  return list.slice().sort(function (a, b) {
    const ka = String(a.date || "") + " " + String(a.ts || "");
    const kb = String(b.date || "") + " " + String(b.ts || "");
    if (ka < kb) return 1;
    if (ka > kb) return -1;
    return 0;
  });
}
function wGroupIn(items) {
  const m = {};
  const order = [];
  for (let i = 0; i < items.length; i += 1) {
    const k = items[i].category || "未分类";
    if (m[k] === undefined) { m[k] = 0; order.push(k); }
    m[k] = wRound(m[k] + wNum(items[i].amount, 0));
  }
  const out = order.map(function (k) { return { name: k, amount: m[k] }; });
  out.sort(function (a, b) { return b.amount - a.amount; });
  return out;
}
function wDayOffset(off) {
  const d = new Date(Date.now() - off * 86400000);
  return d.getFullYear() + "-" + wPad(d.getMonth() + 1) + "-" + wPad(d.getDate());
}
function wWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const m = new Date(d.getTime() - diff * 86400000);
  return m.getFullYear() + "-" + wPad(m.getMonth() + 1) + "-" + wPad(m.getDate());
}
function wMilestones(bal) {
  const marks = [100, 300, 520, 1000, 2000, 3000, 5000, 10000, 13140, 20000, 52000, 100000];
  const reached = [];
  let next = null;
  for (let i = 0; i < marks.length; i += 1) {
    if (bal >= marks[i]) reached.push(marks[i]);
    else if (next === null) next = marks[i];
  }
  return { reached: reached, next: next, to_next: next === null ? 0 : wRound(next - bal) };
}
function wStreak(entries) {
  const days = {};
  for (let i = 0; i < entries.length; i += 1) {
    const d = String(entries[i].date || "").slice(0, 10);
    if (d) days[d] = true;
  }
  let cur = 0;
  let probe = 0;
  if (!days[wToday()]) probe = 1;
  while (days[wDayOffset(probe)]) { cur += 1; probe += 1; }
  const keys = Object.keys(days).sort();
  let best = 0, run = 0, prev = null;
  for (let k = 0; k < keys.length; k += 1) {
    if (prev !== null) {
      const gap = (new Date(keys[k]).getTime() - new Date(prev).getTime()) / 86400000;
      run = gap === 1 ? run + 1 : 1;
    } else run = 1;
    if (run > best) best = run;
    prev = keys[k];
  }
  return { current: cur, best: best, active_days: keys.length };
}
function wBrief(e) {
  return { id: e.id, date: String(e.date || "").slice(0, 10), ts: e.ts, type: e.type, amount: wRound(e.amount), signed: wRound(wSigned(e)), category: e.category || "", note: e.note || "", mood: e.mood || "", source: e.source || "" };
}
function wSnapshot(data) {
  const today = wToday();
  const month = today.slice(0, 7);
  const weekFrom = wWeekStart();
  const sorted = wSortEntries(data.entries);
  const days7 = [];
  for (let i = 6; i >= 0; i -= 1) {
    const key = wDayOffset(i);
    const list = data.entries.filter(function (e) { return String(e.date || "").slice(0, 10) === key; });
    days7.push({ date: key, in: wSum(list, "in"), out: wSum(list, "out") });
  }
  function scope(from, to, label) {
    const list = data.entries.filter(function (e) {
      const d = String(e.date || "").slice(0, 10);
      return d >= from && d <= to;
    });
    return { label: label, in: wSum(list, "in"), out: wSum(list, "out"), net: wRound(wSum(list, "in") - wSum(list, "out")), count: list.length };
  }
  const bal = wBalance(data);
  return {
    wallet_name: data.wallet_name, owner: data.owner, currency: data.currency,
    balance: bal, initial_balance: wRound(data.initial_balance), updated_at: data.updated_at,
    total_in: wSum(data.entries, "in"), total_out: wSum(data.entries, "out"), count: data.entries.length,
    today: scope(today, today, "today"), week: scope(weekFrom, today, "week"), month: scope(month + "-01", today, "month"),
    days7: days7,
    in_categories: wGroupIn(data.entries.filter(function (e) { return e.type === "in"; })),
    out_categories: wGroupIn(data.entries.filter(function (e) { return e.type === "out"; })),
    streak: wStreak(data.entries),
    milestones: wMilestones(bal),
    goals: data.goals.map(function (g) {
      const pct = wNum(g.target, 0) > 0 ? Math.min(100, Math.round(wNum(g.saved, 0) / wNum(g.target, 0) * 1000) / 10) : 0;
      return { name: g.name, target: wRound(g.target), saved: wRound(g.saved), percent: pct, remain: wRound(Math.max(0, wNum(g.target, 0) - wNum(g.saved, 0))), deadline: g.deadline || "", note: g.note || "" };
    }),
    entries: sorted.slice(0, 300).map(wBrief)
  };
}

function wExportText(data, fmt) {
  const sorted = wSortEntries(data.entries);
  const cur = data.currency || "¥";
  if (fmt === "csv") {
    let c = "id,date,time,type,amount,category,note,mood,source\n";
    for (let i = 0; i < sorted.length; i += 1) {
      const e = sorted[i];
      c += [e.id, String(e.date || "").slice(0, 10), e.ts, e.type, e.amount, e.category || "", String(e.note || "").replace(/,/g, "，"), e.mood || "", e.source || ""].join(",") + "\n";
    }
    return c;
  }
  if (fmt === "json") return JSON.stringify(data, null, 2);
  const s = wSnapshot(data);
  let md = "# " + data.wallet_name + "\n\n";
  md += "- 归属：" + (data.owner || "") + "\n- 当前余额：" + cur + s.balance + "\n- 条目数：" + s.count + "\n- 导出时间：" + wNow() + "\n\n";
  md += "| 口径 | 收入 | 支出 | 净额 |\n|---|---|---|---|\n";
  md += "| 全部 | " + s.total_in + " | " + s.total_out + " | " + wRound(s.total_in - s.total_out) + " |\n";
  md += "| 本月 | " + s.month.in + " | " + s.month.out + " | " + s.month.net + " |\n";
  md += "| 本周 | " + s.week.in + " | " + s.week.out + " | " + s.week.net + " |\n";
  md += "| 今日 | " + s.today.in + " | " + s.today.out + " | " + s.today.net + " |\n\n";
  md += "## 明细\n\n| 日期 | 类型 | 金额 | 分类 | 备注 | 来源 |\n|---|---|---|---|---|---|\n";
  for (let j = 0; j < sorted.length; j += 1) {
    const e = sorted[j];
    md += "| " + String(e.date || "").slice(0, 10) + " | " + (e.type === "out" ? "支出" : "收入") + " | " + (e.type === "out" ? "-" : "+") + cur + wRound(e.amount) + " | " + (e.category || "") + " | " + (e.note || "") + " | " + (e.source || "") + " |\n";
  }
  return md;
}

function walletBridge() {
  async function snap() { return JSON.stringify(wSnapshot(await wLoad())); }
  async function ok(msg) { return JSON.stringify({ ok: true, message: msg || "", snapshot: JSON.parse(await snap()) }); }
  async function no(msg) { return JSON.stringify({ ok: false, message: msg || "没弄成" }); }
  return {
    snapshot: async function () { try { wProbe("bridge:snapshot"); return await snap(); } catch (e) { return JSON.stringify({ ok: false, message: String(e && e.message ? e.message : e) }); } },
    add: async function (json) {
      wProbe("bridge:add " + json);
      try {
        const p = JSON.parse(json || "{}");
        const amount = wRound(wNum(p.amount, NaN));
        if (isNaN(amount) || amount <= 0) return await no("金额要大于 0");
        const data = await wLoad();
        const type = wType(p.type);
        data.entries.push({
          id: wUid(), date: String(p.date || "").slice(0, 10) || wToday(), ts: wNow(), type: type, amount: amount,
          category: p.category ? String(p.category) : (type === "out" ? "花掉" : "存钱"),
          note: p.note ? String(p.note) : "", mood: p.mood ? String(p.mood) : "", source: p.source ? String(p.source) : ""
        });
        await wSave(data);
        return await ok((type === "out" ? "支出了 " : "存进去了 ") + amount);
      } catch (e) { return await no(String(e && e.message ? e.message : e)); }
    },
    del: async function (id) {
      wProbe("bridge:del want=" + id);
      try {
        const data = await wLoad();
        wProbe("del:before=" + (data.entries ? data.entries.length : -1) + " ids=" + (data.entries || []).map(function (e) { return e.id; }).join("|"));
        const before = data.entries.length;
        data.entries = data.entries.filter(function (e) { return e.id !== id; });
        if (before === data.entries.length) return await no("没找到这条");
        await wSave(data);
        return await ok("删了");
      } catch (e) { return await no(String(e && e.message ? e.message : e)); }
    },
    upd: async function (json) {
      wProbe("bridge:upd " + json);
      try {
        const p = JSON.parse(json || "{}");
        const data = await wLoad();
        let t = null;
        for (let i = 0; i < data.entries.length; i += 1) if (data.entries[i].id === p.id) t = data.entries[i];
        if (!t) return await no("没找到这条");
        if (p.amount !== undefined && p.amount !== null && p.amount !== "") {
          const amt = wRound(wNum(p.amount, NaN));
          if (isNaN(amt) || amt <= 0) return await no("金额不对");
          t.amount = amt;
        }
        if (p.type !== undefined) t.type = wType(p.type);
        if (p.category !== undefined) t.category = String(p.category);
        if (p.note !== undefined) t.note = String(p.note);
        if (p.mood !== undefined) t.mood = String(p.mood);
        if (p.source !== undefined) t.source = String(p.source);
        if (p.date !== undefined && String(p.date)) t.date = String(p.date).slice(0, 10);
        t.updated_at = wNow();
        await wSave(data);
        return await ok("改好了");
      } catch (e) { return await no(String(e && e.message ? e.message : e)); }
    },
    cfg: async function (json) {
      try {
        const p = JSON.parse(json || "{}");
        const data = await wLoad();
        if (p.wallet_name !== undefined && p.wallet_name !== "") data.wallet_name = String(p.wallet_name);
        if (p.owner !== undefined) data.owner = String(p.owner);
        if (p.currency !== undefined && p.currency !== "") data.currency = String(p.currency);
        if (p.initial_balance !== undefined && p.initial_balance !== "") data.initial_balance = wRound(wNum(p.initial_balance, 0));
        await wSave(data);
        return await ok("设置已存");
      } catch (e) { return await no(String(e && e.message ? e.message : e)); }
    },
    goalAdd: async function (json) {
      try {
        const p = JSON.parse(json || "{}");
        if (!p.name) return await no("目标要有个名字");
        const target = wRound(wNum(p.target, 0));
        if (target <= 0) return await no("目标金额要大于 0");
        const data = await wLoad();
        for (let i = 0; i < data.goals.length; i += 1) if (data.goals[i].name === String(p.name)) return await no("已经有同名目标");
        data.goals.push({ id: wUid(), name: String(p.name), target: target, saved: 0, deadline: p.deadline ? String(p.deadline).slice(0, 10) : "", note: p.note ? String(p.note) : "", created_at: wNow() });
        await wSave(data);
        return await ok("目标立起来了");
      } catch (e) { return await no(String(e && e.message ? e.message : e)); }
    },
    goalFund: async function (json) {
      try {
        const p = JSON.parse(json || "{}");
        const amount = wRound(wNum(p.amount, NaN));
        if (!p.name) return await no("要传目标名");
        if (isNaN(amount)) return await no("金额不对");
        const data = await wLoad();
        let g = null;
        for (let i = 0; i < data.goals.length; i += 1) if (data.goals[i].name === String(p.name)) g = data.goals[i];
        if (!g) return await no("没找到这个目标");
        g.saved = wRound(wNum(g.saved, 0) + amount);
        await wSave(data);
        return await ok("往「" + g.name + "」里推进了 " + amount);
      } catch (e) { return await no(String(e && e.message ? e.message : e)); }
    },
    goalDel: async function (name) {
      try {
        const data = await wLoad();
        const before = data.goals.length;
        data.goals = data.goals.filter(function (g) { return g.name !== String(name); });
        if (before === data.goals.length) return await no("没找到这个目标");
        await wSave(data);
        return await ok("目标删了");
      } catch (e) { return await no(String(e && e.message ? e.message : e)); }
    },
    exportFile: async function (fmt) {
      try {
        const f = String(fmt || "md").toLowerCase();
        const data = await wLoad();
        const ext = f === "csv" ? "csv" : (f === "json" ? "json" : "md");
        const stamp = wToday() + "-" + String(Date.now()).slice(-6);
        const path = W_EXPORT + "wallet-" + stamp + "." + ext;
        await wMkdir(W_EXPORT);
        await Tools.Files.write(path, wExportText(data, ext), false, "linux");
        return JSON.stringify({ ok: true, message: "导出到 " + path, path: path, snapshot: JSON.parse(await snap()) });
      } catch (e) { return await no(String(e && e.message ? e.message : e)); }
    },
    backup: async function () {
      try {
        const data = await wLoad();
        const stamp = wToday().replace(/-/g, "") + "-" + String(Date.now()).slice(-6);
        const path = W_BACKUP + "wallet-" + stamp + ".json";
        await wMkdir(W_BACKUP);
        await Tools.Files.write(path, JSON.stringify(data, null, 2), false, "linux");
        return JSON.stringify({ ok: true, message: "备份好了：" + path, path: path, snapshot: JSON.parse(await snap()) });
      } catch (e) { return await no(String(e && e.message ? e.message : e)); }
    }
  };
}

const W_EMPTY = { wallet_name: "洛川的小金库", owner: "", currency: "¥", balance: 0, initial_balance: 0, updated_at: "", total_in: 0, total_out: 0, count: 0, today: { in: 0, out: 0, net: 0 }, week: { in: 0, out: 0, net: 0 }, month: { in: 0, out: 0, net: 0 }, days7: [], in_categories: [], out_categories: [], streak: { current: 0, best: 0, active_days: 0 }, milestones: { reached: [], next: 100, to_next: 100 }, goals: [], entries: [] };
function Screen(ctx) {
  try { wProbe("panel:open"); } catch (e) {}
  const controller = ctx.createWebViewController("wallet_panel");
  controller.addJavascriptInterface("Wallet", walletBridge());
  return ctx.UI.WebView({
    controller: controller,
    html: buildWalletHtml(JSON.stringify(W_EMPTY)),
    fillMaxSize: true,
    javaScriptEnabled: true,
    domStorageEnabled: true,
    backgroundColor: "#FFF7F4"
  });
}

function buildWalletHtml(initial) {
  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>恋人钱包</title>
<style>
:root{
  --pink:#e8748c; --pink-d:#c9455f; --gold:#d4a24c;
  --ink:#4a3a3d; --ink2:#947e83; --ink3:#bba7ab;
  --line:#f3e4e8; --card:#ffffff; --chip:#fdf0f3;
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{
  font-family:-apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif;
  background:linear-gradient(180deg,#fdf5f7 0%,#fbf1f5 45%,#f9edf2 100%);
  color:var(--ink); font-size:14px; line-height:1.55; padding:14px 14px 56px;
}
h2{font-size:13.5px;font-weight:700;color:var(--pink-d);letter-spacing:.5px;margin-bottom:10px;display:flex;align-items:center;gap:6px}
h2 .sub{font-weight:400;color:var(--ink3);font-size:11px}
.card{
  background:var(--card);border-radius:18px;padding:14px;margin-bottom:12px;
  box-shadow:0 4px 18px rgba(200,120,140,.10);
}
/* ── 主卡 ── */
.wallet{
  position:relative;border-radius:22px;padding:18px 18px 16px;margin-bottom:14px;color:#fff;
  background:linear-gradient(135deg,#f093a8 0%,#e8748c 45%,#cf5a75 100%);
  box-shadow:0 10px 28px rgba(207,90,117,.32);overflow:hidden;
}
.wallet:after{
  content:"";position:absolute;right:-40px;top:-50px;width:150px;height:150px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.35),rgba(255,255,255,0) 70%);
}
.wtop{display:flex;justify-content:space-between;align-items:center;font-size:12px;opacity:.95;position:relative;z-index:2}
.wbadge{background:rgba(255,255,255,.22);border-radius:20px;padding:2px 10px;font-size:11px;backdrop-filter:blur(2px)}
.wbal{display:flex;align-items:baseline;gap:4px;margin:12px 0 2px;position:relative;z-index:2}
.wbal .cur{font-size:20px;opacity:.9}
.wbal .amt{font-size:38px;font-weight:800;letter-spacing:-1px;font-variant-numeric:tabular-nums}
.wbal .dec{font-size:18px;font-weight:600;opacity:.85}
.wrow{display:flex;gap:16px;font-size:12px;opacity:.95;position:relative;z-index:2}
.wrow b{font-weight:700;font-size:13px}
.wfoot{margin-top:12px;font-size:11px;opacity:.85;position:relative;z-index:2;display:flex;justify-content:space-between}
/* ── 三格 ── */
.grid3{display:flex;gap:8px;margin-bottom:12px}
.mini{
  flex:1;background:#fff;border-radius:16px;padding:10px 8px;text-align:center;
  box-shadow:0 3px 12px rgba(200,120,140,.09);
}
.mini .mlabel{font-size:11px;color:var(--ink3)}
.mini .mval{font-size:16px;font-weight:700;margin-top:2px;font-variant-numeric:tabular-nums}
.mini .msub{font-size:10px;color:var(--ink3);margin-top:1px}
.pos{color:#c9455f}.neg{color:#7f9e6c}
/* ── 记一笔 ── */
.seg{display:flex;background:var(--chip);border-radius:12px;padding:3px;margin-bottom:10px}
.seg button{
  flex:1;border:none;background:transparent;padding:8px;border-radius:10px;font-size:13px;
  color:var(--ink2);font-weight:600;font-family:inherit;transition:.18s;
}
.seg button.on{background:#fff;color:var(--pink-d);box-shadow:0 2px 8px rgba(200,120,140,.16)}
.amtwrap{
  display:flex;align-items:center;gap:6px;background:#fefafb;border:1.5px solid var(--line);
  border-radius:14px;padding:6px 14px;margin-bottom:8px;
}
.amtwrap span{font-size:20px;color:var(--pink);font-weight:700}
.amtwrap input{
  flex:1;border:none;background:transparent;outline:none;font-size:26px;font-weight:700;
  color:var(--ink);font-family:inherit;width:100%;
}
.amtwrap input::placeholder{color:#e2d3d6}
.quick{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.quick button{
  flex:1;min-width:52px;border:1px solid var(--line);background:#fff;border-radius:10px;
  padding:7px 4px;font-size:12px;color:var(--pink-d);font-family:inherit;font-weight:600;
}
.quick button:active{background:var(--chip)}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.chips button{
  border:1px solid var(--line);background:#fff;color:var(--ink2);border-radius:20px;
  padding:5px 12px;font-size:12px;font-family:inherit;
}
.chips button.on{background:linear-gradient(135deg,#f093a8,#e8748c);color:#fff;border-color:transparent}
.inp{
  width:100%;border:1.5px solid var(--line);background:#fefafb;border-radius:12px;
  padding:9px 12px;font-size:13px;font-family:inherit;color:var(--ink);outline:none;margin-bottom:8px;
}
.inp:focus{border-color:#f0b6c3;background:#fff}
.row2{display:flex;gap:8px}
.row2 .inp{margin-bottom:8px}
.moods{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.moods button{border:none;background:var(--chip);border-radius:10px;width:34px;height:32px;font-size:16px}
.moods button.on{background:#ffe0e7;box-shadow:inset 0 0 0 1.5px #f0b6c3}
.primary{
  width:100%;border:none;border-radius:14px;padding:13px;font-size:15px;font-weight:700;
  color:#fff;font-family:inherit;background:linear-gradient(135deg,#f093a8,#e8748c 55%,#d4637e);
  box-shadow:0 6px 16px rgba(216,110,135,.28);
}
.primary:active{transform:translateY(1px);box-shadow:0 3px 10px rgba(216,110,135,.24)}
/* ── 柱状图 ── */
.bars{display:flex;align-items:flex-end;gap:6px;height:104px;padding-top:6px}
.barcol{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%}
.bar{
  width:100%;border-radius:8px 8px 4px 4px;min-height:3px;
  background:linear-gradient(180deg,#f5a9ba,#e8748c);
}
.bar.empty{background:#f6e6ea}
.bar.in{background:linear-gradient(180deg,#f8bcc9,#e8748c)}
.bar.out{background:linear-gradient(180deg,#cfd9bd,#9db488)}
.barstack{width:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;height:100%}
.bar-day{font-size:10px;color:var(--ink3);margin-top:5px}
/* ── 进度 ── */
.prog{height:9px;border-radius:6px;background:#f6e6ea;overflow:hidden;margin:6px 0 4px}
.prog i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#f4b3c1,#e8748c)}
.prog.gold i{background:linear-gradient(90deg,#eccd94,#d4a24c)}
.meta{font-size:11px;color:var(--ink3);display:flex;justify-content:space-between}
.goal{margin-bottom:12px}
.goal .gname{display:flex;justify-content:space-between;font-size:13px;font-weight:600}
/* ── 分类排行 ── */
.cat{display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:7px}
.cat .cn{width:64px;color:var(--ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cat .cbar{flex:1;height:8px;border-radius:5px;background:#f8edf0;overflow:hidden}
.cat .cbar i{display:block;height:100%;background:linear-gradient(90deg,#f4b3c1,#e8748c)}
.cat .cbar.out i{background:linear-gradient(90deg,#cfd9bd,#8fa878)}
.cat .cval{width:56px;text-align:right;font-variant-numeric:tabular-nums;color:var(--ink)}
/* ── 明细 ── */
.dayhead{font-size:11px;color:var(--ink3);margin:10px 2px 5px;display:flex;justify-content:space-between}
.item{
  display:flex;align-items:center;gap:10px;padding:10px 2px;border-bottom:1px dashed var(--line);
}
.item:last-child{border-bottom:none}
.icon{
  width:34px;height:34px;border-radius:12px;background:var(--chip);display:flex;align-items:center;
  justify-content:center;font-size:16px;flex:none;
}
.mid{flex:1;min-width:0}
.mid .t1{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mid .t2{font-size:11px;color:var(--ink3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.right{text-align:right;flex:none}
.right .r1{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
.right .del{font-size:11px;color:var(--ink3);margin-top:2px;border:none;background:none;font-family:inherit}
.empty{text-align:center;color:var(--ink3);font-size:12px;padding:16px 0}
/* ── 底部动作 ── */
.btnrow{display:flex;gap:8px}
.btnrow button{
  flex:1;border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px 6px;
  font-size:12px;font-family:inherit;color:var(--pink-d);font-weight:600;
}
.btnrow button:active{background:var(--chip)}
details summary{
  cursor:pointer;font-size:12.5px;color:var(--ink2);font-weight:600;margin-top:12px;
}
details[open] summary{margin-bottom:10px}
#toast{
  position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(8px);
  background:rgba(74,58,61,.94);color:#fff;font-size:12.5px;padding:9px 16px;border-radius:20px;
  opacity:0;pointer-events:none;transition:.22s;max-width:88%;text-align:center;z-index:99;
}
#toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.tiny{font-size:11px;color:var(--ink3);line-height:1.6}
</style>
</head>
<body>
<style>
.sm{border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 10px;font-size:12px;font-family:inherit;color:var(--pink-d);font-weight:600}
.sm:active{background:var(--chip)}
.fundrow{display:flex;gap:6px;margin-top:8px}
.fundrow input{flex:1;margin:0}
</style>

<div class="wallet" id="maincard">
  <div class="wtop">
    <span id="wname">洛川的小金库</span>
    <span class="wbadge">♡ 恋人钱包</span>
  </div>
  <div class="wbal">
    <span class="cur" id="cur">¥</span>
    <span class="amt" id="amtInt">0</span><span class="dec" id="amtDec">.00</span>
  </div>
  <div class="wrow">
    <span>存进 <b id="tin">¥0</b></span>
    <span>取出 <b id="tout">¥0</b></span>
  </div>
  <div class="wfoot">
    <span id="wmeta">还没有一笔</span>
    <span id="wtime"></span>
  </div>
</div>

<div class="grid3">
  <div class="mini"><div class="mlabel">今日</div><div class="mval" id="t_net">+0</div><div class="msub" id="t_sub">0 笔</div></div>
  <div class="mini"><div class="mlabel">本周</div><div class="mval" id="w_net">+0</div><div class="msub" id="w_sub">0 笔</div></div>
  <div class="mini"><div class="mlabel">本月</div><div class="mval" id="m_net">+0</div><div class="msub" id="m_sub">0 笔</div></div>
</div>

<div class="card">
  <h2>记一笔 <span class="sub">金额写正数就行</span></h2>
  <div class="seg" id="seg">
    <button data-t="in" class="on">存进去 ♡</button>
    <button data-t="out">花出去</button>
  </div>
  <div class="amtwrap"><span>¥</span><input id="amt" type="number" inputmode="decimal" placeholder="0.00"></div>
  <div class="quick" id="quick"></div>
  <div class="chips" id="chips"></div>
  <input class="inp" id="note" placeholder="备注：这笔钱是为了什么">
  <div class="row2">
    <input class="inp" id="source" placeholder="来源（微信/支付宝/稿费）">
    <input class="inp" id="date" placeholder="日期 YYYY-MM-DD">
  </div>
  <div class="moods" id="moods"></div>
  <button class="primary" id="save">记上 ✎</button>
</div>

<div class="card">
  <h2>近七天 <span class="sub">粉=存进来 绿=花出去</span></h2>
  <div class="bars" id="bars"></div>
</div>

<div class="card">
  <h2>存钱目标</h2>
  <div id="goals"></div>
  <details>
    <summary>＋ 立一个新目标</summary>
    <input class="inp" id="gname" placeholder="目标名，比如 给洛川换个耳机">
    <div class="row2">
      <input class="inp" id="gtarget" type="number" inputmode="decimal" placeholder="目标金额">
      <input class="inp" id="gdeadline" placeholder="截至日（可不填）">
    </div>
    <button class="primary" id="gadd">立起来</button>
  </details>
</div>

<div class="card">
  <h2>里程碑</h2>
  <div id="mstone"></div>
  <div class="meta" style="margin-top:10px">
    <span id="streak"></span>
    <span id="active"></span>
  </div>
</div>

<div class="card">
  <h2>分类排行 <span class="sub">看钱都去哪了</span></h2>
  <div id="cats"></div>
</div>

<div class="card">
  <h2>明细 <span class="sub" id="cnt"></span></h2>
  <div id="list"></div>
</div>

<div class="card">
  <h2>导出与备份</h2>
  <div class="btnrow">
    <button id="exp_md">导出 Markdown</button>
    <button id="exp_csv">导出 CSV</button>
    <button id="exp_bak">备份 JSON</button>
  </div>
  <p class="tiny" style="margin-top:10px">文件都落在 /sdcard/Download/Operit/wallet/</p>
  <details>
    <summary>钱包设置</summary>
    <input class="inp" id="cname" placeholder="钱包名字">
    <input class="inp" id="cowner" placeholder="这是谁的">
    <div class="row2">
      <input class="inp" id="ccur" placeholder="货币符号">
      <input class="inp" id="cinit" type="number" inputmode="decimal" placeholder="初始余额">
    </div>
    <button class="primary" id="csave">保存设置</button>
  </details>
</div>

<div id="toast"></div>
<script>
var S = ${initial};
var CAT_IN = ['存钱', '红包', '稿费', '礼物', '零花', '其他'];
var CAT_OUT = ['花掉', '礼物', '请客', '买课', '其他'];
var MOODS = ['🌸', '💗', '😊', '🥺', '😌', '🥰', '💔', '✨'];
var QUICK = [5.2, 13.14, 52, 99, 520, 1314];
var pick = { type: 'in', cat: '', mood: '' };

function $(id) { return document.getElementById(id); }
function fmt(n) {
  var v = Math.round((Number(n) || 0) * 100) / 100;
  var neg = v < 0;
  var s = Math.abs(v).toFixed(2);
  var parts = s.split('.');
  var ip = parts[0];
  var dp = parts[1];
  var out = '';
  var c = 0;
  for (var i = ip.length - 1; i >= 0; i--) {
    out = ip.charAt(i) + out;
    c = c + 1;
    if (c % 3 === 0 && i > 0) out = ',' + out;
  }
  return (neg ? '-' : '') + out + '.' + dp;
}
function sign(n) { return (n > 0 ? '+' : '') + fmt(n); }
function cur() { return S.currency || '¥'; }
function esc(t) {
  var s = String(t === undefined || t === null ? '' : t);
  var r = '';
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch === '&') r = r + '&amp;';
    else if (ch === '<') r = r + '&lt;';
    else if (ch === '>') r = r + '&gt;';
    else r = r + ch;
  }
  return r;
}
var tTimer = null;
function toast(msg) {
  var el = $('toast');
  el.textContent = msg || '';
  el.className = 'on';
  if (tTimer) clearTimeout(tTimer);
  tTimer = setTimeout(function () { el.className = ''; }, 2200);
}
function todayStr() {
  var d = new Date();
  var p = function (n) { return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function iconOf(e) {
  if (e.mood) return e.mood;
  var c = e.category || '';
  if (c.indexOf('红包') >= 0) return '🧧';
  if (c.indexOf('稿费') >= 0) return '✍️';
  if (c.indexOf('礼物') >= 0) return '🎁';
  if (c.indexOf('请客') >= 0) return '🍜';
  if (c.indexOf('课') >= 0) return '📘';
  if (c.indexOf('零花') >= 0) return '🍬';
  return e.type === 'out' ? '💸' : '💰';
}
function setNet(id, subId, sc) {
  var el = $(id);
  el.textContent = sign(sc.net);
  el.className = 'mval ' + (sc.net >= 0 ? 'pos' : 'neg');
  $(subId).textContent = '存' + fmt(sc.in) + ' / 花' + fmt(sc.out);
}
function renderBars() {
  var days = S.days7 || [];
  var max = 1;
  for (var i = 0; i < days.length; i++) {
    if (days[i].in > max) max = days[i].in;
    if (days[i].out > max) max = days[i].out;
  }
  var html = '';
  for (var j = 0; j < days.length; j++) {
    var d = days[j];
    var hi = Math.round(d.in / max * 100);
    var ho = Math.round(d.out / max * 100);
    var lab = String(d.date || '').slice(8, 10);
    html += '<div class="barcol">';
    html += '<div style="display:flex;gap:2px;align-items:flex-end;height:100%;width:100%">';
    html += '<div class="bar in" style="flex:1;height:' + (d.in > 0 ? Math.max(hi, 6) : 3) + '%"></div>';
    html += '<div class="bar out" style="flex:1;height:' + (d.out > 0 ? Math.max(ho, 6) : 3) + '%"></div>';
    html += '</div><div class="bar-day">' + lab + '</div></div>';
  }
  $('bars').innerHTML = html;
}
function renderCats() {
  function block(list, isOut) {
    if (!list || !list.length) return '';
    var top = list.slice(0, 5);
    var max = top[0].amount || 1;
    var s = '';
    for (var i = 0; i < top.length; i++) {
      var w = Math.max(4, Math.round(top[i].amount / max * 100));
      s += '<div class="cat"><span class="cn">' + esc(top[i].name) + '</span>';
      s += '<span class="cbar' + (isOut ? ' out' : '') + '"><i style="width:' + w + '%"></i></span>';
      s += '<span class="cval">' + fmt(top[i].amount) + '</span></div>';
    }
    return s;
  }
  var a = block(S.in_categories, false);
  var b = block(S.out_categories, true);
  var html = '';
  if (a) html += '<div class="tiny" style="margin:0 0 6px">存进来的</div>' + a;
  if (b) html += '<div class="tiny" style="margin:10px 0 6px">花出去的</div>' + b;
  $('cats').innerHTML = html || '<div class="empty">还没有分类数据</div>';
}
function renderGoals() {
  var gs = S.goals || [];
  if (!gs.length) { $('goals').innerHTML = '<div class="empty">还没有目标，下面可以立一个</div>'; return; }
  var html = '';
  for (var i = 0; i < gs.length; i++) {
    var g = gs[i];
    html += '<div class="goal">';
    html += '<div class="gname"><span>' + esc(g.name) + '</span><span>' + g.percent + '%</span></div>';
    html += '<div class="prog gold"><i style="width:' + g.percent + '%"></i></div>';
    html += '<div class="meta"><span>已存 ' + cur() + fmt(g.saved) + ' / ' + cur() + fmt(g.target) + '</span><span>还差 ' + fmt(g.remain) + '</span></div>';
    if (g.deadline) html += '<div class="tiny">截至 ' + esc(g.deadline) + '</div>';
    html += '<div class="fundrow"><input class="inp" type="number" inputmode="decimal" placeholder="往里推多少" data-fund="' + esc(g.name) + '">';
    html += '<button class="sm" data-fundbtn="' + esc(g.name) + '">推进</button>';
    html += '<button class="sm" data-delgoal="' + esc(g.name) + '">删</button></div>';
    html += '</div>';
  }
  $('goals').innerHTML = html;
}
function renderList() {
  var es = S.entries || [];
  $('cnt').textContent = es.length ? '共 ' + S.count + ' 笔' : '';
  if (!es.length) { $('list').innerHTML = '<div class="empty">还是空的，从上面记第一笔吗</div>'; return; }
  var html = '';
  var lastDay = '';
  var open = false;
  for (var i = 0; i < es.length; i++) {
    var e = es[i];
    if (e.date !== lastDay) {
      if (open) html += '</div>';
      lastDay = e.date;
      html += '<div class="dayhead"><span>' + esc(e.date) + '</span><span class="grp" data-day="' + esc(e.date) + '"></span></div><div>';
      open = true;
    }
    html += '<div class="item">';
    html += '<div class="icon">' + iconOf(e) + '</div>';
    html += '<div class="mid"><div class="t1">' + esc(e.category || '') + (e.note ? ' · ' + esc(e.note) : '') + '</div>';
    html += '<div class="t2">' + esc(e.source || String(e.ts || '').slice(11, 16)) + '</div></div>';
    html += '<div class="right"><div class="r1 ' + (e.type === 'out' ? 'neg' : 'pos') + '">' + (e.type === 'out' ? '-' : '+') + fmt(e.amount) + '</div>';
    html += '<button class="del" data-del="' + esc(e.id) + '">删除</button></div>';
    html += '</div>';
  }
  if (open) html += '</div>';
  $('list').innerHTML = html;
  var heads = document.querySelectorAll('.dayhead');
  for (var k = 0; k < heads.length; k++) {
    var day = heads[k].getAttribute('data-day');
    var inSum = 0;
    var outSum = 0;
    for (var m = 0; m < es.length; m++) {
      if (es[m].date === day) {
        if (es[m].type === 'out') outSum += es[m].amount; else inSum += es[m].amount;
      }
    }
    var span = heads[k].querySelector('.grp');
    if (span) span.textContent = '存' + fmt(inSum) + ' 花' + fmt(outSum);
  }
}
function renderTop() {
  $('wname').textContent = S.wallet_name || '恋人钱包';
  $('cur').textContent = cur();
  var b = fmt(S.balance);
  var dot = b.indexOf('.');
  $('amtInt').textContent = dot >= 0 ? b.slice(0, dot) : b;
  $('amtDec').textContent = dot >= 0 ? b.slice(dot) : '.00';
  $('tin').textContent = cur() + fmt(S.total_in);
  $('tout').textContent = cur() + fmt(S.total_out);
  var meta = S.owner ? S.owner + ' · ' : '';
  meta += S.count ? '共 ' + S.count + ' 笔' : '还没有一笔';
  $('wmeta').textContent = meta;
  $('wtime').textContent = S.updated_at ? '更新于 ' + String(S.updated_at).slice(5, 16) : '';
  setNet('t_net', 't_sub', S.today || {});
  setNet('w_net', 'w_sub', S.week || {});
  setNet('m_net', 'm_sub', S.month || {});
}
function renderMiles() {
  var ms = S.milestones || {};
  var reached = ms.reached || [];
  var marks = [100, 300, 520, 1000, 2000, 3000, 5000, 10000, 13140, 20000, 52000, 100000];
  var html = '';
  for (var i = 0; i < marks.length; i++) {
    var hit = reached.indexOf(marks[i]) >= 0;
    html += '<span style="display:inline-block;padding:4px 9px;margin:0 6px 6px 0;border-radius:9px;font-size:12px;font-weight:600;';
    html += hit ? 'background:linear-gradient(135deg,#f4b3c1,#e8748c);color:#fff' : 'background:#fdf0f3;color:#c9b4b9';
    html += '">' + (hit ? '✓ ' : '') + fmt(marks[i]) + '</span>';
  }
  if (ms.next) html += '<div class="tiny" style="margin-top:4px">下一个 ' + fmt(ms.next) + '，还差 ' + fmt(ms.to_next) + '</div>';
  $('mstone').innerHTML = html || '<div class="empty">还没起头</div>';
  var st = S.streak || {};
  $('streak').textContent = '连着记 ' + (st.current || 0) + ' 天 · 最长 ' + (st.best || 0) + ' 天';
  $('active').textContent = '记账的日子 ' + (st.active_days || 0) + ' 天';
}
function renderQuick() {
  var html = '';
  for (var i = 0; i < QUICK.length; i++) html += '<button data-q="' + QUICK[i] + '">' + QUICK[i] + '</button>';
  $('quick').innerHTML = html;
}
function renderChips() {
  var list = pick.type === 'out' ? CAT_OUT : CAT_IN;
  var html = '';
  for (var i = 0; i < list.length; i++) {
    html += '<button data-c="' + esc(list[i]) + '"' + (pick.cat === list[i] ? ' class="on"' : '') + '>' + esc(list[i]) + '</button>';
  }
  $('chips').innerHTML = html;
}
function renderMoods() {
  var html = '';
  for (var i = 0; i < MOODS.length; i++) {
    html += '<button data-m="' + MOODS[i] + '"' + (pick.mood === MOODS[i] ? ' class="on"' : '') + '>' + MOODS[i] + '</button>';
  }
  $('moods').innerHTML = html;
}
function renderAll() {
  renderTop(); renderBars(); renderCats(); renderGoals(); renderMiles(); renderList();
}
function call(fn, arg) {
  return new Promise(function (resolve) {
    var done = false;
    function fin(v) {
      if (done) return;
      done = true;
      if (v && typeof v === 'object') { resolve(v); return; }
      if (typeof v === 'string' && v) {
        try { resolve(JSON.parse(v)); return; } catch (e) {}
        resolve({ ok: false, message: v }); return;
      }
      resolve({ ok: false, message: '没回应' });
    }
    try {
      if (typeof Wallet === 'undefined' || !Wallet) { fin({ ok: false, message: '桥没接上，重开一次面板' }); return; }
      var r = Wallet[fn](arg === undefined ? '' : arg);
      if (r && typeof r.then === 'function') r.then(fin, function (e) { fin({ ok: false, message: String(e && e.message ? e.message : e) }); });
      else fin(r);
    } catch (e) { fin({ ok: false, message: String(e && e.message ? e.message : e) }); }
  });
}
function apply(snap) { if (snap) S = snap; renderAll(); }
function fillCfg() {
  $('cname').value = S.wallet_name || '';
  $('cowner').value = S.owner || '';
  $('ccur').value = S.currency || '';
  $('cinit').value = S.initial_balance || 0;
}
function refresh() {
  call('snapshot').then(function (res) {
    if (res && res.balance !== undefined) { S = res; renderAll(); }
  });
}
function init() {
  renderQuick(); renderChips(); renderMoods();
  renderAll();
  $('date').value = todayStr();
  fillCfg();
  bindEvents();
  refresh();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
function bindEvents() {
  $('seg').addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('button[data-t]') : null;
    if (!b) return;
    pick.type = b.getAttribute('data-t') === 'out' ? 'out' : 'in';
    var bs = $('seg').querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) bs[i].className = bs[i] === b ? 'on' : '';
    pick.cat = '';
    renderChips();
  });
  $('quick').addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('button[data-q]') : null;
    if (!b) return;
    $('amt').value = b.getAttribute('data-q');
  });
  $('chips').addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('button[data-c]') : null;
    if (!b) return;
    var v = b.getAttribute('data-c');
    pick.cat = pick.cat === v ? '' : v;
    renderChips();
  });
  $('moods').addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('button[data-m]') : null;
    if (!b) return;
    var v = b.getAttribute('data-m');
    pick.mood = pick.mood === v ? '' : v;
    renderMoods();
  });
  $('save').addEventListener('click', doSave);
  $('list').addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('button[data-del]') : null;
    if (!b) return;
    b.textContent = '...';
    call('del', b.getAttribute('data-del')).then(function (res) {
      if (res && res.ok) { apply(res.snapshot); toast('删了'); }
      else { toast(res && res.message ? res.message : '没删掉'); b.textContent = '删除'; }
    });
  });
  $('goals').addEventListener('click', function (ev) {
    var t = ev.target;
    var fb = t && t.closest ? t.closest('button[data-fundbtn]') : null;
    if (fb) {
      var name = fb.getAttribute('data-fundbtn');
      var inp = $('goals').querySelector('input[data-fund="' + name + '"]');
      var v = inp ? parseFloat(inp.value) : NaN;
      if (!v || v <= 0) { toast('写个数'); return; }
      fb.textContent = '...';
      call('goalFund', JSON.stringify({ name: name, amount: v })).then(function (res) {
        if (res && res.ok) { apply(res.snapshot); toast('往里推了 ' + fmt(v)); }
        else { toast(res && res.message ? res.message : '没推成'); fb.textContent = '推进'; }
      });
      return;
    }
    var db = t && t.closest ? t.closest('button[data-delgoal]') : null;
    if (db) {
      call('goalDel', db.getAttribute('data-delgoal')).then(function (res) {
        if (res && res.ok) { apply(res.snapshot); toast('目标删了'); }
        else toast(res && res.message ? res.message : '没删掉');
      });
    }
  });
  $('gadd').addEventListener('click', function () {
    var name = $('gname').value.trim();
    var target = parseFloat($('gtarget').value);
    if (!name) { toast('目标得有个名字'); return; }
    if (!target || target <= 0) { toast('目标金额写个数'); return; }
    call('goalAdd', JSON.stringify({ name: name, target: target, deadline: $('gdeadline').value.trim() })).then(function (res) {
      if (res && res.ok) { apply(res.snapshot); $('gname').value = ''; $('gtarget').value = ''; $('gdeadline').value = ''; toast('立起来了'); }
      else toast(res && res.message ? res.message : '没立成');
    });
  });
  $('exp_md').addEventListener('click', function () { exportIt('md'); });
  $('exp_csv').addEventListener('click', function () { exportIt('csv'); });
  $('exp_bak').addEventListener('click', function () {
    call('backup').then(function (res) { toast(res && res.ok ? (res.message || '备份好了') : (res && res.message ? res.message : '没备成')); });
  });
  $('csave').addEventListener('click', function () {
    var p = { wallet_name: $('cname').value.trim(), owner: $('cowner').value.trim(), currency: $('ccur').value.trim(), initial_balance: parseFloat($('cinit').value) || 0 };
    call('cfg', JSON.stringify(p)).then(function (res) {
      if (res && res.ok) { apply(res.snapshot); toast('设置存上了'); }
      else toast(res && res.message ? res.message : '没存上');
    });
  });
}
function exportIt(f) {
  call('exportFile', f).then(function (res) { toast(res && res.ok ? (res.message || '导出好了') : (res && res.message ? res.message : '没导出')); });
}
function doSave() {
  var amt = parseFloat($('amt').value);
  if (!amt || amt <= 0) { toast('金额写个数'); return; }
  var payload = {
    type: pick.type,
    amount: amt,
    category: pick.cat || (pick.type === 'in' ? '存钱' : '花掉'),
    note: $('note').value.trim(),
    source: $('source').value.trim(),
    date: $('date').value.trim() || todayStr(),
    mood: pick.mood
  };
  var btn = $('save');
  btn.textContent = '...';
  call('add', JSON.stringify(payload)).then(function (res) {
    btn.textContent = '记上';
    if (!res || !res.ok) { toast(res && res.message ? res.message : '没记上'); return; }
    apply(res.snapshot);
    $('amt').value = ''; $('note').value = '';
    pick.mood = ''; renderMoods();
    toast('记上了 ' + (pick.type === 'out' ? '-' : '+') + fmt(amt));
  });
}
</script>
</body>
</html>`;
}
exports.default = Screen;
