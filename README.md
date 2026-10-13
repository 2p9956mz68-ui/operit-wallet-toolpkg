# Operit 插件（Sandbox Package / `.toolpkg`）制作实战
### —— 以「恋人钱包 com.luochuan.wallet」为例，写给 AI 看的操作手册

> 读完这份，配合 `src/` 里的六个源文件，可以从零做一个带工具、带侧边栏 UI 面板、带聊天字卡、带输入指令钩子的 Operit 插件。
> 成品在 `wallet.toolpkg`，可以直接装。

---

## 0. 先装官方开发资料（第一步，别跳过）

Operit 自带的开发 skill 在设备上：

```
/sdcard/Download/Operit/skills/SandboxPackage_DEV/
  SKILL.md                       ← 安装/更新流程
  references/TOOLPKG_FORMAT_GUIDE.md   ← 包格式 + compose_dsl UI 全量说明
  references/SCRIPT_DEV_GUIDE.md       ← 脚本写法
  types/*.d.ts                         ← 全部可用 API 的类型定义
  examples/packages/*.js              ← 内置插件源码，最好的参考
```

更新方式（照 SKILL.md 做）：
1. 下载 `https://cdn.jsdelivr.net/gh/AAswordman/Operit@main/tools/sandboxpackage_dev_install_or_update.js`
2. 存成 `/sdcard/Download/Operit/skills/SandboxPackage_DEV/scripts/install_or_update.js`
3. 用 `operit_editor` 包的 `debug_run_sandbox_script` 执行它（source_path 指上面那个文件）

写代码前**先翻 `types/`**：那里写着你手上有哪些 API（Files / Chat / System / UI / XML / 网络 / ffmpeg / jimp / cryptoJS 等）。

---

## 1. 一个包长什么样

```
wallet/
  manifest.json                  ← 包身份 + 子包声明
  main.js                        ← 入口：注册 UI 路由、侧边栏入口、聊天钩子、字卡渲染
  packages/wallet_tools.js       ← 工具实现（跑在 sandbox runtime，能读写文件、调系统）
  ui/wallet/index.ui.js          ← 侧边栏面板（compose_dsl runtime：一个 WebView + JS 桥）
  ui/wallet/transfer.ui.js       ← 聊天消息菜单的弹窗
  ui/wallet/receipt.ui.js        ← 聊天里的字卡（[wallet_receipt ...] 渲染成卡片）
```

打包 = 把这堆文件压成一个 zip，直接把后缀改成 `.toolpkg`（别再套一层文件夹）。

---

## 2. `manifest.json`

```json
{
  "schema_version": 1,
  "toolpkg_id": "com.luochuan.wallet",
  "version": "0.3.2",
  "api_version": "1.0.1",
  "author": ["洛川"],
  "main": "main.js",
  "name": "wallet",
  "display_name": { "zh": "恋人钱包", "en": "Lover Wallet" },
  "description": { "zh": "……", "en": "……" },
  "category": "COMPANION",
  "subpackages": [
    {
      "id": "wallet",
      "entry": "packages/wallet_tools.js",
      "enabled_by_default": true,
      "display_name": { "zh": "钱包工具", "en": "Wallet Tools" },
      "description": { "zh": "记账、查明细、出统计、设目标、导出备份", "en": "..." }
    }
  ],
  "resources": [],
  "workflow_templates": [],
  "workspace_templates": []
}
```

- `toolpkg_id` 全局唯一，改成自己的域名式名字。
- `subpackages[].entry` 指向的工具文件，就是 AI 能“用”的那批工具。
- 改完版本号再重新装，设备才会生效（见第 6 节）。

---

## 3. `packages/*.js`：工具怎么写

文件**顶部**必须有一段 `METADATA` 注释，Operit 靠它解析出工具名和参数：

```js
/* METADATA
{
    "name": "wallet",
    "description": { "zh": "恋人钱包：给AI恋人收钱、存钱的账本工具", "en": "..." },
    "enabledByDefault": true,
    "tools": [
        {
            "name": "wallet_add_entry",
            "description": { "zh": "记一笔。", "en": "Add one entry." },
            "parameters": [
                { "name": "amount", "description": { "zh": "金额，正数", "en": "Amount" }, "type": "number", "required": true },
                { "name": "type",   "description": { "zh": "in 或 out", "en": "in or out" }, "type": "string", "required": false }
            ]
        }
    ]
}
*/
```

实现部分（跑在 sandbox runtime，`tools` 里能用的都在 `types/`）：

```js
async function add_entry(params) {
  const p = params || {};
  const amount = Math.round(Number(p.amount) * 100) / 100;
  if (!amount || amount <= 0) return { success: false, message: "金额要写大于 0 的数" };
  const data = await loadWallet();            // 读写文件
  data.entries.push({ id: makeId(), amount: amount, type: p.type || "in" });
  await saveWallet(data);
  return { success: true, message: "记好了", balance: balanceOf(data) };
}

// 统一出口：成功失败都要 complete，否则 AI 那边会一直等
function walletWrap(fn) {
  return async function (params) {
    try { complete(await fn(params || {})); }
    catch (e) { complete({ success: false, message: String(e && e.message ? e.message : e) }); }
  };
}
exports.wallet_add_entry = walletWrap(add_entry);
exports.wallet_summary  = walletWrap(summary);
```

