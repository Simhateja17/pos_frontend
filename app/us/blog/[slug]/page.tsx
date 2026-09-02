import { notFound } from 'next/navigation'
import SiteHeader from '@/components/marketing/site-header'
import SiteFooter from '@/components/marketing/site-footer'
import { BlogArticle } from '@/components/marketing/blog-pages'
import { getPublishedPost } from '@/lib/marketing/blogs'
import '@/app/landing.css'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPublishedPost('INTL', params.slug)
  if (!post) return { title: 'Article not found | Ambel POS' }
  const canonical = `https://www.ambelpos.com/us/blog/${post.slug}`
  return { title: post.seoTitle ?? `${post.title} | Ambel POS`, description: post.seoDescription ?? post.excerpt, alternates: { canonical }, openGraph: { type: 'article', title: post.title, description: post.excerpt, url: canonical, publishedTime: post.publishedAt, modifiedTime: post.updatedAt, images: post.coverImageUrl ? [post.coverImageUrl] : [] } }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const post = await getPublishedPost('INTL', params.slug)
  if (!post) notFound()
  const url = `https://www.ambelpos.com/us/blog/${post.slug}`
  const jsonLd = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt, datePublished: post.publishedAt, dateModified: post.updatedAt, author: { '@type': 'Organization', name: post.authorName }, publisher: { '@type': 'Organization', name: 'Ambel POS' }, mainEntityOfPage: url, ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}) }
  return <><SiteHeader region="INTL" /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} /><BlogArticle post={post} region="INTL" /><SiteFooter region="INTL" /></>
}
