import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = {
  title: "Beauty & Wellness POS | Ambel POS",
  description: "Billing software for beauty and wellness shops. Shade and size variants, fast counter billing, stock across branches, and advice on what to reorder.",
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
        ["No signal", "Billing carries on, syncs after"],
      ]}
      features={[
        { title: "Shades, Sizes and Variants", body: "One product, every shade and size underneath it, each with its own stock count, price and barcode." },
        { title: "Fast Counter Billing", body: "Scan or search, apply a discount, and split the payment across cash, card and UPI. The bill will not close until the payments match the total." },
        { title: "Tells You What to Reorder", body: "Fast-moving shades run out first. We watch how each one sells and tell you how much to order, with the reasoning shown." },
        { title: "Stock Adjustments with Reasons", body: "Write off a damaged or used-up tester against a reason, and see it in the stock movement report rather than losing it in the margin." },
        { title: "Returns and Exchanges", body: "Pull up any earlier bill, print or email it again, and take a return, refund or exchange against it." },
        { title: "Branches and Transfers", body: "Stock counted per branch, and transfers between them that record what was sent and what actually arrived separately." },
      ]}
    />
  );
}
