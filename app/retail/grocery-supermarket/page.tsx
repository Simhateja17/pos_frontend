import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = {
  title: "Grocery & Supermarket POS Software | Ambel POS",
  description: "Grocery and supermarket POS with fast barcode billing, purchase tracking, stock and reorder guidance, and WhatsApp-assisted catalogue setup.",
};

export default function Page() {
  return (
    <RetailVerticalPage
      tag="Grocery & Supermarket"
      title="Start billing with a POS"
      emphasis="prepared for your grocery store."
      subtitle="Send your product photos, supplier bills, Excel file, or handwritten list on WhatsApp. We help prepare your catalogue so you can start billing with sales and stock connected, across every counter and location."
      stats={[
        ["₹799", "Starting plan, per month"],
        ["18%", "GST built into every bill"],
        ["Offline", "Billing works without signal"],
      ]}
      features={[
        { title: "Fast Barcode Billing", body: "Scan packaged goods or search loose items by name, weight or unit, with multi-cashier billing for busy counters." },
        { title: "Purchases & Supplier Bills", body: "Log supplier purchases and goods-in as they arrive, so stock stays accurate without end-of-day recounts." },
        { title: "Stock & Reorder Guidance", body: "See stock across the store in real time, with reorder suggestions based on actual sales, not guesswork." },
        { title: "Multi-counter & Multi-location", body: "Run several billing counters and locations on one account, with the included registers and users your plan covers." },
        { title: "Weight & Loose-item Pricing", body: "Bill fruits, vegetables and loose grocery items by weight, alongside barcoded packaged SKUs, on the same invoice." },
        { title: "WhatsApp-assisted Setup", body: "Send your existing product list, supplier bills or photos on WhatsApp, and we help prepare your catalogue for you." },
      ]}
    />
  );
}
