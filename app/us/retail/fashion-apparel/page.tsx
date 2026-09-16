import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";
export const metadata = { title: "Fashion & Apparel POS | Ambel POS" };
export default function Page() {
  return (
    <RetailVerticalPage
      region="INTL"
      tag="Fashion & Apparel"
      title="POS built for size,"
      emphasis="color and season."
      subtitle="Manage size × color matrices, seasonal collections and fast-moving SKUs without spreadsheets. Purpose-built for apparel, footwear and accessories retailers."
      stats={[
        ["3", "Forecasting methods tried per item"],
        ["80%", "Of the time, demand lands in the range"],
        ["60", "Days of sales before we advise you"],
      ]}
      features={[
        { title: "Size × Color Matrix", body: "Add a style once and generate every size/color variant instantly, with per-variant stock, price and UPC." },
        { title: "Season & Collection Tags", body: "Group SKUs by season, drop or collection for faster reordering and end-of-season markdown planning." },
        { title: "Barcode Label Printing", body: "One-click label runs for new stock, sized to your printer, with price and SKU encoded." },
        { title: "Exchange & Size Swap", body: "Handle exchanges without refunding: swap size or color on the same ticket with automatic stock adjustment." },
        { title: "Locations and Transfers", body: "Stock counted per location, and transfers that record what was sent and what actually arrived separately, so nothing is counted twice." },
        { title: "Fashion-specific Reports", body: "Sell-through by style, size-curve analysis, and slow-mover alerts tuned for apparel cycles." },
      ]}
    />
  );
}
