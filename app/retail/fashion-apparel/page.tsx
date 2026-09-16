import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = {
  title: "Fashion & Apparel POS | Ambel POS",
  description: "Fashion POS with size x colour variant matrices, season and collection tags, barcode labels, exchanges without refunds, and sell-through reporting.",
};

export default function Page() {
  return (
    <RetailVerticalPage
      tag="Fashion & Apparel"
      title="POS built for size,"
      emphasis="colour and season."
      subtitle="Manage size × colour matrices, seasonal collections and fast-moving SKUs without spreadsheets, purpose-built for apparel, footwear and accessories retailers."
      stats={[
        ["₹799", "Starting plan, per month"],
        ["18%", "GST built into every bill"],
        ["No signal", "Billing carries on, syncs after"],
      ]}
      features={[
        { title: "Size × Colour Matrix", body: "Add a style once and generate every size/colour variant instantly, with per-variant stock, MRP and barcode." },
        { title: "Categories for Every Line", body: "Group styles into categories you name and reorder yourself, so the counter finds things the way your shop is actually laid out." },
        { title: "Barcode Label Printing", body: "One-click label runs for new stock, sized to your printer, with GST-compliant MRP and HSN codes." },
        { title: "Exchange & Size Swap", body: "Handle exchanges without refunding: swap size or colour on the same invoice with automatic stock adjustment." },
        { title: "Branches and Transfers", body: "Stock counted per branch, and transfers that record what was sent and what actually arrived separately, so nothing is counted twice." },
        { title: "Reports You Can Open in Excel", body: "Sales by day, style, category and staff member, plus stock value and stock movement. Every one downloads as a spreadsheet." },
      ]}
    />
  );
}
