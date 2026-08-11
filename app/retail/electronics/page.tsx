import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = { title: "Electronics POS | Ambel POS" };

export default function Page() {
  return (
    <RetailVerticalPage
      tag="Electronics"
      title="Serial numbers, warranties"
      emphasis="and AMC, sorted."
      subtitle="Track IMEI/serial numbers, manage manufacturer warranties and AMC renewals, and bill high-value items with confidence."
      stats={[
        ["340+", "Electronics stores"],
        ["1.8 Cr+", "Serials tracked"],
        ["0.02%", "Warranty mismatch rate"],
      ]}
      features={[
        { title: "IMEI & Serial Capture", body: "Scan or enter serial/IMEI at the point of sale, automatically linked to the invoice for warranty claims." },
        { title: "Warranty & AMC Tracking", body: "Track manufacturer warranty windows and AMC renewals per unit, with alerts before coverage lapses." },
        { title: "High-value Approval Flow", body: "Manager approval gates for big-ticket discounts, protecting margin on high-value electronics." },
        { title: "EMI & Card Settlement", body: "Reconcile EMI, card and UPI settlements against PSP reports with automatic UTR matching." },
        { title: "Return & RMA Handling", body: "Log defective-unit returns against the original serial number and route to vendor RMA in one step." },
        { title: "Multi-brand Catalog", body: "Organize SKUs by brand, model and variant with spec-sheet fields built for electronics." },
      ]}
    />
  );
}
