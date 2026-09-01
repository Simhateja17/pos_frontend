import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = { title: "Multi-store Retail POS | Ambel POS" };

export default function Page() {
  return (
    <RetailVerticalPage
      region="INTL"
      tag="Multi-store"
      title="One dashboard for"
      emphasis="every location you own."
      subtitle="Centralized stock, staff and reporting across unlimited locations, with per-location pricing, transfers and consolidated multi-jurisdiction tax reporting."
      stats={[
        ["2,400+", "Locations connected"],
        ["$220M+", "Annual GMV across locations"],
        ["99.98%", "Sync uptime"],
      ]}
      features={[
        { title: "Central Stock Pool", body: "See stock across every location in real time, and raise inter-location transfers with transfer slips in a click." },
        { title: "Per-location Pricing & Tax", body: "Set different price lists, promotions and tax settings per location while keeping one shared product catalog." },
        { title: "Consolidated Tax Reporting", body: "Roll up sales tax liability across all locations into one filing-ready export, or report per jurisdiction when required." },
        { title: "Role-based Location Access", body: "Owners see everything; store managers and associates see only their location, enforced at the data layer." },
        { title: "Cross-location Reporting", body: "Compare traffic, margin and sell-through across stores side by side, down to a single register." },
        { title: "Franchise-ready Billing", body: "Support franchise and company-owned stores on the same account with separate settlement rules." },
      ]}
    />
  );
}
