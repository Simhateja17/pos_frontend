/**
 * Rich block renderer for editorial article bodies.
 *
 * `blog_posts.body` is a single Postgres text column (see migration 0076), so
 * every visual element an article needs has to survive a round-trip through
 * plain text. This module defines that wire format and parses it back into
 * components.
 *
 * The syntax is a small superset of Markdown, chosen so that a post stays
 * readable in the admin textarea and degrades to prose if a block is malformed:
 *
 *   ## / ###        headings
 *   - item          bullet list
 *   1. item         numbered list
 *   > text          pull quote
 *   | a | b |       table (first row is the header)
 *   :::stat         KPI cards      — `value | label | note`
 *   :::bars Title   bar chart      — `label | number | note`
 *   :::callout T    highlighted aside
 *   :::steps        numbered timeline — `title :: body`
 *   :::compare      two-column before/after — `left :: right`
 *   :::            closes any fenced block
 *
 * Inline: **bold**, *italic*, `code`, [text](href).
 *
 * Parsing is deliberately total — an unrecognised line becomes a paragraph
 * rather than throwing, because a malformed post must never 500 the page.
 */
import { Fragment, type ReactNode } from 'react'

type Row = string[]

type Block =
  | { kind: 'h2' | 'h3' | 'p' | 'quote'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'table'; head: Row; rows: Row[] }
  | { kind: 'stat' | 'bars' | 'steps' | 'compare'; title: string; rows: Row[] }
  | { kind: 'callout'; title: string; text: string }

const FENCE = /^:::\s*(stat|bars|callout|steps|compare)\s*(.*)$/

/** Splits `a | b | c`, tolerating the leading/trailing pipes of table rows. */
function cells(line: string, separator = '|'): Row {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split(separator)
    .map((cell) => cell.trim())
}

export function parseArticle(body: string): Block[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let paragraph: string[] = []

  const flush = () => {
    const text = paragraph.join('\n').trim()
    if (text) blocks.push({ kind: 'p', text })
    paragraph = []
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      flush()
      continue
    }

    const fence = FENCE.exec(trimmed)
    if (fence) {
      flush()
      const kind = fence[1] as 'stat' | 'bars' | 'callout' | 'steps' | 'compare'
      const title = fence[2]
      const rows: Row[] = []
      index += 1
      // Consume until the closing `:::`, or to EOF if the author forgot it.
      while (index < lines.length && lines[index].trim() !== ':::') {
        const inner = lines[index].trim()
        if (inner) rows.push(kind === 'steps' || kind === 'compare' ? cells(inner, '::') : cells(inner))
        index += 1
      }
      if (kind === 'callout') {
        blocks.push({ kind: 'callout', title: title.trim(), text: rows.map((row) => row.join(' | ')).join('\n') })
      } else {
        blocks.push({ kind, title: title.trim(), rows })
      }
      continue
    }

    if (trimmed.startsWith('## ')) { flush(); blocks.push({ kind: 'h2', text: trimmed.slice(3) }); continue }
    if (trimmed.startsWith('### ')) { flush(); blocks.push({ kind: 'h3', text: trimmed.slice(4) }); continue }
    if (trimmed.startsWith('> ')) { flush(); blocks.push({ kind: 'quote', text: trimmed.slice(2) }); continue }

    // Tables: a run of pipe-delimited lines. A `---` separator row is optional
    // and discarded, so both GitHub-style and bare tables parse the same way.
    if (trimmed.startsWith('|')) {
      flush()
      const raw: Row[] = []
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        raw.push(cells(lines[index].trim()))
        index += 1
      }
      index -= 1
      const rows = raw.filter((row) => !row.every((cell) => /^:?-{2,}:?$/.test(cell)))
      if (rows.length) blocks.push({ kind: 'table', head: rows[0], rows: rows.slice(1) })
      continue
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      const ordered = /^\d+[.)]\s+/.test(trimmed)
      flush()
      const items: string[] = []
      while (index < lines.length) {
        const item = lines[index].trim()
        const isOrdered = /^\d+[.)]\s+/.test(item)
        const isBullet = /^[-*]\s+/.test(item)
        if ((ordered && !isOrdered) || (!ordered && !isBullet)) break
        items.push(item.replace(/^([-*]|\d+[.)])\s+/, ''))
        index += 1
      }
      index -= 1
      blocks.push({ kind: ordered ? 'ol' : 'ul', items })
      continue
    }

    paragraph.push(line)
  }

  flush()
  return blocks
}

