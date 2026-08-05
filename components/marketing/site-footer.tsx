const LOGO = (
  <img
    src="/logo.png"
    alt="Couture POS"
    style={{ maxWidth: "68%", maxHeight: "68%", width: "auto", height: "auto", objectFit: "contain", display: "block" }}
  />
);

const COLUMNS: [string, [string, string][]][] = [
  [
    "Product",
    [
      ["Features", "/features"],
      ["Pricing", "/pricing"],
      ["Changelog", "/changelog"],
      ["Roadmap", "/roadmap"],
    ],
  ],
  [
    "Retail",
    [
      ["Fashion & Apparel", "/retail/fashion-apparel"],
      ["Beauty & Wellness", "/retail/beauty-wellness"],
      ["Electronics", "/retail/electronics"],
      ["Multi-store", "/retail/multi-store"],
    ],
  ],
  [
    "Company",
    [
      ["About", "/about"],
      ["Blog", "/blog"],
      ["Careers", "/careers"],
      ["Contact", "/contact"],
    ],
  ],
];

export default function SiteFooter() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="nav-logo">
            <div className="nav-logo-mark">{LOGO}</div>
            <span className="nav-logo-text">Couture POS</span>
          </div>
          <p>India&apos;s most complete retail suite — GST-native, AI-powered, offline-first.</p>
        </div>
        {COLUMNS.map(([title, links]) => (
          <div className="footer-col" key={title}>
            <h4>{title}</h4>
            {links.map(([label, href]) => (
              <a href={href} key={label}>{label}</a>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© 2026 Couture Retail Technologies Pvt. Ltd.</span>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <span>GST: 27ABCDE1234F1Z5</span>
        </div>
      </div>
    </footer>
  );
}
