const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')

const read = (path) => fs.readFileSync(path, 'utf8')

test('admin blog workflow supports drafts and publishing for platform owners', () => {
  const view = read('components/admin/admin-blog-view.tsx')
  assert.match(view, /context\.admin\.role === 'platform_owner'/)
  assert.match(view, /Save draft/)
  assert.match(view, /Publish now/)
})

test('regional article pages emit canonical metadata and BlogPosting schema', () => {
  for (const path of ['app/blog/[slug]/page.tsx', 'app/us/blog/[slug]/page.tsx']) {
    const page = read(path)
    assert.match(page, /alternates: \{ canonical \}/)
    assert.match(page, /'@type': 'BlogPosting'/)
  }
})

test('regional sitemaps include published article paths', () => {
  assert.match(read('app/sitemap-india.xml/route.js'), /posts, '\/blog'/)
  assert.match(read('app/sitemap-international.xml/route.js'), /posts, '\/us\/blog'/)
})