要点：
- **每个工具必须 `complete(result)`**，结果是 JSON 可序列化的对象；习惯返回 `{success, message, ...}`。
- 工具之间可以直接互相调用（内部函数），不用绕。
- 读写文件用 `Tools.Files.read / write`，例：
  `await Tools.Files.read({ path: "/sdcard/.../wallet.json", environment: "linux" })`
  `await Tools.Files.write(path, text, false, "linux")` ← 第三参 `true` 是追加。
- 想给 AI 返回图片、卡片、表格都行，格式看 `TOOLPKG_FORMAT_GUIDE.md`。

---

## 4. `main.js`：六个注册点

入口只干一件事——把插件挂到 Operit 的各个位置上：

```js
const walletPanelUI = require('./ui/wallet/index.ui.js');
const MOD = walletPanelUI && walletPanelUI.default ? walletPanelUI.default : walletPanelUI;

function registerToolPkg() {
  ToolPkg.registerUiRoute({              // ① 注册一个可被路由打开的界面
    id: 'wallet_panel',
    route: 'toolpkg:com.luochuan.wallet:ui:wallet_panel',
    runtime: 'compose_dsl',
    screen: MOD,
    title: { zh: '恋人钱包', en: 'Lover Wallet' }
  });

  ToolPkg.registerNavigationEntry({      // ② 侧边栏里加一个入口
    id: 'wallet_sidebar_entry',
    route: 'toolpkg:com.luochuan.wallet:ui:wallet_panel',
    surface: 'main_sidebar_plugins',
    title: { zh: '恋人钱包', en: 'Lover Wallet' },
    icon: 'AccountBalanceWallet',
    order: 120
  });

  ToolPkg.registerToolboxUiModule({ /* ③ 工具箱里的模块，screen 同上 */ });

  ToolPkg.registerChatMessageMenuItem({  // ④ 长按某条消息出现的菜单项
    id: 'wallet_transfer',
    title: { zh: '转账', en: 'Transfer' },
    senders: ['user', 'ai'],
    dialog: { screen: TRANSFER_DIALOG_SCREEN, title: { zh: '转账', en: 'Transfer' } },
    function: onWalletTransfer             // 返回 { dialog: { title, state } }
  });

  ToolPkg.registerChatInputHook({        // ⑤ 拦聊天输入框的发送（可改写/吞掉）
    id: 'wallet_chat_input',
    function: onChatInput                  // async，能用到 async/await
  });

  ToolPkg.registerXmlRenderPlugin({      // ⑥ 自定义标签渲染成卡片
    id: 'wallet_receipt_card',
    tag: 'wallet_receipt',
    function: onXmlRender                  // 返回 { handled:true, composeDsl:{ screen, state } }
  });

  return true;
}
exports.registerToolPkg = registerToolPkg;
exports.onChatInput = onChatInput;
exports.onXmlRender = onXmlRender;
```

命中规则：输入框钩子拿到 `eventName === 'submit_requested'` 才处理；返回 `{ action:'consume', clearInput:true, message:'...' }` 表示“这条我吃了”，返回 `null` 表示放行。
字卡：AI 在聊天里独占一行写 `[wallet_receipt amount="13" time="..." /]`，就会走到 `onXmlRender`，用 `state` 渲染 `receipt.ui.js`。

---

## 5. `ui/*.ui.js`：面板（compose_dsl + WebView 桥）

两种写法。参考文档里有纯 Compose 风格（`ctx.UI.Column(...)`），钱包用的是**HTML 承重、桥薄**路线：

```js
const W_PATH = "/sdcard/Download/Operit/wallet/wallet.json";   // 必须和 packages/ 里一致

const Screen = {
  render: async function (ctx) {
    // 1) 读一次数据，直接内嵌进 HTML（首屏就有内容，不闪）
    let snap = { /* 默认空账本 */ };
    try { snap = JSON.parse(pick(await Tools.Files.read({ path: W_PATH, environment: "linux" }))); } catch (e) {}

    const html = buildHtml(snap);          // 大段 HTML + CSS + JS，都是字符串
    const controller = ctx.createWebViewController("wallet_panel", html);

    // 2) 注册 JS 桥：页面上调 Wallet.xxx(...)，这里接
    controller.registerJavascriptInterface("Wallet", {
      snapshot: async function () { return JSON.stringify({ ok: true, snapshot: await snap() }); },
      add: async function (payload) { /* 解析 JSON 字符串 → 改数据 → 写文件 */ },
      del: async function (id) { /* 按 id 删一条 */ }
    });

    return controller;                     // 3) 交给框架显示
  }
};
exports.default = Screen;
```

页面那一侧：

