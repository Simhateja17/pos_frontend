/*
 * US edition terms of service — the `/terms` mirror for the International
 * edition.
 */
import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = { title: "Terms of Service | Ambel POS" };

export default function USTermsPage() {
  return (
    <>
      <SiteHeader region="INTL" />
      <section className="content-hero" style={{ padding: "156px 5vw 40px" }}>
        <h1 style={{ fontSize: "clamp(28px,4vw,44px)" }}>Terms of Service</h1>
      </section>
      <section className="content-section">
        <div className="content-wrap content-prose">
          <p className="legal-updated">Last updated: January 1, 2026</p>

          <h2>1. Agreement to terms</h2>
          <p>By creating an account or using Ambel POS, you agree to these terms on behalf of yourself and the business you represent. If you don&apos;t agree, please don&apos;t use the product.</p>

          <h2>2. Subscription &amp; billing</h2>
          <p>Plans are billed monthly or annually per the pricing shown at signup, in US dollars and exclusive of applicable sales tax. Fees are non-refundable except where required by law. You can cancel any time; access continues until the end of the current billing period.</p>

          <h2>3. Your responsibilities</h2>
          <ul>
            <li>Keep your account credentials secure and restrict staff access using role-based permissions.</li>
            <li>Ensure the tax data entered into the platform — nexus states, product taxability and exemption certificates — is accurate. Ambel POS assists with sales tax calculation and reporting but does not file returns on your behalf unless you use our filing add-on.</li>
            <li>Do not use the platform for unlawful transactions or to circumvent tax obligations.</li>
          </ul>

          <h2>4. AI Copilot</h2>
          <p>Copilot suggestions are generated from your store&apos;s data and are provided for assistance only. Actions proposed by Copilot require your explicit approval before they take effect. You remain responsible for reviewing them before confirming.</p>

          <h2>5. Service availability</h2>
          <p>We target 99.98% uptime for cloud sync; core checkout continues offline regardless of connectivity. Scheduled maintenance is communicated in advance where possible.</p>

          <h2>6. Termination</h2>
          <p>We may suspend or terminate accounts that violate these terms, with notice where practical. You may export your data before or during the notice period.</p>

          <h2>7. Disclaimers &amp; limitation of liability</h2>
          <p>Ambel POS is provided &quot;as is,&quot; without warranties of any kind to the extent permitted by law. To the extent permitted by law, we are not liable for indirect, incidental or consequential losses arising from use of the platform.</p>

          <h2>8. Governing law</h2>
          <p>These terms are governed by the laws of the State of Delaware, without regard to its conflict-of-laws rules, and the state and federal courts located in Delaware have exclusive jurisdiction over any dispute.</p>

          <h2>9. Contact</h2>
          <p>Questions about these terms can be sent to <a href="mailto:legal@ambelpos.com">legal@ambelpos.com</a> or via our <a href="/us/contact">contact page</a>.</p>
        </div>
      </section>
      <SiteFooter region="INTL" />
    </>
  );
}
