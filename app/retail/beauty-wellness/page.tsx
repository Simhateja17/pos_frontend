import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = {
  title: "Beauty & Wellness POS | Ambel POS",
  description: "Beauty and wellness POS with batch and expiry tracking, combined service and retail billing, tiered loyalty and appointment-aware checkout.",
};

export default function Page() {
  return (
    <RetailVerticalPage
      tag="Beauty & Wellness"
      title="Billing that keeps up"
      emphasis="with your counter."
      subtitle="Batch tracking, expiry alerts and service + retail billing in one screen, built for cosmetics, skincare, salons and wellness stores."
      stats={[
        ["₹799", "Starting plan, per month"],
        ["18%", "GST built into every bill"],
        ["Offline", "Billing works without signal"],
      ]}
      features={[
        { title: "Batch & Expiry Tracking", body: "Every batch is tracked from goods-in to sale, with automatic expiry alerts before stock goes unsellable." },
        { title: "Service + Retail in One Bill", body: "Combine a spa service and retail product on the same invoice, with separate GST treatment handled automatically." },
        { title: "Loyalty & Gift Cards", body: "Tiered loyalty points and prepaid gift cards that work across every branch and channel." },
        { title: "Sample & Tester Tracking", body: "Log testers and samples separately from sellable stock so shrinkage never hides in your margin numbers." },
        { title: "Appointment-aware Billing", body: "Pull a booked service straight onto the bill screen, with no re-typing of client or service details." },
        { title: "Vendor Batch Returns", body: "Return expired or damaged batches to the vendor with auto-generated debit notes." },
      ]}
    />
  );
}
