/* ═══════════════════════════════════════════════
   AMBEL POS · US edition: screen content.

   Every helper below emits the SAME markup and the SAME class names as the
   India design system in `app/globals.css` (page-head / kpi-row / card /
   card-h / lrow / badge / btn / tabs / sum-row / bar / cl). There is no
   US-only stylesheet: the two editions now share one visual language and only
   the copy and figures differ.
   ═══════════════════════════════════════════════ */

/* ── Icons ────────────────────────────────────── */
const ICONS = {
  dash:     '<path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-4H4v4Z"/>',
  checkout: '<path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  tax:      '<path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z"/><path d="M8 8h6M8 12h8M8 16h5"/>',
  sync:     '<path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12A9 9 0 0 1 18.5 5.8"/><path d="M18 2v4h4M6 22v-4H2"/>',
  stock:    '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  orders:   '<path d="M7 4h10l2 4v12H5V8l2-4Z"/><path d="M5 8h14M9 12h6M9 16h4"/>',
  receipt:  '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  hardware: '<path d="M6 9V4h12v5"/><path d="M6 17H4a2 2 0 0 1-2-2v-4h20v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v8H7z"/>',
  reports:  '<path d="M4 19V5"/><path d="M4 19h17"/><path d="M8 16v-5M13 16V8M18 16v-9"/>',
  setup:    '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V22h-4v-.3a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.2.1-2-3.4.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3v-4h.3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.4.2.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V2h4v.3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.3v4h-.3a1.7 1.7 0 0 0-1.5 1.1Z"/>',
  plus:     '<path d="M12 5v14M5 12h14"/>',
  card:     '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
  mail:     '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  chevron:  '<polyline points="9 18 15 12 9 6"/>',
};

export function ic(k, s = 16) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] || ICONS.dash}</svg>`;
}

/* ── Nav data (mirrors India's sidebar grouping) ── */
export const NAV_GROUPS = [
  ['Core',              ['dash', 'checkout', 'tax', 'sync']],
  ['Retail operations', ['stock', 'orders', 'receipt', 'hardware', 'reports', 'setup']],
];
export const NAMES = {
  dash: 'Dashboard', checkout: 'Fast Checkout', tax: 'Sales Tax', sync: 'Offline Sync',
  stock: 'Inventory', orders: 'Online Orders', receipt: 'Receipts',
  hardware: 'Hardware', reports: 'Reports', setup: 'Onboarding',
};

/* ── Helpers: 1:1 with the India design-system markup ── */
function money(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** India tones only: green / amber / red / blue / grey / gold. */
function badge(text, tone = 'grey') {
  return `<span class="badge b-${tone}">${text}</span>`;
}

/** `.page-head` + `.head-actions`, exactly as `PageHead` in couture/ui. */
function head(title, sub, actions = '') {
  return `<div class="page-head">
    <div><h2>${title}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
    ${actions ? `<div class="head-actions">${actions}</div>` : ''}
  </div>`;
}

/**
 * `.kpi-row` of `.kpi` tiles (kl / kv / km), matching `KpiRow`. Trend is
 * carried by `.km .up` / `.km .dn` rather than by a sparkline, which is what
 * the India tiles do.
 */
function kpis(items, cols = 3) {
  return `<div class="kpi-row" style="--kpi-cols:${cols}">${items.map(([label, val, meta, trend, dir]) => `
    <div class="kpi">
      <div class="kl">${label}</div>
      <div class="kv">${val}</div>
      <div class="km">${trend ? `<span class="${dir === 'dn' ? 'dn' : 'up'}">${trend}</span> · ` : ''}${meta}</div>
    </div>`).join('')}</div>`;
}

function card(title, sub, body, right = '') {
  return `<div class="card">
    <div class="card-h"><div><h3>${title}</h3>${sub ? `<div class="ch-sub">${sub}</div>` : ''}</div>${right}</div>
    ${body}
  </div>`;
}

/** Matches `DataTable`: a scroll container around a bare `<table>`. */
function tbl(cols, body) {
  return `<div style="overflow-x:auto"><table>
    <thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

