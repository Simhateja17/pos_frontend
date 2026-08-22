/* ============ ICONS: original Ambel glyph set ============ */
const I={
 dash:'<rect x="3" y="3" width="7.5" height="9.5" rx="2.2"/><rect x="3" y="15.5" width="7.5" height="5.5" rx="2.2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2.2"/><rect x="13.5" y="11" width="7.5" height="10" rx="2.2"/>',
 bill:'<path d="M5.5 8.5h13l-1 11a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8z"/><path d="M8.7 8.5V6.2a3.3 3.3 0 0 1 6.6 0v2.3"/><path d="M9.2 12v1M14.8 12v1"/>',
 orders:'<path d="M6.5 2.8h6.7l4.8 4.8V19a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2z"/><path d="M13 2.8V7a1.2 1.2 0 0 0 1.2 1.2H18"/><path d="M8.5 13h6M8.5 16.5h4"/>',
 register:'<rect x="2.5" y="6.5" width="19" height="12.5" rx="2.6"/><path d="M2.5 11h19"/><rect x="9" y="14.3" width="6" height="2.4" rx="1.2"/>',
 returns:'<path d="M4.5 8.5h9a6 6 0 0 1 0 12H8"/><path d="M8.3 4.2 4.5 8.5l3.8 4"/>',
 inventory:'<path d="M3.2 8.4 12 3.8l8.8 4.6-8.8 4.6z"/><path d="M3.2 8.4v7.3l8.8 4.6 8.8-4.6V8.4M12 13v7.7"/>',
 purchase:'<rect x="5" y="4" width="14" height="17.2" rx="2.4"/><path d="M9 4V3.2a1.2 1.2 0 0 1 1.2-1.2h3.6A1.2 1.2 0 0 1 15 3.2V4"/><path d="M8.6 12.2 11 14.6 16 9.6"/>',
 supplier:'<path d="M3 21V10l6 3.2V10l6 3.2V6l6 3.2V21z"/><path d="M2.5 21h19M6 17.5h0M12 17.5h0M18 17.5h0"/>',
 customer:'<circle cx="12" cy="8" r="3.6"/><path d="M5.6 20.2a6.4 6.4 0 0 1 12.8 0"/>',
 staff:'<circle cx="9" cy="8.2" r="3.1"/><path d="M3.5 19.4a5.5 5.5 0 0 1 11 0"/><path d="M16 5.4a3 3 0 0 1 0 5.8M17.2 13.6a5.5 5.5 0 0 1 3.3 5.3"/>',
 payments:'<rect x="2.5" y="5.5" width="19" height="13" rx="2.6"/><path d="M2.5 9.6h19"/><path d="M5.8 14.6H10"/>',
 expenses:'<path d="M7.5 5h9M7.5 9h9M9.5 5a3.8 3.8 0 0 1 0 8H7.5l7.5 6.2"/>',
 reports:'<path d="M4.2 4v14.8a1.5 1.5 0 0 0 1.5 1.5H20.5"/><path d="M8 15.2l3.6-4.1 3 2.6L20.2 7.6"/><circle cx="20.2" cy="7.6" r="1.1" fill="currentColor" stroke="none"/>',
 analytics:'<path d="M4.2 4v14.8a1.5 1.5 0 0 0 1.5 1.5H20.5"/><rect x="7.2" y="12.5" width="2.6" height="5.2" rx="1.1"/><rect x="11.7" y="8.3" width="2.6" height="9.4" rx="1.1"/><rect x="16.2" y="10.4" width="2.6" height="7.3" rx="1.1"/>',
 settings:'<circle cx="12" cy="12" r="3.4"/><path d="M12 2.6v3.1M12 18.3v3.1M21.4 12h-3.1M5.7 12H2.6M18.7 5.3l-2.2 2.2M7.5 16.5l-2.2 2.2M18.7 18.7l-2.2-2.2M7.5 7.5 5.3 5.3"/>',
 channels:'<circle cx="12" cy="12" r="2.4"/><path d="M7.2 7.2a6.8 6.8 0 0 0 0 9.6M16.8 7.2a6.8 6.8 0 0 1 0 9.6M4.2 4.2a11 11 0 0 0 0 15.6M19.8 4.2a11 11 0 0 1 0 15.6"/>',
 challan:'<path d="M2.6 6.4A1.5 1.5 0 0 1 4.1 5h8.4a1.5 1.5 0 0 1 1.5 1.5V16H2.6z"/><path d="M14 9h3.6l3.4 3.6V16H14z"/><circle cx="7" cy="18.4" r="2"/><circle cx="17.4" cy="18.4" r="2"/>',
 receivable:'<path d="M12 2.8v9.4"/><path d="M8.4 8.6 12 12.2l3.6-3.6"/><path d="M4.5 13.5a7.5 7.5 0 0 0 15 0"/>',
 creditnote:'<path d="M6.5 2.8h6.7l4.8 4.8V19a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2z"/><path d="M13 2.8V7a1.2 1.2 0 0 0 1.2 1.2H18"/><path d="M14.5 11.5 9.5 17.5"/><circle cx="10" cy="12.3" r="1"/><circle cx="14" cy="16.7" r="1"/>',
 onboard:'<path d="M12 2.6c2.9 1.6 4.8 4.6 4.8 8 0 2-.9 3.8-1.9 4.9l-2.9 1.9-2.9-1.9c-1-1.1-1.9-2.9-1.9-4.9 0-3.4 1.9-6.4 4.8-8z"/><circle cx="12" cy="9.6" r="1.7"/><path d="M9.2 16.6 7.4 21M14.8 16.6 16.6 21"/>',
 sync:'<path d="M20 12a8 8 0 0 1-14.4 4.8M4 12A8 8 0 0 1 18.4 7.2"/><path d="M18.4 3.4v3.8h-3.8M5.6 20.6v-3.8h3.8"/>',
 hardware:'<rect x="3" y="4.5" width="18" height="11" rx="2.2"/><path d="M8.5 19.5h7M12 15.5v4M7.5 9h5"/>',
 cfd:'<rect x="3" y="4" width="18" height="12" rx="2.2"/><path d="M8 20h8M12 16v4"/><path d="M9.3 10.2 11 11.9l3.4-3.4"/>',
 ai:'<path d="M12 3.2l1.7 4.9 4.9 1.7-4.9 1.7L12 16.4l-1.7-4.9L5.4 9.8l4.9-1.7z"/><path d="M18.4 3.4l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
 bell:'<path d="M6 9.2a6 6 0 0 1 12 0c0 4.8 2 6 2 6H4s2-1.2 2-6z"/><path d="M10.3 19a1.9 1.9 0 0 0 3.4 0"/>',
 wa:'<path d="M4 20l1.4-3.9A8 8 0 1 1 8.9 19.6z"/><path d="M9 10.5c.6 2.2 2.3 3.9 4.5 4.5"/>',
 token:'<path d="M4 7.6A1.6 1.6 0 0 1 5.6 6h12.8A1.6 1.6 0 0 1 20 7.6v2.4a2 2 0 0 0 0 4v2.4a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 16.4V14a2 2 0 0 0 0-4z"/><path d="M12 8.4v1.4M12 12.2v1.4M12 16v1.4"/>',
 swap:'<path d="M4 8.4h13.2M14 5.2l3.4 3.2-3.4 3.2"/><path d="M20 15.6H6.8M10 12.4l-3.4 3.2L10 18.8"/>',
 bundle:'<rect x="3.6" y="8.6" width="16.8" height="11.8" rx="1.8"/><path d="M3.6 12.6h16.8M12 8.6v11.8"/><path d="M12 8.6C12 6 10.6 4.6 9 4.6S6.4 6.4 8 7.4s4 1.2 4 1.2zM12 8.6c0-2.6 1.4-4 3-4s2.6 1.8 1 2.8-4 1.2-4 1.2z"/>',
 commission:'<circle cx="12" cy="9" r="5"/><path d="M9.3 13.4 7.6 21l4.4-2.6L16.4 21l-1.7-7.6"/><path d="M12 6.4v5.2M10.2 8.2h3"/>',
 grid9:'<rect x="3" y="3" width="7.4" height="7.4" rx="2.4"/><rect x="13.6" y="3" width="7.4" height="7.4" rx="2.4"/><rect x="3" y="13.6" width="7.4" height="7.4" rx="2.4"/><rect x="13.6" y="13.6" width="7.4" height="7.4" rx="2.4"/>',
 barcode:'<path d="M4 5v14M7 5v14M10 5.5v9.5M13 5v14M16 5.5v9.5M20 5v14"/>',
 doc:'<path d="M6.5 2.8h6.7l4.8 4.8V19a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2z"/><path d="M13 2.8V7a1.2 1.2 0 0 0 1.2 1.2H18M8.5 13h7M8.5 16.5h4.5"/>',
 api:'<path d="M9 6.5 3.5 12 9 17.5M15 6.5 20.5 12 15 17.5"/><path d="M13.2 5 10.8 19"/>',
 check:'<path d="M5 12.6 9.8 17.4 19.4 6.6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 bolt:'<path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z"/>',
};
function ic(name,w){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" ${w?`width="${w}" height="${w}"`:''}>${I[name]||''}</svg>`}

/* ============ NAV CONFIG ============ */
const NAV=[
 {g:'Overview',items:[{id:'map',ic:'grid9',t:'Feature Map'}]},
 {g:'Sales',items:[
   {id:'dashboard',ic:'dash',t:'Dashboard'},
   {id:'billing',ic:'bill',t:'Billing'},
   {id:'orders',ic:'orders',t:'Sales / Bills',count:'342'},
   {id:'register',ic:'register',t:'Register'},
   {id:'returns',ic:'returns',t:'Returns & Exchange',count:'4'},
   {id:'channels',ic:'channels',t:'Sales Channels',badge:'new'},
   {id:'challan',ic:'challan',t:'Delivery Challan',badge:'new'},
 ]},
 {g:'Stock & Catalog',items:[
   {id:'inventory',ic:'inventory',t:'Inventory'},
   {id:'purchases',ic:'purchase',t:'Purchases'},
   {id:'suppliers',ic:'supplier',t:'Suppliers'},
 ]},
 {g:'Customers & Team',items:[
   {id:'customers',ic:'customer',t:'Customers'},
   {id:'whatsapp',ic:'wa',t:'WhatsApp Connect',badge:'new'},
   {id:'staff',ic:'staff',t:'Staff'},
 ]},
 {g:'Money',items:[
   {id:'payments',ic:'payments',t:'Payments'},
   {id:'expenses',ic:'expenses',t:'Expenses'},
   {id:'receivables',ic:'receivable',t:'Receivables',badge:'new'},
   {id:'creditnotes',ic:'creditnote',t:'Credit / Debit Notes',badge:'new'},
 ]},
 {g:'Insights',items:[
   {id:'reports',ic:'reports',t:'Reports'},
   {id:'analytics',ic:'analytics',t:'Analytics'},
   {id:'copilot',ic:'ai',t:'AI Copilot',badge:'new'},
 ]},
 {g:'System',items:[
   {id:'onboarding',ic:'onboard',t:'Onboarding',badge:'new'},
   {id:'sync',ic:'sync',t:'Offline & Sync',badge:'new'},
   {id:'hardware',ic:'hardware',t:'Hardware & Devices',badge:'new'},
   {id:'cfd',ic:'cfd',t:'Customer Display',badge:'new'},
   {id:'notifications',ic:'bell',t:'Notifications',badge:'new'},
   {id:'settings',ic:'settings',t:'Settings'},
 ]},
];

function buildNav(){
 let h='',ni=0;
 NAV.forEach(grp=>{
   h+=`<div class="sb-group">${grp.g}</div>`;
   grp.items.forEach(it=>{
     h+=`<div class="nav-item nav-anim" style="animation-delay:${(ni++*0.03).toFixed(2)}s" data-id="${it.id}" onclick="go('${it.id}')">${ic(it.ic)}<span>${it.t}</span>${it.count?`<span class="count">${it.count}</span>`:''}${it.badge?`<span class="ni-badge ${it.badge}">${it.badge}</span>`:''}</div>`;
   });
 });
 document.getElementById('nav').innerHTML=h;
}
buildNav();

const TITLES={};NAV.forEach(g=>g.items.forEach(i=>TITLES[i.id]=i.t));TITLES.settingsdetail='Settings';
function go(id){
 window.CUR=id;
 const rb=document.getElementById('route-bar');
 if(rb){rb.classList.add('go');rb.style.width='0';requestAnimationFrame(()=>{rb.style.width='78%';});}
 document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.id===id));
 document.getElementById('crumb').textContent=TITLES[id]||'Feature Map';
 const el=document.getElementById('screen');
 el.innerHTML=(SCREENS[id]||SCREENS.map)();
 el.classList.remove('fade');void el.offsetWidth;el.classList.add('fade');
 document.querySelector('.content').scrollTo?.(0,0);window.scrollTo(0,0);
 animateScreen();
 if(rb){setTimeout(()=>{rb.style.width='100%';setTimeout(()=>{rb.classList.remove('go');rb.style.width='0';},260);},230);}
}
window.go=go;

/* ============ POST-RENDER ANIMATIONS ============ */
function animateScreen(){
 const root=document.getElementById('screen');
 if(!root)return;
 // 1: staggered block entrance (outermost blocks only)
 const sel='.page-head, .note-strip, .legend, .anno, .kpi, .card, .map-card';
 let cands=[...root.querySelectorAll(sel)];
 const set=new Set(cands);
 cands=cands.filter(el=>{let p=el.parentElement;while(p&&p!==root){if(set.has(p))return false;p=p.parentElement;}return true;});
 cands.forEach((el,i)=>{const d=Math.min(i,16)*0.05;el.style.animation='riseIn .55s var(--ease) '+d.toFixed(2)+'s backwards';});
 // 2: count-up KPI values
 root.querySelectorAll('.kpi .kv').forEach(countUp);
 // 3: fill progress bars from zero
 root.querySelectorAll('.bar > i').forEach(b=>{const w=b.style.width;if(!w)return;b.style.width='0';requestAnimationFrame(()=>requestAnimationFrame(()=>{b.style.width=w;}));});
}
function countUp(el){
 const txt=el.textContent;
 const m=txt.match(/[\d][\d,]*\.?\d*/);
 if(!m)return;
 const raw=m[0],numStr=raw.replace(/,/g,''),target=parseFloat(numStr);
 if(!isFinite(target))return;
 const decimals=(numStr.split('.')[1]||'').length;
 const group=raw.includes(',')||(decimals===0&&target>=1000);
 const prefix=txt.slice(0,m.index),suffix=txt.slice(m.index+raw.length);
 const fmt=v=>decimals>0?v.toFixed(decimals):(group?Math.round(v).toLocaleString('en-IN'):String(Math.round(v)));
 const dur=950,start=performance.now();
 function frame(now){
  let p=Math.min(1,(now-start)/dur);p=1-Math.pow(1-p,3);
  el.textContent=prefix+fmt(target*p)+suffix;
  if(p<1)requestAnimationFrame(frame);else el.textContent=prefix+fmt(target)+suffix;
 }
 requestAnimationFrame(frame);
}
/* KPI cursor glow tracking */
document.addEventListener('pointermove',e=>{
 const k=e.target.closest&&e.target.closest('.kpi');
 if(!k)return;
 const r=k.getBoundingClientRect();
 k.style.setProperty('--mx',(e.clientX-r.left)+'px');
 k.style.setProperty('--my',(e.clientY-r.top)+'px');
});

const SCREENS={};

/* ============ COMPONENT HELPERS ============ */
function head(t,sub,actions){return `<div class="page-head"><div><h2>${t}</h2><div class="sub">${sub}</div></div><div class="head-actions">${actions||''}</div></div>`}
/* ---- abstract on-brand illustrations ---- */
function heroArt(){
 const tw=[[300,52,7,'0s'],[256,40,3.5,'.6s'],[372,150,5,'1.2s'],[214,150,4,'.3s'],[400,84,3,'1.6s'],[332,196,4.5,'.9s'],[170,96,3,'2s'],[284,210,3.5,'1.4s']]
  .map(d=>`<circle class="ha-tw" style="animation-delay:${d[3]}" cx="${d[0]}" cy="${d[1]}" r="${d[2]}" fill="#fff"/>`).join('');
 return `<svg class="hero-art" viewBox="0 0 440 300" fill="none" preserveAspectRatio="xMidYMid meet">
   <g class="ha-spin" style="transform-origin:330px 110px">
     <circle cx="330" cy="110" r="46" stroke="rgba(255,255,255,.28)" stroke-width="1.4"/>
     <circle cx="330" cy="110" r="74" stroke="rgba(255,255,255,.18)" stroke-width="1.4" stroke-dasharray="3 9"/>
     <circle cx="330" cy="110" r="104" stroke="rgba(255,255,255,.12)" stroke-width="1.4"/>
   </g>
   <g class="ha-spin-r" style="transform-origin:330px 110px">
     <circle cx="330" cy="64" r="4.5" fill="#A9C7FF"/>
     <circle cx="434" cy="110" r="3.5" fill="rgba(255,255,255,.8)"/>
     <circle cx="330" cy="214" r="5" fill="rgba(255,255,255,.5)"/>
   </g>
   <path class="ha-fa" d="M30 246C140 178 196 262 300 150 348 98 392 120 430 96" stroke="rgba(255,255,255,.34)" stroke-width="2" stroke-linecap="round"/>
   <path class="ha-fb" d="M20 200C120 150 210 220 320 120" stroke="rgba(108,159,255,.5)" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="2 8"/>
   <g class="ha-fa"><rect x="250" y="86" width="46" height="46" rx="13" transform="rotate(14 273 109)" stroke="rgba(255,255,255,.6)" stroke-width="1.6"/></g>
   ${tw}
 </svg>`;
}
function hero(tag,title,sub,actions,stats){
 return `<div class="hero">${heroArt()}
   <div class="htag">${tag}</div>
   <h2>${title}</h2>
   <p class="hsub">${sub}</p>
   ${actions?`<div class="hero-actions">${actions}</div>`:''}
   ${stats?`<div class="hero-stats">${stats.map(s=>`<div class="hero-stat"><div class="hv">${s.v}</div><div class="hl">${s.l}</div></div>`).join('')}</div>`:''}
 </div>`;
}
function spot(art,title,sub){return `<div class="spot">${art}<div class="st">${title}</div><div class="ss">${sub}</div></div>`}
function spotCart(){return `<svg viewBox="0 0 120 120" fill="none"><circle class="sp-tw" cx="96" cy="26" r="3" fill="#6C9FFF"/><circle class="sp-tw" style="animation-delay:.8s" cx="22" cy="30" r="2.4" fill="#6C9FFF"/><g class="sp-fa"><path d="M30 40h60l-5 44a8 8 0 0 1-8 7H43a8 8 0 0 1-8-7z" stroke="#0058BA" stroke-width="2.4" stroke-linejoin="round"/><path d="M44 40v-6a16 16 0 0 1 32 0v6" stroke="#6C9FFF" stroke-width="2.4" stroke-linecap="round"/><path d="M52 60v14M68 60v14" stroke="#A9C7FF" stroke-width="2.4" stroke-linecap="round"/></g></svg>`}
function spotSearch(){return `<svg viewBox="0 0 120 120" fill="none"><g class="sp-fa"><circle cx="54" cy="52" r="26" stroke="#0058BA" stroke-width="2.6"/><path d="M73 71l16 16" stroke="#0058BA" stroke-width="2.6" stroke-linecap="round"/><path d="M44 52h20M54 42v20" stroke="#A9C7FF" stroke-width="2.4" stroke-linecap="round"/></g><circle class="sp-tw" cx="92" cy="34" r="3" fill="#6C9FFF"/></svg>`}
function kpis(arr,cols){return `<div class="kpi-row" style="grid-template-columns:repeat(${cols||arr.length},1fr)">`+arr.map((k,i)=>`<div class="kpi ${i===0&&k.lead!==false?'lead':''}"><div class="kl">${k.l}${k.flag?` <span class="flag ${k.flag}">${k.flag}</span>`:''}</div><div class="kv">${k.v}</div><div class="km">${k.m||''}</div></div>`).join('')+`</div>`}
function flag(t){const m={NEW:'new','★':'star',AI:'ai',IMPROVE:'improve',EXISTING:'exist'};return `<span class="flag ${m[t]||'exist'}">${t}</span>`}
function tabs(arr,active){return `<div class="tabs">`+arr.map(t=>`<span class="tab ${t===active?'active':''}">${t}</span>`).join('')+`</div>`}
function seg(arr,active){return `<div class="seg">`+arr.map(t=>`<b class="${t===active?'active':''}">${t}</b>`).join('')+`</div>`}
function cb(on){return `<div class="cb ${on?'on':''}">${on?ic('check',12):''}</div>`}
function tg(on){return `<div class="tg ${on?'on':''}"></div>`}

