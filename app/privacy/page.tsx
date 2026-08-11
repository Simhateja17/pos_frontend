import "@/app/landing.css";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata = { title: "Privacy Policy | Ambel POS" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
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
            <li>To operate core features: billing, inventory, reports and GST filing exports.</li>
            <li>To power AI Copilot suggestions, always scoped to your own store&apos;s data.</li>
            <li>To send service notifications (invoices, sync status, renewal reminders).</li>
            <li>To improve reliability, performance and fraud detection.</li>
          </ul>

          <h2>3. What we never do</h2>
          <p>We do not sell your store data or your customers&apos; data to third parties. We do not use one merchant&apos;s transaction data to benefit another merchant on the platform.</p>

          <h2>4. Data storage & security</h2>
          <p>Data is encrypted in transit and at rest, hosted on infrastructure located in India, with role-based access controls and audit logging on every account. Offline billing data is encrypted locally and synced once connectivity returns.</p>

          <h2>5. Your rights</h2>
          <p>You can request an export or deletion of your account data at any time by writing to <a href="mailto:privacy@Ambel.in">privacy@Ambel.in</a>. Certain records, such as GST invoices, are retained as required by Indian tax law even after account closure.</p>

          <h2>6. Changes to this policy</h2>
          <p>We&apos;ll notify account owners by email at least 14 days before any material change to this policy takes effect.</p>

          <h2>7. Contact</h2>
          <p>Questions about this policy can be sent to <a href="mailto:privacy@Ambel.in">privacy@Ambel.in</a> or via our <a href="/contact">contact page</a>.</p>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
