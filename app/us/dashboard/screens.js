/* ═══════════════════════════════════════════════
   AMBEL POS  —  Screen Content
   All 10 screens, helpers, icons, nav data.
   Ported from the original static prototype to an ES module.
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
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] || ICONS.dash}</svg>`;
}

/* ── Nav Data ─────────────────────────────────── */
export const NAV_GROUPS = [
  ['Core',               ['dash','checkout','tax','sync']],
  ['Retail operations',  ['stock','orders','receipt','hardware','reports','setup']],
];
export const NAMES = {
  dash:'US Dashboard', checkout:'Fast Checkout', tax:'Sales Tax', sync:'Offline Sync',
  stock:'Inventory + Variants', orders:'Online Orders / BOPIS', receipt:'Receipts',
  hardware:'Hardware Setup', reports:'Reports', setup:'Onboarding',
};

/* ── Helpers ──────────────────────────────────── */
function money(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function badge(text, c = 'blue') {
  return `<span class="badge b-${c}">${text}</span>`;
}
function head(title, sub, actions = '') {
  return `<div class="page-head anim-up">
    <div class="page-head-left"><h2>${title}</h2><p>${sub}</p></div>
    <div class="page-actions">${actions}</div>
  </div>`;
}
function kpis(rows) {
  return `<div class="kpi-grid">${rows.map(([label, val, meta, trend, trendCls, spark, sparkColor]) => `
    <div class="kpi-card">
      <div class="kpi-top">
        <span class="kpi-label">${label}</span>
        ${trend ? `<span class="kpi-trend ${trendCls || 'up'}">${trend}</span>` : ''}
      </div>
      <div class="kpi-value num">${val}</div>
      <div class="kpi-meta">${meta}</div>
      ${spark ? `<div class="kpi-spark">${sparkSvg(spark, sparkColor || '#0058BA')}</div>` : ''}
    </div>`).join('')}</div>`;
}
function sparkSvg(data, color) {
  const W = 100, H = 26;
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - 4 - ((v - min) / rng) * (H - 8);
    return { x, y };
  });
  const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" fill="none" preserveAspectRatio="none">
    <polyline points="${line}" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="2.5" fill="${color}" stroke="white" stroke-width="1.2"/>
  </svg>`;
}
function tbl(cols, rows) {
  return `<div class="table-wrap"><table class="dtable">
    <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}
function tabs(items, on) {
  return `<div class="tabs">${items.map(x => `<button class="tab-btn${x === on ? ' on' : ''}">${x}</button>`).join('')}</div>`;
}

