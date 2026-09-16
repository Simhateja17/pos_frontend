import "@/app/landing.css";
import RetailVerticalPage from "@/components/marketing/retail-vertical-page";

export const metadata = {
  title: "Multi-store Retail POS | Ambel POS",
  description: "Run multi-location retail on one account: central stock pool, per-branch pricing, role-based access and consolidated GST filing across up to 8 locations.",
};

export default function Page() {
  return (
    <RetailVerticalPage
      tag="Multi-store"
      title="One dashboard for"
      emphasis="every branch you own."
      subtitle="Centralized stock, staff and reporting across your branches, with per-branch pricing, transfers and consolidated GST filing."
      stats={[
        ["8", "Locations included, largest plan"],
        ["1", "Central stock pool, every branch"],
        ["18%", "GST, consolidated across branches"],
      ]}
      features={[
        { title: "Stock Across Every Branch", body: "See what each branch holds, and move stock between them with what was sent and what arrived recorded separately." },
        { title: "Per-branch Prices and Tax", body: "Override a price for one branch while every branch shares the same product catalogue, and set tax components per store." },
        { title: "Reports Per Branch or Combined", body: "Sales, stock value and stock movement for one branch or all of them, downloadable as a spreadsheet for your accountant." },
        { title: "Role-based Store Access", body: "Owners see everything; store managers and staff see only their branch, enforced at the data layer." },
        { title: "Compare Branches Side by Side", body: "Put sales, margin and stock movement for each branch next to each other, down to a single counter." },
        { title: "Reorder Advice Per Branch", body: "Each branch sells differently. Reorder quantities are worked out from that branch\u2019s own sales, not a company-wide average." },
      ]}
      relatedLink={{ href: "/retail/grocery-supermarket", label: "Running a multi-location supermarket or grocery chain? See the grocery & supermarket page →" }}
    />
  );
}
