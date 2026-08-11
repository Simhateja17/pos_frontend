'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Plus } from 'lucide-react'

export type CategoryOption = { id: string; name: string }

/**
 * Category picker with create-on-the-fly.
 *
 * Categories are real rows the store owns, so this picks one rather than
 * accepting free text — that is what stops "Dairy", "dairy" and "Diary"
 * becoming three categories that split every report. A genuinely new name is
 * still one keystroke away, and the server matches it case-insensitively
 * against existing categories before creating anything.
 */
export function CategorySelect({
  categories,
  value,
  onChange,
  id = 'category-select',
}: {
  categories: CategoryOption[]
  /** Either an existing category id, or a new name the owner typed. */
  value: { categoryId?: string; categoryName?: string }
  onChange: (next: { categoryId?: string; categoryName?: string }) => void
  id?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = value.categoryId ? categories.find((c) => c.id === value.categoryId) : undefined

  // Show the committed choice when closed; show what is being typed when open.
  const display = open ? query : (selected?.name ?? value.categoryName ?? '')

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(term))
  }, [categories, query])

  const exactExists = categories.some((c) => c.name.toLowerCase() === query.trim().toLowerCase())
  const canCreate = query.trim().length > 0 && !exactExists

  function choose(option: CategoryOption) {
    onChange({ categoryId: option.id })
    setQuery('')
    setOpen(false)
  }

  function createTyped() {
    const name = query.trim()
    if (!name) return
    onChange({ categoryName: name })
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        value={display}
        placeholder="Search or create a category"
        onFocus={() => {
          setQuery('')
          setOpen(true)
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (matches.length === 1) choose(matches[0])
            else if (canCreate) createTyped()
          }
          if (e.key === 'Escape') setOpen(false)
        }}
      />

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 30,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: 240,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(16,24,40,.10)',
            padding: 4,
          }}
        >
          {matches.length === 0 && !canCreate && (
            <div className="t-sub" style={{ padding: '10px 12px' }}>
              No categories yet. Type a name to create one.
            </div>
          )}

          {matches.map((option) => {
            const isSelected = option.id === value.categoryId
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(option)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  border: 0,
                  borderRadius: 8,
                  background: isSelected ? 'var(--brand-soft)' : 'transparent',
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                {option.name}
                {isSelected && <Check size={15} />}
              </button>
            )
          })}

          {canCreate && (
            <button
              type="button"
              onClick={createTyped}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                width: '100%',
                textAlign: 'left',
                padding: '9px 12px',
                border: 0,
                borderTop: matches.length > 0 ? '1px solid var(--line)' : 0,
                borderRadius: 8,
                background: 'transparent',
                cursor: 'pointer',
                font: 'inherit',
                color: 'var(--brand-1)',
                fontWeight: 600,
              }}
            >
              <Plus size={14} /> Create “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  )
}