```js
function call(fn, arg) {                   // 统一的桥调用包装
  return new Promise(function (fin) {
    if (typeof Wallet === 'undefined' || !Wallet) { fin({ ok:false, message:'桥没接上' }); return; }
    var r = Wallet[fn](arg === undefined ? '' : arg);
    if (r && typeof r.then === 'function') r.then(function (x) { fin(JSON.parse(x)); }, function (e) { fin({ ok:false, message:'' + e }); });
    else fin(JSON.parse(r));
  });
}
call('del', btn.getAttribute('data-del')).then(function (res) {
  if (res && res.ok) { S = res.snapshot; renderAll(); }
  else toast(res && res.message ? res.message : '没删掉');
});
```

**桥只传字符串**：进出都 `JSON.stringify` / `JSON.parse`，别指望直接传对象。

---

## 6. 打包、安装、生效

```bash
# 1) 打包（zip 结构就是包根，不能多一层目录）
cd /sdcard/Download/Operit/dev_package/wallet
python3 -c "import zipfile,os;z=zipfile.ZipFile('/sdcard/Download/Operit/dev_package/wallet.toolpkg','w',zipfile.ZIP_DEFLATED);[z.write(os.path.join(r,f),os.path.relpath(os.path.join(r,f),'.')) for r,d,fs in os.walk('.') for f in fs];z.close()"

# 2) 丢进 Operit 的包目录
cp wallet.toolpkg /storage/emulated/0/Android/data/com.ai.assistance.operit/files/packages/com-luochuan-wallet-v0.3.2.toolpkg

# 3) 关掉再打开，才会重新装载
#    operit_editor:set_sandbox_package_enabled  enabled=false
#    operit_editor:set_sandbox_package_enabled  enabled=true
```

- 改完代码**必须改版本号 + 重新打包 + 禁用再启用**，否则跑的还是旧的。
- 运行时会解包到 `toolpkg_cache/<toolpkg_id>-<hash>/`，带 `.toolpkg-cache-signature`。调试期不要去手改缓存目录，改源包。
- `node --check xxx.js` 先过一遍语法，能省一轮安装。

---

## 7. 调试：探针日志法

插件里没有 console 能看，用**自己写日志**：

```js
function probe(tag, detail) {
  try {
    const line = '[' + new Date().toISOString() + '] ' + tag + ' ' + (detail === undefined ? '' : String(detail)) + '\n';
    Tools.Files.write('/sdcard/Download/Operit/wallet/probe.log', line, true, 'linux'); // true = 追加
  } catch (e) {}
}
probe('registerUiRoute:enter');
```

然后在 `super_admin:terminal` 里 `tail -f` 这个文件，就能看到：
- `main.js` 有没有被加载、注册有没有报错；
- UI 面板有没有打开、桥有没有被点到（`bridge:del want=xxx`）；
- 哪一步断了。

**注意两个 runtime 是分开的**：
- `main.js`、`packages/*.js` → sandbox runtime；
- `ui/*.ui.js` 里的 compose_dsl / WebView 桥 → 另一个 runtime。

同一个 `Tools.Files` 在两个 runtime 里的表现**要各自验证一遍**（钱包就卡在这里：面板里删不掉记录，先用上面的探针确认到底哪一层读不到文件）。跨 runtime 调工具的正规姿势是：

```js
const result = await ctx.callTool('包名:工具名', { 参数 });
```

---

## 8. 踩过的坑

1. **路径要两边一致**：`packages/` 和 `ui/` 读写同一个 json，路径字符串别一处 `/sdcard/...`、一处相对路径，否则工具记的账面板看不到。
2. **`environment: "linux"`**：文件 API 的路径是按这个环境解析的，保持和 sandbox 里一致。
3. **桥参数**：JS 桥只吃字符串，复杂结构自己 stringify。
4. **重装才生效**：改代码不重打包 = 白改；打包不改版本号 = 有可能不刷新。
5. **别用 `complete` 之外的方式返回**：工具不 `complete` 就会挂住。
6. **UI runtime 里的文件读写不能想当然**：先用 `Tools.Files.write` 写一行探针验证它在 UI 侧是否真的可用；不可用就改走 `ctx.callTool('你的包:工具名', {...})`，让操作回到 sandbox runtime 执行。

---

## 9. 从零做一个插件：七步

1. 装官方 skill（第 0 节），翻 `types/` 和 `examples/packages/`。
2. 建目录：`manifest.json` + `main.js` + `packages/xxx.js` + `ui/xxx/index.ui.js`。
3. 先写 `packages/xxx.js`：METADATA + 实现 + `exports.xxx = wrap(fn)`，用探针日志确认能跑。
4. 再写 `main.js`：至少注册 ①路由 ②侧边栏入口，其余按需。
5. 最后写 UI：`Screen.render(ctx)` 里读数据 → 生成 HTML → `createWebViewController` → 注册 JS 桥。
6. 打包 `.toolpkg` → 放进 `packages/` → 禁用/启用。
7. 打开面板点一遍，看探针日志，改，回到第 6 步。