/** Matches `ListRow`: `.lrow` > `.lico b-tone` + `.lt` / `.ls`. */
function rows(items) {
  return `<div class="card-pad">${items.map(([title, sub, tone, action]) => `
    <div class="lrow">
      <div class="lico b-${tone}">${title[0]}</div>
      <div style="flex:1"><div class="lt">${title}</div><div class="ls">${sub}</div></div>
      ${action || ''}
    </div>`).join('')}</div>`;
}

function tabs(items, on) {
  return `<div class="tabs">${items.map((x) => `<button class="tab${x === on ? ' active' : ''}">${x}</button>`).join('')}</div>`;
}

function grid(cols, body, style = '') {
  return `<div class="grid" style="grid-template-columns:repeat(${cols},minmax(0,1fr));${style}">${body}</div>`;
}

/* ── Screens ──────────────────────────────────── */
export const Screens = {

  /* ── Dashboard ── */
  dash() {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return head('US Retail POS', `Austin store · ${today}`,
      `<a class="btn" href="/app/dashboard">${ic('sync')} Open India POS</a>
       <button class="btn btn-pri">${ic('plus')} New sale</button>`
    ) +
    kpis([
      ['Net sales', '$8,642.30', 'Austin store, today', '+12.4%', 'up'],
      ['Transactions', '128', 'Avg ticket $67.52', '+8.3%', 'up'],
      ['Tax collected', '$712.94', 'TX mixed local rate'],
      ['Online pickup', '18', '7 ready · 3 late'],
      ['Offline queue', '0', 'All transactions synced'],
      ['Low stock', '14', 'Across size/colour variants'],
    ]) +
    grid(3,
      card('Competitive focus', 'Where this US edition must win',
        rows([
          ['Square speed', 'Fewer clicks, payment-first checkout', 'blue', badge('Priority', 'blue')],
          ['Omnichannel sync', 'One inventory pool for web and store', 'green', badge('Priority', 'blue')],
          ['Lightspeed depth', 'Variants, transfers, POs, reports', 'amber', badge('Priority', 'blue')],
        ])
      ) +
      card('US table stakes', 'Market-specific features',
        tbl(['Feature', 'Priority'],
          [['Sales tax automation', 'High'], ['Offline billing + auto-sync', 'High'],
           ['Email / SMS receipts', 'High'], ['E-commerce integration', 'High'],
           ['BOPIS', 'Medium'], ['Hardware support', 'Medium'],
          ].map((r) => `<tr><td>${r[0]}</td><td>${badge(r[1], r[1] === 'High' ? 'green' : 'amber')}</td></tr>`).join(''))
      ) +
      card('Live store health', 'Operational signals for the manager',
        rows([
          ['Tax engine', 'Austin, TX rate resolved', 'green'],
          ['Card terminal', 'Tap/chip active on Lane 2', 'green'],
          ['Online stock', 'Synced 42 sec ago', 'blue'],
          ['Receipt service', 'Email and SMS delivery active', 'blue'],
          ['BOPIS shelf', '3 orders need staging', 'amber'],
        ])
      )
    );
  },

  /* ── Checkout ── */
  checkout() {
    const items = [['Denim Jacket', 'SKU DJ-204 / M / Indigo', 98, 1], ['Silk Scarf', 'SKU SS-882 / Gold', 45, 2], ['Leather Belt', 'SKU LB-122 / Tan', 54, 1]];
    const sub = items.reduce((s, x) => s + x[2] * x[3], 0);
    const tax = +(sub * 0.0825).toFixed(2);
    const loyalty = 10;
    const total = sub + tax - loyalty;
    const swatches = [
      'linear-gradient(135deg,#1e3a5f,#3b82f6)',
      'linear-gradient(135deg,#7f1d1d,#fbbf24)',
      'linear-gradient(135deg,#0f766e,#67e8f9)',
      'linear-gradient(135deg,#581c87,#c084fc)',
      'linear-gradient(135deg,#7f1d1d,#fca5a5)',
      'linear-gradient(135deg,#14532d,#86efac)',
    ];
    const products = [
      ['Denim Jacket', 'M / L / XL', 98, 0], ['Silk Scarf', 'Gold / Ivory', 45, 1],
      ['Linen Shirt', 'S · M · L · XL', 64, 2], ['Evening Dress', 'Sizes 2–12', 188, 3],
      ['Leather Belt', 'Tan / Black', 54, 4], ['Canvas Tote', 'Natural / Navy', 38, 5],
    ];

    return head('Fast Checkout',
      'Payment-first flow: scan a barcode, resolve tax, tap the card, send a digital receipt.',
      `<button class="btn">${ic('sync')} Hold sale</button>
       <button class="btn btn-pri">${ic('card')} Charge ${money(total)}</button>`
    ) +
    `<div class="split-2" style="--split-aside:380px">
      ${card('Product catalog', 'Search, scan a barcode, or pick a variant',
        `<div class="card-pad" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
          ${products.map((p) => `<button class="card" style="padding:0;overflow:hidden;text-align:left;cursor:pointer">
            <div style="height:76px;background:${swatches[p[3]]}"></div>
            <div style="padding:11px 12px">
              <div class="t-strong" style="font-size:13px">${p[0]}</div>
              <div class="t-sub">${p[1]}</div>
              <div class="num" style="font-size:14px;font-weight:700;margin-top:6px">${money(p[2])}</div>
            </div>
          </button>`).join('')}
        </div>`,
        tabs(['Popular', 'Apparel', 'Accessories', 'Online stock'], 'Popular'))}
      ${card('Cart', 'Customer: Harper Lee',
        `<div class="card-pad">
          ${items.map((i) => `<div class="lrow">
            <div style="flex:1"><div class="lt">${i[0]}</div><div class="ls">${i[1]}</div></div>
            <div style="display:flex;align-items:center;gap:12px">
              <div class="seg"><b class="qstep">−</b><b class="num">${i[3]}</b><b class="qstep">+</b></div>
              <span class="num t-strong">${money(i[2] * i[3])}</span>
            </div>
          </div>`).join('')}
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border-soft)">
            <div class="sum-row"><span>Subtotal</span><span class="num">${money(sub)}</span></div>
            <div class="sum-row"><span>Austin sales tax 8.25%</span><span class="num">${money(tax)}</span></div>
            <div class="sum-row"><span>Loyalty discount</span><span class="num" style="color:var(--success)">−${money(loyalty)}</span></div>
            <div class="sum-row" style="font-size:16px;font-weight:700;border-top:1px solid var(--border);margin-top:6px;padding-top:10px">
              <span style="color:var(--ink)">Total</span><span class="num">${money(total)}</span>
            </div>
          </div>
          <div class="pay-grid" style="margin-top:14px">
            <button class="btn btn-pri">${ic('card')}Tap / Chip</button>
            <button class="btn">${ic('checkout')}Cash</button>
            <button class="btn">${ic('mail')}Email receipt</button>
          </div>
        </div>`,
        badge('Tax ready', 'green'))}
    </div>`;
  },

  /* ── Sales Tax ── */
  tax() {
    return head('Sales Tax Automation',
      'US tax replaces GST: state, county, city, and product taxability resolved per transaction.',
      `<button class="btn">${ic('download')} Export tax log</button>
       <button class="btn btn-pri">${ic('plus')} Add nexus state</button>`
    ) +
    kpis([
      ['Active nexus', '4 states', 'TX, CO, CA, NY'],
      ['Rate source', 'Live', 'Updated 8 min ago'],
      ['Tax collected', '$712.94', 'Today'],
      ['Exempt sales', '$420.00', '2 reseller certificates'],
      ['Product codes', '96%', '12 need mapping', '+4%', 'up'],
      ['Filing alerts', '1', 'Colorado due Friday'],
    ]) +
    grid(2,
      card('Tax breakdown preview', 'Austin customer · apparel cart',
        `<div class="card-pad">
          <div class="section-label">Jurisdiction split</div>
          ${[['Texas state', '6.250%'], ['Travis county', '0.000%'], ['Austin city', '1.000%'], ['Special district', '1.250%']]
            .map((r) => `<div class="sum-row"><span>${r[0]}</span><b class="num">${r[1]}</b></div>`).join('')}
          <div class="section-label" style="margin-top:16px">Product taxability</div>
          ${[['Apparel', 'Taxable', 'blue'], ['Gift card', 'Non-taxable', 'amber'], ['Shipping', 'Taxable in TX', 'blue'], ['Resale cert.', 'Exempt', 'green']]
            .map((r) => `<div class="sum-row"><span>${r[0]}</span>${badge(r[1], r[2])}</div>`).join('')}
        </div>`,
        badge('Auto-calculated', 'green')) +
      card('Compliance queue', 'Manager tasks',
        rows([
          ['Map product tax codes', '12 SKUs missing category rules', 'amber', '<button class="btn btn-sm">Open</button>'],
          ['Verify Colorado nexus', 'Threshold crossed this month', 'red', '<button class="btn btn-sm">Open</button>'],
          ['Upload resale certificate', 'Acme Styling LLC', 'blue', '<button class="btn btn-sm">Open</button>'],
          ['Review tax rounding', 'No mismatches found today', 'green', '<button class="btn btn-sm">Open</button>'],
        ]))
    );
  },

  /* ── Offline Sync ── */
  sync() {
    return head('Offline Billing + Auto Sync',
      'Keep billing when the internet drops, then reconcile payments, receipts, stock, and tax logs automatically.',
      `<button class="btn">${ic('sync')} Force sync</button>
       <button class="btn btn-pri">Run offline drill</button>`
    ) +
    kpis([
      ['Offline sales', '0 queued', 'Last outage 11:42 AM'],
      ['Sync latency', '42 sec', 'Online orders to store'],
      ['Conflict rate', '0.2%', '1 stock conflict today'],
      ['Local cache', '2,418 SKUs', 'Available at checkout'],
      ['Payment mode', 'Card fallback', 'Store-and-forward ready'],
      ['Audit status', 'Clean', 'No missing receipts'],
    ]) +
    card('Sync pipeline', 'Local-first register architecture',
      `<div class="card-pad" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px">
        ${[['1', 'Local sale', 'Cart, tax, receipt saved on device'],
           ['2', 'Payment token', 'Card auth stored safely'],
           ['3', 'Stock reserve', 'Variant quantity decremented locally'],
           ['4', 'Cloud reconcile', 'Orders, tax, receipts, reports updated'],
          ].map((x) => `<div>
            <div class="section-label">Step ${x[0]}</div>
            <div class="t-strong">${x[1]}</div>
            <div class="t-sub">${x[2]}</div>
          </div>`).join('')}
      </div>`,
      badge('Healthy', 'green')) +
    grid(2,
      card('Offline event log', '',
        tbl(['Time', 'Event', 'Status'],
          [['11:42', 'Wi-Fi degraded', 'Recovered'], ['11:43', '3 sales stored locally', 'Synced'],
           ['11:45', 'Receipt batch delivered', 'Complete'], ['11:46', 'Inventory reconciled', 'Complete'],
          ].map((r) => `<tr>
            <td class="num">${r[0]}</td><td>${r[1]}</td>
            <td>${badge(r[2], r[2] === 'Recovered' ? 'amber' : 'green')}</td>
          </tr>`).join(''))
      ) +
      card('Conflict resolver', '',
        rows([
          ['Oversold variant', 'Evening Dress / Size 6 / Black', 'amber'],
          ['Duplicate receipt', 'None found', 'green'],
          ['Tax rate stale', 'None found', 'green'],
        ])
      ),
      'margin-top:18px');
  },

  /* ── Inventory ── */
  stock() {
    return head('Inventory + Variants',
      'Stock depth across size, colour, material, channel, transfers, and purchase orders.',
      `<button class="btn">${ic('download')} Export CSV</button>
       <button class="btn btn-pri">${ic('plus')} Add SKU</button>`
    ) +
    kpis([
      ['SKUs', '4,826', '268 active styles'],
      ['Variant matrix', '18,204', 'Size / colour / material'],
      ['Low stock', '14', 'Reorder suggested'],
      ['Transfers', '7 open', 'Austin to Denver'],
      ['Open POs', '$42,880', '12 suppliers'],
      ['Online reserved', '38 units', 'Awaiting pickup'],
    ]) +
    card('Variant stock table', 'One source of truth across store and online',
      tbl(['Style', 'Variant', 'Austin', 'Denver', 'Online', 'Status', 'Action'],
        [['Denim Jacket', 'Indigo / M / Cotton', '12', '4', '8', 'Healthy'],
         ['Evening Dress', 'Black / 6 / Silk', '1', '0', '2', 'Low stock'],
         ['Linen Shirt', 'White / L / Linen', '22', '18', '14', 'Healthy'],
         ['Leather Belt', 'Tan / 34 / Leather', '0', '5', '3', 'Out in Austin'],
         ['Silk Scarf', 'Gold / One size', '8', '3', '12', 'Online fast mover'],
        ].map((r, i) => `<tr>
          <td class="t-strong">${r[0]}</td><td>${r[1]}</td>
          <td class="num">${r[2]}</td><td class="num">${r[3]}</td><td class="num">${r[4]}</td>
          <td>${badge(r[5], r[5].includes('Low') || r[5].includes('Out') ? 'amber' : r[5].includes('fast') ? 'blue' : 'green')}</td>
          <td><button class="btn btn-sm">${['Transfer', 'Create PO', 'View', 'Transfer', 'Reorder'][i]}</button></td>
        </tr>`).join('')),
      tabs(['All', 'Low stock', 'Transfers', 'PO needed'], 'All'));
  },

  /* ── Online Orders / BOPIS ── */
  orders() {
    return head('Online Orders / BOPIS',
      'Omnichannel: online orders reserve stock, stores pick and stage pickup orders.',
      `<button class="btn">${ic('sync')} Sync channels</button>
       <button class="btn btn-pri">Create pickup order</button>`
    ) +
    kpis([
      ['Online orders', '42', 'Today', '+9', 'up'],
      ['BOPIS ready', '7', 'Customer notified'],
      ['Late pickups', '3', 'Needs follow-up'],
      ['Ship from store', '12', 'Packed today'],
      ['Sync conflicts', '1', 'Variant allocation'],
      ['Revenue online', '$3,840', '32% of today'],
    ]) +
    grid(2,
      card('Pickup queue', 'Store associate view',
        tbl(['Order', 'Customer', 'Items', 'Promise', 'Status'],
          [['WEB-1842', 'Nora Patel', '2', '2:30 PM', 'Pick now', 'amber'],
           ['WEB-1838', 'Ethan Moore', '1', 'Ready shelf B', 'Ready', 'green'],
           ['WEB-1833', 'Ava Brooks', '4', 'Overdue 22m', 'Late', 'red'],
           ['WEB-1829', 'Liam Chen', '1', 'Ship from store', 'Packed', 'blue'],
          ].map((r) => `<tr>
            <td class="num t-strong">${r[0]}</td><td>${r[1]}</td>
            <td class="num">${r[2]}</td><td>${r[3]}</td>
            <td>${badge(r[4], r[5])}</td>
          </tr>`).join('')),
        tabs(['New', 'Picking', 'Ready', 'Late'], 'New')) +
      card('Channel inventory sync', 'Single stock pool by channel',
        rows([
          ['In-store POS', '128 sales today, stock writes instant', 'green', badge('Live', 'green')],
          ['Shopify storefront', '42 orders, synced 42 sec ago', 'green', badge('Live', 'green')],
          ['Instagram shop', '6 orders, catalog live', 'blue', badge('Live', 'blue')],
          ['Marketplace', 'Not connected in MVP', 'amber', badge('Later', 'amber')],
        ])
      )
    );
  },

  /* ── Receipts ── */
  receipt() {
    return head('Digital Receipts',
      'US default flow: email/SMS first, print optional, with a return barcode and full tax breakdown.',
      `<button class="btn">${ic('mail')} Send test</button>
       <button class="btn btn-pri">${ic('receipt')} Preview receipt</button>`
    ) +
    grid(2,
      card('Receipt preferences', 'Customer profile driven',
        rows([
          ['Email receipt', 'harper.lee@example.com', 'green', '<button class="btn btn-sm">Edit</button>'],
          ['SMS receipt', '(512) 555-0198', 'green', '<button class="btn btn-sm">Edit</button>'],
          ['Printed receipt', 'Optional, cashier prompt', 'blue', '<button class="btn btn-sm">Edit</button>'],
          ['Marketing consent', 'Not opted in', 'amber', '<button class="btn btn-sm">Edit</button>'],
          ['Return barcode', 'Enabled on every receipt', 'blue', '<button class="btn btn-sm">Edit</button>'],
        ]),
        badge('SMS allowed', 'green')) +
      card('Receipt preview', '',
        `<div class="card-pad">
          <div class="t-mono" style="background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);padding:16px 18px">
            <div class="t-strong" style="text-align:center">AMBEL POS · AUSTIN</div>
            <div style="text-align:center;color:var(--muted);font-size:11px;margin-top:3px">
              100 Congress Ave, Austin TX 78701<br>Receipt #AUS-24819 · Cashier: Mia James
            </div>
            <div style="border-top:1px dashed var(--border);margin:12px 0"></div>
            ${[['Denim Jacket M', 98], ['Silk Scarf ×2', 90], ['Leather Belt', 54]]
              .map((r) => `<div class="sum-row"><span>${r[0]}</span><span class="num">${money(r[1])}</span></div>`).join('')}
            <div style="border-top:1px dashed var(--border);margin:12px 0"></div>
            <div class="sum-row"><span>Subtotal</span><span class="num">$242.00</span></div>
            <div class="sum-row"><span>TX sales tax 8.25%</span><span class="num">$19.97</span></div>
            <div class="sum-row"><span>Loyalty</span><span class="num">−$10.00</span></div>
            <div class="sum-row" style="font-weight:700;border-top:1px solid var(--border);margin-top:6px;padding-top:9px">
              <span style="color:var(--ink)">Total</span><span class="num">$251.97</span>
            </div>
            <div style="border-top:1px dashed var(--border);margin:12px 0"></div>
            <div style="text-align:center;color:var(--muted);font-size:11px">
              Return by Jul 2, 2026<br>Barcode: AUS24819-25197
            </div>
          </div>
        </div>`)
    );
  },

  /* ── Hardware ── */
  hardware() {
    return head('Hardware Setup',
      'US retail hardware: tap/chip card reader, barcode scanner, receipt printer, cash drawer, label printer.',
      `<button class="btn">${ic('sync')} Run diagnostics</button>
       <button class="btn btn-pri">${ic('plus')} Pair device</button>`
    ) +
    kpis([
      ['Card readers', '3 online', 'Tap/chip enabled'],
      ['Scanners', '4 online', 'Lane and stockroom'],
      ['Printers', '2 online', 'Receipt + labels'],
      ['Cash drawers', '3 mapped', 'Lane level controls'],
      ['Diagnostics', 'Pass', 'Last run 9:12 AM'],
      ['Firmware', '1 update', 'Reader 02 pending'],
    ]) +
    grid(4,
      [['Card reader', 'Lane 2 terminal', 'Online', 'green', 92],
       ['Barcode scanner', 'Honeywell USB', 'Online', 'green', 100],
       ['Receipt printer', 'Epson TM-m30', 'Paper 28%', 'amber', 28],
       ['Cash drawer', 'APG drawer', 'Online', 'green', 95],
      ].map((x) => `<div class="card card-pad">
        <div class="lico b-${x[3]}" style="margin-bottom:12px">${ic('hardware')}</div>
        <div class="t-strong" style="font-size:14px">${x[0]}</div>
        <div class="t-sub" style="margin-bottom:9px">${x[1]}</div>
        ${badge(x[2], x[3])}
        <div class="bar" style="margin-top:12px"><i style="width:${x[4]}%"></i></div>
      </div>`).join(''));
  },

  /* ── Reports ── */
  reports() {
    return head('Reports',
      'US retail reports: best sellers, low stock, staff performance, tax collected, margin, omnichannel mix.',
      `<button class="btn">${ic('download')} Schedule email</button>
       <button class="btn btn-pri">Open report builder</button>`
    ) +
    kpis([
      ['Gross margin', '58.4%', 'vs last week', '+2.1 pts', 'up'],
      ['Best seller', 'Silk Scarf', '42 units sold'],
      ['Staff leader', 'Mia', '34 transactions'],
      ['Tax liability', '$712.94', 'Today'],
      ['Low stock risk', '$4,820', 'Projected lost sales'],
      ['Online mix', '32%', 'Of today’s revenue', '+1.2 pts', 'up'],
    ]) +
    grid(2,
      card('Best sellers', '',
        tbl(['Product', 'Units', 'Revenue', 'Margin'],
          [['Silk Scarf', '42', '$1,890', '64%'], ['Denim Jacket', '28', '$2,744', '55%'],
           ['Leather Belt', '21', '$1,134', '61%'], ['Linen Shirt', '18', '$1,152', '52%'],
          ].map((r) => `<tr>
            <td>${r[0]}</td><td class="num">${r[1]}</td>
            <td class="num">${r[2]}</td><td>${badge(r[3], 'green')}</td>
          </tr>`).join(''))
      ) +
      card('Manager alerts', '',
        rows([
          ['Low stock before weekend', 'Evening Dress size 6 likely to sell out', 'amber'],
          ['Tax filing upcoming', 'Colorado return due Friday', 'red'],
          ['High return rate', 'Leather Belt returns above normal', 'amber'],
          ['Strong associate performance', 'Mia conversion +12%', 'green'],
        ])
      )
    );
  },

  /* ── Onboarding ── */
  setup() {
    const checklist = [
      ['Store profile', 'Business name, EIN, address, timezone', true],
      ['Sales tax nexus', 'Texas configured, 3 states pending', true],
      ['Product import', '4,826 SKUs imported, 12 tax-code issues', true],
      ['Payments', 'Card reader paired, bank pending verification', true],
      ['Online channel', 'Storefront connected, BOPIS rules pending', false],
      ['Hardware', 'Receipt printer and label printer diagnostics', false],
      ['First sale drill', 'Run test transaction and receipt delivery', false],
    ];
    const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

    return head('Effortless Onboarding',
      'First-run setup adapted for US retail requirements.',
      `<button class="btn">${ic('download')} Import data</button>
       <button class="btn btn-pri">Continue setup</button>`
    ) +
    grid(2,
      card('Launch checklist', 'The store can go live after the high-priority steps',
        `<div class="card-pad">
          ${checklist.map(([title, sub, done]) => `<div class="lrow">
            <div class="cb${done ? ' on' : ''}">${done ? tick : ''}</div>
            <div style="flex:1"><div class="lt">${title}</div><div class="ls">${sub}</div></div>
            <button class="btn btn-sm">${done ? 'Review' : 'Start'}</button>
          </div>`).join('')}
        </div>`,
        badge('72% complete', 'blue')) +
      card('India to US configuration shift', '',
        tbl(['India POS reference', 'US POS version'],
          [['GST invoice and GSTIN', 'Sales tax receipt, EIN/state IDs'],
           ['UPI-heavy payments', 'Tap/chip card-reader first'],
           ['CGST/SGST split', 'State/county/city jurisdiction split'],
           ['Delivery challan', 'BOPIS / ship-from-store workflow'],
           ['GST filing exports', 'Sales tax liability and filing alerts'],
          ].map((r) => `<tr><td>${r[0]}</td><td class="t-strong">${r[1]}</td></tr>`).join(''))
      )
    );
  },
};
