/**
 * Per-region destinations and copy for the shared marketing chrome
 * (SiteHeader / SiteFooter).
 *
 * Both editions render the SAME components and the same `app/landing.css`
 * design system; only the links and the blurb differ, which is all this table
 * holds. Region detection itself lives in `lib/marketing/region.ts` — the type
 * is imported from there so there is exactly one region vocabulary
 * (`IN | INTL`) in the codebase.
 *
 * Every footer entry points at a real page inside its own edition: the India
 * pages live at `/about`, `/pricing`, `/retail/*` … and the US mirrors live
 * under `/us/*`. A US visitor never crosses into India-specific copy (GST,
 * INR pricing, Bengaluru offices) by clicking a footer link.
 *
 * `import type` keeps this module client-safe: the type is erased at compile
 * time, so `next/headers` never reaches the browser bundle.
 */
import type { MarketingRegion } from '@/lib/marketing/region'

type SiteLinks = {
  /** Where the wordmark points. */
  home: string
  navLinks: [label: string, href: string][]
  loginHref: string
  signupHref: string
  /** Signed-in CTA. */
  appHref: string
  appLabel: string
  /** Footer blurb under the wordmark. */
  tagline: string
  footerColumns: [title: string, links: [label: string, href: string][]][]
  /** Left-hand links in the footer bottom bar. */
  legalLinks: [label: string, href: string][]
  /** Right-hand items in the footer bottom bar. */
  footerMeta: string[]
}

const IN_COMPANY_COLUMN: [string, [string, string][]] = [
  'Company',
  [
    ['About', '/about'],
    ['Blog', '/blog'],
    ['Careers', '/careers'],
    ['Contact', '/contact'],
  ],
]

const IN_RETAIL_COLUMN: [string, [string, string][]] = [
  'Retail',
  [
    ['Fashion & Apparel', '/retail/fashion-apparel'],
    ['Beauty & Wellness', '/retail/beauty-wellness'],
    ['Electronics', '/retail/electronics'],
    ['Multi-store', '/retail/multi-store'],
  ],
]

const US_COMPANY_COLUMN: [string, [string, string][]] = [
  'Company',
  [
    ['About', '/us/about'],
    ['Blog', '/us/blog'],
    ['Careers', '/us/careers'],
    ['Contact', '/us/contact'],
  ],
]

const US_RETAIL_COLUMN: [string, [string, string][]] = [
  'Retail',
  [
    ['Fashion & Apparel', '/us/retail/fashion-apparel'],
    ['Beauty & Wellness', '/us/retail/beauty-wellness'],
    ['Electronics', '/us/retail/electronics'],
    ['Multi-store', '/us/retail/multi-store'],
  ],
]

export const REGION_SITE: Record<MarketingRegion, SiteLinks> = {
  IN: {
    home: '/',
    navLinks: [
      ['Features', '/features'],
      ['How it works', '/#how'],
      ['Screens', '/#screens'],
      ['Pricing', '/pricing'],
    ],
    loginHref: '/login',
    signupHref: '/signup',
    appHref: '/app/dashboard',
    appLabel: 'Back to Billing',
    tagline: "India's most complete retail suite: GST-native, AI-powered, offline-first.",
    footerColumns: [
      [
        'Product',
        [
          ['Features', '/features'],
          ['Pricing', '/pricing'],
          ['Changelog', '/changelog'],
          ['Roadmap', '/roadmap'],
        ],
      ],
      IN_RETAIL_COLUMN,
      IN_COMPANY_COLUMN,
    ],
    legalLinks: [
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
    ],
    footerMeta: ['GST: 37AAMCC4557F1ZF'],
  },
  INTL: {
    home: '/',
    navLinks: [
      ['Features', '/us/features'],
      ['How it works', '/#how'],
      ['Screens', '/#screens'],
      ['Pricing', '/us/pricing'],
    ],
    loginHref: '/us/auth',
    signupHref: '/us/auth',
    appHref: '/us/dashboard',
    appLabel: 'Back to Checkout',
    tagline: 'The complete US retail suite: sales-tax-native, omnichannel, offline-first.',
    footerColumns: [
      [
        'Product',
        [
          ['Features', '/us/features'],
          ['Pricing', '/us/pricing'],
          ['Changelog', '/us/changelog'],
          ['Roadmap', '/us/roadmap'],
        ],
      ],
      US_RETAIL_COLUMN,
      US_COMPANY_COLUMN,
    ],
    legalLinks: [
      ['Privacy', '/us/privacy'],
      ['Terms', '/us/terms'],
    ],
    footerMeta: ['US retail edition'],
  },
}
