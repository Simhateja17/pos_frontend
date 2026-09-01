import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  metadataBase: new URL("https://www.ambelpos.com"),
  title: "Ambel POS — Point of Sale & Inventory Software for Retail",
  description:
    "Ambel POS is retail point-of-sale software with inventory management, multi-store support, and AI-powered reorder forecasting. Built for retail chains and independent stores.",
  applicationName: "Ambel POS",
  openGraph: {
    type: "website",
    siteName: "Ambel POS",
    title: "Ambel POS — Point of Sale & Inventory Software for Retail",
    description:
      "Retail point-of-sale software with inventory management, multi-store support, and AI-powered reorder forecasting.",
  },
  twitter: {
    card: "summary",
    title: "Ambel POS — Point of Sale & Inventory Software for Retail",
    description:
      "Retail point-of-sale software with inventory management, multi-store support, and AI-powered reorder forecasting.",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.ambelpos.com/#organization",
      name: "Ambel POS",
      legalName: "Couture Services Private Limited",
      url: "https://www.ambelpos.com",
      logo: "https://www.ambelpos.com/icon.svg",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.ambelpos.com/#software",
      name: "Ambel POS",
      url: "https://www.ambelpos.com",
      applicationCategory: "Point of Sale and Retail Inventory Software",
      applicationSubCategory: "Retail Management Software",
      operatingSystem: "Web",
      publisher: { "@id": "https://www.ambelpos.com/#organization" },
      description:
        "Retail point-of-sale software with inventory management, multi-store support, and AI-powered reorder forecasting for retail chains and independent stores.",
    },
  ],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* US edition (/us/*) design system fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-11LY3VZ1DB"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', 'G-11LY3VZ1DB');
          `}
        </Script>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
