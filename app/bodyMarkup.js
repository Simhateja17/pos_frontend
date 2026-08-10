// Auto-generated static markup extracted verbatim from the original HTML.
// Rendered via dangerouslySetInnerHTML so the original inline event handlers keep working.
export const BODY = `<div id="route-bar"></div>
<div class="app">
  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="sb-brand">
      <div class="sb-logo">
        <svg viewBox="0 0 120 120" role="img" aria-label="Ambel POS" style="width:38px;height:38px;display:block;stroke:none"><rect width="120" height="120" rx="34" fill="#4285F4"/><path d="M60 0L107 94L75.95 94L60 49.2L44.05 94L13 94Z" fill="#FFFFFF"/><rect x="26" y="85" width="68" height="9" rx="4.5" fill="#4285F4"/></svg>
      </div>
      <div><h1>Ambel POS</h1><p>Retail operations suite</p></div>
    </div>
    <nav class="sb-nav" id="nav"></nav>
    <div class="sb-foot">
      <div class="sys-pill" onclick="go('sync')" style="cursor:pointer">
        <b><span class="dot"></span>All systems operational</b>
        <p>Sync · UPI · Card terminal · Cloud printer</p>
      </div>
      <div class="switch-app" onclick="window.location='/'" style="cursor:pointer;gap:8px">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="5" r="1.85"/><circle cx="12" cy="5" r="1.85"/><circle cx="19" cy="5" r="1.85"/><circle cx="5" cy="12" r="1.85"/><circle cx="12" cy="12" r="1.85"/><circle cx="19" cy="12" r="1.85"/><circle cx="5" cy="19" r="1.85"/><circle cx="12" cy="19" r="1.85"/><circle cx="19" cy="19" r="1.85"/></svg>
        View landing page
      </div>
    </div>
  </aside>

  <!-- MAIN -->
  <div class="main">
    <header class="topbar">
      <div class="crumb">Ambel POS / <b id="crumb">Feature Map</b></div>
      <div class="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input placeholder="Search orders, products, customers, suppliers…  or type a command" />
        <span class="kbd">⌘K</span>
      </div>
      <div class="store-switch">
        <span class="store-pill active">Mumbai · Bandra</span>
        <span class="store-pill">Pune · FC Rd</span>
      </div>
      <div class="tb-icon" onclick="go('notifications')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.2a6 6 0 0 1 12 0c0 4.8 2 6 2 6H4s2-1.2 2-6z"/><path d="M10.3 19a1.9 1.9 0 0 0 3.4 0"/></svg><span class="ndot"></span></div>
      <div class="tb-user">
        <div class="tb-ava">PM</div>
        <div><div class="nm">Pooja Menon</div><div class="rl">Store Manager · Bandra</div></div>
      </div>
    </header>
    <main class="content" id="screen"></main>
  </div>
</div>
<div id="auth-layer">
  <div id="auth-scr" style="position:absolute;inset:0;overflow:hidden"></div>
</div>`;
