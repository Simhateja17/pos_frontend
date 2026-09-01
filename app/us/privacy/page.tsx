/*
 * US edition privacy policy — the `/privacy` mirror for the International
 * edition. Same legal-prose layout as the India page; the substance reflects
 * the US deployment (US-hosted data, state privacy rights, US retention).
 */
import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = { title: "Privacy Policy | Ambel POS" };

export default function USPrivacyPage() {
  return (
    <>
      <SiteHeader region="INTL" />
      <section className="content-hero" style={{ padding: "156px 5vw 40px" }}>
        <h1 style={{ fontSize: "clamp(28px,4vw,44px)" }}>Privacy Policy</h1>
      </section>
      <section className="content-section">
        <div className="content-wrap content-prose">
          <p className="legal-updated">Last updated: January 1, 2026</p>

          <h2>1. What we collect</h2>
          <p>Ambel POS collects the information you provide when creating an account (name, email, phone, business details) and the operational data your store generates while using the product: transactions, inventory, customer records and staff activity. We also collect basic device and usage analytics to keep the app fast and reliable.</p>

          <h2>2. How we use it</h2>
          <ul>
            <li>To operate core features: checkout, inventory, reports and sales tax exports.</li>
            <li>To power AI Copilot suggestions, always scoped to your own store&apos;s data.</li>
            <li>To send service notifications (invoices, sync status, renewal reminders).</li>
            <li>To improve reliability, performance and fraud detection.</li>
          </ul>

          <h2>3. What we never do</h2>
          <p>We do not sell your store data or your customers&apos; data to third parties, and we do not share it for cross-context behavioral advertising. We do not use one merchant&apos;s transaction data to benefit another merchant on the platform.</p>

          <h2>4. Data storage &amp; security</h2>
          <p>Data for the International edition is encrypted in transit and at rest and hosted on infrastructure assigned to that edition, with role-based access controls and audit logging on every account. Offline checkout data is encrypted locally and synced once connectivity returns.</p>

          <h2>5. Your rights</h2>
          <p>Depending on where you live, you may have the right to access, correct, delete or port your personal information, and to opt out of its sale or sharing. We honor requests under the privacy frameworks that apply to our users. Write to <a href="mailto:privacy@ambelpos.com">privacy@ambelpos.com</a> and we will respond within 45 days. Certain records, such as sales-tax invoices, are retained as required by applicable law even after account closure.</p>

          <h2>6. Children&apos;s privacy</h2>
          <p>Ambel POS is a business tool and is not directed to children under 13. We do not knowingly collect personal information from children.</p>

          <h2>7. Changes to this policy</h2>
          <p>We&apos;ll notify account owners by email at least 14 days before any material change to this policy takes effect.</p>

          <h2>8. Contact</h2>
          <p>Questions about this policy can be sent to <a href="mailto:privacy@ambelpos.com">privacy@ambelpos.com</a> or via our <a href="/us/contact">contact page</a>.</p>
        </div>
      </section>
      <SiteFooter region="INTL" />
    </>
  );
}
