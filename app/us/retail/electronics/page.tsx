import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = { title: "Electronics POS | Ambel POS" };

export default function Page() {
  return (
    <RetailVerticalPage
      region="INTL"
      tag="Electronics"
      title="Serial numbers, warranties"
      emphasis="and service plans, sorted."
      subtitle="Track IMEI and serial numbers, manage manufacturer warranties and extended service plans, and ring up high-value items with confidence."
      stats={[
        ["340+", "Electronics stores"],
        ["2.4M+", "Serials tracked"],
        ["0.02%", "Warranty mismatch rate"],
      ]}
      features={[
        { title: "IMEI & Serial Capture", body: "Scan or enter serial/IMEI at the point of sale, automatically linked to the ticket for warranty claims." },
        { title: "Warranty & Service Plans", body: "Track manufacturer warranty windows and extended service plans per unit, with alerts before coverage lapses." },
        { title: "High-value Approval Flow", body: "Manager approval gates for big-ticket discounts, protecting margin on high-value electronics." },
        { title: "Card & Financing Settlement", body: "Reconcile card, financing and BNPL settlements against processor reports with automatic reference matching." },
        { title: "Return & RMA Handling", body: "Log defective-unit returns against the original serial number and route to vendor RMA in one step." },
        { title: "Multi-brand Catalog", body: "Organize SKUs by brand, model and variant with spec-sheet fields built for electronics." },
      ]}
    />
  );
}
