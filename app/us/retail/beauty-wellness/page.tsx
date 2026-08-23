import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = { title: "Beauty & Wellness POS | Ambel POS" };

export default function Page() {
  return (
    <RetailVerticalPage
      region="INTL"
      tag="Beauty & Wellness"
      title="Checkout that keeps up"
      emphasis="with your counter."
      subtitle="Lot tracking, expiration alerts and service + retail on one ticket, built for cosmetics, skincare, salons and wellness stores."
      stats={[
        ["620+", "Beauty & wellness stores"],
        ["99.2%", "Expiration-alert accuracy"],
        ["2.5x", "Faster checkout"],
      ]}
      features={[
        { title: "Lot & Expiration Tracking", body: "Every lot is tracked from receiving to sale, with automatic alerts before stock passes its expiration date." },
        { title: "Service + Retail on One Ticket", body: "Combine a spa service and a retail product on the same ticket, with the correct taxability applied to each line." },
        { title: "Loyalty & Gift Cards", body: "Tiered loyalty points and prepaid gift cards that work across every location and channel." },
        { title: "Sample & Tester Tracking", body: "Log testers and samples separately from sellable stock so shrink never hides in your margin numbers." },
        { title: "Appointment-aware Checkout", body: "Pull a booked service straight onto the ticket, with no re-typing of client or service details." },
        { title: "Vendor Lot Returns", body: "Return expired or damaged lots to the vendor with auto-generated debit memos." },
      ]}
    />
  );
}