/**
 * Inline formatting. Returns React nodes rather than HTML so nothing an editor
 * types can inject markup — this content is admin-authored, but it still must
 * not reach `dangerouslySetInnerHTML` (see CLAUDE.md conventions).
 */
export function inline(text: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  return text.split(pattern).filter(Boolean).map((part, key) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={key}>{part.slice(1, -1)}</em>
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (link) {
      const external = /^https?:/.test(link[2])
      return <a key={key} href={link[2]} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{link[1]}</a>
    }
    return <span key={key}>{part}</span>
  })
}

/** Bars are drawn relative to the largest value so a chart always fills its width. */
function Bars({ title, rows }: { title: string; rows: Row[] }) {
  const parsed = rows.map(([label, value, note]) => ({
    label, note, value: Number(String(value ?? '').replace(/[^\d.-]/g, '')) || 0, display: value ?? '',
  }))
  const peak = Math.max(...parsed.map((row) => Math.abs(row.value)), 1)
  return (
    <figure className="art-bars">
      {title && <figcaption className="art-block-title">{title}</figcaption>}
      {parsed.map((row, key) => (
        <div className="art-bar-row" key={key}>
          <div className="art-bar-label">{row.label}</div>
          <div className="art-bar-track">
            <div className="art-bar-fill" style={{ width: `${Math.max((Math.abs(row.value) / peak) * 100, 2)}%` }} />
          </div>
          <div className="art-bar-value">{row.display}{row.note && <span>{row.note}</span>}</div>
        </div>
      ))}
    </figure>
  )
}

export function ArticleBody({ body }: { body: string }) {
  return (
    <div className="article-body">
      {parseArticle(body).map((block, key) => {
        switch (block.kind) {
          case 'h2': return <h2 key={key}>{inline(block.text)}</h2>
          case 'h3': return <h3 key={key}>{inline(block.text)}</h3>
          case 'quote': return <blockquote className="art-quote" key={key}>{inline(block.text)}</blockquote>
          case 'ul': return <ul className="art-list" key={key}>{block.items.map((item, i) => <li key={i}>{inline(item)}</li>)}</ul>
          case 'ol': return <ol className="art-list" key={key}>{block.items.map((item, i) => <li key={i}>{inline(item)}</li>)}</ol>

          case 'table': return (
            <div className="art-table-wrap" key={key}>
              <table className="art-table">
                <thead><tr>{block.head.map((cell, i) => <th key={i}>{inline(cell)}</th>)}</tr></thead>
                <tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{inline(cell)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )

          case 'stat': return (
            <div className="art-stats" key={key}>
              {block.rows.map(([value, label, note], i) => (
                <div className="art-stat" key={i}>
                  <div className="art-stat-value">{value}</div>
                  {label && <div className="art-stat-label">{label}</div>}
                  {note && <div className="art-stat-note">{note}</div>}
                </div>
              ))}
            </div>
          )

          case 'bars': return <Bars key={key} title={block.title} rows={block.rows} />

          case 'callout': return (
            <aside className="art-callout" key={key}>
              {block.title && <div className="art-callout-title">{block.title}</div>}
              {block.text.split('\n').map((line, i) => <p key={i}>{inline(line)}</p>)}
            </aside>
          )

          case 'steps': return (
            <ol className="art-steps" key={key}>
              {block.rows.map(([title, text], i) => (
                <li key={i}><div className="art-step-title">{inline(title)}</div>{text && <p>{inline(text)}</p>}</li>
              ))}
            </ol>
          )

          case 'compare': {
            const [head, ...rows] = block.rows
            // One flat grid rather than two independent columns: paired cells
            // must share a row height, or a wrapping line on one side silently
            // knocks the whole comparison out of alignment.
            return (
              <div className="art-compare" key={key}>
                {block.title && <div className="art-block-title">{block.title}</div>}
                <div className="art-compare-grid">
                  <div className="art-compare-head art-compare-before">{head?.[0]}</div>
                  <div className="art-compare-head art-compare-after">{head?.[1]}</div>
                  {rows.map((row, i) => (
                    <Fragment key={i}>
                      <div className="art-compare-cell art-compare-before">{inline(row[0] ?? '')}</div>
                      <div className="art-compare-cell art-compare-after">{inline(row[1] ?? '')}</div>
                    </Fragment>
                  ))}
                </div>
              </div>
            )
          }

          default: return <p key={key}>{inline(block.text)}</p>
        }
      })}
    </div>
  )
}