/* ── Screens ──────────────────────────────────── */
export const Screens = {

  /* ── Dashboard ── */
  dash() {
    const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
    return head('US Retail POS',
      `Austin store · ${today}`,
      `<a class="btn" href="/app">${ic('sync')} Open India POS</a>
       <button class="btn btn-primary">${ic('plus')} New sale</button>`
    ) +
    kpis([
      ['Net sales',     '$8,642.30', 'Austin store, today',        '+12.4%', 'up',   [42,55,48,62,70,68,82,79,86], '#0058BA'],
      ['Transactions',  '128',       'Avg ticket $67.52',           '+8.3%', 'up',   [60,78,72,90,105,98,112,119,128], '#10B981'],
      ['Tax collected', '$712.94',   'TX mixed local rate',          null,    null,   [280,320,310,380,420,390,440,510,713], '#F59E0B'],
      ['Online pickup', '18',        '7 ready · 3 late',            null,    null,   [8,12,10,14,18,15,16,17,18], '#0891B2'],
      ['Offline queue', '0',         'All transactions synced',     null,    null,   null, null],
      ['Low stock',     '14',        'Across size/color variants',  null,    null,   [20,18,16,15,14,16,13,14,14], '#EF4444'],
    ]) +
    `<div class="grid cols-3 anim-up delay-1">
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>Competitive focus</h3><p>Where this US version must win</p></div></div>
        <div class="card-body item-list">
          ${[['S','Square speed','Fewer clicks, payment-first checkout','blue'],
             ['O','Shopify sync','One inventory pool for web and store','green'],
             ['L','Lightspeed depth','Variants, transfers, POs, reports','amber'],
            ].map(x => `<div class="item-row">
              <div class="item-icon ico-${x[3]}">${x[0]}</div>
              <div class="item-body"><b>${x[1]}</b><small>${x[2]}</small></div>
              ${badge('Priority','blue')}
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>US table stakes</h3><p>Market-specific features</p></div></div>
        ${tbl(['Feature','Priority'],
          [['Sales tax automation','High'],['Offline billing + auto-sync','High'],
           ['Email / SMS receipts','High'],['E-commerce integration','High'],
           ['BOPIS','Medium'],['Hardware support','Medium'],
          ].map(r => `<tr><td>${r[0]}</td><td>${badge(r[1], r[1]==='High'?'green':'amber')}</td></tr>`).join(''))}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>Live store health</h3><p>Operational signals for manager</p></div></div>
        <div class="card-body item-list">
          ${[['Tax engine','Austin, TX rate resolved','green'],
             ['Card terminal','Tap/chip active on Lane 2','green'],
             ['Online stock','Synced 42 sec ago','cyan'],
             ['Receipt service','Email and SMS delivery active','blue'],
             ['BOPIS shelf','3 orders need staging','amber'],
            ].map(x => `<div class="item-row">
              <div class="item-icon ico-${x[2]}">${x[0][0]}</div>
              <div class="item-body"><b>${x[0]}</b><small>${x[1]}</small></div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  },

  /* ── Checkout ── */
  checkout() {
    const items = [['Denim Jacket','SKU DJ-204 / M / Indigo',98,1],['Silk Scarf','SKU SS-882 / Gold',45,2],['Leather Belt','SKU LB-122 / Tan',54,1]];
    const sub = items.reduce((s,x) => s + x[2]*x[3], 0);
    const tax = +(sub * .0825).toFixed(2);
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
      ['Denim Jacket','M / L / XL',98,0],['Silk Scarf','Gold / Ivory',45,1],
      ['Linen Shirt','S · M · L · XL',64,2],['Evening Dress','Sizes 2–12',188,3],
      ['Leather Belt','Tan / Black',54,4],['Canvas Tote','Natural / Navy',38,5],
    ];
    return head('Fast Checkout',
      'Square-style flow: scan barcode, resolve tax, tap card, send digital receipt.',
      `<button class="btn">${ic('sync')} Hold sale</button>
       <button class="btn btn-primary">${ic('card')} Charge ${money(total)}</button>`
    ) +
    `<div class="grid cols-checkout anim-up delay-1" style="align-items:start;">
      <div class="card">
        <div class="card-header">
          <div class="card-header-left"><h3>Product catalog</h3><p>Search, scan barcode, or pick a variant</p></div>
          ${tabs(['Popular','Apparel','Accessories','Online stock'],'Popular')}
        </div>
        <div class="product-grid">
          ${products.map(p => `<button class="prod-card">
            <div class="prod-swatch" style="background:${swatches[p[3]]}"></div>
            <div class="prod-info">
              <b>${p[0]}</b><span>${p[1]}</span>
              <strong class="num">${money(p[2])}</strong>
            </div>
          </button>`).join('')}
        </div>
      </div>
      <div class="card cart-flex">
        <div class="card-header">
          <div class="card-header-left"><h3>Cart</h3><p>Customer: Harper Lee</p></div>
          ${badge('Tax ready','green')}
        </div>
        <div class="cart-items">
          ${items.map(i => `<div class="cart-line">
            <div class="cart-name"><b>${i[0]}</b><span>${i[1]}</span></div>
            <div class="cart-right">
              <div class="qty-stepper">
                <button class="qty-btn">−</button>
                <span class="qty-num">${i[3]}</span>
                <button class="qty-btn">+</button>
              </div>
              <span class="line-total num">${money(i[2]*i[3])}</span>
            </div>
          </div>`).join('')}
        </div>
        <div class="cart-foot">
          <div class="total-row"><span>Subtotal</span><span class="num">${money(sub)}</span></div>
          <div class="total-row"><span>Austin sales tax 8.25%</span><span class="num">${money(tax)}</span></div>
          <div class="total-row"><span>Loyalty discount</span><span class="num" style="color:var(--green)">−$${loyalty.toFixed(2)}</span></div>
          <div class="total-row total-grand"><span>Total</span><span class="num">${money(total)}</span></div>
          <div class="pay-grid">
            <button class="btn btn-primary btn-lg btn-full pay-primary">${ic('card')} Tap / Chip · ${money(total)}</button>
            <button class="btn btn-lg btn-full">${ic('checkout')} Cash</button>
            <button class="btn btn-lg btn-full">${ic('mail')} Email receipt</button>
          </div>
        </div>
      </div>
    </div>`;
  },

  /* ── Sales Tax ── */
  tax() {
    return head('Sales Tax Automation',
      'US tax replaces GST: state, county, city, and product taxability resolved per transaction.',
      `<button class="btn">${ic('download')} Export tax log</button>
       <button class="btn btn-primary">${ic('plus')} Add nexus state</button>`
    ) +
    kpis([
      ['Active nexus',    '4 states', 'TX, CO, CA, NY',          null, null, [2,2,3,3,3,4,4,4,4], '#0058BA'],
      ['Rate source',     'Live',     'Updated 8 min ago',       '↑ Live', 'up', null, null],
      ['Tax collected',   '$712.94',  'Today',                   null, null, [280,320,310,380,420,390,440,510,713], '#F59E0B'],
      ['Exempt sales',    '$420.00',  '2 reseller certificates', null, null, null, null],
      ['Product codes',   '96%',      '12 need mapping',         '+4%', 'up', [80,85,88,90,92,94,95,95,96], '#10B981'],
      ['Filing alerts',   '1',        'Colorado due Friday',     null, null, null, null],
    ]) +
    `<div class="grid cols-2 anim-up delay-1">
      <div class="card">
        <div class="card-header">
          <div class="card-header-left"><h3>Tax breakdown preview</h3><p>Austin customer · apparel cart</p></div>
          ${badge('Auto-calculated','green')}
        </div>
        <div class="tax-map">
          <div class="tax-card">
            <h4>Jurisdiction split</h4>
            ${[['Texas state','6.250%'],['Travis county','0.000%'],['Austin city','1.000%'],['Special district','1.250%']]
              .map(r => `<div class="tax-row"><span>${r[0]}</span><b class="num">${r[1]}</b></div>`).join('')}
          </div>
          <div class="tax-card">
            <h4>Product taxability</h4>
            ${[['Apparel','Taxable','blue'],['Gift card','Non-taxable','amber'],['Shipping','Taxable in TX','blue'],['Resale cert.','Exempt','green']]
              .map(r => `<div class="tax-row"><span>${r[0]}</span>${badge(r[1],r[2])}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>Compliance queue</h3><p>Manager tasks</p></div></div>
        <div class="card-body item-list">
          ${[['Map product tax codes','12 SKUs missing category rules','amber'],
             ['Verify Colorado nexus','Threshold crossed this month','red'],
             ['Upload resale certificate','Acme Styling LLC','blue'],
             ['Review tax rounding','No mismatches found today','green'],
            ].map(x => `<div class="item-row">
              <div class="item-icon ico-${x[2]}">${x[0][0]}</div>
              <div class="item-body"><b>${x[0]}</b><small>${x[1]}</small></div>
              <button class="btn btn-sm">Open</button>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  },

  /* ── Offline Sync ── */
  sync() {
    return head('Offline Billing + Auto Sync',
      'Keep billing when internet drops, then reconcile payments, receipts, stock, and tax logs automatically.',
      `<button class="btn">${ic('sync')} Force sync</button>
       <button class="btn btn-primary">Run offline drill</button>`
    ) +
    kpis([
      ['Offline sales',   '0 queued',      'Last outage 11:42 AM',        null, null, [3,1,2,0,1,0,2,1,0], '#10B981'],
      ['Sync latency',    '42 sec',         'Online orders to store',      null, null, null, null],
      ['Conflict rate',   '0.2%',           '1 stock conflict today',      null, null, null, null],
      ['Local cache',     '2,418 SKUs',     'Available at checkout',       null, null, null, null],
      ['Payment mode',    'Card fallback',  'Store-and-forward ready',     null, null, null, null],
      ['Audit status',    'Clean',          'No missing receipts',         null, null, null, null],
    ]) +
    `<div class="card anim-up delay-1">
      <div class="card-header">
        <div class="card-header-left"><h3>Sync pipeline</h3><p>Local-first register architecture</p></div>
        ${badge('Healthy','green')}
      </div>
      <div class="sync-flow">
        ${[['1','Local sale','Cart, tax, receipt saved on device'],
           ['2','Payment token','Card auth stored safely'],
           ['3','Stock reserve','Variant quantity decremented locally'],
           ['4','Cloud reconcile','Orders, tax, receipts, reports updated'],
          ].map(x => `<div class="sync-step">
            <div class="step-num">Step ${x[0]}</div>
            <b>${x[1]}</b><small>${x[2]}</small>
          </div>`).join('')}
      </div>
    </div>
    <div class="grid cols-2 anim-up delay-2" style="margin-top:14px;">
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>Offline event log</h3></div></div>
        ${tbl(['Time','Event','Status'],
          [['11:42','Wi-Fi degraded','Recovered'],['11:43','3 sales stored locally','Synced'],
           ['11:45','Receipt batch delivered','Complete'],['11:46','Inventory reconciled','Complete'],
          ].map(r => `<tr>
            <td class="num">${r[0]}</td><td>${r[1]}</td>
            <td>${badge(r[2], r[2]==='Recovered'?'amber':'green')}</td>
          </tr>`).join(''))}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>Conflict resolver</h3></div></div>
        <div class="card-body item-list">
          ${[['Oversold variant','Evening Dress / Size 6 / Black','amber'],
             ['Duplicate receipt','None found','green'],
             ['Tax rate stale','None found','green'],
            ].map(x => `<div class="item-row">
              <div class="item-icon ico-${x[2]}">${x[0][0]}</div>
              <div class="item-body"><b>${x[0]}</b><small>${x[1]}</small></div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  },

  /* ── Inventory ── */
  stock() {
    return head('Inventory + Variants',
      'Lightspeed-style stock depth: size, color, material, channel, transfers, and purchase orders.',
      `<button class="btn">${ic('download')} Export CSV</button>
       <button class="btn btn-primary">${ic('plus')} Add SKU</button>`
    ) +
    kpis([
      ['SKUs',             '4,826',    '268 active styles',          null, null, [4200,4400,4500,4600,4700,4750,4790,4810,4826], '#0058BA'],
      ['Variant matrix',   '18,204',   'Size / color / material',    null, null, null, null],
      ['Low stock',        '14',        'Reorder suggested',         null, null, [20,18,16,15,14,16,13,14,14], '#EF4444'],
      ['Transfers',        '7 open',   'Austin to Denver',           null, null, null, null],
      ['Open POs',         '$42,880',  '12 suppliers',               null, null, null, null],
      ['Online reserved',  '38 units', 'Awaiting pickup',            null, null, null, null],
    ]) +
    `<div class="card anim-up delay-1">
      <div class="card-header">
        <div class="card-header-left"><h3>Variant stock table</h3><p>One source of truth across store and online</p></div>
        ${tabs(['All','Low stock','Transfers','PO needed'],'All')}
      </div>
      ${tbl(['Style','Variant','Austin','Denver','Online','Status','Action'],
        [['Denim Jacket','Indigo / M / Cotton','12','4','8','Healthy','Transfer'],
         ['Evening Dress','Black / 6 / Silk','1','0','2','Low stock','Create PO'],
         ['Linen Shirt','White / L / Linen','22','18','14','Healthy','—'],
         ['Leather Belt','Tan / 34 / Leather','0','5','3','Out in Austin','Transfer'],
         ['Silk Scarf','Gold / One size','8','3','12','Online fast mover','Reorder'],
        ].map(r => `<tr>
          <td><b>${r[0]}</b></td><td>${r[1]}</td>
          <td class="num">${r[2]}</td><td class="num">${r[3]}</td><td class="num">${r[4]}</td>
          <td>${badge(r[5], r[5].includes('Low')||r[5].includes('Out')?'amber':r[5].includes('fast')?'cyan':'green')}</td>
          <td><button class="btn btn-sm">${r[6]}</button></td>
        </tr>`).join(''))}
    </div>`;
  },

  /* ── Online Orders / BOPIS ── */
  orders() {
    return head('Online Orders / BOPIS',
      'Shopify-style omnichannel: online orders reserve stock, stores pick and stage pickup orders.',
      `<button class="btn">${ic('sync')} Sync channels</button>
       <button class="btn btn-primary">Create pickup order</button>`
    ) +
    kpis([
      ['Online orders',    '42',      'Today',                    null, null, [18,22,28,30,34,38,40,41,42], '#0058BA'],
      ['BOPIS ready',      '7',       'Customer notified',        null, null, null, null],
      ['Late pickups',     '3',       'Needs follow-up',          null, null, null, null],
      ['Ship from store',  '12',      'Packed today',             null, null, null, null],
      ['Sync conflicts',   '1',       'Variant allocation',       null, null, null, null],
      ['Revenue online',   '$3,840',  '32% of today',             null, null, [1200,1600,1900,2300,2800,3100,3400,3700,3840], '#10B981'],
    ]) +
    `<div class="grid cols-2 anim-up delay-1">
      <div class="card">
        <div class="card-header">
          <div class="card-header-left"><h3>Pickup queue</h3><p>Store associate view</p></div>
          ${tabs(['New','Picking','Ready','Late'],'New')}
        </div>
        ${tbl(['Order','Customer','Items','Promise','Status'],
          [['WEB-1842','Nora Patel','2','2:30 PM','Pick now','amber'],
           ['WEB-1838','Ethan Moore','1','Ready shelf B','Ready','green'],
           ['WEB-1833','Ava Brooks','4','Overdue 22m','Late','red'],
           ['WEB-1829','Liam Chen','1','Ship from store','Packed','blue'],
          ].map(r => `<tr>
            <td class="num"><b>${r[0]}</b></td><td>${r[1]}</td>
            <td class="num">${r[2]}</td><td>${r[3]}</td>
            <td>${badge(r[4],r[5])}</td>
          </tr>`).join(''))}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>Channel inventory sync</h3><p>Single stock pool by channel</p></div></div>
        <div class="card-body item-list">
          ${[['In-store POS','128 sales today, stock writes instant','green'],
             ['Shopify storefront','42 orders, synced 42 sec ago','green'],
             ['Instagram shop','6 orders, catalog live','cyan'],
             ['Marketplace','Not connected in MVP','amber'],
            ].map(x => `<div class="item-row">
              <div class="item-icon ico-${x[2]}">${x[0][0]}</div>
              <div class="item-body"><b>${x[0]}</b><small>${x[1]}</small></div>
              ${badge(x[2]==='amber'?'Later':'Live', x[2])}
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  },

  /* ── Receipts ── */
  receipt() {
    return head('Digital Receipts',
      'US default flow: email/SMS first, print optional, with return barcode and full tax breakdown.',
      `<button class="btn">${ic('mail')} Send test</button>
       <button class="btn btn-primary">${ic('receipt')} Preview receipt</button>`
    ) +
    `<div class="grid cols-2 anim-up delay-1">
      <div class="card">
        <div class="card-header">
          <div class="card-header-left"><h3>Receipt preferences</h3><p>Customer profile driven</p></div>
          ${badge('SMS allowed','green')}
        </div>
        <div class="card-body item-list">
          ${[['Email receipt','harper.lee@example.com','green'],
             ['SMS receipt','(512) 555-0198','green'],
             ['Printed receipt','Optional, cashier prompt','blue'],
             ['Marketing consent','Not opted in','amber'],
             ['Return barcode','Enabled on every receipt','cyan'],
            ].map(x => `<div class="item-row">
              <div class="item-icon ico-${x[2]}">${x[0][0]}</div>
              <div class="item-body"><b>${x[0]}</b><small>${x[1]}</small></div>
              <button class="btn btn-sm">Edit</button>
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>Receipt preview</h3></div></div>
        <div class="card-body">
          <div class="receipt-pre">
            <b>AMBEL POS — AUSTIN</b><br>
            100 Congress Ave, Austin TX 78701<br>
            Receipt #AUS-24819 · Cashier: Mia James<br>
            <hr>
            Denim Jacket M &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $98.00<br>
            Silk Scarf ×2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $90.00<br>
            Leather Belt &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $54.00<br>
            <hr>
            Subtotal &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $242.00<br>
            TX sales tax 8.25% &nbsp;&nbsp;&nbsp;&nbsp; $19.97<br>
            Loyalty &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; −$10.00<br>
            <b>Total &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $251.97</b><br>
            <hr>
            Return by Jul 2, 2026<br>
            Barcode: AUS24819-25197
          </div>
        </div>
      </div>
    </div>`;
  },

  /* ── Hardware ── */
  hardware() {
    return head('Hardware Setup',
      'US retail hardware: tap/chip card reader, barcode scanner, receipt printer, cash drawer, label printer.',
      `<button class="btn">${ic('sync')} Run diagnostics</button>
       <button class="btn btn-primary">${ic('plus')} Pair device</button>`
    ) +
    kpis([
      ['Card readers',  '3 online',   'Tap/chip enabled',       null, null, null, null],
      ['Scanners',      '4 online',   'Lane and stockroom',     null, null, null, null],
      ['Printers',      '2 online',   'Receipt + labels',       null, null, null, null],
      ['Cash drawers',  '3 mapped',   'Lane level controls',    null, null, null, null],
      ['Diagnostics',   'Pass',       'Last run 9:12 AM',       null, null, null, null],
      ['Firmware',      '1 update',   'Reader 02 pending',      null, null, null, null],
    ]) +
    `<div class="grid cols-4 anim-up delay-1">
      ${[['Card reader','Lane 2 terminal','Online','green',92],
         ['Barcode scanner','Honeywell USB','Online','green',100],
         ['Receipt printer','Epson TM-m30','Paper 28%','amber',28],
         ['Cash drawer','APG drawer','Online','green',95],
        ].map(x => `<div class="card">
          <div class="card-body" style="padding:18px 16px;">
            <div class="item-icon ico-${x[3]}" style="margin-bottom:12px;width:36px;height:36px;">${x[0][0]}</div>
            <div style="font-family:var(--f-head);font-size:14px;font-weight:600;color:var(--ink);margin-bottom:3px;">${x[0]}</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${x[1]}</div>
            ${badge(x[2],x[3])}
            <div class="meter"><div class="meter-fill" style="width:${x[4]}%"></div></div>
          </div>
        </div>`).join('')}
    </div>`;
  },

  /* ── Reports ── */
  reports() {
    return head('Reports',
      'US retail reports: best sellers, low stock, staff performance, tax collected, margin, omnichannel mix.',
      `<button class="btn">${ic('download')} Schedule email</button>
       <button class="btn btn-primary">Open report builder</button>`
    ) +
    kpis([
      ['Gross margin',    '58.4%',      '+2.1 pts vs last week',    '+2.1%', 'up',   [52,54,55,56,57,56,57,58,58.4], '#0058BA'],
      ['Best seller',     'Silk Scarf', '42 units sold',            null,    null,   null, null],
      ['Staff leader',    'Mia',        '34 transactions',          null,    null,   null, null],
      ['Tax liability',   '$712.94',    'Today',                    null,    null,   [280,320,310,380,420,390,440,510,713], '#F59E0B'],
      ['Low stock risk',  '$4,820',     'Projected lost sales',     null,    null,   null, null],
      ['Online mix',      '32%',        'Shopify-like sync view',   null,    null,   [18,20,22,25,28,29,30,31,32], '#0891B2'],
    ]) +
    `<div class="grid cols-2 anim-up delay-1">
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>Best sellers</h3></div></div>
        ${tbl(['Product','Units','Revenue','Margin'],
          [['Silk Scarf','42','$1,890','64%'],['Denim Jacket','28','$2,744','55%'],
           ['Leather Belt','21','$1,134','61%'],['Linen Shirt','18','$1,152','52%'],
          ].map(r => `<tr>
            <td>${r[0]}</td><td class="num">${r[1]}</td>
            <td class="num">${r[2]}</td><td>${badge(r[3],'green')}</td>
          </tr>`).join(''))}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>Manager alerts</h3></div></div>
        <div class="card-body item-list">
          ${[['Low stock before weekend','Evening Dress size 6 likely to sell out','amber'],
             ['Tax filing upcoming','Colorado return due Friday','red'],
             ['High return rate','Leather Belt returns above normal','amber'],
             ['Strong associate performance','Mia conversion +12%','green'],
            ].map(x => `<div class="item-row">
              <div class="item-icon ico-${x[2]}">${x[0][0]}</div>
              <div class="item-body"><b>${x[0]}</b><small>${x[1]}</small></div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  },

  /* ── Onboarding ── */
  setup() {
    return head('Effortless Onboarding',
      'Square-style first-run setup adapted for US retail requirements.',
      `<button class="btn">${ic('download')} Import data</button>
       <button class="btn btn-primary">Continue setup</button>`
    ) +
    `<div class="grid cols-2 anim-up delay-1">
      <div class="card">
        <div class="card-header">
          <div class="card-header-left"><h3>Launch checklist</h3><p>Store can go live after high-priority steps</p></div>
          ${badge('72% complete','blue')}
        </div>
        <div class="setup-list">
          ${[['Store profile','Business name, EIN, address, timezone',true],
             ['Sales tax nexus','Texas configured, 3 states pending',true],
             ['Product import','4,826 SKUs imported, 12 tax-code issues',true],
             ['Payments','Card reader paired, bank pending verification',true],
             ['Online channel','Storefront connected, BOPIS rules pending',false],
             ['Hardware','Receipt printer and label printer diagnostics',false],
             ['First sale drill','Run test transaction and receipt delivery',false],
            ].map((x,i) => `<div class="setup-row${x[2]?' done':''}">
              <div class="chk ${x[2]?'chk-done':'chk-todo'}">${x[2]?'✓':i+1}</div>
              <div class="setup-body"><b>${x[0]}</b><span>${x[1]}</span></div>
              <button class="btn btn-sm">${x[2]?'Review':'Start'}</button>
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-header-left"><h3>India to US configuration shift</h3></div></div>
        ${tbl(['India POS reference','US POS version'],
          [['GST invoice and GSTIN','Sales tax receipt, EIN/state IDs'],
           ['UPI-heavy payments','Tap/chip card-reader first'],
           ['CGST/SGST split','State/county/city jurisdiction split'],
           ['Delivery challan','BOPIS / ship-from-store workflow'],
           ['GST filing exports','Sales tax liability and filing alerts'],
          ].map(r => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join(''))}
      </div>
    </div>`;
  },
};
