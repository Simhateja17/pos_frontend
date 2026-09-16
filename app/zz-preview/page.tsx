// TEMPORARY visual-verification route. Delete before commit.
import '@/app/landing.css'
import SiteHeader from '@/components/marketing/site-header'
import SiteFooter from '@/components/marketing/site-footer'
import { BlogArticle } from '@/components/marketing/blog-pages'
import bodies from './body.json'

export default function Preview({ searchParams }: { searchParams: { r?: string } }) {
  const intl = searchParams.r === 'intl'
  const post = {
    id: '1', slug: 'why-your-shop-needs-a-pos-system',
    title: intl ? 'Why Your Retail Store Needs a POS System (And What Not Having One Costs)' : 'Why Your Shop Needs a POS System: GST Billing, Stock, and the Excel Trap',
    excerpt: intl ? 'A card reader is not a POS and a spreadsheet is not inventory.' : 'More Indian shop owners search for an Excel billing format than for billing software.',
    body: intl ? bodies.intl : bodies.in,
    category: 'Guides', authorName: 'Ambel POS Editorial', coverImageUrl: null,
    seoTitle: null, seoDescription: null,
    publishedAt: '2026-09-16T06:00:00Z', updatedAt: '2026-09-16T06:00:00Z',
  }
  return <><SiteHeader region={intl ? 'INTL' : 'IN'} /><BlogArticle post={post} region={intl ? 'INTL' : 'IN'} /><SiteFooter region={intl ? 'INTL' : 'IN'} /></>
}
