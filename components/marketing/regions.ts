/**
 * Region wiring for the shared marketing chrome.
 *
 * The India and US editions render the SAME components and the same
 * `app/landing.css` design system. Only the destinations and the copy differ,
 * so those live here rather than being forked into a parallel set of US-only
 * components with their own stylesheet (which is what caused the two editions
 * to drift apart visually in the first place).
 */

export type Region = 'IN' | 'US'

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
  /** Right-hand items in the footer bottom bar. */
  footerMeta: string[]
}

const COMPANY_COLUMN: [string, [string, string][]] = [
  'Company',
  [
    ['About', '/about'],
    ['Blog', '/blog'],
    ['Careers', '/careers'],
    ['Contact', '/contact'],
  ],
]

export const REGION_SITE: Record<Region, SiteLinks> = {
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
      [
        'Retail',
        [
          ['Fashion & Apparel', '/retail/fashion-apparel'],
          ['Beauty & Wellness', '/retail/beauty-wellness'],
          ['Electronics', '/retail/electronics'],
          ['Multi-store', '/retail/multi-store'],
        ],
      ],
      COMPANY_COLUMN,
    ],
    footerMeta: ['GST: 37AAMCC4557F1ZF'],
  },
  US: {
    home: '/us',
    navLinks: [
      ['Features', '/us#features'],
      ['How it works', '/us#how'],
      ['Screens', '/us#screens'],
      ['Pricing', '/us#pricing'],
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
          ['Features', '/us#features'],
          ['Pricing', '/us#pricing'],
          ['Screens', '/us#screens'],
          ['Changelog', '/changelog'],
        ],
      ],
      [
        'Retail',
        [
          ['Fashion & Apparel', '/retail/fashion-apparel'],
          ['Beauty & Wellness', '/retail/beauty-wellness'],
          ['Electronics', '/retail/electronics'],
          ['Multi-store', '/retail/multi-store'],
        ],
      ],
      COMPANY_COLUMN,
    ],
    footerMeta: ['US retail edition'],
  },
}
