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
      subtitle="Stock, staff and reporting across every location you run, with per-location pricing, transfers that track what was sent and what arrived, and reorder advice worked out per location."
      stats={[
        ["3", "Forecasting methods tried per item"],
        ["80%", "Of the time, demand lands in the range"],
        ["60", "Days of sales before we advise you"],
      ]}
      features={[
        { title: "Stock Across Every Location", body: "See what each location holds, and move stock between them with what was sent and what arrived recorded separately." },
        { title: "Per-location Prices and Tax", body: "Override a price for one location while every location shares the same product catalog, and set tax components per store." },
        { title: "Reports Per Location or Combined", body: "Sales, stock value and stock movement for one location or all of them, downloadable as a spreadsheet for your accountant." },
        { title: "Role-based Location Access", body: "Owners see everything; store managers and associates see only their location, enforced at the data layer." },
        { title: "Cross-location Reporting", body: "Compare traffic, margin and sell-through across stores side by side, down to a single register." },
        { title: "Franchise-ready Billing", body: "Support franchise and company-owned stores on the same account with separate settlement rules." },
      ]}
    />
  );
}
