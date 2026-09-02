import Link from 'next/link'
import type { BlogPost } from '@/lib/marketing/blogs'

function formatDate(value: string, region: 'IN' | 'INTL') {
  return new Intl.DateTimeFormat(region === 'IN' ? 'en-IN' : 'en-US', { dateStyle: 'medium' }).format(new Date(value))
}

export function BlogIndex({ posts, region }: { posts: BlogPost[]; region: 'IN' | 'INTL' }) {
  const base = region === 'IN' ? '/blog' : '/us/blog'
  return <section className="content-section"><div className="blog-grid">
    {posts.map((post) => <Link className="blog-card" href={`${base}/${post.slug}`} key={post.id}>
      <div className="blog-thumb" style={post.coverImageUrl ? { backgroundImage: `url(${post.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        {!post.coverImageUrl && <span className="blog-initial">{post.title.slice(0, 1)}</span>}
      </div>
      <div className="blog-body"><div className="blog-cat">{post.category}</div><h2 className="blog-title">{post.title}</h2><p className="blog-excerpt">{post.excerpt}</p><div className="blog-meta">{formatDate(post.publishedAt, region)} · {post.authorName}</div></div>
    </Link>)}
    {posts.length === 0 && <div className="blog-empty">Fresh practical guides are being prepared. Please check back soon.</div>}
  </div></section>
}

export function BlogArticle({ post, region }: { post: BlogPost; region: 'IN' | 'INTL' }) {
  return <article className="article-shell">
    <Link className="article-back" href={region === 'IN' ? '/blog' : '/us/blog'}>← All articles</Link>
    <header className="article-header"><div className="blog-cat">{post.category}</div><h1>{post.title}</h1><p>{post.excerpt}</p><div className="blog-meta">{formatDate(post.publishedAt, region)} · {post.authorName}</div></header>
    {post.coverImageUrl && <img className="article-cover" src={post.coverImageUrl} alt="" />}
    <div className="article-body">{post.body.split(/\n{2,}/).map((block, index) => {
      if (block.startsWith('## ')) return <h2 key={index}>{block.slice(3)}</h2>
      if (block.startsWith('### ')) return <h3 key={index}>{block.slice(4)}</h3>
      return <p key={index}>{block}</p>
    })}</div>
  </article>
}
