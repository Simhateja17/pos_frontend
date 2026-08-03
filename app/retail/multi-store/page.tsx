import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = { title: "Multi-store Retail POS — Couture POS" };

export default function Page() {
  return (
    <RetailVerticalPage
      tag="Multi-store"
      title="One dashboard for"
      emphasis="every branch you own."
      subtitle="Centralized stock, staff and reporting across unlimited stores — with per-branch pricing, transfers and consolidated GST filing."
      stats={[
        ["2,400+", "Stores connected"],
        ["18 Cr+", "Monthly GMV across branches"],
        ["99.98%", "Sync uptime"],
      ]}
      features={[
        { title: "Central Stock Pool", body: "See stock across every branch in real time, and raise inter-branch transfers with delivery challans in a click." },
        { title: "Per-branch Pricing & Tax", body: "Set different price lists, tax rates or offers per store while keeping one shared product catalog." },
        { title: "Consolidated GST Filing", body: "Roll up GSTR-1 across all branches into one filing-ready export, or file per-branch when required." },
        { title: "Role-based Store Access", body: "Owners see everything; store managers and staff see only their branch — enforced at the data layer." },
        { title: "Cross-branch Reporting", body: "Compare footfall, margin and sell-through across stores side by side, down to a single counter." },
        { title: "Franchise-ready Billing", body: "Support franchise and company-owned stores on the same account with separate settlement rules." },
      ]}
    />
  );
}
