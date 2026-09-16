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
        ["3", "Forecasting methods tried per item"],
        ["80%", "Of the time, demand lands in the range"],
        ["60", "Days of sales before we advise you"],
      ]}
      features={[
        { title: "Lot & Expiration Tracking", body: "Every lot is tracked from receiving to sale, with automatic alerts before stock passes its expiration date." },
        { title: "Service + Retail on One Ticket", body: "Combine a spa service and a retail product on the same ticket, with the correct taxability applied to each line." },
        { title: "Tells You What to Reorder", body: "Fast-moving shades run out first. We watch how each one sells and tell you how much to order, with the reasoning shown." },
        { title: "Sample & Tester Tracking", body: "Log testers and samples separately from sellable stock so shrink never hides in your margin numbers." },
        { title: "Appointment-aware Checkout", body: "Pull a booked service straight onto the ticket, with no re-typing of client or service details." },
        { title: "Vendor Lot Returns", body: "Return expired or damaged lots to the vendor with auto-generated debit memos." },
      ]}
    />
  );
}
