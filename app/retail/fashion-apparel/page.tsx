import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = { title: "Fashion & Apparel POS — Couture POS" };

export default function Page() {
  return (
    <RetailVerticalPage
      tag="Fashion & Apparel"
      title="POS built for size,"
      emphasis="colour and season."
      subtitle="Manage size × colour matrices, seasonal collections and fast-moving SKUs without spreadsheets — purpose-built for apparel, footwear and accessories retailers."
      stats={[
        ["1,100+", "Fashion stores"],
        ["4.2 Cr+", "SKUs tracked"],
        ["38%", "Faster billing"],
      ]}
      features={[
        { title: "Size × Colour Matrix", body: "Add a style once and generate every size/colour variant instantly, with per-variant stock, MRP and barcode." },
        { title: "Season & Collection Tags", body: "Group SKUs by season, drop or collection for faster reordering and end-of-season markdown planning." },
        { title: "Barcode Label Printing", body: "One-click label runs for new stock, sized to your printer, with GST-compliant MRP and HSN codes." },
        { title: "Exchange & Size Swap", body: "Handle exchanges without refunding — swap size or colour on the same invoice with automatic stock adjustment." },
        { title: "Lookbook-ready Catalog", body: "Attach photos per variant and publish straight to your online store and Instagram shop." },
        { title: "Fashion-specific Reports", body: "Sell-through by style, size-curve analysis, and slow-mover alerts tuned for apparel cycles." },
      ]}
    />
  );
}