/* ============ FEATURE MAP ============ */
SCREENS.map=()=>{
 const legend=`<div class="legend">
   <div class="li">${flag('EXISTING')} Already live in current build</div>
   <div class="li">${flag('IMPROVE')} Enhancement to an existing screen</div>
   <div class="li">${flag('NEW')} New module / closes a competitor gap</div>
   <div class="li">${flag('★')} Differentiator: beyond Zoho & Square</div>
   <div class="li">${flag('AI')} Prophet / ML-powered</div>
 </div>`;
 const groups=[
  {ico:'dash',t:'Dashboard',f:[
    ['Live KPI bar, Action Center, Counter Performance','EXISTING'],
    ['Flash-alert row: terminal offline / UPI down / printer paper','IMPROVE'],
    ['Action Center → full approval inbox (severity · owner · SLA · resolve-in-place)','IMPROVE'],
    ['Per-counter live queue depth widget','★'],
  ]},
  {ico:'bill',t:'Billing / Checkout',f:[
    ['Cart, loyalty inline, split tender, GST split, frequently-sold-together','EXISTING'],
    ['Cashier Mode ⇄ Manager Mode toggle (hide margin/supplier for cashiers)','★'],
    ['Send bill on WhatsApp (next to Print)','★'],
    ['Issue queue token from billing','★'],
    ['Ad-hoc bundle / combo builder ("any 3 for ₹3,000")','★'],
    ['Expiry-based auto-discount applied inline','★'],
    ['Real-time AI cashier coaching nudge','AI'],
  ]},
  {ico:'returns',t:'Returns & Exchange',f:[
    ['Returns, refund method, stock reversal, approval, audit trail','EXISTING'],
    ['Exchange / Swap flow: return + new item, one net payment & bill','★'],
    ['Formal Credit Note document generation','NEW'],
  ]},
  {ico:'channels',t:'Sales Channels',f:[
    ['Omnichannel hub: online store, marketplace & social orders','NEW'],
    ['Real-time channel + store inventory sync','NEW'],
  ]},
  {ico:'challan',t:'Delivery Challan',f:[
    ['Dispatch-before-invoice document (B2B & inter-branch)','NEW'],
    ['Convert challan → invoice in one click','NEW'],
  ]},
  {ico:'inventory',t:'Inventory',f:[
    ['Stock, reserved, reorder, near-expiry, movement, import/export','EXISTING'],
    ['Variant matrix editor (size × colour)','★'],
    ['Barcode label designer + print queue (triggered from GRN)','NEW'],
    ['Guided import preview with validation errors','NEW'],
    ['Mobile/tablet stock-count flow','NEW'],
    ['Expiry auto-discount rule engine','★'],
    ['Prophet smart-reorder suggestions','AI'],
  ]},
  {ico:'purchase',t:'Purchases',f:[
    ['PO → GRN → bill matching, landed cost, vendor returns','EXISTING'],
    ['Vendor Credits document','NEW'],
    ['GRN mismatch workflow with photos & supplier claims','IMPROVE'],
    ['Auto-suggested PO from velocity & seasonality','AI'],
  ]},
  {ico:'supplier',t:'Suppliers',f:[
    ['Payables, lead time, GSTIN health, ledger','EXISTING'],
    ['Supplier scorecard: OTIF, fill-rate, price-drift, quality','★'],
  ]},
  {ico:'customer',t:'Customers',f:[
    ['Loyalty tiers, gift cards, segments, lifetime value','EXISTING'],
    ['Campaign builder: WhatsApp/SMS, consent, audience','IMPROVE'],
  ]},
  {ico:'wa',t:'WhatsApp Connect',f:[
    ['Verified Business API number + green-tick & quality rating','NEW'],
    ['Bill, order-update, abandoned-cart & reminder automations','NEW'],
    ['Shared team conversations inbox','NEW'],
    ['Consent-checked broadcasts with revenue attribution','★'],
    ['DLT & Meta-approved template library','NEW'],
  ]},
  {ico:'staff',t:'Staff',f:[
    ['Roster, shifts, clock-in, per-staff sales & variance','EXISTING'],
    ['Full permission matrix editor','NEW'],
    ['Commission / incentive tracker with auto payout','★'],
    ['AI cashier performance scoring','AI'],
  ]},
  {ico:'payments',t:'Payments',f:[
    ['UTR matching, settlement, reconciliation checklist, failed queue','EXISTING'],
    ['PSP settlement tracker (Razorpay · PhonePe · Pine Labs · HDFC)','★'],
    ['Pending-UPI resolution queue + EOD mismatch report','IMPROVE'],
  ]},
  {ico:'receivable',t:'Receivables',f:[
    ['Aging: Due vs Overdue for credit/corporate customers','NEW'],
    ['WhatsApp/SMS payment reminders','★'],
  ]},
  {ico:'reports',t:'Reports & Analytics',f:[
    ['GST-ready exports, scheduling, audit pack, AI suggested actions','EXISTING'],
    ['Drag-and-drop custom report builder','NEW'],
    ['Direct GSTR-1 filing from POS','★'],
    ['Real footfall vs conversion (sensor integration)','★'],
    ['Prophet demand forecast & anomaly detection','AI'],
  ]},
  {ico:'ai',t:'AI Copilot',f:[
    ['Operational assistant: "why are margins down?", "reorder for weekend"','NEW'],
    ['Every recommendation shows data basis + needs approval','★'],
  ]},
  {ico:'onboard',t:'Onboarding & Setup',f:[
    ['Guided first-run setup: profile, GST, import, hardware, first sale','NEW'],
    ['<30-minute completable progress checklist','NEW'],
  ]},
  {ico:'sync',t:'Offline & Sync',f:[
    ['True offline billing with local queue','★'],
    ['Sync conflict resolution centre + unsynced-bill dashboard','NEW'],
  ]},
  {ico:'hardware',t:'Hardware & Devices',f:[
    ['Device pairing, health, printer/scanner/drawer test','NEW'],
  ]},
  {ico:'cfd',t:'Customer-Facing Display',f:[
    ['Second-screen cart, GST, loyalty earned, final amount','★'],
  ]},
  {ico:'settings',t:'Settings & Platform',f:[
    ['Business, tax, payments, team, modules, integrations cards','EXISTING'],
    ['Integration marketplace with live status','NEW'],
    ['Document vault (GST/FSSAI/lease per store & supplier)','NEW'],
    ['Developer API & webhooks','NEW'],
    ['Audit log explorer','NEW'],
  ]},
 ];
 const cards=groups.map(g=>`<div class="map-card"><div class="mc-h"><span class="mc-ico">${ic(g.ico)}</span>${g.t}</div>${g.f.map(f=>`<div class="feat"><div class="fx"><div class="fn">${f[0]}</div></div>${flag(f[1])}</div>`).join('')}</div>`).join('');
 const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
 const flagship=[
  {ico:'ai',t:'AI Copilot',d:'Ask "why are margins down?" Every answer shows its data basis and waits for your approval.',badge:'NEW',scr:'copilot'},
  {ico:'bill',t:'Cashier ⇄ Manager Mode',d:'One tap hides cost & margin for billing speed, or reveals them for managers. Unique to Ambel.',badge:'★',scr:'billing'},
  {ico:'ai',t:'Prophet Smart Reorder',d:'ML demand forecast surfaces exactly what to reorder before the weekend rush.',badge:'AI',scr:'inventory'},
  {ico:'inventory',t:'Variant Matrix Editor',d:'Size × colour grid at a glance: tap any cell to adjust stock, set reorder or print labels.',badge:'★',scr:'inventory'},
  {ico:'swap',t:'One-Bill Exchange',d:'Return + new item as a single net payment, one GST calc, one bill, not two transactions.',badge:'★',scr:'returns'},
  {ico:'supplier',t:'Supplier Scorecard',d:'OTIF, fill-rate & price-drift shown right before you raise a PO: a real negotiation edge.',badge:'★',scr:'suppliers'},
  {ico:'payments',t:'PSP Settlement Tracker',d:'India-native: match UTRs across Razorpay, PhonePe, Pine Labs & HDFC to every invoice.',badge:'★',scr:'payments'},
  {ico:'wa',t:'WhatsApp Connect',d:'Bills, order updates, payment reminders & broadcasts: all from one verified number.',badge:'NEW',scr:'whatsapp'},
  {ico:'sync',t:'True Offline Billing',d:'Keep selling when the internet drops: a local queue syncs automatically on reconnect.',badge:'★',scr:'sync'},
 ];
 const spotlight=`<div class="spotlight">
   <div class="spot-head"><span class="sh-ico">${ic('bolt')}</span><div><h3>Flagship features</h3><div class="sh-sub">The unique differentiators: beyond Zoho &amp; Square. Tap any to jump straight in.</div></div></div>
   <div class="spot-grid">${flagship.map(f=>`<div class="spot-card" onclick="go('${f.scr}')"><div class="sc-top"><span class="sc-ico">${ic(f.ico)}</span>${flag(f.badge)}</div><div class="sc-title">${f.t}</div><div class="sc-desc">${f.d}</div><div class="sc-open">Open ${arrow}</div></div>`).join('')}</div>
 </div>`;
 return hero('Ambel POS · Feature Integration Map',
   'Everything we&rsquo;re building, mapped onto the live product',
   'A clickable spec derived from the Zoho &amp; Square competitive reports. Every module below opens a high-fidelity mock: new and enhanced features are badged and annotated so you know exactly what goes where.',
   `<span class="hero-btn solid" onclick="go('dashboard')">${ic('dash')} Start tour</span><span class="hero-btn" onclick="go('billing')">${ic('bolt')} Open Billing</span>`,
   [{v:'22',l:'Modules'},{v:'40+',l:'New features'},{v:'2',l:'Stores live'},{v:'₹4.84 L',l:'Sales today'}])
   + spotlight
   + legend
   + `<div class="section-label" style="margin:4px 0 14px">All modules: full integration map</div>`
   + `<div class="grid" style="grid-template-columns:repeat(3,1fr)">${cards}</div>`;
};
/* ============ DASHBOARD ============ */
SCREENS.dashboard=()=>{
 const k=kpis([
   {l:"Today's Sales",v:'₹4.84 L',m:'<span class="up">▲ 12.4%</span> vs yesterday · 342 bills'},
   {l:'Avg Bill Value',v:'₹2,550',m:'<span class="up">▲ 8.0%</span> 30-day avg ₹2,360'},
   {l:'Gross Margin',v:'37.8%',m:'<span class="dn">▼ 1.2%</span> Target 40%'},
   {l:'Cash Drawer',v:'₹50,240',m:'<span class="badge b-amber" style="margin-top:2px"><span class="dot-a"></span>1 mismatch · C-3</span>'},
   {l:'Low Stock',v:'14',m:'3 critical · 11 reorder'},
   {l:'UPI Settlement',v:'₹2.18 L',m:'Expected today 8:00 PM · Razorpay'},
 ],6);
 const inbox=[
   ['returns','b-amber','2 refunds awaiting approval','RET-1143 · ₹1,499 · Karan Singh','Review','High','Pooja','12 min'],
   ['payments','b-amber','Counter 3 cash variance: ₹100','Reason pending · Meera Desai','Resolve','Med','Meera','past due'],
   ['purchase','b-blue','PO-2026-0186 due today','Aravind Mills · 180 units · 0 received','Receive','Med','Karan','today'],
   ['inventory','b-red','COU-FRG-1108 out of stock','Banarasi Dupatta · last sold 12 hrs ago','Raise PO','High','Karan','N/A'],
 ];
 const inboxRows=inbox.map(r=>`<div class="lrow">
   <div class="lico ${r[1]}">${ic(r[0])}</div>
   <div style="flex:1"><div class="lt">${r[2]}</div><div class="ls">${r[3]} · <b style="color:var(--muted)">${r[5]} priority · ${r[6]} · SLA ${r[7]}</b></div></div>
   <button class="btn btn-sm btn-ghost">${r[4]}</button></div>`).join('');
 return head('Dashboard','Today · 03 May 2026 · Mumbai · Bandra',
   `<button class="btn">${ic('reports')} Export day</button><button class="btn-grad btn">${ic('bolt')} Open Register</button>`)
  + k
  + `<div class="split-2">
      <div class="card">
        <div class="card-h"><div><h3>Sales trend</h3><div class="ch-sub">Last 14 days · area = revenue, bars = profit</div></div>${seg(['7D','14D','30D'],'14D')}</div>
        <div class="card-pad">${sparkChart()}</div>
        <div class="card-h" style="border-top:1px solid var(--border-soft)"><div><h3>Live queue depth ${flag('★')}</h3><div class="ch-sub">Real-time held bills & token waits per counter</div></div></div>
        <div class="card-pad" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          ${[['Counter 1','3 waiting','6 min'],['Counter 2','7 waiting','14 min'],['Counter 3','1 waiting','2 min']].map(c=>`<div style="border:1px solid var(--border-soft);border-radius:10px;padding:13px"><div style="font-size:12px;color:var(--muted);font-weight:600">${c[0]}</div><div class="num" style="font-size:22px;font-weight:700;margin-top:4px">${c[1].split(' ')[0]}<span style="font-size:12px;color:var(--muted);font-weight:500"> waiting</span></div><div class="ls">avg wait ${c[2]}</div></div>`).join('')}
        </div>
        
      </div>
      <div class="card">
        <div class="card-h"><div><h3>Action Center ${flag('IMPROVE')}</h3><div class="ch-sub">Now a cross-module approval inbox</div></div><span class="badge b-blue">7 items</span></div>
        <div class="card-pad" style="padding-top:4px">${inboxRows}</div>
        
      </div>
    </div>`;
};
function annoPad(x){return `<div style="padding:0 18px 16px">${x}</div>`}
function smoothPath(pts){
 if(pts.length<2)return pts.length?`M${pts[0][0]},${pts[0][1]}`:'';
 let d=`M${pts[0][0]},${pts[0][1]}`;
 for(let i=0;i<pts.length-1;i++){
  const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
  const c1x=p1[0]+(p2[0]-p0[0])/6,c1y=p1[1]+(p2[1]-p0[1])/6;
  const c2x=p2[0]-(p3[0]-p1[0])/6,c2y=p2[1]-(p3[1]-p1[1])/6;
  d+=`C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
 }
 return d;
}
function sparkChart(){
 const pts=[30,42,38,55,72,60,48,52,66,58,70,64,76,72];
 const w=640,h=175,max=86,pad=10;
 const step=w/(pts.length-1);
 const XY=pts.map((p,i)=>[i*step,h-(p/max)*(h-pad)]);
 const line=smoothPath(XY);
 const area=line+` L${w},${h} L0,${h} Z`;
 const bars=pts.map((p,i)=>{const bh=(p/max)*h*.46;return `<rect class="ch-bar" style="--ci:${i}" x="${i*step-6}" y="${h-bh}" width="12" height="${bh}" rx="3.5" fill="url(#spk-bar)" opacity=".2"/>`;}).join('');
 const grid=[.18,.42,.66,.9].map(f=>`<line x1="0" y1="${(f*h).toFixed(0)}" x2="${w}" y2="${(f*h).toFixed(0)}" stroke="#EEF0F2" stroke-width="1" stroke-dasharray="2 6"/>`).join('');
 const last=XY.length-1;
 const dots=XY.map((c,i)=>i===last?'':`<circle class="spk-dot" style="--ci:${i}" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="3.2" fill="#fff" stroke="#0058BA" stroke-width="2"/>`).join('');
 const tip=XY[last];
 const marker=`<circle class="spk-ping" cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="6"/><circle class="spk-dot" style="--ci:${last}" cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="5" fill="#0058BA" stroke="#fff" stroke-width="2.5"/>`;
 return `<svg viewBox="0 0 ${w} ${h+24}" preserveAspectRatio="none" style="width:100%;height:210px;overflow:visible"><defs>
   <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0058BA" stop-opacity=".22"/><stop offset=".6" stop-color="#6C9FFF" stop-opacity=".08"/><stop offset="1" stop-color="#6C9FFF" stop-opacity="0"/></linearGradient>
   <linearGradient id="spk-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0058BA"/><stop offset="1" stop-color="#6C9FFF"/></linearGradient>
   <linearGradient id="spk-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6C9FFF"/><stop offset="1" stop-color="#0058BA"/></linearGradient>
   <filter id="spk-glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   ${grid}${bars}<path class="ch-area" d="${area}" fill="url(#ag)"/>
   <path id="spk-path" class="ch-line" d="${line}" fill="none" stroke="url(#spk-line)" stroke-width="2.6" stroke-linecap="round" filter="url(#spk-glow)"/>
   <circle r="4.5" fill="#fff" filter="url(#spk-glow)" opacity=".9"><animateMotion dur="3.4s" begin="1.6s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#spk-path"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.85;1" dur="3.4s" begin="1.6s" repeatCount="indefinite"/></circle>
   ${dots}${marker}
   ${['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'].map((m,i)=>`<text x="${i*(w/9)}" y="${h+18}" font-size="11" fill="#98A2B3" font-family="Plus Jakarta Sans">${m}</text>`).join('')}
 </svg>`;
}

/* ============ BILLING ============ */
SCREENS.billing=()=>{
 const mgr=(typeof billingMode!=='undefined'&&billingMode==='manager');
 const c=cartCalc();
 const cust=DB.cart.custIdx!=null?DB.customers[DB.cart.custIdx]:null;
 const rows=DB.cart.lines.length?DB.cart.lines.map(l=>{
   const p=prod(l.sku),line=p.price*l.qty,d=p.expiry?Math.round(line*0.15):0,tax=line-d,g=Math.round(tax*p.gst/100),tot=tax+g;
   const m=Math.round((p.price-p.cost)/p.price*100),mc=m>=38?'#0f8f63':m>=25?'#b8770c':'#cf3030';
   return `<tr>
   <td><div class="t-strong">${p.name}</div><div class="t-sub t-mono">${p.sku}${mgr?` · <span style="color:var(--muted)">${p.supplier}</span>`:''}${p.expiry?' · <span class="badge b-amber" style="font-size:9px;padding:1px 5px">−15% near-expiry auto</span>':''}</div></td>
   <td><div style="display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:8px;padding:2px 6px"><span class="qstep" onclick="cartQty('${p.sku}',-1)">−</span><b class="num">${l.qty}</b><span class="qstep" onclick="cartQty('${p.sku}',1)">+</span></div></td>
   <td class="num">${money(p.price)}</td>
   ${mgr?`<td class="num" style="color:var(--muted)">${money(p.cost)}</td><td class="num" style="color:${mc};font-weight:600">${m}%</td>`:''}
   <td><span class="badge b-grey">${p.gst}%</span></td><td class="num t-strong">${money(tot)}</td>
   <td><span style="color:var(--muted-2);cursor:pointer" onclick="cartRemove('${p.sku}')">✕</span></td></tr>`;
 }).join(''):`<tr><td colspan="${mgr?8:6}" style="padding:8px">${spot(spotCart(),'Cart is empty','Search a product above, scan a barcode, or tap a quick-add suggestion to start a bill.')}</td></tr>`;
 const headCols=mgr?`<th>Item</th><th>Qty</th><th>Price</th><th>Cost</th><th>Margin</th><th>GST</th><th>Total</th><th></th>`:`<th>Item</th><th>Qty</th><th>Price</th><th>GST</th><th>Total</th><th></th>`;
 const mgrStrip=mgr?`<div class="card-pad" style="border-bottom:1px solid var(--border-soft);display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:#FBFAFF">
       <span class="badge" style="background:var(--new-soft);color:var(--new)">Manager tools</span>
       <button class="btn btn-sm">Price override</button><button class="btn btn-sm">Manual discount</button><button class="btn btn-sm">Comp / write-off</button><button class="btn btn-sm" style="color:var(--danger)">Void line</button>
       <span style="margin-left:auto;font-size:12px;color:var(--muted)">Blended margin <b style="color:#0f8f63">${c.margin}%</b></span></div>`:'';
 const suggest=DB.products.filter(p=>!DB.cart.lines.find(l=>l.sku===p.sku)&&p.stock>0).slice(0,4);
 return head('Billing','Counter 1 · Riya Sharma · Shift 10:00–18:00',
   `<div class="seg" style="height:38px;align-items:center"><b class="${!mgr?'active':''}" onclick="setBillingMode('cashier')">Cashier mode</b><b class="${mgr?'active':''}" onclick="setBillingMode('manager')">Manager mode</b></div>`)
  
  + `<div class="split-2" style="grid-template-columns:1fr 420px;margin-top:16px">
      <div>
        <div class="card card-pad" style="margin-bottom:16px">
          <div style="display:flex;gap:10px;align-items:center">
            <div class="search" style="max-width:none;flex:1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="bill-search" oninput="billSearch(this.value)" placeholder="Scan barcode or search by SKU / product name…"></div>
            <button class="btn">${ic('barcode')} Scan</button>
            <button class="btn" title="Issue queue token">${ic('token')} Token <span class="flag star" style="margin-left:2px">★</span></button>
          </div>
          <div id="bill-results" class="res-box" style="display:none"></div>
        </div>
        <div class="card">
          <div class="card-h"><h3>Cart · ${DB.cart.lines.length} item${DB.cart.lines.length===1?'':'s'}</h3><div style="display:flex;gap:8px"><button class="btn btn-sm">${ic('register')} Hold bill</button><button class="btn btn-sm" style="color:var(--danger)" onclick="cartClear()">Clear</button></div></div>
          ${mgrStrip}
          <table><thead><tr>${headCols}</tr></thead><tbody>${rows}</tbody></table>
          <div class="card-pad" style="border-top:1px solid var(--border-soft)">
            <div class="section-label">Quick add: tap to add to cart</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">${suggest.map(p=>`<span class="badge b-blue" style="padding:7px 11px;cursor:pointer" onclick="addToCart('${p.sku}')">+ ${p.name.split(' · ')[0]} · ${money(p.price)}</span>`).join('')||'<span class="t-sub">All catalog items are in the cart.</span>'}</div>
            <div class="section-label" style="margin-top:16px">Build a combo on the fly ${flag('★')}</div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="badge b-grey" style="padding:7px 11px">Any 3 Kurtas → ₹3,000</span><span class="badge b-grey" style="padding:7px 11px">Buy 2 get accessory free</span><button class="btn btn-sm">${ic('plus')} New combo</button></div>
          </div>
        </div>
      </div>
      <div>
        <div class="card card-pad" style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center"><div class="section-label" style="margin:0">Customer</div></div>
          <select class="fld-select" onchange="setCartCustomer(this.value)" style="width:100%;margin-top:8px">
            <option value="" ${cust==null?'selected':''}>Walk-in customer</option>
            ${DB.customers.map((cu,i)=>`<option value="${i}" ${DB.cart.custIdx===i?'selected':''}>${cu.name} · ${cu.tier} · ${cu.pts} pts</option>`).join('')}
          </select>
          ${cust?`<div style="display:flex;align-items:center;gap:11px;margin-top:12px"><div class="tb-ava" style="width:42px;height:42px">${initials(cust.name)}</div><div><div class="t-strong" style="font-size:15px">${cust.name}</div><div class="t-sub">${cust.phone} · <span class="badge b-gold">${cust.tier}</span> · ${cust.pts} pts</div></div></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><button class="btn btn-sm ${DB.cart.redeem?'btn-pri':''}" onclick="toggleRedeem()">♡ ${DB.cart.redeem?'Redeeming 200':'Redeem 200 pts'}</button><button class="btn btn-sm">${ic('payments')} Gift card</button></div>`:''}
        </div>
        <div class="card card-pad">
          <div class="section-label">Bill summary</div>
          ${[['Subtotal (taxable)',money(c.sub)],['GST (CGST + SGST)',money(c.gst)]].map(r=>`<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:var(--muted)">${r[0]}</span><span class="num">${r[1]}</span></div>`).join('')}
          ${c.disc?`<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:var(--muted)">Near-expiry auto −15%</span><span class="num" style="color:var(--success)">−${money(c.disc)}</span></div>`:''}
          ${c.loyalty?`<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:var(--muted)">Loyalty redemption</span><span class="num" style="color:var(--success)">−${money(c.loyalty)}</span></div>`:''}
          <div style="display:flex;justify-content:space-between;padding:12px 0 4px;border-top:1px solid var(--border-soft);margin-top:6px"><b style="font-size:15px">Total payable</b><b class="num" style="font-size:22px">${money(c.total)}</b></div>
          ${mgr?`<div style="display:flex;justify-content:space-between;padding:8px 0 2px;border-top:1px dashed var(--border);margin-top:6px"><span style="color:var(--new);font-weight:600;font-size:12.5px">Blended margin ★</span><span class="num" style="color:#0f8f63;font-weight:600">${c.margin}% · ${money(c.sub-c.cost)}</span></div>`:''}
          <div class="section-label" style="margin-top:14px">Payment method <span style="color:var(--muted-2);font-weight:600;text-transform:none;letter-spacing:0">tap to select</span></div>
          <div class="pay-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            ${[['Cash','payments'],['Card','payments'],['UPI','payments'],['Wallet','payments'],['Split','swap'],['Gift','payments']].map(p=>`<button class="btn ${DB.cart.method===p[0]?'btn-pri':''}" data-pay="${p[0]}" style="height:54px;flex-direction:column;gap:3px;font-size:12px">${ic(p[1])}${p[0]}</button>`).join('')}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
            <button class="btn" onclick="toast('Bill sent to cloud printer')">${ic('reports')} Print</button>
            <button class="btn" style="background:var(--success-soft);border-color:#BBE9D4;color:#0f8f63" onclick="toast('Bill sent on WhatsApp'+(${cust?true:false}?' to ${cust?cust.name:''}':''))">${ic('wa')} WhatsApp ${flag('★')}</button>
          </div>
          <button class="btn-grad btn" style="width:100%;height:46px;margin-top:10px;justify-content:center;font-size:15px" onclick="charge()">${ic('check')} Charge ${money(c.total)}</button>
          <div style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:11px;color:var(--muted)">${ic('sync',13)} Online · auto-sync on · <span style="color:var(--success);font-weight:600">offline-safe</span></div>
        </div>
      </div>
    </div>`;
};
/* generic detail panel + table screen helper */
function dataTable(cols,rows){return `<table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`}

/* ============ SALES / ORDERS ============ */
SCREENS.orders=()=>{
 const today=DB.orders;
 const paid=today.filter(o=>o.status==='Paid'),held=today.filter(o=>o.status==='Held'),ref=today.filter(o=>o.status==='Refunded');
 const paidSum=paid.reduce((s,o)=>s+o.amount,0);
 return head('Sales / Bills','Completed and held-bill history',`<button class="btn" data-act="exportorders">${ic('reports')} Export</button><button class="btn-pri btn" data-act="newbill">${ic('plus')} New Bill</button>`)
  + kpis([{l:'Today Bills',v:String(today.length),m:'<span class="up">▲ updates as you bill</span>'},{l:'Held Bills',v:String(held.length),m:held.length?'awaiting resume':'none held'},{l:'Paid Sales',v:money(paidSum),m:paid.length+' completed'},{l:'Cancelled / Refunded',v:String(ref.length),m:ref.length+' refunded'}],4)
  + `<div class="card"><div class="card-h">${tabs(['Today','Yesterday','Last 7 days','This month','Custom'],'Today')}
       <div style="display:flex;gap:8px;align-items:center">
         <div class="search" style="width:200px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input oninput="oSearch(this.value)" value="${DB.oFilter.q}" placeholder="Bill number or customer"></div>
         <select class="fld-select" onchange="setOFilter('method',this.value)"><option value="">All methods</option>${['UPI','Card','Cash','Split'].map(m=>`<option ${DB.oFilter.method===m?'selected':''}>${m}</option>`).join('')}</select>
         <select class="fld-select" onchange="setOFilter('status',this.value)"><option value="">All statuses</option>${['Paid','Held','Refunded'].map(m=>`<option ${DB.oFilter.status===m?'selected':''}>${m}</option>`).join('')}</select>
       </div></div>
       <table><thead><tr>${['Bill No.','Customer','Cashier','Time','Method','Status','Amount',''].map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody id="ord-body">${ordersRows()}</tbody></table></div>`;
};

/* ============ REGISTER + DAILY CLOSE ============ */
SCREENS.register=()=>{
 const rows=[
  ['REG-0501-C1','Counter 1','Riya Sharma','10:04 → N/A','₹5,000','₹18,420','₹18,380','−₹40','b-green','Open'],
  ['REG-0501-C2','Counter 2','Aarav Pillai','10:00 → N/A','₹5,000','₹22,840','₹22,840','N/A','b-green','Open'],
  ['REG-0501-C3','Counter 3','Meera Desai','12:08 → N/A','₹5,000','₹9,120','₹9,020','−₹100','b-amber','Mismatch'],
 ].map((r,i)=>`<tr class="${i===2?'sel':''}"><td class="t-mono t-strong">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="t-sub t-mono">${r[3]}</td><td class="num">${r[4]}</td><td class="num">${r[5]}</td><td class="num">${r[6]}</td><td class="num" style="color:${r[7].includes('−')?'var(--danger)':'var(--muted)'}">${r[7]}</td><td><span class="badge ${r[8]}">${r[9]}</span></td></tr>`).join('');
 return head('Register / Cash Drawer','Cashier shifts, cash reconciliation & end-of-day close',`<button class="btn" data-act="cashinout">${ic('payments')} Cash in / out</button><button class="btn-pri btn" data-act="openregister">${ic('bolt')} Open Register</button>`)
  + kpis([{l:'Open Registers',v:'3 of 3',m:'All counters operational'},{l:'Cash on Hand',v:'₹50,240',m:'+₹15,000 opening · ₹35,240 sales'},{l:'Variance Today',v:'−₹140',m:'<span class="dn">2 counters affected</span>'},{l:'Expenses from Drawer',v:'₹4,200',m:'3 entries · 1 awaiting receipt'}],4)
  + `<div class="split-2">
      <div class="card"><div class="card-h">${tabs(['Today','Open','By cashier','Mismatches'],'Today')}</div>${dataTable(['Register','Counter','Cashier','Shift','Opening','Expected','Actual','Variance','Status'],rows)}</div>
      <div class="card">
        <div class="card-h"><div><h3>Daily Close ${flag('NEW')}</h3><div class="ch-sub">End-of-day checklist · 03 May</div></div><span class="badge b-amber">4 open</span></div>
        <div class="card-pad">
          ${[['All registers closed & counted',1],['Cash variance reasons captured',0],['UPI / card settlement matched',0],['Pending GRNs received or carried',1],['Expense receipts uploaded',0],['GST output snapshot saved',1],['Z-report generated & emailed',0]].map(c=>`<div class="cl">${cb(c[1])}<span style="${c[1]?'color:var(--muted);text-decoration:line-through':''}">${c[0]}</span></div>`).join('')}
          <button class="btn-grad btn" style="width:100%;justify-content:center;margin-top:12px">${ic('check')} Complete day close</button>
        </div>
      </div>
    </div>`;
};

/* ============ RETURNS & EXCHANGE ============ */
SCREENS.returns=()=>{
 const rows=DB.returns.map((r,i)=>`<tr class="${i===0?'sel':''}"><td class="t-mono t-strong">${r.ref}</td><td class="t-mono t-sub">${r.inv}</td><td>${r.cust}</td><td>${r.items}</td><td class="t-sub">${r.reason}</td><td>${r.method}</td><td><span class="badge ${r.status[0]}">${r.status[1]}</span></td><td class="num t-strong" style="text-align:right">${r.amount?money(r.amount):'₹0'}</td></tr>`).join('');
 return head('Returns & Exchange','Customer returns, refunds, exchanges and stock reversal',`<button class="btn">Filters</button><button class="btn" data-act="newexchange">${ic('swap')} New Exchange ${flag('★')}</button><button class="btn-pri btn" data-act="newreturn">${ic('plus')} New Return</button>`)
  + kpis([{l:'Returns Today',v:'11',m:'₹18,420 refunded · 4 pending'},{l:'Exchanges Today',v:'5',m:'★ one net payment each',flag:'★'},{l:'Pending Approval',v:'4',m:'Manager required > ₹2,000'},{l:'Rejected',v:'2',m:'Out of policy · post-7-day'}],4)
  + `<div class="split-2">
      <div class="card"><div class="card-h">${tabs(['All','Exchanges','Pending','Approved','Rejected'],'All')}</div>${dataTable(['Ref','Bill No.','Customer','Items','Reason','Method','Status','Amount'],rows)}</div>
      <div class="card">
        <div class="card-h"><div><h3>Exchange / Swap ${flag('★')}</h3><div class="ch-sub">EXC-0204 · one transaction</div></div></div>
        <div class="card-pad">
          <div class="section-label">Returning</div>
          <div class="lrow" style="padding-top:0"><div class="lico b-red">${ic('returns')}</div><div style="flex:1"><div class="lt">Embroidered Lehenga (M)</div><div class="ls">−₹8,400 · restock to inventory</div></div></div>
          <div class="section-label" style="margin-top:6px">New item</div>
          <div class="lrow"><div class="lico b-green">${ic('plus')}</div><div style="flex:1"><div class="lt">Embroidered Lehenga (L)</div><div class="ls">+₹8,400 · reserved</div></div></div>
          <div style="background:var(--brand-soft);border-radius:10px;padding:12px;margin-top:6px">
            <div style="display:flex;justify-content:space-between;font-size:13px"><span>Net payment</span><b class="num">₹0.00</b></div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-top:4px"><span>Single GST recalculation · one bill</span><span class="badge b-blue">balanced</span></div>
          </div>
          <button class="btn-grad btn" style="width:100%;justify-content:center;margin-top:12px">${ic('swap')} Complete exchange</button>
        </div>
      </div>
    </div>`;
};

/* ============ SALES CHANNELS ============ */
SCREENS.channels=()=>{
 const ch=[['Storefront (POS)','In-store','b-green','Live','₹4.84 L','342'],['Ambel Online','Website','b-green','Live','₹1.92 L','86'],['Instagram Shop','Social','b-amber','Syncing','₹38 K','12'],['Amazon / Flipkart','Marketplace','b-grey','Not connected','N/A','N/A'],['Pickup & Delivery','Fulfilment','b-green','Live','₹64 K','21']];
 return head('Sales Channels','Omnichannel orders & real-time inventory sync '+flag('NEW'),`<button class="btn-pri btn" data-act="connectchannel">${ic('plus')} Connect channel</button>`)
  
  + kpis([{l:'Channels Live',v:'4 of 5',m:'1 syncing · 1 to connect'},{l:'Online Orders Today',v:'119',m:'web + social + marketplace'},{l:'Omni Revenue',v:'₹7.78 L',m:'across all channels'},{l:'Stock Sync',v:'Real-time',m:'last sync 12s ago'}],4)
  + `<div class="card"><div class="card-h"><h3>Connected channels</h3></div>${dataTable(['Channel','Type','Status','','Revenue today','Orders'],ch.map(c=>`<tr><td class="t-strong">${c[0]}</td><td class="t-sub">${c[1]}</td><td><span class="badge ${c[2]}">${c[3]}</span></td><td></td><td class="num">${c[4]}</td><td class="num">${c[5]}</td></tr>`).join(''))}</div>`;
};

/* ============ DELIVERY CHALLAN ============ */
SCREENS.challan=()=>{
 const rows=DB.challans.map(r=>`<tr><td class="t-mono t-strong">${r.no}</td><td>${r.party}</td><td class="t-sub">${r.purpose}</td><td class="num">${r.qty}</td><td><span class="badge ${r.status[0]}">${r.status[1]}</span></td><td></td><td class="t-mono">${r.inv}</td></tr>`).join('');
 return head('Delivery Challan','Goods dispatched before invoicing: B2B & inter-branch '+flag('NEW'),`<button class="btn-pri btn" data-act="newchallan">${ic('plus')} New Challan</button>`)
  
  + kpis([{l:'Open Challans',v:'7',m:'awaiting Tax Invoice/return'},{l:'Dispatched Today',v:'3',m:'152 units'},{l:'Pending Tax Invoice',v:'4',m:'convert when delivered'},{l:'Approval Orders',v:'2',m:'goods on trial'}],4)
  + `<div class="card"><div class="card-h">${tabs(['All','Dispatched','Tax Invoiced','Returned'],'All')}</div>${dataTable(['Challan #','Party','Purpose','Qty','Status','','Tax Invoice'],rows)}</div>`;
};
/* ============ INVENTORY ============ */
SCREENS.inventory=()=>{
 const stat=p=>p.stock===0?['b-red','Out of stock']:p.stock<=p.reorder?['b-amber','Low stock']:p.expiry?['b-amber','Near expiry']:['b-green','In stock'];
 const rows=DB.products.map(p=>{const s=stat(p);return `<tr><td class="t-mono t-strong">${p.sku}</td><td>${p.name}</td><td class="t-sub">${p.cat}</td><td class="num t-strong">${p.stock}</td><td class="num" style="color:var(--muted)">${p.reorder}</td><td class="t-sub">${p.expiry||'N/A'}</td><td class="num">${money(p.price*p.stock)}</td><td><span class="badge ${s[0]}">${s[1]}</span></td></tr>`;}).join('');
 const sizes=['XS','S','M','L','XL'],colors=['Indigo','Maroon','Black'];
 let matrix='<table style="text-align:center"><thead><tr><th>Colour \\ Size</th>'+sizes.map(s=>`<th style="text-align:center">${s}</th>`).join('')+'</tr></thead><tbody>';
 const data={Indigo:[4,12,84,30,8],Maroon:[0,6,12,9,2],Black:[10,22,40,18,5]};
 colors.forEach(c=>{matrix+=`<tr><td class="t-strong" style="text-align:left">${c}</td>`+data[c].map(v=>`<td><span class="num" style="display:inline-block;min-width:34px;padding:5px;border-radius:7px;background:${v===0?'var(--danger-soft)':v<6?'var(--warning-soft)':'var(--success-soft)'};color:${v===0?'#cf3030':v<6?'#b8770c':'#0f8f63'};font-weight:600">${v}</span></td>`).join('')+'</tr>'});
 matrix+='</tbody></table>';
 return head('Inventory','Stock levels, valuation, variants, batches & expiry',`<button class="btn" data-act="exportinventory">${ic('reports')} Export</button><button class="btn">${ic('barcode')} Print labels ${flag('NEW')}</button><button class="btn-pri btn" data-act="addinventory">${ic('plus')} Add Inventory</button>`)
  + kpis([{l:'Total SKUs',v:String(DB.products.length),m:'live count'},{l:'Inventory Value',v:money(DB.products.reduce((s,p)=>s+p.price*p.stock,0)),m:'at MRP'},{l:'Low Stock',v:String(DB.products.filter(p=>p.stock>0&&p.stock<=p.reorder).length),m:'<span class="dn">at/below reorder</span>'},{l:'Out of Stock',v:String(DB.products.filter(p=>p.stock===0).length),m:'fast movers'},{l:'Near Expiry',v:String(DB.products.filter(p=>p.expiry).length),m:'within 90 days'},{l:'AI Reorder',v:'7',m:'Prophet suggestions',flag:'AI'}],6)
  + `<div class="card" style="margin-bottom:18px"><div class="card-h">${tabs(['All Stock','Low','Out','Near Expiry','Adjustment','Movement'],'All Stock')}<div style="display:flex;gap:8px"><button class="btn btn-sm">All categories ▾</button><button class="btn btn-sm">All suppliers ▾</button></div></div>${dataTable(['SKU','Product','Category','Avail','Reorder','Expiry','Value','Status'],rows)}</div>
     <div class="split-2">
       <div class="card"><div class="card-h"><div><h3>Variant matrix editor ${flag('★')}</h3><div class="ch-sub">Cotton Kurta · size × colour grid</div></div><button class="btn btn-sm">Edit grid</button></div><div class="card-pad">${matrix}</div></div>
       <div class="card">
         <div class="card-h"><div><h3>Smart reorder ${flag('AI')}</h3><div class="ch-sub">Prophet forecast · next 14 days</div></div></div>
         <div class="card-pad">
           ${[['Banarasi Dupatta','Forecast 48 · stock 0 · lead 7d','Create PO','b-red'],['Silk Saree · Maroon','Forecast 26 · stock 12','Create PO','b-amber'],['Cotton Kurta · Indigo','Forecast 60 · stock 84 · healthy','N/A','b-green']].map(r=>`<div class="lrow"><div class="lico ${r[3]}">${ic('inventory')}</div><div style="flex:1"><div class="lt">${r[0]}</div><div class="ls">${r[1]}</div></div>${r[2]!=='N/A'?`<button class="btn btn-sm btn-ghost">${r[2]}</button>`:'<span class="badge b-green">OK</span>'}</div>`).join('')}
           <div class="section-label" style="margin-top:14px">Import preview ${flag('NEW')}</div>
           <div style="border:1px solid var(--border-soft);border-radius:10px;overflow:hidden">
             <div style="display:flex;justify-content:space-between;padding:10px 12px;background:#FAFBFC;font-size:12px"><span>products.csv · 412 rows</span><span><span class="badge b-green">408 valid</span> <span class="badge b-red">4 errors</span></span></div>
             <div style="padding:10px 12px;font-size:12px;color:var(--danger)">Row 87: missing HSN · Row 203: GST slab invalid · Row 311: duplicate SKU</div>
           </div>
         </div>
       </div>
     </div>`;
};

/* ============ WHATSAPP CONNECT ============ */
SCREENS.whatsapp=()=>{
 const autos=[
  ['bill','Bill on every sale','Tax Invoice PDF sent the moment a sale is charged',1],
  ['orders','Order & dispatch updates','Confirmed → packed → out for delivery, with tracking link',1],
  ['customer','Abandoned-cart recovery','Nudge online-channel carts left idle for 2 hours',1],
  ['receivable','Payment reminders','Auto-remind credit customers before & after due date',1],
  ['customer','Loyalty point alerts','Points earned, tier upgrades & expiry reminders',0],
  ['returns','Review & feedback request','Ask for a rating 24 hrs after delivery',0],
 ];
 const convos=[
  ['Anika Kapoor','Is the indigo kurta back in size M?','2 min','b-green','2',1],
  ['Reliance Trends · B2B','Please share the challan for DC-2026-0042','1 hr','b-amber','1',1],
  ['Priya Nair','Can I exchange this for a larger size?','2 hr','b-green','3',1],
  ['Rohit Mehra','Thanks! Got the Tax Invoice 🙏','3 hr','b-grey','',0],
 ];
 const tpls=[
  ['Tax invoice','Utility','Bill + GST breakdown + PDF','b-green','Approved'],
  ['Order shipped','Utility','Dispatch confirmation + courier tracking','b-green','Approved'],
  ['Payment reminder','Utility','Outstanding amount + UPI pay link','b-green','Approved'],
  ['Weekend offer','Marketing','Gold-tier 2× points campaign','b-amber','In review'],
  ['Festive collection','Marketing','New-arrivals carousel + CTA','b-grey','Draft'],
 ];
 const funnel=[['Sent','12,840',100,'#0058BA'],['Delivered','12,610',98,'#2B6FDB'],['Read','11,160',87,'#10B981'],['Clicked link','2,980',23,'#6C9FFF'],['Replied','1,240',10,'#F59E0B']];
 const needReply=convos.filter(c=>c[5]).length;
 return head('WhatsApp Connect','Bills, automations, broadcasts & a shared inbox '+flag('NEW'),`<button class="btn" onclick="toast('Opening WhatsApp settings')">Manage connection</button><button class="btn-pri btn" data-act="newbroadcast">${ic('wa')} New broadcast</button>`)
  + `<div class="card" style="background:linear-gradient(100deg,#E8F8EF,#F1FBF5);border-color:#BBE9D4;margin-bottom:18px">
      <div style="display:flex;align-items:center;gap:16px;padding:15px 18px;flex-wrap:wrap">
        <div style="width:48px;height:48px;border-radius:13px;background:linear-gradient(135deg,#1FA855,#25D366);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 6px 16px rgba(31,168,85,.3);flex-shrink:0">${ic('wa',26)}</div>
        <div style="flex:1;min-width:220px">
          <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap"><b style="font-size:15px">WhatsApp Business · +91 90000 12345</b><span class="badge b-green"><span class="dot-g"></span>Connected</span><span class="badge b-blue">Green-tick verified</span></div>
          <div class="t-sub" style="margin-top:3px">Provider: Gupshup (Meta Cloud API) · Quality rating: <b style="color:#0f8f63">High</b> · Messaging limit: 100K / day</div>
        </div>
        <button class="btn" onclick="toast('Connection healthy · last sync just now')">${ic('sync')} Test connection</button>
      </div>
    </div>`
  + kpis([
     {l:'Messages Sent Today',v:'2,418',m:'92% utility · 8% marketing'},
     {l:'Delivered',v:'98.6%',m:'2,384 of 2,418'},
     {l:'Read Rate',v:'87.2%',m:'industry avg ~70%',flag:'★'},
     {l:'Replies',v:'164',m:needReply+' awaiting response'},
     {l:'Revenue Attributed',v:'₹3.2 L',m:'this week · campaigns',flag:'★'},
     {l:'Active Automations',v:'4 of 6',m:'2 paused'},
   ],6)
  + `<div class="split-2">
      <div class="card">
        <div class="card-h"><div><h3>Automations ${flag('★')}</h3><div class="ch-sub">Trigger-based messages · zero manual work</div></div></div>
        <div class="card-pad" style="padding-top:4px">
          ${autos.map(a=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-soft)"><div class="lico b-green" style="flex-shrink:0">${ic(a[0])}</div><div style="flex:1"><div class="lt">${a[1]}</div><div class="ls">${a[2]}</div></div>${tg(a[3])}</div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-h"><div><h3>Conversations</h3><div class="ch-sub">Shared team inbox · ${needReply} need a reply</div></div><button class="btn btn-sm" onclick="toast('Opening shared inbox')">Open inbox</button></div>
        <div class="card-pad" style="padding-top:6px">
          ${convos.map(c=>`<div class="lrow"><div class="lico ${c[3]}">${ic('customer')}</div><div style="flex:1"><div class="lt">${c[0]} ${c[4]?`<span class="badge b-green" style="padding:1px 7px;margin-left:2px">${c[4]}</span>`:''}</div><div class="ls">${c[1]}</div></div><div style="text-align:right;flex-shrink:0"><div class="ls">${c[2]}</div>${c[5]?`<button class="btn btn-sm" style="margin-top:4px;height:26px;padding:0 10px">${ic('wa',12)} Reply</button>`:'<span class="badge b-grey" style="margin-top:4px">Closed</span>'}</div></div>`).join('')}
        </div>
      </div>
    </div>`
  + `<div class="card" style="margin-top:18px"><div class="card-h"><div><h3>Message templates</h3><div class="ch-sub">DLT &amp; Meta-approved · category-tagged</div></div><button class="btn btn-sm" data-act="newtemplate">${ic('plus')} New template</button></div>${dataTable(['Template','Category','Purpose','Status',''],tpls.map(t=>`<tr><td class="t-strong">${t[0]}</td><td><span class="badge ${t[1]==='Marketing'?'b-blue':'b-grey'}">${t[1]}</span></td><td class="t-sub">${t[2]}</td><td><span class="badge ${t[3]}">${t[4]}</span></td><td style="text-align:right"><button class="btn btn-sm">Edit</button></td></tr>`).join(''))}</div>`
  + `<div class="split-2" style="margin-top:18px">
      <div class="card">
        <div class="card-h"><div><h3>New broadcast ${flag('★')}</h3><div class="ch-sub">Consent-checked · DND-safe</div></div></div>
        <div class="card-pad">
          <div class="section-label">Audience</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="badge b-blue">Gold tier · 612</span><span class="badge b-grey">Lapsed 90D+ · 248</span><button class="btn btn-sm">${ic('plus')} Add segment</button></div>
          <div class="section-label" style="margin-top:14px">Template</div>
          <div style="border:1px solid var(--border);border-radius:10px;padding:11px;font-size:13px;background:#FAFBFC">Namaste {name}! Your Gold tier earns 2× points this weekend ✨ Plus ₹500 off above ₹3,000. Visit us at Ambel Bandra.</div>
          <div class="cl" style="margin-top:8px">${cb(1)}<span style="color:var(--muted)">Marketing template approved · consent verified (DND-safe)</span></div>
          <button class="btn-grad btn" style="width:100%;justify-content:center;margin-top:10px" data-act="newbroadcast">${ic('wa')} Send to 612 · est. ₹3.2 L lift</button>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><div><h3>7-day performance</h3><div class="ch-sub">Delivery &amp; engagement funnel</div></div></div>
        <div class="card-pad">
          ${funnel.map(b=>`<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px"><span style="color:var(--muted)">${b[0]}</span><b class="num">${b[1]} · ${b[2]}%</b></div><div class="bar"><i style="width:${b[2]}%;background:${b[3]}"></i></div></div>`).join('')}
          <div style="background:var(--brand-soft);border-radius:10px;padding:12px;margin-top:4px;display:flex;gap:10px">${ic('ai',18)}<div style="font-size:12.5px"><b>Copilot insight:</b> read rate peaks 6–8 PM. Schedule the weekend offer for 6:30 PM to lift opens ~12%.</div></div>
        </div>
      </div>
    </div>`;
};

/* ============ PURCHASES ============ */
SCREENS.purchases=()=>{
 const rows=[
  ['PO-2026-0184','Fabindia Mills','05 May','240','240/240','FB/24/8821','₹4,200','₹1,96,800','b-green','Received'],
  ['PO-2026-0185','Banaras Weaves','07 May','60','22/60','BW/26/0142','₹1,800','₹2,64,000','b-amber','Partial'],
  ['PO-2026-0187','Hidesign Co.','10 May','120','120/120','HD/26/3309','₹800','₹54,000','b-amber','Bill Matching'],
  ['PO-2026-0190','Forest Essentials','06 May','36','32/36','FE/26/2204','₹600','₹15,120','b-red','Vendor Credit'],
 ].map(r=>`<tr><td class="t-mono t-strong">${r[0]}</td><td>${r[1]}</td><td class="t-sub">${r[2]}</td><td class="num">${r[3]}</td><td class="num t-sub">${r[4]}</td><td class="t-mono t-sub">${r[5]}</td><td class="num">${r[6]}</td><td class="num t-strong">${r[7]}</td><td><span class="badge ${r[8]}">${r[9]}</span></td></tr>`).join('');
 return head('Purchases','Purchase orders, GRN, bill matching & vendor credits',`<button class="btn">${ic('ai')} Auto-PO ${flag('AI')}</button><button class="btn-pri btn" data-act="opencreatepo">${ic('plus')} Create PO</button>`)
  + kpis([{l:'Open POs',v:'9',m:'₹14.2 L value'},{l:'GRN Pending',v:'3',m:'1 partial · 2 sent'},{l:'Bill Matching',v:'1',m:'Hidesign · ₹600 diff'},{l:'Vendor Credits',v:'2',m:'returns & price adj',flag:'NEW'},{l:'Pending Delivery',v:'₹5.4 L',m:'across 3 suppliers'},{l:'Auto-PO suggested',v:'7',m:'Prophet velocity',flag:'AI'}],6)
  + `<div class="card"><div class="card-h">${tabs(['All POs','Draft','Sent','Partial','Received','Bill Matching','Vendor Credits'],'All POs')}</div>${dataTable(['PO #','Supplier','Expected','Ordered','Received','Bill','Landed','Total','Status'],rows)}
     </div>`;
};

/* ============ SUPPLIERS ============ */
SCREENS.suppliers=()=>{
 const rows=DB.suppliers.map((s,i)=>`<tr class="${i===0?'sel':''}"><td class="t-strong">${s.name}</td><td class="t-mono t-sub">${s.gstin}</td><td>${s.terms}</td><td class="num">${s.lead}</td><td class="num">${money(s.pay)}</td><td><span class="badge ${s.status[0]}">${s.status[1]}</span></td></tr>`).join('');
 const score=(l,v,pct,c)=>`<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px"><span style="color:var(--muted)">${l}</span><b class="num" style="color:${c}">${v}</b></div><div class="bar"><i style="width:${pct}%;background:${c}"></i></div></div>`;
 return head('Suppliers','Vendor master, payables, lead time & performance',`<button class="btn" data-act="exportsuppliers">${ic('reports')} Export</button><button class="btn-pri btn" data-act="addsupplier">${ic('plus')} Add Supplier</button>`)
  + kpis([{l:'Total Suppliers',v:String(DB.suppliers.length),m:'live count'},{l:'Total Payables',v:money(DB.suppliers.reduce((s,x)=>s+x.pay,0)),m:'3 due this week'},{l:'Avg Lead Time',v:'5.2 days',m:'across vendors'},{l:'Late Orders',v:'2',m:'<span class="dn">Aravind, Surat</span>'},{l:'Bill Mismatch',v:'1',m:'Hidesign · ₹600'},{l:'GST Missing',v:'1',m:'HUL Distribution'}],6)
  + `<div class="split-2">
      <div class="card"><div class="card-h">${tabs(['All','Active','Late','GST issues'],'All')}</div>${dataTable(['Supplier','GSTIN','Terms','Lead','Payable','Status'],rows)}</div>
      <div class="card">
        <div class="card-h"><div><h3>Supplier scorecard ${flag('★')}</h3><div class="ch-sub">Fabindia Mills · last 12 months</div></div><span class="badge b-green">A · Preferred</span></div>
        <div class="card-pad">
          ${score('On-time in-full (OTIF)','94%',94,'#10B981')}
          ${score('Fill rate','97%',97,'#10B981')}
          ${score('Quality rejection','2.1%',21,'#F59E0B')}
          ${score('Price drift vs PO','+1.4%',14,'#F59E0B')}
          ${score('Margin contribution','38.4%',64,'#0058BA')}
        </div>
      </div>
    </div>`;
};
/* ============ CUSTOMERS ============ */
SCREENS.customers=()=>{
 const tierB={Gold:'b-gold',Silver:'b-grey',Bronze:'b-grey'};
 const rows=DB.customers.map((c,i)=>`<tr class="${i===0?'sel':''}"><td class="t-strong">${c.name}</td><td class="t-mono t-sub">${c.phone}</td><td><span class="badge ${tierB[c.tier]||'b-grey'}">${c.tier}</span></td><td class="num">${c.pts.toLocaleString('en-IN')}</td><td class="num">${money(c.spend)}</td><td class="t-sub">${c.last||'N/A'}</td></tr>`).join('');
 return head('Customers','CRM, loyalty, gift cards, segments & campaigns',`<button class="btn" data-act="exportcustomers">${ic('reports')} Export</button><button class="btn-pri btn" data-act="addcustomer">${ic('plus')} Add Customer</button>`)
  + kpis([{l:'Total Customers',v:String(DB.customers.length),m:'live count'},{l:'Loyalty Members',v:'2,840',m:'68% of base'},{l:'Gift Card Balance',v:'₹84,500',m:'122 active cards'},{l:'Active Campaigns',v:'3',m:'Diwali · Bridal · Loyalty 2x'},{l:'Repeat Rate',v:'48%',m:'<span class="up">▲ 4% MoM</span>'},{l:'Inactive (90D+)',v:'612',m:'re-engage candidates'}],6)
  + `<div class="split-2">
      <div class="card"><div class="card-h">${tabs(['All','Loyalty','Gold','Silver','Inactive','Gift Card'],'All')}</div>${dataTable(['Customer','Phone','Tier','','Points','Lifetime','Last visit'].slice(0,6),rows)}</div>
      <div class="card">
        <div class="card-h"><div><h3>Campaign builder ${flag('IMPROVE')}</h3><div class="ch-sub">Reach a segment via WhatsApp / SMS</div></div></div>
        <div class="card-pad">
          <div class="section-label">Audience</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="badge b-blue">Gold tier · 612</span><span class="badge b-grey">+ Inactive 90D+</span><button class="btn btn-sm">${ic('plus')} Add filter</button></div>
          <div class="section-label" style="margin-top:14px">Channel</div>
          <div style="display:flex;gap:8px">${['WhatsApp','SMS','Email'].map((c,i)=>`<button class="btn btn-sm ${i===0?'btn-pri':''}">${i===0?ic('wa'):''}${c}</button>`).join('')}</div>
          <div class="section-label" style="margin-top:14px">Message</div>
          <div style="border:1px solid var(--border);border-radius:10px;padding:11px;font-size:13px;background:#FAFBFC">Namaste {name}! Your Gold tier earns 2× points this weekend ✨ Plus ₹500 off bridal. Visit Bandra before Sun.</div>
          <div class="cl" style="margin-top:8px">${cb(1)}<span style="color:var(--muted)">DLT-approved template · consent verified (DND-safe)</span></div>
          <button class="btn-grad btn" style="width:100%;justify-content:center;margin-top:6px">${ic('wa')} Send to 612 · est. ₹3.2 L lift</button>
        </div>
      </div>
    </div>`;
};

/* ============ STAFF ============ */
SCREENS.staff=()=>{
 const rows=DB.staff.map((s,i)=>`<tr class="${i===0?'sel':''}"><td class="t-strong">${s.name}</td><td class="t-sub">${s.role}</td><td>${s.shift}</td><td>${s.reg}</td><td class="t-mono">${s.clock}</td><td><span class="badge ${s.status[0]}">${s.status[1]}</span></td></tr>`).join('');
 const perms=['Billing','Refunds ≤₹5K','Discounts','Void bill','Open register','Stock adjust','Reports','Settings'];
 const rolesP={Admin:[1,1,1,1,1,1,1,1],Manager:[1,1,1,1,1,1,1,0],Cashier:[1,1,0,0,1,0,0,0],Floor:[1,0,0,0,0,0,0,0]};
 let matrix='<table style="text-align:center;font-size:12px"><thead><tr><th style="text-align:left">Permission</th>'+Object.keys(rolesP).map(r=>`<th style="text-align:center">${r}</th>`).join('')+'</tr></thead><tbody>';
 perms.forEach((p,i)=>{matrix+=`<tr><td style="text-align:left;font-weight:600">${p}</td>`+Object.keys(rolesP).map(r=>`<td>${rolesP[r][i]?`<span style="color:var(--success)">${ic('check',15)}</span>`:'<span style="color:var(--muted-2)">N/A</span>'}</td>`).join('')+'</tr>'});
 matrix+='</tbody></table>';
 return head('Staff','Roster, shifts, roles, permissions & incentives',`<button class="btn" data-act="scheduleshift">Schedule Shift</button><button class="btn-pri btn" data-act="addstaff">${ic('plus')} Add Staff</button>`)
  + kpis([{l:'Active Staff',v:String(DB.staff.length),m:'3 on shift now'},{l:'Late Clock-ins',v:'2',m:'this week'},{l:'Open Shifts',v:'1',m:'Evening · Counter 1'},{l:'Cash Variance',v:'−₹140',m:'2 cashiers'},{l:'Commission Due',v:'₹18,400',m:'this cycle',flag:'★'},{l:'Top Coach Score',v:'92',m:'Aarav · AI',flag:'AI'}],6)
  + `<div class="card" style="margin-bottom:18px"><div class="card-h">${tabs(['All','On shift','Cashiers','Managers'],'All')}</div>${dataTable(['Staff','Role','Shift','Register','Clock-in','Status',''],rows)}</div>
     <div class="split-2">
       <div class="card"><div class="card-h"><div><h3>Permission matrix ${flag('NEW')}</h3><div class="ch-sub">Roles × capabilities · click to toggle</div></div><button class="btn btn-sm">${ic('plus')} New role</button></div><div class="card-pad">${matrix}</div></div>
       <div class="card">
         <div class="card-h"><div><h3>Commission & coaching ${flag('★')}${flag('AI')}</h3><div class="ch-sub">Aarav Pillai · this cycle</div></div></div>
         <div class="card-pad">
           <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
             <div style="border:1px solid var(--border-soft);border-radius:10px;padding:12px"><div class="ls">Commission earned</div><div class="num" style="font-size:22px;font-weight:700;margin-top:3px">₹6,240</div><div class="ls">5.5% above-target sales</div></div>
             <div style="border:1px solid var(--border-soft);border-radius:10px;padding:12px"><div class="ls">AI coach score</div><div class="num" style="font-size:22px;font-weight:700;margin-top:3px;color:var(--brand-1)">92</div><div class="ls">speed · variance · attach</div></div>
           </div>
           <div style="background:var(--brand-soft);border-radius:10px;padding:12px;margin-top:12px;display:flex;gap:10px">${ic('ai',18)}<div style="font-size:12.5px"><b>Live nudge on POS:</b> "Aarav's avg bill this hour is ₹4,200: suggest accessories to your next 3 customers to hit ₹4,800 target."</div></div>
         </div>
       </div>
     </div>`;
};

/* ============ PAYMENTS ============ */
SCREENS.payments=()=>{
 const rows=[
  ['PAY-99820','INV-24850','Anika Kapoor','UPI','T+0','b-green','Captured','₹4,280'],
  ['PAY-99817','INV-24847','Saanvi Iyer','Split (Card+UPI)','T+0','b-green','Captured','₹12,400'],
  ['PAY-99816','INV-24846','Walk-in','UPI','T+0','b-amber','Pending','₹2,100'],
  ['PAY-99813','INV-24842','Aditya Sharma','UPI','N/A','b-red','Failed','₹2,850'],
 ].map((r,i)=>`<tr class="${i===0?'sel':''}"><td class="t-mono t-strong">${r[0]}</td><td class="t-mono t-sub">${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="t-sub">${r[4]}</td><td><span class="badge ${r[5]}">${r[6]}</span></td><td class="num t-strong" style="text-align:right">${r[7]}</td></tr>`).join('');
 const psp=[['Razorpay','UPI + Card','₹3.12 L','T+0','b-green','Settled'],['PhonePe','UPI QR','₹84,200','T+0','b-amber','Expected 8 PM'],['Pine Labs','Card terminal','₹1.62 L','T+1','b-blue','Batch 23:00'],['HDFC','UPI','₹38,400','T+1','b-green','Settled']];
 return head('Payments','Collection, settlement & reconciliation',`<button class="btn">Export</button><button class="btn-pri btn" data-act="runsettlement">${ic('sync')} Run Settlement</button>`)
  + kpis([{l:'Today Collected',v:'₹4.84 L',m:'342 transactions'},{l:'UPI Settlement',v:'₹2.18 L',m:'expected 8 PM'},{l:'Card Batch',v:'₹1.62 L',m:'closes 23:00 · Pine Labs'},{l:'Pending UPI',v:'4',m:'resolution queue',flag:'IMPROVE'},{l:'Failed',v:'3',m:'<span class="dn">UPI ×2 · card ×1</span>'},{l:'Refund Payouts',v:'₹18.4 K',m:'11 today · 4 pending'}],6)
  + `<div class="split-2">
      <div class="card"><div class="card-h">${tabs(['All','UPI','Card','Cash','Failed'],'All')}</div>${dataTable(['Payment','Bill','Customer','Method','Settle','Status','Amount'],rows)}</div>
      <div class="card">
        <div class="card-h"><div><h3>PSP settlement tracker ${flag('★')}</h3><div class="ch-sub">By provider · UTR-matched</div></div></div>
        <div class="card-pad" style="padding-top:6px">
          ${psp.map(p=>`<div class="lrow"><div class="lico b-blue">${ic('payments')}</div><div style="flex:1"><div class="lt">${p[0]} <span class="t-sub">· ${p[1]}</span></div><div class="ls">${p[3]} · <span class="num">${p[2]}</span></div></div><span class="badge ${p[4]}">${p[5]}</span></div>`).join('')}
          <div class="section-label" style="margin-top:14px">Reconciliation checklist</div>
          ${[['Captured at gateway',1],['Posted to ledger',1],['Matched to bill (UTR)',1],['Settled to bank',0],['EOD mismatch report',0]].map(c=>`<div class="cl">${cb(c[1])}<span style="${c[1]?'color:var(--muted)':''}">${c[0]}</span></div>`).join('')}
        </div>
      </div>
    </div>`;
};

/* ============ EXPENSES ============ */
SCREENS.expenses=()=>{
 const rows=DB.expenses.map(r=>`<tr><td class="t-mono t-strong">${r.id}</td><td>${r.cat}</td><td>${r.payee}</td><td class="num">${money(r.amt)}</td><td class="t-sub">${r.source}</td><td><span class="badge ${r.status[0]}">${r.status[1]}</span></td></tr>`).join('');
 return head('Expenses','Store running expenses, petty cash, approvals & vendor bills (AP)',`<button class="btn" data-act="exportexpenses">Export</button><button class="btn-pri btn" data-act="addexpense">${ic('plus')} Add Expense</button>`)
  + kpis([{l:'Today Expenses',v:'₹1.32 L',m:'8 entries'},{l:'Petty Cash',v:'₹14,200',m:'from counter drawer'},{l:'Pending Approval',v:'3',m:'₹17,700 total'},{l:'Missing Receipt',v:'3',m:'<span class="dn">upload required</span>'},{l:'Budget Used (May)',v:'62%',m:'₹1.86L of ₹3.00L'},{l:'Vendor Bills (AP)',v:'₹84,500',m:'4 bills · 1 due'}],6)
  + `<div class="card"><div class="card-h">${tabs(['All','Pending','Approved','Petty cash','Vendor bills (AP)'],'All')}</div>${dataTable(['ID','Category','Paid to','Amount','Source','Status',''],rows)}</div>`;
};

/* ============ RECEIVABLES ============ */
SCREENS.receivables=()=>{
 const rows=[['Reliance Trends','₹2,64,000','₹64,000','₹2,00,000','b-red','45+ overdue'],['Lifestyle Corp','₹1,12,000','₹1,12,000','N/A','b-green','Current'],['Pothys Silks','₹48,000','N/A','₹48,000','b-amber','15–30 overdue']];
 const aging=[['Current','₹3.1 L',62,'#10B981'],['1–30 days','₹98 K',20,'#F59E0B'],['31–60 days','₹52 K',11,'#F59E0B'],['60+ days','₹34 K',7,'#EF4444']];
 return head('Receivables','Outstanding from credit & corporate customers '+flag('NEW'),`<button class="btn">${ic('wa')} Send reminders ${flag('★')}</button><button class="btn-pri btn">Export aging</button>`)
  
  + kpis([{l:'Total Receivable',v:'₹4.94 L',m:'across 18 accounts'},{l:'Overdue',v:'₹1.86 L',m:'<span class="dn">38% of book</span>'},{l:'Due This Week',v:'₹64 K',m:'3 accounts'},{l:'Avg Days to Pay',v:'27 days',m:'<span class="up">▼ 4 vs last qtr</span>'}],4)
  + `<div class="split-2">
      <div class="card"><div class="card-h"><h3>Accounts</h3>${seg(['All','Overdue','Current'],'All')}</div>${dataTable(['Customer','Total','Overdue','Current','','Bucket'],rows.map(r=>`<tr><td class="t-strong">${r[0]}</td><td class="num">${r[1]}</td><td class="num" style="color:var(--danger)">${r[2]}</td><td class="num">${r[3]}</td><td><span class="badge ${r[4]}">${r[5]}</span></td><td></td></tr>`).join(''))}</div>
      <div class="card"><div class="card-h"><h3>Aging buckets</h3></div><div class="card-pad">${aging.map(a=>`<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span>${a[0]}</span><b class="num">${a[1]}</b></div><div class="bar"><i style="width:${a[2]}%;background:${a[3]}"></i></div></div>`).join('')}<button class="btn" style="width:100%;justify-content:center;margin-top:6px">${ic('wa')} Remind all overdue</button></div></div>
    </div>`;
};

/* ============ CREDIT / DEBIT NOTES ============ */
SCREENS.creditnotes=()=>{
 const rows=DB.notes.map(r=>`<tr><td class="t-mono t-strong">${r.no}</td><td><span class="badge ${r.type==='Credit'?'b-blue':'b-grey'}">${r.type}</span></td><td>${r.party}</td><td class="t-sub">${r.reason}</td><td class="num">${money(r.amount)}</td><td><span class="badge ${r.status[0]}">${r.status[1]}</span></td><td></td></tr>`).join('');
 return head('Credit / Debit Notes','Formal accounting documents for returns & adjustments '+flag('NEW'),`<button class="btn-pri btn" data-act="newnote">${ic('plus')} New Note</button>`)
  
  + kpis([{l:'Open Credit Notes',v:'6',m:'₹38,400 outstanding'},{l:'Redeemed This Month',v:'₹52,000',m:'against new purchases'},{l:'Debit Notes',v:'3',m:'to suppliers'},{l:'Drafts',v:'2',m:'awaiting approval'}],4)
  + `<div class="card"><div class="card-h">${tabs(['All','Credit','Debit','Drafts'],'All')}</div>${dataTable(['Note #','Type','Party','Reason','Amount','Status',''],rows)}</div>`;
};
/* ============ REPORTS ============ */
SCREENS.reports=()=>{
 const rows=[['Daily Sales Summary','GST-ready daily P&L','5 min ago','Auto'],['GST Output (GSTR-1 ready)','Month-wise outward supplies','Today 02:00','Auto'],['Stock Valuation','Closing inventory · weighted avg','Today 02:00','Karan B.'],['Supplier & Vendor Ledger','Purchase + payable','Today 02:00','Karan B.']].map((r,i)=>`<tr class="${i===1?'sel':''}"><td class="t-strong">${r[0]}</td><td class="t-sub">${r[1]}</td><td class="t-sub">${r[2]}</td><td class="t-sub">${r[3]}</td><td style="text-align:right"><button class="btn btn-sm">Open</button></td></tr>`).join('');
 return head('Reports','Audit-ready, GST-compliant exports',`<button class="btn" data-act="schedulereport">Schedule</button><button class="btn-pri btn" data-act="genreport">${ic('reports')} Generate Report</button>`)
  + kpis([{l:"Today's Sales",v:'₹32.4 L',m:'2,418 bills'},{l:'GST Output',v:'₹4.2 L',m:'5/12/18% slabs'},{l:'Stock Value',v:'₹84.2 L',m:'weighted avg'},{l:'Custom Reports',v:'12',m:'saved views',flag:'NEW'},{l:'Scheduled',v:'6',m:'daily/weekly email'},{l:'Exports Done',v:'74',m:'PDF/XLSX/Email'}],6)
  + `<div class="split-2">
      <div class="card"><div class="card-h">${tabs(['All','Sales','GST','Stock','Audit'],'All')}<button class="btn btn-sm">PDF + XLSX ▾</button></div>${dataTable(['Report','Purpose','Updated','Owner',''],rows)}
        </div>
      <div class="card">
        <div class="card-h"><div><h3>Custom report builder ${flag('NEW')}</h3><div class="ch-sub">Drag fields · save as view</div></div></div>
        <div class="card-pad">
          <div class="section-label">Dimensions</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${['Date','Category','Cashier','Counter','Payment','Customer tier'].map(d=>`<span class="badge b-grey" style="padding:6px 10px;cursor:grab">⠿ ${d}</span>`).join('')}</div>
          <div class="section-label" style="margin-top:14px">Measures</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${['Net sales','Bills','Avg bill','GST','Margin %','Refunds'].map(d=>`<span class="badge b-blue" style="padding:6px 10px;cursor:grab">⠿ ${d}</span>`).join('')}</div>
          <div class="section-label" style="margin-top:14px">Preview</div>
          <div style="border:1px solid var(--border-soft);border-radius:10px;overflow:hidden">${dataTable(['Category','Bills','Net sales','Margin %'],[['Womens Ethnic','842','₹12.4 L','42.1%'],['Mens Ethnic','610','₹8.9 L','38.4%'],['Beauty','388','₹2.1 L','28.6%']].map(r=>`<tr><td class="t-strong">${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td></tr>`).join(''))}</div>
          <div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-sm" style="flex:1;justify-content:center">Save view</button><button class="btn btn-sm" style="flex:1;justify-content:center">Schedule</button></div>
        </div>
      </div>
    </div>`;
};

/* ============ ANALYTICS ============ */
SCREENS.analytics=()=>{
 return head('Analytics','Trends, margin, churn & Prophet forecasts',`<button class="btn">Refresh</button><button class="btn">Export</button>`)
  + kpis([{l:'Sales Growth',v:'+14.6%',m:'vs prior period'},{l:'Gross Margin',v:'37.4%',m:'target 40%'},{l:'Footfall → Conv.',v:'41%',m:'512 walk-ins · 210 bills',flag:'★'},{l:'Inventory at Risk',v:'14',m:'near-expiry SKUs'},{l:'Repeat Rate',v:'48%',m:'<span class="up">▲ 4% MoM</span>'},{l:'30-Day Forecast',v:'₹1.52 Cr',m:'±6% · Prophet',flag:'AI'}],6)
  + `<div class="split-2">
      <div class="card">
        <div class="card-h"><div><h3>Footfall vs conversion ${flag('★')}</h3><div class="ch-sub">Sensor walk-ins vs bills · hour of day</div></div></div>
        <div class="card-pad">${footfallChart()}<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12px;color:var(--muted)"><span><span style="display:inline-block;width:10px;height:10px;background:#6C9FFF;border-radius:2px"></span> Walk-ins (sensor)</span><span><span style="display:inline-block;width:10px;height:10px;background:#0058BA;border-radius:2px"></span> Bills</span><span>Peak 5–6 PM · 52 bills/hr</span></div>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><div><h3>AI suggested actions ${flag('AI')}</h3><div class="ch-sub">With data basis · approval required</div></div></div>
        <div class="card-pad" style="padding-top:6px">
          ${[['purchase','b-amber','Raise PO for Banarasi Dupatta','Out 12 hrs · est. lost ₹14K/day','Create PO'],['inventory','b-blue','Promote 9 near-expiry SKUs','Expires < 90 days','Run promo'],['customer','b-blue','Push offer to 612 lapsed','est. ₹3.2 L lift','Send offer']].map(r=>`<div class="lrow"><div class="lico ${r[1]}">${ic(r[0])}</div><div style="flex:1"><div class="lt">${r[2]}</div><div class="ls">${r[3]}</div></div><button class="btn btn-sm btn-ghost">${r[4]}</button></div>`).join('')}
          <div style="background:var(--brand-soft);border-radius:10px;padding:13px;margin-top:10px">
            <div class="section-label" style="margin:0">Suggested action</div>
            <div style="font-size:13px;margin-top:6px">Run a 3-day "Gold Tier 2× points" weekend campaign and reorder Banarasi Dupatta + 2 saree SKUs.</div>
            <div class="ls" style="margin-top:6px">Expected impact: +₹2.4 L revenue · +6% repeat rate</div>
          </div>
        </div>
      </div>
    </div>`;
};
function footfallChart(){
 const wi=[8,14,22,30,38,44,40,52,46,30],bl=[3,7,11,15,18,20,17,28,22,14],w=580,h=165,max=58,bw=w/wi.length;
 const grid=[.2,.45,.7,.95].map(f=>`<line x1="0" y1="${(f*h).toFixed(0)}" x2="${w}" y2="${(f*h).toFixed(0)}" stroke="#EEF0F2" stroke-width="1" stroke-dasharray="2 6"/>`).join('');
 let bars='';wi.forEach((v,i)=>{const x=i*bw+bw*.15;bars+=`<rect class="ch-bar" style="--ci:${i}" x="${x.toFixed(1)}" y="${(h-(v/max)*h).toFixed(1)}" width="${(bw*.32).toFixed(1)}" height="${((v/max)*h).toFixed(1)}" rx="3" fill="url(#ff-wi)"/><rect class="ch-bar" style="--ci:${i+0.5}" x="${(x+bw*.38).toFixed(1)}" y="${(h-(bl[i]/max)*h).toFixed(1)}" width="${(bw*.32).toFixed(1)}" height="${((bl[i]/max)*h).toFixed(1)}" rx="3" fill="url(#ff-bl)"/>`});
 const conv=wi.map((v,i)=>bl[i]/v);
 const CY=conv.map((c,i)=>[i*bw+bw*.5,h-((c-.28)/.34)*h]);
 const cline=smoothPath(CY);
 const cdots=CY.map((c,i)=>`<circle class="spk-dot" style="--ci:${i}" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="2.8" fill="#fff" stroke="#0E7490" stroke-width="2"/>`).join('');
 return `<svg viewBox="0 0 ${w} ${h+20}" style="width:100%;height:195px;overflow:visible"><defs>
   <linearGradient id="ff-wi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9C7FF"/><stop offset="1" stop-color="#6C9FFF"/></linearGradient>
   <linearGradient id="ff-bl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B82F6"/><stop offset="1" stop-color="#0058BA"/></linearGradient>
   <filter id="ff-glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   ${grid}${bars}
   <path class="ch-line" d="${cline}" fill="none" stroke="#0E7490" stroke-width="2.2" stroke-dasharray="5 4" stroke-linecap="round" filter="url(#ff-glow)"/>
   ${cdots}
   ${['10A','','2P','','','6P','','','','10P'].map((m,i)=>m?`<text x="${(i*bw+bw*.3).toFixed(1)}" y="${h+15}" font-size="10" fill="#98A2B3" font-family="Plus Jakarta Sans">${m}</text>`:'').join('')}</svg>`;
}

/* ============ AI COPILOT ============ */
SCREENS.copilot=()=>{
 const chips=['Why are margins down today?','Which SKUs to reorder before the weekend?','Draft a WhatsApp campaign for lapsed Gold customers','Explain Counter 3 cash variance','Find bills with GST errors'];
 return head('AI Copilot','Operational retail assistant '+flag('NEW'),`<button class="btn">History</button>`)
  
  + `<div class="split-2" style="grid-template-columns:1fr 320px">
      <div class="card" style="display:flex;flex-direction:column;min-height:460px">
        <div class="card-h"><div style="display:flex;align-items:center;gap:9px"><span class="lico b-blue" style="width:30px;height:30px">${ic('ai')}</span><h3>Copilot</h3></div><span class="badge b-green"><span class="dot-g"></span>Reading live store data</span></div>
        <div class="card-pad" style="flex:1;display:flex;flex-direction:column;gap:14px">
          <div style="align-self:flex-end;background:var(--brand-1);color:#fff;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13px;max-width:80%">Which SKUs should I reorder before the weekend?</div>
          <div style="background:#F6F7F9;border-radius:14px 14px 14px 4px;padding:13px 15px;font-size:13px;max-width:90%">
            Based on Prophet forecast + current stock + supplier lead times, 3 SKUs will stock out before Sunday:
            <div style="margin-top:10px">${[['Banarasi Dupatta','forecast 48 · stock 0 · lead 7d'],['Silk Saree · Maroon','forecast 26 · stock 12'],['Embroidered Lehenga (L)','forecast 14 · stock 7']].map(r=>`<div class="lrow" style="padding:8px 0"><div class="lico b-amber" style="width:30px;height:30px">${ic('inventory')}</div><div style="flex:1"><div class="lt" style="font-size:12.5px">${r[0]}</div><div class="ls">${r[1]}</div></div></div>`).join('')}</div>
            <div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-sm btn-pri">Approve & draft 3 POs</button><button class="btn btn-sm">Show data basis</button></div>
          </div>
        </div>
        <div class="card-pad" style="border-top:1px solid var(--border-soft)"><div class="search" style="max-width:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg><input placeholder="Ask Copilot anything about your store…"></div></div>
      </div>
      <div class="card"><div class="card-h"><h3>Try asking</h3></div><div class="card-pad" style="display:flex;flex-direction:column;gap:8px">${chips.map(c=>`<div style="border:1px solid var(--border-soft);border-radius:10px;padding:10px 12px;font-size:12.5px;cursor:pointer">${c}</div>`).join('')}<div class="section-label" style="margin-top:8px">Guardrails</div><div class="cl">${cb(1)}<span style="color:var(--muted)">Shows data basis for every answer</span></div><div class="cl">${cb(1)}<span style="color:var(--muted)">Approval required for ₹ / stock actions</span></div></div></div>
    </div>`;
};

/* ============ ONBOARDING WIZARD ============ */
let OB_STEP=0;
const OB_STEPS=[
 {tag:'STEP 1 · BUSINESS PROFILE',h:'Set up your store.',sub:'Your store identity, GSTIN and invoice settings go on every bill, tax document and report.',ic:'settings'},
 {tag:'STEP 2 · GST & TAX',h:'Configure your taxes.',sub:'Map your product slabs, HSN/SAC codes and round-off rules so every bill is GST-compliant from the first sale.',ic:'reports'},
 {tag:'STEP 3 · IMPORT CATALOG',h:'Bring in your products.',sub:'Upload a CSV, scan barcodes or add products one by one. Ambel validates HSN, duplicate SKUs and GST slabs before import.',ic:'inventory'},
 {tag:'STEP 4 · OPEN REGISTER',h:'Open your cash drawer.',sub:'Set your opening float for each counter. Ambel tracks every rupee in and out from this baseline automatically.',ic:'register'},
 {tag:'STEP 5 · PAIR HARDWARE',h:'Connect your devices.',sub:'Thermal printer, barcode scanner and cash drawer: pair in seconds. Test each device before you go live.',ic:'hardware'},
 {tag:'STEP 6 · FIRST TRANSACTION',h:'Ring your first sale.',sub:'Run a test bill, verify the GST breakdown, print the bill and confirm your payment methods are working.',ic:'bill'},
 {tag:'STEP 7 · INVITE TEAM',h:'Bring in your team.',sub:'Add cashiers, managers and floor staff. Assign roles, set permissions and schedule their first shift.',ic:'staff'},
];
const OB_CONTENT=[
 // Step 0: Business Profile
 ()=>`<div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
   <label class="fld"><span>Legal business name</span><input type="text" value="Ambel Retail Pvt Ltd"></label>
   <label class="fld"><span>Store display name</span><input type="text" value="Ambel · Bandra"></label>
   <label class="fld"><span>GSTIN</span><input type="text" value="27ABCDE1234F1Z5"></label>
   <label class="fld"><span>Invoice prefix</span><input type="text" value="INV-"></label>
   <label class="fld" style="grid-column:1/-1"><span>Registered address</span><input type="text" value="12 Hill Rd, Bandra West, Mumbai 400050"></label>
   <label class="fld"><span>Contact phone</span><input type="text" value="+91 22 4000 1200"></label>
   <label class="fld"><span>Support email</span><input type="text" value="ops@Ambel.in"></label>
 </div>
 <div style="margin-top:16px">
   <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:10px">Bill options</div>
   ${[['Print GSTIN on bill',1],['Show HSN per line item',1],['Email Tax Invoice copy to customer',0]].map(t=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border-soft)"><div style="flex:1;font-size:13.5px">${t[0]}</div>${tg(t[1])}</div>`).join('')}
 </div>`,
 // Step 1: GST & Tax
 ()=>`<div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
   <label class="fld"><span>Default GST slab</span><select><option>5%</option><option>12%</option><option>18%</option><option>28%</option><option>Exempt</option></select></label>
   <label class="fld"><span>Composition scheme</span><select><option>No, regular taxpayer</option><option>Yes, composition</option></select></label>
   <label class="fld"><span>Price display</span><select><option>Exclusive of GST</option><option>Inclusive of GST</option></select></label>
   <label class="fld"><span>Round-off rule</span><select><option>Nearest ₹1</option><option>Nearest ₹0.50</option><option>No rounding</option></select></label>
   <label class="fld"><span>Place of supply</span><select><option>Maharashtra (27)</option><option>Delhi (07)</option><option>Karnataka (29)</option><option>Tamil Nadu (33)</option></select></label>
   <label class="fld"><span>CGST / SGST split</span><select><option>Equal halves (default)</option><option>All IGST (inter-state)</option></select></label>
 </div>
 <div style="margin-top:16px">
   <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:10px">Compliance options</div>
   ${[['Auto-pick GST slab from HSN',1],['Block sale if HSN is missing',0],['Warn on incomplete GSTIN',1],['Auto-generate GSTR-1 snapshot daily',1]].map(t=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border-soft)"><div style="flex:1;font-size:13.5px">${t[0]}</div>${tg(t[1])}</div>`).join('')}
 </div>`,
 // Step 2: Import Catalog
 ()=>`<div style="border:2px dashed var(--border);border-radius:var(--r-lg);padding:32px;text-align:center;cursor:pointer;transition:all .2s;background:var(--bg)" onmouseenter="this.style.borderColor='var(--brand-2)'" onmouseleave="this.style.borderColor='var(--border)'">
   <div style="width:52px;height:52px;background:var(--brand-soft);border-radius:14px;display:grid;place-items:center;margin:0 auto 14px;color:var(--brand-1)">${ic('inventory',26)}</div>
   <div style="font-family:var(--display);font-size:16px;font-weight:700;margin-bottom:6px">Drop your products.csv here</div>
   <div style="font-size:13px;color:var(--muted);margin-bottom:16px">Supports SKU, name, category, HSN, MRP, cost, GST slab, opening stock<br>Maximum 50,000 rows · auto-validated before import</div>
   <button class="btn-pri btn" style="height:38px">Browse file</button>
 </div>
 <div style="display:flex;gap:10px;align-items:center;margin:16px 0"><div style="flex:1;height:1px;background:var(--border-soft)"></div><span style="font-size:12px;color:var(--muted)">or add manually</span><div style="flex:1;height:1px;background:var(--border-soft)"></div></div>
 <div style="border:1px solid var(--border-soft);border-radius:var(--r);overflow:hidden;margin-bottom:12px">
   <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg-2)"><span style="font-size:12px;font-weight:700;color:var(--muted)">QUICK ADD</span><button class="btn btn-sm" onclick="toast('Row added')">${ic('plus')} Add row</button></div>
   ${DB.products.slice(0,3).map(p=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--border-soft);font-size:13px"><div style="flex:1"><b>${p.name}</b> <span style="color:var(--muted);font-size:12px">· ${p.sku} · ${p.cat}</span></div><span class="badge b-green">${money(p.price)}</span></div>`).join('')}
 </div>
 <div style="background:var(--success-soft);border-radius:10px;padding:10px 14px;font-size:13px;color:#0f8f63"><b>${DB.products.length} products</b> ready in catalog · 0 HSN issues</div>`,
 // Step 3: Open Register
 ()=>`<div class="grid" style="grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
   ${['Counter 1','Counter 2','Counter 3'].map((c,i)=>`<div style="border:1.5px solid ${i===0?'var(--brand-1)':'var(--border-soft)'};border-radius:var(--r);padding:16px;cursor:pointer;transition:all .2s;${i===0?'background:var(--brand-soft)':''}" onclick="this.closest('.grid').querySelectorAll('div').forEach(d=>{d.style.borderColor='var(--border-soft)';d.style.background='';});this.style.borderColor='var(--brand-1)';this.style.background='var(--brand-soft)'">
     <div style="font-family:var(--display);font-weight:700;margin-bottom:4px">${c}</div>
     <div style="font-size:12px;color:var(--muted)">${i===0?'Riya Sharma · Morning':i===1?'Aarav Pillai · Morning':'Meera Desai · Mid'}</div>
   </div>`).join('')}
 </div>
 <label class="fld" style="margin-bottom:14px"><span>Opening float ₹</span><input type="number" value="5000" style="font-family:var(--mono)"></label>
 <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:10px">Register options</div>
 ${[['Allow cash billing offline',1],['Auto-open drawer on each payment',1],['Require manager PIN for voids',1],['Block sale over ₹10,000 offline',1]].map(t=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border-soft)"><div style="flex:1;font-size:13.5px">${t[0]}</div>${tg(t[1])}</div>`).join('')}`,
 // Step 4: Pair Hardware
 ()=>`${[['Thermal Printer · 80mm','Cloud connected','b-green','Connected','Test print'],['Barcode Scanner','USB · Counter 1','b-green','Connected','Test scan'],['Cash Drawer','Auto-open on pay','b-amber','Not tested','Test open'],['Card Terminal','Pine Labs · C-1','b-red','Offline','Reconnect'],['Weighing Scale','Not paired','b-grey','N/A','Pair now']].map(d=>`
   <div style="display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid var(--border-soft)">
     <div style="width:38px;height:38px;border-radius:10px;background:var(--bg-2);display:grid;place-items:center;color:var(--brand-1)">${ic('hardware')}</div>
     <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${d[0]}</div><div style="font-size:12px;color:var(--muted)">${d[1]}</div></div>
     <span class="badge ${d[2]}">${d[3]}</span>
     <button class="btn btn-sm" onclick="toast('${d[4]} triggered')">${d[4]}</button>
   </div>`).join('')}
 <button class="btn-pri btn" style="width:100%;justify-content:center;margin-top:14px" data-act="pairdevice">${ic('plus')} Pair new device</button>`,
 // Step 5: First Transaction
 ()=>`<div style="background:var(--brand-soft);border-radius:var(--r-lg);padding:20px 22px;margin-bottom:16px;border:1.5px solid rgba(0,88,186,.14)">
   <div style="font-family:var(--display);font-size:15px;font-weight:700;color:var(--brand-1);margin-bottom:6px">Test transaction checklist</div>
   <div style="font-size:13px;color:var(--muted)">Complete these steps to verify your setup is working end-to-end.</div>
 </div>
 ${[['Add a product to the cart',1],['Apply a 5% discount',0],['Switch payment to UPI',1],['Charge ₹100 test bill',0],['Verify GST breakdown on bill',0],['Print bill on cloud printer',0]].map((c,i)=>`<div class="cl" style="padding:12px 0;border-bottom:1px solid var(--border-soft)">${cb(c[1])}<span style="font-size:13.5px;${c[1]?'color:var(--muted);text-decoration:line-through':''}">${c[0]}</span></div>`).join('')}
 <button class="btn-grad btn" style="width:100%;justify-content:center;margin-top:16px" onclick="go('billing');toast('Opening billing for test transaction…')">${ic('bolt')} Open billing for test</button>`,
 // Step 6: Invite Team
 ()=>`<div style="margin-bottom:14px">
   ${DB.staff.slice(0,3).map((s,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border-soft)">
     <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--brand-1),var(--brand-2));display:grid;place-items:center;font-family:var(--display);font-weight:700;font-size:13px;color:#fff">${s.name.split(' ').map(w=>w[0]).join('')}</div>
     <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${s.name}</div><div style="font-size:12px;color:var(--muted)">${s.role} · ${s.shift} · ${s.reg}</div></div>
     <span class="badge b-green">${ic('check',12)} Set up</span>
   </div>`).join('')}
 </div>
 <button class="btn-pri btn" style="width:100%;justify-content:center;margin-bottom:14px" data-act="addstaff">${ic('plus')} Invite another staff member</button>
 <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:10px">Default permissions</div>
 ${[['Cashier can issue discounts',0],['Cashier requires PIN for refunds',1],['Floor staff billing only',1]].map(t=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border-soft)"><div style="flex:1;font-size:13.5px">${t[0]}</div>${tg(t[1])}</div>`).join('')}`,
];
SCREENS.onboarding=()=>{
 const s=OB_STEPS[OB_STEP];
 const pct=Math.round((OB_STEP+1)/OB_STEPS.length*100);
 const stepsBar=OB_STEPS.map((_,i)=>`<div style="flex:1;height:4px;border-radius:2px;background:${i<=OB_STEP?'var(--brand-1)':'var(--border-soft)'};transition:background .4s"></div>`).join('');
 const prevBtn=OB_STEP>0?`<button class="btn" onclick="obNav(-1)">${ic('swap')} Back</button>`:'<div></div>';
 const nextBtn=OB_STEP<OB_STEPS.length-1
   ?`<button class="btn-grad btn" onclick="obNav(1)">${OB_STEP===OB_STEPS.length-2?'Finish setup':'Continue'} ${ic('bolt')}</button>`
   :`<button class="btn-grad btn" onclick="obComplete()">${ic('check')} Go to Dashboard</button>`;
 return `
 <div style="max-width:680px;margin:0 auto">
   <!-- progress -->
   <div style="display:flex;gap:5px;margin-bottom:28px">${stepsBar}</div>
   <!-- step tag + heading -->
   <div style="font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--brand-1);margin-bottom:12px">${s.tag}</div>
   <h2 style="font-family:var(--display);font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-.04em;line-height:1.04;margin-bottom:8px">${s.h}</h2>
   <p style="font-size:15px;color:var(--muted);line-height:1.65;margin-bottom:28px;max-width:540px">${s.sub}</p>
   <!-- content card -->
   <div class="card" style="margin-bottom:24px">
     <div class="card-h">
       <div style="display:flex;align-items:center;gap:10px">
         <span class="lico b-blue" style="width:34px;height:34px">${ic(s.ic)}</span>
         <h3>${s.tag.split(' · ')[1]}</h3>
       </div>
       <span class="badge b-blue">${OB_STEP+1} of ${OB_STEPS.length}</span>
     </div>
     <div class="card-pad">${OB_CONTENT[OB_STEP]()}</div>
   </div>
   <!-- nav -->
   <div style="display:flex;justify-content:space-between;align-items:center">
     ${prevBtn}
     <div style="font-size:13px;color:var(--muted)">${pct}% complete</div>
     ${nextBtn}
   </div>
 </div>`;
};
function obNav(dir){OB_STEP=Math.max(0,Math.min(OB_STEPS.length-1,OB_STEP+dir));go('onboarding');}
function obComplete(){OB_STEP=0;toast('Setup complete! Welcome to Ambel POS 🎉');go('dashboard');}
window.obNav=obNav;window.obComplete=obComplete;

/* ============ OFFLINE & SYNC ============ */
SCREENS.sync=()=>{
 const rows=[['BILL-OFF-014','Counter 1','UPI ₹2,100','2 min ago','b-amber','Queued'],['BILL-OFF-013','Counter 2','Cash ₹890','5 min ago','b-green','Synced'],['BILL-OFF-012','Counter 3','Card ₹4,200','8 min ago','b-red','Conflict']];
 return head('Offline & Sync','Keep selling when the internet drops '+flag('★'),`<button class="btn">${ic('sync')} Force sync</button>`)
  
  + kpis([{l:'Connection',v:'Online',m:'last drop 14:02 · 3 min'},{l:'Queued Offline',v:'1',m:'awaiting sync'},{l:'Synced Today',v:'47',m:'all reconciled'},{l:'Conflicts',v:'1',m:'<span class="dn">needs resolution</span>'}],4)
  + `<div class="split-2">
      <div class="card"><div class="card-h"><h3>Offline transaction queue</h3>${seg(['All','Queued','Conflicts'],'All')}</div>${dataTable(['Local ref','Counter','Payment','Captured','','Status'],rows.map(r=>`<tr><td class="t-mono t-strong">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="t-sub">${r[3]}</td><td><span class="badge ${r[4]}">${r[5]}</span></td><td></td></tr>`).join(''))}</div>
      <div class="card"><div class="card-h"><h3>Offline policy</h3></div><div class="card-pad">
        ${[['Allow offline cash billing',1],['Allow offline UPI (mark pending)',1],['Allow offline card',0],['Block bills above ₹10,000 offline',1],['Require manager PIN after 20 offline bills',1]].map(p=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-soft)"><div style="flex:1;font-size:13px">${p[0]}</div>${tg(p[1])}</div>`).join('')}
      </div></div>
    </div>`;
};

/* ============ HARDWARE ============ */
SCREENS.hardware=()=>{
 const dev=[['Thermal printer · 80mm','Cloud printer','b-amber','Paper low','Test print'],['Barcode scanner','USB · Counter 1','b-green','Connected','Test scan'],['Cash drawer','Auto-open on pay','b-green','Connected','Test open'],['Card terminal','Pine Labs · C-2','b-red','Offline 4 min','Reconnect'],['Weighing scale','Not paired','b-grey','N/A','Pair']];
 return head('Hardware & Devices','Pairing, health & device tests '+flag('NEW'),`<button class="btn-pri btn" data-act="pairdevice">${ic('plus')} Pair device</button>`)
  
  + kpis([{l:'Devices Paired',v:'4 of 5',m:'1 to pair'},{l:'Healthy',v:'3',m:'scanner · drawer · scale-pending'},{l:'Needs Attention',v:'2',m:'<span class="dn">printer · terminal</span>'},{l:'Last Self-Test',v:'08:55',m:'auto on register open'}],4)
  + `<div class="card"><div class="card-h"><h3>Connected devices</h3></div>${dataTable(['Device','Connection','Status','','Action'],dev.map(d=>`<tr><td class="t-strong">${d[0]}</td><td class="t-sub">${d[1]}</td><td><span class="badge ${d[2]}">${d[3]}</span></td><td></td><td><button class="btn btn-sm">${d[4]}</button></td></tr>`).join(''))}</div>`;
};

/* ============ CUSTOMER-FACING DISPLAY ============ */
SCREENS.cfd=()=>{
 return head('Customer-Facing Display','Second-screen mirror for the shopper '+flag('★'),`<button class="btn" data-act="pairdisplay">Pair display</button><button class="btn-pri btn" data-act="launchpreview">Launch preview</button>`)
  
  + `<div style="display:flex;justify-content:center;margin-top:8px"><div style="width:560px;max-width:100%;border:10px solid #1a1f2b;border-radius:20px;overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="background:var(--brand-grad);color:#fff;padding:22px 24px"><div style="font-size:13px;opacity:.85">Welcome back</div><div style="font-size:24px;font-weight:700">Anika Kapoor · <span style="font-size:14px;background:rgba(255,255,255,.2);padding:3px 9px;border-radius:8px">Gold</span></div></div>
      <div style="background:#fff;padding:22px 24px">
        ${[['Cotton Kurta · Indigo (M) × 2','₹3,148'],['Leather Belt · Tan','₹1,007'],['Lakmé Lip · Berry','₹382']].map(r=>`<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border-soft);font-size:15px"><span>${r[0]}</span><span class="num">${r[1]}</span></div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:var(--muted)"><span>GST (CGST+SGST)</span><span class="num">₹478</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:var(--success)"><span>Loyalty discount</span><span class="num">−₹250</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 4px;border-top:2px solid var(--ink);margin-top:6px"><b style="font-size:18px">Total payable</b><b class="num" style="font-size:30px">₹8,525</b></div>
        <div style="background:var(--success-soft);color:#0f8f63;border-radius:10px;padding:11px;text-align:center;font-size:14px;font-weight:600;margin-top:12px">★ You'll earn 170 points on this purchase</div>
      </div>
    </div></div>`;
};

/* ============ NOTIFICATIONS ============ */
SCREENS.notifications=()=>{
 const n=DB.notifs;
 const unread=n.filter(x=>!x.read).length;
 return head('Notification Center','Inbox with read/unread & filters '+flag('NEW'),`<button class="btn" data-act="markallread">${ic('check')} Mark all read</button>`)
  
  + `<div class="card"><div class="card-h">${tabs(['All','Unread'+(unread?' · '+unread:''),'Stock','Payment','Staff','GST'],'All')}</div><div class="card-pad" style="padding-top:6px">
      ${n.map((x,i)=>`<div class="lrow" style="${x.read?'opacity:.6':''}" onclick="markRead(${i})"><div class="lico ${x.b}">${ic(x.ic)}</div><div style="flex:1"><div class="lt">${x.msg} ${x.read?'':'<span class="dot-r" style="margin-left:4px"></span>'}</div><div class="ls">${x.time} · ${x.type}</div></div><button class="btn btn-sm btn-ghost">View</button></div>`).join('')}
    </div></div>`;
};

/* ============ SETTINGS ============ */
SCREENS.settings=()=>{
 const cards=[
  ['settings','Business Profile','Store identity, GSTIN, invoice header','b-green','Complete','EXISTING'],
  ['expenses','Tax & GST','Slabs, HSN/SAC, round-off','b-amber','12 products missing HSN','EXISTING'],
  ['payments','Payment Methods','Cash, card, UPI, wallets, gift cards','b-green','Active','EXISTING'],
  ['hardware','Hardware','Printer, scanner, drawer, scale','b-green','Active','NEW'],
  ['staff','Team & Roles','Roles, permission matrix, approval limits','b-green','Active','NEW'],
  ['bell','Notifications','Email, SMS, WhatsApp, in-app','b-green','Active','EXISTING'],
  ['api','API & Webhooks','Connect ERP, loyalty apps, e-commerce','b-blue','3 keys · 2 webhooks','NEW'],
  ['supplier','Integration Marketplace','Tally, WhatsApp, Razorpay, Shiprocket…','b-amber','2 disconnected','NEW'],
  ['doc','Document Vault','GST, FSSAI, lease per store & supplier','b-blue','38 documents','NEW'],
  ['reports','Audit Log','Who did what, when, from which counter','b-green','Active','NEW'],
  ['inventory','Modules','Toggle inventory, loyalty, gift cards','b-green','9 active','EXISTING'],
  ['channels','Store Preferences','Currency, language, SKU & invoice rules','b-green','INR · en-IN','EXISTING'],
 ];
 return head('Settings','Platform configuration · live status per card',``)
  
  + `<div class="grid" style="grid-template-columns:repeat(3,1fr)">${cards.map(c=>`<div class="card card-pad" style="cursor:pointer" onclick="openSetting('${c[1]}')"><div style="display:flex;align-items:flex-start;gap:11px"><span class="lico b-blue" style="width:34px;height:34px;flex-shrink:0">${ic(c[0])}</span><div style="flex:1"><div class="t-strong" style="display:flex;align-items:center;gap:7px">${c[1]} ${c[5]==='NEW'?flag('NEW'):''}</div><div class="ls">${c[2]}</div></div></div><div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px"><span class="badge ${c[3]}">${c[3]==='b-amber'?'<span class="dot-a"></span>':c[3]==='b-green'?'<span class="dot-g"></span>':''}${c[4]}</span><button class="btn btn-sm" onclick="event.stopPropagation();openSetting('${c[1]}')">Manage</button></div></div>`).join('')}</div>`;
};

/* ============ SETTINGS DETAIL ============ */
let SETTING_CUR='Business Profile';
const SETTING_DEF={
 'Business Profile':{ic:'settings',sub:'Store identity, GSTIN & invoice header',fields:[['Legal business name','Ambel Retail Pvt Ltd'],['Store display name','Ambel · Bandra'],['GSTIN','27ABCDE1234F1Z5'],['Invoice prefix','INV-'],['Registered address','12 Hill Rd, Bandra West, Mumbai 400050'],['Support phone','+91 22 4000 1200']],toggles:[['Print GSTIN on receipt',1],['Show HSN per line',1],['Email invoice copy to customer',0]]},
 'Tax & GST':{ic:'expenses',sub:'Slabs, HSN/SAC mapping & round-off',fields:[['Default GST slab','5%'],['Composition scheme','No'],['Round-off rule','Nearest ₹1'],['Place of supply','Maharashtra (27)']],toggles:[['Auto-pick slab from HSN',1],['Block sale if HSN missing',0],['Inclusive-of-tax pricing',1]]},
 'Payment Methods':{ic:'payments',sub:'Cash, card, UPI, wallets, gift cards',fields:[['Primary UPI VPA','Ambel@hdfcbank'],['Card PSP','Pine Labs'],['UPI PSP','Razorpay'],['Default tender','UPI']],toggles:[['Accept cash',1],['Accept card',1],['Accept UPI QR',1],['Accept gift cards',1],['Allow split payment',1]]},
 'Hardware':{ic:'hardware',sub:'Printer, scanner, drawer & scale',fields:[['Receipt printer','Thermal 80mm · Cloud'],['Barcode scanner','USB · Counter 1'],['Cash drawer','Auto-open on pay'],['Weighing scale','Not paired']],toggles:[['Auto cash-drawer kick',1],['Self-test on register open',1],['Buzzer on scan error',0]]},
 'Team & Roles':{ic:'staff',sub:'Roles, permission matrix & approval limits',fields:[['Default new-hire role','Cashier'],['Manager approval over','₹2,000'],['Auto clock-out after','10 hours'],['PIN length','4 digits']],toggles:[['Require PIN for refunds',1],['Require PIN for discounts',1],['Lock settings to Admin',1]]},
 'Notifications':{ic:'bell',sub:'Email, SMS, WhatsApp & in-app alerts',fields:[['Alert email','ops@Ambel.in'],['WhatsApp sender','+91 90000 12345'],['Low-stock threshold','At reorder level'],['Daily summary at','21:30']],toggles:[['Stock-out alerts',1],['Payment failure alerts',1],['Late clock-in alerts',1],['Daily GST summary',1],['Marketing opt-ins only (DND-safe)',1]]},
 'API & Webhooks':{ic:'api',sub:'Connect ERP, loyalty apps & e-commerce',fields:[['Live API key','sk_live_••••••4f2a'],['Webhook URL','https://erp.Ambel.in/hooks'],['Rate limit','600 req/min'],['API version','2026-04']],toggles:[['order.created webhook',1],['inventory.updated webhook',1],['payment.settled webhook',0]]},
 'Integration Marketplace':{ic:'supplier',sub:'Tally, WhatsApp, Razorpay, Shiprocket…',fields:[],apps:[['Tally','Accounting sync','b-green','Connected'],['WhatsApp Business','Campaigns & receipts','b-green','Connected'],['Razorpay','Payments','b-green','Connected'],['Shiprocket','Logistics','b-amber','Disconnected'],['Zoho Books','Accounting','b-amber','Disconnected'],['Shopify','E-commerce','b-grey','Available']]},
 'Document Vault':{ic:'doc',sub:'GST, FSSAI & lease per store / supplier',fields:[],docs:[['GST Registration Certificate','Ambel Retail · valid','b-green'],['FSSAI License','Beauty counter · exp 2027','b-green'],['Shop & Establishment','Bandra · valid','b-green'],['Lease Agreement · Bandra','exp Mar 2028','b-green'],['Supplier GST: HUL','missing','b-red']]},
 'Audit Log':{ic:'reports',sub:'Who did what, when & from which counter',fields:[],log:[['Pooja Menon','Approved refund RET-1143','C-1 · 14:42'],['Aarav Pillai','Opened register REG-0501-C2','C-2 · 10:00'],['Riya Sharma','Voided bill INV-24846','C-1 · 14:11'],['System','Auto-generated GSTR-1 snapshot','Cloud · 02:00'],['Karan B.','Edited GST slab on 3 SKUs','Web · Yesterday']]},
 'Modules':{ic:'inventory',sub:'Toggle inventory, loyalty & gift cards',fields:[],toggles:[['Inventory & stock',1],['Loyalty & points',1],['Gift cards',1],['Sales channels',1],['Delivery challan',1],['Receivables',1],['AI Copilot',1],['Customer-facing display',1],['Offline mode',1]]},
 'Store Preferences':{ic:'channels',sub:'Currency, language, SKU & invoice rules',fields:[['Currency','INR ₹'],['Language','English (en-IN)'],['Timezone','Asia/Kolkata'],['SKU format','COU-XXX-0000'],['Financial year start','April'],['Week starts','Monday']],toggles:[['Barcode auto-generate',1],['Negative stock block',1],['Multi-store price sync',0]]},
};
function openSetting(name){SETTING_CUR=name;go('settingsdetail');}
window.openSetting=openSetting;
SCREENS.settingsdetail=()=>{
 const d=SETTING_DEF[SETTING_CUR]||SETTING_DEF['Business Profile'];
 const back=`<button class="btn" onclick="go('settings')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M15 18l-6-6 6-6"/></svg> Settings</button>`;
 let body='';
 if(d.fields&&d.fields.length){
  body+=`<div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Configuration</h3></div><div class="card-pad"><div class="grid" style="grid-template-columns:repeat(2,1fr);gap:14px">${d.fields.map(f=>`<label class="fld"><span>${f[0]}</span><input type="text" value="${f[1]}"></label>`).join('')}</div></div></div>`;
 }
 if(d.toggles){
  body+=`<div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Options</h3></div><div class="card-pad">${d.toggles.map(t=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border-soft)"><div style="flex:1;font-size:13.5px">${t[0]}</div>${tg(t[1])}</div>`).join('')}</div></div>`;
 }
 if(d.apps){
  body+=`<div class="card"><div class="card-h"><h3>Integrations</h3><button class="btn btn-sm" data-act="connectchannel">${ic('plus')} Browse marketplace</button></div>${dataTable(['App','Purpose','Status','','Action'],d.apps.map(a=>`<tr><td class="t-strong">${a[0]}</td><td class="t-sub">${a[1]}</td><td><span class="badge ${a[2]}">${a[3]}</span></td><td></td><td><button class="btn btn-sm">${a[3]==='Connected'?'Manage':'Connect'}</button></td></tr>`).join(''))}</div>`;
 }
 if(d.docs){
  body+=`<div class="card"><div class="card-h"><h3>Documents</h3><button class="btn btn-sm">${ic('plus')} Upload</button></div>${dataTable(['Document','Detail','',''],d.docs.map(x=>`<tr><td class="t-strong">${x[0]}</td><td class="t-sub">${x[1]}</td><td><span class="badge ${x[2]}">${x[2]==='b-red'?'Missing':'Valid'}</span></td><td style="text-align:right"><button class="btn btn-sm">${x[2]==='b-red'?'Upload':'View'}</button></td></tr>`).join(''))}</div>`;
 }
 if(d.log){
  body+=`<div class="card"><div class="card-h"><h3>Recent activity</h3><button class="btn btn-sm">Export log</button></div>${dataTable(['User','Action','Where & when'],d.log.map(x=>`<tr><td class="t-strong">${x[0]}</td><td>${x[1]}</td><td class="t-sub t-mono">${x[2]}</td></tr>`).join(''))}</div>`;
 }
 return `<div class="page-head"><div style="display:flex;align-items:center;gap:14px"><span class="lico b-blue" style="width:40px;height:40px">${ic(d.ic)}</span><div><h2>${SETTING_CUR}</h2><div class="sub">${d.sub}</div></div></div><div class="head-actions">${back}${(d.fields&&d.fields.length)||d.toggles?`<button class="btn-pri btn" onclick="toast('${SETTING_CUR} settings saved');go('settings')">${ic('check')} Save changes</button>`:''}</div></div>`+body;
};

/* ============ STATE ENGINE ============ */
let billingMode='cashier';
function setBillingMode(m){billingMode=m;go('billing');}
window.setBillingMode=setBillingMode;

const DB={
 seq:24851,
 products:[
  {sku:'COU-DSL-2410',name:'Cotton Kurta · Indigo (M)',cat:'Mens Ethnic',price:1499,gst:5,cost:900,supplier:'Fabindia Mills',stock:84,reorder:30},
  {sku:'COU-WTC-0871',name:'Silk Saree · Maroon',cat:'Womens Ethnic',price:4400,gst:5,cost:2900,supplier:'Banaras Weaves',stock:12,reorder:20},
  {sku:'COU-ACC-3392',name:'Leather Belt · Tan (32)',cat:'Accessories',price:899,gst:12,cost:520,supplier:'Hidesign Co.',stock:48,reorder:25},
  {sku:'COU-COS-0912',name:'Lakmé Lip · Berry',cat:'Beauty',price:449,gst:18,cost:300,supplier:'HUL Distribution',stock:22,reorder:15,expiry:'12 Aug 2026'},
  {sku:'COU-DEN-5520',name:"Men's Slim Denim (32)",cat:'Mens Western',price:1999,gst:12,cost:1150,supplier:'Aravind Mills',stock:36,reorder:20},
  {sku:'COU-WMS-0044',name:'Embroidered Lehenga (S)',cat:'Womens Ethnic',price:8400,gst:5,cost:5200,supplier:'Surat Ambel',stock:7,reorder:10},
  {sku:'COU-FRG-1108',name:'Banarasi Dupatta · Gold',cat:'Womens Ethnic',price:2600,gst:5,cost:1700,supplier:'Banaras Weaves',stock:0,reorder:15},
 ],
 customers:[
  {name:'Anika Kapoor',phone:'+91 98201 11420',tier:'Gold',pts:1840,spend:142500,last:'Today 14:42'},
  {name:'Saanvi Iyer',phone:'+91 97412 33002',tier:'Gold',pts:2240,spend:198400,last:'Today 14:18'},
  {name:'Rohit Mehra',phone:'+91 99114 88245',tier:'Silver',pts:720,spend:56800,last:'Today 14:31'},
 ],
 suppliers:[
  {name:'Fabindia Mills',gstin:'27ABCDE1234F1Z5',terms:'Net 30',lead:'4d',pay:184500,status:['b-green','Active']},
  {name:'Aravind Mills',gstin:'07PQRST3322M5R8',terms:'Net 45',lead:'6d',pay:156000,status:['b-amber','Late']},
  {name:'HUL Distribution',gstin:'N/A',terms:'Net 7',lead:'2d',pay:12400,status:['b-red','GST missing']},
 ],
 orders:[
  {inv:'INV-24850',cust:'Anika Kapoor',cashier:'Riya S. · C-1',time:'14:42',method:'UPI',status:'Paid',amount:4280,lines:[['Cotton Kurta · Indigo (M)',2,2998],['Leather Belt · Tan',1,899],['Lakmé Lip · Berry',1,383]]},
  {inv:'INV-24849',cust:'Walk-in',cashier:'Riya S. · C-1',time:'14:39',method:'Cash',status:'Paid',amount:1240,lines:[['Lakmé Lip · Berry',2,766],['Hair serum',1,474]]},
  {inv:'INV-24848',cust:'Rohit Mehra',cashier:'Aarav P. · C-2',time:'14:31',method:'Card',status:'Paid',amount:8650,lines:[['Embroidered Lehenga (S)',1,8400],['Leather Belt · Tan',1,250]]},
  {inv:'INV-24847',cust:'Saanvi Iyer',cashier:'Aarav P. · C-2',time:'14:18',method:'Split',status:'Paid',amount:12400,lines:[['Silk Saree · Maroon',2,8800],['Banarasi Dupatta · Gold',1,2600],['Leather Belt · Tan',1,1000]]},
  {inv:'INV-24846',cust:'Walk-in',cashier:'Riya S. · C-1',time:'14:09',method:'UPI',status:'Held',amount:2100,lines:[["Men's Slim Denim (32)",1,1999],['Misc',1,101]]},
  {inv:'INV-24845',cust:'Vikram Joshi',cashier:'Meera D. · C-3',time:'13:58',method:'Card',status:'Refunded',amount:3450,lines:[['Silk Saree · Maroon',1,3450]]},
 ],
 cart:{custIdx:0,method:'UPI',redeem:false,lines:[{sku:'COU-DSL-2410',qty:2},{sku:'COU-ACC-3392',qty:1},{sku:'COU-COS-0912',qty:1}]},
 oFilter:{date:'Today',method:'',status:'',q:''},
 staff:[
  {name:'Riya Sharma',role:'Cashier',shift:'Morning',reg:'Counter 1',clock:'09:54',status:['b-green','On shift']},
  {name:'Aarav Pillai',role:'Senior Cashier',shift:'Morning',reg:'Counter 2',clock:'09:42',status:['b-green','On shift']},
  {name:'Meera Desai',role:'Cashier',shift:'Mid',reg:'Counter 3',clock:'12:08',status:['b-amber','Late clock-in']},
 ],
 expenses:[
  {id:'EXP-2204',cat:'Rent',payee:'Sai Properties',amt:85000,source:'Bank',status:['b-green','Approved']},
  {id:'EXP-2206',cat:'Cleaning',payee:'Nimisha Services',amt:4500,source:'Petty cash',status:['b-amber','Pending']},
  {id:'EXP-2208',cat:'Staff snacks',payee:'Local vendor',amt:1200,source:'Petty cash',status:['b-amber','Pending']},
 ],
 returns:[
  {ref:'RET-1143',inv:'INV-24795',cust:'Karan Singh',items:'1× Cotton Kurta (L)',reason:'Size issue',method:'Store credit',status:['b-amber','Pending'],amount:1499},
  {ref:'RET-1142',inv:'INV-24820',cust:'Vikram Joshi',items:'1× Silk Saree',reason:'Colour mismatch',method:'Card refund',status:['b-green','Approved'],amount:3450},
  {ref:'EXC-0204',inv:'INV-24710',cust:'Anjali Rao',items:'Lehenga (M) → (L)',reason:'Size swap',method:'Net ₹0',status:['b-blue','Exchange'],amount:0},
 ],
 challans:[
  {no:'DC-2026-0042',party:'Lifestyle Corp',purpose:'Inter-branch → Pune',qty:'24 units',status:['b-amber','Dispatched'],inv:'N/A'},
  {no:'DC-2026-0041',party:'Reliance Trends',purpose:'B2B bulk order',qty:'120 units',status:['b-green','Invoiced'],inv:'INV-24788'},
  {no:'DC-2026-0040',party:'Pothys Silks',purpose:'Approval order',qty:'8 units',status:['b-blue','Returned'],inv:'N/A'},
 ],
 notes:[
  {no:'CN-2026-018',type:'Credit',party:'Karan Singh',reason:'Return: size issue',amount:1499,status:['b-green','Issued']},
  {no:'CN-2026-017',type:'Credit',party:'Reliance Trends',reason:'Bulk price adjustment',amount:12000,status:['b-amber','Draft']},
  {no:'DN-2026-004',type:'Debit',party:'Forest Essentials',reason:'Supplier short-supply',amount:3200,status:['b-blue','Sent']},
 ],
 notifs:[
  {ic:'payments',b:'b-red',msg:'Card terminal C-2 went offline',time:'2 min ago',read:0,type:'Payment'},
  {ic:'inventory',b:'b-amber',msg:'Banarasi Dupatta out of stock',time:'12 min ago',read:0,type:'Stock'},
  {ic:'returns',b:'b-amber',msg:'Refund RET-1143 needs approval',time:'18 min ago',read:0,type:'Payment'},
  {ic:'reports',b:'b-green',msg:'GSTR-1 report ready for April',time:'1 hr ago',read:1,type:'GST'},
  {ic:'staff',b:'b-blue',msg:'Meera Desai clocked in late',time:'2 hr ago',read:1,type:'Staff'},
 ],
};
window.DB=DB;
const prod=s=>DB.products.find(p=>p.sku===s)||{price:0,gst:0,cost:0,name:s,expiry:false};
const money=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const initials=n=>n.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();

/* ---- cart maths ---- */
function cartCalc(){
 let sub=0,gst=0,disc=0,cost=0;
 DB.cart.lines.forEach(l=>{
  const p=prod(l.sku),line=p.price*l.qty;
  const d=p.expiry?Math.round(line*0.15):0;
  const tax=line-d, g=Math.round(tax*p.gst/100);
  sub+=tax;gst+=g;disc+=d;cost+=p.cost*l.qty;
 });
 const loyalty=DB.cart.redeem?200:0;
 const total=sub+gst-loyalty;
 const margin=sub>0?Math.round((sub-cost)/sub*100):0;
 return {sub,gst,disc,loyalty,total,cost,margin};
}
function addToCart(sku){const l=DB.cart.lines.find(x=>x.sku===sku);if(l)l.qty++;else DB.cart.lines.push({sku,qty:1});toast(prod(sku).name+' added');go('billing');}
function cartQty(sku,d){const l=DB.cart.lines.find(x=>x.sku===sku);if(!l)return;l.qty+=d;if(l.qty<1)DB.cart.lines=DB.cart.lines.filter(x=>x.sku!==sku);go('billing');}
function cartRemove(sku){DB.cart.lines=DB.cart.lines.filter(x=>x.sku!==sku);go('billing');}
function cartClear(){DB.cart.lines=[];DB.cart.redeem=false;go('billing');}
function setCartCustomer(i){DB.cart.custIdx=(i===''?null:+i);go('billing');}
function toggleRedeem(){DB.cart.redeem=!DB.cart.redeem;go('billing');}
function billSearch(q){
 const box=document.getElementById('bill-results');if(!box)return;
 q=q.trim().toLowerCase();
 if(!q){box.innerHTML='';box.style.display='none';return;}
 const hits=DB.products.filter(p=>p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q)).slice(0,6);
 box.style.display='block';
 box.innerHTML=hits.length?hits.map(p=>`<div class="res-row" onclick="addToCart('${p.sku}')"><div><div class="t-strong" style="font-size:13px">${p.name}</div><div class="t-sub t-mono">${p.sku} · ${p.stock} in stock</div></div><div style="display:flex;align-items:center;gap:10px"><span class="num">${money(p.price)}</span><span class="btn btn-sm btn-pri" style="height:28px">Add</span></div></div>`).join(''):`<div class="res-row" style="color:var(--muted)">No match for "${q}"</div>`;
}
function charge(){
 if(!DB.cart.lines.length){toast('Cart is empty: add items first');return;}
 const c=cartCalc();
 const inv='INV-'+(DB.seq++);
 const cust=DB.cart.custIdx!=null?DB.customers[DB.cart.custIdx]:null;
 const now=new Date();const time=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
 const lines=DB.cart.lines.map(l=>{const p=prod(l.sku);return [p.name,l.qty,p.price*l.qty];});
 DB.orders.unshift({inv,cust:cust?cust.name:'Walk-in',cashier:'Riya S. · C-1',time,method:DB.cart.method||'UPI',status:'Paid',amount:c.total,lines});
 DB.cart.lines.forEach(l=>{const p=prod(l.sku);if(p&&typeof p.stock==='number')p.stock=Math.max(0,p.stock-l.qty);});
 if(cust){cust.pts+=Math.round(c.total/50);cust.spend+=c.total;}
 DB.cart.lines=[];DB.cart.redeem=false;
 closeModal();
 openModal('Payment successful',
   `<div style="text-align:center;padding:8px 0 4px"><div style="width:64px;height:64px;border-radius:50%;background:var(--success-soft);color:#0f8f63;display:flex;align-items:center;justify-content:center;margin:0 auto 14px">${ic('check',30)}</div>
    <div style="font-size:22px;font-weight:700">${money(c.total)} charged</div>
    <div class="t-sub" style="margin-top:4px">${inv} · ${DB.cart.method||'UPI'} · ${cust?cust.name:'Walk-in'}</div>
    <div style="background:var(--bg);border-radius:10px;padding:12px;margin-top:14px;text-align:left;font-size:13px">${lines.map(l=>`<div style="display:flex;justify-content:space-between;padding:3px 0"><span>${l[0]} × ${l[1]}</span><span class="num">${money(l[2])}</span></div>`).join('')}</div>
    ${cust?`<div class="badge b-green" style="margin-top:12px"><span class="dot-g"></span>+${Math.round(c.total/50)} loyalty points → ${cust.name}</div>`:''}</div>`,
   'View in Orders','afterCharge');
 window.afterCharge=()=>{closeModal();go('orders');};
}
window.addToCart=addToCart;window.cartQty=cartQty;window.cartRemove=cartRemove;window.cartClear=cartClear;window.setCartCustomer=setCartCustomer;window.toggleRedeem=toggleRedeem;window.billSearch=billSearch;window.charge=charge;

/* ---- orders ops ---- */
function ordersFiltered(){
 const f=DB.oFilter;
 return DB.orders.filter(o=>{
  if(f.method&&o.method!==f.method)return false;
  if(f.status&&o.status!==f.status)return false;
  if(f.q){const q=f.q.toLowerCase();if(!(o.inv.toLowerCase().includes(q)||o.cust.toLowerCase().includes(q)))return false;}
  return true;
 });
}
function setOFilter(k,v){DB.oFilter[k]=v;go('orders');}
function oSearch(v){DB.oFilter.q=v;const t=document.getElementById('ord-body');if(t)t.innerHTML=ordersRows();}
function ordersRows(){
 const list=ordersFiltered();
 if(!list.length)return `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px">No bills match your filters.</td></tr>`;
 return list.map((o,i)=>`<tr class="${i===0?'sel':''}"><td class="t-mono t-strong">${o.inv}</td><td>${o.cust}</td><td class="t-sub">${o.cashier}</td><td class="t-mono">${o.time}</td><td>${o.method}</td><td><span class="badge ${o.status==='Paid'?'b-green':o.status==='Held'?'b-amber':'b-blue'}">${o.status}</span></td><td class="num t-strong" style="text-align:right">${money(o.amount)}</td><td style="text-align:right"><button class="btn btn-sm" onclick="viewInvoice('${o.inv}')">View</button></td></tr>`).join('');
}
function viewInvoice(inv){
 const o=DB.orders.find(x=>x.inv===inv);if(!o)return;
 openModal('Bill '+o.inv,
  `<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:12px"><div><div class="t-strong" style="font-size:15px">${o.cust}</div><div class="t-sub">${o.cashier} · ${o.time}</div></div><span class="badge ${o.status==='Paid'?'b-green':o.status==='Held'?'b-amber':'b-blue'}" style="height:fit-content">${o.status}</span></div>
   <table style="font-size:13px"><thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>${o.lines.map(l=>`<tr><td>${l[0]}</td><td class="num">${l[1]}</td><td class="num" style="text-align:right">${money(l[2])}</td></tr>`).join('')}</tbody></table>
   <div style="display:flex;justify-content:space-between;border-top:2px solid var(--ink);margin-top:8px;padding-top:10px"><b>Total · ${o.method}</b><b class="num" style="font-size:18px">${money(o.amount)}</b></div>`,
  'Print bill','printReceipt');
window.printReceipt=()=>{toast('Bill sent to cloud printer');closeModal();};
}
window.viewInvoice=viewInvoice;window.setOFilter=setOFilter;window.oSearch=oSearch;window.ordersRows=ordersRows;

/* ---- CSV export ---- */
function exportCSV(name,headers,rows){
 const esc=v=>'"'+String(v).replace(/"/g,'""')+'"';
 const csv=[headers.map(esc).join(',')].concat(rows.map(r=>r.map(esc).join(','))).join('\n');
 const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 toast('Downloaded '+name);
}
function exportOrders(){exportCSV('bills.csv',['Bill No.','Customer','Cashier','Time','Method','Status','Amount'],ordersFiltered().map(o=>[o.inv,o.cust,o.cashier,o.time,o.method,o.status,o.amount]));}
function exportCustomers(){exportCSV('customers.csv',['Name','Phone','Tier','Points','Lifetime spend'],DB.customers.map(c=>[c.name,c.phone,c.tier,c.pts,c.spend]));}
function exportSuppliers(){exportCSV('suppliers.csv',['Supplier','GSTIN','Terms','Lead','Payable'],DB.suppliers.map(s=>[s.name,s.gstin,s.terms,s.lead,s.pay]));}
function exportInventory(){exportCSV('inventory.csv',['SKU','Product','Category','Available','Reorder','Cost','Price','Supplier'],DB.products.map(p=>[p.sku,p.name,p.cat,p.stock,p.reorder,p.cost,p.price,p.supplier]));}
window.exportOrders=exportOrders;window.exportCustomers=exportCustomers;window.exportSuppliers=exportSuppliers;window.exportInventory=exportInventory;

/* ---- modal system ---- */
function openModal(title,body,okLabel,okFn){
 closeModal();
 const h=`<div class="modal-overlay" id="_modal" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-h"><h3>${title}</h3><span class="modal-x" onclick="closeModal()">✕</span></div><div class="modal-b">${body}</div>${okLabel?`<div class="modal-f"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn-pri btn" onclick="${okFn}()">${okLabel}</button></div>`:''}</div></div>`;
 document.body.insertAdjacentHTML('beforeend',h);
}
function closeModal(){const m=document.getElementById('_modal');if(m)m.remove();}
window.openModal=openModal;window.closeModal=closeModal;
function fld(id,label,opts){opts=opts||{};
 if(opts.type==='select')return `<label class="fld"><span>${label}</span><select id="${id}">${opts.options.map(o=>`<option>${o}</option>`).join('')}</select></label>`;
 return `<label class="fld"><span>${label}</span><input id="${id}" type="${opts.type||'text'}" placeholder="${opts.ph||''}" value="${opts.val||''}"></label>`;
}
const val=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};

/* ---- create forms (real inserts) ---- */
function addCustomerForm(){openModal('Add customer',fld('c_name','Full name',{ph:'e.g. Neha Verma'})+fld('c_phone','Phone',{ph:'+91 …'})+fld('c_tier','Tier',{type:'select',options:['Bronze','Silver','Gold']}),'Add customer','saveCustomer');}
function saveCustomer(){const n=val('c_name');if(!n){toast('Name is required');return;}DB.customers.unshift({name:n,phone:val('c_phone')||'N/A',tier:val('c_tier')||'Bronze',pts:0,spend:0,last:'Just now'});closeModal();toast(n+' added');go('customers');}
function addSupplierForm(){openModal('Add supplier',fld('s_name','Supplier name')+fld('s_gstin','GSTIN',{ph:'27ABCDE…'})+fld('s_terms','Payment terms',{type:'select',options:['Net 7','Net 15','Net 30','Net 45','Advance 50%']}),'Add supplier','saveSupplier');}
function saveSupplier(){const n=val('s_name');if(!n){toast('Name is required');return;}DB.suppliers.unshift({name:n,gstin:val('s_gstin')||'N/A',terms:val('s_terms'),lead:'N/A',pay:0,status:['b-green','Active']});closeModal();toast(n+' added');go('suppliers');}
function addInventoryForm(){openModal('Add inventory item',fld('i_name','Product name')+fld('i_sku','SKU',{ph:'COU-…'})+fld('i_cat','Category',{type:'select',options:['Mens Ethnic','Womens Ethnic','Mens Western','Accessories','Beauty']})+`<div style="display:flex;gap:10px">${fld('i_price','Price ₹',{type:'number'})}${fld('i_stock','Opening stock',{type:'number'})}</div>`,'Add item','saveInventory');}
function saveInventory(){const n=val('i_name');if(!n){toast('Name is required');return;}DB.products.unshift({sku:val('i_sku')||('COU-'+Math.floor(Math.random()*9000+1000)),name:n,cat:val('i_cat'),price:+val('i_price')||0,gst:5,cost:Math.round((+val('i_price')||0)*0.6),supplier:'N/A',stock:+val('i_stock')||0,reorder:10});closeModal();toast(n+' added to inventory');go('inventory');}
function createPOForm(){openModal('Create purchase order',fld('po_sup','Supplier',{type:'select',options:DB.suppliers.map(s=>s.name)})+fld('po_item','Item',{type:'select',options:DB.products.map(p=>p.name)})+fld('po_qty','Quantity',{type:'number',ph:'e.g. 60'}),'Create PO','savePO');}
function savePO(){const po='PO-2026-0'+(191+Math.floor(Math.random()*9));closeModal();toast(po+' created for '+val('po_sup'));}
window.addCustomerForm=addCustomerForm;window.saveCustomer=saveCustomer;window.addSupplierForm=addSupplierForm;window.saveSupplier=saveSupplier;window.addInventoryForm=addInventoryForm;window.saveInventory=saveInventory;window.createPOForm=createPOForm;window.savePO=savePO;

/* ---- additional create / action forms ---- */
function row2(a,b){return `<div style="display:flex;gap:10px">${a}${b}</div>`;}
function addStaffForm(){openModal('Add staff member',
  fld('st_name','Full name',{ph:'e.g. Neha Verma'})
  +fld('st_role','Role',{type:'select',options:['Cashier','Senior Cashier','Manager','Floor staff','Admin']})
  +row2(fld('st_shift','Shift',{type:'select',options:['Morning','Mid','Evening']}),fld('st_reg','Register',{type:'select',options:['Counter 1','Counter 2','Counter 3','Unassigned']}))
  +fld('st_phone','Phone',{ph:'+91 …'}),'Add staff','saveStaff');}
function saveStaff(){const n=val('st_name');if(!n){toast('Name is required');return;}DB.staff.unshift({name:n,role:val('st_role'),shift:val('st_shift'),reg:val('st_reg'),clock:'N/A',status:['b-grey','Off shift']});closeModal();toast(n+' added to team');go('staff');}

function addExpenseForm(){openModal('Add expense',
  fld('ex_cat','Category',{type:'select',options:['Rent','Utilities','Cleaning','Staff snacks','Maintenance','Marketing','Logistics','Misc']})
  +fld('ex_payee','Paid to',{ph:'Vendor / person'})
  +row2(fld('ex_amt','Amount ₹',{type:'number',ph:'0'}),fld('ex_src','Source',{type:'select',options:['Petty cash','Bank','Card','UPI']})),'Add expense','saveExpense');}
function saveExpense(){const a=+val('ex_amt')||0;if(!a){toast('Amount is required');return;}const id='EXP-'+(2209+Math.floor(Math.random()*40));DB.expenses.unshift({id,cat:val('ex_cat'),payee:val('ex_payee')||'N/A',amt:a,source:val('ex_src'),status:['b-amber','Pending']});closeModal();toast(id+' recorded');go('expenses');}

function newReturnForm(){openModal('New return',
  fld('rt_inv','Original Tax Invoice',{type:'select',options:DB.orders.map(o=>o.inv+' · '+o.cust)})
  +fld('rt_item','Item returned',{ph:'e.g. 1× Cotton Kurta (L)'})
  +fld('rt_reason','Reason',{type:'select',options:['Size issue','Colour mismatch','Defective','Changed mind','Wrong item']})
  +row2(fld('rt_method','Refund method',{type:'select',options:['Store credit','Card refund','UPI refund','Cash']}),fld('rt_amt','Amount ₹',{type:'number',ph:'0'})),'Create return','saveReturn');}
function saveReturn(){const it=val('rt_item');if(!it){toast('Item is required');return;}const ref='RET-'+(1144+Math.floor(Math.random()*60));DB.returns.unshift({ref,inv:(val('rt_inv')||'N/A').split(' · ')[0],cust:(val('rt_inv')||'N/A · Walk-in').split(' · ')[1]||'Walk-in',items:it,reason:val('rt_reason'),method:val('rt_method'),status:['b-amber','Pending'],amount:+val('rt_amt')||0});closeModal();toast(ref+' created · awaiting approval');go('returns');}
function newExchangeForm(){openModal('New exchange',
  fld('ex_inv','Original Tax Invoice',{type:'select',options:DB.orders.map(o=>o.inv+' · '+o.cust)})
  +fld('ex_out','Returning item',{ph:'e.g. Lehenga (M)'})
  +fld('ex_in','New item',{ph:'e.g. Lehenga (L)'})
  +`<div style="background:var(--brand-soft);border-radius:10px;padding:11px;margin-top:4px;font-size:12.5px;color:var(--muted)">One net payment · single GST recalculation · one bill.</div>`,'Create exchange','saveExchange');}
function saveExchange(){const o=val('ex_out');if(!o){toast('Returning item required');return;}const ref='EXC-'+('0'+(205+Math.floor(Math.random()*40))).slice(-4);DB.returns.unshift({ref,inv:(val('ex_inv')||'N/A').split(' · ')[0],cust:(val('ex_inv')||'N/A · Walk-in').split(' · ')[1]||'Walk-in',items:o+' → '+val('ex_in'),reason:'Size swap',method:'Net ₹0',status:['b-blue','Exchange'],amount:0});closeModal();toast(ref+' exchange created');go('returns');}

function newChallanForm(){openModal('New delivery challan',
  fld('dc_party','Party',{ph:'Customer / branch'})
  +fld('dc_purpose','Purpose',{type:'select',options:['B2B bulk order','Inter-branch transfer','Approval order','Job work']})
  +row2(fld('dc_qty','Quantity (units)',{type:'number',ph:'0'}),fld('dc_item','Item',{type:'select',options:DB.products.map(p=>p.name)})),'Create challan','saveChallan');}
function saveChallan(){const p=val('dc_party');if(!p){toast('Party is required');return;}const no='DC-2026-00'+(43+Math.floor(Math.random()*50));DB.challans.unshift({no,party:p,purpose:val('dc_purpose'),qty:(val('dc_qty')||'0')+' units',status:['b-amber','Dispatched'],inv:'N/A'});closeModal();toast(no+' dispatched');go('challan');}

function newNoteForm(){openModal('New credit / debit note',
  fld('nt_type','Note type',{type:'select',options:['Credit note (to customer)','Debit note (to supplier)']})
  +fld('nt_party','Party',{ph:'Customer / supplier'})
  +fld('nt_reason','Reason',{type:'select',options:['Return: size issue','Bulk price adjustment','Supplier short-supply','Damaged goods','Goodwill credit']})
  +fld('nt_amt','Amount ₹',{type:'number',ph:'0'}),'Create note','saveNote');}
function saveNote(){const p=val('nt_party');if(!p){toast('Party is required');return;}const type=val('nt_type').startsWith('Credit')?'Credit':'Debit';const no=(type==='Credit'?'CN':'DN')+'-2026-0'+(19+Math.floor(Math.random()*60));DB.notes.unshift({no,type,party:p,reason:val('nt_reason'),amount:+val('nt_amt')||0,status:['b-amber','Draft']});closeModal();toast(no+' drafted');go('creditnotes');}

function connectChannelForm(){openModal('Connect a channel',
  fld('cc_ch','Channel',{type:'select',options:['Amazon','Flipkart','Instagram Shop','Myntra','WhatsApp Catalog','Ambel Online (web)']})
  +fld('cc_acct','Account / seller ID',{ph:'e.g. Ambel-seller'})
  +`<div style="display:flex;gap:10px;align-items:center;margin-top:6px"><div style="flex:1;font-size:13px">Sync one stock pool in real-time</div>${tg(1)}</div>`,'Connect','doConnectChannel');}
function doConnectChannel(){const ch=val('cc_ch');closeModal();toast(ch+' connecting: stock sync starting…');go('channels');}

function newBroadcastForm(){openModal('New WhatsApp broadcast',
  fld('wb_aud','Audience',{type:'select',options:['Gold tier (612)','Lapsed 90D+ (248)','All opted-in (2,140)','Walk-ins this month (388)','B2B / corporate (24)']})
  +fld('wb_tpl','Template',{type:'select',options:['Weekend offer (Marketing)','Festive collection (Marketing)','Tax invoice (Utility)','Order shipped (Utility)']})
  +fld('wb_when','Send',{type:'select',options:['Now','Schedule for 6:30 PM today','Schedule for tomorrow 11 AM']})
  +`<div style="display:flex;gap:10px;align-items:center;margin-top:6px"><div style="flex:1;font-size:13px">Skip numbers without marketing consent (DND-safe)</div>${tg(1)}</div>`,'Send broadcast','doNewBroadcast');}
function doNewBroadcast(){const a=val('wb_aud');closeModal();toast('Broadcast queued → '+a+' · est. ₹3.2 L lift');go('whatsapp');}
function newTemplateForm(){openModal('New message template',
  fld('wt_name','Template name',{ph:'e.g. Back-in-stock alert'})
  +fld('wt_cat','Category',{type:'select',options:['Utility (transactional)','Marketing (promotional)','Authentication (OTP)']})
  +`<label class="fld"><span>Body</span><textarea id="wt_body" rows="3" style="resize:vertical;font-family:inherit" placeholder="Use {name}, {amount}, {link} as variables">Namaste {name}! {item} is back in stock at Ambel Bandra. Reply YES to reserve yours.</textarea></label>`
  +`<div class="t-sub" style="margin-top:2px">Submitted to Meta &amp; DLT for approval; usually live within a few hours.</div>`,'Submit for approval','doNewTemplate');}
function doNewTemplate(){const n=val('wt_name');if(!n){toast('Template name is required');return;}closeModal();toast('"'+n+'" submitted for approval');go('whatsapp');}
window.newBroadcastForm=newBroadcastForm;window.doNewBroadcast=doNewBroadcast;window.newTemplateForm=newTemplateForm;window.doNewTemplate=doNewTemplate;

function genReportForm(){openModal('Generate report',
  fld('rp_type','Report',{type:'select',options:['Daily Sales Summary','GST Output (GSTR-1)','Stock Valuation','Supplier & Vendor Ledger','Profit & Loss','Customer Loyalty']})
  +row2(fld('rp_from','From',{type:'date'}),fld('rp_to','To',{type:'date'}))
  +fld('rp_fmt','Format',{type:'select',options:['PDF','XLSX','CSV download','Email to me']}),'Generate','doGenReport');}
function doGenReport(){const t=val('rp_type');const f=val('rp_fmt');closeModal();if(f==='CSV download'){exportCSV('report.csv',['Metric','Value'],[['Report',t],['Net sales','3240000'],['Bills','2418'],['GST output','420000']]);}else{toast(t+' generated · '+f);}}
function scheduleReportForm(){openModal('Schedule a report',
  fld('sr_type','Report',{type:'select',options:['Daily Sales Summary','GST Output (GSTR-1)','Stock Valuation','Profit & Loss']})
  +row2(fld('sr_freq','Frequency',{type:'select',options:['Daily','Weekly','Monthly']}),fld('sr_time','Send at',{type:'time',val:'21:30'}))
  +fld('sr_to','Email to',{ph:'ops@Ambel.in'}),'Schedule','doScheduleReport');}
function doScheduleReport(){closeModal();toast(val('sr_type')+' scheduled · '+val('sr_freq'));}

function runSettlement(){openModal('Run settlement · 03 May',
  `<div class="t-sub" style="margin-bottom:12px">Match captured payments to bank settlement by tender.</div>
   <table style="font-size:13px"><thead><tr><th>Tender</th><th style="text-align:right">Captured</th><th style="text-align:right">Settled</th><th></th></tr></thead><tbody>
   ${[['UPI · Razorpay','₹2,18,000','₹2,18,000','b-green','Matched'],['Card · Pine Labs','₹1,62,000','₹1,62,000','b-green','Matched'],['UPI · PhonePe','₹84,200','N/A','b-amber','Expected 8 PM'],['Cash · Drawer','₹35,240','₹35,240','b-green','Counted']].map(r=>`<tr><td class="t-strong">${r[0]}</td><td class="num" style="text-align:right">${r[1]}</td><td class="num" style="text-align:right">${r[2]}</td><td style="text-align:right"><span class="badge ${r[3]}">${r[4]}</span></td></tr>`).join('')}
   </tbody></table>
   <div style="display:flex;justify-content:space-between;border-top:2px solid var(--ink);margin-top:8px;padding-top:10px"><b>Total settled</b><b class="num" style="font-size:17px">₹4,15,240</b></div>`,'Confirm settlement','doSettlement');}
function doSettlement(){closeModal();toast('Settlement confirmed · UTRs matched');}

function openRegisterForm(){openModal('Open register',
  fld('or_counter','Counter',{type:'select',options:['Counter 1','Counter 2','Counter 3']})
  +fld('or_cashier','Cashier',{type:'select',options:DB.staff.map(s=>s.name)})
  +fld('or_float','Opening float ₹',{type:'number',val:'5000'}),'Open register','doOpenRegister');}
function doOpenRegister(){const c=val('or_counter');closeModal();toast(c+' opened · float '+money(+val('or_float')||0));go('register');}
function cashInOutForm(){openModal('Cash in / out',
  fld('ci_type','Type',{type:'select',options:['Cash in (add float)','Cash out (bank drop / expense)']})
  +fld('ci_amt','Amount ₹',{type:'number',ph:'0'})
  +fld('ci_reason','Reason',{ph:'e.g. bank drop'}),'Record','doCashInOut');}
function doCashInOut(){const a=+val('ci_amt')||0;if(!a){toast('Amount required');return;}closeModal();toast('Recorded '+money(a)+' '+(val('ci_type').startsWith('Cash in')?'in':'out'));}

function pairDeviceForm(){openModal('Pair a device',
  fld('pd_type','Device type',{type:'select',options:['Thermal printer','Barcode scanner','Cash drawer','Card terminal','Weighing scale','Label printer']})
  +fld('pd_conn','Connection',{type:'select',options:['Bluetooth','USB','Network (LAN)','Cloud']})
  +fld('pd_name','Device name',{ph:'e.g. Counter 1 printer'}),'Pair device','doPairDevice');}
function doPairDevice(){const t=val('pd_type');closeModal();toast(t+' paired · running self-test…');go('hardware');}

function launchPreview(){openModal('Customer display · live preview',
  `<div style="border-radius:14px;overflow:hidden;border:1px solid var(--border)">
     <div style="background:var(--brand-grad);color:#fff;padding:18px 20px"><div style="font-size:12px;opacity:.85">Welcome back</div><div style="font-size:20px;font-weight:700">Anika Kapoor · <span style="font-size:12px;background:rgba(255,255,255,.2);padding:2px 8px;border-radius:7px">Gold</span></div></div>
     <div style="background:#fff;padding:18px 20px">
       ${[['Cotton Kurta · Indigo (M) × 2','₹3,148'],['Leather Belt · Tan','₹1,007'],['Lakmé Lip · Berry','₹382']].map(r=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border-soft);font-size:14px"><span>${r[0]}</span><span class="num">${r[1]}</span></div>`).join('')}
       <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0 2px;border-top:2px solid var(--ink);margin-top:6px"><b style="font-size:15px">Total payable</b><b class="num" style="font-size:24px">₹8,525</b></div>
       <div style="background:var(--success-soft);color:#0f8f63;border-radius:9px;padding:9px;text-align:center;font-size:13px;font-weight:600;margin-top:10px">★ Earns 170 points</div>
     </div>
   </div>
   <div class="t-sub" style="text-align:center;margin-top:10px">This mirrors the billing cart in real time on the paired second screen.</div>`,'Push to display','doLaunchDisplay');}
function doLaunchDisplay(){closeModal();toast('Preview pushed to customer display');}
function pairDisplay(){openModal('Pair customer display',
  fld('pds_type','Display device',{type:'select',options:['Android tablet','iPad','HDMI second screen','Web URL']})
  +fld('pds_code','Pairing code',{val:'CFD-7741',ph:''})
  +`<div class="t-sub" style="margin-top:4px">Open <b>display.Ambel.in</b> on the second screen and enter this code.</div>`,'Pair display','doPairDisplay');}
function doPairDisplay(){closeModal();toast('Customer display paired');go('cfd');}
function scheduleShiftForm(){openModal('Schedule a shift',
  fld('ss_staff','Staff',{type:'select',options:DB.staff.map(s=>s.name)})
  +row2(fld('ss_shift','Shift',{type:'select',options:['Morning','Mid','Evening']}),fld('ss_reg','Register',{type:'select',options:['Counter 1','Counter 2','Counter 3']}))
  +fld('ss_date','Date',{type:'date'}),'Schedule','doScheduleShift');}
function doScheduleShift(){closeModal();toast(val('ss_staff')+' scheduled · '+val('ss_shift'));}

/* notifications */
function updateNdot(){const d=document.querySelector('.tb-icon .ndot');if(d)d.style.display=DB.notifs.some(n=>!n.read)?'':'none';}
function markAllRead(){DB.notifs.forEach(n=>n.read=1);updateNdot();toast('All notifications marked read');go('notifications');}
function markRead(i){if(DB.notifs[i]){DB.notifs[i].read=1;updateNdot();go('notifications');}}
window.markRead=markRead;window.updateNdot=updateNdot;
Object.assign(window,{saveStaff,saveExpense,saveReturn,saveExchange,saveChallan,saveNote,doConnectChannel,doGenReport,doScheduleReport,doSettlement,doOpenRegister,doCashInOut,doPairDevice,doLaunchDisplay,doPairDisplay,doScheduleShift});

/* ---- toast ---- */
let _toastTimer;
function toast(msg){
 let t=document.getElementById('_toast');
 if(!t){t=document.createElement('div');t.id='_toast';t.className='toast';document.body.appendChild(t);}
 t.textContent=msg;void t.offsetWidth;t.classList.add('show');
 clearTimeout(_toastTimer);_toastTimer=setTimeout(()=>t.classList.remove('show'),1800);
}
window.toast=toast;
const _CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M20 6L9 17l-5-5"/></svg>';

/* ---- action dispatcher ---- */
const ACTIONS={
 newbill:()=>go('billing'), opencreatepo:createPOForm, addcustomer:addCustomerForm, addsupplier:addSupplierForm,
 addinventory:addInventoryForm, exportorders:exportOrders, exportcustomers:exportCustomers,
 exportsuppliers:exportSuppliers, exportinventory:exportInventory,
 addstaff:addStaffForm, scheduleshift:scheduleShiftForm,
 addexpense:addExpenseForm, exportexpenses:()=>exportCSV('expenses.csv',['ID','Category','Paid to','Amount','Source','Status'],DB.expenses.map(e=>[e.id,e.cat,e.payee,e.amt,e.source,e.status[1]])),
 newreturn:newReturnForm, newexchange:newExchangeForm,
 newchallan:newChallanForm, newnote:newNoteForm, connectchannel:connectChannelForm,
 genreport:genReportForm, schedulereport:scheduleReportForm,
 runsettlement:runSettlement, openregister:openRegisterForm, cashinout:cashInOutForm,
 pairdevice:pairDeviceForm, pairdisplay:pairDisplay, launchpreview:launchPreview,
 markallread:markAllRead,
 newbroadcast:newBroadcastForm, newtemplate:newTemplateForm,
};

document.addEventListener('click',e=>{
 let el;
 if(el=e.target.closest('[data-act]')){const fn=ACTIONS[el.dataset.act];if(fn){fn();return;}}
 if(el=e.target.closest('.res-row')){return;} // handled by inline onclick
 if(el=e.target.closest('.tabs .tab')){if(el.isConnected){el.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');}return;}
 if(el=e.target.closest('.seg b')){if(el.isConnected&&!el.getAttribute('onclick')){el.parentElement.querySelectorAll('b').forEach(t=>t.classList.remove('active'));el.classList.add('active');}return;}
 if(el=e.target.closest('.store-pill')){document.querySelectorAll('.store-pill').forEach(p=>p.classList.remove('active'));el.classList.add('active');toast('Switched to '+el.textContent.trim());return;}
 if(el=e.target.closest('[data-pay]')){const g=el.closest('.pay-grid');if(g)g.querySelectorAll('[data-pay]').forEach(b=>b.classList.remove('btn-pri'));el.classList.add('btn-pri');DB.cart.method=el.dataset.pay;return;}
 if(el=e.target.closest('.tg')){el.classList.toggle('on');return;}
 if(el=e.target.closest('.cl')){const b=el.querySelector('.cb');if(b){b.classList.toggle('on');b.innerHTML=b.classList.contains('on')?_CHECK:'';}return;}
 if(el=e.target.closest('button.btn, .switch-app')){
   if(!el.getAttribute('onclick')&&!el.getAttribute('data-act')){const l=(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,42);toast((l||'Action')+': not wired in this prototype');}
 }
});

/* boot */
go('map');
updateNdot();
/* <<INSERT-SCREENS>> */

/* ========== AUTH / ONBOARDING SYSTEM ========== */
/* ========== AUTH SYSTEM ========== */
const AUTH = {
  cur:'splash', hist:[], loginTab:'mobile', step:0, category:'fashion', plan:'growth', billing:'annual',
  d:{
    cc:'+91',phone:'',email:'',name:'',password:'',
    legalName:'',tradeName:'',bizType:'pvtltd',estYear:'2023',stores:'1',cin:'',natureBiz:'retailer',
    gstStatus:'regular',gstin:'',pan:'',placeOfSupply:'Maharashtra',fssai:'',drugLic:'',msme:'',shopEst:'',eInvoice:false,eWayBill:false,
    storeName:'',addr1:'',addr2:'',pincode:'',city:'Mumbai',state:'Maharashtra',locality:'',storeType:'highstreet',storeCategory:'branch',sqft:'',storeCode:'',openTime:'10:00',closeTime:'21:00',mgr:'',mgrPhone:'',
    invPfx:'INV-',invStart:'1',billTerms:'0',gstMode:'exclusive',defSlab:'12',rounding:'nearest1',fy:'april',showHSN:true,dupCopy:false,qrInv:false,digSig:false,invFooter:'Thank you for shopping with us!',
    cash:true,maxCash:'200000',upi:true,upiPsp:'razorpay',upiVpa:'',soundBox:false,card:true,cardPsp:'pinelabs',edcId:'',contactless:true,emi:false,giftCard:false,giftFormat:'qr',storeCredit:false,creditLimit:'5000',cheque:false,split:true,advance:false,
    skuCount:'100-500',importMethod:'csv',uom:'piece',barcode:'ean13',hsnAuto:true,mrpMandatory:true,batch:false,expiry:false,variants:true,serial:false,weightPrice:false,serviceItem:false,negStock:'block',lowStockPct:'15',
    counters:'2',printer:'cloud',paperWidth:'80',scanType:'usb',drawerMode:'auto',cardTermType:'none',cfd:'none',scaleType:'none',labelPrint:false,kds:false,
    adminPin:'',confirmPin:'',pinForDiscount:true,pinForRefund:true,pinForVoid:true,pinForSettings:true,pinDiscPct:'10',bioLogin:false,
    cashierName:'',cashierPhone:'',cashierPin:'',cashierRole:'cashier',cashierShift:'morning',cashierAccess:'standard',
    float:'5000',clockout:'10',eodReminder:'21:30',attendanceMode:'pin',
  }
};

/* navigation */
function authGo(id,dir){
  dir=dir||'fwd';
  const scr=document.getElementById('auth-scr');
  const old=scr.firstElementChild;
  if(old){
    old.style.transition='transform .42s cubic-bezier(.22,.68,0,1),opacity .32s';
    old.style.transform=dir==='fwd'?'translateX(-5%) scale(.97)':'translateX(5%) scale(.97)';
    old.style.opacity='0';
    setTimeout(function(){if(old.parentNode===scr)old.remove();},460);
  }
  AUTH.cur=id;
  if(dir!=='back')AUTH.hist.push(id);
  const el=document.createElement('div');
  el.className='a-scr-inner';
  el.style.transform=dir==='fwd'?'translateX(5%) scale(.98)':'translateX(-5%) scale(.98)';
  el.style.opacity='0';
  el.innerHTML=AUTH_SCREENS[id]?AUTH_SCREENS[id]():'';
  scr.appendChild(el);
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    el.style.transition='transform .42s cubic-bezier(.22,.68,0,1),opacity .35s';
    el.style.transform='none';el.style.opacity='1';
  });});
  if(id==='otp'){setTimeout(function(){var b=document.querySelector('.a-otp-box');if(b)b.focus();},350);startOtpTimer();}
}
function authBack(){if(AUTH.hist.length>1){AUTH.hist.pop();authGo(AUTH.hist[AUTH.hist.length-1],'back');}}
function completeAuth(){
  var layer=document.getElementById('auth-layer');
  layer.style.transition='opacity .65s,transform .65s';
  layer.style.opacity='0';layer.style.transform='scale(1.04)';
  setTimeout(function(){layer.style.display='none';go('dashboard');},700);
}
/* US (+1) numbers hand off to the US edition app (/us/*); +91 stays in the India flow. */
function authSubmit(){
  if(AUTH.d.cc==='+1'){window.location.href='/us/auth';return;}
  authGo('otp');
}
window.authGo=authGo;window.authBack=authBack;window.completeAuth=completeAuth;window.authSubmit=authSubmit;

/* helpers */
var POSSVG='<img src="/logo.png" alt="Ambel POS" style="max-width:70%;max-height:70%;width:auto;height:auto;object-fit:contain;display:block" />';
var CHK='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>';
var EYESVG='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
var STATES=['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
var YEARS=(function(){var a=[];for(var y=2025;y>=1980;y--)a.push(String(y));return a;})();

function af(id,label,opts){
  opts=opts||{};
  var type=opts.type||'text',ph=opts.ph||'',val=opts.val,options=opts.options||[],hint=opts.hint||'',req=opts.req||false,w=opts.w||'100%';
  var v=AUTH.d[id]!==undefined?AUTH.d[id]:(val!==undefined?val:'');
  var star=req?'<span class="ar">*</span>':'';
  var hintD=hint?'<div class="ah">'+hint+'</div>':'';
  if(type==='select'){
    var os=options.map(function(o){var ov=Array.isArray(o)?o[0]:o,ol=Array.isArray(o)?o[1]:o;return '<option value="'+ov+'"'+(String(v)===String(ov)?' selected':'')+'>'+ol+'</option>';}).join('');
    return '<label class="af" style="width:'+w+'"><span>'+label+star+'</span><select id="d_'+id+'" onchange="AUTH.d[\''+id+'\']=this.value">'+os+'</select>'+hintD+'</label>';
  }
  if(type==='textarea')return '<label class="af" style="width:'+w+'"><span>'+label+star+'</span><textarea id="d_'+id+'" placeholder="'+ph+'" rows="2" oninput="AUTH.d[\''+id+'\']=this.value">'+v+'</textarea>'+hintD+'</label>';
  if(type==='password')return '<label class="af" style="width:'+w+'"><span>'+label+star+'</span><div class="a-pass-wrap"><input type="password" id="d_'+id+'" placeholder="'+ph+'" value="'+v+'" oninput="AUTH.d[\''+id+'\']=this.value"><button class="a-eye" onclick="var i=this.previousElementSibling;i.type=i.type===\'password\'?\'text\':\'password\'">'+EYESVG+'</button></div>'+hintD+'</label>';
  return '<label class="af" style="width:'+w+'"><span>'+label+star+'</span><input type="'+type+'" id="d_'+id+'" placeholder="'+ph+'" value="'+v+'" oninput="AUTH.d[\''+id+'\']=this.value">'+hintD+'</label>';
}

/* country-code selector for phone fields: India (+91) & US (+1).
   Custom dropdown with inline SVG flags (emoji flags don't render on Windows). */
var CC_LIST=[['+91','India'],['+1','United States']];
function ccFlag(c){
  if(c==='+1')return '<svg width="22" height="15" viewBox="0 0 19 13" style="border-radius:2px;display:block;box-shadow:0 0 0 1px rgba(0,0,0,.06)"><rect width="19" height="13" fill="#B22234"/><g fill="#fff"><rect y="1" width="19" height="1"/><rect y="3" width="19" height="1"/><rect y="5" width="19" height="1"/><rect y="7" width="19" height="1"/><rect y="9" width="19" height="1"/><rect y="11" width="19" height="1"/></g><rect width="8.4" height="7" fill="#3C3B6E"/></svg>';
  return '<svg width="22" height="15" viewBox="0 0 18 12" style="border-radius:2px;display:block;box-shadow:0 0 0 1px rgba(0,0,0,.06)"><rect width="18" height="4" fill="#FF9933"/><rect y="4" width="18" height="4" fill="#fff"/><rect y="8" width="18" height="4" fill="#138808"/><circle cx="9" cy="6" r="1.4" fill="none" stroke="#000080" stroke-width=".45"/><circle cx="9" cy="6" r=".3" fill="#000080"/></svg>';
}
function ccPlaceholder(c){return c==='+1'?'(201) 555-0123':'98200 00000';}
function ccSel(){
  var c=AUTH.d.cc;
  return '<div class="cc-wrap" style="position:relative">'
    +'<button type="button" class="cc-btn" onclick="ccToggle(this)" style="height:46px;display:flex;align-items:center;gap:7px;padding:0 9px 0 11px;border:1.5px solid #E6E8EB;border-right:none;border-radius:10px 0 0 10px;background:#F5F6F7;font-size:13px;font-weight:600;color:#3A3F4A;cursor:pointer;white-space:nowrap">'
    +ccFlag(c)+'<span>'+c+'</span>'
    +'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#98A2B3" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
    +'</button>'
    +'<div class="cc-menu" style="display:none;position:absolute;top:50px;left:0;z-index:30;background:#fff;border:1.5px solid #E6E8EB;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);overflow:hidden;min-width:190px">'
    +CC_LIST.map(function(o){return '<button type="button" onclick="ccPick(this,\''+o[0]+'\')" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 13px;border:none;background:'+(c===o[0]?'#F0F6FF':'#fff')+';font-size:13px;font-weight:600;color:#3A3F4A;cursor:pointer;text-align:left">'+ccFlag(o[0])+'<span style="flex:1">'+o[1]+'</span><span style="color:#98A2B3">'+o[0]+'</span></button>';}).join('')
    +'</div></div>';
}
function ccToggle(btn){
  var menu=btn.nextElementSibling,open=menu.style.display==='block';
  document.querySelectorAll('.cc-menu').forEach(function(m){m.style.display='none';});
  menu.style.display=open?'none':'block';
}
function ccPick(item,code){
  AUTH.d.cc=code;
  var wrap=item.closest('.cc-wrap');
  var b=wrap.querySelector('.cc-btn');
  b.innerHTML=ccFlag(code)+'<span>'+code+'</span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#98A2B3" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var inp=wrap.parentNode.querySelector('input[type=tel]');
  if(inp)inp.placeholder=ccPlaceholder(code);
  wrap.querySelector('.cc-menu').style.display='none';
}
document.addEventListener('click',function(e){if(!e.target.closest('.cc-wrap'))document.querySelectorAll('.cc-menu').forEach(function(m){m.style.display='none';});});
function atgl(id,on,label,sub){
  var isOn=AUTH.d[id]!==undefined?AUTH.d[id]:on;
  return '<div class="at-row"><div style="flex:1"><div class="at-l">'+label+'</div>'+(sub?'<div class="at-s">'+sub+'</div>':'')+'</div><button class="at-btn'+(isOn?' on':'')+'" onclick="AUTH.d[\''+id+'\']=!AUTH.d[\''+id+'\'];this.classList.toggle(\'on\')"></button></div>';
}
function achip(group,val,label){
  var sel=AUTH.d[group]===val;
  return '<div class="ac'+(sel?' sel':'')+'" onclick="AUTH.d[\''+group+'\']='+"'"+val+"'"+';document.querySelectorAll(\'[data-ag='+group+']\').forEach(function(c){c.classList.remove(\'sel\');});this.classList.add(\'sel\')" data-ag="'+group+'">'+label+'</div>';
}
function rdiv(name,val,label,sub){
  return '<div class="a-rdiv"><input type="radio" name="'+name+'" value="'+val+'" '+(AUTH.d[name]===val?'checked ':'')+' onchange="AUTH.d[\''+name+'\']=\''+val+'\'"><div><div class="rl">'+label+'</div>'+(sub?'<div class="rs">'+sub+'</div>':'')+'</div></div>';
}

/* OTP timer */
var otpSecs=45,otpInt;
function startOtpTimer(){
  clearInterval(otpInt);otpSecs=45;
  function tick(){
    var el=document.getElementById('otp-timer');if(!el){clearInterval(otpInt);return;}
    el.textContent=otpSecs>0?'Resend in 0:'+('0'+otpSecs).slice(-2):'Resend OTP';
    el.disabled=otpSecs>0;if(otpSecs<=0)clearInterval(otpInt);otpSecs--;
  }
  tick();otpInt=setInterval(tick,1000);
}
function otpInput(el,idx){
  el.value=el.value.replace(/\D/,'');
  if(el.value){el.classList.add('filled');var nx=document.getElementById('otp_'+(idx+1));if(nx)nx.focus();}
  else el.classList.remove('filled');
}
function otpKeydown(el,idx,e){
  if(e.key==='Backspace'&&!el.value){var pv=document.getElementById('otp_'+(idx-1));if(pv){pv.focus();pv.value='';pv.classList.remove('filled');}}
}
window.otpInput=otpInput;window.otpKeydown=otpKeydown;

/* PIN input helper */
function pinMove(prefix,idx,len,field){
  var boxes=[]; for(var i=0;i<len;i++){var b=document.getElementById(prefix+'_'+i);if(b)boxes.push(b);}
  var b=document.getElementById(prefix+'_'+idx);
  if(b){b.value=b.value.replace(/\D/,'').slice(-1);}
  if(b&&b.value&&idx<len-1){var nx=document.getElementById(prefix+'_'+(idx+1));if(nx)nx.focus();}
  AUTH.d[field]=boxes.map(function(x){return x.value;}).join('');
}
window.pinMove=pinMove;

/* wizard sidebar */
var WIZ_STEPS=['Business Identity','GST & Compliance','Store Setup','Billing & Invoices','Payment Methods','Product Catalog','Hardware & Devices','Team & Access'];
function wizSidebar(){
  var pct=Math.round((AUTH.step+1)/8*100);
  var steps=WIZ_STEPS.map(function(n,i){
    var st=i<AUTH.step?'done':i===AUTH.step?'act':'todo';
    var nc=i<AUTH.step?'sn-done':i===AUTH.step?'sn-act':'sn-todo';
    var num=i<AUTH.step?CHK:('0'+(i+1));
    return '<div class="a-step '+st+'"><div class="a-snum '+nc+'">'+num+'</div><div><div class="a-step-t">Step 0'+(i+1)+'</div><div class="a-step-n">'+n+'</div></div></div>';
  }).join('');
  return '<div class="a-wsb"><div class="a-mark" style="margin-bottom:26px"><div class="a-icon">'+POSSVG+'</div><div class="a-mname">Ambel POS</div></div>'
    +'<div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:8px">SETUP · '+pct+'% COMPLETE</div>'
    +'<div class="a-prog"><div class="a-prog-f" style="width:'+pct+'%"></div></div>'
    +steps
    +'<div style="margin-top:auto;padding-top:20px;border-top:1px solid rgba(255,255,255,.07);font-size:11.5px;color:rgba(255,255,255,.3);line-height:1.6">Progress auto-saved.<br>Takes ~20 minutes.</div></div>';
}
function wnav(isLast){
  var back=AUTH.step>0?'<button class="a-wback" onclick="AUTH.step--;authGo(\'wizard\',\'back\')">← Back</button>':'<button class="a-wback" onclick="authGo(\'subscription\',\'back\')">← Plans</button>';
  var next=isLast?'<button class="a-wnext" onclick="authGo(\'welcome\')">Complete Setup ✓</button>':'<button class="a-wnext" onclick="AUTH.step++;authGo(\'wizard\')">Continue →</button>';
  return '<div class="a-wnav">'+back+'<div style="font-size:13px;color:#667085">'+Math.round((AUTH.step+1)/8*100)+'% complete</div>'+next+'</div>';
}

/* brand panel helper */
function brandPanel(body){
  return '<div class="a-brand"><div>'
    +'<div class="a-mark" style="margin-bottom:28px"><div class="a-icon">'+POSSVG+'</div><div class="a-mname">Ambel POS</div></div>'
    +body+'</div>'
    +'<div style="font-size:12px;color:rgba(255,255,255,.35);line-height:1.7">Ambel Retail Technologies<br>GST: 27ABCDE1234F1Z5</div></div>';
}

/* ========== SCREENS ========== */
var AUTH_SCREENS = {

splash: function(){
  return '<div class="a-full" style="background:linear-gradient(145deg,#030912 0%,#06337A 50%,#0058BA 100%);color:#fff">'
    +'<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">'
    +'<div style="position:absolute;width:700px;height:700px;border:1px solid rgba(255,255,255,.04);border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%)"></div>'
    +'<div style="position:absolute;width:460px;height:460px;border:1px solid rgba(255,255,255,.06);border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%)"></div>'
    +'<div style="position:absolute;width:250px;height:250px;border:1px solid rgba(255,255,255,.09);border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%)"></div>'
    +'</div>'
    +'<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center">'
    +'<div class="a-mark" style="margin-bottom:28px;justify-content:center"><div class="a-icon">'+POSSVG+'</div><div class="a-mname" style="font-size:20px">Ambel POS</div></div>'
    +'<div style="display:inline-flex;align-items:center;gap:7px;padding:6px 16px;border-radius:100px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin-bottom:22px">✦ India\'s most complete retail suite</div>'
    +'<h1 style="font-family:\'Space Grotesk\',sans-serif;font-size:clamp(34px,5vw,62px);font-weight:800;letter-spacing:-.04em;line-height:1;margin-bottom:14px;text-align:center">Retail, reimagined.<br>For every Indian store.</h1>'
    +'<p style="font-size:16px;color:rgba(255,255,255,.7);max-width:420px;line-height:1.6;margin-bottom:36px;text-align:center">GST-native · AI-powered · Offline-first<br>From first bill to GSTR-1: one POS.</p>'
    +'<div style="display:flex;flex-direction:column;gap:12px;width:310px">'
    +'<button class="ab-pri" style="font-size:17px;height:54px;border-radius:14px" onclick="authGo(\'signup\')">Create your store account →</button>'
    +'<button onclick="authGo(\'login\')" style="height:50px;border:1.5px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(255,255,255,.08);color:#fff;font-family:\'Space Grotesk\',sans-serif;font-size:15px;font-weight:600;cursor:pointer;width:100%;transition:all .18s" onmouseover="this.style.background=\'rgba(255,255,255,.15)\'" onmouseout="this.style.background=\'rgba(255,255,255,.08)\'">Sign in to existing account</button>'
    +'</div>'
    +'<div style="display:flex;gap:20px;margin-top:28px;font-size:12px;color:rgba(255,255,255,.45)">'
    +'<span>✓ Secure paid checkout</span><span>✓ Monthly or annual billing</span><span>✓ GST-compliant</span>'
    +'</div></div>'
    +'<div style="position:absolute;bottom:22px;font-size:12px;color:rgba(255,255,255,.28)">© 2026 Ambel Retail Technologies Pvt Ltd</div>'
    +'</div>';
},

login: function(){
  var t=AUTH.loginTab;
  var bp=brandPanel(
    '<h2 style="font-family:\'Space Grotesk\',sans-serif;font-size:28px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.1;margin-bottom:12px">Welcome back to your store.</h2>'
    +'<p style="font-size:14px;color:rgba(255,255,255,.65);line-height:1.65;margin-bottom:28px">Billing, inventory, loyalty and compliance: all in one place.</p>'
    +'<div style="display:flex;flex-direction:column;gap:11px">'
    +['2,400+ stores across India','₹18 Cr+ GMV processed monthly','GST-compliant from day one','Works fully offline'].map(function(s){return '<div style="display:flex;align-items:center;gap:9px;font-size:13px;color:rgba(255,255,255,.75)"><span style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.15);display:grid;place-items:center;flex-shrink:0">'+CHK+'</span>'+s+'</div>';}).join('')
    +'</div>'
  );
  var fp='<div class="a-form"><div class="a-form-inner">'
    +'<div style="margin-bottom:24px"><div style="font-family:\'Space Grotesk\',sans-serif;font-size:26px;font-weight:800;letter-spacing:-.03em;margin-bottom:5px">Good to have you back.</div><div style="font-size:14px;color:#667085">Enter your store credentials to continue.</div></div>'
    +'<div class="a-tabs"><button class="a-tab'+(t==='mobile'?' on':'')+'" onclick="AUTH.loginTab=\'mobile\';authGo(\'login\')">Mobile number</button><button class="a-tab'+(t==='email'?' on':'')+'" onclick="AUTH.loginTab=\'email\';authGo(\'login\')">Email address</button></div>'
    +(t==='mobile'?'<label class="af"><span>Mobile number<span class="ar">*</span></span><div style="display:flex"><div class="a-pass-wrap" style="display:flex;width:100%">'+ccSel()+'<input type="tel" id="d_phone" placeholder="'+(AUTH.d.cc==='+1'?'(201) 555-0123':'98200 00000')+'" value="'+AUTH.d.phone+'" style="border-radius:0 10px 10px 0;flex:1;border-left:none" oninput="AUTH.d.phone=this.value"></div></div></label>'
    :'<label class="af"><span>Email address<span class="ar">*</span></span><input type="email" id="d_email" placeholder="owner@yourstore.com" value="'+AUTH.d.email+'" oninput="AUTH.d.email=this.value"></label>')
    +'<label class="af"><span>Password<span class="ar">*</span></span><div class="a-pass-wrap"><input type="password" id="d_password" placeholder="••••••••" value="" oninput="AUTH.d.password=this.value"><button class="a-eye" onclick="var i=this.previousElementSibling;i.type=i.type===\'password\'?\'text\':\'password\'">'+EYESVG+'</button></div></label>'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><label style="display:flex;align-items:center;gap:7px;font-size:13px;color:#3A3F4A;cursor:pointer"><input type="checkbox" style="width:15px;height:15px;accent-color:#0058BA"> Remember this device</label><button class="ab-link" onclick="authGo(\'forgot\')">Forgot password?</button></div>'
    +'<button class="ab-pri" onclick="authSubmit()">Sign in →</button>'
    +'<div class="a-sep">or</div>'
    +'<p style="text-align:center;font-size:14px;color:#667085">New to Ambel POS? <button class="ab-link" onclick="authGo(\'signup\')">Create a store account</button></p>'
    +'</div></div>';
  return bp+fp;
},

signup: function(){
  var bp=brandPanel(
    '<h2 style="font-family:\'Space Grotesk\',sans-serif;font-size:26px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.1;margin-bottom:12px">One platform.<br>Every store detail.</h2>'
    +'<p style="font-size:14px;color:rgba(255,255,255,.65);line-height:1.6;margin-bottom:24px">From GST billing to loyalty rewards: built for Indian retail.</p>'
    +'<div style="display:flex;flex-direction:column;gap:10px">'
    +['GST-native invoicing from day 1','Offline billing: works without internet','AI Copilot reads your live store data','22 integrated modules, one subscription'].map(function(s){return '<div style="display:flex;align-items:center;gap:9px;font-size:13px;color:rgba(255,255,255,.75)"><span style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.15);display:grid;place-items:center;flex-shrink:0">'+CHK+'</span>'+s+'</div>';}).join('')
    +'</div>'
  );
  var fp='<div class="a-form"><div class="a-form-inner">'
    +'<div style="margin-bottom:22px"><div style="font-family:\'Space Grotesk\',sans-serif;font-size:26px;font-weight:800;letter-spacing:-.03em;margin-bottom:5px">Create your store account.</div><div style="font-size:14px;color:#667085">Create your account, then choose a paid subscription.</div></div>'
    +af('name','Full name',{ph:'Your name',req:true})
    +'<label class="af"><span>Mobile number<span class="ar">*</span></span><div style="display:flex">'+ccSel()+'<input type="tel" id="d_phone" placeholder="'+(AUTH.d.cc==='+1'?'(201) 555-0123':'98200 00000')+'" value="'+AUTH.d.phone+'" style="border:1.5px solid #E6E8EB;border-left:none;border-radius:0 10px 10px 0;flex:1;height:46px;padding:0 14px;font-family:\'Plus Jakarta Sans\',sans-serif;font-size:14px;outline:none" oninput="AUTH.d.phone=this.value"></div><div class="ah">OTP will be sent to verify this number</div></label>'
    +af('email','Email address',{type:'email',ph:'owner@yourstore.com'})
    +af('password','Password',{type:'password',ph:'Min 8 characters',req:true})
    +'<label style="display:flex;align-items:flex-start;gap:9px;margin-bottom:18px;cursor:pointer"><input type="checkbox" style="width:16px;height:16px;accent-color:#0058BA;margin-top:2px;flex-shrink:0"><span style="font-size:13px;color:#3A3F4A;line-height:1.5">I agree to Ambel POS <button class="ab-link" style="font-size:13px">Terms of Service</button> and <button class="ab-link" style="font-size:13px">Privacy Policy</button></span></label>'
    +'<button class="ab-pri" onclick="authSubmit()">Create account & verify mobile →</button>'
    +'<div class="a-sep">or</div>'
    +'<p style="text-align:center;font-size:14px;color:#667085">Already have an account? <button class="ab-link" onclick="authGo(\'login\',\'back\')">Sign in</button></p>'
    +'</div></div>';
  return bp+fp;
},

forgot: function(){
  return '<div class="a-full" style="background:#F2F4F7">'
    +'<div style="background:#fff;border-radius:20px;padding:40px;width:440px;box-shadow:0 8px 40px rgba(0,0,0,.1)">'
    +'<div class="a-mark" style="margin-bottom:24px;justify-content:center"><div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#06337A,#0058BA);display:grid;place-items:center">'+POSSVG+'</div><div style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:17px;color:#0F1729;letter-spacing:-.02em;margin-left:9px">Ambel POS</div></div>'
    +'<div style="font-family:\'Space Grotesk\',sans-serif;font-size:24px;font-weight:800;letter-spacing:-.03em;margin-bottom:6px">Reset your password.</div>'
    +'<div style="font-size:14px;color:#667085;margin-bottom:24px">Enter your registered mobile number. We\'ll send a 6-digit OTP to reset your password.</div>'
    +'<label class="af"><span>Registered mobile number<span class="ar">*</span></span><div style="display:flex">'+ccSel()+'<input type="tel" placeholder="'+(AUTH.d.cc==='+1'?'(201) 555-0123':'98200 00000')+'" style="border:1.5px solid #E6E8EB;border-left:none;border-radius:0 10px 10px 0;flex:1;height:46px;padding:0 14px;font-family:\'Plus Jakarta Sans\',sans-serif;font-size:14px;outline:none;transition:border-color .18s,box-shadow .18s" onfocus="this.style.borderColor=\'#0058BA\';this.style.boxShadow=\'0 0 0 3px rgba(0,88,186,.1)\'" onblur="this.style.borderColor=\'#E6E8EB\';this.style.boxShadow=\'none\'"></div></label>'
    +'<button class="ab-pri" style="margin-top:4px" onclick="authGo(\'otp\')">Send OTP →</button>'
    +'<p style="text-align:center;margin-top:16px;font-size:14px;color:#667085"><button class="ab-link" onclick="authGo(\'login\',\'back\')">← Back to sign in</button></p>'
    +'</div></div>';
},

otp: function(){
  var num=AUTH.d.phone?AUTH.d.cc+' '+AUTH.d.phone:'your mobile';
  return '<div class="a-full" style="background:#F2F4F7">'
    +'<div style="background:#fff;border-radius:20px;padding:40px;width:460px;box-shadow:0 8px 40px rgba(0,0,0,.1);text-align:center">'
    +'<div style="width:56px;height:56px;border-radius:16px;background:rgba(0,88,186,.08);display:grid;place-items:center;margin:0 auto 20px">'
    +'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#0058BA" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 4.18 2 2 0 0 1 5.09 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23 16.92z"/></svg>'
    +'</div>'
    +'<div style="font-family:\'Space Grotesk\',sans-serif;font-size:24px;font-weight:800;letter-spacing:-.03em;margin-bottom:6px">Verify your mobile.</div>'
    +'<div style="font-size:14px;color:#667085;margin-bottom:4px">We sent a 6-digit OTP to <b style="color:#0F1729">'+num+'</b></div>'
    +'<div style="font-size:13px;color:#98A2B3;margin-bottom:6px">Valid for 10 minutes · Do not share with anyone</div>'
    +'<div class="a-otp-row">'
    +[0,1,2,3,4,5].map(function(i){return '<input class="a-otp-box" id="otp_'+i+'" type="tel" maxlength="1" inputmode="numeric" pattern="[0-9]" oninput="otpInput(this,'+i+')" onkeydown="otpKeydown(this,'+i+',event)";>';}).join('')
    +'</div>'
    +'<button class="ab-pri" onclick="authGo(\'biztype\')" style="margin-bottom:14px">Verify & continue</button>'
    +'<div><button id="otp-timer" disabled style="background:none;border:none;color:#667085;font-size:13px;cursor:pointer;font-family:\'Plus Jakarta Sans\',sans-serif" onclick="startOtpTimer()">Resend in 0:45</button></div>'
    +'<button class="ab-link" style="margin-top:10px;font-size:13px;color:#98A2B3" onclick="authGo(\'login\',\'back\')">Change number</button>'
    +'</div></div>';
},

biztype: function(){
  var cats=[['fashion','👗','Fashion & Apparel','Clothing, ethnic wear, western'],['beauty','💄','Beauty & Wellness','Cosmetics, salon, spa'],['electronics','📱','Electronics & Gadgets','Phones, accessories, tech'],['footwear','👟','Footwear','Shoes, sandals, sports'],['jewellery','💎','Jewellery','Gold, diamond, fashion jewellery'],['books','📚','Books & Stationery','Books, gifts, office supplies'],['pharmacy','💊','Pharmacy & Healthcare','OTC medicine, wellness'],['grocery','🛒','Grocery & FMCG','Supermarket, convenience'],['multi','🏪','Multi-brand / Other','General retail, mixed categories']];
  return '<div class="a-full" style="background:#F2F4F7;overflow-y:auto;justify-content:flex-start;padding-top:52px">'
    +'<div style="width:100%;max-width:720px;margin:0 auto">'
    +'<div class="a-mark" style="margin-bottom:24px;justify-content:center"><div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#06337A,#0058BA);display:grid;place-items:center">'+POSSVG+'</div><div style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:17px;color:#0F1729;letter-spacing:-.02em;margin-left:9px">Ambel POS</div></div>'
    +'<div style="text-align:center;margin-bottom:28px"><div style="font-family:\'Space Grotesk\',sans-serif;font-size:30px;font-weight:800;letter-spacing:-.03em;margin-bottom:8px">What kind of store do you run?</div><div style="font-size:15px;color:#667085">We\'ll configure GST slabs, HSN codes and catalog structure for your category.</div></div>'
    +'<div class="a-cat-grid">'
    +cats.map(function(c){var sel=AUTH.category===c[0];return '<div class="a-cat-card'+(sel?' sel':'')+'" onclick="AUTH.category=\''+c[0]+'\';document.querySelectorAll(\'.a-cat-card\').forEach(function(x){x.classList.remove(\'sel\');});this.classList.add(\'sel\')"><div style="font-size:28px;margin-bottom:7px">'+c[1]+'</div><div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:700;color:#0F1729">'+c[2]+'</div><div style="font-size:11px;color:#667085;margin-top:3px">'+c[3]+'</div></div>';}).join('')
    +'</div>'
    +'<div style="text-align:center;margin-top:16px"><button class="ab-pri" style="width:280px;height:50px;border-radius:12px;font-size:16px" onclick="if(AUTH.category)authGo(\'subscription\');else alert(\'Please select your store category\')">Continue →</button></div>'
    +'</div></div>';
},

subscription: function(){
  var billing=AUTH.billing;
  var plans=[
    {id:'starter',name:'Starter',monthly:799,annual:799,stores:'2 locations · 5 users · 3 registers',desc:'A clear starting point for focused retail teams.',feats:['Unlimited POS transactions','ML reorder intelligence','Billing & cart: GST-native','Inventory management','GST reports & CSV export','Offline billing and sync']},
    {id:'growth',name:'Growth',monthly:1499,annual:1499,stores:'5 locations · 15 users · 8 registers',desc:'Most popular for growing multi-location retailers.',feats:['Unlimited POS transactions','ML reorder intelligence','Everything in Starter','Inventory management','GST reports & CSV export','Priority support'],featured:true},
    {id:'pro',name:'Pro',monthly:2999,annual:2999,stores:'6 locations · 10 users · 6 registers',desc:'Flexible capacity for larger retail operations.',feats:['Unlimited POS transactions','ML reorder intelligence','Everything in Growth','Additional locations: ₹299 each','Additional registers: ₹199 each','Additional users: ₹99 each','Priority support']}
  ];
  return '<div class="a-full" style="background:#F2F4F7;overflow-y:auto;justify-content:flex-start;padding:48px 40px">'
    +'<div style="width:100%;max-width:860px;margin:0 auto">'
    +'<div style="text-align:center;margin-bottom:6px"><button class="ab-link" style="font-size:13px;color:#98A2B3" onclick="authGo(\'biztype\',\'back\')">← Back</button></div>'
    +'<div style="text-align:center;margin-bottom:24px"><div style="font-family:\'Space Grotesk\',sans-serif;font-size:30px;font-weight:800;letter-spacing:-.03em;margin-bottom:8px">Choose your plan.</div><div style="font-size:15px;color:#667085;margin-bottom:20px">Choose a paid plan and complete secure checkout</div>'
    +'<div class="a-bill-tog" style="margin:0 auto 0"><button class="a-bill-opt'+(billing==='monthly'?' on':'')+'" onclick="AUTH.billing=\'monthly\';authGo(\'subscription\')">Monthly</button><button class="a-bill-opt'+(billing==='annual'?' on':'')+'" onclick="AUTH.billing=\'annual\';authGo(\'subscription\')">Annual</button></div></div>'
    +'<div class="a-plan-wrap">'
    +plans.map(function(p){
      var sel=AUTH.plan===p.id;
      var price='<div class="a-pprice"><sup>₹</sup>'+(billing==='annual'?p.annual:p.monthly)+'<sub>/mo</sub></div>'+(billing==='annual'?'<div style="font-size:11.5px;color:#667085;margin-top:2px">billed ₹'+(p.annual*12)+'/year · no annual discount</div>':'');
      return '<div class="a-plan'+(sel?' sel':'')+(p.featured?' a-feat':'')+'" onclick="AUTH.plan=\''+p.id+'\';document.querySelectorAll(\'.a-plan\').forEach(function(x){x.classList.remove(\'sel\');});this.classList.add(\'sel\')">'
        +(p.featured?'<div class="a-pbadge">MOST POPULAR</div>':'')
        +'<div class="a-pname">'+p.name+'</div>'
        +price
        +'<div class="a-pdesc">'+p.stores+'</div>'
        +'<ul class="a-pfeats">'+p.feats.map(function(f){return '<li>'+f+'</li>';}).join('')+'</ul>'
        +'</div>';
    }).join('')
    +'</div>'
    +'<div style="text-align:center;margin-top:16px"><button class="ab-pri" style="width:300px;height:50px;border-radius:12px;font-size:16px" onclick="AUTH.step=0;authGo(\'wizard\')">Continue to payment →</button>'
    +'<div style="font-size:12.5px;color:#98A2B3;margin-top:10px">Secure checkout · cancel at the end of your billing cycle</div></div>'
    +'</div></div>';
},

wizard: function(){
  var content=[ob0,ob1,ob2,ob3,ob4,ob5,ob6,ob7][AUTH.step];
  return wizSidebar()+'<div class="a-wmain">'+(content?content():'')+wnav(AUTH.step===7)+'</div>';
},

welcome: function(){
  var cat=AUTH.category||'fashion';
  var catNames={'fashion':'Fashion & Apparel','beauty':'Beauty & Wellness','electronics':'Electronics','footwear':'Footwear','jewellery':'Jewellery','books':'Books & Stationery','pharmacy':'Pharmacy','grocery':'Grocery','multi':'Multi-brand'};
  var summary=[
    ['Category',catNames[cat]||'Retail'],
    ['Plan',AUTH.plan.charAt(0).toUpperCase()+AUTH.plan.slice(1)+' · '+(AUTH.billing==='annual'?'Annual billing':'Monthly billing')],
    ['Store name',AUTH.d.storeName||'Your store'],
    ['Billing counters',AUTH.d.counters+' counter'+(AUTH.d.counters!=='1'?'s':'')],
    ['GST mode',AUTH.d.gstMode==='exclusive'?'Exclusive (GST separate)':'Inclusive (MRP includes GST)'],
    ['Team',AUTH.d.cashierName?AUTH.d.cashierName+' · '+AUTH.d.cashierRole:'Ready to add staff'],
  ];
  return '<div class="a-full" style="background:linear-gradient(145deg,#030912 0%,#06337A 50%,#0058BA 100%);color:#fff;overflow-y:auto;justify-content:flex-start;padding-top:60px">'
    +'<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">'
    +'<div style="position:absolute;width:600px;height:600px;border:1px solid rgba(255,255,255,.05);border-radius:50%;right:-200px;bottom:-200px"></div>'
    +'<div style="position:absolute;width:400px;height:400px;border:1px solid rgba(255,255,255,.07);border-radius:50%;left:-100px;top:-100px"></div>'
    +'</div>'
    +'<div style="position:relative;z-index:1;width:100%;max-width:560px;margin:0 auto;text-align:center;padding:0 20px">'
    +'<div style="width:72px;height:72px;border-radius:50%;background:rgba(16,185,129,.2);border:2px solid rgba(16,185,129,.4);display:grid;place-items:center;margin:0 auto 22px;animation:pulse 2s ease-in-out infinite">'
    +'<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>'
    +'</div>'
    +'<div style="font-family:\'Space Grotesk\',sans-serif;font-size:36px;font-weight:800;letter-spacing:-.04em;margin-bottom:10px">Your store is ready!</div>'
    +'<div style="font-size:16px;color:rgba(255,255,255,.7);margin-bottom:30px;line-height:1.55">You\'ve completed setup. Here\'s a summary of your configuration.</div>'
    +'<div style="background:rgba(255,255,255,.08);border-radius:16px;padding:20px;margin-bottom:28px;text-align:left;border:1px solid rgba(255,255,255,.12)">'
    +summary.map(function(s){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)"><span style="font-size:13px;color:rgba(255,255,255,.55)">'+s[0]+'</span><span style="font-size:13.5px;font-weight:600;color:#fff">'+s[1]+'</span></div>';}).join('')
    +'</div>'
    +'<button onclick="completeAuth()" style="width:100%;height:54px;background:#fff;color:#0058BA;border:none;border-radius:14px;font-family:\'Space Grotesk\',sans-serif;font-size:17px;font-weight:800;cursor:pointer;transition:all .2s;letter-spacing:-.01em;margin-bottom:12px" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,.2)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'none\'">Launch Dashboard →</button>'
    +'<button onclick="AUTH.step=0;authGo(\'wizard\',\'back\')" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:13px;cursor:pointer;font-family:\'Plus Jakarta Sans\',sans-serif">Review setup again</button>'
    +'</div></div>';
}
};

/* ========== WIZARD STEP RENDERERS ========== */
function ob0(){
  return '<div class="a-shd"><div class="a-shd-tag">Step 01 · Business Identity</div><h2>Tell us about your business.</h2><p>Enter details exactly as registered with the Government of India: these appear on every invoice, tax filing, and compliance document.</p></div>'
  +'<div class="a-info">ℹ️ Use the legal name as it appears on your GST Registration Certificate or Certificate of Incorporation / Partnership Deed.</div>'
  +af('legalName','Legal business name',{ph:'As on GST / Certificate of Incorporation',req:true})
  +af('tradeName','Trade / brand name',{ph:'Name shown to customers on receipt & display'})
  +'<div class="arow2">'
  +af('bizType','Business structure',{type:'select',options:[['pvtltd','Private Limited (Pvt Ltd)'],['llp','LLP: Limited Liability Partnership'],['partnership','Partnership Firm'],['proprietorship','Sole Proprietorship'],['public','Public Limited Company'],['huf','HUF: Hindu Undivided Family'],['trust','Trust / Section 8 / NGO']]})
  +af('estYear','Year established',{type:'select',options:YEARS})
  +'</div>'
  +(AUTH.d.bizType==='pvtltd'?af('cin','CIN (Company Identification Number)',{ph:'e.g. U52100MH2018PTC000001',hint:'21-character CIN issued by Ministry of Corporate Affairs (MCA)'}):'')
  +(AUTH.d.bizType==='llp'?af('cin','LLPIN (LLP Identification Number)',{ph:'e.g. AAB-1234',hint:'Issued by MCA at time of LLP registration'}):'')
  +'<div class="arow2">'
  +af('natureBiz','Nature of business',{type:'select',options:[['retailer','Retailer: direct to consumer'],['wholesaler','Wholesaler: B2B only'],['both','Both retail & wholesale'],['mfr_retail','Manufacturer-retailer'],['service','Service + retail (salon, tailor)']]})
  +af('stores','Number of stores',{type:'select',options:[['1','1 store'],['2','2 stores'],['3','3 stores'],['4','4 stores'],['5','5 stores'],['6-10','6–10 stores'],['11-20','11–20 stores'],['20+','More than 20 stores']]})
  +'</div>';
}

function ob1(){
  var unreg=AUTH.d.gstStatus==='unregistered';
  return '<div class="a-shd"><div class="a-shd-tag">Step 02 · GST & Legal Compliance</div><h2>Tax registration &amp; compliance.</h2><p>Your GST registration type determines invoice format, filing schedule and inter-state rules. Incorrect GSTIN invalidates customer ITC claims.</p></div>'
  +'<div class="a-slbl">GST Registration type</div>'
  +rdiv('gstStatus','regular','Regular taxpayer','Aggregate turnover > ₹40L (goods) / ₹20L (services). File GSTR-1 & GSTR-3B monthly or quarterly.')
  +rdiv('gstStatus','composition','Composition scheme','Turnover ≤ ₹1.5 Cr. Pay flat 1% on turnover. Cannot charge GST separately or make inter-state supply.')
  +rdiv('gstStatus','unregistered','Unregistered: below threshold','Below GST threshold. No GSTIN. Limited to B2C local sales only.')
  +(!unreg?'<div class="arow2" style="margin-top:14px">'
    +af('gstin','GSTIN (15 characters)',{ph:'e.g. 27AABCU9603R1ZX',req:true,hint:'State code(2) + PAN(10) + Entity no(1) + Z + Check digit(1)'})
    +af('pan','PAN (10 characters)',{ph:'e.g. AABCU9603R',req:true})
    +'</div>'
    +af('placeOfSupply','Primary state of supply',{type:'select',options:STATES})
  :af('placeOfSupply','State of business',{type:'select',options:STATES}))
  +'<div class="a-slbl">Other Registrations <span class="a-opt">optional</span></div>'
  +af('fssai','FSSAI license number',{ph:'14-digit FSSAI license',hint:'Required for food products, packaged snacks, cosmetics, health supplements, dairy'})
  +af('drugLic','Drug license number',{ph:'State drug license',hint:'Required for pharmacy, Ayurvedic medicine, Schedule H/X products and medical cosmetics'})
  +'<div class="arow2">'
  +af('msme','MSME / Udyam registration',{ph:'UDYAM-MH-01-0000123'})
  +af('shopEst','Shop & Establishment license',{ph:'e.g. MH/BOM/2024/12345'})
  +'</div>'
  +'<div class="a-slbl">E-compliance</div>'
  +atgl('eInvoice',false,'E-invoice (IRN) mandatory','Mandatory if aggregate turnover > ₹5 Cr. IRN and QR generated automatically via IRP portal on every B2B invoice.')
  +atgl('eWayBill',false,'E-way bill for inter-state movement','Required for consignments > ₹50,000 moving across state borders. Integrates with NIC e-way bill portal.');
}

function ob2(){
  return '<div class="a-shd"><div class="a-shd-tag">Step 03 · Store Setup</div><h2>Configure your store location.</h2><p>These details appear on receipt headers, GSTIN invoice address and multi-store reports. Every store location requires its own entry.</p></div>'
  +af('storeName','Store display name (shown on receipt)',{ph:'e.g. Ambel · Bandra West',req:true,hint:'Appears on every printed receipt, PDF invoice and customer-facing display'})
  +af('addr1','Address line 1: Shop no., building, floor',{ph:'e.g. Shop 4, Ground Floor, Hill View Complex',req:true})
  +af('addr2','Address line 2: Street, area, landmark',{ph:'e.g. 12 Hill Road, Near Linking Road'})
  +'<div class="arow3">'
  +af('pincode','PIN code',{ph:'400050',type:'tel'})
  +af('city','City',{ph:'Mumbai',req:true})
  +af('state','State',{type:'select',options:STATES})
  +'</div>'
  +'<div class="a-slbl">Store type</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+['Mall kiosk','Mall shop','High street','Standalone','Airport','Outlet'].map(function(v){return achip('storeType',v.toLowerCase().replace(/ /g,'_'),v);}).join('')+'</div>'
  +'<div class="a-slbl">Store category</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+[['flagship','Flagship'],['branch','Branch'],['franchise','Franchise'],['popup','Pop-up']].map(function(c){return achip('storeCategory',c[0],c[1]);}).join('')+'</div>'
  +'<div class="arow3" style="margin-top:14px">'
  +af('sqft','Carpet area (sq ft)',{ph:'e.g. 2400',type:'number'})
  +af('storeCode','Store code',{ph:'BDR-01',hint:'Used in multi-store reports'})
  +af('openTime','Opening time',{type:'time',val:'10:00'})
  +'</div>'
  +'<div class="arow2">'
  +af('mgr','Store manager name',{ph:'e.g. Riya Sharma'})
  +af('mgrPhone','Manager mobile',{ph:'+91 98200 00000',type:'tel'})
  +'</div>';
}

function ob3(){
  return '<div class="a-shd"><div class="a-shd-tag">Step 04 · Billing & Invoice Setup</div><h2>Configure invoicing.</h2><p>Your invoice series, GST pricing mode and round-off rule apply to every transaction. Migrating from another system? Enter your last invoice number to continue seamlessly.</p></div>'
  +'<div class="arow2">'
  +af('invPfx','Invoice series prefix',{ph:'INV- or COUR-',hint:'Shown before number: INV-00001'})
  +af('invStart','Start from number',{ph:'1',type:'number',hint:'Enter last invoice no. + 1 for migration'})
  +'</div>'
  +af('billTerms','Payment terms (credit period)',{type:'select',options:[['0','Immediate: due on issue'],['7','Net 7 days'],['15','Net 15 days'],['30','Net 30 days'],['45','Net 45 days'],['60','Net 60 days']],hint:'Applies to B2B invoices and accounts receivable ageing'})
  +'<div class="a-slbl">GST pricing mode</div>'
  +rdiv('gstMode','exclusive','Exclusive: MRP excludes GST (shown separately)','MRP ₹100 + 18% GST = Bill ₹118. Standard for B2B and wholesale trade.')
  +rdiv('gstMode','inclusive','Inclusive: MRP includes GST (Legal Metrology Act)','MRP ₹118 includes 18% GST = ₹100 base + ₹18 tax. Required for retail B2C packaged goods.')
  +'<div class="a-slbl">Default GST slab for new products</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+[['5','5%'],['12','12%'],['18','18%'],['28','28%'],['0','Exempt 0%']].map(function(c){return achip('defSlab',c[0],c[1]);}).join('')+'</div>'
  +'<div class="a-slbl">Invoice round-off (GST Act Section 170A)</div>'
  +rdiv('rounding','nearest1','Nearest ₹1: recommended for retail','₹499.60 → ₹500. Legally permitted. Most common in Indian retail.')
  +rdiv('rounding','nearest50p','Nearest 50 paise','₹499.60 → ₹499.50')
  +rdiv('rounding','none','No rounding: exact paise','Collect exact computed amount.')
  +'<div class="a-slbl">Financial year</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+[['april','April (Indian FY Apr–Mar)'],['jan','January (Calendar year Jan–Dec)']].map(function(c){return achip('fy',c[0],c[1]);}).join('')+'</div>'
  +'<div class="a-slbl" style="margin-top:14px">Invoice options</div>'
  +atgl('showHSN',true,'Print HSN/SAC code on invoice','Mandatory for B2B. Allows customers to claim Input Tax Credit (ITC). Recommended for all.')
  +atgl('dupCopy',false,'Print duplicate copy','Original for customer, duplicate for store records. Useful for compliance audit.')
  +atgl('qrInv',false,'QR code on invoice (e-invoice IRN)','Mandatory for turnover > ₹5 Cr. IRN and Acknowledgement Number embedded in QR.')
  +af('invFooter','Invoice footer message',{type:'textarea',ph:'Thank you for shopping with us!',hint:'Appears at bottom of every receipt and PDF invoice'});
}

function ob4(){
  return '<div class="a-shd"><div class="a-shd-tag">Step 05 · Payment Methods</div><h2>How do your customers pay?</h2><p>Enable the payment modes your store accepts. Each has a dedicated daily settlement report and UTR reconciliation tracker.</p></div>'
  +'<div class="a-slbl">Cash</div>'
  +atgl('cash',true,'Accept cash payments','Always available · works fully offline · no internet required')
  +(AUTH.d.cash?af('maxCash','Max cash per transaction (₹)',{val:'200000',type:'number',hint:'Income Tax Act Section 269ST: Cash transactions > ₹2,00,000 are prohibited and attract 100% penalty on recipient.'}):'')
  +'<div class="a-slbl">UPI / QR payments</div>'
  +atgl('upi',true,'Accept UPI payments',null)
  +(AUTH.d.upi?'<div class="a-slbl" style="margin-top:10px">UPI partner</div>'
    +'<div style="display:flex;flex-wrap:wrap">'+[['razorpay','Razorpay'],['phonepe','PhonePe Biz'],['bharatpe','BharatPe'],['paytm','Paytm Biz'],['pinelabs_upi','Pine Labs UPI'],['googlepay','Google Pay Biz']].map(function(c){return achip('upiPsp',c[0],c[1]);}).join('')+'</div>'
    +af('upiVpa','Merchant UPI VPA / Virtual Payment Address',{ph:'e.g. Ambel@hdfcbank',hint:'The VPA your customers see when they scan your QR code. Must match your PSP dashboard exactly.'})
    +atgl('soundBox',false,'UPI Sound Box / smart speaker','Announces payment confirmation audibly: ideal for noisy retail environments.')
  :'')
  +'<div class="a-slbl">Card / POS terminal</div>'
  +atgl('card',true,'Accept card payments (debit, credit, prepaid)',null)
  +(AUTH.d.card?'<div class="a-slbl" style="margin-top:10px">Card terminal provider (EDC)</div>'
    +'<div style="display:flex;flex-wrap:wrap">'+[['pinelabs','Pine Labs (recommended)'],['mosambee','Mosambee'],['mswipe','Mswipe'],['hdfc','HDFC SmartHub'],['payu','PayU'],['plural','Plural']].map(function(c){return achip('cardPsp',c[0],c[1]);}).join('')+'</div>'
    +af('edcId','EDC Terminal ID (TID)',{ph:'e.g. 12345678',hint:'8-digit TID printed on your EDC machine or PSP dashboard. Required for daily settlement reconciliation.'})
    +atgl('contactless',true,'Enable contactless / NFC tap-to-pay','Visa PayWave, Mastercard Contactless, RuPay NFC. PIN-less up to ₹5,000.')
  :'')
  +'<div class="a-slbl">Other modes</div>'
  +atgl('emi',false,'EMI financing','Bajaj Finserv, HDFC EMI, ICICI EMI. No-cost EMI for select bank cards.')
  +atgl('giftCard',false,'Gift cards & vouchers','Issue and redeem store gift cards as printed card, QR code or alphanumeric voucher.')
  +atgl('storeCredit',false,'Store credit / customer wallet','Issue store credit instead of cash refunds. Customer redeems on next purchase.')
  +(AUTH.d.storeCredit?af('creditLimit','Max store credit per customer (₹)',{val:'5000',type:'number'}):'')
  +atgl('split',true,'Split payment: multiple modes in one bill','e.g. ₹2,000 card + ₹500 UPI + loyalty points, all in a single transaction.')
  +atgl('advance',false,'Advance / booking deposits','Accept partial payment for orders, custom products or alterations. Balance collected on delivery.');
}

function ob5(){
  return '<div class="a-shd"><div class="a-shd-tag">Step 06 · Product Catalog</div><h2>Set up your catalog.</h2><p>Define product structure, barcode format and tracking rules. Your full catalog can be imported after setup: this configures the defaults that apply to every SKU.</p></div>'
  +'<div class="a-slbl">Approximate SKU count</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+[['under100','< 100'],['100-500','100–500'],['500-2000','500–2,000'],['2000-10000','2,000–10,000'],['10000plus','10,000+']].map(function(c){return achip('skuCount',c[0],c[1]);}).join('')+'</div>'
  +'<div class="a-slbl" style="margin-top:14px">Import method</div>'
  +rdiv('importMethod','csv','CSV / Excel file upload','Download our template, map SKU / name / HSN / MRP / cost / opening stock columns, upload. Best for 100+ products.')
  +rdiv('importMethod','barcode','Barcode scan import','Scan each product: we fetch name, HSN and GST slab from India\'s national product database.')
  +rdiv('importMethod','tally','Import from Tally / ERP','Connect Tally Prime via API. Imports stock ledger, HSN mappings and opening stock in one sync.')
  +rdiv('importMethod','manual','Manual / AI catalog builder','Add one by one or upload product photos: AI generates SKU names, HSN codes and descriptions.')
  +'<div class="a-slbl">Default unit of measure</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+['Piece','Kg','Gram','Litre','Ml','Metre','Box','Pack','Set','Pair'].map(function(v){return achip('uom',v.toLowerCase(),v);}).join('')+'</div>'
  +'<div class="a-slbl" style="margin-top:14px">Barcode format</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+[['ean13','EAN-13 (standard)'],['code128','Code-128'],['qr','QR code'],['upca','UPC-A'],['internal','Internal auto-generate']].map(function(c){return achip('barcode',c[0],c[1]);}).join('')+'</div>'
  +'<div class="a-slbl" style="margin-top:14px">Stock tracking</div>'
  +atgl('hsnAuto',true,'HSN / SAC auto-lookup','Auto-match 6-digit HSN from Central GST tariff to assign correct slab. Override per product.')
  +atgl('mrpMandatory',true,'MRP mandatory on all products','Legal Metrology (Packaged Commodities) Rules 2011: MRP must be printed on every package sold to consumers.')
  +atgl('variants',true,'Size & colour variant tracking','Essential for fashion, footwear & accessories. Manage a single product across size/colour matrix.')
  +atgl('batch',false,'Batch / Lot number tracking','FMCG & pharma: track batches for product recall, returns and expiry management.')
  +atgl('expiry',false,'Expiry date tracking','Block sale of expired stock automatically. Alert before expiry for timely clearance discounts.')
  +atgl('serial',false,'Serial number tracking','Electronics, mobile phones, jewellery: unique serial/IMEI per unit for warranty and theft tracking.')
  +atgl('serviceItem',false,'Service items (non-inventory)','Alterations, tailoring, repairs, gift-wrapping: bill as a service; no stock movement created.')
  +'<div class="a-slbl">Negative stock</div>'
  +rdiv('negStock','block','Block sale: cannot bill out-of-stock items (recommended)','Forces physical stock count before billing a zero-stock item.')
  +rdiv('negStock','warn','Warn but allow: cashier can override','Cashier sees alert but can proceed with the sale.')
  +rdiv('negStock','allow','Allow silently: no warning','Stock goes negative. Only for stores with imprecise physical counts.');
}

function ob6(){
  return '<div class="a-shd"><div class="a-shd-tag">Step 07 · Hardware & Devices</div><h2>Set up your devices.</h2><p>Ambel supports cloud print, Bluetooth and LAN hardware. You can also pair devices after setup: each device runs a self-test before going live.</p></div>'
  +'<div class="a-slbl">Billing counters</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+[['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],['5plus','5+']].map(function(c){return achip('counters',c[0],c[1]);}).join('')+'</div>'
  +'<div class="a-slbl" style="margin-top:14px">Receipt printer</div>'
  +rdiv('printer','cloud','Cloud print: WiFi (recommended)','Works with any network-enabled thermal printer. Supports Epson, TVS-E, Star, Bixolon, Posiflex.')
  +rdiv('printer','lan','LAN / Ethernet (static IP)','Connect via local network. Best for large stores with dedicated LAN printer per counter.')
  +rdiv('printer','bluetooth','Bluetooth wireless','Pair to tablet / phone. 10-metre range. Mobile POS setups.')
  +rdiv('printer','none','No printer: digital receipts only','Send receipts via WhatsApp, SMS or email. Zero hardware cost.')
  +(AUTH.d.printer!=='none'?'<div class="a-slbl">Paper width</div><div style="display:flex;flex-wrap:wrap">'+[['58','58 mm compact'],['80','80 mm standard']].map(function(c){return achip('paperWidth',c[0],c[1]);}).join('')+'</div>':'')
  +'<div class="a-slbl" style="margin-top:14px">Barcode scanner</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+[['usb','USB plug-and-play'],['bluetooth','Bluetooth'],['rf','Wireless RF 2.4 GHz'],['none','No scanner']].map(function(c){return achip('scanType',c[0],c[1]);}).join('')+'</div>'
  +'<div class="a-slbl" style="margin-top:14px">Cash drawer</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+[['auto','Auto-open on payment'],['manual','Manual'],['none','No cash drawer']].map(function(c){return achip('drawerMode',c[0],c[1]);}).join('')+'</div>'
  +'<div class="a-slbl" style="margin-top:14px">Card terminal (EDC machine)</div>'
  +rdiv('cardTermType','pinelabs','Pine Labs: I already have one','Link your Pine Labs TID. Settlement reports sync automatically.')
  +rdiv('cardTermType','mosambee','Mosambee / Mswipe: I already have one','Connect existing mPOS terminal for settlement sync.')
  +rdiv('cardTermType','order','I\'ll order a terminal later','We recommend a terminal based on your volume. Deployed in 3–5 working days.')
  +rdiv('cardTermType','none','No card terminal: UPI & cash only',null)
  +'<div class="a-slbl">Additional devices</div>'
  +atgl('cfd','none','Customer-facing display (CFD)','Android tablet or HDMI screen showing cart total and loyalty points to customer during billing.')
  +atgl('scaleType','none','Weighing / counting scale','RS-232, USB or Bluetooth scale: weight reads directly into qty field at billing.')
  +atgl('labelPrint',false,'Label / price tag printer','Barcode labels, price tags, shelf labels. Supported: Zebra, TSC, Godex.')
  +atgl('kds',false,'Kitchen Display System (KDS)','For cafes, food courts and food-retail only: orders appear on kitchen screen after billing.');
}

function ob7(){
  return '<div class="a-shd"><div class="a-shd-tag">Step 08 · Team & Access Control</div><h2>Secure your store &amp; build your team.</h2><p>Set your admin PIN first: it protects settlements, voids, discounts and settings. Then add your first cashier to start billing today.</p></div>'
  +'<div class="a-info">ℹ️ Your admin PIN is stored only on this device. Choose a PIN only you know. You can always reset it from Settings → Team & Roles.</div>'
  +'<div class="a-slbl">Admin / owner PIN: this device <span class="ar">*</span></div>'
  +'<div class="a-pin-row">'+[0,1,2,3].map(function(i){return '<input type="password" class="a-pin-box" id="admin_pin_'+i+'" maxlength="1" inputmode="numeric" pattern="[0-9]" onkeyup="pinMove(\'admin_pin\','+i+',4,\'adminPin\')">';}).join('')+'</div>'
  +'<div class="a-slbl" style="margin-top:16px">Confirm PIN <span class="ar">*</span></div>'
  +'<div class="a-pin-row">'+[0,1,2,3].map(function(i){return '<input type="password" class="a-pin-box" id="confirm_pin_'+i+'" maxlength="1" inputmode="numeric" pattern="[0-9]" onkeyup="pinMove(\'confirm_pin\','+i+',4,\'confirmPin\')">';}).join('')+'</div>'
  +'<div class="a-slbl" style="margin-top:18px">Require admin PIN for</div>'
  +[['pinForDiscount',true,'Discounts: require approval above','% threshold','pinDiscPct','10'],['pinForRefund',true,'All refunds / returns',null,null,null],['pinForVoid',true,'Bill void & cancel',null,null,null],['pinForSettings',true,'Settings & configuration changes',null,null,null]].map(function(row){
    var extraInput=row[4]?'<input type="number" id="d_'+row[4]+'" value="'+row[5]+'" style="width:48px;border:1.5px solid #E6E8EB;border-radius:6px;padding:0 6px;height:28px;font-family:\'JetBrains Mono\',monospace;font-size:14px;text-align:center;outline:none;margin:0 4px" oninput="AUTH.d[\''+row[4]+'\']=this.value">':'';
    return '<div class="at-row"><div style="flex:1"><div class="at-l">'+row[2]+extraInput+(row[3]||'')+'</div></div><button class="at-btn'+(AUTH.d[row[0]]?' on':'')+'" onclick="AUTH.d[\''+row[0]+'\']=!AUTH.d[\''+row[0]+'\'];this.classList.toggle(\'on\')"></button></div>';
  }).join('')
  +'<div class="a-slbl" style="margin-top:18px">First cashier</div>'
  +'<div class="arow2">'
  +af('cashierName','Full name',{ph:'e.g. Riya Sharma',req:true})
  +af('cashierPhone','Mobile number',{ph:'+91',type:'tel',hint:'OTP sent for app login'})
  +'</div>'
  +'<div class="arow2">'
  +af('cashierRole','Role',{type:'select',options:[['cashier','Cashier'],['sr_cashier','Senior Cashier'],['floor','Floor Staff'],['manager','Store Manager']]})
  +af('cashierShift','Default shift',{type:'select',options:[['morning','Morning (6AM–2PM)'],['mid','Mid-day (10AM–6PM)'],['evening','Evening (2PM–10PM)'],['full','Full day (10AM–10PM)']]})
  +'</div>'
  +'<div class="a-slbl">Cashier billing PIN</div>'
  +'<div class="a-pin-row">'+[0,1,2,3].map(function(i){return '<input type="password" class="a-pin-box" id="cashier_pin_'+i+'" maxlength="1" inputmode="numeric" pattern="[0-9]" onkeyup="pinMove(\'cashier_pin\','+i+',4,\'cashierPin\')">';}).join('')+'</div>'
  +'<div class="arow2" style="margin-top:16px">'
  +af('float','Opening float per counter (₹)',{val:'5000',type:'number',hint:'Cash in drawer before first sale. Baseline for end-of-day variance calculation.'})
  +af('eodReminder','End-of-day reminder',{type:'time',val:'21:30',hint:'Push notification to run EOD close.'})
  +'</div>'
  +'<div class="a-slbl">Auto clock-out after</div>'
  +'<div style="display:flex;flex-wrap:wrap">'+[['8','8 hours'],['10','10 hours'],['12','12 hours']].map(function(c){return achip('clockout',c[0],c[1]);}).join('')+'</div>';
}

/* ========== BOOT ========== */
authGo('splash');
