'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
// 已收款的字卡 —— 贴 <wallet_receipt .../> 到聊天里就会渲染成这张卡
function cell(ctx, key, dft) {
  const pair = ctx.useState(key, dft);
  return (pair && pair.length) ? pair[0] : dft;
}
function Screen(ctx) {
  const amount = String(cell(ctx, '_amount', '0'));
  const type = String(cell(ctx, '_type', 'in'));
  const balance = String(cell(ctx, '_balance', ''));
  const time = String(cell(ctx, '_time', ''));
  const note = String(cell(ctx, '_note', ''));
  const name = String(cell(ctx, '_name', ''));
  const inflow = type !== 'out';
  const head = inflow ? ('已收款' + (name ? ' · ' + name : '')) : ('已转出' + (name ? ' · ' + name : ''));
  const sign = inflow ? '+' : '-';
  const rows = [
    ctx.UI.Text({ text: head, style: 'labelLarge' }),
    ctx.UI.Text({ text: sign + ' ¥' + amount, style: 'headlineSmall', fontWeight: 'bold' }),
    ctx.UI.Text({ text: '余额 ¥' + balance, style: 'bodySmall' })
  ];
  if (time) rows.push(ctx.UI.Text({ text: time, style: 'bodySmall' }));
  if (note) rows.push(ctx.UI.Text({ text: note, style: 'bodySmall' }));
  return ctx.UI.Card({
    containerColor: inflow ? 'primaryContainer' : 'errorContainer',
    shape: { cornerRadius: 20 },
    elevation: 0
  }, [
    ctx.UI.Box({ padding: { horizontal: 18, vertical: 16 } }, [
      ctx.UI.Column({ spacing: 6 }, rows)
    ])
  ]);
}
exports.default = Screen;
