/* ═══════════════════════════════════════════════
   AMBEL POS — Onboarding step data
   Each step's main body (form + context aside) is kept as
   markup and rendered by the shared shell. Inline handlers
   from the original HTML are replaced with data-nav hooks:
   the shell intercepts form submit (Continue) and clicks on
   [data-nav="back"] / [data-nav="skip"].
   ═══════════════════════════════════════════════ */

export const FINAL_ROUTE = "/us/dashboard";

export const STEPS = [
  {
    n: 1,
    label: "Choose your plan",
    help: {
      title: "Paid subscription",
      text: "Choose a plan and complete secure checkout to activate your store.",
    },
    body: `
      <form data-onboarding-form>
        <div class="step-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          Step 1 of 8
        </div>
        <h1>Pick the plan that fits your store</h1>
        <p class="subtitle">All prices in USD. Your subscription starts after secure checkout. You can change plans in a future billing cycle.</p>

        <div class="form-group">
          <label>Subscription plan</label>
          <div class="choice-group">
            <label class="choice">
              <input type="radio" name="plan" value="essentials">
              <div class="choice-body"><b>Essentials · $29/mo</b><span>1 location · 2 registers · sales tax automation, digital receipts, offline billing &amp; email support</span></div>
            </label>
            <label class="choice">
              <input type="radio" name="plan" value="professional" checked>
              <div class="choice-body"><b>Professional · $79/mo</b><span>Up to 5 locations · everything in Essentials plus omnichannel (Shopify) sync, BOPIS &amp; ship-from-store, advanced reports and phone support</span></div>
              <span class="choice-tag">Most popular</span>
            </label>
            <label class="choice">
              <input type="radio" name="plan" value="enterprise">
              <div class="choice-body"><b>Enterprise · Custom</b><span>Unlimited locations &amp; registers · custom reporting and API, dedicated account manager and 99.98% uptime SLA</span></div>
            </label>
          </div>
          <div class="form-hint" style="margin-top:10px;">Annual billing is charged upfront through Razorpay.</div>
        </div>

        <div class="button-group">
          <button type="submit" class="btn btn-primary">Continue to payment
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
          <button type="button" class="btn btn-skip" data-nav="skip">Decide later</button>
        </div>
      </form>

      <div class="aside-panel">
        <div class="ctx-card">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <h4>Every plan includes</h4>
          <ul class="ctx-list">
            <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Automatic US sales tax</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Tap, chip &amp; mobile payments</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Unlimited staff accounts</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Offline-first billing</li>
          </ul>
        </div>
        <div class="ctx-card">
          <h4>No surprises</h4>
          <p>Prices shown are per location, per month. Cancel anytime during your trial and you won't be charged.</p>
        </div>
      </div>
    `,
  },
  {
    n: 2,
    label: "Business & tax ID",
    help: {
      title: "Need a hand?",
      text: "Live US onboarding support, 7am–9pm CT. Setup takes about 8 minutes.",
    },
    body: `
      <form data-onboarding-form>
        <div class="step-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>
          Step 2 of 8
        </div>
        <h1>Tell us about your business</h1>
        <p class="subtitle">We use your federal and state IDs to file sales tax correctly and verify your merchant account.</p>

        <div class="form-group">
          <label>Legal business name</label>
          <input type="text" placeholder="Ambel Boutique LLC" value="Ambel Boutique LLC" required>
        </div>

        <div class="form-group">
          <label>Business structure</label>
          <div class="choice-grid-2">
            <label class="choice"><input type="radio" name="structure" value="llc" checked><div class="choice-body"><b>LLC</b><span>Limited liability company</span></div></label>
            <label class="choice"><input type="radio" name="structure" value="sole"><div class="choice-body"><b>Sole proprietor</b><span>Single owner, Schedule C</span></div></label>
            <label class="choice"><input type="radio" name="structure" value="scorp"><div class="choice-body"><b>S-Corporation</b><span>Pass-through entity</span></div></label>
            <label class="choice"><input type="radio" name="structure" value="ccorp"><div class="choice-body"><b>C-Corporation</b><span>Separate taxable entity</span></div></label>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>EIN (Federal Tax ID)<div class="form-hint">9 digits, format 12-3456789</div></label>
            <input type="text" placeholder="12-3456789" required>
          </div>
          <div class="form-group">
            <label>State sales tax permit #<div class="form-hint">From your state's revenue department</div></label>
            <input type="text" placeholder="Optional, add later" >
          </div>
        </div>

        <div class="form-group">
          <label>Store address</label>
          <input type="text" placeholder="100 Congress Ave" value="100 Congress Ave" required style="margin-bottom:12px;">
          <div class="form-row-3">
            <input type="text" placeholder="City" value="Austin" required>
            <select required>
              <option value="">State</option>
              <option value="TX" selected>Texas</option>
              <option>California</option><option>New York</option><option>Florida</option>
              <option>Illinois</option><option>Colorado</option><option>Washington</option>
              <option>Georgia</option><option>Arizona</option><option>Other</option>
            </select>
            <input type="text" placeholder="ZIP" value="78701" required>
          </div>
        </div>

        <div class="button-group">
          <button type="submit" class="btn btn-primary">Continue
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
          <button type="button" class="btn btn-skip" data-nav="skip">Skip setup for now</button>
        </div>
      </form>

      <div class="aside-panel">
        <div class="ctx-card">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M7 15h4"/></svg></div>
          <h4>Why we ask for your EIN</h4>
          <p>Your Employer Identification Number lets us auto-populate sales tax filings and verify your business with payment processors, with no paperwork later.</p>
        </div>
        <div class="ctx-card">
          <h4>What you'll need handy</h4>
          <ul class="ctx-list">
            <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>EIN or SSN</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>State sales tax permit</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Business bank account</li>
          </ul>
        </div>
      </div>
    `,
  },
  {
    n: 3,
    label: "Sales tax nexus",
    help: {
      title: "Tax handled for you",
      text: "We calculate state, county, city & district rates on every sale automatically.",
    },
    body: `
      <form data-onboarding-form>
        <div class="step-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z"/><path d="M8 8h6M8 12h8M8 16h5"/></svg>
          Step 3 of 8
        </div>
        <h1>Where do you owe sales tax?</h1>
        <p class="subtitle">The US has no national sales tax. Rates are set by 13,000+ state, county, and city jurisdictions. Tell us where you have nexus and we handle the math.</p>

        <div class="form-group">
          <label>Home state (physical nexus)</label>
          <select required>
            <option value="">Select your home state...</option>
            <option selected>Texas · 6.25% state base</option>
            <option>California · 7.25% state base</option>
            <option>New York · 4.00% state base</option>
            <option>Florida · 6.00% state base</option>
            <option>Colorado · 2.90% state base</option>
            <option>Washington · 6.50% state base</option>
          </select>
        </div>

        <div class="form-group">
          <label>Do you have economic nexus in other states?<div class="form-hint">You owe tax in states where online sales cross a threshold (often $100K or 200 transactions/yr)</div></label>
          <div class="choice-group">
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>California</b><span>$500K threshold · likely crossed</span></div><span class="choice-tag">Nexus</span></label>
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>New York</b><span>$500K + 100 sales threshold</span></div><span class="choice-tag">Nexus</span></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Colorado</b><span>$100K threshold · approaching</span></div><span class="choice-tag amber">Watch</span></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Add another state…</b><span>We'll monitor thresholds automatically</span></div></label>
          </div>
        </div>

        <div class="form-group">
          <label>How should we calculate &amp; file tax?</label>
          <div class="choice-group">
            <label class="choice"><input type="radio" name="taxengine" value="builtin" checked><div class="choice-body"><b>Built-in tax engine</b><span>Real-time rates by address, included free</span></div><span class="choice-tag">Recommended</span></label>
            <label class="choice"><input type="radio" name="taxengine" value="avalara"><div class="choice-body"><b>Connect Avalara / TaxJar</b><span>Use your existing tax automation account</span></div></label>
          </div>
        </div>

        <div class="form-group">
          <label>Tax-exempt &amp; resale sales</label>
          <div class="choice-group">
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Accept resale certificates</b><span>For wholesale buyers: store cert on file, skip tax</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Clothing tax holidays</b><span>Auto-apply state sales-tax-free weekends</span></div></label>
          </div>
        </div>

        <div class="button-group">
          <button type="button" class="btn btn-secondary" data-nav="back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>Back
          </button>
          <button type="submit" class="btn btn-primary">Continue
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </form>

      <div class="aside-panel">
        <div class="ctx-card accent">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
          <div class="ctx-stat"><b>13,000+</b><span>US tax jurisdictions</span></div>
          <p>Rates change constantly. We update them automatically so you never charge the wrong amount or fail an audit.</p>
        </div>
        <div class="ctx-card">
          <h4>After <em>Wayfair</em> (2018)</h4>
          <p>The Supreme Court ruled states can tax online sales even without a physical store. Most states now enforce economic nexus thresholds, and we track yours so you stay compliant.</p>
        </div>
      </div>
    `,
  },
  {
    n: 4,
    label: "Payments & tipping",
    help: {
      title: "PCI compliant",
      text: "End-to-end encryption and tokenization on every card. We handle PCI scope for you.",
    },
    body: `
      <form data-onboarding-form>
        <div class="step-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>
          Step 4 of 8
        </div>
        <h1>Set up payments &amp; tipping</h1>
        <p class="subtitle">Accept tap, chip, and mobile wallets, then turn on a US-style tip screen if you want one.</p>

        <div class="form-group">
          <label>Payment processor</label>
          <div class="choice-grid-2">
            <label class="choice"><input type="radio" name="proc" value="stripe" checked><div class="choice-body"><b>Stripe</b><span>2.7% + 5¢ in-person</span></div></label>
            <label class="choice"><input type="radio" name="proc" value="square"><div class="choice-body"><b>Square</b><span>2.6% + 10¢ in-person</span></div></label>
            <label class="choice"><input type="radio" name="proc" value="clover"><div class="choice-body"><b>Clover / Fiserv</b><span>Custom merchant rate</span></div></label>
            <label class="choice"><input type="radio" name="proc" value="existing"><div class="choice-body"><b>Existing merchant acct</b><span>Bring your own processor</span></div></label>
          </div>
        </div>

        <div class="form-group">
          <label>Which payment methods will you accept?</label>
          <div class="choice-grid-2">
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Tap to pay</b><span>Contactless cards</span></div></label>
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Chip (EMV)</b><span>Insert card</span></div></label>
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Apple Pay / Google Pay</b><span>Mobile wallets</span></div></label>
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Cash</b><span>With drawer + change</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Gift cards</b><span>Store-branded balance</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Buy now, pay later</b><span>Affirm / Afterpay</span></div></label>
          </div>
        </div>

        <div class="form-group">
          <label>Tip prompt at checkout<div class="form-hint">Common in US retail &amp; service. Shown on the customer-facing screen after card tap.</div></label>
          <div class="choice-group">
            <label class="choice"><input type="radio" name="tip" value="on" checked><div class="choice-body"><b>Enable tip screen</b><span>Suggested presets: 15% · 18% · 20% · Custom · No tip</span></div></label>
            <label class="choice"><input type="radio" name="tip" value="off"><div class="choice-body"><b>No tipping</b><span>Skip the tip prompt entirely</span></div></label>
          </div>
        </div>

        <div class="form-group">
          <label>Card surcharging<div class="form-hint">Passing card fees to customers is legal in most states, but banned in CT, MA &amp; others. We enforce your state's rule.</div></label>
          <div class="seg">
            <label><input type="radio" name="surcharge" value="no" checked><span>Absorb fees</span></label>
            <label><input type="radio" name="surcharge" value="yes"><span>Add surcharge</span></label>
            <label><input type="radio" name="surcharge" value="cash"><span>Cash discount</span></label>
          </div>
        </div>

        <div class="button-group">
          <button type="button" class="btn btn-secondary" data-nav="back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>Back
          </button>
          <button type="submit" class="btn btn-primary">Continue
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </form>

      <div class="aside-panel">
        <div class="ctx-card">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg></div>
          <div class="ctx-stat"><b>58%</b><span>of US in-store payments</span></div>
          <p>are now contactless tap or mobile wallet. Tap to pay is enabled by default so checkout stays under 5 seconds.</p>
        </div>
        <div class="ctx-card accent">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <h4>Tipping, done right</h4>
          <p>Tips route to staff with full reporting for payroll. Toggle presets any time from Settings.</p>
        </div>
      </div>
    `,
  },
  {
    n: 5,
    label: "Products & catalog",
    help: {
      title: "Bulk import ready",
      text: "Drop in a CSV from Excel, Shopify, Square or Lightspeed and we map the columns for you.",
    },
    body: `
      <form data-onboarding-form>
        <div class="step-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/></svg>
          Step 5 of 8
        </div>
        <h1>Bring in your products</h1>
        <p class="subtitle">Import your catalog with sizes, colors, costs, and UPC barcodes, or start fresh and add as you go.</p>

        <div class="form-group">
          <label>How do you want to import?</label>
          <div class="choice-grid-2">
            <label class="choice"><input type="radio" name="import" value="csv" checked><div class="choice-body"><b>Upload a CSV</b><span>From Excel or Google Sheets</span></div></label>
            <label class="choice"><input type="radio" name="import" value="shopify"><div class="choice-body"><b>Sync from Shopify</b><span>Two-way inventory sync</span></div></label>
            <label class="choice"><input type="radio" name="import" value="migrate"><div class="choice-body"><b>Migrate from Square / Lightspeed</b><span>We pull your old catalog</span></div></label>
            <label class="choice"><input type="radio" name="import" value="manual"><div class="choice-body"><b>Start fresh</b><span>Add items by hand</span></div></label>
          </div>
        </div>

        <div class="form-group">
          <label>Do you sell items in size / color / material variants?</label>
          <div class="choice-group">
            <label class="choice"><input type="radio" name="variants" value="yes" checked><div class="choice-body"><b>Yes, track variants</b><span>Each size + color is its own SKU with separate stock counts</span></div></label>
            <label class="choice"><input type="radio" name="variants" value="no"><div class="choice-body"><b>No, simple products</b><span>One SKU per item</span></div></label>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Barcode format</label>
            <select required>
              <option selected>UPC-A (12-digit, US standard)</option>
              <option>EAN-13 (international)</option>
              <option>Custom SKU codes</option>
              <option>Generate barcodes for me</option>
            </select>
          </div>
          <div class="form-group">
            <label>Catalog size</label>
            <select required>
              <option value="">Select…</option>
              <option>Under 100 items</option>
              <option selected>100–1,000 items</option>
              <option>1,000–5,000 items</option>
              <option>5,000+ items</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Also set up</label>
          <div class="choice-grid-2">
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Sell &amp; redeem gift cards</b><span>Physical + digital</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Low-stock reorder alerts</b><span>Auto-flag SKUs to reorder</span></div></label>
          </div>
        </div>

        <div class="button-group">
          <button type="button" class="btn btn-secondary" data-nav="back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>Back
          </button>
          <button type="submit" class="btn btn-primary">Continue
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </form>

      <div class="aside-panel">
        <div class="ctx-card">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg></div>
          <h4>UPC-A is the US standard</h4>
          <p>The 12-digit barcode on most American retail products. We can also print our own labels for unbranded inventory.</p>
        </div>
        <div class="ctx-card accent">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg></div>
          <h4>Gift cards drive repeat visits</h4>
          <p>US shoppers spend an average of $59 over a gift card's value. We track balances across every register.</p>
        </div>
      </div>
    `,
  },
  {
    n: 6,
    label: "Channels & BOPIS",
    help: {
      title: "One stock pool",
      text: "Store and online share the same inventory, so no overselling across channels.",
    },
    body: `
      <form data-onboarding-form>
        <div class="step-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M16 3h5v5"/><path d="M21 3l-9 9"/></svg>
          Step 6 of 8
        </div>
        <h1>Connect your sales channels</h1>
        <p class="subtitle">Sell in-store and online from one inventory, then offer pickup and ship-from-store.</p>

        <div class="form-group">
          <label>Where do you sell today?</label>
          <div class="choice-grid-2">
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>In-store POS</b><span>Your physical register</span></div></label>
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Shopify storefront</b><span>Sync products + orders</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Instagram &amp; Facebook Shop</b><span>Meta commerce</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Marketplaces</b><span>Etsy, Poshmark, Depop</span></div></label>
          </div>
        </div>

        <div class="form-group">
          <label>Fulfillment options for online orders</label>
          <div class="choice-group">
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>BOPIS: buy online, pick up in store</b><span>Reserve stock, notify customer, stage at pickup counter</span></div><span class="choice-tag">Popular</span></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Ship from store</b><span>Fulfill web orders from shelf inventory</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Curbside pickup</b><span>Customer checks in from the parking lot</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Local same-day delivery</b><span>Within a set radius of your store</span></div></label>
          </div>
        </div>

        <div class="form-group">
          <label>Loyalty &amp; marketing</label>
          <div class="choice-grid-2">
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Points loyalty program</b><span>Earn &amp; redeem at checkout</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Email &amp; SMS campaigns</b><span>Klaviyo / Mailchimp sync</span></div></label>
          </div>
        </div>

        <div class="button-group">
          <button type="button" class="btn btn-secondary" data-nav="back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>Back
          </button>
          <button type="submit" class="btn btn-primary">Continue
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </form>

      <div class="aside-panel">
        <div class="ctx-card accent">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg></div>
          <div class="ctx-stat"><b>1 in 4</b><span>US online orders</span></div>
          <p>are now bought online and picked up in store. BOPIS shoppers spend more per visit on impulse add-ons.</p>
        </div>
        <div class="ctx-card">
          <h4>No more overselling</h4>
          <p>When a web order comes in, we instantly reserve that unit so your floor staff never sell something that's already spoken for.</p>
        </div>
      </div>
    `,
  },
  {
    n: 7,
    label: "Team & registers",
    help: {
      title: "Built for shifts",
      text: "Clock-in, role permissions, and per-cashier sales reports come standard.",
    },
    body: `
      <form data-onboarding-form>
        <div class="step-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Step 7 of 8
        </div>
        <h1>Set up your team &amp; registers</h1>
        <p class="subtitle">Add staff with the right access, and tell us how many checkout stations you run.</p>

        <div class="form-row">
          <div class="form-group">
            <label>How many staff use the POS?</label>
            <select required>
              <option value="">Select…</option>
              <option>Just me</option>
              <option selected>2–5 people</option>
              <option>6–15 people</option>
              <option>16+ people</option>
            </select>
          </div>
          <div class="form-group">
            <label>How many registers / lanes?</label>
            <select required>
              <option value="">Select…</option>
              <option selected>1 register</option>
              <option>2 registers</option>
              <option>3–4 registers</option>
              <option>5+ registers</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Permission model</label>
          <div class="choice-group">
            <label class="choice"><input type="radio" name="roles" value="tiered" checked><div class="choice-body"><b>Manager + Cashier</b><span>Cashiers ring sales; managers handle refunds, discounts, voids &amp; reports</span></div><span class="choice-tag">Recommended</span></label>
            <label class="choice"><input type="radio" name="roles" value="advanced"><div class="choice-body"><b>Full role control</b><span>Owner, Manager, Cashier, Stockroom: set access per person</span></div></label>
            <label class="choice"><input type="radio" name="roles" value="flat"><div class="choice-body"><b>Everyone equal</b><span>All staff share the same access</span></div></label>
          </div>
        </div>

        <div class="form-group">
          <label>Register controls</label>
          <div class="choice-grid-2">
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>4-digit PIN login</b><span>Fast cashier switching</span></div></label>
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Manager PIN for refunds</b><span>Approve voids &amp; discounts</span></div></label>
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Clock in / out</b><span>Track hours per shift</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Cash drawer counts</b><span>Open &amp; close reconciliation</span></div></label>
          </div>
        </div>

        <div class="form-group">
          <label>Invite your team (optional)<div class="form-hint">We'll email them a setup link, and you can also add them later</div></label>
          <input type="email" placeholder="manager@yourstore.com, cashier@yourstore.com">
        </div>

        <div class="button-group">
          <button type="button" class="btn btn-secondary" data-nav="back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>Back
          </button>
          <button type="submit" class="btn btn-primary">Continue
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </form>

      <div class="aside-panel">
        <div class="ctx-card">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
          <h4>Stop shrinkage at the source</h4>
          <p>Requiring a manager PIN for refunds and voids is the simplest way US retailers cut register fraud and accidental discounts.</p>
        </div>
        <div class="ctx-card accent">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
          <h4>Per-cashier insights</h4>
          <p>See sales, average ticket, and conversion by employee, handy for scheduling and commission.</p>
        </div>
      </div>
    `,
  },
  {
    n: 8,
    label: "Receipts & launch",
    help: {
      title: "Almost there!",
      text: "One more step and your register is ready to ring up its first sale.",
    },
    body: `
      <form data-onboarding-form>
        <div class="step-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 11h6"/></svg>
          Step 8 of 8
        </div>
        <h1>Receipts &amp; compliance</h1>
        <p class="subtitle">US shoppers expect a digital receipt. Set defaults and confirm consent rules, then launch.</p>

        <div class="form-group">
          <label>Default receipt delivery</label>
          <div class="choice-grid-2">
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Email receipt</b><span>With full tax breakdown</span></div></label>
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>SMS / text receipt</b><span>Quick link to receipt</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>Printed receipt</b><span>Thermal printer</span></div></label>
            <label class="choice"><input type="checkbox"><div class="choice-body"><b>No receipt</b><span>Ask each time</span></div></label>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Store name on receipt</label>
            <input type="text" value="Ambel Boutique" required>
          </div>
          <div class="form-group">
            <label>Return / exchange window</label>
            <select required>
              <option selected>30 days</option>
              <option>14 days</option>
              <option>60 days</option>
              <option>90 days</option>
              <option>Final sale (no returns)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Receipt footer message</label>
          <textarea>Thanks for shopping with us! Returns accepted within 30 days with receipt.</textarea>
        </div>

        <div class="form-group">
          <label>Customer data &amp; consent<div class="form-hint">US law (CAN-SPAM &amp; TCPA) requires opt-in before marketing emails or texts</div></label>
          <div class="choice-group">
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Require opt-in for marketing</b><span>Collect explicit consent before adding to email/SMS lists</span></div></label>
            <label class="choice"><input type="checkbox" checked><div class="choice-body"><b>Show return barcode on receipts</b><span>Speeds up returns &amp; exchanges</span></div></label>
          </div>
        </div>

        <div class="button-group">
          <button type="button" class="btn btn-secondary" data-nav="back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>Back
          </button>
          <button type="submit" class="btn btn-primary">Finish &amp; open register
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
          </button>
        </div>
      </form>

      <div class="aside-panel">
        <div class="ctx-card accent">
          <div class="ctx-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <h4>You're ready to sell</h4>
          <p>Here's what we set up for your store:</p>
          <ul class="ctx-list" style="margin-top:12px;">
            <li style="color:rgba(255,255,255,.78)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Sales tax for TX, CA &amp; NY</li>
            <li style="color:rgba(255,255,255,.78)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Tap, chip &amp; mobile payments</li>
            <li style="color:rgba(255,255,255,.78)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Catalog + gift cards</li>
            <li style="color:rgba(255,255,255,.78)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Shopify sync &amp; BOPIS</li>
            <li style="color:rgba(255,255,255,.78)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Digital receipts</li>
          </ul>
        </div>
      </div>
    `,
  },
];
