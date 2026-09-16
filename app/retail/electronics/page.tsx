import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = {
  title: "Electronics POS | Ambel POS",
  description: "Billing software for electronics shops. Barcode billing, stock across branches, suppliers and purchase orders, and advice on what to reorder.",
};

export default function Page() {
  return (
    <RetailVerticalPage
      tag="Electronics"
      title="Serial numbers, warranties"
      emphasis="and AMC, sorted."
      subtitle="Track IMEI/serial numbers, manage manufacturer warranties and AMC renewals, and bill high-value items with confidence."
      stats={[
        ["₹799", "Starting plan, per month"],
        ["18%", "GST built into every bill"],
        ["No signal", "Billing carries on, syncs after"],
      ]}
      features={[
        { title: "Barcode Billing", body: "Scan the box or search by model, with line-level GST and split payment across cash, card and UPI." },
        { title: "Returns Against the Original Bill", body: "Pull up the original sale, reprint or re-send it, and process the return, refund or exchange against that bill." },
        { title: "Roles for Staff and Owners", body: "Owners see everything. Staff see only what their role allows, enforced in the database, not just hidden in the screen." },
        { title: "Shift and Cash Tally", body: "Opening cash, a mid-day check, a count at closing, and the shortfall or excess shown plainly for every counter session." },
        { title: "Suppliers and Purchase Orders", body: "Supplier lead times feed the reorder advice directly. Raise an order and receive it in parts as the stock arrives." },
        { title: "Capital Tied Up in Slow Stock", body: "Electronics ties up more money per unit than most retail. We tell you what is actually moving and what to reorder, and say plainly when an item is too new to judge." },
      ]}
    />
  );
}
