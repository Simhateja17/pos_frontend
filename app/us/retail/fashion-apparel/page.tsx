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
      subtitle="Manage size × color matrices, seasonal collections and fast-moving SKUs without spreadsheets — purpose-built for apparel, footwear and accessories retailers."
      stats={[
        ["1,100+", "Fashion stores"],
        ["6.4M+", "SKUs tracked"],
        ["38%", "Faster checkout"],
      ]}
      features={[
        { title: "Size × Color Matrix", body: "Add a style once and generate every size/color variant instantly, with per-variant stock, price and UPC." },
        { title: "Season & Collection Tags", body: "Group SKUs by season, drop or collection for faster reordering and end-of-season markdown planning." },
        { title: "Barcode Label Printing", body: "One-click label runs for new stock, sized to your printer, with price and SKU encoded." },
        { title: "Exchange & Size Swap", body: "Handle exchanges without refunding: swap size or color on the same ticket with automatic stock adjustment." },
        { title: "Lookbook-ready Catalog", body: "Attach photos per variant and publish straight to your Shopify storefront and social shops." },
        { title: "Fashion-specific Reports", body: "Sell-through by style, size-curve analysis, and slow-mover alerts tuned for apparel cycles." },
      ]}
    />
  );
}
