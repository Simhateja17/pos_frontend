import type { MarketingRegion } from './region'

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  category: string
  authorName: string
  coverImageUrl: string | null
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string
  updatedAt: string
}

function backendUrlFor(region: MarketingRegion) {
  const fallback = region === 'IN' ? 'https://api-in.ambelpos.com/api' : 'https://api-us.ambelpos.com/api'
  return (region === 'IN' ? process.env.BACKEND_API_URL_IN ?? fallback : process.env.BACKEND_API_URL_INTL ?? fallback).replace(/\/$/, '')
}

function normalize(post: Record<string, unknown>): BlogPost {
  return {
    id: String(post.id), slug: String(post.slug), title: String(post.title), excerpt: String(post.excerpt), body: String(post.body),
    category: String(post.category), authorName: String(post.author_name), coverImageUrl: post.cover_image_url ? String(post.cover_image_url) : null,
    seoTitle: post.seo_title ? String(post.seo_title) : null, seoDescription: post.seo_description ? String(post.seo_description) : null,
    publishedAt: String(post.published_at), updatedAt: String(post.updated_at),
  }
}

export async function getPublishedPosts(region: MarketingRegion): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${backendUrlFor(region)}/public/blogs`, { next: { revalidate: 300 } })
    if (!response.ok) return []
    const body = await response.json() as { posts?: Record<string, unknown>[] }
    return (body.posts ?? []).map(normalize)
  } catch { return [] }
}

export async function getPublishedPost(region: MarketingRegion, slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${backendUrlFor(region)}/public/blogs/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } })
    if (!response.ok) return null
    const body = await response.json() as { post: Record<string, unknown> }
    return normalize(body.post)
  } catch { return null }
}
